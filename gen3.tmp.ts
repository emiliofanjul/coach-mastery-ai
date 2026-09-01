import { runPitchSection } from "@/lib/pitch-generator.server";
const pitchId = "e03c27ad-e67c-4b8f-aa2d-99367b0c2917";
const companyId = "aeb89d76-cb11-4dbc-a406-715dbfb3caed";
for (const run of [1,2,3]) {
  const t0 = Date.now();
  const r: any = await runPitchSection({ pitchId, step: 3, companyId, dryRun: true });
  console.log(`corrida ${run}:`, r.ok ? "OK" : "FAIL", ((Date.now()-t0)/1000).toFixed(1)+"s",
    "intentos=", r.attempts?.length ?? (r.attempt ?? "?"),
    r.ok ? "" : JSON.stringify(r).slice(0,400));
  if (r.attempts) console.log("   detalle:", JSON.stringify(r.attempts).slice(0,600));
}
