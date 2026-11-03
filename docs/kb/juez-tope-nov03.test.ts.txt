import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { presupuestoJuez, TOPE_MAXIMO_JUEZ } from "../../../supabase/functions/_shared/juez_pruebas";

// Mensaje 130 (3-nov-2026). G105 en el 129: el juez recibió cinco acusaciones y
// «no entregó juicios» dos veces. Su tope fijo de 2000 tokens no alcanzaba
// para cinco juicios con sus citas letra por letra: la respuesta se cortaba y
// se quedaba lo del evaluador (nota 18, la falla espejo sin quitar).

const voz = readFileSync(resolve(__dirname, "../../../supabase/functions/closer-voice/index.ts"), "utf8");

describe("el tope del juez crece con las acusaciones", () => {
  it("con una acusación, no menos que antes (2000)", () => {
    expect(presupuestoJuez(1)).toBeGreaterThanOrEqual(2000);
  });
  it("con cinco acusaciones (G105) le alcanza para cinco juicios con citas", () => {
    expect(presupuestoJuez(5)).toBeGreaterThanOrEqual(5000);
  });
  it("crece con cada acusación y nunca pasa del máximo", () => {
    for (let n = 1; n < 12; n++) expect(presupuestoJuez(n + 1)).toBeGreaterThanOrEqual(presupuestoJuez(n));
    expect(presupuestoJuez(50)).toBe(TOPE_MAXIMO_JUEZ);
    expect(presupuestoJuez(0)).toBe(presupuestoJuez(1));
  });
  it("closer-voice lo usa en la calificación y en la disputa, y no calla una respuesta cortada", () => {
    expect(voz).toContain("let tope = presupuestoJuez(acusaciones);");
    expect(voz).toContain("acusaciones.length);");
    expect(voz).toContain("quienJuez, aRevisar.length);");
    expect(voz).toContain('if (j?.stop_reason !== "max_tokens") return juiciosDeRespuesta(j);');
    expect(voz).toContain("tope = Math.min(TOPE_MAXIMO_JUEZ, tope * 2);");
    expect(voz).toContain('"[closer-voice] respuesta cortada por max_tokens"');
  });
});
