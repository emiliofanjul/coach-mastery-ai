import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { CloserCharacter } from "@/components/closer/CloserCharacter";
import VictoryScreen from "@/components/VictoryScreen";
import { setNodeCompletionSignal } from "@/lib/node-completion";

export const Route = createFileRoute("/nodo/$nodeId/practica")({
  component: PracticaPage,
  head: () => ({ meta: [{ title: "Práctica — Closer" }] }),
});

const BG = "#08080F";
const ORANGE = "#FF6B2B";
const BLUE = "#4DABF7";
const GREEN = "#06D6A0";
const RED = "#EF476F";
const AGENT_ID = "agent_0901krktpk9pfjztj3djbc6en2fc";

type Phase = "prep" | "voice" | "feedback";
type TurnPhase = "i_do" | "you_do";

interface TranscriptItem {
  role: "agent" | "user";
  text: string;
  phase: TurnPhase;
}

function PracticaPage() {
  console.log("[practica] PracticaPage mounted");
  const { nodeId } = useParams({ from: "/nodo/$nodeId/practica" });
  const navigate = useNavigate();

  const [initError, setInitError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("prep");
  const [micGranted, setMicGranted] = useState(false);
  const [sellerData, setSellerData] = useState<any>(null);
  const [nodeData, setNodeData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [transcriptFull, setTranscriptFull] = useState<TranscriptItem[]>([]);
  const [currentPhase, setCurrentPhase] = useState<TurnPhase>("i_do");
  const currentPhaseRef = useRef<TurnPhase>("i_do");
  const [, setSessionId] = useState<string | null>(null);
  const [, setYouDoTranscript] = useState<TranscriptItem[]>([]);
  const [, setSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  let conversation: any = {
    isSpeaking: false,
    startSession: async () => {},
    endSession: async () => {},
  };
  try {
    conversation = useConversation({
      onMessage: (msg: any) => {
        const text: string = msg.message ?? msg.agent_response ?? msg.text ?? "";
        const role: "agent" | "user" = msg.source === "user" ? "user" : "agent";
        if (text) {
          setTranscriptFull((prev) => [
            ...prev,
            { role, text, phase: currentPhaseRef.current },
          ]);
        }
        if (role === "agent" && text.toLowerCase().includes("ahora es tu turno")) {
          setCurrentPhase("you_do");
          currentPhaseRef.current = "you_do";
        }
        if (role === "agent" && text.toLowerCase().includes("vamos al detalle")) {
          handleSessionEnd();
        }
      },
      onError: (err: any) => {
        console.error("[practica] ElevenLabs error:", err);
        setInitError(`ElevenLabs error: ${err?.message ?? JSON.stringify(err)}`);
      },
    });
  } catch (err: any) {
    console.error("[practica] useConversation init failed:", err);
    if (!initError) {
      // Defer state update to avoid setting state during render
      queueMicrotask(() => setInitError(`useConversation init failed: ${err?.message ?? String(err)}`));
    }
  }

  // Pedir micrófono al montar
  useEffect(() => {
    if (phase !== "prep") return;
    requestMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function requestMic() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicGranted(true);
    } catch {
      setMicGranted(false);
    }
  }

  async function handleListo() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: seller } = await supabase
      .from("sellers")
      .select("id, full_name, experience_level, company_id")
      .eq("profile_id", auth.user.id)
      .maybeSingle();
    if (!seller) return;
    const [{ data: node }, { data: company }] = await Promise.all([
      supabase
        .from("nodes")
        .select("name, description, conversation_scope, node_type")
        .eq("id", nodeId)
        .maybeSingle(),
      supabase
        .from("companies")
        .select("name, company_sales_brain")
        .eq("id", seller.company_id)
        .maybeSingle(),
    ]);
    setSellerData(seller);
    setNodeData(node);
    setCompanyData(company);
    setPhase("voice");
  }

  // Iniciar sesión de voz
  useEffect(() => {
    if (phase === "voice" && sellerData && nodeData && companyData) {
      startVoiceSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sellerData, nodeData, companyData]);

  async function startVoiceSession() {
    const firstMessage = `Eres Closer Coach. Contexto de esta sesión:

VENDEDOR: ${sellerData.full_name} | Experiencia: ${sellerData.experience_level}
EMPRESA: ${companyData.name}
CONTEXTO DE VENTA: ${JSON.stringify(companyData.company_sales_brain)}

NODO: ${nodeData.name}
OBJETIVO: ${nodeData.description}
SCOPE: ${nodeData.conversation_scope}

ESTRUCTURA — DOS MOMENTOS:

MOMENTO 1 — I DO:
Tú eres el vendedor. Demuestra la apertura perfecta usando el contexto real de la empresa. El usuario actúa como el cliente — responde de forma natural como lo haría un cliente real de esta industria. El micrófono del usuario está activo para que pueda reaccionar con su voz. Cuando termines la demostración completa di exactamente: "Ahora es tu turno."

MOMENTO 2 — YOU DO:
Tú eres el cliente. El vendedor practica la apertura solo. Reacciona de forma natural. No des ayuda ni hints. Cuando el scope "${nodeData.conversation_scope}" se cumpla o falle claramente, sal del personaje, da feedback verbal BUILD BREAK BUILD en máximo 3 frases — BUILD: qué funcionó específico, BREAK: una sola oportunidad de mejora, BUILD: proyección hacia adelante. Termina con exactamente estas palabras: "Vamos al detalle."`;

    try {
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
        overrides: {
          agent: {
            firstMessage,
          },
        },
      } as any);
    } catch (err) {
      console.error("startSession failed:", err);
    }
  }

  async function handleSessionEnd() {
    try {
      await conversation.endSession();
    } catch {
      /* noop */
    }
    const youDo = transcriptFull.filter((m) => m.phase === "you_do");
    setYouDoTranscript(youDo);
    const { data: session } = await supabase
      .from("practice_sessions")
      .insert({
        seller_id: sellerData.id,
        company_id: sellerData.company_id,
        node_id: nodeId,
        world_id: 0,
        practice_type: "skill_drill",
        transcript: JSON.stringify(transcriptFull),
      })
      .select()
      .maybeSingle();
    setSessionId(session?.id ?? null);
    setPhase("feedback");
  }

  async function handleReplay() {
    try {
      await conversation.endSession();
    } catch {
      /* noop */
    }
    setTranscriptFull([]);
    setCurrentPhase("i_do");
    currentPhaseRef.current = "i_do";
    await startVoiceSession();
  }

  async function handleExitConfirm() {
    try {
      await conversation.endSession();
    } catch {
      /* noop */
    }
    navigate({ to: "/mapa" });
  }

  // ─── Render ───
  if (initError) {
    return (
      <div style={{ position: "fixed", inset: 0, background: BG, color: "#fff", zIndex: 60, padding: 24, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 20, color: RED }}>Error al iniciar práctica</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{initError}</div>
        <button onClick={() => navigate({ to: "/mapa" })} style={{ alignSelf: "flex-start", marginTop: 12, height: 44, padding: "0 20px", borderRadius: 99, border: "none", background: ORANGE, color: "#08080F", fontFamily: "Syne, sans-serif", fontWeight: 700, cursor: "pointer" }}>Volver al mapa</button>
      </div>
    );
  }
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: BG,
        color: "#fff",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <AnimatePresence mode="wait">
        {phase === "prep" && (
          <PrepPhase
            key="prep"
            micGranted={micGranted}
            onRetry={requestMic}
            onListo={handleListo}
            onExit={() => navigate({ to: "/mapa" })}
          />
        )}
        {phase === "voice" && (
          <VoicePhase
            key="voice"
            currentPhase={currentPhase}
            isSpeaking={conversation.isSpeaking}
            onReplay={handleReplay}
            onExitClick={() => setShowExitDialog(true)}
          />
        )}
        {phase === "feedback" && (
          <FeedbackPhase
            key="feedback"
            onContinue={async () => {
              setSaving(true);
              await supabase.from("node_progress").upsert(
                {
                  seller_id: sellerData.id,
                  company_id: sellerData.company_id,
                  node_id: nodeId,
                  status: "done",
                  stars: 2,
                  last_practiced_at: new Date().toISOString(),
                },
                { onConflict: "seller_id,node_id" },
              );

              const { data: currentNodeRow } = await supabase
                .from("nodes")
                .select("world_id, order_index")
                .eq("id", nodeId)
                .maybeSingle();

              if (currentNodeRow) {
                const { data: nextNode } = await supabase
                  .from("nodes")
                  .select("id")
                  .eq("world_id", currentNodeRow.world_id)
                  .gt("order_index", currentNodeRow.order_index)
                  .order("order_index", { ascending: true })
                  .limit(1)
                  .maybeSingle();

                if (nextNode) {
                  await supabase.from("node_progress").upsert(
                    {
                      seller_id: sellerData.id,
                      company_id: sellerData.company_id,
                      node_id: nextNode.id,
                      status: "current",
                    },
                    { onConflict: "seller_id,node_id" },
                  );
                  await supabase
                    .from("sellers")
                    .update({ current_node: nextNode.id })
                    .eq("id", sellerData.id);
                }
              }

              setNodeCompletionSignal({
                nodeId,
                stars: 2,
                isReplay: false,
                improved: true,
              });
              navigate({ to: "/mapa" });
            }}
          />
        )}
      </AnimatePresence>

      {showExitDialog && (
        <ExitDialog
          onCancel={() => setShowExitDialog(false)}
          onConfirm={handleExitConfirm}
        />
      )}
    </div>
  );
}

