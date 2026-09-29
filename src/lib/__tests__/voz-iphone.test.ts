// Voz en iPhone (Safari): el audio solo suena en un elemento desbloqueado por un
// toque. Sept-2026: se creaba un Audio nuevo después de esperar al servidor,
// Safari lo bloqueaba, y el error se tragaba — la demostración "terminaba" al
// instante y las respuestas de Closer nunca se oían.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ui = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.practica.tsx"), "utf8");

describe("Un solo reproductor, desbloqueado con el primer toque", () => {
  it("ya no crea un Audio nuevo por cada frase de Closer", () => {
    expect(ui).not.toMatch(/new Audio\(url\)/);
    expect(ui).toMatch(/const audio = reproductorRef\.current \?\? new Audio\(\);/);
  });
  it("se desbloquea con el primer toque en cualquier parte de la pantalla", () => {
    expect(ui).toMatch(/\["pointerdown", "touchend", "click"\]/);
    expect(ui).toMatch(/reproductorListoRef\.current = true/);
  });
  it("si el teléfono bloquea el audio, se le dice al vendedor en vez de saltarlo", () => {
    expect(ui).toMatch(/name === "NotAllowedError"/);
    expect(ui).toMatch(/Tu teléfono bloqueó el audio de Closer/);
  });
});

describe("La guía y el cierre dicen la verdad", () => {
  it("el vendedor empieza la práctica", () => {
    expect(ui).toMatch(/Tú empiezas/);
    expect(ui).not.toMatch(/Closer habla primero/);
  });
  it("'Ejecución limpia' solo si la nota lo respalda", () => {
    expect(ui).toMatch(/score >= 85 \? "Ejecución limpia" : "Sesión incompleta"/);
  });
});

describe("El micrófono no se apaga por errores pasajeros", () => {
  it("reintenta con espera en vez de apagarse", () => {
    expect(ui).toMatch(/if \(reintentos < 3\) \{/);
    expect(ui).toMatch(/esperaReintento = 400 \* reintentos/);
    expect(ui).toMatch(/setTimeout\(relanzar, ms\)/);
  });
  it("solo un permiso negado apaga el micrófono de inmediato", () => {
    expect(ui).toMatch(/if \(code === "not-allowed"\) \{/);
  });
});

