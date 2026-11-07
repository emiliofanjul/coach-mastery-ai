/**
 * Lo que Closer le pregunta a quien entrena por su cuenta, y CUÁNDO (mensaje 157, nov-2026).
 *
 * Decisión de Emilio: cada dato se pide «justo a tiempo», antes del primer nodo que lo necesita, con su
 * porqué. Así el vendedor no llena un formulario largo al entrar (y no se va), y cada respuesta llega
 * cuando ya se ve para qué sirve. Son las mismas preguntas del onboarding del manager (PREGUNTAS), dichas a
 * quien vende él mismo. Todo lo que contesta lo puede ver y editar en «Tu negocio».
 *
 * Dónde se pide cada cosa y por qué ahí:
 *   · Antes de la 1ª práctica (1.2): qué vende, a quién, de qué tamaño, y cómo vende y con qué trato —
 *     el trato y el canal cambian al cliente desde la primera plática.
 *   · Antes del 3.8: su cartera. Hasta el 3.6 todos los clientes son nuevos (nodes.tipo_cliente); el 3.8 es el
 *     primero con un cliente que ya le compra.
 *   · Antes del 4.1: lo que ofrece y lo que su empresa no le deja prometer — presentar y las balas necesitan
 *     hechos reales suyos, y el evaluador tiene que saber qué no puede prometer.
 *   · Antes del 4.9: cómo maneja el precio — ahí el cliente empieza a negociar.
 *   · Antes del 5.6: lo que más le dicen sus clientes — su primera práctica de objeciones.
 *
 * Todo aquí es puro: lo usan la práctica, «Tu negocio» y las pruebas.
 */
import { PREGUNTAS, preguntaCompleta, type Pregunta, type Respuestas } from "@/lib/onboarding-questions";

export interface TextoPersonal {
  titulo: string;
  sub?: string;
  porQue: string;
}

/** Las 9 preguntas del manager, dichas a quien vende él mismo (las del manager hablan de «tus vendedores»). */
export const TEXTO_PERSONAL: Record<string, TextoPersonal> = {
  p1_que_venden: {
    titulo: "¿Qué vendes?",
    sub: "Tus líneas principales. No hace falta el catálogo completo ni los precios.",
    porQue: "Tu cliente solo va a hablar de lo que tú vendes: Closer nunca inventa un producto que no manejas.",
  },
  p2_clientes: {
    titulo: "¿Qué hacen tus clientes con lo que les vendes?",
    sub: "Marca todo lo que aplique.",
    porQue: "Así tu cliente tiene el negocio, las palabras y los problemas de los tuyos.",
  },
  p3_monto: {
    titulo: "¿Cuánto te compra un cliente al mes?",
    sub: "Marca todos los rangos que tengas en tu cartera.",
    porQue: "Una compra grande se decide distinto que una chica. Vas a practicar con los tamaños que marques.",
  },
  p5_canal: {
    titulo: "¿Cómo vendes?",
    sub: "Marca todo lo que aplique.",
    porQue: "No es lo mismo en persona que por teléfono, ni de tú que de usted. Tu cliente te va a hablar como te hablan los tuyos.",
  },
  p4_cartera: {
    titulo: "¿Visitas más clientes que ya te compran, o nuevos?",
    porQue: "Con un cliente nuevo te presentas y buscas un dolor; con uno que ya te compra buscas lo que todavía no te compra. Closer te pone los dos, en la proporción de tu día.",
  },
  p6_ofrecen: {
    titulo: "¿Qué ofreces?",
    sub: "Marca todo lo que ofreces, aunque tu competencia también lo tenga.",
    porQue: "En la presentación usas balas: hechos que puedes sostener sobre ti, tu producto y tu precio. Solo vas a usar las que de verdad tienes.",
  },
  p9_restricciones: {
    titulo: "¿Qué no te deja prometer tu empresa?",
    sub: "Closer ya prohíbe mentir y garantizar lo que no controlas. Aquí van las reglas de tu empresa.",
    porQue: "Así Closer las respeta en las prácticas, y te avisa si prometes algo que en la calle no podrías cumplir.",
  },
  p7_precio: {
    titulo: "¿Cómo manejas el precio?",
    porQue: "Tu cliente va a negociar. Vas a practicar solo con los descuentos y plazos que de verdad puedes dar.",
  },
  p8_negativos: {
    titulo: "¿Esto es lo que más te dicen tus clientes?",
    sub: "Closer lo propuso para tu giro. Deja marcado lo que sí escuchas y agrega lo que falte, con sus palabras.",
    porQue: "Tu cliente va a ponerte las objeciones que escuchas de verdad, y vas a practicar a responderlas antes de que te las digan en la calle.",
  },
};

export interface Puerta {
  id: string;
  /** El primer nodo que necesita estas respuestas: se piden al empezar su práctica (o una posterior). */
  antesDe: string;
  titulo: string;
  texto: string;
  preguntas: string[];
}

