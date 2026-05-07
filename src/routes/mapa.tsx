import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
import { MapTutorial } from "@/components/closer/MapTutorial";
import { CoachBubble } from "@/components/closer/CoachBubble";
import { CloserCharacter } from "@/components/closer/CloserCharacter";

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
};

type NodeStatus = "completed" | "active" | "available" | "locked";

type DisplayNode = NodeRow & {
  status: NodeStatus;
  score: number | null;
};

const UNLOCKED_WORLDS = [0];
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

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        navigate({ to: "/login" });
        return;
      }

      const [{ data: w }, { data: n }, { data: s }] = await Promise.all([
        supabase.from("worlds").select("*").order("order_index"),
        supabase.from("nodes").select("*").order("order_index"),
        supabase
          .from("sellers")
          .select("id, current_world, current_node, map_tutorial_completed")
          .eq("profile_id", auth.user.id)
          .maybeSingle(),
      ]);

      setWorlds((w as World[]) ?? []);
      setNodes((n as NodeRow[]) ?? []);

      if (s) {
        setSeller(s as typeof seller);
        const { data: p } = await supabase
          .from("node_progress")
          .select("node_id, status, consistency_score")
          .eq("seller_id", (s as { id: string }).id);
        const map: Record<string, ProgressRow> = {};
        (p as ProgressRow[] | null)?.forEach((r) => (map[r.node_id] = r));
        setProgress(map);
        if (!(s as { map_tutorial_completed?: boolean }).map_tutorial_completed) {
          // pequeño delay para que el mapa se renderice antes
          setTimeout(() => setShowTutorial(true), 600);
        }
      }
      setLoading(false);
    })();
  }, [navigate]);

  // Scroll inicial: Mundo 0 está abajo. Posicionar scroll al fondo.
  useEffect(() => {
    if (!loading && mundo0Ref.current) {
      mundo0Ref.current.scrollIntoView({ block: "end", behavior: "auto" });
    }
  }, [loading]);

  // Detectar boss completados nuevos → mostrar notificación de mundo desbloqueado.
  useEffect(() => {
    if (loading || worlds.length === 0 || nodes.length === 0) return;
    const bossCompleted = new Set<number>();
    nodes
      .filter((n) => n.is_boss)
      .forEach((n) => {
        if (progress[n.id]?.status === "completed") bossCompleted.add(n.world_id);
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
  };

  // Mario Bros progression: estrictamente secuencial en orden global.
  // El primer nodo no completado = active. El siguiente = available (carrot). Resto = locked.
  const orderedNodes = [...nodes].sort((a, b) =>
    a.world_id !== b.world_id
      ? a.world_id - b.world_id
      : a.order_index - b.order_index,
  );
  const activeIdx = orderedNodes.findIndex(
    (n) => progress[n.id]?.status !== "completed",
  );
  const activeId = activeIdx >= 0 ? orderedNodes[activeIdx].id : null;
  const availableId =
    activeIdx >= 0 && activeIdx + 1 < orderedNodes.length
      ? orderedNodes[activeIdx + 1].id
      : null;

  const computeStatus = (node: NodeRow): NodeStatus => {
    if (progress[node.id]?.status === "completed") return "completed";
    if (node.id === activeId) return "active";
    if (node.id === availableId) return "available";
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
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background:
            "linear-gradient(180deg, #08080F 0%, #08080F 70%, transparent 100%)",
          padding: "1rem 1.2rem 1.2rem",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 800,
              fontSize: "1.4rem",
              color: "#FF6B2B",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            MAPA
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.7rem",
              color: "#5A5A8A",
              margin: "2px 0 0",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Camino al Vendedor Elite
          </p>
        </div>
        <button
          onClick={() => setShowTutorial(true)}
          style={{
            background: "rgba(255,107,43,0.1)",
            border: "1px solid rgba(255,107,43,0.4)",
            color: "#FF6B2B",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: "0.7rem",
            padding: "0.4rem 0.7rem",
            borderRadius: 99,
            cursor: "pointer",
            letterSpacing: "0.03em",
            whiteSpace: "nowrap",
          }}
        >
          ¿Cómo funciona?
        </button>
      </header>


      {/* Apilados de abajo hacia arriba: render reverso */}
      <div style={{ display: "flex", flexDirection: "column-reverse" }}>
        {worlds.map((world) => {
          const worldNodes = nodes
            .filter((n) => n.world_id === world.id)
            .sort((a, b) => a.order_index - b.order_index);
          const isUnlocked = UNLOCKED_WORLDS.includes(world.id);
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
                    return (
                      <path
                        key={`line-${node.id}`}
                        d={path}
                        stroke={prevDone ? "rgba(255,107,43,0.6)" : "#252535"}
                        strokeWidth={3}
                        fill="none"
                        strokeLinecap="round"
                      />
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
                      data-tour={tour}
                      style={{
                        position: "absolute",
                        left: x - r,
                        top: y - r,
                        width: r * 2,
                        height: r * 2 + 28,
                      }}
                    >
                      <MapNode
                        node={node}
                        status={status}
                        onClick={() =>
                          setSelectedNode({
                            ...node,
                            status,
                            score: progress[node.id]?.consistency_score ?? null,
                          })
                        }
                      />
                    </div>
                  );
                })}

                {/* Overlay de bloqueo solo sobre los nodos (Mundo 1) */}
                {!isUnlocked && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backdropFilter: "blur(4px)",
                      WebkitBackdropFilter: "blur(4px)",
                      background: "rgba(8,8,15,0.65)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "auto",
                    }}
                  >
                    <div
                      style={{
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
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <NodeSheet
        node={selectedNode}
        onOpenChange={(o) => !o && setSelectedNode(null)}
      />

      <CoachBubble hidden={showTutorial} context="mapa" />

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
  onClick,
}: {
  node: NodeRow;
  status: NodeStatus;
  onClick: () => void;
}) {
  const isBoss = node.is_boss;
  const size = isBoss ? 72 : 56;

  const styles: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: status === "locked" ? "not-allowed" : "pointer",
    transition: "transform 0.15s ease",
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

  let icon: React.ReactNode;
  if (status === "locked") icon = <Lock size={isBoss ? 22 : 18} color="#5A5A8A" />;
  else if (status === "completed")
    icon = (
      <Check
        size={isBoss ? 28 : 22}
        color={isBoss ? "#FFD166" : "#FFFFFF"}
        strokeWidth={3}
      />
    );
  else if (isBoss)
    icon = (
      <Trophy
        size={28}
        color={status === "active" ? "#FFFFFF" : "#FFD166"}
      />
    );
  else
    icon = (
      <Star
        size={20}
        color={status === "active" ? "#FFFFFF" : "#5A5A8A"}
        fill={status === "active" ? "#FFFFFF" : "transparent"}
      />
    );

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
        disabled={status === "locked"}
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
              color: "#10B981",
              textAlign: "center",
            }}
          >
            <Check size={36} style={{ margin: "0 auto 8px" }} strokeWidth={3} />
            <div>Completado</div>
          </SheetTitle>
          <SheetDescription
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "#FFFFFF",
              textAlign: "center",
              fontSize: "1rem",
            }}
          >
            {node.name}
          </SheetDescription>
        </SheetHeader>
        {node.score != null && (
          <div
            style={{
              marginTop: 16,
              fontFamily: "Syne, sans-serif",
              fontSize: "2rem",
              color: "#FF6B2B",
              fontWeight: 800,
            }}
          >
            {node.score}
            <span style={{ fontSize: "1rem", color: "#5A5A8A" }}>/100</span>
          </div>
        )}
        <Button block onClick={onClose} style={{ marginTop: 24 }}>
          Practicar de nuevo
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
        <Button block size="lg">
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
