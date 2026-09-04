import assert from 'node:assert/strict';
import fs from 'node:fs';

const doctrine = fs.readFileSync(new URL('../docs/VANTORIS_OPERATING_DOCTRINE.md', import.meta.url), 'utf8');
const assistant = fs.readFileSync(new URL('../base44/agents/vantoris_assistant.jsonc', import.meta.url), 'utf8');
const command = fs.readFileSync(new URL('../base44/agents/command.jsonc', import.meta.url), 'utf8');

for (const text of [doctrine, assistant, command]) {
  assert.match(text, /Never fabricate|No-fake|no-fake/i);
  assert.match(text, /demonstration/i);
  assert.match(text, /Unit/i);
  assert.match(text, /member/i);
  assert.match(text, /operator/i);
  assert.match(text, /authorization/i);
}

assert.match(assistant, /old behavior of inventing a unique account number\/routing number is obsolete/i);
assert.match(command, /generateAccount behavior is not a real banking mechanism/i);
assert.match(doctrine, /A staff member does not automatically receive a membership account/i);
assert.match(doctrine, /Discovery is intelligence, not authorization/i);

console.log('Vantoris doctrine invariant tests passed');
