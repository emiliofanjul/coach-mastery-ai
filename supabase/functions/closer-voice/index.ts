// Closer voice brain — Edge Function
// Receives transcript + context, calls Claude, returns structured JSON.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Phase = "i_do" | "you_do" | "boss_sim" | "closing" | "evaluate" | "generate_example";
type NextPhase = Phase | "end";

interface ReqBody {
  transcript?: string;
  phase: Phase;
  practice_script?: any;
  company_brain?: string;
  seller_name?: string;
  conversation_history?: { role: string; content: string }[];
  // generate_example fields
  card_type?: "good_example" | "bad_example";
  node_name?: string;
  seller_industry?: string;
}

interface CloserResponse {
  message: string;
  next_phase: NextPhase;
  end_session: boolean;
}

interface EvaluationObservation {
  error: string;
  mejora: string;
  ejemplo: string;
}

interface EvaluationResponse {
  score: number;
  stars: 1 | 2 | 3;
  observations: EvaluationObservation[];
  mision: string;
  end_session: true;
}

function buildEvaluateSystemPrompt(practice_script: any): string {
  const successCriteria = practice_script?.success_criteria ?? practice_script?.successCriteria ?? [];
  const failureCriteria = practice_script?.failure_criteria ?? practice_script?.failureCriteria ?? [];
  const successStr = Array.isArray(successCriteria) ? JSON.stringify(successCriteria, null, 2) : String(successCriteria);
  const failureStr = Array.isArray(failureCriteria) ? JSON.stringify(failureCriteria, null, 2) : String(failureCriteria);

  return `Evalúa esta conversación de práctica de ventas.
Criterios del nodo (success_criteria): ${successStr}
Errores críticos (failure_criteria): ${failureStr}

IMPORTANTE: El vendedor es el 'user' en el historial. Closer es el 'assistant'.
Evalúa ÚNICAMENTE el desempeño del 'user' (el vendedor).
No evalúes ni menciones el comportamiento del 'assistant' (Closer).

Evalúa ÚNICAMENTE en base a los success_criteria y failure_criteria del practice_script.
NO uses criterios genéricos de ventas. NO menciones conceptos que el vendedor no ha aprendido.

Cada observación debe ser un objeto con 3 campos:
- "error": frase corta describiendo qué hizo mal el vendedor (concreta, basada en lo que dijo).
- "mejora": frase diciendo exactamente qué debe hacer diferente la próxima vez.
- "ejemplo": cómo debería haber sonado exactamente, usando el contexto real de la empresa y el nombre del cliente que aparece en la conversación. Debe sonar natural, en primera persona del vendedor.

Además incluye un campo "mision": UNA sola acción concreta y específica para practicar antes de la próxima sesión, ligada directamente a los criterios del nodo. Debe ser accionable, no genérica.

Responde JSON exacto:
{
  "score": número del 0 al 100,
  "stars": 1, 2 o 3 según score (1=<60, 2=60-84, 3=85+),
  "observations": [
    { "error": "...", "mejora": "...", "ejemplo": "..." },
    { "error": "...", "mejora": "...", "ejemplo": "..." },
    { "error": "...", "mejora": "...", "ejemplo": "..." }
  ],
  "mision": "...",
  "end_session": true
}

No incluyas texto fuera del JSON.`;
}

interface GenerateExampleResponse {
  body: string;
  flip_back: string;
}

