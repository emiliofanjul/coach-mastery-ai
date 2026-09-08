// El Director y el evaluador miden lo mismo.
//
// Sept-2026: el Director decidía cortar comparando el transcript contra el
// objetivo EN PROSA del nodo. En el 3.6 esa prosa pide "dejar sembrado el
// momento en que se libere" y ningún criterio de éxito lo mide — así que una
// vez cortó antes de tiempo y otra no cortó a tiempo. Ahora juzga cobertura
// contra los mismos criterios que el evaluador va a calificar.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = readFileSync(join(process.cwd(), "supabase/functions/director/index.ts"), "utf8");
const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");

describe("Director: cobertura contra criterios, no contra prosa", () => {
  it("declara que los criterios mandan sobre el objetivo", () => {
    expect(dir).toMatch(/LOS CRITERIOS MANDAN/);
    expect(dir).toMatch(/Si el objetivo pide algo que ningún criterio mide, ESO NO CUENTA/);
  });

  it("recibe los criterios de éxito del nodo", () => {
    expect(dir).toMatch(/CRITERIOS DE ÉXITO DEL NODO/);
    expect(dir).toMatch(/runClassifier\(\s*objective: string,\s*criterios: string,/);
  });

  it("exige todos los elementos cuando un criterio los enumera", () => {
    expect(dir).toMatch(/scope_covered = true solo cuando TODOS aparecen/);
  });

  it("no exige un orden que los criterios no nombren", () => {
    expect(dir).toMatch(/No exijas un ORDEN que los criterios no nombren/);
  });
});

describe("Evaluador: tampoco hay orden obligatorio", () => {
  it("declara las dos rutas igual de válidas", () => {
    expect(fn).toMatch(/TAMPOCO HAY ORDEN OBLIGATORIO/);
    expect(fn).toMatch(/son las dos igual de válidas SIEMPRE/);
  });

  it("prohíbe observaciones de secuencia no pedida y bajar la base por ellas", () => {
    expect(fn).toMatch(/PROHIBIDO escribir observaciones del tipo "antes de X debiste Y"/);
    expect(fn).toMatch(/Un orden que el criterio no nombra NO puede bajar la base/);
  });

  it("un corte a mitad de recorrido no es omisión del vendedor", () => {
    expect(fn).toMatch(/es transcript que no existe/);
  });
});
