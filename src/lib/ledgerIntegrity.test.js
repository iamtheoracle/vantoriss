import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMonthlyReporting } from './monthlyReporting.js';
import { findLedgerDiscrepancies } from './ledgerIntegrity.js';

test('monthly reporting counts new accounts and completed investment volume by month', () => {
  const now = new Date('2026-11-09T12:00:00Z');
  const rows = buildMonthlyReporting(
    [{ created_date: '2026-11-02T10:00:00Z' }, { created_date: '2026-10-10T10:00:00Z' }],
    [
      { status: 'completed', amount: 125, transaction_date: '2026-11-04' },
      { status: 'pending', amount: 500, transaction_date: '2026-11-05' },
      { status: 'completed', amount: -25, transaction_date: '2026-10-05' },
    ],
    now,
  );
  assert.equal(rows.at(-1).newAccounts, 1);
  assert.equal(rows.at(-1).investmentVolume, 125);
  assert.equal(rows.at(-2).newAccounts, 1);
  assert.equal(rows.at(-2).investmentVolume, 25);
});

test('ledger monitor detects a transaction balance-chain mismatch', () => {
  const issues = findLedgerDiscrepancies(
    [{ id: 'a1', account_name: 'Checking', balance: 140 }],
    [
      { id: 't1', account_id: 'a1', status: 'completed', amount: 100, balance_after: 100, created_date: '2026-11-01T10:00:00Z' },
      { id: 't2', account_id: 'a1', status: 'completed', amount: 50, balance_after: 140, created_date: '2026-11-02T10:00:00Z' },
    ],
  );
  assert.equal(issues.length, 1);
  assert.equal(issues[0].kind, 'Transaction balance mismatch');
});

test('ledger monitor ignores pending and historical-import rows', () => {
  const issues = findLedgerDiscrepancies(
    [{ id: 'a1', balance: 100 }],
    [
      { id: 't1', account_id: 'a1', status: 'completed', source: 'historical_import', amount: 100, balance_after: 90 },
      { id: 't2', account_id: 'a1', status: 'pending', amount: 10, balance_after: 100 },
    ],
  );
  assert.deepEqual(issues, []);
});
