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
import { isUuid } from '../../shared/financialMutationRules.mjs';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export default async function createKYCUpload(req: Request): Promise<Response> {
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
  const fileName = typeof body.file_name === 'string' ? body.file_name.trim() : '';
  const contentType = body.content_type;
  const sizeBytes = body.size_bytes;
  const contentSha256 = typeof body.content_sha256 === 'string' ? body.content_sha256.toLowerCase() : '';
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';

  if (actor.role !== 'user') {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'kyc.document.upload_authorize', applicationId || 'unknown', 'member_role_required', idempotencyKey,
    );
    return jsonResponse({ error: 'Only the authenticated member can upload KYC documents.', audit_recorded: auditRecorded }, 403);
  }
  if (!applicationId || applicationId.length > 128) return jsonResponse({ error: 'A valid application_id is required.' }, 400);
  if (expectedKycStatus !== 'not_started' && expectedKycStatus !== 'rejected') {
    return jsonResponse({ error: 'KYC uploads are only available for not-started or rejected verification.' }, 409);
  }
  const hasUnsafeFilenameCharacters = fileName.includes('/') || fileName.includes('\\') || [...fileName].some(character => character.charCodeAt(0) < 32);
  if (!fileName || fileName.length > 255 || hasUnsafeFilenameCharacters) {
    return jsonResponse({ error: 'file_name must be a plain filename of at most 255 characters.' }, 400);
  }
  if (typeof contentType !== 'string' || !ALLOWED_CONTENT_TYPES.has(contentType)) {
    return jsonResponse({ error: 'Only PDF, JPEG, and PNG uploads are allowed.' }, 400);
  }
  if (!/^[a-f0-9]{64}$/.test(contentSha256)) return jsonResponse({ error: 'content_sha256 must be a SHA-256 hex digest.' }, 400);
  if (typeof sizeBytes !== 'number' || !Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_FILE_BYTES) {
    return jsonResponse({ error: 'File size must be between 1 byte and 25MB.' }, 400);
  }

  const outcome = await invokeAtomicMutationService('kyc.document.upload_authorize', actor, {
    application_id: applicationId,
    expected_updated_date: body.expected_updated_date,
    expected_kyc_status: expectedKycStatus,
    file_name: fileName,
    content_type: contentType,
    size_bytes: sizeBytes,
    content_sha256: contentSha256,
    bind_upload_signature_to_content_hash: true,
    require_authoritative_application_lookup: true,
    require_actor_owns_application: true,
    require_application_revision_match: true,
    require_kyc_status_match: true,
    require_private_document_storage: true,
    prohibit_public_read_access: true,
    require_short_lived_signed_upload_url: true,
    upload_url_ttl_seconds: 300,
    restrict_upload_content_type_and_size: true,
    require_uploaded_content_hash_match: true,
    create_upload_reservation_atomically: true,
    require_unique_document_ref: true,
    audit_action: 'kyc_document_upload_authorized',
    notification_outbox_required: false,
  }, idempotencyKey);

  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'kyc.document.upload_authorize', applicationId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'kyc.document.upload_authorize', applicationId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const uploadUrl = outcome.result.upload_url;
  const documentRef = outcome.result.document_ref;
  const expiresAt = outcome.result.expires_at;
  let parsedUrl: URL | null = null;
  try {
    if (typeof uploadUrl === 'string') parsedUrl = new URL(uploadUrl);
  } catch {
    parsedUrl = null;
  }
  const expiryMs = typeof expiresAt === 'string' ? Date.parse(expiresAt) : NaN;
  if (
    !parsedUrl ||
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.hash ||
    !isUuid(documentRef) ||
    outcome.result.content_sha256 !== contentSha256 ||
    typeof expiresAt !== 'string' ||
    !Number.isFinite(expiryMs) ||
    expiryMs <= Date.now() ||
    expiryMs > Date.now() + 10 * 60 * 1000 ||
    outcome.result.private_storage_confirmed !== true ||
    outcome.result.public_read_access !== false
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'kyc.document.upload_authorize', applicationId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The storage provider did not confirm a private, short-lived upload reservation. No document upload should proceed.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    upload_url: parsedUrl.href,
    document_ref: documentRef,
    expires_at: expiresAt,
    content_type: contentType,
    content_sha256: contentSha256,
    method: 'PUT',
  });
}
