export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function generateAccountNumber() {
  const prefix = 'VA';
  const num = Math.floor(1000000000 + Math.random() * 9000000000);
  return `${prefix}-${String(num).slice(0, 4)}-${String(num).slice(4, 8)}`;
}