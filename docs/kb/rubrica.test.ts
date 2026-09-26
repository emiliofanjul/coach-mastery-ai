// La rúbrica, probada EJECUTÁNDOLA. Mismas decisiones = misma nota, siempre.
import { describe, it, expect } from "vitest";
import { calcularScore, RESTA_MAJOR, RESTA_MINOR, PISO_INTENTO } from "../../../supabase/functions/_shared/puntuacion";

// Criterios reales del nodo 1.2 (apertura)
const exito12 = [
  { id: "opening.estructura_apertura", weight: 0.4, regla_id: "opening.ice_breaker" },
  { id: "opening.personalizacion", weight: 0.4, regla_id: "opening.especificidad" },
  { id: "opening.curiosidad_abierta", weight: 0.2, regla_id: "opening.curiosidad_abierta" },
];
const fallas12 = [
  { id: "pitch_prematuro", severity: "critical" },
  { id: "pregunta_cerrada", severity: "major" },
  { id: "sin_pregunta", severity: "major" },
  { id: "desvio_leve", severity: "minor" },
];
const v = (id: string, nivel: string, escalon?: number) => ({ criterio_id: id, nivel, ...(escalon ? { escalon } : {}) });
const todo = (nivel = "cumple") => exito12.map((c) => v(c.id, nivel, c.regla_id === "opening.especificidad" ? 2 : undefined));

describe("La rúbrica suma lo que el modelo decidió", () => {
  it("todo cumplido, sin errores → 100", () => {
    const r = calcularScore({ veredictos: todo(), successCriteria: exito12, flags: [], failureCriteria: fallas12 });
    expect(r).toMatchObject({ valido: true, base: 100, score: 100 });
    expect(r.cumplidos).toEqual(exito12.map((c) => c.id));
  });

  it("G04: estructura a medias, personalización en escalón 1, curiosidad cumplida → 53", () => {
    const r = calcularScore({
      veredictos: [v("opening.estructura_apertura", "parcial"), v("opening.personalizacion", "parcial", 1), v("opening.curiosidad_abierta", "cumple")],
      successCriteria: exito12, flags: [], failureCriteria: fallas12,
    });
    // 0.4·0.5 + 0.4·(1/3) + 0.2·1 = 0.533…
    expect(r.base).toBe(53);
    expect(r.cumplidos).toEqual(["opening.curiosidad_abierta"]);
  });

  it("escalón 2 acredita completo; escalón 1 un tercio", () => {
    const e2 = calcularScore({ veredictos: [v("opening.personalizacion", "cumple", 2)], successCriteria: exito12, flags: [], failureCriteria: fallas12 });
    const e1 = calcularScore({ veredictos: [v("opening.personalizacion", "parcial", 1)], successCriteria: exito12, flags: [], failureCriteria: fallas12 });
    expect(e2.desglose.find((d) => d.criterio_id === "opening.personalizacion")?.credito).toBe(1);
    expect(e1.desglose.find((d) => d.criterio_id === "opening.personalizacion")?.credito).toBeCloseTo(1 / 3, 2);
  });

  it("parcial vale la mitad en criterios que no son escalera", () => {
    const r = calcularScore({ veredictos: [v("opening.estructura_apertura", "parcial")], successCriteria: exito12, flags: [], failureCriteria: fallas12 });
    expect(r.desglose[0].credito).toBe(0.5);
  });
});

describe("Restas fijas", () => {
  it(`un error major resta ${RESTA_MAJOR}`, () => {
    const r = calcularScore({ veredictos: todo(), successCriteria: exito12, flags: ["pregunta_cerrada"], failureCriteria: fallas12 });
    expect(r.score).toBe(100 - RESTA_MAJOR);
  });
  it(`un error minor resta ${RESTA_MINOR}`, () => {
    const r = calcularScore({ veredictos: todo(), successCriteria: exito12, flags: ["desvio_leve"], failureCriteria: fallas12 });
    expect(r.score).toBe(100 - RESTA_MINOR);
  });
  it("el mismo error repetido resta una sola vez", () => {
    const r = calcularScore({ veredictos: todo(), successCriteria: exito12, flags: ["pregunta_cerrada", "pregunta_cerrada"], failureCriteria: fallas12 });
    expect(r.restas).toHaveLength(1);
  });
  it("un error critical deja el score en máximo 30", () => {
    const r = calcularScore({ veredictos: todo(), successCriteria: exito12, flags: ["pitch_prematuro"], failureCriteria: fallas12 });
    expect(r).toMatchObject({ score: 30, topado: true, criticos: ["pitch_prematuro"] });
  });
  it("un flag que no existe en el guion no resta nada", () => {
    const r = calcularScore({ veredictos: todo(), successCriteria: exito12, flags: ["inventado"], failureCriteria: fallas12 });
    expect(r.score).toBe(100);
  });
});

describe("Pisos y casos borde", () => {
  it(`un intento con algo acreditado no baja de ${PISO_INTENTO}`, () => {
    const r = calcularScore({
      veredictos: [v("opening.curiosidad_abierta", "parcial")], successCriteria: exito12,
      flags: ["pregunta_cerrada", "sin_pregunta"], failureCriteria: fallas12,
    });
    expect(r.score).toBe(PISO_INTENTO);
  });
  it("sin nada acreditado puede quedar en 0 (aunque el modelo mande un escalón contradictorio)", () => {
    const r = calcularScore({ veredictos: todo("no_cumple"), successCriteria: exito12, flags: ["pregunta_cerrada"], failureCriteria: fallas12 });
    expect(r.score).toBe(0);
  });
  it("un criterio sin veredicto cuenta como no cumplido y se reporta", () => {
    const r = calcularScore({
      veredictos: [v("opening.estructura_apertura", "cumple"), v("opening.personalizacion", "cumple", 2)],
      successCriteria: exito12, flags: [], failureCriteria: fallas12,
    });
    expect(r.base).toBe(80);
    expect(r.sin_veredicto).toEqual(["opening.curiosidad_abierta"]);
  });
  it("los criterios que requieren audio no cuentan y los pesos se renormalizan", () => {
    const conAudio = [...exito12, { id: "opening.sonrisa_audible", weight: 0.5, requires_audio: true }];
    const r = calcularScore({ veredictos: todo(), successCriteria: conAudio, flags: [], failureCriteria: fallas12 });
    expect(r.base).toBe(100);
    expect(r.desglose.map((d) => d.criterio_id)).not.toContain("opening.sonrisa_audible");
  });
  it("sin veredictos utilizables no hay rúbrica: el llamador usa su plan B", () => {
    expect(calcularScore({ veredictos: undefined, successCriteria: exito12, flags: [], failureCriteria: fallas12 }).valido).toBe(false);
    expect(calcularScore({ veredictos: [{ criterio_id: "otro", nivel: "cumple" }], successCriteria: exito12, flags: [], failureCriteria: fallas12 }).valido).toBe(false);
  });
});

describe("La promesa: mismas decisiones, misma nota", () => {
  it("cien ejecuciones con los mismos veredictos dan exactamente la misma nota", () => {
    const entrada = { veredictos: [v("opening.estructura_apertura", "parcial"), v("opening.personalizacion", "cumple", 2), v("opening.curiosidad_abierta", "cumple")], successCriteria: exito12, flags: ["desvio_leve"], failureCriteria: fallas12 };
    const notas = new Set(Array.from({ length: 100 }, () => calcularScore(entrada).score));
    expect(notas.size).toBe(1);
  });
});
