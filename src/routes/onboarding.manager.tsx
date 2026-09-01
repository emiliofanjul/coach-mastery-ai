import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CloserCharacter } from "@/components/closer/CloserCharacter";
import { generateCompanyBrain } from "@/utils/onboarding.functions";
import {
  QUESTIONS,
  FRECUENCIA_OPTIONS,
  INTERACCION_OPTIONS,
  DURACION_OPTIONS,
  RELACION_OPTIONS,
  EXT_SECTIONS,
  type ExtSection,
  type ExtQuestion,
} from "@/lib/onboarding-questions";

export const Route = createFileRoute("/onboarding/manager")({
  head: () => ({
    meta: [
      { title: "Configura tu empresa — Closer" },
      { name: "description", content: "Construye el cerebro comercial de tu empresa." },
    ],
  }),
  component: ManagerOnboarding,
});

const BG = "radial-gradient(ellipse at 30% 70%, #1e0a30 0%, transparent 55%), #08080F";

interface Answers {
  q1: string;
  q2: string;
  q3: string;
  ticket: string;
  frecuencia: string;
  interaccion: string[];
  duracion: string;
  relacion: string;
  q8: string;
  q9: string;
}

const EMPTY: Answers = {
  q1: "", q2: "", q3: "",
  ticket: "", frecuencia: "",
  interaccion: [], duracion: "", relacion: "",
  q8: "", q9: "",
};

type Brain = Record<string, string>;

/** Respuestas de los bloques 4-6 (catálogo, cartera, campo). */
type ExtAnswers = Record<string, string | string[]>;

// Mapa de pasos. Los bloques 1-3 ocupan 1..6; los bloques 4-6 (una pantalla
// por sección) arrancan en 7; después van calibración, cerebro y equipo.
const EXT_START = 7;
const CALIB_STEP = EXT_START + EXT_SECTIONS.length;
const BRAIN_STEP = CALIB_STEP + 1;
const TEAM_STEP = CALIB_STEP + 2;
const PROGRESS_TOTAL = TEAM_STEP;

const draftKey = (companyId: string | null) => `closer_onboarding_draft_${companyId ?? "anon"}`;

function extAnswerText(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v.join(", ");
  return (v ?? "").trim();
}

/** Una sección está completa cuando toda pregunta no opcional tiene respuesta suficiente. */
function sectionComplete(section: ExtSection, ext: ExtAnswers): boolean {
  return section.questions.every((q) => {
    if (q.optional) return true;
    const txt = extAnswerText(ext[q.id]);
    if (!txt) return false;
    return txt.length >= (q.min ?? 1);
  });
}

// Llaves que jamás deben persistirse en companies.company_sales_brain.
// `__preview_response` es la respuesta efímera del cliente para el preview del
// onboarding. `DON_RAMON_RESPUESTA` es una llave legacy que se solía persistir
// por error — se limpia defensivamente aquí también.
const EPHEMERAL_KEYS = new Set(["__preview_response", "DON_RAMON_RESPUESTA"]);
function stripEphemeral(b: Brain): Brain {
  const out: Brain = {};
  for (const [k, v] of Object.entries(b)) {
    if (EPHEMERAL_KEYS.has(k)) continue;
    out[k] = v;
  }
  return out;
}

function ManagerOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = welcome
  const [a, setA] = useState<Answers>(EMPTY);
  const [ext, setExt] = useState<ExtAnswers>({});
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [brain, setBrain] = useState<Brain | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Cargar perfil del manager
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles").select("full_name, company_id, role").eq("id", session.user.id).single();
      if (!active) return;
      if (!profile || profile.role !== "manager") {
        navigate({ to: "/" });
        return;
      }
      setName((profile.full_name ?? "").split(" ")[0] || "Manager");
      setCompanyId(profile.company_id ?? null);
      if (profile.company_id) {
        const { data: comp } = await supabase
          .from("companies").select("name, onboarding_completed").eq("id", profile.company_id).single();
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
    return () => { active = false; };
  }, [navigate]);

  // Borrador local: el cuestionario es largo a propósito, así que el manager
  // puede salir y volver sin perder nada.
  useEffect(() => {
    if (!authReady || draftLoaded) return;
    try {
      const raw = localStorage.getItem(draftKey(companyId));
      if (raw) {
        const d = JSON.parse(raw) as { step?: number; a?: Answers; ext?: ExtAnswers };
        if (d.a) setA({ ...EMPTY, ...d.a });
        if (d.ext) setExt(d.ext);
        if (typeof d.step === "number" && d.step > 0 && d.step < CALIB_STEP) setStep(d.step);
      }
    } catch { /* borrador corrupto: se ignora */ }
    setDraftLoaded(true);
  }, [authReady, draftLoaded, companyId]);

  useEffect(() => {
    if (!draftLoaded) return;
    try {
      localStorage.setItem(draftKey(companyId), JSON.stringify({ step, a, ext }));
    } catch { /* sin espacio: no bloquea */ }
  }, [draftLoaded, step, a, ext, companyId]);

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  // Generar Brain al entrar al paso de calibración
  useEffect(() => {
    if (step !== CALIB_STEP || brain || generating) return;
    setGenerating(true);
    setGenError(null);
    const baseAnswers = [
      { id: "q1_que_vendes", block: 1, question: QUESTIONS.q1_que_vendes.text, answer: a.q1 },
      { id: "q2_a_quien", block: 1, question: QUESTIONS.q2_a_quien.text, answer: a.q2 },
      { id: "q3_como_gana", block: 1, question: QUESTIONS.q3_como_gana.text, answer: a.q3 },
      { id: "q4_ticket", block: 1, question: "Ticket promedio", answer: a.ticket },
      { id: "q4_frecuencia", block: 1, question: "Frecuencia de compra", answer: a.frecuencia },
      { id: "q5_interaccion", block: 2, question: QUESTIONS.q5_interaccion.text, answer: a.interaccion.join(", ") },
      { id: "q6_duracion", block: 2, question: QUESTIONS.q6_duracion.text, answer: a.duracion },
      { id: "q7_relacion", block: 2, question: QUESTIONS.q7_relacion.text, answer: a.relacion },
      { id: "q8_diferenciador", block: 3, question: QUESTIONS.q8_diferenciador.text, answer: a.q8 },
      { id: "q9_restricciones", block: 3, question: QUESTIONS.q9_restricciones.text, answer: a.q9 },
    ];
    const extAnswers = EXT_SECTIONS.flatMap((s) =>
      s.questions.map((q) => ({
        id: q.id,
        block: s.block,
        // La llave del brain viaja con la pregunta para que el modelo no
        // tenga que adivinar dónde va cada respuesta.
        question: `[${q.brainKey}] ${q.text}${q.usageNote ? ` — ${q.usageNote}` : ""}`,
        answer: extAnswerText(ext[q.id]),
      })),
    );
    const answers = [...baseAnswers, ...extAnswers];
    generateCompanyBrain({
      data: {
        answers: answers.map(({ question, answer }) => ({ question, answer })),
        companyName: companyName || "tu empresa",
        companyId,
        openerLine: "Buenos días, soy Carlos. ¿Cómo están manejando los productos que vendemos ahorita?",
      },
    })
      .then(async (result) => {
        setBrain(result);
        // Guardar respuestas + brain en BD
        await Promise.all(
          answers.map((ans) =>
            supabase.rpc("save_onboarding_answer", {
              _block_number: ans.block,
              _question_id: ans.id,
              _question_text: ans.question,
              _answer: ans.answer,
            }),
          ),
        );
        await supabase.rpc("update_company_brain", { _brain: stripEphemeral(result) });
        try { localStorage.removeItem(draftKey(companyId)); } catch { /* noop */ }
      })
      .catch((err) => {
        console.error(err);
        setGenError(err.message === "rate_limit" ? "Closer está saturado, intenta en un momento." : err.message === "payment_required" ? "Se acabaron los créditos de IA. Avisa al admin." : "No pudimos generar el cerebro. Intenta de nuevo.");
      })
      .finally(() => setGenerating(false));
  }, [step, brain, generating, a, ext, companyName, companyId]);

  if (!authReady) {
    return <main style={{ minHeight: "100dvh", background: BG }} />;
  }

  // === RENDER POR STEP ===
  return (
    <main style={{ minHeight: "100dvh", background: BG, color: "#F0F0F5", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      {step > 0 && step <= PROGRESS_TOTAL && <ProgressBar step={step} total={PROGRESS_TOTAL} />}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: 560, width: "100%", margin: "0 auto", padding: "1.5rem 1.2rem 2rem" }}>
        {step === 0 && <Welcome name={name} onNext={goNext} />}
        {step === 1 && (
          <Block label="Bloque 1 de 6 — Tu negocio" qNumber="Pregunta 1 de 9">
            <Question text={QUESTIONS.q1_que_vendes.text} subtext={QUESTIONS.q1_que_vendes.subtext} />
            <TextArea value={a.q1} onChange={(v) => setA({ ...a, q1: v })} placeholder="Ej: Lubricantes y aceites de motor Bardahl y Repsol para refaccionarias y talleres mecánicos" min={20} max={300} />
            <NavButtons onBack={goBack} onNext={goNext} disabled={a.q1.trim().length < 20} />
          </Block>
        )}
        {step === 2 && (
          <Block label="Bloque 1 de 6 — Tu negocio" qNumber="Pregunta 2 de 9">
            <Question text={QUESTIONS.q2_a_quien.text} subtext={QUESTIONS.q2_a_quien.subtext} />
            <TextArea value={a.q2} onChange={(v) => setA({ ...a, q2: v })} placeholder="Ej: Dueños de refaccionarias y talleres mecánicos independientes. El dueño generalmente decide." min={20} max={300} />
            <NavButtons onBack={goBack} onNext={goNext} disabled={a.q2.trim().length < 20} />
          </Block>
        )}
        {step === 3 && (
          <Block label="Bloque 1 de 6 — Tu negocio" qNumber="Pregunta 3 de 9">
            <Question text={QUESTIONS.q3_como_gana.text} subtext={QUESTIONS.q3_como_gana.subtext} />
            <TextArea value={a.q3} onChange={(v) => setA({ ...a, q3: v })} placeholder="Ej: Mejor margen de ganancia en cada cambio de aceite y clientes que regresan por la calidad." min={20} max={300} />
            <NavButtons onBack={goBack} onNext={goNext} disabled={a.q3.trim().length < 20} />
          </Block>
        )}
        {step === 4 && (
          <Block label="Bloque 1 de 6 — Tu negocio" qNumber="Pregunta 4 de 9">
            <Question text="¿Cuál es el ticket promedio y con qué frecuencia compra?" subtext="Aproximado está bien." />
            <FieldLabel>Ticket promedio por visita</FieldLabel>
            <TextInput value={a.ticket} onChange={(v) => setA({ ...a, ticket: v })} placeholder="Ej: $1,500 pesos" />
            <FieldLabel style={{ marginTop: 18 }}>Frecuencia de compra</FieldLabel>
            <Pills options={FRECUENCIA_OPTIONS} value={a.frecuencia} onChange={(v) => setA({ ...a, frecuencia: v })} />
            <NavButtons onBack={goBack} onNext={goNext} disabled={!a.ticket.trim() || !a.frecuencia} />
          </Block>
        )}
        {step === 5 && (
          <Block label="Bloque 2 de 6 — Tu proceso" qNumber="Preguntas 5–7 de 9">
            <Question text={QUESTIONS.q5_interaccion.text} subtext={QUESTIONS.q5_interaccion.subtext} />
            <CheckCardList
              options={INTERACCION_OPTIONS}
              values={a.interaccion}
              onToggle={(id) => setA({ ...a, interaccion: a.interaccion.includes(id) ? a.interaccion.filter((x) => x !== id) : [...a.interaccion, id] })}
            />
            <Question text={QUESTIONS.q6_duracion.text} style={{ marginTop: 28 }} />
            <Pills options={DURACION_OPTIONS} value={a.duracion} onChange={(v) => setA({ ...a, duracion: v })} />
            <Question text={QUESTIONS.q7_relacion.text} style={{ marginTop: 28 }} />
            <RelationCards value={a.relacion} onChange={(v) => setA({ ...a, relacion: v })} />
            <NavButtons onBack={goBack} onNext={goNext} disabled={a.interaccion.length === 0 || !a.duracion || !a.relacion} />
          </Block>
        )}
        {step === 6 && (
          <Block label="Bloque 3 de 6 — Solo tú sabes esto" qNumber="Preguntas 8–9 de 9">
            <ImportantNote>
              Estas dos preguntas son las más importantes. Lo que escribas aquí es lo que hace que el entrenamiento sea específico para tu empresa y no genérico.
            </ImportantNote>
            <Question text={QUESTIONS.q8_diferenciador.text} subtext={QUESTIONS.q8_diferenciador.subtext} style={{ marginTop: 18 }} />
            <TextArea value={a.q8} onChange={(v) => setA({ ...a, q8: v })} placeholder="Ej: Porque llevamos años en la zona, el vendedor conoce a los dueños personalmente y cuando hay problema lo resolvemos ese mismo día." min={30} max={400} />
            <Question text={QUESTIONS.q9_restricciones.text} subtext={QUESTIONS.q9_restricciones.subtext} style={{ marginTop: 24 }} />
            <TextArea value={a.q9} onChange={(v) => setA({ ...a, q9: v })} placeholder="Ej: Nunca prometer entrega el mismo día si no está confirmado. Nunca hablar mal de la competencia por nombre." min={20} max={400} />
            <NavButtons onBack={goBack} onNext={goNext} disabled={a.q8.trim().length < 30 || a.q9.trim().length < 20} />
          </Block>
        )}
        {step >= EXT_START && step < CALIB_STEP && (() => {
          const section = EXT_SECTIONS[step - EXT_START]!;
          return (
            <ExtSectionStep
              section={section}
              ext={ext}
              setExt={setExt}
              onBack={goBack}
              onNext={goNext}
              onSaveExit={() => navigate({ to: "/" })}
            />
          );
        })()}
        {step === CALIB_STEP && (
          <CalibrationStep brain={brain} loading={generating} error={genError} onBack={goBack} onNext={goNext} onRetry={() => { setBrain(null); setGenError(null); }} />
        )}
        {step === BRAIN_STEP && (
          <BrainStep companyName={companyName} brain={brain} onBack={goBack} onNext={goNext} />
        )}
        {step === TEAM_STEP && (
          <TeamStep onFinish={() => navigate({ to: "/" })} />
        )}
      </div>
    </main>
  );
}

