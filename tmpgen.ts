import { runPitchSection } from "/dev-server/src/lib/pitch-generator.server";
const pitchId = process.env.PITCH_ID!;
const step = Number(process.env.STEP);
const companyId = process.env.COMPANY_ID!;
const res: any = await runPitchSection({ pitchId, step, companyId });
console.log(JSON.stringify({ ok: res.ok, error: res.error, fails: res.failed_validations, attempts: res.attempts, len: res.section?.content?.length }, null, 2));
