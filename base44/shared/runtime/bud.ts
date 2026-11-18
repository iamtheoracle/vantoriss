/**
 * AVA — Member-facing conversational assistant.
 *
 * AVA owns no financial authority. It only:
 *   - receives user messages
 *   - renders responses
 *   - streams output
 *   - displays progress
 *   - requests work from AVCU Core
 *
 * AVA does not own:
 *   - memory, conversation history, capabilities, orchestration,
 *   - permissions, scheduling, auditing
 *
 * On the frontend, AVA is the member-facing assistant experience.
 * On the backend, AVA delegates to the authenticated AVCU assistant runtime.
 */

export const AVAContract = {
  name: 'AVA',
  role: 'member-facing conversational assistant',
  responsibilities: ['receive', 'render', 'stream', 'progress', 'delegate'],
  doesNotOwn: ['memory', 'history', 'capabilities', 'orchestration', 'permissions', 'scheduling', 'auditing'],

  // AVA delegates all processing to the authenticated AVCU Core runtime
  // Frontend invocation:
  //   Existing assistant runtime function identifier is retained as a compatibility endpoint.
  // Health check:
  //   Health diagnostics remain restricted to authorized staff.
};

// Deprecated compatibility alias for existing integrations.
export const BudContract = AVAContract;
