import assert from 'node:assert/strict';
import { getOperatorDivisions, buildAgentConversationMetadata } from '../src/lib/operatorContext.js';

const operations = getOperatorDivisions({ role: 'operations_officer' });
assert.ok(operations.includes('operations'));
assert.ok(operations.includes('finance'));
assert.equal(operations.includes('markets'), false);

const investment = getOperatorDivisions({ role: 'investment_officer' });
assert.ok(investment.includes('markets'));
assert.ok(investment.includes('portfolio'));
assert.equal(investment.includes('compliance'), false);

const superAdmin = getOperatorDivisions({ role: 'super_administrator' });
assert.equal(superAdmin.length, 16);

const metadata = buildAgentConversationMetadata(
  { id: 'operator-1', role: 'operations_officer' },
  { mode: 'operator', role: 'operations_officer', position: 'Operations Officer', department: 'Operations', profile_role: 'Operations Officer', divisions: operations, capabilities: ['management.operations.view'] },
);
assert.equal(metadata.user_id, 'operator-1');
assert.equal(metadata.user_role, 'operations_officer');
assert.equal(metadata.account_mode, 'operator');
assert.deepEqual(metadata.allowed_command_divisions, operations);
assert.deepEqual(metadata.allowed_capabilities, ['management.operations.view']);

console.log('operator context tests passed');
