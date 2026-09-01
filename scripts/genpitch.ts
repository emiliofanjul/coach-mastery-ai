import { runPitchSection, PITCH_STEPS_SPEC } from "../src/lib/pitch-generator.server";
const pitchId = "e03c27ad-e67c-4b8f-aa2d-99367b0c2917";
let total = 0;
for (const spec of PITCH_STEPS_SPEC) {
  const r: any = await runPitchSection({ pitchId, step: spec.step });
  if (!r.ok) { console.log(spec.key, "FAIL", JSON.stringify(r.failed_validations ?? r.detail ?? r.error)); continue; }
  const c = String(r.section.content ?? "").trim().length;
  const alts = (r.section.alternatives ?? []).map((a: any) => String(a.content ?? "").trim().length);
  total += c + alts.reduce((a: number, b: number) => a + b, 0);
  console.log(`${spec.key}: content=${c} alts=[${alts.join(",")}] attempts=${r.attempts?.length}`);
}
console.log("TOTAL(content+alts) =", total);
