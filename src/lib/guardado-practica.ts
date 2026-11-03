// El guardado de la práctica desde el teléfono (mensaje 129, 3-nov-2026).
//
// Antes, si la llamada que guarda la práctica (con su audio) fallaba, el error
// iba solo a la consola del teléfono: sin reintento y sin rastro, y nadie
// podía saber por qué. Ahora se reintenta, y si no se logra, el motivo queda
// en la tabla fallas_app, que el equipo de Closer sí puede consultar.

import { restMutate } from "@/lib/supabase-rest";

export interface ResultadoGuardado {
  ok: boolean;
  intentos: number;
  status: number | null;
  detalle: string;
}

/** Espera antes de cada reintento: dos reintentos, el segundo más espaciado. */
export const ESPERAS_REINTENTO_MS = [2_000, 5_000];

/**
 * Corre «enviar» hasta que responda bien. Reintenta si no hubo respuesta
 * (sin señal), si el servidor falló (5xx) o si la sesión había caducado (401).
 * Otro 4xx no se reintenta: mandar lo mismo daría lo mismo.
 */
export async function conReintentos(
  enviar: () => Promise<{ status: number; texto: string }>,
  opts: { esperar: (ms: number) => Promise<void>; esperas?: number[] },
): Promise<ResultadoGuardado> {
  const esperas = opts.esperas ?? ESPERAS_REINTENTO_MS;
  let ultimo: ResultadoGuardado = { ok: false, intentos: 0, status: null, detalle: "" };
  for (let i = 0; i <= esperas.length; i++) {
    if (i > 0) await opts.esperar(esperas[i - 1]);
    try {
      const r = await enviar();
      if (r.status >= 200 && r.status < 300) return { ok: true, intentos: i + 1, status: r.status, detalle: "" };
      ultimo = { ok: false, intentos: i + 1, status: r.status, detalle: `HTTP ${r.status}: ${String(r.texto ?? "").slice(0, 800)}` };
      const reintentable = r.status >= 500 || r.status === 401 || r.status === 408 || r.status === 429;
      if (!reintentable) return ultimo;
    } catch (e) {
      ultimo = { ok: false, intentos: i + 1, status: null, detalle: `sin respuesta: ${String((e as any)?.message ?? e).slice(0, 800)}` };
    }
  }
  return ultimo;
}

/** Deja constancia de una falla. Nunca lanza: registrar no puede romper la práctica. */
export async function registrarFallaApp(f: {
  seller_id: string | null;
  donde: string;
  detalle: string;
  datos?: Record<string, unknown>;
}): Promise<void> {
  if (!f.seller_id) return;
  try {
    await restMutate("fallas_app", {
      method: "POST",
      body: {
        seller_id: f.seller_id,
        donde: f.donde.slice(0, 120),
        detalle: f.detalle.slice(0, 1000),
        datos: f.datos ?? {},
        agente: typeof navigator !== "undefined" ? String(navigator.userAgent ?? "").slice(0, 300) : null,
      },
      timeoutMs: 10_000,
    });
  } catch (e) {
    console.error("[fallas_app] no se pudo registrar:", e);
  }
}
