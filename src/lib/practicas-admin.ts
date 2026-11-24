// El panel «Prácticas» del equipo de Closer (mensaje 162, nov-2026, Emilio).
//
// Todas las prácticas de todos los usuarios, para auditarlas y mejorar Closer: dónde se atoran, qué les
// dijo Closer y cómo los calificó. Solo para administradores de la plataforma: las funciones de la base
// (admin_practicas, admin_practica) lo revisan en cada llamada.
// Puro: sin navegador ni base de datos, para probarlo ejecutándolo.
import { compararNodos } from "@/lib/giro-personal";

/** Una práctica en la lista (lo ligero; el detalle se pide al abrirla). */
export interface FilaPractica {
  id: string;
  created_at: string;
  node_id: string | null;
  seller_id: string;
  vendedor: string | null;
  company_id: string | null;
  empresa: string | null;
  personal: boolean;
  score: number | null;
  stars: number | null;
  /** Qué intento es de este vendedor en este nodo (contando todas sus prácticas, no solo las del rango). */
  intento: number;
  fallas: string[];
  criticas: number;
  tiene_audio: boolean;
}

/** Con 2 estrellas el nodo cuenta como pasado (como en la práctica: «¡Práctica completada!»). */
export const ESTRELLAS_PARA_PASAR = 2;
export const pasó = (f: Pick<FilaPractica, "stars">) => (f.stars ?? 0) >= ESTRELLAS_PARA_PASAR;

/** Desde 3 intentos sin pasar, el vendedor está atorado en ese nodo. */
export const INTENTOS_ATORADO = 3;

export interface Filtros {
  nodo: string;
  tipo: "todos" | "equipos" | "personal";
  texto: string;
  resultado: "todas" | "no_pasaron" | "pasaron";
  soloAtorados: boolean;
  conCritica: boolean;
  falla: string;
}

export const FILTROS_INICIALES: Filtros = { nodo: "", tipo: "todos", texto: "", resultado: "todas", soloAtorados: false, conCritica: false, falla: "" };

const clave = (f: Pick<FilaPractica, "seller_id" | "node_id">) => `${f.seller_id}|${f.node_id ?? ""}`;

/** Vendedor+nodo con 3 o más intentos y sin haberlo pasado en este rango. */
export function atorados(filas: FilaPractica[]): Set<string> {
  const max = new Map<string, number>();
  const pasaron = new Set<string>();
  for (const f of filas) {
    const k = clave(f);
    max.set(k, Math.max(max.get(k) ?? 0, f.intento));
    if (pasó(f)) pasaron.add(k);
  }
  return new Set([...max].filter(([k, n]) => n >= INTENTOS_ATORADO && !pasaron.has(k)).map(([k]) => k));
}

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filtrar(filas: FilaPractica[], f: Filtros): FilaPractica[] {
  const at = f.soloAtorados ? atorados(filas) : null;
  const t = sinAcentos(f.texto.trim());
  return filas.filter((x) =>
    (!f.nodo || x.node_id === f.nodo) &&
    (f.tipo === "todos" || (f.tipo === "personal" ? x.personal : !x.personal)) &&
    (!t || sinAcentos(`${x.vendedor ?? ""} ${x.empresa ?? ""}`).includes(t)) &&
    (f.resultado === "todas" || (f.resultado === "pasaron" ? pasó(x) : !pasó(x))) &&
    (!at || at.has(clave(x))) &&
    (!f.conCritica || x.criticas > 0) &&
    (!f.falla || x.fallas.includes(f.falla)));
}

export interface ResumenNodo {
  node_id: string;
  practicas: number;
  vendedores: number;
  /** Vendedores que lo pasaron en este rango. */
  pasaron: number;
  atorados: number;
  /** De los que lo pasaron: en qué intento, en promedio (null si nadie lo pasó). */
  intentosParaPasar: number | null;
  promedio: number | null;
  /** Las 3 fallas que más se repiten en el nodo. */
  fallas: { id: string; n: number }[];
}

