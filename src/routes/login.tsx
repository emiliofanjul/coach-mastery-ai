import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AuthCoachBubble } from "@/components/closer/AuthCoachBubble";
import { getSelectedRole } from "@/lib/closer-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Closer" },
      { name: "description", content: "Vuelve a tu entrenamiento de ventas." },
    ],
  }),
  component: LoginScreen,
});

const BG =
  "radial-gradient(ellipse at 30% 70%, #1e0a30 0%, transparent 55%), #08080F";

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

function LoginScreen() {
  const navigate = useNavigate();
  const role = getSelectedRole();
  const subtitle =
    role === "manager" ? "Gestiona tu equipo" : "Continúa tu entrenamiento";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Correo o contraseña incorrectos. Inténtalo de nuevo.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (authError) {
      setError("Correo o contraseña incorrectos. Inténtalo de nuevo.");
      return;
    }
    navigate({ to: "/" });
  };

  const handleGoogle = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError("No pudimos iniciar sesión con Google. Inténtalo de nuevo.");
  };

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
      <Topbar />

      <section style={containerStyle}>
        <h2 style={titleStyle}>Bienvenido de vuelta</h2>
        <p style={subtitleStyle}>{subtitle}</p>

        <form onSubmit={handleSubmit} style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <Field
            label="Correo electrónico"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            invalid={!!error}
          />
          <Field
            label="Contraseña"
            value={password}
            onChange={setPassword}
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            invalid={!!error}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                style={{ background: "none", border: "none", color: "#5A5A8A", cursor: "pointer", padding: 0, fontSize: "1rem" }}
              >
                {showPw ? "🙈" : "👁"}
              </button>
            }
          />

          {error && (
            <p style={{ margin: 0, fontSize: "0.76rem", color: "#EF476F" }}>{error}</p>
          )}

          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ alignSelf: "flex-end", fontSize: "0.76rem", color: "#FF6B2B", textDecoration: "none" }}
          >
            ¿Olvidaste tu contraseña?
          </a>

          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <Divider />

        <button type="button" onClick={handleGoogle} style={googleBtn}>
          <GoogleIcon /> Continuar con Google
        </button>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.8rem", color: "#5A5A8A" }}>
          ¿No tienes cuenta?{" "}
          <Link to="/signup" style={{ color: "#FF6B2B", textDecoration: "none" }}>
            Regístrate
          </Link>
        </p>
      </section>

      <AuthCoachBubble />
    </main>
  );
}

/* ============== Shared subcomponents ============== */

export function Topbar() {
  return (
    <header
      style={{
        padding: "1.2rem",
        display: "grid",
        gridTemplateColumns: "32px 1fr 32px",
        alignItems: "center",
      }}
    >
      <Link
        to="/role"
        aria-label="Atrás"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#F0F0F5",
          textDecoration: "none",
          fontSize: "1.1rem",
        }}
      >
        ←
      </Link>
      <h1
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: "1.1rem",
          color: "#FF6B2B",
          margin: 0,
          textAlign: "center",
          letterSpacing: "-0.01em",
        }}
      >
        CLOSER
      </h1>
      <span />
    </header>
  );
}

export const containerStyle: React.CSSProperties = {
  flex: 1,
  maxWidth: "560px",
  width: "100%",
  margin: "0 auto",
  padding: "1.5rem 1.2rem 4rem",
};

export const titleStyle: React.CSSProperties = {
  fontFamily: "Syne, sans-serif",
  fontWeight: 800,
  fontSize: "1.4rem",
  color: "#F0F0F5",
  margin: 0,
  letterSpacing: "-0.02em",
};

export const subtitleStyle: React.CSSProperties = {
  fontSize: "0.84rem",
  color: "#5A5A8A",
  marginTop: "8px",
  marginBottom: 0,
};

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  invalid,
  rightIcon,
  helper,
  helperColor,
  maxLength,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  invalid?: boolean;
  rightIcon?: React.ReactNode;
  helper?: React.ReactNode;
  helperColor?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontSize: "0.76rem", color: "#5A5A8A", marginBottom: "6px" }}>
        {label}
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          background: "#111118",
          border: invalid ? "2px solid #EF476F" : "2px solid #252535",
          borderRadius: "14px",
          padding: "0.88rem 1.05rem",
          transition: "border-color 150ms ease",
        }}
        onFocus={(e) => {
          if (!invalid) (e.currentTarget as HTMLElement).style.borderColor = "#FF6B2B";
        }}
        onBlur={(e) => {
          if (!invalid) (e.currentTarget as HTMLElement).style.borderColor = "#252535";
        }}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          inputMode={inputMode}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#F0F0F5",
            fontSize: "0.92rem",
            fontFamily: "inherit",
          }}
        />
        {rightIcon}
      </span>
      {helper && (
        <span
          style={{
            display: "block",
            fontSize: "0.68rem",
            color: helperColor ?? "#5A5A8A",
            marginTop: "6px",
          }}
        >
          {helper}
        </span>
      )}
    </label>
  );
}

export function primaryBtn(loading: boolean, disabled = false): React.CSSProperties {
  const off = disabled || loading;
  return {
    width: "100%",
    height: "52px",
    borderRadius: "99px",
    border: "none",
    background: "#FF6B2B",
    color: "#08080F",
    fontFamily: "Syne, sans-serif",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: off ? "not-allowed" : "pointer",
    opacity: off ? 0.5 : 1,
    transition: "opacity 200ms ease",
    marginTop: "8px",
  };
}

export const googleBtn: React.CSSProperties = {
  width: "100%",
  height: "52px",
  borderRadius: "99px",
  background: "#111118",
  color: "#F0F0F5",
  border: "1px solid #252535",
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 500,
  fontSize: "0.9rem",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
};

export function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        margin: "24px 0 16px",
        fontSize: "0.76rem",
        color: "#5A5A8A",
      }}
    >
      <span style={{ flex: 1, height: "1px", background: "#252535" }} />
      o continúa con
      <span style={{ flex: 1, height: "1px", background: "#252535" }} />
    </div>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96L3.97 7.3C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
