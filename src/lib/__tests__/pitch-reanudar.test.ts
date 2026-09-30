// El Pitch Builder aguanta que el manager cambie de app (sept-2026).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { leerPausa, fueInterrupcion, VIGENCIA_PAUSA_MS, conLimite, SeccionTardada, esDispositivoMovil } from "../pitch-reanudar";

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
  it("una interrupción no muestra error: muestra la pausa y el botón", () => {
    expect(ui).toMatch(/Toca «Seguir generando» para continuar desde ahí/);
    expect(ui).toMatch(/`Seguir generando \(\$\{/);
  });
});

describe("segunda ronda en el iPhone: el teléfono se durmió (sept-2026)", () => {
  it("el vigilante corta una sección congelada y la vuelve pausa", async () => {
    const nunca = new Promise<string>(() => {});
    await expect(conLimite(nunca, 20)).rejects.toBeInstanceOf(SeccionTardada);
  });
  it("el vigilante no estorba a una sección que sí termina", async () => {
    await expect(conLimite(Promise.resolve("ok"), 1000)).resolves.toBe("ok");
  });
  it("si la pausa se registra con la página ya visible, retoma sola una vez", () => {
    expect(ui).toMatch(/if \(document\.visibilityState === "visible" && !\(e instanceof SeccionTardada\) && !reintentoAutoRef\.current\)/);
    expect(ui).toMatch(/res = await conLimite\(runGenerateSection/);
  });
  it("en el teléfono recomienda generar desde la computadora", () => {
    expect(esDispositivoMovil("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", false)).toBe(true);
    expect(esDispositivoMovil("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", false)).toBe(false);
    expect(ui).toMatch(/Te recomendamos generar los pitches desde una computadora/);
  });
});

