// TEMPORAL — endpoint de verificación del generador de pitch. Borrar al terminar.
import { createFileRoute } from "@tanstack/react-router";

const TOKEN = "closer-pitchgen-verify-2026";

export const Route = createFileRoute("/api/public/pitchgen-check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as any;
        if (body?.token !== TOKEN) return new Response("no", { status: 401 });
        const { runPitchSection } = await import("@/lib/pitch-generator.server");
        const t0 = Date.now();
        const res = await runPitchSection({
          pitchId: String(body.pitchId),
          step: Number(body.step),
        });
        return Response.json({ ms: Date.now() - t0, res });
      },
    },
  },
});
