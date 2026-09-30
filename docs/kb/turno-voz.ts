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
  readonly turnos: { turno: number; inicio_seg: number; fin_seg: number }[] = [];
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
  get duracionSeg(): number { return this.muestras / this.muestreo; }
  wav(): Blob | null {
    this.cerrarTurno();
    if (this.muestras === 0) return null;
    return new Blob([armarWav(this.trozos, this.muestreo)], { type: "audio/wav" });
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

export interface OpcionesTurno {
  obtenerToken(): Promise<string>;
  idioma: string;
  onParcial(texto: string): void;
  onNivel(nivel: number): void;
  onPcm?(p: Int16Array): void;
  onError(mensaje: string): void;
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
  const textoActual = () => `${comprometido} ${parcial}`.replace(/\s+/g, " ").trim();
  const enviar = (p: Int16Array, commit = false) => {
    ws!.send(JSON.stringify({ message_type: "input_audio_chunk", audio_base_64: aBase64(p), commit }));
  };

  proc.onaudioprocess = (e: AudioProcessingEvent) => {
    if (cerrado) return;
    const f = e.inputBuffer.getChannelData(0);
    op.onNivel(nivelDeVoz(f));
    const p = aInt16(reducirMuestreo(f, c.sampleRate, MUESTREO_STT));
    op.onPcm?.(p);
    if (ws && ws.readyState === WebSocket.OPEN) enviar(p);
    else pendiente.push(p);
  };

  const liberar = () => {
    cerrado = true;
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
    for (const p of pendiente) enviar(p);
    pendiente = [];
  };
  ws.onmessage = (ev: MessageEvent) => {
    let m: any;
    try { m = JSON.parse(String(ev.data)); } catch { return; }
    const tipo = String(m?.message_type ?? "");
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
    } else if (/error|rate_limited|quota|throttled/i.test(tipo)) {
      op.onError(String(m.error ?? m.message ?? tipo));
    }
  };
  ws.onerror = () => { if (!cerrado) op.onError("Se perdió la conexión de transcripción."); };

  return {
    async terminar() {
      if (cerrado) return textoActual();
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
