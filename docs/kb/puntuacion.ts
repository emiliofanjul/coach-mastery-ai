// Reglas aritméticas de la puntuación.
//
// Principio (sept-2026): el modelo JUZGA, el código CALCULA. Las reglas que son
// aritmética pura no se le piden al modelo de lenguaje: se aplican aquí, de
// forma determinista, después de que el modelo responde.
//
// Por qué: la regla "un flag critical deja el score en máximo 30" vivía solo
// en el prompt. En el harness, el evaluador marcó pitch_prematuro (critical) y
// aun así devolvió 35. Un modelo puede olvidar una regla; una función no.
//
// Sin imports, para que la usen tanto la Edge Function (Deno) como las pruebas
// (Node/Vitest) con el mismo código exacto.

export const TOPE_CRITICO = 30;

export type Severidad = "minor" | "major" | "critical";

export interface ResultadoTope {
  score: number;
  /** true si el score del modelo excedía el tope y el código lo bajó. */
  topado: boolean;
  /** Los flags critical que dispararon el tope. */
  criticos: string[];
}

/**
 * Si entre los flags detectados hay alguno de severidad critical (según los
 * failure_criteria del guion resuelto), el score no puede pasar de 30.
 * Solo cuentan los flags que existen en el guion: un id desconocido no topa.
 */
export function aplicarTopeCritico(
  score: number,
  flagsDetectados: unknown,
  failureCriteria: unknown,
): ResultadoTope {
  const severidadDe = new Map<string, string>();
  if (Array.isArray(failureCriteria)) {
    for (const f of failureCriteria) {
      if (f && typeof f === "object" && typeof (f as any).id === "string") {
        severidadDe.set((f as any).id, String((f as any).severity ?? ""));
      }
    }
  }
  const flags = Array.isArray(flagsDetectados)
    ? flagsDetectados.filter((x): x is string => typeof x === "string")
    : [];
  const criticos = flags.filter((f) => severidadDe.get(f) === "critical");
  const base = typeof score === "number" && Number.isFinite(score) ? score : 0;
  if (criticos.length > 0 && base > TOPE_CRITICO) {
    return { score: TOPE_CRITICO, topado: true, criticos };
  }
  return { score: base, topado: false, criticos };
}

/**
 * Estrellas a partir del score YA topado. Cero cuando el score es menor a 30:
 * una sesión sin ejecución real no gana estrella, y la que ya tenías nunca se
 * pierde (el guardado toma el máximo).
 */
export function estrellasDe(score: number): 0 | 1 | 2 | 3 {
  return score >= 85 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0;
}

// ─────────────────────────────────────────────────────────────────────
// La rúbrica completa (sept-2026).
//
// Antes el modelo devolvía un número del 0 al 100 y la misma conversación
// podía sacar 55 en una corrida y 75 en otra, con temperatura 0. Un número
// libre varía; una decisión discreta por criterio varía mucho menos, y cuando
// cambia se sabe cuál y cuánto movió la nota.
//
// El modelo decide, por cada criterio de éxito: cumple, parcial o no cumple.
// El código suma. Valores decididos por Emilio:
//   · error major resta 30, error minor resta 15 (antes: rangos 25-40 y 10-20)
//   · un criterio cumplido a medias vale la mitad
//   · en la escalera de la especificidad, el escalón 1 vale un tercio
//   · un error critical deja el score en máximo 30
// ─────────────────────────────────────────────────────────────────────

export const RESTA_MAJOR = 30;

/** Falla que es el espejo de un criterio del mismo nodo: no resta aparte. Nunca una critical. */
export function esEspejo(f: unknown): boolean {
  const x = f as any;
  return !!x && typeof x.espejo_de === "string" && x.espejo_de.trim() !== "" && x.severity !== "critical";
}
export const RESTA_MINOR = 15;
export const CREDITO: Record<string, number> = { cumple: 1, parcial: 0.5, no_cumple: 0 };
export const CREDITO_ESCALON: Record<number, number> = { 1: 1 / 3, 2: 1, 3: 1 };
/** Reglas cuyo cumplimiento se mide en escalones, no en cumple/parcial. */
export const REGLAS_DE_ESCALERA = new Set(["opening.especificidad"]);
/** Un intento genuino —algo acreditado— nunca baja de aquí. */
export const PISO_INTENTO = 5;