// ───────────────────────── PREP ─────────────────────────

function PrepPhase({
  micGranted,
  onRetry,
  onListo,
  onExit,
}: {
  micGranted: boolean;
  onRetry: () => void;
  onListo: () => void;
  onExit: () => void;
}) {
  const checks = [
    {
      ok: micGranted,
      label: micGranted ? "Micrófono listo" : "Permite el micrófono",
    },
    { ok: true, label: "Sube el volumen al máximo 🔊" },
    { ok: true, label: "Busca un lugar sin ruido" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "1.2rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <button
          onClick={onExit}
          aria-label="Salir"
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: 22,
            cursor: "pointer",
            padding: 8,
            margin: -8,
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          flex: 1,
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 26,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          Antes de empezar
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {checks.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.3, duration: 0.4 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 99,
                  background: c.ok ? GREEN : ORANGE,
                  color: "#08080F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {c.ok ? "✓" : "!"}
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  color: "rgba(255,255,255,0.9)",
                }}
              >
                {c.label}
              </div>
            </motion.div>
          ))}
        </div>

        {!micGranted && (
          <button
            onClick={onRetry}
            style={{
              alignSelf: "center",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              padding: "10px 18px",
              borderRadius: 99,
              cursor: "pointer",
            }}
          >
            Reintentar permiso
          </button>
        )}
      </div>

      <div
        style={{
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
        }}
      >
        <button
          onClick={onListo}
          disabled={!micGranted}
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
            cursor: micGranted ? "pointer" : "not-allowed",
            opacity: micGranted ? 1 : 0.5,
            boxShadow: "0 10px 30px -8px rgba(255,107,43,0.45)",
          }}
        >
          Listo →
        </button>
      </div>
    </motion.div>
  );
}

