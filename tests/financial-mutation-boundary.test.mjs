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
