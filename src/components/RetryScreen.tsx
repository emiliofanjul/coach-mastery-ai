import { CloserCharacter } from "@/components/closer/CloserCharacter";

interface RetryScreenProps {
  title: string;
  subtitle: string;
  primaryButtonText: string;
  onPrimaryAction: () => void;
}

const ORANGE = "var(--c-primary)";
const GOLD = "var(--c-gold)";

export default function RetryScreen({
  title,
  subtitle,
  primaryButtonText,
  onPrimaryAction,
}: RetryScreenProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--c-bg)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.2rem",
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
          <CloserCharacter state="motivation" size={86} />
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
            color: "#fff",
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
            color: "rgba(255,255,255,0.6)",
            marginTop: 8,
            lineHeight: 1.5,
            maxWidth: 400,
          }}
        >
          {subtitle}
        </div>

        <button
          onClick={onPrimaryAction}
          style={{
            width: "100%",
            height: 52,
            marginTop: 40,
            borderRadius: 99,
            border: "none",
            background: ORANGE,
            color: "var(--c-bg)",
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 10px 30px -8px rgb(var(--c-primary-rgb) / 0.45)",
          }}
        >
          {primaryButtonText}
        </button>
      </div>
    </div>
  );
}
