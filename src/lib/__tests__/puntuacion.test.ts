// Prueba de COMPORTAMIENTO, no de texto: ejecuta la función real que usa la
// Edge Function. (La auditoría de sept-2026 encontró que 78 de 94 pruebas solo
// verificaban que una regla estuviera escrita, no que se cumpliera.)
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { aplicarTopeCritico, estrellasDe, TOPE_CRITICO } from "../../../supabase/functions/_shared/puntuacion";

const fallas = [
  { id: "pitch_prematuro", severity: "critical" },
  { id: "pregunta_cerrada", severity: "major" },
  { id: "sin_pregunta", severity: "major" },
];

describe("aplicarTopeCritico: el código aplica la regla, no el modelo", () => {
  it("el caso real de G06: flag critical y el modelo devolvió 35 → 30", () => {
    const r = aplicarTopeCritico(35, ["pitch_prematuro"], fallas);
    expect(r.score).toBe(TOPE_CRITICO);
    expect(r.topado).toBe(true);
    expect(r.criticos).toEqual(["pitch_prematuro"]);
  });
  it("un flag major no topa", () => {
    expect(aplicarTopeCritico(55, ["pregunta_cerrada"], fallas)).toMatchObject({ score: 55, topado: false });
  });
  it("sin flags no topa", () => {
    expect(aplicarTopeCritico(95, [], fallas)).toMatchObject({ score: 95, topado: false });
  });
  it("un score ya bajo el tope no se toca", () => {
    expect(aplicarTopeCritico(12, ["pitch_prematuro"], fallas)).toMatchObject({ score: 12, topado: false });
  });
  it("un flag que no existe en el guion no topa (no se inventa severidad)", () => {
    expect(aplicarTopeCritico(80, ["flag_inventado"], fallas)).toMatchObject({ score: 80, topado: false });
  });
  it("la severidad sale del guion, no del nombre del flag", () => {
    const otro = [{ id: "pitch_prematuro", severity: "minor" }];
    expect(aplicarTopeCritico(70, ["pitch_prematuro"], otro)).toMatchObject({ score: 70, topado: false });
  });
  it("entradas basura no rompen nada", () => {
    expect(aplicarTopeCritico(NaN as any, null, undefined).score).toBe(0);
  });
});

describe("estrellas salen del score YA topado", () => {
  it("35 con critical → 30 → 1 estrella (antes habría dado 1 también, pero 88 → 30 daba 3)", () => {
    const r = aplicarTopeCritico(88, ["pitch_prematuro"], fallas);
    expect(estrellasDe(r.score)).toBe(1);
  });
});

describe("closer-voice usa esta función", () => {
  const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");
  it("importa y aplica el tope antes de calcular estrellas", () => {
    expect(fn).toMatch(/import \{ aplicarTopeCritico, estrellasDe \} from "\.\.\/_shared\/puntuacion\.ts"/);
    const iTope = fn.indexOf("aplicarTopeCritico(evaluation.score");
    const iEstrellas = fn.indexOf("estrellasDe(evaluation.score)");
    expect(iTope).toBeGreaterThan(0);
    expect(iEstrellas).toBeGreaterThan(iTope);
  });
});
