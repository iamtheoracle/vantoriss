import { isDateOnly, isUuid, isValidRevision } from './financialMutationRules.mjs';

export const FINANCIAL_REVIEW_ROLES = Object.freeze([
  'admin',
  'administrator',
  'executive',
  'operations_manager',
  'super_administrator',
]);

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function isAllowedFinancialRole(user: any): boolean {
  return !!user?.id && FINANCIAL_REVIEW_ROLES.includes(user.role);
}

export function validateMutationEnvelope(body: any) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'A JSON object is required.';
  }
  if (!isUuid(body.idempotency_key)) {
    return 'A valid UUID idempotency_key is required.';
  }
  if (!isValidRevision(body.expected_updated_date)) {
    return 'expected_updated_date is required.';
  }
  return null;
}

export function validateDateCorrection(body: any) {
  if (typeof body?.transaction_id !== 'string' || !body.transaction_id.trim()) {
    return 'transaction_id is required.';
  }
  if (typeof body?.account_id !== 'string' || !body.account_id.trim()) {
    return 'account_id is required.';
  }
  if (!isDateOnly(body?.transaction_date)) {
    return 'transaction_date must be a valid YYYY-MM-DD calendar date.';
  }
  if (!['completed', 'reversed'].includes(body?.expected_status)) {
    return 'expected_status must be completed or reversed.';
  }
  if (
    body?.expected_current_transaction_date !== null &&
    body?.expected_current_transaction_date !== undefined &&
    !isDateOnly(body.expected_current_transaction_date)
  ) {
    return 'expected_current_transaction_date must be a valid YYYY-MM-DD date or null.';
  }
  return null;
}

export async function writeBlockedMutationAudit(
  base44: any,
  actor: any,
  action: string,
  targetId: string,
  reason: string,
  idempotencyKey?: string,
): Promise<boolean> {
  if (!actor?.id) return false;
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      action_type: 'financial_mutation_blocked',
      description: `Blocked financial mutation: ${action}`,
      details: JSON.stringify({
        outcome: 'blocked',
        action,
        target_id: targetId,
        reason,
        idempotency_key: idempotencyKey || null,
      }),
      user_id: actor.id,
      admin_name: actor.full_name || actor.email || actor.role || 'Authenticated operator',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * All successful financial writes must be performed by a transactional service
 * that owns the authoritative records. Base44 entity CRUD has no compare-and-swap
 * or multi-entity transaction primitive, so falling back to sequential entity
 * writes here would permit duplicate approvals, lost updates, or unaudited changes.
 */
export async function invokeAtomicMutationService(
  action: string,
  actor: any,
  command: Record<string, unknown>,
  idempotencyKey: string,
) {
  const endpoint = Deno.env.get('VANTORIS_ATOMIC_MUTATION_URL');
  const secret = Deno.env.get('VANTORIS_ATOMIC_MUTATION_SECRET');

  if (!endpoint || !secret) {
    return {
      ok: false as const,
      status: 503,
      code: 'ATOMIC_MUTATION_SERVICE_UNAVAILABLE',
      message: 'The transactional financial mutation service is not configured; no changes were made.',
    };
  }

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return { ok: false as const, status: 503, code: 'ATOMIC_MUTATION_SERVICE_MISCONFIGURED', message: 'The transactional financial mutation service is misconfigured; no changes were made.' };
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    return { ok: false as const, status: 503, code: 'ATOMIC_MUTATION_SERVICE_MISCONFIGURED', message: 'The transactional financial mutation service must use a valid HTTPS endpoint; no changes were made.' };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        action,
        actor: { id: actor.id, role: actor.role },
        idempotency_key: idempotencyKey,
        command,
      }),
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return { ok: false as const, status: 503, code: 'ATOMIC_MUTATION_SERVICE_UNREACHABLE', message: 'The transactional financial mutation service could not be reached; no success was reported.' };
  }

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const status = [400, 403, 404, 409, 422, 503].includes(response.status) ? response.status : 502;
    const code = typeof result?.code === 'string' && /^[A-Z0-9_]{1,64}$/.test(result.code)
      ? result.code
      : 'ATOMIC_MUTATION_REJECTED';
    const message = status === 409
      ? 'The record changed or the requested transition is no longer permitted. Reload and review the current record.'
      : status === 422
        ? 'The transactional service rejected the mutation because its business rules were not satisfied.'
        : status === 503
          ? 'The transactional financial mutation service is temporarily unavailable; no success was reported.'
          : 'The transactional financial mutation service rejected the request.';
    return { ok: false as const, status, code, message };
  }

  // The service contract requires its database transaction to persist both the
  // business mutation and the matching audit record before acknowledging success.
  if (
    result?.success !== true ||
    result?.audit_recorded !== true ||
    result?.operation_id !== idempotencyKey
  ) {
    return {
      ok: false as const,
      status: 502,
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      message: 'The transactional service did not confirm an audited, idempotent commit; review the operation before retrying.',
    };
  }

  return { ok: true as const, result };
}

export { isDateOnly, isUuid, isValidRevision };
