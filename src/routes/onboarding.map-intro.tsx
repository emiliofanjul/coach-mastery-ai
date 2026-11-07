import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { estiloBoton, Estrella } from "@/components/closer/piezas";
import { Icono, estiloTitulo, estiloTexto, estiloEtiqueta } from "@/components/closer/bienvenida-ui";

/**
 * «Así funciona» (mensaje 154, nov-2026). Reemplaza el recorrido viejo (un mapa que ya no es así, un video
 * que no existía, compromisos e insignias que no hay): tres pantallas que muestran lo que de
 * verdad hace Closer —aprendes, practicas con tu voz, sabes qué mejorar— con una muestra de cada parte.
 * Se ve al terminar la bienvenida y desde el menú («Cómo funciona Closer»). No guarda nada:
 * onboarding_completed ya se guardó al terminar las preguntas.
 */
export const Route = createFileRoute("/onboarding/map-intro")({
  head: () => ({
    meta: [
      { title: "Así funciona — Closer" },
      { name: "description", content: "Cómo se aprende y se practica en Closer." },
      { property: "og:title", content: "Así funciona — Closer" },
      { property: "og:description", content: "Cómo se aprende y se practica en Closer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AsiFunciona,
});

// Mensaje 155 (Emilio, 7-nov): la historia explica cómo funciona y POR QUÉ funciona, y el impulso sube:
// por qué funciona (el sistema) → aprende → practica → la calificación (por qué es distinta a un chat de IA)
// → qué esperar (los 2 primeros nodos son teoría: quien llega por la voz no se lleva una sorpresa).
const PASOS: Array<{ paso: string; titulo: string; texto: string }> = [
  {
    paso: "Por qué funciona",
    titulo: "Un sistema, no consejos sueltos",
    texto: "Toda venta pasa por los mismos 6 pasos. Closer te entrena en cada uno, en orden, con un sistema creado por entrenadores con años vendiendo en la calle y formando equipos de venta.",
  },
  {
    paso: "1 · Aprende",
    titulo: "Una técnica a la vez",
    texto: "Cada nodo de tu mapa enseña una técnica: tarjetas cortas, con ejemplos de cómo decirla bien y cómo no, y un quiz de 3 preguntas.",
  },
  {
    paso: "2 · Practica",
    titulo: "En voz alta, como en la calle",
    texto: "Lo que no practicas en voz alta no te sale en la visita. Aquí le hablas a un cliente que te contesta. Si te equivocas, lo intentas otra vez.",
  },
  {
    paso: "3 · Mejora",
    titulo: "Una calificación que no adivina",
    texto: "Un chat de IA te da su opinión. Closer te califica contra el sistema, con reglas claras para cada técnica, y te dice qué cambiar. Nunca te califica algo que no te ha enseñado.",
  },
  // Los 2 primeros nodos son teoría (1.0 y 1.1, unos 7 min) y el tercero (1.2) es la primera práctica con voz.
  // 50 de los 75 nodos tienen práctica.
  {
    paso: "Tu camino",
    titulo: "Empiezas con la teoría",
    texto: "Los 2 primeros nodos son de teoría. En el tercero haces tu primera práctica con voz, en menos de 10 minutos. Desde ahí, la mayoría de los nodos terminan con una práctica.",
  },
];

function AsiFunciona() {
  const navigate = useNavigate();
  const [listo, setListo] = useState(false);
  const [i, setI] = useState(0);
  const toque = useRef<number | null>(null);
  // En teléfonos bajitos (iPhone SE) el cuadro de la muestra es más chico: la muestra se achica para caber entera.
  const cuadro = useRef<HTMLDivElement | null>(null);
  const muestra = useRef<HTMLDivElement | null>(null);
  const [escala, setEscala] = useState(1);
  useLayoutEffect(() => {
    const medir = () => {
      const c = cuadro.current, m = muestra.current;
      if (!c || !m) return;
      setEscala(Math.min(1, (c.clientHeight - 28) / (m.offsetHeight + 20)));
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [i, listo]);

  useEffect(() => {
    let vivo = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!vivo) return;
      if (!session) navigate({ to: "/login" });
      else setListo(true);
    });
    return () => {
      vivo = false;
    };
  }, [navigate]);

  const ultimo = i === PASOS.length - 1;
  const siguiente = () => (ultimo ? navigate({ to: "/mapa" }) : setI(i + 1));
  const p = PASOS[i];

  if (!listo) return <main style={shell} />;

  return (
    <main
      style={shell}
      // Deslizar de lado también cambia de pantalla.
      onTouchStart={(e) => (toque.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toque.current == null) return;
        const dx = e.changedTouches[0].clientX - toque.current;
        toque.current = null;
        if (dx < -50 && !ultimo) setI(i + 1);
        if (dx > 50 && i > 0) setI(i - 1);
      }}
    >
      <div style={{ width: "100%", maxWidth: 560, margin: "0 auto", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ height: 44, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          {!ultimo && (
            <button
              type="button"
              onClick={() => setI(PASOS.length - 1)}
              style={{ height: 44, padding: "0 4px", border: "none", background: "transparent", color: "var(--c-text-2)", fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Saltar
            </button>
          )}
        </div>

        <div
          ref={cuadro}
          aria-hidden
          style={{
            height: "min(360px, 36dvh)",
            marginTop: 8,
            borderRadius: 28,
            background: "radial-gradient(120% 90% at 50% 0%, rgb(var(--c-client-rgb) / 0.07) 0%, rgb(var(--c-client-rgb) / 0) 60%), var(--c-surface)",
            border: "1px solid var(--c-elevated)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <div key={i} ref={muestra} style={{ animation: "asiEntra 350ms ease both", scale: `${escala}` }}>
            {i === 0 && <MuestraSistema />}
            {i === 1 && <MuestraAprende />}
            {i === 2 && <MuestraPractica />}
            {i === 3 && <MuestraMejora />}
            {i === 4 && <MuestraCamino />}
          </div>
        </div>

        <div key={`t${i}`} aria-live="polite" style={{ animation: "asiEntra 350ms ease both" }}>
          <div style={{ ...estiloEtiqueta, marginTop: "min(32px, 3dvh)" }}>{p.paso}</div>
          <h1 style={{ ...estiloTitulo, fontSize: "clamp(24px, 3.4dvh, 28px)", marginTop: 8 }}>{p.titulo}</h1>
          <p style={{ ...estiloTexto, fontSize: "clamp(15px, 2.4dvh, 17px)", marginTop: 12 }}>{p.texto}</p>
        </div>

        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <div aria-label={`Pantalla ${i + 1} de ${PASOS.length}`} style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
            {PASOS.map((_, k) => (
              <span key={k} style={{ height: 6, borderRadius: 3, transition: "width 300ms ease, background 300ms ease", width: k === i ? 22 : 6, background: k === i ? "var(--c-primary)" : "var(--c-border-strong)" }} />
            ))}
          </div>
          <button type="button" onClick={siguiente} style={estiloBoton("principal")}>
            {ultimo ? "Ir a mi mapa" : "Siguiente"}
          </button>
        </div>
      </div>
      <style>{`@keyframes asiEntra{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes asiOndaA{0%,100%{transform:scale(1)}20%{transform:scale(1.05)}45%{transform:scale(1.015)}70%{transform:scale(1.07)}85%{transform:scale(1.03)}}
@keyframes asiOndaB{0%,100%{transform:scale(1.02)}30%{transform:scale(1.09)}55%{transform:scale(1.03)}80%{transform:scale(1.11)}}
@media (prefers-reduced-motion: reduce){.asi-onda{animation:none!important}}`}</style>
    </main>
  );
}

/* ---------- Las muestras: lo que se ve de verdad en cada parte ---------- */

function Tarjeta({ children, borde }: { children: ReactNode; borde?: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "12px 14px",
        borderRadius: 14,
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        ...(borde ? { borderLeft: "3px solid var(--c-primary)" } : {}),
      }}
    >
      {children}
    </div>
  );
}

/** Los 6 pasos de la venta del Cerebro (los mismos que enseña el primer nodo). */
function MuestraSistema() {
  const pasos = ["Introducción", "Historia breve", "Descubrimiento", "Presentación", "Cierre", "Consolidación"];
  return (
    <div style={{ width: 270, display: "flex", flexDirection: "column", gap: 8, fontFamily: "'DM Sans', sans-serif" }}>
      {pasos.map((p, k) => (
        <div key={p} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 12, background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
          <span style={{ width: 26, height: 26, flex: "none", borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, ...(k === 0 ? { background: "var(--c-primary)", color: "var(--c-bg)" } : { background: "var(--c-elevated)", color: "var(--c-text-soft)" }) }}>{k + 1}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--c-text)" }}>{p}</span>
        </div>
      ))}
    </div>
  );
}

function MuestraAprende() {
  return (
    <div style={{ width: 260, padding: 20, boxSizing: "border-box", borderRadius: 20, background: "var(--c-surface)", border: "1px solid var(--c-border)", boxShadow: "0 30px 60px -20px rgb(0 0 0 / 0.6)", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 }}>
        <span style={{ height: 3, borderRadius: 2, background: "var(--c-primary)" }} />
        <span style={{ height: 3, borderRadius: 2, background: "var(--c-primary)" }} />
        <span style={{ height: 3, borderRadius: 2, background: "var(--c-border)" }} />
      </div>
      <div style={{ marginTop: 18, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--c-success)" }}>Ejemplo bueno</div>
      <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.45, color: "var(--c-text)" }}>
        «¡Buenos días! Oiga, se ve que aquí no para el movimiento desde temprano. ¿Siempre está así de movido?»
      </div>
      <div style={{ marginTop: 16, height: 40, borderRadius: 12, background: "var(--c-elevated)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "var(--c-text-soft)" }}>
        Descubre por qué
      </div>
    </div>
  );
}

function MuestraPractica() {
  return (
    <div style={{ width: 270, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ position: "relative", width: 132, height: 132, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="asi-onda" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgb(var(--c-client-rgb) / 0.55)", animation: "asiOndaA 1.4s ease-in-out infinite" }} />
        <span className="asi-onda" style={{ position: "absolute", inset: -12, borderRadius: "50%", border: "1px solid rgb(var(--c-client-rgb) / 0.22)", animation: "asiOndaB 1.7s ease-in-out infinite" }} />
        <span style={{ width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, var(--c-avatar-claro) 0%, var(--c-avatar-centro) 55%, var(--c-avatar-hondo) 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 30, color: "var(--c-text)" }}>
          DM
        </span>
      </div>
      <Tarjeta>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--c-client)" }}>Don Martín</div>
        <div style={{ marginTop: 4, fontSize: 14, lineHeight: 1.4, color: "var(--c-text-soft)" }}>Mire, ahorita ando ocupado. ¿Qué me trae?</div>
      </Tarjeta>
      <span style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(180deg, var(--c-play-claro) 0%, var(--c-play-centro) 50%, var(--c-play-hondo) 100%)", boxShadow: "inset 0 -3px 0 rgb(var(--c-play-sombra-rgb) / 0.35), inset 0 2px 0 rgb(255 255 255 / 0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF" }}>
        <Icono nombre="microfono" tam={28} />
      </span>
    </div>
  );
}

function MuestraMejora() {
  const r = 70;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ width: 270, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ position: "relative", width: 132, height: 132 }}>
        <svg width={132} height={132} viewBox="0 0 156 156" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }} aria-hidden>
          <circle cx={78} cy={78} r={r} fill="none" stroke="var(--c-elevated)" strokeWidth={8} />
          <circle cx={78} cy={78} r={r} fill="none" stroke="var(--c-primary)" strokeWidth={8} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * 0.16} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 30, color: "var(--c-text)" }}>84</div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <Estrella ganada tam={22} />
        <Estrella ganada tam={22} />
        <Estrella ganada={false} tam={22} />
      </div>
      <Tarjeta borde>
        <div style={{ fontSize: 14, lineHeight: 1.4, color: "var(--c-text)" }}>Antes de presentar, pregúntale qué es lo que más se le mueve.</div>
      </Tarjeta>
    </div>
  );
}

