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
import { isUuid } from '../../shared/financialMutationRules.mjs';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;

export default async function createInvestmentPortfolio(req: Request): Promise<Response> {
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
  if (!isRecord(parsed) || !isUuid(parsed.idempotency_key)) {
    return jsonResponse({ error: 'A valid JSON object and UUID idempotency_key are required.' }, 400);
  }
  const idempotencyKey = typeof parsed.idempotency_key === 'string' ? parsed.idempotency_key : '';

  if (actor.role !== 'user') {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'investment.portfolio.create', actor.id, 'member_role_required', idempotencyKey,
    );
    return jsonResponse({ error: 'Only a member can create their own investment portfolio.', audit_recorded: auditRecorded }, 403);
  }

  const outcome = await invokeAtomicMutationService('investment.portfolio.create', actor, {
    portfolio_name: 'My Portfolio',
    status: 'pending_setup',
    initial_total_value: 0,
    initial_cash_balance: 0,
    initial_invested_amount: 0,
    provider_connected: false,
    require_authoritative_actor_lookup: true,
    require_member_role: true,
    require_actor_owns_created_portfolio: true,
    enforce_one_portfolio_per_member: true,
    return_existing_portfolio_for_same_idempotency_key: true,
    create_portfolio_and_audit_atomically: true,
    notification_outbox_required: false,
    audit_action: 'investment_portfolio_created',
  }, idempotencyKey);

  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'investment.portfolio.create', actor.id, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'investment.portfolio.create', actor.id, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const portfolio = outcome.result.portfolio;
  if (
    !portfolio || typeof portfolio.id !== 'string' || !portfolio.id ||
    portfolio.user_id !== actor.id ||
    portfolio.portfolio_name !== 'My Portfolio' ||
    portfolio.status !== 'pending_setup' ||
    portfolio.provider_connected !== false ||
    portfolio.total_value !== 0 ||
    portfolio.cash_balance !== 0 ||
    portfolio.invested_amount !== 0 ||
    typeof portfolio.updated_date !== 'string' || !portfolio.updated_date
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'investment.portfolio.create', actor.id, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm an owned, zero-balance portfolio. Resolve the operation using the same idempotency key.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    portfolio: {
      id: portfolio.id,
      user_id: portfolio.user_id,
      portfolio_name: portfolio.portfolio_name,
      status: portfolio.status,
      provider_connected: portfolio.provider_connected,
      total_value: portfolio.total_value,
      cash_balance: portfolio.cash_balance,
      invested_amount: portfolio.invested_amount,
      updated_date: portfolio.updated_date,
    },
  });
}
