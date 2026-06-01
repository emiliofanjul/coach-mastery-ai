import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const TTS_URL = `${SUPABASE_URL}/functions/v1/closer-tts`;
const VOICE_URL = `${SUPABASE_URL}/functions/v1/closer-voice`;

type Phase = "prep" | "voice" | "feedback";
type TurnPhase = "i_do" | "you_do";

interface TranscriptItem {
  role: "agent" | "user";
  text: string;
  phase: TurnPhase;
}

function PracticaPage() {
  const { nodeId } = useParams({ from: "/nodo/$nodeId/practica" });
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("prep");
  const [micGranted, setMicGranted] = useState(false);
  const [sellerData, setSellerData] = useState<any>(null);
  const [nodeData, setNodeData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);
  const [skillsContext, setSkillsContext] = useState<any>(null);
  const skillsContextRef = useRef<any>(null);
  const [transcriptFull, setTranscriptFull] = useState<TranscriptItem[]>([]);
  const transcriptFullRef = useRef<TranscriptItem[]>([]);
  const [currentPhase, setCurrentPhase] = useState<TurnPhase>("i_do");
  const currentPhaseRef = useRef<TurnPhase>("i_do");
  const nodeDataRef = useRef<any>(null);
  const [, setSessionId] = useState<string | null>(null);
  const [, setYouDoTranscript] = useState<TranscriptItem[]>([]);
  const [, setSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Nuevo flujo voz: TTS + STT + closer-voice
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserListening, setIsUserListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const conversationHistoryRef = useRef<{ role: string; content: string }[]>([]);
  const claudePhaseRef = useRef<"i_do" | "you_do" | "boss_sim" | "closing">("you_do");
  const sessionEndedRef = useRef(false);


  // Pedir micrófono al montar
  useEffect(() => {
    if (phase !== "prep") return;
    requestMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar info básica del nodo para mostrar en prep
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: node } = await supabase
        .from("nodes")
        .select("id, name, description")
        .eq("id", nodeId)
        .maybeSingle();
      if (!alive) return;
      if (node) {
        setNodeData((prev: any) => prev ?? node);
      }
    })();
    return () => {
      alive = false;
    };
  }, [nodeId]);

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
    const [{ data: node }, { data: company }, { data: nodeSkillsRows }] = await Promise.all([
      supabase
        .from("nodes")
        .select("id, name, description, conversation_scope, node_type, technique, boss_goal, field_mission, world_id, difficulty_level, is_boss, practice_script")
        .eq("id", nodeId)
        .maybeSingle(),
      supabase
        .from("companies")
        .select("name, company_sales_brain")
        .eq("id", seller.company_id)
        .maybeSingle(),
      supabase
        .from("node_skills")
        .select("relation, is_primary, weight, skill:skills(id, code, name, category, default_allowed_concepts, default_forbidden_concepts)")
        .eq("node_id", nodeId),
    ]);

    // Build skillsContext
    const script: any = (node as any)?.practice_script ?? null;
    const rows: any[] = (nodeSkillsRows as any[]) ?? [];
    const practiceOrAssess = rows.filter(
      (r) => r.relation === "practices" || r.relation === "assesses",
    );
    const skillsForFallback = practiceOrAssess.length > 0 ? practiceOrAssess : rows;
    const inFocusFromScript: string[] | null = Array.isArray(script?.scope?.skills_in_focus)
      ? script.scope.skills_in_focus
      : null;
    const skillsInFocus: string[] =
      inFocusFromScript ?? skillsForFallback.map((r) => r.skill?.id).filter(Boolean);
    const skillCodes: string[] = skillsForFallback.map((r) => r.skill?.code).filter(Boolean);
    const primarySkillId: string | null =
      rows.find((r) => r.is_primary)?.skill?.id ?? skillsInFocus[0] ?? null;
    const focusSkillsForDefaults = skillsForFallback.filter((r) =>
      skillsInFocus.includes(r.skill?.id),
    );
    const unionDefaults = (key: "default_allowed_concepts" | "default_forbidden_concepts") => {
      const set = new Set<string>();
      focusSkillsForDefaults.forEach((r) => {
        const arr = r.skill?.[key];
        if (Array.isArray(arr)) arr.forEach((v: string) => set.add(v));
      });
      return Array.from(set);
    };
    const allowedConcepts: string[] = Array.isArray(script?.scope?.allowed_concepts)
      ? script.scope.allowed_concepts
      : unionDefaults("default_allowed_concepts");
    const forbiddenConcepts: string[] = Array.isArray(script?.scope?.forbidden_concepts)
      ? script.scope.forbidden_concepts
      : unionDefaults("default_forbidden_concepts");
    const successCriteria = Array.isArray(script?.success_criteria)
      ? script.success_criteria
      : [];
    const failureCriteria = Array.isArray(script?.failure_criteria)
      ? script.failure_criteria
      : [];

    const ctx = {
      primarySkillId,
      skillsInFocus,
      skillCodes,
      allowedConcepts,
      forbiddenConcepts,
      successCriteria,
      failureCriteria,
    };

    setSellerData(seller);
    setNodeData(node);
    nodeDataRef.current = node;
    setCompanyData(company);
    setSkillsContext(ctx);
    skillsContextRef.current = ctx;
    setPhase("voice");
  }

  // Iniciar sesión de voz
  useEffect(() => {
    if (phase === "voice" && sellerData && nodeData && companyData && skillsContext) {
      startVoiceSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sellerData, nodeData, companyData, skillsContext]);

  // Helpers para el nuevo flujo de voz ───────────────────────

  function stopRecognition() {
    try {
      recognitionRef.current?.stop?.();
    } catch {
      /* noop */
    }
    recognitionRef.current = null;
    setIsUserListening(false);
  }

  function stopAudio() {
    try {
      audioRef.current?.pause();
    } catch {
      /* noop */
    }
    audioRef.current = null;
    setIsAgentSpeaking(false);
  }

  async function playTTS(text: string): Promise<void> {
    stopAudio();
    setIsAgentSpeaking(true);
    try {
      const res = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("audio error"));
        };
        audio.play().catch(reject);
      });
    } catch (err) {
      console.error("[voice] playTTS failed:", err);
    } finally {
      setIsAgentSpeaking(false);
      audioRef.current = null;
    }
  }

  function startRecognition() {
    if (sessionEndedRef.current) return;
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setConnectionError("Tu navegador no soporta reconocimiento de voz.");
      return;
    }
    const rec = new SR();
    rec.lang = "es-ES";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    let finalText = "";
    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInterimTranscript(finalText + interim);
    };
    rec.onerror = (e: any) => {
      console.error("[voice] STT error:", e?.error ?? e);
      setIsUserListening(false);
    };
    rec.onend = () => {
      setIsUserListening(false);
      recognitionRef.current = null;
      const text = finalText.trim();
      setInterimTranscript("");
      if (text) {
        void sendToCloser(text);
      }
    };
    recognitionRef.current = rec;
    setInterimTranscript("");
    setIsUserListening(true);
    try {
      rec.start();
    } catch (err) {
      console.error("[voice] rec.start failed:", err);
      setIsUserListening(false);
    }
  }

  async function sendToCloser(userText: string) {
    if (sessionEndedRef.current) return;
    setIsProcessing(true);

    const userItem: TranscriptItem = {
      role: "user",
      text: userText,
      phase: currentPhaseRef.current,
    };
    transcriptFullRef.current = [...transcriptFullRef.current, userItem];
    setTranscriptFull([...transcriptFullRef.current]);
    conversationHistoryRef.current = [
      ...conversationHistoryRef.current,
      { role: "user", content: userText },
    ];

    try {
      const res = await fetch(VOICE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({
          transcript: userText,
          phase: claudePhaseRef.current,
          practice_script: nodeDataRef.current?.practice_script ?? null,
          company_brain: JSON.stringify(companyData?.company_sales_brain ?? {}),
          seller_name: sellerData?.full_name ?? "",
          conversation_history: conversationHistoryRef.current.slice(0, -1),
        }),
      });
      if (!res.ok) throw new Error(`closer-voice HTTP ${res.status}`);
      const data = await res.json();
      const message: string = data?.message ?? "";
      const nextPhase: string = data?.next_phase ?? claudePhaseRef.current;
      const endSession: boolean = !!data?.end_session;

      if (message) {
        const agentItem: TranscriptItem = {
          role: "agent",
          text: message,
          phase: currentPhaseRef.current,
        };
        transcriptFullRef.current = [...transcriptFullRef.current, agentItem];
        setTranscriptFull([...transcriptFullRef.current]);
        conversationHistoryRef.current = [
          ...conversationHistoryRef.current,
          { role: "assistant", content: message },
        ];
        setIsProcessing(false);
        await playTTS(message);
      } else {
        setIsProcessing(false);
      }

      if (nextPhase && nextPhase !== "end" && nextPhase !== claudePhaseRef.current) {
        claudePhaseRef.current = nextPhase as any;
      }

      if (endSession || nextPhase === "end") {
        await handleSessionEnd();
        return;
      }

      // Siguiente turno del vendedor
      startRecognition();
    } catch (err) {
      console.error("[voice] sendToCloser failed:", err);
      setIsProcessing(false);
      setConnectionError("Error al hablar con Closer. Toca para reintentar.");
    }
  }

  async function startVoiceSession() {
    try {
      setConnectionError(null);
      sessionEndedRef.current = false;
      conversationHistoryRef.current = [];
      transcriptFullRef.current = [];
      setTranscriptFull([]);
      claudePhaseRef.current = "you_do";
      setCurrentPhase("you_do");
      currentPhaseRef.current = "you_do";

      const script: any = nodeData?.practice_script ?? null;
      const firstMessage: string =
        script?.phases?.i_do?.first_message
        ?? `Buenos días, ¿cómo está? Mucho gusto, soy ${sellerData?.full_name ?? "Carlos"} de ${companyData?.name ?? "la empresa"}. Qué bueno encontrarlo — justo quería platicar un momento con usted.`;

      // Registrar i_do (demostración) en la historia para que Claude tenga contexto
      const agentItem: TranscriptItem = {
        role: "agent",
        text: firstMessage,
        phase: "i_do",
      };
      transcriptFullRef.current = [agentItem];
      setTranscriptFull([agentItem]);
      conversationHistoryRef.current = [
        { role: "assistant", content: firstMessage },
      ];

      await playTTS(firstMessage);

      if (sessionEndedRef.current) return;
      startRecognition();
    } catch (err) {
      console.error("[voice] startVoiceSession failed:", err);
      setConnectionError("No se pudo iniciar la voz. Toca para reintentar.");
    }
  }

  async function handleSessionEnd() {
    sessionEndedRef.current = true;
    stopRecognition();
    stopAudio();
    const youDo = transcriptFullRef.current.filter((m) => m.phase === "you_do");
    setYouDoTranscript(youDo);
    const nodeType: string = nodeData?.node_type ?? "skill_drill";
    const practiceType =
      nodeType === "boss"
        ? "boss"
        : nodeType === "full_sim"
          ? "full_sim"
          : "skill_drill";
    const isBossLevel = nodeType === "boss" || nodeData?.is_boss === true;
    const { data: session } = await supabase
      .from("practice_sessions")
      .insert({
        seller_id: sellerData.id,
        company_id: sellerData.company_id,
        node_id: nodeId,
        world_id: nodeData?.world_id ?? 0,
        practice_type: practiceType,
        is_boss_level: isBossLevel,
        transcript: JSON.stringify(transcriptFullRef.current),
      })
      .select()
      .maybeSingle();
    setSessionId(session?.id ?? null);
    setPhase("feedback");
  }

  async function handleReplay() {
    sessionEndedRef.current = true;
    stopRecognition();
    stopAudio();
    await startVoiceSession();
  }

  async function handleExitConfirm() {
    sessionEndedRef.current = true;
    stopRecognition();
    stopAudio();
    navigate({ to: "/mapa" });
  }

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      sessionEndedRef.current = true;
      stopRecognition();
      stopAudio();
    };
  }, []);


  // ─── Render ───
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
            nodeData={nodeData}
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
            connectionError={connectionError}
            onRetry={() => { setConnectionError(null); startVoiceSession(); }}
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
  nodeData,
  onRetry,
  onListo,
  onExit,
}: {
  micGranted: boolean;
  nodeData: any;
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

        {nodeData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "18px 18px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 18,
                lineHeight: 1.3,
                color: "#fff",
              }}
            >
              {nodeData.name}
            </div>
            {nodeData.description && (
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>Objetivo: </span>
                {nodeData.description}
              </div>
            )}
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                lineHeight: 1.55,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>Formato: </span>
              Closer demuestra primero y luego tú practicas.
            </div>
          </motion.div>
        )}


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
          Ver demostración →
        </button>
      </div>
    </motion.div>
  );
}

// ───────────────────────── VOICE ─────────────────────────

function VoicePhase({
  currentPhase,
  isSpeaking,
  connectionError,
  onRetry,
  onReplay,
  onExitClick,
}: {
  currentPhase: TurnPhase;
  isSpeaking: boolean;
  connectionError: string | null;
  onRetry: () => void;
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

        {connectionError && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 8 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: RED, fontSize: 14, textAlign: "center" }}>
              {connectionError}
            </p>
            <button
              onClick={onRetry}
              style={{
                background: ORANGE,
                color: "#08080F",
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                borderRadius: 99,
                padding: "10px 24px",
                cursor: "pointer",
                boxShadow: "0 10px 30px -8px rgba(255,107,43,0.45)",
              }}
            >
              Reintentar
            </button>
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
