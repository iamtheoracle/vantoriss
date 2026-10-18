import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFile(path.join(root, relative), 'utf8');

test('package manifest dependency ranges match the lockfile root exactly', async () => {
  const manifest = JSON.parse(await read('package.json'));
  const lock = JSON.parse(await read('package-lock.json'));
  const lockedRoot = lock.packages?.[''];
  assert.equal(lock.lockfileVersion, 3);
  assert.ok(lockedRoot, 'package-lock.json must include the root package entry');
  assert.deepEqual(lockedRoot.dependencies || {}, manifest.dependencies || {});
  assert.deepEqual(lockedRoot.devDependencies || {}, manifest.devDependencies || {});
  assert.deepEqual(lockedRoot.optionalDependencies || {}, manifest.optionalDependencies || {});
});

test('application decisions no longer mutate financial entities from the browser', async () => {
  const source = await read('src/pages/admin/AdminApplications.jsx');
  const handler = source.slice(source.indexOf('async function reviewOneApplication'), source.indexOf('\n  if (loading) {'));
  assert.ok(handler.includes("base44.functions.invoke('reviewApplication'"));
  assert.ok(handler.includes('getMutationIdempotencyKey(operationScope)'));
  assert.ok(handler.includes('clearMutationIdempotencyKey(operationScope)'));
  assert.ok(!handler.includes('base44.entities.Application.update('));
  assert.ok(!handler.includes('base44.entities.Account.create('));
  assert.ok(!handler.includes('base44.entities.Transaction.create('));
  assert.ok(source.includes('Funds can be credited only through the separately verified funding workflow'));
});

test('transaction date correction cannot edit balances or transaction amounts from the browser', async () => {
  const source = await read('src/pages/admin/AdminAccounts.jsx');
  const start = source.indexOf('async function handleEditTransaction()');
  const end = source.indexOf('\n  function openEditTxn(', start);
  assert.ok(start >= 0 && end > start, 'date correction handler must exist');
  const handler = source.slice(start, end);
  assert.ok(handler.includes("base44.functions.invoke('correctTransactionDate'"));
  assert.ok(handler.includes('getMutationIdempotencyKey(operationScope)'));
  assert.ok(handler.includes('clearMutationIdempotencyKey(operationScope)'));
  assert.ok(!handler.includes('base44.entities.Transaction.update('));
  assert.ok(!handler.includes('base44.entities.Account.update('));
  assert.ok(source.includes('This workflow corrects the transaction date only.'));
});

test('server endpoints require authenticated roles, revision tokens, and atomic service confirmation', async () => {
  const review = await read('base44/functions/reviewApplication/entry.ts');
  const correction = await read('base44/functions/correctTransactionDate/entry.ts');
  for (const source of [review, correction]) {
    assert.ok(source.includes('base44.auth.me()'));
    assert.ok(source.includes('isAllowedFinancialRole(actor)'));
    assert.ok(source.includes('validateMutationEnvelope(body)'));
    assert.ok(source.includes('invokeAtomicMutationService('));
    assert.ok(source.includes('writeBlockedMutationAudit('));
  }
  assert.ok(review.includes("expected_application_status: 'pending'"));
  assert.ok(review.includes("required_kyc_status: decision === 'approved' ? 'approved' : undefined"));
  assert.ok(review.includes('disallowed_applicant_roles: ACCOUNT_HOLDER_BLOCKED_ROLES'));
  assert.ok(correction.includes("allowed_statuses: ['completed', 'reversed']"));
  assert.ok(correction.includes('expected_updated_date: expectedUpdatedDate'));
  assert.ok(correction.includes("allowed_fields: ['transaction_date']"));
});

