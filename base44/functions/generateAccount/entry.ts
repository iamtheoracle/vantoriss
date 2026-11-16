import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accountOpeningRoles = new Set([
      'admin', 'administrator', 'super_administrator',
      'operations_officer', 'operations_manager', 'finance_officer', 'treasury_officer'
    ]);
    if (!accountOpeningRoles.has(user.role)) {
      return Response.json({ error: 'Only authorized account-opening staff can create an account.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { user_id, account_type, account_name, application_id, opening_balance = 0 } = body;

    if (!user_id || !account_type || !account_name) {
      return Response.json({ error: 'user_id, account_type, and account_name are required' }, { status: 400 });
    }

    const allowedAccountTypes = ['Checking', 'Savings', 'Money Market', 'CD', 'Joint', 'Business'];
    if (!allowedAccountTypes.includes(account_type)) {
      return Response.json({ error: 'Unsupported account type.' }, { status: 400 });
    }
    if (Number(opening_balance) !== 0) {
      return Response.json({ error: 'Opening balances must be recorded through the approved, audited ledger-opening workflow.' }, { status: 400 });
    }
    const targetMember = await base44.asServiceRole.entities.User.get(user_id).catch(() => null);
    if (!targetMember || targetMember.role !== 'user') {
      return Response.json({ error: 'The selected member account could not be verified.' }, { status: 404 });
    }
    if (application_id) {
      const application = await base44.asServiceRole.entities.Application.get(application_id).catch(() => null);
      if (!application || application.user_id !== user_id || application.application_status !== 'approved') {
        return Response.json({ error: 'The supplied application is not approved for this member.' }, { status: 409 });
      }
    }

    // Generate a cryptographically random 10-digit account number.
    const existingAccounts = await base44.asServiceRole.entities.Account.list('-created_date', 500);
    const existingNumbers = new Set((existingAccounts || []).map(a => a.account_number).filter(Boolean));

    let accountNumber;
    let attempts = 0;
    do {
      const randomWords = crypto.getRandomValues(new Uint32Array(2));
      const randomValue = (BigInt(randomWords[0]) << 32n) | BigInt(randomWords[1]);
      accountNumber = String(1000000000n + (randomValue % 9000000000n));
      attempts++;
    } while (existingNumbers.has(accountNumber) && attempts < 100);

    // Vantoris institutional routing number (fixed, as it's a single institution)
    const routingNumber = '021000021';

    const account = await base44.asServiceRole.entities.Account.create({
      user_id,
      account_type,
      account_name,
      account_number: accountNumber,
      routing_number: routingNumber,
      balance: 0,
      status: 'active',
      application_id: application_id || null,
    });

    await base44.asServiceRole.entities.Notification.create({
      user_id,
      title: 'Account Opened',
      message: `Your ${account_type} account has been opened. Account Number: ${accountNumber}, Routing Number: ${routingNumber}.`,
      type: 'success',
    });

    await base44.asServiceRole.entities.AuditLog.create({
      action_type: 'account_created',
      description: `Account created via AI Assistant: ${account_type} for user ${user_id}`,
      details: `Account #: ${accountNumber}, Routing #: ${routingNumber}`,
      target_user_id: user_id,
      user_id: user.id,
      admin_name: user.full_name || user.email || 'Admin',
    });

    return Response.json({
      success: true,
      account_id: account.id,
      account_number: accountNumber,
      routing_number: routingNumber,
      account_type,
      account_name,
      balance: 0,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});