export interface LineaDesglose {
  criterio_id: string;
  peso: number;
  nivel: string;
  escalon?: number;
  credito: number;
  /** La pieza que el evaluador dijo que falta (parcial o no_cumple). */
  falta?: string;
}
export interface Resta {
  flag: string;
  severidad: string;
  puntos: number;
}
export interface ResultadoRubrica {
  /** false si el modelo no entregó veredictos utilizables: el llamador usa su plan B. */
  valido: boolean;
  score: number;
  base: number;
  desglose: LineaDesglose[];
  restas: Resta[];
  topado: boolean;
  criticos: string[];
  /** Criterios con crédito completo: se derivan de los veredictos, no se piden aparte. */
  cumplidos: string[];
  /** Criterios evaluables que el modelo no calificó (se cuentan como no cumplidos). */
  sin_veredicto: string[];
}

export function calcularScore(args: {
  veredictos: unknown;
  successCriteria: unknown;
  flags: unknown;
  failureCriteria: unknown;
}): ResultadoRubrica {
  const vacio: ResultadoRubrica = {
    valido: false, score: 0, base: 0, desglose: [], restas: [], topado: false, criticos: [], cumplidos: [], sin_veredicto: [],
  };
  const criterios = (Array.isArray(args.successCriteria) ? args.successCriteria : [])
    .filter((c: any) => c && typeof c.id === "string" && c.requires_audio !== true);
  const veredictos = Array.isArray(args.veredictos) ? args.veredictos : [];
  const porId = new Map<string, any>();
  for (const v of veredictos) {
    if (v && typeof v === "object" && typeof (v as any).criterio_id === "string") porId.set((v as any).criterio_id, v);
  }
  // Sin un solo veredicto que coincida con un criterio real, no hay rúbrica.
  if (criterios.length === 0 || !criterios.some((c: any) => porId.has(c.id))) return vacio;

  const desglose: LineaDesglose[] = [];
  const sin_veredicto: string[] = [];
  let sumaPesos = 0, sumaCredito = 0;
  for (const c of criterios as any[]) {
    const peso = typeof c.weight === "number" && c.weight > 0 ? c.weight : 0;
    const v = porId.get(c.id);
    let nivel = "no_cumple", escalon: number | undefined, credito = 0;
    if (!v) {
      sin_veredicto.push(c.id);
    } else {
      nivel = String(v.nivel ?? "no_cumple");
      // "no_aplica" (sept-2026): la sesión no permitió demostrarlo —la situación
      // nunca se presentó, o el vendedor salió bien por la Regla de los No—. No
      // es falta: sale de la cuenta y la nota se calcula con lo que sí se pudo
      // evaluar. En el desglose se muestra con crédito completo (sin falta).
      if (nivel === "no_aplica") {
        desglose.push({ criterio_id: c.id, peso, nivel, credito: 1 });
        continue;
      }
      // "no_cumple" vale cero siempre: el escalón solo afina un cumple o un
      // parcial. Si el modelo manda las dos cosas a la vez, gana el no_cumple.
      if (nivel === "no_cumple") {
        credito = 0;
      } else if (REGLAS_DE_ESCALERA.has(String(c.regla_id ?? "")) && typeof v.escalon === "number" && CREDITO_ESCALON[v.escalon] !== undefined) {
        escalon = v.escalon;
        credito = CREDITO_ESCALON[v.escalon];
      } else if (REGLAS_DE_ESCALERA.has(String(c.regla_id ?? "")) && nivel === "parcial") {
        credito = CREDITO_ESCALON[1]; // escalón bajo sin número explícito
      } else {
        credito = CREDITO[nivel] ?? 0;
      }
    }
    sumaPesos += peso;
    sumaCredito += peso * credito;
    const falta = v && typeof v.falta === "string" && v.falta.trim() && credito < 1 ? v.falta.trim().slice(0, 120) : undefined;
    desglose.push({ criterio_id: c.id, peso, nivel, ...(escalon ? { escalon } : {}), credito: Math.round(credito * 1000) / 1000, ...(falta ? { falta } : {}) });
  }
  // Si nada se pudo evaluar (todo "no_aplica"), no hay rúbrica: plan B.
  if (sumaPesos === 0) return vacio;
  const base = Math.round((100 * sumaCredito) / sumaPesos);

  // Restas: cada flag una sola vez; la severidad sale del guion, no del nombre.
  // Una falla "espejo" de un criterio (oct-2026, decisión de Emilio) no resta:
  // es no cumplir ese criterio, y el criterio ya lo cobró. Se sigue detectando
  // y mostrando. Una critical nunca es espejo: siempre topa.
  const severidadDe = new Map<string, string>();
  const espejos = new Set<string>();
  for (const f of Array.isArray(args.failureCriteria) ? args.failureCriteria : []) {
    if (f && typeof (f as any).id === "string") {
      severidadDe.set((f as any).id, String((f as any).severity ?? ""));
      if (esEspejo(f)) espejos.add((f as any).id);
    }
  }
  const flags = [...new Set((Array.isArray(args.flags) ? args.flags : []).filter((x): x is string => typeof x === "string"))];
  const restas: Resta[] = [];
  for (const f of flags) {
    const sev = severidadDe.get(f);
    if (espejos.has(f)) continue;
    if (sev === "major") restas.push({ flag: f, severidad: sev, puntos: RESTA_MAJOR });
    else if (sev === "minor") restas.push({ flag: f, severidad: sev, puntos: RESTA_MINOR });
  }
  let score = Math.max(0, base - restas.reduce((a, r) => a + r.puntos, 0));
  if (sumaCredito > 0 && score < PISO_INTENTO) score = PISO_INTENTO;

  const tope = aplicarTopeCritico(score, flags, args.failureCriteria);
  const cumplidos = desglose.filter((d) => d.credito >= 1).map((d) => d.criterio_id);
  return { valido: true, score: tope.score, base, desglose, restas, topado: tope.topado, criticos: tope.criticos, cumplidos, sin_veredicto };
}

