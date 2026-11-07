import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Check, KeyRound, Star, Users } from "lucide-react";
import { CuadroIcono, estiloBoton } from "@/components/closer/piezas";
import { setSelectedRole, type CloserRole } from "@/lib/closer-auth";

export const Route = createFileRoute("/role")({
  head: () => ({
    meta: [
      { title: "¿Cómo quieres entrar? — Closer" },
      { name: "description", content: "Elige cómo entrar a Closer: individual, manager o vendedor invitado." },
      {"property": "og:title", "content": "¿Cómo quieres entrar? — Closer"},
      {"property": "og:description", "content": "Elige cómo entrar a Closer: individual, manager o vendedor invitado."},
      {"property": "og:type", "content": "website"},
      {"name": "twitter:card", "content": "summary"},
    ],
  }),
  component: RoleScreen,
});

const BG_GRADIENT =
  "radial-gradient(120% 60% at 50% 0%, var(--c-bg-glow) 0%, var(--c-bg) 60%)";

function RoleScreen() {
  const navigate = useNavigate();
  const [role, setRole] = useState<CloserRole | null>(null);

  const handleContinue = () => {
    if (!role) return;
    setSelectedRole(role);
    navigate({ to: "/signup" });
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: BG_GRADIENT,
        color: "var(--c-text)",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: "560px",
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "24px var(--m-pantalla) calc(32px + env(safe-area-inset-bottom))",
        }}
      >
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: 17,
            color: "var(--c-primary)",
            margin: 0,
            letterSpacing: "0.06em",
            textAlign: "center",
          }}
        >
          CLOSER
        </h1>

        <h2
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 30,
            lineHeight: 1.15,
            color: "var(--c-text)",
            margin: "56px 0 0",
            letterSpacing: "-0.02em",
          }}
        >
          ¿Cómo quieres entrar?
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.5, color: "var(--c-text-2)", margin: "10px 0 0" }}>
          Puedes cambiar de modo después.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
          <RoleCard
            icon={<Star size={22} strokeWidth={1.8} />}
            title="Entrenar por mi cuenta"
            description="Sin equipo. Empiezo a practicar hoy."
            selected={role === "individual"}
            onClick={() => setRole("individual")}
          />
          <RoleCard
            icon={<Users size={22} strokeWidth={1.8} />}
            title="Tengo un equipo"
            description="Voy a invitar a mis vendedores."
            selected={role === "manager"}
            onClick={() => setRole("manager")}
          />
          <RoleCard
            icon={<KeyRound size={22} strokeWidth={1.8} />}
            title="Me invitaron con un código"
            description="Mi manager me compartió un código."
            selected={role === "vendedor"}
            onClick={() => setRole("vendedor")}
          />
        </div>

        <div style={{ flex: 1, minHeight: 32 }} />

        <button type="button" onClick={handleContinue} disabled={!role} style={estiloBoton("principal", !role)}>
          Continuar
        </button>

        <p style={{ textAlign: "center", margin: "18px 0 0", fontSize: 14, color: "var(--c-text-2)" }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" style={{ color: "var(--c-primary)", textDecoration: "none", fontWeight: 600 }}>
            Iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  );
}

function RoleCard({
  icon,
  title,
  description,
  selected,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        padding: 16,
        borderRadius: 18,
        background: selected ? "rgb(var(--c-primary-rgb) / 0.06)" : "var(--c-surface)",
        border: selected ? "1.5px solid var(--c-primary)" : "1.5px solid var(--c-border)",
        textAlign: "left",
        cursor: "pointer",
        color: "inherit",
        fontFamily: "inherit",
        transition: "background 200ms ease, border-color 200ms ease",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <CuadroIcono activo={selected}>{icon}</CuadroIcono>
      <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: "var(--c-text)" }}>{title}</span>
        <span style={{ fontSize: 14, lineHeight: 1.4, color: "var(--c-text-2)" }}>{description}</span>
      </span>
      <span
        aria-hidden
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          borderRadius: 11,
          background: "var(--c-primary)",
          color: "var(--c-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: selected ? 1 : 0,
          transition: "opacity 200ms ease",
        }}
      >
        <Check size={14} strokeWidth={3} />
      </span>
    </button>
  );
}
