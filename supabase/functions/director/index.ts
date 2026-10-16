// director — Separación Actor/Director (v2.0.0 architecture)
//
// El Director corre DESPUÉS de cada turno del usuario en phase=you_do.
// Nunca actúa. Nunca habla. Solo decide: continuar o cortar.
//
// Orden de decisión:
//   1) Reglas duras deterministas (sin LLM):
//      - user_turns >= limits.max_turns  → cut(max_turns)
//      - elapsed_seconds >= limits.max_duration_seconds → cut(max_duration)
//      - user_turns  < limits.min_turns_before_evaluation → solo se revisa
//        si hubo una falla critical (abajo); si no, continue
//   2) Clasificador (sonnet):
//      - falla_critica: el vendedor ya cometió una falla critical del nodo
//        → cut(critical_failure), en cualquier turno (v2.3.0). Con una falla
//        critical la nota ya no pasa de 30: más turnos no cambian nada.
//      - scope_covered / evidence_sufficient → cut (solo pasado el mínimo)
//      - si no → continue
//
// El frontend maneja el "turno de gracia": el Actor responde el turno en curso
// ANTES de que el Director corte — porque el Director corre DESPUÉS de la
// respuesta del Actor, no antes.
//
// Toda decisión se loggea en llm_calls con phase='director' (solo cuando corre
// el clasificador — las reglas duras no consumen LLM).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { quienLlama, respuestaNoAutorizado } from "../_shared/quien_llama.ts";

const DIRECTOR_VERSION = "v2.4.0-sonnet";
const DIRECTOR_MODEL = "claude-sonnet-4-5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

let _admin: ReturnType<typeof createClient> | null = null;
function getAdmin() {
  if (_admin) return _admin;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  _admin = createClient(url, key, { auth: { persistSession: false } });
  return _admin;
}

async function logLlmCall(row: {
  input_tokens: number | null;
  output_tokens: number | null;
  cached_tokens?: number | null;
  cache_creation_tokens?: number | null;
  latency_ms: number;
  session_id?: string | null;
  company_id?: string | null;
  seller_id?: string | null;
}) {
  try {
    const admin = getAdmin();
    if (!admin) return;
    await admin.from("llm_calls").insert({
      phase: "director",
      prompt_version: DIRECTOR_VERSION,
      model: DIRECTOR_MODEL,
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
      cached_tokens: row.cached_tokens ?? null,
      cache_creation_tokens: row.cache_creation_tokens ?? null,
      latency_ms: row.latency_ms,
      session_id: row.session_id ?? null,
      company_id: row.company_id ?? null,
      seller_id: row.seller_id ?? null,
    });
  } catch (e) {
    console.error("[director] llm_calls insert failed:", e);
  }
}

async function logDirectorDecision(row: {
  session_id?: string | null;
  node_id?: string | null;
  decision: string;
  cut_reason: string | null;
  user_turns: number;
  elapsed_seconds: number | null;
  classifier_ran: boolean;
  scope_covered: boolean | null;
  evidence_sufficient: boolean | null;
  latency_ms: number;
}) {
  try {
    const admin = getAdmin();
    if (!admin) return;
    await admin.from("director_decisions").insert({
      session_id: row.session_id ?? null,
      node_id: row.node_id ?? null,
      decision: row.decision,
      cut_reason: row.cut_reason,
      user_turns: row.user_turns,
      elapsed_seconds: row.elapsed_seconds,
      classifier_ran: row.classifier_ran,
      scope_covered: row.scope_covered,
      evidence_sufficient: row.evidence_sufficient,
      latency_ms: row.latency_ms,
      director_version: DIRECTOR_VERSION,
    });
  } catch (e) {
    console.error("[director] director_decisions insert failed:", e);
  }
}

interface ReqBody {
  practice_script: any;
  conversation_history: { role: string; content: string }[];
  elapsed_seconds?: number;
  session_id?: string | null;
  node_id?: string | null;
  company_id?: string | null;
  seller_id?: string | null;
}

type Decision = "continue" | "cut";
type Reason =
  | "max_turns"
  | "max_duration"
  | "min_turns_gate"
  | "scope_covered"
  | "evidence_sufficient"
  | "scope_not_covered"
  | "no_objective"
  | "classifier_error"
  | "critical_failure";

