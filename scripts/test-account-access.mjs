import assert from 'node:assert/strict';
import { getPostLoginRoute, isOperatorAccount } from '../src/lib/accountAccess.js';

assert.equal(isOperatorAccount({ role: 'super_administrator' }), true);
assert.equal(isOperatorAccount({ role: 'admin' }), true);
assert.equal(isOperatorAccount({ role: 'operations_officer' }), true);
assert.equal(isOperatorAccount({ role: 'investment_officer' }), true);
assert.equal(isOperatorAccount({ role: 'member' }), false);
assert.equal(isOperatorAccount({ role: 'user' }), false);

assert.equal(getPostLoginRoute({ role: 'super_administrator' }), '/operations');
assert.equal(getPostLoginRoute({ role: 'admin' }), '/operations');
assert.equal(getPostLoginRoute({ role: 'operations_officer' }), '/operations');
assert.equal(getPostLoginRoute({ role: 'member' }), '/');

console.log('account access tests passed');
