// Mensaje 102 (20-oct-2026, Emilio): «le dieron una pista y no siguió
// descubriéndola… si ya se le enseñó qué hacer con eso, está mal y se debe
// castigar». Qué hacer con una respuesta vaga se enseña en el 3.2 (dar
// opciones) y las herramientas del hueco en el 3.7: la visita de trámite se
// califica desde el 3.8, con su prueba.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => JSON.parse(readFileSync(join(process.cwd(), p), "utf8"));
const reglas: any[] = leer("docs/kb/reglas.json");
const nodos: any[] = leer("docs/kb/nodos_snapshot.json");
const cards: any[] = leer("docs/kb/cards_snapshot.json");
const harness = leer("supabase/functions/_shared/eval_harness_v1.json");
const r = reglas.find((x) => x.id === "develop.visita_tramite");
const caso = (id: string) => harness.cases.find((c: any) => c.id === id);
const orden = (id: string) => { const [m, n] = id.split("."); return Number(m) * 100 + parseFloat(n.replace("b", ".5")); };

describe("La visita de trámite es una prueba", () => {
  it("trae su prueba: irse sin descubrir ni intentarlo de verdad", () => {
    expect(r.resumen).toContain("LA PRUEBA: ¿el vendedor se fue con el pedido sin haber descubierto algo más y sin haberlo intentado de verdad?");
    expect(r.resumen).toContain("Una sola pregunta al aire y despedirse después de una respuesta vaga es trámite.");
    expect(r.resumen).toContain("Si descubrió algo más, o lo intentó así, no es esto.");
  });
  it("lo que pide ya se enseñó antes del primer nodo que la califica", () => {
    const usan = nodos.filter((n) => (n.practice_script?.failure_criteria ?? []).some((f: any) => f.regla_id === "develop.visita_tramite")).map((n) => n.id);
    expect(usan.sort()).toEqual(["3.8", "3.9", "3.9b", "7.3"]);
    const primero = Math.min(...usan.map(orden));
    const enseña = (nodo: string, titulo: string) => cards.some((c) => c.node_id === nodo && (c.title ?? "").includes(titulo));
    expect(enseña("3.2", "sugiere opciones")).toBe(true);
    expect(enseña("3.7", "Las tres herramientas del hueco")).toBe(true);
    expect(orden("3.2")).toBeLessThan(primero);
    expect(orden("3.7")).toBeLessThan(primero);
  });
});

describe("La red, en los dos sentidos", () => {
  it("G41: pregunta al aire y se va tras una respuesta vaga → trámite", () => {
    expect(caso("G41_pregunta_sin_hueco").expected.must_flag).toEqual(["solo_levanta_pedido"]);
  });
  it("G42: sigue con opciones y otra herramienta; no hay hueco, pero no es trámite", () => {
    expect(caso("G42_intenta_de_verdad_sin_hueco").expected.must_not_flag).toEqual(["solo_levanta_pedido", "hueco_inventado"]);
  });
  it("G32: exploró y descubrió → no es trámite", () => {
    expect(caso("G32_mapeo_con_pregunta_abierta").expected.must_not_flag).toEqual(["solo_levanta_pedido"]);
    expect(harness.harness_version).toMatch(/^v3\.(2[2-9]|[3-9]\d)\./);
  });
});
