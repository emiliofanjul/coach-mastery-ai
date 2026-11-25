// EL SEGUIMIENTO ENTRE INTENTOS (mensaje 171, 24-nov-2026).
//
// El caso: con vendedores reales entrenando, Closer calificaba cada práctica
// como si fuera la primera. El vendedor repetía el mismo error en tres intentos
// y la pantalla le decía tres veces lo mismo, como si fuera nuevo; y cuando lo
// corregía, nadie se lo reconocía. Emilio: «necesitamos que en cada práctica
// sepamos qué es lo que buscamos enseñarle al vendedor, y darle el feedback
// correcto y con seguimiento».
//
// Lo que hace (doc aprobado «Lo que buscamos en cada práctica», 24-nov):
//   · Lee los últimos 3 intentos de este nodo y, de los otros nodos, la última
//     vez que falló la misma regla.
//   · «Ya corregiste»: algo que falló la última vez que se pudo ver en este
//     nodo y que hoy salió bien. Va primero, para que sienta el avance.
//   · «Se repite»: algo que falla hoy y ya había fallado en este nodo, o la
//     misma regla en otro nodo («esto mismo te pasó en el 5.10»).
//   · Solo habla de lo que la práctica de hoy permite ver: un criterio «no
//     aplica» no mejoró ni empeoró.
//   · No cambia la calificación: la nota sale de esta práctica, como siempre.
//
// Es código, no modelo: lo mismo entra, lo mismo sale. Los textos son los que
// el evaluador ya le escribió al vendedor en cada intento; aquí no se inventa
// nada. Sin imports: funciona en Deno y en Node (se prueba ejecutándolo).

export interface FallaGuardada { id?: unknown; error?: unknown }
export interface LineaGuardada { criterio_id?: unknown; nivel?: unknown; credito?: unknown; falta?: unknown }
export interface ObservacionGuardada { criterio_id?: unknown; error?: unknown }

/** Lo que se guardó de una calificación: lo que hace falta para comparar. */
export interface Intento {
  node_id: string;
  fallas?: FallaGuardada[] | null;
  desglose?: { criterios?: LineaGuardada[] | null } | null;
  observations?: ObservacionGuardada[] | null;
}

/** Del guion de cada nodo, solo el mapa de cada falla y criterio a su regla. */
export interface GuionDeNodo {
  nombre?: string | null;
  failure_criteria?: { id?: unknown; regla_id?: unknown; espejo_de?: unknown }[] | null;
  success_criteria?: { id?: unknown; regla_id?: unknown }[] | null;
}

export interface Corregido {
  /** La regla (o el id, si no tiene regla). */
  clave: string;
  /** Lo que el evaluador le dijo la última vez que falló. */
  antes: string;
  /** En cuántos de sus últimos 3 intentos de este nodo había fallado. */
  veces_antes: number;
}
export interface SeRepite {
  clave: string;
  /** Lo que el evaluador le dijo hoy. */
  texto: string;
  /** Cuántas veces, contando hoy, en sus últimos intentos de este nodo. */
  veces_en_este_nodo: number;
  /** La última vez que esta misma regla le falló en otro nodo. */
  otro_nodo?: { id: string; nombre: string };
}
export interface Seguimiento {
  /** Intentos anteriores de este nodo que se leyeron (máximo 3). */
  intentos_previos: number;
  corregido: Corregido[];
  se_repite: SeRepite[];
}

export const INTENTOS_DEL_NODO = 3;
const MAX_TEXTO = 300;

const str = (x: unknown): string => (typeof x === "string" ? x.trim() : "");
const corto = (s: string) => (s.length > MAX_TEXTO ? s.slice(0, MAX_TEXTO - 1).trimEnd() + "…" : s);

interface Problema { texto: string }
interface Lectura {
  /** Claves que fallaron en este intento, con lo que se le dijo. */
  problemas: Map<string, Problema>;
  /** ¿Se pudo ver esta clave en este intento? */
  seVio: (clave: string) => boolean;
}

