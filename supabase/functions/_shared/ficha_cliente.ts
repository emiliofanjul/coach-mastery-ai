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
/** El catálogo que el manager escribió en "Productos activos" (texto o lista). */
export function catalogoDelCerebro(cerebro: unknown): string {
  let b: any = cerebro;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { return ""; } }
  const v = b?.PRODUCTOS_ACTIVOS;
  return Array.isArray(v) ? v.map(String).join("; ") : typeof v === "string" ? v : "";
}

const sinAcentos = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const VACIAS = new Set(["para", "como", "todo", "toda", "todos", "todas", "otro", "otra", "otros", "otras", "linea", "lineas", "familia", "familias", "productos", "producto", "marca", "marcas", "tipo", "tipos", "sus", "mas"]);

/**
 * ¿Todo producto que nombra la frase está en el catálogo? Cada palabra con
 * contenido (4+ letras) debe aparecer en "Productos activos", admitiendo
 * plural/singular. Oct-2026: la ficha inventó "filtros" para DALFAN, que no
 * vende filtros ni los puso en su onboarding.
 */
export function respaldadoPorCatalogo(frase: string, catalogo: string): boolean {
  const cat = sinAcentos(catalogo);
  if (!cat.trim()) return false;
  const palabras = sinAcentos(frase).split(/[^a-z0-9ñ]+/).filter((w) => w.length >= 4 && !VACIAS.has(w));
  if (palabras.length === 0) return false;
  return palabras.every((w) => {
    const raiz = w.replace(/(es|s)$/, "");
    return cat.includes(w) || (raiz.length >= 4 && cat.includes(raiz));
  });
}

export function validarFicha(raw: unknown, tipo: TipoCliente, catalogo?: string): FichaCliente {
  const r: any = raw && typeof raw === "object" ? raw : {};
  const base = fichaDeRespaldo(tipo);
  const f: FichaCliente = { tipo, nombre: corto(r.nombre, 40) || base.nombre, negocio: corto(r.negocio, 60) || base.negocio };
  if (tipo === "recurrente") {
    const ya = corto(r.ya_te_compra, 120);
    const otro = corto(r.le_compra_a_otro, 120);
    // Con catálogo, solo pasa lo que está en él. Lo que no, se descarta: mejor
    // "sus productos de siempre" que un producto que la empresa no vende.
    const vale = (x: string) => !!x && (catalogo === undefined || respaldadoPorCatalogo(x, catalogo));
    f.ya_te_compra = vale(ya) ? ya : base.ya_te_compra;
    f.ultima_visita = corto(r.ultima_visita, 40) || base.ultima_visita;
    if (vale(otro)) f.le_compra_a_otro = otro;
  }
  return f;
}

/** Acepta una ficha que viene en una petición (del teléfono). Si no es válida, null. */
export function fichaDePeticion(raw: unknown): FichaCliente | null {
  const r: any = raw && typeof raw === "object" ? raw : null;
  if (!r || (r.tipo !== "nuevo" && r.tipo !== "recurrente")) return null;
  return validarFicha(r, r.tipo);
}

export const PROMPT_FICHA = `Creas el perfil breve de un cliente para una práctica de ventas de campo. El cliente es dueño o encargado de un negocio como el que describe "Cliente típico".
REGLA ABSOLUTA: los productos que nombres los COPIAS de "Productos activos", con las mismas palabras. No agregues ningún producto, familia ni marca que no esté escrito ahí, aunque sea común en la industria. Si "Productos activos" está vacío, deja vacíos los campos de productos.
Responde SOLO con JSON:
{"nombre": "Don/Doña + nombre de pila", "negocio": "tipo de negocio, corto, según Cliente típico", "ya_te_compra": "SOLO si es recurrente: una o dos familias copiadas de Productos activos", "ultima_visita": "SOLO si es recurrente: p. ej. hace dos semanas", "le_compra_a_otro": "SOLO si es recurrente: UNA familia distinta, copiada de Productos activos, que le compra a otro proveedor"}`;

/** Lo que recibe el cliente simulado. */
// La ficha manda sobre la RELACIÓN con el vendedor, aunque el guion del nodo
// diga otra cosa (oct-2026: con "solo nuevos", la tarjeta del 3.9 decía
// "cliente nuevo" y el cliente actuó como recurrente porque su guion dice "le
// das tu pedido de siempre" y "el guion manda").
const PRECEDENCIA_FICHA = `ESTA FICHA MANDA SOBRE TU RELACIÓN CON EL VENDEDOR, aunque el guion del nodo diga otra cosa. Si el guion habla de "tu pedido de siempre" o de que "ya le compras", y aquí eres nuevo, haz el equivalente de un cliente nuevo: llegas tú pidiendo algo concreto que necesitas hoy, y lo demás del guion (lo que tienes con otro proveedor, lo que no manejas) sigue igual.`;

export function bloqueActor(f: FichaCliente | null): string {
  if (!f) {
    return `IMPORTANTE: Eres un cliente nuevo que el vendedor acaba de encontrar.
NO inventes historial de pedidos, productos específicos, ni contexto que el vendedor no haya mencionado.
Reacciona SOLO a lo que el vendedor diga en esta conversación.`;
  }
  if (f.tipo === "nuevo") {
    return `TU PERSONAJE: ${f.nombre}, ${f.negocio}. Es la PRIMERA vez que este vendedor te visita: no lo conoces ni a él ni a su empresa. Nunca hables de "lo de siempre", de "la vez pasada" ni de una visita anterior.
NO inventes historial de pedidos ni contexto que el vendedor no haya mencionado. Reacciona SOLO a lo que diga en esta conversación.
${PRECEDENCIA_FICHA}`;
  }
  return `TU PERSONAJE: ${f.nombre}, ${f.negocio}. Eres cliente RECURRENTE de este vendedor: ya le compras ${f.ya_te_compra}; su última visita fue ${f.ultima_visita}. Lo conoces y lo tratas con la confianza de un proveedor que ya te surte.${f.le_compra_a_otro ? `\n${f.le_compra_a_otro} se lo compras a OTRO proveedor. No lo menciones por tu cuenta; si el vendedor pregunta bien, lo cuentas.` : ""}
Fuera de estos hechos, NO inventes historial: ni pedidos, ni pláticas anteriores, ni problemas pasados.
${PRECEDENCIA_FICHA}`;
}

/** Lo que recibe el evaluador (y el auditor): los hechos del cliente que SÍ existen. */
export function bloqueEvaluador(f: FichaCliente | null): string {
  if (!f || f.tipo === "nuevo") {
    return `CLIENTE DE ESTA PRÁCTICA: nuevo${f ? ` (${f.nombre}, ${f.negocio})` : ""}. Es la primera visita: ningún consejo puede citar una visita anterior. Si un criterio habla de "lo que ya le vende" o "su pedido de siempre", léelo como "lo que el cliente ya pidió hoy".`;
  }
  return `CLIENTE DE ESTA PRÁCTICA: RECURRENTE — ${f.nombre}, ${f.negocio}. Hechos que SÍ existen y el vendedor conoce: ya le compra ${f.ya_te_compra}; última visita ${f.ultima_visita}.${f.le_compra_a_otro ? ` (Oculto para el vendedor: ${f.le_compra_a_otro} se lo compra a otro proveedor.)` : ""}
Recordar un hecho de esta lista es legítimo y es el escalón 3 de la especificidad. Cualquier recuerdo que NO esté en esta lista es inventado.`;
}
