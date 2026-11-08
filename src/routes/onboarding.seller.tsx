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
// Mensaje 155: palabras directas (Emilio, 7-nov). Primero el tiempo, que es lo que se pregunta.
const EXPERIENCE_OPTS: Array<{ id: Experience; nivel: 1 | 2 | 3; title: string; desc: string }> = [
  { id: "nuevo", nivel: 1, title: "Menos de 6 meses", desc: "Estoy empezando" },
  { id: "intermedio", nivel: 2, title: "De 6 meses a 2 años", desc: "Ya tengo algo de experiencia" },
  { id: "experto", nivel: 3, title: "Más de 2 años", desc: "Tengo experiencia" },
];

const CHALLENGE_OPTS: Array<{ id: Challenge; icono: keyof typeof ICONOS; title: string; desc: string }> = [
  { id: "cierre", icono: "meta", title: "Cerrar la venta", desc: "Al final, el cliente no se decide" },
  { id: "objeciones", icono: "escudo", title: "Responder objeciones", desc: "No sé qué decir cuando me dicen que no" },
  { id: "prospeccion", icono: "puerta", title: "Conseguir clientes nuevos", desc: "Me cuesta entrar a negocios que no me conocen" },
  { id: "retencion", icono: "vuelta", title: "Que me sigan comprando", desc: "Mis clientes se van con la competencia" },
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
  // Mensaje 158: quien entrena por su cuenta no tiene manager: la bienvenida no se lo promete.
  const [esPersonal, setEsPersonal] = useState(false);

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
      if (!profile) {
        navigate({ to: "/" });
        return;
      }
      if (profile.full_name) setName(profile.full_name.split(" ")[0] ?? "");
      let personal = false;
      if (profile.company_id) {
        setCompanyId(profile.company_id);
        const { data: comp } = await supabase
          .from("companies")
          .select("name, is_personal")
          .eq("id", profile.company_id)
          .single();
        if (comp) setCompanyName(comp.name);
        personal = comp?.is_personal === true;
      }
      // Mensaje 158: quien entrena por su cuenta es «manager» de su empresa personal, y esta pantalla lo
      // mandaba al mapa: nunca veía la bienvenida. Pasan los vendedores y las cuentas personales.
      if (profile.role !== "vendedor" && !personal) {
        navigate({ to: "/" });
        return;
      }
      if (!active) return;
      setEsPersonal(personal);
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
        {step === 0 && <Welcome esPersonal={esPersonal} onNext={() => goto(1)} />}
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
            esPersonal={esPersonal}
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

function Welcome({ onNext, esPersonal }: { onNext: () => void; esPersonal: boolean }) {
  return (
    <>
      <div style={{ paddingTop: 12 }}><Marca /></div>
      {/* Mensaje 155 (Emilio, 7-nov): la pantalla que ven todos es un statement: por qué Closer es distinto.
          «Ha generado millones» lo confirmó Emilio como un hecho comprobado del sistema de ventas de Closer. */}
      <h1 style={{ ...estiloTitulo, fontSize: "clamp(26px, 3.8dvh, 32px)", marginTop: "min(36px, 3dvh)" }}>Entrena con un sistema de ventas que ha generado millones.</h1>
      <p style={{ ...estiloTexto, marginTop: 14 }}>
        Closer es tu entrenador personal: aprendes el sistema, lo practicas en voz alta y te califica como un entrenador experto.
      </p>
      <div style={{ marginTop: "min(32px, 3.6dvh)", display: "flex", flexDirection: "column", gap: "min(20px, 2.4dvh)" }}>
        <FilaIcono icono="libro" titulo="Un sistema completo" texto="De la entrada al cierre, no consejos sueltos." />
        <FilaIcono icono="microfono" titulo="Práctica de verdad" texto="Hablas con un cliente que te contesta, como en una visita." />
        <FilaIcono icono="mejora" titulo="Una calificación que no adivina" texto="Con reglas claras para cada técnica, no opiniones." />
        {esPersonal ? (
          <FilaIcono icono="vuelta" titulo="Hecho para tus clientes" texto="Le cuentas a Closer qué vendes, y tus clientes de práctica se parecen a los tuyos." />
        ) : (
          <FilaIcono icono="equipo" titulo="Tu manager te acompaña" texto="Ve tu avance y puede escuchar tus prácticas para ayudarte." />
        )}
      </div>
      <Abajo>
        <button type="button" onClick={onNext} style={estiloBoton("principal")}>Empezar mi entrenamiento</button>
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
      <p style={{ ...estiloTexto, fontSize: 16, color: "var(--c-text-2)", marginTop: 10 }}>Así te vamos a llamar en Closer.</p>
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
      <h1 style={{ ...estiloTitulo, fontSize: 28, marginTop: 40 }}>{nombre ? `¿Cuánto tiempo llevas en ventas, ${nombre}?` : "¿Cuánto tiempo llevas en ventas?"}</h1>
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
  esPersonal,
  onNext,
}: {
  value: Challenge | null;
  onPick: (v: Challenge) => void;
  audioConsent: boolean;
  setAudioConsent: (v: boolean) => void;
  esPersonal: boolean;
  onNext: () => void;
}) {
  return (
    <>
      <h1 style={{ ...estiloTitulo, fontSize: 28, marginTop: 40 }}>¿Qué se te dificulta más?</h1>
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
          {esPersonal
            ? "Acepto que se graben mis prácticas. Sin grabación no se puede practicar con voz."
            : "Acepto que se graben mis prácticas. Sin grabación no se puede practicar con voz. Tu manager puede escucharlas para ayudarte a mejorar."}
        </Casilla>
      </div>
      {value && !audioConsent && (
        <p style={{ margin: "10px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.45, color: "var(--c-gold)" }}>
          Para seguir, marca la casilla: sin grabación no se puede practicar.
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
              <div style={{ ...estiloEtiqueta, fontSize: 12, letterSpacing: "0.1em", color: "var(--c-primary)" }}>Lo que vas a lograr</div>
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

/**
 * El botón principal siempre abajo, con su espacio. Mensaje 155-B: en pantallas bajitas (375×568) el
 * contenido no cabe; el botón se queda pegado abajo, siempre visible, y el texto se desliza detrás.
 */
function Abajo({ children }: { children: React.ReactNode }) {
  return <div style={ESTILO_ABAJO}>{children}</div>;
}

const ESTILO_ABAJO: React.CSSProperties = {
  position: "sticky",
  bottom: 0,
  zIndex: 2,
  marginTop: "auto",
  paddingTop: 20,
  paddingBottom: "calc(24px + env(safe-area-inset-bottom))",
  background: "linear-gradient(to top, var(--c-bg) 72%, rgb(var(--c-bg-rgb) / 0))",
};

const shellStyle: React.CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  background: "var(--c-bg)",
  color: "var(--c-text)",
  display: "flex",
  flexDirection: "column",
  // Abajo, el espacio lo pone el botón pegado (ESTILO_ABAJO).
  padding: "max(20px, env(safe-area-inset-top)) var(--m-pantalla) 0",
};
