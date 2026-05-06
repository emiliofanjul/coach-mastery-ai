import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AuthCoachBubble } from "@/components/closer/AuthCoachBubble";
import {
  getSelectedRole,
  passwordStrength,
  setPendingCompanyName,
  setPendingInviteCode,
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
    ],
  }),
  component: SignupScreen,
});

const BG = "radial-gradient(ellipse at 30% 70%, #1e0a30 0%, transparent 55%), #08080F";

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
  const [companyName, setCompanyName] = useState(""); // solo manager
  const [inviteCode, setInviteCode] = useState(""); // solo vendedor
  const [inviteState, setInviteState] = useState<{
    status: "idle" | "checking" | "valid" | "invalid" | "locked";
    companyName?: string;
    message?: string;
  }>({ status: "idle" });
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isVendedor = role === "vendedor";
  const strength = passwordStrength(password);

  // Validación del código contra la BD (debounce simple)
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
      if (error) {
        setInviteState({ status: "invalid", message: "No pudimos validar el código." });
        return;
      }
      const d = data as { valid: boolean; reason?: string; company_name?: string };
      if (d.valid) {
        setInviteState({ status: "valid", companyName: d.company_name });
      } else if (d.reason === "locked") {
        setInviteState({
          status: "locked",
          message: "Este código está bloqueado temporalmente. Pídele a tu manager uno nuevo.",
        });
      } else if (d.reason === "expired") {
        setInviteState({ status: "invalid", message: "Este código expiró." });
      } else if (d.reason === "used") {
        setInviteState({ status: "invalid", message: "Este código ya fue usado." });
      } else {
        setInviteState({ status: "invalid", message: "Código no válido." });
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [inviteCode, isVendedor]);

  const formValid = (() => {
    const base = baseSchema.safeParse({ fullName, email, password });
    if (!base.success || !accepted) return false;
    if (role === "manager" && companyName.trim().length < 2) return false;
    if (isVendedor && inviteState.status !== "valid") return false;
    return true;
  })();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formValid || !role) return;
    setLoading(true);

    // Guardar contexto para post-signup (en caso de OAuth o session estado)
    if (role === "manager") setPendingCompanyName(companyName.trim());
    if (isVendedor) setPendingInviteCode(inviteCode.trim());

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim(), role },
        emailRedirectTo: window.location.origin,
      },
    });

    if (authError || !data.user) {
      setLoading(false);
      // Si el código se intentó usar pero falla auth no incrementamos
      setError(authError?.message ?? "No pudimos crear tu cuenta.");
      return;
    }

    // Vincular empresa según rol
    if (role === "manager") {
      const { error: rpcErr } = await supabase.rpc("create_company_for_manager", {
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
        // Registrar intento fallido (anti-bruteforce)
        await supabase.rpc("register_invite_failed_attempt", { _code: inviteCode.trim() });
        setLoading(false);
        setError("No pudimos vincular tu código. Inténtalo de nuevo.");
        return;
      }
    }

    setLoading(false);
    if (role === "manager") {
      navigate({ to: "/onboarding/manager" });
    } else {
      navigate({ to: "/onboarding/seller" });
    }
  };

  const handleGoogle = async () => {
    setError(null);
    if (role === "manager") setPendingCompanyName(companyName.trim());
    if (isVendedor && inviteState.status === "valid") setPendingInviteCode(inviteCode.trim());
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError("No pudimos continuar con Google.");
  };

  return (
    <main style={{ minHeight: "100dvh", background: BG, color: "#F0F0F5", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <Topbar />

      <section style={containerStyle}>
        <h2 style={titleStyle}>{role === "manager" ? "Crea tu cuenta" : "Empieza a entrenar"}</h2>

        {/* Pill rol */}
        <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(255,107,43,0.1)",
              border: "1px solid rgba(255,107,43,0.3)",
              borderRadius: "99px",
              padding: "0.3rem 0.8rem",
              fontWeight: 500,
              fontSize: "0.76rem",
              color: "#FF6B2B",
            }}
          >
            {role === "manager" ? "💼 Manager" : "🎯 Vendedor"}
          </span>
          <Link to="/role" style={{ fontSize: "0.72rem", color: "#5A5A8A", textDecoration: "underline" }}>
            cambiar
          </Link>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <Field label="Nombre completo" value={fullName} onChange={setFullName} placeholder="Juan García" autoComplete="name" maxLength={100} />
          <Field label="Correo electrónico" value={email} onChange={setEmail} type="email" placeholder="tu@correo.com" autoComplete="email" maxLength={255} />
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
          </div>

          {role === "manager" && (
            <Field label="Nombre de tu empresa" value={companyName} onChange={setCompanyName} placeholder="Ej: Dalfan" maxLength={120} />
          )}

          {isVendedor && (
            <Field
              label="Código de empresa"
              value={inviteCode}
              onChange={(v) => setInviteCode(v.toUpperCase())}
              placeholder="Ej: X7K2-MP9Q"
              inputMode="text"
              maxLength={12}
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
                  ? "#06D6A0"
                  : inviteState.status === "invalid" || inviteState.status === "locked"
                  ? "#EF476F"
                  : "#5A5A8A"
              }
            />
          )}

          <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.8rem", color: "#5A5A8A", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              style={{ marginTop: "3px", accentColor: "#FF6B2B" }}
            />
            <span>
              Acepto los <span style={{ color: "#FF6B2B" }}>términos y condiciones</span>
            </span>
          </label>

          {error && <p style={{ margin: 0, fontSize: "0.76rem", color: "#EF476F" }}>{error}</p>}

          <button type="submit" disabled={!formValid || loading} style={primaryBtn(loading, !formValid)}>
            {loading ? "Creando cuenta..." : "Crear mi cuenta"}
          </button>
        </form>

        <Divider />

        <button type="button" onClick={handleGoogle} style={googleBtn}>
          <GoogleIcon /> Continuar con Google
        </button>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.8rem", color: "#5A5A8A" }}>
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" style={{ color: "#FF6B2B", textDecoration: "none" }}>
            Inicia sesión
          </Link>
        </p>
      </section>

      <AuthCoachBubble />
    </main>
  );
}

function StrengthBar({ level }: { level: 0 | 1 | 2 | 3 }) {
  const colors = ["#252535", "#EF476F", "#FFD166", "#06D6A0"];
  return (
    <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
      {[1, 2, 3].map((seg) => (
        <span
          key={seg}
          style={{
            flex: 1,
            height: "4px",
            borderRadius: "2px",
            background: level >= seg ? colors[level] : "#252535",
            transition: "background 200ms ease",
          }}
        />
      ))}
    </div>
  );
}
