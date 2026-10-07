// Turno de voz con UN solo dueño del micrófono (sept-2026).
//
// Antes, hasta tres cosas usaban el micrófono a la vez: el permiso (que nunca
// lo cerraba), la grabadora del navegador (que en pausa lo seguía ocupando) y
// el reconocimiento de voz de Safari. En iPhone eso bajaba el volumen de
// Closer (modo "llamada") y, al tercer o cuarto turno, el reconocimiento
// recibía silencio.
//
// Ahora el micrófono se abre al empezar el turno del vendedor y se cierra al
// terminarlo. De ese único flujo de audio salen tres cosas:
//   · el texto en vivo, vía ElevenLabs Scribe v2 Realtime (WebSocket);
//   · el nivel de voz, para las barritas que confirman que se le escucha;
//   · la grabación para el manager, armada por nosotros como WAV — sin
//     depender de los formatos que cada navegador sepa grabar.

export const MUESTREO_STT = 16000;

// ── Piezas puras (probadas sin navegador) ──────────────────────────────

/** Reduce el muestreo promediando por bloques. Suficiente y estable para voz. */
export function reducirMuestreo(entrada: Float32Array, de: number, a: number): Float32Array {
  if (de <= a) return entrada;
  const razon = de / a;
  const n = Math.floor(entrada.length / razon);
  const salida = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const ini = Math.floor(i * razon);
    const fin = Math.min(entrada.length, Math.floor((i + 1) * razon));
    let suma = 0;
    for (let j = ini; j < fin; j++) suma += entrada[j];
    salida[i] = fin > ini ? suma / (fin - ini) : 0;
  }
  return salida;
}

