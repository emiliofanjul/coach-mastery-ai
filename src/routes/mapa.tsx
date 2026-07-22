import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Lock, Check, Star, Trophy, Play } from "lucide-react";
import { AppHeader } from "@/components/app/AppShell";
import { MapTutorial } from "@/components/closer/MapTutorial";
import { CoachBubble } from "@/components/closer/CoachBubble";
import { CloserCharacter } from "@/components/closer/CloserCharacter";
import { consumeNodeCompletionSignal, type NodeCompletionSignal } from "@/lib/node-completion";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [{ title: "Mapa — Closer" }],
  }),
  component: MapaPage,
});

// ───────────────────────── Types ─────────────────────────

type World = {
  id: number;
  name: string;
  emotional_name: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  order_index: number;
};

type NodeRow = {
  id: string;
  world_id: number;
  name: string;
  technique: string | null;
  order_index: number;
  is_boss: boolean;
  difficulty_level: number;
};

type ProgressRow = {
  node_id: string;
  status: string;
  consistency_score: number | null;
  stars: number | null;
};

type NodeStatus = "completed" | "active" | "available" | "locked";

type DisplayNode = NodeRow & {
  status: NodeStatus;
  score: number | null;
  stars: number;
};

// Regla genérica basada en datos:
// - Mundo 0 siempre desbloqueado.
// - Mundo N+1 se desbloquea cuando el boss (is_boss=true) del mundo N
//   está en node_progress con status='done'.
// - Si un mundo no tuviera boss, se desbloquea el siguiente al completar
//   TODOS sus nodos (fallback de robustez — no debería usarse en prod).
function computeUnlockedWorlds(
  worlds: World[],
  nodes: NodeRow[],
  progress: Record<string, ProgressRow>,
): Set<number> {
  const unlocked = new Set<number>();
  const sortedWorlds = [...worlds].sort((a, b) => a.order_index - b.order_index);
  if (sortedWorlds.length === 0) return unlocked;
  unlocked.add(sortedWorlds[0].id);
  for (let i = 0; i < sortedWorlds.length - 1; i++) {
    const w = sortedWorlds[i];
    if (!unlocked.has(w.id)) break;
    const worldNodes = nodes.filter((n) => n.world_id === w.id);
    if (worldNodes.length === 0) break;
    const bosses = worldNodes.filter((n) => n.is_boss);
    const cleared = bosses.length > 0
      ? bosses.every((b) => progress[b.id]?.status === "done")
      : worldNodes.every((n) => progress[n.id]?.status === "done");
    if (cleared) unlocked.add(sortedWorlds[i + 1].id);
    else break;
  }
  return unlocked;
}
const NODE_RADIUS = 28; // 56 px
const BOSS_RADIUS = 36; // 72 px
const MAP_WIDTH = 320;
const ROW_HEIGHT = 110;
const PADDING_TOP = 32;

// zigzag horizontal positions: izq, centro, der, centro, izq, centro, der...
const X_PATTERN = [0.18, 0.5, 0.82, 0.5];

function xForIndex(i: number) {
  return X_PATTERN[i % X_PATTERN.length] * MAP_WIDTH;
}

// Y invertida: nodo 0 abajo, último nodo arriba.
// total = número de nodos del mundo, i = índice (0 = primero).
function yForIndex(i: number, total: number) {
  return PADDING_TOP + (total - 1 - i) * ROW_HEIGHT;
}

// ───────────────────────── Page ─────────────────────────

function MapaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [nodes, setNodes] = useState<NodeRow[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const [seller, setSeller] = useState<{
    id: string;
    current_world: number;
    current_node: string;
    map_tutorial_completed?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<DisplayNode | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [unlockNotice, setUnlockNotice] = useState<World | null>(null);
  const prevBossCompletedRef = useRef<Set<number> | null>(null);
  const mundo0Ref = useRef<HTMLDivElement | null>(null);
  const [glowActive, setGlowActive] = useState(false);
  const [isManager, setIsManager] = useState(false);

  // ─── Animación al regresar del quiz ───
  // phase 0: nada todavía. 1: 1ª estrella. 2: 2ª. 3: 3ª. 4: candado fuera. 5: nuevo nodo activo visible.
  const [animSignal, setAnimSignal] = useState<NodeCompletionSignal | null>(null);
  const [animPhase, setAnimPhase] = useState(0);
  const [animNextNodeId, setAnimNextNodeId] = useState<string | null>(null);

  // Smooth scroll con duración custom hasta el nodo activo
  const scrollToActiveNode = (duration: number) => {
    const el = document.querySelector<HTMLElement>("[data-active-node]");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const targetY =
      window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startT = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const t = Math.min(1, (now - startT) / duration);
      window.scrollTo(0, startY + diff * ease(t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
      const { data: auth } = await supabase.auth.getSession();
      const userId = auth.session?.user?.id;
      if (!userId) {
        navigate({ to: "/login", replace: true });
        if (alive) setLoading(false);
        return;
      }

      const [{ data: w }, { data: n }, { data: s }] = await Promise.all([
        supabase.from("worlds").select("*").order("order_index"),
        supabase.from("nodes").select("*").order("order_index"),
        supabase
          .from("sellers")
          .select("id, current_world, current_node, map_tutorial_completed")
          .eq("profile_id", userId)
          .maybeSingle(),
      ]);

      if (!alive) return;

      setWorlds((w as World[]) ?? []);
      setNodes((n as NodeRow[]) ?? []);

      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (!alive) return;
      if (prof?.role === "manager") setIsManager(true);


      if (s) {
        if (!alive) return;
        setSeller(s as typeof seller);
        const { data: p } = await supabase
          .from("node_progress")
          .select("node_id, status, consistency_score, stars")
          .eq("seller_id", (s as { id: string }).id);
        if (!alive) return;
        const map: Record<string, ProgressRow> = {};
        (p as ProgressRow[] | null)?.forEach((r) => (map[r.node_id] = r));
        setProgress(map);
        if (!(s as { map_tutorial_completed?: boolean }).map_tutorial_completed) {
          // pequeño delay para que el mapa se renderice antes
          setTimeout(() => setShowTutorial(true), 600);
        }
      }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  // Scroll inicial al nodo activo (o secuencia de animación si venimos del quiz).
  const animConsumedRef = useRef(false);
  useEffect(() => {
    if (loading) return;
    if (nodes.length === 0) return; // esperar a que los nodos estén poblados
    if (animConsumedRef.current) return; // guardia anti doble-mount (StrictMode)
    animConsumedRef.current = true;
    const sig = consumeNodeCompletionSignal();
    if (!sig) {
      // No venimos del quiz — solo scroll inicial
      const t = setTimeout(() => scrollToActiveNode(500), 100);
      return () => clearTimeout(t);
    }
    {
      let nextId: string | null = null;
      const ordered = [...nodes].sort((a, b) =>
        a.world_id !== b.world_id
          ? a.world_id - b.world_id
          : a.order_index - b.order_index,
      );
      const idx = ordered.findIndex((n) => n.id === sig.nodeId);
      if (idx >= 0 && idx + 1 < ordered.length) nextId = ordered[idx + 1].id;
      setAnimSignal(sig);
      setAnimNextNodeId(nextId);
      setAnimPhase(0);
      const animateStars = !sig.isReplay || sig.improved;
      const timers: ReturnType<typeof setTimeout>[] = [];
      timers.push(
        setTimeout(() => {
          const el = document.querySelector<HTMLElement>(
            `[data-node-id="${sig.nodeId}"]`,
          );
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const targetY =
            window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;
          window.scrollTo({ top: targetY, behavior: "smooth" });
        }, 80),
      );
      // Fases:
      // 1=check bounce, 2=★1, 3=★2, 4=★3+shake, 5=línea, 6=candado shake-out, 7=siguiente nodo aparece
      if (animateStars) {
        timers.push(setTimeout(() => setAnimPhase(1), 500));   // ✓ bounce
        timers.push(setTimeout(() => setAnimPhase(2), 1200));  // ★1
        timers.push(setTimeout(() => setAnimPhase(3), 1700));  // ★2
        timers.push(setTimeout(() => setAnimPhase(4), 2200));  // ★3 + node shake
        timers.push(setTimeout(() => setAnimPhase(5), 2800));  // línea
        timers.push(setTimeout(() => setAnimPhase(6), 3600));  // candado fuera
        timers.push(setTimeout(() => setAnimPhase(7), 4000));  // siguiente nodo
      } else {
        timers.push(setTimeout(() => setAnimPhase(1), 300));
        timers.push(setTimeout(() => setAnimPhase(4), 600));
        timers.push(setTimeout(() => setAnimPhase(5), 1000));
        timers.push(setTimeout(() => setAnimPhase(6), 1600));
        timers.push(setTimeout(() => setAnimPhase(7), 2000));
      }
      const scrollAt = animateStars ? 4500 : 2400;
      timers.push(
        setTimeout(() => {
          if (!sig.isReplay) {
            const el = document.querySelector<HTMLElement>("[data-active-node]");
            if (el) {
              const rect = el.getBoundingClientRect();
              const targetY =
                window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;
              window.scrollTo({ top: targetY, behavior: "smooth" });
            }
          }
        }, scrollAt),
      );
      timers.push(
        setTimeout(() => {
          setAnimSignal(null);
          setAnimNextNodeId(null);
          setAnimPhase(0);
        }, scrollAt + 800),
      );
      return () => timers.forEach(clearTimeout);
    }
  }, [loading, nodes.length]);

  // Detectar boss completados nuevos → mostrar notificación de mundo desbloqueado.
  useEffect(() => {
    if (loading || worlds.length === 0 || nodes.length === 0) return;
    const bossCompleted = new Set<number>();
    nodes
      .filter((n) => n.is_boss)
      .forEach((n) => {
        if (progress[n.id]?.status === "done") bossCompleted.add(n.world_id);
      });
    const prev = prevBossCompletedRef.current;
    if (prev) {
      // Encuentra el primer mundo recién desbloqueado
      for (const wid of bossCompleted) {
        if (!prev.has(wid)) {
          const next = worlds.find((w) => w.id === wid + 1);
          if (next) {
            setUnlockNotice(next);
            setTimeout(() => setUnlockNotice(null), 3000);
          }
          break;
        }
      }
    }
    prevBossCompletedRef.current = bossCompleted;
  }, [progress, nodes, worlds, loading]);

  const handleTutorialClose = async () => {
    setShowTutorial(false);
    if (seller) {
      await supabase
        .from("sellers")
        .update({ map_tutorial_completed: true })
        .eq("id", seller.id);
    }
    // Scroll suave al nodo activo + glow pulse
    setTimeout(() => {
      scrollToActiveNode(600);
      setTimeout(() => {
        setGlowActive(true);
        setTimeout(() => setGlowActive(false), 1000);
      }, 600);
    }, 50);
  };

  // Mario Bros progression: estrictamente secuencial en orden global.
  // El primer nodo no completado = active. El siguiente = available (carrot). Resto = locked.
  const orderedNodes = [...nodes].sort((a, b) =>
    a.world_id !== b.world_id
      ? a.world_id - b.world_id
      : a.order_index - b.order_index,
  );
  const activeIdx = orderedNodes.findIndex(
    (n) => progress[n.id]?.status !== "done",
  );
  const activeId = activeIdx >= 0 ? orderedNodes[activeIdx].id : null;

  const computeStatus = (node: NodeRow): NodeStatus => {
    if (progress[node.id]?.status === "done") return "completed";
    if (node.id === activeId) return "active";
    return "locked";
  };

  if (loading) {
    return (
      <main style={shellStyle}>
        <div
          style={{
            color: "#5A5A8A",
            fontFamily: "'DM Sans', sans-serif",
            paddingTop: "40vh",
            textAlign: "center",
          }}
        >
          Cargando mapa…
        </div>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      {/* Header fijo */}
      <AppHeader
        title="MAPA"
        subtitle="Camino al Vendedor Elite"
        rightExtras={
          <button
            onClick={() => setShowTutorial(true)}
            className="rounded-full border border-[#FF6B2B]/40 bg-[#FF6B2B]/10 px-3 py-1.5 text-[0.7rem] font-['DM_Sans'] font-semibold text-[#FF6B2B] hover:bg-[#FF6B2B]/20 transition-colors whitespace-nowrap"
          >
            ¿Cómo funciona?
          </button>
        }
      />



      {/* Apilados de abajo hacia arriba: render reverso */}
      <div style={{ display: "flex", flexDirection: "column-reverse" }}>
        {(() => { const unlockedWorlds = computeUnlockedWorlds(worlds, nodes, progress); return worlds.map((world) => {
          const worldNodes = nodes
            .filter((n) => n.world_id === world.id)
            .sort((a, b) => a.order_index - b.order_index);
          const isUnlocked = unlockedWorlds.has(world.id);
          const isCurrent = world.id === 0; // anchor
          const sectionHeight =
            PADDING_TOP + worldNodes.length * ROW_HEIGHT + 40;

          // Mundos bloqueados: solo header + badge "Bloqueado". Sin contenedor de nodos.
          if (!isUnlocked) {
            return (
              <section
                key={world.id}
                ref={world.id === 1 ? mundo0Ref : undefined}
                data-tour={world.id === 1 ? "world-next" : undefined}
                style={{
                  position: "relative",
                  background: world.color ? `${world.color}14` : "transparent",
                  paddingBottom: 24,
                  borderTop: "1px solid #15151F",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <WorldHeader world={world} />
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 99,
                    background: "rgba(26,26,38,0.9)",
                    border: "1px solid #252535",
                    color: "#5A5A8A",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.75rem",
                  }}
                >
                  <Lock size={14} /> Bloqueado
                </div>
              </section>
            );
          }

          return (
            <section
              key={world.id}
              ref={isCurrent ? mundo0Ref : undefined}
              data-tour={world.id === 1 ? "world-next" : undefined}
              style={{
                position: "relative",
                background: world.color
                  ? `${world.color}14`
                  : "transparent",
                paddingBottom: 24,
                borderTop: "1px solid #15151F",
              }}
            >
              <WorldHeader world={world} />

              <div
                style={{
                  position: "relative",
                  width: MAP_WIDTH,
                  height: sectionHeight,
                  margin: "0 auto",
                }}
              >
                {/* Líneas SVG */}
                <svg
                  width={MAP_WIDTH}
                  height={sectionHeight}
                  style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                >
                  {worldNodes.map((node, i) => {
                    if (i === 0) return null;
                    const prev = worldNodes[i - 1];
                    const x1 = xForIndex(i - 1);
                    const y1 = yForIndex(i - 1, worldNodes.length);
                    const x2 = xForIndex(i);
                    const y2 = yForIndex(i, worldNodes.length);
                    const cx = (x1 + x2) / 2;
                    const path = `M ${x1} ${y1} Q ${cx} ${y1 + (y2 - y1) / 2} ${x2} ${y2}`;
                    const prevDone =
                      computeStatus(prev) === "completed" &&
                      computeStatus(node) !== "locked";
                    const isAnimLine =
                      !!animSignal &&
                      prev.id === animSignal.nodeId &&
                      node.id === animNextNodeId;
                    const showOrangeStatic = prevDone && !isAnimLine;
                    const showOrangeAnimated = isAnimLine && animPhase >= 5;
                    return (
                      <g key={`line-${node.id}`}>
                        <path
                          d={path}
                          stroke="#252535"
                          strokeWidth={3}
                          fill="none"
                          strokeLinecap="round"
                        />
                        {showOrangeStatic && (
                          <path
                            d={path}
                            stroke="rgba(255,107,43,0.6)"
                            strokeWidth={3}
                            fill="none"
                            strokeLinecap="round"
                          />
                        )}
                        {showOrangeAnimated && (
                          <path
                            d={path}
                            stroke="rgba(255,107,43,0.85)"
                            strokeWidth={3}
                            fill="none"
                            strokeLinecap="round"
                            style={{
                              strokeDasharray: 260,
                              strokeDashoffset: 260,
                              animation: "lineDraw 0.8s ease-in-out forwards",
                            }}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Nodos */}
                {worldNodes.map((node, i) => {
                  const status = computeStatus(node);
                  const x = xForIndex(i);
                  const y = yForIndex(i, worldNodes.length);
                  const r = node.is_boss ? BOSS_RADIUS : NODE_RADIUS;
                  let tour: string | undefined;
                  if (world.id === 0) {
                    if (node.is_boss) tour = "boss-node";
                    else if (status === "active") tour = "active-node";
                    else if (status === "locked" || status === "available")
                      tour = tour ?? "locked-node";
                  }
                  return (
                    <div
                      key={node.id}
                      data-node-id={node.id}
                      data-tour={tour}
                      data-active-node={status === "active" ? "true" : undefined}
                      style={{
                        position: "absolute",
                        left: x - r,
                        top: y - r,
                        width: r * 2,
                        height: r * 2 + 28,
                        borderRadius: "50%",
                        animation:
                          status === "active" && glowActive
                            ? "glowPulse 1s ease-out"
                            : undefined,
                      }}
                    >
                      <MapNode
                        node={node}
                        status={status}
                        stars={(progress[node.id]?.stars as number | null) ?? 0}
                        animationPhase={animPhase}
                        isJustCompleted={animSignal?.nodeId === node.id}
                        isNewlyActive={animNextNodeId === node.id}
                        onClick={() =>
                          setSelectedNode({
                            ...node,
                            status,
                            score: progress[node.id]?.consistency_score ?? null,
                            stars: (progress[node.id]?.stars as number | null) ?? 0,
                          })
                        }
                      />
                    </div>
                  );
                })}

              </div>
            </section>
          );
        }); })()}
      </div>

      <NodeSheet
        node={selectedNode}
        onOpenChange={(o) => !o && setSelectedNode(null)}
      />

      <CoachBubble context="mapa" />

      <MapTutorial open={showTutorial} onClose={handleTutorialClose} />

      {unlockNotice && (
        <div
          style={{
            position: "fixed",
            top: 80,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            background: "#1A1A26",
            borderLeft: "3px solid #FF6B2B",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: 340,
            width: "calc(100vw - 32px)",
            boxShadow: "0 12px 32px -8px rgba(0,0,0,0.6)",
            animation: "unlockFade 3s ease-in-out forwards",
          }}
        >
          <CloserCharacter state="celebration" size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: "0.85rem",
                color: "#FFFFFF",
                marginBottom: 2,
              }}
            >
              {unlockNotice.name} desbloqueado
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.72rem",
                color: "#9090B0",
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {unlockNotice.description?.split(".")[0] ?? ""}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseOrange {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,107,43,0.55); }
          50% { box-shadow: 0 0 0 12px rgba(255,107,43,0); }
        }
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,209,102,0.55); }
          50% { box-shadow: 0 0 0 14px rgba(255,209,102,0); }
        }
        @keyframes unlockFade {
          0% { opacity: 0; transform: translate(-50%, -8px); }
          15%, 85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -8px); }
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 0 0 rgba(255,107,43,0.85), 0 0 24px 8px rgba(255,107,43,0.6); }
          100% { box-shadow: 0 0 0 24px rgba(255,107,43,0), 0 0 0 0 rgba(255,107,43,0); }
        }
        @keyframes checkBounce {
          0% { transform: scale(0); }
          60% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes starPop {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes nodeShake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-3px); }
          30% { transform: translateX(3px); }
          45% { transform: translateX(-3px); }
          60% { transform: translateX(3px); }
          75% { transform: translateX(-2px); }
        }
        @keyframes lineDraw {
          from { stroke-dashoffset: 260; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes lockShakeOut {
          0% { transform: rotate(0); opacity: 1; }
          25% { transform: rotate(-10deg); opacity: 1; }
          75% { transform: rotate(10deg); opacity: 0.5; }
          100% { transform: rotate(0); opacity: 0; }
        }
        @keyframes nodeScaleIn {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes nextNodeGlow {
          0% { box-shadow: 0 0 0 0 rgba(255,107,43,0); }
          50% { box-shadow: 0 0 24px 8px rgba(255,107,43,0.7); }
          100% { box-shadow: 0 0 0 0 rgba(255,107,43,0.4); }
        }
      `}</style>
    </main>
  );
}

// ───────────────────────── World Header ─────────────────────────

function WorldHeader({ world }: { world: World }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "1.4rem 1.2rem 0.6rem",
      }}
    >
      <div style={{ fontSize: "2rem", lineHeight: 1 }}>{world.icon ?? "•"}</div>
      <div
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: "1rem",
          color: world.color ?? "#FFFFFF",
          marginTop: 6,
        }}
      >
        {world.name}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          fontSize: "0.7rem",
          color: "#5A5A8A",
          marginTop: 2,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Mundo {world.id}
      </div>
      {world.description && (
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: "0.78rem",
            color: "#5A5A8A",
            marginTop: 8,
            lineHeight: 1.35,
            maxWidth: 320,
            marginLeft: "auto",
            marginRight: "auto",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {world.description}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Node ─────────────────────────

function MapNode({
  node,
  status,
  stars,
  animationPhase,
  isJustCompleted,
  isNewlyActive,
  onClick,
}: {
  node: NodeRow;
  status: NodeStatus;
  stars: number;
  animationPhase: number;
  isJustCompleted: boolean;
  isNewlyActive: boolean;
  onClick: () => void;
}) {
  const isBoss = node.is_boss;
  const size = isBoss ? 72 : 56;

  // Animación del nodo siguiente:
  // phase < 6 → candado visible; phase === 6 → lockShakeOut; phase >= 7 → nodo aparece con scale-bounce + glow
  const animatingNext = isNewlyActive && status === "active";
  const showLockOnNext = animatingNext && animationPhase < 6;
  const lockShakingOut = animatingNext && animationPhase === 6;
  const nextNodeAppearing = animatingNext && animationPhase >= 7;

  // Animación del nodo recién completado:
  // phase >= 1 → check con bounce; phase === 4 → vibración del nodo
  const justCompletedAnim = isJustCompleted && status === "completed";
  const completedShake = justCompletedAnim && animationPhase === 4;

  const styles: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: status === "locked" ? "not-allowed" : "pointer",
    transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
    border: "2px solid",
  };

  if (isBoss) {
    styles.borderColor = "#FFD166";
    if (status === "active") {
      styles.background = "linear-gradient(135deg,#FF6B2B,#FFD166)";
      styles.animation = "pulseGold 1.6s ease-in-out infinite";
    } else if (status === "completed") {
      styles.background = "rgba(255,209,102,0.2)";
    } else if (status === "available") {
      styles.background = "#1A1A26";
      styles.opacity = 0.75;
    } else {
      styles.background = "#111118";
      styles.opacity = 0.5;
    }
  } else {
    if (status === "active") {
      styles.background = "#FF6B2B";
      styles.borderColor = "#FF6B2B";
      styles.animation = "pulseOrange 1.6s ease-in-out infinite";
    } else if (status === "completed") {
      styles.background = "rgba(255,107,43,0.25)";
      styles.borderColor = "#FF6B2B";
      styles.boxShadow = "0 0 16px -4px rgba(255,107,43,0.4)";
    } else if (status === "available") {
      styles.background = "#1F1F2E";
      styles.borderColor = "#3A3A52";
      styles.opacity = 0.85;
    } else {
      styles.background = "#111118";
      styles.borderColor = "#1A1A26";
      styles.opacity = 0.5;
    }
  }

  // Mientras el siguiente sigue siendo "candado", lo pintamos como locked
  if (showLockOnNext) {
    styles.background = "#111118";
    styles.borderColor = "#1A1A26";
    styles.opacity = 0.5;
    styles.animation = undefined;
  } else if (lockShakingOut) {
    styles.background = "#111118";
    styles.borderColor = "#1A1A26";
    styles.animation = "lockShakeOut 0.4s ease-out forwards";
  } else if (nextNodeAppearing) {
    // Scale bounce + glow naranja + pulse activo encadenados
    styles.animation =
      "nodeScaleIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both, nextNodeGlow 0.8s ease-out 0.3s both, pulseOrange 1.6s ease-in-out 1.1s infinite";
  }

  // Vibración del nodo recién completado en fase 4
  if (completedShake) {
    styles.animation = "nodeShake 0.4s ease-in-out";
  }

  let icon: React.ReactNode;
  if (status === "locked" || showLockOnNext) icon = <Lock size={isBoss ? 22 : 18} color="#5A5A8A" />;
  else if (isBoss)
    icon = (
      <Trophy
        size={28}
        color={status === "active" ? "#FFFFFF" : "#FFD166"}
      />
    );
  else if (status === "completed") {
    const checkInner = (
      <Check size={22} color="#FFFFFF" strokeWidth={3} />
    );
    icon = justCompletedAnim ? (
      <span
        style={{
          display: "inline-flex",
          transform: animationPhase < 1 ? "scale(0)" : undefined,
          animation:
            animationPhase >= 1
              ? "checkBounce 0.6s cubic-bezier(0.34,1.56,0.64,1) both"
              : undefined,
        }}
      >
        {checkInner}
      </span>
    ) : (
      checkInner
    );
  } else
    icon = (
      <Star
        size={20}
        color={status === "active" ? "#FFFFFF" : "#5A5A8A"}
        fill={status === "active" ? "#FFFFFF" : "transparent"}
      />
    );

  // Estrellas debajo del nombre — para todos los nodos completados, incluidos Boss
  const showStars = status === "completed" && stars > 0;
  // Si es el nodo recién completado y estamos animando: phase 2→1, phase 3→2, phase>=4→3
  const animStars =
    animationPhase >= 4 ? 3 : Math.max(0, animationPhase - 1);
  const visibleStars = isJustCompleted ? Math.min(stars, animStars) : stars;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {isBoss && status !== "locked" && (
        <div
          style={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#FFD166",
            color: "#08080F",
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: "0.55rem",
            letterSpacing: "0.1em",
            padding: "2px 8px",
            borderRadius: 99,
            zIndex: 2,
          }}
        >
          BOSS
        </div>
      )}
      <button
        type="button"
        onClick={status === "locked" ? undefined : onClick}
        disabled={status === "locked" || showLockOnNext}
        style={styles}
        aria-label={node.name}
      >
        {icon}
      </button>
      <div
        style={{
          marginTop: 6,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: status === "locked" ? "0.72rem" : "0.62rem",
          fontWeight:
            status === "locked" ? 400 : status === "active" ? 600 : 500,
          color:
            status === "active"
              ? "#FFFFFF"
              : status === "completed"
                ? "#FF6B2B"
                : "#5A5A8A",
          textAlign: "center",
          maxWidth: 90,
          lineHeight: 1.15,
        }}
      >
        {node.name}
      </div>
      {showStars && (
        <div
          style={{
            marginTop: 3,
            display: "flex",
            gap: 1,
            fontSize: 10,
            lineHeight: 1,
          }}
        >
          {[0, 1, 2].map((i) => {
            const earned = i < stars;
            const visible = i < visibleStars;
            const justAppeared =
              isJustCompleted && i === visibleStars - 1 && visibleStars > 0;
            return (
              <span
                key={i}
                style={{
                  color: earned ? "#FFD166" : "rgba(255,255,255,0.15)",
                  filter: earned ? "drop-shadow(0 0 4px #FFD166)" : undefined,
                  display: "inline-block",
                  opacity: visible ? 1 : 0,
                  transform: visible ? "scale(1)" : "scale(0)",
                  animation: justAppeared
                    ? "starPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both"
                    : undefined,
                  transition: justAppeared
                    ? undefined
                    : "opacity 0.2s ease, transform 0.25s ease",
                }}
              >
                ★
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Bottom Sheet ─────────────────────────

function NodeSheet({
  node,
  onOpenChange,
}: {
  node: DisplayNode | null;
  onOpenChange: (o: boolean) => void;
}) {
  const open = !!node;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        style={{
          background: "#0B0B12",
          border: "1px solid #252535",
          borderBottom: "none",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          maxHeight: "85vh",
        }}
      >
        {node && <NodeSheetBody node={node} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function NodeSheetBody({
  node,
  onClose,
}: {
  node: DisplayNode;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const isBoss = node.is_boss;

  if (node.status === "locked") {
    return (
      <div style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
        <SheetHeader>
          <SheetTitle
            style={{
              fontFamily: "Syne, sans-serif",
              color: "#FFFFFF",
              textAlign: "center",
            }}
          >
            <Lock size={32} style={{ margin: "0 auto 8px" }} />
            <div>Bloqueado</div>
          </SheetTitle>
          <SheetDescription
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "#5A5A8A",
              textAlign: "center",
            }}
          >
            Completa los nodos anteriores para desbloquear este nivel.
          </SheetDescription>
        </SheetHeader>
        <Button block onClick={onClose} style={{ marginTop: 24 }}>
          Entendido
        </Button>
      </div>
    );
  }

  if (node.status === "completed") {
    return (
      <div style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
        <SheetHeader>
          <SheetTitle
            style={{
              fontFamily: "Syne, sans-serif",
              color: "#FFFFFF",
              textAlign: "center",
              fontSize: "1.2rem",
            }}
          >
            {node.name}
          </SheetTitle>
          <SheetDescription
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "#9090B0",
              textAlign: "center",
              fontSize: "0.85rem",
            }}
          >
            Completado
          </SheetDescription>
        </SheetHeader>
        <div
          style={{
            marginTop: 18,
            display: "flex",
            justifyContent: "center",
            gap: 8,
            fontSize: 32,
            lineHeight: 1,
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                color: i < node.stars ? "#FFD166" : "rgba(255,255,255,0.15)",
              }}
            >
              ★
            </span>
          ))}
        </div>
        <Button
          block
          onClick={() => {
            onClose();
            navigate({ to: "/nodo/$nodeId", params: { nodeId: node.id } });
          }}
          style={{ marginTop: 24 }}
        >
          Mejorar →
        </Button>
      </div>
    );
  }

  // active or available
  const containerStyle: React.CSSProperties = isBoss
    ? {
        padding: "1rem 0.5rem",
        background:
          "linear-gradient(180deg, rgba(255,209,102,0.08) 0%, transparent 100%)",
        margin: "-24px -24px 0",
        paddingTop: 32,
        paddingLeft: 24,
        paddingRight: 24,
        textAlign: "center",
      }
    : { padding: "1rem 0.5rem", textAlign: "center" };

  return (
    <div style={containerStyle}>
      {isBoss && (
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            color: "#FFD166",
            fontWeight: 800,
            fontSize: "0.75rem",
            letterSpacing: "0.15em",
            marginBottom: 8,
          }}
        >
          BOSS LEVEL
        </div>
      )}
      <SheetHeader>
        <SheetTitle
          style={{
            fontFamily: "Syne, sans-serif",
            color: "#FFFFFF",
            textAlign: "center",
            fontSize: "1.3rem",
          }}
        >
          {node.name}
        </SheetTitle>
        <SheetDescription
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: "#9090B0",
            textAlign: "center",
            marginTop: 4,
          }}
        >
          {node.technique ?? ""}
        </SheetDescription>
      </SheetHeader>

      <DifficultyMeter
        level={node.difficulty_level}
        worldId={node.world_id}
      />

      {isBoss && (
        <div
          style={{
            marginTop: 16,
            fontFamily: "Syne, sans-serif",
            color: "#FFD166",
            fontSize: "1rem",
            fontWeight: 600,
          }}
        >
          ¿Estás listo?
        </div>
      )}

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <Button block size="lg" onClick={() => navigate({ to: "/nodo/$nodeId", params: { nodeId: node.id } })}>
          <Play size={18} />
          {isBoss ? "Entrar al Boss" : "Empezar →"}
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────── Difficulty Meter ─────────────────────────

function difficultyColor(worldId: number): string {
  if (worldId <= 1) return "#06D6A0";
  if (worldId <= 3) return "#FFD166";
  if (worldId <= 5) return "#FF6B2B";
  if (worldId <= 7) return "#EF476F";
  return "#B57BEE";
}

function DifficultyMeter({
  level,
  worldId,
}: {
  level: number;
  worldId: number;
}) {
  const color = difficultyColor(worldId);
  const safe = Math.max(1, Math.min(5, level || 1));
  return (
    <div
      style={{
        marginTop: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: i <= safe ? color : "#252535",
            }}
          />
        ))}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.68rem",
          fontWeight: 400,
          color: "#5A5A8A",
        }}
      >
        Dificultad {safe}/5
      </div>
    </div>
  );
}

// ───────────────────────── Styles ─────────────────────────

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#08080F",
  color: "#FFFFFF",
  paddingBottom: "4rem",
};