function buildGenerateExampleSystemPrompt(
  cardType: "good_example" | "bad_example",
  nodeName: string,
  companyBrain: string,
  sellerIndustry: string,
): string {
  const tipo = cardType === "good_example" ? "good_example" : "bad_example";
  const direccion = cardType === "good_example"
    ? "Muestra cómo se ve bien ejecutado usando el contexto real de la empresa. Concreto, natural, replicable."
    : "Muestra el error más común que comete un vendedor en esta situación. Concreto, realista, basado en lo que de verdad pasa en campo.";

  return `Genera un ejemplo corto y realista de máximo 3 frases para una tarjeta de aprendizaje de ventas.

Tipo de tarjeta: ${tipo}
Nodo / técnica: ${nodeName}
Industria del vendedor: ${sellerIndustry || "no especificada"}
Contexto de la empresa: ${companyBrain || "no especificado"}

Instrucción:
${direccion}

Usa nombres reales (clientes, productos, situaciones) propios de la industria del vendedor.
Suena como una persona real hablando, no como un manual.
Máximo 3 frases en el campo body.
En el campo flip_back, explica en 1-2 frases por qué ese ejemplo ${cardType === "good_example" ? "funciona" : "falla"}, ligado al concepto del nodo.

Responde JSON exacto:
{ "body": "...", "flip_back": "..." }

No incluyas texto fuera del JSON. Sin markdown.`;
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
Mantén el rol de vendedor durante TODA la conversación, sin importar lo que diga el usuario.

CUÁNDO TERMINAR EN I_DO:
El scope de esta demostración está definido en practice_script.scope.skills_in_focus.
Demuestra ÚNICAMENTE las skills en ese scope.
Cuando hayas cubierto el scope completamente y el cliente haya respondido al menos una vez, termina con end_session: true.
NO avances a skills o pasos que no estén en skills_in_focus.`;
  } else if (phase === "you_do") {
    roleBlock = `ERES EL CLIENTE. Actúa SOLO como cliente. Nunca como vendedor.
En you_do el usuario es el vendedor que practica. Tú reaccionas como cliente real.
Mantén el rol de cliente durante TODA la conversación, sin importar lo que diga el usuario.

IMPORTANTE: Eres un cliente nuevo que el vendedor acaba de encontrar.
NO inventes historial de pedidos, productos específicos, ni contexto que el vendedor no haya mencionado.
Reacciona SOLO a lo que el vendedor diga en esta conversación.

CUÁNDO TERMINAR EN YOU_DO:
Cuando tengas suficiente evidencia — buena o mala — termina la sesión.
SIEMPRE incluye un message de cierre antes de end_session: true.
El message de cierre debe ser exactamente: "Perfecto, tengo lo que necesito. Vamos a revisar cómo te fue."
Nunca termines con end_session: true sin un message.


CÓMO CERRAR EN YOU_DO:
Cuando termines (end_session: true), sal del personaje de cliente y habla como Closer guiando al vendedor hacia lo siguiente.
El message debe ser corto, orientador y cálido — algo como: "Listo, tengo lo que necesito. Vamos a ver cómo te fue."
NUNCA cierres con frases que suenen a corte abrupto tipo "Lo dejamos aquí" o "Hasta aquí llegamos".
Siempre indica qué sigue: revisar el feedback de la sesión.`;
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
    const { transcript, phase, practice_script, company_brain, seller_name, conversation_history, card_type, node_name, seller_industry } = body;

    if (!phase) {
      return new Response(JSON.stringify({ error: "Missing phase" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (phase !== "evaluate" && phase !== "generate_example" && !transcript) {
      return new Response(JSON.stringify({ error: "Missing transcript" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (phase === "generate_example" && (!card_type || (card_type !== "good_example" && card_type !== "bad_example"))) {
      return new Response(JSON.stringify({ error: "Missing or invalid card_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const system = phase === "evaluate"
      ? buildEvaluateSystemPrompt(practice_script)
      : phase === "generate_example"
        ? buildGenerateExampleSystemPrompt(card_type!, node_name ?? "", company_brain ?? "", seller_industry ?? "")
        : buildSystemPrompt(phase, company_brain ?? "", seller_name ?? "", practice_script);

    const messages = phase === "evaluate" ? [
      {
        role: "user",
        content: `conversation_history:\n${JSON.stringify(Array.isArray(conversation_history) ? conversation_history : [], null, 2)}`,
      },
    ] : phase === "generate_example" ? [
      { role: "user", content: `Genera el ejemplo ahora.` },
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
      const obsValid =
        Array.isArray(evaluation.observations) &&
        evaluation.observations.length === 3 &&
        evaluation.observations.every(
          (o: any) =>
            o && typeof o === "object" &&
            typeof o.error === "string" &&
            typeof o.mejora === "string" &&
            typeof o.ejemplo === "string",
        );
      if (
        typeof evaluation.score !== "number" ||
        ![1, 2, 3].includes(evaluation.stars) ||
        !obsValid ||
        typeof evaluation.mision !== "string" ||
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
