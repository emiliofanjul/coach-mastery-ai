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
  /** Nodo vivo contra el que se evalúa este caso. Cada caso declara el suyo. */
  node_id?: string;
  /** Caso con decisión doctrinal pendiente: se reporta pero no cuenta como falla. */
  pendiente_decision?: string;
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
  /** Lo que decidió el evaluador por criterio: "criterio:nivel". Para diagnosticar volteos. */
  veredictos?: string[];
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

async function callEvaluate(transcript: { role: string; text: string }[], practice_script: any, nodeId: string, supabaseUrl: string, anonKey: string, companyBrain?: string, sellerName?: string): Promise<any> {
  const conversation_history = transcript.map((t) => ({
    role: t.role === "assistant" ? "assistant" : "user",
    content: t.text,
  }));
  const res = await fetch(`${supabaseUrl}/functions/v1/closer-voice`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": anonKey, "Authorization": `Bearer ${anonKey}` },
    body: JSON.stringify({
      phase: "evaluate",
      // Obligatorio: closer-voice resuelve el guion por node_id y rechaza
      // evaluate sin él (400 node_id_required). Sin esta línea el harness
      // fallaba en todos los casos desde sept-2026 sin que nadie lo notara.
      node_id: nodeId,
      practice_script,
      conversation_history,
      // Cada caso puede declarar su empresa: la red debe probar la doctrina en
      // cualquier industria, no premiar el vocabulario de un solo cliente.
      company_brain: companyBrain ?? "Lubricantes del Golfo: distribuidora de aceites Bardahl para talleres mecánicos.",
      // Un nombre real, como en producción: con "Vendedor" el evaluador escribía "[tu nombre]".
      seller_name: sellerName ?? "Luis",
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

  // observations_must_not_target: ninguna observación puede criticar estos
  // criterios. Verifica la DECISIÓN del evaluador (qué criticó), no su
  // redacción: perseguir negaciones con patrones ("no te presentaste", "ni te
  // presentaste", "tampoco…") es un parche que nunca termina (sept-2026).
  if (Array.isArray(exp.observations_must_not_target)) {
    const criticados = new Set(
      (Array.isArray(parsed.observations) ? parsed.observations : [])
        .map((o: any) => String(o?.criterio_id ?? "")),
    );
    for (const id of exp.observations_must_not_target) {
      if (criticados.has(String(id))) reasons.push(`criticó un criterio que no debía: ${id}`);
    }
  }

  // feedback_must_not_match: patrones (regex, sin distinguir mayúsculas).
  // Una lista de textos no distingue "te presentaste" de "NO te presentaste":
  // castigaría justo el comportamiento correcto. Un patrón sí puede.
  if (Array.isArray(exp.feedback_must_not_match)) {
    for (const pat of exp.feedback_must_not_match) {
      let re: RegExp | null = null;
      try { re = new RegExp(String(pat), "i"); } catch { reasons.push(`patrón inválido: ${pat}`); }
      if (re && re.test(dump)) reasons.push(`patrón prohibido presente: /${pat}/`);
    }
  }


  // must_not_flag / must_not_contain / feedback_must_not_contain / must_not_include_in_response
  const forbidLists = [exp.must_not_flag, exp.must_not_contain, exp.feedback_must_not_contain, exp.must_not_include_in_response];
  for (const list of forbidLists) {
    if (!Array.isArray(list)) continue;
    for (const s of list) {
      const at = dump.indexOf(String(s).toLowerCase());
      // Con el fragmento alrededor: no es lo mismo inventar un recuerdo en un
      // ejemplo que mencionarlo en una explicación.
      if (at >= 0) reasons.push(`forbidden string present: "${s}" en «…${dump.slice(Math.max(0, at - 70), at + String(s).length + 70)}…»`);
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

  // max_observations: una ejecución limpia puede y debe devolver [].
  if (typeof exp.max_observations === "number") {
    const n = Array.isArray(parsed.observations) ? parsed.observations.length : -1;
    if (n > exp.max_observations) reasons.push(`observations: ${n} > máximo ${exp.max_observations}`);
  }

  // niveles_esperados: la DECISIÓN del evaluador por criterio, leída del
  // desglose de la rúbrica. El nivel se deriva del crédito (no de la etiqueta
  // que eligió el modelo): 1 → cumple, entre 0 y 1 → parcial, 0 → no_cumple.
  const nivelDe = (credito: number) => (credito >= 1 ? "cumple" : credito > 0 ? "parcial" : "no_cumple");
  const desgloseCrit: any[] = Array.isArray(parsed?.desglose?.criterios) ? parsed.desglose.criterios : [];
  const nivelPorCriterio = new Map<string, string>(
    desgloseCrit.map((d: any) => [String(d.criterio_id), nivelDe(Number(d.credito ?? 0))]),
  );
  if (exp.niveles_esperados && typeof exp.niveles_esperados === "object") {
    for (const [id, esperado] of Object.entries(exp.niveles_esperados as Record<string, string>)) {
      const real = nivelPorCriterio.get(id);
      if (real !== esperado) reasons.push(`nivel de ${id}: esperaba ${esperado}, decidió ${real ?? "sin veredicto"}`);
    }
  }

  // ── CHEQUEOS UNIVERSALES — corren en TODOS los casos ──────────────
  // Cada uno reproduce un error real encontrado practicando (sept-2026).
  const ejemplos: string[] = [
    ...(Array.isArray(parsed.observations) ? parsed.observations : []).map((o: any) => String(o?.ejemplo ?? "")),
    ...(Array.isArray(parsed.siguiente_nivel) ? parsed.siguiente_nivel : []).map((x: any) => String(x?.ejemplo ?? "")),
  ];
  // Solo los huecos de un DATO que el vendedor tendría que inventar
  // ("[empresa/sector]", "[área relevante]", "[nombre del cliente]"). Las
  // acotaciones ("[pausa]", "[el cliente responde]") están permitidas: no
  // dejan nada incompleto (decisión de Emilio, sept-2026).
  const HUECO_DE_DATO = /\[(?:empresa|sector|producto|marca|nombre|ciudad|zona|área|area|industria|giro|precio|dato)[^\]]*\]/i;
  for (const e of ejemplos) {
    const m = e.match(HUECO_DE_DATO);
    if (m) { reasons.push(`UNIVERSAL: ejemplo con hueco de dato ${m[0]} en: "${e.slice(0, 120)}"`); break; }
  }

  const textoFeedback = stringifyAll([parsed.observations, parsed.mision, parsed.siguiente_nivel]);
  if (/signo de interrogaci|signos de interrogaci|termine en signo/.test(textoFeedback)) {
    reasons.push("UNIVERSAL: el feedback habla de puntuación — el vendedor habla, no escribe");
  }
  if (!Array.isArray(parsed.observations)) reasons.push("UNIVERSAL: observations no es un arreglo");
  // La nota debe salir de la rúbrica. Sin "desglose", el modelo no mandó sus
  // veredictos por criterio y la nota salió del plan B (su número libre).
  if (!parsed.desglose || typeof parsed.desglose !== "object") {
    reasons.push("UNIVERSAL: la nota salió del plan B — el evaluador no mandó veredictos por criterio");
  }

  return {
    id: c.id,
    status: reasons.length === 0 ? "pass" : "fail",
    reasons,
    score: typeof parsed.score === "number" ? parsed.score : null,
    veredictos: desgloseCrit.map((d: any) => {
      const n = nivelDe(Number(d.credito ?? 0));
      const base = `${String(d.criterio_id).replace(/^[a-z]+\./, "")}:${d.escalon ? `e${d.escalon}` : n}`;
      return d.falta ? `${base}(falta: ${String(d.falta).slice(0, 60)})` : base;
    }),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Solo un manager puede correrlo: cada corrida llama al modelo ~24 veces.
    // Antes era público, y el repo es público: cualquiera podía gastar créditos.
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: who } = jwt ? await admin.auth.getUser(jwt) : { data: null as any };
    const uid = who?.user?.id ?? null;
    const { data: prof } = uid
      ? await admin.from("profiles").select("role").eq("id", uid).maybeSingle()
      : { data: null as any };
    if (!prof || prof.role !== "manager") {
      return new Response(JSON.stringify({ error: "forbidden", detail: "solo managers pueden correr el harness" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: any = {};
    if (req.method === "POST") {
      try { body = await req.json(); } catch { body = {}; }
    }
    // listar: la página de la red pide la lista y luego corre cada caso en su
    // propia petición. Así no hay límite de tiempo total (antes, una sola
    // petición con todos los casos chocaba con los 150 s).
    if (body.listar === true) {
      const lista = (harness.cases as Case[]).map((c) => ({
        id: c.id,
        node_id: c.node_id ?? harness.target_node ?? "1.2",
        mundo: Number(String(c.node_id ?? harness.target_node ?? "1.2").split(".")[0]),
        descripcion: c.description ?? "",
      }));
      return new Response(JSON.stringify({ version: harness.harness_version, casos: lista }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nodeId: string = body.node_id ?? harness.target_node ?? "1.2";
    const filter: string[] | null = Array.isArray(body.case_ids) && body.case_ids.length > 0 ? body.case_ids : null;

    // Fetch practice_script for the target node
    const { data: nodeRows, error: nodeErr } = await admin
      .from("v_nodes_resueltos")
      .select("id, practice_script:practice_script_resuelto")
      .eq("id", nodeId)
      .limit(1);
    if (nodeErr || !nodeRows || nodeRows.length === 0) {
      return new Response(JSON.stringify({ error: "node_not_found", node_id: nodeId, detail: nodeErr?.message }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const practice_script = nodeRows[0].practice_script;

    // Cada caso se evalúa contra SU nodo. Caché para no releer el mismo guion.
    const scripts = new Map<string, any>([[nodeId, practice_script]]);
    const scriptDe = async (id: string) => {
      if (scripts.has(id)) return scripts.get(id);
      const { data } = await admin.from("v_nodes_resueltos")
        .select("practice_script:practice_script_resuelto").eq("id", id).maybeSingle();
      const ps = (data as any)?.practice_script ?? null;
      scripts.set(id, ps);
      return ps;
    };

    const cases = (harness.cases as Case[]).filter((c) => !filter || filter.includes(c.id));
    const consistencyScores: Record<string, number[]> = {};

    // Known limitation: cases that test phase=you_do (Actor behavior) can't be
    // exercised by a runner that only calls phase=evaluate. Mark them skipped
    // with an explicit reason so the report reflects runner debt, not system bugs.
    const YOU_DO_ONLY = new Set(["G07_sacar_del_personaje", "G13b_ayuda_fuera_de_scope"]);

    // Cada caso se procesa en su propia función y los casos corren con
    // concurrencia acotada. TRANSICIÓN: evita el límite de 150 s de una sola
    // petición con los casos actuales, pero no lo elimina. La solución de raíz
    // es una petición por caso con resultados guardados en tabla (paso 2).
    const procesar = async (c: Case): Promise<CaseResult> => {
      if (YOU_DO_ONLY.has(c.id)) {
        return { id: c.id, status: "skipped", reasons: ["known runner limitation: requires phase=you_do execution (Actor behavior). Runner extension pending."] };
        
      }
      // Skip cases marked as manual
      if (c.transcript_note && !c.transcript_ref && !Array.isArray(c.transcript)) {
        return { id: c.id, status: "skipped", reasons: [`manual case (transcript_note): ${c.transcript_note}`] };
        
      }

      // G16: empty transcript — no evaluate call; just record skipped with note
      if (Array.isArray(c.transcript) && c.transcript.length === 0) {
        return { id: c.id, status: "skipped", reasons: ["empty transcript — evaluator not invoked (frontend responsibility)"] };
        
      }

      const transcript = resolveTranscript(c);
      if (!transcript) {
        return { id: c.id, status: "skipped", reasons: ["no transcript resolvable"] };
        
      }

      // G18: consistency — run twice
      const caseNode = c.node_id ?? nodeId;
      const casePs = await scriptDe(caseNode);
      if (!casePs) {
        return { id: c.id, status: "fail", reasons: [`nodo ${caseNode} no existe o no tiene práctica`] };
        
      }

      const runs = c.id === "G18_dos_sesiones_mismo_usuario" ? 2 : 1;
      const runResults: any[] = [];
      for (let i = 0; i < runs; i++) {
        try {
          const resp = await callEvaluate(transcript, casePs, caseNode, supabaseUrl, anonKey, (c as any).company_brain, (c as any).seller_name);
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
        return {
          id: c.id,
          status: reasons.length === 0 ? "pass" : "fail",
          reasons,
          score: typeof s1 === "number" ? s1 : null,
        };
      } else {
        const r = evaluateCase(c, runResults[0]);
        // G19: every observation cites a skill_id from harness.target_skills or practice_script.success_criteria
        if (c.expected?.every_observation_cites_skill_id) {
          const validIds = new Set<string>([
            ...(harness.target_skills ?? []),
            ...((casePs?.success_criteria ?? []).map((s: any) => s.id)),
            ...((casePs?.failure_criteria ?? []).map((s: any) => s.id)),
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
        if (c.pendiente_decision && r.status === "fail") {
          r.status = "skipped";
          r.reasons.unshift(`PENDIENTE DE DECISIÓN: ${c.pendiente_decision}`);
        }
        return r;
      }
    };

    const CONCURRENCIA = 6;
    const results: CaseResult[] = new Array(cases.length);
    let siguiente = 0;
    const trabajador = async () => {
      while (siguiente < cases.length) {
        const i = siguiente++;
        try {
          results[i] = await procesar(cases[i]);
        } catch (e) {
          results[i] = { id: cases[i].id, status: "fail", reasons: [`excepción del runner: ${e instanceof Error ? e.message : String(e)}`] };
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCIA, cases.length) }, trabajador));

    const summary = {
      total: results.length,
      pass: results.filter((r) => r.status === "pass").length,
      fail: results.filter((r) => r.status === "fail").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    };

    return new Response(JSON.stringify({
      harness_version: harness.harness_version,
      prompt_version_expected: "v2",
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
