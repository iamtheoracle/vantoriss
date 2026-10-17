export const APPLICATION_DECISIONS = Object.freeze(['approved', 'rejected']);

export function isUuid(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isValidRevision(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 128;
}

export function isDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
}

export function isValidOpeningBalance(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return false;
  const cents = Math.round(value * 100);
  return Number.isSafeInteger(cents) && Math.abs(value * 100 - cents) < 1e-7;
}

export function canTransitionApplication(currentStatus, decision) {
  return currentStatus === 'pending' && APPLICATION_DECISIONS.includes(decision);
}

export function isCorrectableTransactionStatus(status) {
  return status === 'completed' || status === 'reversed';
}
