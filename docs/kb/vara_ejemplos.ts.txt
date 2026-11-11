// LA MISMA VARA (mensaje 163, 10-nov-2026).
//
// El caso (8-nov, nodo 1.2): una vendedora abrió con «qué bonito su estante con
// el producto azul, ¿qué es?». Closer le puso de ejemplo «…¿esos son los que
// más se mueven?». En el siguiente intento ella preguntó «¿se venden mucho?» y
// se le marcó la falla crítica de la apertura: hacer trabajo comercial antes de
// tiempo. La calificación estuvo bien; el ejemplo de Closer fue el que falló.
//
// La causa: al vendedor lo juzga el juez de las pruebas, con LA PRUEBA escrita
// de cada regla. Los textos del coach los revisaba solo el auditor, que nunca
// recibe esa prueba (ve una descripción corta de la falla) y revisa todos los
// textos de un jalón. Dos varas distintas.
//
// Ahora, lo que Closer le propone DECIR al vendedor en este nodo —cada
// ejemplo, cada mejora y la misión— pasa por las mismas pruebas con que se le
// califica, como si él lo dijera en esta práctica. Si reprueba, se corrige y
// se vuelve a juzgar. Si no pasa, no llega al vendedor: es mejor ningún
// ejemplo que uno que lo lleve a fallar (Emilio: «no queremos estar parchando,
// queremos arreglarlo de raíz»). Sirve para todos los nodos: no hay listas de
// palabras ni reglas por nodo; la vara es la prueba de cada falla.
//
// DOS FILTROS (mensaje 164). La primera versión (163) tenía un solo juez que
// salía a buscar fallas en todos los textos contra todas las reglas, y acusó
// de más: en el 4.15 cambió «No le puedo garantizar nada, pero estoy seguro de
// que se le va a mover…» (la convicción sin garantía del Cerebro, que la red
// tiene como correcta en G54 y G109) porque se parece a «a ver si se le
// mueve»; en el 5.8 descartó un FFF con una sola bala (lo que la red tiene
// como correcto en G93). Un juez que busca culpables encuentra culpables de
// más. Por eso ahora:
//   1. La vara solo SOSPECHA: busca en todos los textos contra todas las fallas.
//   2. Cada sospecha va al juez de las pruebas, el MISMO que decide si se le
//      cobra una falla al vendedor (calibrado con la red, cita letra por letra
//      antes de decidir), con una conversación donde el vendedor dice esa
//      frase en el momento que corresponde. Solo lo que ese juez confirma se
//      cambia. Ahora sí es la misma vara.
//
// Sin imports de Deno: funciona en Deno y en Node (se prueba ejecutándolo).
import { LARGO_REGLA_JUEZ, armarEntradaJuez, type Juicio } from "./juez_pruebas.ts";
import { aplicarAuditoria, textosDeEvaluacion, type TextoAuditable, type VeredictoAuditor } from "./auditar_coaching.ts";

export interface FallaConPrueba { id: string; regla: string; en_este_nodo: string; severidad: string }

/** Las fallas del nodo cuya regla trae su prueba escrita. Son la vara. */
export function fallasConPrueba(guion: any): FallaConPrueba[] {
  const out: FallaConPrueba[] = [];
  for (const f of Array.isArray(guion?.failure_criteria) ? guion.failure_criteria : []) {
    const regla = f?.regla_resumen ?? f?.description;
    if (typeof f?.id !== "string" || typeof regla !== "string" || !regla.includes("LA PRUEBA")) continue;
    out.push({ id: f.id, regla, en_este_nodo: String(f?.contexto_nodo ?? ""), severidad: String(f?.severity ?? "") });
  }
  return out;
}

/**
 * Los textos que pasan por la vara: lo que el coach dice de ESTE nodo. «Lo que
 * viene después» habla del siguiente paso, que tiene otras reglas (una pregunta
 * de descubrimiento ahí es correcta): lo sigue revisando el auditor.
 */
export function textosParaLaVara(ev: any): TextoAuditable[] {
  return textosDeEvaluacion(ev).filter((t) => t.tipo === "mejora" || t.tipo === "ejemplo" || t.tipo === "mision");
}

