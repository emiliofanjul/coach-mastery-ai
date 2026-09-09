// Una ejecución perfecta debe poder terminar sin observaciones.
//
// Sept-2026: tras cerrarle el alcance al evaluador (solo descuenta por lo que
// el nodo mide), una práctica impecable en un nodo corto devolvió
// observations: []. El cliente exigía al menos una y descartó cuatro
// evaluaciones válidas: "Sin análisis todavía". La suposición vieja era que
// siempre hay algo que criticar.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");
const ui = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.practica.tsx"), "utf8");

describe("Cero observaciones es un resultado válido", () => {
  it("el prompt permite de 0 a 3 y pide [] cuando todo se cumplió", () => {
    expect(fn).toMatch(/Cantidad de observations: de 0 a 3/);
    expect(fn).toMatch(/devuelve observations: \[\]/);
  });

  it("con cero observaciones la misión consolida en vez de corregir", () => {
    expect(fn).toMatch(/la "mision" no corrige: consolida/);
  });

  it("el cliente NO exige observations.length > 0", () => {
    expect(ui).not.toMatch(/evaluation\.observations\.length > 0/);
  });

  it("la pantalla reconoce la ejecución limpia en vez de pintarla como error", () => {
    expect(ui).toMatch(/Ejecución limpia/);
    expect(ui).toMatch(/No hay nada que corregir aquí/);
    expect(ui).not.toMatch(/No se pudo generar el feedback de esta sesión/);
  });
});
