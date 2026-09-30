// El Pitch Builder aguanta que el manager cambie de app (sept-2026).
//
// El pitch se genera sección por sección y cada sección se guarda sola al
// terminar (generarla de nuevo la reemplaza). Si Safari congela la página
// —porque el manager se fue a WhatsApp— la sección en curso se corta. En vez
// de tratarlo como error, la generación se PAUSA: se anota dónde iba, y al
// volver a la app retoma sola desde esa sección. Si el iPhone recargó la
// página completa, también retoma, siempre que la pausa sea reciente.

export const CLAVE_PAUSA = "closer_pitch_en_pausa";
export const VIGENCIA_PAUSA_MS = 30 * 60 * 1000;

export interface PausaPitch { pitchId: string; step: number; ts: number }

/** La pausa guardada, si sigue vigente. Pura: recibe el texto guardado y la hora. */
export function leerPausa(guardado: string | null, ahora: number): PausaPitch | null {
  if (!guardado) return null;
  try {
    const p = JSON.parse(guardado);
    if (typeof p?.pitchId !== "string" || !p.pitchId) return null;
    if (!Number.isInteger(p?.step) || p.step < 1) return null;
    if (typeof p?.ts !== "number" || ahora - p.ts > VIGENCIA_PAUSA_MS || p.ts > ahora + 60_000) return null;
    return { pitchId: p.pitchId, step: p.step, ts: p.ts };
  } catch {
    return null;
  }
}

/** ¿La falla fue porque el manager salió de la app, y no un error real? */
export function fueInterrupcion(seOcultoDuranteLaLlamada: boolean, ocultoAhora: boolean): boolean {
  return seOcultoDuranteLaLlamada || ocultoAhora;
}

/**
 * Vigilante: si una sección tarda mucho más de lo normal, se deja de esperar y
 * se pone en pausa con el botón "Seguir generando". Cuando el teléfono duerme,
 * la conexión puede quedar congelada sin fallar nunca: sin vigilante, la
 * pantalla decía "Escribiendo…" para siempre.
 */
export const LIMITE_SECCION_MS = 180_000;
export class SeccionTardada extends Error {
  constructor() { super("seccion_tardada"); this.name = "SeccionTardada"; }
}
export function conLimite<T>(promesa: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rej) => { t = setTimeout(() => rej(new SeccionTardada()), ms); });
  return Promise.race([promesa, limite]).finally(() => { if (t) clearTimeout(t); }) as Promise<T>;
}

/** ¿Teléfono o tableta? Para recomendar generar el pitch desde la computadora. */
export function esDispositivoMovil(ua: string, puntoGrueso: boolean): boolean {
  return /iPhone|iPad|iPod|Android|Mobile/i.test(ua) || puntoGrueso;
}
