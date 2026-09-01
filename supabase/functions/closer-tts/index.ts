// Closer TTS — converts text to speech via ElevenLabs.
// Returns audio/mpeg bytes. Keeps the ELEVENLABS_API_KEY on the server.
//
// Además:
//  1) CACHÉ DE AUDIO — el audio se guarda en el bucket privado `tts-cache`
//     con llave sha256(voice + model + texto). Las frases que se repiten
//     (briefings, mensajes de cierre, saludos del Actor) se reutilizan y no
//     se vuelven a facturar en ElevenLabs.
//  2) MEDICIÓN — cada llamada se registra en `public.tts_calls` con caracteres,
//     latencia, costo estimado y si fue cache_hit, atribuida a empresa/vendedor.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default Closer voice — Spanish-friendly multilingual voice.
const DEFAULT_VOICE_ID = "TX3LPaxmHKxFdv7VOQHJ"; // Liam
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

// Precio de referencia ElevenLabs (plan Creator): ~$0.30 USD / 1,000 caracteres.
const USD_PER_1K_CHARS = 0.30;
const CACHE_BUCKET = "tts-cache";
const MAX_CACHEABLE_CHARS = 2000;

let _admin: ReturnType<typeof createClient> | null = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function logTtsCall(row: {
  company_id: string | null;
  seller_id: string | null;
  session_id: string | null;
  node_id: string | null;
  phase: string | null;
  characters: number;
  voice_id: string;
  model: string;
  latency_ms: number;
  cache_hit: boolean;
}) {
  try {
    const admin = getAdmin();
    if (!admin) return;
    const estimated_usd = row.cache_hit
      ? 0
      : Number(((row.characters / 1000) * USD_PER_1K_CHARS).toFixed(5));
    await admin.from("tts_calls").insert({ ...row, estimated_usd });
  } catch (e) {
    console.error("[closer-tts] tts_calls insert failed:", e);
  }
}

function audioResponse(bytes: ArrayBuffer | Uint8Array, cacheHit: boolean) {
  return new Response(bytes, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "X-Closer-TTS-Cache": cacheHit ? "hit" : "miss",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");

    const body = await req.json();
    const text: string = body?.text ?? "";
    const voiceId: string = body?.voice_id ?? DEFAULT_VOICE_ID;
    const modelId: string = body?.model_id ?? DEFAULT_MODEL_ID;

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meta = {
      company_id: typeof body?.company_id === "string" ? body.company_id : null,
      seller_id: typeof body?.seller_id === "string" ? body.seller_id : null,
      session_id: typeof body?.session_id === "string" ? body.session_id : null,
      node_id: typeof body?.node_id === "string" ? body.node_id : null,
      phase: typeof body?.phase === "string" ? body.phase : null,
    };
    const characters = text.length;
    const admin = getAdmin();
    const cacheable = characters <= MAX_CACHEABLE_CHARS && body?.cache !== false;
    const key = cacheable ? `${await sha256Hex(`${voiceId}|${modelId}|${text}`)}.mp3` : null;

    // 1) Intento de caché
    const startedCache = Date.now();
    if (key && admin) {
      const { data: cached } = await admin.storage.from(CACHE_BUCKET).download(key);
      if (cached) {
        const bytes = await cached.arrayBuffer();
        await logTtsCall({
          ...meta,
          characters,
          voice_id: voiceId,
          model: modelId,
          latency_ms: Date.now() - startedCache,
          cache_hit: true,
        });
        return audioResponse(bytes, true);
      }
    }

    // 2) Generación en ElevenLabs
    const started = Date.now();
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
        }),
      },
    );

    if (!ttsRes.ok) {
      const errText = await ttsRes.text();
      console.error("[closer-tts] ElevenLabs error:", ttsRes.status, errText);
      return new Response(
        JSON.stringify({ error: "TTS error", status: ttsRes.status, detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const audio = await ttsRes.arrayBuffer();
    const latency = Date.now() - started;

    if (key && admin) {
      const { error: upErr } = await admin.storage
        .from(CACHE_BUCKET)
        .upload(key, new Uint8Array(audio), { contentType: "audio/mpeg", upsert: true });
      if (upErr) console.error("[closer-tts] cache upload failed:", upErr.message);
    }

    await logTtsCall({
      ...meta,
      characters,
      voice_id: voiceId,
      model: modelId,
      latency_ms: latency,
      cache_hit: false,
    });

    return audioResponse(audio, false);
  } catch (e) {
    console.error("[closer-tts] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
