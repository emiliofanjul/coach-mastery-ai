// Closer TTS — converts text to speech via ElevenLabs.
// Returns audio/mpeg bytes. Keeps the ELEVENLABS_API_KEY on the server.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default Closer voice — Spanish-friendly multilingual voice.
const DEFAULT_VOICE_ID = "TX3LPaxmHKxFdv7VOQHJ"; // Liam
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

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
    return new Response(audio, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("[closer-tts] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
