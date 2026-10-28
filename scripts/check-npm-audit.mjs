import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const BRACES_ADVISORY = 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm';
export const BRACES_EXCEPTION_EXPIRES = '2026-11-17T23:59:59.999Z';

function resolveHighAdvisories(name, audit, seen = new Set()) {
  if (seen.has(name)) return { ok: false, advisories: [] };
  const vulnerability = audit.vulnerabilities?.[name];
  if (!vulnerability || !Array.isArray(vulnerability.via) || vulnerability.via.length === 0) {
    return { ok: false, advisories: [] };
  }
  const nextSeen = new Set(seen);
  nextSeen.add(name);
  const advisories = [];
  for (const via of vulnerability.via) {
    if (typeof via === 'string') {
      const nested = resolveHighAdvisories(via, audit, nextSeen);
      if (!nested.ok) return { ok: false, advisories: [] };
      advisories.push(...nested.advisories);
    } else if (via && typeof via === 'object') {
      advisories.push(via);
    } else {
      return { ok: false, advisories: [] };
    }
  }
  return { ok: true, advisories };
}

export function evaluateAuditPolicy(audit, lockfile, now = new Date()) {
  if (!audit || typeof audit !== 'object' || !audit.vulnerabilities || typeof audit.vulnerabilities !== 'object') {
    return { ok: false, message: 'npm audit JSON has no vulnerability map; refusing to infer a clean audit.' };
  }
  const high = Object.values(audit.vulnerabilities).filter(
    vulnerability => ['high', 'critical'].includes(vulnerability?.severity),
  );
  const braces = audit.vulnerabilities.braces;
  const lockEntry = lockfile?.packages?.['node_modules/braces'];
  const exceptionExpired = now.getTime() > Date.parse(BRACES_EXCEPTION_EXPIRES);
  const bracesAllowed = Boolean(
    !exceptionExpired &&
    braces &&
    braces.name === 'braces' &&
    braces.severity === 'high' &&
    braces.fixAvailable === false &&
    Array.isArray(braces.nodes) &&
    braces.nodes.length === 1 &&
    braces.nodes[0] === 'node_modules/braces' &&
    Array.isArray(braces.via) &&
    braces.via.length === 1 &&
    typeof braces.via[0] === 'object' &&
    braces.via[0].url === BRACES_ADVISORY &&
    braces.via[0].severity === 'high' &&
    lockEntry?.version === '3.0.3' &&
    lockEntry?.resolved === 'https://registry.npmjs.org/braces/-/braces-3.0.3.tgz'
  );
  const unapproved = high.filter(vulnerability => {
    const resolved = resolveHighAdvisories(vulnerability.name, audit);
    if (!resolved.ok) return true;
    const highLeaves = resolved.advisories.filter(advisory => ['high', 'critical'].includes(advisory.severity));
    return !bracesAllowed ||
      highLeaves.length === 0 ||
      highLeaves.some(advisory => advisory.url !== BRACES_ADVISORY || advisory.severity !== 'high');
  });
  if (exceptionExpired && braces) {
    return { ok: false, message: `The time-boxed braces exception expired at ${BRACES_EXCEPTION_EXPIRES}; re-review upstream status and remove the exception when a safe fix is available.` };
  }
  if (unapproved.length) {
    return {
      ok: false,
      message: `Unapproved high/critical dependency advisories: ${unapproved.map(v => `${v.name} (${v.severity})`).join(', ')}.`,
    };
  }
  if (braces && !bracesAllowed) {
    return { ok: false, message: 'The braces advisory no longer matches the exact no-fix exception criteria; review the dependency tree before proceeding.' };
  }
  if (bracesAllowed) {
    return {
      ok: true,
      message: `Temporary exception: ${BRACES_ADVISORY} remains reported for braces@3.0.3 with no published fix. High-severity dependent-package entries are allowed only when their high/critical advisory chain resolves exclusively to this exact advisory. Re-review by ${BRACES_EXCEPTION_EXPIRES}. No other high/critical advisory is allowed.`,
      exception: 'GHSA-vfj7-8cjw-p6xm',
    };
  }
  return { ok: true, message: 'No high or critical npm audit advisories found.' };
}

function main() {
  const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  let audit;
  try {
    audit = JSON.parse(result.stdout || '');
  } catch {
    process.stderr.write('Dependency audit returned invalid JSON; refusing to pass the quality gate.\n');
    process.stderr.write((result.stderr || result.stdout || '').slice(-4000));
    process.exitCode = 1;
    return;
  }

  let lockfile;
  try {
    lockfile = JSON.parse(readFileSync(resolve('package-lock.json'), 'utf8'));
  } catch (error) {
    process.stderr.write(`Unable to read package-lock.json: ${error.message}\n`);
    process.exitCode = 1;
    return;
  }

  const policy = evaluateAuditPolicy(audit, lockfile);
  const summary = audit.metadata?.vulnerabilities;
  if (summary) {
    process.stdout.write(`npm audit summary: ${summary.total ?? 0} total; ${summary.low ?? 0} low; ${summary.moderate ?? 0} moderate; ${summary.high ?? 0} high; ${summary.critical ?? 0} critical.\n`);
  }
  process.stdout.write(`${policy.ok ? 'SECURITY REVIEW' : 'SECURITY GATE FAILED'}: ${policy.message}\n`);
  if (!policy.ok) {
    if (result.stderr) process.stderr.write(result.stderr.slice(-4000));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
