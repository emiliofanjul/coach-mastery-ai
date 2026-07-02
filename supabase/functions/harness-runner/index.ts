// Harness runner — ejecuta closer_eval_harness_v1 contra closer-voice.
// GET / POST → corre todos los casos y devuelve reporte pass/fail.
// Body opcional: { node_id?: string, case_ids?: string[] }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import harness from "../_shared/eval_harness_v1.json" with { type: "json" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Case = {
  id: string;
  description?: string;
  transcript?: { role: string; text: string }[];
  transcript_ref?: string;
  transcript_note?: string;
  expected: Record<string, any>;
};

type CaseResult = {
  id: string;
  status: "pass" | "fail" | "skipped";
  reasons: string[];
  score?: number | null;
  raw?: any;
};

function getCase(id: string): Case | undefined {
  return (harness.cases as Case[]).find((c) => c.id === id);
}

function resolveTranscript(c: Case): { role: string; text: string }[] | null {
  if (Array.isArray(c.transcript)) return c.transcript;
  if (c.transcript_ref) {
    const ref = getCase(c.transcript_ref);
    if (ref?.transcript) return ref.transcript;
  }
  return null;
}

function stringifyAll(obj: any): string {
  try { return JSON.stringify(obj).toLowerCase(); } catch { return String(obj).toLowerCase(); }
}

