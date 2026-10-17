import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isAllowedFinancialRole,
  jsonResponse,
  validateMutationEnvelope,
  writeBlockedMutationAudit,
} from '../../shared/financialMutationGateway.ts';
import { isValidOpeningBalance } from '../../shared/financialMutationRules.mjs';

const ACCOUNT_HOLDER_BLOCKED_ROLES = [
  'admin', 'administrator', 'executive', 'operations_manager',
  'operations_officer', 'finance_officer', 'treasury_officer',
  'compliance_officer', 'kyc_officer', 'auditor', 'it_administrator',
  'risk_officer', 'customer_support', 'herobox_manager', 'volunteer_manager',
  'shipping_manager', 'investment_manager', 'investment_officer',
  'super_administrator',
];

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


  const command = {
    application_id: applicationId,
    decision,
    admin_notes: adminNotes,
    opening_balance: 0,
    expected_application_status: 'pending',
    expected_updated_date: body.expected_updated_date,
    required_kyc_status: decision === 'approved' ? 'approved' : undefined,
    disallowed_applicant_roles: ACCOUNT_HOLDER_BLOCKED_ROLES,
    audit_action: decision === 'approved' ? 'application_approved' : 'application_rejected',
  };

  const outcome = await invokeAtomicMutationService('application.review', actor, command, body.idempotency_key);
  if (!outcome.ok) {
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'application.review', applicationId, outcome.code, body.idempotency_key,
    );
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedApplication = outcome.result.application;
  const savedAccount = outcome.result.account;
  if (savedApplication?.id !== applicationId || savedApplication.application_status !== decision || !savedApplication.updated_date) {
    return jsonResponse({
      error: 'The transactional service did not confirm the requested application state.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
    }, 502);
  }
  if (decision === 'approved' && !savedAccount?.id) {
    return jsonResponse({
      error: 'The transactional service did not confirm account creation.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: body.idempotency_key,
    application: {
      id: savedApplication.id,
      application_status: savedApplication.application_status,
      updated_date: savedApplication.updated_date,
    },
    account: savedAccount ? {
      id: savedAccount.id,
      account_number: savedAccount.account_number,
      account_type: savedAccount.account_type,
      balance: savedAccount.balance,
      status: savedAccount.status,
    } : null,
    audit_recorded: true,
  });
}