export const PUERTAS: Puerta[] = [
  {
    id: "cliente",
    antesDe: "1.2",
    titulo: "Tu cliente está por llegar",
    texto: "Para que se parezca a tus clientes de verdad, cuéntanos qué vendes, a quién y cómo. Así cada cliente de práctica tiene un negocio, unos productos y una forma de hablar como los de los tuyos.",
    preguntas: ["p1_que_venden", "p2_clientes", "p3_monto", "p5_canal"],
  },
  {
    id: "cartera",
    antesDe: "3.8",
    titulo: "Llega un cliente que ya te compra",
    texto: "Hasta ahora todos tus clientes de práctica eran nuevos. Desde aquí también vas a visitar a clientes que ya te compran, como en tu ruta.",
    preguntas: ["p4_cartera"],
  },
  {
    id: "oferta",
    antesDe: "4.1",
    titulo: "Vas a presentar",
    texto: "Para presentar necesitas hechos reales: lo que ofreces tú. Y Closer necesita saber qué no te deja prometer tu empresa.",
    preguntas: ["p6_ofrecen", "p9_restricciones"],
  },
  {
    id: "precio",
    antesDe: "4.9",
    titulo: "Tu cliente va a hablar de precio",
    texto: "Desde aquí tu cliente negocia. Cuéntanos cómo manejas el precio, para que practiques solo con lo que de verdad puedes dar.",
    preguntas: ["p7_precio"],
  },
  {
    id: "objeciones",
    antesDe: "5.6",
    titulo: "Llegan las objeciones",
    texto: "Vas a practicar a responder lo que te dicen tus clientes. Para que sean sus palabras y no unas genéricas, palomea lo que de verdad escuchas.",
    preguntas: ["p8_negativos"],
  },
];

/** Las preguntas de las puertas, en el orden en que se piden. */
export const ORDEN_PREGUNTAS = PUERTAS.flatMap((p) => p.preguntas);

export const preguntaPorId = (id: string): Pregunta => {
  const p = PREGUNTAS.find((x) => x.id === id);
  if (!p) throw new Error(`pregunta desconocida: ${id}`);
  return p;
};

/** Ordena ids de nodo como el mapa: 2.7 < 2.7b < 2.7c < 2.8 < 2.10. */
export function compararNodos(a: string, b: string): number {
  const parte = (id: string) => {
    const m = /^(\d+)\.(\d+)([a-z]*)$/.exec(id);
    return m ? [Number(m[1]), Number(m[2]), m[3]] as const : ([999, 999, id] as const);
  };
  const [aw, an, as] = parte(a);
  const [bw, bn, bs] = parte(b);
  if (aw !== bw) return aw - bw;
  if (an !== bn) return an - bn;
  return as < bs ? -1 : as > bs ? 1 : 0;
}

/**
 * Las respuestas de antes del mensaje 157 no se guardaban (solo el cerebro). Si el cerebro ya dice qué vende
 * pero no hay respuestas, las 3 primeras se dan por contestadas: no se le vuelven a pedir.
 */
function yaEstabaContestada(id: string, r: Respuestas, cerebro: unknown): boolean {
  if (!["p1_que_venden", "p2_clientes", "p3_monto"].includes(id)) return false;
  if (Object.keys(r).some((k) => !k.startsWith("__"))) return false;
  let c: any = cerebro;
  if (typeof c === "string") {
    try { c = JSON.parse(c); } catch { return false; }
  }
  return typeof c?.PRODUCTOS_ACTIVOS === "string" && c.PRODUCTOS_ACTIVOS.trim().length > 0;
}

/** Llaves internas de respuestas_giro (no son respuestas): qué preguntas ya vio y lo que Closer propuso. */
export const VISTAS = "__vistas";
export const PROPUESTAS = { negativos: "__propuestas_negativos", restricciones: "__propuestas_restricciones" } as const;

export const vistas = (r: Respuestas): string[] => (Array.isArray(r[VISTAS]) ? (r[VISTAS] as string[]) : []);

/**
 * ¿Ya la contestó? Cuenta haberla visto y guardado, aunque deje vacío lo opcional (p. ej. sus reglas):
 * no se le vuelve a pedir; si quiere, la completa en «Tu negocio».
 */
export function contestada(id: string, r: Respuestas, cerebro?: unknown): boolean {
  return vistas(r).includes(id) || yaEstabaContestada(id, r, cerebro);
}

/** ¿Tiene lo mínimo para avanzar? (las reglas del manager: preguntaCompleta) */
export const completa = (id: string, r: Respuestas): boolean => preguntaCompleta(preguntaPorId(id), r);

/**
 * La puerta que toca antes de practicar este nodo, con solo las preguntas que faltan; o null.
 * Toca si el nodo es el de la puerta o uno posterior (si ya pasó de largo, se pide en la siguiente práctica).
 */
export function puertaPendiente(nodeId: string, r: Respuestas, cerebro?: unknown): Puerta | null {
  for (const p of PUERTAS) {
    if (compararNodos(nodeId, p.antesDe) < 0) break;
    const faltan = p.preguntas.filter((q) => !contestada(q, r, cerebro));
    if (faltan.length) return { ...p, preguntas: faltan };
  }
  return null;
}

/** Lo que se guarda: sin campos vacíos, y con estas preguntas marcadas como vistas. */
export function respuestasParaGuardar(r: Respuestas, vistasAhora: string[]): Respuestas {
  const out: Respuestas = {};
  for (const [k, v] of Object.entries(r)) {
    const vacio = Array.isArray(v) ? v.length === 0 : typeof v !== "string" || v.trim() === "";
    if (!vacio) out[k] = v;
  }
  out[VISTAS] = Array.from(new Set([...vistas(r), ...vistasAhora]));
  return out;
}
