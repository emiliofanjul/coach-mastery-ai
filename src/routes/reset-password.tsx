import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Topbar,
  containerStyle,
  titleStyle,
  subtitleStyle,
  Field,
  primaryBtn,
} from "./login";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nueva contraseña — Closer" },
      { name: "description", content: "Crea una nueva contraseña para tu cuenta." },
    ],
  }),
  component: ResetPasswordScreen,
});

const BG =
  "radial-gradient(ellipse at 30% 70%, #1e0a30 0%, transparent 55%), #08080F";

const schema = z
  .object({
    password: z.string().min(8, "Mínimo 8 caracteres").max(128),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const finish = (ok: boolean, msg?: string) => {
      if (cancelled) return;
      if (ok) setReady(true);
      else setError(msg ?? "El enlace expiró o ya se usó. Solicita uno nuevo.");
    };

    (async () => {
      // 1) Sesión ya activa (link procesado antes)
      const { data: pre } = await supabase.auth.getSession();
      if (pre.session) return finish(true);

      const url = new URL(window.location.href);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      // 2) Formato nuevo: ?token_hash=...&type=recovery
      const tokenHash = url.searchParams.get("token_hash");
      const type = url.searchParams.get("type") ?? hash.get("type");
      if (tokenHash) {
        const { error: e } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: (type as "recovery") || "recovery",
        });
        return finish(!e, e?.message);
      }

      // 3) Formato PKCE: ?code=...
      const code = url.searchParams.get("code");
      if (code) {
        const { error: e } = await supabase.auth.exchangeCodeForSession(code);
        return finish(!e, e?.message);
      }

      // 4) Formato implícito: #access_token=...&refresh_token=...
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error: e } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        return finish(!e, e?.message);
      }

      // 5) Nada útil → espera al listener por si detectSessionInUrl lo procesa
      setTimeout(async () => {
        const { data } = await supabase.auth.getSession();
        if (!cancelled && !data.session) {
          finish(false, "No encontramos un enlace de recuperación válido. Solicita uno nuevo.");
        } else if (!cancelled && data.session) {
          finish(true);
        }
      }, 1500);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") finish(true);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa la contraseña.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setLoading(false);
    if (authError) {
      setError("No pudimos actualizar la contraseña. Vuelve a solicitar el enlace.");
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/mapa" }), 1500);
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
        <h2 style={titleStyle}>Nueva contraseña</h2>
        <p style={subtitleStyle}>
          {done
            ? "Contraseña actualizada. Te llevamos a tu mapa..."
            : ready
              ? "Elige una nueva contraseña para tu cuenta."
              : error
                ? "No pudimos validar el enlace."
                : "Validando enlace de recuperación..."}
        </p>

        {!ready && !done && error && (
          <p style={{ marginTop: "16px", fontSize: "0.84rem", color: "#EF476F" }}>
            {error}{" "}
            <Link to="/forgot-password" style={{ color: "#FF6B2B", textDecoration: "none" }}>
              Solicitar otro
            </Link>
          </p>
        )}

        {ready && !done && (
          <form
            onSubmit={handleSubmit}
            style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <Field
              label="Nueva contraseña"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              invalid={!!error}
            />
            <Field
              label="Confirmar contraseña"
              value={confirm}
              onChange={setConfirm}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              invalid={!!error}
            />
            {error && (
              <p style={{ margin: 0, fontSize: "0.76rem", color: "#EF476F" }}>{error}</p>
            )}
            <button type="submit" disabled={loading} style={primaryBtn(loading)}>
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "0.8rem", color: "#5A5A8A" }}>
          <Link to="/login" style={{ color: "#FF6B2B", textDecoration: "none" }}>
            Volver a iniciar sesión
          </Link>
        </p>
      </section>
    </main>
  );
}
