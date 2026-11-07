import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateSellerWelcome } from "@/utils/seller-onboarding.functions";
import { estiloBoton } from "@/components/closer/piezas";
import { Marca, FilaIcono, Opcion, Casilla, EncabezadoPreguntas, Icono, IconoNivel, estiloTitulo, estiloTexto, estiloEtiqueta, type ICONOS } from "@/components/closer/bienvenida-ui";

export const Route = createFileRoute("/onboarding/seller")({
  head: () => ({
    meta: [
      { title: "Tu entrenamiento empieza — Closer" },
      { name: "description", content: "Configura tu entrenamiento personalizado." },
      { property: "og:title", content: "Tu entrenamiento empieza — Closer" },
      { property: "og:description", content: "Configura tu entrenamiento personalizado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SellerOnboarding,
});

type Experience = "nuevo" | "intermedio" | "experto";
type Challenge = "cierre" | "objeciones" | "prospeccion" | "retencion";

// Mensaje 154 (nov-2026): íconos dibujados en lugar de emojis; el nivel, como barras de señal.
const EXPERIENCE_OPTS: Array<{ id: Experience; nivel: 1 | 2 | 3; title: string; desc: string }> = [
  { id: "nuevo", nivel: 1, title: "Soy nuevo", desc: "Menos de 6 meses" },
  { id: "intermedio", nivel: 2, title: "Tengo algo de experiencia", desc: "De 6 meses a 2 años" },
  { id: "experto", nivel: 3, title: "Tengo experiencia", desc: "Más de 2 años" },
];

const CHALLENGE_OPTS: Array<{ id: Challenge; icono: keyof typeof ICONOS; title: string; desc: string }> = [
  { id: "cierre", icono: "meta", title: "Cerrar más ventas", desc: "Llego al final y el cliente no decide" },
  { id: "objeciones", icono: "escudo", title: "Manejar objeciones", desc: "No sé qué responder cuando me dicen que no" },
  { id: "prospeccion", icono: "puerta", title: "Abrir clientes nuevos", desc: "Me cuesta entrar a negocios que no me conocen" },
  { id: "retencion", icono: "vuelta", title: "Cuidar a mis clientes", desc: "Los pierdo ante la competencia" },
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
  const [audioConsent, setAudioConsent] = useState(false);

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
    // Mensaje 124: lo que el vendedor contestó —sobre todo que acepta la
    // grabación— se guarda PRIMERO y se comprueba. Antes se guardaba solo
    // después del mensaje de bienvenida de la IA: si la IA fallaba, nada se
    // guardaba y nadie se enteraba (en nov-2026 había 9 vendedores sin
    // consentimiento, y Emilio los vio marcar la casilla).
    if (!sellerId) {
      setAiError("No encontramos tu registro de vendedor. Toca para reintentar.");
      setLoadingAI(false);
      return;
    }
    const { error: guardarErr } = await supabase
      .from("sellers")
      .update({
        full_name: name.trim(),
        experience_level: exp,
        main_challenge: ch,
        audio_consent: audioConsent,
        onboarding_completed: true,
      })
      .eq("id", sellerId);
    if (guardarErr) {
      console.error("[onboarding.seller] no se guardaron las respuestas:", guardarErr);
      setAiError("No pudimos guardar tus respuestas. Toca para reintentar.");
      setLoadingAI(false);
      return;
    }
    try {
      const res = await generateSellerWelcome({
        data: {
          name: name.trim(),
          experience: exp,
          challenge: ch,
          companyName,
          companyId,
          sellerId,
        },
      });
      setWelcomeMsg(res.mensaje);
      setExpectativa(res.expectativa);

      // Persistir el mensaje de bienvenida en seller_memory (las respuestas ya se guardaron arriba).
      if (sellerId) {
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
        <div style={{ margin: "auto", color: "var(--c-text-2)", fontFamily: "'DM Sans', sans-serif" }}>Cargando…</div>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          opacity: fade ? 1 : 0,
          transform: fade ? "none" : "translateY(6px)",
          transition: "opacity 200ms ease, transform 200ms ease",
        }}
      >
        {step === 0 && <Welcome onNext={() => goto(1)} />}
        {step >= 1 && step <= 3 && (
          <EncabezadoPreguntas paso={step} total={3} onRegresar={step > 1 ? () => goto(step - 1) : () => goto(0)} />
        )}
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
            audioConsent={audioConsent}
            setAudioConsent={setAudioConsent}
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
            expectativa={expectativa}
            onRetry={() => experience && challenge && handleSubmitFinal(experience, challenge)}
            onContinue={() => navigate({ to: "/onboarding/map-intro" })}
          />
        )}
      </div>
    </main>
  );
}

/* ---------- Pantallas (mensaje 154: la bienvenida nueva) ---------- */

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <>
      <div style={{ paddingTop: 12 }}><Marca /></div>
      <h1 style={{ ...estiloTitulo, fontSize: 32, marginTop: 36 }}>Aquí no vienes a leer. Vienes a practicar.</h1>
      <p style={{ ...estiloTexto, marginTop: 14 }}>
        Aprendes una técnica en un par de minutos y la practicas hablando con un cliente que te contesta.
      </p>
      <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 22 }}>
        <FilaIcono icono="microfono" titulo="Practicas con tu voz" texto="Como en una visita real, desde tu teléfono." />
        <FilaIcono icono="mejora" titulo="Sabes qué mejorar" texto="Una calificación honesta y qué hacer distinto." />
        <FilaIcono icono="equipo" titulo="Tu manager te acompaña" texto="Ve tu avance y escucha tus prácticas para darte coaching." />
      </div>
      <Abajo>
        <button type="button" onClick={onNext} style={estiloBoton("principal")}>Empezar</button>
      </Abajo>
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
      <h1 style={{ ...estiloTitulo, fontSize: 28, marginTop: 40 }}>¿Cómo te llamas?</h1>
      <p style={{ ...estiloTexto, fontSize: 16, color: "var(--c-text-2)", marginTop: 10 }}>Así te va a llamar Closer.</p>
      <input
        type="text"
        autoFocus
        autoComplete="given-name"
        placeholder="Tu nombre"
        aria-label="Tu nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && valid) onNext();
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          marginTop: 28,
          height: "var(--h-campo)",
          padding: "0 18px",
          borderRadius: "var(--r-campo)",
          border: "1.5px solid var(--c-border)",
          background: "var(--c-surface)",
          color: "var(--c-text)",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 18,
          outline: "none",
          transition: "border-color 150ms ease",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--c-primary)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--c-border)")}
      />
      <Abajo>
        <button type="button" onClick={onNext} disabled={!valid} style={estiloBoton("principal", !valid)}>Continuar</button>
      </Abajo>
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
  const nombre = name.trim().split(" ")[0];
  return (
    <>
      <h1 style={{ ...estiloTitulo, fontSize: 28, marginTop: 40 }}>{nombre ? `¿Cuánto llevas vendiendo, ${nombre}?` : "¿Cuánto llevas vendiendo?"}</h1>
      <div role="radiogroup" style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
        {EXPERIENCE_OPTS.map((opt) => (
          <Opcion
            key={opt.id}
            elegida={value === opt.id}
            onClick={() => onPick(opt.id)}
            icono={<IconoNivel nivel={opt.nivel} activo={value === opt.id} />}
            titulo={opt.title}
            texto={opt.desc}
          />
        ))}
      </div>
      <Abajo>
        <button type="button" onClick={onNext} disabled={!value} style={estiloBoton("principal", !value)}>Continuar</button>
      </Abajo>
    </>
  );
}