function mapaDeReglas(g: GuionDeNodo | undefined) {
  const falla = new Map<string, string>();
  const criterio = new Map<string, string>();
  for (const c of Array.isArray(g?.success_criteria) ? g?.success_criteria ?? [] : []) {
    const id = str(c?.id);
    if (id) criterio.set(id, str(c?.regla_id) || id);
  }
  for (const f of Array.isArray(g?.failure_criteria) ? g?.failure_criteria ?? [] : []) {
    const id = str(f?.id);
    if (!id) continue;
    // Una falla espejo es la otra cara de un criterio: cuenta como ese criterio.
    const espejo = str(f?.espejo_de);
    falla.set(id, (espejo && criterio.get(espejo)) || str(f?.regla_id) || id);
  }
  return { falla, criterio };
}

/** Lee un intento con el guion de su nodo: qué falló y qué se pudo ver. */
export function leerIntento(intento: Intento, guion: GuionDeNodo | undefined): Lectura {
  const { falla, criterio } = mapaDeReglas(guion);
  const lineas = (Array.isArray(intento?.desglose?.criterios) ? intento.desglose?.criterios ?? [] : [])
    .filter((d) => str(d?.criterio_id));
  const obs = new Map<string, string>();
  for (const o of Array.isArray(intento?.observations) ? intento.observations ?? [] : []) {
    const id = str(o?.criterio_id), e = str(o?.error);
    if (id && e && !obs.has(id)) obs.set(id, e);
  }
  const problemas = new Map<string, Problema>();
  // Las claves de criterio que se vieron (no «no aplica»), y si salieron completas.
  const vistas = new Set<string>();
  for (const d of lineas) {
    const id = str(d.criterio_id);
    const clave = criterio.get(id) ?? id;
    const nivel = str(d.nivel);
    if (nivel === "no_aplica" || !nivel) continue;
    vistas.add(clave);
    const credito = Number(d.credito);
    if ((nivel === "parcial" || nivel === "no_cumple") && !(credito >= 1)) {
      const texto = obs.get(id) || str(d.falta);
      if (texto && !problemas.has(clave)) problemas.set(clave, { texto: corto(texto) });
    }
  }
  for (const f of Array.isArray(intento?.fallas) ? intento.fallas ?? [] : []) {
    const id = str(f?.id);
    if (!id) continue;
    const clave = falla.get(id) ?? id;
    const texto = str(f?.error);
    // La falla va antes que la observación del mismo criterio: es lo que más costó.
    if (texto) problemas.set(clave, { texto: corto(texto) });
  }
  const clavesDeCriterio = new Set(criterio.values());
  // Una falla que no es de ningún criterio se pudo ver solo si la conversación
  // llegó a todo lo que el nodo mide: ningún criterio «no aplica» y al menos
  // uno con crédito. Si no, no se sabe si la habría cometido.
  const todoSeVio = lineas.length > 0
    && lineas.every((d) => str(d.nivel) && str(d.nivel) !== "no_aplica")
    && lineas.some((d) => Number(d.credito) > 0);
  const seVio = (clave: string) =>
    problemas.has(clave) || (clavesDeCriterio.has(clave) ? vistas.has(clave) : todoSeVio);
  return { problemas, seVio };
}

/**
 * El seguimiento de la práctica de hoy contra los intentos anteriores.
 * `anteriores` va del más reciente al más viejo y no incluye el de hoy.
 * `guiones` trae el guion de cada nodo que aparece (por id).
 */
