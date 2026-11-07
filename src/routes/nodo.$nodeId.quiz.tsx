import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarraSegmentos, EncabezadoPantalla, estiloBoton } from "@/components/closer/piezas";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { restGet, restGetMaybeSingle, restMutate } from "@/lib/supabase-rest";
import VictoryScreen from "@/components/VictoryScreen";
import RetryScreen from "@/components/RetryScreen";
import { setNodeCompletionSignal } from "@/lib/node-completion";

export const Route = createFileRoute("/nodo/$nodeId/quiz")({
  component: NodoQuizPage,
  head: () => ({ meta: [{ title: "Quiz — Closer" },
      {"name": "description", "content": "Comprueba lo aprendido en tu entrenamiento de ventas con Closer."},
      {"property": "og:title", "content": "Quiz — Closer"},
      {"property": "og:description", "content": "Comprueba lo aprendido en tu entrenamiento de ventas con Closer."},
      {"property": "og:type", "content": "website"},
      {"name": "twitter:card", "content": "summary"},
    ] }),
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

const GREEN = "var(--c-success)";
const RED = "var(--c-danger)";

function NodoQuizPage() {
  const { nodeId } = useParams({ from: "/nodo/$nodeId/quiz" });
  const navigate = useNavigate();
  // sessionStorage signal — see lib/node-completion.ts

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<Letter | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  // Lo que contestó en cada pregunta: pinta la barra y dice cuáles falló.
  const [respuestas, setRespuestas] = useState<(Letter | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  // Si el nodo era el primero del mundo (para texto del VictoryScreen)
  const [isFirstNodeInWorld, setIsFirstNodeInWorld] = useState(false);
  const [hasScript, setHasScript] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [q, nodeRow] = await Promise.all([
        restGet<QuizQuestion>(
          `node_quiz_questions?select=*&node_id=eq.${encodeURIComponent(nodeId)}&order=question_order.asc`,
        ),
        restGetMaybeSingle<{ order_index?: number; practice_script?: unknown }>(
          `nodes?select=order_index,practice_script&id=eq.${encodeURIComponent(nodeId)}&limit=1`,
        ),
      ]);
      if (!alive) return;
      setQuestions(q ?? []);
      const row = nodeRow ?? null;
      setIsFirstNodeInWorld((row?.order_index ?? -1) === 0);
      setHasScript(!!row?.practice_script);
    })().catch((err) => {
      console.error("[quiz] load failed", err);
      if (alive) setQuestions([]);
    });
    return () => {
      alive = false;
    };
  }, [nodeId]);

  const total = questions?.length ?? 0;
  const current = questions?.[index];

  function handleSelect(letter: Letter) {
    if (selected || !current) return;
    setSelected(letter);
    setRespuestas((r) => {
      const n = r.slice();
      n[index] = letter;
      return n;
    });
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
    setRespuestas([]);
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
      // Auth: leemos del localStorage — el SDK deadlockea en navigator.locks
      // (auth.getUser + lecturas en el mismo tick se quedan colgados).
      const session = getStoredSupabaseSession();
      if (!session) {
        return fail("session", "no stored session");
      }
      const userId = session.userId;

      console.log("[quiz→mapa] userId:", userId);

      const seller = await restGetMaybeSingle<{ id: string; company_id: string }>(
        `sellers?select=id,company_id&profile_id=eq.${userId}&limit=1`,
      );
      if (!seller) return fail("seller no encontrado", { userId });
      console.log("[quiz→mapa] seller:", seller);

      const existing = await restGetMaybeSingle<{ id: string; status: string; stars: number | null }>(
        `node_progress?select=id,status,stars&seller_id=eq.${seller.id}&node_id=eq.${encodeURIComponent(nodeId)}&limit=1`,
      );
      console.log("[quiz→mapa] node_progress existing:", existing);

      const wasCompleted = existing?.status === "done";
      const previousStars = (existing?.stars as number | null) ?? 0;
      const improved = stars > previousStars;
      const newStars = Math.max(stars, previousStars);

      if (existing) {
        await restMutate(`node_progress?id=eq.${existing.id}`, {
          method: "PATCH",
          body: {
            status: "done",
            stars: newStars,
            last_practiced_at: new Date().toISOString(),
          },
        });
      } else {
        await restMutate("node_progress", { method: "POST", body: {
          seller_id: seller.id,
          company_id: seller.company_id,
          node_id: nodeId,
          status: "done",
          stars: newStars,
          last_practiced_at: new Date().toISOString(),
        }});
      }

      if (!wasCompleted) {
        const currentNode = await restGetMaybeSingle<{ world_id: number; order_index: number }>(
          `nodes?select=world_id,order_index&id=eq.${encodeURIComponent(nodeId)}&limit=1`,
        );

        let nextNodeId: string | null = null;
        if (currentNode) {
          const nextSame = await restGetMaybeSingle<{ id: string }>(
            `nodes?select=id&world_id=eq.${currentNode.world_id}&order_index=gt.${currentNode.order_index}&order=order_index.asc&limit=1`,
          );
          if (nextSame) {
            nextNodeId = nextSame.id;
          } else {
            const nextWorld = await restGetMaybeSingle<{ id: string }>(
              `nodes?select=id&world_id=gt.${currentNode.world_id}&order=world_id.asc,order_index.asc&limit=1`,
            );
            if (nextWorld) nextNodeId = nextWorld.id;
          }
        }

        if (nextNodeId) {
          const nextProg = await restGetMaybeSingle<{ id: string; status: string }>(
            `node_progress?select=id,status&seller_id=eq.${seller.id}&node_id=eq.${encodeURIComponent(nextNodeId)}&limit=1`,
          );

          if (nextProg) {
            if (nextProg.status === "locked") {
              await restMutate(`node_progress?id=eq.${nextProg.id}`, {
                method: "PATCH",
                body: { status: "current" },
              });
            }
          } else {
            await restMutate("node_progress", { method: "POST", body: {
              seller_id: seller.id,
              company_id: seller.company_id,
              node_id: nextNodeId,
              status: "current",
            }});
          }

          await restMutate(`sellers?id=eq.${seller.id}`, {
            method: "PATCH",
            body: { current_node: nextNodeId },
          });
        }
      }

      setNodeCompletionSignal({
        nodeId,
        stars: newStars as 1 | 2 | 3,
        isReplay: wasCompleted,
        improved,
        desbloqueoAhora: !wasCompleted,
      });

      navigate({ to: "/mapa" });
    } catch (e) {
      fail("excepción inesperada", e);
    }
  }

  function backToCards() {
    navigate({ to: "/nodo/$nodeId", params: { nodeId } });
  }

  const segmentos = (questions ?? []).map((q, k) => {
    const r = respuestas[k];
    if (r) return r === q.correct_option ? "var(--c-success)" : "var(--c-danger)";
    return k === index ? "var(--c-border-strong)" : "var(--c-border)";
  });
  const fallos = (questions ?? [])
    .map((q, k) => ({ n: k + 1, texto: q.question_text, mal: respuestas[k] !== q.correct_option }))
    .filter((f) => f.mal);
  const passed = finished && total > 0 && correctCount === total;

  // Pantallas de cierre — usan los componentes nuevos
  if (finished && passed) {
    // Si el nodo tiene practice_script, el quiz es sólo un checkpoint:
    // no completamos el nodo aquí — pasamos a la práctica, que se encarga.
    if (hasScript) {
      return (
        <VictoryScreen
          stars={3}
          title="¡Teoría dominada!"
          subtitle="Ahora, a practicarlo."
          buttonText="A practicar"
          onContinue={() => navigate({ to: "/nodo/$nodeId/practica", params: { nodeId } })}
        />
      );
    }
    return (
      <VictoryScreen
        stars={3}
        title={isFirstNodeInWorld ? "¡Primer nodo desbloqueado!" : "¡Nodo completado!"}
        subtitle={
          isFirstNodeInWorld
            ? "El primer paso empieza ahora."
            : "Quedó registrado. Sigue con el siguiente nodo."
        }
        buttonText={saving ? "Guardando..." : "Siguiente"}
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
        subtitle={
          fallos.length === 1
            ? "Te faltó una. Repasa las tarjetas y vuelve a intentarlo."
            : `Te faltaron ${fallos.length}. Repasa las tarjetas y vuelve a intentarlo.`
        }
        primaryButtonText="Intentar de nuevo"
        onPrimaryAction={resetQuiz}
        resumen={{ aciertos: correctCount, total, fallos }}
        secondaryButtonText="Repasar las tarjetas"
        onSecondaryAction={backToCards}
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
        background: "var(--c-bg)",
        color: "var(--c-text)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
      }}
    >
      {/* Encabezado y barra: un segmento por pregunta, verde o rojo según contestó */}
      <div style={{ flexShrink: 0, width: "100%", maxWidth: 560, margin: "0 auto", boxSizing: "border-box", padding: "12px var(--m-pantalla) 0" }}>
        <EncabezadoPantalla
          onRegresar={backToCards}
          etiquetaRegresar="Volver a las tarjetas"
          centro={
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--c-text)" }}>
              {total > 0 ? `Pregunta ${index + 1} de ${total}` : ""}
            </div>
          }
        />
        {total > 0 && (
          <div style={{ marginTop: 14 }}>
            <BarraSegmentos colores={segmentos} />
          </div>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          boxSizing: "border-box",
          padding: "28px var(--m-pantalla) calc(20px + env(safe-area-inset-bottom))",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {questions === null ? null : !current ? (
          <div style={{ color: "var(--c-text-2)", textAlign: "center", paddingTop: 40 }}>
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
  const opts: { letter: Letter; text: string }[] = (
    [
      { letter: "A" as Letter, text: question.option_a },
      { letter: "B" as Letter, text: question.option_b },
      { letter: "C" as Letter, text: question.option_c },
      { letter: "D" as Letter, text: question.option_d },
    ]
  ).filter((o) => typeof o.text === "string" && o.text.trim().length > 0);
  const answered = selected !== null;
  const isCorrect = selected === question.correct_option;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1 }}
    >
      <div
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: 23,
          color: "var(--c-text)",
          lineHeight: 1.3,
          letterSpacing: "-0.015em",
        }}
      >
        {question.question_text}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {opts.map((opt) => {
          const isSelected = selected === opt.letter;
          const isCorrectOpt = opt.letter === question.correct_option;
          let bg = "var(--c-surface)";
          let border = "var(--c-border)";
          let letraBg = "var(--c-elevated)";
          let letraColor = "var(--c-text-soft)";
          let texto = "var(--c-text)";

          if (answered) {
            if (isCorrectOpt) {
              bg = "rgb(var(--c-success-rgb) / 0.08)";
              border = GREEN;
              letraBg = GREEN;
              letraColor = "var(--c-bg)";
            } else if (isSelected) {
              bg = "rgb(var(--c-danger-rgb) / 0.08)";
              border = RED;
              letraBg = RED;
              letraColor = "var(--c-bg)";
            } else {
              border = "var(--c-elevated)";
              texto = "var(--c-text-2)";
            }
          }

          return (
            <button
              key={opt.letter}
              disabled={answered}
              onClick={() => onSelect(opt.letter)}
              aria-label={
                answered && isCorrectOpt
                  ? `${opt.text}. Correcta.`
                  : answered && isSelected
                    ? `${opt.text}. Incorrecta.`
                    : undefined
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                width: "100%",
                minHeight: 60,
                background: bg,
                border: `1.5px solid ${border}`,
                borderRadius: 16,
                padding: "12px 16px",
                color: texto,
                textAlign: "left",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                lineHeight: 1.45,
                cursor: answered ? "default" : "pointer",
                transition: "background 200ms ease, border-color 200ms ease, color 200ms ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 30,
                  height: 30,
                  flexShrink: 0,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  background: letraBg,
                  color: letraColor,
                  transition: "background 200ms ease, color 200ms ease",
                }}
              >
                {opt.letter}
              </span>
              <span style={{ flex: 1 }}>{opt.text}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            key="explanation"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            role="status"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: 16,
              padding: 16,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: isCorrect ? GREEN : RED }}>
              {isCorrect ? "Correcto" : "No es esa"}
            </span>
            <span style={{ fontSize: 15, color: "var(--c-text-soft)", lineHeight: 1.55 }}>
              {isCorrect ? question.explanation_correct : question.explanation_wrong}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* El botón se queda abajo y a la vista aunque la explicación sea larga. */}
      <div
        style={{
          marginTop: "auto",
          position: "sticky",
          bottom: 0,
          paddingTop: 16,
          background: "linear-gradient(to bottom, rgb(var(--c-bg-rgb) / 0) 0px, var(--c-bg) 16px)",
        }}
      >
        <button
          type="button"
          onClick={answered ? onNext : undefined}
          disabled={!answered}
          style={estiloBoton("principal", !answered)}
        >
          {!answered ? "Elige una respuesta" : isLast ? "Ver resultado" : "Siguiente"}
        </button>
      </div>
    </motion.div>
  );
}
