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
// Sin imports de Deno: funciona en Deno y en Node (se prueba ejecutándolo).
import { LARGO_REGLA_JUEZ } from "./juez_pruebas.ts";
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
  /** Textos que reprobaron en la primera revisión. */
  reprobados: number;
  /** De los reprobados: los que se corrigieron y la corrección pasó la vara. */
  corregidos: number;
  /** De los reprobados: los que no llegan al vendedor. */
  descartados: number;
  /** La vara no pudo correr: los ejemplos de este nodo no llegan al vendedor. */
  error?: boolean;
  ejemplos_quitados?: number;
  /** Solo para el log: qué reprobó, con qué falla y por qué. */
  detalle: { id: string; tipo: string; falla: string; frase: string; por_que: string; quedo: "corregido" | "descartado" }[];
}

/** Lo que llama al modelo: recibe la entrada y cuántos textos lleva; devuelve las revisiones o null. */
export type LlamarVara = (entrada: string, textos: number) => Promise<RevisionVara[] | null>;

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

/**
 * Pasa por la vara lo que el coach propone decir en este nodo, y deja la
 * evaluación lista: lo que reprueba queda corregido (si la corrección pasa la
 * vara) o descartado. Modifica la evaluación.
 */
export async function pasarPorLaVara(args: {
  ev: any;
  guion: any;
  paso: number | null;
  conversacion?: { role?: string; content?: unknown }[];
  llamar: LlamarVara;
  intentos?: number;
}): Promise<ResultadoVara> {
  const out: ResultadoVara = { revisados: 0, reprobados: 0, corregidos: 0, descartados: 0, detalle: [] };
  const fallas = fallasConPrueba(args.guion);
  const textos = textosParaLaVara(args.ev);
  // Sin fallas con prueba no hay vara que aplicar; sin textos no hay qué medir.
  if (fallas.length === 0 || textos.length === 0) return out;
  const intentos = args.intentos ?? 2;
  out.revisados = textos.length;

  const primera = await conReintento(args.llamar, armarEntradaVara({ paso: args.paso, fallas, textos, conversacion: args.conversacion }), textos, intentos);
  if (!primera) {
    out.error = true;
    out.ejemplos_quitados = quitarEjemplosSinVara(args.ev);
    return out;
  }
  // Cada reprobado con su texto original. Una revisión cuyo id no corresponde a ningún texto se ignora.
  const tipoDe = new Map(textos.map((t) => [t.id, t.tipo]));
  const textoDe = new Map(textos.map((t) => [t.id, t.texto]));
  const reprobados = primera.filter((r) => r.conducta === "reprueba" && tipoDe.has(r.id));
  out.reprobados = reprobados.length;
  if (reprobados.length === 0) return out;

  // La corrección también pasa por la vara: no se da por buena sin medirla.
  const propuestas: { id: string; tipo: string; texto: string }[] = [];
  for (const r of reprobados) {
    const texto = r.corregido ?? "";
    if (texto && texto !== textoDe.get(r.id)) propuestas.push({ id: r.id, tipo: tipoDe.get(r.id) ?? "", texto });
  }
  const segunda = propuestas.length > 0
    ? await conReintento(args.llamar, armarEntradaVara({ paso: args.paso, fallas, textos: propuestas, conversacion: args.conversacion }), propuestas, intentos)
    : [];
  const pasaron = new Set((segunda ?? []).filter((r) => r.conducta === "pasa").map((r) => r.id));
  const propuestaDe = new Map(propuestas.map((p) => [p.id, p.texto]));

  const veredictos: VeredictoAuditor[] = reprobados.map((r) => {
    const propuesta = propuestaDe.get(r.id);
    const corregido = propuesta !== undefined && pasaron.has(r.id) ? propuesta : null;
    out.detalle.push({ id: r.id, tipo: tipoDe.get(r.id) ?? "", falla: r.falla ?? "", frase: r.frase, por_que: r.respuesta, quedo: corregido !== null ? "corregido" : "descartado" });
    return { id: r.id, ok: false, viola: r.falla ? [r.falla] : [], corregido };
  });
  const r = aplicarAuditoria(args.ev, veredictos);
  out.corregidos = r.corregidos;
  out.descartados = r.descartados;
  return out;
}
