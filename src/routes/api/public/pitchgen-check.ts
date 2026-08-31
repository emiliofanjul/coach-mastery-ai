// TEMPORAL — verificación del generador con el Cerebro. Se borra al terminar.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/pitchgen-check")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          token: string;
          mode: "criterios" | "section";
          pitchId: string;
          step?: number;
        };
        if (body.token !== process.env["PITCHGEN_CHECK_TOKEN"]) {
          return new Response("nope", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { getCriteriosEjecucion } = await import("@/lib/doctrina.server");
        const {
          runPitchSection,
          PITCH_STEPS_SPEC,
          RECURRENTE_NODE_IDS,
          buildCriteriosBlock,
        } = await import("@/lib/pitch-generator.server");

        const { data: pitch } = await supabaseAdmin
          .from("company_pitches")
          .select("id, client_type, channel, company_id")
          .eq("id", body.pitchId)
          .maybeSingle();
        if (!pitch) return Response.json({ error: "pitch_not_found" }, { status: 404 });

        if (body.mode === "criterios") {
          const spec = PITCH_STEPS_SPEC.find((s) => s.step === (body.step ?? 5))!;
          const a = await getCriteriosEjecucion({ worlds: spec.worlds });
          const b =
            pitch.client_type === "recurrente"
              ? await getCriteriosEjecucion({ nodeIds: RECURRENTE_NODE_IDS })
              : [];
          const all = [...a, ...b];
          return Response.json({
            section: spec.key,
            worlds: spec.worlds,
            total: all.length,
            criterios: all.map((c) => ({
              tipo: c.tipo,
              id: c.skill_id,
              severity: c.severity,
              node: c.node_id,
              world: c.world_id,
            })),
            block: buildCriteriosBlock(all),
          });
        }

        const started = Date.now();
        const res = await runPitchSection({ pitchId: body.pitchId, step: body.step! });
        return Response.json({ ms: Date.now() - started, res });
      },
    },
  },
});
