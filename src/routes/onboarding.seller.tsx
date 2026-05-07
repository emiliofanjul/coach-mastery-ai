import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CloserCharacter } from "@/components/closer/CloserCharacter";
import { generateSellerWelcome } from "@/utils/seller-onboarding.functions";

export const Route = createFileRoute("/onboarding/seller")({
  head: () => ({
    meta: [
      { title: "Tu entrenamiento empieza — Closer" },
      { name: "description", content: "Configura tu entrenamiento personalizado." },
    ],
  }),
  component: SellerOnboarding,
});

const BG =
  "radial-gradient(ellipse at 30% 70%, #1e0a30 0%, transparent 55%), #08080F";

type Experience = "nuevo" | "intermedio" | "experto";
type Challenge = "cierre" | "objeciones" | "prospeccion" | "retencion";

const EXPERIENCE_OPTS: Array<{
  id: Experience;
  icon: string;
  title: string;
  desc: string;
}> = [
  { id: "nuevo", icon: "🌱", title: "Soy nuevo", desc: "Menos de 6 meses" },
  { id: "intermedio", icon: "📈", title: "Tengo algo de experiencia", desc: "6 meses a 2 años" },
  { id: "experto", icon: "🔥", title: "Soy vendedor con experiencia", desc: "Más de 2 años en ventas" },
];

const CHALLENGE_OPTS: Array<{
  id: Challenge;
  icon: string;
  title: string;
  desc: string;
}> = [
  { id: "cierre", icon: "🎯", title: "Cerrar más ventas", desc: "Llego al final pero el cliente no decide" },
  { id: "objeciones", icon: "🛡️", title: "Manejar objeciones", desc: "No sé qué responder cuando dicen no" },
  { id: "prospeccion", icon: "🚪", title: "Conseguir clientes nuevos", desc: "Me cuesta entrar a negocios que no me conocen" },
  { id: "retencion", icon: "🔄", title: "Retener clientes actuales", desc: "Los pierdo ante la competencia" },
];

function SellerOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 welcome, 1 nombre, 2 exp, 3 reto, 4 mensaje
  const [authReady, setAuthReady] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [experience, setExperience] = useState<Experience | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);

  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [welcomeMsg, setWelcomeMsg] = useState<string>("");
  const [expectativa, setExpectativa] = useState<string>("");
  const [fade, setFade] = useState(true);

  // Verificar auth + cargar seller
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, company_id, role")
        .eq("id", session.user.id)
        .single();
      if (!active) return;
      if (!profile || profile.role !== "vendedor") {
        navigate({ to: "/" });
        return;
      }
      if (profile.full_name) setName(profile.full_name.split(" ")[0] ?? "");
      if (profile.company_id) {
        setCompanyId(profile.company_id);
        const { data: comp } = await supabase
          .from("companies")
          .select("name")
          .eq("id", profile.company_id)
          .single();
        if (comp) setCompanyName(comp.name);
      }
      const { data: seller } = await supabase
        .from("sellers")
        .select("id, onboarding_completed, full_name")
        .eq("profile_id", session.user.id)
        .single();
      if (seller) {
        setSellerId(seller.id);
        if (seller.onboarding_completed) {
          navigate({ to: "/" });
          return;
        }
        if (seller.full_name) setName(seller.full_name.split(" ")[0] ?? "");
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

  const handleSubmitFinal = async (exp: Experience, ch: Challenge) => {
    setLoadingAI(true);
    setAiError(null);
    goto(4);
    try {
      const res = await generateSellerWelcome({
        data: {
          name: name.trim(),
          experience: exp,
          challenge: ch,
          companyName,
        },
      });
      setWelcomeMsg(res.mensaje);
      setMission(res.mision);

      // Persistir en sellers + seller_memory
      if (sellerId) {
        await supabase
          .from("sellers")
          .update({
            full_name: name.trim(),
            experience_level: exp,
            main_challenge: ch,
            onboarding_completed: true,
          })
          .eq("id", sellerId);

        if (companyId) {
          const { data: existingMem } = await supabase
            .from("seller_memory")
            .select("id")
            .eq("seller_id", sellerId)
            .maybeSingle();
          if (existingMem) {
            await supabase
              .from("seller_memory")
              .update({ progress_summary: res.mensaje })
              .eq("id", existingMem.id);
          } else {
            await supabase.from("seller_memory").insert({
              seller_id: sellerId,
              company_id: companyId,
              progress_summary: res.mensaje,
            });
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ai_error";
      if (msg === "rate_limit") {
        setAiError("Estamos saturados. Intenta de nuevo en un minuto.");
      } else if (msg === "payment_required") {
        setAiError("Se agotaron los créditos de IA. Avisa al admin.");
      } else {
        setAiError("No pudimos generar tu mensaje. Toca para reintentar.");
      }
    } finally {
      setLoadingAI(false);
    }
  };

  if (!authReady) {
    return (
      <main style={shellStyle}>
        <div style={{ color: "#5A5A8A", fontFamily: "'DM Sans', sans-serif" }}>
          Cargando…
        </div>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          padding: "1.6rem 1.2rem 2.4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: fade ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
      >
        {step === 0 && <Welcome onNext={() => goto(1)} />}
        {step === 1 && (
          <NameStep
            name={name}
            setName={setName}
            onNext={() => goto(2)}
          />
        )}
        {step === 2 && (
          <ExperienceStep
            name={name}
            value={experience}
            onPick={setExperience}
            onNext={() => goto(3)}
          />
        )}
        {step === 3 && (
          <ChallengeStep
            value={challenge}
            onPick={setChallenge}
            onNext={() => {
              if (experience && challenge) handleSubmitFinal(experience, challenge);
            }}
          />
        )}
        {step === 4 && (
          <PersonalMessage
            name={name}
            loading={loadingAI}
            error={aiError}
            message={welcomeMsg}
            mission={mission}
            onRetry={() => experience && challenge && handleSubmitFinal(experience, challenge)}
            onContinue={() => navigate({ to: "/" })}
          />
        )}
      </div>
    </main>
  );
}

/* ---------- Pantallas ---------- */

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <>
      <CloserCharacter state="normal" size={110} className="animate-breathe" />
      <h1 style={{ ...h1Style, marginTop: "1.4rem" }}>Aquí no vienes a leer.</h1>
      <p style={subtitleStyle}>
        Vienes a entrenar. A practicar. A desarrollar las habilidades que te van
        a cambiar los resultados en el campo.
      </p>
      <ul style={bulletList}>
        <BulletItem icon="🎙️" text="Practicas por voz con un cliente IA real" />
        <BulletItem
          icon="📊"
          text="Tu manager ve tu progreso y puede leer el transcript de tus sesiones"
        />
        <BulletItem icon="📈" text="Cada sesión te hace mejor que la anterior" />
      </ul>
      <PrimaryButton onClick={onNext} label="Empezar mi entrenamiento →" />
    </>
  );
}

function NameStep({
  name,
  setName,
  onNext,
}: {
  name: string;
  setName: (v: string) => void;
  onNext: () => void;
}) {
  const valid = name.trim().length >= 2;
  return (
    <>
      <StepLabel>Pregunta 1 de 3</StepLabel>
      <h2 style={{ ...questionStyle, fontSize: "1.8rem" }}>¿Cómo te llamas?</h2>
      <input
        type="text"
        autoFocus
        placeholder="Tu nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && valid) onNext();
        }}
        style={{
          width: "100%",
          marginTop: "1.4rem",
          background: "#111118",
          border: "2px solid #252535",
          borderRadius: 14,
          padding: "0.88rem 1.05rem",
          color: "#F0F0F5",
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "1.2rem",
          textAlign: "center",
          outline: "none",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B2B")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#252535")}
      />
      <p style={{ ...helperStyle, marginTop: "0.7rem" }}>
        Así te va a llamar Closer.
      </p>
      <PrimaryButton onClick={onNext} disabled={!valid} label="Continuar →" />
    </>
  );
}

function ExperienceStep({
  name,
  value,
  onPick,
  onNext,
}: {
  name: string;
  value: Experience | null;
  onPick: (v: Experience) => void;
  onNext: () => void;
}) {
  return (
    <>
      <StepLabel>Pregunta 2 de 3</StepLabel>
      <h2 style={questionStyle}>
        ¿Cuánto tiempo llevas vendiendo, {name || "amig@"}?
      </h2>
      <div style={cardListStyle}>
        {EXPERIENCE_OPTS.map((opt) => (
          <SelectableCard
            key={opt.id}
            icon={opt.icon}
            title={opt.title}
            desc={opt.desc}
            selected={value === opt.id}
            onClick={() => onPick(opt.id)}
          />
        ))}
      </div>
      <PrimaryButton onClick={onNext} disabled={!value} label="Continuar →" />
    </>
  );
}

function ChallengeStep({
  value,
  onPick,
  onNext,
}: {
  value: Challenge | null;
  onPick: (v: Challenge) => void;
  onNext: () => void;
}) {
  return (
    <>
      <StepLabel>Pregunta 3 de 3</StepLabel>
      <h2 style={questionStyle}>¿Cuál es tu mayor reto ahorita?</h2>
      <div style={cardListStyle}>
        {CHALLENGE_OPTS.map((opt) => (
          <SelectableCard
            key={opt.id}
            icon={opt.icon}
            title={opt.title}
            desc={opt.desc}
            selected={value === opt.id}
            onClick={() => onPick(opt.id)}
          />
        ))}
      </div>
      <PrimaryButton onClick={onNext} disabled={!value} label="Ver mi plan →" />
    </>
  );
}

