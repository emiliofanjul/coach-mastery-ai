import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/role")({
  component: () => (
    <main
      className="fixed inset-0 flex items-center justify-center"
      style={{ backgroundColor: "#08080F", color: "#5A5A8A", fontFamily: "'DM Sans', sans-serif" }}
    >
      Pantalla 2 — pendiente
    </main>
  ),
});
