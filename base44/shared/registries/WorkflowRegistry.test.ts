import { WorkflowRegistry } from '../registries/WorkflowRegistry.ts';

Deno.test('Workflow registry includes the controlled review paths', () => {
  const names = WorkflowRegistry.list().map(item => item.name);
  for (const required of [
    'assistant_recommendation_review',
    'member_application_review',
    'transfer_request',
    'card_issuance',
    'investment_withdrawal',
  ]) {
    if (!names.includes(required)) throw new Error(`Missing workflow definition: ${required}`);
  }
});

Deno.test('Financial workflow definitions remain non-executable until separately verified', () => {
  for (const definition of WorkflowRegistry.list()) {
    if (definition.executionEnabled !== false) {
      throw new Error(`Workflow unexpectedly enables execution: ${definition.name}`);
    }
  }
});

Deno.test('Workflow registry resolves versioned definitions', () => {
  const definition = WorkflowRegistry.resolve('transfer_request', '1.0.0');
  if (!definition || definition.steps[0] !== 'request_received') {
    throw new Error('Transfer workflow version did not resolve');
  }
});
