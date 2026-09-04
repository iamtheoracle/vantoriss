import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const agentsDir = path.join(root, 'base44', 'agents');
const requiredAgents = [
  'command','intelligence','operations','compliance','security','support','logistics','humanitarian',
  'reconnaissance','finance','markets','portfolio','risk','navigation','records','communications'
];

for (const name of requiredAgents) {
  const file = path.join(agentsDir, `${name}.jsonc`);
  assert.ok(fs.existsSync(file), `missing agent: ${name}`);
  const source = fs.readFileSync(file, 'utf8');
  assert.match(source, /Never fabricate|Never invent/i, `${name}: missing no-fabrication rule`);
  assert.match(source, /unavailable/i, `${name}: missing unavailable-state rule`);
  assert.match(source, /Never report.*completed|Never report.*complete/i, `${name}: missing execution-verification rule`);
  assert.doesNotMatch(source, /Generates a unique account number and routing number/i, `${name}: obsolete synthetic account generation instruction remains`);
}

console.log(`agent doctrine tests passed for ${requiredAgents.length} divisions`);
