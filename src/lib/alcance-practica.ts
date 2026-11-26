// Mensaje 180 (25-nov-2026): el aviso de «te pasaste del alcance» en la pantalla
// de resultados. El servidor (supabase/functions/_shared/alcance.ts) ya revisó
// que lo que hizo es de un paso posterior y que la cita es suya. Opción A de
// Emilio: un aviso tranquilo, sin bajar la nota.

/** El aviso con el nombre del nodo, y lo que dijo. null si la calificación no lo trae. */
export function avisoDeAlcance(evaluation: unknown, nombreNodo: string): { texto: string; cita: string } | null {
  const a = (evaluation as { alcance?: { texto?: unknown; cita?: unknown } } | null)?.alcance;
  const texto = typeof a?.texto === "string" ? a.texto.trim() : "";
  if (!texto) return null;
  const nombre = (nombreNodo ?? "").trim();
  const cita = typeof a?.cita === "string" ? a.cita.trim() : "";
  return { texto: `${nombre ? `Aquí solo practicamos «${nombre}».` : "Aquí solo practicamos este paso."} ${texto}`, cita };
}
