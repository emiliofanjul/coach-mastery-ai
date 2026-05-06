import { cn } from "@/lib/utils";

/**
 * CloserCharacter — figura humana geométrica estilizada del entrenador.
 *
 * 5 estados emocionales:
 *  - normal:       erguido, presente, brazos relajados
 *  - celebration:  inclinado adelante, brazo levantado en victoria
 *  - correction:   completamente erguido, mano levantada en pausa
 *  - motivation:   inclinado adelante, ambos brazos empujando al usuario
 *  - support:      relajado, mano extendida ofreciendo ayuda
 *
 * Construido en SVG con primitivas geométricas — círculos, líneas y
 * polígonos simples. Naranja #FF6B2B siempre. Sin imágenes raster.
 */
export type CloserState =
  | "normal"
  | "celebration"
  | "correction"
  | "motivation"
  | "support";

interface CloserCharacterProps {
  state?: CloserState;
  size?: number;
  className?: string;
}

export function CloserCharacter({
  state = "normal",
  size = 96,
  className,
}: CloserCharacterProps) {
  // Cada estado define la geometría del cuerpo.
  // viewBox 100x140. Cabeza arriba, pies abajo.
  const geometry = getGeometry(state);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center",
        state === "motivation" && "animate-breathe",
        className,
      )}
      style={{ width: size, height: size * 1.4 }}
      aria-label={`Closer estado ${state}`}
    >
      <svg
        viewBox="0 0 100 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Sombra base */}
        <ellipse
          cx="50"
          cy="132"
          rx="22"
          ry="3"
          fill="oklch(0 0 0 / 0.35)"
        />

        {/* Cabeza */}
        <circle
          cx={geometry.head.cx}
          cy={geometry.head.cy}
          r="11"
          fill="var(--color-primary)"
        />
        {/* brillo cabeza */}
        <circle
          cx={geometry.head.cx - 3}
          cy={geometry.head.cy - 3}
          r="3"
          fill="var(--color-primary-glow)"
          opacity="0.7"
        />

        {/* Torso (trapecio) */}
        <path
          d={geometry.torso}
          fill="var(--color-primary)"
        />

        {/* Brazo izquierdo */}
        <path
          d={geometry.armL}
          stroke="var(--color-primary)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Brazo derecho */}
        <path
          d={geometry.armR}
          stroke="var(--color-primary)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Piernas */}
        <line
          x1="44" y1="100" x2="42" y2="128"
          stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round"
        />
        <line
          x1="56" y1="100" x2="58" y2="128"
          stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round"
        />

        {/* Acento adicional según estado */}
        {state === "celebration" && (
          <>
            {/* Chispas */}
            <circle cx="20" cy="30" r="2" fill="var(--color-primary-glow)" />
            <circle cx="82" cy="22" r="2.5" fill="var(--color-primary-glow)" />
            <circle cx="14" cy="55" r="1.5" fill="var(--color-primary-glow)" />
          </>
        )}
        {state === "correction" && (
          /* Línea de "alto" sutil sobre la palma */
          <line
            x1="78" y1="38" x2="92" y2="38"
            stroke="var(--color-primary-glow)" strokeWidth="2" strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
}

interface Geometry {
  head: { cx: number; cy: number };
  torso: string;
  armL: string;
  armR: string;
}

function getGeometry(state: CloserState): Geometry {
  switch (state) {
    case "celebration":
      // Inclinado adelante, brazo derecho levantado en victoria
      return {
        head: { cx: 52, cy: 34 },
        torso: "M 42 46 L 58 46 L 62 100 L 38 100 Z",
        armL: "M 44 56 Q 30 70 28 86", // brazo izq abajo relajado
        armR: "M 60 50 Q 72 30 78 14", // brazo der arriba (victoria)
      };
    case "correction":
      // Completamente erguido, mano derecha levantada en "pausa"
      return {
        head: { cx: 50, cy: 30 },
        torso: "M 42 42 L 58 42 L 60 100 L 40 100 Z",
        armL: "M 42 54 L 32 90",
        armR: "M 60 50 Q 72 44 80 36", // mano levantada palma abierta
      };
    case "motivation":
      // Inclinado adelante, ambos brazos empujando al usuario
      return {
        head: { cx: 50, cy: 36 },
        torso: "M 40 48 L 60 48 L 62 100 L 38 100 Z",
        armL: "M 42 56 Q 28 70 22 88", // empuje hacia adelante
        armR: "M 58 56 Q 72 70 78 88",
      };
    case "support":
      // Relajado, mano derecha extendida ofreciendo
      return {
        head: { cx: 50, cy: 32 },
        torso: "M 42 44 L 58 44 L 60 100 L 40 100 Z",
        armL: "M 42 56 Q 36 76 34 92",
        armR: "M 60 56 Q 76 64 88 62", // mano extendida horizontalmente
      };
    case "normal":
    default:
      // Erguido, presente, brazos relajados a los lados
      return {
        head: { cx: 50, cy: 30 },
        torso: "M 42 42 L 58 42 L 60 100 L 40 100 Z",
        armL: "M 42 54 Q 36 74 32 92",
        armR: "M 58 54 Q 64 74 68 92",
      };
  }
}
