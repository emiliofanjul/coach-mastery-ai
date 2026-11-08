import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { estiloBoton, Estrella } from "@/components/closer/piezas";
import { Icono, PasoBienvenida, estiloTitulo, estiloTexto, estiloEtiqueta } from "@/components/closer/bienvenida-ui";

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
  // Mensaje 159: ?bienvenida=1 cuando viene de la bienvenida (es su paso 4 de 4); desde el menú, sin paso.
  validateSearch: (s: Record<string, unknown>): { bienvenida?: number } => (s.bienvenida ? { bienvenida: 1 } : {}),
  component: AsiFunciona,
});

// Mensaje 155 (Emilio, 7-nov): la historia explica cómo funciona y POR QUÉ funciona, y el impulso sube:
// por qué funciona (el sistema) → aprende → practica → la calificación (por qué es distinta a un chat de IA)
// → qué esperar (los 2 primeros nodos son teoría: quien llega por la voz no se lleva una sorpresa).
// Mensaje 159 (Emilio): pocas palabras, fáciles para cualquiera, y cada línea suma valor. Se asume que viene a
// entrenar («vas a…»). Primero lo que hace especial a Closer; al final, cuándo llega su primera práctica.
const PASOS: Array<{ paso: string; titulo: string; texto: string }> = [
  {
    paso: "Lo que hace especial a Closer",
    titulo: "Un sistema que ya ha generado millones",
    texto: "Lo crearon expertos que venden y entrenan equipos de venta en la calle. Ahora lo vas a dominar tú, paso a paso.",
  },
  {
    paso: "1 · Aprendes",
    titulo: "Una técnica a la vez",
    texto: "Tarjetas cortas, con ejemplos de cómo decirlo bien y cómo no. Al final, 3 preguntas para asegurarte.",
  },
  {
    paso: "2 · Practicas",
    titulo: "Hablas con un cliente que te contesta",
    texto: "Como en una visita real. Cuando llegues con tu cliente de verdad, ya lo practicaste.",
  },
  {
    paso: "3 · Mejoras",
    titulo: "Te califica como un experto",
    texto: "Con las reglas del sistema, no con opiniones como un chat de IA. Y solo te califica lo que ya te enseñó.",
  },
  // Por qué el mapa va en orden, para todos (Emilio, 159), con la doctrina (Cerebro 1.2 y tarjetas del 1.0):
  // toda venta sigue los 6 pasos en línea recta, cada paso prepara el siguiente, y cada paso es un mundo del mapa.
  // Los 2 primeros nodos son teoría (1.0 y 1.1, unos 7 min) y el tercero (1.2) es la primera práctica con voz.
  {
    paso: "Tu mapa",
    titulo: "Un mundo por cada paso de la venta",
    texto: "Toda venta sigue estos 6 pasos en línea recta, y cada uno prepara el siguiente: sin descubrimiento, no sabes qué ofrecer. Por eso tu mapa va en orden. En el tercer nodo ya practicas con tu primer cliente.",
  },
];

