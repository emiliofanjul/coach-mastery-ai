// "Lo que viene después", amarrado a la doctrina (sept-2026).
//
// Antes el prompt invitaba al evaluador a dar consejos "de pasos posteriores"
// sin darle la doctrina de esos pasos: improvisaba con conocimiento genérico de
// ventas (saltarse la presentación, ofrecer una muestra, cerrar con pregunta
// abierta). Ahora el consejo habla del MISMO paso que entrena el nodo, cita una
// regla del registro de ese paso, y el código descarta lo que no la cite.
// Sin imports: lo usan la Edge Function (Deno) y las pruebas (Node).

/** El paso del nodo: el más frecuente entre las reglas de sus criterios de éxito (sin contar el 0, fundamentos). */
export function pasoDelNodo(successCriteria: unknown, pasoPorRegla: Map<string, number>): number | null {
  const cuenta = new Map<number, number>();
  for (const c of Array.isArray(successCriteria) ? successCriteria : []) {
    const p = pasoPorRegla.get(String((c as any)?.regla_id ?? ""));
    if (typeof p === "number" && p > 0) cuenta.set(p, (cuenta.get(p) ?? 0) + 1);
  }
  let mejor: number | null = null, max = 0;
  for (const [p, n] of cuenta) if (n > max || (n === max && mejor !== null && p < mejor)) { mejor = p; max = n; }
  return mejor;
}

export interface ConsejoSiguienteNivel { observacion: string; ejemplo: string; por_que: string; regla_id: string }

/** Conserva solo los consejos que citan una regla permitida. Máximo 2. */
export function filtrarSiguienteNivel(items: unknown, permitidas: Set<string>): { conservados: ConsejoSiguienteNivel[]; descartados: number } {
  const lista = Array.isArray(items) ? items : [];
  const conservados: ConsejoSiguienteNivel[] = [];
  let descartados = 0;
  for (const x of lista) {
    const o = x as any;
    const ok = o && typeof o === "object" && typeof o.observacion === "string" && o.observacion.trim()
      && typeof o.regla_id === "string" && permitidas.has(o.regla_id);
    if (!ok) { descartados++; continue; }
    if (conservados.length >= 2) continue;
    conservados.push({
      observacion: o.observacion.trim(),
      ejemplo: typeof o.ejemplo === "string" ? o.ejemplo.trim() : "",
      por_que: typeof o.por_que === "string" ? o.por_que.trim() : "",
      regla_id: o.regla_id,
    });
  }
  return { conservados, descartados };
}
