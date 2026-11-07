import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { getSelectedRole } from "@/lib/closer-auth";
import { tomarAvisoDeSesionTerminada } from "@/lib/sesion-viva";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";
import { estiloBoton } from "@/components/closer/piezas";

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
  "radial-gradient(120% 60% at 50% 0%, var(--c-bg-glow) 0%, var(--c-bg) 60%)";

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
  // Si lo sacamos porque su sesión terminó, se le dice por qué está aquí.
  const [aviso, setAviso] = useState<string | null>(null);
  useEffect(() => { setAviso(tomarAvisoDeSesionTerminada()); }, []);

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
    navigate({ to: "/mapa" });
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
        color: "var(--c-text)",
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
                style={{ background: "none", border: "none", color: "var(--c-text-2)", cursor: "pointer", width: 44, height: 44, margin: "-10px -12px -10px 0", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
              >
                {showPw ? <EyeOff size={20} strokeWidth={1.8} aria-hidden /> : <Eye size={20} strokeWidth={1.8} aria-hidden />}
              </button>
            }
          />

          {aviso && !error && (
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "var(--c-text-soft)" }}>{aviso}</p>
          )}
          {error && (
            <p role="alert" style={{ margin: 0, fontSize: 14, lineHeight: 1.45, color: "var(--c-danger)" }}>{error}</p>
          )}

          <Link
            to="/forgot-password"
            style={{ alignSelf: "flex-end", fontSize: 14, fontWeight: 600, color: "var(--c-text-soft)", textDecoration: "none", padding: "10px 0" }}
          >
            ¿Olvidaste tu contraseña?
          </Link>

          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <Divider />

        <button type="button" onClick={handleGoogle} style={googleBtn}>
          <GoogleIcon /> Continuar con Google
        </button>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: 14, color: "var(--c-text-2)" }}>
          ¿No tienes cuenta?{" "}
          <Link to="/signup" style={{ color: "var(--c-primary)", textDecoration: "none", fontWeight: 600 }}>
            Regístrate
          </Link>
        </p>
      </section>

    </main>
  );
}

/* ============== Shared subcomponents ============== */

export function Topbar() {
  return (
    <header
      style={{
        padding: "12px var(--m-pantalla) 0",
        display: "grid",
        gridTemplateColumns: "44px 1fr 44px",
        alignItems: "center",
        maxWidth: 560,
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <Link
        to="/role"
        aria-label="Atrás"
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--c-text-soft)",
          textDecoration: "none",
        }}
      >
        <ChevronLeft size={24} strokeWidth={2} aria-hidden />
      </Link>
      <h1
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: 17,
          color: "var(--c-primary)",
          margin: 0,
          textAlign: "center",
          letterSpacing: "0.06em",
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
  padding: "40px var(--m-pantalla) 48px",
  boxSizing: "border-box",
};

export const titleStyle: React.CSSProperties = {
  fontFamily: "Syne, sans-serif",
  fontWeight: 700,
  fontSize: 30,
  lineHeight: 1.15,
  color: "var(--c-text)",
  margin: 0,
  letterSpacing: "-0.02em",
};

export const subtitleStyle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.5,
  color: "var(--c-text-2)",
  marginTop: "10px",
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
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--c-text-soft)", marginBottom: "8px" }}>
        {label}
      </span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          background: "var(--c-surface)",
          border: invalid ? "1.5px solid var(--c-danger)" : "1.5px solid var(--c-border)",
          borderRadius: "var(--r-campo)",
          minHeight: "var(--h-campo)",
          boxSizing: "border-box",
          padding: "0 16px",
          transition: "border-color 150ms ease, box-shadow 150ms ease",
        }}
        onFocus={(e) => {
          if (invalid) return;
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--c-primary)";
          el.style.boxShadow = "0 0 0 4px rgb(var(--c-primary-rgb) / 0.14)";
        }}
        onBlur={(e) => {
          if (invalid) return;
          const el = e.currentTarget as HTMLElement;
          el.style.borderColor = "var(--c-border)";
          el.style.boxShadow = "none";
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
            color: "var(--c-text)",
            // 16 px: con menos, el iPhone hace zoom al tocar el campo.
            fontSize: 16,
            fontFamily: "inherit",
            minWidth: 0,
            height: "calc(var(--h-campo) - 3px)",
          }}
        />
        {rightIcon}
      </span>
      {helper && (
        <span
          style={{
            display: "block",
            fontSize: 13,
            lineHeight: 1.45,
            color: helperColor ?? "var(--c-text-2)",
            marginTop: "8px",
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
  return { ...estiloBoton("principal", off), marginTop: "8px" };
}

export const googleBtn: React.CSSProperties = estiloBoton("secundario");

export function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        margin: "24px 0 16px",
        fontSize: 13,
        color: "var(--c-text-2)",
      }}
    >
      <span style={{ flex: 1, height: "1px", background: "var(--c-border)" }} />
      o continúa con
      <span style={{ flex: 1, height: "1px", background: "var(--c-border)" }} />
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
