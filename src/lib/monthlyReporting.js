const pad = value => String(value).padStart(2, '0');

function monthKey(value) {
  if (!value) return null;
  const dateOnly = typeof value === 'string' ? value.match(/^(\\d{4})-(\\d{2})/) : null;
  if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
}

export function buildMonthlyReporting(accounts = [], investmentTransactions = [], now = new Date()) {
  const months = [];
  const indexByKey = new Map();

  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKey(date);
    indexByKey.set(key, months.length);
    months.push({
      key,
      label: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      newAccounts: 0,
      investmentVolume: 0,
    });
  }

  for (const account of accounts) {
    const index = indexByKey.get(monthKey(account.created_date));
    if (index !== undefined) months[index].newAccounts += 1;
  }

  for (const transaction of investmentTransactions) {
    if (transaction.status !== 'completed') continue;
    const index = indexByKey.get(monthKey(transaction.transaction_date || transaction.created_date));
    if (index === undefined) continue;
    const amount = Number(transaction.amount);
    if (Number.isFinite(amount)) months[index].investmentVolume += Math.abs(amount);
  }

  return months;
}
