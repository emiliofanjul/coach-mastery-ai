// Qué cliente toca en cada práctica (oct-2026). Puro: se prueba ejecutándolo.

export type TipoNodo = "nuevo" | "recurrente" | "cualquiera";
export type TiposEmpresa = "ambos" | "solo_nuevos" | "solo_recurrentes";
export type TipoCliente = "nuevo" | "recurrente";

/**
 * Si el nodo declara con qué cliente se enseña (nuevo o recurrente), ese
 * manda siempre: un nodo de cliente recurrente es con cliente recurrente para
 * todas las empresas, porque todo cliente nuevo se vuelve recurrente en la
 * siguiente visita (decisión de Emilio, oct-2026). La empresa decide solo en
 * los nodos que se enseñan con cualquiera; si no restringe, se alterna.
 */
export function resolverTipoCliente(nodo: unknown, empresa: unknown, azar: number): TipoCliente {
  if (nodo === "nuevo" || nodo === "recurrente") return nodo;
  if (empresa === "solo_nuevos") return "nuevo";
  if (empresa === "solo_recurrentes") return "recurrente";
  return azar < 0.5 ? "nuevo" : "recurrente";
}

export interface FichaVisible { tipo: TipoCliente; nombre: string; negocio: string; ya_te_compra?: string; ultima_visita?: string }

/** La línea de la tarjeta. Nunca revela lo que el cliente le compra a otro: eso se descubre. */
export function lineaDelCliente(f: FichaVisible): string {
  return f.tipo === "nuevo"
    ? "Cliente nuevo: es la primera vez que lo visitas."
    : `Cliente recurrente: ya te compra ${f.ya_te_compra ?? "sus productos de siempre"}. Tu última visita fue ${f.ultima_visita ?? "hace poco"}.`;
}

export const LLAMADO_A_LA_ACCION = "Toca el micrófono y saluda a tu cliente como si estuvieras llegando a visitarlo.";

/** Si la ficha no llega, una de respaldo con la misma forma que la del servidor: la práctica nunca espera. */
export function fichaRespaldoVisible(tipo: TipoCliente): FichaVisible {
  return tipo === "recurrente"
    ? { tipo, nombre: "Don Ramón", negocio: "su negocio", ya_te_compra: "sus productos de siempre", ultima_visita: "hace dos semanas" }
    : { tipo, nombre: "Don Ramón", negocio: "su negocio" };
}
