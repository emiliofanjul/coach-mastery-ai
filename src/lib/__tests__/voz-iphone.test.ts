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

describe("Un solo dueño del micrófono (sept-2026)", () => {
  const fnToken = readFileSync(join(process.cwd(), "src/routes/api/stt-token.ts"), "utf8");
  const guardado = readFileSync(join(process.cwd(), "supabase/functions/save-practice-event/index.ts"), "utf8");

  it("ya no usa el reconocimiento de voz del navegador", () => {
    expect(ui).not.toMatch(/webkitSpeechRecognition/);
    expect(ui).toMatch(/iniciarTurnoVoz\(\{/);
  });
  it("ya no usa la grabadora del navegador: la grabación sale del mismo audio", () => {
    expect(ui).not.toMatch(/new MediaRecorder\(/);
    expect(ui).toMatch(/grabacionRef\.current = new GrabacionSesion\(\)/);
  });
  it("pedir permiso cierra el micrófono de inmediato", () => {
    expect(ui).toMatch(/const permiso = await navigator\.mediaDevices\.getUserMedia\(\{ audio: true \}\);\s*permiso\.getTracks\(\)\.forEach\(\(t\) => t\.stop\(\)\);/);
  });
  it("mientras hay voz, el turno sigue vivo aunque el texto tarde", () => {
    expect(ui).toMatch(/const esVoz = n >= Math\.max\(UMBRAL_VOZ, pisoRuido \* 2\.5, 0\.22\);/);
    expect(ui).toMatch(/if \(esVoz && ahora - ultimoEmpujon > 250\)/);
  });
  it("el primer toque activa también el procesador de audio", () => {
    expect(ui).toMatch(/desbloquearContextoAudio\(\);/);
  });
  it("las barritas de voz se mueven con el nivel", () => {
    expect(ui).toMatch(/nivelVoz=\{nivelVoz\}/);
  });
  it("el evento guardado trae dónde empieza y termina cada turno", () => {
    expect(ui).toMatch(/audio_turnos: audioTurnosRef\.current/);
  });
  it("la llave de transcripción solo se entrega a un usuario con sesión", () => {
    expect(fnToken).toMatch(/if \(!who\?\.user\?\.id\) return json\(\{ error: "unauthorized" \}, 401\);/);
    expect(fnToken).toMatch(/single-use-token\/realtime_scribe/);
  });
  it("el archivo guardado lleva la extensión de su tipo real", () => {
    expect(guardado).toMatch(/tipo\.includes\("wav"\) \? "wav"/);
  });
});

describe("Segunda ronda en el iPhone (sept-2026)", () => {
  const voz = readFileSync(join(process.cwd(), "src/lib/voz/turno-voz.ts"), "utf8");
  const nodo = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.tsx"), "utf8");
  it("reanuda el procesador de audio aunque iPhone lo deje 'interrupted'", () => {
    expect(voz).toMatch(/if \(contextoCompartido!\.state !== "running"\) void contextoCompartido!\.resume\(\);/);
    expect(voz).toMatch(/if \(ctx\.state !== "running"\) \{/);
  });
  it("lo ganado no se pierde: un nodo terminado nunca vuelve a 'en curso'", () => {
    expect(ui).toMatch(/const unlocks = bestStars >= 2 \|\| existingProgress\?\.status === "done";/);
  });
  it("las tarjetas largas se pueden bajar", () => {
    expect(nodo).toMatch(/overflowY: "auto",/);
    expect(nodo).toMatch(/margin: "auto 0", flexShrink: 0/);
  });
});

describe("Modo radio (sept-2026, decisión de Emilio)", () => {
  it("se envía tocando; el reloj es solo una red de seguridad de 25 s", () => {
    expect(ui).toMatch(/const ESPERA_SEGURIDAD_MS = 25000;/);
    expect(ui).not.toMatch(/baseSilenceMs|looksIncomplete/);
  });
  it("solo el texto NUEVO reinicia el reloj (ElevenLabs repite el mismo texto)", () => {
    expect(ui).toMatch(/if \(turnClosed \|\| t === finalText\) return;/);
  });
  it("el tutorial enseña cómo funciona de verdad", () => {
    expect(ui).toMatch(/Toca otra vez para enviar/);
    expect(ui).toMatch(/nada se envía hasta que tocas/);
    expect(ui).not.toMatch(/pausa de 3 segundos|Closer detecta el silencio|envía por ti/);
  });
});

