/**
 * Las piezas de la pantalla de práctica (Fase 4 del rediseño, mensaje 151, nov-2026).
 *
 * Lo que Emilio aprobó en la maqueta: al centro va el cliente (sus iniciales, su nombre y su negocio),
 * no Closer; Closer sale al centro solo cuando demuestra. El anillo se mueve con la voz de quien habla.
 * Lo que se dice va en una franja de altura fija que siempre muestra las últimas palabras: nada brinca.
 * El micrófono es un ícono dibujado (nunca el emoji) con tres estados: te toca, grabando y escuchando.
 * Sin contador de turnos: la práctica puede terminar antes del máximo y no debe sentirse incompleta.
 *
 * Solo cambia cómo se ve. La voz, los turnos y la calificación siguen en nodo.$nodeId.practica.tsx.
 * Colores y medidas: de src/styles.css (--c-…), como todas las pantallas.
 */
import { useEffect, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

// ─── La voz de quien te habla (mensaje 151-B, 7-nov, Emilio en su iPhone) ───
// Antes, el texto del cliente salía completo de golpe y los anillos «levitaban» parejo, sin seguir el audio.
// Ahora playTTS publica aquí qué se está diciendo, cuánto va (0 a 1) y qué tan fuerte suena en este instante.
// El nivel sale de la «envolvente» del audio: se decodifica una copia aparte y se mide su volumen cada 50 ms.
// La reproducción NO pasa por el procesador de audio: el iPhone suena exactamente igual que antes.
// Solo la franja y los anillos escuchan esta señal, así la pantalla no se vuelve a dibujar 60 veces por segundo.

export type EstadoVozAgente = { texto: string; progreso: number; nivel: number; conEnvolvente: boolean; activa: boolean };
let estadoVoz: EstadoVozAgente = { texto: "", progreso: 0, nivel: 0, conEnvolvente: false, activa: false };
const oyentesVoz = new Set<() => void>();
export const vozDelAgente = {
  leer: () => estadoVoz,
  poner: (p: Partial<EstadoVozAgente>) => {
    estadoVoz = { ...estadoVoz, ...p };
    oyentesVoz.forEach((f) => f());
  },
  escuchar: (f: () => void) => {
    oyentesVoz.add(f);
    return () => { oyentesVoz.delete(f); };
  },
};
export function useVozDelAgente(): EstadoVozAgente {
  return useSyncExternalStore(vozDelAgente.escuchar, vozDelAgente.leer, vozDelAgente.leer);
}

/** Cada cuánto se mide el volumen del audio, en segundos. */
export const PASO_ENVOLVENTE = 0.05;

/**
 * El volumen del audio cada 50 ms, de 0 a 1. Decodifica una copia del audio en un contexto fuera de línea
 * (no toca la reproducción). Si el teléfono no puede, devuelve null y los anillos usan su movimiento suave.
 */
export async function envolventeDe(blob: Blob): Promise<number[] | null> {
  try {
    const w = window as any;
    const AC = w.OfflineAudioContext || w.webkitOfflineAudioContext;
    if (!AC) return null;
    const datos = await blob.arrayBuffer();
    const ctx = new AC(1, 44100, 44100);
    const buf: AudioBuffer = await new Promise((ok, mal) => {
      const r = ctx.decodeAudioData(datos, ok, mal);
      if (r && typeof r.then === "function") r.then(ok, mal);
    });
    const canal = buf.getChannelData(0);
    const tam = Math.max(1, Math.round(buf.sampleRate * PASO_ENVOLVENTE));
    const rms: number[] = [];
    for (let i = 0; i < canal.length; i += tam) {
      let suma = 0;
      const fin = Math.min(canal.length, i + tam);
      for (let j = i; j < fin; j++) suma += canal[j] * canal[j];
      rms.push(Math.sqrt(suma / (fin - i)));
    }
    const max = Math.max(...rms, 1e-6);
    // Raíz para que las sílabas suaves también se noten; y un suavizado corto para que no tiemble.
    const crudo = rms.map((v) => Math.sqrt(v / max));
    return crudo.map((v, i) => (v + (crudo[i - 1] ?? v) + (crudo[i + 1] ?? v)) / 3);
  } catch {
    return null;
  }
}

/** Lo que ya se dijo: el texto hasta donde va el audio, cortado al final de una palabra. */
export function textoHastaProgreso(texto: string, progreso: number): string {
  if (progreso >= 1) return texto;
  if (progreso <= 0) return "";
  let n = Math.round(texto.length * progreso);
  while (n < texto.length && !/\s/.test(texto[n])) n++;
  return texto.slice(0, n);
}

/** Las iniciales del cliente: la primera y la última palabra. «Don Ramón» → «DR»; «Doña Lupe Pérez» → «DP». */
export function inicialesDe(nombre: string): string {
  const palabras = (nombre || "").trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "?";
  const letras = palabras.length >= 2 ? palabras[0][0] + palabras[palabras.length - 1][0] : palabras[0][0];
  return letras.toUpperCase();
}

/**
 * Medidas del escenario: en un teléfono alto se ve como en la maqueta (196 px); en uno bajo, o con la barra
 * del navegador, se encoge con la altura de la pantalla para que nada se encime.
 */
const ESCENARIO = "min(196px, 20dvh)";
const CIRCULO = "min(148px, 15dvh)";

const TRAZO = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function IconoCerrar({ tam = 22 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden {...TRAZO}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconoMicrofono({ tam = 34, color = "currentColor" }: { tam?: number; color?: string }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden {...TRAZO} stroke={color}>
      <rect x="9" y="2.5" width="6" height="12" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  );
}

export function IconoTeclado({ tam = 22 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden {...TRAZO} strokeWidth={1.8}>
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
    </svg>
  );
}

export function IconoEnviar({ tam = 20 }: { tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden {...TRAZO} strokeWidth={2.2}>
      <path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" />
    </svg>
  );
}

/** Botón redondo de 44 px sin fondo (salir, cambiar a texto). */
export function BotonIcono({ onClick, etiqueta, children, color = "var(--c-text-soft)" }: { onClick?: () => void; etiqueta: string; children: ReactNode; color?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      title={etiqueta}
      style={{ width: 44, height: 44, borderRadius: 22, border: "none", background: "transparent", color, display: "flex", alignItems: "center", justifyContent: "center", cursor: onClick ? "pointer" : "default", padding: 0, WebkitTapHighlightColor: "transparent" }}
    >
      {children}
    </button>
  );
}

/** Voz | Texto, como dos segmentos con ícono (antes: 🎤 ↔ ⌨️). */
export function SelectorModo({ modo, onCambiar }: { modo: "voice" | "text"; onCambiar: () => void }) {
  const seg = (activo: boolean): CSSProperties => ({
    height: 34,
    padding: "0 12px",
    border: "none",
    borderRadius: 9,
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    cursor: activo ? "default" : "pointer",
    background: activo ? "var(--c-border)" : "transparent",
    color: activo ? "var(--c-text)" : "var(--c-text-2)",
  });
  return (
    <div role="group" aria-label="Cómo practicar" style={{ display: "flex", padding: 3, borderRadius: 12, background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
      <button type="button" aria-pressed={modo === "voice"} onClick={modo === "voice" ? undefined : onCambiar} style={seg(modo === "voice")}>
        <IconoMicrofono tam={16} /> Voz
      </button>
      <button type="button" aria-pressed={modo === "text"} onClick={modo === "text" ? undefined : onCambiar} style={seg(modo === "text")}>
        <IconoTeclado tam={16} /> Texto
      </button>
    </div>
  );
}

/** Los anillos que se mueven con una voz. `activo` los enciende; el color es el de quien habla. */
function Anillos({ activo, rgb }: { activo: boolean; rgb: string }) {
  const voz = useVozDelAgente();
  // Con la envolvente, el anillo crece con la voz real. Sin ella (teléfono que no decodifica), el movimiento suave de antes.
  const sigueLaVoz = activo && voz.activa && voz.conEnvolvente;
  const n = sigueLaVoz ? voz.nivel : 0;
  const base: CSSProperties = { position: "absolute", borderRadius: "50%", transition: "opacity 400ms ease, border-color 400ms ease, transform 90ms linear", pointerEvents: "none" };
  return (
    <>
      <div
        className={activo && !sigueLaVoz ? "practica-onda-a" : undefined}
        style={{ ...base, inset: 0, border: `2px solid ${activo ? `rgb(${rgb} / ${0.35 + n * 0.45})` : "var(--c-border)"}`, transform: sigueLaVoz ? `scale(${1 + n * 0.09})` : undefined }}
      />
      <div
        className={activo && !sigueLaVoz ? "practica-onda-b" : undefined}
        style={{ ...base, inset: -14, border: `1px solid rgb(${rgb} / 0.22)`, opacity: activo ? (sigueLaVoz ? 0.25 + n * 0.75 : 1) : 0, transform: sigueLaVoz ? `scale(${1 + n * 0.16})` : undefined }}
      />
    </>
  );
}

/** Las animaciones de esta pantalla. Pocas y suaves; respetan «reducir movimiento». */
export const ESTILOS_PRACTICA = `
@keyframes practicaOndaA{0%,100%{transform:scale(1)}20%{transform:scale(1.05)}45%{transform:scale(1.015)}70%{transform:scale(1.07)}85%{transform:scale(1.03)}}
@keyframes practicaOndaB{0%,100%{transform:scale(1.02)}30%{transform:scale(1.09)}55%{transform:scale(1.03)}80%{transform:scale(1.11)}}
@keyframes practicaInvita{0%,100%{box-shadow:0 0 0 0 rgb(var(--c-primary-rgb) / 0.42)}50%{box-shadow:0 0 0 14px rgb(var(--c-primary-rgb) / 0)}}
@keyframes practicaPensando{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes practicaGira{to{transform:rotate(360deg)}}
.practica-gira{animation:practicaGira .9s linear infinite}
.practica-onda-a{animation:practicaOndaA 1.4s ease-in-out infinite}
.practica-onda-b{animation:practicaOndaB 1.7s ease-in-out infinite}
.practica-mic-invita{animation:practicaInvita 2.4s ease-out infinite}
.practica-pensando{animation:practicaPensando 1.4s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.practica-onda-a,.practica-onda-b,.practica-mic-invita,.practica-pensando,.practica-gira{animation:none !important}}
`;

/** El cliente al centro: iniciales en azul, su nombre, su negocio y qué está pasando. */
export function EscenarioCliente({
  nombre,
  detalle,
  hablando,
  atenuado,
  estado,
  pensando,
}: {
  nombre: string;
  detalle: string;
  hablando: boolean;
  atenuado: boolean;
  estado: string | null;
  pensando: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "min(18px, 2dvh)" }}>
      <div style={{ position: "relative", width: ESCENARIO, height: ESCENARIO, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Anillos activo={hablando} rgb="var(--c-client-rgb)" />
        <div
          aria-hidden
          style={{
            width: CIRCULO,
            height: CIRCULO,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(circle at 35% 30%, var(--c-avatar-claro) 0%, var(--c-avatar-centro) 55%, var(--c-avatar-hondo) 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            opacity: atenuado ? 0.55 : 1,
            transition: "opacity 400ms ease",
          }}
        >
          <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "min(44px, 5.6dvh)", letterSpacing: "-0.02em", color: "var(--c-text)", lineHeight: 1 }}>{inicialesDe(nombre)}</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.01em", color: "var(--c-text)" }}>{nombre}</div>
        {detalle && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-text-2)", marginTop: 4 }}>{detalle}</div>}
      </div>
      <div style={{ height: 28 }}>
        {estado && (
          <div
            className={pensando ? "practica-pensando" : undefined}
            style={{
              height: 28,
              padding: "0 12px",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              background: hablando ? "rgb(var(--c-client-rgb) / 0.12)" : "var(--c-surface)",
              color: hablando ? "var(--c-client)" : "var(--c-text-2)",
            }}
          >
            {estado}
          </div>
        )}
      </div>
    </div>
  );
}

/** Closer al centro: solo cuando demuestra. */
export function EscenarioCloser({ hablando, rol }: { hablando: boolean; rol: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "min(18px, 2dvh)" }}>
      <div style={{ position: "relative", width: ESCENARIO, height: ESCENARIO, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Anillos activo={hablando} rgb="var(--c-primary-rgb)" />
        <div style={{ width: CIRCULO, height: CIRCULO, borderRadius: "50%", background: "var(--c-surface)", border: "1px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 100 140" fill="none" aria-hidden style={{ width: "57%", height: "80%" }}>
            <circle cx="50" cy="30" r="11" fill="var(--c-primary)" />
            <path d="M 42 42 L 58 42 L 60 100 L 40 100 Z" fill="var(--c-primary)" />
            <path d="M 42 54 Q 36 74 32 92" stroke="var(--c-primary)" strokeWidth="6" strokeLinecap="round" />
            <path d="M 58 54 Q 64 74 68 92" stroke="var(--c-primary)" strokeWidth="6" strokeLinecap="round" />
            <line x1="44" y1="100" x2="42" y2="128" stroke="var(--c-primary)" strokeWidth="6" strokeLinecap="round" />
            <line x1="56" y1="100" x2="58" y2="128" stroke="var(--c-primary)" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: "-0.01em", color: "var(--c-text)" }}>Closer</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-text-2)", marginTop: 4 }}>{rol}</div>
      </div>
    </div>
  );
}

/**
 * La franja de lo que se dice: altura fija, muestra siempre las últimas palabras y desvanece las de arriba.
 * Así el texto nunca empuja el resto de la pantalla.
 */
export function FranjaDialogo({ quien, colorQuien, texto }: { quien: string; colorQuien: string; texto: string }) {
  return (
    <div
      aria-live="polite"
      style={{
        height: 104,
        boxSizing: "border-box",
        padding: "12px 16px 14px",
        borderRadius: 16,
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        flexShrink: 0,
      }}
    >
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: colorQuien, minHeight: 15 }}>{quien}</div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0, black 28px)",
          maskImage: "linear-gradient(to bottom, transparent 0, black 28px)",
        }}
      >
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.45, color: "var(--c-text-soft)" }}>{texto}</div>
      </div>
    </div>
  );
}

