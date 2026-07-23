// Centralized PostgREST client.
//
// Why this exists: supabase-js v2 wraps every `.from(...).select()` in a
// `navigator.locks`-based auth mutex (`_acquireLock` → `_useSession`).
// When several `.from()` calls fire in the same tick (e.g. `Promise.all`
// with 3+ reads), the second-and-later calls queue on that lock and can
// hang indefinitely — the request never leaves the SDK. Symptom: the
// first query returns 200, subsequent queries never even hit the network.
//
// `src/integrations/supabase/client.ts` is auto-generated, so we can't
// disable the lock there. Instead, every route reads data through this
// helper: a thin `fetch` wrapper that hits PostgREST directly with the
// stored access token. No lock, no SDK, no deadlock.
//
// Writes/RPC that need JWT context (e.g. `supabase.rpc(...)`) still go
// through the SDK — those are one-at-a-time and don't trigger the race.

import { getStoredSupabaseSession } from "@/lib/browser-auth-session";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string;

const REST_URL = `${SUPABASE_URL}/rest/v1`;
const DEFAULT_TIMEOUT_MS = 10_000;

export class RestError extends Error {
  status: number;
  body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function authHeaders(accessToken?: string): Record<string, string> {
  const token =
    accessToken ?? getStoredSupabaseSession()?.accessToken ?? undefined;
  const h: Record<string, string> = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function doFetch(
  path: string,
  init: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${REST_URL}/${path}`, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(t);
  }
}

/** SELECT — returns an array of rows. */
export async function restGet<T = unknown>(
  path: string,
  opts: { accessToken?: string; timeoutMs?: number } = {},
): Promise<T[]> {
  const res = await doFetch(
    path,
    { method: "GET", headers: authHeaders(opts.accessToken) },
    opts.timeoutMs,
  );
  const body = await res.text();
  if (!res.ok) throw new RestError(`GET ${path} → ${res.status}`, res.status, body);
  return body ? (JSON.parse(body) as T[]) : [];
}

/** SELECT with `.maybeSingle()` semantics — first row or null. */
export async function restGetMaybeSingle<T = unknown>(
  path: string,
  opts: { accessToken?: string; timeoutMs?: number } = {},
): Promise<T | null> {
  const rows = await restGet<T>(path, opts);
  return rows[0] ?? null;
}

/** INSERT/UPDATE/DELETE via PostgREST; returns rows when `return=representation`. */
export async function restMutate<T = unknown>(
  path: string,
  init: {
    method: "POST" | "PATCH" | "DELETE" | "PUT";
    body?: unknown;
    prefer?: string; // e.g. "return=representation"
    accessToken?: string;
    timeoutMs?: number;
  },
): Promise<T[]> {
  const headers: Record<string, string> = {
    ...authHeaders(init.accessToken),
    "Content-Type": "application/json",
  };
  if (init.prefer) headers.Prefer = init.prefer;
  const res = await doFetch(
    path,
    {
      method: init.method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    },
    init.timeoutMs,
  );
  const body = await res.text();
  if (!res.ok)
    throw new RestError(
      `${init.method} ${path} → ${res.status}`,
      res.status,
      body,
    );
  return body ? (JSON.parse(body) as T[]) : [];
}

export const SUPABASE_REST = { url: REST_URL, apikey: SUPABASE_PUBLISHABLE_KEY };
