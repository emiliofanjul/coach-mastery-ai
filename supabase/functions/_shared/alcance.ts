// TE PASASTE DEL ALCANCE (mensaje 180, 25-nov-2026).
//
// El caso: en una práctica del paso 1 o 2, el vendedor a veces sigue de largo y
// hace algo de un paso posterior (pide el pedido, presenta, pregunta por su
// operación). Si eso no es una falla del nodo, la pantalla no decía nada, y el
// vendedor no sabía si contaba, si estaba mal o por qué no se le calificó.
// Decisión de Emilio (opción A): «Solo un aviso tranquilo: "Aquí solo
// practicamos tu primera frase; el cierre lo vemos más adelante". Sin bajar la
// nota y sin calificar eso extra.»
//
// Lo que hace: una llamada aparte, después de calificar, que solo contesta
// «¿el vendedor hizo algo que pertenece a un paso POSTERIOR al de este nodo?».
// El código revisa lo que contesta:
//   · el paso que dice es posterior al del nodo (y el nodo es del paso 1 al 5);
//   · la cita está, casi palabra por palabra, en un turno del vendedor;
//   · no es lo que ya se calificó como falla (eso ya tiene su explicación).
// Si algo no cuadra, no sale aviso. Nunca toca la nota, las fallas ni las
// observaciones. Lo que es de cada paso sale de la guía del vendedor (el molde
// de cada paso), la misma fuente con que se escriben los ejemplos.
//
// Mensaje 182: el revisor no recibía «En cualquier paso» ni «Cuando el
// cliente…», y marcaba como «de un paso posterior» cosas que la guía dice que
// se hacen en ese momento. Ahora las recibe, y lo que la guía dice que toca en
// ese momento no es pasarse. Lo que es antes de tiempo (pitch prematuro) es
// una falla, no un aviso. Y el aviso dice que más adelante se aprende cómo se
// hace (Emilio: «¿se las bajo?» es una pregunta de sí o no): no da por bueno
// lo que cita.
// Sin imports: funciona en Deno y en Node.

export interface Alcance {
  /** El paso posterior al que pertenece lo que hizo (2 a 6). */
  paso: number;
  /** Lo que hizo, en infinitivo y en minúsculas: «pedir el pedido». */
  que: string;
  /** Lo que dijo, tal cual. */
  cita: string;
  /** El turno de la conversación (1 = el primero de los últimos 40). */
  turno: number;
  /** El aviso ya armado, sin el nombre del nodo (la pantalla lo pone antes). */
  texto: string;
}

/** Los pasos, como se dicen en una frase: «es del paso 5, el cierre». */
export const NOMBRE_DEL_PASO: Record<number, string> = {
  1: "la introducción",
  2: "la historia breve",
  3: "el descubrimiento",
  4: "la presentación",
  5: "el cierre",
  6: "la consolidación",
};

const str = (x: unknown): string => (typeof x === "string" ? x.trim() : "");

/** El aviso solo existe en los nodos del paso 1 al 5: el 6 no tiene paso posterior y el mundo 7 recorre la línea completa. */
export function hayAlcanceQueRevisar(paso: number | null | undefined): paso is number {
  return Number.isInteger(paso) && (paso as number) >= 1 && (paso as number) <= 5;
}