export const PROMPT_VARA = `Eres el juez de las pruebas de Closer, una app que entrena vendedores de campo. Después de una práctica, un coach escribió textos para el vendedor: un ejemplo de qué decir, una mejora, una misión. Antes de que lleguen al vendedor, revisas que ninguno le enseñe a decir algo que este mismo nodo castiga. Recibes las fallas del nodo, cada una con su regla, y esa regla trae LA PRUEBA: la pregunta que decide si una frase comete la falla. Es la misma prueba con que se califica al vendedor.

Para cada texto:
1. Saca lo que el texto le propone DECIR al vendedor: el ejemplo completo, o las frases entre comillas. Si no trae una frase pero le pide preguntar o decir algo («pregúntale qué se le vende más»), eso es lo que propone decir. Si el texto no propone decir nada, "frase" va vacía y la conducta es "pasa".
2. Aplica LA PRUEBA de CADA falla, tal como está escrita, a lo que propone decir, como si el vendedor lo dijera en esta práctica, en el momento de la visita que este nodo practica. LA PRUEBA ES EL ALCANCE: los ejemplos de la regla ilustran, no delimitan. No agregues requisitos que la prueba no escribe, ni quites los que sí escribe. Juzga lo que la frase HACE en ese momento, no palabras sueltas. "En este nodo" dice cómo se aplica la regla aquí; si choca con la prueba, manda la prueba.
3. Un texto del coach es una pieza, no el turno completo. Repruébalo solo si lo que propone decir COMETE el error de la regla. Si el error de una regla es que FALTA algo (no hubo pregunta, no retomó, no cerró), un texto no lo comete por no traerlo todo.
4. Nombrar un error para evitarlo no es cometerlo: «no le preguntes qué se le vende» pasa.
5. Solo juzgas con las fallas que recibes. No revisas estilo, lenguaje ni otras reglas: de eso se encarga otra revisión.
6. Lo que repruebes no se cambia todavía: lo revisa después el juez que califica al vendedor, con la conversación completa. Si una frase razonablemente podría cometer la falla, márcala; si claramente no la comete, déjala pasar.

Por cada texto entregas: su "id"; "frase", lo que propone decir, copiado del texto; "respuesta", en menos de 30 palabras: la respuesta a la pregunta de la prueba que decide; "conducta": "pasa" o "reprueba"; "falla": el id de la falla que comete, solo si reprueba. Si reprueba, "corregido": el mismo texto, con la misma intención del coach y la misma longitud aproximada, pero que pase TODAS las pruebas; si no se puede sin cambiar la intención, déjalo vacío. Entrega todo con la herramienta "revisiones", una por texto.`;

export const HERRAMIENTA_VARA = {
  name: "revisiones",
  description: "Entrega la revisión de cada texto del coach: si lo que propone decir pasa o reprueba las pruebas de las fallas del nodo.",
  input_schema: {
    type: "object",
    properties: {
      revisiones: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            frase: { type: "string" },
            respuesta: { type: "string" },
            conducta: { type: "string", enum: ["pasa", "reprueba"] },
            falla: { type: "string" },
            corregido: { type: "string" },
          },
          required: ["id", "frase", "respuesta", "conducta"],
        },
      },
    },
    required: ["revisiones"],
  },
} as const;

export interface RevisionVara { id: string; frase: string; respuesta: string; conducta: "pasa" | "reprueba"; falla?: string; corregido?: string }

/** Cuánto puede escribir: crece con los textos (cada revisión trae su frase y, si reprueba, el texto corregido). */
export function presupuestoVara(textos: number): number {
  return Math.min(6000, 800 + 450 * Math.max(1, Math.floor(textos)));
}

export function armarEntradaVara(args: { paso: number | null; fallas: FallaConPrueba[]; textos: { id: string; tipo: string; texto: string }[]; conversacion?: { role?: string; content?: unknown }[] }): string {
  return JSON.stringify({
    paso_del_nodo: args.paso,
    // Para saber en qué momento de la visita se diría la frase, y con qué cliente.
    conversacion: (Array.isArray(args.conversacion) ? args.conversacion : []).slice(-12).map((t) => ({
      quien: t?.role === "user" ? "vendedor" : "cliente",
      dijo: String(t?.content ?? "").slice(0, 400),
    })),
    fallas_del_nodo: args.fallas.map((f) => ({ id: f.id, severidad: f.severidad, regla: f.regla.slice(0, LARGO_REGLA_JUEZ), en_este_nodo: f.en_este_nodo.slice(0, 600) })),
    textos: args.textos.map((t) => ({ id: t.id, tipo: t.tipo, texto: t.texto })),
  });
}

