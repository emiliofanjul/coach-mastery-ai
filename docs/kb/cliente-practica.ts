// Qué cliente toca en cada práctica (oct-2026). Puro: se prueba ejecutándolo.

export type TipoNodo = "nuevo" | "recurrente" | "cualquiera";
export type TiposEmpresa = "ambos" | "solo_nuevos" | "solo_recurrentes";
export type TipoCliente = "nuevo" | "recurrente";

/**
 * El manager manda: si su equipo solo tiene clientes nuevos, todas las
 * prácticas son con clientes nuevos (y al revés). Si no hay restricción, toca
 * el que enseña mejor lo de ese nodo; si da igual, se alterna.
 */
export function resolverTipoCliente(nodo: unknown, empresa: unknown, azar: number): TipoCliente {
  if (empresa === "solo_nuevos") return "nuevo";
  if (empresa === "solo_recurrentes") return "recurrente";
  if (nodo === "nuevo" || nodo === "recurrente") return nodo;
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
