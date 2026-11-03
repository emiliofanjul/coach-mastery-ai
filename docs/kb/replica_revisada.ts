// La respuesta a una disputa no le da la razón al vendedor sin que el juez lo
// revise (mensaje 128, 3-nov-2026).
//
// Disputa del 3.10: el vendedor dijo «claro que nosotros lo podemos ayudar.
// Nosotros manejamos Bardahl, Repsol y Mixloop» en un nodo que solo diagnostica.
// El evaluador marcó pitch_prematuro y el juez, con la prueba de la regla, lo
// sostuvo. Después el vendedor discutió con un argumento bien armado («ya tenía
// el dolor, iba a preguntar volumen») y la respuesta a la disputa le dio la
// razón, aunque la regla dice «en cualquier punto, incluso al descubrir el
// dolor». Eso le enseña al vendedor lo contrario de la regla.
//
// Ahora: cuando la respuesta quiere conceder una acusación cuya regla trae
// LA PRUEBA, el juez la vuelve a juzgar con la prueba, citando, y CON el
// argumento del vendedor (un buen argumento puede mostrar algo que el
// evaluador no vio). Lo que decide el juez es lo que Closer le dice:
//   · el juez dice que el vendedor PASA la prueba → se concede;
//   · el juez dice que REPRUEBA → se sostiene, y se le explica con la regla;
//   · el juez no contestó o sus citas no están → no se concede ni se niega:
//     su punto queda registrado para el equipo de Closer.

import { acusacionesConPrueba, armarEntradaJuez, type Acusacion, type Cita, type Juicio } from "./juez_pruebas.ts";

/** Lo que la respuesta a la disputa dice que concede, limitado a lo que de verdad se le acusó. */
export function idsConcedidos(rep: any, evaluacion: any): string[] {
  const acusados = new Set<string>();
  for (const id of Array.isArray(evaluacion?.flags_detected) ? evaluacion.flags_detected : []) acusados.add(String(id));
  for (const f of Array.isArray(evaluacion?.fallas) ? evaluacion.fallas : []) if (f?.id) acusados.add(String(f.id));
  for (const v of Array.isArray(evaluacion?.veredictos_criterios) ? evaluacion.veredictos_criterios : []) {
    if (v?.nivel === "parcial" || v?.nivel === "no_cumple") acusados.add(String(v.criterio_id));
  }
  const pedidos = new Set<string>();
  for (const id of Array.isArray(rep?.concede_en) ? rep.concede_en : []) if (typeof id === "string" && id) pedidos.add(id);
  if (rep?.concede === true && typeof rep?.criterio_id === "string" && rep.criterio_id) pedidos.add(rep.criterio_id);
  return [...pedidos].filter((id) => acusados.has(id));
}

/** Las acusaciones concedidas que tienen prueba escrita: esas las revisa el juez. */
export function acusacionesARevisar(ids: string[], evaluacion: any, ps: any): Acusacion[] {
  if (ids.length === 0) return [];
  // Una falla que la evaluación muestra (fallas) también cuenta como marcada.
  const ev = {
    ...evaluacion,
    flags_detected: [...new Set([
      ...(Array.isArray(evaluacion?.flags_detected) ? evaluacion.flags_detected : []),
      ...(Array.isArray(evaluacion?.fallas) ? evaluacion.fallas.map((f: any) => f?.id).filter(Boolean) : []),
    ])],
    evidencia_flags: Array.isArray(evaluacion?.evidencia_flags) && evaluacion.evidencia_flags.length > 0
      ? evaluacion.evidencia_flags
      : (Array.isArray(evaluacion?.fallas) ? evaluacion.fallas.map((f: any) => ({ id: f?.id, cita: f?.cita ?? "" })) : []),
  };
  const quiere = new Set(ids);
  return acusacionesConPrueba(ev, ps).filter((a) => quiere.has(a.id));
}

