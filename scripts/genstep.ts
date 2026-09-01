import { runPitchSection } from "../src/lib/pitch-generator.server";
const pitchId = "e03c27ad-e67c-4b8f-aa2d-99367b0c2917";
const r: any = await runPitchSection({ pitchId, step: 4 });
if (!r.ok) console.log("FAIL", JSON.stringify(r.failed_validations ?? r.error));
else console.log(`presentacion: content=${String(r.section.content).trim().length} alts=[${(r.section.alternatives??[]).map((a:any)=>String(a.content).trim().length).join(",")}] attempts=${r.attempts?.length}`);
