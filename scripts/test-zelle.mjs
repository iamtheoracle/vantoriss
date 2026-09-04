import assert from 'node:assert/strict';
import {
  normalizeZelleIdentifier,
  findZelleRecipient,
  maskZelleIdentifier,
  buildVantorisQrPayload,
} from '../src/lib/zelle.js';

const profiles = [
  {
    user_id: 'u-1',
    status: 'enrolled',
    zelle_email: 'Andrew.Hunter@example.com',
    zelle_phone: '+1 (555) 123-4567',
    bank_name: 'Example Bank',
  },
  { user_id: 'u-2', status: 'pending', zelle_email: 'pending@example.com' },
];

assert.equal(normalizeZelleIdentifier(' Andrew.Hunter@example.com '), 'andrew.hunter@example.com');
assert.equal(normalizeZelleIdentifier('+1 (555) 123-4567'), '+15551234567');
assert.equal(findZelleRecipient(profiles, 'andrew.hunter@example.com')?.user_id, 'u-1');
assert.equal(findZelleRecipient(profiles, '+15551234567')?.user_id, 'u-1');
assert.equal(findZelleRecipient(profiles, 'pending@example.com'), null);
assert.equal(maskZelleIdentifier('Andrew.Hunter@example.com'), 'A••••••••••••@example.com');
assert.equal(maskZelleIdentifier('+1 (555) 123-4567'), '••• ••• 4567');
const payload = JSON.parse(buildVantorisQrPayload(profiles[0]));
assert.equal(payload.type, 'vantoris-zelle');
assert.equal(payload.user_id, 'u-1');
console.log('zelle helper tests passed');