export function calcularSeguimiento(
  hoy: Intento,
  anteriores: Intento[],
  guiones: Record<string, GuionDeNodo | undefined>,
): Seguimiento {
  const nodo = str(hoy?.node_id);
  const lHoy = leerIntento(hoy, guiones[nodo]);
  const lista = Array.isArray(anteriores) ? anteriores.filter((a) => a && str(a.node_id)) : [];
  const delNodo = lista.filter((a) => str(a.node_id) === nodo).slice(0, INTENTOS_DEL_NODO);
  const lDelNodo = delNodo.map((a) => leerIntento(a, guiones[nodo]));
  const otros = lista.filter((a) => str(a.node_id) !== nodo);
  const lOtros = otros.map((a) => ({ id: str(a.node_id), l: leerIntento(a, guiones[str(a.node_id)]) }));

  // Ya corregiste: falló la última vez que se pudo ver en este nodo, y hoy se
  // vio y salió bien. Las claves salen en el orden en que se vieron.
  const corregido: Corregido[] = [];
  const revisadas = new Set<string>();
  for (const l of lDelNodo) {
    for (const [clave] of l.problemas) {
      if (revisadas.has(clave)) continue;
      revisadas.add(clave);
      if (!lHoy.seVio(clave) || lHoy.problemas.has(clave)) continue;
      const ultima = lDelNodo.find((x) => x.seVio(clave));
      const p = ultima?.problemas.get(clave);
      if (!p) continue;
      corregido.push({ clave, antes: p.texto, veces_antes: lDelNodo.filter((x) => x.problemas.has(clave)).length });
    }
  }

  // Se repite: falla hoy y ya había fallado aquí, o la misma regla en otro nodo.
  const se_repite: SeRepite[] = [];
  for (const [clave, p] of lHoy.problemas) {
    const veces = 1 + lDelNodo.filter((x) => x.problemas.has(clave)).length;
    const otro = lOtros.find((x) => x.l.problemas.has(clave));
    if (veces < 2 && !otro) continue;
    se_repite.push({
      clave,
      texto: p.texto,
      veces_en_este_nodo: veces,
      ...(otro ? { otro_nodo: { id: otro.id, nombre: str(guiones[otro.id]?.nombre) } } : {}),
    });
  }
  // Lo que más se repite, primero.
  se_repite.sort((a, b) => b.veces_en_este_nodo - a.veces_en_este_nodo);

  return { intentos_previos: delNodo.length, corregido, se_repite };
}

/** Lo que se le dice al vendedor, en una línea por punto. La pantalla lo pinta tal cual. */
export function lineasDeSeguimiento(s: Seguimiento | null | undefined): { tipo: "corregido" | "se_repite"; texto: string; detalle: string }[] {
  if (!s) return [];
  const veces = (n: number) => (n === 1 ? "una vez" : n === 2 ? "dos veces" : `${n} veces`);
  const nodo = (o: { id: string; nombre: string }) => (o.nombre ? `el ${o.id} (${o.nombre})` : `el ${o.id}`);
  const lineas: { tipo: "corregido" | "se_repite"; texto: string; detalle: string }[] = [];
  for (const c of s.corregido ?? []) {
    lineas.push({
      tipo: "corregido",
      texto: c.veces_antes >= 2 ? `Ya lo corregiste: te pasó ${veces(c.veces_antes)} en tus intentos anteriores, y hoy no.` : "Ya lo corregiste: la última vez te pasó, y hoy no.",
      detalle: c.antes,
    });
  }
  for (const r of s.se_repite ?? []) {
    const partes: string[] = [];
    if (r.veces_en_este_nodo >= 2) {
      partes.push(r.veces_en_este_nodo === 2
        ? "Se repite: ya te había pasado en tu intento anterior de esta práctica."
        : `Se repite: van ${r.veces_en_este_nodo} veces en esta práctica. Esto es lo que hay que lograr.`);
    }
    if (r.otro_nodo) partes.push(`${partes.length ? "Y esto" : "Esto"} mismo te pasó en ${nodo(r.otro_nodo)}: es un solo hábito, no errores sueltos.`);
    lineas.push({ tipo: "se_repite", texto: partes.join(" "), detalle: r.texto });
  }
  return lineas;
}
