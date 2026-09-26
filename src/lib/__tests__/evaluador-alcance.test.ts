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

describe("Reglas que definen una prueba", () => {
  it("el evaluador aplica la prueba a cualquier frase, esté o no en los ejemplos", () => {
    expect(fn).toMatch(/9c\. REGLAS QUE DEFINEN UNA PRUEBA/);
    expect(fn).toMatch(/LA PRUEBA ES EL ALCANCE y los ejemplos solo ilustran/);
    expect(fn).toMatch(/que un caso no esté en la lista NO lo exime/);
  });

  it("sigue prohibido inventar pruebas que la regla no escribe", () => {
    expect(fn).toMatch(/inventar una prueba que la regla no escribe/);
  });

  it("la regla 12 ya no define pitch_prematuro como lista", () => {
    expect(fn).not.toMatch(/en ningún turno del vendedor aparece un producto, marca o motivo de venta/);
  });
});

describe("Calidad no es falla (escalera de la especificidad)", () => {
  it("distingue falla (daño o ausencia) de calidad (qué tan bien se hizo)", () => {
    expect(fn).toMatch(/9d\. CALIDAD NO ES FALLA/);
    expect(fn).toMatch(/Una falla es DAÑO o AUSENCIA/);
  });
  it("prohíbe castigar dos veces el mismo hecho", () => {
    expect(fn).toMatch(/Nunca castigues dos veces el mismo hecho/);
  });
  it("una pregunta de cortesía no dispara sin_pregunta", () => {
    expect(fn).toMatch(/"¿cómo está\?" ES una pregunta: está en el escalón 1, no dispara "sin_pregunta"/);
  });
  it("el evaluador corre con temperatura 0; el Actor no", () => {
    expect(fn).toMatch(/\.\.\.\(phase === "evaluate" \? \{ temperature: 0 \} : \{\}\)/);
  });
});

describe("Nunca inventar hechos del cliente", () => {
  it("prohíbe inventar datos del cliente en ejemplos y siguiente_nivel", () => {
    expect(fn).toMatch(/6c\. NUNCA INVENTES HECHOS DEL CLIENTE/);
    expect(fn).toMatch(/Si no está ahí, no existe/);
  });
  it("sin historia visible, el cliente se trata como nuevo", () => {
    expect(fn).toMatch(/si la conversación no muestra historia con él, trátalo como cliente nuevo/);
  });
});

describe("Los ejemplos no llevan acotaciones", () => {
  it("prohíbe [pausa], [cliente responde] y similares dentro del ejemplo", () => {
    expect(fn).toMatch(/PROHIBIDAS también las acotaciones entre corchetes/);
    expect(fn).toMatch(/va en "mejora", nunca dentro del ejemplo/);
  });
});

