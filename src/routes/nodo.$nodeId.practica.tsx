import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { restGet, restGetMaybeSingle, restMutate } from "@/lib/supabase-rest";
import { getStoredSupabaseSession } from "@/lib/browser-auth-session";
import { CloserCharacter } from "@/components/closer/CloserCharacter";
import VictoryScreen from "@/components/VictoryScreen";
import { setNodeCompletionSignal } from "@/lib/node-completion";
import RetryScreen from "@/components/RetryScreen";


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
const DIRECTOR_URL = `${SUPABASE_URL}/functions/v1/director`;

const DEFAULT_CLOSING_MESSAGE = "Listo, tengo lo que necesito. Vamos a ver cómo te fue.";

interface DirectorDecision {
  turn: number;
  decision: "continue" | "cut";
  reason: string;
  classifier_ran: boolean;
  classifier_result: boolean | null;
  latency_ms: number;
  user_turns: number;
  elapsed_seconds: number | null;
  at: string;
}

type Phase = "prep" | "i_do" | "transition" | "you_do" | "feedback";
type TurnPhase = "i_do" | "you_do";
const MAX_I_DO_USER_TURNS = 2;

interface TranscriptItem {
  role: "agent" | "user";
  text: string;
  phase: TurnPhase;
}

interface ObservationItem {
  error: string;
  mejora: string;
  ejemplo: string;
}

