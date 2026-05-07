import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CloserCharacter } from "@/components/closer/CloserCharacter";

export const Route = createFileRoute("/onboarding/map-intro")({
  head: () => ({
    meta: [
      { title: "Tu camino al Elite — Closer" },
      { name: "description", content: "Conoce el mapa de entrenamiento." },
    ],
  }),
  component: MapIntro,
});

const BG = "#08080F";

const WORLDS: Array<{
  id: number;
  icon: string;
  name: string;
  color: string;
}> = [
  { id: 0, icon: "🏕️", name: "El Campo de Entrenamiento", color: "#5a8a3a" },
  { id: 1, icon: "🌆", name: "La Primera Impresión", color: "#3a6a9a" },
  { id: 2, icon: "🚪", name: "Abre la Puerta", color: "#3a8a5a" },
  { id: 3, icon: "🔍", name: "Lee al Cliente", color: "#8a7a2a" },
  { id: 4, icon: "🏗️", name: "Construye el Valor", color: "#8a5a2a" },
  { id: 5, icon: "🔥", name: "Enciende el Impulso", color: "#8a2a2a" },
  { id: 6, icon: "🎯", name: "El Momento de la Verdad", color: "#8a7a1a" },
  { id: 7, icon: "🛡️", name: "Convierte los No en Sí", color: "#6a3a8a" },
  { id: 8, icon: "🏆", name: "Sella la Victoria", color: "#2a7a7a" },
  { id: 9, icon: "👑", name: "El Vendedor Elite", color: "#ffd166" },
];

const COMMITMENTS = [
  "Practicar al menos 3 veces por semana",
  "Aplicar lo que aprendo en cada visita al campo",
  "Llegar al nivel Closer en los próximos 60 días",
  "Convertirme en Vendedor Elite",
];

function MapIntro() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0..4 → P20..P24
  const [fade, setFade] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [name, setName] = useState("Vendedor");
  const [declaration, setDeclaration] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const { data: seller } = await supabase
        .from("sellers")
        .select("id, full_name, declaration")
        .eq("profile_id", session.user.id)
        .single();
      if (!active) return;
      if (seller) {
        setSellerId(seller.id);
        if (seller.full_name) setName(seller.full_name.split(" ")[0]);
        if (seller.declaration) setDeclaration(seller.declaration);
      }
      setAuthReady(true);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  const goto = (next: number) => {
    setFade(false);
    setTimeout(() => {
      setStep(next);
      setFade(true);
    }, 180);
  };

  const handleActivate = async () => {
    setSaving(true);
    if (sellerId && declaration) {
      await supabase
        .from("sellers")
        .update({ declaration, onboarding_completed: true })
        .eq("id", sellerId);
    }
    navigate({ to: "/" });
  };

  if (!authReady) {
    return (
      <main style={shell}>
        <div style={{ color: "#5A5A8A", fontFamily: "'DM Sans', sans-serif" }}>
          Cargando…
        </div>
      </main>
    );
  }

  return (
    <main style={shell}>
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          opacity: fade ? 1 : 0,
          transition: "opacity 200ms ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flex: 1,
        }}
      >
        {step === 0 && <SilhouetteMap onNext={() => goto(1)} />}
        {step === 1 && <WorldsTour onNext={() => goto(2)} />}
        {step === 2 && <VideoStep onNext={() => goto(3)} />}
        {step === 3 && (
          <CommitmentStep
            value={declaration}
            onPick={setDeclaration}
            onNext={() => goto(4)}
          />
        )}
        {step === 4 && (
          <Activation
            name={name}
            declaration={declaration ?? ""}
            saving={saving}
            onStart={handleActivate}
          />
        )}
      </div>
    </main>
  );
}

/* ───────────── P20 — Silhouette Map ───────────── */

