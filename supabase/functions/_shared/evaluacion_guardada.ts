// La calificación de una práctica la calcula y la GUARDA el servidor, pase lo
// que pase con el teléfono (mensaje 126, 3-nov-2026).
//
// Antes, el teléfono esperaba la respuesta con un límite fijo de 60 segundos.
// Si el servidor tardaba más (el evaluador, después el juez y el auditor, y a
// veces una segunda revisión), el teléfono cortaba, la calificación se perdía
// aunque el servidor la terminara, y al reintentar se calificaba otra vez desde
// cero: se pagaba dos veces y la nota podía salir distinta.
//
// Ahora cada práctica guardada tiene una fila en evaluaciones_practica:
//   procesando → el servidor la está calculando (en segundo plano);
//   lista      → aquí está el resultado; reintentar lo devuelve tal cual;
//   error      → falló; reintentar la vuelve a calcular.
// El teléfono no adivina un límite: pregunta por la fila hasta que está lista
// o en error.

export type EstadoEvaluacion = "procesando" | "lista" | "error";

export interface FilaEvaluacion {
  estado: EstadoEvaluacion;
  resultado?: unknown;
  actualizada_en?: string | null;
}

// Si una fila sigue en «procesando» más de esto, el trabajo murió (por
// ejemplo, el servidor llegó a su tiempo máximo) y se puede volver a empezar.
// Va por encima del peor caso medido de una calificación completa.
export const PROCESANDO_ABANDONADA_MS = 240_000;

// Lo más que el teléfono espera antes de ofrecer reintentar. Un poco más que
// lo de arriba: así, cuando el teléfono se rinde, el servidor ya acepta
// volver a empezar.
export const ESPERA_MAXIMA_TELEFONO_MS = PROCESANDO_ABANDONADA_MS + 15_000;

export type Decision = "devolver" | "esperar" | "empezar";

export function decidirEvaluacion(fila: FilaEvaluacion | null | undefined, ahora: number): Decision {
  if (!fila) return "empezar";
  if (fila.estado === "lista" && fila.resultado != null) return "devolver";
  if (fila.estado === "procesando") {
    const t = fila.actualizada_en ? Date.parse(fila.actualizada_en) : NaN;
    if (Number.isFinite(t) && ahora - t < PROCESANDO_ABANDONADA_MS) return "esperar";
  }
  return "empezar";
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function esIdDePractica(v: unknown): v is string {
  return typeof v === "string" && UUID.test(v);
}
