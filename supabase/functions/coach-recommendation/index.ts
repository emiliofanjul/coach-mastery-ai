// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const MODEL = "claude-sonnet-4-5";
const PROMPT_VERSION = "coach-rec-v1";

const SYSTEM_PROMPT = `Eres Closer, coach de ventas de un vendedor específico, hablándole a su MANAGER.

Filosofía: Doctor Vendedor — diagnosticas antes de recetar. Directo, breve, con autoridad cálida. Nada de "¡Excelente!", nada de felicitaciones vacías.

Tu trabajo: leer los datos reales de práctica del vendedor (eventos, evaluaciones, skills con decay, fallas recurrentes) y opcionalmente las notas de campo del manager, y devolver UNA sola recomendación accionable para la próxima semana.

REGLAS DE INTEGRIDAD:
- Solo afirma lo que los datos muestran. Nada de tono de voz, lenguaje corporal o inferencias sobre el estado emocional del vendedor.
- Lenguaje de aprendizaje, nunca de castigo.
- Si hay notas del manager sobre lo observado en campo, intégralas como evidencia adicional — lo que el manager vio en visitas reales complementa lo que las prácticas muestran.
- Si los datos son insuficientes (menos de 2 prácticas evaluadas), di explícitamente que aún no hay evidencia suficiente en el campo "prioridad" y deja "plan" vacío.
- Español de México, tono profesional de campo.
- Máximo 3 pasos en el plan, cada uno de 1 frase concreta.

Responde EXCLUSIVAMENTE con JSON válido con este shape exacto:
{
  "prioridad": "1 frase — el foco #1 de la semana",
  "plan": ["paso 1", "paso 2", "paso 3"],
  "fortaleza": "1 frase — algo que el vendedor ya hace bien y debe conservar"
}`;

