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

export default async function reviewKYCApplication(req: Request): Promise<Response> {
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

  const applicationId = typeof body.application_id === 'string' ? body.application_id.trim() : '';
  const decision = body.decision;
  const expectedKycStatus = body.expected_kyc_status;
  const adminNotes = typeof body.admin_notes === 'string' ? body.admin_notes.trim() : '';
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';

  if (!isAllowedFinancialRole(actor)) {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'kyc.review', applicationId || 'unknown', 'role_not_authorized', idempotencyKey,
    );
    return jsonResponse({ error: 'You are not authorized to review KYC submissions.', audit_recorded: auditRecorded }, 403);
  }
  if (!applicationId || applicationId.length > 128) return jsonResponse({ error: 'A valid application_id is required.' }, 400);
  if (decision !== 'approved' && decision !== 'rejected' && decision !== 'reset') {
    return jsonResponse({ error: 'decision must be approved, rejected, or reset.' }, 400);
  }
  if (expectedKycStatus !== 'pending' && expectedKycStatus !== 'rejected' && expectedKycStatus !== 'not_started') {
    return jsonResponse({ error: 'expected_kyc_status is invalid.' }, 400);
  }
  if (adminNotes.length > 2000) return jsonResponse({ error: 'admin_notes must be 2,000 characters or fewer.' }, 400);
  if (decision !== 'approved' && !adminNotes) {
    return jsonResponse({ error: 'A review reason is required for rejection or document reset.' }, 400);
  }
  if (decision === 'reset' && expectedKycStatus !== 'rejected') {
    return jsonResponse({ error: 'Documents can only be reset from a rejected KYC state.' }, 409);
  }

  const command: Record<string, unknown> = {
    application_id: applicationId,
    decision,
    expected_updated_date: body.expected_updated_date,
    expected_kyc_status: expectedKycStatus,
    admin_notes: adminNotes,
    require_authoritative_application_lookup: true,
    require_application_revision_match: true,
    require_kyc_status_match: true,
    prevent_kyc_status_downgrade_from_approved: true,
    require_document_provenance_verification_on_approval: decision === 'approved',
    require_all_required_kyc_documents_present_on_approval: decision === 'approved',
    verify_kyc_documents_before_approval: decision === 'approved',
    set_kyc_status: decision === 'reset' ? 'not_started' : decision,
    preserve_document_links_on_rejection: true,
    clear_document_links_only_on_reset: decision === 'reset',
    preserve_uploaded_document_objects_for_retention: decision === 'reset',
    require_documents_retained_on_reset: decision === 'reset',
    require_no_document_or_status_side_effects_before_audit: true,
    audit_action: decision === 'reset' ? 'kyc_documents_reset' : `kyc_${decision}`,
    notification_outbox_required: true,
  };

  const outcome = await invokeAtomicMutationService('kyc.review', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'kyc.review', applicationId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'kyc.review', applicationId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedApplication = outcome.result.application;
  const expectedStatus = decision === 'reset' ? 'not_started' : decision;
  const savedDocuments = Array.isArray(savedApplication?.kyc_documents) ? savedApplication.kyc_documents : null;
  const operationInvalid =
    !savedApplication ||
    savedApplication.id !== applicationId ||
    savedApplication.kyc_status !== expectedStatus ||
    typeof savedApplication.updated_date !== 'string' ||
    !savedApplication.updated_date ||
    savedApplication.updated_date === body.expected_updated_date ||
    (decision === 'approved' && (
      outcome.result.kyc_verified !== true ||
      !savedDocuments ||
      savedDocuments.length === 0
    )) ||
    (decision === 'rejected' && outcome.result.documents_unchanged !== true) ||
    (decision === 'reset' && (
      !savedDocuments ||
      savedDocuments.length !== 0 ||
      outcome.result.documents_retained !== true
    ));

  if (operationInvalid) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'kyc.review', applicationId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the KYC decision, document-retention rules, and audit record. Resolve the outcome using the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    application: {
      id: savedApplication.id,
      user_id: savedApplication.user_id,
      kyc_status: savedApplication.kyc_status,
      updated_date: savedApplication.updated_date,
      kyc_documents: savedDocuments,
    },
    kyc_verified: outcome.result.kyc_verified === true,
    documents_unchanged: outcome.result.documents_unchanged === true,
    documents_retained: outcome.result.documents_retained === true,
  });
}
