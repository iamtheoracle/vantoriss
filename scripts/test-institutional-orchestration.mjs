import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

const workItem = read('base44/entities/InstitutionalWorkItem.jsonc');
const workspace = read('base44/entities/CaseWorkspace.jsonc');
const runtime = read('base44/functions/oracleRuntime/entry.ts');
const dashboard = read('src/pages/operations/ExecutiveDashboard.jsx');
const queue = read('src/components/vantoris/widgets/InstitutionalWorkQueue.jsx');

for (const field of ['objective', 'lead_division', 'participating_divisions', 'lifecycle_stage', 'work_status', 'authorization_state', 'execution_state', 'verification_state', 'evidence', 'findings', 'handoffs', 'recommendation_ids', 'authorization_record', 'execution_record', 'verification_record', 'timeline']) {
  assert.match(workItem, new RegExp(`"${field}"`), `InstitutionalWorkItem missing ${field}`);
}

for (const stage of ['observe', 'investigate', 'analyze', 'corroborate', 'assess', 'collaborate', 'recommend', 'authorize', 'execute', 'verify', 'record', 'learn']) {
  assert.match(workItem, new RegExp(`"${stage}"`), `missing lifecycle stage ${stage}`);
}

for (const field of ['lead_division', 'participating_divisions', 'lifecycle_stage', 'authorization_state', 'execution_state', 'verification_state']) {
  assert.match(workspace, new RegExp(`"${field}"`), `CaseWorkspace missing ${field}`);
}

assert.match(runtime, /operatorRole/);
assert.match(runtime, /operatorDepartment/);
assert.match(runtime, /operatorCapabilities/);
assert.match(runtime, /InstitutionalWorkItem/);
assert.match(runtime, /awaiting_authorization/);
assert.match(runtime, /provider_confirmed/);
assert.match(runtime, /verification_state/);
assert.match(runtime, /handoffs/);

assert.match(dashboard, /InstitutionalWorkQueue/);
assert.match(queue, /InstitutionalWorkItem/);
assert.match(queue, /awaiting_authorization/);
assert.doesNotMatch(queue, /mock|demo data|fake data/i);

console.log('institutional orchestration regression checks passed');