interface FeedbackResult {
  score: number;
  stars: 1 | 2 | 3;
  observations: ObservationItem[];
  mision: string;
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
  const [youDoHistory, setYouDoHistory] = useState<{ role: string; content: string }[]>([]);
  const [, setSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResult | null>(null);
  const [iDoDemoDone, setIDoDemoDone] = useState(false);
  const [showVoiceTutorial, setShowVoiceTutorial] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  const inputModeRef = useRef<"voice" | "text">("voice");
  useEffect(() => { inputModeRef.current = inputMode; }, [inputMode]);



  // Nuevo flujo voz: TTS + STT + closer-voice
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserListening, setIsUserListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const conversationHistoryRef = useRef<{ role: string; content: string }[]>([]);
  const claudePhaseRef = useRef<"i_do" | "you_do" | "boss_sim" | "closing">("i_do");
  const sessionEndedRef = useRef(false);
  const iDoUserTurnsRef = useRef(0);
  // Captura de audio paralela al STT (solo si audio_consent === true)
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioUploadedRef = useRef(false);
  // Provenance from closer-voice — updated on every response.
  const promptVersionRef = useRef<string | null>(null);
  const modelRef = useRef<string | null>(null);
  // Client-generated correlation id. Same value across every closer-voice call
  // in this session and passed to save-practice-event for llm_calls backfill.
  const sessionCorrelationIdRef = useRef<string>(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  // Director state — separación Actor/Director (v2.0.0).
  // El Director corre después de cada turno del Actor en you_do; sus decisiones
  // se acumulan aquí y se guardan en el payload del seller_event al cierre.
  const directorDecisionsRef = useRef<DirectorDecision[]>([]);
  const youDoStartTimeRef = useRef<number | null>(null);
  // Cut lock: se activa cuando el Director decide `cut`. Terminal e inmediato.
  // Todo lo posterior (STT, mic, sendToCloser, playTTS del Actor) queda bloqueado.
  // Solo el playTTS del closing.message se permite (se dispara ANTES de que otros
  // caminos consulten cutRef).
  const cutRef = useRef(false);
  // AbortControllers para requests en vuelo — se cancelan en hardStop().
  const actorFetchAbortRef = useRef<AbortController | null>(null);
  const ttsFetchAbortRef = useRef<AbortController | null>(null);
  // Resolver del await de playTTS activo. stopAudio() lo dispara para desbloquear
  // callers que estén esperando `await playTTS(...)` cuando pausamos el audio.
  const ttsPlayResolverRef = useRef<(() => void) | null>(null);
  // BUG 1 fix: guard start-once por fase. React 19 StrictMode monta effects
  // dos veces en dev, y cualquier re-render con las mismas deps dispara la
  // useEffect de arranque otra vez → dos startIDoSession corriendo en paralelo
  // → dos fetches de TTS → dos <audio> reproduciendo el mismo texto encima.
  const sessionStartedForPhaseRef = useRef<string | null>(null);


  // Pedir micrófono al montar
  useEffect(() => {
    if (phase !== "prep") return;
    requestMic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar info básica del nodo para mostrar en prep — vía PostgREST directo
  // (bypass del SDK que deadlockea en navigator.locks con lecturas concurrentes).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const node = await restGetMaybeSingle<{ id: string; name: string; description: string | null; practice_script: any }>(
          `nodes?select=id,name,description,practice_script&id=eq.${encodeURIComponent(nodeId)}&limit=1`,
        );
        if (!alive) return;
        if (node) setNodeData((prev: any) => prev ?? node);
      } catch (err) {
        console.error("[practica] prep node load failed", err);
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
    setPrepError(null);
    try {
      // Auth: leemos la sesión del localStorage — el SDK deadlockea aquí
      // (auth.getUser también toma el navigator.lock).
      const session = getStoredSupabaseSession();
      if (!session) {
        setPrepError("Tu sesión expiró. Inicia sesión de nuevo para practicar.");
        return;
      }
      const uid = session.userId;
      let seller: any = null;
      try {
        seller = await restGetMaybeSingle<any>(
          `sellers?select=id,full_name,experience_level,company_id,audio_consent&profile_id=eq.${uid}&limit=1`,
        );
      } catch (e: any) {
        console.error("[practica] sellers query failed:", e);
        setPrepError(
          `No pudimos cargar tu perfil (${e?.status ?? "err"}: ${e?.message ?? "network"}). Revisa tu conexión e intenta de nuevo.`,
        );
        return;
      }
      if (!seller) {
        setPrepError("No encontramos tu perfil de vendedor. Contacta a tu manager.");
        return;
      }
      let node: any = null;
      let company: any = null;
      let nodeSkillsRows: any[] = [];
      try {
        [node, company, nodeSkillsRows] = await Promise.all([
          restGetMaybeSingle<any>(
            `nodes?select=id,name,description,conversation_scope,node_type,boss_goal,field_mission,world_id,difficulty_level,is_boss,practice_script&id=eq.${encodeURIComponent(nodeId)}&limit=1`,
          ),
          restGetMaybeSingle<any>(
            `companies?select=name,company_sales_brain&id=eq.${seller.company_id}&limit=1`,
          ),
          restGet<any>(
            `node_skills?select=relation,is_primary,weight,skill:skills(id,code,name,category,default_allowed_concepts,default_forbidden_concepts)&node_id=eq.${encodeURIComponent(nodeId)}`,
          ),
        ]);
      } catch (e: any) {
        console.error("[practica] node/company/skills query failed:", e);
        setPrepError(
          `No pudimos cargar los datos del nodo (${e?.status ?? "err"}: ${e?.message ?? "network"}). Intenta de nuevo.`,
        );
        return;
      }
      if (!node) {
        setPrepError("Este nodo no existe o no está disponible.");
        return;

      }

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

      // taughtSkills: unión de skills_in_focus de nodos ya completados por este vendedor
      // ∪ skills_in_focus del nodo actual. Alimenta SOLO el prompt del Actor (dificultad
      // acumulada). NO reemplaza skillsInFocus (que sigue alimentando seller_skill_state).
      // Fallback: si falla la consulta, taughtSkills = skillsInFocus del nodo actual.
      let taughtSkills: string[] = [...skillsInFocus];
      try {
        const doneRows = await restGet<{ node_id: string }>(
          `node_progress?select=node_id&seller_id=eq.${seller.id}&status=eq.done`,
        );
        const doneIds = (doneRows ?? []).map((r) => r.node_id).filter((id) => id && id !== nodeId);
        if (doneIds.length > 0) {
          const inList = doneIds.map((id) => encodeURIComponent(id)).join(",");
          const doneNodes = await restGet<{ id: string; practice_script: any }>(
            `nodes?select=id,practice_script&id=in.(${inList})`,
          );
          const set = new Set<string>(skillsInFocus);
          for (const n of doneNodes ?? []) {
            const arr = (n as any)?.practice_script?.scope?.skills_in_focus;
            if (Array.isArray(arr)) arr.forEach((s) => typeof s === "string" && s && set.add(s));
          }
          taughtSkills = Array.from(set);
        }
      } catch (e) {
        console.error("[practica] taughtSkills fetch failed — fallback to current node:", e);
        taughtSkills = [...skillsInFocus];
      }

      const ctx = {
        primarySkillId,
        skillsInFocus,
        skillCodes,
        allowedConcepts,
        forbiddenConcepts,
        successCriteria,
        failureCriteria,
        taughtSkills,
      };

      setSellerData(seller);
      setNodeData(node);
      nodeDataRef.current = node;
      setCompanyData(company);
      setSkillsContext(ctx);
      skillsContextRef.current = ctx;
      // Boss / scripts sin phases.i_do: saltar directo al YOU DO (schema v1 lo permite).
      const hasIDo = !!(node?.practice_script as any)?.phases?.i_do;
      setPhase(hasIDo ? "i_do" : "you_do");
    } catch (e: any) {
      console.error("[practica] handleListo unexpected error:", e);
      setPrepError(
        `No pudimos cargar tu sesión (${e?.message ?? "error de red"}). Revisa tu conexión e intenta de nuevo.`,
      );
    }
  }

  // Iniciar sesión de voz según fase
  useEffect(() => {
    if (!sellerData || !nodeData || !companyData || !skillsContext) return;
    if (phase !== "i_do" && phase !== "you_do") return;
    // Guard start-once por fase — evita el doble arranque de StrictMode /
    // re-renders con las mismas deps que producía audio duplicado.
    if (sessionStartedForPhaseRef.current === phase) return;
    sessionStartedForPhaseRef.current = phase;
    if (phase === "i_do") startIDoSession();
    else startYouDoSession();
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
    // Desbloquea el `await playTTS(...)` que pudiera estar colgado esperando
    // onended (pause no dispara onended). Si no hay resolver activo, no-op.
    const r = ttsPlayResolverRef.current;
    ttsPlayResolverRef.current = null;
    if (r) r();
  }

  /**
   * hardStop — apagado terminal e inmediato del pipeline de la sesión.
   * Se llama cuando el Director decide `cut` (y en cualquier otro fin de sesión):
   *  1) Marca cutRef → todos los guards downstream cortan.
   *  2) Aborta fetch en vuelo del Actor (closer-voice) y del TTS.
   *  3) Detiene audio actual y libera el resolver de playTTS pendiente.
   *  4) Detiene STT y limpia estados de UI.
   * NO reproduce audio nuevo — quien llama decide si después toca closing TTS.
   */
  function hardStop() {
    cutRef.current = true;
    sessionEndedRef.current = true;
    try { actorFetchAbortRef.current?.abort(); } catch { /* noop */ }
    try { ttsFetchAbortRef.current?.abort(); } catch { /* noop */ }
    actorFetchAbortRef.current = null;
    ttsFetchAbortRef.current = null;
    stopAudio();
    stopRecognition();
    setIsProcessing(false);
    setInterimTranscript("");
  }

  // ── Captura de audio (MediaRecorder) ─────────────────────────────
  // Solo graba mientras el vendedor está hablando (mic activo). Entre turnos
  // se pausa para no acumular silencio ni voz del agente TTS. El blob final
  // concatena únicamente los tramos hablados del vendedor.
  async function startAudioCapture() {
    if (!sellerData?.audio_consent) return;
    const existing = mediaRecorderRef.current;
    if (existing) {
      if (existing.state === "paused") {
        try { existing.resume(); } catch {}
      }
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported?.("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      rec.start(1000); // chunk cada 1s — robusto frente a cierres abruptos
      mediaRecorderRef.current = rec;
    } catch (err) {
      console.error("[audio-capture] failed to start:", err);
    }
  }

  function pauseAudioCapture() {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === "recording") {
      try { rec.pause(); } catch {}
    }
  }


  function stopAudioCapture(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const rec = mediaRecorderRef.current;
      const stream = mediaStreamRef.current;
      mediaRecorderRef.current = null;
      mediaStreamRef.current = null;
      if (!rec) {
        stream?.getTracks().forEach((t) => t.stop());
        return resolve(null);
      }
      const finish = () => {
        const blob = recordedChunksRef.current.length
          ? new Blob(recordedChunksRef.current, { type: rec.mimeType || "audio/webm" })
          : null;
        recordedChunksRef.current = [];
        stream?.getTracks().forEach((t) => t.stop());
        resolve(blob);
      };
      try {
        rec.onstop = finish;
        if (rec.state !== "inactive") rec.stop();
        else finish();
      } catch {
        finish();
      }
    });
  }


  async function playTTS(text: string, opts?: { force?: boolean }): Promise<void> {
    // Modo texto: la voz del Actor NO se sintetiza (ahorro directo). El mensaje
    // ya está en transcriptFull y se renderiza como chat. Solo el botón
    // opcional "escuchar" invoca con { force: true }.
    if (!opts?.force && inputModeRef.current === "text") return;
    stopAudio();

    setIsAgentSpeaking(true);
    // AbortController local — hardStop() dispara abort para desbloquear tanto
    // el fetch como el await del audio.
    const ctrl = new AbortController();
    ttsFetchAbortRef.current = ctrl;
    try {
      const res = await fetch(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({ text }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
      const blob = await res.blob();
      if (ctrl.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      await new Promise<void>((resolve, reject) => {
        // stopAudio() dispara este resolver cuando pausamos externamente,
        // así el caller que hace `await playTTS(...)` no queda colgado.
        ttsPlayResolverRef.current = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        audio.onended = () => {
          URL.revokeObjectURL(url);
          ttsPlayResolverRef.current = null;
          resolve();
        };
        audio.onpause = () => {
          // Pausa externa (stopAudio / hardStop) → resolvemos limpio.
          if (ttsPlayResolverRef.current) {
            const r = ttsPlayResolverRef.current;
            ttsPlayResolverRef.current = null;
            r();
          }
        };
        audio.onerror = () => {
          URL.revokeObjectURL(url);
          ttsPlayResolverRef.current = null;
          reject(new Error("audio error"));
        };
        audio.play().catch(reject);
      });
    } catch (err) {
      if ((err as any)?.name !== "AbortError") {
        console.error("[voice] playTTS failed:", err);
      }
    } finally {
      if (ttsFetchAbortRef.current === ctrl) ttsFetchAbortRef.current = null;
      setIsAgentSpeaking(false);
      audioRef.current = null;
    }
  }

  function startRecognition() {
    if (inputModeRef.current === "text") return; // modo texto: sin STT
    if (sessionEndedRef.current || cutRef.current) return;

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
    let sendTimer: ReturnType<typeof setTimeout> | null = null;
    // Umbral de silencio antes de cerrar el turno:
    //  - you_do: 3000ms — el vendedor practica y pausa buscando palabras. 2-3s
    //    de silencio es pensamiento, no fin de turno. Interrumpirlo entrena el
    //    hábito contrario a RRR.
    //  - i_do / otras fases: 2500ms.
    const baseSilenceMs = claudePhaseRef.current === "you_do" ? 3000 : 2500;
    // Ciclo extra si la frase parece incompleta (termina en conector o sin
    // puntuación de cierre) — cubre el caso "…encontrar—" cortado a media frase.
    const continuationExtraMs = 1500;
    const CONTINUATION_WORDS = new Set([
      "y", "e", "o", "u", "ni", "pero", "mas", "sino", "aunque",
      "que", "porque", "pues", "como", "cuando", "mientras", "si",
      "de", "del", "a", "al", "en", "con", "por", "para", "sin",
      "sobre", "entre", "hacia", "hasta", "desde", "según",
      "me", "te", "se", "le", "les", "nos", "os", "lo", "la", "los", "las",
      "mi", "tu", "su", "mis", "tus", "sus",
      "es", "era", "fue", "ser", "estar", "está", "estoy", "soy",
      "muy", "más", "menos", "también", "tampoco",
      "un", "una", "unos", "unas", "el", "los",
    ]);
    function looksIncomplete(text: string): boolean {
      const trimmed = text.trim();
      if (!trimmed) return false;
      // Puntuación de cierre natural → turno probablemente terminó.
      if (/[.!?…]$/.test(trimmed)) return false;
      // Guion largo / em dash / puntos suspensivos manuales → incompleto.
      if (/[—–-]$/.test(trimmed)) return true;
      const lastWord = trimmed
        .toLowerCase()
        .replace(/[.,;:!?¿¡"'()—–-]+$/g, "")
        .split(/\s+/)
        .pop() ?? "";
      return CONTINUATION_WORDS.has(lastWord);
    }
    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      const combined = finalText + interim;
      setInterimTranscript(combined);

      if (sendTimer) clearTimeout(sendTimer);
      const waitMs = looksIncomplete(combined)
        ? baseSilenceMs + continuationExtraMs
        : baseSilenceMs;
      sendTimer = setTimeout(() => {
        try { rec.stop(); } catch {}
      }, waitMs);
    };
    rec.onerror = (e: any) => {
      console.error("[voice] STT error:", e?.error ?? e);
      setIsUserListening(false);
    };
    rec.onend = () => {
      if (sendTimer) clearTimeout(sendTimer);
      setIsUserListening(false);
      recognitionRef.current = null;
      // Pausar la grabación entre turnos: solo capturamos cuando el vendedor habla.
      pauseAudioCapture();
      const text = finalText.trim();
      setInterimTranscript("");
      // Descartar turno del usuario si el Director ya cortó (carrera: user hablando
      // en paralelo mientras Director decidía cut).
      if (text && !cutRef.current && !sessionEndedRef.current) {
        void sendToCloser(text);
      }
    };

    recognitionRef.current = rec;
    setInterimTranscript("");
    setIsUserListening(true);
    // Arrancar/reanudar la captura de audio: el mic ya está activo para STT,
    // aprovechamos el mismo momento para grabar solo el turno del vendedor.
    void startAudioCapture();
    try {
      rec.start();
    } catch (err) {
      console.error("[voice] rec.start failed:", err);
      setIsUserListening(false);
      pauseAudioCapture();
    }
  }

  // Director (v2.0.0): corre después del turno del Actor en you_do.
  // Devuelve true si la sesión debe cortar (ya disparó cierre + evaluación).
  async function runDirector(): Promise<boolean> {
    // Idempotencia: si otra rama ya cortó, no ejecutamos ni registramos otra
    // decisión (evita el segundo `cut` en director_decisions).
    if (cutRef.current || sessionEndedRef.current) return true;
    try {
      if (youDoStartTimeRef.current === null) {
        youDoStartTimeRef.current = Date.now();
      }
      const elapsed_seconds = Math.floor((Date.now() - (youDoStartTimeRef.current ?? Date.now())) / 1000);
      const res = await fetch(DIRECTOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({
          practice_script: nodeDataRef.current?.practice_script ?? null,
          conversation_history: conversationHistoryRef.current,
          elapsed_seconds,
          session_id: sessionCorrelationIdRef.current,
          node_id: nodeId,
        }),
      });
      if (!res.ok) {
        console.warn("[director] HTTP", res.status, "— fail-open, sesión continúa");
        directorDecisionsRef.current.push({
          turn: conversationHistoryRef.current.filter((m) => m.role === "user").length,
          decision: "continue",
          reason: `http_${res.status}`,
          classifier_ran: false,
          classifier_result: null,
          latency_ms: 0,
          user_turns: conversationHistoryRef.current.filter((m) => m.role === "user").length,
          elapsed_seconds,
          at: new Date().toISOString(),
        });
        return false;
      }
      const data = await res.json();
      const decision: "continue" | "cut" = data?.decision === "cut" ? "cut" : "continue";
      const reason: string = typeof data?.reason === "string" ? data.reason : "unknown";
      directorDecisionsRef.current.push({
        turn: conversationHistoryRef.current.filter((m) => m.role === "user").length,
        decision,
        reason,
        classifier_ran: !!data?.classifier_ran,
        classifier_result: typeof data?.classifier_result === "boolean" ? data.classifier_result : null,
        latency_ms: typeof data?.latency_ms === "number" ? data.latency_ms : 0,
        user_turns: typeof data?.user_turns === "number" ? data.user_turns : 0,
        elapsed_seconds: typeof data?.elapsed_seconds === "number" ? data.elapsed_seconds : elapsed_seconds,
        at: new Date().toISOString(),
      });
      console.log("[director]", decision, reason, data);
      if (decision === "cut") {
        // Terminal e inmediato: silencia todo Actor audio en curso, aborta
        // fetches pendientes, bloquea mic/STT. hardStop() marca cutRef ANTES
        // de que se pueda registrar otra decisión.
        hardStop();
        // BUG 2 fix: el closing DEBE sonar. Usamos `||` con trim para caer al
        // default si el script trae "" (que con `??` se colaba como string vacío
        // → TTS silencioso → sensación de crash). Nunca dejamos que un script
        // vacío borre la señal emocional de cierre.
        // v2.1.0: cuando el Director corta por evidence_sufficient (el usuario
        // no completó el objetivo pero ya hay material para evaluar), el closing
        // del script sonaría a felicitación falsa — usamos un neutral genérico.
        const NEUTRAL_CLOSING = "Bien, con esto tengo lo que necesito. Vamos a revisar cómo te fue.";
        const scriptClosing: string | undefined =
          nodeDataRef.current?.practice_script?.phases?.closing?.message;
        const closingMsg: string =
          reason === "evidence_sufficient"
            ? NEUTRAL_CLOSING
            : (typeof scriptClosing === "string" && scriptClosing.trim())
              ? scriptClosing
              : DEFAULT_CLOSING_MESSAGE;
        const agentItem: TranscriptItem = {
          role: "agent",
          text: closingMsg,
          phase: currentPhaseRef.current,
        };
        transcriptFullRef.current = [...transcriptFullRef.current, agentItem];
        setTranscriptFull([...transcriptFullRef.current]);
        conversationHistoryRef.current = [
          ...conversationHistoryRef.current,
          { role: "assistant", content: closingMsg },
        ];
        // playTTS del closing corre incluso con cutRef=true — el guard vive en
        // los callers (mic, sendToCloser), no en playTTS.
        console.log("[director] cut → playing closing:", closingMsg);
        try {
          await playTTS(closingMsg);
        } catch (e) {
          console.error("[director] closing TTS failed:", e);
        }
        // En modo texto: no hay TTS que dé tiempo natural para leer el último
        // intercambio + el closing. Damos ~4s (o el usuario puede navegar
        // manualmente si activamos un botón en un futuro) antes de transicionar
        // a "Analizando". En voz este delay ya lo cubre la duración del TTS.
        if (inputModeRef.current === "text") {
          await new Promise((r) => setTimeout(r, 4000));
        }
        await handleSessionEnd();
        return true;
      }
      return false;
    } catch (e) {
      console.error("[director] exception — fail-open:", e);
      directorDecisionsRef.current.push({
        turn: conversationHistoryRef.current.filter((m) => m.role === "user").length,
        decision: "continue",
        reason: "exception",
        classifier_ran: false,
        classifier_result: null,
        latency_ms: 0,
        user_turns: conversationHistoryRef.current.filter((m) => m.role === "user").length,
        elapsed_seconds: null,
        at: new Date().toISOString(),
      });
      return false;
    }
  }


  async function sendToCloser(userText: string) {
    if (sessionEndedRef.current || cutRef.current) return;
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

    if (claudePhaseRef.current === "i_do") {
      iDoUserTurnsRef.current += 1;
    }

    await callActor();
  }

  // callActor: envía el estado actual (refs) al Actor. El último turno del user
  // YA está en conversationHistoryRef. Se usa para envíos nuevos (desde
  // sendToCloser) y para reintentos manuales tras un error de red — el retry NO
  // duplica el turno porque lee el historial existente.
  async function callActor() {
    if (sessionEndedRef.current || cutRef.current) return;

    const history = conversationHistoryRef.current;
    const lastUser = [...history].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      setIsProcessing(false);
      return;
    }
    const userText = lastUser.content;

    setConnectionError(null);
    setIsProcessing(true);

    // AbortController para el fetch del Actor — hardStop() lo aborta.
    const ctrl = new AbortController();
    actorFetchAbortRef.current = ctrl;

    // Resiliencia: 1 reintento silencioso ante fallo de red o HTTP >= 500.
    async function attemptFetch(): Promise<Response> {
      const started = performance.now();
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
            conversation_history: history.slice(0, -1),
            session_id: sessionCorrelationIdRef.current,
            taught_skills: skillsContextRef.current?.taughtSkills ?? [],
          }),
          signal: ctrl.signal,
        });
        const latency = Math.round(performance.now() - started);
        if (!res.ok) {
          console.error(`[voice] closer-voice HTTP ${res.status} in ${latency}ms`);
        }
        return res;
      } catch (e) {
        const latency = Math.round(performance.now() - started);
        console.error(`[voice] closer-voice network fail in ${latency}ms:`, e);
        throw e;
      }
    }

    try {
      console.log("[closer-voice] company_brain:", companyData?.company_sales_brain);
      console.log("[closer-voice] practice_script:", nodeDataRef.current?.practice_script);
      console.log("[closer-voice] phase:", claudePhaseRef.current);

      let res: Response;
      try {
        res = await attemptFetch();
        if (!res.ok && res.status >= 500) throw new Error(`HTTP ${res.status}`);
      } catch (firstErr) {
        if ((firstErr as any)?.name === "AbortError") throw firstErr;
        if (ctrl.signal.aborted) throw firstErr;
        await new Promise((r) => setTimeout(r, 1500));
        if (ctrl.signal.aborted || sessionEndedRef.current || cutRef.current) return;
        res = await attemptFetch();
      }
      if (!res.ok) throw new Error(`closer-voice HTTP ${res.status}`);
      // Si mientras esperábamos la respuesta el Director cortó, descartamos.
      if (cutRef.current || sessionEndedRef.current) return;
      const data = await res.json();
      if (typeof data?.prompt_version === "string") promptVersionRef.current = data.prompt_version;
      if (typeof data?.model === "string") modelRef.current = data.model;
      const message: string = data?.message ?? "";
      const nextPhase: string = data?.next_phase ?? claudePhaseRef.current;
      const endSession: boolean = !!data?.end_session;

      const inIDo = claudePhaseRef.current === "i_do";

      // BUG 1 fix: en i_do, si Claude termina, marcamos sessionEnded ANTES de TTS
      // para que el micrófono no se ilumine al mismo tiempo que aparece "Listo, ahora yo".
      if (inIDo && endSession) {
        sessionEndedRef.current = true;
        stopRecognition();
        stopAudio();
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
        stopAudio();
        setIDoDemoDone(true);
        return;
      }

      if (message && !cutRef.current && !sessionEndedRef.current) {
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
        // Un cut pudo llegar mientras el Actor hablaba (audio.pause en hardStop).
        if (cutRef.current || sessionEndedRef.current) return;
      } else {
        setIsProcessing(false);
      }

      if (inIDo) {
        // En i_do sin endSession: el usuario decide si responder. No auto-activar mic.
        setIsProcessing(false);
        return;
      }

      // you_do / boss_sim / closing
      if (nextPhase && nextPhase !== "end" && nextPhase !== claudePhaseRef.current) {
        claudePhaseRef.current = nextPhase as any;
      }
      if (endSession || nextPhase === "end") {
        await handleSessionEnd();
        return;
      }

      // Director (v2.0.0): el Actor ya respondió — ahora el Director decide
      // si continuar o cortar. Solo corre en you_do. El Actor jamás decide fin.
      if (claudePhaseRef.current === "you_do") {
        const cut = await runDirector();
        if (cut) return;
      }

      // BUG 2 fix: no reactivar mic si la sesión terminó.
      if (sessionEndedRef.current) return;
      // En you_do el mic es 100% manual — el usuario toca el botón cuando quiera hablar.
      if (claudePhaseRef.current !== "you_do") {
        startRecognition();
      }
    } catch (err) {
      if ((err as any)?.name === "AbortError") {
        // Fetch cancelado por hardStop — silencioso, es el flujo esperado.
        return;
      }
      console.error("[voice] callActor failed:", err);
      setIsProcessing(false);
      setConnectionError("Error al hablar con Closer. Toca para reintentar.");
    } finally {
      if (actorFetchAbortRef.current === ctrl) actorFetchAbortRef.current = null;
    }
  }



  async function startIDoSession() {
    console.log('[i_do] practice_script:', JSON.stringify(nodeDataRef.current?.practice_script));
    try {
      setConnectionError(null);
      setIDoDemoDone(false);
      sessionEndedRef.current = false;
      cutRef.current = false;
      audioUploadedRef.current = false;
      // Nota: la captura de audio arranca cuando el vendedor toma el mic
      // (dentro de startRecognition), no aquí — así no grabamos el TTS del
      // agente ni el silencio inicial.
      conversationHistoryRef.current = [];
      transcriptFullRef.current = [];
      setTranscriptFull([]);
      iDoUserTurnsRef.current = 0;
      claudePhaseRef.current = "i_do";
      setCurrentPhase("i_do");
      currentPhaseRef.current = "i_do";

      const script: any = nodeDataRef.current?.practice_script ?? null;
      console.log("[i_do] nodeDataRef.current:", JSON.stringify(nodeDataRef.current?.practice_script?.i_do_type));
      console.log("[i_do] script:", JSON.stringify(script?.i_do_type));
      const briefing: string | undefined = script?.phases?.i_do?.briefing;
      const firstMessage: string =
        script?.phases?.i_do?.first_message
        ?? `Buenos días, ¿cómo está? Mucho gusto, soy ${sellerData?.full_name ?? "Carlos"} de ${companyData?.name ?? "la empresa"}. Qué bueno encontrarlo — justo quería platicar un momento con usted.`;

      const initialItems: TranscriptItem[] = [];
      if (briefing) {
        initialItems.push({ role: "agent", text: briefing, phase: "i_do" });
      }
      const agentItem: TranscriptItem = {
        role: "agent",
        text: firstMessage,
        phase: "i_do",
      };
      initialItems.push(agentItem);
      transcriptFullRef.current = initialItems;
      setTranscriptFull(initialItems);
      // NOTA: el briefing es explicación de Closer (mentor), no un turno del roleplay.
      // No se agrega a conversationHistoryRef para no contaminar el contexto del Actor
      // ni la evaluación.
      conversationHistoryRef.current = [
        { role: "assistant", content: firstMessage },
      ];

      if (briefing) {
        await playTTS(briefing);
        if (sessionEndedRef.current) return;
      }
      await playTTS(firstMessage);

      if (sessionEndedRef.current) return;

      const iDoType: string = script?.i_do_type ?? script?.phases?.i_do?.mode ?? "roleplay";
      if (iDoType === "demo") {
        // Demo pura: mostrar botón inmediatamente sin esperar a Claude
        stopRecognition();
        setIDoDemoDone(true);
        return;
      }
      // Roleplay: el usuario decide cuándo hablar tocando el micrófono manualmente.
      // El botón "Listo, ahora yo →" aparece cuando Claude termina con end_session.

    } catch (err) {
      console.error("[voice] startIDoSession failed:", err);
      setConnectionError("No se pudo iniciar la voz. Toca para reintentar.");
    }
  }

  async function startYouDoSession() {
    try {
      setConnectionError(null);
      setFeedbackResult(null);
      sessionEndedRef.current = false;
      cutRef.current = false;
      conversationHistoryRef.current = [];
      transcriptFullRef.current = [];
      setTranscriptFull([]);
      claudePhaseRef.current = "you_do";
      setCurrentPhase("you_do");
      currentPhaseRef.current = "you_do";
      // Reset del estado del Director al arrancar you_do.
      directorDecisionsRef.current = [];
      youDoStartTimeRef.current = Date.now();

      // El vendedor (usuario) abre. Mic 100% manual: el usuario toca el botón cuando quiera hablar.
      const seen = typeof window !== "undefined" && window.localStorage.getItem("closer_voice_tutorial_seen") === "true";
      if (!seen) {
        setShowVoiceTutorial(true);
        return;
      }
    } catch (err) {

      console.error("[voice] startYouDoSession failed:", err);
      setConnectionError("No se pudo iniciar la voz. Toca para reintentar.");
    }
  }

  async function handleSessionEnd() {
    sessionEndedRef.current = true;
    stopRecognition();
    stopAudio();
    // Detener captura de audio en paralelo (no bloquea el feedback)
    const audioBlobPromise = stopAudioCapture();
    const youDo = transcriptFullRef.current.filter((m) => m.phase === "you_do");
    setYouDoTranscript(youDo);
    const youDoConv = youDo.map((m) => ({
      role: m.role === "agent" ? "assistant" : "user",
      content: m.text,
    }));
    setYouDoHistory(youDoConv);
    // 1) Show feedback (loading) screen immediately
    setPhase("feedback");
    // 2) Run evaluation in background
    try {
      const evaluatePayload = {
        transcript: "",
        phase: "evaluate" as const,
        practice_script: nodeDataRef.current?.practice_script ?? null,
        company_brain: JSON.stringify(companyData?.company_sales_brain ?? {}),
        seller_name: sellerData?.full_name ?? "",
        conversation_history: transcriptFullRef.current
          .filter((m) => m.phase === "you_do")
          .map((m) => ({ role: m.role === "agent" ? "assistant" : "user", content: m.text })),
        session_id: sessionCorrelationIdRef.current,
        taught_skills: skillsContextRef.current?.taughtSkills ?? [],
      };
      console.log("[closer-voice evaluate] →", evaluatePayload);
      const evaluateRes = await fetch(VOICE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify(evaluatePayload),
      });
      const rawText = await evaluateRes.text();
      console.log("[closer-voice evaluate] ← status", evaluateRes.status, "body:", rawText);
      if (!evaluateRes.ok) throw new Error(`closer-voice evaluate HTTP ${evaluateRes.status}: ${rawText}`);
      let evaluation: any;
      try {
        evaluation = JSON.parse(rawText);
      } catch (e) {
        throw new Error("closer-voice evaluate returned invalid JSON");
      }
      console.log("[closer-voice evaluate] parsed:", evaluation);
      if (typeof evaluation?.prompt_version === "string") promptVersionRef.current = evaluation.prompt_version;
      if (typeof evaluation?.model === "string") modelRef.current = evaluation.model;
      const obsValid =
        Array.isArray(evaluation?.observations) &&
        evaluation.observations.length > 0 &&
        evaluation.observations.every(
          (o: any) =>
            o && typeof o === "object" &&
            typeof o.error === "string" &&
            typeof o.mejora === "string" &&
            typeof o.ejemplo === "string",
        );
      if (
        typeof evaluation?.score !== "number" ||
        ![1, 2, 3].includes(evaluation?.stars) ||
        !obsValid ||
        typeof evaluation?.mision !== "string"
      ) {
        throw new Error("closer-voice evaluate response malformed");
      }
      setFeedbackResult({
        score: Number(evaluation.score),
        stars: evaluation.stars === 3 ? 3 : evaluation.stars === 2 ? 2 : 1,
        observations: evaluation.observations.slice(0, 3),
        mision: evaluation.mision,
      });
      const nodeType: string = nodeData?.node_type ?? "skill_drill";
      const practiceType =
        nodeType === "boss"
          ? "boss"
          : nodeType === "full_sim"
            ? "full_sim"
            : "skill_drill";
      const isBossLevel = nodeType === "boss" || nodeData?.is_boss === true;
      let session: any = null;
      try {
        const sessionRows = await restMutate<any>("practice_sessions", {
          method: "POST",
          prefer: "return=representation",
          body: {
            seller_id: sellerData.id,
            company_id: sellerData.company_id,
            node_id: nodeId,
            world_id: nodeData?.world_id ?? 0,
            practice_type: practiceType,
            is_boss_level: isBossLevel,
            transcript: JSON.stringify(transcriptFullRef.current),
            conversation_history: conversationHistoryRef.current as any,
          },
        });
        session = sessionRows[0] ?? null;
      } catch (sessionErr) {
        console.error("[practica] insert practice_sessions failed:", sessionErr);
      }
      setSessionId(session?.id ?? null);

      // Registrar seller_event + subir audio (si hay consent) vía Edge Function (service role)
      if (!audioUploadedRef.current) {
        audioUploadedRef.current = true;
        try {
          const audioBlob = await audioBlobPromise;
          const accessToken = getStoredSupabaseSession()?.accessToken ?? "";
          const form = new FormData();
          form.append(
            "meta",
            JSON.stringify({
              event_type: "practice_session",
              node_id: nodeId,
              skill_ids: Array.isArray(skillsContextRef.current?.skillsInFocus)
                ? skillsContextRef.current.skillsInFocus
                : [],
              prompt_version: promptVersionRef.current,
              model: modelRef.current,
              session_id: sessionCorrelationIdRef.current,
              payload: {
                practice_session_id: session?.id ?? null,
                world_id: nodeData?.world_id ?? 0,
                practice_type: practiceType,
                is_boss_level: isBossLevel,
                input_mode: inputModeRef.current,

                score: evaluation?.score ?? null,
                stars: evaluation?.stars ?? null,
                transcript: transcriptFullRef.current,
                director_decisions: directorDecisionsRef.current,
                // Full evaluator output — every field needed to rebuild skill_state
                // lives in the event itself. Regla arquitectónica: si el evaluador
                // lo produjo, el evento lo guarda.
                evaluation: {
                  score: evaluation?.score ?? null,
                  stars: evaluation?.stars ?? null,
                  criterios_cumplidos: Array.isArray(evaluation?.criterios_cumplidos)
                    ? evaluation.criterios_cumplidos
                    : [],
                  observations: Array.isArray(evaluation?.observations)
                    ? evaluation.observations
                    : [],
                  flags_detected: Array.isArray(evaluation?.flags_detected)
                    ? evaluation.flags_detected
                    : [],
                  mision: typeof evaluation?.mision === "string" ? evaluation.mision : null,
                },
              },
            }),
          );
          if (audioBlob && sellerData?.audio_consent) {
            form.append("audio", audioBlob, "session.webm");
          }
          const evRes = await fetch(`${SUPABASE_URL}/functions/v1/save-practice-event`, {
            method: "POST",
            headers: {
              apikey: SUPABASE_ANON,
              Authorization: `Bearer ${accessToken || SUPABASE_ANON}`,
            },
            body: form,
          });
          const evText = await evRes.text();
          console.log("[save-practice-event] ←", evRes.status, evText);
        } catch (uplErr) {
          console.error("[save-practice-event] failed:", uplErr);
        }
      }
    } catch (err) {
      console.error("[practica] handleSessionEnd error:", err);
      setFeedbackResult(null);
      setConnectionError("No se pudo generar el feedback. Toca para reintentar.");
    }
  }


  async function handleReplay() {
    sessionEndedRef.current = true;
    stopRecognition();
    stopAudio();
    void stopAudioCapture();
    // Replay reinicia la fase actual: liberamos el guard start-once para
    // permitir que la useEffect vuelva a arrancar la sesión.
    sessionStartedForPhaseRef.current = null;
    if (claudePhaseRef.current === "i_do") {
      await startIDoSession();
    } else {
      await startYouDoSession();
    }
  }

  async function handleExitConfirm() {
    sessionEndedRef.current = true;
    stopRecognition();
    stopAudio();
    void stopAudioCapture();
    navigate({ to: "/mapa" });
  }

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      sessionEndedRef.current = true;
      stopRecognition();
      stopAudio();
      void stopAudioCapture();
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
        {phase === "prep" && prepError && (
          <RetryScreen
            key="prep-error"
            title="No pudimos cargar la práctica"
            subtitle={prepError}
            primaryButtonText="Reintentar"
            onPrimaryAction={() => { setPrepError(null); void handleListo(); }}
          />
        )}

        {phase === "prep" && (
          <PrepPhase
            key="prep"
            micGranted={micGranted}
            nodeData={nodeData}
            onRetry={requestMic}
            onListo={handleListo}
            onExit={() => navigate({ to: "/mapa" })}
            inputMode={inputMode}
            onToggleMode={() => setInputMode((m) => (m === "voice" ? "text" : "voice"))}
          />
        )}

        {(phase === "i_do" || phase === "you_do") && (
          <>
            <VoicePhase
              key={phase}
              currentPhase={currentPhase}
              iDoPassive={
                phase === "i_do" &&
                ((nodeData?.practice_script as any)?.i_do_type ?? "demo") === "demo"
              }
              isAgentSpeaking={isAgentSpeaking}
              isUserListening={isUserListening}
              isProcessing={isProcessing}
              interimTranscript={interimTranscript}
              connectionError={connectionError}
              onMicClick={() => {
                if (cutRef.current || sessionEndedRef.current) return;
                if (isUserListening) stopRecognition();
                else if (!isAgentSpeaking) startRecognition();
              }}
              iDoDemoDone={iDoDemoDone}
              onRetry={() => {
                // Reintento reanuda: no resetea la sesión, solo reenvía el
                // último turno del user que ya vive en conversationHistoryRef.
                setConnectionError(null);
                void callActor();
              }}

              onReplay={handleReplay}
              onExitClick={() => setShowExitDialog(true)}
              inputMode={inputMode}
              onToggleMode={() => setInputMode((m) => (m === "voice" ? "text" : "voice"))}
              transcript={transcriptFull.map((t) => ({ role: t.role === "agent" ? "assistant" : "user", content: t.text }))}
              onTextSubmit={(txt: string) => {
                if (cutRef.current || sessionEndedRef.current) return;
                if (isProcessing || isAgentSpeaking) return;
                const t = txt.trim();
                if (!t) return;
                void sendToCloser(t);
              }}
              onPlayAgentAudio={(txt: string) => { void playTTS(txt, { force: true }); }}

            />


            {phase === "i_do" && iDoDemoDone && (
              <div
                style={{
                  position: "fixed",
                  left: 0,
                  right: 0,
                  bottom: 24,
                  display: "flex",
                  justifyContent: "center",
                  padding: "0 1.2rem",
                  zIndex: 50,
                }}
              >
                <button
                  onClick={() => {
                    stopAudio();
                    stopRecognition();
                    setIDoDemoDone(false);
                    setPhase("transition");
                  }}
                  style={{
                    background: "#FF6B2B",
                    color: "#fff",
                    border: "none",
                    borderRadius: 99,
                    padding: "16px 28px",
                    fontFamily: "Syne, sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: "pointer",
                    width: "100%",
                    maxWidth: 560,
                  }}
                >
                  Listo, ahora yo →
                </button>
              </div>
            )}
            {phase === "you_do" && showVoiceTutorial && inputMode === "voice" && (
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  background: "#08080F",
                  zIndex: 200,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "1.6rem 1.2rem calc(env(safe-area-inset-bottom, 0px) + 1.6rem)",
                }}
              >
                <style>{`
                  @keyframes closerBluePulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.6), 0 0 32px rgba(59,130,246,0.5); }
                    50% { box-shadow: 0 0 0 18px rgba(59,130,246,0), 0 0 48px rgba(59,130,246,0.35); }
                  }
                `}</style>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 560,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <h2
                    style={{
                      color: "#fff",
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 700,
                      fontSize: 24,
                      margin: "8px 0 8px",
                      textAlign: "center",
                    }}
                  >
                    Así funciona la práctica por voz
                  </h2>

                  {/* Tarjeta 1 */}
                  <div
                    style={{
                      background: "#14141C",
                      border: "1px solid rgba(255,107,43,0.3)",
                      borderRadius: 14,
                      padding: "1.2rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#FF6B2B",
                      }}
                    >
                      Closer habla primero
                    </div>
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        background: "#3B82F6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "closerBluePulse 1.6s ease-in-out infinite",
                        margin: "4px 0",
                      }}
                    >
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    </div>
                    <div
                      style={{
                        color: "#F0F0F5",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      Cuando el círculo pulsa en azul, Closer está hablando. Solo escucha.
                    </div>
                  </div>

                  {/* Tarjeta 2 */}
                  <div
                    style={{
                      background: "#14141C",
                      borderRadius: 14,
                      padding: "1.2rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#FF6B2B",
                      }}
                    >
                      Toca para hablar
                    </div>
                    <div style={{ display: "flex", gap: 18, margin: "4px 0" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: "#FF6B2B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                          </svg>
                        </div>
                        <div style={{ color: "#F0F0F5", fontFamily: "DM Sans, sans-serif", fontSize: 12 }}>Toca</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", color: "#5A5A8A", fontSize: 20 }}>→</div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            background: "#E0322B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div style={{ width: 18, height: 18, background: "#fff", borderRadius: 3 }} />
                        </div>
                        <div style={{ color: "#F0F0F5", fontFamily: "DM Sans, sans-serif", fontSize: 12 }}>Escuchando</div>
                      </div>
                    </div>
                    <div
                      style={{
                        color: "#F0F0F5",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      Cuando sea tu turno, toca el botón naranja. El botón se pone rojo mientras te escucha.
                    </div>
                  </div>

                  {/* Tarjeta 3 */}
                  <div
                    style={{
                      background: "#14141C",
                      borderRadius: 14,
                      padding: "1.2rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "Syne, sans-serif",
                        fontWeight: 700,
                        fontSize: 16,
                        color: "#FF6B2B",
                      }}
                    >
                      Termina de hablar
                    </div>
                    <div
                      style={{
                        color: "#F0F0F5",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 14,
                        lineHeight: 1.5,
                      }}
                    >
                      Cuando termines, haz una pausa de 3 segundos. Closer detecta el silencio y responde automáticamente.
                    </div>
                    <div
                      style={{
                        background: "rgba(34,197,94,0.12)",
                        border: "1px solid rgba(34,197,94,0.35)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        color: "#86EFAC",
                        fontFamily: "DM Sans, sans-serif",
                        fontSize: 13,
                        lineHeight: 1.45,
                      }}
                    >
                      No necesitas tocar nada para enviar — el silencio lo hace automático.
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      try { window.localStorage.setItem("closer_voice_tutorial_seen", "true"); } catch {}
                      setShowVoiceTutorial(false);
                    }}
                    style={{
                      background: "#FF6B2B",
                      color: "#fff",
                      border: "none",
                      borderRadius: 99,
                      padding: "16px 28px",
                      fontFamily: "Syne, sans-serif",
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: "pointer",
                      width: "100%",
                      marginTop: 8,
                    }}
                  >
                    Entendido, practicar →
                  </button>
                </div>
              </div>
            )}
          </>
        )}


        {phase === "transition" && (

          <TransitionPhase
            key="transition"
            nodeName={nodeData?.name ?? ""}
            onContinue={() => {
              sessionEndedRef.current = false;
              setPhase("you_do");
            }}
            onExitClick={() => setShowExitDialog(true)}
          />
        )}
        {phase === "feedback" && (
          <FeedbackPhase
            key="feedback"
            conversation={youDoHistory}
            feedback={feedbackResult}
            onContinue={async (stars) => {
              setSaving(true);

              const existingProgress = await restGetMaybeSingle<{ id: string; stars: number | null }>(
                `node_progress?select=id,stars&seller_id=eq.${sellerData.id}&node_id=eq.${encodeURIComponent(nodeId)}&limit=1`,
              );

              const previousStars = (existingProgress?.stars as number | null) ?? 0;
              const bestStars = Math.max(previousStars, stars);

              if (existingProgress?.id) {
                await restMutate(`node_progress?id=eq.${existingProgress.id}`, {
                  method: "PATCH",
                  body: {
                    status: "done",
                    stars: bestStars,
                    last_practiced_at: new Date().toISOString(),
                  },
                });
              } else {
                await restMutate("node_progress", {
                  method: "POST",
                  body: {
                  seller_id: sellerData.id,
                  company_id: sellerData.company_id,
                  node_id: nodeId,
                  status: "done",
                  stars: bestStars,
                  last_practiced_at: new Date().toISOString(),
                  },
                });
              }

              // Certificación Closer: pasar 9.3 con score >= 85 sella la certificación.
              // Un pase menor completa el nodo pero no certifica (se puede repetir).
              const finalScore = feedbackResult?.score ?? 0;
              if (nodeId === "9.3" && finalScore >= 85 && !sellerData.certified_at) {
                await restMutate(`sellers?id=eq.${sellerData.id}`, {
                  method: "PATCH",
                  body: { certified_at: new Date().toISOString() },
                });
              }

              const currentNodeRow = await restGetMaybeSingle<{ world_id: number; order_index: number }>(
                `nodes?select=world_id,order_index&id=eq.${encodeURIComponent(nodeId)}&limit=1`,
              );

              if (currentNodeRow) {
                const nextNode = await restGetMaybeSingle<{ id: string }>(
                  `nodes?select=id&world_id=eq.${currentNodeRow.world_id}&order_index=gt.${currentNodeRow.order_index}&order=order_index.asc&limit=1`,
                );

                if (nextNode) {
                  const nextProgress = await restGetMaybeSingle<{ id: string; status: string }>(
                    `node_progress?select=id,status&seller_id=eq.${sellerData.id}&node_id=eq.${encodeURIComponent(nextNode.id)}&limit=1`,
                  );
                  if (nextProgress?.id) {
                    if (nextProgress.status === "locked") {
                      await restMutate(`node_progress?id=eq.${nextProgress.id}`, {
                        method: "PATCH",
                        body: { status: "current" },
                      });
                    }
                  } else {
                    await restMutate("node_progress", {
                      method: "POST",
                      body: {
                      seller_id: sellerData.id,
                      company_id: sellerData.company_id,
                      node_id: nextNode.id,
                      status: "current",
                      },
                    });
                  }
                  await restMutate(`sellers?id=eq.${sellerData.id}`, {
                    method: "PATCH",
                    body: { current_node: nextNode.id },
                  });
                }
              }

              setNodeCompletionSignal({
                nodeId,
                stars: bestStars as 1 | 2 | 3,
                isReplay: previousStars > 0,
                improved: stars > previousStars,
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
  inputMode,
  onToggleMode,
}: {
  micGranted: boolean;
  nodeData: any;
  onRetry: () => void;
  onListo: () => void;
  onExit: () => void;
  inputMode: "voice" | "text";
  onToggleMode: () => void;
}) {

  const isText = inputMode === "text";
  const checks = isText
    ? [
        { ok: true, label: "Modo texto — no necesitas micrófono" },
        { ok: true, label: "Escribe tus turnos con calma" },
        { ok: true, label: "Presiona Enter para enviar" },
      ]
    : [
        { ok: micGranted, label: micGranted ? "Micrófono listo" : "Permite el micrófono" },
        { ok: true, label: "Sube el volumen al máximo 🔊" },
        { ok: true, label: "Busca un lugar sin ruido" },
      ];
  const canStart = isText || micGranted;
  const hasIDo = !!nodeData?.practice_script?.phases?.i_do;

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={onExit}
          aria-label="Salir"
          style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: 8, margin: -8 }}
        >
          ✕
        </button>
        <ModeToggle inputMode={inputMode} onToggle={onToggleMode} />
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
              {hasIDo ? "Closer demuestra primero y luego tú practicas." : "Sin demostración. Sin pistas. Tú y el cliente."}
            </div>
          </motion.div>
        )}


        {!micGranted && !isText && (
          <button
            onClick={onRetry}
            style={{ alignSelf: "center", background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, padding: "10px 18px", borderRadius: 99, cursor: "pointer" }}
          >
            Reintentar permiso
          </button>
        )}
      </div>

      <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
        <button
          onClick={onListo}
          disabled={!canStart}
          style={{
            width: "100%", height: 52, borderRadius: 99, border: "none", background: ORANGE, color: "#08080F",
            fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16,
            cursor: canStart ? "pointer" : "not-allowed", opacity: canStart ? 1 : 0.5,
            boxShadow: "0 10px 30px -8px rgba(255,107,43,0.45)",
          }}
        >
          {hasIDo ? "Ver demostración →" : "Estoy listo →"}
        </button>
      </div>

    </motion.div>
  );
}

