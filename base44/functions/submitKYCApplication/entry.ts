// Base44 server functions require pinned npm: imports.
// deno-lint-ignore no-import-prefix
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isRecord,
  jsonResponse,
  validateMutationEnvelope,
  writeBlockedMutationAudit,
  writeUncertainMutationAudit,
  type AuthenticatedActor,
  type Base44AuditClient,
} from '../../shared/financialMutationGateway.ts';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;
const MAX_KYC_DOCUMENTS = 10;
const MAX_DOCUMENT_URL_LENGTH = 2048;

export default async function submitKYCApplication(req: Request): Promise<Response> {
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
  const expectedKycStatus = body.expected_kyc_status;
  const documentsInput = body.documents;
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';

  if (actor.role !== 'user') {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'kyc.documents.submit', applicationId || 'unknown', 'member_role_required', idempotencyKey,
    );
    return jsonResponse({ error: 'Only the authenticated member can submit their identity documents.', audit_recorded: auditRecorded }, 403);
  }
  if (!applicationId || applicationId.length > 128) return jsonResponse({ error: 'A valid application_id is required.' }, 400);
  if (expectedKycStatus !== 'not_started' && expectedKycStatus !== 'rejected') {
    return jsonResponse({ error: 'KYC documents can only be submitted for a not-started or rejected verification.' }, 409);
  }
  if (!Array.isArray(documentsInput) || documentsInput.length < 1 || documentsInput.length > MAX_KYC_DOCUMENTS) {
    return jsonResponse({ error: `documents must contain between 1 and ${MAX_KYC_DOCUMENTS} document URLs.` }, 400);
  }

  const documents: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < documentsInput.length; index += 1) {
    const value = documentsInput[index];
    if (typeof value !== 'string' || value.length > MAX_DOCUMENT_URL_LENGTH) {
      return jsonResponse({ error: `Document ${index + 1} has an invalid URL.` }, 400);
    }
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return jsonResponse({ error: `Document ${index + 1} has an invalid URL.` }, 400);
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.hash || seen.has(url.href)) {
      return jsonResponse({ error: `Document ${index + 1} must be a unique HTTPS upload URL without credentials or fragments.` }, 400);
    }
    seen.add(url.href);
    documents.push(url.href);
  }

  const command: Record<string, unknown> = {
    application_id: applicationId,
    expected_updated_date: body.expected_updated_date,
    expected_kyc_status: expectedKycStatus,
    documents,
    require_authoritative_application_lookup: true,
    require_actor_owns_application: true,
    require_member_role_on_application: true,
    require_application_revision_match: true,
    require_application_status_not_finalized: true,
    require_kyc_status_match: true,
    require_document_urls_owned_by_actor: true,
    require_document_urls_from_upload_provider: true,
    verify_document_mime_and_size_from_upload_metadata: true,
    max_documents: MAX_KYC_DOCUMENTS,
    replace_kyc_documents_atomically: true,
    set_kyc_status: 'pending',
    preserve_existing_kyc_notes_until_review: true,
    audit_action: 'kyc_documents_submitted',
    notification_outbox_required: true,
  };

  const outcome = await invokeAtomicMutationService('kyc.documents.submit', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'kyc.documents.submit', applicationId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'kyc.documents.submit', applicationId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedApplication = outcome.result.application;
  if (
    !savedApplication ||
    savedApplication.id !== applicationId ||
    savedApplication.user_id !== actor.id ||
    savedApplication.kyc_status !== 'pending' ||
    typeof savedApplication.updated_date !== 'string' ||
    !savedApplication.updated_date ||
    savedApplication.updated_date === body.expected_updated_date ||
    !Array.isArray(savedApplication.kyc_documents) ||
    savedApplication.kyc_documents.length !== documents.length ||
    documents.some((document, index) => savedApplication.kyc_documents?.[index] !== document)
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'kyc.documents.submit', applicationId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the owned KYC submission, uploaded document set, and audit record. Resolve the outcome using the same idempotency key before retrying.',
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
      kyc_documents: savedApplication.kyc_documents,
    },
  });
}