/* ── BLOQUES 4-6: secciones declarativas ── */
function ExtSectionStep({
  section, ext, setExt, onBack, onNext, onSaveExit,
}: {
  section: ExtSection;
  ext: ExtAnswers;
  setExt: React.Dispatch<React.SetStateAction<ExtAnswers>>;
  onBack: () => void;
  onNext: () => void;
  onSaveExit: () => void;
}) {
  const set = (id: string, v: string | string[]) => setExt((prev) => ({ ...prev, [id]: v }));
  const complete = sectionComplete(section, ext);
  return (
    <Block label={section.label} qNumber={`${section.questions.length} preguntas`}>
      {section.intro && <ImportantNote>{section.intro}</ImportantNote>}
      {section.questions.map((q: ExtQuestion, i: number) => {
        const val = ext[q.id];
        return (
          <div key={q.id} style={{ marginTop: i === 0 && !section.intro ? 0 : 26 }}>
            <Question text={q.text} subtext={q.subtext} />
            {q.kind === "textarea" && (
              <TextArea
                value={typeof val === "string" ? val : ""}
                onChange={(v) => set(q.id, v)}
                placeholder={q.placeholder ?? ""}
                min={q.min ?? 0}
                max={q.max ?? 2000}
              />
            )}
            {q.kind === "text" && (
              <TextInput
                value={typeof val === "string" ? val : ""}
                onChange={(v) => set(q.id, v)}
                placeholder={q.placeholder ?? ""}
              />
            )}
            {q.kind === "pills" && (
              <Pills
                options={q.options ?? []}
                value={typeof val === "string" ? val : ""}
                onChange={(v) => set(q.id, v)}
              />
            )}
            {q.kind === "checks" && (
              <CheckCardList
                options={(q.options ?? []).map((o) => ({ id: o, label: o, icon: "•" }))}
                values={Array.isArray(val) ? val : []}
                onToggle={(id) => {
                  const cur = Array.isArray(val) ? val : [];
                  set(q.id, cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
                }}
              />
            )}
          </div>
        );
      })}
      <NavButtons onBack={onBack} onNext={onNext} disabled={!complete} />
      <button
        type="button"
        onClick={onSaveExit}
        style={{
          width: "100%", marginTop: 10, background: "transparent", border: "none",
          color: "#5A5A8A", fontFamily: "DM Sans", fontSize: "0.78rem", cursor: "pointer",
        }}
      >
        Guardar y continuar después
      </button>
    </Block>
  );
}

/* ── PANTALLA 5 ── */
function Welcome({ name, onNext }: { name: string; onNext: () => void }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", animation: "fade-up 400ms ease both" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <CloserCharacter state="normal" size={120} />
      </div>
      <h1 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.6rem", color: "#F0F0F5", margin: 0, textAlign: "center", letterSpacing: "-0.02em" }}>
        Hola {name}.
      </h1>
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "0.92rem", color: "#5A5A8A", marginTop: 12, marginBottom: 24, textAlign: "center" }}>
        En los próximos 5 minutos vamos a construir el cerebro comercial de tu empresa.
      </p>
      <div style={{ background: "#111118", border: "1px solid #252535", borderRadius: 14, padding: "1.25rem" }}>
        {[
          { icon: "🎯", text: "Lo que vendes y a quién" },
          { icon: "🧠", text: "Cómo piensa tu cliente típico" },
          { icon: "⚡", text: "Qué hace diferente a tu equipo" },
        ].map((it, i, arr) => (
          <div key={it.icon} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,107,43,0.25)" : "none" }}>
            <span style={{ fontSize: "1.25rem" }}>{it.icon}</span>
            <span style={{ fontFamily: "DM Sans", fontWeight: 500, fontSize: "0.84rem", color: "#F0F0F5" }}>{it.text}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "0.8rem", color: "#5A5A8A", textAlign: "center", marginTop: 16 }}>
        Con eso Closer calibra clientes IA con diferentes perfiles para que sean los clientes exactos que enfrentan tus vendedores.
      </p>
      <PrimaryButton onClick={onNext} style={{ marginTop: 28 }}>Empezar configuración →</PrimaryButton>
    </div>
  );
}

