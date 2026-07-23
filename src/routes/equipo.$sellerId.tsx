import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ChevronDown, ChevronRight, Star, Trophy, Flame, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/AppShell";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { restGet, restGetMaybeSingle } from "@/lib/supabase-rest";

type CoachRec = {
  prioridad: string;
  plan: string[];
  fortaleza: string | null;
  last_event_id: string | null;
  updated_at: string;
  events_considered: number;
  notes_considered: number;
};

export const Route = createFileRoute("/equipo/$sellerId")({
  head: () => ({ meta: [{ title: "Vendedor — Closer" }] }),
  component: SellerDetailPage,
});

type Seller = {
  id: string;
  full_name: string | null;
  current_world: number;
  current_node: string;
  streak_days: number;
  audio_consent: boolean;
  certified_at: string | null;
  company_id: string;
};

type EventRow = {
  id: string;
  created_at: string;
  node_id: string | null;
  audio_url: string | null;
  payload: any;
};

type SkillState = {
  skill_id: string;
  mastery_score: number;
  last_practiced_at: string | null;
  evidence_count: number;
  recurring_failures: Record<string, number>;
};

type Skill = { id: string; name: string; category: string; code: string };

type NodeInfo = { id: string; name: string; world_id: number };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function decay(mastery: number, lastAt: string | null): number {
  if (mastery == null) return 0;
  if (!lastAt) return mastery;
  const days = Math.max(0, Math.floor((Date.now() - new Date(lastAt).getTime()) / 86_400_000));
  const extra = Math.max(0, days - 7);
  return Math.max(0, +(mastery - 0.5 * extra).toFixed(2));
}

