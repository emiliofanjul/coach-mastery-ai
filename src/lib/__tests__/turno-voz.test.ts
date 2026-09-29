// El turno de voz, probado ejecutando sus piezas puras.
import { describe, it, expect } from "vitest";
import { reducirMuestreo, aInt16, aBase64, nivelDeVoz, armarWav, GrabacionSesion, MUESTREO_STT, UMBRAL_VOZ } from "../voz/turno-voz";

describe("conversión de audio para el WebSocket", () => {
  it("48 kHz → 16 kHz da un tercio de las muestras y conserva el valor", () => {
    const f = new Float32Array(4800).fill(0.5);
    const r = reducirMuestreo(f, 48000, 16000);
    expect(r.length).toBe(1600);
    expect(r[0]).toBeCloseTo(0.5, 5);
  });
  it("no toca el audio si ya viene a 16 kHz", () => {
    const f = new Float32Array([0.1, 0.2]);
    expect(reducirMuestreo(f, 16000, 16000)).toBe(f);
  });
  it("PCM de 16 bits: recorta a [-1, 1] y usa el rango completo", () => {
    expect(Array.from(aInt16(new Float32Array([0, 1, -1, 2, -2])))).toEqual([0, 32767, -32768, 32767, -32768]);
  });
  it("base64 ida y vuelta: los bytes llegan intactos en little-endian", () => {
    const p = new Int16Array([1, -1, 256, 32767]);
    const bytes = Uint8Array.from(atob(aBase64(p)), (c) => c.charCodeAt(0));
    expect(Array.from(new Int16Array(bytes.buffer))).toEqual([1, -1, 256, 32767]);
  });
  it("base64 aguanta trozos grandes sin desbordar la pila", () => {
    expect(() => aBase64(new Int16Array(200000))).not.toThrow();
  });
});

describe("nivel de voz", () => {
  it("silencio es 0 y un tono fuerte llega al tope", () => {
    expect(nivelDeVoz(new Float32Array(1024))).toBe(0);
    expect(nivelDeVoz(new Float32Array(1024).fill(0.5))).toBe(1);
  });
  it("un murmullo de fondo queda bajo el umbral de voz", () => {
    expect(nivelDeVoz(new Float32Array(1024).fill(0.005))).toBeLessThan(UMBRAL_VOZ);
  });
});

describe("la grabación para el manager", () => {
  it("arma un WAV válido: cabecera RIFF, mono, 16 bits, 16 kHz", () => {
    const buf = armarWav([new Int16Array([1, 2, 3])], MUESTREO_STT);
    const v = new DataView(buf);
    const txt = (o: number) => String.fromCharCode(...new Uint8Array(buf, o, 4));
    expect(txt(0)).toBe("RIFF");
    expect(txt(8)).toBe("WAVE");
    expect(v.getUint16(22, true)).toBe(1);
    expect(v.getUint32(24, true)).toBe(16000);
    expect(v.getUint16(34, true)).toBe(16);
    expect(v.getUint32(40, true)).toBe(6);
    expect(buf.byteLength).toBe(50);
  });
  it("guarda la marca de tiempo de cada turno, con una pausa entre turnos", () => {
    const g = new GrabacionSesion(16000, 0.5);
    g.iniciarTurno(1); g.agregar(new Int16Array(16000)); g.cerrarTurno();     // 1 s
    g.iniciarTurno(2); g.agregar(new Int16Array(8000)); g.cerrarTurno();      // 0.5 s pausa + 0.5 s
    expect(g.turnos).toEqual([
      { turno: 1, inicio_seg: 0, fin_seg: 1 },
      { turno: 2, inicio_seg: 1.5, fin_seg: 2 },
    ]);
    expect(g.duracionSeg).toBe(2);
  });
  it("un turno sin audio no deja marca", () => {
    const g = new GrabacionSesion();
    g.iniciarTurno(1); g.cerrarTurno();
    expect(g.turnos).toEqual([]);
    expect(g.wav()).toBeNull();
  });
  it("el audio fuera de un turno no se graba (la voz de Closer nunca entra)", () => {
    const g = new GrabacionSesion();
    g.agregar(new Int16Array(100));
    expect(g.wav()).toBeNull();
  });
  it("el archivo final es audio/wav", () => {
    const g = new GrabacionSesion();
    g.iniciarTurno(1); g.agregar(new Int16Array(160));
    expect(g.wav()?.type).toBe("audio/wav");
  });
});
