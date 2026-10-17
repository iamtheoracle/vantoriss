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
  assert.ok(review.includes('canTransitionApplication(application.application_status, decision)'));
  assert.ok(review.includes("application.kyc_status !== 'approved'"));
  assert.ok(correction.includes('isCorrectableTransactionStatus(transaction.status)'));
  assert.ok(correction.includes("allowed_fields: ['transaction_date']"));
});