function SellerDetailPage() {
  const { sellerId } = useParams({ from: "/equipo/$sellerId" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [skillStates, setSkillStates] = useState<SkillState[]>([]);
  const [skills, setSkills] = useState<Record<string, Skill>>({});
  const [nodes, setNodes] = useState<Record<string, NodeInfo>>({});
  const [worlds, setWorlds] = useState<Record<number, string>>({});
  const [totalNodes, setTotalNodes] = useState(1);
  const [doneCount, setDoneCount] = useState(0);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [coachRec, setCoachRec] = useState<CoachRec | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = getStoredSupabaseSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, company_id")
        .eq("id", session.userId)
        .maybeSingle();
      if (!profile || profile.role !== "manager" || !profile.company_id) {
        if (!cancelled) { setDenied(true); setLoading(false); }
        return;
      }

      const { data: s } = await supabase
        .from("sellers")
        .select("id, full_name, current_world, current_node, streak_days, audio_consent, certified_at, company_id")
        .eq("id", sellerId)
        .maybeSingle();

      if (!s || s.company_id !== profile.company_id) {
        if (!cancelled) { setDenied(true); setLoading(false); }
        return;
      }

      const [evRes, skRes, allSkills, allNodes, allWorlds, progRes, recRes] = await Promise.all([
        supabase
          .from("seller_events")
          .select("id, created_at, node_id, audio_url, payload")
          .eq("seller_id", sellerId)
          .eq("event_type", "practice_session")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("seller_skill_state")
          .select("skill_id, mastery_score, last_practiced_at, evidence_count, recurring_failures")
          .eq("seller_id", sellerId),
        supabase.from("skills").select("id, name, category, code"),
        supabase.from("nodes").select("id, name, world_id"),
        supabase.from("worlds").select("id, name"),
        supabase.from("node_progress").select("status").eq("seller_id", sellerId).eq("status", "done"),
        supabase
          .from("coach_recommendations")
          .select("prioridad, plan, fortaleza, last_event_id, updated_at, events_considered, notes_considered")
          .eq("seller_id", sellerId).maybeSingle(),
      ]);

      const skMap: Record<string, Skill> = {};
      for (const sk of (allSkills.data ?? []) as Skill[]) skMap[sk.id] = sk;
      const nMap: Record<string, NodeInfo> = {};
      for (const n of (allNodes.data ?? []) as NodeInfo[]) nMap[n.id] = n;
      const wMap: Record<number, string> = {};
      for (const w of (allWorlds.data ?? []) as { id: number; name: string }[]) wMap[w.id] = w.name;

      if (!cancelled) {
        setSeller(s as Seller);
        setEvents((evRes.data ?? []) as EventRow[]);
        setSkillStates((skRes.data ?? []) as SkillState[]);
        setSkills(skMap);
        setNodes(nMap);
        setWorlds(wMap);
        setTotalNodes(Math.max(1, (allNodes.data ?? []).length));
        setDoneCount((progRes.data ?? []).length);
        if (recRes.data) {
          const r: any = recRes.data;
          setCoachRec({
            prioridad: r.prioridad,
            plan: Array.isArray(r.plan) ? r.plan : [],
            fortaleza: r.fortaleza,
            last_event_id: r.last_event_id,
            updated_at: r.updated_at,
            events_considered: r.events_considered ?? 0,
            notes_considered: r.notes_considered ?? 0,
          });
        }
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sellerId, navigate]);

  const skillsByCategory = useMemo(() => {
    const grouped: Record<string, Array<{ id: string; name: string; current: number; failures: Record<string, number> }>> = {};
    for (const st of skillStates) {
      const sk = skills[st.skill_id];
      if (!sk) continue;
      const current = decay(Number(st.mastery_score), st.last_practiced_at);
      (grouped[sk.category] ??= []).push({ id: st.skill_id, name: sk.name, current, failures: st.recurring_failures ?? {} });
    }
    for (const c of Object.keys(grouped)) grouped[c].sort((a, b) => b.current - a.current);
    return grouped;
  }, [skillStates, skills]);

  const topStrong = useMemo(() => {
    const all = Object.values(skillsByCategory).flat();
    return [...all].sort((a, b) => b.current - a.current).slice(0, 3);
  }, [skillsByCategory]);
  const topWeak = useMemo(() => {
    const all = Object.values(skillsByCategory).flat();
    return [...all].sort((a, b) => a.current - b.current).slice(0, 3);
  }, [skillsByCategory]);

  const failureCounts = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const st of skillStates) {
      for (const [flag, n] of Object.entries(st.recurring_failures ?? {})) {
        totals[flag] = (totals[flag] ?? 0) + (n as number);
      }
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [skillStates]);

  async function loadAudio(evId: string, url: string) {
    if (audioUrls[evId]) return;
    if (url.startsWith("http")) {
      setAudioUrls((prev) => ({ ...prev, [evId]: url }));
      return;
    }
    const { data, error } = await supabase.storage
      .from("practice-audio")
      .createSignedUrl(url, 3600);
    if (data?.signedUrl) {
      setAudioUrls((prev) => ({ ...prev, [evId]: data.signedUrl }));
    } else {
      console.warn("[practice-audio] signed url error", error);
      setAudioUrls((prev) => ({ ...prev, [evId]: "__error__" }));
    }
  }

  const latestEventId = events[0]?.id ?? null;
  const hasNewEvents = !!latestEventId && coachRec?.last_event_id !== latestEventId;
  const canGenerate = events.length > 0;

  async function regenerateCoach() {
    setCoachLoading(true);
    setCoachError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const resp = await fetch(
        `https://ydkvssqmaawnbxsdfxss.supabase.co/functions/v1/coach-recommendation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ seller_id: sellerId, force: !hasNewEvents }),
        },
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.message ?? json?.error ?? "Error");
      const r = json.recommendation;
      setCoachRec({
        prioridad: r.prioridad,
        plan: Array.isArray(r.plan) ? r.plan : [],
        fortaleza: r.fortaleza,
        last_event_id: r.last_event_id,
        updated_at: r.updated_at,
        events_considered: r.events_considered ?? 0,
        notes_considered: r.notes_considered ?? 0,
      });
    } catch (e: any) {
      setCoachError(String(e?.message ?? e));
    } finally {
      setCoachLoading(false);
    }
  }



  if (loading) {
    return <div className="min-h-screen bg-[#08080F] text-white grid place-items-center"><div className="text-white/60 font-['DM_Sans']">Cargando…</div></div>;
  }
  if (denied || !seller) {
    return (
      <div className="min-h-screen bg-[#08080F] text-white grid place-items-center px-6 text-center">
        <div>
          <div className="font-['Syne'] text-2xl font-bold mb-2">Sin acceso</div>
          <div className="text-white/60 font-['DM_Sans'] mb-4">Este vendedor no pertenece a tu empresa o no tienes rol de manager.</div>
          <Button onClick={() => navigate({ to: "/equipo" })} className="bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px]">
            Volver al equipo
          </Button>
        </div>
      </div>
    );
  }

  const currentNodeInfo = nodes[seller.current_node];
  const pctMap = Math.round((doneCount / totalNodes) * 100);

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <AppHeader title="Vendedor" back={{ to: "/equipo", label: "Volver a equipo" }} />
      <div className="mx-auto w-full max-w-[720px] px-5 pt-2 pb-24">
        <Link to="/equipo" className="text-white/60 hover:text-white sm:hidden flex items-center gap-2 text-sm font-['DM_Sans'] mb-4">
          <ArrowLeft className="h-4 w-4" /> Equipo
        </Link>

        {/* Header */}
        <section className="rounded-[14px] border border-white/10 bg-white/[0.03] p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-white/10 font-['Syne'] font-black text-xl shrink-0">
              {(seller.full_name ?? "?").trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-['Syne'] text-2xl font-black truncate">{seller.full_name ?? "Sin nombre"}</h1>
                {seller.certified_at && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FF6B2B]/20 text-[#FF6B2B] text-xs px-2 py-0.5 font-['DM_Sans']">
                    <Trophy className="h-3 w-3" /> Certificado Closer
                  </span>
                )}
              </div>
              <div className="text-white/60 text-sm font-['DM_Sans'] mt-1">
                M{seller.current_world} · {worlds[seller.current_world] ?? "—"} · {seller.current_node} {currentNodeInfo ? `— ${currentNodeInfo.name}` : ""}
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm font-['DM_Sans']">
                <span className="text-white/70">{pctMap}% del mapa</span>
                <span className="inline-flex items-center gap-1 text-white/70">
                  <Flame className="h-4 w-4 text-[#FF6B2B]" /> {seller.streak_days} d
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Coaching AI */}
        <section className="rounded-[14px] border border-[#FF6B2B]/30 bg-gradient-to-br from-[#FF6B2B]/10 to-white/[0.02] p-5 mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#FF6B2B]" />
              <div className="text-xs uppercase tracking-widest text-[#FF6B2B] font-['DM_Sans'] font-bold">Recomendación de coaching</div>
            </div>
            {coachRec ? (
              <button
                onClick={regenerateCoach}
                disabled={coachLoading || !hasNewEvents}
                title={!hasNewEvents ? "Sin prácticas nuevas" : "Regenerar con las prácticas nuevas"}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-['DM_Sans'] text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-3 w-3 ${coachLoading ? "animate-spin" : ""}`} />
                Actualizar análisis
              </button>
            ) : canGenerate ? (
              <button
                onClick={regenerateCoach}
                disabled={coachLoading}
                className="inline-flex items-center gap-1 rounded-full bg-[#FF6B2B] hover:bg-[#ff7a42] px-3 py-1 text-xs font-['DM_Sans'] font-bold text-white disabled:opacity-60"
              >
                <Sparkles className="h-3 w-3" />
                {coachLoading ? "Generando…" : "Generar"}
              </button>
            ) : null}
          </div>

          {coachError && (
            <div className="text-red-300 text-xs font-['DM_Sans'] mb-2">{coachError}</div>
          )}

          {coachRec ? (
            <div className="flex flex-col gap-3">
              <div className="font-['Syne'] font-bold text-lg leading-snug">{coachRec.prioridad}</div>
              {coachRec.plan.length > 0 && (
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/40 font-['DM_Sans'] mb-1.5">Plan de campo</div>
                  <ol className="flex flex-col gap-1.5 list-decimal list-inside marker:text-[#FF6B2B]">
                    {coachRec.plan.map((step, i) => (
                      <li key={i} className="text-sm font-['DM_Sans'] text-white/85">{step}</li>
                    ))}
                  </ol>
                </div>
              )}
              {coachRec.fortaleza && (
                <div className="rounded-[10px] border border-green-500/20 bg-green-500/5 p-3">
                  <div className="text-[10px] uppercase tracking-widest text-green-300/80 font-['DM_Sans'] mb-0.5">Conserva</div>
                  <div className="text-sm font-['DM_Sans'] text-white/85">{coachRec.fortaleza}</div>
                </div>
              )}
              <div className="text-[10px] text-white/40 font-['DM_Sans']">
                {new Date(coachRec.updated_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })} · {coachRec.events_considered} prácticas · {coachRec.notes_considered} notas
              </div>
            </div>
          ) : (
            <div className="font-['DM_Sans'] text-white/70 text-sm">
              {canGenerate
                ? "Genera un análisis con las prácticas registradas."
                : "Se genera con las próximas prácticas."}
            </div>
          )}
        </section>


        {/* Historial */}
        <section className="mb-6">
          <h2 className="font-['Syne'] text-xl font-bold mb-3">Historial de prácticas</h2>
          {events.length === 0 ? (
            <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-6 text-white/60 font-['DM_Sans'] text-center">
              Sin prácticas registradas todavía.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {events.map((ev) => (
                <EventItem
                  key={ev.id}
                  ev={ev}
                  nodeName={ev.node_id ? nodes[ev.node_id]?.name ?? null : null}
                  audioConsent={seller.audio_consent}
                  audioUrl={audioUrls[ev.id] ?? null}
                  onNeedAudio={loadAudio}
                />
              ))}
            </div>
          )}
        </section>

        {/* Skills */}
        <section className="mb-6">
          <h2 className="font-['Syne'] text-xl font-bold mb-3">Estado de skills</h2>
          {skillStates.length === 0 ? (
            <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-6 text-white/60 font-['DM_Sans'] text-center">
              Aún no hay evidencia de skills.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <SkillList title="Top fuertes" items={topStrong} tone="strong" />
                <SkillList title="Top débiles" items={topWeak} tone="weak" />
              </div>

              {failureCounts.length > 0 && (
                <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4 mb-4">
                  <div className="text-xs uppercase tracking-widest text-white/40 font-['DM_Sans'] mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Fallas recurrentes
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {failureCounts.map(([flag, n]) => (
                      <span key={flag} className="rounded-full bg-red-500/10 text-red-300 border border-red-500/20 text-xs px-2 py-1 font-['DM_Sans']">
                        {flag} <span className="text-red-400/80">×{n}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {Object.entries(skillsByCategory).sort(([a],[b]) => a.localeCompare(b)).map(([cat, items]) => (
                  <div key={cat} className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="text-xs uppercase tracking-widest text-white/40 font-['DM_Sans'] mb-2">{cat}</div>
                    <div className="flex flex-col gap-1.5">
                      {items.map((s) => <SkillBar key={s.id} name={s.name} value={s.current} />)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function SkillList({ title, items, tone }: { title: string; items: Array<{ id: string; name: string; current: number }>; tone: "strong" | "weak" }) {
  const color = tone === "strong" ? "text-green-300" : "text-orange-300";
  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-widest text-white/40 font-['DM_Sans'] mb-2">{title}</div>
      <div className="flex flex-col gap-1">
        {items.map((s) => (
          <div key={s.id} className="flex items-center justify-between text-sm font-['DM_Sans']">
            <span className="truncate mr-2">{s.name}</span>
            <span className={`font-['Syne'] font-bold ${color}`}>{Math.round(s.current)}</span>
          </div>
        ))}
        {items.length === 0 && <div className="text-white/40 text-sm">—</div>}
      </div>
    </div>
  );
}

function SkillBar({ name, value }: { name: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-[#FF6B2B]" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-['DM_Sans'] text-white/70 mb-1">
        <span className="truncate mr-2">{name}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EventItem({
  ev, nodeName, audioConsent, audioUrl, onNeedAudio,
}: {
  ev: EventRow;
  nodeName: string | null;
  audioConsent: boolean;
  audioUrl: string | null;
  onNeedAudio: (id: string, url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const score = typeof ev.payload?.score === "number" ? ev.payload.score : null;
  const stars = typeof ev.payload?.stars === "number" ? ev.payload.stars : 0;
  const evalBlock = ev.payload?.evaluation ?? {};
  const rawTranscript = ev.payload?.transcript;
  const transcriptTurns: Array<{ role: string; text: string }> = Array.isArray(rawTranscript)
    ? rawTranscript.map((t: any) => ({
        role: String(t?.role ?? t?.speaker ?? "—"),
        text: String(t?.text ?? t?.content ?? t?.message ?? ""),
      })).filter((t) => t.text.length > 0)
    : typeof rawTranscript === "string" && rawTranscript.trim().length > 0
      ? [{ role: "transcript", text: rawTranscript }]
      : [];
  const criteriosCumplidos: string[] = Array.isArray(evalBlock.criterios_cumplidos) ? evalBlock.criterios_cumplidos : [];
  const observations: any[] = Array.isArray(evalBlock.observations) ? evalBlock.observations : [];
  const flags: string[] = Array.isArray(evalBlock.flags_detected) ? evalBlock.flags_detected : [];
  const mision: string | null = typeof evalBlock.mision === "string" ? evalBlock.mision : null;


  return (
    <div className="rounded-[14px] border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (!open && audioConsent && ev.audio_url) onNeedAudio(ev.id, ev.audio_url);
        }}
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-white/[0.02]"
      >
        <div className="min-w-0 flex-1">
          <div className="font-['DM_Sans'] font-medium truncate">
            {ev.node_id ?? "—"} {nodeName ? `· ${nodeName}` : ""}
          </div>
          <div className="text-xs text-white/50 font-['DM_Sans']">{fmtDate(ev.created_at)}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="font-['Syne'] font-bold text-lg">{score ?? "—"}</div>
          <div className="flex">
            {[1, 2, 3].map((i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i <= stars ? "text-[#FF6B2B] fill-[#FF6B2B]" : "text-white/20"}`} />
            ))}
          </div>
          {open ? <ChevronDown className="h-4 w-4 text-white/40" /> : <ChevronRight className="h-4 w-4 text-white/40" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 p-4 flex flex-col gap-4 text-sm font-['DM_Sans']">
          {audioConsent && ev.audio_url && (
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Audio</div>
              {audioUrl === "__error__" ? (
                <div className="text-red-300 text-xs">No se pudo cargar el audio.</div>
              ) : audioUrl ? (
                <audio controls src={audioUrl} className="w-full" />
              ) : (
                <div className="text-white/50 text-xs">Cargando audio…</div>
              )}
            </div>
          )}

          {transcriptTurns.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Transcript</div>
              <div className="bg-black/30 rounded-[10px] p-3 max-h-64 overflow-auto flex flex-col gap-2">
                {transcriptTurns.map((t, i) => {
                  const isSeller = /vend|seller|closer|user|me/i.test(t.role);
                  return (
                    <div key={i} className="text-xs">
                      <div className={`uppercase tracking-widest text-[10px] mb-0.5 ${isSeller ? "text-[#FF6B2B]" : "text-white/40"}`}>
                        {t.role}
                      </div>
                      <div className="text-white/80 whitespace-pre-wrap">{t.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {criteriosCumplidos.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Criterios cumplidos</div>
              <div className="flex flex-wrap gap-1.5">
                {criteriosCumplidos.map((c) => (
                  <span key={c} className="rounded-full bg-green-500/10 text-green-300 border border-green-500/20 text-xs px-2 py-0.5">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {observations.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40 mb-2">Observaciones</div>
              <div className="flex flex-col gap-2">
                {observations.map((o, i) => (
                  <div key={i} className="rounded-[10px] border border-white/10 p-3 bg-black/20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white/70">{o.criterio_id ?? "—"}</span>
                      {o.severity && (
                        <span className="text-[10px] uppercase tracking-widest text-white/40">{o.severity}</span>
                      )}
                    </div>
                    {o.error && <div className="text-white/80 text-xs mb-1"><b className="text-red-300">Qué pasó:</b> {o.error}</div>}
                    {o.mejora && <div className="text-white/80 text-xs mb-1"><b className="text-[#FF6B2B]">Mejora:</b> {o.mejora}</div>}
                    {o.ejemplo && <div className="text-white/70 text-xs italic">Ejemplo: {o.ejemplo}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {flags.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Flags</div>
              <div className="flex flex-wrap gap-1.5">
                {flags.map((f) => (
                  <span key={f} className="rounded-full bg-red-500/10 text-red-300 border border-red-500/20 text-xs px-2 py-0.5">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {mision && (
            <div>
              <div className="text-xs uppercase tracking-widest text-white/40 mb-1">Misión</div>
              <div className="text-white/80 text-xs bg-[#FF6B2B]/10 border border-[#FF6B2B]/20 rounded-[10px] p-3">{mision}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
