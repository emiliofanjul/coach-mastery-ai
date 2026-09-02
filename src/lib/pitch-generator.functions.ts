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

/**
 * Publica un pitch. Solo si es homogéneo: todas las secciones de la misma
 * versión del generador y ninguna marcada como desactualizada.
 */
export const publishPitch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { pitchId: string; force?: boolean }) => {
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
      return { ok: false as const, error: "forbidden", problems: ["No autorizado."] };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { checkPitchIntegrity } = await import("@/lib/pitch-generator.server");

    const { data: pitch } = await supabaseAdmin
      .from("company_pitches")
      .select("id, company_id, version")
      .eq("id", data.pitchId)
      .maybeSingle();
    if (!pitch || pitch.company_id !== profile.company_id) {
      return { ok: false as const, error: "not_found", problems: ["Pitch no encontrado."] };
    }

    const integrity = await checkPitchIntegrity(supabaseAdmin, data.pitchId);
    // Secciones vacías → bloquea. Desactualizadas / versión distinta → advierte.
    if (!integrity.ok) {
      return { ok: false as const, error: "incomplete", problems: integrity.problems };
    }
    if (integrity.warnings.length > 0 && data.force !== true) {
      return {
        ok: false as const,
        error: "needs_confirmation",
        needs_confirmation: true as const,
        warnings: integrity.warnings,
        stale: integrity.stale,
      };
    }


    const { data: sections } = await supabaseAdmin
      .from("pitch_sections")
      .select("*")
      .eq("pitch_id", data.pitchId)
      .order("step");

    const nextVersion = Number(pitch.version ?? 1);
    await supabaseAdmin.from("pitch_versions").insert([
      {
        pitch_id: data.pitchId,
        version: nextVersion,
        snapshot: { sections, prompt_version: integrity.versions[0] } as any,
        published_by: userId,
      },
    ] as any);
    await supabaseAdmin
      .from("company_pitches")
      .update({ status: "published", published_at: new Date().toISOString() } as any)
      .eq("id", data.pitchId);

    return { ok: true as const, version: nextVersion, prompt_version: integrity.versions[0] };
  });
