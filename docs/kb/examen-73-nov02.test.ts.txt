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
    // Mensaje 135 (Emilio, 5-nov): el argumento sale de las balas de producto, servicio o precio;
    // «un proveedor menos» solo cuando el cliente deja ver que le pesa tratar con tantos.
    expect(d).toContain("una bala de producto, servicio o precio que le sube el valor o le baja el costo");
    expect(d).toContain("«Un proveedor menos» solo si el cliente dejó ver que le pesa tratar con tantos proveedores; nunca para una familia que no maneja.");
    expect(d).not.toMatch(/con el argumento de consolidacion/);
  });
  it("el cliente simulado no se convence con «menos proveedores» para lo que no maneja", () => {
    expect(ps.phases.you_do.prompt).toContain("Para la familia que no manejas, menos proveedores nunca te convence: no te reduce nada.");
    // Y para la que ya le compra a otro, depende: a veces le pesa tener tantos, a veces prefiere tener dos.
    expect(ps.phases.you_do.prompt).toContain("(b) prefieres tener dos proveedores para lo mismo, por si uno te falla");
    expect(ps.phases.you_do.prompt).not.toContain("SI TE HABLA DE CONSOLIDAR: te interesa de verdad");
  });
  it("el cierre de la visita sigue la regla del REHASH (mensaje 120)", () => {
    expect(crit("consolidation.rehash").description).toContain("deja puesta la siguiente visita");
  });
  it("hay un caso en la red (desde la v3.33.0)", () => {
    expect(harness.cases.find((c: any) => c.id === "G104_argumento_segun_el_caso")).toBeDefined();
  });
});
