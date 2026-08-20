import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generatePitch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { pitchId: string; dryRun?: boolean }) => {
    if (!input?.pitchId) throw new Error("pitchId required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile || profile.role !== "manager" || !profile.company_id) {
      return { ok: false as const, error: "forbidden" };
    }
    const { runPitchGeneration } = await import("@/lib/pitch-generator.server");
    return await runPitchGeneration({
      pitchId: data.pitchId,
      companyId: profile.company_id,
      dryRun: data.dryRun === true,
    });
  });

export const generatePitchSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { pitchId: string; step: number; dryRun?: boolean }) => {
    if (!input?.pitchId) throw new Error("pitchId required");
    if (!input?.step) throw new Error("step required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile || profile.role !== "manager" || !profile.company_id) {
      return { ok: false as const, step: data.step, error: "forbidden" };
    }
    const { runPitchSection } = await import("@/lib/pitch-generator.server");
    return await runPitchSection({
      pitchId: data.pitchId,
      step: data.step,
      companyId: profile.company_id,
      dryRun: data.dryRun === true,
    });
  });
