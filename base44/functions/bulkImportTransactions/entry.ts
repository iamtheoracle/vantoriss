import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { transactions } = body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return Response.json({ error: 'A non-empty transactions array is required' }, { status: 400 });
    }

    if (transactions.length > 500) {
      return Response.json({ error: 'Maximum 500 transactions per import' }, { status: 400 });
    }

    // Fetch all accounts to build account_number → account lookup
    const accounts = await base44.asServiceRole.entities.Account.list('-created_date', 500);
    const accountMap = new Map();
    for (const a of accounts) {
      if (a.account_number) accountMap.set(String(a.account_number).trim(), a);
    }

    const VALID_TYPES = ['deposit', 'withdrawal', 'adjustment', 'opening_balance'];

    const created = [];
    const skipped = [];
    const errors = [];

    for (let i = 0; i < transactions.length; i++) {
      const txn = transactions[i];
      try {
        const account_number = txn.account_number ? String(txn.account_number).trim() : '';
        const type = (txn.type || '').toString().toLowerCase().trim();
        const amount = Number(txn.amount);

        if (!account_number || !type || isNaN(amount)) {
          skipped.push({ row: i + 2, ...txn, reason: 'Missing required field (account_number, type, or amount)' });
          continue;
        }

        if (!VALID_TYPES.includes(type)) {
          skipped.push({ row: i + 2, ...txn, reason: `Invalid type "${type}". Must be one of: ${VALID_TYPES.join(', ')}` });
          continue;
        }

        const account = accountMap.get(account_number);
        if (!account) {
          skipped.push({ row: i + 2, ...txn, reason: `Account not found: ${account_number}` });
          continue;
        }

        const absAmount = Math.abs(amount);

        // Calculate balance change
        let balanceChange;
        if (type === 'withdrawal') balanceChange = -absAmount;
        else if (type === 'adjustment') balanceChange = amount; // signed: can be negative
        else balanceChange = absAmount; // deposit, opening_balance

        const newBalance = (account.balance || 0) + balanceChange;

        // Create transaction record
        const record = await base44.asServiceRole.entities.Transaction.create({
          account_id: account.id,
          type,
          amount: absAmount,
          description: txn.description || '',
          reference: txn.reference || '',
          balance_after: newBalance,
          created_by_admin: true,
          transaction_date: txn.transaction_date || undefined,
        });

        // Update account balance
        await base44.asServiceRole.entities.Account.update(account.id, { balance: newBalance });

        // Update map so subsequent transactions for same account use updated balance
        account.balance = newBalance;

        created.push({
          row: i + 2,
          id: record.id,
          account_number,
          account_id: account.id,
          type,
          amount: absAmount,
          balance_after: newBalance,
        });
      } catch (e) {
        errors.push({ row: i + 2, ...txn, error: e.message });
      }
    }

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      action_type: 'transaction_created',
      description: `Bulk import by ${user.full_name || user.email}: ${created.length} created, ${skipped.length} skipped, ${errors.length} errors`,
      details: JSON.stringify({ total: transactions.length, created: created.length, skipped: skipped.length, errors: errors.length }),
      user_id: user.id,
      admin_name: user.full_name || user.email,
    });

    return Response.json({
      success: true,
      summary: {
        total: transactions.length,
        created: created.length,
        skipped: skipped.length,
        errors: errors.length,
      },
      created,
      skipped,
      errors,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}