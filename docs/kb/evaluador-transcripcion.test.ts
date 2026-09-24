// El evaluador no juzga por puntuación ni escribe ejemplos con huecos.
//
// Sept-2026, nodo 1.2: el vendedor preguntó en voz alta "¿así ha estado toda
// la semana?" y la transcripción automática lo entregó sin signos. El
// evaluador lo leyó como afirmación y le bajó el score por "no cerrar con
// pregunta" — aunque el cliente había CONTESTADO esa pregunta en el turno
// siguiente. Y la misión le pidió "asegúrate de que termine en signo de
// interrogación", a alguien que habla.
//
// En la misma pantalla, el ejemplo de siguiente_nivel traía "[empresa/sector]"
// y "[área relevante]": corchetes de relleno que el generador de pitch tiene
// prohibidos desde hace meses y el evaluador no.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");

describe("La puntuación no es evidencia", () => {
  it("declara que el transcript viene de transcripción automática sin signos", () => {
    expect(fn).toMatch(/LA PUNTUACIÓN NO ES EVIDENCIA/);
    expect(fn).toMatch(/no pone signos de interrogación/);
  });

  it("prohíbe decidir si algo fue pregunta por el signo", () => {
    expect(fn).toMatch(/NUNCA decidas si algo fue pregunta por la presencia o ausencia/);
  });

  it("usa la respuesta del cliente como evidencia de que devolvió la palabra", () => {
    expect(fn).toMatch(/si EL CLIENTE LA CONTESTÓ/);
    expect(fn).toMatch(/el turno le devolvió la palabra: el criterio se cumplió/);
  });

  it("prohíbe misiones sobre puntuación", () => {
    expect(fn).toMatch(/PROHIBIDO escribir observaciones o misiones sobre puntuación/);
    expect(fn).toMatch(/El vendedor habla, no escribe/);
  });
});

describe("Los ejemplos van completos, sin corchetes", () => {
  it("prohíbe los corchetes de relleno en observations y siguiente_nivel", () => {
    expect(fn).toMatch(/LOS EJEMPLOS VAN COMPLETOS, SIN HUECOS/);
    expect(fn).toMatch(/PROHIBIDOS los corchetes de relleno/);
  });

  it("explica por qué: una plantilla no es un ejemplo", () => {
    expect(fn).toMatch(/no es un ejemplo: es una plantilla/);
  });
});
