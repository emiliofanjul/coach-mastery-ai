// Mensaje 99 (17-oct-2026). En el 1.2 una apertura sin ninguna pregunta es
// falla crítica, pero el evaluador la marcaba 1 de cada 4 veces: la misma falta
// ya le bajaba la estructura y su regla de no cobrar dos veces le ganaba. Ahora
// el evaluador solo anota el HECHO por turno (¿hay pregunta y dónde?) y el
// código aplica la regla; el juez revisa la acusación con la prueba.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fallasPorHechoDePregunta, EVIDENCIA_SIN_PREGUNTA } from "../../../supabase/functions/_shared/hechos_pregunta";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const voz = leer("supabase/functions/closer-voice/index.ts");
const guion = { failure_criteria: [
  { id: "pitch_prematuro", regla_id: "opening.pitch_prematuro", severity: "critical" },
  { id: "sin_pregunta", regla_id: "opening.sin_pregunta", severity: "critical" },
] };
const turno = (n: number, pregunta: any, texto = "¡Buenos días, Don Ramón! Qué movido está hoy el taller.") =>
  ({ turno: n, texto_literal: texto, ultima_frase: texto, pregunta, veredicto: "no cumple", por_que: "x" });

describe("El código aplica la regla al hecho del primer turno", () => {
  it("apertura sin ninguna pregunta: agrega la falla con su evidencia", () => {
    const ev: any = { flags_detected: [], evidencia_flags: [], analisis_turnos: [turno(1, "ninguna")] };
    expect(fallasPorHechoDePregunta(ev, guion)).toEqual(["sin_pregunta"]);
    expect(ev.flags_detected).toEqual(["sin_pregunta"]);
    expect(ev.evidencia_flags[0]).toMatchObject({ id: "sin_pregunta", cita: "¡Buenos días, Don Ramón! Qué movido está hoy el taller.", ...EVIDENCIA_SIN_PREGUNTA });
  });
  it("pregunta en medio o al final: no agrega nada (la estructura mide dónde va)", () => {
    for (const p of ["en_medio", "al_final"]) {
      const ev: any = { flags_detected: [], analisis_turnos: [turno(1, p)] };
      expect(fallasPorHechoDePregunta(ev, guion)).toEqual([]);
      expect(ev.flags_detected).toEqual([]);
    }
  });
  it("solo cuenta el primer turno: un turno posterior sin pregunta no resta en la introducción", () => {
    const ev: any = { flags_detected: [], analisis_turnos: [turno(2, "ninguna"), turno(1, "en_medio")] };
    expect(fallasPorHechoDePregunta(ev, guion)).toEqual([]);
  });
  it("si el evaluador ya la marcó, no la duplica", () => {
    const ev: any = { flags_detected: ["sin_pregunta"], evidencia_flags: [{ id: "sin_pregunta", cita: "c" }], analisis_turnos: [turno(1, "ninguna")] };
    expect(fallasPorHechoDePregunta(ev, guion)).toEqual([]);
    expect(ev.flags_detected).toEqual(["sin_pregunta"]);
    expect(ev.evidencia_flags).toHaveLength(1);
  });
  it("falla abierta: si algún turno no trae el hecho, no hace nada", () => {
    const ev: any = { flags_detected: [], analisis_turnos: [turno(1, "ninguna"), turno(2, undefined)] };
    expect(fallasPorHechoDePregunta(ev, guion)).toEqual([]);
  });
  it("solo en los nodos cuya falla está ligada a opening.sin_pregunta", () => {
    const ev: any = { flags_detected: [], analisis_turnos: [turno(1, "ninguna")] };
    expect(fallasPorHechoDePregunta(ev, { failure_criteria: [{ id: "pitch_prematuro", regla_id: "opening.pitch_prematuro" }] })).toEqual([]);
  });
});

describe("En el evaluador", () => {
  it("pide el hecho por turno, como hecho y no como juicio", () => {
    expect(voz).toContain('"pregunta": "<al_final | en_medio | ninguna>",');
    expect(voz).toContain('"pregunta" es un HECHO de lo que dijo, no un juicio');
  });
  it("se aplica después del guardarraíl y antes del juez, que revisa la acusación", () => {
    const hecho = voz.indexOf("const fallasPorHecho = fallasPorHechoDePregunta(evaluation, practice_script);");
    expect(hecho).toBeGreaterThan(voz.indexOf("const todosCumplen ="));
    expect(hecho).toBeLessThan(voz.indexOf("const acusaciones = acusacionesConPrueba(evaluation, practice_script"));
    expect(voz).toMatch(/const PROMPT_VERSION = "v2\.9\.[2-9]"/);
  });
  it("en la respuesta solo va el conteo, no el id", () => {
    expect(voz).toContain("fallas_por_hecho: fallasPorHecho.length");
  });
});
