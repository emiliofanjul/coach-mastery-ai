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
  const n = ordenados[activo];
  if (!n) return "";
  const minutos = n.minutos_estimados ? ` Toma ${n.minutos_estimados} minutos.` : "";
  const cual = esNuevo ? "Tu primer nodo" : "Este nodo";
  if (!esTeoria(n)) return `${cual} termina con una práctica con voz.${minutos}`;
  let texto = `${cual} es de teoría: tarjetas y un quiz.${minutos}`;
  const siguiente = ordenados.findIndex((x, k) => k > activo && !esTeoria(x));
  if (siguiente < 0) return texto;
  const practica = esNuevo ? "Tu primera práctica con voz" : "Tu siguiente práctica con voz";
  const posicion = siguiente + 1; // en el mapa completo, contando desde 1
  if (siguiente === activo + 1) texto += ` ${practica} es el siguiente nodo.`;
  else if (esNuevo && posicion < ORDINAL.length) texto += ` ${practica} es el ${ORDINAL[posicion]} nodo.`;
  else texto += ` ${practica} llega en ${siguiente - activo} nodos.`;
  return texto;
}
