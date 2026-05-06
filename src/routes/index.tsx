import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Flame, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CloserCharacter, type CloserState } from "@/components/closer/CloserCharacter";
import { ScoreRing, ScoreLabel } from "@/components/closer/ScoreRing";
import { MundoNode } from "@/components/closer/MundoNode";
import { CoachBubble } from "@/components/closer/CoachBubble";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Closer — El vendedor no nace. Se hace." },
      {
        name: "description",
        content:
          "El mejor entrenador de ventas del mundo, disponible 24/7. Closer convierte vendedores en cerradores.",
      },
      { property: "og:title", content: "Closer — El vendedor no nace. Se hace." },
      {
        property: "og:description",
        content: "Entrenamiento de ventas con IA. Diagnostica, practica, cierra.",
      },
    ],
  }),
  component: DesignSystemShowcase,
});

const states: { id: CloserState; label: string; desc: string }[] = [
  { id: "normal", label: "Normal", desc: "Erguido, presente" },
  { id: "celebration", label: "Celebración", desc: "Victoria genuina" },
  { id: "correction", label: "Corrección", desc: "Pausa, serio constructivo" },
  { id: "motivation", label: "Motivación", desc: "Empuja al usuario" },
  { id: "support", label: "Apoyo", desc: "Mano extendida" },
];

function DesignSystemShowcase() {
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="container-closer pt-10 pb-8">
        <p className="eyebrow">Closer · Design System v0</p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl mt-2 leading-[0.95]">
          El vendedor
          <br />
          no nace.
          <br />
          <span className="text-primary">Se hace.</span>
        </h1>
        <p className="mt-5 text-muted-foreground text-base leading-relaxed max-w-md">
          Sistema visual base. Dark mode permanente. Naranja{" "}
          <code className="text-primary font-mono text-sm">#FF6B2B</code> reservado
          como única señal de acción principal.
        </p>
      </header>

      {/* CTA hero — demuestra la jerarquía */}
      <section className="container-closer">
        <div className="card-closer p-6 sm:p-8">
          <p className="eyebrow">Misión del día</p>
          <h2 className="font-display font-bold text-2xl mt-2 leading-tight">
            Maneja la objeción de precio con triple desglose
          </h2>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            Hoy practicas <strong className="text-foreground">una sola cosa</strong>:
            cuando el cliente diga "está caro", responder con cálculo de margen
            antes que con justificación. 5 minutos. Una repetición.
          </p>
          <Button variant="hero" size="lg" block className="mt-6">
            Empezar ahora
            <ArrowRight />
          </Button>
          <Button variant="ghost" size="default" block className="mt-2">
            Ver el plan completo
          </Button>
        </div>
      </section>

      {/* Tipografía */}
      <Section eyebrow="Tipografía" title="Syne + DM Sans">
        <div className="card-closer p-6 space-y-4">
          <div>
            <p className="eyebrow mb-1">Display — Syne</p>
            <p className="font-display font-bold text-3xl leading-tight">
              Vamos al campo a diagnosticar.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-1">Body — DM Sans</p>
            <p className="text-base leading-relaxed text-muted-foreground">
              El vendedor mediocre vende. El doctor vendedor pregunta primero,
              entiende después, y solo receta cuando hay algo genuino que aporta.
            </p>
          </div>
          <div className="closer-voice text-xl text-foreground border-l-2 border-primary pl-4">
            "Eso estuvo perfecto. Específicamente cuando manejaste la objeción
            de precio en el turno 6."
            <span className="block text-xs font-sans font-normal text-muted-foreground mt-2 normal-case tracking-normal">
              Voz de Closer hablando — siempre específica, nunca genérica.
            </span>
          </div>
        </div>
      </Section>

      {/* Botones */}
      <Section eyebrow="Botones" title="Jerarquía de acción">
        <div className="card-closer p-6 space-y-3">
          <Button variant="hero" size="lg" block>
            <Flame /> Hero — CTA principal del Home
          </Button>
          <Button variant="primary" block>
            Primary — acción principal
          </Button>
          <Button variant="secondary" block>
            Secondary — alternativa
          </Button>
          <Button variant="outline" block>
            Outline — neutral / saltar
          </Button>
          <Button variant="ghost" block>
            Ghost — terciaria
          </Button>
          <Button variant="coach" block>
            <Sparkles /> Coach — única para el coach bubble
          </Button>
          <Button variant="destructive" block>
            Destructive — solo destruir
          </Button>
        </div>
      </Section>

      {/* Score ring */}
      <Section eyebrow="Feedback" title="Score con desglose">
        <div className="card-closer p-6 grid grid-cols-3 gap-4 place-items-center">
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={48} size={110} strokeWidth={10} label="Bajo" />
            <ScoreLabel score={48} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={72} size={110} strokeWidth={10} label="Medio" />
            <ScoreLabel score={72} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <ScoreRing score={88} size={110} strokeWidth={10} label="Alto" />
            <ScoreLabel score={88} />
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground text-center">
          El score nunca aparece solo. Siempre con sus 4 capas de desglose.
        </p>
      </Section>

      {/* Mapa nodos */}
      <Section eyebrow="El mapa" title="Revelación progresiva">
        <div className="card-closer p-6">
          <div className="flex flex-wrap items-start justify-center gap-5">
            <MundoNode label="Ley de promedios" emoji="📊" status="completed" />
            <MundoNode label="PPA" emoji="🎯" status="completed" />
            <MundoNode label="3 tipos de día" emoji="🌅" status="active" />
            <MundoNode label="KILT Theory" emoji="🧠" status="next" />
            <MundoNode
              label="Indicadores"
              emoji="🏆"
              status="boss-active"
            />
            <MundoNode label="Bloqueado" status="locked" />
          </div>
          <p className="mt-6 text-xs text-muted-foreground text-center">
            Solo el activo y el siguiente son visibles. El resto en niebla.
          </p>
        </div>
      </Section>

      {/* Personaje Closer */}
      <Section eyebrow="El personaje" title="Closer en sus 5 estados">
        <div className="card-closer p-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {states.map((s) => (
              <div
                key={s.id}
                className="flex flex-col items-center text-center gap-2"
              >
                <div className="rounded-2xl bg-background/40 border border-border w-full aspect-[3/4] flex items-end justify-center p-2">
                  <CloserCharacter state={s.id} size={70} />
                </div>
                <p className="font-display font-semibold text-sm">{s.label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Filosofía recordatorio */}
      <Section eyebrow="No olvidar" title="Principios que rigen el sistema">
        <ul className="card-closer p-6 space-y-3 text-sm leading-relaxed">
          {[
            "Closer SUGIERE, nunca BLOQUEA. El vendedor siempre decide.",
            "Naranja #FF6B2B es sagrado: solo acción principal.",
            "Logros = permanentes. Forma = dinámica. Nunca destruir logros.",
            "Mensajes específicos. Nunca '¡Excelente!' genérico.",
            "Mobile-first. 560px max. Padding lateral 1.2rem mínimo.",
            "Misión del día = UNA sola cosa accionable.",
          ].map((p) => (
            <li key={p} className="flex gap-3">
              <Target className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{p}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Coach bubble flotante — siempre presente */}
      <CoachBubble context="Estás en el showcase del Design System" />
    </div>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container-closer mt-10">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="font-display font-bold text-2xl mt-1 mb-4 leading-tight">
        {title}
      </h2>
      {children}
    </section>
  );
}
