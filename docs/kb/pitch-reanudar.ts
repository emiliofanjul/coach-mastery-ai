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
