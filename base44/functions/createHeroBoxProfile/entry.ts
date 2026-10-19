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

export default async function createHeroBoxProfile(req: Request): Promise<Response> {
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
      base44, actor, 'herobox.profile.create', actor.id, 'member_role_required', idempotencyKey,
    );
    return jsonResponse({ error: 'Only an authenticated member can create a sponsor profile.', audit_recorded: auditRecorded }, 403);
  }

  const outcome = await invokeAtomicMutationService('herobox.profile.create', actor, {
    user_id: actor.id,
    role: 'sponsor',
    status: 'active',
    require_unique_profile_per_user_role: true,
    return_existing_profile_on_idempotent_retry: true,
    never_trust_client_user_id_role_status_or_totals: true,
    initialize_contribution_totals_to_zero: true,
    create_profile_atomically: true,
    audit_action: 'herobox_sponsor_profile_created',
    notification_outbox_required: true,
  }, idempotencyKey);

  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'herobox.profile.create', actor.id, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'herobox.profile.create', actor.id, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const profile = outcome.result.heroBoxProfile;
  if (
    !profile ||
    typeof profile.id !== 'string' ||
    profile.user_id !== actor.id ||
    profile.role !== 'sponsor' ||
    profile.status !== 'active' ||
    profile.heroes_supported !== 0 ||
    profile.total_contribution !== 0 ||
    typeof profile.updated_date !== 'string' ||
    !profile.updated_date
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'herobox.profile.create', actor.id, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm a member-owned sponsor profile with zero contribution totals. Resolve the outcome using the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    profile,
  });
}
