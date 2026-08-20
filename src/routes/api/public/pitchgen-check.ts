// TEMPORAL — verificación del generador de pitch. Borrar tras las pruebas.
import { createFileRoute } from "@tanstack/react-router";

const TOKEN = "k7Qm2xR9vT4pLz8w";

export const Route = createFileRoute("/api/public/pitchgen-check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("x-check-token") !== TOKEN) {
          return new Response("no", { status: 401 });
        }
        const body = (await request.json()) as { pitchId: string; step: number };
        const { runPitchSection } = await import("@/lib/pitch-generator.server");
        const started = Date.now();
        const res = await runPitchSection({ pitchId: body.pitchId, step: body.step });
        return Response.json({ ms: Date.now() - started, res });
      },
    },
  },
});
