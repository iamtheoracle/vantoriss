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

export default async function reviewFundingRequest(req: Request): Promise<Response> {
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

  if (!isAllowedFinancialRole(actor)) {
    await writeBlockedMutationAudit(base44, actor, 'funding.review', 'unknown', 'role_not_authorized');
    return jsonResponse({ error: 'You are not authorized to review funding requests.' }, 403);
  }

  const parsedBody: unknown = await req.json().catch(() => null);
  if (!isRecord(parsedBody)) return jsonResponse({ error: 'A valid JSON object is required.' }, 400);
  const body = parsedBody;
  const envelopeError = validateMutationEnvelope(body);
  if (envelopeError) return jsonResponse({ error: envelopeError }, 400);

  const requestId = typeof body.request_id === 'string' ? body.request_id.trim() : '';
  const decision = body.decision;
  const adminNotes = typeof body.admin_notes === 'string' ? body.admin_notes.trim() : '';
  const expectedUpdatedDate = typeof body.expected_updated_date === 'string' ? body.expected_updated_date : '';
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';

  if (!requestId || requestId.length > 128) return jsonResponse({ error: 'A valid request_id is required.' }, 400);
  if (decision !== 'approved' && decision !== 'rejected') {
    return jsonResponse({ error: 'decision must be approved or rejected.' }, 400);
  }
  if (adminNotes.length > 2000) return jsonResponse({ error: 'admin_notes must be 2,000 characters or fewer.' }, 400);

  // The service must resolve the funding request, amount, account, method, and
  // evidence itself. Never trust client-supplied amounts or balances. For an
  // opening contribution, require independently verified funding evidence.
  const command: Record<string, unknown> = {
    request_id: requestId,
    decision,
    admin_notes: adminNotes,
    expected_request_status: 'pending',
    expected_updated_date: expectedUpdatedDate,
    require_authoritative_request_lookup: true,
    require_verified_funding_evidence: decision === 'approved',
    required_funding_evidence_status: decision === 'approved' ? 'verified' : undefined,
    disallow_unverified_opening_contribution: true,
    prevent_negative_balances: true,
    audit_action: decision === 'approved' ? 'funding_request_approved' : 'funding_request_rejected',
    notification_outbox_required: true,
  };

  const outcome = await invokeAtomicMutationService('funding.review', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const isUncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' ||
      outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = isUncertain
      ? await writeUncertainMutationAudit(base44, actor, 'funding.review', requestId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'funding.review', requestId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedRequest = outcome.result.verificationRequest;
  if (
    savedRequest?.id !== requestId ||
    savedRequest.status !== decision ||
    typeof savedRequest.updated_date !== 'string' ||
    savedRequest.updated_date === expectedUpdatedDate
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'funding.review', requestId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the requested funding-request state. Resolve the outcome with the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    request: { id: savedRequest.id, status: savedRequest.status, updated_date: savedRequest.updated_date },
    audit_recorded: true,
  });
}
