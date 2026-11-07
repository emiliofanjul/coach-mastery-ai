import { estiloBoton, Estrella } from "@/components/closer/piezas";
import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { CloserCharacter } from "@/components/closer/CloserCharacter";

interface VictoryScreenProps {
  stars: 1 | 2 | 3;
  title: string;
  subtitle: string;
  buttonText: string;
  onContinue: () => void;
  extra?: ReactNode;
}

const ORANGE = "var(--c-primary)";
const GOLD = "var(--c-gold)";

export default function VictoryScreen({
  stars,
  title,
  subtitle,
  buttonText,
  onContinue,
  extra,
}: VictoryScreenProps) {
  useEffect(() => {
    const colors = ["#FF6B2B", "#F2C14E", "#FFFFFF", "#FFB088"]; // canvas: sin variables
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
        background: "var(--c-bg)",
        color: "#fff",
        display: "flex",
        alignItems: extra ? "flex-start" : "center",
        justifyContent: "center",
        padding: "1.2rem",
        paddingTop: extra ? "2.4rem" : "1.2rem",
        paddingBottom: "2.4rem",
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
            marginBottom: 12,
          }}
        >
          <CloserCharacter state="celebration" size={86} />
        </div>
        <div
          style={{
            display: "flex",
            gap: 14,
            justifyContent: "center",
          }}
        >
          {[0, 1, 2].map((i) => (
            // Fase 4 (mensaje 152): la misma estrella con brillo sutil del mapa y del resultado; aparecen una tras otra, sin rebote.
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 * i }}
              style={{ display: "inline-flex" }}
            >
              <Estrella ganada={i < stars} tam={48} />
            </motion.span>
          ))}
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

        {extra ? <div style={{ width: "100%", marginTop: 24 }}>{extra}</div> : null}

        <button type="button" onClick={onContinue} style={{ ...estiloBoton("principal"), marginTop: extra ? 24 : 40 }}>
          {buttonText.replace(/\s*→\s*$/, "")}
        </button>
      </div>
    </div>
  );
}
