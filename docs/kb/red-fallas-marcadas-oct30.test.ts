// Mensaje 111 (30-oct-2026). El G54 (convicción sin garantía) salió con 100 y
// sin fallas, pero la red lo reprobó: buscaba el id «garantiza» en TODO el
// texto, y el evaluador citó bien la frase del vendedor «no le puedo garantizar
// nada…». Una falla es lo que la evaluación MARCÓ, no una palabra en el texto.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const red = leer("supabase/functions/harness-runner/index.ts");
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));

describe("La red revisa las fallas marcadas, no el texto", () => {
  it("must_flag y must_not_flag contra flags_detected y fallas", () => {
    expect(red).toContain("const marcadas = new Set<string>([");
    expect(red).toContain("if (!marcadas.has(String(flag).toLowerCase())) {");
    expect(red).toContain("if (marcadas.has(String(flag).toLowerCase())) {");
    expect(red).toContain("reasons.push(`forbidden flag present: ${flag}`);");
  });
  it("must_not_flag ya no se busca como texto", () => {
    expect(red).toContain("const forbidLists = [exp.must_not_contain, exp.feedback_must_not_contain, exp.must_not_include_in_response];");
    expect(red).not.toMatch(/forbidLists = \[exp\.must_not_flag/);
  });
  it("cada falla que un caso pide o prohíbe existe en su nodo", () => {
    const malos: string[] = [];
    for (const c of harness.cases) {
      const ps = nodos.find((n) => n.id === c.node_id)?.practice_script;
      if (!ps) continue;
      const ids = new Set(ps.failure_criteria.map((f: any) => f.id));
      for (const k of ["must_flag", "must_not_flag"]) for (const f of c.expected?.[k] ?? []) if (!ids.has(f)) malos.push(`${c.id} ${k}: ${f}`);
    }
    expect(malos).toEqual([]);
  });
  it("v3.27.0", () => {
    expect(harness.harness_version).toBe("v3.27.0");
    expect(harness.cases.find((c: any) => c.id === "G54_conviccion_sin_garantia").expected.must_not_flag).toContain("garantiza");
  });
});
