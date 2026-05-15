import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Closer — El vendedor no nace. Se hace." },
      {
        name: "description",
        content:
          "El mejor entrenador de ventas del mundo, disponible 24/7. Closer convierte vendedores en cerradores.",
      },
      { property: "og:title", content: "Closer — El vendedor no nace. Se hace." },
      {
        property: "og:description",
        content: "Entrenamiento de ventas con IA. Diagnostica, practica, cierra.",
      },
    ],
  }),
  component: SplashScreen,
});

function SplashScreen() {
  const navigate = useNavigate();
  const [logoIn, setLogoIn] = useState(false);
  const [taglineIn, setTaglineIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLogoIn(true), 30);
    const t2 = setTimeout(() => setTaglineIn(true), 230);
    const t3 = setTimeout(() => setFadeOut(true), 2100);
    const t4 = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      const dest = data.session ? "/mapa" : "/role";
      navigate({ to: dest }).catch(() => {});
    }, 2500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [navigate]);

  return (
    <main
      className="fixed inset-0 flex flex-col items-center justify-center transition-opacity duration-[400ms] ease-out"
      style={{
        backgroundColor: "#08080F",
        opacity: fadeOut ? 0 : 1,
      }}
    >
      <h1
        className="transition-opacity duration-[600ms] ease-out"
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: "2.8rem",
          color: "#FF6B2B",
          letterSpacing: "-0.02em",
          opacity: logoIn ? 1 : 0,
          margin: 0,
        }}
      >
        CLOSER
      </h1>
      <p
        className="transition-opacity duration-[600ms] ease-out"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          fontSize: "0.84rem",
          color: "#5A5A8A",
          marginTop: "8px",
          opacity: taglineIn ? 1 : 0,
        }}
      >
        El vendedor no nace. Se hace.
      </p>
    </main>
  );
}
