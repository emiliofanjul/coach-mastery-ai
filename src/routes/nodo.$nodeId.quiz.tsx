import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import VictoryScreen from "@/components/VictoryScreen";
import RetryScreen from "@/components/RetryScreen";
import { setNodeCompletionSignal } from "@/lib/node-completion";

export const Route = createFileRoute("/nodo/$nodeId/quiz")({
  component: NodoQuizPage,
  head: () => ({ meta: [{ title: "Quiz — Closer" }] }),
});

type Letter = "A" | "B" | "C" | "D";

interface QuizQuestion {
  id: string;
  question_order: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: Letter;
  explanation_correct: string;
  explanation_wrong: string;
}

const ORANGE = "#FF6B2B";
const GREEN = "#06D6A0";
const RED = "#EF476F";

function NodoQuizPage() {
  const { nodeId } = useParams({ from: "/nodo/$nodeId/quiz" });
  const navigate = useNavigate();
  // sessionStorage signal — see lib/node-completion.ts

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Letter | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  // Si el nodo era el primero del mundo (para texto del VictoryScreen)
  const [isFirstNodeInWorld, setIsFirstNodeInWorld] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: q }, { data: nodeRow }] = await Promise.all([
        supabase
          .from("node_quiz_questions")
          .select("*")
          .eq("node_id", nodeId)
          .order("question_order", { ascending: true }),
        supabase
          .from("nodes")
          .select("order_index")
          .eq("id", nodeId)
          .maybeSingle(),
      ]);
      if (!alive) return;
      setQuestions((q as QuizQuestion[] | null) ?? []);
      setIsFirstNodeInWorld(((nodeRow as { order_index?: number } | null)?.order_index ?? -1) === 0);
    })();
    return () => {
      alive = false;
    };
  }, [nodeId]);

  const total = questions?.length ?? 0;
  const current = questions?.[index];

  function handleSelect(letter: Letter) {
    if (selected || !current) return;
    setSelected(letter);
    if (letter === current.correct_option) {
      setCorrectCount((c) => c + 1);
    }
  }

  function handleNext() {
    if (index < total - 1) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  }

  function resetQuiz() {
    setIndex(0);
    setSelected(null);
    setCorrectCount(0);
    setFinished(false);
  }

  async function handleContinueToMap() {
    console.log("[quiz→mapa] handler START", { nodeId, saving });
    setSaving(true);
    const fail = (where: string, err: unknown) => {
      console.error(`[quiz→mapa] ${where} falló:`, err);
      try {
        console.error(`[quiz→mapa] detalle:`, JSON.stringify(err, null, 2));
      } catch {}
      toast.error(`Algo salió mal en: ${where}. Revisa la consola.`);
      setSaving(false);
    };
    try {
      const stars: 1 | 2 | 3 = 3;
      console.log("[quiz→mapa] llamando supabase.auth.getUser()");

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr || !auth?.user?.id) {
        return fail("auth.getUser", authErr ?? "no user");
      }
      const userId = auth.user.id;

      console.log("[quiz→mapa] userId:", userId);

      const { data: seller, error: sellerErr } = await supabase
        .from("sellers")
        .select("id, company_id")
        .eq("profile_id", userId)
        .maybeSingle();
      if (sellerErr) return fail("select sellers", sellerErr);
      if (!seller) return fail("seller no encontrado", { userId });
      console.log("[quiz→mapa] seller:", seller);

      const { data: existing, error: existingErr } = await supabase
        .from("node_progress")
        .select("id, status, stars")
        .eq("seller_id", seller.id)
        .eq("node_id", nodeId)
        .maybeSingle();
      if (existingErr) return fail("select node_progress actual", existingErr);
      console.log("[quiz→mapa] node_progress existing:", existing);

      const wasCompleted = existing?.status === "done";
      const previousStars = (existing?.stars as number | null) ?? 0;
      const improved = stars > previousStars;
      const newStars = Math.max(stars, previousStars);

      if (existing) {
        const { error } = await supabase
          .from("node_progress")
          .update({
            status: "done",
            stars: newStars,
            last_practiced_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) return fail("update node_progress", error);
      } else {
        const { error } = await supabase.from("node_progress").insert({
          seller_id: seller.id,
          company_id: seller.company_id,
          node_id: nodeId,
          status: "done",
          stars: newStars,
          last_practiced_at: new Date().toISOString(),
        });
        if (error) return fail("insert node_progress", error);
      }

      if (!wasCompleted) {
        const { data: currentNode, error: cnErr } = await supabase
          .from("nodes")
          .select("world_id, order_index")
          .eq("id", nodeId)
          .maybeSingle();
        if (cnErr) return fail("select nodes (actual)", cnErr);

        let nextNodeId: string | null = null;
        if (currentNode) {
          const { data: nextSame, error: nsErr } = await supabase
            .from("nodes")
            .select("id")
            .eq("world_id", currentNode.world_id)
            .gt("order_index", currentNode.order_index)
            .order("order_index", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (nsErr) return fail("select siguiente nodo (mismo mundo)", nsErr);
          if (nextSame) {
            nextNodeId = nextSame.id;
          } else {
            const { data: nextWorld, error: nwErr } = await supabase
              .from("nodes")
              .select("id")
              .gt("world_id", currentNode.world_id)
              .order("world_id", { ascending: true })
              .order("order_index", { ascending: true })
              .limit(1)
              .maybeSingle();
            if (nwErr) return fail("select siguiente nodo (siguiente mundo)", nwErr);
            if (nextWorld) nextNodeId = nextWorld.id;
          }
        }

        if (nextNodeId) {
          const { data: nextProg, error: npErr } = await supabase
            .from("node_progress")
            .select("id, status")
            .eq("seller_id", seller.id)
            .eq("node_id", nextNodeId)
            .maybeSingle();
          if (npErr) return fail("select node_progress siguiente", npErr);

          if (nextProg) {
            if (nextProg.status === "locked") {
              const { error } = await supabase
                .from("node_progress")
                .update({ status: "current" })
                .eq("id", nextProg.id);
              if (error) return fail("update siguiente node_progress a active", error);
            }
          } else {
            const { error } = await supabase.from("node_progress").insert({
              seller_id: seller.id,
              company_id: seller.company_id,
              node_id: nextNodeId,
              status: "current",
            });
            if (error) return fail("insert siguiente node_progress", error);
          }

          const { error: updSellerErr } = await supabase
            .from("sellers")
            .update({ current_node: nextNodeId })
            .eq("id", seller.id);
          if (updSellerErr) return fail("update sellers.current_node", updSellerErr);
        }
      }

      setNodeCompletionSignal({
        nodeId,
        stars: newStars as 1 | 2 | 3,
        isReplay: wasCompleted,
        improved,
      });

      navigate({ to: "/mapa" });
    } catch (e) {
      fail("excepción inesperada", e);
    }
  }

  function backToCards() {
    navigate({ to: "/nodo/$nodeId", params: { nodeId } });
  }

  const progress = total === 0 ? 0 : ((finished ? total : index) / total) * 100;
  const passed = finished && total > 0 && correctCount === total;

  // Pantallas de cierre — usan los componentes nuevos
  if (finished && passed) {
    return (
      <VictoryScreen
        stars={3}
        title={isFirstNodeInWorld ? "¡Primer nodo desbloqueado!" : "¡Nodo completado!"}
        subtitle="El primer paso empieza ahora."
        buttonText={saving ? "Guardando..." : "Siguiente →"}
        onContinue={() => {
          if (!saving) handleContinueToMap();
        }}
      />
    );
  }

  if (finished && !passed) {
    return (
      <RetryScreen
        title="Casi."
        subtitle="Repasa las tarjetas y vuelve a intentarlo."
        primaryButtonText="Intentar de nuevo →"
        onPrimaryAction={resetQuiz}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
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
          gridTemplateColumns: "44px 1fr 44px",
          alignItems: "center",
          padding: "14px 1.2rem 8px",
          gap: 8,
        }}
      >
        <button
          onClick={backToCards}
          aria-label="Volver a las tarjetas"
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            padding: 8,
            margin: -8,
            cursor: "pointer",
            display: "flex",
          }}
        >
          <ArrowLeft size={22} />
        </button>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
          }}
        >
          {total > 0 ? `Pregunta ${index + 1} de ${total}` : ""}
        </div>
        <div />
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 1.2rem 12px", maxWidth: 560, width: "100%", margin: "0 auto" }}>
        <div
          style={{
            height: 4,
            width: "100%",
            background: "rgba(255,255,255,0.08)",
            borderRadius: 99,
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 28 }}
            style={{ height: "100%", background: ORANGE, borderRadius: 99 }}
          />
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          padding: "8px 1.2rem 1.2rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {questions === null ? null : !current ? (
          <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", paddingTop: 40 }}>
            Sin preguntas todavía.
          </div>
        ) : (
          <QuestionView
            key={current.id}
            question={current}
            selected={selected}
            onSelect={handleSelect}
            onNext={handleNext}
            isLast={index === total - 1}
          />
        )}
      </div>
    </motion.div>
  );
}

