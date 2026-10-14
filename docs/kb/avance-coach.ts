// Lo que el coach sabe del avance del vendedor (oct-2026, Emilio).
//
// Closer guía el entrenamiento: tiene que saber qué le ha enseñado ya a cada
// vendedor. Antes el coach leía sellers.current_world, que ninguna parte de la
// app actualizaba (siempre 0), y sellers.current_node, que retrocedía al
// repetir un nodo viejo. Así no distinguía lo ya enseñado de lo que falta.
// Ahora el avance se calcula igual que el mapa: nodos en orden (mundo, orden),
// los que tienen node_progress 'done' están completos, y el primero que no lo
// está es el que le toca.

export interface MundoAvance { id: number; name: string }
export interface NodoAvance { id: string; world_id: number; name: string; order_index: number; is_boss?: boolean | null }
export interface ProgresoAvance { node_id: string; status: string; stars?: number | null }

export interface Avance {
  /** El nodo que le toca, como en el mapa (null si ya completó todo). */
  actual: NodoAvance | null;
  mundoActual: number | null;
  texto: string;
}

const estrellas = (n: number | null | undefined) => (n && n > 0 ? " " + "★".repeat(Math.min(3, n)) : "");

export function armarAvance(
  mundos: MundoAvance[],
  nodos: NodoAvance[],
  progreso: ProgresoAvance[],
  opciones: { nombre?: string | null; certificado?: boolean } = {},
): Avance {
  const prog = new Map(progreso.map((p) => [p.node_id, p]));
  const hecho = (id: string) => prog.get(id)?.status === "done";
  // El mismo orden que el mapa (mapa.tsx): por mundo y luego por orden.
  const ordenados = [...nodos].sort((a, b) => (a.world_id !== b.world_id ? a.world_id - b.world_id : a.order_index - b.order_index));
  const actual = ordenados.find((n) => !hecho(n.id)) ?? null;
  const mundoActual = actual ? actual.world_id : ordenados.length ? ordenados[ordenados.length - 1].world_id : null;
  const nombreMundo = new Map(mundos.map((m) => [m.id, m.name]));

  const lineas: string[] = [];
  lineas.push(`Vendedor: ${opciones.nombre ?? "—"}${opciones.certificado ? " (certificado)" : ""}`);
  lineas.push(
    actual
      ? `Le toca: nodo ${actual.id} «${actual.name}», del Mundo ${actual.world_id} — ${nombreMundo.get(actual.world_id) ?? "—"}.`
      : "Ya completó todos los nodos del mapa.",
  );
  lineas.push("");
  lineas.push("SU MAPA (✓ = ya se lo enseñaste y lo pasó, con sus estrellas · ▶ = el que le toca ahora · ○ = todavía no lo ve):");
  const mundosOrden = [...new Set(ordenados.map((n) => n.world_id))];
  for (const w of mundosOrden) {
    const deMundo = ordenados.filter((n) => n.world_id === w);
    const estado = mundoActual === null || w < mundoActual ? "ya lo pasó" : w === mundoActual ? "AQUÍ VA" : "todavía no lo ve";
    lineas.push(`Mundo ${w} — ${nombreMundo.get(w) ?? "—"} [${estado}]`);
    for (const n of deMundo) {
      const marca = hecho(n.id) ? "✓" : actual && n.id === actual.id ? "▶" : "○";
      const st = hecho(n.id) ? estrellas(prog.get(n.id)?.stars) : "";
      const s = prog.get(n.id)?.stars;
      const repetir = hecho(n.id) && s === 1 ? " (1 estrella: conviene repetirlo)" : "";
      lineas.push(`  ${marca} ${n.id} ${n.name}${n.is_boss ? " (boss)" : ""}${st}${repetir}`);
    }
  }
  return { actual, mundoActual, texto: lineas.join("\n") };
}

export interface TecnicaAvance { name: string; world_id_introduced: number; status?: string | null }

/**
 * Qué técnica se enseña en qué mundo, marcado contra el avance del vendedor.
 * El coach lo usa para ubicar el tema de una pregunta antes de contestar
 * (oct-2026: ante "está muy caro" el coach explicó triple desglose y balas,
 * del Mundo 4, a un vendedor que todavía no lo abría).
 */
export function armarTecnicas(mundos: MundoAvance[], tecnicas: TecnicaAvance[], mundoActual: number | null): string {
  const nombreMundo = new Map(mundos.map((m) => [m.id, m.name]));
  const porMundo = new Map<number, string[]>();
  for (const t of tecnicas) {
    if (t.status && t.status !== "active") continue;
    const l = porMundo.get(t.world_id_introduced) ?? [];
    if (!l.includes(t.name)) l.push(t.name);
    porMundo.set(t.world_id_introduced, l);
  }
  const lineas = ["TÉCNICAS POR MUNDO (dónde se enseña cada una):"];
  for (const w of [...porMundo.keys()].sort((a, b) => a - b)) {
    const estado = mundoActual === null || w < mundoActual
      ? "ya se las enseñaste"
      : w === mundoActual
        ? "las está aprendiendo ahora"
        : "TODAVÍA NO SE LAS ENSEÑAS: no las expliques"
    lineas.push(`Mundo ${w} — ${nombreMundo.get(w) ?? "—"} [${estado}]: ${porMundo.get(w)!.join("; ")}`);
  }
  return lineas.join("\n");
}