export const PROMPT_ALCANCE = `Eres un revisor de Closer, una app que entrena vendedores de campo con la línea recta de la venta: 1 introducción, 2 historia breve, 3 descubrimiento, 4 presentación, 5 cierre, 6 consolidación. Cada práctica entrena UN paso. Ya se calificó esta práctica; tú no calificas nada.

Contestas una sola pregunta: ¿el vendedor hizo, en sus turnos, algo que pertenece a un paso POSTERIOR al de este nodo?

Reglas:
1. Solo lo que el vendedor de verdad le dijo al cliente. Cítalo tal cual, con su turno. Nunca lo que dijo el cliente, ni lo que el vendedor le dice a Closer o a la app fuera de la venta (pedir ayuda, preguntar cómo se hace algo): eso no es hacerlo.
2. Lo que pertenece a cada paso sale de la guía que recibes: el molde de este paso y de los posteriores, «En cualquier paso» y «Cuando el cliente…». Algo cuenta como de un paso posterior solo si es lo que ese molde pide hacer (por ejemplo: hablar del producto o de una solución es del 4; pedir el pedido o una decisión es del 5). Saludar, presentarse, decir por qué pasó, despedirse o quedar de regresar no es de un paso posterior.
3. Lo que la guía dice que se hace en ese momento NO es pasarse. Ya que el vendedor se presentó y el cliente le contestó (un bloqueo no es contestarle), preguntarle por su negocio es lo que sigue, no un paso posterior. Después de aceptar un bloqueo, seguir con su plática con una pregunta sobre él o sobre cómo le va es lo que pide la guía.
4. No cuentes lo que ya se calificó como falla en esta práctica: eso ya tiene su explicación. Tampoco lo que este nodo pide hacer.
5. No juzgues si estuvo bien o mal: solo de qué paso es.
6. Si hizo cosas de varios pasos posteriores, reporta la del paso más adelante.
7. En «que_hizo» escribe lo que hizo en infinitivo y en minúsculas, corto, como lo entendería el vendedor: «pedir el pedido», «hablar del producto», «presentar la solución». Sin nombres de reglas ni palabras técnicas.
8. Si no hizo nada de un paso posterior, o tienes duda, se_paso es false.`;

export const HERRAMIENTA_ALCANCE = {
  name: "alcance",
  description: "Dice si el vendedor hizo algo de un paso posterior al del nodo, y qué.",
  input_schema: {
    type: "object",
    properties: {
      se_paso: { type: "boolean" },
      paso: { type: "integer", minimum: 2, maximum: 6 },
      que_hizo: { type: "string" },
      cita: { type: "string" },
      turno: { type: "integer" },
    },
    required: ["se_paso"],
  },
} as const;

type Turno = { role?: string; content?: unknown };

/** La entrada del revisor: el paso del nodo, el molde de su paso y de los posteriores, lo que el nodo pide, lo ya calificado y la conversación. */
export function armarEntradaAlcance(args: {
  paso: number;
  nodo: string;
  pide: string[];
  moldes: string;
  fallas: { error?: string; cita?: string }[];
  conversacion: Turno[];
}): string {
  return JSON.stringify({
    paso_del_nodo: args.paso,
    nombre_del_paso: NOMBRE_DEL_PASO[args.paso] ?? "",
    nodo: args.nodo.slice(0, 120),
    lo_que_pide_este_nodo: args.pide.map((p) => p.slice(0, 300)).slice(0, 12),
    guia_de_este_paso_y_los_posteriores: args.moldes.slice(0, 16000),
    ya_calificado_como_falla: args.fallas.map((f) => ({ error: str(f?.error).slice(0, 300), cita: str(f?.cita).slice(0, 300) })),
    conversacion: (Array.isArray(args.conversacion) ? args.conversacion : []).slice(-40).map((t, i) => ({
      turno: i + 1,
      quien: t?.role === "user" ? "vendedor" : "cliente",
      dijo: String(t?.content ?? "").slice(0, 700),
    })),
  });
}

/** Lo que el nodo pide hacer: la descripción de cada criterio de éxito. */
export function loQuePideElNodo(guion: any): string[] {
  const cs = Array.isArray(guion?.success_criteria) ? guion.success_criteria : [];
  return cs.map((c: any) => str(c?.description) || str(c?.descripcion) || str(c?.name)).filter(Boolean);
}

/**
 * De la guía del vendedor: «En cualquier paso», el molde del paso del nodo y de
 * los posteriores, y «Cuando el cliente…» (bloqueos, objeciones, señales): lo
 * que es de aquí, lo que es de más adelante y lo que se hace en cada momento.
 * Los factores de impulso no: no dicen de qué paso es algo.
 */
