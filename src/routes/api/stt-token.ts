// Llave temporal para la transcripción en vivo (ElevenLabs Scribe v2 Realtime).
// Un solo uso, caduca a los 15 minutos. Solo se entrega a un usuario con sesión.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const Route = createFileRoute("/api/stt-token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = process.env["SUPABASE_URL"]!;
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

          const jwt = (request.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
          const { data: who } = jwt ? await sb.auth.getUser(jwt) : { data: null as any };
          if (!who?.user?.id) return json({ error: "unauthorized" }, 401);

          const apiKey = process.env["ELEVENLABS_API_KEY"];
          if (!apiKey) return json({ error: "ELEVENLABS_API_KEY not configured" }, 500);

          const r = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
            method: "POST",
            headers: { "xi-api-key": apiKey },
          });
          if (!r.ok) {
            const detalle = (await r.text()).slice(0, 300);
            console.error("[stt-token] ElevenLabs respondió", r.status, detalle);
            return json({ error: "token_failed", status: r.status }, 502);
          }
          const { token } = (await r.json()) as { token?: unknown };
          if (typeof token !== "string" || !token) return json({ error: "token_empty" }, 502);
          return json({ token });
        } catch (err) {
          console.error("[stt-token] error:", err);
          return json({ error: "internal" }, 500);
        }
      },
    },
  },
});
