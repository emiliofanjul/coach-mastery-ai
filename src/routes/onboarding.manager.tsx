// Onboarding del manager (oct-2026, rediseñado con Emilio).
//
// 9 preguntas en 4 bloques, casi todas de tocar, cada una con su texto libre
// opcional y su "¿Para qué lo usa Closer?". El manager no le enseña ventas a
// Closer: le dice cómo es su negocio. Las preguntas y por qué existe cada una
// viven en src/lib/onboarding-questions.ts.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CloserCharacter } from "@/components/closer/CloserCharacter";
import { CompartirInvitacion } from "@/components/app/CompartirInvitacion";
import {
  generateCompanyBrain,
  proponerDelCampo,
  ajustarRadiografia,
} from "@/utils/onboarding.functions";
import {
  PREGUNTAS,
  TOTAL_PREGUNTAS,
  BLOQUES,
  FRASE_DE_ENTRADA,
  NEGATIVOS_DE_RESPALDO,
  RESTRICCIONES_DE_RESPALDO,
  campoVisible,
  preguntaCompleta,
  respuestasEnTexto,
  cerebroDirecto,
  libreDe,
  detalleDe,
  type Pregunta,
  type Campo,
  type CampoOpciones,
  type Respuestas,
  type SeccionRadiografia,
} from "@/lib/onboarding-questions";

export const Route = createFileRoute("/onboarding/manager")({
  head: () => ({
    meta: [
      { title: "Configura tu empresa — Closer" },
      { name: "description", content: "Cuéntale a Closer cómo es tu empresa." },
    ],
  }),
  component: ManagerOnboarding,
});

const BG = "radial-gradient(ellipse at 30% 70%, #1e0a30 0%, transparent 55%), #08080F";

type Brain = Record<string, string>;
type Propuestas = { negativos: string[]; restricciones: string[] };

// Pasos: 0 bienvenida · 1..9 preguntas · la radiografía · el equipo.
const PRIMERA_PREGUNTA = 1;
const CALIB_STEP = PRIMERA_PREGUNTA + TOTAL_PREGUNTAS; // la radiografía
const TEAM_STEP = CALIB_STEP + 1;
const PROGRESS_TOTAL = TEAM_STEP;
const PRIMERA_PROPUESTA = PREGUNTAS.findIndex((p) => p.propuestaPorCloser) + PRIMERA_PREGUNTA;

// v2: el borrador del onboarding anterior tiene otra forma y no se reutiliza.
const draftKey = (companyId: string | null) => `closer_onboarding_v2_${companyId ?? "anon"}`;

// Llaves que jamás deben persistirse en companies.company_sales_brain.
const EPHEMERAL_KEYS = new Set([
  "__preview_response",
  "__preview_responses",
  "DON_RAMON_RESPUESTA",
]);
function stripEphemeral(b: Record<string, unknown>): Brain {
  const out: Brain = {};
  for (const [k, v] of Object.entries(b)) {
    if (EPHEMERAL_KEYS.has(k) || typeof v !== "string") continue;
    out[k] = v;
  }
  return out;
}

const mensajeDeError = (err: unknown) => {
  const m = (err as Error | null)?.message;
  return m === "rate_limit"
    ? "Closer está saturado, intenta en un momento."
    : m === "payment_required"
      ? "Se acabaron los créditos de IA. Avisa al administrador."
      : "Closer no pudo terminar. Intenta de nuevo.";
};

function ManagerOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [r, setR] = useState<Respuestas>({});
  const [propuestas, setPropuestas] = useState<Propuestas | null>(null);
  const [proponiendo, setProponiendo] = useState(false);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [brain, setBrain] = useState<Brain | null>(null);
  const [radiografia, setRadiografia] = useState<SeccionRadiografia[] | null>(null);
  // Con qué respuestas se armó el cerebro: si el manager regresa y cambia
  // algo, la radiografía se vuelve a armar.
  const [brainDe, setBrainDe] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Perfil del manager
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      if (!profile || profile.role !== "manager") {
        navigate({ to: "/" });
        return;
      }
      setName((profile.full_name ?? "").split(" ")[0] || "Manager");
      setCompanyId(profile.company_id ?? null);
      if (profile.company_id) {
        const { data: comp } = await supabase
          .from("companies")
          .select("name, onboarding_completed")
          .eq("id", profile.company_id)
          .single();
        if (comp) {
          setCompanyName(comp.name);
          if (comp.onboarding_completed) {
            navigate({ to: "/" });
            return;
          }
        }
      }
      setAuthReady(true);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  // Borrador local: el manager puede salir y volver sin perder nada.
  useEffect(() => {
    if (!authReady || draftLoaded) return;
    try {
      const raw = localStorage.getItem(draftKey(companyId));
      if (raw) {
        const d = JSON.parse(raw) as { step?: number; r?: Respuestas; propuestas?: Propuestas };
        if (d.r) setR(d.r);
        if (d.propuestas) setPropuestas(d.propuestas);
        if (typeof d.step === "number" && d.step > 0 && d.step < CALIB_STEP) setStep(d.step);
      }
    } catch {
      /* borrador corrupto: se ignora */
    }
    setDraftLoaded(true);
  }, [authReady, draftLoaded, companyId]);

  useEffect(() => {
    if (!draftLoaded) return;
    try {
      localStorage.setItem(draftKey(companyId), JSON.stringify({ step, r, propuestas }));
    } catch {
      /* sin espacio: no bloquea */
    }
  }, [draftLoaded, step, r, propuestas, companyId]);

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  // Closer propone (bloque 4) al llegar a la primera pregunta de propuestas.
  // Lo propuesto entra ya marcado: el manager desmarca lo que no aplica.
  useEffect(() => {
    if (step !== PRIMERA_PROPUESTA || propuestas || proponiendo) return;
    setProponiendo(true);
    const aplicar = (p: Propuestas) => {
      setPropuestas(p);
      setR((prev) => ({
        ...prev,
        p8_negativos:
          Array.isArray(prev.p8_negativos) && prev.p8_negativos.length
            ? prev.p8_negativos
            : p.negativos,
        p9_restricciones:
          Array.isArray(prev.p9_restricciones) && prev.p9_restricciones.length
            ? prev.p9_restricciones
            : p.restricciones,
      }));
    };
    proponerDelCampo({
      data: {
        respuestas: respuestasEnTexto(r)
          .slice(0, PRIMERA_PROPUESTA - 1)
          .map(({ pregunta, respuesta }) => ({ pregunta, respuesta })),
        companyName: companyName || "la empresa",
        companyId,
      },
    })
      .then((p) =>
        aplicar({
          negativos: p.negativos.length ? p.negativos : NEGATIVOS_DE_RESPALDO,
          restricciones: p.restricciones.length ? p.restricciones : RESTRICCIONES_DE_RESPALDO,
        }),
      )
      .catch((err) => {
        console.error("[onboarding] propuesta:", err);
        aplicar({ negativos: NEGATIVOS_DE_RESPALDO, restricciones: RESTRICCIONES_DE_RESPALDO });
      })
      .finally(() => setProponiendo(false));
  }, [step, propuestas, proponiendo, r, companyName, companyId]);

  // Cerebro de la empresa + su radiografía, al terminar las preguntas.
  useEffect(() => {
    const firma = JSON.stringify(r);
    if (step !== CALIB_STEP || generating || (brain && brainDe === firma)) return;
    setGenerating(true);
    setGenError(null);
    setRadiografia(null);
    const lineas = respuestasEnTexto(r);
    generateCompanyBrain({
      data: {
        respuestas: lineas.map(({ pregunta, respuesta }) => ({ pregunta, respuesta })),
        directo: cerebroDirecto(r),
        companyName: companyName || "tu empresa",
        companyId,
      },
    })
      .then(async (result) => {
        const b = stripEphemeral(result.brain);
        setBrain(b);
        setBrainDe(firma);
        setRadiografia(result.radiografia);
        await Promise.all(
          lineas.map((l) =>
            supabase.rpc("save_onboarding_answer", {
              _block_number: l.bloque,
              _question_id: l.id,
              _question_text: l.pregunta,
              _answer: l.respuesta,
            }),
          ),
        );
        const { error } = await supabase.rpc("update_company_brain", { _brain: b });
        if (error) throw error;
        try {
          localStorage.removeItem(draftKey(companyId));
        } catch {
          /* noop */
        }
      })
      .catch((err) => {
        console.error("[onboarding] cerebro:", err);
        setGenError(mensajeDeError(err));
      })
      .finally(() => setGenerating(false));
  }, [step, brain, brainDe, generating, r, companyName, companyId]);

  // El manager corrige o agrega algo a su radiografía.
  const ajustar = async (ajuste: string) => {
    if (!brain) return;
    const res = await ajustarRadiografia({
      data: { brain, ajuste, companyName: companyName || "tu empresa", companyId },
    });
    const b = stripEphemeral(res.brain);
    const { error } = await supabase.rpc("update_company_brain", { _brain: b });
    if (error) throw error;
    await supabase.rpc("save_onboarding_answer", {
      _block_number: 4,
      _question_id: `ajuste_radiografia_${Date.now()}`,
      _question_text: "Ajuste a la radiografía",
      _answer: ajuste,
    });
    setBrain(b);
    if (res.radiografia.length) setRadiografia(res.radiografia);
  };

  if (!authReady) {
    return <main style={{ minHeight: "100dvh", background: BG }} />;
  }

  const pregunta =
    step >= PRIMERA_PREGUNTA && step < CALIB_STEP ? PREGUNTAS[step - PRIMERA_PREGUNTA] : null;

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: BG,
        color: "#F0F0F5",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {step > 0 && step <= PROGRESS_TOTAL && <ProgressBar step={step} total={PROGRESS_TOTAL} />}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          padding: "1.5rem 1.2rem 2rem",
        }}
      >
        {step === 0 && <Welcome name={name} onNext={goNext} />}
        {pregunta && (
          <QuestionStep
            key={pregunta.id}
            pregunta={pregunta}
            r={r}
            setR={setR}
            opcionesPropuestas={
              pregunta.propuestaPorCloser
                ? (propuestas?.[pregunta.propuestaPorCloser] ?? null)
                : undefined
            }
            onBack={goBack}
            onNext={goNext}
            onSaveExit={() => navigate({ to: "/" })}
          />
        )}
        {step === CALIB_STEP && (
          <RadiografiaStep
            companyName={companyName}
            radiografia={radiografia}
            loading={generating}
            error={genError}
            onAjustar={ajustar}
            onBack={goBack}
            onNext={goNext}
            onRetry={() => {
              setBrain(null);
              setBrainDe(null);
              setGenError(null);
            }}
          />
        )}
        {step === TEAM_STEP && (
          <TeamStep empresa={companyName} onFinish={() => navigate({ to: "/" })} />
        )}
      </div>
    </main>
  );
}

