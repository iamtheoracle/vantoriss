import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BRACES_ADVISORY,
  BRACES_EXCEPTION_EXPIRES,
  evaluateAuditPolicy,
} from '../scripts/check-npm-audit.mjs';

const lockfile = {
  packages: {
    'node_modules/braces': {
      version: '3.0.3',
      resolved: 'https://registry.npmjs.org/braces/-/braces-3.0.3.tgz',
    },
  },
};

function bracesAudit() {
  return {
    vulnerabilities: {
      braces: {
        name: 'braces',
        severity: 'high',
        fixAvailable: false,
        nodes: ['node_modules/braces'],
        via: [{
          name: 'braces',
          severity: 'high',
          url: BRACES_ADVISORY,
          range: '<=3.0.3',
        }],
      },
    },
    metadata: { vulnerabilities: { total: 1, low: 0, moderate: 0, high: 1, critical: 0 } },
  };
}

test('npm audit policy permits only the exact no-fix braces advisory before expiry', () => {
  const result = evaluateAuditPolicy(bracesAudit(), lockfile, new Date('2026-10-18T00:00:00.000Z'));
  assert.equal(result.ok, true);
  assert.equal(result.exception, 'GHSA-vfj7-8cjw-p6xm');
});

test('npm audit policy fails closed after the braces exception expires', () => {
  const result = evaluateAuditPolicy(bracesAudit(), lockfile, new Date('2026-11-18T00:00:00.000Z'));
  assert.equal(result.ok, false);
  assert.match(result.message, /exception expired/);
});

test('npm audit policy rejects a changed braces version or advisory identity', () => {
  const wrongVersion = { ...lockfile, packages: { 'node_modules/braces': { ...lockfile.packages['node_modules/braces'], version: '3.0.4' } } };
  assert.equal(evaluateAuditPolicy(bracesAudit(), wrongVersion, new Date('2026-10-18T00:00:00.000Z')).ok, false);

  const wrongAdvisory = bracesAudit();
  wrongAdvisory.vulnerabilities.braces.via[0].url = 'https://example.invalid/advisory';
  assert.equal(evaluateAuditPolicy(wrongAdvisory, lockfile, new Date('2026-10-18T00:00:00.000Z')).ok, false);
});

test('npm audit policy permits high-severity dependents only when their high advisory chain leads to braces', () => {
  const audit = bracesAudit();
  audit.vulnerabilities.micromatch = {
    name: 'micromatch',
    severity: 'high',
    via: ['braces'],
    effects: [],
    nodes: ['node_modules/micromatch'],
    fixAvailable: false,
  };
  audit.vulnerabilities.chokidar = {
    name: 'chokidar',
    severity: 'high',
    via: ['braces'],
    effects: [],
    nodes: ['node_modules/chokidar'],
    fixAvailable: false,
  };
  const result = evaluateAuditPolicy(audit, lockfile, new Date('2026-10-18T00:00:00.000Z'));
  assert.equal(result.ok, true);
});

test('npm audit policy rejects every other high or critical advisory', () => {
  const audit = bracesAudit();
  audit.vulnerabilities.other = {
    name: 'other',
    severity: 'critical',
    fixAvailable: false,
    nodes: ['node_modules/other'],
    via: [{ name: 'other', severity: 'critical', url: 'https://example.invalid/other' }],
  };
  const result = evaluateAuditPolicy(audit, lockfile, new Date('2026-10-18T00:00:00.000Z'));
  assert.equal(result.ok, false);
  assert.match(result.message, /other \(critical\)/);
});

test('npm audit policy fails closed when audit JSON is incomplete', () => {
  assert.equal(evaluateAuditPolicy({}, lockfile).ok, false);
  assert.equal(evaluateAuditPolicy({ vulnerabilities: {} }, lockfile).ok, true);
});
