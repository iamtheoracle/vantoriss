const memoryKeys = new Map();

async function storageKeyFor(scope) {
  if (!globalThis.crypto?.subtle) return null;
  try {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(String(scope)),
    );
    const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    return `vantoris:mutation-idempotency:${hash}`;
  } catch {
    return null;
  }
}

/**
 * Reuses the same idempotency key for an identical command within this tab.
 * Only a hash of the command scope is persisted; the command and notes are not.
 * Retain the key after errors because a timeout can happen after a commit.
 */
export async function getMutationIdempotencyKey(scope) {
  const normalized = String(scope);
  const storageKey = await storageKeyFor(normalized);
  if (storageKey && typeof sessionStorage !== 'undefined') {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) return stored;
    } catch {
      // Fall back to in-memory retention if browser storage is unavailable.
    }
  }

  if (memoryKeys.has(normalized)) return memoryKeys.get(normalized);
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Secure idempotency key generation is unavailable in this browser.');
  }
  const key = globalThis.crypto.randomUUID();
  memoryKeys.set(normalized, key);
  if (storageKey && typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(storageKey, key);
    } catch {
      // In-memory retention still protects retries in the current page.
    }
  }
  return key;
}

export async function clearMutationIdempotencyKey(scope) {
  const normalized = String(scope);
  memoryKeys.delete(normalized);
  const storageKey = await storageKeyFor(normalized);
  if (storageKey && typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // The completed operation remains safe; stale keys expire with the tab.
    }
  }
}
