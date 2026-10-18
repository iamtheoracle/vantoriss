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
import { isUuid, isValidRevision } from '../../shared/financialMutationRules.mjs';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;
const DONATION_CATEGORIES = new Set(['food', 'children', 'medical', 'military', 'shelter', 'general']);
const MAX_DONATION_AMOUNT = 100_000_000;

export default async function createHeroBoxDonation(req: Request): Promise<Response> {
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

  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';
  const category = typeof body.category === 'string' ? body.category : '';
  const caseId = typeof body.case_id === 'string' ? body.case_id.trim() : '';
  const expectedCaseUpdatedDate = body.expected_case_updated_date;
  const amount = body.amount;

  if (actor.role !== 'user') {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'herobox.donation.create', caseId || 'general', 'member_role_required', idempotencyKey,
    );
    return jsonResponse({ error: 'Only an authenticated member can create a donation order.', audit_recorded: auditRecorded }, 403);
  }
  if (!DONATION_CATEGORIES.has(category)) return jsonResponse({ error: 'A supported donation category is required.' }, 400);
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > MAX_DONATION_AMOUNT ||
      !Number.isSafeInteger(Math.round(amount * 100)) ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > Number.EPSILON * Math.max(1, Math.abs(amount * 100)) * 4) {
    return jsonResponse({ error: 'amount must be positive, no greater than 100,000,000, and exact to cents.' }, 400);
  }
  if (caseId && caseId.length > 128) return jsonResponse({ error: 'case_id is invalid.' }, 400);
  if (caseId && !isValidRevision(expectedCaseUpdatedDate)) {
    return jsonResponse({ error: 'The selected case revision is required. Refresh the case list and retry.' }, 400);
  }
  if (!caseId && expectedCaseUpdatedDate !== undefined && expectedCaseUpdatedDate !== null && expectedCaseUpdatedDate !== '') {
    return jsonResponse({ error: 'A case revision cannot be supplied without a case_id.' }, 400);
  }

  const command: Record<string, unknown> = {
    donation_category: category,
    amount,
    humanitarian_case_id: caseId || null,
    expected_case_updated_date: caseId ? expectedCaseUpdatedDate : null,
    require_authoritative_case_lookup_when_selected: true,
    require_case_revision_match_when_selected: true,
    require_case_review_status_approved_when_selected: true,
    require_case_donor_visible_status_when_selected: ['approved', 'active', 'matched'],
    require_case_category_match_when_selected: true,
    create_hero_box_order_atomically: true,
    order_status: 'payment_pending',
    payment_status: 'pending',
    never_mark_donation_paid: true,
    no_funds_moved_during_order_creation: true,
    update_case_match_atomically_if_selected: true,
    require_actor_owns_created_order: true,
    audit_action: 'herobox_donation_order_created',
    notification_outbox_required: true,
  };

  const outcome = await invokeAtomicMutationService('herobox.donation.create', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'herobox.donation.create', caseId || 'general', outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'herobox.donation.create', caseId || 'general', outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const order = outcome.result.heroBoxOrder;
  if (
    !order || typeof order.id !== 'string' || !order.id ||
    order.user_id !== actor.id ||
    order.category !== 'donation' ||
    order.total !== amount ||
    order.status !== 'payment_pending' ||
    order.payment_status !== 'pending' ||
    typeof order.updated_date !== 'string' || !order.updated_date ||
    (typeof order.humanitarian_case_id === 'string' ? order.humanitarian_case_id : null) !== (caseId || null)
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'herobox.donation.create', caseId || 'general', 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm an unpaid donation order and audit record. Resolve the operation using the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    order: {
      id: order.id,
      user_id: order.user_id,
      total: order.total,
      status: order.status,
      payment_status: order.payment_status,
      updated_date: order.updated_date,
    },
    funds_moved: false,
  });
}