interface DirectorResult {
  decision: Decision;
  reason: Reason;
  user_turns: number;
  elapsed_seconds: number | null;
  classifier_ran: boolean;
  classifier_result: boolean | null;
  scope_covered: boolean | null;
  evidence_sufficient: boolean | null;
  latency_ms: number;
  director_version: string;
}

function extractJson<T>(text: string): T | null {
  const t = (text ?? "").trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try { return JSON.parse(t) as T; } catch {
    const m = t.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]) as T; } catch { /* fall through */ } }
    return null;
  }
}

// Reglas del clasificador: idénticas byte por byte en cada turno → bloque cacheable.
const CLASSIFIER_RULES = `Eres un clasificador. Dado el objetivo de una práctica de ventas y el transcript de la conversación entre vendedor (user) y cliente (assistant), responde ÚNICAMENTE un JSON de una sola línea con esta forma exacta: {"scope_covered": true|false, "evidence_sufficient": true|false, "falla_critica": true|false}. Sin texto fuera del JSON. Sin markdown.

REGLAS:
- LOS CRITERIOS MANDAN. El objetivo en prosa da contexto, pero lo que define la cobertura son los CRITERIOS DE ÉXITO del nodo: son exactamente lo que el evaluador va a calificar. Si el objetivo pide algo que ningún criterio mide, ESO NO CUENTA para scope_covered — el vendedor no puede ser cortado ni retenido por una meta que nadie va a calificar.
- scope_covered = true SOLO si el vendedor (user) ya ejecutó de forma COMPLETA lo que piden los CRITERIOS DE ÉXITO.
- Si un criterio enumera elementos concretos (por ejemplo: qué cubre, qué queda fuera, hasta cuándo dura), scope_covered = true solo cuando TODOS aparecen en el transcript.
- No exijas un ORDEN que los criterios no nombren. Hay varias rutas válidas para llegar a lo mismo.
- evidence_sufficient = true si el transcript ya contiene material SUFICIENTE para EVALUAR el desempeño del vendedor en ese objetivo, LO HAYA LOGRADO O NO — sus intentos, su approach y su nivel ya son visibles y más turnos no agregarían información nueva.
- Prefiere evidence_sufficient=true cuando el vendedor ya intentó su approach 2-3 veces sin cambiar de estrategia: ya sabes cómo lo hace.
- Ambos flags son independientes: un vendedor puede fallar el objetivo (scope_covered=false) pero haber mostrado suficiente para ser evaluado (evidence_sufficient=true).
- falla_critica = true SOLO si el vendedor (user) ya dijo algo que encaja SIN DUDA con una de las FALLAS CRÍTICAS DEL NODO: tiene que existir una frase literal suya que lo muestre. Lo que dice el cliente nunca cuenta. Ante la duda, false. Si el nodo no tiene fallas críticas, false.
- EL ORDEN IMPORTA. Si una falla habla de cómo reacciona el vendedor a algo que dijo el cliente (por ejemplo "después del segundo bloqueo", "ante el primer bloqueo", "cuando el cliente pregunta…"), la frase del vendedor tiene que venir DESPUÉS de ese mensaje del cliente en el transcript. Si el último mensaje es del cliente, lo que el vendedor todavía no ha contestado no puede ser falla: false.
- Una muletilla no es una falla: "de volada", "oiga", "mire", "este", "fíjese" no son pedir permiso ni insistir.`;

