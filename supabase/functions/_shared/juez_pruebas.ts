// EL JUEZ DE LAS PRUEBAS (mensaje 95, 16-oct-2026).
//
// Algunas reglas se escriben como PRUEBA («LA PRUEBA: ¿la frase le da al
// cliente la opción de decir que no?»). El evaluador revisa toda la práctica
// de un jalón y a veces no aplica la prueba: en el G38 marcó «pide permiso
// otra vez» citando «claro, claro» —el vendedor ACEPTANDO el bloqueo— y dejó
// AIR en parcial. El Director ya no se equivoca así porque sus cortes se
// verifican (critica.ts); esto es lo mismo para el evaluador.
//
// Cada acusación del evaluador cuya regla trae «LA PRUEBA» —una falla
// marcada, o un criterio en parcial / no_cumple— pasa por un juez que solo
// aplica esa prueba a lo que dijo el vendedor, en orden. Si la acusación no
// se sostiene, el código la quita. El juez solo revisa acusaciones: nunca
// agrega fallas ni baja un criterio. Si el juez falla, todo se queda como lo
// dejó el evaluador (Emilio: "no queremos estar parchando, queremos
// arreglarlo de raíz").

export interface Acusacion {
  /** id de la falla o del criterio */
  id: string;
  tipo: "falla" | "criterio";
  /** la regla completa, con su prueba */
  regla: string;
  /** cómo se aplica la regla en este nodo */
  en_este_nodo: string;
  /** lo que el evaluador señaló: la frase citada (falla) o la pieza que falta (criterio) */
  senalado: string;
}

export interface Juicio { id: string; tipo: string; se_sostiene: boolean; razon?: string }

const tienePrueba = (s: unknown): s is string => typeof s === "string" && s.includes("LA PRUEBA");

/** Las acusaciones del evaluador que tienen una prueba escrita en su regla. */
export function acusacionesConPrueba(ev: any, ps: any): Acusacion[] {
  const out: Acusacion[] = [];
  const fallas: any[] = Array.isArray(ps?.failure_criteria) ? ps.failure_criteria : [];
  const evidencia: any[] = Array.isArray(ev?.evidencia_flags) ? ev.evidencia_flags : [];
  for (const id of Array.isArray(ev?.flags_detected) ? ev.flags_detected : []) {
    const f = fallas.find((x) => x?.id === id);
    const regla = f?.regla_resumen ?? f?.description;
    if (!tienePrueba(regla)) continue;
    const e = evidencia.find((x) => x?.id === id);
    out.push({ id, tipo: "falla", regla, en_este_nodo: String(f?.contexto_nodo ?? ""), senalado: String(e?.cita ?? "") });
  }
  const criterios: any[] = Array.isArray(ps?.success_criteria) ? ps.success_criteria : [];
  for (const v of Array.isArray(ev?.veredictos_criterios) ? ev.veredictos_criterios : []) {
    if (v?.nivel !== "parcial" && v?.nivel !== "no_cumple") continue;
    // Las escaleras miden calidad por escalones: no son una prueba de sí o no.
    if (v?.escalon !== undefined && v?.escalon !== null) continue;
    const c = criterios.find((x) => x?.id === v?.criterio_id);
    const regla = c?.regla_resumen ?? c?.description;
    if (!tienePrueba(regla)) continue;
    out.push({ id: String(v.criterio_id), tipo: "criterio", regla, en_este_nodo: String(c?.contexto_nodo ?? ""), senalado: String(v?.falta ?? "") });
  }
  return out;
}

export const PROMPT_JUEZ = `Eres el juez de las pruebas de Closer, una app que entrena vendedores de campo. Un evaluador ya calificó una práctica y acusó al vendedor de algo. Cada acusación viene con su regla, y esa regla trae LA PRUEBA: la pregunta que decide si la acusación es cierta.

Tu único trabajo es aplicar LA PRUEBA, tal como está escrita, a lo que el vendedor dijo en la conversación, en orden.
1. LA PRUEBA ES EL ALCANCE. Los ejemplos de la regla ilustran, no delimitan. No agregues requisitos que la prueba no escribe, ni quites los que sí escribe.
2. Juzga lo que la frase HACE en ese momento de la plática, no palabras sueltas. Lee qué dijo el cliente justo antes y qué sigue después.
3. Una FALLA se sostiene solo si una frase del vendedor reprueba la prueba. Lo que señaló el evaluador es una pista: búscalo en lo que dijo el vendedor. Si no está, o si leído en su lugar no reprueba la prueba, no se sostiene.
4. Un CRITERIO en parcial o no_cumple se sostiene solo si, con la prueba en la mano, de verdad falta una pieza que la prueba pide. Si lo que hizo el vendedor pasa la prueba, no se sostiene.
5. "En este nodo" dice cómo se aplica la regla aquí. Si choca con la prueba, manda la prueba.
6. Solo juzgas las acusaciones que recibes. No buscas otras fallas ni opinas de lo demás.

Para cada acusación: en "respuesta" contesta la pregunta de la prueba con sí o no y la frase del vendedor que lo demuestra; en "se_sostiene", true si la acusación es cierta y false si no. Entrega todo con la herramienta "juicios", uno por acusación, con su mismo "id" y "tipo".`;

