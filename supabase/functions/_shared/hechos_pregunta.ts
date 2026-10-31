// EL HECHO DE LA PREGUNTA (mensaje 99, 17-oct-2026).
//
// En el 1.2, una apertura sin NINGUNA pregunta es falla crítica (decisión de
// Emilio, mensaje 98). El evaluador la marcaba 1 de cada 4 veces: la misma
// falta ya le bajaba la estructura, y su regla de no cobrar dos veces le ganaba
// a la excepción de las critical. Una instrucción más en el prompt no lo
// arregla: dos órdenes que chocan fallan a ratos.
//
// La raíz: separar el HECHO del JUICIO. El evaluador solo anota, por turno, si
// hay pregunta y dónde ("al_final", "en_medio" o "ninguna"). El código aplica
// la regla. Y como la regla trae su prueba, el juez revisa la acusación antes
// de que cuente: si el evaluador anotó mal el hecho, el juez la quita.
//
// Solo actúa en los nodos cuya falla está ligada a opening.sin_pregunta. Si el
// hecho no viene en todos los turnos, no hace nada (falla abierta: queda lo
// que dijo el evaluador).

export type DondePregunta = "al_final" | "en_medio" | "ninguna";
const VALIDOS: DondePregunta[] = ["al_final", "en_medio", "ninguna"];

export const REGLA_SIN_PREGUNTA = "opening.sin_pregunta";

export const EVIDENCIA_SIN_PREGUNTA = {
  error: "Tu apertura no le hizo ninguna pregunta al cliente: no tiene qué contestar y la plática se muere ahí.",
  mejora: "Termina tu primera frase con una pregunta sobre lo que comentaste.",
};

/** Agrega la falla de "apertura sin pregunta" si el hecho del primer turno lo dice. Devuelve los ids agregados. */
export function fallasPorHechoDePregunta(ev: any, ps: any): string[] {
  const turnos: any[] = Array.isArray(ev?.analisis_turnos) ? ev.analisis_turnos : [];
  if (turnos.length === 0 || !turnos.every((t) => VALIDOS.includes(t?.pregunta))) return [];
  const fallas: any[] = Array.isArray(ps?.failure_criteria) ? ps.failure_criteria : [];
  const agregadas: string[] = [];
  const primero = [...turnos].sort((a, b) => Number(a?.turno ?? 0) - Number(b?.turno ?? 0))[0];
  for (const f of fallas) {
    if (f?.regla_id !== REGLA_SIN_PREGUNTA || typeof f?.id !== "string") continue;
    if (primero?.pregunta !== "ninguna") continue;
    if (!Array.isArray(ev.flags_detected)) ev.flags_detected = [];
    if (ev.flags_detected.includes(f.id)) continue;
    ev.flags_detected.push(f.id);
    if (!Array.isArray(ev.evidencia_flags)) ev.evidencia_flags = [];
    if (!ev.evidencia_flags.some((e: any) => e?.id === f.id)) {
      ev.evidencia_flags.push({
        id: f.id,
        cita: String(primero?.texto_literal ?? primero?.ultima_frase ?? "").slice(0, 300),
        error: EVIDENCIA_SIN_PREGUNTA.error,
        mejora: EVIDENCIA_SIN_PREGUNTA.mejora,
        ejemplo: "",
      });
    }
    agregadas.push(f.id);
  }
  return agregadas;
}

// EL HECHO DECIDE LA ESTRUCTURA (mensaje 115, 31-oct-2026).
//
// La regla opening.estructura dice: «si la pregunta va en medio y el turno
// termina con un comentario, es parcial». En el G04 («¡Buenos días! ¿Cómo le
// va? Qué gusto saludarlo.») el evaluador lo vio bien: parcial. Pero desde el
// 112 la regla trae «LA PRUEBA», y el juez la revisó y, dos de dos veces,
// leyó el orden al revés («termina con pregunta: ¿Cómo le va?»). Dónde va la
// pregunta es un HECHO, no un juicio: ya lo anota el evaluador por turno. Así
// que el código aplica esa parte de la regla y el juez no la revisa: un juicio
// no puede contradecir un hecho.

export const REGLA_ESTRUCTURA = "opening.estructura";
export const FALTA_PREGUNTA_EN_MEDIO = "La pregunta va en medio y el turno termina con un comentario: falta que la pregunta cierre.";

/**
 * Si en el primer turno la pregunta va en medio, el criterio de estructura no
 * puede quedar en cumple: queda en parcial (o como lo dejó el evaluador, si lo
 * dejó más abajo). Devuelve los ids de los criterios que decidió el hecho; el
 * juez no los revisa. Falla abierta: sin el hecho en todos los turnos, no hace nada.
 */
export function criteriosPorHechoDePregunta(ev: any, ps: any): string[] {
  const turnos: any[] = Array.isArray(ev?.analisis_turnos) ? ev.analisis_turnos : [];
  if (turnos.length === 0 || !turnos.every((t) => VALIDOS.includes(t?.pregunta))) return [];
  const primero = [...turnos].sort((a, b) => Number(a?.turno ?? 0) - Number(b?.turno ?? 0))[0];
  if (primero?.pregunta !== "en_medio") return [];
  const criterios: any[] = Array.isArray(ps?.success_criteria) ? ps.success_criteria : [];
  const veredictos: any[] = Array.isArray(ev?.veredictos_criterios) ? ev.veredictos_criterios : [];
  const decididos: string[] = [];
  for (const c of criterios) {
    if (c?.regla_id !== REGLA_ESTRUCTURA || typeof c?.id !== "string") continue;
    const v = veredictos.find((x) => x?.criterio_id === c.id);
    if (!v) continue;
    if (v.nivel === "cumple") { v.nivel = "parcial"; v.falta = FALTA_PREGUNTA_EN_MEDIO; }
    decididos.push(c.id);
  }
  return decididos;
}
