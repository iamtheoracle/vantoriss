/**
 * Bud — User-facing conversational companion.
 *
 * Bud owns NOTHING. It only:
 *   - receives user messages
 *   - renders responses
 *   - streams output
 *   - displays progress
 *   - requests work from Oracle
 *
 * Bud does NOT own:
 *   - memory, conversation history, capabilities, orchestration,
 *   - permissions, scheduling, auditing
 *
 * On the frontend, Bud is implemented as BudCompanion.jsx.
 * On the backend, Bud delegates to the oracleRuntime backend function.
 */

export const BudContract = {
  name: 'Bud',
  role: 'user-facing conversational companion',
  responsibilities: ['receive', 'render', 'stream', 'progress', 'delegate'],
  doesNotOwn: ['memory', 'history', 'capabilities', 'orchestration', 'permissions', 'scheduling', 'auditing'],

  // Bud delegates ALL work to Oracle via the oracleRuntime backend function
  // Frontend invocation:
  //   base44.functions.invoke('oracleRuntime', { message, action: 'process' })
  // Health check:
  //   base44.functions.invoke('oracleRuntime', { action: 'health' })
};