// ─────────────────────────────────────────────────────────────────────
// Las fallas, a la vista (oct-2026).
//
// Disputa real (3.10): el evaluador marcó pitch_prematuro (critical), la nota
// quedó en 30, y la pantalla de resultados solo mostró una observación sobre
// la historia breve. El vendedor nunca supo qué le bajó la nota, y la réplica
// se inventó una explicación ("88 de calidad, 30 del sistema de progresión").
// Ahora cada falla detectada sale con lo que dijo el vendedor y cuánto costó,
// y la explicación de la nota la escribe el código, no el modelo.
// ─────────────────────────────────────────────────────────────────────

export interface Falla {
  id: string;
  severidad: Severidad;
  /** Si es espejo de un criterio: cuál. No restó aparte. */
  espejo_de?: string;
  /** Lo que cuesta, en palabras del vendedor. */
  efecto: string;
  /** Qué hizo, en una frase. */
  error: string;
  /** Lo que dijo, literal. */
  cita?: string;
  mejora?: string;
  ejemplo?: string;
}

const ORDEN_SEVERIDAD: Record<string, number> = { critical: 0, major: 1, minor: 2 };

export function efectoDe(sev: Severidad): string {
  if (sev === "critical") return `Falla crítica: deja tu nota en máximo ${TOPE_CRITICO}.`;
  if (sev === "major") return `Resta ${RESTA_MAJOR} puntos.`;
  return `Resta ${RESTA_MINOR} puntos.`;
}

const texto = (x: unknown, max = 400): string | undefined =>
  typeof x === "string" && x.trim() ? x.trim().slice(0, max) : undefined;

/**
 * Una falla por cada flag que existe en el guion, la más grave primero. El
 * modelo aporta la cita y la frase para el vendedor; si no las mandó, la falla
 * sale igual, con la primera frase de su descripción.
 */
