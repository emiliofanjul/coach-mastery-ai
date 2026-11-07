// La liga de invitación: /unirme?codigo=XXXX (oct-2026). Guarda el código y el
// rol de vendedor, y manda directo a crear la cuenta con el código ya puesto.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { setSelectedRole, setPendingInviteCode } from "@/lib/closer-auth";
import { codigoDeLiga } from "@/lib/invitacion";

export const Route = createFileRoute("/unirme")({
  validateSearch: (s: Record<string, unknown>) => ({
    codigo: typeof s.codigo === "string" ? s.codigo : "",
  }),
  head: () => ({ meta: [{ title: "Únete a tu equipo — Closer" },
      {"name": "description", "content": "Accede al entrenamiento de ventas de tu equipo en Closer."},
      {"property": "og:title", "content": "Únete a tu equipo — Closer"},
      {"property": "og:description", "content": "Accede al entrenamiento de ventas de tu equipo en Closer."},
      {"property": "og:type", "content": "website"},
      {"name": "twitter:card", "content": "summary"},
    ] }),
  component: Unirme,
});

function Unirme() {
  const { codigo } = Route.useSearch();
  const navigate = useNavigate();
  useEffect(() => {
    const c = codigoDeLiga(codigo);
    if (c) {
      setSelectedRole("vendedor");
      setPendingInviteCode(c);
      navigate({ to: "/signup", replace: true });
    } else {
      navigate({ to: "/role", replace: true });
    }
  }, [codigo, navigate]);
  return <main style={{ minHeight: "100dvh", background: "var(--c-bg)" }} />;
}
