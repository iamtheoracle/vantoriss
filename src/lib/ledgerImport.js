import { base44 } from '@/api/base44Client';

const BATCH_SIZE = 500;

/**
 * Writes a parsed account history to the database:
 * statement record → transactions in batches → account balance → audit entry.
 * Runs as the signed-in operator; no backend function required.
 */
export async function importLedger({ account, records, summary, file, institution, notes, importedByName }) {
  if (!account) throw new Error('Select an account first.');
  if (!records || !records.length) throw new Error('There is nothing to import.');

  let fileUri = '';
  if (file) {
    const upload = await base44.integrations.Core.UploadPrivateFile({ file });
    fileUri = upload?.file_uri || '';
  }

  const statement = await base44.entities.HistoricalStatement.create({
    user_id: account.user_id,
    account_id: account.id,
    account_name: account.account_name || '',
    account_identifier: account.account_number || '',
    statement_date: summary.lastDate,
    period_start: summary.firstDate,
    period_end: summary.lastDate,
    opening_balance: summary.opening,
    closing_balance: summary.closing,
    total_credits: summary.credits,
    total_debits: summary.debits,
    transaction_count: records.length,
    source_document_url: fileUri,
    source_institution: institution || '',
    imported_by_name: importedByName || 'Operator',
    import_notes: notes || '',
    verification_status: 'operator_verified',
  });

  const payload = records.map((record) => ({
    account_id: account.id,
    type: record.type,
    amount: record.amount,
    description: record.description,
    reference: record.reference || '',
    balance_after: record.balanceAfter === null ? summary.closing : record.balanceAfter,
    created_by_admin: true,
    transaction_date: record.date,
    posting_date: record.date,
    source: 'historical_import',
    imported_statement_id: statement.id,
    status: 'completed',
  }));

  let created = 0;
  for (let i = 0; i < payload.length; i += BATCH_SIZE) {
    const batch = payload.slice(i, i + BATCH_SIZE);
    await base44.entities.Transaction.bulkCreate(batch);
    created += batch.length;
  }

  await base44.entities.Account.update(account.id, { balance: summary.closing });

  await base44.entities.AuditLog.create({
    action_type: 'balance_adjusted',
    account_id: account.id,
    target_user_id: account.user_id,
    admin_name: importedByName || 'Operator',
    description: `Account history imported for ${account.account_name || account.account_number}`,
    details: `${records.length} entries, ${summary.firstDate} to ${summary.lastDate}. Opening ${summary.opening}, closing ${summary.closing}. Statement ${statement.id}. Source: ${institution || 'uploaded workbook'}.`,
    amount: Math.round((summary.closing - summary.opening) * 100) / 100,
    balance_before: summary.opening,
    balance_after: summary.closing,
  });

  return { statementId: statement.id, created };
}