function PersonalMessage({
  name,
  loading,
  error,
  message,
  mission,
  onRetry,
  onContinue,
}: {
  name: string;
  loading: boolean;
  error: string | null;
  message: string;
  mission: string;
  onRetry: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <CloserCharacter state="motivation" size={110} />
      <h2
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "2rem",
          color: "#FF6B2B",
          margin: "1.2rem 0 0.6rem",
          textAlign: "center",
        }}
      >
        {name || "Vendedor"}.
      </h2>
      {loading && (
        <p style={{ ...helperStyle, marginTop: "0.4rem" }}>
          Closer está preparando tu plan…
        </p>
      )}
      {error && !loading && (
        <>
          <p style={{ ...helperStyle, color: "#FF6B6B", marginTop: "0.4rem" }}>
            {error}
          </p>
          <button
            onClick={onRetry}
            style={{
              marginTop: "0.8rem",
              background: "transparent",
              border: "1px solid #FF6B2B",
              color: "#FF6B2B",
              padding: "0.6rem 1.1rem",
              borderRadius: 99,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </>
      )}
      {!loading && !error && message && (
        <>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 400,
              fontSize: "0.92rem",
              color: "#F0F0F5",
              textAlign: "center",
              lineHeight: 1.6,
              marginTop: "0.4rem",
            }}
          >
            {message}
          </p>
          {mission && (
            <div
              style={{
                width: "100%",
                marginTop: "1.6rem",
                borderLeft: "3px solid #FF6B2B",
                background: "rgba(255,107,43,0.04)",
                borderRadius: 14,
                padding: "1rem",
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.6rem",
                  color: "#FF6B2B",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "0.4rem",
                }}
              >
                Tu primer objetivo
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                  fontSize: "0.84rem",
                  color: "#F0F0F5",
                  lineHeight: 1.5,
                }}
              >
                {mission}
              </div>
            </div>
          )}
          <PrimaryButton onClick={onContinue} label="Ver mi mapa →" />
        </>
      )}
    </>
  );
}

/* ---------- Sub-componentes ---------- */

function BulletItem({ icon, text }: { icon: string; text: string }) {
  return (
    <li
      style={{
        display: "flex",
        gap: "0.7rem",
        alignItems: "flex-start",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 500,
        fontSize: "0.84rem",
        color: "#F0F0F5",
        lineHeight: 1.5,
      }}
    >
      <span style={{ fontSize: "1.1rem", lineHeight: 1.2 }}>{icon}</span>
      <span>{text}</span>
    </li>
  );
}

function SelectableCard({
  icon,
  title,
  desc,
  selected,
  onClick,
}: {
  icon: string;
  title: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        textAlign: "left",
        display: "flex",
        gap: "0.9rem",
        alignItems: "center",
        background: selected ? "rgba(255,107,43,0.06)" : "#111118",
        border: selected ? "2px solid #FF6B2B" : "1px solid #252535",
        borderRadius: 14,
        padding: selected ? "calc(1rem - 1px) calc(1.25rem - 1px)" : "1rem 1.25rem",
        cursor: "pointer",
        transition: "all 160ms ease",
      }}
    >
      <span style={{ fontSize: "1.6rem" }}>{icon}</span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            color: "#F0F0F5",
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: "0.8rem",
            color: "#5A5A8A",
          }}
        >
          {desc}
        </span>
      </span>
      {selected && (
        <span
          style={{
            position: "absolute",
            top: 10,
            right: 12,
            color: "#FF6B2B",
            fontSize: "0.95rem",
            fontWeight: 700,
          }}
          aria-hidden
        >
          ✓
        </span>
      )}
    </button>
  );
}

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

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 400,
        fontSize: "0.76rem",
        color: "#5A5A8A",
        textAlign: "center",
        marginBottom: "0.7rem",
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Estilos compartidos ---------- */

const shellStyle: React.CSSProperties = {
  minHeight: "100dvh",
  background: BG,
  color: "#F0F0F5",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.2rem",
};

const h1Style: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 800,
  fontSize: "1.6rem",
  color: "#F0F0F5",
  textAlign: "center",
  margin: 0,
};

const subtitleStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 400,
  fontSize: "0.92rem",
  color: "#5A5A8A",
  textAlign: "center",
  marginTop: "0.75rem",
  lineHeight: 1.5,
};

const bulletList: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "1.8rem 0 0",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
  width: "100%",
};

const questionStyle: React.CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontWeight: 800,
  fontSize: "1.5rem",
  color: "#F0F0F5",
  textAlign: "center",
  margin: 0,
  lineHeight: 1.25,
};

const helperStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 400,
  fontSize: "0.76rem",
  color: "#5A5A8A",
  textAlign: "center",
};

const cardListStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
  marginTop: "1.4rem",
};