/* ── COMUNES ── */
function ProgressBar({ step, total }: { step: number; total: number }) {
  const pct = (step / total) * 100;
  return (
    <div style={{ padding: "1rem 1.2rem 0" }}>
      <div style={{ height: 3, background: "#252535", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#FF6B2B", transition: "width 350ms ease" }} />
      </div>
    </div>
  );
}

function Block({ label, qNumber, children }: { label: string; qNumber: string; children: ReactNode }) {
  return (
    <div style={{ animation: "fade-up 350ms ease both" }}>
      <p style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: "0.6rem", color: "#FF6B2B", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
      <p style={{ fontFamily: "DM Sans", fontSize: "0.76rem", color: "#5A5A8A", marginTop: 4, marginBottom: 18 }}>{qNumber}</p>
      {children}
    </div>
  );
}

function Question({ text, subtext, style }: { text: string; subtext?: string; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.3rem", color: "#F0F0F5", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.25 }}>{text}</h2>
      {subtext && <p style={{ fontSize: "0.8rem", color: "#5A5A8A", marginTop: 8, marginBottom: 16 }}>{subtext}</p>}
      {!subtext && <div style={{ height: 12 }} />}
    </div>
  );
}

function FieldLabel({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontFamily: "DM Sans", fontSize: "0.76rem", color: "#5A5A8A", margin: 0, marginBottom: 6, ...style }}>{children}</p>;
}

function TextArea({ value, onChange, placeholder, min, max }: { value: string; onChange: (v: string) => void; placeholder: string; min: number; max: number }) {
  const len = value.length;
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder={placeholder}
        rows={4}
        style={{
          width: "100%", background: "#111118", color: "#F0F0F5",
          border: `1px solid ${len > 0 ? "#FF6B2B" : "#252535"}`,
          borderRadius: 14, padding: "0.85rem 1rem", fontFamily: "DM Sans, sans-serif",
          fontSize: "0.9rem", resize: "vertical", outline: "none", transition: "border-color 180ms",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B2B")}
        onBlur={(e) => (e.currentTarget.style.borderColor = len > 0 ? "#FF6B2B" : "#252535")}
      />
      <p style={{ fontSize: "0.7rem", color: len < min ? "#5A5A8A" : "#06D6A0", marginTop: 6, textAlign: "right" }}>
        {len}/{max} {len < min && `· mínimo ${min}`}
      </p>
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      style={{
        width: "100%", height: 48, background: "#111118", color: "#F0F0F5",
        border: "1px solid #252535", borderRadius: 14, padding: "0 1rem",
        fontFamily: "DM Sans, sans-serif", fontSize: "0.9rem", outline: "none",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#FF6B2B")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#252535")}
    />
  );
}

function Pills({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const sel = opt === value;
        return (
          <button key={opt} type="button" onClick={() => onChange(opt)}
            style={{
              padding: "0.5rem 0.95rem", borderRadius: 99,
              background: sel ? "#FF6B2B" : "transparent",
              color: sel ? "#08080F" : "#F0F0F5",
              border: `1px solid ${sel ? "#FF6B2B" : "#252535"}`,
              fontFamily: "DM Sans", fontSize: "0.8rem", fontWeight: 500,
              cursor: "pointer", transition: "all 150ms ease",
            }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function CheckCardList({ options, values, onToggle }: { options: { id: string; label: string; icon: string }[]; values: string[]; onToggle: (id: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map((opt) => {
        const sel = values.includes(opt.id);
        return (
          <button key={opt.id} type="button" onClick={() => onToggle(opt.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12, textAlign: "left",
              background: sel ? "rgba(255,107,43,0.1)" : "#111118",
              border: `1px solid ${sel ? "#FF6B2B" : "#252535"}`,
              borderRadius: 14, padding: "0.85rem 1rem", cursor: "pointer",
              color: "#F0F0F5", fontFamily: "DM Sans", fontSize: "0.84rem",
              transition: "all 150ms ease",
            }}>
            <span style={{
              width: 20, height: 20, borderRadius: 6,
              border: `2px solid ${sel ? "#FF6B2B" : "#252535"}`,
              background: sel ? "#FF6B2B" : "transparent",
              color: "#08080F", display: "grid", placeItems: "center",
              fontSize: "0.7rem", fontWeight: 800, flexShrink: 0,
            }}>{sel && "✓"}</span>
            <span style={{ fontSize: "1rem" }}>{opt.icon}</span>
            <span style={{ flex: 1 }}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function RelationCards({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {RELACION_OPTIONS.map((opt) => {
        const sel = value === opt.id;
        return (
          <button key={opt.id} type="button" onClick={() => onChange(opt.id)}
            style={{
              display: "flex", alignItems: "center", gap: 14, textAlign: "left",
              background: sel ? "rgba(255,107,43,0.06)" : "#111118",
              border: sel ? "2px solid #FF6B2B" : "1px solid #252535",
              padding: sel ? "calc(1rem - 1px)" : "1rem",
              borderRadius: 14, cursor: "pointer", color: "#F0F0F5",
              fontFamily: "DM Sans", transition: "all 150ms",
            }}>
            <span style={{ fontSize: "1.6rem" }}>{opt.icon}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontFamily: "Syne", fontWeight: 700, fontSize: "0.95rem" }}>{opt.title}</span>
              <span style={{ display: "block", fontSize: "0.78rem", color: "#5A5A8A", marginTop: 4 }}>{opt.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ImportantNote({ children }: { children: ReactNode }) {
  return (
    <div style={{
      background: "#111118", borderLeft: "3px solid #FF6B2B",
      borderTop: "1px solid #252535", borderRight: "1px solid #252535", borderBottom: "1px solid #252535",
      borderRadius: "8px", padding: "0.95rem 1rem",
      fontFamily: "DM Sans", fontSize: "0.84rem", color: "#F0F0F5", lineHeight: 1.45,
    }}>{children}</div>
  );
}

function PrimaryButton({ children, onClick, disabled, style }: { children: ReactNode; onClick: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={{
        width: "100%", height: 52, borderRadius: 99, border: "none",
        background: "#FF6B2B", color: "#08080F",
        fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.95rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        boxShadow: disabled ? "none" : "0 8px 24px rgba(255,107,43,0.3)",
        transition: "opacity 200ms",
        ...style,
      }}>
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, style }: { children: ReactNode; onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        width: "100%", height: 44, borderRadius: 99, border: "1px solid #252535",
        background: "transparent", color: "#F0F0F5",
        fontFamily: "DM Sans", fontWeight: 500, fontSize: "0.85rem", cursor: "pointer",
        ...style,
      }}>
      {children}
    </button>
  );
}

function NavButtons({ onBack, onNext, disabled }: { onBack: () => void; onNext: () => void; disabled: boolean }) {
  return (
    <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
      <PrimaryButton onClick={onNext} disabled={disabled}>Continuar →</PrimaryButton>
      <button type="button" onClick={onBack}
        style={{ background: "transparent", border: "none", color: "#5A5A8A", fontFamily: "DM Sans", fontSize: "0.8rem", cursor: "pointer", padding: 8 }}>
        ← Atrás
      </button>
    </div>
  );
}

/* ── PANTALLA 10 — Calibración ── */
function CalibrationStep({ brain, loading, error, onBack, onNext, onRetry }: { brain: Brain | null; loading: boolean; error: string | null; onBack: () => void; onNext: () => void; onRetry: () => void }) {
  return (
    <div style={{ animation: "fade-up 400ms ease both" }}>
      <h2 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: "1.4rem", color: "#F0F0F5", margin: 0 }}>Así va a hablar tu cliente IA</h2>
      <p style={{ fontSize: "0.84rem", color: "#5A5A8A", marginTop: 8, marginBottom: 20 }}>
        Closer analizó lo que nos compartiste y calibró a tu cliente IA. Verifica que suene como tus clientes reales.
      </p>

      <div style={{ background: "#111118", border: "1px solid #252535", borderRadius: 14, padding: "1rem" }}>
        <p style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: "0.7rem", color: "#5A5A8A", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0, marginBottom: 14 }}>Vista previa</p>
        {loading && <PreviewSkeleton />}
        {error && (
          <div style={{ padding: "1rem 0", textAlign: "center" }}>
            <p style={{ color: "#EF476F", fontSize: "0.84rem", margin: 0 }}>{error}</p>
            <button onClick={onRetry} style={{ marginTop: 12, background: "transparent", border: "1px solid #252535", color: "#FF6B2B", padding: "8px 16px", borderRadius: 99, cursor: "pointer", fontFamily: "DM Sans" }}>Reintentar</button>
          </div>
        )}
        {brain && !loading && !error && (
          <>
            <Bubble side="right">Buenos días, soy Carlos. ¿Cómo están manejando los productos que vendemos ahorita?</Bubble>
            <Bubble side="left">{brain.__preview_response || brain.DON_RAMON_RESPUESTA || "Pues a ver, cuénteme rápido."}</Bubble>
            <Bubble side="right">Le traigo algo que les puede ayudar con eso. ¿Tiene 3 minutos?</Bubble>
            <p style={{ fontSize: "0.68rem", color: "#5A5A8A", marginTop: 8, textAlign: "center" }}>
              Tu cliente IA responde según el perfil de tu cliente típico
            </p>
          </>
        )}
      </div>

      {brain && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: "0.6rem", color: "#5A5A8A", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Tono detectado</p>
          <span style={{ display: "inline-block", marginTop: 8, background: "rgba(255,107,43,0.15)", color: "#FF6B2B", border: "1px solid rgba(255,107,43,0.3)", borderRadius: 99, padding: "0.4rem 0.9rem", fontSize: "0.78rem", fontWeight: 500 }}>
            {brain.TONO_DETECTADO || "Profesional"}
          </span>
        </div>
      )}

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={onNext} disabled={!brain || loading}>Se ve bien, continuar →</PrimaryButton>
        <button type="button" onClick={onBack} style={{ background: "transparent", border: "none", color: "#5A5A8A", fontFamily: "DM Sans", fontSize: "0.8rem", cursor: "pointer", padding: 8 }}>← Ajustar respuestas</button>
      </div>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ alignSelf: i % 2 === 0 ? "flex-end" : "flex-start", width: "70%", height: 38, borderRadius: 14, background: "linear-gradient(90deg, #1A1A26 0%, #252535 50%, #1A1A26 100%)", backgroundSize: "200% 100%", animation: "pulse-orange 1.4s ease-in-out infinite" }} />
      ))}
      <p style={{ fontSize: "0.76rem", color: "#5A5A8A", textAlign: "center", marginTop: 8 }}>Closer está calibrando a tu cliente IA…</p>
    </div>
  );
}

function Bubble({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  const isRight = side === "right";
  return (
    <div style={{ display: "flex", justifyContent: isRight ? "flex-end" : "flex-start", marginBottom: 8 }}>
      <div style={{
        maxWidth: "82%", padding: "0.65rem 0.9rem", borderRadius: 14,
        background: isRight ? "#FF6B2B" : "#1A1A26",
        color: isRight ? "#08080F" : "#F0F0F5",
        fontFamily: "DM Sans", fontSize: "0.84rem", lineHeight: 1.4,
      }}>{children}</div>
    </div>
  );
}

/* ── PANTALLA 11 — Brain ── */
function BrainStep({ companyName, brain, onBack, onNext }: { companyName: string; brain: Brain | null; onBack: () => void; onNext: () => void }) {
  const cards = useMemo(() => ([
    { label: "Productos activos", key: "PRODUCTOS_ACTIVOS" },
    { label: "Cliente típico", key: "CLIENTE_TIPICO" },
    { label: "Argumentos de valor", key: "ARGUMENTOS_DE_VALOR" },
    { label: "Objeciones frecuentes", key: "OBJECIONES_REALES" },
    { label: "Contexto de venta", key: "CONTEXTO_DE_VENTA" },
    { label: "Restricciones", key: "RESTRICCIONES" },
  ]), []);

  return (
    <div style={{ animation: "fade-up 400ms ease both" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <CloserCharacter state="celebration" size={100} />
      </div>
      <h2 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: "1.3rem", color: "#F0F0F5", margin: 0, textAlign: "center", lineHeight: 1.25 }}>
        El cerebro comercial de {companyName || "tu empresa"} está listo.
      </h2>
      <p style={{ fontSize: "0.84rem", color: "#5A5A8A", marginTop: 10, marginBottom: 22, textAlign: "center" }}>
        Esto es lo que Closer aprendió de tu empresa.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {cards.map((c) => (
          <BrainCard key={c.key} label={c.label} value={brain?.[c.key] ?? ""} onSave={async (newVal) => {
            if (!brain) return;
            const updated = { ...brain, [c.key]: newVal };
            await supabase.rpc("update_company_brain", { _brain: stripEphemeral(updated) });
          }} />
        ))}
      </div>

      <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={onNext}>Listo, agregar mi equipo →</PrimaryButton>
        <button type="button" onClick={onBack} style={{ background: "transparent", border: "none", color: "#5A5A8A", fontFamily: "DM Sans", fontSize: "0.8rem", cursor: "pointer", padding: 8 }}>← Volver</button>
      </div>
    </div>
  );
}

function BrainCard({ label, value, onSave }: { label: string; value: string; onSave: (v: string) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div style={{ background: "#111118", border: "1px solid #252535", borderRadius: 14, padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <p style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: "0.6rem", color: "#FF6B2B", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
        {!editing && (
          <button onClick={() => setEditing(true)} style={{ background: "transparent", border: "none", color: "#5A5A8A", fontSize: "0.72rem", cursor: "pointer", fontFamily: "DM Sans" }}>Editar</button>
        )}
      </div>
      {editing ? (
        <>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3}
            style={{ width: "100%", marginTop: 8, background: "#08080F", color: "#F0F0F5", border: "1px solid #FF6B2B", borderRadius: 8, padding: "0.6rem", fontFamily: "DM Sans", fontSize: "0.84rem", resize: "vertical", outline: "none" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={async () => { await onSave(draft); setEditing(false); }} style={{ background: "#FF6B2B", color: "#08080F", border: "none", padding: "6px 14px", borderRadius: 99, fontFamily: "DM Sans", fontWeight: 600, fontSize: "0.76rem", cursor: "pointer" }}>Guardar</button>
            <button onClick={() => { setDraft(value); setEditing(false); }} style={{ background: "transparent", color: "#5A5A8A", border: "1px solid #252535", padding: "6px 14px", borderRadius: 99, fontFamily: "DM Sans", fontSize: "0.76rem", cursor: "pointer" }}>Cancelar</button>
          </div>
        </>
      ) : (
        <p style={{ fontFamily: "DM Sans", fontSize: "0.84rem", color: "#F0F0F5", margin: 0, marginTop: 8, lineHeight: 1.5 }}>{value || "—"}</p>
      )}
    </div>
  );
}

/* ── PANTALLA 12 — Equipo ── */
function TeamStep({ onFinish }: { onFinish: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [expires, setExpires] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("get_active_company_invite");
      if (data) {
        const d = data as { code: string; expires_at: string };
        setCode(d.code);
        setExpires(d.expires_at);
      } else {
        await regenerate();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const regenerate = async () => {
    setGenerating(true);
    const { data, error } = await supabase.rpc("generate_company_invite");
    setGenerating(false);
    if (!error && data) {
      const d = data as { code: string; expires_at: string };
      setCode(d.code); setExpires(d.expires_at);
    }
  };

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <div style={{ animation: "fade-up 400ms ease both" }}>
      <h2 style={{ fontFamily: "Syne", fontWeight: 800, fontSize: "1.4rem", color: "#F0F0F5", margin: 0 }}>Agrega tu equipo</h2>
      <p style={{ fontSize: "0.84rem", color: "#5A5A8A", marginTop: 8, marginBottom: 20 }}>
        Dos formas de invitar a tus vendedores
      </p>

      <div style={{ background: "#111118", border: "1px solid #252535", borderRadius: 14, padding: "1.25rem" }}>
        <p style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: "0.6rem", color: "#FF6B2B", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Código de empresa</p>
        <div style={{ marginTop: 14, background: "#08080F", borderRadius: 8, padding: "0.85rem", textAlign: "center" }}>
          <p style={{ fontFamily: "Syne", fontWeight: 800, fontSize: "1.8rem", color: "#F0F0F5", margin: 0, letterSpacing: "0.08em" }}>{code ?? "•••• ••••"}</p>
        </div>
        <p style={{ fontSize: "0.76rem", color: "#5A5A8A", marginTop: 10 }}>
          Comparte este código por WhatsApp. Expira en 7 días.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={copy} disabled={!code} style={{ flex: 1, background: "transparent", border: "1px solid #252535", color: copied ? "#06D6A0" : "#F0F0F5", padding: "0.55rem", borderRadius: 99, fontFamily: "DM Sans", fontSize: "0.78rem", cursor: code ? "pointer" : "not-allowed", fontWeight: 500 }}>
            {copied ? "✓ Copiado" : "📋 Copiar código"}
          </button>
          <button onClick={regenerate} disabled={generating} style={{ flex: 1, background: "transparent", border: "1px solid #252535", color: "#F0F0F5", padding: "0.55rem", borderRadius: 99, fontFamily: "DM Sans", fontSize: "0.78rem", cursor: "pointer", fontWeight: 500 }}>
            {generating ? "..." : "🔄 Generar nuevo"}
          </button>
        </div>
        {expires && <p style={{ fontSize: "0.68rem", color: "#5A5A8A", marginTop: 8, textAlign: "center" }}>Expira: {new Date(expires).toLocaleDateString("es-MX")}</p>}
      </div>

      <div style={{ background: "#111118", border: "1px solid #252535", borderRadius: 14, padding: "1.25rem", marginTop: 14 }}>
        <p style={{ fontFamily: "DM Sans", fontWeight: 700, fontSize: "0.6rem", color: "#5A5A8A", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>Invitación por correo</p>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@vendedor.com"
          style={{ width: "100%", marginTop: 12, height: 44, background: "#08080F", color: "#F0F0F5", border: "1px solid #252535", borderRadius: 14, padding: "0 1rem", fontFamily: "DM Sans", fontSize: "0.86rem", outline: "none" }} />
        <GhostButton onClick={() => { /* TODO: enviar por correo en una iteración futura */ alert("La invitación por correo llegará en una próxima versión. Por ahora comparte el código."); }} style={{ marginTop: 10 }}>Enviar invitación →</GhostButton>
        <p style={{ fontSize: "0.68rem", color: "#5A5A8A", marginTop: 8 }}>El vendedor recibirá un correo con instrucciones.</p>
      </div>

      <div style={{ marginTop: 18, padding: "1rem", textAlign: "center", color: "#5A5A8A", fontSize: "0.8rem", fontFamily: "DM Sans" }}>
        Aún no has invitado a nadie
      </div>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <PrimaryButton onClick={onFinish}>Ir a mi dashboard →</PrimaryButton>
        <button type="button" onClick={onFinish} style={{ background: "transparent", border: "none", color: "#5A5A8A", fontFamily: "DM Sans", fontSize: "0.8rem", cursor: "pointer", padding: 8 }}>Invitar después</button>
      </div>
    </div>
  );
}
