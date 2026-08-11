import { useEffect, useLayoutEffect, useState } from "react";
import { CloserCharacter } from "./CloserCharacter";

/**
 * MapTutorial — overlay spotlight de 5 pasos para el primer ingreso al mapa.
 * Closer sugiere, nunca bloquea: el botón "Saltar tutorial" siempre disponible.
 */

type TargetSpec =
  | { selector: string }
  | { rect: { top: number; left: number; width: number; height: number } };

type Step = {
  target: TargetSpec;
  text: string;
  subtext?: string;
  title?: string;
  state: "normal" | "motivation" | "support" | "celebration" | "correction";
};

interface Props {
  open: boolean;
  onClose: () => void; // se llama tanto al terminar como al saltar
}

const PADDING = 12;

export function MapTutorial({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [showFinal, setShowFinal] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState<Step[] | null>(null);

  const allSteps: Step[] = [

    {
      target: { selector: "[data-tour='active-node']" },
      text:
        "Este es tu nodo activo. Es donde entrenas hoy. Tócalo para empezar.",
      state: "normal",
    },
    {
      target: { selector: "[data-tour='locked-node']" },
      text:
        "Estos nodos se desbloquean cuando completas el anterior. Cada nodo es una habilidad real que vas a practicar por voz.",
      state: "support",
    },
    {
      target: { selector: "[data-tour='boss-node']" },
      text:
        "Al completar todos los nodos del mundo enfrentas el Boss Level. Es la prueba de que dominaste lo aprendido.",
      state: "correction",
    },
    {
      target: { selector: "[data-tour='world-next']" },
      text:
        "Cada mundo que completes desbloquea el siguiente. Tu camino al Vendedor Elite empieza aquí abajo.",
      state: "motivation",
    },
    {
      target: { selector: "[data-tour='coach-bubble']" },
      title: "Tu coach. Siempre aquí.",
      text: "Conoce cada técnica del mapa.",
      subtext: "Pregúntale lo que necesites.",
      state: "support",
    },
  ];

  // Al abrir, nos quedamos solo con los pasos cuyo elemento existe realmente
  // en el mapa. Si un target no está montado, ese paso se salta en vez de
  // mostrar una pantalla negra sin nada resaltado.
  useEffect(() => {
    if (!open) {
      setStep(0);
      setShowFinal(false);
      setVisibleSteps(null);
      return;
    }
    const filtered = allSteps.filter((s) => {
      if (!("selector" in s.target)) return true;
      return !!document.querySelector(s.target.selector);
    });
    setStep(0);
    setShowFinal(false);
    setVisibleSteps(filtered.length > 0 ? filtered : allSteps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const steps = visibleSteps ?? allSteps;

  // Calcular bounding box del target del paso actual
  useLayoutEffect(() => {
    if (!open) return;
    const current = steps[step];
    if (!current) return;

    const compute = () => {
      const t = current.target;
      if ("selector" in t) {
        const el = document.querySelector(t.selector);
        if (el) setRect(el.getBoundingClientRect());
        else setRect(null);
      } else {
        setRect(
          new DOMRect(t.rect.left, t.rect.top, t.rect.width, t.rect.height),
        );
      }
    };

    // Hacer scroll al elemento si tiene selector
    if ("selector" in current.target) {
      const el = document.querySelector(current.target.selector);
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }

    // Recalcular tras un pequeño delay para que el scroll se asiente
    const t1 = setTimeout(compute, 350);
    compute();

    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      clearTimeout(t1);
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [step, open, steps]);

  if (!open || !steps[step]) return null;


  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Final
      setShowFinal(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleSkip = () => onClose();

  if (showFinal) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          animation: "fadeOut 1.5s ease forwards",
        }}
      >
        <CloserCharacter state="motivation" size={120} />
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            color: "#FFFFFF",
            fontSize: "1.2rem",
            fontWeight: 700,
            textAlign: "center",
            padding: "0 2rem",
          }}
        >
          Listo. Ahora toca tu primer nodo.
        </div>
        <style>{`@keyframes fadeOut { 0%,60% { opacity: 1; } 100% { opacity: 0; } }`}</style>
      </div>
    );
  }

  // Spotlight rect
  const spot = rect
    ? {
        top: rect.top - PADDING,
        left: rect.left - PADDING,
        width: rect.width + PADDING * 2,
        height: rect.height + PADDING * 2,
      }
    : null;

  // Posicionar card debajo o encima del spotlight según haya espacio
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardBelow = spot ? spot.top + spot.height + 16 : 100;
  const placeAbove = cardBelow > vh - 280;
  const cardTop = spot
    ? placeAbove
      ? Math.max(20, spot.top - 260)
      : cardBelow
    : 100;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999 }}>
      {/* Overlay con clip-path para spotlight */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spot && (
              <rect
                x={spot.left}
                y={spot.top}
                width={spot.width}
                height={spot.height}
                rx={16}
                ry={16}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.85)"
          mask="url(#tour-mask)"
        />
        {spot && (
          <rect
            x={spot.left}
            y={spot.top}
            width={spot.width}
            height={spot.height}
            rx={16}
            ry={16}
            fill="none"
            stroke="#FF6B2B"
            strokeWidth={2}
            style={{
              filter: "drop-shadow(0 0 12px rgba(255,107,43,0.6))",
            }}
          />
        )}
      </svg>

      {/* Botón Saltar tutorial */}
      <button
        type="button"
        onClick={handleSkip}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          background: "transparent",
          border: "none",
          color: "#9090B0",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.75rem",
          padding: "6px 10px",
          cursor: "pointer",
        }}
      >
        Saltar tutorial
      </button>

      {/* Card de explicación */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: cardTop,
          transform: "translateX(-50%)",
          width: "min(340px, calc(100vw - 32px))",
          background: "#1A1A26",
          border: "1px solid #FF6B2B",
          borderRadius: 14,
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flexShrink: 0 }}>
            <CloserCharacter state={steps[step].state} size={56} />
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "#FFFFFF",
              fontSize: "0.9rem",
              lineHeight: 1.45,
            }}
          >
            {steps[step].title && (
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#FF6B2B",
                  marginBottom: 6,
                }}
              >
                {steps[step].title}
              </div>
            )}
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: steps[step].subtext ? 500 : 400,
                fontSize: "0.88rem",
                color: "#F0F0F5",
                lineHeight: 1.6,
                whiteSpace: "pre-line",
              }}
            >
              {steps[step].text}
            </div>
            {steps[step].subtext && (
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 400,
                  fontSize: "0.84rem",
                  color: "#5A5A8A",
                  lineHeight: 1.6,
                  marginTop: 4,
                }}
              >
                {steps[step].subtext}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.68rem",
              color: "#5A5A8A",
            }}
          >
            {step + 1} de {steps.length}
          </div>
          <button
            type="button"
            onClick={handleNext}
            style={{
              background: "#FF6B2B",
              border: "none",
              color: "#FFFFFF",
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              padding: "10px 18px",
              borderRadius: 99,
              cursor: "pointer",
            }}
          >
            {step === steps.length - 1 ? "Empezar →" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}