function AsiFunciona() {
  const navigate = useNavigate();
  const { bienvenida } = Route.useSearch();
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
        <div style={{ height: 44, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {bienvenida ? <PasoBienvenida paso={4} /> : <span />}
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
            // 155-B: más bajito en teléfonos chicos (375×568: 200 px; 667: 220 px; 844: 326 px). La muestra se achica sola.
            height: "min(360px, max(200px, 60dvh - 180px))",
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
            {i === 4 && <MuestraMapa />}
          </div>
        </div>

        <div key={`t${i}`} aria-live="polite" style={{ animation: "asiEntra 350ms ease both" }}>
          <div style={{ ...estiloEtiqueta, marginTop: "min(32px, 3dvh)" }}>{p.paso}</div>
          <h1 style={{ ...estiloTitulo, fontSize: "clamp(24px, 3.4dvh, 28px)", marginTop: 8 }}>{p.titulo}</h1>
          <p style={{ ...estiloTexto, fontSize: "clamp(15px, 2.4dvh, 17px)", marginTop: 12 }}>{p.texto}</p>
        </div>

        {/* 155-B: pegado abajo, como en la bienvenida: en pantallas bajitas el botón nunca se esconde. */}
        <div style={{ position: "sticky", bottom: 0, zIndex: 2, marginTop: "auto", paddingTop: 24, paddingBottom: "calc(24px + env(safe-area-inset-bottom))", background: "linear-gradient(to top, var(--c-bg) 72%, rgb(var(--c-bg-rgb) / 0))" }}>
          <div aria-label={`Pantalla ${i + 1} de ${PASOS.length}`} style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
            {PASOS.map((_, k) => (
              <span key={k} style={{ height: 6, borderRadius: 3, transition: "width 300ms ease, background 300ms ease", width: k === i ? 22 : 6, background: k === i ? "var(--c-primary)" : "var(--c-border-strong)" }} />
            ))}
          </div>
          <button type="button" onClick={siguiente} style={estiloBoton("principal")}>
            {ultimo ? (bienvenida ? "Empezar a entrenar" : "Ir a mi mapa") : "Siguiente"}
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
/** Lo que respalda al sistema (lo que Emilio confirmó como cierto). */
function MuestraSistema() {
  const sellos: Array<{ icono: "meta" | "equipo" | "mejora"; texto: string }> = [
    { icono: "meta", texto: "Ha generado millones en ventas" },
    { icono: "equipo", texto: "Creado por expertos de campo" },
    { icono: "mejora", texto: "Probado en la calle" },
  ];
  return (
    <div style={{ width: 270, display: "flex", flexDirection: "column", gap: 10, fontFamily: "'DM Sans', sans-serif" }}>
      {sellos.map((x) => (
        <div key={x.texto} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 16, background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
          <span style={{ width: 40, height: 40, flex: "none", borderRadius: "var(--r-icono)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgb(var(--c-primary-rgb) / 0.12)", color: "var(--c-primary)" }}>
            <Icono nombre={x.icono} />
          </span>
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--c-text)" }}>{x.texto}</span>
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
        <div style={{ fontSize: 14, lineHeight: 1.4, color: "var(--c-text)" }}>Antes de presentar, pregúntale qué productos tienen más rotación en su negocio.</div>
      </Tarjeta>
    </div>
  );
}

/** El mapa: un mundo por cada uno de los 6 pasos (tarjeta 2 del nodo 1.0), en línea recta, y el examen final. */
function MuestraMapa() {
  const mundos = ["Introducción", "Historia breve", "Descubrimiento", "Presentación", "Cierre", "Consolidación", "Examen final"];
  return (
    <div style={{ width: 270, display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" }}>
      {mundos.map((m, k) => {
        const primero = k === 0;
        const examen = k === mundos.length - 1;
        return (
          <div key={m} style={{ display: "flex", gap: 12 }}>
            <div style={{ width: 30, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ width: 30, height: 30, borderRadius: 15, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 13, ...(primero ? { background: "var(--c-primary)", color: "var(--c-bg)" } : { background: "var(--c-elevated)", border: "2px solid var(--c-border-strong)", color: "var(--c-text-soft)" }) }}>
                {examen ? <Icono nombre="meta" tam={15} /> : k + 1}
              </span>
              {!examen && <span style={{ width: 3, height: 8, borderRadius: 2, background: "var(--c-border-strong)" }} />}
            </div>
            <div style={{ height: 30, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: examen ? "var(--c-text-soft)" : "var(--c-text)" }}>{m}</span>
              {primero && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-primary)" }}>Empiezas aquí</span>}
            </div>
          </div>
        );
      })}
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
  padding: "max(20px, env(safe-area-inset-top)) var(--m-pantalla) 0",
};
