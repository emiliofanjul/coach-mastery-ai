/**
 * El texto del globo «Empieza aquí» (mensaje 155, nov-2026).
 *
 * Emilio: quien descarga Closer para practicar con su voz y se encuentra tarjetas y un quiz puede pensar
 * que no era lo que esperaba. El globo le dice qué tipo de nodo tiene enfrente y cuándo llega su
 * práctica con voz. Se calcula del mapa real (node_type), no se escribe a mano: si el contenido cambia,
 * el globo sigue diciendo la verdad.
 */
export type NodoGuia = { node_type?: string | null; minutos_estimados: number | null };

const ORDINAL = ["", "primer", "segundo", "tercer", "cuarto", "quinto", "sexto", "séptimo", "octavo", "noveno", "décimo"];

/** Un nodo «de teoría» solo tiene tarjetas y quiz; los demás terminan con una práctica con voz. */
export const esTeoria = (n: NodoGuia) => n.node_type === "knowledge";

export function textoGuiaMapa(ordenados: NodoGuia[], activo: number, esNuevo: boolean): string {
  // Mensaje 159: frases cortas y fáciles. Qué es este nodo, cuánto toma y cuándo practica con un cliente.
  const n = ordenados[activo];
  if (!n) return "";
  const min = n.minutos_estimados ? ` ${n.minutos_estimados} minutos.` : "";
  if (!esTeoria(n)) return `Aquí practicas con un cliente.${min ? ` Toma${min}` : ""}`;
  let texto = `Teoría corta:${min || " tarjetas y un quiz."}`;
  const siguiente = ordenados.findIndex((x, k) => k > activo && !esTeoria(x));
  if (siguiente < 0) return texto;
  const posicion = siguiente + 1; // en el mapa completo, contando desde 1
  if (siguiente === activo + 1) texto += esNuevo ? " En el siguiente nodo practicas con tu primer cliente." : " En el siguiente nodo practicas con un cliente.";
  else if (esNuevo && posicion < ORDINAL.length) texto += ` En el ${ORDINAL[posicion]} nodo practicas con tu primer cliente.`;
  else texto += ` En ${siguiente - activo} nodos practicas con un cliente.`;
  return texto;
}