function MuestraCamino() {
  const nodos = [
    { n: "Nodo 1", tipo: "Teoría", voz: false },
    { n: "Nodo 2", tipo: "Teoría", voz: false },
    { n: "Nodo 3", tipo: "Tu primera práctica con voz", voz: true },
  ];
  return (
    <div style={{ width: 270, display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" }}>
      {nodos.map((x, k) => (
        <div key={x.n} style={{ display: "flex", gap: 14 }}>
          <div style={{ width: 52, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...(x.voz
                  ? { background: "linear-gradient(180deg, var(--c-play-claro) 0%, var(--c-play-centro) 50%, var(--c-play-hondo) 100%)", boxShadow: "inset 0 -3px 0 rgb(var(--c-play-sombra-rgb) / 0.35), inset 0 2px 0 rgb(255 255 255 / 0.25)", color: "#FFFFFF" }
                  : { background: "var(--c-elevated)", border: "2px solid var(--c-border-strong)", color: "var(--c-text-soft)" }),
              }}
            >
              <Icono nombre={x.voz ? "microfono" : "libro"} tam={22} />
            </span>
            {k < nodos.length - 1 && <span style={{ width: 3, height: 22, borderRadius: 2, background: "var(--c-border-strong)" }} />}
          </div>
          <div style={{ paddingTop: 7, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--c-text-2)" }}>{x.n}</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: x.voz ? "var(--c-primary)" : "var(--c-text)" }}>{x.tipo}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  background: "var(--c-bg)",
  color: "var(--c-text)",
  display: "flex",
  flexDirection: "column",
  padding: "max(20px, env(safe-area-inset-top)) var(--m-pantalla) calc(24px + env(safe-area-inset-bottom))",
};