/* ── Una pregunta ── */
function QuestionStep({
  pregunta,
  r,
  setR,
  opcionesPropuestas,
  onBack,
  onNext,
  onSaveExit,
}: {
  pregunta: Pregunta;
  r: Respuestas;
  setR: React.Dispatch<React.SetStateAction<Respuestas>>;
  /** undefined = la pregunta no es propuesta; null = Closer la está preparando. */
  opcionesPropuestas?: string[] | null;
  onBack: () => void;
  onNext: () => void;
  onSaveExit: () => void;
}) {
  const [verPorQue, setVerPorQue] = useState(false);
  const libreId = libreDe(pregunta.id);
  const [verLibre, setVerLibre] = useState(
    typeof r[libreId] === "string" && (r[libreId] as string).length > 0,
  );
  const set = (id: string, v: string | string[]) => setR((prev) => ({ ...prev, [id]: v }));
  const cargando = opcionesPropuestas === null;

  return (
    <Block
      label={`Bloque ${pregunta.bloque} de 4 — ${BLOQUES[pregunta.bloque]}`}
      qNumber={`Pregunta ${pregunta.numero} de ${TOTAL_PREGUNTAS}`}
    >
      <Question text={pregunta.texto} subtext={pregunta.subtexto} />

      <button
        type="button"
        onClick={() => setVerPorQue((v) => !v)}
        style={{
          background: "transparent",
          border: "none",
          color: "#FF6B2B",
          fontFamily: "DM Sans",
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
          marginBottom: verPorQue ? 10 : 18,
        }}
      >
        {verPorQue ? "▾" : "▸"} ¿Para qué lo usa Closer?
      </button>
      {verPorQue && (
        <div style={{ marginBottom: 18 }}>
          <ImportantNote>{pregunta.porQue}</ImportantNote>
        </div>
      )}

      {cargando ? (
        <div
          style={{
            padding: "1.2rem 0",
            textAlign: "center",
            color: "#5A5A8A",
            fontSize: "0.84rem",
          }}
        >
          Closer está preparando las de tu giro…
        </div>
      ) : (
        pregunta.campos.map((c, i) =>
          campoVisible(c, r) ? (
            <div key={c.id} style={{ marginTop: i === 0 ? 0 : 22 }}>
              <CampoInput
                campo={c}
                r={r}
                set={set}
                opciones={
                  c.tipo === "opciones" && opcionesPropuestas ? opcionesPropuestas : undefined
                }
              />
            </div>
          ) : null,
        )
      )}

      <div style={{ marginTop: 22 }}>
        {verLibre ? (
          <>
            <FieldLabel>
              {pregunta.propuestaPorCloser
                ? "Agrega lo que falte, con tus palabras"
                : "¿Algo más que Closer deba saber?"}
            </FieldLabel>
            <TextArea
              value={typeof r[libreId] === "string" ? (r[libreId] as string) : ""}
              onChange={(v) => set(libreId, v)}
              placeholder="Escríbelo como se lo dirías a un vendedor nuevo."
              min={0}
              max={800}
            />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setVerLibre(true)}
            style={{
              background: "transparent",
              border: "1px dashed #252535",
              color: "#A0A0C0",
              borderRadius: 12,
              width: "100%",
              padding: "0.7rem",
              fontFamily: "DM Sans",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            + Agregar algo con tus palabras
          </button>
        )}
      </div>

      <NavButtons
        onBack={onBack}
        onNext={onNext}
        disabled={cargando || !preguntaCompleta(pregunta, r)}
      />
      <button
        type="button"
        onClick={onSaveExit}
        style={{
          width: "100%",
          marginTop: 10,
          background: "transparent",
          border: "none",
          color: "#5A5A8A",
          fontFamily: "DM Sans",
          fontSize: "0.78rem",
          cursor: "pointer",
        }}
      >
        Guardar y continuar después
      </button>
    </Block>
  );
}

function CampoInput({
  campo,
  r,
  set,
  opciones,
}: {
  campo: Campo;
  r: Respuestas;
  set: (id: string, v: string | string[]) => void;
  opciones?: string[];
}) {
  if (campo.tipo === "texto") {
    const val = typeof r[campo.id] === "string" ? (r[campo.id] as string) : "";
    return (
      <>
        {campo.etiqueta && (
          <FieldLabel>
            {campo.etiqueta}
            {campo.opcional ? " (opcional)" : ""}
          </FieldLabel>
        )}
        <TextInput value={val} onChange={(v) => set(campo.id, v)} placeholder={campo.placeholder} />
      </>
    );
  }
  return <OpcionesInput campo={campo} opciones={opciones ?? campo.opciones} r={r} set={set} />;
}

function OpcionesInput({
  campo,
  opciones,
  r,
  set,
}: {
  campo: CampoOpciones;
  opciones: string[];
  r: Respuestas;
  set: (id: string, v: string | string[]) => void;
}) {
  const actual = r[campo.id];
  const elegidas = Array.isArray(actual)
    ? actual
    : typeof actual === "string" && actual
      ? [actual]
      : [];
  const tocar = (o: string) => {
    if (!campo.multiple) return set(campo.id, [o]);
    if (elegidas.includes(o))
      return set(
        campo.id,
        elegidas.filter((x) => x !== o),
      );
    if (campo.max && elegidas.length >= campo.max) return;
    set(campo.id, [...elegidas, o]);
  };
  const conDetalle = elegidas.filter((o) => campo.detalle?.[o]);
  return (
    <>
      {campo.etiqueta && (
        <FieldLabel>
          {campo.etiqueta}
          {campo.multiple ? " · todas las que apliquen" : ""}
        </FieldLabel>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {opciones.map((o) => {
          const sel = elegidas.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => tocar(o)}
              style={{
                padding: "0.5rem 0.95rem",
                borderRadius: 99,
                textAlign: "left",
                background: sel ? "#FF6B2B" : "transparent",
                color: sel ? "#08080F" : "#F0F0F5",
                border: `1px solid ${sel ? "#FF6B2B" : "#252535"}`,
                fontFamily: "DM Sans",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              {campo.multiple && (sel ? "✓ " : "")}
              {o}
            </button>
          );
        })}
      </div>
      {conDetalle.map((o) => (
        <div key={o} style={{ marginTop: 10 }}>
          <FieldLabel>
            {o}: {campo.detalle![o]}
          </FieldLabel>
          <TextInput
            value={
              typeof r[detalleDe(campo.id, o)] === "string"
                ? (r[detalleDe(campo.id, o)] as string)
                : ""
            }
            onChange={(v) => set(detalleDe(campo.id, o), v)}
            placeholder={campo.detalle![o]}
          />
        </div>
      ))}
    </>
  );
}

/* ── Bienvenida ── */
function Welcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        animation: "fade-up 400ms ease both",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <CloserCharacter state="normal" size={120} />
      </div>
      <h1
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: "1.6rem",
          color: "#F0F0F5",
          margin: 0,
          textAlign: "center",
          letterSpacing: "-0.02em",
        }}
      >
        Hola {name}.
      </h1>
      <p
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.95rem",
          color: "#F0F0F5",
          marginTop: 14,
          marginBottom: 8,
          textAlign: "center",
          lineHeight: 1.45,
        }}
      >
        {FRASE_DE_ENTRADA}
      </p>
      <p
        style={{
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.84rem",
          color: "#5A5A8A",
          marginTop: 4,
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        Son {TOTAL_PREGUNTAS} preguntas, casi todas de tocar. Unos 5 minutos.
      </p>
      <div
        style={{
          background: "#111118",
          border: "1px solid #252535",
          borderRadius: 14,
          padding: "1.25rem",
        }}
      >
        {[
          { icon: "🎯", text: "Qué ofreces y a quién" },
          { icon: "🗺️", text: "Cómo trabaja tu equipo" },
          { icon: "💰", text: "Lo que ofreces y cómo manejas el precio" },
          { icon: "✅", text: "Closer propone lo de tu giro, tú confirmas" },
        ].map((it, i, arr) => (
          <div
            key={it.text}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 0",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(255,107,43,0.25)" : "none",
            }}
          >
            <span style={{ fontSize: "1.25rem" }}>{it.icon}</span>
            <span
              style={{
                fontFamily: "DM Sans",
                fontWeight: 500,
                fontSize: "0.84rem",
                color: "#F0F0F5",
              }}
            >
              {it.text}
            </span>
          </div>
        ))}
      </div>
      <PrimaryButton onClick={onNext} style={{ marginTop: 28 }}>
        Empezar →
      </PrimaryButton>
    </div>
  );
}

