// Base44 server functions require pinned npm: imports.
// deno-lint-ignore no-import-prefix
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isAllowedFinancialRole,
  isRecord,
  jsonResponse,
  writeBlockedMutationAudit,
  writeUncertainMutationAudit,
  type AuthenticatedActor,
  type Base44AuditClient,
} from '../../shared/financialMutationGateway.ts';
import { isDateOnly, isUuid } from '../../shared/financialMutationRules.mjs';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;
const MAX_IMPORT_ROWS = 500;
const IMPORTABLE_TYPES = new Set(['deposit', 'withdrawal']);

type ImportRow = {
  account_number: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  reference: string;
  transaction_date?: string;
};

function validateAndNormalizeRows(value: unknown): { rows?: ImportRow[]; error?: string } {
  if (!Array.isArray(value) || value.length === 0) {
    return { error: 'A non-empty transactions array is required.' };
  }
  if (value.length > MAX_IMPORT_ROWS) {
    return { error: `Maximum ${MAX_IMPORT_ROWS} transactions per import.` };
  }

  const rows: ImportRow[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const row = value[index];
    if (!isRecord(row)) return { error: `Row ${index + 2} must be an object.` };

    const accountNumber = typeof row.account_number === 'string'
      ? row.account_number.trim()
      : '';
    if (!accountNumber || accountNumber.length > 128) {
      return { error: `Row ${index + 2} has an invalid account_number.` };
    }

    const type = typeof row.type === 'string' ? row.type.toLowerCase().trim() : '';
    if (!IMPORTABLE_TYPES.has(type)) {
      return {
        error: `Row ${index + 2} has an unsupported type. Only deposit and withdrawal imports are enabled; adjustments and opening balances require separate verified workflows.`,
      };
    }

    const amount = row.amount;
    if (
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !Number.isSafeInteger(Math.round(amount * 100)) ||
      Math.abs(amount * 100 - Math.round(amount * 100)) >= 1e-7
    ) {
      return { error: `Row ${index + 2} must have a positive amount with at most two decimal places.` };
    }

    const description = row.description === undefined || row.description === null
      ? ''
      : typeof row.description === 'string' ? row.description.trim() : null;
    const reference = row.reference === undefined || row.reference === null
      ? ''
      : typeof row.reference === 'string' ? row.reference.trim() : null;
    if (description === null || description.length > 1000) {
      return { error: `Row ${index + 2} has an invalid description.` };
    }
    if (reference === null || reference.length > 256) {
      return { error: `Row ${index + 2} has an invalid reference.` };
    }

    let transactionDate: string | undefined;
    if (row.transaction_date !== undefined && row.transaction_date !== null && row.transaction_date !== '') {
      if (typeof row.transaction_date !== 'string' || !isDateOnly(row.transaction_date)) {
        return { error: `Row ${index + 2} has an invalid transaction_date; use YYYY-MM-DD.` };
      }
      transactionDate = row.transaction_date;
    }

    rows.push({
      account_number: accountNumber,
      type: type as ImportRow['type'],
      amount,
      description,
      reference,
      ...(transactionDate ? { transaction_date: transactionDate } : {}),
    });
  }

  return { rows };
}

export default async function bulkImportTransactions(req: Request): Promise<Response> {
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

  let base44: Base44Client;
  let actor: AuthenticatedActor | null;
  try {
    base44 = createClientFromRequest(req) as Base44Client;
    const user = await base44.auth.me();
    actor = user ? {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
    } : null;
  } catch {
    return jsonResponse({ error: 'Authentication could not be verified.' }, 401);
  }
  if (!actor?.id) return jsonResponse({ error: 'Authentication required.' }, 401);

  if (!isAllowedFinancialRole(actor)) {
    await writeBlockedMutationAudit(base44, actor, 'transactions.bulk_import', 'unknown', 'role_not_authorized');
    return jsonResponse({ error: 'You are not authorized to import transactions.' }, 403);
  }

  const parsedBody: unknown = await req.json().catch(() => null);
  if (!isRecord(parsedBody)) return jsonResponse({ error: 'A valid JSON object is required.' }, 400);
  if (!isUuid(parsedBody.idempotency_key)) {
    return jsonResponse({ error: 'A valid UUID idempotency_key is required.' }, 400);
  }

  const normalized = validateAndNormalizeRows(parsedBody.transactions);
  if (!normalized.rows) return jsonResponse({ error: normalized.error }, 400);
  const idempotencyKey = typeof parsedBody.idempotency_key === 'string' ? parsedBody.idempotency_key : '';
  const rowCount = normalized.rows.length;

  // The atomic service must resolve account numbers against authoritative
  // records, enforce funds/state rules, deduplicate the operation, and commit
  // accepted ledger rows plus the audit record in one transaction. This
  // endpoint deliberately performs no entity CRUD writes itself.
  const outcome = await invokeAtomicMutationService(
    'transactions.bulk_import',
    actor,
    {
      transactions: normalized.rows,
      all_or_nothing: true,
      max_rows: MAX_IMPORT_ROWS,
      require_authoritative_account_lookup: true,
      prevent_negative_balances: true,
      require_verified_funding_for_opening_balance: true,
      allowed_types: [...IMPORTABLE_TYPES],
      audit_action: 'transaction_bulk_imported',
    },
    idempotencyKey,
  );

  if (!outcome.ok) {
    const isUncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' ||
      outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = isUncertain
      ? await writeUncertainMutationAudit(base44, actor, 'transactions.bulk_import', `rows:${rowCount}`, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'transactions.bulk_import', `rows:${rowCount}`, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const result = outcome.result;
  const summary = result.summary;
  const isCount = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
  const created = Array.isArray(result.created) ? result.created : null;
  const skipped = Array.isArray(result.skipped) ? result.skipped : null;
  const errors = Array.isArray(result.errors) ? result.errors : null;
  if (
    !isRecord(summary) ||
    summary.total !== rowCount ||
    !isCount(summary.created) ||
    !isCount(summary.skipped) ||
    !isCount(summary.errors) ||
    Number(summary.created) + Number(summary.skipped) + Number(summary.errors) !== rowCount ||
    (Number(summary.created) > 0 && (Number(summary.skipped) > 0 || Number(summary.errors) > 0)) ||
    !created || created.length !== summary.created ||
    !skipped || skipped.length !== summary.skipped ||
    !errors || errors.length !== summary.errors
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'transactions.bulk_import', `rows:${rowCount}`, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm a complete import result. Resolve the outcome using the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    summary,
    created,
    skipped,
    errors,
    audit_recorded: true,
  });
}
