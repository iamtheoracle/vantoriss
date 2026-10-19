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

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  paid: ['processing'],
  processing: ['packed', 'exception'],
  packed: ['shipped', 'exception'],
  shipped: ['in_transit', 'delivered', 'exception'],
  in_transit: ['delivered', 'exception'],
  exception: ['processing', 'packed', 'shipped', 'in_transit', 'delivered'],
};

export default async function updateHeroBoxOrderStatus(req: Request): Promise<Response> {
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
  const envelopeError = validateMutationEnvelope(body);
  if (envelopeError) return jsonResponse({ error: envelopeError }, 400);

  const orderId = typeof body.order_id === 'string' ? body.order_id.trim() : '';
  const expectedStatus = typeof body.expected_status === 'string' ? body.expected_status : '';
  const nextStatus = typeof body.next_status === 'string' ? body.next_status : '';
  const expectedPaymentStatus = typeof body.expected_payment_status === 'string' ? body.expected_payment_status : '';
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';

  if (!isAllowedFinancialRole(actor)) {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'herobox.order.fulfillment_update', orderId || 'unknown', 'role_not_authorized', idempotencyKey,
    );
    return jsonResponse({ error: 'You are not authorized to update HeroBox order fulfillment.', audit_recorded: auditRecorded }, 403);
  }
  if (!orderId || orderId.length > 128) return jsonResponse({ error: 'A valid order_id is required.' }, 400);
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_TRANSITIONS, expectedStatus) ||
      !ALLOWED_TRANSITIONS[expectedStatus].includes(nextStatus)) {
    return jsonResponse({
      error: 'This order status transition is not allowed. Payment, refund, and cancellation states require separate verified workflows.',
      code: 'ORDER_TRANSITION_NOT_ALLOWED',
    }, 409);
  }
  if (!expectedPaymentStatus || expectedPaymentStatus.length > 32) {
    return jsonResponse({ error: 'expected_payment_status is required.' }, 400);
  }

  const outcome = await invokeAtomicMutationService('herobox.order.fulfillment_update', actor, {
    order_id: orderId,
    expected_status: expectedStatus,
    expected_payment_status: expectedPaymentStatus,
    next_status: nextStatus,
    expected_updated_date: body.expected_updated_date,
    allowed_transitions: ALLOWED_TRANSITIONS,
    require_authoritative_order_lookup: true,
    require_order_revision_match: true,
    require_expected_status_match: true,
    require_expected_payment_status_match: true,
    require_payment_status_completed_for_fulfillment: true,
    require_payment_fields_unchanged: true,
    never_mark_order_paid_from_operator_action: true,
    never_mark_order_refunded_or_cancelled_from_fulfillment_action: true,
    never_move_funds_during_fulfillment_update: true,
    server_assign_shipped_and_delivered_dates: true,
    update_order_audit_and_notification_outbox_atomically: true,
    audit_action: 'herobox_order_fulfillment_updated',
    notification_outbox_required: true,
  }, idempotencyKey);

  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'herobox.order.fulfillment_update', orderId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'herobox.order.fulfillment_update', orderId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const order = outcome.result.heroBoxOrder;
  if (
    !order ||
    order.id !== orderId ||
    order.status !== nextStatus ||
    order.payment_status !== expectedPaymentStatus ||
    typeof order.updated_date !== 'string' ||
    !order.updated_date ||
    order.updated_date === body.expected_updated_date ||
    outcome.result.payment_fields_modified !== false ||
    outcome.result.funds_moved_by_operation !== false
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'herobox.order.fulfillment_update', orderId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm a fulfillment-only update with unchanged payment state and no funds movement. Resolve the outcome using the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    payment_fields_modified: false,
    funds_moved_by_operation: false,
    order: {
      id: order.id,
      status: order.status,
      payment_status: order.payment_status,
      updated_date: order.updated_date,
      shipped_date: order.shipped_date,
      delivered_date: order.delivered_date,
      tracking_number: order.tracking_number,
    },
  });
}
