// Cómo el teléfono obtiene la calificación de una práctica (mensaje 126).
//
// El servidor la calcula en segundo plano y la guarda en
// evaluaciones_practica. El teléfono la pide una vez (respuesta inmediata) y
// después pregunta por la fila hasta que esté lista o en error. Ya no hay un
// límite fijo de 60 segundos que tire la calificación a la basura: si el
// servidor tarda, el teléfono sigue esperando; si el teléfono pierde la señal,
// la calificación igual queda guardada y al reintentar llega la misma, sin
// calcularla otra vez.

// Igual que en supabase/functions/_shared/evaluacion_guardada.ts (una prueba
// verifica que coincidan).
export const PROCESANDO_ABANDONADA_MS = 240_000;
export const ESPERA_MAXIMA_TELEFONO_MS = PROCESANDO_ABANDONADA_MS + 15_000;
export const INTERVALO_CONSULTA_MS = 2_500;
// Si el pedido no llegó al servidor, la fila nunca aparece: no se espera más que esto.
export const SIN_FILA_MAXIMO_MS = 20_000;

export interface FilaCalificacion {
  estado: "procesando" | "lista" | "error" | string;
  resultado?: unknown;
  error?: string | null;
}

export interface Dependencias {
  /** El pedido a closer-voice (evaluate con practice_session_id). */
  pedir: () => Promise<{ status: number; texto: string }>;
  /** La fila de evaluaciones_practica de esta práctica, o null si no existe. */
  leer: () => Promise<FilaCalificacion | null>;
  dormir: (ms: number) => Promise<void>;
  ahora: () => number;
  /** Para avisar en pantalla que está tardando (opcional). */
  alEsperar?: (msTranscurridos: number) => void;
}

export class CalificacionTardada extends Error {
  constructor() {
    super("La calificación tardó más de lo esperado");
    this.name = "CalificacionTardada";
  }
}

export class CalificacionFallida extends Error {
  constructor(detalle: string) {
    super(detalle);
    this.name = "CalificacionFallida";
  }
}

/** Devuelve el JSON de la calificación como texto, igual que antes lo devolvía la función. */
export async function obtenerCalificacion(d: Dependencias): Promise<string> {
  const inicio = d.ahora();
  let pedidoLlego = false;
  try {
    const r = await d.pedir();
    if (r.status === 200) return r.texto;
    if (r.status !== 202) throw new CalificacionFallida(`closer-voice evaluate HTTP ${r.status}: ${r.texto}`);
    pedidoLlego = true;
  } catch (e) {
    if (e instanceof CalificacionFallida) throw e;
    // Se cortó la señal al pedir: puede que el servidor sí lo recibiera.
    // Se pregunta por la fila; si nunca aparece, el pedido no llegó.
  }

  while (d.ahora() - inicio < ESPERA_MAXIMA_TELEFONO_MS) {
    await d.dormir(INTERVALO_CONSULTA_MS);
    d.alEsperar?.(d.ahora() - inicio);
    let fila: FilaCalificacion | null;
    try {
      fila = await d.leer();
    } catch {
      continue; // Sin señal un momento: se vuelve a preguntar.
    }
    if (!fila) {
      if (!pedidoLlego && d.ahora() - inicio > SIN_FILA_MAXIMO_MS) {
        throw new CalificacionFallida("El pedido de calificación no llegó al servidor");
      }
      continue;
    }
    pedidoLlego = true;
    if (fila.estado === "lista" && fila.resultado != null) return JSON.stringify(fila.resultado);
    if (fila.estado === "error") throw new CalificacionFallida(fila.error || "La calificación falló en el servidor");
  }
  throw new CalificacionTardada();
}
