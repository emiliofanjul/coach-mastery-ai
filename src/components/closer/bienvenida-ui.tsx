/**
 * Las piezas de la bienvenida (mensaje 154, nov-2026).
 *
 * Lo que Emilio aprobó en la maqueta: menos pantallas, que enseñen haciendo. Sin emojis (se ven distintos
 * en cada teléfono y nunca se ven diseñados): íconos dibujados en su cuadro. Títulos en Syne medidos
 * (28 a 32 px), texto en DM Sans, botones de piezas.tsx, colores de styles.css.
 */
import type { CSSProperties, ReactNode } from "react";

const TRAZO = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Los íconos de la bienvenida, dibujados a 24 px. */
export const ICONOS = {
  libro: <><path d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2z" /><path d="M12 6.5v13" /></>,
  microfono: <><rect x="9" y="2.5" width="6" height="12" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></>,
  mejora: <><circle cx="12" cy="12" r="8.5" /><path d="M9 12.5l2 2 4-4.5" /></>,
  equipo: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c.7-3 3-4.6 5.5-4.6s4.8 1.6 5.5 4.6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14.6c2.2.1 3.9 1.5 4.5 4.4" /></>,
  meta: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
  escudo: <path d="M12 3l7 3v5.5c0 4.2-3 7.7-7 9.5-4-1.8-7-5.3-7-9.5V6z" />,
  puerta: <><path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21" /><path d="M3.5 21h17M14.5 12.5h.01" /></>,
  vuelta: <><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5" /><path d="M20 4v4.5h-4.5" /><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5" /><path d="M4 20v-4.5h4.5" /></>,
} as const;

export function Icono({ nombre, tam = 22 }: { nombre: keyof typeof ICONOS; tam?: number }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" aria-hidden {...TRAZO}>
      {ICONOS[nombre]}
    </svg>
  );
}

/** El nivel de experiencia como barras de señal (1, 2 o 3), en lugar de emojis. */
export function IconoNivel({ nivel, activo }: { nivel: 1 | 2 | 3; activo: boolean }) {
  const lleno = activo ? "var(--c-primary)" : "var(--c-text-soft)";
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={4 + i * 6} y={16 - i * 5} width={4} height={4 + i * 5} rx={1.5} fill={i < nivel ? lleno : "var(--c-border-strong)"} />
      ))}
    </svg>
  );
}

/** La palabra CLOSER arriba de la bienvenida. */
export function Marca() {
  return <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "0.06em", color: "var(--c-primary)" }}>CLOSER</div>;
}

export const estiloTitulo: CSSProperties = { margin: 0, fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.13, letterSpacing: "-0.02em", color: "var(--c-text)" };
export const estiloTexto: CSSProperties = { margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 17, lineHeight: 1.5, color: "var(--c-text-soft)" };
export const estiloEtiqueta: CSSProperties = { fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--c-text-2)" };

/** Un renglón con ícono en su cuadro, título y una línea de apoyo. */
export function FilaIcono({ icono, titulo, texto }: { icono: keyof typeof ICONOS; titulo: string; texto: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <span aria-hidden style={{ width: 44, height: 44, flex: "none", borderRadius: "var(--r-icono)", background: "var(--c-elevated)", color: "var(--c-text-soft)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icono nombre={icono} />
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 2 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, lineHeight: 1.35, color: "var(--c-text)" }}>{titulo}</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.45, color: "var(--c-text-2)" }}>{texto}</span>
      </div>
    </div>
  );
}

/** Una opción que se elige: tarjeta con ícono, título y descripción; la elegida en naranja. */
export function Opcion({ elegida, onClick, icono, titulo, texto }: { elegida: boolean; onClick: () => void; icono: ReactNode; titulo: string; texto: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={elegida}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        minHeight: 68,
        padding: "10px 16px 10px 12px",
        borderRadius: 16,
        color: "var(--c-text)",
        textAlign: "left",
        cursor: "pointer",
        transition: "background 200ms ease, border-color 200ms ease",
        background: elegida ? "rgb(var(--c-primary-rgb) / 0.07)" : "var(--c-surface)",
        border: `1.5px solid ${elegida ? "var(--c-primary)" : "var(--c-border)"}`,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span aria-hidden style={{ width: 44, height: 44, flex: "none", borderRadius: "var(--r-icono)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 200ms ease, color 200ms ease", background: elegida ? "rgb(var(--c-primary-rgb) / 0.14)" : "var(--c-elevated)", color: elegida ? "var(--c-primary)" : "var(--c-text-soft)" }}>
        {icono}
      </span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600 }}>{titulo}</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.4, color: "var(--c-text-2)" }}>{texto}</span>
      </span>
    </button>
  );
}

/** Una casilla que se marca, con su texto. */
export function Casilla({ marcada, onCambiar, children }: { marcada: boolean; onCambiar: (v: boolean) => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcada}
      onClick={() => onCambiar(!marcada)}
      style={{ width: "100%", display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 16px", borderRadius: 16, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-text-soft)", textAlign: "left", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
    >
      <span aria-hidden style={{ width: 22, height: 22, flex: "none", marginTop: 1, borderRadius: 7, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 150ms ease", ...(marcada ? { background: "var(--c-primary)" } : { border: "1.5px solid var(--c-border-strong)" }) }}>
        {marcada && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--c-bg)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
      </span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.45 }}>{children}</span>
    </button>
  );
}

/** El encabezado de las preguntas: regresar y la barra de avance en segmentos. */
export function EncabezadoPreguntas({ paso, total, onRegresar }: { paso: number; total: number; onRegresar?: () => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center" }}>
      <button
        type="button"
        onClick={onRegresar}
        aria-label="Regresar"
        disabled={!onRegresar}
        style={{ width: 44, height: 44, marginLeft: -10, border: "none", borderRadius: 22, background: "transparent", color: "var(--c-text-soft)", display: "flex", alignItems: "center", justifyContent: "center", cursor: onRegresar ? "pointer" : "default", visibility: onRegresar ? "visible" : "hidden", padding: 0 }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <div aria-label={`Pregunta ${paso} de ${total}`} style={{ display: "grid", gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`, gap: 6 }}>
        {Array.from({ length: total }, (_, k) => (
          <span key={k} style={{ height: 4, borderRadius: 2, transition: "background 300ms ease", background: k < paso ? "var(--c-primary)" : "var(--c-border)" }} />
        ))}
      </div>
      <span />
    </div>
  );
}
