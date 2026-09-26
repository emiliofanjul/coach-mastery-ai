// Reglas aritméticas de la puntuación.
//
// Principio (sept-2026): el modelo JUZGA, el código CALCULA. Las reglas que son
// aritmética pura no se le piden al modelo de lenguaje: se aplican aquí, de
// forma determinista, después de que el modelo responde.
//
// Por qué: la regla "un flag critical deja el score en máximo 30" vivía solo
// en el prompt. En el harness, el evaluador marcó pitch_prematuro (critical) y
// aun así devolvió 35. Un modelo puede olvidar una regla; una función no.
//
// Sin imports, para que la usen tanto la Edge Function (Deno) como las pruebas
// (Node/Vitest) con el mismo código exacto.

export const TOPE_CRITICO = 30;

export type Severidad = "minor" | "major" | "critical";

export interface ResultadoTope {
  score: number;
  /** true si el score del modelo excedía el tope y el código lo bajó. */
  topado: boolean;
  /** Los flags critical que dispararon el tope. */
  criticos: string[];
}

/**
 * Si entre los flags detectados hay alguno de severidad critical (según los
 * failure_criteria del guion resuelto), el score no puede pasar de 30.
 * Solo cuentan los flags que existen en el guion: un id desconocido no topa.
 */
export function aplicarTopeCritico(
  score: number,
  flagsDetectados: unknown,
  failureCriteria: unknown,
): ResultadoTope {
  const severidadDe = new Map<string, string>();
  if (Array.isArray(failureCriteria)) {
    for (const f of failureCriteria) {
      if (f && typeof f === "object" && typeof (f as any).id === "string") {
        severidadDe.set((f as any).id, String((f as any).severity ?? ""));
      }
    }
  }
  const flags = Array.isArray(flagsDetectados)
    ? flagsDetectados.filter((x): x is string => typeof x === "string")
    : [];
  const criticos = flags.filter((f) => severidadDe.get(f) === "critical");
  const base = typeof score === "number" && Number.isFinite(score) ? score : 0;
  if (criticos.length > 0 && base > TOPE_CRITICO) {
    return { score: TOPE_CRITICO, topado: true, criticos };
  }
  return { score: base, topado: false, criticos };
}

/** Estrellas a partir del score YA topado. */
export function estrellasDe(score: number): 1 | 2 | 3 {
  return score >= 85 ? 3 : score >= 60 ? 2 : 1;
}