export function fallasDe(flags: unknown, failureCriteria: unknown, evidencias: unknown): Falla[] {
  const porId = new Map<string, any>();
  for (const f of Array.isArray(failureCriteria) ? failureCriteria : []) {
    if (f && typeof (f as any).id === "string") porId.set((f as any).id, f);
  }
  const ev = new Map<string, any>();
  for (const e of Array.isArray(evidencias) ? evidencias : []) {
    if (e && typeof (e as any).id === "string" && !ev.has((e as any).id)) ev.set((e as any).id, e);
  }
  const ids = [...new Set((Array.isArray(flags) ? flags : []).filter((x): x is string => typeof x === "string"))];
  const fallas: Falla[] = [];
  for (const id of ids) {
    const f = porId.get(id);
    if (!f) continue;
    const sev = String(f.severity ?? "");
    if (sev !== "critical" && sev !== "major" && sev !== "minor") continue;
    const e = ev.get(id) ?? {};
    const primeraFrase = String(f.description ?? "").split(/(?<=[.!?])\s/)[0].trim();
    fallas.push({
      id,
      severidad: sev,
      efecto: esEspejo(f) ? "Por esto no cumpliste lo que mide este nodo (no resta aparte)." : efectoDe(sev),
      ...(esEspejo(f) ? { espejo_de: String(f.espejo_de) } : {}),
      error: texto(e.error, 300) ?? primeraFrase,
      ...(texto(e.cita) ? { cita: texto(e.cita) } : {}),
      ...(texto(e.mejora) ? { mejora: texto(e.mejora) } : {}),
      ...(texto(e.ejemplo) ? { ejemplo: texto(e.ejemplo) } : {}),
    });
  }
  return fallas.sort((a, b) => ORDEN_SEVERIDAD[a.severidad] - ORDEN_SEVERIDAD[b.severidad]);
}

const NIVEL_EN_PALABRAS: Record<string, string> = {
  cumple: "cumple", parcial: "a medias", no_cumple: "no cumple", no_aplica: "no aplicó (no cuenta)",
};

/**
 * Cómo se calculó la nota, paso por paso, con los números reales. Es la ÚNICA
 * explicación de la nota que la réplica puede dar.
 */
export function explicarNota(ev: {
  score?: unknown;
  desglose?: { base?: unknown; criterios?: unknown; restas?: unknown; topado?: unknown; criticos?: unknown } | null;
  fallas?: unknown;
}): string | null {
  const d = ev?.desglose;
  if (!d || typeof d !== "object" || typeof d.base !== "number" || typeof ev.score !== "number") return null;
  const criterios = Array.isArray(d.criterios) ? (d.criterios as LineaDesglose[]) : [];
  const restas = Array.isArray(d.restas) ? (d.restas as Resta[]) : [];
  const fallas = Array.isArray(ev.fallas) ? (ev.fallas as Falla[]) : [];
  const criticos = Array.isArray(d.criticos)
    ? (d.criticos as string[])
    : fallas.filter((f) => f.severidad === "critical").map((f) => f.id);
  const pesoTotal = criterios.filter((c) => c.nivel !== "no_aplica").reduce((a, c) => a + (c.peso || 0), 0) || 1;
  const lineas: string[] = [];
  lineas.push(`Nota final: ${ev.score}. No existe otra nota ni otra escala.`);
  lineas.push(`1) Criterios del nodo → base ${d.base} de 100:`);
  for (const c of criterios) {
    const pct = c.nivel === "no_aplica" ? "" : ` (vale ${Math.round((100 * (c.peso || 0)) / pesoTotal)}% de la base)`;
    lineas.push(`   · ${c.criterio_id}: ${NIVEL_EN_PALABRAS[c.nivel] ?? c.nivel}${pct}${c.falta ? ` — falta: ${c.falta}` : ""}`);
  }
  if (restas.length === 0) lineas.push("2) Restas: ninguna.");
  else {
    lineas.push("2) Restas:");
    for (const r of restas) lineas.push(`   · ${r.flag} (${r.severidad}): −${r.puntos}`);
  }
  const espejos = fallas.filter((f) => f.espejo_de);
  if (espejos.length > 0) {
    lineas.push(`   (No restaron aparte, porque ya contaron en su criterio: ${espejos.map((f) => `${f.id} → ${f.espejo_de}`).join(", ")}.)`);
  }
  if (d.topado === true && criticos.length > 0) {
    lineas.push(`3) Tope: hubo una falla crítica (${criticos.join(", ")}). Una falla crítica deja la nota en máximo ${TOPE_CRITICO}, por eso quedó en ${ev.score}.`);
  } else if (criticos.length > 0) {
    lineas.push(`3) Tope: hubo una falla crítica (${criticos.join(", ")}), que limita la nota a máximo ${TOPE_CRITICO}; la nota ya estaba en ese rango.`);
  } else {
    lineas.push("3) Tope: no hubo falla crítica.");
  }
  return lineas.join("\n");
}
