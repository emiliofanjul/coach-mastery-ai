// Mensaje 97 (17-oct-2026, Emilio). Cada turno del vendedor termina con
// pregunta: si termina en comentario, el cliente se queda con el control. Pero
// eso se ENSEÑA en el 2.2 («cada vez que hablas, terminas con una pregunta»), y
// no se califica lo que todavía no se enseñó. En el 1.2 solo se enseñó que la
// primera frase termina con pregunta: ahí la falla mide la apertura.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => JSON.parse(readFileSync(join(process.cwd(), p), "utf8"));
const reglas: any[] = leer("docs/kb/reglas.json");
const cards: any[] = leer("docs/kb/cards_snapshot.json");
const nodos: any[] = leer("docs/kb/nodos_snapshot.json");
const harness = leer("supabase/functions/_shared/eval_harness_v1.json");
const caso = (id: string) => harness.cases.find((c: any) => c.id === id);
const r = reglas.find((x) => x.id === "opening.sin_pregunta");

describe("sin_pregunta en la introducción mide la apertura", () => {
  it("la prueba dice qué turno cuenta", () => {
    expect(r.resumen).toContain("LA PRUEBA: en su apertura —su primer turno, antes de que el cliente le conteste—");
  });
  it("conserva lo de antes: una pregunta de cortesía cuenta; la calidad y el lugar se miden en otros criterios", () => {
    expect(r.resumen).toContain("aunque sea de cortesía como «¿cómo está?» o dicha sin signos");
    expect(r.resumen).toContain("la calidad de la pregunta se mide en la escalera de la especificidad, y si va al final, en la estructura de la apertura");
    expect(r.cita_cerebro).toBe("sin ninguna pregunta, el cliente no tiene qué contestar y la conversación se muere ahí");
  });
});

describe("No se califica lo que no se ha enseñado", () => {
  it("la regla dice dónde se enseña que cada turno termina con pregunta, y que antes solo se aconseja", () => {
    expect(r.resumen).toContain("Que CADA turno termine con pregunta se enseña en la historia breve (2.2)");
    expect(r.resumen).toContain("se le aconseja sin restar");
  });
  it("la tarjeta del 2.2 lo enseña, y el 2.2 lo califica", () => {
    expect(cards.some((c) => c.node_id === "2.2" && c.body.includes("cada vez que hablas, terminas con una pregunta"))).toBe(true);
    expect(nodos.find((n) => n.id === "2.2").practice_script.failure_criteria.some((f: any) => f.id === "turno_sin_pregunta")).toBe(true);
  });
  it("el 1.2 solo enseña que la primera frase termina con pregunta", () => {
    expect(cards.find((c) => c.node_id === "1.2" && c.card_order === 1).body).toContain("Terminas con una pregunta sobre eso");
  });
});

describe("La red, en los dos sentidos", () => {
  it("G09: el tercer turno sin pregunta no resta en el 1.2", () => {
    const e = caso("G09_scope_cubierto_corte_temprano").expected;
    expect(e.must_not_flag).toEqual(["pitch_prematuro", "sin_pregunta"]);
    expect(e.score_range).toEqual([75, 100]);
  });
  it("G40: una apertura sin ninguna pregunta sí marca la falla", () => {
    expect(caso("G40_apertura_sin_pregunta").expected.must_flag).toEqual(["sin_pregunta"]);
    expect(harness.harness_version).toBe("v3.19.0");
  });
});
