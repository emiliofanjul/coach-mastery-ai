import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { resultadoDeValidacion, LARGO_MAXIMO_CODIGO } from "@/lib/invitacion";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import {
  getSelectedRole,
  passwordStrength,
  setPendingCompanyName,
  setPendingInviteCode,
  getPendingInviteCode,
} from "@/lib/closer-auth";
import {
  Topbar,
  Field,
  containerStyle,
  titleStyle,
  primaryBtn,
  googleBtn,
  Divider,
  GoogleIcon,
} from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Crea tu cuenta — Closer" },
      { name: "description", content: "Empieza a entrenar con Closer." },
      {"property": "og:title", "content": "Crea tu cuenta — Closer"},
      {"property": "og:description", "content": "Empieza a entrenar con Closer."},
      {"property": "og:type", "content": "website"},
      {"name": "twitter:card", "content": "summary"},
    ],
  }),
  component: SignupScreen,
});

const BG =
  "radial-gradient(120% 60% at 50% 0%, var(--c-bg-glow) 0%, var(--c-bg) 60%)";

const baseSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
});

function SignupScreen() {
  const navigate = useNavigate();
  const [role, setRole] = useState<ReturnType<typeof getSelectedRole>>(null);

  useEffect(() => {
    const r = getSelectedRole();
    if (!r) navigate({ to: "/role" });
    else setRole(r);
  }, [navigate]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  // Si llegó por la liga de invitación (/unirme), el código ya viene puesto.
  useEffect(() => {
    const pendiente = getPendingInviteCode();
    if (pendiente) setInviteCode((actual) => actual || pendiente);
  }, []);
  const [inviteState, setInviteState] = useState<{
    status: "idle" | "checking" | "valid" | "invalid" | "locked";
    companyName?: string;
    message?: string;
  }>({ status: "idle" });
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isVendedor = role === "vendedor";
  const isManager = role === "manager";
  const isIndividual = role === "individual";
  const strength = passwordStrength(password);

  useEffect(() => {
    if (!isVendedor) return;
    const code = inviteCode.trim();
    if (code.length < 4) {
      setInviteState({ status: "idle" });
      return;
    }
    setInviteState({ status: "checking" });
    const handle = setTimeout(async () => {
      const { data, error } = await supabase.rpc("validate_invite_code", { _code: code });
      if (error) console.error("[signup] validate_invite_code:", error);
      setInviteState(resultadoDeValidacion(data as never, error));
    }, 400);
    return () => clearTimeout(handle);
  }, [inviteCode, isVendedor]);

  // Mensaje 123: lo que falta, en palabras. Antes el botón solo se apagaba y nadie
  // sabía por qué (un vendedor puso una contraseña corta y no supo qué hacer).
  const faltantes = (() => {
    const f: string[] = [];
    if (fullName.trim().length < 2) f.push("Escribe tu nombre completo.");
    if (!baseSchema.shape.email.safeParse(email).success) f.push("Escribe un correo válido, como tu@correo.com.");
    if (password.length < 8) f.push(password.length === 0 ? "Escribe una contraseña de al menos 8 caracteres." : `Tu contraseña es muy corta: te faltan ${8 - password.length} caracteres (mínimo 8).`);
    if (isManager && companyName.trim().length < 2) f.push("Escribe el nombre de tu empresa.");
    if (isVendedor && inviteState.status !== "valid") f.push(inviteState.status === "checking" ? "Estamos revisando tu código de empresa." : "Escribe el código de empresa que te dio tu manager.");
    if (!accepted) f.push("Acepta los términos y condiciones.");
    return f;
  })();
  const formValid = faltantes.length === 0;
  // Se muestran cuando ya empezó a llenar, o si intentó crear la cuenta.
  const [intento, setIntento] = useState(false);
  const empezo = fullName.length > 0 || email.length > 0 || password.length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIntento(true);
    if (!formValid || !role) return;
    setLoading(true);

    if (isManager) setPendingCompanyName(companyName.trim());
    if (isVendedor) setPendingInviteCode(inviteCode.trim());

    const profileRole = isVendedor ? "vendedor" : "manager";

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), role: profileRole },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError || !data.user) {
      setLoading(false);
      setError(authError?.message ?? "No pudimos crear tu cuenta.");
      return;
    }

    if (isIndividual) {
      const { error: rpcErr } = await supabase.rpc("create_personal_company");
      if (rpcErr) {
        setLoading(false);
        setError("Cuenta creada pero no pudimos preparar tu espacio. Intenta iniciar sesión.");
        return;
      }
    } else if (isManager) {
      const { error: rpcErr } = await supabase.rpc("create_team_company", {
        _name: companyName.trim(),
      });
      if (rpcErr) {
        setLoading(false);
        setError("Cuenta creada pero no pudimos crear tu empresa. Intenta iniciar sesión.");
        return;
      }
    } else if (isVendedor) {
      const { data: applyData, error: applyErr } = await supabase.rpc("apply_invite_code", {
        _code: inviteCode.trim(),
      });
      if (applyErr || !(applyData as { ok: boolean })?.ok) {
        setLoading(false);
        setError("No pudimos vincular tu código. Inténtalo de nuevo.");
        return;
      }
    }

    setLoading(false);
    if (isManager) navigate({ to: "/onboarding/manager" });
    else navigate({ to: "/onboarding/seller" });
  };

  const handleGoogle = async () => {
    setError(null);
    // Mensaje 123: con Google también hay que aceptar los términos (antes se los saltaba).
    if (!accepted) {
      setIntento(true);
      setError("Para continuar con Google, primero acepta los términos y condiciones.");
      return;
    }
    if (isManager) setPendingCompanyName(companyName.trim());
    if (isVendedor && inviteState.status === "valid") setPendingInviteCode(inviteCode.trim());
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError("No pudimos continuar con Google.");
  };

  const roleLabel = isIndividual ? "Por mi cuenta" : isManager ? "Manager" : "Vendedor";
  const titleText = isIndividual
    ? "Empieza a entrenar"
    : isManager
      ? "Crea tu cuenta"
      : "Únete a tu equipo";

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
        <h2 style={titleStyle}>{titleText}</h2>

        {/* Pill rol */}
        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgb(var(--c-primary-rgb) / 0.1)",
              border: "1px solid rgb(var(--c-primary-rgb) / 0.3)",
              borderRadius: "99px",
              padding: "6px 12px",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--c-primary)",
            }}
          >
            {roleLabel}
          </span>
          <Link
            to="/role"
            style={{ fontSize: 13, color: "var(--c-text-2)", textDecoration: "underline" }}
          >
            cambiar
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <Field
            label="Nombre completo"
            value={fullName}
            onChange={setFullName}
            placeholder="Juan García"
            autoComplete="name"
            maxLength={100}
          />
          <Field
            label="Correo electrónico"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            maxLength={255}
          />
          <div>
            <Field
              label="Contraseña"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              maxLength={128}
            />
            <StrengthBar level={strength} />
            {password.length > 0 && password.length < 8 && (
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--c-gold)" }}>
                Te faltan {8 - password.length} caracteres (mínimo 8).
              </p>
            )}
          </div>

          {isManager && (
            <Field
              label="Nombre de tu empresa"
              value={companyName}
              onChange={setCompanyName}
              placeholder="Ej: Dalfan"
              maxLength={120}
            />
          )}

          {isVendedor && (
            <Field
              label="Código de empresa"
              value={inviteCode}
              onChange={(v) => setInviteCode(v.toUpperCase())}
              placeholder="Ej: DALFAN-X7K2MP"
              inputMode="text"
              maxLength={LARGO_MAXIMO_CODIGO}
              invalid={inviteState.status === "invalid" || inviteState.status === "locked"}
              helper={
                inviteState.status === "valid"
                  ? `✓ ${inviteState.companyName}`
                  : inviteState.status === "checking"
                    ? "Validando..."
                    : inviteState.status === "invalid" || inviteState.status === "locked"
                      ? inviteState.message
                      : "Tu manager te compartió este código"
              }
              helperColor={
                inviteState.status === "valid"
                  ? "var(--c-success)"
                  : inviteState.status === "invalid" || inviteState.status === "locked"
                    ? "var(--c-danger)"
                    : "var(--c-text-2)"
              }
            />
          )}

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              fontSize: 14,
              color: "var(--c-text-2)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{ marginTop: "3px", accentColor: "var(--c-primary)" }}
            />
            <span>
              Acepto los <span style={{ color: "var(--c-primary)" }}>términos y condiciones</span>
            </span>
          </label>

          {error && <p style={{ margin: 0, fontSize: 14, color: "var(--c-danger)" }}>{error}</p>}

          {!formValid && (intento || empezo) && (
            <div role="status" style={{ fontSize: 14, color: "var(--c-gold)", lineHeight: 1.5 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Para crear tu cuenta te falta:</p>
              <ul style={{ margin: "4px 0 0", paddingLeft: "1.1rem" }}>
                {faltantes.map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={primaryBtn(loading, !formValid)}
          >
            {loading ? "Creando cuenta..." : "Crear mi cuenta"}
          </button>
        </form>

        <Divider />

        <button type="button" onClick={handleGoogle} style={googleBtn}>
          <GoogleIcon /> Continuar con Google
        </button>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: 14, color: "var(--c-text-2)" }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" style={{ color: "var(--c-primary)", textDecoration: "none" }}>
            Inicia sesión
          </Link>
        </p>
      </section>

    </main>
  );
}

function StrengthBar({ level }: { level: 0 | 1 | 2 | 3 }) {
  const colors = ["var(--c-border)", "var(--c-danger)", "var(--c-gold)", "var(--c-success)"];
  return (
    <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
      {[1, 2, 3].map((seg) => (
        <span
          key={seg}
          style={{
            flex: 1,
            height: "4px",
            borderRadius: "2px",
            background: level >= seg ? colors[level] : "var(--c-border)",
            transition: "background 200ms ease",
          }}
        />
      ))}
    </div>
  );
}
