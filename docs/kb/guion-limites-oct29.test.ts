// Mensaje 109 (29-oct-2026). En el 104 se agregó «insistir tras dos no» a los
// bosses con bloqueo de entrada. El 5.15, el 7.0 y el 7.4 llegaron a 9 fallas,
// el schema decía máximo 8, y desde entonces esas tres prácticas respondían
// «Este nodo tiene un error de configuración». Ninguna prueba lo vio: la del
// contrato revisaba los campos de cada criterio, pero no los LÍMITES del
// schema. Ahora cada límite del schema (maxItems y minItems) se revisa en
// todos los nodos, y el de fallas va por tipo de nodo, como skills_in_focus.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const schema = JSON.parse(leer("supabase/functions/_shared/practice_script_schema_v1.json"));
const validador = leer("supabase/functions/_shared/validate_practice_script.ts");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const conScript = nodos.filter((n) => n.practice_script).map((n) => ({ ...n, ps: typeof n.practice_script === "string" ? JSON.parse(n.practice_script) : n.practice_script }));

/** Todas las listas con límite en el schema: [ruta, minItems, maxItems]. */
function limites(def: any, ruta: string[] = []): [string[], number | undefined, number | undefined][] {
  const out: [string[], number | undefined, number | undefined][] = [];
  for (const [k, v] of Object.entries<any>(def?.properties ?? {})) {
    if (v?.type === "array" && (v.maxItems !== undefined || v.minItems !== undefined)) out.push([[...ruta, k], v.minItems, v.maxItems]);
    if (v?.type === "object") out.push(...limites(v, [...ruta, k]));
  }
  return out;
}
const en = (o: any, ruta: string[]) => ruta.reduce((x, k) => (x == null ? x : x[k]), o);

describe("Cada límite del schema se cumple en todos los nodos", () => {
  const lista = limites(schema);
  it("el schema tiene límites que revisar", () => {
    expect(lista.map(([r]) => r.join("."))).toEqual(expect.arrayContaining(["success_criteria", "failure_criteria", "scope.skills_in_focus"]));
  });
  it("ningún nodo se pasa ni se queda corto", () => {
    const malos: string[] = [];
    for (const n of conScript) {
      for (const [ruta, min, max] of lista) {
        const v = en(n.ps, ruta);
        if (!Array.isArray(v)) continue;
        if (max !== undefined && v.length > max) malos.push(`${n.id}: ${ruta.join(".")} tiene ${v.length} > ${max}`);
        if (min !== undefined && v.length < min) malos.push(`${n.id}: ${ruta.join(".")} tiene ${v.length} < ${min}`);
      }
    }
    expect(malos).toEqual([]);
  });
});

describe("Fallas: hasta 10 en boss, 8 en los demás", () => {
  it("el schema permite 10 y el validador baja a 8 si no es boss", () => {
    expect(schema.properties.failure_criteria.maxItems).toBe(10);
    expect(validador).toContain('const max = nodeType === "boss" ? 10 : 8;');
    expect(validador).toContain("const ff = validateFailureCriteriaLimit(script, nodeType);");
  });
  it("ningún nodo se pasa de su límite", () => {
    const malos = conScript.filter((n) => (n.ps.failure_criteria ?? []).length > (n.node_type === "boss" ? 10 : 8)).map((n) => `${n.id} (${n.node_type}): ${n.ps.failure_criteria.length}`);
    expect(malos).toEqual([]);
  });
  it("el 5.15, el 7.0 y el 7.4 son boss y caben con sus 9 fallas", () => {
    for (const id of ["5.15", "7.0", "7.4"]) {
      const n = conScript.find((x) => x.id === id);
      expect(n.node_type).toBe("boss");
      expect(n.ps.failure_criteria).toHaveLength(9);
      expect(n.ps.failure_criteria.some((f: any) => f.id === "insiste_tras_dos")).toBe(true);
    }
  });
});