/**
 * La franja mientras habla el cliente o Closer: las palabras aparecen al ritmo del audio, no de golpe.
 * Mientras llega el audio (antes de que suene) queda vacía.
 */
export function FranjaVozAgente({ quien, colorQuien }: { quien: string; colorQuien: string }) {
  const voz = useVozDelAgente();
  return <FranjaDialogo quien={quien} colorQuien={colorQuien} texto={textoHastaProgreso(voz.texto, voz.progreso)} />;
}

/**
 * El micrófono: te toca (naranja con volumen, invita sin gritar), grabando (rojo con el cuadro, el anillo
 * sigue tu voz de verdad) o apagado (mientras habla el cliente o se piensa la respuesta).
 */
export function BotonMicrofono({
  estado,
  nivelVoz,
  etiqueta,
  onClick,
}: {
  estado: "te_toca" | "grabando" | "apagado";
  nivelVoz: number;
  etiqueta: string;
  onClick: () => void;
}) {
  const grabando = estado === "grabando";
  const toca = estado === "te_toca";
  const fondo: CSSProperties = grabando
    ? { background: "var(--c-danger)" }
    : toca
      ? {
          background: "linear-gradient(180deg, var(--c-play-claro) 0%, var(--c-play-centro) 50%, var(--c-play-hondo) 100%)",
          boxShadow: "inset 0 -3px 0 rgb(var(--c-play-sombra-rgb) / 0.35), inset 0 2px 0 rgba(255,255,255,0.25)",
        }
      : { background: "var(--c-disabled-bg)" };
  return (
    <div style={{ position: "relative", width: 84, height: 84, margin: "6px 0" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -12,
          borderRadius: "50%",
          border: "2px solid rgb(var(--c-danger-rgb) / 0.45)",
          opacity: grabando ? 1 : 0,
          transform: `scale(${1 + Math.min(1, nivelVoz * 1.4) * 0.22})`,
          transition: "opacity 200ms ease, transform 90ms linear",
          pointerEvents: "none",
        }}
      />
      <button
        type="button"
        onClick={onClick}
        disabled={estado === "apagado"}
        aria-label={etiqueta}
        className={toca ? "practica-mic-invita" : undefined}
        style={{
          position: "relative",
          width: 84,
          height: 84,
          borderRadius: "50%",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: estado === "apagado" ? "default" : "pointer",
          transition: "background 200ms ease",
          WebkitTapHighlightColor: "transparent",
          padding: 0,
          ...fondo,
        }}
      >
        {grabando ? (
          <span style={{ width: 24, height: 24, borderRadius: 6, background: "#FFFFFF", display: "block" }} />
        ) : (
          <IconoMicrofono tam={34} color={toca ? "#FFFFFF" : "var(--c-disabled-text)"} />
        )}
      </button>
    </div>
  );
}

