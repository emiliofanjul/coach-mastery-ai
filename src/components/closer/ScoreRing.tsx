import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * ScoreRing — anillo animado del score 0-100.
 *
 * Filosofía: el score nunca se muestra solo. Aquí solo el visual del anillo
 * — el desglose de 4 capas vive en el componente FeedbackBreakdown.
 *
 * Colores semánticos:
 *  - <60  → score-low (rojo)
 *  - 60-79→ score-mid (amarillo)
 *  - 80+  → score-high (verde)
 */
interface ScoreRingProps {
  score: number;          // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;         // p.ej. "Score" o "Hoy"
  animate?: boolean;
}

export function ScoreRing({
  score,
  size = 180,
  strokeWidth = 14,
  label = "Score",
  animate = true,
}: ScoreRingProps) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const [renderedScore, setRenderedScore] = useState(animate ? 0 : safeScore);

  useEffect(() => {
    if (!animate) {
      setRenderedScore(safeScore);
      return;
    }
    const start = performance.now();
    const duration = 1100;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setRenderedScore(Math.round(eased * safeScore));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [safeScore, animate]);

  const offset = circumference - (renderedScore / 100) * circumference;

  const colorVar =
    safeScore >= 80
      ? "var(--color-score-high)"
      : safeScore >= 60
        ? "var(--color-score-mid)"
        : "var(--color-score-low)";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorVar}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          opacity="0.25"
          style={{ filter: "blur(8px)" }}
        />
        {/* Trazo principal */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorVar}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 80ms linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-bold leading-none"
          style={{ fontSize: size * 0.32, color: colorVar }}
        >
          {renderedScore}
        </span>
        <span className="eyebrow mt-2">{label}</span>
      </div>
    </div>
  );
}

/** Etiqueta semántica del rango — útil al lado del ring */
export function ScoreLabel({ score, className }: { score: number; className?: string }) {
  const text =
    score >= 80 ? "Sólido" : score >= 60 ? "En forma" : "Necesita trabajo";
  const color =
    score >= 80
      ? "text-success"
      : score >= 60
        ? "text-warning"
        : "text-destructive";
  return (
    <span className={cn("font-display font-semibold text-sm", color, className)}>
      {text}
    </span>
  );
}
