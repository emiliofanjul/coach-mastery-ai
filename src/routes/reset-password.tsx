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
    // Supabase entrega el recovery via hash (#access_token=...&type=recovery)
    // El cliente detecta la sesión automáticamente (detectSessionInUrl).
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });
    // También comprueba si ya hay sesión activa (link ya procesado)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
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
              : "Validando enlace de recuperación..."}
        </p>

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
