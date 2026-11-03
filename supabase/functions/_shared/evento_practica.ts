// La práctica calificada queda en el historial aunque el teléfono falle
// (mensaje 129, 3-nov-2026).
//
// «Mi equipo» y el perfil del vendedor leen seller_events. Hasta hoy ese
// evento lo creaba SOLO el teléfono, después de mostrar la calificación, con
// una llamada que llevaba también el audio. Si esa llamada fallaba (sin
// señal, la app cerrada, el audio muy pesado, lo que fuera), el error solo
// iba a la consola del teléfono: sin reintento, sin aviso y sin rastro. La
// práctica de Emilio del 3.10 (3-nov, 17:51 UTC) se calificó y se guardó la
// calificación, pero nunca llegó a su historial.
//
// Ahora el SERVIDOR crea el evento en cuanto la calificación está lista, con
// todo lo que ya tiene (la práctica, la calificación y lo que el teléfono
// mandó al pedirla). Después el teléfono le agrega lo que solo él tiene (el
// audio y las rachas del radar), sobre el MISMO evento: lo encuentra por
// practice_session_id. Si eso falla, la práctica ya está en el historial.

import { recomputeSellerSkillState } from "./skill_state.ts";

const arr = (x: unknown): any[] => (Array.isArray(x) ? x : []);

function transcriptDe(extra: any, guardado: unknown): unknown[] {
  if (Array.isArray(extra?.transcript)) return extra.transcript;
  if (typeof guardado === "string") {
    try {
      const t = JSON.parse(guardado);
      if (Array.isArray(t)) return t;
    } catch { /* texto que no es JSON */ }
  }
  return [];
}

export interface PracticaGuardada {
  id: string;
  seller_id: string;
  node_id: string | null;
  world_id: number | null;
  practice_type: string | null;
  is_boss_level: boolean | null;
  transcript: string | null;
}

/** El evento con la misma forma que lo armaba el teléfono. */
export function armarEventoDePractica(a: {
  practica: PracticaGuardada;
  resultado: any;
  extra: any;
  ficha_cliente: unknown;
  session_id: string | null;
}) {
  const r = a.resultado ?? {};
  const x = a.extra ?? {};
  const regresiones = arr(r.regresiones_detectadas).filter((g: any) => g && typeof g.skill_id === "string" && typeof g.evidencia === "string");
  return {
    seller_id: a.practica.seller_id,
    event_type: "practice_session",
    node_id: a.practica.node_id,
    skill_ids: arr(x.skill_ids).filter((s) => typeof s === "string"),
    prompt_version: typeof r.prompt_version === "string" ? r.prompt_version : null,
    model: typeof r.model === "string" ? r.model : null,
    payload: {
      practice_session_id: a.practica.id,
      world_id: a.practica.world_id ?? 0,
      practice_type: a.practica.practice_type ?? "skill_drill",
      is_boss_level: a.practica.is_boss_level === true,
      input_mode: typeof x.input_mode === "string" ? x.input_mode : null,
      score: typeof r.score === "number" ? r.score : null,
      stars: typeof r.stars === "number" ? r.stars : null,
      transcript: transcriptDe(x, a.practica.transcript),
      director_decisions: arr(x.director_decisions),
      cut_reason: typeof r.cut_reason === "string" ? r.cut_reason : "unknown",
      incidentes_voz: arr(x.incidentes_voz),
      evaluation: {
        score: typeof r.score === "number" ? r.score : null,
        stars: typeof r.stars === "number" ? r.stars : null,
        criterios_cumplidos: arr(r.criterios_cumplidos),
        observations: arr(r.observations),
        flags_detected: arr(r.flags_detected),
        mision: typeof r.mision === "string" ? r.mision : null,
        fallas: arr(r.fallas),
        desglose: r.desglose ?? null,
        regresiones_detectadas: regresiones,
        audio_turnos: arr(x.audio_turnos),
        ficha_cliente: a.ficha_cliente ?? null,
      },
      // Las rachas las calcula el teléfono con sus prácticas anteriores: llegan después.
      rachas: [],
      session_id: a.session_id,
      registrado_por: "servidor",
    },
  };
}

/** El evento de una práctica, si ya existe (lo creó el servidor, o un intento anterior del teléfono). */
export async function buscarEventoDePractica(admin: any, sellerId: string, practiceSessionId: string): Promise<{ id: string; payload: any } | null> {
  const { data, error } = await admin
    .from("seller_events")
    .select("id, payload")
    .eq("seller_id", sellerId)
    .eq("event_type", "practice_session")
    .eq("payload->>practice_session_id", practiceSessionId)
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw new Error(`no se pudo buscar el evento: ${error.message}`);
  return Array.isArray(data) && data[0] ? data[0] : null;
}

/** Crea el evento si no existe. Nunca crea dos para la misma práctica. */
export async function guardarEventoDePractica(admin: any, fila: ReturnType<typeof armarEventoDePractica>, companyId: string | null): Promise<{ event_id: string; nuevo: boolean }> {
  const psid = String(fila.payload.practice_session_id);
  const ya = await buscarEventoDePractica(admin, fila.seller_id, psid);
  if (ya) return { event_id: ya.id, nuevo: false };
  const { data, error } = await admin.from("seller_events").insert(fila).select("id").single();
  if (error || !data) throw new Error(`no se pudo crear el evento: ${error?.message ?? "sin fila"}`);
  const eventId = String(data.id);
  // Lo mismo que hacía save-practice-event después de crear el evento.
  if (fila.payload.session_id) {
    const { error: bfErr } = await admin.from("llm_calls").update({ event_id: eventId }).eq("session_id", fila.payload.session_id).is("event_id", null);
    if (bfErr) console.error("[evento_practica] llm_calls backfill:", bfErr.message);
  }
  if (companyId) {
    try {
      await recomputeSellerSkillState(admin, fila.seller_id, companyId);
    } catch (e) {
      console.error("[evento_practica] skill state:", e);
    }
  }
  return { event_id: eventId, nuevo: true };
}

/**
 * Lo que el teléfono manda después (audio aparte) se agrega al evento que ya
 * existe: lo del teléfono gana en sus campos, y lo que el teléfono no trae se
 * queda como lo dejó el servidor.
 */
export function combinarPayload(delServidor: any, delTelefono: any): any {
  const s = delServidor ?? {};
  const t = delTelefono ?? {};
  return {
    ...s,
    ...t,
    evaluation: { ...(s.evaluation ?? {}), ...(t.evaluation ?? {}) },
    registrado_por: s.registrado_por === "servidor" ? "servidor+telefono" : (t.registrado_por ?? s.registrado_por ?? "telefono"),
  };
}