/** Saca las revisiones de la respuesta de la API (herramienta forzada). */
export function revisionesDeRespuesta(respuesta: any): RevisionVara[] | null {
  const bloques = Array.isArray(respuesta?.content) ? respuesta.content : [];
  const uso = bloques.find((b: any) => b?.type === "tool_use" && b?.name === HERRAMIENTA_VARA.name);
  const lista = uso?.input?.revisiones;
  if (!Array.isArray(lista)) return null;
  return lista
    .filter((r: any) => r && typeof r.id === "string" && (r.conducta === "pasa" || r.conducta === "reprueba"))
    .map((r: any) => ({
      id: r.id,
      frase: String(r.frase ?? "").slice(0, 400),
      respuesta: String(r.respuesta ?? "").slice(0, 300),
      conducta: r.conducta,
      ...(typeof r.falla === "string" && r.falla ? { falla: r.falla } : {}),
      ...(typeof r.corregido === "string" && r.corregido.trim() ? { corregido: r.corregido.trim() } : {}),
    }));
}

export interface ResultadoVara {
  /** Textos que pasaron por la vara. */
  revisados: number;
  /** Textos que la vara marcó como sospechosos. */
  sospechosos: number;
  /** Sospechas que el juez de las pruebas confirmó. */
  confirmados: number;
  /** Sospechas que el juez de las pruebas descartó: el texto se queda como estaba. */
  absueltos: number;
  /** De los confirmados: los que se corrigieron y la corrección pasó los dos filtros. */
  corregidos: number;
  /** Los que no llegan al vendedor (confirmados sin corrección que pase, o sospechas que el juez no pudo revisar). */
  descartados: number;
  /** La vara no pudo correr: los ejemplos de este nodo no llegan al vendedor. */
  error?: boolean;
  ejemplos_quitados?: number;
  /** Sospechas que el juez no pudo revisar (error de la llamada): se descartan. */
  sin_juez?: number;
  /** Solo para el log: cada sospecha, qué dijo la vara, qué decidió el juez y cómo quedó. */
  detalle: {
    id: string; tipo: string; falla: string; frase: string; sospecha: string;
    juez: "reprueba" | "pasa" | "sin_juez"; razon_juez: string; quedo: "igual" | "corregido" | "descartado";
  }[];
}

/** Lo que llama al modelo: recibe la entrada y cuántos textos lleva; devuelve las revisiones o null. */
export type LlamarVara = (entrada: string, textos: number) => Promise<RevisionVara[] | null>;
/** Lo que llama al juez de las pruebas: recibe la entrada (armarEntradaJuez) y cuántas acusaciones lleva. */
export type LlamarJuez = (entrada: string, acusaciones: number) => Promise<Juicio[] | null>;

/** Si la vara no corre, nada sin revisar llega: se quitan los ejemplos de este nodo. La mejora y la misión se quedan. */
export function quitarEjemplosSinVara(ev: any): number {
  let n = 0;
  for (const o of [...(Array.isArray(ev?.observations) ? ev.observations : []), ...(Array.isArray(ev?.evidencia_flags) ? ev.evidencia_flags : [])]) {
    if (o && typeof o === "object" && typeof o.ejemplo === "string" && o.ejemplo.trim()) { o.ejemplo = ""; n++; }
  }
  return n;
}

/** Una revisión por cada texto pedido. Si falta alguna, la respuesta no sirve: no se puede dar por bueno lo que nadie revisó. */
function completa(revisiones: RevisionVara[] | null, textos: { id: string }[]): revisiones is RevisionVara[] {
  return Array.isArray(revisiones) && textos.every((t) => revisiones.some((r) => r.id === t.id));
}

