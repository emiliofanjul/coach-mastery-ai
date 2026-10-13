// ¿Quién llama a esta función? (oct-2026, revisión de seguridad)
//
// closer-voice, closer-tts y director aceptaban la llave pública de la app, que
// viene dentro de la página: cualquiera en internet podía llamarlas sin límite
// y gastar los créditos de Claude y de ElevenLabs. Y el consumo quedaba a
// nombre de la empresa y el vendedor que dijera la petición.
//
// Ahora solo se aceptan:
//   · la sesión de un usuario real de Closer: la empresa y el vendedor salen de
//     la base, no de la petición;
//   · la llave de servicio, que solo tienen las funciones del servidor (la red
//     de seguridad llama al evaluador con ella).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export type Llamante =
  | { tipo: "servicio" }
  | { tipo: "usuario"; userId: string; sellerId: string | null; companyId: string | null };

const CACHE_MS = 60_000;
const cache = new Map<string, { hasta: number; quien: Llamante }>();

export function tokenDe(req: Request): string {
  return (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
}

export async function quienLlama(req: Request): Promise<Llamante | null> {
  const token = tokenDe(req);
  if (!token) return null;
  const url = Deno.env.get("SUPABASE_URL");
  const servicio = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !servicio) return null;
  if (token === servicio) return { tipo: "servicio" };

  const enCache = cache.get(token);
  if (enCache && enCache.hasta > Date.now()) return enCache.quien;

  const admin = createClient(url, servicio, { auth: { persistSession: false } });
  // La llave pública no es la sesión de nadie: getUser la rechaza.
  const { data, error } = await admin.auth.getUser(token);
  const userId = data?.user?.id;
  if (error || !userId) return null;

  const { data: vendedor } = await admin.from("sellers").select("id, company_id").eq("profile_id", userId).maybeSingle();
  let companyId: string | null = vendedor?.company_id ?? null;
  if (!companyId) {
    const { data: perfil } = await admin.from("profiles").select("company_id").eq("id", userId).maybeSingle();
    companyId = perfil?.company_id ?? null;
  }
  const quien: Llamante = { tipo: "usuario", userId, sellerId: vendedor?.id ?? null, companyId };
  cache.set(token, { hasta: Date.now() + CACHE_MS, quien });
  if (cache.size > 500) for (const [k, v] of cache) if (v.hasta < Date.now()) cache.delete(k);
  return quien;
}

export function respuestaNoAutorizado(cors: Record<string, string>): Response {
  return new Response(JSON.stringify({ error: "unauthorized", detail: "Inicia sesión para practicar." }), {
    status: 401,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
