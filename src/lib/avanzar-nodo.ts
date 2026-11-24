// Mensaje 170 (seguridad, 24-nov-2026): el avance lo decide el servidor.
//
// Antes la app escribía node_progress directo («done», con las estrellas que ella
// misma calculaba) y la certificación en sellers.certified_at. Cualquiera con sesión
// podía marcarse un nodo como hecho o certificarse sin practicar. Ahora la única forma
// de completar un nodo es la función avanzar_nodo de la base, que revisa la prueba:
// - lectura: el nodo no tiene quiz ni práctica;
// - quiz: las respuestas, contra las correctas de la base;
// - práctica: la calificación guardada por closer-voice para esa práctica.
// Solo deja completar el nodo que le toca (como el mapa) o repetir uno ya terminado,
// abre el siguiente y sella la certificación (7.4 con 85 o más).
import { restMutate } from "@/lib/supabase-rest";

export type PruebaDeAvance =
  | { tipo: "lectura" }
  | { tipo: "quiz"; respuestas: string[] }
  | { tipo: "practica"; practice_session_id: string };

export interface ResultadoAvance {
  ok: boolean;
  reason?: string;
  status?: "done" | "current";
  stars?: number;
  best_stars?: number;
  previous_stars?: number;
  was_completed?: boolean;
  desbloqueo_ahora?: boolean;
  next_node_id?: string | null;
  certified?: boolean;
}

/** Lo que el vendedor lee si el servidor no dejó avanzar. */
export function textoDeRechazo(reason: string | undefined): string {
  switch (reason) {
    case "no_le_toca":
      return "Este nodo todavía no te toca: sigue el orden del mapa.";
    case "quiz_no_aprobado":
      return "El quiz no quedó aprobado. Vuelve a intentarlo.";
    case "sin_calificacion":
      return "Tu calificación todavía no está lista. Espera un momento y vuelve a intentarlo.";
    case "practica_no_es_tuya":
    case "practica_de_otro_nodo":
    case "practica_invalida":
      return "No encontramos esta práctica a tu nombre.";
    default:
      return "No pudimos guardar tu avance. Inténtalo otra vez.";
  }
}

export async function avanzarNodo(nodeId: string, prueba: PruebaDeAvance): Promise<ResultadoAvance> {
  const r = (await restMutate<ResultadoAvance>("rpc/avanzar_nodo", {
    method: "POST",
    body: { _node_id: nodeId, _prueba: prueba },
  })) as unknown;
  // PostgREST devuelve el jsonb de la función tal cual (un objeto, no una lista).
  const res = (Array.isArray(r) ? r[0] : r) as ResultadoAvance | null | undefined;
  if (!res || typeof res.ok !== "boolean") return { ok: false, reason: "respuesta_invalida" };
  return res;
}
