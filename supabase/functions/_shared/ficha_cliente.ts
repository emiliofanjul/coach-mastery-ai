// La ficha del cliente de una práctica (oct-2026).
//
// Antes, el cliente simulado tenía escrito "eres un cliente nuevo" en TODAS las
// prácticas. Ahora cada práctica trae una ficha: quién es el cliente, qué
// negocio tiene, y si es nuevo o recurrente. El vendedor la ve en una tarjeta
// antes de su turno; el cliente simulado, el evaluador y el auditor reciben la
// MISMA ficha, así que los tres trabajan con los mismos hechos. Recordar algo
// que está en la ficha es legítimo (el escalón 3 de verdad); recordar algo que
// no está, sigue prohibido. Sin imports: lo usan Deno y las pruebas.

export type TipoCliente = "nuevo" | "recurrente";

export interface FichaCliente {
  tipo: TipoCliente;
  nombre: string;              // "Don Ramón"
  negocio: string;             // "taller mecánico"
  ya_te_compra?: string;       // solo recurrente: lo que ya le vendes
  ultima_visita?: string;      // solo recurrente: "hace dos semanas"
  le_compra_a_otro?: string;   // solo recurrente, OCULTO al vendedor: el hueco por descubrir
}

const corto = (x: unknown, n: number) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim().slice(0, n) : "");

export function fichaDeRespaldo(tipo: TipoCliente): FichaCliente {
  return tipo === "recurrente"
    ? { tipo, nombre: "Don Ramón", negocio: "su negocio", ya_te_compra: "sus productos de siempre", ultima_visita: "hace dos semanas" }
    : { tipo, nombre: "Don Ramón", negocio: "su negocio" };
}

/** Valida lo que generó el modelo; lo que falte se completa con el respaldo. Nunca devuelve basura. */
export function validarFicha(raw: unknown, tipo: TipoCliente): FichaCliente {
  const r: any = raw && typeof raw === "object" ? raw : {};
  const base = fichaDeRespaldo(tipo);
  const f: FichaCliente = { tipo, nombre: corto(r.nombre, 40) || base.nombre, negocio: corto(r.negocio, 60) || base.negocio };
  if (tipo === "recurrente") {
    f.ya_te_compra = corto(r.ya_te_compra, 120) || base.ya_te_compra;
    f.ultima_visita = corto(r.ultima_visita, 40) || base.ultima_visita;
    const otro = corto(r.le_compra_a_otro, 120);
    if (otro) f.le_compra_a_otro = otro;
  }
  return f;
}

/** Acepta una ficha que viene en una petición (del teléfono). Si no es válida, null. */
export function fichaDePeticion(raw: unknown): FichaCliente | null {
  const r: any = raw && typeof raw === "object" ? raw : null;
  if (!r || (r.tipo !== "nuevo" && r.tipo !== "recurrente")) return null;
  return validarFicha(r, r.tipo);
}

export const PROMPT_FICHA = `Creas el perfil breve de un cliente para una práctica de ventas de campo. Usa SOLO productos o familias que aparezcan en el cerebro de la empresa; si no hay, usa términos generales de su industria. El cliente es un dueño o encargado de un negocio que le compraría a esta empresa.
Responde SOLO con JSON:
{"nombre": "Don/Doña + nombre de pila", "negocio": "tipo de negocio, corto (p. ej. taller mecánico)", "ya_te_compra": "SOLO si es recurrente: una o dos familias que ya le compra al vendedor", "ultima_visita": "SOLO si es recurrente: p. ej. hace dos semanas", "le_compra_a_otro": "SOLO si es recurrente: UNA familia que le compra a otro proveedor y que la empresa también vende"}`;

/** Lo que recibe el cliente simulado. */
export function bloqueActor(f: FichaCliente | null): string {
  if (!f) {
    return `IMPORTANTE: Eres un cliente nuevo que el vendedor acaba de encontrar.
NO inventes historial de pedidos, productos específicos, ni contexto que el vendedor no haya mencionado.
Reacciona SOLO a lo que el vendedor diga en esta conversación.`;
  }
  if (f.tipo === "nuevo") {
    return `TU PERSONAJE: ${f.nombre}, ${f.negocio}. Es la PRIMERA vez que este vendedor te visita: no lo conoces ni a él ni a su empresa.
NO inventes historial de pedidos ni contexto que el vendedor no haya mencionado. Reacciona SOLO a lo que diga en esta conversación.`;
  }
  return `TU PERSONAJE: ${f.nombre}, ${f.negocio}. Eres cliente RECURRENTE de este vendedor: ya le compras ${f.ya_te_compra}; su última visita fue ${f.ultima_visita}. Lo conoces y lo tratas con la confianza de un proveedor que ya te surte.${f.le_compra_a_otro ? `\n${f.le_compra_a_otro} se lo compras a OTRO proveedor. No lo menciones por tu cuenta; si el vendedor pregunta bien, lo cuentas.` : ""}
Fuera de estos hechos, NO inventes historial: ni pedidos, ni pláticas anteriores, ni problemas pasados.`;
}

/** Lo que recibe el evaluador (y el auditor): los hechos del cliente que SÍ existen. */
export function bloqueEvaluador(f: FichaCliente | null): string {
  if (!f || f.tipo === "nuevo") {
    return `CLIENTE DE ESTA PRÁCTICA: nuevo${f ? ` (${f.nombre}, ${f.negocio})` : ""}. Es la primera visita: ningún consejo puede citar una visita anterior.`;
  }
  return `CLIENTE DE ESTA PRÁCTICA: RECURRENTE — ${f.nombre}, ${f.negocio}. Hechos que SÍ existen y el vendedor conoce: ya le compra ${f.ya_te_compra}; última visita ${f.ultima_visita}.${f.le_compra_a_otro ? ` (Oculto para el vendedor: ${f.le_compra_a_otro} se lo compra a otro proveedor.)` : ""}
Recordar un hecho de esta lista es legítimo y es el escalón 3 de la especificidad. Cualquier recuerdo que NO esté en esta lista es inventado.`;
}
