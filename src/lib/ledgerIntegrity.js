const toCents = value => Math.round(Number(value) * 100);
const isFiniteNumber = value => value !== null && value !== undefined && Number.isFinite(Number(value));

export function findLedgerDiscrepancies(accounts = [], transactions = [], toleranceCents = 1) {
  const accountById = new Map(accounts.map(account => [account.id, account]));
  const grouped = new Map();

  for (const transaction of transactions) {
    if (
      transaction.status !== 'completed' ||
      transaction.source === 'historical_import' ||
      !transaction.account_id ||
      !isFiniteNumber(transaction.amount) ||
      !isFiniteNumber(transaction.balance_after) ||
      !accountById.has(transaction.account_id)
    ) continue;

    const rows = grouped.get(transaction.account_id) || [];
    rows.push(transaction);
    grouped.set(transaction.account_id, rows);
  }

  const issues = [];

  for (const account of accounts) {
    const rows = (grouped.get(account.id) || []).sort((a, b) => {
      const dateDiff = new Date(a.created_date || a.transaction_date || 0) - new Date(b.created_date || b.transaction_date || 0);
      return dateDiff || String(a.id).localeCompare(String(b.id));
    });

    for (let index = 1; index < rows.length; index += 1) {
      const previous = rows[index - 1];
      const current = rows[index];
      const expected = toCents(previous.balance_after) + toCents(current.amount);
      const actual = toCents(current.balance_after);
      if (Math.abs(expected - actual) > toleranceCents) {
        issues.push({
          key: `ledger-chain:${account.id}:${current.id}`,
          kind: 'Transaction balance mismatch',
          accountId: account.id,
          accountName: account.account_name || account.account_type || 'Member account',
          transactionId: current.id,
          expectedBalance: expected / 100,
          recordedBalance: actual / 100,
          detail: 'The recorded balance after this transaction does not equal the previous recorded balance plus this transaction amount.',
        });
      }
    }

    const latest = rows[rows.length - 1];
    if (latest && isFiniteNumber(account.balance)) {
      const expected = toCents(latest.balance_after);
      const actual = toCents(account.balance);
      if (Math.abs(expected - actual) > toleranceCents) {
        issues.push({
          key: `account-balance:${account.id}:${latest.id}:${actual}`,
          kind: 'Account balance discrepancy',
          accountId: account.id,
          accountName: account.account_name || account.account_type || 'Member account',
          transactionId: latest.id,
          expectedBalance: expected / 100,
          recordedBalance: actual / 100,
          detail: 'The current account balance differs from the latest completed ledger balance recorded for this account.',
        });
      }
    }
  }

  return issues;
}