// ─── El análisis y la calificación (Fase 4, mensaje 152) ───

/**
 * La frase bajo las estrellas. Dice lo que el vendedor logró, no lo que «pasa solo» (Emilio, 7-nov):
 * «desbloqueaste», no «se abre». Solo habla de desbloquear cuando de verdad desbloqueó algo hoy:
 * no si ya lo había pasado antes, ni en la certificación (que es el final del mapa).
 */
export function lineaDeEstrellas(estrellas: number, o: { yaLoHabiaPasado: boolean; esReto: boolean; esElUltimo: boolean }): string {
  const desbloquea = !o.yaLoHabiaPasado && !o.esElUltimo;
  const siguiente = o.esReto ? "el siguiente mundo" : "el siguiente nodo";
  if (estrellas >= 3) return desbloquea ? `Tres estrellas: lo dominaste y desbloqueaste ${siguiente}.` : "Tres estrellas: lo dominaste.";
  if (estrellas === 2) return desbloquea ? `Dos estrellas: desbloqueaste ${siguiente}.` : "Dos estrellas.";
  if (estrellas === 1) return o.yaLoHabiaPasado ? "Una estrella esta vez. Las que ya tenías se quedan." : `Una estrella. Con dos desbloqueas ${siguiente}.`;
  return o.yaLoHabiaPasado ? "Sin estrellas esta vez. Las que ya tenías se quedan." : "Sin estrellas esta vez. Vuelve a intentarlo cuando quieras.";
}

