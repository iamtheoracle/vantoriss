import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionApplication,
  isCorrectableTransactionStatus,
  isDateOnly,
  isValidOpeningBalance,
  isValidRevision,
  isUuid,
} from '../base44/shared/financialMutationRules.mjs';

test('accepts strict calendar dates and rejects impossible dates', () => {
  assert.equal(isDateOnly('2024-02-29'), true);
  assert.equal(isDateOnly('2026-10-17'), true);
  assert.equal(isDateOnly('2025-02-29'), false);
  assert.equal(isDateOnly('2026-13-01'), false);
  assert.equal(isDateOnly('2026-1-01'), false);
  assert.equal(isDateOnly('2026-10-17T00:00:00Z'), false);
});

test('requires UUID idempotency keys and bounded revision tokens', () => {
  assert.equal(isUuid('2c9d4f4e-31d7-4fd0-9c61-a6f7f4a26b22'), true);
  assert.equal(isUuid('not-a-uuid'), false);
  assert.equal(isValidRevision('2026-10-17T06:00:00.000Z'), true);
  assert.equal(isValidRevision(''), false);
  assert.equal(isValidRevision('x'.repeat(129)), false);
});

test('opening balances must be finite, non-negative, and exact to cents', () => {
  assert.equal(isValidOpeningBalance(0), true);
  assert.equal(isValidOpeningBalance(1200.25), true);
  assert.equal(isValidOpeningBalance(-1), false);
  assert.equal(isValidOpeningBalance(Number.NaN), false);
  assert.equal(isValidOpeningBalance(Number.POSITIVE_INFINITY), false);
  assert.equal(isValidOpeningBalance(1.001), false);
  assert.equal(isValidOpeningBalance('100'), false);
});

test('application decisions only transition from pending', () => {
  assert.equal(canTransitionApplication('pending', 'approved'), true);
  assert.equal(canTransitionApplication('pending', 'rejected'), true);
  assert.equal(canTransitionApplication('approved', 'approved'), false);
  assert.equal(canTransitionApplication('rejected', 'approved'), false);
  assert.equal(canTransitionApplication('pending', 'deleted'), false);
});

test('date correction only allows posted or reversed transactions', () => {
  assert.equal(isCorrectableTransactionStatus('completed'), true);
  assert.equal(isCorrectableTransactionStatus('reversed'), true);
  assert.equal(isCorrectableTransactionStatus('pending'), false);
  assert.equal(isCorrectableTransactionStatus('failed'), false);
});
