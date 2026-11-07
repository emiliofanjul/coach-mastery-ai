import { CloserCharacter } from "@/components/closer/CloserCharacter";
import { estiloBoton } from "@/components/closer/piezas";

interface RetryScreenProps {
  title: string;
  subtitle: string;
  primaryButtonText: string;
  onPrimaryAction: () => void;
  /** Quiz (mensaje 146): cuántas acertó y cuáles falló, en lugar de solo «Casi». */
  resumen?: { aciertos: number; total: number; fallos: { n: number; texto: string }[] };
  secondaryButtonText?: string;
  onSecondaryAction?: () => void;
}

const GOLD = "var(--c-gold)";

export default function RetryScreen({
  title,
  subtitle,
  primaryButtonText,
  onPrimaryAction,
  resumen,
  secondaryButtonText,
  onSecondaryAction,
}: RetryScreenProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--c-bg)",
        color: "var(--c-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--m-pantalla)",
        overflowY: "auto",
        zIndex: 60,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            transformOrigin: "bottom center",
            animation: "closerSway 2s ease-in-out infinite",
          }}
        >
          {resumen ? (
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 64, lineHeight: 1, letterSpacing: "-0.03em" }}>
              {resumen.aciertos}
              <span style={{ color: "var(--c-disabled-text)" }}> / {resumen.total}</span>
            </div>
          ) : (
            <CloserCharacter state="motivation" size={86} />
          )}
        </div>
        <style>{`
          @keyframes closerSway {
            0%, 100% { transform: rotate(0deg); }
            50% { transform: rotate(3deg); }
          }
        `}</style>

        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: "var(--c-text)",
            marginTop: 20,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: 15,
            color: "var(--c-text-soft)",
            marginTop: 8,
            lineHeight: 1.5,
            maxWidth: 400,
          }}
        >
          {subtitle}
        </div>

        {resumen && resumen.fallos.length > 0 && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10, marginTop: 28, textAlign: "left" }}>
            {resumen.fallos.map((f) => (
              <div
                key={f.n}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                }}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    borderRadius: 14,
                    background: "rgb(var(--c-danger-rgb) / 0.14)",
                    color: "var(--c-danger)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {f.n}
                </span>
                <span style={{ flex: 1, fontSize: 15, lineHeight: 1.45, color: "var(--c-text-soft)" }}>{f.texto}</span>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={onPrimaryAction} style={{ ...estiloBoton("principal"), marginTop: 32 }}>
          {primaryButtonText}
        </button>
        {secondaryButtonText && onSecondaryAction && (
          <button type="button" onClick={onSecondaryAction} style={{ ...estiloBoton("secundario"), marginTop: 12 }}>
            {secondaryButtonText}
          </button>
        )}
      </div>
    </div>
  );
}
