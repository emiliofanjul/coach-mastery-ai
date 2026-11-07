import { createFileRoute, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, RotateCw, Wrench } from "lucide-react";
import { BarraSegmentos, EncabezadoPantalla, estiloBoton, segmentosDeAvance } from "@/components/closer/piezas";
import { motion, AnimatePresence } from "framer-motion";
import { invokeFunctionJson, restGet, restGetMaybeSingle, restMutate } from "@/lib/supabase-rest";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";


export const Route = createFileRoute("/nodo/$nodeId")({
  component: NodoCardsPage,
  head: () => ({
    meta: [{ title: "Tarjetas — Closer" }],
  }),
});

type CardType = "concept" | "why_it_works" | "good_example" | "bad_example" | "cta";
type CardContentType = "static" | "dynamic";

interface NodeCard {
  id: string;
  card_order: number;
  card_type: CardType;
  title: string | null;
  body: string;
  flip_back_text: string | null;
  card_content_type: CardContentType | null;
  audience: string | null;
  skill_ids: string[] | null;
}

interface DynamicContent {
  loading: boolean;
  body?: string;
  flip_back?: string;
  error?: string;
}

interface NodeRow {
  id: string;
  name: string;
  node_type: string | null;
  practice_script: any | null;
}

function NodoCardsPage() {
  const { nodeId } = useParams({ from: "/nodo/$nodeId" });
  const navigate = useNavigate();

  const [node, setNode] = useState<NodeRow | null>(null);
  const [cards, setCards] = useState<NodeCard[] | null>(null);
  const [quizCount, setQuizCount] = useState<number>(0);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [flipped, setFlipped] = useState(false);
  const [companyBrain, setCompanyBrain] = useState<string>("");
  const [sellerIndustry, setSellerIndustry] = useState<string>("");
  const [sellerLevel, setSellerLevel] = useState<string | null>(null);
  const [dynamicCache, setDynamicCache] = useState<Record<string, DynamicContent>>({});
  const [dynamicContextReady, setDynamicContextReady] = useState(false);

  // Atribución de consumo (llm_calls): empresa y vendedor de quien genera.
  const attributionRef = useRef<{ seller_id: string | null; company_id: string | null }>({
    seller_id: null,
    company_id: null,
  });

  // Carga de nodo + tarjetas + count de quiz (para decidir destino post-tarjetas)

  // Todas las lecturas van por PostgREST directo (restGet) para evitar el
  // navigator.locks del SDK de supabase-js que deadlockea con Promise.all.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [n, c, quizRows] = await Promise.all([
          restGetMaybeSingle<NodeRow>(
            `nodes?select=id,name,node_type,practice_script&id=eq.${encodeURIComponent(nodeId)}&limit=1`,
          ),
          restGet<NodeCard>(
            `node_cards?select=id,card_order,card_type,title,body,flip_back_text,card_content_type,audience,skill_ids&node_id=eq.${encodeURIComponent(nodeId)}&order=card_order.asc`,
          ),
          restGet<{ id: string }>(
            `node_quiz_questions?select=id&node_id=eq.${encodeURIComponent(nodeId)}`,
          ),
        ]);
        if (!alive) return;
        setNode(n ?? null);
        setCards(c ?? []);
        setQuizCount(quizRows.length);
      } catch (err) {
        console.error("[nodo] initial load failed", err);
        if (alive) setCards([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [nodeId]);

  // Carga de contexto (company brain + industria) para tarjetas dinámicas
  useEffect(() => {
    let alive = true;
    (async () => {
      const session = getStoredSupabaseSession();
      if (!session) {
        setDynamicContextReady(true);
        return;
      }
      const uid = session.userId;
      try {
        const [profile, seller] = await Promise.all([
          restGetMaybeSingle<{ company_id?: string | null }>(
            `profiles?select=company_id&id=eq.${uid}&limit=1`,
          ),
          restGetMaybeSingle<{ id?: string; experience_level?: string | null; company_id?: string | null }>(
            `sellers?select=id,experience_level,company_id&profile_id=eq.${uid}&limit=1`,
          ),
        ]);
        if (alive) {
          setSellerLevel(seller?.experience_level ?? null);
          attributionRef.current = {
            seller_id: seller?.id ?? null,
            company_id: seller?.company_id ?? profile?.company_id ?? null,
          };
        }
        const companyId = profile?.company_id;
        if (!companyId) {
          if (alive) setDynamicContextReady(true);
          return;
        }
        const company = await restGetMaybeSingle<{ name?: string; company_sales_brain?: any }>(
          `companies?select=name,company_sales_brain&id=eq.${companyId}&limit=1`,
        );
        if (!alive) return;
        if (!company) {
          setDynamicContextReady(true);
          return;
        }
        const brain = company.company_sales_brain;
        const companyName = company.name ?? "";
        const brainObj =
          brain && typeof brain === "object"
            ? { company_name: companyName, ...brain }
            : { company_name: companyName, notes: typeof brain === "string" ? brain : "" };
        const brainStr = JSON.stringify(brainObj);
        const industry =
          (brain && typeof brain === "object" && (brain.industry || brain.sector || brain.industria)) || "";
        setCompanyBrain(brainStr);
        setSellerIndustry(String(industry || ""));
        setDynamicContextReady(true);
      } catch (err) {
        console.error("[nodo] context load failed", err);
        if (alive) setDynamicContextReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);


  // Filtrado por audience (nueva fuente única de personalización).
  // audience IS NULL → tarjeta universal; audience = sellerLevel → tarjeta segmentada.
  const visibleCards = useMemo(() => {
    if (!cards) return cards;
    return cards.filter((c) => {
      if (!c.audience) return true;
      if (!sellerLevel) return false;
      return c.audience === sellerLevel;
    });
  }, [cards, sellerLevel]);

  const total = visibleCards?.length ?? 0;
  const current = visibleCards?.[index];

  // Reset flip al cambiar de tarjeta
  useEffect(() => {
    setFlipped(false);
  }, [index]);

  // Si el index queda fuera de rango tras filtrar, vuelve al inicio
  useEffect(() => {
    if (visibleCards && index >= visibleCards.length && visibleCards.length > 0) {
      setIndex(0);
    }
  }, [visibleCards, index]);

  // Generación dinámica en paralelo de TODAS las tarjetas dynamic good/bad_example,
  // disparada una sola vez cuando el nodo + tarjetas + contexto están listos.
  const generatedRef = useRef(false);
  useEffect(() => {
    if (generatedRef.current) return;
    if (!cards || !node) return;
    if (!dynamicContextReady) return;
    const dynamicCards = cards.filter(
      (c) =>
        c.card_content_type === "dynamic" &&
        (c.card_type === "good_example" || c.card_type === "bad_example"),
    );
    if (dynamicCards.length === 0) {
      generatedRef.current = true;
      return;
    }
    generatedRef.current = true;
    let alive = true;
    setDynamicCache((prev) => {
      const next = { ...prev };
      for (const c of dynamicCards) next[c.id] = { loading: true };
      return next;
    });
    (async () => {
      const results = await Promise.all(
        dynamicCards.map(async (c) => {
          try {
            // Scope preferido: campo estructurado skill_ids de la tarjeta.
            // Fallback: skills_in_focus del practice_script (nodos con script).
            const scriptSkills =
              node?.practice_script?.scope?.skills_in_focus ??
              node?.practice_script?.scope?.skillsInFocus ??
              [];
            const skillsInFocus =
              (c.skill_ids && c.skill_ids.length > 0) ? c.skill_ids : scriptSkills;
            const data = await invokeFunctionJson<any>(
              "closer-voice",
              {
                phase: "generate_example",
                card_type: c.card_type,
                node_name: node?.name ?? "",
                scope: { skills_in_focus: skillsInFocus },
                company_brain: companyBrain,
                seller_industry: sellerIndustry,
                card_title: c.title ?? "",
                card_body_brief: c.body ?? "",
                company_id: attributionRef.current.company_id,
                seller_id: attributionRef.current.seller_id,
              },
              { timeoutMs: 20_000 },
            );
            if (!data || typeof data.body !== "string") {
              return [c.id, { loading: false, body: c.body, flip_back: c.flip_back_text ?? "", error: "generation_failed" }] as const;
            }
            return [
              c.id,
              {
                loading: false,
                body: data.body,
                flip_back: data.flip_back,
              },
            ] as const;
          } catch (e) {
            return [
              c.id,
              {
                loading: false,
                body: c.body,
                flip_back: c.flip_back_text ?? "No se pudo generar el análisis dinámico. Puedes avanzar sin perder progreso.",
                error: e instanceof Error ? e.message : String(e),
              },
            ] as const;
          }
        }),
      );
      if (!alive) return;
      setDynamicCache((prev) => {
        const next = { ...prev };
        for (const [id, content] of results) next[id] = content;
        return next;
      });
    })();
    return () => {
      alive = false;
    };
  }, [cards, node, companyBrain, sellerIndustry, dynamicContextReady]);



  function goBack() {
    navigate({ to: "/mapa" });
  }

  function next() {
    if (index < total - 1) {
      setDirection(1);
      setFlipped(false); // resetea inmediato para evitar mostrar el reverso en el primer frame
      setIndex(index + 1);
    }
  }
  function prev() {
    if (index > 0) {
      setDirection(-1);
      setFlipped(false);
      setIndex(index - 1);
    }
  }

  const isFlipCard = current?.card_type === "good_example" || current?.card_type === "bad_example";
  const isCta = current?.card_type === "cta";
  const dynamicForCurrent = current ? dynamicCache[current.id] : undefined;
  const dynamicFailed = !!dynamicForCurrent?.error;
  const showNextButton = !isFlipCard || flipped || dynamicFailed;

  // ───── Render ─────
  return (
    <>
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--c-bg)",
        color: "var(--c-text)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      {/* Encabezado: regresar, nombre del nodo y la barra de avance por tarjeta */}
      <div style={{ flexShrink: 0, width: "100%", maxWidth: 560, margin: "0 auto", boxSizing: "border-box", padding: "12px var(--m-pantalla) 0" }}>
        <EncabezadoPantalla
          onRegresar={goBack}
          etiquetaRegresar="Volver al mapa"
          centro={
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {node?.name ?? ""}
            </div>
          }
        />
        {total > 0 && (
          <div style={{ marginTop: 14 }}>
            <BarraSegmentos colores={segmentosDeAvance(total, index)} />
          </div>
        )}
      </div>

      {/* Card area */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "24px var(--m-pantalla) 0",
          display: "flex",
          flexDirection: "column",
          // Antes: centrado y con el desborde cortado — una tarjeta larga se
          // ocultaba sin poder bajar. Ahora se desplaza, y sigue centrada
          // cuando cabe (el margen automático del hijo la centra).
          justifyContent: "flex-start",
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {visibleCards === null || visibleCards === undefined ? null : visibleCards.length === 0 ? (
          <FallbackEmpty />
        ) : (
          <CardSwiper
            card={current!}
            direction={direction}
            flipped={flipped}
            setFlipped={setFlipped}
            onSwipeLeft={next}
            onSwipeRight={prev}
            canSwipeLeft={index < total - 1}
            canSwipeRight={index > 0}
            dynamic={dynamicCache[current!.id]}
          />
        )}

      </div>

      {/* Bottom button */}
      <div
        style={{
          flexShrink: 0,
          padding: "16px var(--m-pantalla) calc(20px + env(safe-area-inset-bottom))",
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          boxSizing: "border-box",
          display: "flex",
          gap: 12,
        }}
      >
        {visibleCards && visibleCards.length > 0 && index > 0 && (
          <button
            type="button"
            onClick={prev}
            aria-label="Tarjeta anterior"
            style={{ ...estiloBoton("secundario"), width: "var(--h-boton)", flexShrink: 0, color: "var(--c-text-soft)" }}
          >
            <ChevronLeft size={22} strokeWidth={2} aria-hidden />
          </button>
        )}
        {visibleCards && visibleCards.length > 0 && !showNextButton && (
          // Antes el botón se escondía hasta voltear la tarjeta y el vendedor no sabía qué hacer.
          <button type="button" disabled style={estiloBoton("principal", true)}>
            Primero descubre por qué
          </button>
        )}
        {visibleCards && visibleCards.length > 0 && showNextButton && (
          <BottomButton
            card={current!}
            nodeType={node?.node_type ?? "knowledge"}
            isLast={index === total - 1}
            hasQuiz={quizCount > 0}
            hasScript={!!node?.practice_script}
            onNext={next}
            onFinish={() => {
              const hasQuiz = quizCount > 0;
              const hasScript = !!node?.practice_script;
              if (hasQuiz) {
                navigate({ to: "/nodo/$nodeId/quiz", params: { nodeId } });
              } else if (hasScript) {
                navigate({ to: "/nodo/$nodeId/practica", params: { nodeId } });
              } else {
                // Nodo de solo lectura (sin quiz ni práctica): leerlo lo da por
                // hecho y abre el siguiente. Antes solo volvía al mapa y el
                // vendedor se quedaba atorado ahí (p. ej. el 3.7).
                void (async () => {
                  try {
                    const sellerId = attributionRef.current?.seller_id;
                    if (sellerId) {
                      const previo = await restGetMaybeSingle<{ id: string; status: string }>(
                        `node_progress?select=id,status&seller_id=eq.${sellerId}&node_id=eq.${encodeURIComponent(nodeId)}&limit=1`,
                      );
                      if (previo?.id) {
                        if (previo.status !== "done") await restMutate(`node_progress?id=eq.${previo.id}`, { method: "PATCH", body: { status: "done" } });
                      } else {
                        // Sin "stars": la base pone 0 (la columna no acepta vacío; oct-2026,
                        // con las estrellas en vacío el guardado fallaba y el vendedor se quedaba atorado).
                        const companyId = attributionRef.current?.company_id;
                        if (!companyId) throw new Error("vendedor sin empresa");
                        await restMutate("node_progress", { method: "POST", body: { seller_id: sellerId, company_id: companyId, node_id: nodeId, status: "done" } });
                      }
                    }
                  } catch (err) {
                    // Nunca en silencio: si no se guardó, el vendedor lo sabe y puede reintentar.
                    console.error("[nodo] no se pudo cerrar el nodo de lectura:", err);
                    toast.error("No pudimos guardar tu avance. Toca «Terminar» otra vez.");
                    return;
                  }
                  navigate({ to: "/mapa" });
                })();
              }
            }}
          />
        )}
      </div>
    </motion.div>
    <Outlet />
    </>
  );
}

// ───────────────────────── Card Swiper ─────────────────────────

function CardSwiper({
  card,
  direction,
  flipped,
  setFlipped,
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft,
  canSwipeRight,
  dynamic,
}: {
  card: NodeCard;
  direction: 1 | -1;
  flipped: boolean;
  setFlipped: (v: boolean) => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  dynamic?: DynamicContent;
}) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const moved = useRef(false);

  const isFlipCard = card.card_type === "good_example" || card.card_type === "bad_example";

  function onPointerDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    startY.current = e.clientY;
    moved.current = false;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 10) moved.current = true;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - (startY.current ?? 0);
    startX.current = null;
    startY.current = null;
    // swipe horizontal claro
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && canSwipeLeft) onSwipeLeft();
      else if (dx > 0 && canSwipeRight) onSwipeRight();
      return;
    }
    // tap (no se movió)
    if (!moved.current && isFlipCard) {
      setFlipped(!flipped);
    }
  }

  return (
    <div style={{ position: "relative", width: "100%", flexShrink: 0, paddingBottom: 16 }}>
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={card.id}
          custom={direction}
          initial={{ x: direction * 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.8 }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            width: "100%",
            touchAction: "pan-y",
            userSelect: "none",
          }}
        >
          <CardView card={card} flipped={flipped} setFlipped={setFlipped} dynamic={dynamic} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ───────────────────────── Card View ─────────────────────────

const CARD_STYLES: Record<CardType, { border: string; bg: string }> = {
  concept: { border: "var(--c-border)", bg: "var(--c-surface)" },
  why_it_works: { border: "rgb(var(--c-client-rgb) / 0.35)", bg: "var(--c-surface)" },
  good_example: { border: "rgb(var(--c-success-rgb) / 0.35)", bg: "var(--c-surface)" },
  bad_example: { border: "rgb(var(--c-danger-rgb) / 0.35)", bg: "var(--c-surface)" },
  cta: { border: "rgb(var(--c-primary-rgb) / 0.35)", bg: "linear-gradient(180deg, rgb(var(--c-primary-rgb) / 0.10) 0%, rgb(var(--c-primary-rgb) / 0.04) 100%)" },
};

function CardView({ card, flipped, setFlipped, dynamic }: { card: NodeCard; flipped: boolean; setFlipped: (v: boolean) => void; dynamic?: DynamicContent }) {
  const isFlip = card.card_type === "good_example" || card.card_type === "bad_example";
  const isCta = card.card_type === "cta";
  const [hintActive, setHintActive] = useState(false);

  useEffect(() => {
    if (!isFlip) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("closer_flip_hint_seen") === "true") return;
    const t = setTimeout(() => {
      setHintActive(true);
      try { window.localStorage.setItem("closer_flip_hint_seen", "true"); } catch {}
      setTimeout(() => setHintActive(false), 700);
    }, 1500);
    return () => clearTimeout(t);
  }, [isFlip]);

  if (isCta) {
    return <CtaFace card={card} />;
  }

  if (!isFlip) {
    return <StaticFace card={card} />;
  }

  const animateRotate = flipped ? 180 : (hintActive ? [0, 15, 0] : 0);
  const transition = hintActive && !flipped
    ? { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
    : { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] };

  // Flip card
  return (
    <div style={{ perspective: 1200, width: "100%" }}>
      <motion.div
        key={card.id}
        initial={{ rotateY: 0 }}
        animate={{ rotateY: animateRotate }}
        transition={transition}
        style={{
          // Las dos caras ocupan la misma celda: la tarjeta mide lo que mida la cara más larga.
          // Antes medía siempre 360 px (hueco en las cortas, texto encimado en las largas).
          display: "grid",
          width: "100%",
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
      >
        {/* En iPhone, sin el -webkit- la cara de enfrente se transparentaba al voltear y se leía en espejo. */}
        <div style={{ gridArea: "1 / 1", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(0deg)", display: "flex", flexDirection: "column" }}>
          <FlipFront card={card} dynamic={dynamic} />
        </div>
        <div
          style={{
            gridArea: "1 / 1",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <FlipBack card={card} onFlipBack={() => setFlipped(false)} dynamic={dynamic} />
        </div>
      </motion.div>
    </div>
  );
}


// ───────────────────────── Faces ─────────────────────────

function StaticFace({ card }: { card: NodeCard }) {
  const styles = CARD_STYLES[card.card_type];
  return (
    <div
      style={{
        border: `1px solid ${styles.border}`,
        background: styles.bg,
        borderRadius: "var(--r-tarjeta)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {card.card_type === "concept" && <Etiqueta texto="Concepto" />}
      {card.card_type === "why_it_works" && <Etiqueta texto="Por qué funciona" color="var(--c-client)" />}
      {card.title && (
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 23, color: "var(--c-text)", lineHeight: 1.25, letterSpacing: "-0.015em" }}>
          {card.title}
        </div>
      )}
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          fontSize: 16,
          color: "var(--c-text-soft)",
          lineHeight: 1.6,
          whiteSpace: "pre-line",
        }}
      >
        {card.body}
      </div>
    </div>
  );
}

function Skeleton({ width = "100%", height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 100%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}

function FlipFront({ card, dynamic }: { card: NodeCard; dynamic?: DynamicContent }) {
  const styles = CARD_STYLES[card.card_type];
  const isGood = card.card_type === "good_example";
  const isDynamic = card.card_content_type === "dynamic";
  const loading = isDynamic && (!dynamic || dynamic.loading);
  const bodyText = isDynamic ? (dynamic?.body ?? "") : card.body;
  return (
    <div
      style={{
        border: `1px solid ${styles.border}`,
        background: styles.bg,
        borderRadius: "var(--r-tarjeta)",
        padding: 24,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <style>{`@keyframes skeleton-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <Pastilla texto={isGood ? "Ejemplo bueno" : "Ejemplo malo"} bueno={isGood} />
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Skeleton width="92%" />
          <Skeleton width="86%" />
          <Skeleton width="70%" />
        </div>
      ) : (
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: 17,
            color: "var(--c-text)",
            lineHeight: 1.6,
            whiteSpace: "pre-line",
          }}
        >
          {bodyText}
        </div>
      )}
      <div style={{ flex: 1 }} />
      {/* Toda la tarjeta se voltea al tocarla; esto solo dice que se puede. */}
      <PistaVoltear texto={isGood ? "¿Por qué funciona?" : "¿Por qué falla?"} bueno={isGood} />
    </div>
  );
}


function FlipBack({ card, onFlipBack, dynamic }: { card: NodeCard; onFlipBack: () => void; dynamic?: DynamicContent }) {
  const styles = CARD_STYLES[card.card_type];
  const isGood = card.card_type === "good_example";
  const isDynamic = card.card_content_type === "dynamic";
  const loading = isDynamic && (!dynamic || dynamic.loading);
  const backText = isDynamic ? (dynamic?.flip_back ?? "") : (card.flip_back_text ?? "");
  return (
    <div
      style={{
        border: `1px solid ${styles.border}`,
        background: "var(--c-elevated)",
        borderRadius: "var(--r-tarjeta)",
        padding: 24,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Pastilla texto={isGood ? "¿Por qué funciona?" : "¿Por qué falla?"} bueno={isGood} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFlipBack();
          }}
          aria-label="Voltear de regreso"
          style={{
            background: "transparent",
            border: "none",
            color: "var(--c-text-2)",
            cursor: "pointer",
            width: 44,
            height: 44,
            margin: -10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RotateCw size={18} aria-hidden />
        </button>
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Skeleton width="90%" />
          <Skeleton width="78%" />
        </div>
      ) : (
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 400,
            fontSize: 16,
            color: "var(--c-text-soft)",
            lineHeight: 1.6,
            whiteSpace: "pre-line",
          }}
        >
          {backText}
        </div>
      )}
    </div>
  );
}

function CtaFace({ card }: { card: NodeCard }) {
  const styles = CARD_STYLES.cta;
  return (
    <div
      style={{
        border: `1px solid ${styles.border}`,
        background: styles.bg,
        borderRadius: "var(--r-tarjeta)",
        padding: 36,
        minHeight: 320,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: 23,
          color: "var(--c-text)",
          lineHeight: 1.3,
          whiteSpace: "pre-line",
        }}
      >
        {card.body}
      </div>
    </div>
  );
}

/** Etiqueta corta en mayúsculas (Concepto, Por qué funciona). */
function Etiqueta({ texto, color = "var(--c-text-2)" }: { texto: string; color?: string }) {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color }}>
      {texto}
    </div>
  );
}

/** Pastilla verde (bueno) o roja (malo). */
function Pastilla({ texto, bueno }: { texto: string; bueno: boolean }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignSelf: "flex-start",
        alignItems: "center",
        height: 28,
        padding: "0 12px",
        borderRadius: 14,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: 13,
        color: bueno ? "var(--c-success)" : "var(--c-danger)",
        background: bueno ? "rgb(var(--c-success-rgb) / 0.12)" : "rgb(var(--c-danger-rgb) / 0.12)",
      }}
    >
      {texto}
    </div>
  );
}

/** Dice que la tarjeta se voltea. Es parte de la tarjeta: tocar en cualquier parte la voltea. */
function PistaVoltear({ texto, bueno }: { texto: string; bueno: boolean }) {
  const c = bueno ? "var(--c-success)" : "var(--c-danger)";
  const rgb = bueno ? "var(--c-success-rgb)" : "var(--c-danger-rgb)";
  return (
    <div
      aria-hidden
      style={{
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        height: 44,
        padding: "0 16px",
        borderRadius: 12,
        border: `1.5px solid rgb(${rgb} / 0.45)`,
        color: c,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: 15,
      }}
    >
      <RotateCw size={16} strokeWidth={2} />
      {texto}
    </div>
  );
}

// ───────────────────────── Bottom Button ─────────────────────────

function BottomButton({
  card,
  nodeType,
  isLast,
  hasQuiz,
  hasScript,
  onNext,
  onFinish,
}: {
  card: NodeCard;
  nodeType: string;
  isLast: boolean;
  hasQuiz: boolean;
  hasScript: boolean;
  onNext: () => void;
  onFinish: () => void;
}) {
  const finishConfig = useMemo(() => {
    // Prioriza destino real (quiz/practica) sobre node_type.
    if (hasQuiz) return { label: "Ponlo a prueba" };
    if (hasScript) {
      if (nodeType === "boss") return { label: "Entrar al examen" };
      if (nodeType === "full_sim") return { label: "Ver demostración" };
      return { label: "Practicar" };
    }
    return { label: "Terminar" };
  }, [nodeType, hasQuiz, hasScript]);

  const isCta = card.card_type === "cta";
  const isFlipBack = card.card_type === "good_example" || card.card_type === "bad_example";
  // Regla única: el botón FINALIZA (quiz/practica/mapa) cuando es tarjeta CTA
  // O cuando es la última tarjeta del set. Así ningún nodo queda sin salida.
  const isFinishButton = isCta || isLast;

  return (
    <motion.button
      key={`${card.id}-${isFinishButton ? "finish" : "next"}`}
      initial={isFlipBack ? { opacity: 0 } : { opacity: 1 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onClick={isFinishButton ? onFinish : onNext}
      style={estiloBoton("principal")}
    >
      {isFinishButton ? finishConfig.label : "Siguiente"}
    </motion.button>
  );
}

// ───────────────────────── Fallback ─────────────────────────

function FallbackEmpty() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 40,
        textAlign: "center",
      }}
    >
      <Wrench size={32} strokeWidth={1.6} color="var(--c-text-2)" aria-hidden />
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          color: "var(--c-text-2)",
          fontSize: 15,
        }}
      >
        Contenido en preparación.
      </div>
    </div>
  );
}