// ───────────────────────── VOICE ─────────────────────────

function ModeToggle({ inputMode, onToggle }: { inputMode: "voice" | "text"; onToggle: () => void }) {
  const isText = inputMode === "text";
  return (
    <button
      onClick={onToggle}
      aria-label={isText ? "Cambiar a modo voz" : "Cambiar a modo texto"}
      title={isText ? "Modo texto activo — cambiar a voz" : "Modo voz activo — cambiar a texto"}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff", padding: "6px 12px", borderRadius: 99,
        fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer",
      }}
    >
      <span style={{ opacity: isText ? 0.35 : 1 }}>🎤</span>
      <span style={{ fontSize: 11, opacity: 0.6 }}>↔</span>
      <span style={{ opacity: isText ? 1 : 0.35 }}>⌨️</span>
    </button>
  );
}

function VoicePhase({
  currentPhase,
  iDoPassive,
  isAgentSpeaking,
  isUserListening,
  isProcessing,
  interimTranscript,
  connectionError,
  onMicClick,
  onRetry,
  onReplay,
  onExitClick,
  iDoDemoDone,
  inputMode,
  onToggleMode,
  transcript,
  onTextSubmit,
  onPlayAgentAudio,
}: {
  currentPhase: TurnPhase;
  iDoPassive: boolean;
  isAgentSpeaking: boolean;
  isUserListening: boolean;
  isProcessing: boolean;
  interimTranscript: string;
  connectionError: string | null;
  onMicClick: () => void;
  onRetry: () => void;
  onReplay: () => void;
  onExitClick: () => void;
  iDoDemoDone: boolean;
  inputMode: "voice" | "text";
  onToggleMode: () => void;
  transcript: { role: string; content: string }[];
  onTextSubmit: (txt: string) => void;
  onPlayAgentAudio: (txt: string) => void;
}) {
  const isIDo = currentPhase === "i_do";

  const isText = inputMode === "text";
  const ringColor = isAgentSpeaking
    ? BLUE
    : isUserListening
      ? ORANGE
      : "rgba(255,255,255,0.15)";
  const animatePulse = isAgentSpeaking || isUserListening;

  const micDisabled = isAgentSpeaking;
  const micBg = isUserListening ? RED : ORANGE;
  const micLabel = isUserListening
    ? "Closer está escuchando… toca de nuevo para enviar"
    : isAgentSpeaking
      ? "Closer está hablando…"
      : isProcessing
        ? "Pensando…"
        : isIDo
          ? "Toca para responder como cliente"
          : "Toca para hablar";

  const [textDraft, setTextDraft] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!isText) return;
    // Scroll SOLO el contenedor del transcript, no la página entera.
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript.length, isText, isProcessing]);

  const textDisabled = isProcessing || isAgentSpeaking;
  const submitText = () => {
    const t = textDraft.trim();
    if (!t || textDisabled) return;
    onTextSubmit(t);
    setTextDraft("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1, display: "flex", flexDirection: "column", padding: "1.2rem" }}
    >
      <style>{`
        @keyframes practica-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.6; }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={onExitClick}
          aria-label="Salir"
          style={{ background: "transparent", border: "none", color: "#fff", fontSize: 22, cursor: "pointer", padding: 8, margin: -8 }}
        >
          ✕
        </button>
        <ModeToggle inputMode={inputMode} onToggle={onToggleMode} />
      </div>

      <div
        style={{
          maxWidth: 560, width: "100%", margin: "16px auto 0",
          padding: "12px 16px", borderRadius: 14,
          background: isIDo ? "rgba(77,171,247,0.15)" : "rgba(255,107,43,0.15)",
          border: `1px solid ${isIDo ? BLUE : ORANGE}`,
          fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 14,
          textAlign: "center", color: "#fff",
        }}
      >
        {isIDo ? (iDoPassive ? "Closer demuestra — obsérvalo" : "Closer demuestra — reacciona como cliente") : "Tu turno — Hazlo solo."}
      </div>

      {isText ? (
        // ───────── Modo TEXTO: chat + composer ─────────
        <>
          <div
            ref={chatScrollRef}
            style={{
              flex: 1, maxWidth: 560, width: "100%", margin: "16px auto 0",
              display: "flex", flexDirection: "column", gap: 10,
              padding: 14, borderRadius: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              overflowY: "auto", minHeight: 0, maxHeight: "60vh",
            }}
          >
            {transcript.filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim()).map((m, i) => {
              const isAgent = m.role === "assistant";
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: isAgent ? "flex-start" : "flex-end" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: isAgent ? ORANGE : "rgba(255,255,255,0.5)" }}>
                      {isIDo ? (isAgent ? "Closer (demo)" : "Tú (cliente)") : (isAgent ? "Cliente" : "Tú")}
                    </div>
                    {isAgent && (
                      <button
                        onClick={() => onPlayAgentAudio(m.content)}
                        aria-label="Escuchar"
                        title="Escuchar"
                        style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12, padding: 0 }}
                      >🔊</button>
                    )}
                  </div>
                  <div
                    style={{
                      maxWidth: "85%", padding: "10px 14px", borderRadius: 14,
                      background: isAgent ? "rgba(255,107,43,0.12)" : "rgba(255,255,255,0.08)",
                      color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.5,
                      whiteSpace: "pre-wrap", wordBreak: "break-word", textAlign: "left",
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
            {isProcessing && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
                Pensando…
              </div>
            )}
            {connectionError && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 8 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: RED, fontSize: 14, textAlign: "center" }}>{connectionError}</p>
                <button
                  onClick={onRetry}
                  style={{ background: ORANGE, color: "#08080F", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 99, padding: "8px 20px", cursor: "pointer" }}
                >Reintentar</button>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {!iDoPassive && (
          <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", paddingTop: 12, paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <textarea
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitText();
                  }
                }}
                placeholder={isIDo ? "Reacciona como cliente…" : "Escribe tu turno…"}
                rows={2}
                style={{
                  flex: 1, resize: "none", padding: "10px 14px", borderRadius: 14,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.4,
                  outline: "none",
                }}
              />
              <button
                onClick={submitText}
                disabled={textDisabled || !textDraft.trim()}
                aria-label="Enviar"
                style={{
                  width: 48, height: 48, borderRadius: 99, border: "none",
                  background: ORANGE, color: "#08080F", fontSize: 20,
                  cursor: textDisabled || !textDraft.trim() ? "not-allowed" : "pointer",
                  opacity: textDisabled || !textDraft.trim() ? 0.4 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 10px 30px -8px rgba(255,107,43,0.45)",
                }}
              >➤</button>
            </div>
            <button
              onClick={onReplay}
              style={{ marginTop: 10, background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer", padding: 4 }}
            >Reiniciar práctica</button>
          </div>
          )}

        </>
      ) : (
        // ───────── Modo VOZ (original) ─────────
        <>
          <div style={{ flex: 1, maxWidth: 560, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ position: "relative", width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${ringColor}`, animation: animatePulse ? "practica-pulse 1.2s ease-in-out infinite" : undefined }} />
              <CloserCharacter size={120} state="normal" />
            </div>

            {interimTranscript && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "rgba(255,255,255,0.75)", textAlign: "center", maxWidth: 480, minHeight: 20 }}>
                "{interimTranscript}"
              </div>
            )}

            {connectionError && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 8 }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: RED, fontSize: 14, textAlign: "center" }}>{connectionError}</p>
                <button
                  onClick={onRetry}
                  style={{ background: ORANGE, color: "#08080F", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 99, padding: "10px 24px", cursor: "pointer", boxShadow: "0 10px 30px -8px rgba(255,107,43,0.45)" }}
                >Reintentar</button>
              </div>
            )}
          </div>

          <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", paddingBottom: "calc(20px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {!iDoDemoDone && !iDoPassive && (
              <>
                <button
                  onClick={onMicClick}
                  disabled={micDisabled}
                  aria-label={micLabel}
                  style={{
                    width: 84, height: 84, borderRadius: 99, border: "none",
                    background: micBg, color: "#08080F", fontSize: 32,
                    cursor: micDisabled ? "not-allowed" : "pointer",
                    opacity: micDisabled ? 0.4 : 1,
                    boxShadow: `0 10px 30px -8px ${micBg}55`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: isUserListening ? "practica-pulse 1.2s ease-in-out infinite" : undefined,
                  }}
                >
                  {isUserListening ? "■" : "🎤"}
                </button>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.6)", textAlign: "center", minHeight: 18 }}>
                  {isIDo && !isUserListening && !isAgentSpeaking
                    ? "Reacciona como cliente o toca 'Listo, ahora yo'"
                    : micLabel}
                </div>
              </>
            )}
            <button
              onClick={onReplay}
              style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer", padding: 4 }}
            >Reiniciar práctica</button>
          </div>
        </>
      )}
    </motion.div>
  );
}


