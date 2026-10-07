// "Toco el micrófono, hablo y no pasa nada" (oct-2026): el turno ya no puede
// quedarse sordo en silencio. Cada camino de falla se detecta y se nombra.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  VigiaTurno, esErrorStt, codigoDeFalla, ErrorTokenVoz,
  LIMITE_SIN_AUDIO_MS, LIMITE_SIN_CONEXION_MS, LIMITE_SIN_TEXTO_MS,
} from "../voz/turno-voz";
import { avisoDeFallaVoz, avisoDeArranque } from "../voz/avisos-voz";

const BLOQUE = 85; // ms, un bloque de 4096 muestras a 48 kHz

describe("el vigía del turno", () => {
  it("micrófono abierto pero sin audio: avisa a los 2.5 s, no antes", () => {
    const v = new VigiaTurno(0);
    expect(v.revisar(LIMITE_SIN_AUDIO_MS - 1)).toBeNull();
    expect(v.revisar(LIMITE_SIN_AUDIO_MS)).toBe("sin_audio");
  });
  it("hay audio pero la conexión nunca abre: sin_conexion", () => {
    const v = new VigiaTurno(0);
    v.audio(0.5, BLOQUE, 100);
    expect(v.revisar(LIMITE_SIN_CONEXION_MS - 1)).toBeNull();
    expect(v.revisar(LIMITE_SIN_CONEXION_MS)).toBe("sin_conexion");
  });
  it("hay voz clara y conexión, pero no vuelve texto: sin_texto", () => {
    const v = new VigiaTurno(0);
    v.conexionAbierta(500);
    for (let t = 1000; t < 1000 + 2000; t += BLOQUE) v.audio(0.6, BLOQUE, t);
    expect(v.revisar(1000 + LIMITE_SIN_TEXTO_MS - 1)).toBeNull();
    expect(v.revisar(1000 + LIMITE_SIN_TEXTO_MS)).toBe("sin_texto");
  });
  it("el vendedor callado (pensando) NO es una falla, por más que pase el tiempo", () => {
    const v = new VigiaTurno(0);
    v.conexionAbierta(500);
    for (let t = 600; t < 60000; t += BLOQUE) v.audio(0.03, BLOQUE, t);
    expect(v.revisar(60000)).toBeNull();
  });
  it("un ruido corto (un golpe, una tos) no basta para exigir texto", () => {
    const v = new VigiaTurno(0);
    v.conexionAbierta(500);
    for (let i = 0; i < 5; i++) v.audio(0.9, BLOQUE, 1000 + i * BLOQUE);
    expect(v.revisar(30000)).toBeNull();
  });
  it("en cuanto llega texto, el turno está sano", () => {
    const v = new VigiaTurno(0);
    v.conexionAbierta(500);
    for (let t = 1000; t < 4000; t += BLOQUE) v.audio(0.6, BLOQUE, t);
    v.texto();
    expect(v.revisar(60000)).toBeNull();
  });
});

describe("errores del servidor de transcripción", () => {
  it("los mensajes normales no son errores", () => {
    for (const t of ["session_started", "partial_transcript", "committed_transcript", "committed_transcript_with_timestamps"]) {
      expect(esErrorStt({ message_type: t })).toBe(false);
    }
  });
  it("los rechazos que antes pasaban en silencio ahora cuentan", () => {
    for (const t of ["auth_error", "quota_exceeded", "session_time_limit_exceeded", "resource_exhausted", "queue_overflow", "unaccepted_terms", "chunk_size_exceeded", "rate_limited", "commit_throttled", "input_error"]) {
      expect(esErrorStt({ message_type: t }), t).toBe(true);
    }
    expect(esErrorStt({ message_type: "algo_nuevo", error: "no" })).toBe(true);
  });
});

describe("lo que lee el vendedor", () => {
  it("cada falla tiene su aviso y su código", () => {
    const vistos = new Set<string>();
    for (const f of ["sin_audio", "sin_conexion", "conexion_cerrada", "sin_texto", "servicio"] as const) {
      const a = avisoDeFallaVoz(f, codigoDeFalla(f));
      expect(a).toMatch(/\(código V\d\)$/);
      vistos.add(a);
    }
    expect(vistos.size).toBe(5);
  });
  it("la llave rechazada por el proveedor NO se anuncia como problema del micrófono", () => {
    const a = avisoDeArranque(new ErrorTokenVoz(502, 401));
    expect(a).not.toMatch(/abrir el micrófono/);
    expect(a).toContain("V5-T502-401");
  });
  it("permiso negado sigue pidiendo el permiso", () => {
    expect(avisoDeArranque({ name: "NotAllowedError" })).toMatch(/permiso de micrófono/);
  });
});

describe("el turno en vivo escucha todos los caminos", () => {
  const src = readFileSync("src/lib/voz/turno-voz.ts", "utf8");
  const pag = readFileSync("src/routes/nodo.$nodeId.practica.tsx", "utf8");
  it("escucha el cierre de la conexión y descarta el procesador muerto", () => {
    expect(src).toContain("ws.onclose");
    expect(src).toMatch(/falla === "sin_audio"\) descartarContextoAudio\(\)/);
    expect(src).toContain("clearInterval(reloj)");
  });
  it("la pantalla muestra el aviso con código, no un texto fijo", () => {
    expect(pag).toContain("avisoDeFallaVoz(falla, codigo)");
    expect(pag).toContain("avisoDeArranque(err)");
    expect(pag).not.toContain("No pude abrir el micrófono. Toca para reintentar.");
  });
});
