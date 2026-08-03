export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export function generateAccountNumber() {
  const num = Math.floor(1000000000 + Math.random() * 9000000000);
  return String(num).padStart(10, '0');
}

export function generateRoutingNumber() {
  const num = Math.floor(100000000 + Math.random() * 900000000);
  return String(num).padStart(9, '0');
}