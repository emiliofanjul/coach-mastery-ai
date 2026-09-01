import { runPitchSection } from "./src/lib/pitch-generator.server";
const pitchId = "e03c27ad-e67c-4b8f-aa2d-99367b0c2917";
const companyId = "aeb89d76-cb11-4dbc-a406-715dbfb3caed";
for (const step of [1,2,3,4,5,6]) {
  const t0 = Date.now();
  const r: any = await runPitchSection({ pitchId, step, companyId, dryRun: true });
  console.log(step, r.ok ? "OK" : "FAIL", ((Date.now()-t0)/1000).toFixed(1)+"s", r.ok ? (r.attempts?.length ?? 1)+" intento(s)" : JSON.stringify(r).slice(0,200));
}
