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

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;
const ACCOUNT_TYPES = new Set(['Personal', 'Joint', 'Business', 'Organization']);

export default async function createMemberAccount(req: Request): Promise<Response> {
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

  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';
  const targetUserId = typeof body.target_user_id === 'string' ? body.target_user_id.trim() : '';
  const accountType = body.account_type;
  const accountName = typeof body.account_name === 'string' ? body.account_name.trim() : '';

  if (!isAllowedFinancialRole(actor)) {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'account.create', targetUserId || 'unknown', 'role_not_authorized', idempotencyKey,
    );
    return jsonResponse({ error: 'You are not authorized to create accounts.', audit_recorded: auditRecorded }, 403);
  }
  if (!targetUserId || targetUserId.length > 128) {
    return jsonResponse({ error: 'A valid target_user_id is required.' }, 400);
  }
  if (typeof body.expected_updated_date !== 'string' || !body.expected_updated_date.trim()) {
    return jsonResponse({ error: 'The target member revision is required.' }, 400);
  }
  if (typeof accountType !== 'string' || !ACCOUNT_TYPES.has(accountType)) {
    return jsonResponse({ error: 'account_type is not supported.' }, 400);
  }
  if (accountName.length > 120) {
    return jsonResponse({ error: 'account_name must be 120 characters or fewer.' }, 400);
  }
  if (body.opening_balance !== undefined && body.opening_balance !== 0) {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'account.create', targetUserId, 'VERIFIED_FUNDING_REQUIRED', idempotencyKey,
    );
    return jsonResponse({
      error: 'New accounts must start with a zero balance. Credits require the verified funding workflow.',
      code: 'VERIFIED_FUNDING_REQUIRED',
      audit_recorded: auditRecorded,
    }, 422);
  }

  const command: Record<string, unknown> = {
    target_user_id: targetUserId,
    expected_target_user_updated_date: body.expected_updated_date,
    account_type: accountType,
    account_name: accountName || undefined,
    initial_balance: 0,
    require_authoritative_member_lookup: true,
    require_target_member_role: 'user',
    require_target_member_revision_match: true,
    generate_unique_account_number_server_side: true,
    create_account_only_with_zero_balance: true,
    audit_action: 'account_created',
    notification_outbox_required: true,
  };

  const outcome = await invokeAtomicMutationService('account.create', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' ||
      outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'account.create', targetUserId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'account.create', targetUserId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const account = outcome.result.account;
  if (
    !account ||
    account.user_id !== targetUserId ||
    account.account_type !== accountType ||
    account.status !== 'active' ||
    account.balance !== 0 ||
    typeof account.id !== 'string' ||
    !account.id ||
    typeof account.account_number !== 'string' ||
    !account.account_number.trim() ||
    typeof account.updated_date !== 'string' ||
    !account.updated_date
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'account.create', targetUserId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm a valid zero-balance account. Resolve the operation using the same idempotency key.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    account: {
      id: account.id,
      user_id: account.user_id,
      account_number: account.account_number,
      account_type: account.account_type,
      account_name: typeof account.account_name === 'string' ? account.account_name : '',
      balance: account.balance,
      status: account.status,
      updated_date: account.updated_date,
    },
  });
}
