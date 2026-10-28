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
import { isValidOpeningBalance } from '../../shared/financialMutationRules.mjs';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;

const ACCOUNT_HOLDER_BLOCKED_ROLES = [
  'admin', 'administrator', 'executive', 'operations_manager',
  'operations_officer', 'finance_officer', 'treasury_officer',
  'compliance_officer', 'kyc_officer', 'auditor', 'it_administrator',
  'risk_officer', 'customer_support', 'herobox_manager', 'volunteer_manager',
  'shipping_manager', 'investment_manager', 'investment_officer',
  'super_administrator',
];

export default async function reviewApplication(req: Request): Promise<Response> {
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
    await writeBlockedMutationAudit(base44, actor, 'application.review', 'unknown', 'role_not_authorized');
    return jsonResponse({ error: 'You are not authorized to review applications.' }, 403);
  }

  const parsedBody: unknown = await req.json().catch(() => null);
  if (!isRecord(parsedBody)) return jsonResponse({ error: 'A valid JSON object is required.' }, 400);
  const body = parsedBody;

  const envelopeError = validateMutationEnvelope(body);
  if (envelopeError) return jsonResponse({ error: envelopeError }, 400);
  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';
  const expectedUpdatedDate = typeof body.expected_updated_date === 'string' ? body.expected_updated_date : '';

  const applicationId = typeof body.application_id === 'string' ? body.application_id.trim() : '';
  const decision = body.decision;
  const adminNotes = typeof body.admin_notes === 'string' ? body.admin_notes.trim() : '';
  const openingBalance: unknown = body.opening_balance ?? 0;

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
    const auditRecorded = await writeBlockedMutationAudit(
      base44, actor, 'application.review', applicationId, 'VERIFIED_FUNDING_REQUIRED', idempotencyKey,
    );
    return jsonResponse({
      error: 'Opening balances cannot be credited during application approval. Use the verified funding workflow.',
      code: 'VERIFIED_FUNDING_REQUIRED',
      audit_recorded: auditRecorded,
    }, 422);
  }

  // The atomic service must look up the application and applicant itself, check
  // the current revision/state/KYC/role inside its transaction, then write the
  // application, account, audit, and any notification outbox as one commit.
  const command: Record<string, unknown> = {
    application_id: applicationId,
    decision,
    admin_notes: adminNotes,
    opening_balance: 0,
    expected_application_status: 'pending',
    expected_updated_date: expectedUpdatedDate,
    required_kyc_status: decision === 'approved' ? 'approved' : undefined,
    disallowed_applicant_roles: ACCOUNT_HOLDER_BLOCKED_ROLES,
    audit_action: decision === 'approved' ? 'application_approved' : 'application_rejected',
  };

  const outcome = await invokeAtomicMutationService('application.review', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const isUncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' ||
      outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = isUncertain
      ? await writeUncertainMutationAudit(base44, actor, 'application.review', applicationId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'application.review', applicationId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedApplication = outcome.result.application;
  const savedAccount = outcome.result.account;
  if (
    savedApplication?.id !== applicationId ||
    savedApplication.application_status !== decision ||
    typeof savedApplication.updated_date !== 'string' ||
    savedApplication.updated_date === expectedUpdatedDate
  ) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'application.review', applicationId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the requested application state. Resolve the outcome with the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }
  if ((decision === 'approved' && !savedAccount?.id) || (decision === 'rejected' && savedAccount?.id)) {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'application.review', applicationId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the expected account side effects. Resolve the outcome with the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    application: {
      id: savedApplication.id,
      application_status: savedApplication.application_status,
      updated_date: savedApplication.updated_date,
    },
    account: decision === 'approved' && savedAccount ? {
      id: savedAccount.id,
      account_number: savedAccount.account_number,
      account_type: savedAccount.account_type,
      balance: savedAccount.balance,
      status: savedAccount.status,
    } : null,
    audit_recorded: true,
  });
}
