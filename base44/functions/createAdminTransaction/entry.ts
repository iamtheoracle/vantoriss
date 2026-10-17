// Base44 server functions require pinned npm: imports.
// deno-lint-ignore no-import-prefix
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isAllowedFinancialRole,
  isRecord,
  jsonResponse,
  validateMutationEnvelope,
  writeBlockedMutationAudit,
  writeUncertainMutationAudit,
  type AuthenticatedActor,
  type Base44AuditClient,
} from '../../shared/financialMutationGateway.ts';
import { isDateOnly } from '../../shared/financialMutationRules.mjs';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;
const ALLOWED_TYPES = new Set(['deposit', 'withdrawal']);

export default async function createAdminTransaction(req: Request): Promise<Response> {
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

  const parsedBody: unknown = await req.json().catch(() => null);
  if (!isRecord(parsedBody)) return jsonResponse({ error: 'A valid JSON object is required.' }, 400);
  const body = parsedBody;
  const envelopeError = validateMutationEnvelope(body);
  if (envelopeError) return jsonResponse({ error: envelopeError }, 400);

  const accountId = typeof body.account_id === 'string' ? body.account_id.trim() : '';
  const type = typeof body.type === 'string' ? body.type.trim().toLowerCase() : '';
  const amount = body.amount;
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
  const transactionDate = typeof body.transaction_date === 'string' ? body.transaction_date : '';
  const expectedUpdatedDate = typeof body.expected_updated_date === 'string' ? body.expected_updated_date : '';
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';

  if (!accountId || accountId.length > 128) return jsonResponse({ error: 'A valid account_id is required.' }, 400);
  if (!isAllowedFinancialRole(actor)) {
    await writeBlockedMutationAudit(base44, actor, 'transaction.create_manual', accountId, 'role_not_authorized', idempotencyKey);
    return jsonResponse({ error: 'You are not authorized to create account transactions.' }, 403);
  }
  if (!ALLOWED_TYPES.has(type)) {
    return jsonResponse({
      error: 'Only deposit and withdrawal entries are enabled here. Adjustments and opening balances require separate verified workflows.',
      code: 'UNSUPPORTED_TRANSACTION_TYPE',
    }, 400);
  }
  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 100_000_000 ||
    !Number.isSafeInteger(Math.round(amount * 100)) ||
    Math.abs(amount * 100 - Math.round(amount * 100)) > Number.EPSILON * Math.max(1, Math.abs(amount * 100)) * 4
  ) {
    return jsonResponse({ error: 'amount must be positive, finite, within the supported limit, and precise to cents.' }, 400);
  }
  if (description.length > 1000 || reference.length > 256) {
    return jsonResponse({ error: 'description or reference exceeds the supported length.' }, 400);
  }
  if (!expectedUpdatedDate || expectedUpdatedDate.length > 128) {
    return jsonResponse({ error: 'expected_updated_date is required.' }, 400);
  }
  if (transactionDate && !isDateOnly(transactionDate)) {
    return jsonResponse({ error: 'transaction_date must be a valid YYYY-MM-DD date.' }, 400);
  }

  const command: Record<string, unknown> = {
    account_id: accountId,
    type,
    amount,
    description,
    reference,
    ...(transactionDate ? { transaction_date: transactionDate } : {}),
    expected_updated_date: expectedUpdatedDate,
    require_authoritative_account_lookup: true,
    require_account_revision_match: true,
    require_account_active: true,
    require_verified_funding_evidence: type === 'deposit',
    require_sufficient_available_funds: type === 'withdrawal',
    prevent_negative_balance: true,
    compute_balance_server_side: true,
    never_trust_client_balance: true,
    audit_action: type === 'deposit' ? 'manual_deposit_recorded' : 'manual_withdrawal_recorded',
    notification_outbox_required: true,
  };

  const outcome = await invokeAtomicMutationService('transaction.create_manual', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const isUncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' ||
      outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = isUncertain
      ? await writeUncertainMutationAudit(base44, actor, 'transaction.create_manual', accountId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'transaction.create_manual', accountId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedTransaction = outcome.result.transaction;
  const savedAccount = outcome.result.account;
  const expectedSignedAmount = type === 'withdrawal' ? -amount : amount;
  if (
    !savedTransaction ||
    typeof savedTransaction.id !== 'string' ||
    savedTransaction.account_id !== accountId ||
    savedTransaction.type !== type ||
    savedTransaction.amount !== expectedSignedAmount ||
    typeof savedTransaction.balance_after !== 'number' ||
    !Number.isFinite(savedTransaction.balance_after) ||
    !savedAccount ||
    savedAccount.id !== accountId ||
    savedAccount.balance !== savedTransaction.balance_after ||
    typeof savedAccount.updated_date !== 'string' ||
    savedAccount.updated_date === expectedUpdatedDate
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'transaction.create_manual', accountId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the ledger entry and resulting account balance. Resolve the outcome with the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    transaction: {
      id: savedTransaction.id,
      account_id: savedTransaction.account_id,
      type: savedTransaction.type,
      amount: savedTransaction.amount,
      balance_after: savedTransaction.balance_after,
      transaction_date: savedTransaction.transaction_date,
      updated_date: savedTransaction.updated_date,
    },
    account: {
      id: savedAccount.id,
      balance: savedAccount.balance,
      updated_date: savedAccount.updated_date,
    },
  });
}
