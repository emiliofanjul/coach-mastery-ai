import { createFileRoute, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, RotateCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

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

  // Carga de nodo + tarjetas + count de quiz (para decidir destino post-tarjetas)
  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: n }, { data: c }, { count: qc }] = await Promise.all([
        supabase.from("nodes").select("id,name,node_type,practice_script").eq("id", nodeId).maybeSingle(),
        supabase
          .from("node_cards")
          .select("id,card_order,card_type,title,body,flip_back_text,card_content_type,audience,skill_ids")
          .eq("node_id", nodeId)
          .order("card_order", { ascending: true }),
        supabase
          .from("node_quiz_questions")
          .select("id", { count: "exact", head: true })
          .eq("node_id", nodeId),
      ]);
      if (!alive) return;
      setNode((n as NodeRow | null) ?? null);
      setCards((c as NodeCard[] | null) ?? []);
      setQuizCount(qc ?? 0);
    })();
    return () => {
      alive = false;
    };
  }, [nodeId]);

  // Carga de contexto (company brain + industria) para tarjetas dinámicas
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", uid)
        .maybeSingle();
      const companyId = (profile as { company_id?: string } | null)?.company_id;
      const { data: seller } = await supabase
        .from("sellers")
        .select("experience_level")
        .eq("profile_id", uid)
        .maybeSingle();
      if (alive) {
        const lvl = (seller as { experience_level?: string | null } | null)?.experience_level ?? null;
        setSellerLevel(lvl);
      }
      if (!companyId) return;
      const { data: company } = await supabase
        .from("companies")
        .select("name, company_sales_brain")
        .eq("id", companyId)
        .maybeSingle();
      if (!alive || !company) return;
      const brain = (company as any).company_sales_brain;
      const companyName = (company as any).name ?? "";
      // Incluimos el nombre real de la empresa dentro del payload del brain.
      // Antes solo mandábamos company_sales_brain (que no siempre trae `name`),
      // así que el generador de ejemplos inventaba empresas ("Productos Industriales del Norte").
      // Ahora el I DO y las tarjetas dynamic comparten el mismo contexto: nombre + brain.
      const brainObj =
        brain && typeof brain === "object"
          ? { company_name: companyName, ...brain }
          : { company_name: companyName, notes: typeof brain === "string" ? brain : "" };
      const brainStr = JSON.stringify(brainObj);
      const industry =
        (brain && typeof brain === "object" && (brain.industry || brain.sector || brain.industria)) || "";
      setCompanyBrain(brainStr);
      setSellerIndustry(String(industry || ""));
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
    if (!companyBrain && !sellerIndustry) return; // espera a que el contexto cargue
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
            const { data, error } = await supabase.functions.invoke("closer-voice", {
              body: {
                phase: "generate_example",
                card_type: c.card_type,
                node_name: node?.name ?? "",
                scope: { skills_in_focus: skillsInFocus },
                company_brain: companyBrain,
                seller_industry: sellerIndustry,
                card_title: c.title ?? "",
                card_body_brief: c.body ?? "",
              },
            });
            if (error || !data || typeof (data as any).body !== "string") {
              return [c.id, { loading: false, error: error?.message ?? "generation_failed" }] as const;
            }
            return [
              c.id,
              {
                loading: false,
                body: (data as any).body,
                flip_back: (data as any).flip_back,
              },
            ] as const;
          } catch (e) {
            return [
              c.id,
              { loading: false, error: e instanceof Error ? e.message : String(e) },
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
  }, [cards, node, companyBrain, sellerIndustry]);



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
  const showNextButton = !isFlipCard || flipped;

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
        background: "#08080F",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          display: "grid",
          gridTemplateColumns: "44px 1fr 60px",
          alignItems: "center",
          padding: "14px 1.2rem",
          gap: 8,
        }}
      >
        <button
          onClick={goBack}
          aria-label="Volver al mapa"
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            padding: 8,
            margin: -8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <ArrowLeft size={22} />
        </button>
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            color: "#fff",
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {node?.name ?? ""}
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.82rem",
            color: "rgba(255,255,255,0.5)",
            textAlign: "right",
          }}
        >
          {total > 0 ? `${index + 1} de ${total}` : ""}
        </div>
      </div>

      {/* Card area */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          padding: "0 1.2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minHeight: 0,
          overflow: "hidden",
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

        {/* Dots */}
        {visibleCards && visibleCards.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 6,
              marginTop: 24,
              marginBottom: 8,
            }}
          >
            {visibleCards.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: i === index ? "#fff" : "rgba(255,255,255,0.2)",
                  transition: "background 0.2s ease",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div
        style={{
          flexShrink: 0,
          padding: "16px 1.2rem calc(20px + env(safe-area-inset-bottom))",
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          minHeight: 84,
        }}
      >
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
                // Nodo sin quiz ni script — cierra al mapa (caso raro/legacy)
                navigate({ to: "/mapa" });
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
    <div style={{ position: "relative", width: "100%", minHeight: 360 }}>
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
  concept: { border: "rgba(255,255,255,0.08)", bg: "transparent" },
  why_it_works: { border: "rgba(77,171,247,0.4)", bg: "rgba(77,171,247,0.04)" },
  good_example: { border: "rgba(6,214,160,0.4)", bg: "rgba(6,214,160,0.04)" },
  bad_example: { border: "rgba(239,71,111,0.4)", bg: "rgba(239,71,111,0.04)" },
  cta: { border: "rgba(255,107,43,0.35)", bg: "linear-gradient(180deg, rgba(255,107,43,0.10) 0%, rgba(255,107,43,0.04) 100%)" },
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
          position: "relative",
          width: "100%",
          transformStyle: "preserve-3d",
          minHeight: 360,
        }}
      >
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
          <FlipFront card={card} dynamic={dynamic} />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
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
        borderRadius: 14,
        padding: 24,
        minHeight: 360,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {card.card_type === "concept" && <Badge label="CONCEPTO" color="rgba(255,255,255,0.4)" bg="rgba(255,255,255,0.06)" />}
      {card.card_type === "why_it_works" && <Badge label="💡 POR QUÉ FUNCIONA" color="#4DABF7" bg="rgba(77,171,247,0.10)" />}
      {card.title && (
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 22, color: "#fff", lineHeight: 1.2 }}>
          {card.title}
        </div>
      )}
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 400,
          fontSize: 15,
          color: "rgba(255,255,255,0.75)",
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
        borderRadius: 14,
        padding: 24,
        minHeight: 360,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "relative",
      }}
    >
      <style>{`@keyframes skeleton-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      <Badge
        label={isGood ? "✓ EJEMPLO BUENO" : "✗ EJEMPLO MALO"}
        color={isGood ? "#06D6A0" : "#EF476F"}
        bg={isGood ? "rgba(6,214,160,0.10)" : "rgba(239,71,111,0.10)"}
      />
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
            fontSize: 15,
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.6,
            fontStyle: "italic",
            whiteSpace: "pre-line",
          }}
        >
          {bodyText}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <style>{`@keyframes chip-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.75; transform: scale(0.96); } }`}</style>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 16,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 99,
            background: isGood ? "#06D6A0" : "#EF476F",
            color: "#08080F",
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: "0.8px",
            animation: "chip-pulse 2s ease-in-out infinite",
            whiteSpace: "nowrap",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#08080F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="8 7 17 7 17 16" />
          </svg>
          DESCUBRE POR QUÉ
        </div>
      </div>

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
        background: "rgba(255,255,255,0.03)",
        borderRadius: 14,
        padding: 24,
        minHeight: 360,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Badge
          label={isGood ? "¿Por qué funciona?" : "¿Por qué falla?"}
          color={isGood ? "#06D6A0" : "#EF476F"}
          bg={isGood ? "rgba(6,214,160,0.10)" : "rgba(239,71,111,0.10)"}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFlipBack();
          }}
          aria-label="Voltear de regreso"
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.5)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
          }}
        >
          <RotateCw size={16} />
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
            fontSize: 15,
            color: "rgba(255,255,255,0.85)",
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
        borderRadius: 14,
        padding: 36,
        minHeight: 400,
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
          fontSize: 22,
          color: "#fff",
          lineHeight: 1.3,
          whiteSpace: "pre-line",
        }}
      >
        {card.body}
      </div>
    </div>
  );
}

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignSelf: "flex-start",
        background: bg,
        color,
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: "1.5px",
        borderRadius: 99,
        padding: "4px 12px",
      }}
    >
      {label}
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
    if (hasQuiz) return { label: "Ponlo a prueba →", color: "#FF6B2B" };
    if (hasScript) {
      if (nodeType === "boss") return { label: "Entrar →", color: "#EF476F" };
      if (nodeType === "full_sim") return { label: "Ver demostración →", color: "#FF6B2B" };
      return { label: "Practicar →", color: "#FF6B2B" };
    }
    return { label: "Terminar →", color: "#FF6B2B" };
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
      style={{
        width: "100%",
        height: 52,
        borderRadius: 99,
        border: "none",
        background: isFinishButton ? finishConfig.color : "#FF6B2B",
        color: "#08080F",
        fontFamily: "Syne, sans-serif",
        fontWeight: 700,
        fontSize: 16,
        cursor: "pointer",
        boxShadow: "0 10px 30px -8px rgba(255,107,43,0.45)",
      }}
    >
      {isFinishButton ? finishConfig.label : "Siguiente →"}
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
      <div style={{ fontSize: 36 }}>🔧</div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          color: "rgba(255,255,255,0.4)",
          fontSize: 15,
        }}
      >
        Contenido en preparación.
      </div>
    </div>
  );
}