export function moldesDesde(partes: unknown, paso: number): string {
  const ps = (Array.isArray(partes) ? partes : [])
    .filter((p: any) => str(p?.clave) && str(p?.titulo) && str(p?.texto))
    .sort((a: any, b: any) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
  return ps
    .filter((p: any) => {
      const clave = str(p.clave);
      if (clave === "en_cualquier_paso" || clave.startsWith("cuando_")) return true;
      const m = /^paso_([1-6])$/.exec(clave);
      return m !== null && Number(m[1]) >= paso;
    })
    .map((p: any) => `## ${str(p.titulo)}\n${str(p.texto)}`)
    .join("\n\n");
}

const normaliza = (s: string) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zñ0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const palabras = (s: string) => normaliza(s).split(" ").filter((w) => w.length >= 3);

/** ¿La cita está en ese turno del vendedor? Casi todas sus palabras (el revisor puede omitir signos o una palabra). */
export function citaDelVendedor(cita: string, turno: number, conversacion: Turno[]): boolean {
  const t = (Array.isArray(conversacion) ? conversacion : []).slice(-40)[Number(turno) - 1];
  if (!t || t.role !== "user") return false;
  const texto = " " + normaliza(String(t.content ?? "")) + " ";
  const ps = palabras(cita);
  if (ps.length === 0) return false;
  return ps.filter((w) => texto.includes(" " + w + " ")).length / ps.length >= 0.8;
}

/** ¿La cita es lo mismo que ya se calificó como falla? Basta con que la mitad de sus palabras estén en la cita de una falla, o al revés. */
export function yaEsFalla(cita: string, fallas: { cita?: string }[]): boolean {
  const a = new Set(palabras(cita));
  if (a.size === 0) return false;
  for (const f of Array.isArray(fallas) ? fallas : []) {
    const b = new Set(palabras(str(f?.cita)));
    if (b.size === 0) continue;
    let comunes = 0;
    for (const w of a) if (b.has(w)) comunes++;
    if (comunes / a.size >= 0.5 || comunes / b.size >= 0.5) return true;
  }
  return false;
}

/** «pedir el pedido» → «Pedir el pedido». */
const conMayuscula = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** El aviso, sin el nombre del nodo: «Pedir el pedido es del paso 5, el cierre: lo vemos más adelante en el mapa, y ahí aprendes cómo se hace. Esto no te bajó la nota.» */
export function textoDelAlcance(paso: number, que: string): string {
  return `${conMayuscula(que)} es del paso ${paso}, ${NOMBRE_DEL_PASO[paso]}: lo vemos más adelante en el mapa, y ahí aprendes cómo se hace. Esto no te bajó la nota.`;
}

/**
 * Saca el aviso de la respuesta de la API (herramienta forzada) y lo revisa.
 * null si no se pasó, o si algo no cuadra: mejor sin aviso que con uno falso.
 */
export function alcanceDeRespuesta(respuesta: any, pasoNodo: number, conversacion: Turno[], fallas: { cita?: string }[]): Alcance | null {
  if (!hayAlcanceQueRevisar(pasoNodo)) return null;
  const bloques = Array.isArray(respuesta?.content) ? respuesta.content : [];
  const uso = bloques.find((b: any) => b?.type === "tool_use" && b?.name === HERRAMIENTA_ALCANCE.name);
  const r = uso?.input;
  if (!r || typeof r !== "object" || r.se_paso !== true) return null;
  const paso = Number(r.paso);
  if (!Number.isInteger(paso) || paso <= pasoNodo || paso > 6) return null;
  const que = str(r.que_hizo).replace(/[.\s]+$/, "").slice(0, 80);
  const cita = str(r.cita).slice(0, 400);
  const turno = Number(r.turno);
  if (!que || !cita || !Number.isInteger(turno)) return null;
  if (!citaDelVendedor(cita, turno, conversacion)) return null;
  if (yaEsFalla(cita, fallas)) return null;
  return { paso, que, cita, turno, texto: textoDelAlcance(paso, que) };
}
