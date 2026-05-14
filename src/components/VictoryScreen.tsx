import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { CloserCharacter } from "@/components/closer/CloserCharacter";

interface VictoryScreenProps {
  stars: 1 | 2 | 3;
  title: string;
  subtitle: string;
  buttonText: string;
  onContinue: () => void;
}

const ORANGE = "#FF6B2B";
const GOLD = "#FFD166";

export default function VictoryScreen({
  stars,
  title,
  subtitle,
  buttonText,
  onContinue,
}: VictoryScreenProps) {
  useEffect(() => {
    const colors = ["#FF6B2B", "#FFD166", "#06D6A0", "#B57BEE", "#ffffff"];
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.3 },
      colors,
    });
    const t = setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.4 },
        colors,
      });
    }, 800);
    return () => clearTimeout(t);
  }, []);

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
            display: "flex",
            justifyContent: "center",
            marginBottom: 12,
            animation: "closerBounce 1.5s ease-in-out infinite",
          }}
        >
          <CloserCharacter state="celebration" size={86} />
        </div>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
          }}
        >
          {[0, 1, 2].map((i) => {
            const earned = i < stars;
            return (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  fontSize: 48,
                  lineHeight: 1,
                  color: earned ? GOLD : "rgba(255,255,255,0.15)",
                  filter: earned
                    ? "drop-shadow(0 0 8px #FFD166) drop-shadow(0 0 16px #FFD166)"
                    : undefined,
                }}
              >
                ★
              </motion.span>
            );
          })}
        </div>
        <style>{`
          @keyframes closerBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
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
          onClick={onContinue}
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
          {buttonText}
        </button>
      </div>
    </div>
  );
}
