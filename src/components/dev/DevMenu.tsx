import { useState } from "react";
import { Link } from "@tanstack/react-router";

const ROUTES: Array<{ to: string; label: string }> = [
  { to: "/", label: "/ (mapa)" },
  { to: "/home", label: "/home" },
  { to: "/dashboard", label: "/dashboard (manager)" },
  { to: "/role", label: "/role" },
  { to: "/login", label: "/login" },
  { to: "/signup", label: "/signup" },
  { to: "/onboarding/manager", label: "/onboarding/manager" },
  { to: "/onboarding/seller", label: "/onboarding/seller" },
  { to: "/onboarding/map-intro", label: "/onboarding/map-intro" },
];

export function DevMenu() {
  if (!import.meta.env.DEV) return null;
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "fixed", top: 8, left: 8, zIndex: 9999 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "rgba(255,107,43,0.15)",
          border: "1px solid rgba(255,107,43,0.5)",
          color: "#FF6B2B",
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          fontSize: "0.65rem",
          padding: "0.2rem 0.5rem",
          borderRadius: 6,
          cursor: "pointer",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Dev
      </button>
      {open && (
        <div
          style={{
            marginTop: 6,
            background: "#0B0B12",
            border: "1px solid #252535",
            borderRadius: 10,
            padding: "0.6rem",
            minWidth: 220,
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {ROUTES.map((r) => (
            <Link
              key={r.to}
              to={r.to}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "0.4rem 0.55rem",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.78rem",
                color: "#F0F0F5",
                textDecoration: "none",
                borderRadius: 6,
              }}
              activeProps={{
                style: {
                  background: "rgba(255,107,43,0.1)",
                  color: "#FF6B2B",
                },
              }}
            >
              {r.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
