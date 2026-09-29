// Llave temporal para la transcripción en vivo (ElevenLabs Scribe v2 Realtime).
//
// El teléfono se conecta directo a ElevenLabs para que el texto aparezca
// mientras el vendedor habla. Para no exponer la llave real en el navegador,
// este servidor pide una llave de un solo uso que caduca a los 15 minutos.
// Solo se entrega a un usuario con sesión: sin eso, cualquiera podría
// gastar créditos de transcripción.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: who } = jwt ? await admin.auth.getUser(jwt) : { data: null as any };
    if (!who?.user?.id) return json({ error: "unauthorized" }, 401);

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) return json({ error: "ELEVENLABS_API_KEY not configured" }, 500);

    const r = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
    });
    if (!r.ok) {
      const detalle = (await r.text()).slice(0, 300);
      console.error("[closer-stt-token] ElevenLabs respondió", r.status, detalle);
      return json({ error: "token_failed", status: r.status }, 502);
    }
    const { token } = await r.json();
    if (typeof token !== "string" || !token) return json({ error: "token_empty" }, 502);
    return json({ token });
  } catch (err) {
    console.error("[closer-stt-token] error:", err);
    return json({ error: "internal" }, 500);
  }
});
