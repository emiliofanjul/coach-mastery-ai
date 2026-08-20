import { runPitchGeneration } from "@/lib/pitch-generator.server";
const id = process.argv[2]!;
const r = await runPitchGeneration({ pitchId: id, dryRun: process.argv[3] === "dry" });
console.log(JSON.stringify(r, null, 2));
