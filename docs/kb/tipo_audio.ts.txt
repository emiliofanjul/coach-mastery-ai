// Mensaje 170 (seguridad, 24-nov-2026): el tipo de un audio se decide por sus bytes,
// no por lo que diga el teléfono. Antes save-practice-event guardaba cualquier archivo
// con el tipo que mandara la app.

/** El tope del almacén practice-audio (50 MiB). Más grande no se lee ni se guarda. */
export const MAX_AUDIO_BYTES = 52_428_800;

export interface TipoAudio {
  tipo: "audio/wav" | "audio/webm" | "audio/mp4" | "audio/ogg" | "audio/mpeg";
  ext: "wav" | "webm" | "m4a" | "ogg" | "mp3";
}

const asc = (b: Uint8Array, desde: number, texto: string) =>
  b.length >= desde + texto.length && [...texto].every((c, i) => b[desde + i] === c.charCodeAt(0));

/** Reconoce los formatos que graba la app (WAV, WebM, MP4/M4A) y dos comunes (OGG, MP3). Lo demás: null. */
export function tipoDeAudio(b: Uint8Array): TipoAudio | null {
  if (asc(b, 0, "RIFF") && asc(b, 8, "WAVE")) return { tipo: "audio/wav", ext: "wav" };
  if (b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { tipo: "audio/webm", ext: "webm" };
  if (asc(b, 4, "ftyp")) return { tipo: "audio/mp4", ext: "m4a" };
  if (asc(b, 0, "OggS")) return { tipo: "audio/ogg", ext: "ogg" };
  if (asc(b, 0, "ID3") || (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return { tipo: "audio/mpeg", ext: "mp3" };
  return null;
}