/* ── COMUNES ── */
function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = (step / total) * 100;
  return (
    <div style={{ padding: "1rem 1.2rem 0" }}>
      <div style={{ height: 3, background: "#252535", borderRadius: 99, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "#FF6B2B",
            transition: "width 350ms ease",
          }}
        />
      </div>
    </div>
  );
}

function Block({
  label,
  qNumber,
  children,
}: {
  label: string;
  qNumber: string;
  children: ReactNode;
}) {
  return (
    <div style={{ animation: "fade-up 350ms ease both" }}>
      <p
        style={{
          fontFamily: "DM Sans",
          fontWeight: 700,
          fontSize: "0.6rem",
          color: "#FF6B2B",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "DM Sans",
          fontSize: "0.76rem",
          color: "#5A5A8A",
          marginTop: 4,
          marginBottom: 18,
        }}
      >
        {qNumber}
      </p>
      {children}
    </div>
  );
}

function Question({
  text,
  subtext,
  style,
}: {
  text: string;
  subtext?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div style={style}>
      <h2
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: "1.3rem",
          color: "#F0F0F5",
          margin: 0,
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
        }}
      >
        {text}
      </h2>
      {subtext && (
        <p style={{ fontSize: "0.8rem", color: "#5A5A8A", marginTop: 8, marginBottom: 16 }}>
          {subtext}
        </p>
      )}
      {!subtext && <div style={{ height: 12 }} />}
    </div>
  );
}

