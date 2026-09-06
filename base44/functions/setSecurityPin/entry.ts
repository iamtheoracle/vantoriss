import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const ITERATIONS = 120000;
const encoder = new TextEncoder();

function toHex(bytes: Uint8Array) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function derivePinHash(pin: string, saltHex: string) {
  const salt = new Uint8Array(saltHex.match(/.{2}/g)?.map((x) => parseInt(x, 16)) || []);
  const key = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return toHex(new Uint8Array(bits));
}

function validPin(pin: unknown) {
  return typeof pin === 'string' && /^\d{6}$/.test(pin) && !/(\d)\1{5}/.test(pin);
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.id) return Response.json({ ok: false, error: 'Authentication required.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const pin = String(body?.pin || '');
    if (!validPin(pin)) {
      return Response.json({ ok: false, error: 'PIN must be exactly 6 digits and cannot be six repeated digits.' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.SecurityCredential.filter({ user_id: user.id });
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = toHex(saltBytes);
    const hash = await derivePinHash(pin, salt);
    const record = existing?.[0];

    if (record) {
      await base44.asServiceRole.entities.SecurityCredential.update(record.id, {
        pin_hash: hash,
        pin_salt: salt,
        failed_attempts: 0,
        locked_until: '',
        last_verified_at: '',
      });
    } else {
      await base44.asServiceRole.entities.SecurityCredential.create({
        user_id: user.id,
        pin_hash: hash,
        pin_salt: salt,
        failed_attempts: 0,
        locked_until: '',
        last_verified_at: '',
      });
    }

    return Response.json({ ok: true, configured: true });
  } catch (error) {
    return Response.json({ ok: false, error: error?.message || 'Unable to configure security PIN.' }, { status: 500 });
  }
}
