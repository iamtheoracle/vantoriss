import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isAllowedFinancialRole,
  jsonResponse,
  validateMutationEnvelope,
  writeBlockedMutationAudit,
} from '../../shared/financialMutationGateway.ts';
import {
  canTransitionApplication,
  isValidOpeningBalance,
} from '../../shared/financialMutationRules.mjs';

const ACCOUNT_HOLDER_BLOCKED_ROLES = new Set([
  'admin', 'administrator', 'executive', 'operations_manager',
  'operations_officer', 'finance_officer', 'treasury_officer',
  'compliance_officer', 'kyc_officer', 'auditor', 'it_administrator',
  'risk_officer', 'customer_support', 'herobox_manager', 'volunteer_manager',
  'shipping_manager', 'investment_manager', 'investment_officer',
  'super_administrator',
]);

export default async function reviewApplication(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  let base44: any;
  let actor: any;
  try {
    base44 = createClientFromRequest(req);
    actor = await base44.auth.me();
  } catch {
    return jsonResponse({ error: 'Authentication could not be verified.' }, 401);
  }
  if (!actor?.id) return jsonResponse({ error: 'Authentication required.' }, 401);

  if (!isAllowedFinancialRole(actor)) {
    await writeBlockedMutationAudit(base44, actor, 'application.review', 'unknown', 'role_not_authorized');
    return jsonResponse({ error: 'You are not authorized to review applications.' }, 403);
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ error: 'A valid JSON object is required.' }, 400);
  }

  const envelopeError = validateMutationEnvelope(body);
  if (envelopeError) return jsonResponse({ error: envelopeError }, 400);

  const applicationId = typeof body.application_id === 'string' ? body.application_id.trim() : '';
  const decision = body.decision;
  const adminNotes = typeof body.admin_notes === 'string' ? body.admin_notes.trim() : '';
  const openingBalance = body.opening_balance ?? 0;

  if (!applicationId || applicationId.length > 128) {
    return jsonResponse({ error: 'A valid application_id is required.' }, 400);
  }
  if (decision !== 'approved' && decision !== 'rejected') {
    return jsonResponse({ error: 'decision must be approved or rejected.' }, 400);
  }
  if (adminNotes.length > 2000) {
    return jsonResponse({ error: 'admin_notes must be 2,000 characters or fewer.' }, 400);
  }
  if (!isValidOpeningBalance(openingBalance)) {
    return jsonResponse({ error: 'opening_balance must be a non-negative amount with at most two decimal places.' }, 400);
  }
  // Do not mint funds from an operator-entered application form. Positive
  // credits must pass through a separately verified funding workflow.
  if (openingBalance !== 0) {
    return jsonResponse({
      error: 'Opening balances cannot be credited during application approval. Use the verified funding workflow.',
      code: 'VERIFIED_FUNDING_REQUIRED',
    }, 422);
  }

  let application: any;
  try {
    application = await base44.asServiceRole.entities.Application.get(applicationId);
  } catch {
    return jsonResponse({ error: 'Application could not be loaded.' }, 404);
  }
  if (!application?.id) return jsonResponse({ error: 'Application not found.' }, 404);

  if (!canTransitionApplication(application.application_status, decision)) {
    await writeBlockedMutationAudit(base44, actor, 'application.review', applicationId, 'transition_not_permitted', body.idempotency_key);
    return jsonResponse({
      error: 'Only pending applications can be approved or rejected.',
      code: 'INVALID_STATE_TRANSITION',
    }, 409);
  }
  if (!application.updated_date || application.updated_date !== body.expected_updated_date) {
    await writeBlockedMutationAudit(base44, actor, 'application.review', applicationId, 'revision_mismatch', body.idempotency_key);
    return jsonResponse({
      error: 'The application changed since it was loaded. Reload and review it before retrying.',
      code: 'REVISION_CONFLICT',
    }, 409);
  }
  if (decision === 'approved' && application.kyc_status !== 'approved') {
    await writeBlockedMutationAudit(base44, actor, 'application.review', applicationId, 'kyc_not_approved', body.idempotency_key);
    return jsonResponse({
      error: 'Identity verification must be approved before the application can be approved.',
      code: 'KYC_APPROVAL_REQUIRED',
    }, 422);
  }

  let applicant: any;
  try {
    applicant = await base44.asServiceRole.entities.User.get(application.user_id);
  } catch {
    return jsonResponse({ error: 'Applicant record could not be verified.' }, 503);
  }
  if (!applicant?.id) return jsonResponse({ error: 'Applicant record could not be verified.' }, 422);
  if (ACCOUNT_HOLDER_BLOCKED_ROLES.has(applicant.role)) {
    await writeBlockedMutationAudit(base44, actor, 'application.review', applicationId, 'applicant_role_ineligible', body.idempotency_key);
    return jsonResponse({ error: 'This applicant role is not eligible to hold a member account.' }, 422);
  }

  const command = {
    application_id: applicationId,
    decision,
    admin_notes: adminNotes,
    opening_balance: 0,
    target_user_id: application.user_id,
    account_type: application.account_type,
    expected_application_status: 'pending',
    expected_updated_date: application.updated_date,
    required_kyc_status: decision === 'approved' ? 'approved' : undefined,
    audit_action: decision === 'approved' ? 'application_approved' : 'application_rejected',
  };

  const outcome = await invokeAtomicMutationService('application.review', actor, command, body.idempotency_key);
  if (!outcome.ok) {
    if (outcome.status === 503) {
      const auditRecorded = await writeBlockedMutationAudit(
        base44, actor, 'application.review', applicationId, outcome.code, body.idempotency_key,
      );
      return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
    }
    return jsonResponse({ error: outcome.message, code: outcome.code }, outcome.status);
  }

  return jsonResponse({
    success: true,
    operation_id: body.idempotency_key,
    application: outcome.result.application,
    account: outcome.result.account,
    audit_recorded: true,
  });
}
