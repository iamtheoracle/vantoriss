import assert from 'node:assert/strict';
import { buildDemoFinancialState, isDemoFinancialRecord, selectFinancialExperience } from '../src/lib/demoFinancials.js';

const state = buildDemoFinancialState({ id: 'user-123', full_name: 'Andrew Example' });

assert.equal(state.mode, 'demonstration');
assert.equal(state.accounts.length, 1);
assert.equal(state.cards.length, 1);
assert.equal(state.portfolios.length, 1);
assert.ok(state.accounts.every(isDemoFinancialRecord));
assert.ok(state.cards.every(isDemoFinancialRecord));
assert.ok(state.portfolios.every(isDemoFinancialRecord));
assert.equal(state.accounts[0].provider, 'demonstration');
assert.equal(state.cards[0].provider, 'demonstration');
assert.equal(state.portfolios[0].provider, 'demonstration');
assert.equal(state.accounts[0].available_balance, 12480);
assert.equal(state.cards[0].last4, '4821');

const realRecord = { id: 'real-1', provider: 'unit', provider_account_id: 'unit-1' };
assert.equal(isDemoFinancialRecord(realRecord), false);

const real = selectFinancialExperience([realRecord], [], []);
assert.equal(real.mode, 'real');
assert.equal(real.accounts[0], realRecord);

const demonstration = selectFinancialExperience([], [], [], { id: 'user-123', full_name: 'Andrew Example' });
assert.equal(demonstration.mode, 'demonstration');
assert.equal(demonstration.accounts[0].provider, 'demonstration');

console.log('demo financial state tests passed');
