import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { setSelectedRole, type CloserRole } from "@/lib/closer-auth";

export const Route = createFileRoute("/role")({
  head: () => ({
    meta: [
      { title: "¿Cómo quieres entrar? — Closer" },
      { name: "description", content: "Elige cómo entrar a Closer: individual, manager o vendedor invitado." },
    ],
  }),
  component: RoleScreen,
});

const BG_GRADIENT =
  "radial-gradient(ellipse at 30% 70%, var(--c-bg-glow) 0%, transparent 55%), var(--c-bg)";

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
      <header style={{ padding: "1.2rem 1.2rem 0", textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: "1.1rem",
            color: "var(--c-primary)",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          CLOSER
        </h1>
      </header>

      <section
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "560px",
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1.2rem",
        }}
      >
        <h2
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: "1.5rem",
            color: "var(--c-text)",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          ¿Cómo quieres entrar?
        </h2>
        <p style={{ fontSize: "0.84rem", color: "var(--c-text-2)", marginTop: "16px", marginBottom: 0 }}>
          Puedes cambiar de modo después.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "28px" }}>
          <RoleCard
            icon="🚀"
            title="Entrenar yo solo"
            description="Sin equipo. Empiezo a practicar ya mismo."
            selected={role === "individual"}
            onClick={() => setRole("individual")}
          />
          <RoleCard
            icon="💼"
            title="Tengo un equipo"
            description="Voy a invitar vendedores a mi empresa."
            selected={role === "manager"}
            onClick={() => setRole("manager")}
          />
          <RoleCard
            icon="🎯"
            title="Me invitaron con un código"
            description="Mi manager me compartió un código."
            selected={role === "vendedor"}
            onClick={() => setRole("vendedor")}
          />
        </div>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!role}
          style={{
            marginTop: "28px",
            width: "100%",
            height: "52px",
            borderRadius: "99px",
            border: "none",
            background: "var(--c-primary)",
            color: "var(--c-bg)",
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: "0.95rem",
            letterSpacing: "0.01em",
            cursor: role ? "pointer" : "not-allowed",
            opacity: role ? 1 : 0.5,
            transition: "opacity 200ms ease, transform 150ms ease",
            boxShadow: role ? "0 8px 24px rgb(var(--c-primary-rgb) / 0.3)" : "none",
          }}
        >
          Continuar →
        </button>

        <Link
          to="/login"
          style={{
            display: "block",
            textAlign: "center",
            marginTop: "20px",
            fontSize: "0.8rem",
            color: "var(--c-primary)",
            textDecoration: "none",
          }}
        >
          ¿Ya tienes cuenta? Iniciar sesión
        </Link>
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
  icon: string;
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
        position: "relative",
        background: selected ? "rgb(var(--c-primary-rgb) / 0.06)" : "var(--c-surface)",
        border: selected ? "2px solid var(--c-primary)" : "1px solid var(--c-border)",
        borderRadius: "14px",
        padding: selected ? "calc(1.1rem - 1px)" : "1.1rem",
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        textAlign: "left",
        cursor: "pointer",
        color: "inherit",
        fontFamily: "inherit",
        transition: "background 180ms ease, border-color 180ms ease",
      }}
    >
      <span style={{ fontSize: "1.8rem", lineHeight: 1, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span
          style={{
            display: "block",
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            color: "var(--c-text)",
          }}
        >
          {title}
        </span>
        <span
          style={{
            display: "block",
            fontSize: "0.78rem",
            color: "var(--c-text-2)",
            marginTop: "4px",
          }}
        >
          {description}
        </span>
      </span>
      {selected && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "var(--c-primary)",
            color: "var(--c-bg)",
            fontSize: "0.75rem",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✓
        </span>
      )}
    </button>
  );
}