async function jsonResp(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResp({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return jsonResp({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const seller_id: string | undefined = body?.seller_id;
    const force: boolean = !!body?.force;
    if (!seller_id) return jsonResp({ error: "missing_seller_id" }, 400);

    // User-scoped client for auth check
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResp({ error: "unauthorized" }, 401);
    const uid = userData.user.id;

    // Admin client for reads/writes
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Verify caller is manager of seller's company
    const { data: profile } = await admin
      .from("profiles").select("role, company_id").eq("id", uid).maybeSingle();
    if (!profile || profile.role !== "manager" || !profile.company_id) {
      return jsonResp({ error: "forbidden" }, 403);
    }
    const { data: seller } = await admin
      .from("sellers")
      .select("id, full_name, company_id, current_world, current_node, certified_at, streak_days")
      .eq("id", seller_id).maybeSingle();
    if (!seller || seller.company_id !== profile.company_id) {
      return jsonResp({ error: "forbidden" }, 403);
    }

    // Load events
    const { data: evs } = await admin
      .from("seller_events")
      .select("id, created_at, node_id, payload")
      .eq("seller_id", seller_id)
      .eq("event_type", "practice_session")
      .order("created_at", { ascending: false })
      .limit(20);
    const events = evs ?? [];
    const latestEventId: string | null = events[0]?.id ?? null;

    // Load current cached recommendation
    const { data: cached } = await admin
      .from("coach_recommendations")
      .select("*").eq("seller_id", seller_id).maybeSingle();

    // Load skill states with decay
    const { data: skillStates } = await admin
      .from("seller_skill_state")
      .select("skill_id, mastery_score, last_practiced_at, recurring_failures, evidence_count")
      .eq("seller_id", seller_id);

    const { data: skillsMeta } = await admin.from("skills").select("id, name, category");
    const skillById: Record<string, any> = {};
    for (const s of skillsMeta ?? []) skillById[s.id] = s;

    // Optional: manager notes (F4). Handle table-not-exists gracefully.
    let notes: any[] = [];
    try {
      const { data: nrows, error: nerr } = await admin
        .from("manager_notes")
        .select("note, created_at")
        .eq("seller_id", seller_id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!nerr) notes = nrows ?? [];
    } catch (_) { /* table not yet created */ }

    // Cache check
    const sameEvent = cached?.last_event_id === latestEventId;
    const sameNotes = (cached?.notes_considered ?? 0) === notes.length;
    if (!force && cached && sameEvent && sameNotes) {
      return jsonResp({ recommendation: cached, cached: true });
    }

    if (events.length === 0) {
      return jsonResp({ error: "no_events", message: "Sin prácticas para analizar." }, 422);
    }

    // Build compact input
    const evalSummary = events.map((e: any) => {
      const p = e.payload ?? {};
      const ev = p.evaluation ?? {};
      return {
        node: e.node_id,
        date: e.created_at,
        score: typeof p.score === "number" ? p.score : null,
        criterios_cumplidos: Array.isArray(ev.criterios_cumplidos) ? ev.criterios_cumplidos : [],
        observations: Array.isArray(ev.observations)
          ? ev.observations.map((o: any) => ({ criterio: o?.criterio, severity: o?.severity, note: o?.note }))
          : [],
        flags: Array.isArray(ev.flags_detected) ? ev.flags_detected : [],
      };
    });

    const skillSummary = (skillStates ?? []).map((s: any) => {
      const last = s.last_practiced_at ? new Date(s.last_practiced_at).getTime() : null;
      const days = last ? Math.max(0, Math.floor((Date.now() - last) / 86_400_000)) : null;
      const extra = days == null ? 0 : Math.max(0, days - 7);
      const current = Math.max(0, Number(s.mastery_score ?? 0) - 0.5 * extra);
      return {
        id: s.skill_id,
        name: skillById[s.skill_id]?.name ?? s.skill_id,
        category: skillById[s.skill_id]?.category ?? null,
        mastery_current: Math.round(current * 100) / 100,
        evidence_count: s.evidence_count,
        recurring_failures: s.recurring_failures ?? {},
      };
    }).sort((a, b) => a.mastery_current - b.mastery_current);

    const input = {
      vendedor: {
        nombre: seller.full_name,
        mundo_actual: seller.current_world,
        nodo_actual: seller.current_node,
        certificado: !!seller.certified_at,
        racha_dias: seller.streak_days,
      },
      practicas_recientes: evalSummary,
      skills_actuales: skillSummary,
      notas_del_manager: notes.map((n) => ({ fecha: n.created_at, nota: n.note })),
    };

    // Call Anthropic
    const t0 = Date.now();
    const anthResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Datos del vendedor (JSON):\n\n${JSON.stringify(input, null, 2)}\n\nGenera la recomendación en el JSON especificado.`,
          },
        ],
      }),
    });
    const latency = Date.now() - t0;

    if (!anthResp.ok) {
      const txt = await anthResp.text();
      console.error("[anthropic]", anthResp.status, txt);
      return jsonResp({ error: "ai_error", status: anthResp.status, body: txt }, 502);
    }
    const anthJson = await anthResp.json();
    const rawText: string = anthJson?.content?.[0]?.text ?? "";
    const inputTokens: number = anthJson?.usage?.input_tokens ?? 0;
    const outputTokens: number = anthJson?.usage?.output_tokens ?? 0;

    // Extract JSON from response
    let parsed: any = null;
    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : rawText);
    } catch (e) {
      console.error("[parse]", e, rawText);
      return jsonResp({ error: "ai_parse", raw: rawText }, 502);
    }

    const prioridad: string = String(parsed?.prioridad ?? "").trim() || "Sin evidencia suficiente todavía.";
    const plan: string[] = Array.isArray(parsed?.plan) ? parsed.plan.map((x: any) => String(x)).slice(0, 3) : [];
    const fortaleza: string | null = parsed?.fortaleza ? String(parsed.fortaleza) : null;

    // Log llm_calls
    await admin.from("llm_calls").insert({
      phase: "coach_recommendation",
      prompt_version: PROMPT_VERSION,
      model: MODEL,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cached_tokens: anthJson?.usage?.cache_read_input_tokens ?? null,
      cache_creation_tokens: anthJson?.usage?.cache_creation_input_tokens ?? null,
      latency_ms: latency,
      event_id: latestEventId,
      company_id: seller.company_id,
      seller_id: seller.id,
    });


    // Upsert recommendation
    const { data: saved, error: saveErr } = await admin
      .from("coach_recommendations")
      .upsert({
        seller_id,
        company_id: seller.company_id,
        prioridad,
        plan,
        fortaleza,
        input_summary: { events: events.length, notes: notes.length, skills: skillSummary.length },
        model: MODEL,
        prompt_version: PROMPT_VERSION,
        last_event_id: latestEventId,
        events_considered: events.length,
        notes_considered: notes.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: "seller_id" })
      .select().single();

    if (saveErr) {
      console.error("[save]", saveErr);
      return jsonResp({ error: "save_failed", detail: saveErr.message }, 500);
    }

    return jsonResp({ recommendation: saved, cached: false, raw: parsed });
  } catch (e: any) {
    console.error("[coach-recommendation]", e);
    return jsonResp({ error: "internal", detail: String(e?.message ?? e) }, 500);
  }
});
