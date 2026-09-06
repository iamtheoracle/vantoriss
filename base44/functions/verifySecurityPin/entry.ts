import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ITERATIONS = 120000;
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const encoder = new TextEncoder();

function toHex(bytes: Uint8Array) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string) {
  return new Uint8Array(hex.match(/.{2}/g)?.map((x) => parseInt(x, 16)) || []);
}

async function derivePinHash(pin: string, saltHex: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(saltHex), iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return toHex(new Uint8Array(bits));
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.id) return Response.json({ ok: false, error: 'Authentication required.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const pin = String(body?.pin || '');
    if (!/^\d{6}$/.test(pin)) return Response.json({ ok: false, error: 'Invalid PIN format.' }, { status: 400 });

    const rows = await base44.asServiceRole.entities.SecurityCredential.filter({ user_id: user.id });
    const record = rows?.[0];
    if (!record) return Response.json({ ok: false, configured: false, error: 'Security PIN is not configured.' }, { status: 409 });

    const now = Date.now();
    const lockedUntil = record.locked_until ? new Date(record.locked_until).getTime() : 0;
    if (lockedUntil > now) {
      return Response.json({ ok: false, locked: true, retry_after_seconds: Math.ceil((lockedUntil - now) / 1000), error: 'Too many incorrect PIN attempts. Try again later.' }, { status: 429 });
    }

    const hash = await derivePinHash(pin, record.pin_salt);
    if (!constantTimeEqual(hash, record.pin_hash)) {
      const failedAttempts = Number(record.failed_attempts || 0) + 1;
      const lock = failedAttempts >= MAX_ATTEMPTS ? new Date(now + LOCK_MINUTES * 60 * 1000).toISOString() : '';
      await base44.asServiceRole.entities.SecurityCredential.update(record.id, {
        failed_attempts: failedAttempts >= MAX_ATTEMPTS ? 0 : failedAttempts,
        locked_until: lock,
      });
      return Response.json({ ok: false, locked: Boolean(lock), error: lock ? 'Too many incorrect PIN attempts. Try again later.' : 'Incorrect PIN.' }, { status: 401 });
    }

    await base44.asServiceRole.entities.SecurityCredential.update(record.id, {
      failed_attempts: 0,
      locked_until: '',
      last_verified_at: new Date(now).toISOString(),
    });

    return Response.json({ ok: true, verified: true });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Unable to verify security PIN.' }, { status: 500 });
  }
}