// ─────────── Question ───────────

function QuestionView({
  question,
  selected,
  onSelect,
  onNext,
  isLast,
}: {
  question: QuizQuestion;
  selected: Letter | null;
  onSelect: (l: Letter) => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const opts: { letter: Letter; text: string }[] = [
    { letter: "A", text: question.option_a },
    { letter: "B", text: question.option_b },
    { letter: "C", text: question.option_c },
    { letter: "D", text: question.option_d },
  ];
  const answered = selected !== null;
  const isCorrect = selected === question.correct_option;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: "flex", flexDirection: "column", gap: 20 }}
    >
      <div
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: "#fff",
          lineHeight: 1.3,
          textAlign: "center",
          padding: "8px 4px 4px",
        }}
      >
        {question.question_text}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {opts.map((opt) => {
          const isSelected = selected === opt.letter;
          const isCorrectOpt = opt.letter === question.correct_option;
          let bg = "rgba(255,255,255,0.04)";
          let border = "rgba(255,255,255,0.08)";
          let badge: { text: string; color: string } | null = null;

          if (answered) {
            if (isCorrectOpt) {
              bg = "rgba(6,214,160,0.12)";
              border = GREEN;
              badge = { text: "✓ Correcto", color: GREEN };
            } else if (isSelected) {
              bg = "rgba(239,71,111,0.12)";
              border = RED;
              badge = { text: "✗ Incorrecto", color: RED };
            }
          }

          return (
            <button
              key={opt.letter}
              disabled={answered}
              onClick={() => onSelect(opt.letter)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                width: "100%",
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 14,
                padding: 16,
                color: "#fff",
                textAlign: "left",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                lineHeight: 1.45,
                cursor: answered ? "default" : "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <span
                style={{
                  color: ORANGE,
                  fontWeight: 700,
                  fontFamily: "Syne, sans-serif",
                  flexShrink: 0,
                  width: 18,
                }}
              >
                {opt.letter}
              </span>
              <span style={{ flex: 1 }}>{opt.text}</span>
              {badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    color: badge.color,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {badge.text}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 14,
              padding: 16,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "rgba(255,255,255,0.7)",
              lineHeight: 1.55,
            }}
          >
            {isCorrect ? question.explanation_correct : question.explanation_wrong}
          </motion.div>
        )}
      </AnimatePresence>

      {answered && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onClick={onNext}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 99,
            border: "none",
            background: ORANGE,
            color: "#08080F",
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 10px 30px -8px rgba(255,107,43,0.45)",
            marginTop: 4,
          }}
        >
          {isLast ? "Ver resultado →" : "Siguiente →"}
        </motion.button>
      )}
    </motion.div>
  );
}