test('bulk transaction imports cannot write ledger records outside the atomic service', async () => {
  const endpoint = await read('base44/functions/bulkImportTransactions/entry.ts');
  const ui = await read('src/pages/operations/BulkTransactionImport.jsx');
  for (const required of [
    'base44.auth.me()',
    'isAllowedFinancialRole(actor)',
    'isUuid(parsedBody.idempotency_key)',
    'validateAndNormalizeRows(parsedBody.transactions)',
    "invokeAtomicMutationService(",
    "'transactions.bulk_import'",
    'all_or_nothing: true',
    'prevent_negative_balances: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `bulk import boundary must include ${required}`);
  assert.ok(!endpoint.includes('entities.Transaction.create('));
  assert.ok(!endpoint.includes('entities.Account.update('));
  assert.ok(!endpoint.includes('entities.AuditLog.create('));
  assert.ok(ui.includes('fingerprintMutationScope(JSON.stringify(transactions))'));
  assert.ok(ui.includes('idempotency_key: idempotencyKey'));
  assert.ok(ui.includes('payload.operation_id !== idempotencyKey'));
  assert.ok(ui.includes("const VALID_TYPES = ['deposit', 'withdrawal']"));
});

test('funding review decisions cannot post credits or status changes from the browser', async () => {
  const endpoint = await read('base44/functions/reviewFundingRequest/entry.ts');
  const ui = await read('src/pages/operations/VerificationRequests.jsx');
  for (const required of [
    'base44.auth.me()',
    'isAllowedFinancialRole(actor)',
    'validateMutationEnvelope(body)',
    "invokeAtomicMutationService('funding.review'",
    "expected_request_status: 'pending'",
    'require_authoritative_request_lookup: true',
    'require_verified_funding_evidence: decision === \'approved\'',
    'prevent_negative_balances: true',
    'notification_outbox_required: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `funding review boundary must include ${required}`);
  assert.ok(!endpoint.includes('entities.VerificationRequest.update('));
  assert.ok(!endpoint.includes('entities.Transaction.create('));
  assert.ok(!endpoint.includes('entities.Account.update('));
  assert.ok(ui.includes("base44.functions.invoke('reviewFundingRequest'"));
  assert.ok(ui.includes('getMutationIdempotencyKey(operationScope)'));
  assert.ok(ui.includes('clearMutationIdempotencyKey(operationScope)'));
  const mutationUi = ui.slice(ui.indexOf('async function mutateFundingRequest'), ui.indexOf('if (loading)'));
  assert.ok(!mutationUi.includes('base44.entities.VerificationRequest.update('));
  assert.ok(!mutationUi.includes('base44.entities.Transaction.create('));
  assert.ok(!mutationUi.includes('base44.entities.Account.update('));
});

test('withdrawal settlement requires atomic payout confirmation and never writes balances from the browser', async () => {
  const endpoint = await read('base44/functions/processWithdrawalRequest/entry.ts');
  const ui = await read('src/pages/admin/AdminWithdrawals.jsx');
  for (const required of [
    'base44.auth.me()',
    'isAllowedFinancialRole(actor)',
    'validateMutationEnvelope(body)',
    "invokeAtomicMutationService('withdrawal.review'",
    "expected_request_status: 'pending'",
    'require_authoritative_request_lookup: true',
    "require_sufficient_available_funds: decision === 'paid'",
    "require_payout_confirmation: decision === 'paid'",
    'prevent_negative_balances: true',
    'notification_outbox_required: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `withdrawal boundary must include ${required}`);
  assert.ok(!endpoint.includes('entities.WithdrawalRequest.update('));
  assert.ok(!endpoint.includes('entities.Transaction.create('));
  assert.ok(!endpoint.includes('entities.Account.update('));
  assert.ok(ui.includes("base44.functions.invoke('processWithdrawalRequest'"));
  assert.ok(ui.includes('getMutationIdempotencyKey(operationScope)'));
  assert.ok(ui.includes('clearMutationIdempotencyKey(operationScope)'));
  assert.ok(ui.includes("payload?.request?.payout_confirmed !== true"));
  const mutationUi = ui.slice(ui.indexOf('async function mutateWithdrawalRequest'), ui.indexOf('function clearFilters()'));
  assert.ok(!mutationUi.includes('base44.entities.WithdrawalRequest.update('));
  assert.ok(!mutationUi.includes('base44.entities.Transaction.create('));
  assert.ok(!mutationUi.includes('base44.entities.Account.update('));
});


test('admin account transactions, freezes, and CSV imports cannot write ledger state directly from the browser', async () => {
  const ui = await read('src/pages/admin/AdminAccounts.jsx');
  const endpoint = await read('base44/functions/createAdminTransaction/entry.ts');
  for (const required of [
    "invokeAtomicMutationService('transaction.create_manual'",
    'require_authoritative_account_lookup: true',
    'require_account_revision_match: true',
    'require_account_active: true',
    'require_verified_funding_evidence: type === \'deposit\'',
    'require_sufficient_available_funds: type === \'withdrawal\'',
    'compute_balance_server_side: true',
    'never_trust_client_balance: true',
    'notification_outbox_required: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `admin transaction endpoint must include ${required}`);
  assert.ok(!endpoint.includes('entities.Transaction.create('));
  assert.ok(!endpoint.includes('entities.Account.update('));
  assert.ok(!endpoint.includes('entities.Notification.create('));
  assert.ok(ui.includes("base44.functions.invoke('createAdminTransaction'"));
  assert.ok(ui.includes("base44.functions.invoke('setAccountStatus'"));
  assert.ok(ui.includes("base44.functions.invoke('bulkImportTransactions'"));
  assert.ok(!ui.includes('base44.entities.Transaction.create('));
  assert.ok(!ui.includes('base44.entities.Account.update('));
  assert.ok(!ui.includes('base44.entities.Notification.create('));
  assert.ok(!ui.includes('base44.entities.Transaction.bulkCreate('));
  assert.ok(!ui.includes('base44.entities.Transaction.deleteMany('));
});

test('member withdrawal initiation uses an atomic ownership, balance, and audit boundary', async () => {
  const endpoint = await read('base44/functions/createWithdrawalRequest/entry.ts');
  const ui = await read('src/pages/AccountDetail.jsx');
  for (const required of [
    'base44.auth.me()',
    "actor.role !== 'user'",
    'validateMutationEnvelope(body)',
    "invokeAtomicMutationService('withdrawal.create'",
    'require_authoritative_account_lookup: true',
    'require_actor_owns_account: true',
    'require_account_revision_match: true',
    'require_account_active: true',
    'require_member_kyc_approved: true',
    'require_sufficient_available_funds: true',
    'include_pending_withdrawal_reservations: true',
    'enforce_authoritative_withdrawal_limits: true',
    'notification_outbox_required: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `withdrawal creation boundary must include ${required}`);
  assert.ok(!endpoint.includes('entities.WithdrawalRequest.create('));
  assert.ok(!endpoint.includes('entities.Notification.create('));
  const workflow = await read('.github/workflows/financial-mutation-quality.yml');
  const typeCheckCommand = workflow.split('\n').find(line => line.trim().startsWith('run: deno check')) || '';
  assert.ok(typeCheckCommand.includes('base44/functions/createWithdrawalRequest/entry.ts'), 'withdrawal endpoint must be type-checked in CI');
  const handler = ui.slice(ui.indexOf('async function handlePinVerified'), ui.indexOf('async function generateStatement'));
  assert.ok(handler.includes("base44.functions.invoke('createWithdrawalRequest'"));
  assert.ok(handler.includes('getMutationIdempotencyKey('));
  assert.ok(handler.includes('clearMutationIdempotencyKey('));
  assert.ok(!handler.includes('base44.entities.WithdrawalRequest.create('));
  assert.ok(!handler.includes('base44.entities.Notification.create('));
});



test('account status changes use an authenticated atomic boundary for operators and member self-freeze', async () => {
  const endpoint = await read('base44/functions/setAccountStatus/entry.ts');
  const quickActions = await read('src/components/vantoris/QuickActionsMenu.jsx');
  const commandDock = await read('src/components/vantoris/FloatingCommandDock.jsx');
  for (const required of [
    'base44.auth.me()',
    'validateMutationEnvelope(body)',
    "invokeAtomicMutationService('account.status_change'",
    'require_authoritative_account_lookup: true',
    'require_account_revision_match: true',
    'require_actor_owns_account: isSelfServiceFreeze',
    'allow_member_freeze_only: isSelfServiceFreeze',
    'notification_outbox_required: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `account status boundary must include ${required}`);
  assert.ok(endpoint.includes("actor.role === 'user' && targetStatus === 'frozen'"));
  assert.ok(quickActions.includes("base44.functions.invoke('setAccountStatus'"));
  assert.ok(commandDock.includes("base44.functions.invoke('setAccountStatus'"));
  const operatorHandler = quickActions.slice(
    quickActions.indexOf('async function mutateAccountStatus'),
    quickActions.indexOf('async function handleFreeze'),
  );
  const memberHandler = commandDock.slice(
    commandDock.indexOf('async function handleFreeze'),
    commandDock.indexOf('if (!user) return null;'),
  );
  for (const handler of [operatorHandler, memberHandler]) {
    assert.ok(handler.includes('getMutationIdempotencyKey('));
    assert.ok(handler.includes('clearMutationIdempotencyKey('));
    assert.ok(!handler.includes('base44.entities.Account.update('));
    assert.ok(!handler.includes('base44.entities.Transaction.create('));
    assert.ok(!handler.includes('base44.entities.Notification.create('));
    assert.ok(!handler.includes('logAuditEntry('));
  }
  assert.ok(!quickActions.includes('async function handleAdjustment'));
});


test('member account provisioning is atomic, zero-balance only, and member deletion cannot erase ledger history from the browser', async () => {
  const endpoint = await read('base44/functions/createMemberAccount/entry.ts');
  const ui = await read('src/pages/admin/AdminMembers.jsx');
  for (const required of [
    'base44.auth.me()',
    'isAllowedFinancialRole(actor)',
    'validateMutationEnvelope(body)',
    "invokeAtomicMutationService('account.create'",
    'require_authoritative_member_lookup: true',
    "require_target_member_role: 'user'",
    'require_target_member_revision_match: true',
    'generate_unique_account_number_server_side: true',
    'create_account_only_with_zero_balance: true',
    'notification_outbox_required: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `account provisioning boundary must include ${required}`);
  assert.ok(!endpoint.includes('entities.Account.create('));
  assert.ok(!endpoint.includes('entities.Transaction.create('));
  assert.ok(!endpoint.includes('entities.Notification.create('));
  assert.ok(ui.includes("base44.functions.invoke('createMemberAccount'"));
  assert.ok(ui.includes('getMutationIdempotencyKey('));
  assert.ok(ui.includes('clearMutationIdempotencyKey('));
  assert.ok(ui.includes('account?.balance !== 0'));
  assert.ok(!ui.includes('base44.entities.Account.create('));
  assert.ok(!ui.includes('base44.entities.Transaction.create('));
  assert.ok(!ui.includes('base44.entities.Transaction.deleteMany('));
  assert.ok(!ui.includes('base44.entities.Account.delete('));
  assert.ok(!ui.includes('base44.entities.User.delete('));
  assert.ok(!ui.includes('Opening Balance (USD)'));
  assert.ok(ui.includes('Deletion Unavailable'));
});


test('account detail freeze/unfreeze uses the shared revision-checked server boundary', async () => {
  const ui = await read('src/pages/AccountDetail.jsx');
  assert.ok(ui.includes("base44.functions.invoke('setAccountStatus'"));
  assert.ok(ui.includes('getMutationIdempotencyKey('));
  assert.ok(ui.includes('clearMutationIdempotencyKey('));
  assert.ok(ui.includes('expected_updated_date: account.updated_date'));
  assert.ok(ui.includes('payload?.audit_recorded !== true'));
  assert.ok(!ui.includes("base44.entities.Account.update(id, { status: account.status"));
});


test('historical statement import uses an atomic owner-scoped boundary and never mutates live balance from the browser', async () => {
  const endpoint = await read('base44/functions/importHistoricalStatement/entry.ts');
  const ui = await read('src/components/vantoris/HistoricalStatementImport.jsx');
  for (const required of [
    'base44.auth.me()',
    "actor.role !== 'user'",
    'isUuid(body.idempotency_key)',
    'isValidRevision(body.expected_updated_date)',
    "invokeAtomicMutationService('historical_statement.import'",
    'require_authoritative_account_lookup: true',
    'require_actor_owns_account: true',
    'resolve_idempotency_before_revision_check: true',
    'require_account_revision_match: true',
    'require_source_document_owned_by_actor: true',
    'require_source_document_url_from_upload_provider: true',
    'deduplicate_against_authoritative_history: true',
    'deduplicate_within_import: true',
    'historical_only: true',
    'never_modify_current_account_balance: true',
    'create_statement_transactions_document_atomically: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `historical import boundary must include ${required}`);
  assert.ok(!endpoint.includes('entities.HistoricalStatement.create('));
  assert.ok(!endpoint.includes('entities.Transaction.bulkCreate('));
  assert.ok(!endpoint.includes('entities.Document.create('));
  assert.ok(ui.includes("base44.functions.invoke('importHistoricalStatement'"));
  assert.ok(ui.includes('getMutationIdempotencyKey(operationScope)'));
  assert.ok(ui.includes('clearMutationIdempotencyKey(operationScope)'));
  assert.ok(ui.includes('result?.account_balance_modified !== false'));
  assert.ok(!ui.includes('base44.entities.HistoricalStatement.create('));
  assert.ok(!ui.includes('base44.entities.Transaction.bulkCreate('));
  assert.ok(!ui.includes('base44.entities.Document.create('));
});


test('HeroBox sponsorship cannot create requests or debit accounts directly from the browser', async () => {
  const endpoint = await read('base44/functions/createHeroBoxSponsorship/entry.ts');
  const ui = await read('src/components/vantoris/herobox/SponsorFlow.jsx');
  for (const required of [
    'base44.auth.me()',
    "actor.role !== 'user'",
    'isUuid(body.idempotency_key)',
    'isValidRevision(body.expected_updated_date)',
    "invokeAtomicMutationService('herobox.sponsor'",
    'require_authoritative_account_lookup: true',
    'require_actor_owns_account: true',
    'resolve_idempotency_before_revision_check: true',
    'require_account_revision_match: true',
    'require_account_active: true',
    'require_member_kyc_approved: true',
    'require_sufficient_available_funds: true',
    'compute_balance_server_side: true',
    'never_trust_client_balance_or_amount: true',
    'create_hero_box_request_atomically: true',
    'create_withdrawal_transaction_atomically: true',
    'create_hero_box_activity_atomically: true',
    'update_hero_box_profile_totals_atomically_if_present: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `HeroBox boundary must include ${required}`);
  for (const unsafe of [
    'entities.HeroBoxRequest.create(',
    'entities.Transaction.create(',
    'entities.Account.update(',
    'entities.HeroBoxActivity.create(',
    'entities.HeroBoxProfile.update(',
  ]) assert.ok(!endpoint.includes(unsafe), `endpoint must not use direct entity writes: ${unsafe}`);
  assert.ok(ui.includes("base44.functions.invoke('createHeroBoxSponsorship'"));
  assert.ok(ui.includes('getMutationIdempotencyKey(operationScope)'));
  assert.ok(ui.includes('clearMutationIdempotencyKey(operationScope)'));
  for (const unsafe of [
    'base44.entities.HeroBoxRequest.create(',
    'base44.entities.Transaction.create(',
    'base44.entities.Account.update(',
    'base44.entities.HeroBoxActivity.create(',
    'base44.entities.HeroBoxProfile.update(',
  ]) assert.ok(!ui.includes(unsafe), `browser must not use direct entity writes: ${unsafe}`);
});


test('investment portfolio creation cannot set ownership or balances from the browser', async () => {
  const endpoint = await read('base44/functions/createInvestmentPortfolio/entry.ts');
  const ui = await read('src/pages/Investment.jsx');
  for (const required of [
    'base44.auth.me()',
    "actor.role !== 'user'",
    'isUuid(parsed.idempotency_key)',
    "invokeAtomicMutationService('investment.portfolio.create'",
    'require_authoritative_actor_lookup: true',
    'require_member_role: true',
    'require_actor_owns_created_portfolio: true',
    'enforce_one_portfolio_per_member: true',
    'initial_cash_balance: 0',
    'initial_invested_amount: 0',
    'create_portfolio_and_audit_atomically: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `investment portfolio boundary must include ${required}`);
  assert.ok(!endpoint.includes('entities.InvestmentPortfolio.create('));
  assert.ok(ui.includes("base44.functions.invoke('createInvestmentPortfolio'"));
  assert.ok(ui.includes('getMutationIdempotencyKey('));
  assert.ok(ui.includes('result?.audit_recorded !== true'));
  assert.ok(!ui.includes('base44.entities.InvestmentPortfolio.create('));
});

test('investment deposit and withdrawal requests are owner-scoped, revision-checked, and cannot change balances directly', async () => {
  const endpoint = await read('base44/functions/createInvestmentRequest/entry.ts');
  const ui = await read('src/pages/Investment.jsx');
  for (const required of [
    'base44.auth.me()',
    "actor.role !== 'user'",
    'isUuid(body.idempotency_key)',
    'isValidRevision(body.expected_updated_date)',
    "invokeAtomicMutationService(action",
    'require_authoritative_portfolio_lookup: true',
    'require_actor_owns_portfolio: true',
    'require_portfolio_revision_match: true',
    'require_idempotency_resolution_before_revision_check: true',
    'never_update_portfolio_balances_for_request_creation: true',
    'never_trust_client_user_id_or_portfolio_balance: true',
    'require_connected_authoritative_investment_provider',
    'require_sufficient_available_cash_after_pending_withdrawal_reservations',
    'command.reserve_withdrawal_amount_atomically = true;',
    'command.never_transfer_funds_during_request_creation = true;',
    'command.never_credit_portfolio_during_request_creation = true;',
    'notification_outbox_required: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `investment request boundary must include ${required}`);
  assert.ok(!endpoint.includes('entities.InvestmentDepositRequest.create('));
  assert.ok(!endpoint.includes('entities.InvestmentWithdrawalRequest.create('));
  assert.ok(!endpoint.includes('entities.InvestmentPortfolio.update('));
  assert.ok(ui.includes("base44.functions.invoke('createInvestmentRequest'"));
  assert.ok(ui.includes('getMutationIdempotencyKey('));
  assert.ok(ui.includes('clearMutationIdempotencyKey('));
  assert.ok(ui.includes('disabled={submitting || !portfolio.provider_connected}'));
  assert.ok(!ui.includes('base44.entities.InvestmentDepositRequest.create('));
  assert.ok(!ui.includes('base44.entities.InvestmentWithdrawalRequest.create('));
  assert.ok(!ui.includes('base44.entities.InvestmentPortfolio.create('));
});


test('HeroBox donations cannot mutate cases or create orders through separate browser writes', async () => {
  const endpoint = await read('base44/functions/createHeroBoxDonation/entry.ts');
  const ui = await read('src/components/vantoris/herobox/DonationFlow.jsx');
  const schema = await read('base44/entities/HeroBoxOrder.jsonc');
  for (const required of [
    'base44.auth.me()',
    "actor.role !== 'user'",
    'isUuid(body.idempotency_key)',
    "invokeAtomicMutationService('herobox.donation.create'",
    'require_authoritative_case_lookup_when_selected: true',
    'require_case_revision_match_when_selected: true',
    "require_case_review_status_approved_when_selected: true",
    'require_case_category_match_when_selected: category !== \'general\'',
    'never_trust_client_case_details: true',
    'create_hero_box_order_atomically: true',
    "order_status: 'payment_pending'",
    "payment_status: 'pending'",
    'never_mark_donation_paid: true',
    'no_funds_moved_during_order_creation: true',
    'update_case_match_atomically_if_selected: true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `donation boundary must include ${required}`);
  assert.ok(schema.includes('"humanitarian_case_id"'));
  assert.ok(schema.includes('"order_type"'));
  assert.ok(!endpoint.includes('entities.HeroBoxOrder.create('));
  assert.ok(!endpoint.includes('entities.HumanitarianCase.update('));
  assert.ok(ui.includes("base44.functions.invoke('createHeroBoxDonation'"));
  assert.ok(ui.includes('getMutationIdempotencyKey(operationScope)'));
  assert.ok(ui.includes('clearMutationIdempotencyKey(operationScope)'));
  assert.ok(ui.includes('result?.funds_moved !== false'));
  assert.ok(!ui.includes('base44.entities.HeroBoxOrder.create('));
  assert.ok(!ui.includes('base44.entities.HumanitarianCase.update('));
});


test('investment approvals cannot update portfolios or create transactions directly from the browser', async () => {
  const endpoint = await read('base44/functions/reviewInvestmentRequest/entry.ts');
  const deposits = await read('src/pages/operations/InvestmentDeposits.jsx');
  const withdrawals = await read('src/pages/operations/InvestmentWithdrawals.jsx');
  for (const required of [
    'base44.auth.me()',
    'isAllowedFinancialRole(actor)',
    'validateMutationEnvelope(body)',
    'invokeAtomicMutationService(action',
    'require_authoritative_request_lookup: true',
    'require_authoritative_portfolio_lookup: true',
    'require_request_owner_and_portfolio_consistency: true',
    'require_request_revision_match: true',
    'require_portfolio_revision_check_inside_transaction: true',
    'require_idempotency_resolution_before_revision_check: true',
    'update_request_portfolio_ledger_and_audit_atomically: true',
    'command.require_verified_funding_evidence = isApproval;',
    'command.require_payout_confirmation = isApproval;',
    'command.consume_existing_withdrawal_reservation_atomically = isApproval;',
    'command.release_withdrawal_reservation_atomically = !isApproval;',
    'never_mark_withdrawal_paid_without_provider_confirmation = true',
    'writeBlockedMutationAudit(',
    'writeUncertainMutationAudit(',
  ]) assert.ok(endpoint.includes(required), `investment review boundary must include ${required}`);
  for (const unsafe of [
    'entities.InvestmentDepositRequest.update(',
    'entities.InvestmentWithdrawalRequest.update(',
    'entities.InvestmentPortfolio.update(',
    'entities.InvestmentTransaction.create(',
  ]) assert.ok(!endpoint.includes(unsafe), `endpoint must not use direct entity writes: ${unsafe}`);
  for (const ui of [deposits, withdrawals]) {
    assert.ok(ui.includes("base44.functions.invoke('reviewInvestmentRequest'"));
    assert.ok(ui.includes('getMutationIdempotencyKey('));
    assert.ok(ui.includes('clearMutationIdempotencyKey('));
    for (const unsafe of [
      'base44.entities.InvestmentDepositRequest.update(',
      'base44.entities.InvestmentWithdrawalRequest.update(',
      'base44.entities.InvestmentPortfolio.update(',
      'base44.entities.InvestmentTransaction.create(',
    ]) assert.ok(!ui.includes(unsafe), `investment review UI must not use direct entity writes: ${unsafe}`);
  }
});
