// Lo que el vendedor lee cuando la voz falla (oct-2026).
//
// Antes había un solo aviso —"No pude abrir el micrófono"— para todo, incluso
// cuando el micrófono estaba bien y lo caído era el servicio de transcripción.
// Y varias fallas no avisaban nada. Ahora cada falla dice qué hacer y trae un
// código corto, para que quien dé soporte sepa cuál fue sin revisar registros.
import { ErrorTokenVoz, codigoDeFalla, type FallaVoz } from "./turno-voz";

const REINTENTA = "Toca el micrófono y vuelve a hablar.";

export function avisoDeFallaVoz(falla: FallaVoz, codigo: string): string {
  const texto: Record<FallaVoz, string> = {
    sin_audio: `Tu micrófono no arrancó. ${REINTENTA}`,
    sin_conexion: `No pude conectarme para escucharte. Revisa tu internet. ${REINTENTA}`,
    conexion_cerrada: `Se cortó la conexión mientras te escuchaba. ${REINTENTA}`,
    sin_texto: `Te oigo pero no logro entender las palabras. ${REINTENTA}`,
    servicio: "El servicio que te escucha no está disponible en este momento. Intenta en unos minutos.",
  };
  return `${texto[falla]} (código ${codigo})`;
}

/** El turno ni siquiera arrancó: permiso, sesión, o la llave de transcripción. */
export function avisoDeArranque(err: unknown): string {
  const nombre = (err as { name?: string } | null)?.name;
  if (nombre === "NotAllowedError") return "Necesito permiso de micrófono para que practiques por voz.";
  if (err instanceof ErrorTokenVoz) {
    if (err.estado === 401) return "Tu sesión caducó. Cierra sesión y vuelve a entrar. (código T401)";
    // 502 = nuestro servidor preguntó y el proveedor de voz dijo que no.
    const detalle = err.estadoProveedor ? `${err.estado}-${err.estadoProveedor}` : String(err.estado);
    return `${avisoDeFallaVoz("servicio", codigoDeFalla("servicio", `T${detalle}`))}`;
  }
  if ((err as Error | null)?.message === "sin-sesion") return "Tu sesión caducó. Cierra sesión y vuelve a entrar. (código T0)";
  return `No pude abrir el micrófono. Toca para reintentar. (código M-${nombre || "x"})`;
}