async function conReintento(llamar: LlamarVara, entrada: string, textos: { id: string }[], intentos: number): Promise<RevisionVara[] | null> {
  for (let i = 1; i <= intentos; i++) {
    try {
      const r = await llamar(entrada, textos.length);
      if (completa(r, textos)) return r;
    } catch (e) {
      console.error(`[vara] intento ${i}:`, e);
    }
  }
  return null;
}

type Turno = { role?: string; content?: unknown };

const palabras = (s: string): Set<string> =>
  new Set(s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9ñ]+/).filter((w) => w.length >= 4));

/**
 * La conversación en la que el vendedor dice la frase propuesta: la misma
 * práctica hasta el turno del vendedor que el texto corrige (el que más se le
 * parece; si ninguno se parece, el último), con ese turno cambiado por la
 * frase. Lo que venía después se quita: respondía a otra cosa.
 */
export function conversacionConLaFrase(conversacion: Turno[] | undefined, original: string, frase: string): Turno[] {
  const turnos = Array.isArray(conversacion) ? conversacion : [];
  const delVendedor = turnos.map((t, i) => (t?.role === "user" ? i : -1)).filter((i) => i >= 0);
  if (delVendedor.length === 0) return [{ role: "user", content: frase }];
  const base = palabras(original);
  let mejor = delVendedor[delVendedor.length - 1];
  let puntos = 0;
  for (const i of delVendedor) {
    const p = palabras(String(turnos[i]?.content ?? ""));
    let comunes = 0;
    for (const w of base) if (p.has(w)) comunes++;
    if (comunes > puntos) { puntos = comunes; mejor = i; }
  }
  return [...turnos.slice(0, mejor), { role: "user", content: frase }];
}

interface Sospecha { id: string; tipo: string; original: string; frase: string; falla: string; sospecha: string; corregido?: string }

/**
 * El juez de las pruebas revisa cada sospecha, una por una (cada una tiene su
 * propia conversación). Devuelve, por id, «reprueba», «pasa» o «sin_juez».
 */
async function confirmar(
  sospechas: Sospecha[], fallas: FallaConPrueba[], conversacion: Turno[] | undefined, juez: LlamarJuez, intentos: number,
): Promise<Map<string, { conducta: "reprueba" | "pasa" | "sin_juez"; razon: string }>> {
  const out = new Map<string, { conducta: "reprueba" | "pasa" | "sin_juez"; razon: string }>();
  await Promise.all(sospechas.map(async (s) => {
    const falla = fallas.find((f) => f.id === s.falla);
    // Una sospecha con una falla que el nodo no tiene no se sostiene: no hay prueba contra la cual medirla.
    if (!falla) { out.set(s.id, { conducta: "pasa", razon: `la falla «${s.falla}» no es de este nodo` }); return; }
    const frase = s.frase.trim() || s.original;
    const entrada = armarEntradaJuez(
      [{ id: falla.id, tipo: "falla", regla: falla.regla, en_este_nodo: falla.en_este_nodo, senalado: frase }],
      conversacionConLaFrase(conversacion, s.original, frase),
    );
    for (let i = 1; i <= intentos; i++) {
      try {
        const juicios = await juez(entrada, 1);
        const j = Array.isArray(juicios) ? juicios.find((x) => x.id === falla.id) : undefined;
        if (j) { out.set(s.id, { conducta: j.conducta === "reprueba" ? "reprueba" : "pasa", razon: String(j.razon ?? "") }); return; }
      } catch (e) {
        console.error(`[vara] juez, intento ${i}:`, e);
      }
    }
    out.set(s.id, { conducta: "sin_juez", razon: "" });
  }));
  return out;
}

/** Los dos filtros sobre un grupo de textos: devuelve las sospechas y lo que decidió el juez de cada una. Null si la vara no corrió. */
async function dosFiltros(
  textos: { id: string; tipo: string; texto: string }[],
  a: { fallas: FallaConPrueba[]; paso: number | null; conversacion?: Turno[]; llamar: LlamarVara; juez: LlamarJuez; intentos: number },
): Promise<{ sospechas: Sospecha[]; juicios: Map<string, { conducta: "reprueba" | "pasa" | "sin_juez"; razon: string }> } | null> {
  const revisiones = await conReintento(a.llamar, armarEntradaVara({ paso: a.paso, fallas: a.fallas, textos, conversacion: a.conversacion }), textos, a.intentos);
  if (!revisiones) return null;
  const sospechas: Sospecha[] = [];
  for (const r of revisiones) {
    const t = textos.find((x) => x.id === r.id);
    if (!t || r.conducta !== "reprueba") continue;
    sospechas.push({ id: t.id, tipo: t.tipo, original: t.texto, frase: r.frase, falla: r.falla ?? "", sospecha: r.respuesta, ...(r.corregido ? { corregido: r.corregido } : {}) });
  }
  const juicios = sospechas.length > 0 ? await confirmar(sospechas, a.fallas, a.conversacion, a.juez, a.intentos) : new Map();
  return { sospechas, juicios };
}