/**
 * La calificación dentro de su anillo: el número sube de 0 a la calificación (900 ms) y el anillo se llena con él.
 * El número va solo, sin «de 100», para quedar centrado de verdad dentro del círculo.
 */
export function AnilloCalificacion({ calificacion, tam = 172 }: { calificacion: number; tam?: number }) {
  const [valor, setValor] = useState(0);
  useEffect(() => {
    const meta = Math.max(0, Math.min(100, Math.round(calificacion)));
    const quieto = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (quieto) { setValor(meta); return; }
    const t0 = performance.now();
    let raf = 0;
    const paso = (ahora: number) => {
      const k = Math.min(1, (ahora - t0) / 900);
      setValor(Math.round(meta * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [calificacion]);
  const r = 70;
  const largo = 2 * Math.PI * r;
  return (
    <div role="img" aria-label={`Calificación: ${Math.round(calificacion)} de 100`} style={{ position: "relative", width: tam, height: tam, margin: "0 auto" }}>
      <svg width={tam} height={tam} viewBox="0 0 156 156" aria-hidden style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx="78" cy="78" r={r} fill="none" stroke="var(--c-elevated)" strokeWidth="7" />
        <circle cx="78" cy="78" r={r} fill="none" stroke="var(--c-primary)" strokeWidth="7" strokeLinecap="round" strokeDasharray={largo} strokeDashoffset={largo * (1 - valor / 100)} />
      </svg>
      <div aria-hidden style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: Math.round(tam * 0.256), lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: "var(--c-text)" }}>{valor}</span>
      </div>
    </div>
  );
}

/** Lo que se está revisando: una palomita al terminar cada cosa; la actual gira. */
export function ListaRevision({ pasos, actual }: { pasos: string[]; actual: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", padding: "6px 16px", borderRadius: "var(--r-tarjeta)", background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
      {pasos.map((texto, k) => {
        const hecho = k < actual;
        const ahora = k === actual;
        return (
          <div key={texto} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 44 }}>
            <span
              aria-hidden
              className={ahora ? "practica-gira" : undefined}
              style={{
                width: 22,
                height: 22,
                flex: "none",
                borderRadius: 11,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...(hecho ? { background: "var(--c-success)" } : ahora ? { border: "2px solid var(--c-border)", borderTopColor: "var(--c-primary)" } : { border: "2px solid var(--c-border)" }),
              }}
            >
              {hecho && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-bg)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              )}
            </span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.35, color: hecho ? "var(--c-text-soft)" : ahora ? "var(--c-text)" : "var(--c-disabled-text)", fontWeight: ahora ? 600 : 400 }}>{texto}</span>
          </div>
        );
      })}
    </div>
  );
}

/** La conversación completa como burbujas: tú a la derecha (naranja), el cliente a la izquierda (azul). */
export function DialogoCompleto({ turnos }: { turnos: { quien: string; esTuyo: boolean; texto: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {turnos.map((t, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: t.esTuyo ? "flex-end" : "flex-start" }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: t.esTuyo ? "var(--c-primary)" : "var(--c-client)" }}>{t.quien}</div>
          <div
            style={{
              maxWidth: "84%",
              padding: "10px 14px",
              borderRadius: 16,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              lineHeight: 1.45,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              ...(t.esTuyo
                ? { background: "var(--c-elevated)", color: "var(--c-text)", borderTopRightRadius: 6 }
                : { background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text-soft)", borderTopLeftRadius: 6 }),
            }}
          >
            {t.texto}
          </div>
        </div>
      ))}
    </div>
  );
}
