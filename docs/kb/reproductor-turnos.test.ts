// El manager escucha cualquier turno de la práctica (sept-2026).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { turnosValidos, mmss } from "../voz/turnos-audio";
import { GrabacionSesion } from "../voz/turno-voz";

const panel = readFileSync(join(process.cwd(), "src/routes/equipo.$sellerId.tsx"), "utf8");
const ui = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.practica.tsx"), "utf8");

describe("la grabación guarda qué dijo el vendedor en cada turno", () => {
  it("cada marca lleva su texto", () => {
    const g = new GrabacionSesion(16000, 0.4);
    g.iniciarTurno(1); g.agregar(new Int16Array(16000)); g.cerrarTurno();
    g.anotarTexto(1, "  Buenos días, don Ramón  ");
    expect(g.turnos[0]).toEqual({ turno: 1, inicio_seg: 0, fin_seg: 1, texto: "Buenos días, don Ramón" });
  });
  it("la práctica anota el texto final de cada turno", () => {
    expect(ui).toMatch(/grabacionRef\.current\?\.anotarTexto\(numeroTurno, text\);/);
  });
});

describe("el panel del manager", () => {
  it("descarta marcas rotas y conserva las buenas", () => {
    const r = turnosValidos([
      { turno: 1, inicio_seg: 0, fin_seg: 2.5, texto: "hola" },
      { turno: 2, inicio_seg: 3, fin_seg: 3 },          // sin duración
      { turno: 3, inicio_seg: "x", fin_seg: 5 },        // basura
      null,
    ]);
    expect(r).toEqual([{ turno: 1, inicio_seg: 0, fin_seg: 2.5, texto: "hola" }]);
    expect(turnosValidos(undefined)).toEqual([]);
  });
  it("muestra los tiempos como minutos y segundos", () => {
    expect(mmss(0)).toBe("0:00");
    expect(mmss(75.9)).toBe("1:15");
  });
  it("cada turno se escucha solo: salta al inicio y se detiene al final", () => {
    expect(panel).toMatch(/<ReproductorPorTurnos src=\{audioUrl\} turnos=\{turnosValidos\(evalBlock\.audio_turnos\)\} \/>/);
    expect(panel).toMatch(/a\.currentTime = t\.inicio_seg;/);
    expect(panel).toMatch(/if \(finRef\.current !== null && a\.currentTime >= finRef\.current\)/);
  });
});
