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
    ],
  }),
  component: AsiFunciona,
});

const PASOS: Array<{ paso: string; titulo: string; texto: string }> = [
  {
    paso: "1 · Aprende",
    titulo: "Una técnica en un par de minutos",
    texto: "Tarjetas cortas, con ejemplos de cómo se dice bien y cómo se dice mal. Y un quiz de tres preguntas para asegurarte.",
  },
  {
    paso: "2 · Practica",
    titulo: "Dila en voz alta, con un cliente",
    texto: "Tú hablas y el cliente te contesta, como en una visita real. Si se te va, empiezas otra vez: aquí nadie te compra ni te deja de comprar.",
  },
  {
    paso: "3 · Mejora",
    titulo: "Closer te dice qué cambiar",
    texto: "Una calificación honesta, lo que te bajó la nota y una misión para tu próxima visita de verdad.",
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
            height: "min(360px, 40dvh)",
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
            {i === 0 && <MuestraAprende />}
            {i === 1 && <MuestraPractica />}
            {i === 2 && <MuestraMejora />}
          </div>
        </div>

        <div key={`t${i}`} aria-live="polite" style={{ animation: "asiEntra 350ms ease both" }}>
          <div style={{ ...estiloEtiqueta, marginTop: "min(32px, 3dvh)" }}>{p.paso}</div>
          <h1 style={{ ...estiloTitulo, fontSize: 28, marginTop: 8 }}>{p.titulo}</h1>
          <p style={{ ...estiloTexto, marginTop: 12 }}>{p.texto}</p>
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

const shell: React.CSSProperties = {
  minHeight: "100dvh",
  boxSizing: "border-box",
  background: "var(--c-bg)",
  color: "var(--c-text)",
  display: "flex",
  flexDirection: "column",
  padding: "max(20px, env(safe-area-inset-top)) var(--m-pantalla) calc(24px + env(safe-area-inset-bottom))",
};