/**
 * Pasa por la vara lo que el coach propone decir en este nodo, y deja la
 * evaluación lista. Un texto solo se toca si el juez de las pruebas confirma
 * que comete una falla del nodo: entonces sale corregido (si la corrección
 * pasa los dos filtros) o no sale. Modifica la evaluación.
 */
export async function pasarPorLaVara(args: {
  ev: any;
  guion: any;
  paso: number | null;
  conversacion?: Turno[];
  llamar: LlamarVara;
  juez: LlamarJuez;
  intentos?: number;
}): Promise<ResultadoVara> {
  const out: ResultadoVara = { revisados: 0, sospechosos: 0, confirmados: 0, absueltos: 0, corregidos: 0, descartados: 0, detalle: [] };
  const fallas = fallasConPrueba(args.guion);
  const textos = textosParaLaVara(args.ev);
  // Sin fallas con prueba no hay vara que aplicar; sin textos no hay qué medir.
  if (fallas.length === 0 || textos.length === 0) return out;
  const a = { fallas, paso: args.paso, conversacion: args.conversacion, llamar: args.llamar, juez: args.juez, intentos: args.intentos ?? 2 };
  out.revisados = textos.length;

  const primera = await dosFiltros(textos, a);
  if (!primera) {
    out.error = true;
    out.ejemplos_quitados = quitarEjemplosSinVara(args.ev);
    return out;
  }
  out.sospechosos = primera.sospechas.length;
  const confirmadas = primera.sospechas.filter((s) => primera.juicios.get(s.id)?.conducta !== "pasa");

  // Las correcciones de lo confirmado también pasan los dos filtros antes de salir.
  const propuestas = confirmadas
    .filter((s) => primera.juicios.get(s.id)?.conducta === "reprueba" && s.corregido && s.corregido !== s.original)
    .map((s) => ({ id: s.id, tipo: s.tipo, texto: s.corregido ?? "" }));
  const segunda = propuestas.length > 0 ? await dosFiltros(propuestas, a) : null;
  const corregidoDe = new Map<string, string>();
  if (segunda) {
    for (const p of propuestas) {
      const sospechada = segunda.sospechas.some((s) => s.id === p.id);
      // Pasa si la vara no la sospechó, o si el juez la absolvió.
      if (!sospechada || segunda.juicios.get(p.id)?.conducta === "pasa") corregidoDe.set(p.id, p.texto);
    }
  }

  const veredictos: VeredictoAuditor[] = [];
  for (const s of primera.sospechas) {
    const j = primera.juicios.get(s.id) ?? { conducta: "sin_juez" as const, razon: "" };
    if (j.conducta === "pasa") out.absueltos++;
    else if (j.conducta === "reprueba") out.confirmados++;
    else out.sin_juez = (out.sin_juez ?? 0) + 1;
    const corregido = j.conducta === "reprueba" ? corregidoDe.get(s.id) ?? null : null;
    out.detalle.push({
      id: s.id, tipo: s.tipo, falla: s.falla, frase: s.frase, sospecha: s.sospecha, juez: j.conducta, razon_juez: j.razon,
      quedo: j.conducta === "pasa" ? "igual" : corregido !== null ? "corregido" : "descartado",
    });
    if (j.conducta !== "pasa") veredictos.push({ id: s.id, ok: false, viola: s.falla ? [s.falla] : [], corregido });
  }
  if (veredictos.length > 0) {
    const r = aplicarAuditoria(args.ev, veredictos);
    out.corregidos = r.corregidos;
    out.descartados = r.descartados;
  }
  return out;
}
