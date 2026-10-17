import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearMutationIdempotencyKey,
  getMutationIdempotencyKey,
} from '../src/lib/mutationIdempotency.js';

test('a retry of the same operation scope reuses its idempotency key', async () => {
  const scope = `test-operation:${globalThis.crypto.randomUUID()}`;
  const first = await getMutationIdempotencyKey(scope);
  const retry = await getMutationIdempotencyKey(scope);
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(retry, first);
  await clearMutationIdempotencyKey(scope);
  const next = await getMutationIdempotencyKey(scope);
  assert.notEqual(next, first);
  await clearMutationIdempotencyKey(scope);
});

test('different operation scopes never share a generated idempotency key', async () => {
  const suffix = globalThis.crypto.randomUUID();
  const a = await getMutationIdempotencyKey(`operation-a:${suffix}`);
  const b = await getMutationIdempotencyKey(`operation-b:${suffix}`);
  assert.notEqual(a, b);
});