function FieldLabel({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <p
      style={{
        fontFamily: "DM Sans",
        fontSize: "0.76rem",
        color: "#5A5A8A",
        margin: 0,
        marginBottom: 6,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  min: number;
  max: number;
}) {
  const len = value.length;
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder={placeholder}
        rows={4}
        style={{
          width: "100%",
          background: "#111118",
          color: "#F0F0F5",
          border: `1px solid ${len > 0 ? "#FF6B2B" : "#252535"}`,
          borderRadius: 14,
          padding: "0.85rem 1rem",
          fontFamily: "DM Sans, sans-serif",
          fontSize: "0.9rem",
          resize: "vertical",
          outline: "none",
          transition: "border-color 180ms",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B2B")}
        onBlur={(e) => (e.currentTarget.style.borderColor = len > 0 ? "#FF6B2B" : "#252535")}
      />
      <p
        style={{
          fontSize: "0.7rem",
          color: len < min ? "#5A5A8A" : "#06D6A0",
          marginTop: 6,
          textAlign: "right",
        }}
      >
        {len}/{max} {len < min && `· mínimo ${min}`}
      </p>
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        height: 48,
        background: "#111118",
        color: "#F0F0F5",
        border: "1px solid #252535",
        borderRadius: 14,
        padding: "0 1rem",
        fontFamily: "DM Sans, sans-serif",
        fontSize: "0.9rem",
        outline: "none",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B2B")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#252535")}
    />
  );
}

function ImportantNote({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "#111118",
        borderLeft: "3px solid #FF6B2B",
        borderTop: "1px solid #252535",
        borderRight: "1px solid #252535",
        borderBottom: "1px solid #252535",
        borderRadius: "8px",
        padding: "0.95rem 1rem",
        fontFamily: "DM Sans",
        fontSize: "0.84rem",
        color: "#F0F0F5",
        lineHeight: 1.45,
      }}
    >
      {children}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  style,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        height: 52,
        borderRadius: 99,
        border: "none",
        background: "#FF6B2B",
        color: "#08080F",
        fontFamily: "Syne, sans-serif",
        fontWeight: 700,
        fontSize: "0.95rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        boxShadow: disabled ? "none" : "0 8px 24px rgba(255,107,43,0.3)",
        transition: "opacity 200ms",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function NavButtons({
  onBack,
  onNext,
  disabled,
}: {
  onBack: () => void;
  onNext: () => void;
  disabled: boolean;
}) {
  return (
    <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
      <PrimaryButton onClick={onNext} disabled={disabled}>
        Continuar →
      </PrimaryButton>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: "transparent",
          border: "none",
          color: "#5A5A8A",
          fontFamily: "DM Sans",
          fontSize: "0.8rem",
          cursor: "pointer",
          padding: 8,
        }}
      >
        ← Atrás
      </button>
    </div>
  );
}

