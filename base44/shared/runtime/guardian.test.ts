import { createGuardian } from './guardian.ts';

function assertEqual(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, received ${actual}`);
}

Deno.test('Guardian allows explicitly granted baseline capabilities', async () => {
  const guardian = createGuardian({
    policy: { list: () => [{
      name: 'member_baseline',
      effect: 'allow',
      actions: ['reasoning', 'knowledge'],
      conditions: { authenticated: true },
    }] },
  });
  const result = await guardian.authorize({
    id: 'test-1',
    userId: 'member-1',
    capabilities: ['reasoning', 'knowledge'],
    context: { userRole: 'member' },
  });
  assertEqual(result.effect, 'allow', 'explicit baseline grant');
});

Deno.test('Guardian denies wildcard grants', async () => {
  const guardian = createGuardian({
    policy: { list: () => [{
      name: 'unsafe_wildcard',
      effect: 'allow',
      actions: ['*'],
      conditions: { authenticated: true },
    }] },
  });
  const result = await guardian.authorize({
    id: 'test-2',
    userId: 'member-1',
    capabilities: ['reasoning'],
    context: { userRole: 'member' },
  });
  assertEqual(result.effect, 'deny', 'wildcard grant');
});

Deno.test('Guardian denies empty action grants', async () => {
  const guardian = createGuardian({
    policy: { list: () => [{
      name: 'unsafe_empty',
      effect: 'allow',
      actions: [],
      conditions: { authenticated: true },
    }] },
  });
  const result = await guardian.authorize({
    id: 'test-3',
    userId: 'member-1',
    capabilities: ['reasoning'],
    context: { userRole: 'member' },
  });
  assertEqual(result.effect, 'deny', 'empty action grant');
});

Deno.test('Guardian requires every requested capability to be explicitly granted', async () => {
  const guardian = createGuardian({
    policy: { list: () => [{
      name: 'partial_grant',
      effect: 'allow',
      actions: ['reasoning'],
      conditions: { authenticated: true },
    }] },
  });
  const result = await guardian.authorize({
    id: 'test-4',
    userId: 'member-1',
    capabilities: ['reasoning', 'account_write'],
    context: { userRole: 'member' },
  });
  assertEqual(result.effect, 'deny', 'partial capability grant');
});

Deno.test('Guardian denies role mismatch', async () => {
  const guardian = createGuardian({
    policy: { list: () => [{
      name: 'staff_only',
      effect: 'allow',
      actions: ['audit'],
      conditions: { authenticated: true, role: 'admin' },
    }] },
  });
  const result = await guardian.authorize({
    id: 'test-5',
    userId: 'member-1',
    capabilities: ['audit'],
    context: { userRole: 'member' },
  });
  assertEqual(result.effect, 'deny', 'role mismatch');
});
