// Base44 server functions require pinned npm: imports.
// deno-lint-ignore no-import-prefix
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  invokeAtomicMutationService,
  isRecord,
  jsonResponse,
  writeBlockedMutationAudit,
  writeUncertainMutationAudit,
  type AuthenticatedActor,
  type Base44AuditClient,
} from '../../shared/financialMutationGateway.ts';
import { isUuid, isValidRevision } from '../../shared/financialMutationRules.mjs';

type Base44Client = ReturnType<typeof createClientFromRequest> & Base44AuditClient;

const SPONSOR_PACKAGES = Object.freeze({
  essential: { name: 'Essential Hero Package', description: 'Core care supplies for deployed service members', amount: 50, request_type: 'care_package' },
  premium: { name: 'Premium Care Package', description: 'Premium comfort items and personal care', amount: 100, request_type: 'care_package' },
  internet: { name: 'Internet Sponsorship', description: 'Monthly internet access for a hero', amount: 30, request_type: 'internet_support' },
  communication: { name: 'Communication Services', description: 'Phone cards and data for staying connected', amount: 25, request_type: 'communication_services' },
  assistance: { name: 'Financial Assistance', description: 'Direct support for a military family in need', amount: 75, request_type: 'financial_assistance' },
});

export default async function createHeroBoxSponsorship(req: Request): Promise<Response> {
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
  if (!isUuid(body.idempotency_key)) return jsonResponse({ error: 'A valid UUID idempotency_key is required.' }, 400);
  if (!isValidRevision(body.expected_updated_date)) return jsonResponse({ error: 'expected_updated_date is required.' }, 400);

  const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key : '';
  const accountId = typeof body.account_id === 'string' ? body.account_id.trim() : '';
  const packageId = typeof body.package_id === 'string' ? body.package_id : '';
  const recipientName = typeof body.recipient_name === 'string' ? body.recipient_name.trim() : 'General Fund';
  if (actor.role !== 'user') {
    await writeBlockedMutationAudit(base44, actor, 'herobox.sponsor', accountId || 'unknown', 'member_role_required', idempotencyKey);
    return jsonResponse({ error: 'Only an authenticated member can sponsor a HeroBox package.' }, 403);
  }
  if (!accountId || accountId.length > 128) return jsonResponse({ error: 'A valid account_id is required.' }, 400);
  if (!Object.hasOwn(SPONSOR_PACKAGES, packageId)) return jsonResponse({ error: 'A supported sponsorship package is required.' }, 400);
  if (recipientName.length > 200) return jsonResponse({ error: 'recipient_name must be 200 characters or fewer.' }, 400);

  const packageDetails = SPONSOR_PACKAGES[packageId as keyof typeof SPONSOR_PACKAGES];
  const expectedProfileUpdatedDate = body.expected_profile_updated_date;
  if (expectedProfileUpdatedDate !== undefined && expectedProfileUpdatedDate !== null &&
      !isValidRevision(expectedProfileUpdatedDate)) {
    return jsonResponse({ error: 'expected_profile_updated_date must be a valid revision token.' }, 400);
  }

  const command: Record<string, unknown> = {
    account_id: accountId,
    expected_updated_date: body.expected_updated_date,
    package_id: packageId,
    package: packageDetails,
    recipient_name: recipientName || 'General Fund',
    expected_profile_updated_date: expectedProfileUpdatedDate || null,
    require_authoritative_account_lookup: true,
    require_actor_owns_account: true,
    require_account_revision_match: true,
    require_account_active: true,
    require_member_kyc_approved: true,
    require_sufficient_available_funds: true,
    compute_balance_server_side: true,
    never_trust_client_balance_or_amount: true,
    create_hero_box_request_atomically: true,
    create_withdrawal_transaction_atomically: true,
    create_hero_box_activity_atomically: true,
    update_hero_box_profile_totals_atomically_if_present: true,
    require_authoritative_profile_lookup: true,
    require_profile_owner_is_actor: true,
    require_profile_revision_match_when_supplied: true,
    audit_action: 'herobox_sponsorship_completed',
    notification_outbox_required: true,
  };

  const outcome = await invokeAtomicMutationService('herobox.sponsor', actor, command, idempotencyKey);
  if (!outcome.ok) {
    const uncertain = outcome.code === 'ATOMIC_MUTATION_OUTCOME_UNKNOWN' || outcome.code === 'ATOMIC_MUTATION_CONTRACT_VIOLATION';
    const auditRecorded = uncertain
      ? await writeUncertainMutationAudit(base44, actor, 'herobox.sponsor', accountId, outcome.code, idempotencyKey)
      : await writeBlockedMutationAudit(base44, actor, 'herobox.sponsor', accountId, outcome.code, idempotencyKey);
    return jsonResponse({ error: outcome.message, code: outcome.code, audit_recorded: auditRecorded }, outcome.status);
  }

  const savedRequest = outcome.result.heroBoxRequest;
  const transaction = outcome.result.transaction;
  const account = outcome.result.account;
  const activity = outcome.result.heroBoxActivity;
  if (!savedRequest || typeof savedRequest.id !== 'string' ||
      savedRequest.user_id !== actor.id || savedRequest.account_id !== accountId ||
      savedRequest.status !== 'pending' || savedRequest.amount !== packageDetails.amount ||
      !transaction || transaction.account_id !== accountId ||
      transaction.type !== 'withdrawal' || transaction.amount !== packageDetails.amount ||
      !account || account.id !== accountId ||
      typeof account.balance !== 'number' || !Number.isFinite(account.balance) ||
      !activity || activity.user_id !== actor.id || activity.status !== 'completed') {
    const auditRecorded = await writeUncertainMutationAudit(
      base44, actor, 'herobox.sponsor', accountId, 'ATOMIC_MUTATION_CONTRACT_VIOLATION', idempotencyKey,
    );
    return jsonResponse({
      error: 'The transactional service did not confirm the sponsorship, ledger entry, account revision, and audit record. Resolve the outcome using the same idempotency key before retrying.',
      code: 'ATOMIC_MUTATION_CONTRACT_VIOLATION',
      audit_recorded: auditRecorded,
    }, 502);
  }

  return jsonResponse({
    success: true,
    operation_id: idempotencyKey,
    audit_recorded: true,
    sponsorship_id: savedRequest.id,
    account: { id: account.id, balance: account.balance, updated_date: account.updated_date },
    amount: packageDetails.amount,
  });
}
