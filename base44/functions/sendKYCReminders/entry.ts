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
import { isUuid } from '../../shared/financialMutationRules.mjs';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;

export default async function sendKYCReminders(req: Request): Promise<Response> {
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

  if (!isAllowedFinancialRole(actor)) {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'kyc.reminders.send', 'pending_kyc_queue', 'role_not_authorized', idempotencyKey,
    );
    return jsonResponse({ error: 'You are not authorized to send KYC reminders.', audit_recorded: auditRecorded }, 403);
  }

  const outcome = await invokeAtomicMutationService('kyc.reminders.send', actor, {
    select_authoritative_pending_kyc_applications: true,
    require_kyc_status: 'pending',
    require_created_at_older_than_days: 3,
    max_reminders_per_operation: 100,
    deduplicate_by_application_and_reminder_window: true,
    never_trust_client_application_ids_or_user_ids: true,
    create_notification_outbox_entries_atomically: true,
    audit_action: 'kyc_reminders_queued',
    notification_outbox_required: true,
  }, idempotencyKey);

  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'kyc.reminders.send', 'pending_kyc_queue', outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'kyc.reminders.send', 'pending_kyc_queue', outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const summary = outcome.result.summary;
  if (
    !isRecord(summary) ||
    !Number.isSafeInteger(summary.eligible) || Number(summary.eligible) < 0 ||
    !Number.isSafeInteger(summary.queued) || Number(summary.queued) < 0 ||
    !Number.isSafeInteger(summary.skipped) || Number(summary.skipped) < 0 ||
    Number(summary.queued) + Number(summary.skipped) > Number(summary.eligible) ||
    Number(summary.queued) > 100
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'kyc.reminders.send', 'pending_kyc_queue', 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm a valid reminder summary. Resolve the operation using the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    summary: {
      eligible: summary.eligible,
      queued: summary.queued,
      skipped: summary.skipped,
    },
  });
}