function ChallengeStep({
  value,
  onPick,
  audioConsent,
  setAudioConsent,
  onNext,
}: {
  value: Challenge | null;
  onPick: (v: Challenge) => void;
  audioConsent: boolean;
  setAudioConsent: (v: boolean) => void;
  onNext: () => void;
}) {
  return (
    <>
      <h1 style={{ ...estiloTitulo, fontSize: 28, marginTop: 40 }}>¿Cuál es tu mayor reto hoy?</h1>
      <div role="radiogroup" style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        {CHALLENGE_OPTS.map((opt) => (
          <Opcion
            key={opt.id}
            elegida={value === opt.id}
            onClick={() => onPick(opt.id)}
            icono={<Icono nombre={opt.icono} />}
            titulo={opt.title}
            texto={opt.desc}
          />
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <Casilla marcada={audioConsent} onCambiar={setAudioConsent}>
          Acepto que mis prácticas se graben. Closer funciona con tu voz: sin grabar no se puede practicar, y tu manager usa las grabaciones para darte coaching.
        </Casilla>
      </div>
      {value && !audioConsent && (
        <p style={{ margin: "10px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.45, color: "var(--c-gold)" }}>
          Para seguir, marca la casilla: sin grabar no se puede practicar.
        </p>
      )}
      {/* Mensaje 123: aceptar la grabación es obligatorio (antes dejaba seguir sin aceptarla). */}
      <Abajo>
        <button type="button" onClick={onNext} disabled={!value || !audioConsent} style={estiloBoton("principal", !value || !audioConsent)}>Continuar</button>
      </Abajo>
    </>
  );
}

function PersonalMessage({
  name,
  loading,
  error,
  message,
  expectativa,
  onRetry,
  onContinue,
}: {
  name: string;
  loading: boolean;
  error: string | null;
  message: string;
  expectativa: string;
  onRetry: () => void;
  onContinue: () => void;
}) {
  const nombre = name.trim().split(" ")[0];
  return (
    <>
      <div style={{ paddingTop: 12 }}><Marca /></div>
      <div style={{ ...estiloEtiqueta, marginTop: 36 }}>Tu plan</div>
      <h1 style={{ ...estiloTitulo, fontSize: 32, marginTop: 8 }}>{nombre ? `Hola, ${nombre}.` : "Hola."}</h1>
      {loading && (
        <p aria-live="polite" style={{ ...estiloTexto, marginTop: 16, color: "var(--c-text-2)" }}>Closer está preparando tu plan…</p>
      )}
      {error && !loading && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 12 }}>
          <p style={{ ...estiloTexto, color: "var(--c-danger)" }}>{error}</p>
          <button type="button" onClick={onRetry} style={{ ...estiloBoton("secundario"), width: "auto", padding: "0 24px" }}>Reintentar</button>
        </div>
      )}
      {!loading && !error && message && (
        <>
          <p style={{ ...estiloTexto, marginTop: 16, lineHeight: 1.55 }}>{message}</p>
          {expectativa && (
            <div style={{ marginTop: 24, padding: 18, borderRadius: "var(--r-tarjeta)", background: "rgb(var(--c-primary-rgb) / 0.07)", border: "1px solid rgb(var(--c-primary-rgb) / 0.35)" }}>
              <div style={{ ...estiloEtiqueta, fontSize: 12, letterSpacing: "0.1em", color: "var(--c-primary)" }}>Lo que vas a construir</div>
              <p style={{ margin: "8px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.5, color: "var(--c-text)" }}>{expectativa}</p>
            </div>
          )}
          <Abajo>
            <button type="button" onClick={onContinue} style={estiloBoton("principal")}>Ver cómo funciona</button>
          </Abajo>
        </>
      )}
    </>
  );
}

/** El botón principal siempre abajo, con su espacio. */
function Abajo({ children }: { children: React.ReactNode }) {
  return <div style={{ marginTop: "auto", paddingTop: 28 }}>{children}</div>;
}

const shellStyle: React.CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  background: "var(--c-bg)",
  color: "var(--c-text)",
  display: "flex",
  flexDirection: "column",
  padding: "max(20px, env(safe-area-inset-top)) var(--m-pantalla) calc(24px + env(safe-area-inset-bottom))",
};