export function resumenPorNodo(filas: FilaPractica[]): ResumenNodo[] {
  const at = atorados(filas);
  const porNodo = new Map<string, FilaPractica[]>();
  for (const f of filas) {
    if (!f.node_id) continue;
    porNodo.set(f.node_id, [...(porNodo.get(f.node_id) ?? []), f]);
  }
  const out: ResumenNodo[] = [];
  for (const [node_id, fs] of porNodo) {
    const vendedores = new Set(fs.map((f) => f.seller_id));
    const primeraVezQuePaso = new Map<string, number>();
    for (const f of fs) if (pasó(f)) primeraVezQuePaso.set(f.seller_id, Math.min(primeraVezQuePaso.get(f.seller_id) ?? Infinity, f.intento));
    const intentos = [...primeraVezQuePaso.values()];
    const notas = fs.map((f) => f.score).filter((s): s is number => typeof s === "number");
    const cuenta = new Map<string, number>();
    for (const f of fs) for (const id of f.fallas) cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
    out.push({
      node_id,
      practicas: fs.length,
      vendedores: vendedores.size,
      pasaron: primeraVezQuePaso.size,
      atorados: [...vendedores].filter((s) => at.has(`${s}|${node_id}`)).length,
      intentosParaPasar: intentos.length ? redondear(intentos.reduce((a, b) => a + b, 0) / intentos.length) : null,
      promedio: notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : null,
      fallas: [...cuenta].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => ({ id, n })),
    });
  }
  return out.sort((a, b) => compararNodos(a.node_id, b.node_id));
}

const redondear = (n: number) => Math.round(n * 10) / 10;

/** Un nodo que cuesta: alguien atorado, o se pasa en promedio después del 3er intento. */
export const nodoQueCuesta = (r: ResumenNodo) => r.atorados > 0 || (r.intentosParaPasar ?? 0) > INTENTOS_ATORADO;

/** Las fallas que aparecen en la lista, de la más repetida a la menos (para el filtro). */
export function fallasPresentes(filas: FilaPractica[]): { id: string; n: number }[] {
  const cuenta = new Map<string, number>();
  for (const f of filas) for (const id of f.fallas) cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
  return [...cuenta].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([id, n]) => ({ id, n }));
}

const fecha = (iso: string) => iso.slice(0, 16).replace("T", " ");

/** La lista filtrada, para pegarla en la conversación con Claude. */
export function reporteDeLista(filas: FilaPractica[], filtrosTexto: string): string {
  const lineas = [`PRÁCTICAS · ${filas.length}${filtrosTexto ? ` · ${filtrosTexto}` : ""}`, "", "POR NODO"];
  for (const r of resumenPorNodo(filas)) {
    lineas.push(
      `[${r.node_id}] ${r.practicas} prácticas · ${r.vendedores} vendedores · pasaron ${r.pasaron} · atorados ${r.atorados}` +
        ` · intento en que pasan ${r.intentosParaPasar ?? "—"} · promedio ${r.promedio ?? "—"}` +
        (r.fallas.length ? ` · fallas: ${r.fallas.map((f) => `${f.id}×${f.n}`).join(", ")}` : ""),
    );
  }
  lineas.push("", "PRÁCTICAS");
  for (const f of filas) {
    lineas.push(
      `${fecha(f.created_at)} · [${f.node_id ?? "?"}] · ${f.vendedor ?? "sin nombre"} (${f.personal ? "por su cuenta" : f.empresa ?? "equipo"})` +
        ` · intento ${f.intento} · nota ${f.score ?? "?"} · ${f.stars ?? 0}★${f.fallas.length ? ` · ${f.fallas.join(", ")}` : ""}`,
    );
  }
  return lineas.join("\n");
}

/** El detalle de una práctica, como lo devuelve admin_practica. */
export interface DetallePractica {
  id: string;
  created_at: string;
  node_id: string | null;
  nodo: string | null;
  vendedor: string | null;
  empresa: string | null;
  personal: boolean;
  audio_consent: boolean;
  audio_url: string | null;
  prompt_version: string | null;
  model: string | null;
  payload: any;
}

export interface VistaPractica {
  /** «Closer»: lo que dice Closer y no el cliente (p. ej. el cierre); no entra a la evaluación. */
  turnos: { n: number; quien: "Vendedor" | "Cliente" | "Closer"; texto: string }[];
  cumplidos: string[];
  observaciones: { criterio: string; severidad: string | null; error: string | null; mejora: string | null; ejemplo: string | null }[];
  fallas: { id: string; severidad: string | null; error: string | null; cita: string | null; mejora: string | null }[];
  mision: string | null;
  termino: string | null;
}

const CORTE: Record<string, string> = {
  max_duration: "se acabó el tiempo", max_turns: "se acabaron los turnos",
  scope_covered: "objetivo cumplido", evidence_sufficient: "evidencia suficiente", critical_failure: "falla crítica",
};

