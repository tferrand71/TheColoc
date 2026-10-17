interface Attempt {
  count: number;
  lockedUntil: number | null;
}

const store = new Map<string, Attempt>();

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(key: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return { allowed: false, retryAfterMs: entry.lockedUntil - now };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const entry = store.get(key) ?? { count: 0, lockedUntil: null };

  // Réinitialise si le verrou précédent est expiré
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    entry.count = 0;
    entry.lockedUntil = null;
  }

  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCK_MS;
  }

  store.set(key, entry);
}

export function recordSuccess(key: string): void {
  store.delete(key);
}
