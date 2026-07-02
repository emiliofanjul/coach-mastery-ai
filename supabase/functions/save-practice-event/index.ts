// save-practice-event — inserts a seller_event row (service role) and,
// if audio is included and the seller gave consent, uploads it to the
// private `practice-audio` bucket at {seller_id}/{event_id}.webm and
// stores the resulting URL on the event.
//
// Request: multipart/form-data
//   - meta: JSON string with { event_type, node_id?, skill_ids?, payload?, prompt_version?, script_version?, model? }
//   - audio?: Blob (optional). If omitted or seller has no consent, no upload happens.
//
// Auth: requires the caller's Supabase JWT in Authorization. The function
// resolves the seller from sellers.profile_id = auth.uid().

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

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

    // Identify the user from their JWT
    const supabaseUser = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    // Admin client for privileged writes
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Resolve seller for this user
    const { data: seller, error: sellerErr } = await admin
      .from("sellers")
      .select("id, audio_consent")
      .eq("profile_id", userId)
      .maybeSingle();
    if (sellerErr) return json({ error: "Seller lookup failed", detail: sellerErr.message }, 500);
    if (!seller) return json({ error: "Seller not found" }, 404);

    // Parse multipart
    const form = await req.formData();
    const metaRaw = form.get("meta");
    if (typeof metaRaw !== "string") return json({ error: "Missing meta" }, 400);
    let meta: any;
    try { meta = JSON.parse(metaRaw); } catch { return json({ error: "Invalid meta JSON" }, 400); }

    const eventType: string = meta?.event_type ?? "practice_session";
    const sessionId: string | null = typeof meta?.session_id === "string" ? meta.session_id : null;
    const payload = { ...(meta?.payload ?? {}), session_id: sessionId };
    const insertRow = {
      seller_id: seller.id,
      event_type: eventType,
      node_id: meta?.node_id ?? null,
      skill_ids: Array.isArray(meta?.skill_ids) ? meta.skill_ids : [],
      payload,
      prompt_version: meta?.prompt_version ?? null,
      script_version: meta?.script_version ?? null,
      model: meta?.model ?? null,
    };

    const { data: inserted, error: insErr } = await admin
      .from("seller_events")
      .insert(insertRow)
      .select("id")
      .single();
    if (insErr || !inserted) return json({ error: "Insert failed", detail: insErr?.message }, 500);

    const eventId: string = inserted.id;

    // Audio upload (only if consent AND audio provided)
    const audio = form.get("audio");
    let audioUrl: string | null = null;
    if (audio && audio instanceof File && seller.audio_consent === true) {
      const path = `${seller.id}/${eventId}.webm`;
      const bytes = new Uint8Array(await audio.arrayBuffer());
      const { error: upErr } = await admin.storage
        .from("practice-audio")
        .upload(path, bytes, {
          contentType: audio.type || "audio/webm",
          upsert: true,
        });
      if (upErr) {
        console.error("[save-practice-event] upload failed:", upErr);
      } else {
        audioUrl = path; // store the storage path; signed URLs generated on read
        await admin
          .from("seller_events")
          .update({ audio_url: audioUrl })
          .eq("id", eventId);
      }
    }

    // Backfill llm_calls: link every model call from this session to the event.
    let llmCallsBackfilled = 0;
    if (sessionId) {
      const { data: backfilled, error: bfErr } = await admin
        .from("llm_calls")
        .update({ event_id: eventId })
        .eq("session_id", sessionId)
        .is("event_id", null)
        .select("id");
      if (bfErr) {
        console.error("[save-practice-event] llm_calls backfill failed:", bfErr);
      } else {
        llmCallsBackfilled = Array.isArray(backfilled) ? backfilled.length : 0;
      }
    }

    return json({ ok: true, event_id: eventId, audio_url: audioUrl, session_id: sessionId, llm_calls_backfilled: llmCallsBackfilled });
  } catch (err) {
    console.error("[save-practice-event] error:", err);
    return json({ error: "Server error", detail: String(err) }, 500);
  }
});
