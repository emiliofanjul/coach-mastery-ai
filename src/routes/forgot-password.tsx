import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
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

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recupera tu contraseña — Closer" },
      { name: "description", content: "Te enviamos un enlace para restablecer tu contraseña." },
    ],
  }),
  component: ForgotPasswordScreen,
});

const BG =
  "radial-gradient(ellipse at 30% 70%, #1e0a30 0%, transparent 55%), #08080F";

const schema = z.object({ email: z.string().trim().email().max(255) });

function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError("Ingresa un correo válido.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo: `${window.location.origin}/reset-password` },
    );
    setLoading(false);
    if (authError) {
      setError("No pudimos enviar el correo. Inténtalo de nuevo.");
      return;
    }
    setSent(true);
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
        <h2 style={titleStyle}>¿Olvidaste tu contraseña?</h2>
        <p style={subtitleStyle}>
          {sent
            ? "Revisa tu correo. Si la cuenta existe, te enviamos un enlace para restablecerla."
            : "Ingresa tu correo y te enviamos un enlace para crear una nueva."}
        </p>

        {!sent && (
          <form
            onSubmit={handleSubmit}
            style={{ marginTop: "28px", display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <Field
              label="Correo electrónico"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="tu@correo.com"
              autoComplete="email"
              invalid={!!error}
            />
            {error && (
              <p style={{ margin: 0, fontSize: "0.76rem", color: "#EF476F" }}>{error}</p>
            )}
            <button type="submit" disabled={loading} style={primaryBtn(loading)}>
              {loading ? "Enviando..." : "Enviar enlace"}
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