// ───────────────────────── TRANSITION ─────────────────────────

function TransitionPhase({
  onContinue,
  onExitClick,
  nodeName,
}: {
  onContinue: () => void;
  onExitClick: () => void;
  nodeName: string;
}) {
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
          flex: 1,
          maxWidth: 560,
          width: "100%",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          textAlign: "center",
        }}
      >
        <CloserCharacter size={120} state="motivation" />
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 26,
            lineHeight: 1.2,
            color: "#fff",
          }}
        >
          Eso fue Closer demostrando {nodeName || "la técnica"}. Ahora es tu turno.
        </div>
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
          onClick={onContinue}
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
          }}
        >
          Yo soy el vendedor →
        </button>
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

type FeedbackStep = "analyzing" | "result" | "victory";

function ObservationCard({ obs }: { obs: ObservationItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            flex: 1,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            lineHeight: 1.4,
            color: "#fff",
            fontWeight: 500,
          }}
        >
          {obs.error}
        </span>
        <span
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 14,
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            display: "inline-block",
          }}
        >
          ›
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 14px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              lineHeight: 1.5,
              color: ORANGE,
              fontWeight: 600,
            }}
          >
            {obs.mejora}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.6)",
              fontStyle: "italic",
            }}
          >
            "{obs.ejemplo}"
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackPhase({
  onContinue,
  conversation,
  feedback,
}: {
  onContinue: (stars: 1 | 2 | 3) => void;
  conversation: { role: string; content: string }[];
  feedback: FeedbackResult | null;
}) {
  const [step, setStep] = useState<FeedbackStep>("analyzing");
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (feedback !== null) {
      setStep("result");
    }
  }, [feedback]);

  useEffect(() => {
    if (step !== "analyzing") return;
    const i = setInterval(() => {
      setMsgIdx((p) => (p + 1) % ANALYSIS_MESSAGES.length);
    }, 2000);
    return () => clearInterval(i);
  }, [step]);

  const score = feedback?.score ?? 0;
  const stars: 1 | 2 | 3 = feedback?.stars ?? 1;
  const observations = feedback?.observations ?? [];

  if (step === "victory") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1 }}>
        <VictoryScreen
          stars={stars}
          title="¡Práctica completada!"
          subtitle="Sigue avanzando."
          buttonText="Volver al mapa →"
          onContinue={() => onContinue(stars)}
        />
      </motion.div>
    );
  }

  if (step === "result") {
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
          overflowY: "auto",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            paddingTop: 16,
            paddingBottom: 24,
          }}
        >
          <CloserCharacter size={86} state="motivation" />
          <div
            style={{
              fontFamily: "Syne, sans-serif",
              fontWeight: 800,
              fontSize: 26,
              color: "#fff",
              textAlign: "center",
            }}
          >
            Tu práctica
          </div>

          {/* Score */}
          <div
            style={{
              width: "100%",
              padding: "20px 18px",
              borderRadius: 14,
              background: "rgba(255,107,43,0.10)",
              border: `1px solid ${ORANGE}55`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}
          >
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Score
            </div>
            <div
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 800,
                fontSize: 48,
                color: ORANGE,
                lineHeight: 1,
              }}
            >
              {score}
            </div>
          </div>

          {/* Observaciones */}
          <div
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 14,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                fontFamily: "Syne, sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: "#fff",
              }}
            >
              Observaciones de Closer
            </div>
            {observations.length === 0 ? (
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: "rgba(255,180,180,0.9)",
                }}
              >
                No se pudo generar el feedback de esta sesión. Intenta de nuevo más tarde.
              </div>
            ) : (
              observations.map((o, i) => (
                <ObservationCard key={i} obs={o} />
              ))
            )}
          </div>

          {feedback?.mision && (
            <div
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 14,
                background: "rgba(255,107,43,0.10)",
                border: `1px solid ${ORANGE}`,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontFamily: "Syne, sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  color: ORANGE,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Tu misión
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: "#fff",
                }}
              >
                {feedback.mision}
              </div>
            </div>
          )}

          <ConversationTranscript conversation={conversation} />

          <button
            onClick={() => setStep("victory")}
            style={{
              width: "100%",
              height: 52,
              marginTop: 8,
              borderRadius: 99,
              border: "none",
              background: ORANGE,
              color: "#08080F",
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 10px 30px -8px rgba(255,107,43,0.45)",
            }}
          >
            Ver resultado →
          </button>
        </div>
      </motion.div>
    );
  }

  // analyzing
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

function ConversationTranscript({
  conversation,
}: {
  conversation: { role: string; content: string }[];
}) {
  const [open, setOpen] = useState(false);
  const items = conversation.filter(
    (m) => (m.role === "user" || m.role === "assistant") && m.content?.trim(),
  );
  if (items.length === 0) return null;

  return (
    <div style={{ width: "100%", textAlign: "left" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 99,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "transparent",
          color: "rgba(255,255,255,0.85)",
          fontFamily: "Syne, sans-serif",
          fontWeight: 600,
          fontSize: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {open ? "Ocultar conversación" : "Ver conversación completa"}
        <span style={{ fontSize: 12, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            marginTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 14,
            borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {items.map((m, i) => {
            const isAgent = m.role === "assistant";
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  alignItems: isAgent ? "flex-start" : "flex-end",
                }}
              >
                <div
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: isAgent ? ORANGE : "rgba(255,255,255,0.5)",
                  }}
                >
                  {isAgent ? "Cliente" : "Tú"}
                </div>
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: isAgent
                      ? "rgba(255,107,43,0.12)"
                      : "rgba(255,255,255,0.08)",
                    color: "#fff",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    textAlign: "left",
                  }}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
