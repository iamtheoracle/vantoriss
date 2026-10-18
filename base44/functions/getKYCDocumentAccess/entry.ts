// Base44 server functions require pinned npm: imports.
// deno-lint-ignore no-import-prefix
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isTrustedPrivateStorageUrl,
  isAllowedFinancialRole,
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

export default async function getKYCDocumentAccess(req: Request): Promise<Response> {
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
  const documentLocator = typeof body.document_locator === 'string' ? body.document_locator.trim() : '';
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';
  if (!isAllowedFinancialRole(actor)) {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'kyc.document.view', applicationId || 'unknown', 'role_not_authorized', idempotencyKey,
    );
    return jsonResponse({ error: 'You are not authorized to view KYC documents.', audit_recorded: auditRecorded }, 403);
  }
  if (!applicationId || applicationId.length > 128) return jsonResponse({ error: 'A valid application_id is required.' }, 400);
  if (!documentLocator || documentLocator.length > 2048) return jsonResponse({ error: 'A valid document locator is required.' }, 400);

  const isLegacyUrl = !isUuid(documentLocator);
  if (isLegacyUrl) {
    try {
      const legacyUrl = new URL(documentLocator);
      if (legacyUrl.protocol !== 'https:' || legacyUrl.username || legacyUrl.password || legacyUrl.hash) {
        throw new Error('unsafe URL');
      }
    } catch {
      return jsonResponse({ error: 'Document locator must be a private document reference or valid HTTPS legacy URL.' }, 400);
    }
  }

  const outcome = await invokeAtomicMutationService('kyc.document.view_authorize', actor, {
    application_id: applicationId,
    document_locator: documentLocator,
    legacy_url_migration_path: isLegacyUrl,
    expected_updated_date: body.expected_updated_date,
    require_authoritative_application_lookup: true,
    require_authorized_reviewer: true,
    require_application_revision_match: true,
    require_document_belongs_to_application: true,
    require_private_document_storage: true,
    prohibit_public_read_access: true,
    require_legacy_url_mapped_to_private_owned_object_when_legacy: true,
    issue_short_lived_signed_view_url: true,
    view_url_ttl_seconds: 60,
    audit_action: 'kyc_document_view_authorized',
    notification_outbox_required: false,
  }, idempotencyKey);

  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'kyc.document.view', applicationId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'kyc.document.view', applicationId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const viewUrl = outcome.result.view_url;
  const expiresAt = outcome.result.expires_at;
  let parsedUrl: URL | null = null;
  try {
    if (typeof viewUrl === 'string') parsedUrl = new URL(viewUrl);
  } catch {
    parsedUrl = null;
  }
  const expiryMs = typeof expiresAt === 'string' ? Date.parse(expiresAt) : NaN;
  if (
    !parsedUrl ||
    !isTrustedPrivateStorageUrl(viewUrl) ||
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.hash ||
    !Number.isFinite(expiryMs) ||
    expiryMs <= Date.now() ||
    expiryMs > Date.now() + 5 * 60 * 1000 ||
    outcome.result.private_storage_confirmed !== true ||
    outcome.result.public_read_access !== false
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'kyc.document.view', applicationId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The storage provider did not confirm a private, short-lived document view URL.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    view_url: parsedUrl.href,
    expires_at: expiresAt,
  });
}
