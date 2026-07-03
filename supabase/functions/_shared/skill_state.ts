// skill_state.ts — cálculo puro de mastery + upsert en seller_skill_state.
//
// Fórmula v1:
//   - Ventana de 5 evidencias más recientes por skill (orden cronológico inverso).
//   - Pesos por recencia [5,4,3,2,1] (la más reciente pesa 5).
//   - Con <5, se usan los pesos más altos que caben.
//   - Evidencia por skill en un evento:
//       * score general de la sesión si el skill está en criterios_cumplidos
//       * score × 0.6 si aparece con error en observations (sin estar en cumplidos)
//       * null (no aplica) si no aparece
//   - mastery_score = Σ(ev_i × w_i) / Σ(w_i)
//
// Recurring failures v1:
//   - Contador crudo por flag_id, incrementado 1 por evento donde aparezca.
//   - Se asocia a cada skill presente en event.skill_ids (top-level).
//
// Decaimiento: NO se guarda. Se aplica al leer via get_current_mastery(mastery_score, last_practiced_at).

// deno-lint-ignore-file no-explicit-any

const WEIGHTS = [5, 4, 3, 2, 1];

export interface EvaluationBlock {
  score?: number;
  criterios_cumplidos?: string[];
  observations?: Array<{ criterio_id?: string }>;
  flags_detected?: string[];
}

export interface EventRow {
  id: string;
  created_at: string;
  skill_ids: string[];
  payload: any;
}

/**
 * Extract per-skill evidence from a single event.
 * Returns Map<skill_id, evidence_score>. Only skills with evidence appear.
 */
export function extractEvidence(event: EventRow): Map<string, number> {
  const out = new Map<string, number>();
  const ev: EvaluationBlock | undefined = event?.payload?.evaluation;
  if (!ev || typeof ev.score !== "number") return out;
  const score = ev.score;

  const cumplidos = new Set<string>(Array.isArray(ev.criterios_cumplidos) ? ev.criterios_cumplidos : []);
  for (const sid of cumplidos) out.set(sid, score);

  if (Array.isArray(ev.observations)) {
    for (const obs of ev.observations) {
      const sid = obs?.criterio_id;
      if (typeof sid === "string" && sid.length > 0 && !cumplidos.has(sid)) {
        // ejecutó pero con fallas
        if (!out.has(sid)) out.set(sid, +(score * 0.6).toFixed(2));
      }
    }
  }
  return out;
}

/** Weighted average over the last 5 evidences (evidences already in reverse-chrono order). */
export function weightedMastery(recentFirst: number[]): number {
  const slice = recentFirst.slice(0, 5);
  let num = 0;
  let den = 0;
  for (let i = 0; i < slice.length; i++) {
    const w = WEIGHTS[i];
    num += slice[i] * w;
    den += w;
  }
  if (den === 0) return 0;
  return +(num / den).toFixed(2);
}

/**
 * Recompute skill state for a seller from ALL their events with evaluation.
 * Deletes and rewrites all rows for the seller. Used by rebuild and by the
 * per-event update (idempotent by design — safer than incremental mutation).
 */
export async function recomputeSellerSkillState(admin: any, sellerId: string, companyId: string) {
  const { data: events, error } = await admin
    .from("seller_events")
    .select("id, created_at, skill_ids, payload")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`fetch events failed: ${error.message}`);

  // Per skill: evidence list (chronological ASC), last_practiced_at, evidence_count.
  // Per skill: recurring_failures map.
  interface Acc {
    evidences: number[]; // ASC chronological
    lastAt: string | null;
    count: number;
    failures: Record<string, number>;
  }
  const acc = new Map<string, Acc>();

  for (const ev of (events ?? []) as EventRow[]) {
    const evidence = extractEvidence(ev);
    if (evidence.size === 0) continue; // old events sin bloque evaluation → skip (documentado)

    const flags: string[] = Array.isArray(ev?.payload?.evaluation?.flags_detected)
      ? ev.payload.evaluation.flags_detected
      : [];
    const touchedSkills = new Set<string>([
      ...evidence.keys(),
      ...(Array.isArray(ev.skill_ids) ? ev.skill_ids : []),
    ]);

    // Register evidence per skill (only those with actual evidence)
    for (const [sid, score] of evidence) {
      const a = acc.get(sid) ?? { evidences: [], lastAt: null, count: 0, failures: {} };
      a.evidences.push(score);
      a.lastAt = ev.created_at;
      a.count += 1;
      acc.set(sid, a);
    }

    // Distribute flags across every touched skill in this event.
    for (const sid of touchedSkills) {
      const a = acc.get(sid);
      if (!a) continue;
      for (const f of flags) {
        if (typeof f !== "string" || !f) continue;
        a.failures[f] = (a.failures[f] ?? 0) + 1;
      }
    }
  }

  // Wipe and rewrite for this seller (idempotent).
  const { error: delErr } = await admin.from("seller_skill_state").delete().eq("seller_id", sellerId);
  if (delErr) throw new Error(`delete state failed: ${delErr.message}`);

  const rows = [];
  for (const [skill_id, a] of acc) {
    const reverse = a.evidences.slice().reverse();
    rows.push({
      seller_id: sellerId,
      company_id: companyId,
      skill_id,
      mastery_score: weightedMastery(reverse),
      evidence_count: a.count,
      last_practiced_at: a.lastAt,
      recurring_failures: a.failures,
    });
  }
  if (rows.length > 0) {
    const { error: insErr } = await admin.from("seller_skill_state").insert(rows);
    if (insErr) throw new Error(`insert state failed: ${insErr.message}`);
  }

  return { skills_written: rows.length, events_processed: (events ?? []).length };
}
