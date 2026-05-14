interface RetryScreenProps {
  title: string;
  subtitle: string;
  primaryButtonText: string;
  onPrimaryAction: () => void;
}

const ORANGE = "#FF6B2B";
const GOLD = "#FFD166";

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
        background: "#08080F",
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
            fontSize: 56,
            lineHeight: 1,
            color: GOLD,
          }}
        >
          💪
        </div>

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
            color: "#08080F",
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 10px 30px -8px rgba(255,107,43,0.45)",
          }}
        >
          {primaryButtonText}
        </button>
      </div>
    </div>
  );
}