/* ── La radiografía ── */
// En vez de mostrar cómo va a actuar el cliente IA, Closer le describe al
// manager su empresa con lo que le acaba de contar (pedido de Emilio, oct-2026).
// Si algo no es así, lo corrige o lo completa ahí mismo, con sus palabras.
function RadiografiaStep({
  companyName,
  radiografia,
  loading,
  error,
  onAjustar,
  onBack,
  onNext,
  onRetry,
}: {
  companyName: string;
  radiografia: SeccionRadiografia[] | null;
  loading: boolean;
  error: string | null;
  onAjustar: (ajuste: string) => Promise<void>;
  onBack: () => void;
  onNext: () => void;
  onRetry: () => void;
}) {
  const [ajuste, setAjuste] = useState("");
  const [ajustando, setAjustando] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const listo = !!radiografia && radiografia.length > 0 && !loading && !error;

  const enviar = async () => {
    const texto = ajuste.trim();
    if (!texto) return;
    setAjustando(true);
    setAviso(null);
    try {
      await onAjustar(texto);
      setAjuste("");
      setAviso({ ok: true, texto: "Listo, Closer ya lo ajustó." });
    } catch (err) {
      console.error("[onboarding] ajuste:", err);
      setAviso({ ok: false, texto: mensajeDeError(err) });
    } finally {
      setAjustando(false);
    }
  };

  return (
    <div style={{ animation: "fade-up 400ms ease both" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <CloserCharacter state={listo ? "celebration" : "normal"} size={90} />
      </div>
      <h2
        style={{
          fontFamily: "Syne",
          fontWeight: 800,
          fontSize: "1.35rem",
          color: "#F0F0F5",
          margin: 0,
          textAlign: "center",
          lineHeight: 1.25,
        }}
      >
        La radiografía de {companyName || "tu empresa"}
      </h2>
      <p
        style={{
          fontSize: "0.84rem",
          color: "#5A5A8A",
          marginTop: 8,
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        Closer va a usar esta información para que las prácticas de tu equipo sean lo más cercanas a
        la realidad de tu empresa: el sistema de ventas de Closer, aplicado a tu industria y a tu
        negocio. Si algo no es así, corrígelo aquí.
      </p>

      {loading && (
        <div
          style={{
            padding: "1.6rem 0",
            textAlign: "center",
            color: "#5A5A8A",
            fontSize: "0.84rem",
          }}
        >
          Closer está armando la radiografía de tu empresa…
        </div>
      )}
      {error && !loading && (
        <div style={{ padding: "1rem 0", textAlign: "center" }}>
          <p style={{ color: "#EF476F", fontSize: "0.84rem", margin: 0 }}>{error}</p>
          <button
            onClick={onRetry}
            style={{
              marginTop: 12,
              background: "transparent",
              border: "1px solid #252535",
              color: "#FF6B2B",
              padding: "8px 16px",
              borderRadius: 99,
              cursor: "pointer",
              fontFamily: "DM Sans",
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {listo && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              opacity: ajustando ? 0.5 : 1,
              transition: "opacity 200ms",
            }}
          >
            {radiografia!.map((s) => (
              <div
                key={s.titulo}
                style={{
                  background: "#111118",
                  border: "1px solid #252535",
                  borderRadius: 14,
                  padding: "1rem",
                }}
              >
                <p
                  style={{
                    fontFamily: "DM Sans",
                    fontWeight: 700,
                    fontSize: "0.62rem",
                    color: "#FF6B2B",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    margin: 0,
                  }}
                >
                  {s.titulo}
                </p>
                <p
                  style={{
                    fontFamily: "DM Sans",
                    fontSize: "0.88rem",
                    color: "#F0F0F5",
                    margin: 0,
                    marginTop: 8,
                    lineHeight: 1.5,
                  }}
                >
                  {s.texto}
                </p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22 }}>
            <FieldLabel>¿Algo que corregir o agregar?</FieldLabel>
            <TextArea
              value={ajuste}
              onChange={setAjuste}
              placeholder="Ej: también les vendemos a gasolineras, y a los clientes nuevos no les damos crédito."
              min={0}
              max={800}
            />
            <button
              type="button"
              onClick={enviar}
              disabled={ajustando || !ajuste.trim()}
              style={{
                width: "100%",
                height: 44,
                borderRadius: 99,
                border: "1px solid #FF6B2B",
                background: "transparent",
                color: "#FF6B2B",
                fontFamily: "DM Sans",
                fontWeight: 600,
                fontSize: "0.85rem",
                cursor: ajustando || !ajuste.trim() ? "not-allowed" : "pointer",
                opacity: ajustando || !ajuste.trim() ? 0.5 : 1,
              }}
            >
              {ajustando ? "Closer está ajustando…" : "Ajustar la radiografía"}
            </button>
            {aviso && (
              <p
                style={{
                  fontSize: "0.78rem",
                  color: aviso.ok ? "#06D6A0" : "#EF476F",
                  marginTop: 8,
                  textAlign: "center",
                }}
              >
                {aviso.texto}
              </p>
            )}
          </div>
        </>
      )}

      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={onNext} disabled={!listo || ajustando}>
          Todo está bien, continuar →
        </PrimaryButton>
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "transparent",
            border: "none",
            color: "#5A5A8A",
            fontFamily: "DM Sans",
            fontSize: "0.8rem",
            cursor: "pointer",
            padding: 8,
          }}
        >
          ← Cambiar mis respuestas
        </button>
      </div>
    </div>
  );
}

/* ── Equipo ── */
// Antes, si el código no se generaba, la pantalla se quedaba en "•••• ••••" sin
// decir nada, ni con "Generar nuevo". Ahora dice qué pasó. La invitación por
// correo se quitó: era un botón que no enviaba nada.
function TeamStep({ empresa, onFinish }: { empresa: string; onFinish: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [expires, setExpires] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const regenerate = async () => {
    setGenerating(true);
    setError(null);
    // Siempre con duración: existen dos versiones de la función (sin datos y con
    // _hours) y llamarla sin datos es ambiguo — la base la rechaza sin generar
    // nada. Mi Empresa ya la llama así. 168 h = los 7 días que dice la pantalla.
    const { data, error: err } = await supabase.rpc("generate_company_invite", { _hours: 168 });
    setGenerating(false);
    if (err || !data) {
      console.error("[onboarding] generate_company_invite:", err);
      setError(
        `No pudimos generar el código${err?.message ? ` (${err.message})` : ""}. Toca «Generar código» otra vez.`,
      );
      return;
    }
    const d = data as { code: string; expires_at: string };
    setCode(d.code);
    setExpires(d.expires_at);
  };

  useEffect(() => {
    (async () => {
      const { data, error: err } = await supabase.rpc("get_active_company_invite");
      if (err) console.error("[onboarding] get_active_company_invite:", err);
      if (data) {
        const d = data as { code: string; expires_at: string };
        setCode(d.code);
        setExpires(d.expires_at);
      } else {
        await regenerate();
      }
    })();
  }, []);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  return (
    <div style={{ animation: "fade-up 400ms ease both" }}>
      <h2
        style={{
          fontFamily: "Syne",
          fontWeight: 800,
          fontSize: "1.4rem",
          color: "#F0F0F5",
          margin: 0,
        }}
      >
        Agrega tu equipo
      </h2>
      <p style={{ fontSize: "0.84rem", color: "#5A5A8A", marginTop: 8, marginBottom: 20 }}>
        Mándales la invitación por WhatsApp o por correo. Con la liga crean su cuenta y quedan en tu
        equipo.
      </p>

      <div
        style={{
          background: "#111118",
          border: "1px solid #252535",
          borderRadius: 14,
          padding: "1.25rem",
        }}
      >
        <p
          style={{
            fontFamily: "DM Sans",
            fontWeight: 700,
            fontSize: "0.6rem",
            color: "#FF6B2B",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin: 0,
          }}
        >
          Código de empresa
        </p>
        <div
          style={{
            marginTop: 14,
            background: "#08080F",
            borderRadius: 8,
            padding: "0.85rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "Syne",
              fontWeight: 800,
              fontSize: "1.8rem",
              color: "#F0F0F5",
              margin: 0,
              letterSpacing: "0.08em",
            }}
          >
            {code ?? (generating ? "Generando…" : "—")}
          </p>
        </div>
        {error && (
          <p style={{ fontSize: "0.78rem", color: "#EF476F", marginTop: 10, textAlign: "center" }}>
            {error}
          </p>
        )}
        {code && (
          <div style={{ marginTop: 14 }}>
            <CompartirInvitacion codigo={code} empresa={empresa} vence={expires} />
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={copy}
            disabled={!code}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid #252535",
              color: copied ? "#06D6A0" : "#F0F0F5",
              padding: "0.55rem",
              borderRadius: 99,
              fontFamily: "DM Sans",
              fontSize: "0.78rem",
              cursor: code ? "pointer" : "not-allowed",
              fontWeight: 500,
            }}
          >
            {copied ? "✓ Copiado" : "📋 Copiar código"}
          </button>
          <button
            onClick={regenerate}
            disabled={generating}
            style={{
              flex: 1,
              background: "transparent",
              border: "1px solid #252535",
              color: "#F0F0F5",
              padding: "0.55rem",
              borderRadius: 99,
              fontFamily: "DM Sans",
              fontSize: "0.78rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {generating ? "..." : code ? "🔄 Generar nuevo" : "Generar código"}
          </button>
        </div>
        {expires && (
          <p style={{ fontSize: "0.68rem", color: "#5A5A8A", marginTop: 8, textAlign: "center" }}>
            Expira: {new Date(expires).toLocaleDateString("es-MX")}
          </p>
        )}
      </div>

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={onFinish}>Ir a mi dashboard →</PrimaryButton>
        <button
          type="button"
          onClick={onFinish}
          style={{
            background: "transparent",
            border: "none",
            color: "#5A5A8A",
            fontFamily: "DM Sans",
            fontSize: "0.8rem",
            cursor: "pointer",
            padding: 8,
          }}
        >
          Invitar después
        </button>
      </div>
    </div>
  );
}
