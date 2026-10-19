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
const MAX_ORDER_LINES = 50;
const MAX_QUANTITY_PER_LINE = 100;
const MAX_ORDER_TOTAL = 100_000_000;
const PACKAGE_IDS = new Set(['hearth', 'haven', 'vitalis', 'provision', 'signal', 'solace', 'vanguard', 'sovereign']);

function validMoney(value: unknown, allowZero = false): value is number {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    (allowZero ? value >= 0 : value > 0) &&
    value <= MAX_ORDER_TOTAL &&
    Number.isSafeInteger(Math.round(value * 100)) &&
    Math.abs(value * 100 - Math.round(value * 100)) <= 1e-7;
}

export default async function createHeroBoxOrder(req: Request): Promise<Response> {
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
  const recipientName = typeof body.recipient_name === 'string' ? body.recipient_name.trim() : '';
  const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
  const address = typeof body.destination_address === 'string' ? body.destination_address.trim() : '';
  const expectedTotal = body.expected_total;
  const packageId = typeof body.package_id === 'string' ? body.package_id.trim() : '';
  const cartInput = body.cart;

  if (actor.role !== 'user') {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'herobox.order.create', 'new_order', 'member_role_required', idempotencyKey,
    );
    return jsonResponse({ error: 'Only an authenticated member can place a HeroBox order.', audit_recorded: auditRecorded }, 403);
  }
  if (!recipientName || recipientName.length > 200) return jsonResponse({ error: 'recipient_name is required and must be 200 characters or fewer.' }, 400);
  if (!destination || destination.length > 200) return jsonResponse({ error: 'destination is required and must be 200 characters or fewer.' }, 400);
  if (address.length > 1000) return jsonResponse({ error: 'destination_address must be 1,000 characters or fewer.' }, 400);
  if (!validMoney(expectedTotal) || expectedTotal > MAX_ORDER_TOTAL) {
    return jsonResponse({ error: 'expected_total must be a positive amount with no more than two decimal places.' }, 400);
  }
  if (packageId && !PACKAGE_IDS.has(packageId)) return jsonResponse({ error: 'package_id is unsupported.' }, 400);
  if (!Array.isArray(cartInput) || cartInput.length < 1 || cartInput.length > MAX_ORDER_LINES) {
    return jsonResponse({ error: `cart must contain between 1 and ${MAX_ORDER_LINES} product lines.` }, 400);
  }

  const cart: Array<{ product_id: string; quantity: number }> = [];
  const seenProducts = new Set<string>();
  for (let index = 0; index < cartInput.length; index += 1) {
    const line = cartInput[index];
    if (!isRecord(line)) return jsonResponse({ error: `Cart line ${index + 1} must be an object.` }, 400);
    const productId = typeof line.product_id === 'string' ? line.product_id.trim() : '';
    const quantity = line.quantity;
    if (!productId || productId.length > 128) return jsonResponse({ error: `Cart line ${index + 1} has an invalid product_id.` }, 400);
    if (!Number.isSafeInteger(quantity) || Number(quantity) < 1 || Number(quantity) > MAX_QUANTITY_PER_LINE) {
      return jsonResponse({ error: `Cart line ${index + 1} quantity must be an integer from 1 to ${MAX_QUANTITY_PER_LINE}.` }, 400);
    }
    if (seenProducts.has(productId)) return jsonResponse({ error: 'Each product must appear only once in the cart; combine quantities before submitting.' }, 400);
    seenProducts.add(productId);
    cart.push({ product_id: productId, quantity: Number(quantity) });
  }

  const outcome = await invokeAtomicMutationService('herobox.order.create', actor, {
    order_type: 'standard',
    cart,
    package_id: packageId || null,
    recipient_name: recipientName,
    destination,
    destination_address: address,
    expected_total: expectedTotal,
    require_authoritative_product_lookup: true,
    require_products_active_and_available: true,
    require_product_freshness_not_stale_or_expired: true,
    require_destination_eligibility: true,
    require_inventory_reservation_or_availability_check: true,
    derive_order_items_and_price_snapshot_from_authoritative_products: true,
    compute_subtotal_discount_shipping_and_total_server_side: true,
    reject_if_authoritative_total_differs_from_expected_total: true,
    never_trust_client_product_names_prices_discounts_or_totals: true,
    create_hero_box_order_atomically: true,
    order_status: 'payment_pending',
    payment_status: 'pending',
    no_funds_moved_during_order_creation: true,
    never_mark_order_paid: true,
    require_actor_owns_created_order: true,
    audit_action: 'herobox_order_created',
    notification_outbox_required: true,
  }, idempotencyKey);

  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'herobox.order.create', 'new_order', outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'herobox.order.create', 'new_order', outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const order = outcome.result.heroBoxOrder;
  let savedItems: unknown = null;
  try {
    if (typeof order?.items === 'string') savedItems = JSON.parse(order.items);
  } catch {
    savedItems = null;
  }
  const expectedLines = new Map(cart.map(line => [line.product_id, line.quantity]));
  const itemLinesValid = Array.isArray(savedItems) &&
    savedItems.length === cart.length &&
    savedItems.every(item =>
      isRecord(item) &&
      typeof item.product_id === 'string' &&
      expectedLines.get(item.product_id) === item.quantity &&
      typeof item.name === 'string' &&
      typeof item.category === 'string' &&
      validMoney(item.unit_price, true)
    );
  const totalsValid = !!order &&
    validMoney(order.subtotal, true) &&
    validMoney(order.discount, true) &&
    validMoney(order.shipping_cost, true) &&
    validMoney(order.total) &&
    Math.round((Number(order.subtotal) - Number(order.discount) + Number(order.shipping_cost)) * 100) === Math.round(Number(order.total) * 100);

  if (
    !order ||
    typeof order.id !== 'string' || !order.id ||
    order.user_id !== actor.id ||
    order.order_type !== 'standard' ||
    order.recipient_name !== recipientName ||
    order.destination !== destination ||
    order.total !== expectedTotal ||
    order.status !== 'payment_pending' ||
    order.payment_status !== 'pending' ||
    typeof order.updated_date !== 'string' || !order.updated_date ||
    (typeof order.package_id === 'string' ? order.package_id : '') !== packageId ||
    outcome.result.funds_moved !== false ||
    !itemLinesValid ||
    !totalsValid
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'herobox.order.create', 'new_order', 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm a correctly priced, unpaid order and audit record. Resolve the outcome using the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    funds_moved: false,
    order: {
      id: order.id,
      user_id: order.user_id,
      recipient_name: order.recipient_name,
      destination: order.destination,
      items: savedItems,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping_cost: order.shipping_cost,
      total: order.total,
      status: order.status,
      payment_status: order.payment_status,
      package_id: order.package_id || '',
      updated_date: order.updated_date,
    },
  });
}
