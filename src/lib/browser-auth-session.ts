type StoredSession = {
  access_token?: string;
  expires_at?: number;
  user?: { id?: string } | null;
};

function parseStoredValue(value: string): unknown {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === "string") return parseStoredValue(parsed);
    return parsed;
  } catch {
    return null;
  }
}

function extractSession(value: unknown): StoredSession | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const direct = value as StoredSession;
  if (direct.access_token && direct.user && typeof direct.user === "object") return direct;

  const nestedCandidates = [record.currentSession, record.session, record.value];
  for (const candidate of nestedCandidates) {
    const session = extractSession(candidate);
    if (session) return session;
  }
  return null;
}

export function getStoredSupabaseSession(): { userId: string; accessToken: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const nowSeconds = Math.floor(Date.now() / 1000);
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith("sb-") || !key.endsWith("-auth-token")) continue;

      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const session = extractSession(parseStoredValue(raw));
      const userId = session?.user?.id;
      if (!session?.access_token || !userId) continue;
      if (session.expires_at && session.expires_at <= nowSeconds) continue;
      return { userId, accessToken: session.access_token };
    }
  } catch {
    return null;
  }
  return null;
}

export function getStoredSupabaseUserId(): string | null {
  return getStoredSupabaseSession()?.userId ?? null;
}

export function hasStoredSupabaseSession(): boolean {
  return getStoredSupabaseSession() !== null;
}