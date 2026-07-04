// director — Separación Actor/Director (v2.0.0 architecture)
//
// El Director corre DESPUÉS de cada turno del usuario en phase=you_do.
// Nunca actúa. Nunca habla. Solo decide: continuar o cortar.
//
// Orden de decisión:
//   1) Reglas duras deterministas (sin LLM):
//      - user_turns >= limits.max_turns  → cut(max_turns)
//      - elapsed_seconds >= limits.max_duration_seconds → cut(max_duration)
//      - user_turns  < limits.min_turns_before_evaluation → continue
//   2) Clasificador binario (haiku, muy barato):
//      - {scope_covered: true|false} contra phases.you_do.objective
//      - true  → cut(scope_covered)
//      - false → continue
//
// El frontend maneja el "turno de gracia": el Actor responde el turno en curso
// ANTES de que el Director corte — porque el Director corre DESPUÉS de la
// respuesta del Actor, no antes.
//
// Toda decisión se loggea en llm_calls con phase='director' (solo cuando corre
// el clasificador — las reglas duras no consumen LLM).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const DIRECTOR_VERSION = "v2.1.0";
const HAIKU_MODEL = "claude-haiku-4-5";

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
  latency_ms: number;
  session_id?: string | null;
}) {
  try {
    const admin = getAdmin();
    if (!admin) return;
    await admin.from("llm_calls").insert({
      phase: "director",
      prompt_version: DIRECTOR_VERSION,
      model: HAIKU_MODEL,
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
      latency_ms: row.latency_ms,
      session_id: row.session_id ?? null,
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
  | "classifier_error";

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

async function runClassifier(
  objective: string,
  conversation_history: { role: string; content: string }[],
  apiKey: string,
  session_id: string | null,
): Promise<{
  scope_covered: boolean | null;
  evidence_sufficient: boolean | null;
  latency_ms: number;
  error?: string;
}> {
  const system = `Eres un clasificador. Dado el objetivo de una práctica de ventas y el transcript de la conversación entre vendedor (user) y cliente (assistant), responde ÚNICAMENTE un JSON de una sola línea con esta forma exacta: {"scope_covered": true|false, "evidence_sufficient": true|false}. Sin texto fuera del JSON. Sin markdown.

REGLAS:
- scope_covered = true SOLO si el vendedor (user) ya ejecutó de forma COMPLETA lo que el objetivo pide.
- evidence_sufficient = true si el transcript ya contiene material SUFICIENTE para EVALUAR el desempeño del vendedor en ese objetivo, LO HAYA LOGRADO O NO — sus intentos, su approach y su nivel ya son visibles y más turnos no agregarían información nueva.
- Prefiere evidence_sufficient=true cuando el vendedor ya intentó su approach 2-3 veces sin cambiar de estrategia: ya sabes cómo lo hace.
- Ambos flags son independientes: un vendedor puede fallar el objetivo (scope_covered=false) pero haber mostrado suficiente para ser evaluado (evidence_sufficient=true).

OBJETIVO DE LA PRÁCTICA:
${objective}`;

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
        model: HAIKU_MODEL,
        max_tokens: 64,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });
    const latency_ms = Date.now() - start;
    if (!res.ok) {
      const errText = await res.text();
      console.error("[director] haiku error:", res.status, errText);
      logLlmCall({ input_tokens: null, output_tokens: null, latency_ms, session_id });
      return { scope_covered: null, evidence_sufficient: null, latency_ms, error: `haiku ${res.status}` };
    }
    const j = await res.json();
    const text: string = j?.content?.[0]?.text ?? "";
    const it = j?.usage?.input_tokens ?? null;
    const ot = j?.usage?.output_tokens ?? null;
    logLlmCall({ input_tokens: it, output_tokens: ot, latency_ms, session_id });
    const parsed = extractJson<{ scope_covered?: unknown; evidence_sufficient?: unknown }>(text);
    if (!parsed || typeof parsed.scope_covered !== "boolean") {
      return { scope_covered: null, evidence_sufficient: null, latency_ms, error: "unparseable classifier output" };
    }
    const ev = typeof parsed.evidence_sufficient === "boolean" ? parsed.evidence_sufficient : false;
    return { scope_covered: parsed.scope_covered, evidence_sufficient: ev, latency_ms };
  } catch (e) {
    const latency_ms = Date.now() - start;
    console.error("[director] haiku exception:", e);
    return { scope_covered: null, evidence_sufficient: null, latency_ms, error: e instanceof Error ? e.message : String(e) };
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
    const body = (await req.json()) as ReqBody;
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

    // Regla dura 3: gate mínimo antes de considerar scope
    if (user_turns < min_turns_gate) {
      return respond({ ...base, decision: "continue", reason: "min_turns_gate" });
    }

    // Clasificador
    const objective: string | undefined = practice_script?.phases?.you_do?.objective;
    if (!objective || typeof objective !== "string" || objective.trim().length === 0) {
      return respond({ ...base, decision: "continue", reason: "no_objective" });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return respond({ ...base, decision: "continue", reason: "classifier_error" });
    }

    const cls = await runClassifier(objective, conversation_history, apiKey, session_id ?? null);
    if (cls.scope_covered === null) {
      // Fail-open: si el clasificador falla, no cortamos por scope. Las reglas
      // duras (max_turns/max_duration) siguen protegiendo el techo.
      return respond({
        ...base,
        classifier_ran: true,
        latency_ms: cls.latency_ms,
        decision: "continue",
        reason: "classifier_error",
      });
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
    });
  } catch (e) {
    console.error("[director] error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