async function callEvaluate(transcript: { role: string; text: string }[], practice_script: any, supabaseUrl: string, anonKey: string): Promise<any> {
  const conversation_history = transcript.map((t) => ({
    role: t.role === "assistant" ? "assistant" : "user",
    content: t.text,
  }));
  const res = await fetch(`${supabaseUrl}/functions/v1/closer-voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": anonKey, "Authorization": `Bearer ${anonKey}` },
    body: JSON.stringify({
      phase: "evaluate",
      practice_script,
      conversation_history,
      company_brain: "Taller mecánico, distribución de aceites Bardahl",
      seller_name: "Vendedor",
      session_id: `harness-${crypto.randomUUID()}`,
    }),
  });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch { /* keep raw */ }
  return { status: res.status, parsed, raw: text };
}

function evaluateCase(c: Case, response: any): CaseResult {
  const reasons: string[] = [];
  const exp = c.expected ?? {};
  let parsed = response.parsed;

  if (!parsed || typeof parsed !== "object") {
    reasons.push(`response is not valid JSON (status ${response.status})`);
    return { id: c.id, status: "fail", reasons, raw: response };
  }
  if (parsed.error) {
    if (parsed.parsed && typeof parsed.parsed === "object") {
      reasons.push(`closer-voice contract soft-fail: ${parsed.error} — evaluando raw parsed`);
      parsed = parsed.parsed;
    } else {
      reasons.push(`closer-voice error (status ${response.status}): ${JSON.stringify(parsed).slice(0, 400)}`);
      return { id: c.id, status: "fail", reasons };
    }
  }
  const dump = stringifyAll(parsed);

  // Required fields (G20 makes this universal)
  const requiredFields = exp.required_fields ?? ["score", "observations", "mision"];
  for (const f of requiredFields) {
    if (!(f in parsed)) reasons.push(`missing required field: ${f}`);
  }

  // observations structure
  const obsStructure = exp.observations_structure ?? ["error", "mejora", "ejemplo"];
  if (Array.isArray(parsed.observations)) {
    parsed.observations.forEach((o: any, i: number) => {
      for (const k of obsStructure) {
        if (!o || typeof o[k] !== "string") reasons.push(`observation[${i}] missing field ${k}`);
      }
    });
  }

  // score_range
  if (Array.isArray(exp.score_range) && typeof parsed.score === "number") {
    const [lo, hi] = exp.score_range;
    if (parsed.score < lo || parsed.score > hi) {
      reasons.push(`score ${parsed.score} outside range [${lo}, ${hi}]`);
    }
  }

  // must_flag: flag id appears somewhere in the response
  for (const flag of (exp.must_flag ?? [])) {
    if (!dump.includes(String(flag).toLowerCase())) {
      reasons.push(`missing expected flag: ${flag}`);
    }
  }

  // must_cite_positive: must appear in criterios_cumplidos (positive dominion evidence)
  const cumplidos = Array.isArray(parsed.criterios_cumplidos)
    ? parsed.criterios_cumplidos.map((c: any) => String(c).toLowerCase())
    : [];
  for (const s of (exp.must_cite_positive ?? [])) {
    if (!cumplidos.includes(String(s).toLowerCase())) {
      reasons.push(`missing positive citation in criterios_cumplidos: ${s}`);
    }
  }
  // must_cite_negative: skill_id text present anywhere in response
  for (const s of (exp.must_cite_negative ?? [])) {
    if (!dump.includes(String(s).toLowerCase())) reasons.push(`missing negative citation: ${s}`);
  }

  // must_not_flag / must_not_contain / feedback_must_not_contain / must_not_include_in_response
  const forbidLists = [exp.must_not_flag, exp.must_not_contain, exp.feedback_must_not_contain, exp.must_not_include_in_response];
  for (const list of forbidLists) {
    if (!Array.isArray(list)) continue;
    for (const s of list) {
      if (dump.includes(String(s).toLowerCase())) reasons.push(`forbidden string present: "${s}"`);
    }
  }

  // feedback_must_mention (substring, case-insensitive, permissive: at least one keyword)
  if (typeof exp.feedback_must_mention === "string") {
    const needle = exp.feedback_must_mention.toLowerCase();
    const words = needle.split(/\s+/).filter((w) => w.length >= 5);
    const hit = words.some((w) => dump.includes(w));
    if (!hit) reasons.push(`feedback did not mention: "${exp.feedback_must_mention}"`);
  }

  // feedback_must_mention_any_of: pass if ANY listed string appears anywhere in the response
  // (including flags_detected). Use for concepts covered by either prose or a flag ID.
  if (Array.isArray(exp.feedback_must_mention_any_of)) {
    const alts: string[] = exp.feedback_must_mention_any_of.map((s: any) => String(s).toLowerCase());
    const hit = alts.some((a) => dump.includes(a));
    if (!hit) reasons.push(`feedback did not mention any of: [${alts.join(", ")}]`);
  }

  return {
    id: c.id,
    status: reasons.length === 0 ? "pass" : "fail",
    reasons,
    score: typeof parsed.score === "number" ? parsed.score : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    let body: any = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { body = {}; }
    }
    const nodeId: string = body.node_id ?? harness.target_node ?? "0.1";
    const filter: string[] | null = Array.isArray(body.case_ids) && body.case_ids.length > 0 ? body.case_ids : null;

    // Fetch practice_script for the target node
    const { data: nodeRows, error: nodeErr } = await admin
      .from("nodes")
      .select("id, practice_script")
      .eq("id", nodeId)
      .limit(1);
    if (nodeErr || !nodeRows || nodeRows.length === 0) {
      return new Response(JSON.stringify({ error: "node_not_found", node_id: nodeId, detail: nodeErr?.message }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const practice_script = nodeRows[0].practice_script;

    const cases = (harness.cases as Case[]).filter((c) => !filter || filter.includes(c.id));
    const results: CaseResult[] = [];
    const consistencyScores: Record<string, number[]> = {};

    // Known limitation: cases that test phase=you_do (Actor behavior) can't be
    // exercised by a runner that only calls phase=evaluate. Mark them skipped
    // with an explicit reason so the report reflects runner debt, not system bugs.
    const YOU_DO_ONLY = new Set(["G07_sacar_del_personaje", "G13b_ayuda_fuera_de_scope"]);

    for (const c of cases) {
      if (YOU_DO_ONLY.has(c.id)) {
        results.push({ id: c.id, status: "skipped", reasons: ["known runner limitation: requires phase=you_do execution (Actor behavior). Runner extension pending."] });
        continue;
      }
      // Skip cases marked as manual
      if (c.transcript_note && !c.transcript_ref && !Array.isArray(c.transcript)) {
        results.push({ id: c.id, status: "skipped", reasons: [`manual case (transcript_note): ${c.transcript_note}`] });
        continue;
      }

      // G16: empty transcript — no evaluate call; just record skipped with note
      if (Array.isArray(c.transcript) && c.transcript.length === 0) {
        results.push({ id: c.id, status: "skipped", reasons: ["empty transcript — evaluator not invoked (frontend responsibility)"] });
        continue;
      }

      const transcript = resolveTranscript(c);
      if (!transcript) {
        results.push({ id: c.id, status: "skipped", reasons: ["no transcript resolvable"] });
        continue;
      }

      // G18: consistency — run twice
      const runs = c.id === "G18_dos_sesiones_mismo_usuario" ? 2 : 1;
      const runResults: any[] = [];
      for (let i = 0; i < runs; i++) {
        try {
          const resp = await callEvaluate(transcript, practice_script, supabaseUrl, anonKey);
          runResults.push(resp);
        } catch (e) {
          runResults.push({ status: 0, parsed: null, raw: String(e) });
        }
      }

      if (runs === 2) {
        const pick = (r: any) => (typeof r?.parsed?.score === "number" ? r.parsed.score : r?.parsed?.parsed?.score);
        const s1 = pick(runResults[0]);
        const s2 = pick(runResults[1]);
        const reasons: string[] = [];
        if (typeof s1 !== "number" || typeof s2 !== "number") {
          reasons.push(`consistency check failed: non-numeric scores (${s1}, ${s2})`);
        } else {
          const variance = Math.abs(s1 - s2);
          const maxVar = c.expected?.max_score_variance_between_runs ?? 15;
          if (variance > maxVar) reasons.push(`score variance ${variance} > ${maxVar} (runs: ${s1}, ${s2})`);
        }
        results.push({
          id: c.id,
          status: reasons.length === 0 ? "pass" : "fail",
          reasons,
          score: typeof s1 === "number" ? s1 : null,
        });
      } else {
        const r = evaluateCase(c, runResults[0]);
        // G19: every observation cites a skill_id from harness.target_skills or practice_script.success_criteria
        if (c.expected?.every_observation_cites_skill_id) {
          const validIds = new Set<string>([
            ...(harness.target_skills ?? []),
            ...((practice_script?.success_criteria ?? []).map((s: any) => s.id)),
            ...((practice_script?.failure_criteria ?? []).map((s: any) => s.id)),
          ].map((x) => String(x).toLowerCase()));
          const obs = runResults[0]?.parsed?.observations ?? [];
          obs.forEach((o: any, i: number) => {
            const blob = stringifyAll(o);
            const hit = [...validIds].some((id) => blob.includes(id));
            if (!hit) {
              r.reasons.push(`observation[${i}] does not cite any known skill_id`);
              r.status = "fail";
            }
          });
        }
        results.push(r);
      }
    }

    const summary = {
      total: results.length,
      pass: results.filter((r) => r.status === "pass").length,
      fail: results.filter((r) => r.status === "fail").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    };

    return new Response(JSON.stringify({
      harness_version: harness.harness_version,
      prompt_version_expected: "v1.1.0",
      node_id: nodeId,
      summary,
      results,
    }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