function SilhouetteMap({ onNext }: { onNext: () => void }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1.2rem 7rem",
      }}
    >
      <h1
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "1.3rem",
          color: "#F0F0F5",
          textAlign: "center",
          margin: 0,
        }}
      >
        Este es tu camino al Elite.
      </h1>

      <div
        style={{
          marginTop: "2rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {WORLDS.map((w, idx) => {
          const isFirst = w.id === 0;
          const isCrown = w.id === 9;
          return (
            <div
              key={w.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: isFirst ? "#FF6B2B" : "#1A1A26",
                  opacity: isFirst ? 1 : 0.3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isFirst ? "1.6rem" : "1.2rem",
                  boxShadow: isFirst
                    ? "0 0 32px 4px rgba(255,107,43,0.55)"
                    : "none",
                  animation: isFirst ? "breathe 2.4s ease-in-out infinite" : undefined,
                }}
              >
                {isFirst ? "🏕️" : isCrown ? <span style={{ opacity: 0.2 }}>👑</span> : ""}
              </div>
              {isFirst && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    color: "#FF6B2B",
                    textAlign: "center",
                  }}
                >
                  El Campo de Entrenamiento
                </div>
              )}
              {idx < WORLDS.length - 1 && (
                <div
                  style={{
                    width: 2,
                    height: 28,
                    background: isFirst
                      ? "linear-gradient(180deg, rgba(255,107,43,0.5), #1A1A26)"
                      : "#1A1A26",
                    opacity: isFirst ? 1 : 0.4,
                    margin: "0.4rem 0",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <p
        style={{
          marginTop: "1.6rem",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          fontSize: "0.84rem",
          color: "#5A5A8A",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        10 mundos. 57 etapas.
        <br />
        Un solo destino.
      </p>

      <FixedBottomButton onClick={onNext} label="Ver el camino completo →" />
      <style>{`
        @keyframes breathe {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}

/* ───────────── P21 — Worlds Tour ───────────── */

function WorldsTour({ onNext }: { onNext: () => void }) {
  const [lit, setLit] = useState<number>(-1);
  const [done, setDone] = useState(false);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const play = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setDone(false);
    setLit(-1);
    WORLDS.forEach((_, i) => {
      const delayIn = i * 500;
      timers.current.push(setTimeout(() => setLit(i), delayIn));
    });
    timers.current.push(
      setTimeout(() => {
        setLit(WORLDS.length - 1);
        setDone(true);
      }, WORLDS.length * 500 + 200),
    );
  };

  useEffect(() => {
    play();
    return () => {
      timers.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1.2rem 2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column-reverse",
          alignItems: "center",
          gap: "0.5rem",
          width: "100%",
        }}
      >
        {WORLDS.map((w, idx) => {
          const isLit = idx <= lit;
          return (
            <div
              key={w.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.8rem",
                width: "100%",
                maxWidth: 360,
                opacity: isLit ? 1 : 0.18,
                transition: "opacity 240ms ease",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: isLit ? w.color : "#1A1A26",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  boxShadow: isLit
                    ? `0 0 18px 2px ${w.color}88`
                    : "none",
                  flexShrink: 0,
                  transition: "all 240ms ease",
                }}
              >
                {w.icon}
              </div>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  color: isLit ? "#F0F0F5" : "#5A5A8A",
                }}
              >
                {w.name}
              </div>
            </div>
          );
        })}
      </div>

      {done && (
        <p
          style={{
            marginTop: "1.6rem",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: "0.84rem",
            color: "#5A5A8A",
            textAlign: "center",
            lineHeight: 1.5,
            animation: "fadeIn 400ms ease",
          }}
        >
          Cada mundo es una habilidad real.
          <br />
          Cada habilidad se practica, no se memoriza.
        </p>
      )}

      {done && (
        <>
          <PrimaryButton onClick={onNext} label="Entendido →" />
          <button
            onClick={play}
            style={{
              marginTop: "0.8rem",
              background: "transparent",
              border: "none",
              color: "#5A5A8A",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: "0.82rem",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Ver de nuevo
          </button>
        </>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ───────────── P22 — Video opcional ───────────── */

function VideoStep({ onNext }: { onNext: () => void }) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1.2rem",
      }}
    >
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "1.4rem",
          color: "#F0F0F5",
          textAlign: "center",
          margin: 0,
        }}
      >
        ¿Cómo funciona Closer?
      </h2>

      <div
        style={{
          width: "100%",
          marginTop: "1.4rem",
          background: "#111118",
          borderRadius: 14,
          aspectRatio: "16 / 9",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6rem",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(255,107,43,0.12)",
            border: "2px solid #FF6B2B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FF6B2B",
            fontSize: "1.3rem",
          }}
        >
          ▶
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: "0.8rem",
            color: "#5A5A8A",
          }}
        >
          Video de 60 segundos
        </div>
      </div>

      <PrimaryButton onClick={onNext} label="Ver el video →" />
      <button
        onClick={onNext}
        style={{
          marginTop: "0.7rem",
          width: "100%",
          background: "transparent",
          border: "1px solid #252535",
          color: "#F0F0F5",
          padding: "0.95rem 1.4rem",
          borderRadius: 99,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "0.95rem",
          cursor: "pointer",
        }}
      >
        Saltar, ya entendí →
      </button>
    </div>
  );
}

/* ───────────── P23 — Declaración ───────────── */

function CommitmentStep({
  value,
  onPick,
  onNext,
}: {
  value: string | null;
  onPick: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem 1.2rem",
      }}
    >
      <CloserCharacter state="normal" size={80} />
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "1.3rem",
          color: "#F0F0F5",
          textAlign: "center",
          margin: "1rem 0 0.4rem",
        }}
      >
        Una pregunta antes de empezar.
      </h2>
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          fontSize: "0.84rem",
          color: "#5A5A8A",
          textAlign: "center",
          margin: 0,
        }}
      >
        ¿Con qué te comprometes?
      </p>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          marginTop: "1.4rem",
        }}
      >
        {COMMITMENTS.map((c) => {
          const sel = value === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onPick(c)}
              style={{
                width: "100%",
                background: sel ? "rgba(255,107,43,0.06)" : "#111118",
                border: sel ? "2px solid #FF6B2B" : "1px solid #252535",
                borderRadius: 14,
                padding: sel ? "calc(1rem - 1px) calc(1.25rem - 1px)" : "1rem 1.25rem",
                color: "#F0F0F5",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                fontSize: "0.92rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 160ms ease",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      <PrimaryButton
        onClick={onNext}
        label="Me comprometo →"
        disabled={!value}
      />
    </div>
  );
}

/* ───────────── P24 — Activación ───────────── */

function Activation({
  name,
  declaration,
  saving,
  onStart,
}: {
  name: string;
  declaration: string;
  saving: boolean;
  onStart: () => void;
}) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.2rem",
        gap: "1rem",
      }}
    >
      <div style={{ animation: "bounceIn 600ms ease" }}>
        <CloserCharacter state="motivation" size={120} />
      </div>
      <h1
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "2.2rem",
          color: "#FF6B2B",
          textAlign: "center",
          margin: "0.6rem 0 0",
        }}
      >
        {name}.
      </h1>
      <div
        style={{
          background: "rgba(255,107,43,0.1)",
          border: "1px solid rgba(255,107,43,0.3)",
          borderRadius: 99,
          padding: "0.4rem 0.9rem",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "0.8rem",
          color: "#FF6B2B",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
      >
        🌱 Rookie
      </div>
      {declaration && (
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontStyle: "italic",
            fontSize: "0.8rem",
            color: "#5A5A8A",
            textAlign: "center",
            margin: 0,
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          “{declaration}”
        </p>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={saving}
        style={{
          width: "100%",
          marginTop: "1.6rem",
          background: "#FF6B2B",
          color: "#0B0B12",
          border: "none",
          borderRadius: 99,
          padding: "1rem 2rem",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: saving ? "wait" : "pointer",
          boxShadow: "0 12px 36px -8px rgba(255,107,43,0.7)",
        }}
      >
        {saving ? "Activando…" : "Empezar mi entrenamiento →"}
      </button>

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/* ───────────── Sub-components ───────────── */

function PrimaryButton({
  onClick,
  label,
  disabled,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        marginTop: "1.8rem",
        background: disabled ? "#3a2a22" : "#FF6B2B",
        color: disabled ? "#7a6358" : "#0B0B12",
        border: "none",
        borderRadius: 99,
        padding: "1rem 1.4rem",
        fontFamily: "'Syne', sans-serif",
        fontWeight: 700,
        fontSize: "0.98rem",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 8px 24px -10px rgba(255,107,43,0.55)",
        transition: "all 160ms ease",
      }}
    >
      {label}
    </button>
  );
}

function FixedBottomButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "1rem 1.2rem 1.4rem",
        background:
          "linear-gradient(180deg, rgba(8,8,15,0) 0%, rgba(8,8,15,0.95) 40%, #08080F 100%)",
        display: "flex",
        justifyContent: "center",
        zIndex: 10,
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        <button
          type="button"
          onClick={onClick}
          style={{
            width: "100%",
            background: "#FF6B2B",
            color: "#0B0B12",
            border: "none",
            borderRadius: 99,
            padding: "1rem 1.4rem",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: "0.98rem",
            cursor: "pointer",
            boxShadow: "0 8px 24px -10px rgba(255,107,43,0.55)",
          }}
        >
          {label}
        </button>
      </div>
    </div>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100dvh",
  background: BG,
  color: "#F0F0F5",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
};
