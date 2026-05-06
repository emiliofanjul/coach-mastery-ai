import { useEffect, useState } from "react";

/**
 * Coach bubble específico para pantallas de auth (Pantallas 2, 3, 4).
 * Naranja, 48×48, esquina inferior derecha (bottom: 88px, right: 16px).
 * Entra con scale-bounce a los ~250ms tras montar. Modal solo UI.
 */
export function AuthCoachBubble() {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 250);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Hablar con el coach"
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "88px",
          right: "16px",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "#FF6B2B",
          boxShadow: "0 4px 20px rgba(255,107,43,0.35)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "1.2rem",
          lineHeight: 1,
          transform: shown ? "scale(1)" : "scale(0)",
          transition: "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          zIndex: 40,
        }}
      >
        💬
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(8,8,15,0.7)",
            backdropFilter: "blur(8px)",
            zIndex: 50,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "0 0.8rem 0.8rem",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "560px",
              background: "#111118",
              border: "1px solid #252535",
              borderRadius: "14px",
              padding: "1.25rem",
              fontFamily: "'DM Sans', sans-serif",
              color: "#F0F0F5",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
              <h3 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "1rem", margin: 0 }}>
                Tu coach
              </h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                style={{ background: "none", border: "none", color: "#5A5A8A", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "0.84rem", color: "#5A5A8A", margin: "0 0 0.8rem" }}>
              Estoy aquí. Cualquier duda sobre cómo registrarte o entrar, pregúntame.
            </p>
            <input
              type="text"
              placeholder="Escribe tu pregunta..."
              style={{
                width: "100%",
                background: "#08080F",
                border: "1px solid #252535",
                borderRadius: "99px",
                padding: "0.7rem 1rem",
                color: "#F0F0F5",
                fontSize: "0.84rem",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
