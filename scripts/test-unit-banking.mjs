import assert from 'node:assert/strict';
import { isProviderBackedAccount, providerStatus, formatProviderUnavailable } from '../src/lib/unitBanking.js';

assert.equal(isProviderBackedAccount({ provider: 'unit', provider_account_id: 'acc_123' }), true);
assert.equal(isProviderBackedAccount({ provider: 'unit', provider_account_id: '' }), false);
assert.equal(providerStatus({ provider: 'unit', provider_account_id: 'acc_123' }), 'connected');
assert.equal(providerStatus({}), 'unavailable');
assert.match(formatProviderUnavailable(), /live banking provider/i);

console.log('unit banking helper tests passed');
