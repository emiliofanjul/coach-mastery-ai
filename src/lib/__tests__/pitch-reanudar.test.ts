// El Pitch Builder aguanta que el manager cambie de app (sept-2026).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { leerPausa, fueInterrupcion, VIGENCIA_PAUSA_MS } from "../pitch-reanudar";

const ui = readFileSync(join(process.cwd(), "src/components/app/PitchesSection.tsx"), "utf8");
const AHORA = 1_800_000_000_000;

describe("la pausa guardada", () => {
  it("se lee si es reciente", () => {
    expect(leerPausa(JSON.stringify({ pitchId: "p1", step: 3, ts: AHORA - 60_000 }), AHORA)).toEqual({ pitchId: "p1", step: 3, ts: AHORA - 60_000 });
  });
  it("caduca a los 30 minutos", () => {
    expect(leerPausa(JSON.stringify({ pitchId: "p1", step: 3, ts: AHORA - VIGENCIA_PAUSA_MS - 1 }), AHORA)).toBeNull();
  });
  it("ignora basura o datos incompletos", () => {
    expect(leerPausa(null, AHORA)).toBeNull();
    expect(leerPausa("no es json", AHORA)).toBeNull();
    expect(leerPausa(JSON.stringify({ pitchId: "", step: 2, ts: AHORA }), AHORA)).toBeNull();
    expect(leerPausa(JSON.stringify({ pitchId: "p1", step: 0, ts: AHORA }), AHORA)).toBeNull();
  });
});

describe("interrupción vs error real", () => {
  it("si la página se ocultó, es interrupción; si no, es error de verdad", () => {
    expect(fueInterrupcion(true, false)).toBe(true);
    expect(fueInterrupcion(false, true)).toBe(true);
    expect(fueInterrupcion(false, false)).toBe(false);
  });
});

describe("la pantalla", () => {
  it("retoma desde la sección donde iba, al volver o tras recargar", () => {
    expect(ui).toMatch(/void generarDesde\(p\.pitchId, p\.step\);/);
    expect(ui).toMatch(/document\.addEventListener\("visibilitychange", alCambiar\)/);
    expect(ui).toMatch(/leerPausa\(guardado, Date\.now\(\)\)/);
  });
  it("una interrupción no muestra error: muestra la pausa", () => {
    expect(ui).toMatch(/En pausa en «\{progress\.label\}» porque saliste de la app/);
  });
});
