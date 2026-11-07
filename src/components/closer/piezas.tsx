/**
 * Las piezas base de Closer (Fase 2 del rediseño, mensaje 146, nov-2026).
 *
 * Un botón, una barra de avance y un cuadro de ícono, iguales en toda la app.
 * Las medidas y los colores vienen de src/styles.css (--h-boton, --r-boton, --c-…):
 * aquí no se escribe ninguna medida ni color a mano que no esté allá.
 */
import type { CSSProperties, ReactNode } from "react";

export type VarianteBoton = "principal" | "secundario" | "texto";

/** El estilo de un botón de Closer. Sirve para <button>, <motion.button> o <Link>. */
export function estiloBoton(variante: VarianteBoton = "principal", apagado = false): CSSProperties {
  const base: CSSProperties = {
    width: "100%",
    height: "var(--h-boton)",
    borderRadius: "var(--r-boton)",
    fontFamily: "'DM Sans', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    cursor: apagado ? "not-allowed" : "pointer",
    transition: "background 200ms ease, color 200ms ease, border-color 200ms ease",
    textDecoration: "none",
    WebkitTapHighlightColor: "transparent",
  };
  if (variante === "principal") {
    return {
      ...base,
      border: "none",
      background: apagado ? "var(--c-disabled-bg)" : "var(--c-primary)",
      color: apagado ? "var(--c-disabled-text)" : "var(--c-bg)",
      fontWeight: 700,
      fontSize: 17,
    };
  }
  if (variante === "secundario") {
    return {
      ...base,
      border: "1.5px solid var(--c-border)",
      background: "transparent",
      color: apagado ? "var(--c-disabled-text)" : "var(--c-text)",
      fontWeight: 600,
      fontSize: 16,
    };
  }
  return {
    ...base,
    width: "auto",
    height: 44,
    padding: "0 16px",
    border: "none",
    background: "transparent",
    color: "var(--c-text-soft)",
    fontWeight: 600,
    fontSize: 15,
  };
}

/** Barra de avance en segmentos: uno por tarjeta o pregunta. */
export function BarraSegmentos({ colores }: { colores: string[] }) {
  return (
    <div
      aria-hidden
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.max(colores.length, 1)}, minmax(0, 1fr))`,
        gap: 6,
      }}
    >
      {colores.map((c, i) => (
        <span key={i} style={{ height: 4, borderRadius: 2, background: c, transition: "background 300ms ease" }} />
      ))}
    </div>
  );
}

/** Colores de la barra cuando solo importa por dónde vas. */
export function segmentosDeAvance(total: number, actual: number): string[] {
  return Array.from({ length: total }, (_, i) => (i <= actual ? "var(--c-primary)" : "var(--c-border)"));
}

/** Un ícono dentro de su cuadro (44 px), en lugar de un emoji. */
export function CuadroIcono({ children, activo = false }: { children: ReactNode; activo?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 44,
        height: 44,
        flexShrink: 0,
        borderRadius: "var(--r-icono)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: activo ? "rgb(var(--c-primary-rgb) / 0.14)" : "var(--c-elevated)",
        color: activo ? "var(--c-primary)" : "var(--c-text-soft)",
        transition: "background 200ms ease, color 200ms ease",
      }}
    >
      {children}
    </span>
  );
}

/** El encabezado de una pantalla: regresar a la izquierda, título al centro. */
export function EncabezadoPantalla({
  onRegresar,
  etiquetaRegresar,
  centro,
}: {
  onRegresar: () => void;
  etiquetaRegresar: string;
  centro: ReactNode;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={onRegresar}
        aria-label={etiquetaRegresar}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          border: "none",
          background: "transparent",
          color: "var(--c-text-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <div style={{ textAlign: "center", minWidth: 0 }}>{centro}</div>
      <span />
    </div>
  );
}
