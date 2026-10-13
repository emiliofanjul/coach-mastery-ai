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

/**
 * Encabezados para que una función del servidor llame a otra con la llave de
 * servicio. Las llaves nuevas ("sb_secret_…") no son JWT: el portero de la
 * plataforma solo las acepta en "apikey" y rechaza la petición ("Conflicting
 * API keys") si además van en Authorization con otra llave en apikey. Eso
 * rompió la red de seguridad en oct-2026. Las llaves viejas (JWT) siguen
 * yendo como antes.
 */
export function encabezadosDeServicio(servicio: string, publica: string): Record<string, string> {
  return servicio.startsWith("sb_")
    ? { apikey: servicio }
    : { apikey: publica, Authorization: `Bearer ${servicio}` };
}

export async function quienLlama(req: Request): Promise<Llamante | null> {
  const url = Deno.env.get("SUPABASE_URL");
  const servicio = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !servicio) return null;
  const token = tokenDe(req);
  // La llave de servicio llega en Authorization (formato JWT) o en apikey
  // (formato nuevo sb_secret_). En los dos casos se compara completa.
  if (token === servicio || (req.headers.get("apikey") ?? "").trim() === servicio) return { tipo: "servicio" };
  if (!token) return null;

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
