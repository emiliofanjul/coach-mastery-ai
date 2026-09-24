// La tercera capa: el servidor también acepta cero observaciones.
//
// Sept-2026. Tras soltar la exigencia en el prompt y en el cliente, la práctica
// SEGUÍA fallando: la validación de la propia Edge Function exigía
// `obsCount >= 1` y devolvía 502 ANTES de que la evaluación saliera — sin
// escribir una sola línea de error, así que en los logs solo se veía un `usage`
// correcto y parecía que la función había respondido bien.
//
// Una evaluación de score 95, con los dos turnos analizados y la misión de
// consolidación, se tiraba a la basura.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");
const ui = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.practica.tsx"), "utf8");

describe("Servidor: cero observaciones pasa el contrato", () => {
  it("no exige obsCount >= 1", () => {
    expect(fn).not.toMatch(/obsCount >= 1/);
  });

  it("acepta de 0 a 3 exigiendo que sea un arreglo", () => {
    expect(fn).toMatch(/Array\.isArray\(evaluation\.observations\) && obsCount <= 3/);
  });
});

describe("Un rechazo del contrato deja rastro en los logs", () => {
  it("registra qué parte falló antes de devolver 502", () => {
    expect(fn).toMatch(/evaluación rechazada por el contrato/);
    expect(fn).toMatch(/scoreOk, obsValid, flagsValid, cumplidosValid, turnosValid/);
  });
});

describe("Nunca dejar al vendedor sin salida", () => {
  it("la pantalla sin análisis ofrece volver al mapa además de reintentar", () => {
    expect(ui).toMatch(/Volver al mapa/);
    expect(ui).toMatch(/onLeaveWithoutEval/);
  });

  it("salir sin evaluación no guarda estrellas", () => {
    expect(ui).toMatch(/Salir sin evaluación: no guarda estrellas/);
  });
});
