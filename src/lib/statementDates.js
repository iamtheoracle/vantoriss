/**
 * Statement date utilities — ensures historical dates are preserved correctly
 * and weekdays are calculated from the actual calendar date, never hardcoded.
 *
 * Key principle: statement_date ≠ upload_date. These are separate concepts:
 *   - transaction_date: when the transaction actually occurred
 *   - posting_date: when it was posted to the account
 *   - statement_date: the date on the statement document
 *   - period_start/period_end: the statement's coverage period
 *   - issue_date: when the institution issued the statement
 *   - created_date (system): when the record was created in Vantoris
 */

import { format, parseISO, getDay, isValid } from 'date-fns';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Parse a date string safely, returning null for invalid dates.
 * Never invents a date — returns null if the input is empty or unparseable.
 */
export function parseDateSafe(dateStr) {
  if (!dateStr) return null;
  const parsed = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
  return isValid(parsed) ? parsed : null;
}

/**
 * Calculate the weekday name from an actual date — NEVER hardcode.
 * Example: July 1, 2000 → "Saturday" (correct, calculated from the calendar)
 */
export function getWeekday(dateStr, short = false) {
  const d = parseDateSafe(dateStr);
  if (!d) return '';
  return short ? WEEKDAYS_SHORT[getDay(d)] : WEEKDAYS[getDay(d)];
}

/**
 * Format a date for display on statements: "Sat, Jul 01, 2000"
 * Weekday is calculated from the actual date, not guessed.
 */
export function formatStatementDate(dateStr) {
  const d = parseDateSafe(dateStr);
  if (!d) return '—';
  return format(d, 'EEE, MMM dd, yyyy');
}

/**
 * Format a date for transaction rows: "Jul 01, 2000"
 */
export function formatTxnDate(dateStr) {
  const d = parseDateSafe(dateStr);
  if (!d) return '—';
  return format(d, 'MMM dd, yyyy');
}

/**
 * Format a date for compact display: "07/01/2000"
 */
export function formatTxnDateShort(dateStr) {
  const d = parseDateSafe(dateStr);
  if (!d) return '—';
  return format(d, 'MM/dd/yyyy');
}

/**
 * Format a statement period: "June 1, 2000 – June 30, 2000"
 */
export function formatPeriod(startDateStr, endDateStr) {
  const start = parseDateSafe(startDateStr);
  const end = parseDateSafe(endDateStr);
  if (!start && !end) return 'All Transactions';
  if (!start) return `Through ${format(end, 'MMMM d, yyyy')}`;
  if (!end) return `From ${format(start, 'MMMM d, yyyy')}`;
  return `${format(start, 'MMMM d, yyyy')} – ${format(end, 'MMMM d, yyyy')}`;
}

/**
 * Get the effective transaction date — uses transaction_date if available,
 * falls back to posting_date, then created_date. Never uses today's date
 * as a substitute for a historical date.
 */
export function getEffectiveTxnDate(txn) {
  return txn.transaction_date || txn.posting_date || txn.created_date || null;
}

/**
 * Detect overlap between two statement periods.
 * Returns true if the periods overlap.
 */
export function periodsOverlap(period1, period2) {
  const s1 = parseDateSafe(period1.start);
  const e1 = parseDateSafe(period1.end);
  const s2 = parseDateSafe(period2.start);
  const e2 = parseDateSafe(period2.end);
  if (!s1 || !e1 || !s2 || !e2) return false;
  return s1 <= e2 && s2 <= e1;
}

/**
 * Generate a deduplication key for a transaction.
 * Used to detect duplicate imports — same account + date + amount + description + reference.
 */
export function dedupKey(txn) {
  return [
    txn.account_id || '',
    txn.transaction_date || '',
    String(txn.amount || ''),
    (txn.description || '').toLowerCase().trim(),
    txn.reference || '',
  ].join('|');
}