// Mensaje 101 (20-oct-2026, Emilio): «el hueco se descubre y se debe apuntar
// mentalmente, para luego usarlo en la presentación; cuando se descubre no es
// necesario mencionarlo». El criterio decía «identifica y NOMBRA», y el
// evaluador lo leía como señalárselo al cliente: eso es presentar el hueco
// (Cerebro 4.3, paso 4) y no se enseña en el Mundo 3.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const r = reglas.find((x) => x.id === "discovery.hueco");
const crit = (n: string) => nodos.find((x) => x.id === n).practice_script.success_criteria.find((c: any) => c.id === "discovery.hueco");
const caso = (id: string) => harness.cases.find((c: any) => c.id === id);

describe("La regla del hueco es una prueba: descubrirlo, no presentarlo", () => {
  it("trae su prueba", () => {
    expect(r.resumen).toContain("LA PRUEBA: al terminar la plática, ¿quedó al descubierto al menos un hueco concreto —una familia con nombre—");
    expect(r.resumen).toContain("Si sí, cumple, aunque el vendedor no lo mencione: el hueco se descubre y se apunta para usarlo en la presentación.");
  });
  it("preguntar sin que salga una familia concreta no basta, y tiene que ser real", () => {
    expect(r.resumen).toContain("No basta con preguntar si la respuesta no dejó ninguna familia concreta.");
    expect(r.resumen).toContain("Tiene que ser real y verificable");
  });
  it("ofrecerlo es presentar el hueco, que es el paso 4 del Cerebro", () => {
    expect(r.resumen).toContain("eso es presentar el hueco (paso 4)");
    expect(cerebro).toContain("## 4.3 Presentar un hueco");
    expect(r.resumen).not.toContain("Identificarlo es nombrarlo");
  });
  it("ningún nodo pide «nombrarlo»", () => {
    for (const id of ["3.8", "3.9", "3.9b", "7.3"]) {
      expect(crit(id).description).not.toMatch(/nombra/i);
      expect(crit(id).description).toMatch(/^Descubre al menos un hueco concreto/);
    }
  });
  it("versiones", () => {
    expect(["3.8", "3.9", "3.9b", "7.3"].map((id) => nodos.find((n) => n.id === id).practice_script.version)).toEqual(["2.0.1", "2.0.2", "1.0.2", "2.0.1"]);
  });
});

describe("La red lo prueba en los dos sentidos", () => {
  it("G32: el cliente dijo qué trae con otro proveedor → cumple", () => {
    expect(caso("G32_mapeo_con_pregunta_abierta").expected.niveles_esperados["discovery.hueco"]).toBe("cumple");
  });
  it("G41: pregunta, pero no sale ninguna familia → no cumple", () => {
    expect(caso("G41_pregunta_sin_hueco").expected.niveles_esperados).toEqual({ "discovery.hueco": "no_cumple" });
    expect(harness.harness_version).toBe("v3.21.0");
  });
  it("la red devuelve la cuenta de la nota de cada caso", () => {
    const red = leer("supabase/functions/harness-runner/index.ts");
    expect(red).toContain('base: typeof parsed?.desglose?.base === "number" ? parsed.desglose.base : null,');
  });
});
