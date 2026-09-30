// Los turnos del vendedor dentro de la grabación de una práctica (sept-2026).
// Sin imports: lo usan la pantalla del manager y las pruebas.

export type TurnoAudio = { turno: number; inicio_seg: number; fin_seg: number; texto?: string };

export function mmss(seg: number): string {
  const s = Math.max(0, Math.floor(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function turnosValidos(x: unknown): TurnoAudio[] {
  return (Array.isArray(x) ? x : [])
    .filter((t: any) => t && Number.isFinite(t.inicio_seg) && Number.isFinite(t.fin_seg) && t.fin_seg > t.inicio_seg)
    .map((t: any) => ({ turno: Number(t.turno), inicio_seg: Number(t.inicio_seg), fin_seg: Number(t.fin_seg), texto: typeof t.texto === "string" ? t.texto : undefined }));
}
