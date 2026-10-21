// LO QUE SE EVALÚA ES SOLO EL DIÁLOGO DE VENTA (mensaje 103, 21-oct-2026).
//
// En la práctica real del 2.7c (20-oct-2026) el cierre de Closer —«Pasaste el
// primer no con AIR… Vamos al detalle»— entró a la evaluación como si lo
// hubiera dicho el CLIENTE: se agregaba al transcript con role "agent" y se
// mandaba como "assistant". Lo mismo pasaba con los desvíos: cuando el
// vendedor sale del personaje y Closer contesta fuera del papel, ese
// intercambio ya no entraba al historial del Actor ni del Director, pero sí a
// la evaluación y a las disputas.
//
// Lo que Closer dice con su propia voz (el cierre, una respuesta fuera del
// papel) y el turno del vendedor que la provocó se marcan "fuera de la venta":
// se siguen viendo en pantalla, pero no se evalúan ni se discuten.

export type TurnPhase = "i_do" | "you_do";

export interface TranscriptItem {
  role: "agent" | "user";
  text: string;
  phase: TurnPhase;
  /** Lo dijo Closer con su propia voz, o es el turno meta que lo provocó. */
  fuera_de_la_venta?: boolean;
}

/** El diálogo de venta de la práctica del vendedor: lo único que se evalúa. */
export function dialogoDeVenta(items: TranscriptItem[]): { role: "assistant" | "user"; content: string }[] {
  return (Array.isArray(items) ? items : [])
    .filter((m) => m && m.phase === "you_do" && m.fuera_de_la_venta !== true)
    .map((m) => ({ role: m.role === "agent" ? "assistant" : "user", content: m.text }));
}

/** Marca como fuera de la venta el último turno del vendedor (el meta que provocó la respuesta de Closer). */
export function marcarUltimoDelVendedorFueraDeLaVenta(items: TranscriptItem[]): TranscriptItem[] {
  const copia = [...items];
  for (let i = copia.length - 1; i >= 0; i--) {
    if (copia[i]?.role === "user") {
      copia[i] = { ...copia[i], fuera_de_la_venta: true };
      break;
    }
  }
  return copia;
}
