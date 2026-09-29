// Lenguaje (sept-2026). Closer nunca dice groserías: le quitan profesionalidad
// y no hacen falta para conectar. Si el vendedor las usa, se le aconseja
// —sin castigo— que no las necesita. Sin imports: lo usan Deno y las pruebas.

const GROSERIAS = [
  "chingad[oa]s?", "chingar", "chinga", "chingu?e[sn]?", "pinches?", "pendej[oa]s?", "vergas?", "mierda", "putas?", "putos?",
  "cabr[oó]n(?:es)?", "cabron[ae]s?", "culer[oa]s?", "joder", "jodid[oa]s?", "coño", "carajo", "mamadas?", "mam[oó]n(?:es)?",
  "hij[oa]s? de (?:su )?puta", "no mames", "no manches", "me vale madres?", "valiendo madres?",
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