// ───────────────────────── VOICE ─────────────────────────

function VoicePhase({
  currentPhase,
  isSpeaking,
  onReplay,
  onExitClick,
}: {
  currentPhase: TurnPhase;
  isSpeaking: boolean;
  onReplay: () => void;
  onExitClick: () => void;
}) {
  const isIDo = currentPhase === "i_do";
  const ringColor = isSpeaking
    ? BLUE
    : currentPhase === "you_do"
      ? ORANGE
      : "rgba(255,255,255,0.15)";
  const animatePulse = isSpeaking || currentPhase === "you_do";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: "1.2rem",
      }}
    >
      <style>{`
        @keyframes practica-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.6; }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <button
          onClick={onExitClick}
          aria-label="Salir"
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: 22,
            cursor: "pointer",
            padding: 8,
            margin: -8,
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          maxWidth: 560,
          width: "100%",
          margin: "16px auto 0",
          padding: "12px 16px",
          borderRadius: 14,
          background: isIDo
            ? "rgba(77,171,247,0.15)"
            : "rgba(255,107,43,0.15)",
          border: `1px solid ${isIDo ? BLUE : ORANGE}`,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 500,
          fontSize: 14,
          textAlign: "center",
          color: "#fff",
        }}
      >
        {isIDo
          ? "Closer demuestra — Reacciona como tu cliente lo haría"
          : "Tu turno — Hazlo solo."}
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 180,
            height: 180,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: `2px solid ${ringColor}`,
              animation: animatePulse
                ? "practica-pulse 1.2s ease-in-out infinite"
                : undefined,
            }}
          />
          <CloserCharacter size={120} state="normal" />
        </div>

        {isIDo && isSpeaking && (
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Escucha con atención
          </div>
        )}
      </div>

      <div
        style={{
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          paddingBottom: "calc(20px + env(safe-area-inset-bottom))",
          display: "flex",
          justifyContent: "center",
          minHeight: 40,
        }}
      >
        {isIDo && (
          <button
            onClick={onReplay}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              cursor: "pointer",
              padding: 8,
            }}
          >
            Ver de nuevo
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ───────────────────────── FEEDBACK ─────────────────────────

const ANALYSIS_MESSAGES = [
  "Revisando tu apertura...",
  "Identificando puntos clave...",
  "Casi listo...",
];

function FeedbackPhase({ onContinue }: { onContinue: () => void }) {
  const [showVictory, setShowVictory] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setShowVictory(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (showVictory) return;
    const i = setInterval(() => {
      setMsgIdx((p) => (p + 1) % ANALYSIS_MESSAGES.length);
    }, 2000);
    return () => clearInterval(i);
  }, [showVictory]);

  if (showVictory) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ flex: 1 }}
      >
        <VictoryScreen
          stars={2}
          title="¡Práctica completada!"
          subtitle="Sigue avanzando."
          buttonText="Ver mapa →"
          onContinue={onContinue}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: "1.2rem",
      }}
    >
      <style>{`
        @keyframes dot-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <CloserCharacter size={96} state="motivation" />
      <div
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: 22,
          color: "#fff",
          textAlign: "center",
        }}
      >
        Analizando tu práctica
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: 99,
              background: ORANGE,
              animation: `dot-pulse 1s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={msgIdx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
          }}
        >
          {ANALYSIS_MESSAGES[msgIdx]}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ───────────────────────── EXIT DIALOG ─────────────────────────

function ExitDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.2rem",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "#14141C",
          borderRadius: 14,
          padding: 24,
          maxWidth: 360,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#fff",
            textAlign: "center",
          }}
        >
          ¿Salir de la práctica?
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 99,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.4)",
              color: "#fff",
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 99,
              background: RED,
              border: "none",
              color: "#fff",
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