async function runClassifier(
  objective: string,
  criterios: string,
  criticas: string,
  conversation_history: { role: string; content: string }[],
  apiKey: string,
  session_id: string | null,
  ids: { company_id?: string | null; seller_id?: string | null } = {},
): Promise<{
  scope_covered: boolean | null;
  evidence_sufficient: boolean | null;
  falla_critica: boolean | null;
  latency_ms: number;
  error?: string;
}> {
  // Fijo primero (cacheado), variable después.
  const system = [
    { type: "text", text: CLASSIFIER_RULES, cache_control: { type: "ephemeral" } },
    { type: "text", text: `CRITERIOS DE ÉXITO DEL NODO (lo que el evaluador va a calificar — mandan sobre el objetivo):\n${criterios}\n\nFALLAS CRÍTICAS DEL NODO:\n${criticas}\n\nOBJETIVO DE LA PRÁCTICA (contexto, no rúbrica):\n${objective}` },
  ];

  const user = `TRANSCRIPT:
${JSON.stringify(conversation_history, null, 2)}

Responde solo el JSON.`;

  const start = Date.now();
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DIRECTOR_MODEL,
        max_tokens: 64,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    const latency_ms = Date.now() - start;
    if (!res.ok) {
      const errText = await res.text();
      console.error("[director] haiku error:", res.status, errText);
      logLlmCall({ input_tokens: null, output_tokens: null, latency_ms, session_id, ...ids });
      return { scope_covered: null, evidence_sufficient: null, falla_critica: null, latency_ms, error: `haiku ${res.status}` };
    }
    const j = await res.json();
    const text: string = j?.content?.[0]?.text ?? "";
    const it = j?.usage?.input_tokens ?? null;
    const ot = j?.usage?.output_tokens ?? null;
    logLlmCall({
      input_tokens: it,
      output_tokens: ot,
      cached_tokens: j?.usage?.cache_read_input_tokens ?? null,
      cache_creation_tokens: j?.usage?.cache_creation_input_tokens ?? null,
      latency_ms,
      session_id,
      ...ids,
    });
    const parsed = extractJson<{ scope_covered?: unknown; evidence_sufficient?: unknown; falla_critica?: unknown }>(text);
    if (!parsed || typeof parsed.scope_covered !== "boolean") {
      return { scope_covered: null, evidence_sufficient: null, falla_critica: null, latency_ms, error: "unparseable classifier output" };
    }
    const ev = typeof parsed.evidence_sufficient === "boolean" ? parsed.evidence_sufficient : false;
    return { scope_covered: parsed.scope_covered, evidence_sufficient: ev, falla_critica: parsed.falla_critica === true, latency_ms };
  } catch (e) {
    const latency_ms = Date.now() - start;
    console.error("[director] haiku exception:", e);
    return { scope_covered: null, evidence_sufficient: null, falla_critica: null, latency_ms, error: e instanceof Error ? e.message : String(e) };
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
    // Solo usuarios con sesión (oct-2026): antes era pública.
    const quien = await quienLlama(req);
    if (!quien) return respuestaNoAutorizado(corsHeaders);

    const body = (await req.json()) as ReqBody;
    // El consumo queda a nombre de quien de verdad llama, no de lo que diga el cuerpo.
    if (quien.tipo === "usuario") {
      body.company_id = quien.companyId;
      body.seller_id = quien.sellerId;
    }
    const { practice_script, conversation_history, elapsed_seconds, session_id, node_id } = body;

    if (!practice_script || !Array.isArray(conversation_history)) {
      return new Response(JSON.stringify({ error: "Missing practice_script or conversation_history" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user_turns = conversation_history.filter((m) => m?.role === "user").length;
    const elapsed = typeof elapsed_seconds === "number" && Number.isFinite(elapsed_seconds) ? elapsed_seconds : null;

    const limits = practice_script?.limits ?? {};
    const max_turns: number | null = typeof limits.max_turns === "number" ? limits.max_turns : null;
    const max_duration: number | null = typeof limits.max_duration_seconds === "number" ? limits.max_duration_seconds : null;
    const min_turns_gate: number = typeof limits.min_turns_before_evaluation === "number" ? limits.min_turns_before_evaluation : 1;

    const base = {
      user_turns,
      elapsed_seconds: elapsed,
      classifier_ran: false,
      classifier_result: null as boolean | null,
      scope_covered: null as boolean | null,
      evidence_sufficient: null as boolean | null,
      latency_ms: 0,
      director_version: DIRECTOR_VERSION,
    };

    const respond = (result: DirectorResult) => {
      logDirectorDecision({
        session_id: session_id ?? null,
        node_id: node_id ?? null,
        decision: result.decision,
        cut_reason: result.decision === "cut" ? result.reason : null,
        user_turns: result.user_turns,
        elapsed_seconds: result.elapsed_seconds,
        classifier_ran: result.classifier_ran,
        scope_covered: result.scope_covered,
        evidence_sufficient: result.evidence_sufficient,
        latency_ms: result.latency_ms,
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    };

    // Regla dura 1: max_turns
    if (max_turns !== null && user_turns >= max_turns) {
      return respond({ ...base, decision: "cut", reason: "max_turns" });
    }

    // Regla dura 2: max_duration
    if (max_duration !== null && elapsed !== null && elapsed >= max_duration) {
      return respond({ ...base, decision: "cut", reason: "max_duration" });
    }

    // Las fallas critical del nodo. Una falla critical deja la nota en 30 sin
    // importar lo demás: en cuanto aparece, ya hay evidencia suficiente, aunque
    // no se haya llegado al mínimo de turnos (disputa 1.5, 14-oct-2026: el
    // vendedor soltó producto y la práctica siguió).
    const failureCriteria = Array.isArray(practice_script?.failure_criteria) ? practice_script.failure_criteria : [];
    const criticasLista = failureCriteria.filter((f: any) => f?.severity === "critical");
    const criticas = criticasLista.length > 0
      ? criticasLista.map((f: any) => `- ${f?.id ?? "?"}: ${f?.description ?? ""}`).join("\n")
      : "(este nodo no tiene fallas críticas)";
    const antesDelMinimo = user_turns < min_turns_gate;

    // Regla dura 3: gate mínimo antes de considerar scope (si el nodo no
    // tiene fallas critical, ni siquiera corre el clasificador).
    if (antesDelMinimo && criticasLista.length === 0) {
      return respond({ ...base, decision: "continue", reason: "min_turns_gate" });
    }

    // Clasificador
    const objective: string | undefined = practice_script?.phases?.you_do?.objective;
    if (!objective || typeof objective !== "string" || objective.trim().length === 0) {
      return respond({ ...base, decision: "continue", reason: antesDelMinimo ? "min_turns_gate" : "no_objective" });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return respond({ ...base, decision: "continue", reason: antesDelMinimo ? "min_turns_gate" : "classifier_error" });
    }

    // Los criterios que el evaluador va a calificar. Sin ellos el Director
    // persigue una prosa que puede pedir más (o menos) de lo que se mide.
    const successCriteria = Array.isArray(practice_script?.success_criteria)
      ? practice_script.success_criteria
      : [];
    const criterios = successCriteria.length > 0
      ? successCriteria
          .map((c: any) => `- [peso ${c?.weight ?? "?"}] ${c?.regla_resumen ?? ""}${c?.contexto_nodo ? ` — En este nodo: ${c.contexto_nodo}` : ` ${c?.description ?? ""}`}`)
          .join("\n")
      : "(este nodo no declara criterios de éxito; usa solo el objetivo)";

    const cls = await runClassifier(objective, criterios, criticas, conversation_history, apiKey, session_id ?? null, {
      company_id: body.company_id ?? null,
      seller_id: body.seller_id ?? null,
    });
    if (cls.scope_covered === null) {
      // Fail-open: si el clasificador falla, no cortamos por scope. Las reglas
      // duras (max_turns/max_duration) siguen protegiendo el techo.
      return respond({
        ...base,
        classifier_ran: true,
        latency_ms: cls.latency_ms,
        decision: "continue",
        reason: antesDelMinimo ? "min_turns_gate" : "classifier_error",
      });
    }

    if (cls.falla_critica === true) {
      return respond({
        ...base,
        classifier_ran: true,
        classifier_result: cls.scope_covered,
        scope_covered: cls.scope_covered,
        evidence_sufficient: true,
        latency_ms: cls.latency_ms,
        decision: "cut",
        reason: "critical_failure",
      });
    }
    if (antesDelMinimo) {
      return respond({ ...base, classifier_ran: true, latency_ms: cls.latency_ms, decision: "continue", reason: "min_turns_gate" });
    }

    // v2.1.0: corta por scope_covered O por evidence_sufficient.
    // Evaluar QUÉ TAN BIEN lo hizo es del evaluador; el Director corta por
    // evidencia suficiente (aunque el objetivo no se haya logrado).
    const shouldCut = cls.scope_covered === true || cls.evidence_sufficient === true;
    const reason: Reason = shouldCut
      ? (cls.scope_covered ? "scope_covered" : "evidence_sufficient")
      : "scope_not_covered";

    return respond({
      ...base,
      classifier_ran: true,
      classifier_result: cls.scope_covered,
      scope_covered: cls.scope_covered,
      evidence_sufficient: cls.evidence_sufficient,
      latency_ms: cls.latency_ms,
      decision: shouldCut ? "cut" : "continue",
      reason,
    });
  } catch (e) {
    console.error("[director] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
