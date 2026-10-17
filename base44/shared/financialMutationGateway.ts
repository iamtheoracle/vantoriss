import { isDateOnly, isUuid, isValidRevision } from './financialMutationRules.mjs';

export type AuthenticatedActor = {
  id: string;
  role?: string;
  full_name?: string | null;
  email?: string;
};

export type Base44AuditClient = {
  asServiceRole: {
    entities: {
      AuditLog: {
        create: (record: Record<string, unknown>) => Promise<unknown>;
      };
    };
  };
};

type AtomicMutationResult = {
  success?: boolean;
  audit_recorded?: boolean;
  operation_id?: string;
  application?: Record<string, unknown>;
  account?: Record<string, unknown> | null;
  transaction?: Record<string, unknown>;
  code?: string;
  summary?: Record<string, unknown>;
  created?: unknown[];
  skipped?: unknown[];
  errors?: unknown[];
};

type MutationOutcome =
  | { ok: true; result: AtomicMutationResult }
  | { ok: false; status: number; code: string; message: string };

export const FINANCIAL_REVIEW_ROLES = Object.freeze([
  'admin',
  'administrator',
  'executive',
  'operations_manager',
  'super_administrator',
]);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export function isAllowedFinancialRole(user: AuthenticatedActor | null | undefined): boolean {
  return !!user?.id && !!user.role && FINANCIAL_REVIEW_ROLES.includes(user.role);
}

export function validateMutationEnvelope(body: unknown): string | null {
  if (!isRecord(body)) return 'A JSON object is required.';
  if (!isUuid(body.idempotency_key)) return 'A valid UUID idempotency_key is required.';
  if (!isValidRevision(body.expected_updated_date)) return 'expected_updated_date is required.';
  return null;
}

export function validateDateCorrection(body: unknown): string | null {
  if (!isRecord(body)) return 'A JSON object is required.';
  if (typeof body.transaction_id !== 'string' || !body.transaction_id.trim()) {
    return 'transaction_id is required.';
  }
  if (typeof body.account_id !== 'string' || !body.account_id.trim()) {
    return 'account_id is required.';
  }
  if (!isDateOnly(body.transaction_date)) {
    return 'transaction_date must be a valid YYYY-MM-DD calendar date.';
  }
  if (body.expected_status !== 'completed' && body.expected_status !== 'reversed') {
    return 'expected_status must be completed or reversed.';
  }
  if (
    body.expected_current_transaction_date !== null &&
    body.expected_current_transaction_date !== undefined &&
    !isDateOnly(body.expected_current_transaction_date)
  ) {
    return 'expected_current_transaction_date must be a valid YYYY-MM-DD date or null.';
  }
  return null;
}

export async function writeBlockedMutationAudit(
  base44: Base44AuditClient,
  actor: AuthenticatedActor | null | undefined,
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

export async function writeUncertainMutationAudit(
  base44: Base44AuditClient,
  actor: AuthenticatedActor | null | undefined,
  action: string,
  targetId: string,
  reason: string,
  idempotencyKey: string,
): Promise<boolean> {
  if (!actor?.id) return false;
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      action_type: 'financial_mutation_uncertain',
      description: `Financial mutation outcome uncertain: ${action}`,
      details: JSON.stringify({
        outcome: 'unknown',
        action,
        target_id: targetId,
        reason,
        idempotency_key: idempotencyKey,
        next_step: 'Resolve by retrying the exact same operation with the same idempotency key.',
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
 * Successful writes must be committed by a transactional service that owns the
 * authoritative records. Base44 entity CRUD does not provide compare-and-swap
 * or a multi-entity transaction, so this gateway fails closed without a provider.
 */
export async function invokeAtomicMutationService(
  action: string,
  actor: AuthenticatedActor,
  command: Record<string, unknown>,
  idempotencyKey: string,
): Promise<MutationOutcome> {
  const endpoint = Deno.env.get('VANTORIS_ATOMIC_MUTATION_URL');
  const secret = Deno.env.get('VANTORIS_ATOMIC_MUTATION_SECRET');

  if (!endpoint || !secret) {
    return {
      ok: false,
      status: 503,
      code: 'ATOMIC_MUTATION_SERVICE_UNAVAILABLE',
      message: 'The transactional financial mutation service is not configured; no changes were made.',
    };
  }

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return { ok: false, status: 503, code: 'ATOMIC_MUTATION_SERVICE_MISCONFIGURED', message: 'The transactional financial mutation service is misconfigured; no changes were made.' };
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    return { ok: false, status: 503, code: 'ATOMIC_MUTATION_SERVICE_MISCONFIGURED', message: 'The transactional financial mutation service must use a valid HTTPS endpoint; no changes were made.' };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      cache: 'no-store',
      redirect: 'error',
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
    return {
      ok: false,
      status: 503,
      code: 'ATOMIC_MUTATION_OUTCOME_UNKNOWN',
      message: 'The mutation outcome is unknown. Retry the exact same operation so the idempotency key can resolve it; do not create a new request.',
    };
  }

  const rawResult: unknown = await response.json().catch(() => null);
  const result = isRecord(rawResult) ? rawResult as AtomicMutationResult : null;
  if (!response.ok) {
    if (response.status >= 500) {
      return {
        ok: false,
        status: 503,
        code: 'ATOMIC_MUTATION_OUTCOME_UNKNOWN',
        message: 'The transactional service returned a server error. Retry the exact same operation with the same idempotency key; do not create a new request.',
      };
    }
    const status = [400, 403, 404, 409, 422].includes(response.status) ? response.status : 502;
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
    return { ok: false, status, code, message };
  }

  // The service contract requires the same database transaction to persist the
  // business mutation and audit record before acknowledging the idempotency key.
  if (
    !result ||
    result.success !== true ||
    result.audit_recorded !== true ||
    result.operation_id !== idempotencyKey
  ) {
    return {
      ok: false,
      status: 502,
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      message: 'The transactional service did not confirm an audited, idempotent commit; resolve the outcome using the same idempotency key.',
    };
  }

  return { ok: true, result };
}
