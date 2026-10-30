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
  it("G40: una apertura sin ninguna pregunta sí marca la falla, y la nota queda en máximo 30", () => {
    expect(caso("G40_apertura_sin_pregunta").expected.must_flag).toEqual(["sin_pregunta"]);
    expect(caso("G40_apertura_sin_pregunta").expected.score_range).toEqual([0, 30]);
    expect(harness.harness_version).toMatch(/^v3\.(19|[2-9]\d)\./);
  });
});

// Mensaje 98 (17-oct-2026, Emilio): en el 1.2 la lección entera es «Tu primera
// frase… terminas con una pregunta». Si no pregunta nada, no aprendió el nodo:
// es falla crítica (tope de 30) y lo repite. No es un cobro doble: las critical
// son la regla del nodo, igual que meter producto en la misma apertura.
describe("En el 1.2, una apertura sin ninguna pregunta es crítica", () => {
  const f = nodos.find((n) => n.id === "1.2").practice_script.failure_criteria.find((x: any) => x.id === "sin_pregunta");
  it("es critical, declarada con su razón, y la regla sigue siendo major en general", () => {
    expect(f.severity).toBe("critical");
    expect(f.severity_override.default).toBe("major");
    expect(f.severity_override.razon).toContain("Tu primera frase");
    expect(r.severidad_sugerida).toBe("major");
  });
  it("no es espejo: las critical siempre topan", () => {
    expect(f.espejo_de).toBeUndefined();
  });
  it("versión del guion", () => {
    const [a, b, c] = nodos.find((n) => n.id === "1.2").practice_script.version.split(".").map(Number);
    expect(a * 10000 + b * 100 + c).toBeGreaterThanOrEqual(20002); // al menos 2.0.2: los guiones siguen subiendo
  });
  it("preguntar en medio sigue siendo parcial en la estructura, sin tope (G09)", () => {
    expect(caso("G09_scope_cubierto_corte_temprano").expected.must_not_flag).toContain("sin_pregunta");
    expect(caso("G09_scope_cubierto_corte_temprano").expected.score_range).toEqual([75, 100]);
  });
});