/** Float32 [-1, 1] → PCM de 16 bits. */
export function aInt16(f: Float32Array): Int16Array {
  const s = new Int16Array(f.length);
  for (let i = 0; i < f.length; i++) {
    const v = Math.max(-1, Math.min(1, f[i]));
    s[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
  }
  return s;
}

/** PCM de 16 bits (little-endian) → base64, como lo pide el WebSocket. */
export function aBase64(p: Int16Array): string {
  const bytes = new Uint8Array(p.buffer, p.byteOffset, p.byteLength);
  let bin = "";
  const PASO = 0x8000;
  for (let i = 0; i < bytes.length; i += PASO) {
    bin += String.fromCharCode(...bytes.subarray(i, i + PASO));
  }
  return btoa(bin);
}

/** Nivel de voz de 0 a 1, para las barritas. */
export function nivelDeVoz(f: Float32Array): number {
  if (f.length === 0) return 0;
  let suma = 0;
  for (let i = 0; i < f.length; i++) suma += f[i] * f[i];
  return Math.min(1, Math.sqrt(suma / f.length) * 6);
}

/** Umbral a partir del cual el nivel cuenta como voz (mantiene vivo el turno). */
export const UMBRAL_VOZ = 0.12;

/** WAV mono de 16 bits a partir de trozos de PCM. */
export function armarWav(trozos: Int16Array[], muestreo: number): ArrayBuffer {
  const muestras = trozos.reduce((a, t) => a + t.length, 0);
  const buf = new ArrayBuffer(44 + muestras * 2);
  const v = new DataView(buf);
  const txt = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  txt(0, "RIFF"); v.setUint32(4, 36 + muestras * 2, true); txt(8, "WAVE");
  txt(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, muestreo, true); v.setUint32(28, muestreo * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  txt(36, "data"); v.setUint32(40, muestras * 2, true);
  let o = 44;
  for (const t of trozos) for (let i = 0; i < t.length; i++, o += 2) v.setInt16(o, t[i], true);
  return buf;
}

/**
 * La grabación de la sesión: los turnos del vendedor, uno tras otro, en un solo
 * WAV, con la marca de tiempo de cada turno para que el manager salte directo.
 */
export class GrabacionSesion {
  private trozos: Int16Array[] = [];
  private muestras = 0;
  private abierto: { turno: number; inicio: number } | null = null;
  readonly turnos: { turno: number; inicio_seg: number; fin_seg: number; texto?: string }[] = [];
  constructor(private readonly muestreo = MUESTREO_STT, private readonly separacionSeg = 0.4) {}

  iniciarTurno(turno: number) {
    if (this.abierto) this.cerrarTurno();
    if (this.muestras > 0) {
      const silencio = new Int16Array(Math.round(this.separacionSeg * this.muestreo));
      this.trozos.push(silencio);
      this.muestras += silencio.length;
    }
    this.abierto = { turno, inicio: this.muestras };
  }
  agregar(p: Int16Array) {
    if (!this.abierto || p.length === 0) return;
    this.trozos.push(p);
    this.muestras += p.length;
  }
  cerrarTurno() {
    if (!this.abierto) return;
    const r = (m: number) => Math.round((m / this.muestreo) * 100) / 100;
    if (this.muestras > this.abierto.inicio) {
      this.turnos.push({ turno: this.abierto.turno, inicio_seg: r(this.abierto.inicio), fin_seg: r(this.muestras) });
    }
    this.abierto = null;
  }
  /**
   * Lo que el vendedor dijo en ese turno (el texto final de la transcripción).
   * Así el manager ve cada turno con su texto y salta exacto a él, sin depender
   * de que la cuenta de turnos coincida con la transcripción.
   */
  anotarTexto(turno: number, texto: string) {
    const t = this.turnos.find((x) => x.turno === turno);
    if (t && texto.trim()) t.texto = texto.trim().slice(0, 500);
  }
  get duracionSeg(): number { return this.muestras / this.muestreo; }
  wav(): Blob | null {
    this.cerrarTurno();
    if (this.muestras === 0) return null;
    return new Blob([armarWav(this.trozos, this.muestreo)], { type: "audio/wav" });
  }
}

// ── El vigía del turno (oct-2026) ──────────────────────────────────────
//
// "Toco el micrófono, hablo y no pasa nada": el turno podía quedarse sordo sin
// avisar por tres caminos distintos, y los tres se veían igual en pantalla.
//   · el procesador de audio del iPhone dice estar activo pero no entrega nada;
//   · la conexión de transcripción nunca abre, o el servidor la cierra;
//   · hay voz y hay conexión, pero no vuelve ni una palabra.
// El vigía vigila los tres y dice CUÁL fue, con un código que el vendedor ve.

export type FallaVoz = "sin_audio" | "sin_conexion" | "conexion_cerrada" | "sin_texto" | "servicio";

export const LIMITE_SIN_AUDIO_MS = 2500;
export const LIMITE_SIN_CONEXION_MS = 9000;
export const LIMITE_SIN_TEXTO_MS = 7000;
/** Nivel a partir del cual el vigía cuenta "aquí hay alguien hablando". */
export const NIVEL_VOZ_CLARA = 0.22;
/** Voz clara acumulada antes de exigir texto de vuelta. */
export const VOZ_MINIMA_MS = 1500;

export class VigiaTurno {
  private bloques = 0;
  private abierta: number | null = null;
  private vozMs = 0;
  private primeraVoz: number | null = null;
  private huboTexto = false;
  constructor(private readonly inicio: number) {}

  /** Llegó un bloque de audio del micrófono, de `duracionMs`, con ese nivel. */
  audio(nivel: number, duracionMs: number, ahora: number) {
    this.bloques++;
    if (this.abierta !== null && nivel >= NIVEL_VOZ_CLARA) {
      this.vozMs += duracionMs;
      if (this.primeraVoz === null) this.primeraVoz = ahora;
    }
  }
  conexionAbierta(ahora: number) { this.abierta = ahora; }
  texto() { this.huboTexto = true; }

  revisar(ahora: number): FallaVoz | null {
    if (this.bloques === 0) return ahora - this.inicio >= LIMITE_SIN_AUDIO_MS ? "sin_audio" : null;
    if (this.abierta === null) return ahora - this.inicio >= LIMITE_SIN_CONEXION_MS ? "sin_conexion" : null;
    if (!this.huboTexto && this.primeraVoz !== null && this.vozMs >= VOZ_MINIMA_MS
      && ahora - this.primeraVoz >= LIMITE_SIN_TEXTO_MS) return "sin_texto";
    return null;
  }
}

/** Mensajes del servidor de transcripción que NO son un error. */
const MENSAJES_NORMALES = new Set(["session_started", "partial_transcript", "committed_transcript", "committed_transcript_with_timestamps"]);

/**
 * ¿Este mensaje del servidor es un error? Antes se buscaban cuatro palabras y
 * varios errores reales (límite de sesión, cola llena, términos sin aceptar)
 * pasaban en silencio. Ahora: todo lo que trae `error`, o cuyo tipo suena a
 * rechazo, es un error.
 */
export function esErrorStt(m: { message_type?: unknown; error?: unknown } | null | undefined): boolean {
  const tipo = String(m?.message_type ?? "");
  if (MENSAJES_NORMALES.has(tipo)) return false;
  if (m?.error) return true;
  return /error|rate_limited|quota|throttled|exceeded|exhausted|overflow|unaccepted|invalid|denied/i.test(tipo);
}

/** El código corto que ve el vendedor junto al aviso, para saber qué falló. */
export function codigoDeFalla(falla: FallaVoz, detalle?: string | number): string {
  const base = { sin_audio: "V1", sin_conexion: "V2", conexion_cerrada: "V3", sin_texto: "V4", servicio: "V5" }[falla];
  return detalle === undefined || detalle === "" ? base : `${base}-${detalle}`;
}

/** Error al pedir la llave temporal de transcripción. Lleva el código HTTP. */
export class ErrorTokenVoz extends Error {
  constructor(readonly estado: number, readonly estadoProveedor?: number) {
    super(`token de transcripción HTTP ${estado}`);
    this.name = "ErrorTokenVoz";
  }
}

// ── El turno en vivo (navegador) ───────────────────────────────────────

let contextoCompartido: AudioContext | null = null;

/**
 * Crea y activa el procesador de audio. En iPhone solo se activa durante un
 * toque del usuario: se llama en el primer toque de la pantalla y queda vivo
 * toda la sesión. Un procesador activo SIN micrófono no pone el teléfono en
 * modo llamada; el micrófono solo se abre durante el turno del vendedor.
 */
export function desbloquearContextoAudio(): void {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    if (!contextoCompartido || contextoCompartido.state === "closed") contextoCompartido = new AC();
    // iPhone deja el procesador en "interrupted" (no solo "suspended") después
    // de reproducir audio o de cambiar de app: sin reanudarlo, el micrófono se
    // abre pero no llega nada — "le doy al micrófono y no me escucha".
    if (contextoCompartido!.state !== "running") void contextoCompartido!.resume();
  } catch { /* se reintenta en el siguiente toque */ }
}

/**
 * Tira el procesador de audio para que el siguiente toque cree uno nuevo. En
 * iPhone un procesador puede decir "running" y no entregar audio (después de
 * una llamada, de Siri o de cambiar de app): reanudarlo no lo arregla.
 */
export function descartarContextoAudio(): void {
  const viejo = contextoCompartido;
  contextoCompartido = null;
  try { void viejo?.close(); } catch { /* noop */ }
}

export interface OpcionesTurno {
  obtenerToken(): Promise<string>;
  idioma: string;
  onParcial(texto: string): void;
  onNivel(nivel: number): void;
  onPcm?(p: Int16Array): void;
  /** `falla` dice cuál de los caminos falló; `codigo` es lo que se le muestra al vendedor. */
  onError(mensaje: string, falla: FallaVoz, codigo: string): void;
}
export interface ControlTurno {
  /** Suelta el micrófono de inmediato, cierra el segmento y devuelve el texto final. */
  terminar(): Promise<string>;
  cancelar(): void;
}

export async function iniciarTurnoVoz(op: OpcionesTurno): Promise<ControlTurno> {
  desbloquearContextoAudio();
  let ctx = contextoCompartido;
  if (!ctx) throw new Error("sin-audio");
  if (ctx.state !== "running") {
    try { await ctx.resume(); } catch { /* abajo se recrea */ }
    if ((ctx.state as string) !== "running") {
      // Último recurso: un procesador nuevo. Se crea dentro del mismo toque.
      try { await ctx.close(); } catch { /* noop */ }
      contextoCompartido = null;
      desbloquearContextoAudio();
      ctx = contextoCompartido as AudioContext | null;
      if (!ctx) throw new Error("sin-audio");
      try { await (ctx as AudioContext).resume(); } catch { /* noop */ }
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });
  const c = ctx!;
  const fuente = c.createMediaStreamSource(stream);
  const proc = c.createScriptProcessor(4096, 1, 1);
  const mudo = c.createGain();
  mudo.gain.value = 0;
  fuente.connect(proc);
  proc.connect(mudo);
  mudo.connect(c.destination);

  let comprometido = "";
  let parcial = "";
  let cerrado = false;
  let pendiente: Int16Array[] = []; // audio capturado antes de que abra la conexión
  let esperandoCommit: ((t: string) => void) | null = null;
  let ws: WebSocket | null = null;
  let terminando = false;
  let avisado = false;
  const vigia = new VigiaTurno(Date.now());
  const fallar = (falla: FallaVoz, mensaje: string, detalle?: string | number) => {
    if (cerrado || avisado) return;
    avisado = true;
    if (falla === "sin_audio") descartarContextoAudio();
    op.onError(mensaje, falla, codigoDeFalla(falla, detalle));
  };
  const reloj = setInterval(() => {
    if (cerrado || terminando) return;
    const f = vigia.revisar(Date.now());
    if (f === "sin_audio") fallar(f, "El micrófono se abrió pero no llega audio.");
    else if (f === "sin_conexion") fallar(f, "La conexión de transcripción no abrió.");
    else if (f === "sin_texto") fallar(f, "Hay voz pero la transcripción no devuelve texto.");
  }, 500);
  const textoActual = () => `${comprometido} ${parcial}`.replace(/\s+/g, " ").trim();
  const enviar = (p: Int16Array, commit = false) => {
    ws!.send(JSON.stringify({ message_type: "input_audio_chunk", audio_base_64: aBase64(p), commit }));
  };

  proc.onaudioprocess = (e: AudioProcessingEvent) => {
    if (cerrado) return;
    const f = e.inputBuffer.getChannelData(0);
    const nivel = nivelDeVoz(f);
    vigia.audio(nivel, (f.length / c.sampleRate) * 1000, Date.now());
    op.onNivel(nivel);
    const p = aInt16(reducirMuestreo(f, c.sampleRate, MUESTREO_STT));
    op.onPcm?.(p);
    if (ws && ws.readyState === WebSocket.OPEN) enviar(p);
    else pendiente.push(p);
  };

  const liberar = () => {
    cerrado = true;
    clearInterval(reloj);
    proc.onaudioprocess = null;
    try { fuente.disconnect(); } catch { /* noop */ }
    try { proc.disconnect(); } catch { /* noop */ }
    try { mudo.disconnect(); } catch { /* noop */ }
    stream.getTracks().forEach((t) => t.stop());
    try { ws?.close(); } catch { /* noop */ }
  };

  let token: string;
  try {
    token = await op.obtenerToken(); // mientras llega, el audio se guarda en `pendiente`
  } catch (err) {
    liberar();
    throw err;
  }
  if (cerrado) return { terminar: async () => textoActual(), cancelar: () => {} };

  const url = "wss://api.elevenlabs.io/v1/speech-to-text/realtime"
    + `?model_id=scribe_v2_realtime&audio_format=pcm_16000&commit_strategy=manual`
    + `&language_code=${encodeURIComponent(op.idioma)}&token=${encodeURIComponent(token)}`;
  ws = new WebSocket(url);
  ws.onopen = () => {
    vigia.conexionAbierta(Date.now());
    for (const p of pendiente) enviar(p);
    pendiente = [];
  };
  ws.onmessage = (ev: MessageEvent) => {
    let m: any;
    try { m = JSON.parse(String(ev.data)); } catch { return; }
    const tipo = String(m?.message_type ?? "");
    if (tipo === "partial_transcript" || tipo.startsWith("committed_transcript")) vigia.texto();
    if (tipo === "partial_transcript") {
      parcial = String(m.text ?? "");
      op.onParcial(textoActual());
    } else if (tipo === "committed_transcript") {
      comprometido = `${comprometido} ${String(m.text ?? "")}`.trim();
      parcial = "";
      op.onParcial(textoActual());
      const r = esperandoCommit;
      esperandoCommit = null;
      r?.(textoActual());
    } else if (esErrorStt(m)) {
      fallar("servicio", String(m.error ?? m.message ?? tipo), tipo || "error");
    }
  };
  ws.onerror = () => fallar("conexion_cerrada", "Se perdió la conexión de transcripción.");
  // Antes no se escuchaba el cierre: si el servidor colgaba (llave rechazada,
  // cuota, límite de sesión), el audio se seguía guardando y nadie avisaba.
  ws.onclose = (ev: CloseEvent) => {
    const r = esperandoCommit;
    esperandoCommit = null;
    r?.(textoActual());
    if (!terminando) fallar("conexion_cerrada", `El servidor cerró la transcripción (${ev.code} ${ev.reason || ""}).`, ev.code);
  };

  return {
    async terminar() {
      if (cerrado) return textoActual();
      terminando = true;
      // Soltar el micrófono YA: así Closer vuelve a sonar a volumen completo.
      proc.onaudioprocess = null;
      stream.getTracks().forEach((t) => t.stop());
      const final = await new Promise<string>((resolve) => {
        const limite = setTimeout(() => { esperandoCommit = null; resolve(textoActual()); }, 2500);
        esperandoCommit = (t) => { clearTimeout(limite); resolve(t); };
        try {
          if (ws && ws.readyState === WebSocket.OPEN) {
            // Cierra el segmento con 0.1 s de silencio: el texto final llega como committed_transcript.
            enviar(new Int16Array(MUESTREO_STT / 10), true);
          } else {
            clearTimeout(limite);
            esperandoCommit = null;
            resolve(textoActual());
          }
        } catch {
          clearTimeout(limite);
          esperandoCommit = null;
          resolve(textoActual());
        }
      });
      liberar();
      return final;
    },
    cancelar() { liberar(); },
  };
}