/**
 * Cómo terminó la práctica. Mensaje 163: el Director corta por «falla crítica» con lo que él creyó ver en ese
 * momento; después la calificación revisa con la prueba de la regla, y a veces no la confirma (8-nov, nodo
 * 1.2: prácticas con nota 53 y 80 guardadas como «falla crítica» sin ninguna). El panel dice lo que pasó.
 */
function terminoDe(corte: unknown, ev: any): string | null {
  if (typeof corte !== "string" || !corte.trim()) return null;
  if (corte === "critical_failure") {
    const hayCritica = lista(ev?.fallas).some((f) => (f?.severidad ?? f?.severity) === "critical");
    return hayCritica ? CORTE.critical_failure : "el Director cortó por una falla crítica que la calificación no confirmó";
  }
  return CORTE[corte] ?? corte;
}

const txt = (x: unknown): string | null => (typeof x === "string" && x.trim() ? x.trim() : null);
const lista = (x: unknown): any[] => (Array.isArray(x) ? x : []);

/** Lo que se ve al abrir una práctica: la conversación numerada y lo que decidió la calificación. */
export function vistaDePractica(d: DetallePractica): VistaPractica {
  const p = d.payload ?? {};
  const ev = p.evaluation ?? {};
  const turnos = lista(p.transcript)
    .map((t) => ({ rol: String(t?.role ?? t?.speaker ?? ""), fuera: t?.fuera_de_la_venta === true, texto: String(t?.text ?? t?.content ?? t?.message ?? "") }))
    .filter((t) => t.texto.trim().length > 0)
    .map((t, i) => ({
      n: i + 1,
      quien: (/vend|seller|user/i.test(t.rol) ? "Vendedor" : t.fuera ? "Closer" : "Cliente") as "Vendedor" | "Cliente" | "Closer",
      texto: t.texto,
    }));
  return {
    turnos,
    cumplidos: lista(ev.criterios_cumplidos).filter((c) => typeof c === "string"),
    observaciones: lista(ev.observations).map((o) => ({
      criterio: String(o?.criterio_id ?? "—"),
      severidad: txt(o?.severity),
      error: txt(o?.error),
      mejora: txt(o?.mejora),
      ejemplo: txt(o?.ejemplo),
    })),
    fallas: lista(ev.fallas).filter((f) => f && typeof f.id === "string").map((f) => ({
      id: f.id,
      severidad: txt(f.severidad) ?? txt(f.severity),
      error: txt(f.error),
      cita: txt(f.cita),
      mejora: txt(f.mejora),
    })),
    mision: txt(ev.mision),
    termino: terminoDe(p.cut_reason, ev),
  };
}

/** Una práctica completa, para pegarla en la conversación con Claude. Sin audio. */
export function reporteDePractica(d: DetallePractica): string {
  const v = vistaDePractica(d);
  const p = d.payload ?? {};
  const l = [
    `PRÁCTICA · [${d.node_id ?? "?"}]${d.nodo ? ` ${d.nodo}` : ""} · ${fecha(d.created_at)}`,
    `vendedor: ${d.vendedor ?? "sin nombre"} (${d.personal ? "por su cuenta" : d.empresa ?? "equipo"})`,
    `nota ${p.score ?? "?"} · ${p.stars ?? 0}★${v.termino ? ` · terminó: ${v.termino}` : ""}${d.prompt_version ? ` · evaluador ${d.prompt_version}` : ""}`,
  ];
  if (v.cumplidos.length) l.push(`cumplió: ${v.cumplidos.join(", ")}`);
  for (const f of v.fallas) {
    l.push(`falla ${f.id} (${f.severidad ?? "?"})${f.error ? `: ${f.error}` : ""}${f.cita ? ` · cita: "${f.cita}"` : ""}${f.mejora ? ` · mejora: ${f.mejora}` : ""}`);
  }
  for (const o of v.observaciones) {
    l.push(`observación ${o.criterio}${o.severidad ? ` (${o.severidad})` : ""}: ${[o.error && `qué pasó: ${o.error}`, o.mejora && `mejora: ${o.mejora}`, o.ejemplo && `ejemplo: ${o.ejemplo}`].filter(Boolean).join(" · ")}`);
  }
  if (v.mision) l.push(`misión: ${v.mision}`);
  if (v.turnos.length) {
    l.push("conversación:");
    for (const t of v.turnos) l.push(`  ${t.n}. ${t.quien === "Vendedor" ? "V" : t.quien === "Cliente" ? "C" : "Closer"}: ${t.texto.replace(/\s+/g, " ")}`);
  }
  return l.join("\n");
}
