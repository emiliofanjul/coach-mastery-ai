import { useLayoutEffect, useRef, useState } from "react";

/**
 * La primera vez en el mapa (mensaje 154, nov-2026): un solo globo sobre el nodo que toca, en lugar del
 * recorrido de 5 pasos con foco (era frágil y hablaba de «Vendedor Elite»). Dice dónde empezar y cuánto
 * toma; se cierra con «Entendido» y no vuelve (sellers.map_tutorial_completed).
 *
 * Se coloca midiendo el nodo activo ([data-active-node]) y sigue al nodo si la persona desliza el mapa.
 */
export function GuiaMapa({ texto, onCerrar }: { texto: string; onCerrar: () => void }) {
  const [pos, setPos] = useState<{ abajo: number; flecha: number } | null>(null);
  const caja = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const medir = () => {
      const nodo = document.querySelector<HTMLElement>("[data-active-node]");
      const c = caja.current;
      if (!nodo || !c) return;
      const r = nodo.getBoundingClientRect();
      const cr = c.getBoundingClientRect();
      // El círculo del nodo mide 52–64 px y queda arriba de su caja; el anillo que respira sale 6 px.
      setPos({
        abajo: window.innerHeight - r.top + 24,
        flecha: Math.min(Math.max(r.left + r.width / 2 - cr.left, 24), cr.width - 24),
      });
    };
    medir();
    window.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      window.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, []);

  return (
    <div
      ref={caja}
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: "var(--m-pantalla)",
        right: "var(--m-pantalla)",
        maxWidth: 520,
        margin: "0 auto",
        bottom: pos?.abajo ?? 0,
        zIndex: 30,
        visibility: pos ? "visible" : "hidden",
        animation: pos ? "guiaAparece 400ms 150ms ease both" : undefined,
      }}
    >
      <div
        style={{
          position: "relative",
          padding: "16px 16px 14px",
          borderRadius: 18,
          background: "var(--c-elevated)",
          border: "1px solid var(--c-border-strong)",
          boxShadow: "0 20px 40px -12px rgb(0 0 0 / 0.6)",
          fontFamily: "'DM Sans', sans-serif",
          color: "var(--c-text)",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700 }}>Empieza aquí</div>
        <div style={{ marginTop: 4, fontSize: 15, lineHeight: 1.45, color: "var(--c-text-soft)" }}>{texto}</div>
        <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCerrar}
            style={{ height: 40, padding: "0 16px", border: "none", borderRadius: 12, background: "var(--c-border)", color: "var(--c-text)", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
          >
            Entendido
          </button>
        </div>
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: (pos?.flecha ?? 0) - 7,
            bottom: -8,
            width: 14,
            height: 14,
            background: "var(--c-elevated)",
            borderRight: "1px solid var(--c-border-strong)",
            borderBottom: "1px solid var(--c-border-strong)",
            transform: "rotate(45deg)",
          }}
        />
      </div>
      <style>{`@keyframes guiaAparece{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
