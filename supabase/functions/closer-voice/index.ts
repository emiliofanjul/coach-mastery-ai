// Closer voice brain — Edge Function
// Receives transcript + context, calls Claude, returns structured JSON.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Phase = "i_do" | "you_do" | "boss_sim" | "closing";
type NextPhase = Phase | "end";

interface ReqBody {
  transcript: string;
  phase: Phase;
  practice_script: any;
  company_brain: string;
  seller_name: string;
  conversation_history: { role: string; content: string }[];
}

interface CloserResponse {
  message: string;
  next_phase: NextPhase;
  end_session: boolean;
}

function buildSystemPrompt(phase: Phase, company_brain: string, seller_name: string, practice_script: any): string {
  const technique = practice_script?.technique ?? practice_script?.skill ?? practice_script?.name ?? "";
  return `Eres Closer. Entrenador operativo de ventas.
NO eres un asistente. NO eres un chatbot. NO tienes conversaciones libres.
Ejecutas prácticas estructuradas de ventas. Nada más.

FILOSOFÍA:
Closer opera como Doctor Vendedor — diagnostica antes de recetar.
No enseña personalidad ni carisma. Enseña sistemas, estructura y ejecución observable.
El objetivo es vendedores consistentes y replicables, no estrellas.

PROHIBICIONES ABSOLUTAS:
- Nunca digas: excelente, genial, perfecto, muy bien, fantástico
- Nunca uses markdown, asteriscos ni negritas — solo texto plano
- Nunca etiquetes conceptos en voz: [sonrisa], [contacto_visual], etc.
- Nunca expliques teoría fuera del scope del nodo activo
- Nunca continues el pitch más allá de la técnica activa
- Nunca rompas personaje durante simulaciones
- Máximo 2-3 frases por respuesta — respuestas cortas naturales para voz

FASES:
- i_do: Eres el vendedor. Demuestras la técnica. Natural, real, sin etiquetar nada.
- you_do: Eres el cliente. Reaccionas naturalmente. NO coacheas, NO felicitas, NO guías.
- boss_sim: Eres un cliente difícil y realista. Resistencia natural, sin exagerar.
- closing: Una sola línea de cierre operativa.

CONTEXTO DE SESIÓN:
Fase activa: ${phase}
Técnica: ${technique}
Empresa: ${company_brain}
Vendedor: ${seller_name}
Practice script: ${JSON.stringify(practice_script ?? {}, null, 2)}

CUÁNDO TERMINAR:
Cuando el vendedor haya demostrado suficiente evidencia — buena o mala — responde con end_session: true.
No prolongues innecesariamente.

RESPONDE SIEMPRE JSON VÁLIDO:
{"message": "texto corto natural", "next_phase": "you_do|closing|end", "end_session": false}
Sin texto fuera del JSON. Sin markdown. Solo JSON.`;
}

function extractJson(text: string): CloserResponse {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Claude did not return parseable JSON: " + text.slice(0, 200));
  }
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
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const body = (await req.json()) as ReqBody;
    const { transcript, phase, practice_script, company_brain, seller_name, conversation_history } = body;

    if (!transcript || !phase) {
      return new Response(JSON.stringify({ error: "Missing transcript or phase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = buildSystemPrompt(phase, company_brain ?? "", seller_name ?? "", practice_script);

    const messages = [
      ...(Array.isArray(conversation_history) ? conversation_history : []).map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      { role: "user", content: transcript },
    ];

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system,
        messages,
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      console.error("[closer-voice] Claude error:", claudeRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Claude API error", status: claudeRes.status, detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const claudeJson = await claudeRes.json();
    const text: string = claudeJson?.content?.[0]?.text ?? "";

    let parsed: CloserResponse;
    try {
      parsed = extractJson(text);
    } catch (e) {
      console.error("[closer-voice] parse error:", e, "raw:", text);
      return new Response(
        JSON.stringify({ error: "Invalid JSON from Claude", raw: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (typeof parsed.message !== "string" || typeof parsed.next_phase !== "string" || typeof parsed.end_session !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Malformed Closer response", parsed }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[closer-voice] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
