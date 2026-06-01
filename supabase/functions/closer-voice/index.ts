// Closer voice brain — Edge Function
// Receives transcript + context, calls Claude, returns structured JSON.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Phase = "i_do" | "you_do" | "boss_sim" | "closing" | "evaluate";
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

interface EvaluationResponse {
  score: number;
  stars: 1 | 2 | 3;
  observations: string[];
  end_session: true;
}

function buildEvaluateSystemPrompt(practice_script: any): string {
  const successCriteria = practice_script?.success_criteria ?? practice_script?.successCriteria ?? [];
  const failureCriteria = practice_script?.failure_criteria ?? practice_script?.failureCriteria ?? [];
  const successStr = Array.isArray(successCriteria) ? JSON.stringify(successCriteria, null, 2) : String(successCriteria);
  const failureStr = Array.isArray(failureCriteria) ? JSON.stringify(failureCriteria, null, 2) : String(failureCriteria);

  return `Evalúa esta conversación de práctica de ventas.
Criterios del nodo: ${successStr}
Errores críticos: ${failureStr}

Evalúa ÚNICAMENTE los criterios del nodo. No menciones conceptos que el vendedor no ha aprendido.

Responde JSON:
{
  "score": número del 0 al 100,
  "stars": 1, 2 o 3 según score (1=<60, 2=60-84, 3=85+),
  "observations": ["observación 1", "observación 2", "observación 3"],
  "end_session": true
}

No incluyas texto fuera del JSON.`;
}

function buildSystemPrompt(phase: Phase, company_brain: string, seller_name: string, practice_script: any): string {
  const technique = practice_script?.technique ?? practice_script?.skill ?? practice_script?.name ?? "";
  const successCriteria = practice_script?.success_criteria ?? practice_script?.successCriteria ?? [];
  const failureCriteria = practice_script?.failure_criteria ?? practice_script?.failureCriteria ?? [];
  const successStr = Array.isArray(successCriteria) ? JSON.stringify(successCriteria, null, 2) : String(successCriteria);
  const failureStr = Array.isArray(failureCriteria) ? JSON.stringify(failureCriteria, null, 2) : String(failureCriteria);

  const evalBlock = `EVALUACIÓN — REGLA CRÍTICA:
Evalúa ÚNICAMENTE los criterios del practice_script de este nodo.
No menciones ni evalúes conceptos que no estén en success_criteria.
No uses lenguaje de técnicas que el vendedor no ha aprendido todavía.
Los criterios de este nodo son: ${successStr}
Los errores críticos son: ${failureStr}
El feedback debe ser específico a estos criterios únicamente.
Esto aplica tanto al message durante la conversación como a las observaciones finales del feedback.`;

  let roleBlock = "";
  if (phase === "i_do") {
    roleBlock = `ERES EL VENDEDOR. Actúa SOLO como vendedor. Nunca como cliente.
En i_do demuestras la técnica ejecutándola en primera persona. El usuario juega al cliente.
Mantén el rol de vendedor durante TODA la conversación, sin importar lo que diga el usuario.`;
  } else if (phase === "you_do") {
    roleBlock = `ERES EL CLIENTE. Actúa SOLO como cliente. Nunca como vendedor.
En you_do el usuario es el vendedor que practica. Tú reaccionas como cliente real.
Mantén el rol de cliente durante TODA la conversación, sin importar lo que diga el usuario.

CUÁNDO TERMINAR EN YOU_DO:
El scope de esta práctica es SOLO los primeros 10 segundos — la apertura.
Termina la sesión (end_session: true) después de 1-2 turnos máximo.
En cuanto el vendedor haya saludado y dicho quién es — ya tienes suficiente evidencia.
NO dejes que la conversación llegue a discovery, preguntas, ni producto.`;
  } else if (phase === "boss_sim") {
    roleBlock = `ERES EL CLIENTE DIFÍCIL. Actúa SOLO como cliente. Nunca como vendedor.`;
  } else {
    roleBlock = `Fase de cierre. Una sola línea operativa y termina.`;
  }

  return `Eres Closer. Entrenador operativo de ventas.
NO eres un asistente. NO eres un chatbot. NO tienes conversaciones libres.
Ejecutas prácticas estructuradas de ventas. Nada más.

${roleBlock}

${evalBlock}

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
- Nunca cambies de rol a mitad de la conversación
- Máximo 2-3 frases por respuesta — respuestas cortas naturales para voz

CONTEXTO DE SESIÓN:
Fase activa: ${phase}
Técnica: ${technique}
Empresa: ${company_brain}
Vendedor: ${seller_name}
Practice script: ${JSON.stringify(practice_script ?? {}, null, 2)}

CUÁNDO TERMINAR (general):
Cuando el vendedor haya demostrado suficiente evidencia — buena o mala — responde con end_session: true.
No prolongues innecesariamente.

RESPONDE SIEMPRE JSON VÁLIDO:
{"message": "texto corto natural", "next_phase": "you_do|closing|end", "end_session": false}
Sin texto fuera del JSON. Sin markdown. Solo JSON.`;
}

function extractJson<T>(text: string): T {
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

    if (!phase || (phase !== "evaluate" && !transcript)) {
      return new Response(JSON.stringify({ error: "Missing transcript or phase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = phase === "evaluate"
      ? buildEvaluateSystemPrompt(practice_script)
      : buildSystemPrompt(phase, company_brain ?? "", seller_name ?? "", practice_script);

    const messages = phase === "evaluate" ? [
      {
        role: "user",
        content: `conversation_history:\n${JSON.stringify(Array.isArray(conversation_history) ? conversation_history : [], null, 2)}`,
      },
    ] : [
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

    let parsed: CloserResponse | EvaluationResponse;
    try {
      parsed = extractJson<CloserResponse | EvaluationResponse>(text);
    } catch (e) {
      console.error("[closer-voice] parse error:", e, "raw:", text);
      return new Response(
        JSON.stringify({ error: "Invalid JSON from Claude", raw: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (phase === "evaluate") {
      const evaluation = parsed as EvaluationResponse;
      if (
        typeof evaluation.score !== "number" ||
        ![1, 2, 3].includes(evaluation.stars) ||
        !Array.isArray(evaluation.observations) ||
        evaluation.observations.length !== 3 ||
        evaluation.end_session !== true
      ) {
        return new Response(
          JSON.stringify({ error: "Malformed evaluation response", parsed: evaluation }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify(evaluation), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const closerResponse = parsed as CloserResponse;
    if (typeof closerResponse.message !== "string" || typeof closerResponse.next_phase !== "string" || typeof closerResponse.end_session !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Malformed Closer response", parsed }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(closerResponse), {
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