export const HERRAMIENTA_JUICIOS = {
  name: "juicios",
  description: "Entrega el juicio de cada acusación: si se sostiene con la prueba de su regla.",
  input_schema: {
    type: "object",
    properties: {
      juicios: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            tipo: { type: "string", enum: ["falla", "criterio"] },
            respuesta: { type: "string" },
            se_sostiene: { type: "boolean" },
          },
          required: ["id", "tipo", "respuesta", "se_sostiene"],
        },
      },
    },
    required: ["juicios"],
  },
} as const;

export function armarEntradaJuez(acusaciones: Acusacion[], conversacion: { role?: string; content?: unknown }[]): string {
  return JSON.stringify({
    conversacion: (Array.isArray(conversacion) ? conversacion : []).slice(-40).map((t, i) => ({
      turno: i + 1,
      quien: t?.role === "user" ? "vendedor" : "cliente",
      dijo: String(t?.content ?? "").slice(0, 700),
    })),
    acusaciones: acusaciones.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      regla: a.regla.slice(0, 1200),
      en_este_nodo: a.en_este_nodo.slice(0, 600),
      [a.tipo === "falla" ? "frase_senalada" : "lo_que_dice_que_falta"]: a.senalado.slice(0, 300),
    })),
  });
}

/** Saca los juicios de la respuesta de la API (herramienta forzada). */
export function juiciosDeRespuesta(respuesta: any): Juicio[] | null {
  const bloques = Array.isArray(respuesta?.content) ? respuesta.content : [];
  const uso = bloques.find((b: any) => b?.type === "tool_use" && b?.name === HERRAMIENTA_JUICIOS.name);
  const lista = uso?.input?.juicios;
  if (!Array.isArray(lista)) return null;
  return lista.filter((j: any) => j && typeof j.id === "string" && typeof j.se_sostiene === "boolean")
    .map((j: any) => ({ id: j.id, tipo: String(j.tipo ?? ""), se_sostiene: j.se_sostiene, razon: typeof j.respuesta === "string" ? j.respuesta.slice(0, 300) : undefined }));
}

/**
 * Quita de la evaluación las acusaciones que no se sostienen. Solo actúa con
 * un juicio explícito `se_sostiene: false`; sin juicio, la acusación se queda.
 * Una falla quitada sale de flags_detected y de evidencia_flags. Un criterio
 * quitado pasa a "cumple" y salen sus observaciones.
 */
export function aplicarJuicios(ev: any, acusaciones: Acusacion[], juicios: Juicio[]): { id: string; tipo: string; razon?: string }[] {
  const quitadas: { id: string; tipo: string; razon?: string }[] = [];
  for (const a of acusaciones) {
    const j = juicios.find((x) => x.id === a.id && x.tipo === a.tipo);
    if (!j || j.se_sostiene !== false) continue;
    if (a.tipo === "falla") {
      ev.flags_detected = (ev.flags_detected ?? []).filter((f: string) => f !== a.id);
      if (Array.isArray(ev.evidencia_flags)) ev.evidencia_flags = ev.evidencia_flags.filter((e: any) => e?.id !== a.id);
    } else {
      for (const v of Array.isArray(ev.veredictos_criterios) ? ev.veredictos_criterios : []) {
        if (v?.criterio_id === a.id) { v.nivel = "cumple"; delete v.falta; }
      }
      if (Array.isArray(ev.observations)) ev.observations = ev.observations.filter((o: any) => o?.criterio_id !== a.id);
    }
    quitadas.push({ id: a.id, tipo: a.tipo, razon: j.razon });
  }
  return quitadas;
}
