// Base44 server functions require pinned npm: imports.
// deno-lint-ignore no-import-prefix
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isRecord,
  jsonResponse,
  writeBlockedMutationAudit,
  writeUncertainMutationAudit,
  type AuthenticatedActor,
  type Base44AuditClient,
} from '../../shared/financialMutationGateway.ts';
import { isDateOnly, isUuid, isValidRevision } from '../../shared/financialMutationRules.mjs';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;
const MAX_IMPORT_ROWS = 500;
const HISTORICAL_TYPES = new Set(['deposit', 'withdrawal', 'transfer', 'interest', 'fee', 'adjustment']);

function validOptionalDate(value: unknown): value is string | undefined {
  return value === undefined || value === null || value === '' || (typeof value === 'string' && isDateOnly(value));
}

function boundedText(value: unknown, max: number): string | null {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length <= max ? normalized : null;
}

export default async function importHistoricalStatement(req: Request): Promise<Response> {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  let base44: Base44Client;
  let actor: AuthenticatedActor | null;
  try {
    base44 = createClientFromRequest(req) as Base44Client;
    const user = await base44.auth.me();
    actor = user ? { id: user.id, role: user.role, full_name: user.full_name, email: user.email } : null;
  } catch {
    return jsonResponse({ error: 'Authentication could not be verified.' }, 401);
  }
  if (!actor?.id) return jsonResponse({ error: 'Authentication required.' }, 401);

  const parsed: unknown = await req.json().catch(() => null);
  if (!isRecord(parsed)) return jsonResponse({ error: 'A valid JSON object is required.' }, 400);
  const body = parsed;
  if (!isUuid(body.idempotency_key)) return jsonResponse({ error: 'A valid UUID idempotency_key is required.' }, 400);
  if (!isValidRevision(body.expected_updated_date)) return jsonResponse({ error: 'expected_updated_date is required.' }, 400);

  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';
  const accountId = typeof body.account_id === 'string' ? body.account_id.trim() : '';
  if (!accountId || accountId.length > 128) return jsonResponse({ error: 'A valid account_id is required.' }, 400);
  if (actor.role !== 'user') {
    await writeBlockedMutationAudit(base44, actor, 'historical_statement.import', accountId, 'member_role_required', idempotencyKey);
    return jsonResponse({ error: 'Only the authenticated account holder can import a historical statement.' }, 403);
  }

  const metadataInput = isRecord(body.metadata) ? body.metadata : null;
  if (!metadataInput) return jsonResponse({ error: 'Statement metadata is required.' }, 400);
  const statementDate = metadataInput.statement_date;
  const periodStart = metadataInput.period_start;
  const periodEnd = metadataInput.period_end;
  const issueDate = metadataInput.issue_date;
  if (typeof statementDate !== 'string' || !isDateOnly(statementDate) ||
      !validOptionalDate(periodStart) || !validOptionalDate(periodEnd) || !validOptionalDate(issueDate)) {
    return jsonResponse({ error: 'Statement and period dates must be valid YYYY-MM-DD calendar dates.' }, 400);
  }
  if (periodStart && periodEnd && periodStart > periodEnd) {
    return jsonResponse({ error: 'period_start must not be after period_end.' }, 400);
  }

  const textFields: Record<string, number> = {
    source_institution: 200, account_name: 200, account_identifier: 128, import_notes: 2000,
    overlap_details: 1000,
  };
  const metadata: Record<string, unknown> = {};
  for (const [field, max] of Object.entries(textFields)) {
    const normalized = boundedText(metadataInput[field], max);
    if (normalized === null) return jsonResponse({ error: `${field} must be text of at most ${max} characters.` }, 400);
    metadata[field] = normalized;
  }
  for (const field of ['opening_balance', 'closing_balance'] as const) {
    const value = metadataInput[field] === '' || metadataInput[field] === undefined || metadataInput[field] === null
      ? 0 : metadataInput[field];
    if (typeof value !== 'number' || !Number.isFinite(value) ||
        Math.abs(value * 100 - Math.round(value * 100)) > 1e-7 ||
        !Number.isSafeInteger(Math.round(value * 100))) {
      return jsonResponse({ error: `${field} must be a non-negative amount with at most two decimal places.` }, 400);
    }
    metadata[field] = value;
  }

  const sourceDocumentUrl = body.source_document_url;
  if (sourceDocumentUrl !== undefined && sourceDocumentUrl !== null && sourceDocumentUrl !== '') {
    if (typeof sourceDocumentUrl !== 'string' || sourceDocumentUrl.length > 2048) {
      return jsonResponse({ error: 'source_document_url is invalid.' }, 400);
    }
    try {
      const url = new URL(sourceDocumentUrl);
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('invalid URL');
    } catch {
      return jsonResponse({ error: 'source_document_url must be a valid HTTPS URL.' }, 400);
    }
  }

  if (!Array.isArray(body.transactions) || body.transactions.length > MAX_IMPORT_ROWS) {
    return jsonResponse({ error: `transactions must be an array with no more than ${MAX_IMPORT_ROWS} rows.` }, 400);
  }
  const rows: Record<string, unknown>[] = [];
  for (let index = 0; index < body.transactions.length; index += 1) {
    const row = body.transactions[index];
    if (!isRecord(row)) return jsonResponse({ error: `Transaction row ${index + 1} must be an object.` }, 400);
    const type = typeof row.type === 'string' ? row.type.trim().toLowerCase() : '';
    const amount = row.amount;
    const date = row.transaction_date;
    const description = boundedText(row.description, 1000);
    const reference = boundedText(row.reference, 256);
    if (!HISTORICAL_TYPES.has(type)) return jsonResponse({ error: `Transaction row ${index + 1} has an unsupported type.` }, 400);
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount === 0 ||
        !Number.isSafeInteger(Math.round(amount * 100)) ||
        Math.abs(amount * 100 - Math.round(amount * 100)) > 1e-7) {
      return jsonResponse({ error: `Transaction row ${index + 1} must have a non-zero amount with at most two decimal places.` }, 400);
    }
    if (typeof date !== 'string' || !isDateOnly(date)) return jsonResponse({ error: `Transaction row ${index + 1} has an invalid transaction_date.` }, 400);
    if (description === null || reference === null) return jsonResponse({ error: `Transaction row ${index + 1} has invalid text fields.` }, 400);
    rows.push({
      transaction_date: date,
      posting_date: validOptionalDate(row.posting_date) && row.posting_date ? row.posting_date : date,
      description,
      type,
      amount,
      reference,
      source: 'historical_import',
      status: 'completed',
    });
  }

  const command: Record<string, unknown> = {
    account_id: accountId,
    expected_updated_date: body.expected_updated_date,
    statement: {
      ...metadata,
      statement_date: statementDate,
      period_start: periodStart || '',
      period_end: periodEnd || '',
      issue_date: issueDate || statementDate,
      source_document_url: typeof sourceDocumentUrl === 'string' ? sourceDocumentUrl : '',
      verification_status: 'user_reviewed',
      overlap_detected: metadata.overlap_details !== '',
    },
    transactions: rows,
    require_authoritative_account_lookup: true,
    require_actor_owns_account: true,
    resolve_idempotency_before_revision_check: true,
    require_account_revision_match: true,
    deduplicate_against_authoritative_history: true,
    deduplicate_within_import: true,
    calculate_statement_totals_server_side: true,
    transaction_count_from_committed_rows: true,
    never_trust_client_totals: true,
    max_transactions: MAX_IMPORT_ROWS,
    historical_only: true,
    never_modify_current_account_balance: true,
    create_statement_transactions_document_atomically: true,
    audit_action: 'historical_statement_imported',
    notification_outbox_required: false,
  };

  const outcome = await invokeAtomicMutationService('historical_statement.import', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'historical_statement.import', accountId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'historical_statement.import', accountId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const saved = outcome.result.statement as Record<string, unknown> | undefined;
  const summary = outcome.result.summary;
  if (!saved || typeof saved.id !== 'string' || saved.account_id !== accountId ||
      !isRecord(summary) || typeof summary.imported !== 'number' || !Number.isSafeInteger(summary.imported) ||
      typeof summary.skipped !== 'number' || !Number.isSafeInteger(summary.skipped) || summary.imported < 0 || summary.skipped < 0 || Number(summary.imported) + Number(summary.skipped) > rows.length ||
      outcome.result.account_balance_modified !== false) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'historical_statement.import', accountId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm a historical-only import with no balance change. Resolve the outcome using the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    account_balance_modified: false,
    statement_id: saved.id,
    summary,
  });
}
