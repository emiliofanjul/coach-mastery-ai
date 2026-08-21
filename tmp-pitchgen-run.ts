import { runPitchSection } from "@/lib/pitch-generator.server";
const [pitchId, stepArg] = process.argv.slice(2);
const t = Date.now();
const res = await runPitchSection({ pitchId: pitchId!, step: Number(stepArg) });
console.log(JSON.stringify({ ms: Date.now() - t, res }, null, 2));
