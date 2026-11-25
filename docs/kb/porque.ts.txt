// EL PORQUÉ DE CADA FALLA (mensaje 174, 24-nov-2026).
//
// El caso: Carlos cambió una sola pregunta en el 2.2 y pasó de 100 a 30
// («¿qué es lo que más le pide esos días?» antes de presentarse: pitch
// prematuro). La pantalla le dijo qué hizo mal, pero no por qué eso ahí no
// funciona ni dónde sí va, y concluyó que le calificábamos frases exactas.
// Emilio: «si solo les decimos que lo hicimos mal, y no les decimos por qué la
// forma en la que le estamos enseñando está bien y funciona, entonces solo nos
// van a hacer caso para pasar en la app y no lo van a usar realmente en la calle».
//
// Lo que hace (doc aprobado «La línea recta y el porqué», 24-nov):
//   · A cada falla y cada observación le pone su «por qué importa»: el
//     mecanismo del Cerebro que explica su regla (tabla mecanismos y
//     reglas_mecanismo).
//   · Si la falla es de hacer algo antes de tiempo, también en qué paso sí va
//     y por qué ahí (tabla va_despues).
//   · Dice en qué paso de la línea recta está este nodo (null = la línea
//     completa, como en el mundo 7).
// Es código, no modelo: los textos son los del doc aprobado, guardados en la
// base. No toca la nota. Sin imports: funciona en Deno y en Node.

export interface Mecanismo { id: number; nombre: string; porque: string }
export interface ReglaMecanismo { regla_id: string; mecanismo_id: number }
export interface VaDespues { regla_id: string; va_en: string; porque: string }
export interface CatalogoPorque {
  mecanismos: Mecanismo[];
  reglas_mecanismo: ReglaMecanismo[];
  va_despues: VaDespues[];
}

export interface PorQue {
  /** El nombre del mecanismo, como en el doc: «La balanza». */
  mecanismo: string;
  /** Por qué importa, en una o dos frases. */
  texto: string;
  /** Si es de antes de tiempo: dónde sí va («el paso 4, después de confirmarle el dolor»). */
  va_en?: string;
  /** Y por qué ahí sí. */
  va_despues?: string;
}

/** Los pasos de la línea recta, como en el Cerebro. */
export const PASOS = ["Introducción", "Historia breve", "Descubrimiento", "Presentación", "Cierre", "Consolidación"] as const;

const str = (x: unknown): string => (typeof x === "string" ? x.trim() : "");

/** El paso de la línea en que está el nodo: el mundo del 1 al 6. El 7 (y cualquier otro) recorre la línea completa: null. */
export function pasoDelNodo(nodeId: string | null | undefined): number | null {
  const n = Number(str(nodeId).split(".")[0]);
  return Number.isInteger(n) && n >= 1 && n <= 6 ? n : null;
}

/** «Mecanismo 3. La balanza» → «La balanza». */
const sinNumero = (nombre: string) => nombre.replace(/^\s*\d+\.\s*/, "");

/**
 * Pone `porque` en cada falla y cada observación de la evaluación, y `linea`
 * (en qué paso está el nodo). Nunca quita ni cambia nada más: lo que no se
 * encuentra simplemente no lleva porqué.
 */
export function explicarPorQue(ev: any, practiceScript: any, nodeId: string | null, cat: CatalogoPorque): void {
  if (!ev || typeof ev !== "object") return;
  const mecanismo = new Map<number, Mecanismo>();
  for (const m of Array.isArray(cat?.mecanismos) ? cat.mecanismos : []) {
    if (Number.isInteger(Number(m?.id)) && str(m?.porque)) mecanismo.set(Number(m.id), m);
  }
  const deRegla = new Map<string, number>();
  for (const r of Array.isArray(cat?.reglas_mecanismo) ? cat.reglas_mecanismo : []) {
    if (str(r?.regla_id)) deRegla.set(str(r.regla_id), Number(r.mecanismo_id));
  }
  const despues = new Map<string, VaDespues>();
  for (const v of Array.isArray(cat?.va_despues) ? cat.va_despues : []) {
    if (str(v?.regla_id) && str(v?.va_en) && str(v?.porque)) despues.set(str(v.regla_id), v);
  }

  const porqueDe = (regla: string): PorQue | null => {
    const m = mecanismo.get(deRegla.get(regla) ?? NaN);
    if (!m) return null;
    const out: PorQue = { mecanismo: sinNumero(str(m.nombre)), texto: str(m.porque) };
    const v = despues.get(regla);
    if (v) { out.va_en = str(v.va_en); out.va_despues = str(v.porque); }
    return out;
  };

  const reglaDeFalla = new Map<string, string>();
  for (const f of Array.isArray(practiceScript?.failure_criteria) ? practiceScript.failure_criteria : []) {
    if (str(f?.id) && str(f?.regla_id)) reglaDeFalla.set(str(f.id), str(f.regla_id));
  }
  const reglaDeCriterio = new Map<string, string>();
  for (const c of Array.isArray(practiceScript?.success_criteria) ? practiceScript.success_criteria : []) {
    if (str(c?.id) && str(c?.regla_id)) reglaDeCriterio.set(str(c.id), str(c.regla_id));
  }

  for (const f of Array.isArray(ev.fallas) ? ev.fallas : []) {
    const regla = reglaDeFalla.get(str(f?.id));
    const p = regla ? porqueDe(regla) : null;
    if (p && f && typeof f === "object") f.porque = p;
  }
  for (const o of Array.isArray(ev.observations) ? ev.observations : []) {
    const regla = reglaDeCriterio.get(str(o?.criterio_id));
    const p = regla ? porqueDe(regla) : null;
    if (p && o && typeof o === "object") o.porque = p;
  }
  ev.linea = { paso: pasoDelNodo(nodeId) };
}
