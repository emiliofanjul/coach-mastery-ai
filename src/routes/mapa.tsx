import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Lock, Check, Trophy } from "lucide-react";
import { estiloBoton, estiloBotonPlay, IconoPlay, Estrella } from "@/components/closer/piezas";
import { restGet } from "@/lib/supabase-rest";
import { AppHeader } from "@/components/app/AppShell";
import { GuiaMapa } from "@/components/closer/GuiaMapa";
import { CoachBubble } from "@/components/closer/CoachBubble";
import { CloserCharacter } from "@/components/closer/CloserCharacter";
import { consumeNodeCompletionSignal, type NodeCompletionSignal } from "@/lib/node-completion";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { restMutate } from "@/lib/supabase-rest";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa — Closer" },
      { name: "description", content: "Tu camino de entrenamiento y progreso en ventas con Closer." },
      { property: "og:title", content: "Mapa — Closer" },
      { property: "og:description", content: "Tu camino de entrenamiento y progreso en ventas con Closer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
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
  description: string | null;
  order_index: number;
  is_boss: boolean;
  difficulty_level: number;
  /** Fase 3 (mensaje 147): el nombre de dos o tres palabras que va bajo el nodo. */
  nombre_corto: string | null;
  /** Fase 3: cuánto toma el nodo completo (tarjetas, quiz, demostración, práctica y análisis). */
  minutos_estimados: number | null;
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
  /** 1 = el primero del mundo. */
  posicion: number;
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
// Fase 3 (mensaje 147): todos los nodos miden igual; el siguiente destaca por su color y su anillo.
const NODE_SIZE = 52;
const BOSS_SIZE = 56;
const MAP_WIDTH = 340;
const ROW_HEIGHT = 124;
const PADDING_TOP = 48;
const SUPABASE_REST_URL = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Zigzag con curvas: centro, derecha, centro, izquierda…
const X_PATTERN = [0.5, 0.78, 0.5, 0.22];

function xForIndex(i: number) {
  return X_PATTERN[i % X_PATTERN.length] * MAP_WIDTH;
}

// Y invertida: nodo 0 abajo, último nodo arriba.
// total = número de nodos del mundo, i = índice (0 = primero).
function yForIndex(i: number, total: number) {
  return PADDING_TOP + (total - 1 - i) * ROW_HEIGHT;
}

async function restSelect<T>(path: string, accessToken: string): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  const res = await fetch(`${SUPABASE_REST_URL}/${path}`, {
    signal: controller.signal,
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  }).finally(() => window.clearTimeout(timeout));
  if (!res.ok) throw new Error(`mapa_fetch_${res.status}`);
  return (await res.json()) as T;
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
  // Mensaje 154: la primera vez, un globo «Empieza aquí» sobre el nodo que toca (antes, un recorrido de 5 pasos).
  const [guiaPrimeraVez, setGuiaPrimeraVez] = useState(false);
  const [unlockNotice, setUnlockNotice] = useState<World | null>(null);
  const prevBossCompletedRef = useRef<Set<number> | null>(null);
  const mundo0Ref = useRef<HTMLDivElement | null>(null);
  const [glowActive, setGlowActive] = useState(false);

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
      const storedSession = getStoredSupabaseSession();
      if (!storedSession) {
        navigate({ to: "/login", replace: true });
        if (alive) setLoading(false);
        return;
      }
      const { userId, accessToken } = storedSession;

      const [w, n, sellerRows] = await Promise.all([
        restSelect<World[]>("worlds?select=*&order=order_index.asc", accessToken),
        restSelect<NodeRow[]>("nodes?select=id,world_id,name,description,order_index,is_boss,difficulty_level,nombre_corto,minutos_estimados&order=order_index.asc", accessToken),
        restSelect<Array<NonNullable<typeof seller>>>(
          `sellers?select=id,current_world,current_node,map_tutorial_completed&profile_id=eq.${encodeURIComponent(userId)}&limit=1`,
          accessToken,
        ),
      ]);
      const s = sellerRows[0] ?? null;

      if (!alive) return;

      setWorlds(w ?? []);
      setNodes(n ?? []);

      if (s) {
        if (!alive) return;
        setSeller(s);
        const p = await restSelect<ProgressRow[]>(
          `node_progress?select=node_id,status,consistency_score,stars&seller_id=eq.${encodeURIComponent(s.id)}`,
          accessToken,
        );
        if (!alive) return;
        const map: Record<string, ProgressRow> = {};
        p.forEach((r) => (map[r.node_id] = r));
        setProgress(map);
        if (!s.map_tutorial_completed) {
          // Después de que el mapa se desliza hasta el nodo activo.
          setTimeout(() => alive && setGuiaPrimeraVez(true), 900);
        }
      }
      } catch (error) {
        console.error("[mapa] load failed", error);
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

  const cerrarGuia = async () => {
    setGuiaPrimeraVez(false);
    // El nodo brilla un instante: «este es».
    setGlowActive(true);
    setTimeout(() => setGlowActive(false), 1000);
    if (seller) {
      await restMutate(`sellers?id=eq.${seller.id}`, {
        method: "PATCH",
        body: { map_tutorial_completed: true },
      });
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
    (n) => progress[n.id]?.status !== "done",
  );
  const activeId = activeIdx >= 0 ? orderedNodes[activeIdx].id : null;

  const computeStatus = (node: NodeRow): NodeStatus => {
    if (progress[node.id]?.status === "done") return "completed";
    if (node.id === activeId) return "active";
    return "locked";
  };

  const totalNodos = orderedNodes.length;
  const hechos = orderedNodes.filter((n) => progress[n.id]?.status === "done").length;
  const nodoActivo = activeId ? orderedNodes.find((n) => n.id === activeId) ?? null : null;
  const mundoActual = worlds.find((w) => w.id === (nodoActivo?.world_id ?? orderedNodes[orderedNodes.length - 1]?.world_id));

  const abrirNodo = (node: NodeRow, status: NodeStatus, posicion: number) =>
    setSelectedNode({
      ...node,
      status,
      posicion,
      score: progress[node.id]?.consistency_score ?? null,
      stars: (progress[node.id]?.stars as number | null) ?? 0,
    });

  if (loading) {
    return (
      <main style={shellStyle}>
        <div
          style={{
            color: "var(--c-text-2)",
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
      {/* Encabezado: menú, en qué mundo vas y cuánto llevas, y el coach. */}
      <AppHeader
        center={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--c-text)",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {mundoActual ? `Mundo ${mundoActual.id} · ${mundoActual.name}` : "Tu mapa"}
            </span>
            {totalNodos > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 8 }} aria-label={`${hechos} de ${totalNodos} nodos completados`}>
                <span style={{ width: 96, height: 4, borderRadius: 2, background: "var(--c-disabled-bg)", overflow: "hidden", display: "block" }}>
                  <span
                    style={{
                      display: "block",
                      height: 4,
                      borderRadius: 2,
                      background: "var(--c-primary)",
                      width: `${Math.round((hechos / totalNodos) * 100)}%`,
                      transition: "width 600ms ease",
                    }}
                  />
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--c-text-2)" }}>
                  {hechos} de {totalNodos}
                </span>
              </span>
            )}
          </div>
        }
        rightExtras={<CoachBubble context="mapa" sellerId={seller?.id} />}
      />

      {/* Apilados de abajo hacia arriba: render reverso */}
      <div style={{ display: "flex", flexDirection: "column-reverse" }}>
        {(() => {
          const unlockedWorlds = computeUnlockedWorlds(worlds, nodes, progress);
          return worlds.map((world) => {
            const worldNodes = nodes
              .filter((n) => n.world_id === world.id)
              .sort((a, b) => a.order_index - b.order_index);
            const isUnlocked = unlockedWorlds.has(world.id);
            const isCurrent = world.id === 0; // anchor
            const sectionHeight = PADDING_TOP + worldNodes.length * ROW_HEIGHT + 24;

            // Mundos bloqueados: solo su encabezado y «Bloqueado». Sin nodos.
            if (!isUnlocked) {
              return (
                <section
                  key={world.id}
                  ref={world.id === 1 ? mundo0Ref : undefined}
                  style={{ ...seccionMundo, paddingBottom: 32 }}
                >
                  <WorldHeader world={world} bloqueado />
                </section>
              );
            }

            return (
              <section
                key={world.id}
                ref={isCurrent ? mundo0Ref : undefined}
                style={seccionMundo}
              >
                <WorldHeader world={world} />

                <div
                  style={{
                    position: "relative",
                    width: MAP_WIDTH,
                    maxWidth: "100%",
                    height: sectionHeight,
                    margin: "0 auto",
                  }}
                >
                  {/* El camino: curvas suaves; naranja donde ya pasaste, apagado lo que falta. */}
                  <svg
                    width={MAP_WIDTH}
                    height={sectionHeight}
                    style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
                    aria-hidden
                  >
                    {worldNodes.map((node, i) => {
                      if (i === 0) return null;
                      const prev = worldNodes[i - 1];
                      const x1 = xForIndex(i - 1);
                      const y1 = yForIndex(i - 1, worldNodes.length);
                      const x2 = xForIndex(i);
                      const y2 = yForIndex(i, worldNodes.length);
                      const my = (y1 + y2) / 2;
                      const path = `M ${x1} ${y1} C ${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
                      const recorrido = computeStatus(prev) === "completed" && computeStatus(node) !== "locked";
                      // 151-C: el camino se anima solo si esta práctica abrió el siguiente nodo. Antes se encendía
                      // también al fallar (y se apagaba enseguida), como si lo hubieras pasado.
                      const isAnimLine = !!animSignal && prev.id === animSignal.nodeId && node.id === animNextNodeId
                        && animSignal.desbloqueoAhora !== false && computeStatus(node) !== "locked";
                      const naranjaFijo = recorrido && !isAnimLine;
                      const naranjaAnimado = isAnimLine && animPhase >= 5;
                      return (
                        <g key={`line-${node.id}`}>
                          <path d={path} stroke="var(--c-disabled-bg)" strokeWidth={5} fill="none" strokeLinecap="round" />
                          {(naranjaFijo || naranjaAnimado) && (
                            <>
                              {/* Un resplandor muy sutil bajo lo recorrido. */}
                              <path
                                d={path}
                                stroke="rgb(var(--c-primary-rgb) / 0.07)"
                                strokeWidth={12}
                                fill="none"
                                strokeLinecap="round"
                                pathLength={1}
                                style={{
                                  filter: "blur(5px)",
                                  ...(naranjaAnimado ? { strokeDasharray: 1, strokeDashoffset: 1, animation: "caminoSeIlumina 0.8s ease-in-out forwards" } : {}),
                                }}
                              />
                              <path
                                d={path}
                                stroke="var(--c-primary)"
                                strokeWidth={5}
                                fill="none"
                                strokeLinecap="round"
                                pathLength={1}
                                style={naranjaAnimado ? { strokeDasharray: 1, strokeDashoffset: 1, animation: "caminoSeIlumina 0.8s ease-in-out forwards" } : undefined}
                              />
                            </>
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
                    const size = node.is_boss ? BOSS_SIZE : NODE_SIZE;

                    return (
                      <div
                        key={node.id}
                        data-node-id={node.id}
                        data-active-node={status === "active" ? "true" : undefined}
                        style={{
                          position: "absolute",
                          left: x - 70,
                          top: y - size / 2,
                          width: 140,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <MapNode
                          node={node}
                          status={status}
                          stars={(progress[node.id]?.stars as number | null) ?? 0}
                          animationPhase={animPhase}
                          isJustCompleted={animSignal?.nodeId === node.id}
                          isNewlyActive={animNextNodeId === node.id}
                          brillo={status === "active" && glowActive}
                          onClick={() => abrirNodo(node, status, i + 1)}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          });
        })()}
      </div>

      {/* «Sigue aquí»: un toque y estás en el nodo que sigue, con cuánto te va a tomar. */}
      {nodoActivo && !selectedNode && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            padding: "32px var(--m-pantalla) calc(20px + env(safe-area-inset-bottom))",
            background: "linear-gradient(to top, var(--c-bg) 68%, rgb(var(--c-bg-rgb) / 0))",
            pointerEvents: "none",
          }}
        >
          <button
            type="button"
            onClick={() => {
              const w = nodes.filter((n) => n.world_id === nodoActivo.world_id).sort((a, b) => a.order_index - b.order_index);
              abrirNodo(nodoActivo, "active", w.findIndex((n) => n.id === nodoActivo.id) + 1);
            }}
            style={{
              pointerEvents: "auto",
              width: "100%",
              maxWidth: 560,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 12px 12px 16px",
              borderRadius: "var(--r-tarjeta)",
              border: "1px solid var(--c-border)",
              background: "var(--c-surface)",
              color: "var(--c-text)",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--c-text-2)" }}>
                {nodoActivo.minutos_estimados ? `Sigue aquí · ${nodoActivo.minutos_estimados} min` : "Sigue aquí"}
              </span>
              <span style={{ fontSize: 16, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {nodoActivo.nombre_corto || nodoActivo.name}
              </span>
            </span>
            <span style={{ ...botonPlay, width: 52, height: 52, borderRadius: 16 }} aria-hidden>
              <IconoPlay tam={22} />
            </span>
          </button>
        </div>
      )}

      <NodeSheet
        node={selectedNode}
        worldName={worlds.find((w) => w.id === selectedNode?.world_id)?.name ?? null}
        onOpenChange={(o) => !o && setSelectedNode(null)}
      />

      {guiaPrimeraVez && nodoActivo && !selectedNode && (
        <GuiaMapa
          texto={
            Object.keys(progress).length === 0
              ? `Tu primer nodo: ${nodoActivo.nombre_corto || nodoActivo.name}.${nodoActivo.minutos_estimados ? ` Toma ${nodoActivo.minutos_estimados} minutos.` : ""}`
              : `Aquí sigues: ${nodoActivo.nombre_corto || nodoActivo.name}.${nodoActivo.minutos_estimados ? ` Toma ${nodoActivo.minutos_estimados} minutos.` : ""}`
          }
          onCerrar={cerrarGuia}
        />
      )}

      {unlockNotice && (
        <div
          role="status"
          style={{
            position: "fixed",
            top: 88,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            background: "var(--c-elevated)",
            border: "1px solid var(--c-border-strong)",
            borderRadius: 16,
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
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--c-text)", marginBottom: 2 }}>
              {unlockNotice.name} desbloqueado
            </div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "var(--c-text-soft)",
                lineHeight: 1.35,
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

      {/* Animaciones (Fase 3): pocas, suaves y con propósito. Nada rebota ni vibra. */}
      <style>{`
        @keyframes respira {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 0.15; }
        }
        @keyframes aparece {
          from { opacity: 0; transform: scale(0.85); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes candadoFuera {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        @keyframes caminoSeIlumina {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes brilloActivo {
          0% { box-shadow: 0 0 0 0 rgb(var(--c-primary-rgb) / 0.6); }
          100% { box-shadow: 0 0 0 20px rgb(var(--c-primary-rgb) / 0); }
        }
        @keyframes unlockFade {
          0% { opacity: 0; transform: translate(-50%, -8px); }
          15%, 85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-anillo-activo] { animation: none !important; }
        }
      `}</style>
    </main>
  );
}

// ───────────────────────── Estilos compartidos ─────────────────────────

// Todos los mundos con el mismo tono: el color de cada mundo ya no se usa en el mapa
// (decisión de Emilio, nov-2026: cambiar de color por mundo altera la marca).
const seccionMundo: React.CSSProperties = {
  position: "relative",
  background: "linear-gradient(to bottom, rgb(var(--c-client-rgb) / 0) 0%, rgb(var(--c-client-rgb) / 0.04) 45%, rgb(var(--c-client-rgb) / 0) 100%)",
  paddingBottom: 16,
};

const botonPlay = estiloBotonPlay;

// ───────────────────────── World Header ─────────────────────────

function WorldHeader({ world, bloqueado = false }: { world: World; bloqueado?: boolean }) {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        padding: "28px var(--m-pantalla) 4px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 16,
        borderTop: "1px solid var(--c-disabled-bg)",
      }}
    >
      <span
        aria-hidden
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 800,
          fontSize: 44,
          lineHeight: 1,
          letterSpacing: "-0.03em",
          color: "var(--c-border-strong)",
          flexShrink: 0,
        }}
      >
        {String(world.id).padStart(2, "0")}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--c-text-2)", display: "flex", alignItems: "center", gap: 6 }}>
          Mundo {world.id}
          {bloqueado && (
            <>
              <span aria-hidden>·</span>
              <Lock size={12} aria-hidden /> Bloqueado
            </>
          )}
        </span>
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: "-0.01em", color: bloqueado ? "var(--c-text-2)" : "var(--c-text)" }}>
          {world.name}
        </span>
        {world.description && (
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              lineHeight: 1.4,
              color: "var(--c-text-2)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {world.description}
          </span>
        )}
      </span>
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
  brillo,
  onClick,
}: {
  node: NodeRow;
  status: NodeStatus;
  stars: number;
  animationPhase: number;
  isJustCompleted: boolean;
  isNewlyActive: boolean;
  brillo: boolean;
  onClick: () => void;
}) {
  const isBoss = node.is_boss;
  const size = isBoss ? BOSS_SIZE : NODE_SIZE;
  const radius = isBoss ? 18 : size / 2;

  // Al regresar de un nodo: el siguiente sigue con candado hasta la fase 6, el candado se
  // desvanece en la 6 y el nodo aparece en la 7. Sin rebotes.
  const animatingNext = isNewlyActive && status === "active";
  const showLockOnNext = animatingNext && animationPhase < 6;
  const lockFadingOut = animatingNext && animationPhase === 6;
  const nextNodeAppearing = animatingNext && animationPhase >= 7;
  const justCompletedAnim = isJustCompleted && status === "completed";

  const bloqueado = status === "locked" || showLockOnNext || lockFadingOut;
  const activo = status === "active" && !bloqueado;
  const hecho = status === "completed";

  const circulo: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    padding: 0,
    cursor: bloqueado ? "default" : "pointer",
    border: "2px solid transparent",
    WebkitTapHighlightColor: "transparent",
    transition: "background 300ms ease, border-color 300ms ease",
  };
  if (activo) {
    Object.assign(circulo, botonPlay, { border: "none", boxShadow: `${estiloBotonPlay.boxShadow}, 0 6px 20px rgb(var(--c-primary-rgb) / 0.35)` });
    if (nextNodeAppearing) circulo.animation = "aparece 400ms ease-out both";
    if (brillo) circulo.animation = "brilloActivo 1s ease-out";
  } else if (hecho) {
    // Relleno tenue (Emilio, 7-nov): lo recorrido queda «pintado», muy distinto del play macizo.
    // Tinte encima de un fondo opaco, para que el camino no se vea a través del nodo.
    const rgb = isBoss ? "var(--c-gold-rgb)" : "var(--c-primary-rgb)";
    circulo.background = `linear-gradient(180deg, rgb(${rgb} / 0.34) 0%, rgb(${rgb} / 0.12) 100%), var(--c-bg)`;
    circulo.borderColor = isBoss ? "var(--c-gold)" : "var(--c-primary)";
  } else {
    circulo.background = "var(--c-surface)";
    circulo.borderColor = "var(--c-disabled-bg)";
    circulo.borderWidth = 1.5;
    if (lockFadingOut) circulo.animation = "candadoFuera 300ms ease-out forwards";
  }

  let icon: React.ReactNode;
  if (bloqueado) icon = <Lock size={18} strokeWidth={2} color="var(--c-border-strong)" aria-hidden />;
  else if (activo) icon = isBoss ? <Trophy size={24} strokeWidth={1.9} color="#FFFFFF" aria-hidden /> : <IconoPlay tam={22} />;
  else if (isBoss) icon = <Trophy size={24} strokeWidth={1.9} color="var(--c-gold)" aria-hidden />;
  else {
    const check = <Check size={22} color="var(--c-text)" strokeWidth={2.6} aria-hidden />;
    icon = justCompletedAnim ? (
      <span
        style={{
          display: "inline-flex",
          opacity: animationPhase < 1 ? 0 : undefined,
          animation: animationPhase >= 1 ? "aparece 300ms ease-out both" : undefined,
        }}
      >
        {check}
      </span>
    ) : (
      check
    );
  }

  // Estrellas: se pintan en cuanto se ganan. Las del nodo recién completado aparecen una por una.
  const showStars = stars > 0;
  const animStars = animationPhase >= 4 ? 3 : Math.max(0, animationPhase - 1);
  const visibleStars = isJustCompleted ? Math.min(stars, animStars) : stars;
  const nombre = node.nombre_corto || node.name;

  return (
    <>
      <button
        type="button"
        onClick={bloqueado ? undefined : onClick}
        disabled={bloqueado}
        style={circulo}
        aria-label={
          bloqueado
            ? `${nombre}, bloqueado`
            : activo
              ? `${nombre}, siguiente`
              : `${nombre}, completado: tócalo para practicarlo otra vez`
        }
      >
        {activo && (
          <span
            data-anillo-activo
            aria-hidden
            style={{
              position: "absolute",
              width: size + 12,
              height: size + 12,
              left: -6,
              top: -6,
              boxSizing: "border-box",
              borderRadius: isBoss ? radius + 6 : (size + 12) / 2,
              border: "2px solid var(--c-primary)",
              animation: "respira 2.4s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
        )}
        {icon}
      </button>
      <div
        style={{
          marginTop: 10,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: activo ? 14 : 13,
          fontWeight: activo ? 700 : 500,
          color: bloqueado ? "var(--c-disabled-text)" : "var(--c-text)",
          textAlign: "center",
          lineHeight: 1.25,
          maxWidth: 130,
        }}
      >
        {nombre}
      </div>
      {isBoss && (
        <div
          style={{
            marginTop: 4,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: bloqueado ? "var(--c-disabled-text)" : "var(--c-gold)",
          }}
        >
          Reto final
        </div>
      )}
      {showStars && (
        <div style={{ marginTop: 4, display: "flex", gap: 3 }} aria-label={`${stars} de 3 estrellas`}>
          {[0, 1, 2].map((i) => {
            const earned = i < stars;
            const visible = i < visibleStars;
            return (
              <Estrella
                key={i}
                ganada={earned}
                tam={12}
                style={{
                  opacity: visible ? 1 : 0,
                  transition: "opacity 250ms ease",
                  animation: isJustCompleted && i === visibleStars - 1 ? "aparece 300ms ease-out both" : undefined,
                }}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

// ───────────────────────── Bottom Sheet ─────────────────────────

function NodeSheet({
  node,
  worldName,
  onOpenChange,
}: {
  node: DisplayNode | null;
  worldName: string | null;
  onOpenChange: (o: boolean) => void;
}) {
  const open = !!node;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        // Sin foco automático en la equis: el aro de foco la pintaba de naranja al abrir.
        onOpenAutoFocus={(e) => e.preventDefault()}
        style={{
          background: "var(--c-elevated)",
          border: "1px solid var(--c-border-strong)",
          borderBottom: "none",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: "85vh",
          padding: "24px var(--m-pantalla) calc(24px + env(safe-area-inset-bottom))",
        }}
      >
        {node && <NodeSheetBody node={node} worldName={worldName} onClose={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

/** «Reto final de la Presentación», «Reto final del Descubrimiento» (de + el = del). */
function etiquetaBoss(worldName: string | null): string {
  if (!worldName) return "Reto final";
  const n = worldName.trim();
  return /^el\s/i.test(n) ? `Reto final del ${n.slice(3)}` : `Reto final de ${n.charAt(0).toLowerCase() === n.charAt(0) ? n : n.charAt(0).toLowerCase() + n.slice(1)}`;
}

type ContenidoNodo = { tarjetas: number; preguntas: number; practica: boolean };

function NodeSheetBody({
  node,
  worldName,
  onClose,
}: {
  node: DisplayNode;
  worldName: string | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const isBoss = node.is_boss;
  // Qué trae el nodo (para los números de la ventana y a dónde lleva «Practicar otra vez»).
  const [contenido, setContenido] = useState<ContenidoNodo | null>(null);
  useEffect(() => {
    if (node.status === "locked") return;
    let vivo = true;
    const id = encodeURIComponent(node.id);
    Promise.all([
      restGet<{ id: string }>(`node_cards?select=id&node_id=eq.${id}`),
      restGet<{ id: string }>(`node_quiz_questions?select=id&node_id=eq.${id}`),
      restGet<{ limites: unknown }>(`nodes?select=limites:practice_script->limits&id=eq.${id}&limit=1`),
    ])
      .then(([c, q, p]) => {
        if (vivo) setContenido({ tarjetas: c.length, preguntas: q.length, practica: !!p[0]?.limites });
      })
      .catch((err) => console.error("[mapa] contenido del nodo", err));
    return () => {
      vivo = false;
    };
  }, [node.id, node.status]);

  const titulo: React.CSSProperties = {
    margin: 0,
    fontFamily: "Syne, sans-serif",
    fontWeight: 700,
    fontSize: 26,
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    color: "var(--c-text)",
    textAlign: "left",
  };
  const texto: React.CSSProperties = {
    margin: 0,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 16,
    lineHeight: 1.55,
    color: "var(--c-text-soft)",
    textAlign: "left",
  };
  const etiqueta: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: isBoss ? "var(--c-gold)" : "var(--c-text-2)",
  };

  if (node.status === "locked") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SheetHeader style={{ textAlign: "left", gap: 8 }}>
          <span style={{ ...etiqueta, color: "var(--c-text-2)", display: "flex", alignItems: "center", gap: 6 }}>
            <Lock size={13} aria-hidden /> Todavía no
          </span>
          <SheetTitle style={titulo}>{node.nombre_corto || node.name}</SheetTitle>
          <SheetDescription style={texto}>Termina los nodos anteriores para abrir este.</SheetDescription>
        </SheetHeader>
        <button type="button" onClick={onClose} style={estiloBoton("secundario")}>
          Entendido
        </button>
      </div>
    );
  }

  if (node.status === "completed") {
    const destino = contenido?.practica
      ? ("/nodo/$nodeId/practica" as const)
      : contenido && contenido.preguntas > 0
        ? ("/nodo/$nodeId/quiz" as const)
        : ("/nodo/$nodeId" as const);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <SheetHeader style={{ textAlign: "left", gap: 8 }}>
          <span style={etiqueta}>{isBoss ? `${etiquetaBoss(worldName)} · completado` : "Completado"}</span>
          <SheetTitle style={titulo}>{node.nombre_corto || node.name}</SheetTitle>
          <SheetDescription style={texto}>
            Ya lo pasaste. Puedes practicarlo otra vez cuando quieras: para repasarlo antes de una visita o para subir tus estrellas.
          </SheetDescription>
        </SheetHeader>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16, background: "var(--c-surface)" }}>
          <span style={{ display: "flex", gap: 4 }} aria-label={`${node.stars} de 3 estrellas`}>
            {[0, 1, 2].map((i) => (
              <Estrella key={i} ganada={i < node.stars} tam={20} />
            ))}
          </span>
          {/* La app guarda siempre la mejor calificación (practica.tsx: Math.max). */}
          <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.4, color: "var(--c-text-soft)" }}>
            {node.stars >= 3
              ? "Tienes las tres estrellas. Practicarlo otra vez no te las quita."
              : `Llevas ${node.stars} de 3. Si sacas más, se quedan las nuevas.`}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate({ to: destino, params: { nodeId: node.id } });
            }}
            style={estiloBoton("principal")}
          >
            Practicar otra vez
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate({ to: "/nodo/$nodeId", params: { nodeId: node.id } });
            }}
            style={estiloBoton("secundario")}
          >
            Repasar las tarjetas
          </button>
        </div>
      </div>
    );
  }

  // Activo
  const segundo = contenido?.practica
    ? { valor: "1", texto: "práctica de voz" }
    : contenido && contenido.preguntas > 0
      ? { valor: String(contenido.preguntas), texto: contenido.preguntas === 1 ? "pregunta" : "preguntas" }
      : null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <SheetHeader style={{ textAlign: "left", gap: 8 }}>
        {/* El paso al que pertenece el reto (oct-2026): «Reto final de la presentación». */}
        <span style={etiqueta}>{isBoss ? etiquetaBoss(worldName) : `Mundo ${node.world_id} · Nodo ${node.posicion}`}</span>
        <SheetTitle style={titulo}>{node.nombre_corto || node.name}</SheetTitle>
        {node.description && <SheetDescription style={texto}>{node.description}</SheetDescription>}
      </SheetHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <Dato valor={contenido ? String(contenido.tarjetas) : "…"} texto={contenido?.tarjetas === 1 ? "tarjeta" : "tarjetas"} />
        {segundo ? <Dato valor={segundo.valor} texto={segundo.texto} /> : <Dato valor={contenido ? "—" : "…"} texto="sin práctica" />}
        <Dato valor={node.minutos_estimados ? `${node.minutos_estimados} min` : "—"} texto="en total" />
      </div>
      <button
        type="button"
        onClick={() => {
          onClose();
          navigate({ to: "/nodo/$nodeId", params: { nodeId: node.id } });
        }}
        style={estiloBoton("principal")}
      >
        {isBoss ? "Entrar al reto" : "Empezar"}
      </button>
    </div>
  );
}

function Dato({ valor, texto }: { valor: string; texto: string }) {
  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 2, padding: 12, borderRadius: 14, background: "var(--c-surface)", fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)" }}>{valor}</span>
      <span style={{ fontSize: 13, color: "var(--c-text-2)" }}>{texto}</span>
    </span>
  );
}

// ───────────────────────── Styles ─────────────────────────

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--c-bg)",
  color: "var(--c-text)",
  // Deja libre el espacio de «Sigue aquí» al fondo.
  paddingBottom: "calc(140px + env(safe-area-inset-bottom))",
};
