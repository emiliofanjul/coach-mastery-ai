// El score sale SOLO de los criterios del nodo.
//
// Sept-2026, nodo 3.6 "Leer el No": el vendedor cumplió los dos criterios
// (distinguir rojo de amarrado, e investigar los límites de la restricción:
// qué cubre, qué queda fuera, hasta cuándo dura) y aun así perdió 10 puntos
// porque el evaluador estiró "preguntas por capas" hasta la capa 3 del
// Cerebro — doctrina válida, pero de otro nodo.
//
// La observación era buena. Lo que estaba mal era que costara puntos.
// Ahora ese material va a "siguiente_nivel", que no puntúa.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");
const ui = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.practica.tsx"), "utf8");

describe("Evaluador: alcance cerrado del criterio", () => {
  it("declara que la descripción del criterio es su alcance completo", () => {
    expect(fn).toMatch(/ALCANCE CERRADO DEL CRITERIO/);
    expect(fn).toMatch(/define su alcance COMPLETO/);
  });

  it("prohíbe extender un criterio a doctrina de otros nodos", () => {
    expect(fn).toMatch(/PROHIBIDO extender un criterio hasta doctrina de otros nodos/);
  });

  it("acota el score a los criterios del nodo y sus flags", () => {
    expect(fn).toMatch(/El score sale ÚNICAMENTE de los success_criteria del nodo y de sus flags/);
  });

  it("usa los campos de la regla para delimitar, no para ampliar", () => {
    expect(fn).toMatch(/regla_resumen/);
    expect(fn).toMatch(/cita_cerebro/);
    expect(fn).toMatch(/delimitan el alcance — no lo amplían/);
  });
});

describe("Canal 'siguiente_nivel': coaching que no castiga", () => {
  it("existe en el contrato de respuesta y en los tipos", () => {
    expect(fn).toMatch(/"siguiente_nivel":/);
    expect(fn).toMatch(/interface SiguienteNivel/);
    expect(fn).toMatch(/siguiente_nivel: SiguienteNivel\[\]/);
  });

  it("está declarado como ajeno al score, a observations y a la misión", () => {
    expect(fn).toMatch(/JAMÁS afecta el score/);
    expect(fn).toMatch(/JAMÁS va en observations ni en flags_detected ni en la mision/);
  });

  it("se sanea en el servidor y se limita a 2", () => {
    expect(fn).toMatch(/rawSiguiente/);
    expect(fn).toMatch(/\.slice\(0, 2\)/);
  });

  it("se muestra al vendedor separado de la calificación", () => {
    expect(ui).toMatch(/Lo que viene después/);
    expect(ui).toMatch(/no cuenta en tu calificación/i);
  });
});
