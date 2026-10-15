// Guardia de "Tu coach" (oct-2026, Emilio). Si el vendedor pregunta algo de un
// mundo que todavía no ve, la respuesta es breve, no explica ni nombra las
// técnicas de ese mundo y le dice dónde las va a aprender. El prompt lo pide;
// en la prueba del 83 el modelo nombró FFF y RRR y escribió más de 10 frases a
// un vendedor del Mundo 3. Aquí se comprueba en código y, si no cumple, se
// reescribe una vez.

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const TAG = /^\s*\[TEMA:\s*(?:mundo\s*)?(\d+|general)\s*\]\s*/i;

/** El coach empieza con "[TEMA: Mundo N]". Se quita siempre del texto. */
export function extraerTema(texto: string): { mundo: number | null; texto: string } {
  const m = texto.match(TAG);
  const limpio = texto.replace(TAG, "").replace(/\[TEMA:[^\]]*\]\s*/gi, "").trim();
  if (!m) return { mundo: null, texto: limpio };
  const n = Number(m[1]);
  return { mundo: Number.isFinite(n) ? n : null, texto: limpio };
}

/** Frases y renglones de lista cuentan igual: es lo que el vendedor lee. */
export function contarFrases(texto: string): number {
  return texto
    .replace(/^\s*(#+|[-*•]|\d+[.)])\s*/gm, "")
    .split(/(?<=[.!?…])\s+|\n+/)
    .filter((f) => (f.match(/[a-záéíóúñü]/gi) ?? []).length >= 3).length;
}

/** Nombres de técnicas de mundos cerrados que aparecen en la respuesta. */
export function tecnicasNombradas(texto: string, nombres: string[]): string[] {
  const t = normalizar(texto);
  const vistos: string[] = [];
  for (const nombre of nombres) {
    const candidatos = new Set([nombre, nombre.split(" — ")[0], ...nombre.split(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]+/).filter((p) => /^[A-Z]{3,}$/.test(p))]);
    for (const c of candidatos) {
      const n = normalizar(c).trim();
      if (n.length < 3) continue;
      const re = new RegExp(`(^|[^a-z])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`);
      if (re.test(t)) { vistos.push(nombre); break; }
    }
  }
  return [...new Set(vistos)];
}

// 4 frases de consejo + las 2 del cierre ("Eso lo vas a trabajar… Sigue avanzando…").
export const MAX_FRASES_MUNDO_CERRADO = 6;

export function revisarRespuesta(opts: {
  mundoTema: number | null;
  mundoActual: number | null;
  texto: string;
  nombresCerrados: string[];
}): { reescribir: boolean; motivos: string[] } {
  const { mundoTema, mundoActual, texto, nombresCerrados } = opts;
  if (mundoTema === null || mundoActual === null || mundoTema <= mundoActual) return { reescribir: false, motivos: [] };
  const motivos: string[] = [];
  const frases = contarFrases(texto);
  if (frases > MAX_FRASES_MUNDO_CERRADO) motivos.push(`${frases} frases`);
  const nombradas = tecnicasNombradas(texto, nombresCerrados);
  if (nombradas.length) motivos.push(`nombra ${nombradas.join(", ")}`);
  if (!normalizar(texto).includes(`mundo ${mundoTema}`)) motivos.push(`no dice el Mundo ${mundoTema}`);
  return { reescribir: motivos.length > 0, motivos };
}

// Palabras sueltas que son vocabulario de una técnica: solo se dan como
// ejemplo si esa técnica está cerrada para este vendedor.
const JERGA: Array<[string, string]> = [
  ["teoria de las balas", "bala"],
  ["el circulo de cierre", "círculo"],
  ["la curva de impulso", "impulso"],
  ["triple desglose de precios", "desglose"],
];
function jerga(nombresCerrados: string[]): string {
  const cerradas = new Set(nombresCerrados.map(normalizar));
  const ej = JERGA.filter(([t]) => cerradas.has(t)).map(([, w]) => `"${w}"`);
  return ej.length ? ` (por ejemplo ${ej.join(", ")})` : "";
}

export function promptReescritura(opts: { mundoTema: number; nombreMundo: string; nombresCerrados: string[] }): string {
  return `Eres Closer, el entrenador de ventas. Te paso la pregunta de un vendedor y un borrador de respuesta. El tema es del Mundo ${opts.mundoTema}, ${opts.nombreMundo}, que este vendedor TODAVÍA NO VE.

Reescribe la respuesta así:
- Máximo 3 frases de consejo, en prosa, sin listas ni títulos, y después el cierre de abajo.
- Un consejo práctico para hoy, usando solo lo que ya sabe (lo de los mundos anteriores que aparezca en el borrador).
- Con palabras comunes de vendedor. No uses el vocabulario de esas técnicas que todavía no conoce${jerga(opts.nombresCerrados)}: dilo con palabras de todos los días ("dale una razón concreta", "vuelve a preguntarle").
- NO nombres ni expliques ninguna de estas técnicas: ${opts.nombresCerrados.join("; ")}.
- Termina exactamente con: "Eso lo vas a trabajar a fondo en el Mundo ${opts.mundoTema}, ${opts.nombreMundo}. Sigue avanzando: cuando llegues, todo va a tener sentido."
- Español de México, directo, sin felicitaciones.

Responde solo con la respuesta final, sin comillas ni explicaciones.`;
}

/**
 * Último recurso, sin modelo: si la reescritura tampoco cumple, se quitan las
 * frases que nombran técnicas cerradas, se deja el consejo en 3 frases como
 * máximo y se cierra con el mundo donde lo va a aprender.
 */
export function recorteSeguro(texto: string, opts: { mundoTema: number; nombreMundo: string; nombresCerrados: string[] }): string {
  const cierre = `Eso lo vas a trabajar a fondo en el Mundo ${opts.mundoTema}, ${opts.nombreMundo}. Sigue avanzando: cuando llegues, todo va a tener sentido.`;
  const frases = texto
    .replace(/^\s*(#+|[-*•]|\d+[.)])\s*/gm, "")
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((f) => f.trim())
    .filter((f) => (f.match(/[a-záéíóúñü]/gi) ?? []).length >= 3)
    .filter((f) => !/mundo\s*\d/i.test(f) && !/sigue avanzando/i.test(f))
    .filter((f) => tecnicasNombradas(f, opts.nombresCerrados).length === 0)
    .slice(0, 3);
  return [...frases, cierre].join(" ");
}

/**
 * Fuga: aunque el tema sea de un mundo que ya ve (o el coach no marcó el
 * tema), la respuesta no puede nombrar técnicas de un mundo cerrado
 * (15-oct-2026: a una pregunta del Mundo 3 el coach contestó con "el Efecto
 * Jones", del Mundo 5). Se resuelve en código, sin otra llamada al modelo.
 */
/** Se quitan solo las frases que nombran técnicas cerradas; el resto queda igual. */
export function quitarFrasesConTecnicas(texto: string, nombresCerrados: string[]): string {
  return texto
    .split(/\n/)
    .map((linea) => linea.split(/(?<=[.!?…])\s+/).filter((f) => tecnicasNombradas(f, nombresCerrados).length === 0).join(" "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Para la fuga solo cuentan nombres que no son una palabra común: de dos
 * palabras o más ("Efecto Jones") o siglas ("FFF"). "Urgencia" o
 * "Indiferencia" sueltas pueden salir en una respuesta normal.
 */
export function nombresParaFuga(nombres: string[]): string[] {
  return nombres.filter((n) => {
    const base = n.split(" — ")[0].trim();
    return base.split(/\s+/).length >= 2 || /\b[A-Z]{3,}\b/.test(n);
  });
}