/** La entrada del juez, con el argumento del vendedor: puede tener razón o no. */
export function entradaJuezConArgumento(
  acusaciones: Acusacion[],
  conversacion: { role?: string; content?: unknown }[],
  argumento: string,
): string {
  const base = JSON.parse(armarEntradaJuez(acusaciones, conversacion));
  return JSON.stringify({
    ...base,
    argumento_del_vendedor: {
      nota: "El vendedor no está de acuerdo con la acusación. Su argumento puede tener razón o no: compruébalo con LA PRUEBA y con lo que de verdad dijo en la conversación. Lo que el vendedor dice que quería hacer no cambia lo que dijo; un buen argumento solo cuenta si la conversación lo respalda.",
      dijo: argumento.slice(0, 2500),
    },
  });
}

export interface RevisionJuez {
  confirmadas: { id: string; razon: string; citas: Cita[] }[];
  sostenidas: { id: string; razon: string; citas: Cita[] }[];
  sin_revisar: { id: string; motivo: string }[];
}

/**
 * Qué decidió el juez de cada concesión. «validos» ya pasaron la revisión de
 * citas (juiciosConCitasValidas). Sin prueba escrita, la concesión no se
 * revisa y se queda como la dio la respuesta.
 */
export function clasificarRevision(
  ids: string[],
  revisadas: Acusacion[],
  validos: Juicio[] | null,
  descartados: { id: string; razon: string }[],
): RevisionJuez {
  const out: RevisionJuez = { confirmadas: [], sostenidas: [], sin_revisar: [] };
  const conPrueba = new Set(revisadas.map((a) => a.id));
  for (const id of ids) {
    if (!conPrueba.has(id)) {
      out.confirmadas.push({ id, razon: "(su regla no trae una prueba escrita: se queda lo que concedió la respuesta)", citas: [] });
      continue;
    }
    const j = (validos ?? []).find((x) => x.id === id);
    if (!j) {
      const d = descartados.find((x) => x.id === id);
      out.sin_revisar.push({ id, motivo: validos === null ? "el juez no contestó" : d ? `cita inválida: ${d.razon}` : "el juez no dio juicio" });
    } else if (j.conducta === "reprueba") {
      out.sostenidas.push({ id, razon: String(j.razon ?? ""), citas: j.citas ?? [] });
    } else {
      out.confirmadas.push({ id, razon: String(j.razon ?? ""), citas: j.citas ?? [] });
    }
  }
  return out;
}

export function hayQueReescribir(r: RevisionJuez): boolean {
  return r.sostenidas.length > 0 || r.sin_revisar.length > 0;
}

/** Las instrucciones para volver a escribir la respuesta, con lo que decidió el juez. */
export function bloqueRevisionJuez(r: RevisionJuez): string {
  const cita = (cs: Cita[]) => cs.map((c) => `turno ${c.turno} (${c.quien}): «${c.dijo}»`).join(" · ");
  const lineas = [
    "REVISIÓN DEL JUEZ (OBLIGATORIA). Antes de contestar, el juez de las pruebas volvió a revisar lo que ibas a concederle al vendedor, con LA PRUEBA de cada regla y con el argumento del vendedor. Lo que decidió el juez manda: tu respuesta NO puede contradecirlo.",
  ];
  for (const s of r.sostenidas) {
    lineas.push(`- ${s.id}: SE SOSTIENE. ${s.razon}${s.citas.length ? ` Citas: ${cita(s.citas)}` : ""}`);
    lineas.push(`  → NO le des la razón en ${s.id}. Reconoce en una frase lo que su razonamiento tiene de bueno, y explícale con la regla y con su frase exacta por qué esto sí cuenta. Dile qué habría dicho en lugar de esa frase para no cometer la falla.`);
  }
  for (const c of r.confirmadas) {
    lineas.push(`- ${c.id}: el juez CONFIRMA que la acusación estuvo mal. ${c.razon}`);
    lineas.push(`  → Aquí sí puedes darle la razón, claro y sin rodeos.`);
  }
  for (const n of r.sin_revisar) {
    lineas.push(`- ${n.id}: no se pudo revisar ahora (${n.motivo}).`);
    lineas.push(`  → No le des la razón ni se la quites en ${n.id}: dile que su punto queda registrado y que lo revisa el equipo de Closer.`);
  }
  lineas.push(`En el JSON: "concede_en" lleva SOLO lo que el juez confirmó; "concede" es true solo si hay algo en "concede_en".`);
  return lineas.join("\n");
}
