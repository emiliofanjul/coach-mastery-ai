// rebuild-skill-state — recomputes seller_skill_state from scratch for the
// authenticated seller (or a given seller_id if the caller is a manager of
// the same company). Fórmula v1: ver `_shared/skill_state.ts`.
//
// Events sin bloque `payload.evaluation` (los viejos, previos al fix del
// payload) se saltan naturalmente — no aportan evidencia y quedan documentado.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { recomputeSellerSkillState } from "../_shared/skill_state.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Missing Authorization" }, 401);

    const supabaseUser = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    let bodySellerId: string | null = null;
    try {
      const body = await req.json().catch(() => ({}));
      if (body && typeof body.seller_id === "string") bodySellerId = body.seller_id;
    } catch { /* empty body is fine */ }

    // Default: rebuild for the caller's own seller row.
    const { data: ownSeller } = await admin
      .from("sellers")
      .select("id, company_id")
      .eq("profile_id", userId)
      .maybeSingle();

    let seller: { id: string; company_id: string } | null = ownSeller ?? null;

    if (bodySellerId && (!seller || bodySellerId !== seller.id)) {
      // Manager path: verify caller is a manager of the same company as the target seller.
      const { data: target } = await admin
        .from("sellers")
        .select("id, company_id")
        .eq("id", bodySellerId)
        .maybeSingle();
      const { data: profile } = await admin
        .from("profiles")
        .select("role, company_id")
        .eq("id", userId)
        .maybeSingle();
      if (!target || !profile || profile.role !== "manager" || profile.company_id !== target.company_id) {
        return json({ error: "Forbidden" }, 403);
      }
      seller = target;
    }

    if (!seller) return json({ error: "Seller not found" }, 404);

    const result = await recomputeSellerSkillState(admin, seller.id, seller.company_id);
    return json({ ok: true, seller_id: seller.id, ...result });
  } catch (err) {
    console.error("[rebuild-skill-state] error:", err);
    return json({ error: "Server error", detail: String(err) }, 500);
  }
});
