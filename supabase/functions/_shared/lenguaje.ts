// Lenguaje (sept-2026). Closer nunca dice groserías: le quitan profesionalidad
// y no hacen falta para conectar. Si el vendedor las usa, se le aconseja
// —sin castigo— que no las necesita. Sin imports: lo usan Deno y las pruebas.

const GROSERIAS = [
  "chingad[oa]s?", "chingar", "chinga", "chingu?e[sn]?", "pinches?", "pendej[oa]s?", "vergas?", "mierda", "putas?", "putos?",
  "cabr[oó]n(?:es)?", "cabron[ae]s?", "culer[oa]s?", "joder", "jodid[oa]s?", "coño", "carajo", "mamadas?", "mam[oó]n(?:es)?",
  "hij[oa]s? de (?:su )?puta", "no mames", "no manches", "me vale madres?", "valiendo madres?",
  // Sept-2026: "qué mal pedo" se coló en un consejo.
  "pedos?", "pedotes?", "qu[eé] pedo", "ni pedo", "desmadres?", "madrazos?", "madrizas?", "a toda madre", "poca madre",
  "chingadera", "chingaderas", "g[uü]ey", "wey", "culos?", "ching[oó]n(?:es)?", "chingona",
];
const PATRON = new RegExp(`(?:^|[^a-záéíóúñü])(${GROSERIAS.join("|")})(?=$|[^a-záéíóúñü])`, "i");

/** Devuelve la primera grosería encontrada, o null. */
export function primeraGroseria(texto: unknown): string | null {
  const t = String(texto ?? "").toLowerCase();
  const m = PATRON.exec(t);
  return m ? m[1] : null;
}
export function contieneGroserias(texto: unknown): boolean {
  return primeraGroseria(texto) !== null;
}
/** Groserías dichas por el vendedor en sus turnos, sin repetir. */
export function groseriasDelVendedor(historial: unknown): string[] {
  const vistas = new Set<string>();
  for (const t of Array.isArray(historial) ? historial : []) {
    const rol = String((t as any)?.role ?? "");
    if (rol !== "user") continue;
    const g = primeraGroseria((t as any)?.content ?? (t as any)?.text ?? "");
    if (g) vistas.add(g);
  }
  return [...vistas];
}

/**
 * Garantía en código: ningún texto de la evaluación sale con groserías. Los
 * ejemplos se vacían, los consejos se quitan y la misión cae en la de
 * respaldo. El consejo al vendedor sobre SUS groserías cita la palabra entre
 * comillas a propósito y se conserva.
 */
export function sanearGroseriasEvaluacion(ev: any, misionDeRespaldo: string): number {
  let quitados = 0;
  for (const o of Array.isArray(ev?.observations) ? ev.observations : []) {
    for (const k of ["error", "mejora", "ejemplo"]) {
      if (contieneGroserias(o?.[k])) { o[k] = k === "error" ? "Hay algo que mejorar en este criterio." : ""; quitados++; }
    }
  }
  if (contieneGroserias(ev?.mision)) { ev.mision = misionDeRespaldo; quitados++; }
  if (Array.isArray(ev?.siguiente_nivel)) {
    const antes = ev.siguiente_nivel.length;
    ev.siguiente_nivel = ev.siguiente_nivel.filter((x: any) =>
      x?.regla_id === "mindset.sin_groserias" || !(contieneGroserias(x?.observacion) || contieneGroserias(x?.ejemplo) || contieneGroserias(x?.por_que)));
    quitados += antes - ev.siguiente_nivel.length;
  }
  return quitados;
}
