import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Aplica el texto de una sección y la audita en el mismo paso.
 *
 * Antes esto era un PATCH directo desde el cliente que solo escribía `content`.
 * Por eso los skill_ids quedaban congelados en lo que el generador declaró al
 * nacer: editabas la sección, agregabas una técnica, y la lista de técnicas no
 * se movía. Ahora el contenido y su veredicto se escriben juntos.
 */
export const applyPitchSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { sectionId: string; content: string; editedByManager?: boolean }) => {
      if (!input?.sectionId) throw new Error("sectionId required");
      if (typeof input?.content !== "string" || !input.content.trim())
        throw new Error("content required");
      return input;
    },
  )
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

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: section } = await supabaseAdmin
      .from("pitch_sections")
      .select("id, pitch_id, step, section_key, section_kind")
      .eq("id", data.sectionId)
      .maybeSingle();
    if (!section) return { ok: false as const, error: "not_found" };

    const { data: pitch } = await supabaseAdmin
      .from("company_pitches")
      .select("id, company_id, relationship")
      .eq("id", (section as any).pitch_id)
      .maybeSingle();
    if (!pitch || (pitch as any).company_id !== profile.company_id) {
      return { ok: false as const, error: "forbidden" };
    }

    const content = data.content.trim();

    // El contenido se guarda siempre. La auditoría informa, no bloquea: el
    // manager es el dueño de su pitch. Lo que no puede pasar es que una
    // violación quede invisible.
    const patch: Record<string, unknown> = { content };
    if (data.editedByManager) patch.edited_by_manager = true;
    await supabaseAdmin.from("pitch_sections").update(patch as any).eq("id", data.sectionId);

    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) {
      return { ok: true as const, audit: null, error: "missing_api_key" };
    }

    try {
      const { auditPitchSectionContent } = await import("@/lib/pitch-audit.server");
      const audit = await auditPitchSectionContent({
        admin: supabaseAdmin,
        apiKey,
        content,
        step: Number((section as any).step),
        sectionKey: String((section as any).section_key),
        sectionKind: String((section as any).section_kind),
        companyId: String((pitch as any).company_id),
        relationship: String((pitch as any).relationship ?? "nuevo"),
      });

      await supabaseAdmin
        .from("pitch_sections")
        .update({
          skill_ids: audit.skill_ids,
          audit: audit as any,
          audit_status: audit.status,
          audited_at: new Date().toISOString(),
        } as any)
        .eq("id", data.sectionId);

      return { ok: true as const, audit };
    } catch (e) {
      console.error("[pitch-audit] failed", e);
      // La auditoría es best-effort: si falla, el texto ya quedó guardado.
      return { ok: true as const, audit: null, error: "audit_failed" };
    }
  });

/** Audita una sección sin tocar su contenido. Para revisar lo ya generado. */
export const auditPitchSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sectionId: string }) => {
    if (!input?.sectionId) throw new Error("sectionId required");
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

    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) return { ok: false as const, error: "missing_api_key" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: section } = await supabaseAdmin
      .from("pitch_sections")
      .select("id, pitch_id, step, section_key, section_kind, content")
      .eq("id", data.sectionId)
      .maybeSingle();
    if (!section || !(section as any).content) {
      return { ok: false as const, error: "not_found" };
    }

    const { data: pitch } = await supabaseAdmin
      .from("company_pitches")
      .select("id, company_id, relationship")
      .eq("id", (section as any).pitch_id)
      .maybeSingle();
    if (!pitch || (pitch as any).company_id !== profile.company_id) {
      return { ok: false as const, error: "forbidden" };
    }

    try {
      const { auditPitchSectionContent } = await import("@/lib/pitch-audit.server");
      const audit = await auditPitchSectionContent({
        admin: supabaseAdmin,
        apiKey,
        content: String((section as any).content),
        step: Number((section as any).step),
        sectionKey: String((section as any).section_key),
        sectionKind: String((section as any).section_kind),
        companyId: String((pitch as any).company_id),
        relationship: String((pitch as any).relationship ?? "nuevo"),
      });

      await supabaseAdmin
        .from("pitch_sections")
        .update({
          skill_ids: audit.skill_ids,
          audit: audit as any,
          audit_status: audit.status,
          audited_at: new Date().toISOString(),
        } as any)
        .eq("id", data.sectionId);

      return { ok: true as const, audit };
    } catch (e) {
      console.error("[pitch-audit] failed", e);
      return { ok: false as const, error: "audit_failed" };
    }
  });
