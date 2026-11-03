// Mensaje 122 (2-nov-2026) · El examen 7.3: el argumento del hueco depende del caso.
// Cerebro 4.3: «La consolidación NO es un argumento universal». El 7.3 pedía
// presentar el hueco «con el argumento de consolidación», y el cliente simulado
// se interesaba con solo oír «consolidar», aun para una familia que no maneja.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const ps = nodos.find((n) => n.id === "7.3").practice_script;
const crit = (id: string) => [...ps.success_criteria, ...ps.failure_criteria].find((c: any) => c.id === id);

describe("El 7.3 sigue al Cerebro 4.3", () => {
  it("el Cerebro lo dice", () => {
    expect(cerebro).toContain("**La consolidación NO es un argumento universal.**");
  });
  it("el criterio pide el argumento de SU caso, no la consolidación siempre", () => {
    const d = crit("presentation.consolidacion_proveedor").description;
    expect(d).toContain("un argumento que corresponde a SU caso");
    expect(d).toContain("Consolidacion solo si de verdad le reduce proveedores");
    expect(d).not.toMatch(/con el argumento de consolidacion/);
  });
  it("el cliente simulado no se convence con «menos proveedores» para lo que no maneja", () => {
    expect(ps.phases.you_do.prompt).toContain("Si para la familia que no manejas te dice que asi tendras menos proveedores, no te convence");
    expect(ps.phases.you_do.prompt).not.toContain("SI TE HABLA DE CONSOLIDAR: te interesa de verdad");
  });
  it("el cierre de la visita sigue la regla del REHASH (mensaje 120)", () => {
    expect(crit("consolidation.rehash").description).toContain("deja puesta la siguiente visita");
  });
  it("hay un caso en la red (desde la v3.33.0)", () => {
    expect(harness.cases.find((c: any) => c.id === "G104_argumento_segun_el_caso")).toBeDefined();
  });
});
