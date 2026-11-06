import { createCore } from './core.ts';
import { createTrust } from './trust.ts';
import { createCommand } from './command.ts';
import { createIntelligence } from './intelligence.ts';
import { createScheduler } from './scheduler.ts';
import { createOracle } from './oracle.ts';
import { createGuardian } from './guardian.ts';
import { createNexus } from './nexus.ts';
import { createSpark } from './spark.ts';
import { createOrbit } from './orbit.ts';
import { AVAContract, BudContract } from './index.ts';

Deno.test('AVCU canonical runtime modules export their factories', () => {
  for (const factory of [createCore, createTrust, createCommand, createIntelligence, createScheduler]) {
    if (typeof factory !== 'function') throw new Error('Expected canonical AVCU factory export');
  }
});

Deno.test('legacy runtime exports remain aliases during migration', () => {
  if (createOracle !== createCore) throw new Error('Oracle compatibility alias must point to AVCU Core');
  if (createGuardian !== createTrust) throw new Error('Guardian compatibility alias must point to AVCU Trust');
  if (createNexus !== createCommand) throw new Error('Nexus compatibility alias must point to AVCU Command');
  if (createSpark !== createIntelligence) throw new Error('Spark compatibility alias must point to AVCU Intelligence');
  if (createOrbit !== createScheduler) throw new Error('Orbit compatibility alias must point to AVCU Scheduler');
  if (BudContract !== AVAContract) throw new Error('Bud compatibility contract must point to AVA');
});

Deno.test('AVCU Trust denies requests when no policy matches', async () => {
  const trust = createTrust({ policy: { list: () => [] } });
  const decision = await trust.authorize({ id: 'identity-test', userId: 'member-1', capabilities: ['reasoning'] });
  if (decision.effect !== 'deny') throw new Error('AVCU Trust must deny by default');
});


Deno.test('AVCU Trust writes durable authorization audit before allowing', async () => {
  const entries = [];
  const trust = createTrust({
    policy: {
      list: () => [{
        name: 'member_reasoning',
        effect: 'allow',
        actions: ['reasoning'],
        conditions: { authenticated: true },
      }],
    },
  }, {
    async log(entry) { entries.push(entry); },
  });

  const decision = await trust.authorize({
    id: 'audit-test',
    userId: 'member-1',
    capabilities: ['reasoning'],
  });

  if (decision.effect !== 'allow') throw new Error('Expected explicit allow');
  if (entries.length !== 1) throw new Error('Expected one durable audit write');
  if (entries[0].actionType !== 'trust_authorization') throw new Error('Expected Trust authorization audit type');
});

Deno.test('AVCU Trust fails closed when durable audit storage fails', async () => {
  const trust = createTrust({
    policy: {
      list: () => [{
        name: 'member_reasoning',
        effect: 'allow',
        actions: ['reasoning'],
        conditions: { authenticated: true },
      }],
    },
  }, {
    async log() { throw new Error('audit unavailable'); },
  });

  let rejected = false;
  try {
    await trust.authorize({
      id: 'audit-failure-test',
      userId: 'member-1',
      capabilities: ['reasoning'],
    });
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error('Authorization must fail closed when audit persistence fails');
});

Deno.test('AVCU Core denies if Trust does not return an explicit allow', async () => {
  let commandCalled = false;
  const core = createCore(
    {},
    {},
    { async authorize() { return undefined; } },
    { async orchestrate() { commandCalled = true; return {}; } },
    {},
    {},
  );

  const result = await core.process({
    id: 'core-deny-test',
    userId: 'member-1',
    message: 'hello',
    capabilities: ['reasoning'],
  });

  if (!result.content.includes('Access denied')) throw new Error('Core must deny a missing Trust decision');
  if (commandCalled) throw new Error('Core must not orchestrate after missing Trust allow');
});
