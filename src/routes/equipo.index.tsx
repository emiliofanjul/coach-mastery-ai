import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app/AppShell";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { restGet, restGetMaybeSingle } from "@/lib/supabase-rest";

export const Route = createFileRoute("/equipo/")({
  head: () => ({ meta: [{ title: "Equipo — Closer" }] }),
  component: EquipoPage,
});

type SellerRow = {
  id: string;
  full_name: string | null;
  current_world: number;
  current_node: string;
  streak_days: number;
  last_practice_date: string | null;
  certified_at: string | null;
};

type ProgressAgg = { seller_id: string; done: number };
type NodeInfo = { id: string; name: string; world_id: number };

type LastEvent = { seller_id: string; created_at: string; score: number | null };

type Card = {
  seller: SellerRow;
  nodeName: string | null;
  worldName: string | null;
  pctMap: number;
  lastPracticeAt: string | null;
  avgScore: number | null;
  attention: "red" | "orange" | null;
};

function relTime(iso: string | null): string {
  if (!iso) return "nunca";
  const d = new Date(iso).getTime();
  const diffMs = Date.now() - d;
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} d`;
  if (days < 30) return `hace ${Math.floor(days / 7)} sem`;
  return `hace ${Math.floor(days / 30)} m`;
}

function initial(name: string | null): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase();
}

function EquipoPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = getStoredSupabaseSession();
      if (!session) {
        navigate({ to: "/login" });
        return;
      }
      const profile = await restGetMaybeSingle<{ role: string; company_id: string | null }>(
        `profiles?select=role,company_id&id=eq.${session.userId}&limit=1`,
      );

      if (!profile || profile.role !== "manager" || !profile.company_id) {
        if (!cancelled) {
          setDenied(true);
          setLoading(false);
        }
        return;
      }

      const [sellers, nodes, worlds] = await Promise.all([
        restGet<SellerRow>(
          `sellers?select=id,full_name,current_world,current_node,streak_days,last_practice_date,certified_at&company_id=eq.${profile.company_id}&is_active=eq.true`,
        ),
        restGet<NodeInfo>(`nodes?select=id,name,world_id`),
        restGet<{ id: number; name: string }>(`worlds?select=id,name`),
      ]);

      const nodeById = new Map(nodes.map((n) => [n.id, n]));
      const worldById = new Map(worlds.map((w) => [w.id, w.name]));
      const totalNodes = nodes.length || 1;

      const sellerIds = sellers.map((s) => s.id);

      let progressAgg: ProgressAgg[] = [];
      let recentEvents: { seller_id: string; created_at: string; payload: any }[] = [];
      if (sellerIds.length > 0) {
        const inList = `(${sellerIds.map((id) => `"${id}"`).join(",")})`;
        const [progRows, evRows] = await Promise.all([
          restGet<{ seller_id: string; status: string }>(
            `node_progress?select=seller_id,status&seller_id=in.${inList}&status=eq.done`,
          ),
          restGet<{ seller_id: string; created_at: string; payload: any }>(
            `seller_events?select=seller_id,created_at,payload&seller_id=in.${inList}&event_type=eq.practice_session&order=created_at.desc&limit=500`,
          ),
        ]);
        const grouped = new Map<string, number>();
        for (const r of progRows) grouped.set(r.seller_id, (grouped.get(r.seller_id) ?? 0) + 1);
        progressAgg = [...grouped.entries()].map(([seller_id, done]) => ({ seller_id, done }));
        recentEvents = evRows;
      }

      const doneBySeller = new Map(progressAgg.map((p) => [p.seller_id, p.done]));

      const evBySeller = new Map<string, { score: number | null; created_at: string }[]>();
      for (const e of recentEvents) {
        const arr = evBySeller.get(e.seller_id) ?? [];
        const s = typeof e?.payload?.score === "number" ? e.payload.score : null;
        arr.push({ score: s, created_at: e.created_at });
        evBySeller.set(e.seller_id, arr);
      }

      const built: Card[] = sellers.map((s) => {
        const events = evBySeller.get(s.id) ?? [];
        const last5 = events.slice(0, 5).map((e) => e.score).filter((x): x is number => x != null);
        const avg = last5.length ? Math.round(last5.reduce((a, b) => a + b, 0) / last5.length) : null;
        const lastPracticeAt = events[0]?.created_at ?? null;
        const node = nodeById.get(s.current_node);
        const daysSince = lastPracticeAt
          ? Math.floor((Date.now() - new Date(lastPracticeAt).getTime()) / 86_400_000)
          : 9999;
        const attention: Card["attention"] = daysSince >= 14 ? "red" : daysSince >= 7 ? "orange" : null;
        return {
          seller: s,
          nodeName: node?.name ?? null,
          worldName: worldById.get(s.current_world) ?? null,
          pctMap: Math.round(((doneBySeller.get(s.id) ?? 0) / totalNodes) * 100),
          lastPracticeAt,
          avgScore: avg,
          attention,
        };
      });

      built.sort((a, b) => {
        const rank = (c: Card) => (c.attention === "red" ? 0 : c.attention === "orange" ? 1 : 2);
        const r = rank(a) - rank(b);
        if (r !== 0) return r;
        const at = a.lastPracticeAt ? new Date(a.lastPracticeAt).getTime() : 0;
        const bt = b.lastPracticeAt ? new Date(b.lastPracticeAt).getTime() : 0;
        return bt - at;
      });

      if (!cancelled) {
        setCards(built);
        setLoading(false);
      }
    })().catch((e) => {
      console.error("[equipo] load failed", e);
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080F] text-white flex items-center justify-center">
        <div className="text-white/60 font-['DM_Sans']">Cargando equipo…</div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="min-h-screen bg-[#08080F] text-white flex flex-col items-center justify-center px-6 gap-4 text-center">
        <div className="font-['Syne'] text-2xl font-bold">Solo para managers</div>
        <div className="text-white/60 font-['DM_Sans'] max-w-sm">
          Esta sección es del panel del manager. Tu cuenta no tiene ese rol.
        </div>
        <Button onClick={() => navigate({ to: "/mapa" })} className="bg-[#FF6B2B] hover:bg-[#ff7a42] rounded-[99px]">
          Ir al mapa
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <AppHeader
        title="Mi Equipo"
        subtitle={`${cards.length} vendedor${cards.length === 1 ? "" : "es"}`}
        rightExtras={
          <span className="hidden sm:inline-flex items-center gap-1.5 text-white/60 text-xs font-['DM_Sans']">
            <Users className="h-3.5 w-3.5" /> {cards.length}
          </span>
        }
      />
      <div className="mx-auto w-full max-w-[960px] px-5 pt-2 pb-24">
        <h1 className="font-['Syne'] text-3xl font-black tracking-tight mb-1">Tu equipo</h1>
        <p className="text-white/60 font-['DM_Sans'] mb-6">
          Ordenado por atención requerida y última práctica.
        </p>

        {cards.length === 0 ? (
          <div className="rounded-[14px] border border-white/10 bg-white/[0.03] p-8 text-center text-white/60 font-['DM_Sans']">
            Aún no hay vendedores en tu empresa. Genera un código de invitación desde onboarding.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((c) => (
              <SellerCard key={c.seller.id} card={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SellerCard({ card }: { card: Card }) {
  const { seller, nodeName, worldName, pctMap, lastPracticeAt, avgScore, attention } = card;
  const dot =
    attention === "red"
      ? "bg-red-500"
      : attention === "orange"
      ? "bg-[#FF6B2B]"
      : "bg-transparent";
  return (
    <Link
      to="/equipo/$sellerId"
      params={{ sellerId: seller.id }}
      className="group block rounded-[14px] border border-white/10 bg-white/[0.03] p-5 hover:border-white/25 hover:bg-white/[0.05] transition"
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-white/10 font-['Syne'] font-black text-lg">
            {initial(seller.full_name)}
          </div>
          {attention && (
            <span className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-[#08080F] ${dot}`} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-['Syne'] font-bold truncate">{seller.full_name ?? "Sin nombre"}</div>
            {seller.certified_at && (
              <span className="shrink-0 rounded-full bg-[#FF6B2B]/20 text-[#FF6B2B] text-[10px] px-2 py-0.5 font-['DM_Sans']">
                Certificado
              </span>
            )}
          </div>
          <div className="text-white/60 text-xs font-['DM_Sans'] mt-0.5 truncate">
            M{seller.current_world} · {worldName ?? "—"} · {seller.current_node} {nodeName ? `— ${nodeName}` : ""}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-white/30 shrink-0 mt-1 group-hover:text-white/70" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <Stat label="Mapa" value={`${pctMap}%`} />
        <Stat label="Últ. práctica" value={relTime(lastPracticeAt)} />
        <Stat label="Score prom." value={avgScore != null ? `${avgScore}` : "—"} />
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-white/[0.04] py-2">
      <div className="font-['Syne'] font-bold text-sm">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/40 font-['DM_Sans']">{label}</div>
    </div>
  );
}
