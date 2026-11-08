import { dialogoDeVenta, marcarUltimoDelVendedorFueraDeLaVenta, type TranscriptItem as TranscriptItemVenta, type TurnPhase as TurnPhaseVenta } from "@/lib/dialogo-venta";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { restGet, restGetMaybeSingle, restMutate } from "@/lib/supabase-rest";
import { obtenerCalificacion, CalificacionTardada } from "@/lib/evaluacion-guardada";
import { conReintentos, registrarFallaApp } from "@/lib/guardado-practica";
import { iniciarTurnoVoz, desbloquearContextoAudio, GrabacionSesion, UMBRAL_VOZ, ErrorTokenVoz, type ControlTurno } from "@/lib/voz/turno-voz";
import { sesionFresca } from "@/lib/sesion-viva";
import { avisoDeFallaVoz, avisoDeArranque } from "@/lib/voz/avisos-voz";
import { resolverTipoCliente, lineaDelCliente, contextoDelCliente, nombreVisible, fichaRespaldoVisible, LLAMADO_A_LA_ACCION, type FichaVisible } from "@/lib/cliente-practica";
import { CloserCharacter } from "@/components/closer/CloserCharacter";
import VictoryScreen from "@/components/VictoryScreen";
import { setNodeCompletionSignal } from "@/lib/node-completion";
import { NODO_CERTIFICACION } from "@/lib/certificacion";
import RetryScreen from "@/components/RetryScreen";
import { estiloBoton, Estrella } from "@/components/closer/piezas";
import { GiroPersonal } from "@/components/closer/GiroPersonal";
import { puertaPendiente, type Puerta } from "@/lib/giro-personal";
import { ESTILOS_PRACTICA, BotonIcono, IconoCerrar, IconoTeclado, IconoEnviar, SelectorModo, IconoMicrofono, EscenarioCliente, EscenarioCloser, FranjaDialogo, FranjaVozAgente, BotonMicrofono, PistaPrimeraVez, ALTO_PISTA, vozDelAgente, envolventeDe, PASO_ENVOLVENTE, lineaDeEstrellas, AnilloCalificacion, ListaRevision, DialogoCompleto } from "@/components/closer/practica-ui";


export const Route = createFileRoute("/nodo/$nodeId/practica")({
  component: PracticaPage,
  head: () => ({ meta: [
    { title: "Práctica — Closer" },
    { name: "description", content: "Practica ventas con un cliente simulado y recibe tu análisis en Closer." },
    { property: "og:title", content: "Práctica — Closer" },
    { property: "og:description", content: "Practica ventas con un cliente simulado y recibe tu análisis en Closer." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

const BG = "var(--c-bg)";
const ORANGE = "var(--c-primary)";
const BLUE = "var(--c-client)";
const GREEN = "var(--c-success)";
const RED = "var(--c-danger)";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
// Las funciones del servidor que gastan IA (cliente, evaluador, voz, Director)
// exigen la sesión del vendedor (oct-2026): antes aceptaban la llave pública y
// cualquiera en internet podía usarlas y gastar los créditos. Con la sesión,
// además, el consumo queda a nombre de la empresa correcta.
async function llaveUsuario(): Promise<string> {
  return (await sesionFresca())?.accessToken ?? SUPABASE_ANON;
}
// Llama a una función del servidor con la sesión del vendedor. Si el servidor
// la rechaza (401) aunque parecía vigente, se renueva una vez y se reintenta:
// así un token que caducó a media práctica no corta la conversación.
async function fetchFuncion(url: string, init: RequestInit): Promise<Response> {
  const conLlave = (tok: string): RequestInit => {
    const h = new Headers(init.headers);
    h.set("Authorization", `Bearer ${tok}`);
    return { ...init, headers: h };
  };
  const res = await fetch(url, conLlave(await llaveUsuario()));
  if (res.status !== 401) return res;
  const nueva = (await sesionFresca({ forzar: true }))?.accessToken;
  if (!nueva) return res;
  return fetch(url, conLlave(nueva));
}
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
type TurnPhase = TurnPhaseVenta;
const MAX_I_DO_USER_TURNS = 2;

// El tipo vive en src/lib/dialogo-venta.ts (mensaje 103): ahí se define qué es
// diálogo de venta y qué dijo Closer con su propia voz.
type TranscriptItem = TranscriptItemVenta;

interface ObservationItem {
  error: string;
  mejora: string;
  ejemplo: string;
  /** El paso de la visita y el nombre de la habilidad (oct-2026). */
  paso?: string;
  habilidad?: string;
}

/** Una falla detectada: lo que más le bajó la nota (oct-2026). */
interface FallaItem {
  id: string;
  severidad: "critical" | "major" | "minor";
  efecto: string;
  error: string;
  /** El paso de la visita al que pertenece (oct-2026). */
  paso?: string;
  cita?: string;
  mejora?: string;
  ejemplo?: string;
}

interface FeedbackResult {
  score: number;
  /** Las fallas que restaron o toparon la nota, la más grave primero. */
  fallas: FallaItem[];
  stars: 0 | 1 | 2 | 3;
  observations: ObservationItem[];
  mision: string;
  radarLines: string[];
  /** Coaching fuera del alcance del nodo. No afecta la calificación. */
  siguiente_nivel: { observacion: string; ejemplo: string; por_que: string }[];
}

function PracticaPage() {
  const { nodeId } = useParams({ from: "/nodo/$nodeId/practica" });
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("prep");
  const [micGranted, setMicGranted] = useState(false);
  const [sellerData, setSellerData] = useState<any>(null);
  // Mensaje 125: si el vendedor no tiene guardado que acepta la grabación, se le
  // pide una sola vez, antes de su práctica. Queda guardado por él mismo.
  const [pideConsentimiento, setPideConsentimiento] = useState<{ sellerId: string } | null>(null);
  // Mensajes 156-157: quien entrena por su cuenta cuenta su negocio «justo a tiempo», antes del nodo que lo usa.
  const [pideGiro, setPideGiro] = useState<{ companyId: string; puerta: Puerta; respuestas: Record<string, string | string[]>; cerebro: unknown } | null>(null);
  const [guardandoConsentimiento, setGuardandoConsentimiento] = useState(false);
  const [errorConsentimiento, setErrorConsentimiento] = useState<string | null>(null);
  const [nodeData, setNodeData] = useState<any>(null);
  // El nombre claro del nodo y sus minutos (los del mapa, mensaje 147). Van aparte porque la vista
  // v_nodes_resueltos no trae esas dos columnas.
  // Si este nodo ya estaba pasado antes de esta práctica (para no decir «desbloqueaste» de algo ya abierto).
  const [yaLoHabiaPasado, setYaLoHabiaPasado] = useState(false);
  const [infoMapa, setInfoMapa] = useState<{ nombre_corto: string | null; minutos_estimados: number | null } | null>(null);
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
  // Textos con los que Closer sale del personaje al cortar (deterministas, del guion).
  const closerMsgsRef = useRef<Set<string>>(new Set());
  const [, setSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [feedbackResult, setFeedbackResult] = useState<FeedbackResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const savedSessionRef = useRef<any>(null);
  const audioBlobPromiseRef = useRef<Promise<Blob | null> | null>(null);
  const rawEvaluationRef = useRef<any>(null);

  const [iDoDemoDone, setIDoDemoDone] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
  // El manager decide si su equipo puede practicar por texto. La voz es la
  // práctica principal; sin permiso, el botón para cambiar a texto no aparece.
  const [permiteTexto, setPermiteTexto] = useState(false);
  // La ficha del cliente de esta práctica: se pide al cargar, mientras el
  // vendedor ve la demostración, y viaja en cada turno y en la evaluación.
  const fichaRef = useRef<any>(null);
  const [fichaCliente, setFichaCliente] = useState<FichaVisible | null>(null);
  // La tarjeta "Tu cliente" es una ventana que el vendedor lee y cierra con
  // "Continuar" antes de poder hablar. Una vez por práctica.
  const [fichaVista, setFichaVista] = useState(false);
  // Nombre de cada criterio del nodo, para los mensajes de "analizando".
  const [nombresCriterio, setNombresCriterio] = useState<Record<string, string>>({});
  const inputModeRef = useRef<"voice" | "text">("voice");
  useEffect(() => { inputModeRef.current = inputMode; }, [inputMode]);



  // Nuevo flujo voz: TTS + STT + closer-voice
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserListening, setIsUserListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // iPhone (Safari) solo deja reproducir audio en un elemento que se "desbloqueó"
  // durante un toque del usuario. Antes se creaba un Audio nuevo después de
  // esperar al servidor: Safari lo bloqueaba y el error se tragaba en silencio —
  // la demostración "terminaba" al instante y las respuestas de Closer nunca se
  // oían. Ahora hay UN reproductor que se desbloquea con el primer toque en
  // cualquier parte de la pantalla y se reutiliza para todo lo que dice Closer.
  const reproductorRef = useRef<HTMLAudioElement | null>(null);
  const reproductorListoRef = useRef(false);
  useEffect(() => {
    const SILENCIO = "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
    const desbloquear = () => {
      // El procesador de audio del turno de voz también se activa con un toque (iPhone).
      desbloquearContextoAudio();
      if (reproductorListoRef.current || audioRef.current) return; // ya listo, o Closer está hablando
      const el = reproductorRef.current ?? new Audio();
      reproductorRef.current = el;
      el.src = SILENCIO;
      const p = el.play();
      if (p && typeof (p as Promise<void>).then === "function") {
        (p as Promise<void>).then(() => { el.pause(); reproductorListoRef.current = true; }).catch(() => { /* se reintenta en el siguiente toque */ });
      }
    };
    const opts = { capture: true } as AddEventListenerOptions;
    for (const ev of ["pointerdown", "touchend", "click"]) document.addEventListener(ev, desbloquear, opts);
    return () => { for (const ev of ["pointerdown", "touchend", "click"]) document.removeEventListener(ev, desbloquear, opts); };
  }, []);
  const recognitionRef = useRef<any>(null);
  // Cierra el turno de voz en curso (envía lo transcrito y evita relanzar STT).
  const finishVoiceTurnRef = useRef<null | (() => void)>(null);

  const conversationHistoryRef = useRef<{ role: string; content: string }[]>([]);
  const claudePhaseRef = useRef<"i_do" | "you_do" | "boss_sim" | "closing">("i_do");
  const sessionEndedRef = useRef(false);
  const iDoUserTurnsRef = useRef(0);
  // Captura de audio paralela al STT (solo si audio_consent === true)
  // Voz: grabación de la sesión (solo turnos del vendedor), número de turno,
  // marcas de tiempo por turno para el manager, y nivel de voz en vivo.
  const grabacionRef = useRef<GrabacionSesion | null>(null);
  const turnoVozRef = useRef(0);
  const audioTurnosRef = useRef<{ turno: number; inicio_seg: number; fin_seg: number; texto?: string }[]>([]);
  const [nivelVoz, setNivelVoz] = useState(0);
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
  // Fallas de la transcripción durante la práctica (oct-2026): quedan en el
  // evento para poder revisar una disputa sin adivinar qué pasó.
  const incidentesVozRef = useRef<{ turno: number; falla: string; codigo: string; accion: string; con_texto: boolean; at: string }[]>([]);
  const youDoStartTimeRef = useRef<number | null>(null);
  // Cut lock: se activa cuando el Director decide `cut`. Terminal e inmediato.
  // Todo lo posterior (STT, mic, sendToCloser, playTTS del Actor) queda bloqueado.
  // Solo el playTTS del closing.message se permite (se dispara ANTES de que otros
  // caminos consulten cutRef).
  const cutRef = useRef(false);
  // Razón del corte del Director — se pasa al evaluador y define el closing.
  const cutReasonRef = useRef<string | null>(null);
  // Puerta del cierre: el mensaje final del Director se queda en pantalla hasta
  // que el vendedor toca "Ver mi análisis →" (o pasan 20s como red de seguridad).
  const [closingGate, setClosingGate] = useState<string | null>(null);
  const closingGateResolveRef = useRef<(() => void) | null>(null);
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
        const node = await restGetMaybeSingle<{ id: string; name: string; description: string | null; field_mission: string | null; practice_script: any }>(
          `v_nodes_resueltos?select=id,name,description,field_mission,practice_script:practice_script_resuelto&id=eq.${encodeURIComponent(nodeId)}&limit=1`,
        );
        if (!alive) return;
        if (node) setNodeData((prev: any) => prev ?? node);
        const info = await restGetMaybeSingle<{ nombre_corto: string | null; minutos_estimados: number | null }>(
          `nodes?select=nombre_corto,minutos_estimados&id=eq.${encodeURIComponent(nodeId)}&limit=1`,
        ).catch(() => null);
        if (alive && info) setInfoMapa(info);
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
      // Solo para pedir el permiso: el micrófono se cierra de inmediato. Un
      // micrófono abierto pone al iPhone en modo "llamada" y baja el volumen.
      const permiso = await navigator.mediaDevices.getUserMedia({ audio: true });
      permiso.getTracks().forEach((t) => t.stop());
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
      const session = await sesionFresca();
      if (!session) {
        setPrepError("Tu sesión expiró. Inicia sesión de nuevo para practicar.");
        return;
      }
      const uid = session.userId;
      let seller: any = null;
      try {
        seller = await restGetMaybeSingle<any>(
          `sellers?select=id,full_name,experience_level,company_id,audio_consent,is_active&profile_id=eq.${uid}&limit=1`,
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
      if (seller.is_active === false) {
        setPrepError("Tu cuenta está pausada por tu líder de equipo.");
        return;
      }
      if (seller.audio_consent !== true) {
        setPideConsentimiento({ sellerId: seller.id });
        return;
      }
      let node: any = null;
      let company: any = null;
      let nodeSkillsRows: any[] = [];
      let tipoNodo: any = null;
      try {
        [node, company, nodeSkillsRows, tipoNodo] = await Promise.all([
          restGetMaybeSingle<any>(
            `v_nodes_resueltos?select=id,name,description,conversation_scope,node_type,boss_goal,field_mission,world_id,difficulty_level,is_boss,practice_script:practice_script_resuelto&id=eq.${encodeURIComponent(nodeId)}&limit=1`,
          ),
          restGetMaybeSingle<any>(
            `companies?select=name,company_sales_brain,permite_texto,tipos_cliente,is_personal,respuestas_giro&id=eq.${seller.company_id}&limit=1`,
          ),
          restGet<any>(
            `node_skills?select=relation,is_primary,weight,skill:skills(id,code,name,category,regla_id,default_allowed_concepts,default_forbidden_concepts)&node_id=eq.${encodeURIComponent(nodeId)}`,
          ),
          restGetMaybeSingle<any>(`nodes?select=tipo_cliente&id=eq.${encodeURIComponent(nodeId)}&limit=1`).catch(() => null),
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
      // Mensajes 156-157: sin manager no hay quien cuente cómo es su negocio. Antes de practicar (y de crear
      // la ficha del cliente) se le pide lo que este nodo necesita y todavía no contó; sin eso, el cliente
      // sería genérico. Qué se pide y antes de qué nodo: giro-personal.ts.
      if ((company as any)?.is_personal === true) {
        const respuestas = ((company as any)?.respuestas_giro ?? {}) as Record<string, string | string[]>;
        const puerta = puertaPendiente(nodeId, respuestas, (company as any)?.company_sales_brain);
        if (puerta) {
          setPideGiro({ companyId: seller.company_id, puerta, respuestas, cerebro: (company as any)?.company_sales_brain });
          return;
        }
      }

      // Build skillsContext
      const script: any = (node as any)?.practice_script ?? null;
      const rows: any[] = (nodeSkillsRows as any[]) ?? [];
      {
        const nombres: Record<string, string> = {};
        for (const r of rows) if (r?.skill?.regla_id && r?.skill?.name) nombres[r.skill.regla_id] = r.skill.name;
        setNombresCriterio(nombres);
        // Apagado por omisión: solo si el manager lo prendió.
        const permite = (company as any)?.permite_texto === true;
        // Qué cliente toca: el manager manda; si no, el que enseña mejor el nodo.
        const tipo = resolverTipoCliente(tipoNodo?.tipo_cliente, (company as any)?.tipos_cliente, Math.random());
        void (async () => {
          const ctrlFicha = new AbortController();
          const limiteFicha = setTimeout(() => ctrlFicha.abort(), 15_000);
          try {
            const r = await fetchFuncion(`${SUPABASE_URL}/functions/v1/closer-voice`, {
              signal: ctrlFicha.signal,
              method: "POST",
              headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON, Authorization: `Bearer ${await llaveUsuario()}` },
              body: JSON.stringify({ phase: "ficha_cliente", tipo_cliente: tipo, company_brain: JSON.stringify((company as any)?.company_sales_brain ?? {}) }),
            });
            const j = await r.json();
            if (!j?.ficha) throw new Error("sin ficha");
            fichaRef.current = j.ficha;
            setFichaCliente(j.ficha);
          } catch (err) {
            console.error("[practica] no se pudo crear la ficha del cliente (respaldo):", err);
            const respaldo = fichaRespaldoVisible(tipo);
            fichaRef.current = respaldo;
            setFichaCliente(respaldo);
          } finally {
            clearTimeout(limiteFicha);
          }
        })();
        setPermiteTexto(permite);
        if (!permite) setInputMode("voice");
      }
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
        setYaLoHabiaPasado((doneRows ?? []).some((r) => r.node_id === nodeId));
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


      // Radar de Fundamentos: nombres legibles de skills + regresiones previas
      // (últimos 2 practice_session events). Fail-open — el radar es opcional.
      let taughtSkillNames: Record<string, string> = {};
      let prevRegresiones: string[][] = []; // [prev1_ids, prev2_ids], prev1 = más reciente
      try {
        if (taughtSkills.length > 0) {
          const inList = taughtSkills.map((id) => encodeURIComponent(id)).join(",");
          const skillRows = await restGet<{ id: string; name: string }>(
            `skills?select=id,name&id=in.(${inList})`,
          );
          for (const s of skillRows ?? []) taughtSkillNames[s.id] = s.name;
        }
      } catch (e) {
        console.error("[practica] radar skill names fetch failed:", e);
      }
      try {
        const rows = await restGet<{ payload: any }>(
          `seller_events?select=payload&seller_id=eq.${seller.id}&event_type=eq.practice_session&order=created_at.desc&limit=2`,
        );
        prevRegresiones = (rows ?? []).map((r) => {
          const arr = r?.payload?.evaluation?.regresiones_detectadas;
          if (!Array.isArray(arr)) return [];
          return arr
            .map((x: any) => (x && typeof x?.skill_id === "string" ? x.skill_id : null))
            .filter((x): x is string => !!x);
        });
      } catch (e) {
        console.error("[practica] prev regresiones fetch failed (fail-open):", e);
        prevRegresiones = [];
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
        taughtSkillNames,
        prevRegresiones,
      };


      setSellerData(seller);
      setNodeData(node);
      nodeDataRef.current = node;
      {
        const cl = (node as any)?.practice_script?.phases?.closing ?? {};
        closerMsgsRef.current = new Set(
          [cl?.message, cl?.message_incomplete]
            .filter((x: unknown): x is string => typeof x === "string" && x.trim().length > 0)
            .map((x: string) => x.trim()),
        );
      }
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
    const finish = finishVoiceTurnRef.current;
    if (finish) {
      // Cierra el turno de forma controlada: detiene el reconocimiento,
      // evita el relanzado automático y envía lo dicho hasta ahora.
      finish();
      return;
    }
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

  // ── Grabación para el manager ───────────────────────────────────
  // Los turnos del vendedor en un solo WAV, armado con el MISMO audio que va a
  // la transcripción, con la marca de tiempo de cada turno. Sin la grabadora
  // del navegador: funciona igual en iPhone, Android y computadora, y la voz
  // de Closer nunca entra (solo se graba dentro del turno del vendedor).
  function startAudioCapture() {
    if (!sellerData?.audio_consent) return;
    if (!grabacionRef.current) grabacionRef.current = new GrabacionSesion();
  }

  function pauseAudioCapture() {
    grabacionRef.current?.cerrarTurno();
  }

  function stopAudioCapture(): Promise<Blob | null> {
    const g = grabacionRef.current;
    grabacionRef.current = null;
    if (!g) return Promise.resolve(null);
    const blob = g.wav();
    audioTurnosRef.current = g.turnos.slice();
    return Promise.resolve(blob);
  }



  async function playTTS(text: string, opts?: { force?: boolean }): Promise<void> {
    // Modo texto: la voz del Actor NO se sintetiza (ahorro directo). El mensaje
    // ya está en transcriptFull y se renderiza como chat. Solo el botón
    // opcional "escuchar" invoca con { force: true }.
    if (!opts?.force && inputModeRef.current === "text") return;
    stopAudio();

    setIsAgentSpeaking(true);
    // Mensaje 151-B: la franja y los anillos siguen este audio (qué se dice, cuánto va, qué tan fuerte).
    vozDelAgente.poner({ texto: text, progreso: 0, nivel: 0, conEnvolvente: false, activa: true });
    let raf = 0;
    // AbortController local — hardStop() dispara abort para desbloquear tanto
    // el fetch como el await del audio.
    const ctrl = new AbortController();
    ttsFetchAbortRef.current = ctrl;
    try {
      const res = await fetchFuncion(TTS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${await llaveUsuario()}`,
        },
        // Atribución de costo de voz (tts_calls) + caché de audio por hash.
        body: JSON.stringify({
          text,
          company_id: sellerData?.company_id ?? null,
          seller_id: sellerData?.id ?? null,
          session_id: sessionCorrelationIdRef.current,
          node_id: nodeId,
          phase,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
      const blob = await res.blob();
      if (ctrl.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const audio = reproductorRef.current ?? new Audio();
      reproductorRef.current = audio;
      audio.src = url;
      audioRef.current = audio;
      // El volumen cada 50 ms, medido en una copia aparte: la reproducción no pasa por ahí.
      let envolvente: number[] | null = null;
      void envolventeDe(blob).then((e) => {
        if (e && audioRef.current === audio) {
          envolvente = e;
          vozDelAgente.poner({ conEnvolvente: true });
        }
      });
      const seguirAudio = () => {
        if (audio.paused || audio.ended) { raf = 0; return; }
        // Si el teléfono no sabe cuánto dura el audio, se toma de la envolvente; si tampoco hay, el texto sale completo.
        const d = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : envolvente ? envolvente.length * PASO_ENVOLVENTE : NaN;
        const t = audio.currentTime;
        const progreso = Number.isFinite(d) ? Math.min(1, t / d) : 1;
        const nivel = envolvente ? (envolvente[Math.min(envolvente.length - 1, Math.floor(t / PASO_ENVOLVENTE))] ?? 0) : 0;
        vozDelAgente.poner({ progreso, nivel });
        raf = requestAnimationFrame(seguirAudio);
      };
      audio.onplaying = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(seguirAudio);
      };
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
      if ((err as any)?.name === "NotAllowedError") {
        // El teléfono bloqueó el audio. Nunca más en silencio: se le dice al
        // vendedor, y el toque en "reintentar" desbloquea el reproductor.
        console.error("[voice] el navegador bloqueó el audio:", err);
        setConnectionError("Tu teléfono bloqueó el audio de Closer. Toca aquí para escucharlo.");
      } else if ((err as any)?.name !== "AbortError") {
        console.error("[voice] playTTS failed:", err);
      }
    } finally {
      if (ttsFetchAbortRef.current === ctrl) ttsFetchAbortRef.current = null;
      cancelAnimationFrame(raf);
      if (reproductorRef.current) reproductorRef.current.onplaying = null;
      vozDelAgente.poner({ activa: false, progreso: 1, nivel: 0 });
      setIsAgentSpeaking(false);
      audioRef.current = null;
    }
  }

  // El turno de voz del vendedor (sept-2026). Un solo dueño del micrófono: se
  // abre al empezar el turno y se cierra al terminarlo. El texto en vivo llega
  // de ElevenLabs; el fin del turno lo decide NUESTRO reloj de silencio, igual
  // que antes, y la voz del vendedor (el nivel de audio) lo mantiene vivo
  // mientras habla aunque el texto tarde en llegar.
  function startRecognition() {
    if (inputModeRef.current === "text") return; // modo texto: sin voz
    if (sessionEndedRef.current || cutRef.current) return;

    let finalText = "";
    let sendTimer: ReturnType<typeof setTimeout> | null = null;
    let turnClosed = false;
    let control: ControlTurno | null = null;
    let ultimoEmpujon = 0;
    let pisoRuido = 0.3; // arranca alto y baja al primer silencio real
    const numeroTurno = ++turnoVozRef.current;

    // Modo radio (sept-2026, decisión de Emilio): tocas para hablar y tocas
    // otra vez para enviar; puedes pausar para pensar sin que nada se mande.
    // El reloj es solo una red de seguridad para que el micrófono no se quede
    // abierto por olvido: si pasan 25 s sin voz ni palabras nuevas, se envía lo
    // que llevas. (Antes el reloj de 3 s se reiniciaba con cada texto de
    // ElevenLabs —que repite el mismo texto mientras el micrófono esté
    // abierto— y nunca llegaba a cero: la práctica ya funcionaba como radio.)
    const ESPERA_SEGURIDAD_MS = 25000;


    function finishTurn() {
      if (turnClosed) return;
      turnClosed = true;
      if (finishVoiceTurnRef.current === finishTurn) finishVoiceTurnRef.current = null;
      if (sendTimer) clearTimeout(sendTimer);
      sendTimer = null;
      recognitionRef.current = null;
      setIsUserListening(false);
      setNivelVoz(0);
      grabacionRef.current?.cerrarTurno();
      const c = control;
      control = null;
      void (async () => {
        let texto = finalText;
        try {
          if (c) texto = juntar(prefijo, await c.terminar()) || finalText;
        } catch (err) {
          console.error("[voz] cierre del turno:", err);
        }
        setInterimTranscript("");
        if (prefijo) setConnectionError(null);
        const text = texto.trim();
        grabacionRef.current?.anotarTexto(numeroTurno, text);
        // Descartar turno del usuario si el Director ya cortó (carrera).
        if (text && !cutRef.current && !sessionEndedRef.current) void sendToCloser(text);
      })();
    }

    function scheduleFinish() {
      if (sendTimer) clearTimeout(sendTimer);
      sendTimer = setTimeout(finishTurn, ESPERA_SEGURIDAD_MS);
    }

    setInterimTranscript("");
    setIsUserListening(true);
    finishVoiceTurnRef.current = finishTurn;
    recognitionRef.current = { stop: () => finishTurn() };
    startAudioCapture();
    grabacionRef.current?.iniciarTurno(numeroTurno);
    scheduleFinish();

    // Si la transcripción se cae A MEDIO TURNO, lo dicho NO se envía solo
    // (oct-2026, disputa 3.10: la historia breve se fue cortada en "Vengo..."
    // sin que el vendedor tocara enviar). Se reconecta y se sigue sumando; si
    // no se puede, lo dicho se queda y el vendedor decide cuándo enviarlo.
    let prefijo = ""; // lo que se transcribió en conexiones anteriores de este turno
    let reconexiones = 0;
    const MAX_RECONEXIONES = 2;
    const juntar = (a: string, b: string) => `${a} ${b}`.replace(/\s+/g, " ").trim();
    const anotarIncidente = (falla: string, codigo: string, accion: string) => {
      incidentesVozRef.current.push({
        turno: numeroTurno, falla, codigo, accion,
        con_texto: !!finalText, at: new Date().toISOString(),
      });
    };
    const esperarEnvio = () => {
      // Sin reloj: nada se manda sin que el vendedor toque el micrófono.
      if (sendTimer) clearTimeout(sendTimer);
      sendTimer = null;
      setNivelVoz(0);
      setConnectionError("Se fue la señal un momento. Toca el micrófono para enviar lo que llevas.");
    };

    const abrir = () => {
    iniciarTurnoVoz({
      obtenerToken: obtenerTokenStt,
      idioma: "es",
      onParcial: (t) => {
        const total = juntar(prefijo, t);
        if (turnClosed || total === finalText) return; // solo cuenta el texto NUEVO
        finalText = total;
        setInterimTranscript(total);
        scheduleFinish();
      },
      onNivel: (n) => {
        if (turnClosed) return;
        setNivelVoz(n);
        // El piso de ruido del lugar (ventilador, calle, ganancia automática del
        // teléfono) se aprende despacio y no cuenta como voz; solo lo que sube
        // claramente por encima mantiene vivo el turno.
        pisoRuido = n < pisoRuido ? n : pisoRuido * 0.995 + n * 0.005;
        const esVoz = n >= Math.max(UMBRAL_VOZ, pisoRuido * 2.5, 0.22);
        // Mientras hay voz, el turno sigue vivo aunque el texto tarde en llegar.
        const ahora = Date.now();
        if (esVoz && ahora - ultimoEmpujon > 250) {
          ultimoEmpujon = ahora;
          scheduleFinish();
        }
      },
      onPcm: (p) => grabacionRef.current?.agregar(p),
      onError: (msg, falla, codigo) => {
        console.error("[voz] transcripción:", codigo, msg);
        if (turnClosed) return;
        if (finalText) {
          // Ya había texto: jamás se envía por una falla. Se suelta la conexión
          // caída y se abre otra; lo nuevo se suma a lo que ya llevaba.
          const caida = control;
          control = null;
          try { caida?.cancelar(); } catch { /* noop */ }
          prefijo = finalText;
          if (reconexiones < MAX_RECONEXIONES) {
            reconexiones++;
            anotarIncidente(falla, codigo, "reconecta");
            abrir();
          } else {
            anotarIncidente(falla, codigo, "espera_envio");
            esperarEnvio();
          }
          return;
        }
        // Sin texto todavía: se avisa QUÉ falló (con su código) en vez de dejar
        // al vendedor hablando solo.
        anotarIncidente(falla, codigo, "cierra_sin_texto");
        setConnectionError(avisoDeFallaVoz(falla, codigo));
        finishTurn();
      },
    })
      .then((c) => {
        if (turnClosed) {
          c.cancelar();
          return;
        }
        control = c;
      })
      .catch((err) => {
        console.error("[voz] no se pudo iniciar el turno:", err);
        if (turnClosed) return;
        if (prefijo) {
          // Falló la reconexión: lo dicho se queda; el vendedor lo envía.
          anotarIncidente("reconexion", String((err as any)?.message ?? err).slice(0, 60), "espera_envio");
          esperarEnvio();
          return;
        }
        turnClosed = true;
        if (sendTimer) clearTimeout(sendTimer);
        if (finishVoiceTurnRef.current === finishTurn) finishVoiceTurnRef.current = null;
        recognitionRef.current = null;
        setIsUserListening(false);
        setNivelVoz(0);
        grabacionRef.current?.cerrarTurno();
        setConnectionError(avisoDeArranque(err));
      });
    };
    abrir();
  }

  async function obtenerTokenStt(): Promise<string> {
    // La llave de sesión dura una hora: se pide ya renovada. Si aun así el
    // servidor la rechaza, se renueva a la fuerza y se intenta una vez más.
    const pedir = (tok: string) => fetch("/api/stt-token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}`, apikey: SUPABASE_ANON },
    });
    let tok = (await sesionFresca())?.accessToken;
    if (!tok) throw new Error("sin-sesion");
    let r = await pedir(tok);
    if (r.status === 401) {
      tok = (await sesionFresca({ forzar: true }))?.accessToken;
      if (!tok) throw new Error("sin-sesion");
      r = await pedir(tok);
    }
    if (!r.ok) {
      const cuerpo = await r.json().catch(() => null);
      throw new ErrorTokenVoz(r.status, typeof cuerpo?.status === "number" ? cuerpo.status : undefined);
    }
    const j = await r.json();
    if (typeof j?.token !== "string" || !j.token) throw new Error("token de transcripción vacío");
    return j.token;
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
      const res = await fetchFuncion(DIRECTOR_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${await llaveUsuario()}`,
        },
        body: JSON.stringify({
          practice_script: nodeDataRef.current?.practice_script ?? null,
          conversation_history: conversationHistoryRef.current,
          elapsed_seconds,
          session_id: sessionCorrelationIdRef.current,
          company_id: sellerData?.company_id ?? null,
          seller_id: sellerData?.id ?? null,
          node_id: nodeId,
        }),
      }).catch((e) => {
        console.warn("[director] sin red:", e);
        return null;
      });
      // Si el Director no responde, la app aplica ella misma los límites del
      // nodo: desde oct-2026 el cliente ya no puede terminar la práctica, así
      // que sin esto una falla del Director la dejaría sin fin.
      const limites = nodeDataRef.current?.practice_script?.limits ?? {};
      const turnosVendedor = conversationHistoryRef.current.filter((m) => m.role === "user").length;
      const corteLocal: string | null =
        typeof limites.max_turns === "number" && turnosVendedor >= limites.max_turns ? "max_turns"
        : typeof limites.max_duration_seconds === "number" && elapsed_seconds >= limites.max_duration_seconds ? "max_duration"
        : null;
      if (!res || !res.ok) {
        console.warn("[director] HTTP", res?.status ?? "sin_red", corteLocal ? `— corte local por ${corteLocal}` : "— fail-open, sesión continúa");
      }
      if ((!res || !res.ok) && !corteLocal) {
        directorDecisionsRef.current.push({
          turn: conversationHistoryRef.current.filter((m) => m.role === "user").length,
          decision: "continue",
          reason: `http_${res?.status ?? "sin_red"}`,
          classifier_ran: false,
          classifier_result: null,
          latency_ms: 0,
          user_turns: conversationHistoryRef.current.filter((m) => m.role === "user").length,
          elapsed_seconds,
          at: new Date().toISOString(),
        });
        return false;
      }
      const data = res && res.ok ? await res.json() : { decision: "cut", reason: corteLocal, local: true };
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
        cutReasonRef.current = reason;
        // Terminal e inmediato: silencia todo Actor audio en curso, aborta
        // fetches pendientes, bloquea mic/STT. hardStop() marca cutRef ANTES
        // de que se pueda registrar otra decisión.
        hardStop();
        // Coherencia corte→closing: el closing celebratorio del guion solo
        // suena cuando el vendedor COMPLETÓ el objetivo (scope_covered).
        // Cuando el Director corta antes (evidence_sufficient, max_turns,
        // max_duration), usamos message_incomplete si el script lo define, o
        // un neutral genérico. Nunca celebramos algo que no pasó.
        const GENERIC_NEUTRAL =
          "Ahí lo dejamos — ya tengo lo que necesito para tu análisis. Vamos al desglose.";
        const isComplete = reason === "scope_covered";
        const closingNode = nodeDataRef.current?.practice_script?.phases?.closing;
        const scriptClosing: string | undefined = isComplete
          ? closingNode?.message
          : closingNode?.message_incomplete;
        const closingMsg: string =
          typeof scriptClosing === "string" && scriptClosing.trim()
            ? scriptClosing
            : GENERIC_NEUTRAL;
        const agentItem: TranscriptItem = {
          role: "agent",
          text: closingMsg,
          phase: currentPhaseRef.current,
          // El cierre lo dice Closer, no el cliente: no se evalúa (mensaje 103).
          fuera_de_la_venta: true,
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
        // El cierre no puede pasar de largo: se queda en pantalla hasta que el
        // vendedor lo acepta (o 20s como red de seguridad), en voz y en texto.
        setClosingGate(closingMsg);
        await new Promise<void>((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            closingGateResolveRef.current = null;
            resolve();
          };
          const timer = setTimeout(finish, 20000);
          closingGateResolveRef.current = finish;
        });
        setClosingGate(null);
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
        const res = await fetchFuncion(VOICE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON,
            Authorization: `Bearer ${await llaveUsuario()}`,
          },
          body: JSON.stringify({
            transcript: userText,
            phase: claudePhaseRef.current,
            node_id: nodeId,
            practice_script: nodeDataRef.current?.practice_script ?? null,
            company_brain: JSON.stringify(companyData?.company_sales_brain ?? {}),
            seller_name: sellerData?.full_name ?? "",
            conversation_history: history.slice(0, -1),
            session_id: sessionCorrelationIdRef.current,
            company_id: sellerData?.company_id ?? null,
            seller_id: sellerData?.id ?? null,
            taught_skills: skillsContextRef.current?.taughtSkills ?? [],
            ficha_cliente: fichaRef.current,
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

      // Closer salió del personaje por un meta-comentario (puerta c). Este
      // intercambio NO es diálogo de venta: no entra al historial que ve el
      // Actor ni el Director, y en el transcript se firma como Closer.
      const metaTurn: boolean = data?.meta_turn === true;
      if (metaTurn) {
        // Quitar el turno meta del vendedor del historial (fue el último user).
        const h = conversationHistoryRef.current;
        if (h.length > 0 && h[h.length - 1]?.role === "user") {
          conversationHistoryRef.current = h.slice(0, -1);
        }
        if (message.trim()) closerMsgsRef.current.add(message.trim());
        // Y tampoco entra a la evaluación ni a las disputas (mensaje 103).
        transcriptFullRef.current = marcarUltimoDelVendedorFueraDeLaVenta(transcriptFullRef.current);
      }

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
          // La respuesta fuera del papel la dice Closer, no el cliente.
          ...(metaTurn ? { fuera_de_la_venta: true } : {}),
        };
        transcriptFullRef.current = [...transcriptFullRef.current, agentItem];
        setTranscriptFull([...transcriptFullRef.current]);
        if (!metaTurn) {
          conversationHistoryRef.current = [
            ...conversationHistoryRef.current,
            { role: "assistant", content: message },
          ];
        }
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
      // En you_do la sesión solo la termina el Director: si el cliente pide
      // terminar o cambiar de fase, se ignora (disputa 2.2, oct-2026).
      const enYouDo = claudePhaseRef.current === "you_do";
      if (!enYouDo && nextPhase && nextPhase !== "end" && nextPhase !== claudePhaseRef.current) {
        claudePhaseRef.current = nextPhase as any;
      }
      if (!enYouDo && (endSession || nextPhase === "end")) {
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
      // El botón «Listo, ahora yo» aparece cuando Claude termina con end_session.

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
      setFichaVista(false);
      setCurrentPhase("you_do");
      currentPhaseRef.current = "you_do";
      // Reset del estado del Director al arrancar you_do.
      directorDecisionsRef.current = [];
      incidentesVozRef.current = [];
      youDoStartTimeRef.current = Date.now();

      // El vendedor (usuario) abre. Mic 100% manual: el usuario toca el botón cuando quiera hablar.
      // Mensaje 154: la primera vez ya no hay pantalla de tutorial; VoicePhase muestra pistas bajo el micrófono.
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
    audioBlobPromiseRef.current = stopAudioCapture();
    const youDo = transcriptFullRef.current.filter((m) => m.phase === "you_do");
    setYouDoTranscript(youDo);
    // Las disputas discuten solo el diálogo de venta (mensaje 103).
    const youDoConv = dialogoDeVenta(transcriptFullRef.current);
    setYouDoHistory(youDoConv);
    // 1) Mostrar pantalla de análisis
    setPhase("feedback");
    // 2) GUARDAR LA PRÁCTICA ANTES DE EVALUAR — si el análisis falla,
    //    la conversación ya está persistida y se puede reintentar.
    await persistPracticeSession();
    // 3) Evaluar (reintentable)
    await runEvaluation();
  }

  /** Inserta practice_sessions con el transcript, antes de cualquier llamada al evaluador. */
  async function persistPracticeSession() {
    if (savedSessionRef.current) return;
    const nodeType: string = nodeDataRef.current?.node_type ?? nodeData?.node_type ?? "skill_drill";
    const practiceType =
      nodeType === "boss" ? "boss" : nodeType === "full_sim" ? "full_sim" : "skill_drill";
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
          is_boss_level: nodeType === "boss" || nodeData?.is_boss === true,
          transcript: JSON.stringify(transcriptFullRef.current),
          conversation_history: conversationHistoryRef.current as any,
        },
      });
      savedSessionRef.current = sessionRows[0] ?? null;
      setSessionId(savedSessionRef.current?.id ?? null);
    } catch (sessionErr) {
      console.error("[practica] insert practice_sessions failed:", sessionErr);
    }
  }

  /**
   * Pide la calificación de la práctica ya guardada. Reintentable sin perder nada.
   * Mensaje 126: el servidor la calcula en segundo plano y la GUARDA; el teléfono
   * pregunta por ella hasta que está lista. Antes había un corte fijo de 60 s:
   * si el servidor tardaba más, la calificación se perdía y al reintentar se
   * calculaba otra vez (doble costo y otra nota posible). Ahora reintentar trae
   * la misma calificación guardada.
   */
  async function runEvaluation() {
    setEvalError(null);
    setFeedbackResult(null);
    // Sin práctica guardada no hay calificación guardada: primero se guarda.
    if (!savedSessionRef.current) await persistPracticeSession();
    const practiceSessionId: string | null = savedSessionRef.current?.id ?? null;
    if (!practiceSessionId) {
      setEvalError("No pude guardar tu práctica. Revisa tu conexión y vuelve a intentarlo: tu conversación sigue en este teléfono.");
      return;
    }
    try {
      const evaluatePayload = {
        practice_session_id: practiceSessionId,
        transcript: "",
        phase: "evaluate" as const,
        node_id: nodeId,
        practice_script: nodeDataRef.current?.practice_script ?? null,
        company_brain: JSON.stringify(companyData?.company_sales_brain ?? {}),
        seller_name: sellerData?.full_name ?? "",
        // Solo el diálogo de venta: sin el cierre ni los desvíos de Closer (mensaje 103).
        conversation_history: dialogoDeVenta(transcriptFullRef.current),
        session_id: sessionCorrelationIdRef.current,
        company_id: sellerData?.company_id ?? null,
        seller_id: sellerData?.id ?? null,
        taught_skills: skillsContextRef.current?.taughtSkills ?? [],
        ficha_cliente: fichaRef.current,

        cut_reason: cutReasonRef.current ?? "unknown",
        director_user_turns: conversationHistoryRef.current.filter((m) => m.role === "user").length,
        // Mensaje 129: con esto el servidor registra la práctica en el historial
        // en cuanto la califica, aunque después este teléfono pierda la señal.
        evento: {
          skill_ids: Array.isArray(skillsContextRef.current?.skillsInFocus) ? skillsContextRef.current.skillsInFocus : [],
          input_mode: inputModeRef.current,
          transcript: transcriptFullRef.current,
          director_decisions: directorDecisionsRef.current,
          incidentes_voz: incidentesVozRef.current,
          audio_turnos: audioTurnosRef.current,
        },
      };
      console.log("[closer-voice evaluate] →", evaluatePayload);
      const rawText = await obtenerCalificacion({
        pedir: async () => {
          // El pedido solo registra la calificación: la respuesta es inmediata.
          // El límite es solo para una red colgada; si se corta, se pregunta
          // por la fila igual (el servidor pudo haberlo recibido).
          const ctrl = new AbortController();
          const limite = setTimeout(() => ctrl.abort(), 30_000);
          try {
            const res = await fetchFuncion(VOICE_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_ANON,
                Authorization: `Bearer ${await llaveUsuario()}`,
              },
              body: JSON.stringify(evaluatePayload),
              signal: ctrl.signal,
            });
            const texto = await res.text();
            console.log("[closer-voice evaluate] ← status", res.status, "body:", texto);
            return { status: res.status, texto };
          } finally {
            clearTimeout(limite);
          }
        },
        leer: () =>
          restGetMaybeSingle<{ estado: string; resultado: unknown; error: string | null }>(
            `evaluaciones_practica?select=estado,resultado,error&practice_session_id=eq.${encodeURIComponent(practiceSessionId)}&limit=1`,
            { timeoutMs: 15_000 },
          ),
        dormir: (ms) => new Promise((r) => setTimeout(r, ms)),
        ahora: () => Date.now(),
      });
      let evaluation: any;
      try {
        evaluation = JSON.parse(rawText);
      } catch (e) {
        throw new Error("closer-voice evaluate returned invalid JSON");
      }
      console.log("[closer-voice evaluate] parsed:", evaluation);
      if (typeof evaluation?.prompt_version === "string") promptVersionRef.current = evaluation.prompt_version;
      if (typeof evaluation?.model === "string") modelRef.current = evaluation.model;
      // Una ejecución limpia devuelve observations: []. Exigir al menos una
      // observación obligaba al evaluador a inventar defectos — y desde que le
      // cerramos el alcance (sept-2026), una práctica impecable en un nodo
      // corto legítimamente no tiene nada que corregir.
      const obsValid =
        Array.isArray(evaluation?.observations) &&
        evaluation.observations.every(
          (o: any) =>
            o && typeof o === "object" &&
            typeof o.error === "string" &&
            typeof o.mejora === "string" &&
            typeof o.ejemplo === "string",
        );
      if (
        typeof evaluation?.score !== "number" ||
        ![0, 1, 2, 3].includes(evaluation?.stars) ||
        !obsValid ||
        typeof evaluation?.mision !== "string"
      ) {
        throw new Error("closer-voice evaluate response malformed");
      }
      // Radar de Fundamentos — cálculo de rachas y líneas visibles.
      // Regla: 1ª ocurrencia = silencio; 2ª consecutiva = 1 línea; 3ª+ = línea + alerta manager.
      const currentRegresiones: { skill_id: string; evidencia: string }[] = Array.isArray(
        evaluation?.regresiones_detectadas,
      )
        ? evaluation.regresiones_detectadas.filter(
            (r: any) => r && typeof r?.skill_id === "string" && typeof r?.evidencia === "string",
          )
        : [];
      const prevReg: string[][] = Array.isArray(skillsContextRef.current?.prevRegresiones)
        ? skillsContextRef.current.prevRegresiones
        : [];
      const nameMap: Record<string, string> = skillsContextRef.current?.taughtSkillNames ?? {};
      const seen = new Set<string>();
      const rachas: { skill_id: string; streak: number; evidencia: string }[] = [];
      for (const r of currentRegresiones) {
        if (seen.has(r.skill_id)) continue;
        seen.add(r.skill_id);
        let streak = 1;
        if (prevReg[0]?.includes(r.skill_id)) {
          streak = 2;
          if (prevReg[1]?.includes(r.skill_id)) streak = 3;
        }
        rachas.push({ skill_id: r.skill_id, streak, evidencia: r.evidencia });
      }
      const radarLines: string[] = rachas
        .filter((r) => r.streak >= 2)
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 2)
        .map((r) => {
          const nombre = nameMap[r.skill_id] || r.skill_id;
          const sesion = r.streak >= 3 ? "tercera sesión seguida" : "segunda sesión seguida";
          return `Radar de fundamentos: ${sesion} con ${nombre} fallando. Eso ya lo dominas — no lo dejes caer.`;
        });

      rawEvaluationRef.current = evaluation;
      setFeedbackResult({
        score: Number(evaluation.score),
        // El cero existe: una sesión sin ejecución real no gana estrella (antes
        // todo lo que no era 3 ni 2 se volvía 1, y se guardaba 1).
        stars: evaluation.stars === 3 ? 3 : evaluation.stars === 2 ? 2 : evaluation.stars === 1 ? 1 : 0,
        observations: evaluation.observations.slice(0, 3),
        fallas: Array.isArray(evaluation?.fallas)
          ? evaluation.fallas.filter((f: any) => f && typeof f.error === "string" && typeof f.efecto === "string")
          : [],
        mision: evaluation.mision,
        radarLines,
        siguiente_nivel: Array.isArray((evaluation as any).siguiente_nivel)
          ? (evaluation as any).siguiente_nivel
          : [],
      });

      const nodeType: string = nodeData?.node_type ?? "skill_drill";
      const practiceType =
        nodeType === "boss"
          ? "boss"
          : nodeType === "full_sim"
            ? "full_sim"
            : "skill_drill";
      const isBossLevel = nodeType === "boss" || nodeData?.is_boss === true;
      const session = savedSessionRef.current;

      // Registrar seller_event + subir audio (si hay consent) vía Edge Function (service role)
      if (!audioUploadedRef.current) {
        audioUploadedRef.current = true;
        try {
          const audioBlob = await (audioBlobPromiseRef.current ?? Promise.resolve(null));
          const accessToken = (await sesionFresca())?.accessToken ?? "";
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
                cut_reason: cutReasonRef.current ?? "unknown",
                incidentes_voz: incidentesVozRef.current,
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
                  // Qué le bajó la nota y cómo se calculó: para el vendedor, el
                  // manager y la revisión de disputas (oct-2026).
                  fallas: Array.isArray(evaluation?.fallas) ? evaluation.fallas : [],
                  desglose: evaluation?.desglose ?? null,
                  regresiones_detectadas: currentRegresiones,
                  // Dónde empieza y termina cada turno del vendedor dentro de la
                  // grabación: el manager puede saltar directo a cualquiera.
                  audio_turnos: audioTurnosRef.current,
                  // Con quién practicó (el manager y las disputas necesitan saberlo).
                  ficha_cliente: fichaRef.current,
                },
                rachas,

              },
            }),
          );
          if (audioBlob && sellerData?.audio_consent) {
            form.append("audio", audioBlob, "session.webm");
          }
          // Mensaje 129: el servidor ya registró la práctica; esto le agrega el
          // audio y las rachas. Se reintenta, y si no se logra queda registrado
          // por qué (antes el error solo iba a la consola y se perdía).
          const r = await conReintentos(async () => {
            const evRes = await fetch(`${SUPABASE_URL}/functions/v1/save-practice-event`, {
              method: "POST",
              headers: {
                apikey: SUPABASE_ANON,
                Authorization: `Bearer ${(await sesionFresca())?.accessToken || accessToken || (await llaveUsuario())}`,
              },
              body: form,
            });
            const evText = await evRes.text();
            console.log("[save-practice-event] ←", evRes.status, evText);
            return { status: evRes.status, texto: evText };
          }, { esperar: (ms) => new Promise((res) => setTimeout(res, ms)) });
          if (!r.ok) {
            void registrarFallaApp({
              seller_id: sellerData?.id ?? null,
              donde: "save-practice-event",
              detalle: r.detalle,
              datos: {
                practice_session_id: session?.id ?? null,
                node_id: nodeId,
                intentos: r.intentos,
                status: r.status,
                bytes_audio: audioBlob?.size ?? 0,
                con_audio: !!(audioBlob && sellerData?.audio_consent),
              },
            });
          }
        } catch (uplErr) {
          console.error("[save-practice-event] failed:", uplErr);
          void registrarFallaApp({
            seller_id: sellerData?.id ?? null,
            donde: "save-practice-event",
            detalle: String((uplErr as any)?.message ?? uplErr).slice(0, 1000),
            datos: { practice_session_id: session?.id ?? null, node_id: nodeId, antes_de_enviar: true },
          });
        }
      }
    } catch (err) {
      console.error("[practica] runEvaluation error:", err);
      setFeedbackResult(null);
      setEvalError(
        err instanceof CalificacionTardada
          ? "El análisis está tardando más de lo normal."
          : "No pude generar tu análisis.",
      );
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
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
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

        {phase === "prep" && pideConsentimiento && (
          <ConsentimientoGrabacion
            key="consentimiento"
            guardando={guardandoConsentimiento}
            error={errorConsentimiento}
            onAceptar={async () => {
              setGuardandoConsentimiento(true);
              setErrorConsentimiento(null);
              try {
                const filas = await restMutate<any>(`sellers?id=eq.${pideConsentimiento.sellerId}`, {
                  method: "PATCH",
                  body: { audio_consent: true },
                  prefer: "return=representation",
                });
                if (filas?.[0]?.audio_consent !== true) throw new Error("no quedó guardado");
                setPideConsentimiento(null);
                void handleListo();
              } catch (e) {
                console.error("[practica] no se guardó el consentimiento:", e);
                setErrorConsentimiento("No pudimos guardarlo. Revisa tu conexión y vuelve a tocar el botón.");
              } finally {
                setGuardandoConsentimiento(false);
              }
            }}
            onSalir={() => navigate({ to: "/mapa" })}
          />
        )}

        {phase === "prep" && pideGiro && (
          <GiroPersonal
            key="giro"
            companyId={pideGiro.companyId}
            puerta={pideGiro.puerta}
            respuestas={pideGiro.respuestas}
            cerebro={pideGiro.cerebro}
            onListo={() => {
              setPideGiro(null);
              void handleListo();
            }}
            onSalir={() => navigate({ to: "/mapa" })}
          />
        )}

        {phase === "prep" && !pideConsentimiento && !pideGiro && (
          <PrepPhase
            key="prep"
            micGranted={micGranted}
            nodeData={nodeData}
            nodeId={nodeId}
            infoMapa={infoMapa}
            onRetry={requestMic}
            onListo={handleListo}
            onExit={() => navigate({ to: "/mapa" })}
            inputMode={inputMode}
            onToggleMode={permiteTexto ? () => setInputMode((m) => (m === "voice" ? "text" : "voice")) : undefined}
          />
        )}

        {(phase === "i_do" || phase === "you_do") && (
          <>
            <VoicePhase
              closerMsgs={closerMsgsRef.current}
              cliente={fichaCliente}
              nombreNodo={infoMapa?.nombre_corto || nodeData?.name || ""}
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
              nivelVoz={nivelVoz}
              connectionError={connectionError}
              onMicClick={() => {
                if (cutRef.current || sessionEndedRef.current) return;
                if (isUserListening) stopRecognition();
                else if (!isAgentSpeaking) startRecognition();
              }}
              iDoDemoDone={iDoDemoDone}
              onRetry={() => {
                // Reintento: si ya hay al menos un turno del user, reanuda
                // reenviando el último (conversationHistoryRef preservado).
                // Si no hay ninguno, es un error de arranque → re-arrancar
                // la fase actual desde cero (no hay estado que preservar).
                setConnectionError(null);
                const hasUserTurn = conversationHistoryRef.current.some((m) => m.role === "user");
                if (hasUserTurn) {
                  void callActor();
                } else {
                  sessionStartedForPhaseRef.current = null;
                  if (claudePhaseRef.current === "i_do") void startIDoSession();
                  else void startYouDoSession();
                }
              }}


              onReplay={handleReplay}
              onExitClick={() => setShowExitDialog(true)}
              inputMode={inputMode}
              onToggleMode={permiteTexto ? () => setInputMode((m) => (m === "voice" ? "text" : "voice")) : undefined}
              transcript={transcriptFull.map((t) => ({ role: t.role === "agent" ? "assistant" : "user", content: t.text }))}
              onTextSubmit={(txt: string) => {
                if (cutRef.current || sessionEndedRef.current) return;
                if (isProcessing || isAgentSpeaking) return;
                const t = txt.trim();
                if (!t) return;
                void sendToCloser(t);
              }}
              onPlayAgentAudio={(txt: string) => { void playTTS(txt, { force: true }); }}
              onListoDemo={() => {
                stopAudio();
                stopRecognition();
                setIDoDemoDone(false);
                setPhase("transition");
              }}

            />


            {/* En voz, «Listo, ahora yo» va dentro de la pantalla, en el lugar del micrófono (151-C).
                Aquí queda solo para el modo texto. */}
            {phase === "i_do" && iDoDemoDone && inputMode === "text" && (
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
                  style={{ ...estiloBoton("principal"), maxWidth: 560 }}
                >
                  Listo, ahora yo
                </button>
              </div>
            )}
            {phase === "you_do" && currentPhase === "you_do" && !fichaVista && (
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Tu cliente"
                style={{ position: "fixed", inset: 0, zIndex: 210, background: "rgb(var(--c-bg-rgb) / 0.82)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.2rem" }}
              >
                <div style={{ width: "100%", maxWidth: 420, background: "var(--c-surface)", border: "1px solid rgb(var(--c-primary-rgb) / 0.35)", borderRadius: 20, padding: "1.4rem 1.3rem", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
                  <div style={{ fontFamily: "Syne, sans-serif", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--c-primary)", marginBottom: 10 }}>Tu cliente</div>
                  {fichaCliente ? (
                    <>
                      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, color: "var(--c-text)", lineHeight: 1.2 }}>{nombreVisible(fichaCliente)}</div>
                      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 15, color: "rgb(var(--c-text-rgb) / 0.65)", marginBottom: 12 }}>{fichaCliente.negocio}</div>
                      <div style={{ display: "inline-block", fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 700, color: "var(--c-bg)", background: fichaCliente.tipo === "nuevo" ? "var(--c-client-soft)" : "var(--c-gold)", borderRadius: 99, padding: "4px 10px", marginBottom: 10 }}>
                        {fichaCliente.tipo === "nuevo" ? "Primera visita" : "Cliente recurrente"}
                      </div>
                      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 15, color: "rgb(var(--c-text-rgb) / 0.85)", lineHeight: 1.5 }}>{lineaDelCliente(fichaCliente)}</div>
                      {contextoDelCliente(fichaCliente).map((t) => (
                        <div key={t} style={{ fontFamily: "DM Sans, sans-serif", fontSize: 15, color: "rgb(var(--c-text-rgb) / 0.85)", lineHeight: 1.5, marginTop: 6 }}>• {t}</div>
                      ))}
                      <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 15, color: "var(--c-text)", fontWeight: 600, lineHeight: 1.5, marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)" }}>{LLAMADO_A_LA_ACCION}</div>
                    </>
                  ) : (
                    <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 15, color: "rgb(var(--c-text-rgb) / 0.7)", padding: "1rem 0" }}>Preparando a tu cliente…</div>
                  )}
                  <button
                    onClick={() => setFichaVista(true)}
                    disabled={!fichaCliente}
                    style={{ ...estiloBoton("principal", !fichaCliente), marginTop: 18 }}
                  >
                    Continuar
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
            nombresCriterio={nombresCriterio}
            closerMsgs={closerMsgsRef.current}
            key="feedback"
            evalError={evalError}
            onRetryEvaluation={() => { void runEvaluation(); }}

            conversation={youDoHistory}
            feedback={feedbackResult}
            worldId={nodeData?.world_id ?? 0}
            nodeId={nodeId}
            yaLoHabiaPasado={yaLoHabiaPasado}
            nombreCliente={fichaCliente ? nombreVisible(fichaCliente) : null}
            esReto={nodeData?.node_type === "boss" || nodeData?.is_boss === true}
            sessionId={sessionCorrelationIdRef.current}
            practiceScript={nodeData?.practice_script ?? null}
            evaluation={rawEvaluationRef.current}
            companyId={sellerData?.company_id ?? null}
            sellerId={sellerData?.id ?? null}
            onLeaveWithoutEval={() => navigate({ to: "/mapa" })}
            onContinue={async (stars) => {
              setSaving(true);

              const existingProgress = await restGetMaybeSingle<{ id: string; stars: number | null; status: string | null }>(
                `node_progress?select=id,stars,status&seller_id=eq.${sellerData.id}&node_id=eq.${encodeURIComponent(nodeId)}&limit=1`,
              );

              const previousStars = (existingProgress?.stars as number | null) ?? 0;
              const bestStars = Math.max(previousStars, stars);
              // Umbral de progresión: se necesitan 2 estrellas (score ≥ 70)
              // para dar el nodo por dominado y abrir el siguiente. Con 1
              // estrella el nodo queda en curso y se puede repetir.
              // Lo ganado no se pierde: un nodo ya terminado nunca vuelve a "en
              // curso". (Sept-2026: al subir el umbral de 1 a 2 estrellas, repetir
              // un nodo de 1 estrella lo bajaba y volvía a cerrar el siguiente.)
              const unlocks = bestStars >= 2 || existingProgress?.status === "done";
              const progressStatus = unlocks ? "done" : "current";

              if (existingProgress?.id) {
                await restMutate(`node_progress?id=eq.${existingProgress.id}`, {
                  method: "PATCH",
                  body: {
                    status: progressStatus,
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
                  status: progressStatus,
                  stars: bestStars,
                  last_practiced_at: new Date().toISOString(),
                  },
                });
              }

              // Certificación Closer: pasar el examen final (7.4) con score >= 85 sella la certificación.
              // Un pase menor completa el nodo pero no certifica (se puede repetir).
              // Nov-2026 (mensaje 144): decía "9.3", un id del mapa viejo que ya no existe, y nadie se certificaba.
              const finalScore = feedbackResult?.score ?? 0;
              if (nodeId === NODO_CERTIFICACION && finalScore >= 85 && !sellerData.certified_at) {
                await restMutate(`sellers?id=eq.${sellerData.id}`, {
                  method: "PATCH",
                  body: { certified_at: new Date().toISOString() },
                });
              }

              const currentNodeRow = unlocks
                ? await restGetMaybeSingle<{ world_id: number; order_index: number }>(
                    `nodes?select=world_id,order_index&id=eq.${encodeURIComponent(nodeId)}&limit=1`,
                  )
                : null;

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
                // 151-C: el camino al siguiente nodo solo se ilumina si esta práctica lo desbloqueó.
                desbloqueoAhora: unlocks && existingProgress?.status !== "done",
              });
              navigate({ to: "/mapa" });
            }}
          />
        )}
      </AnimatePresence>
      </div>

      {closingGate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 900,
            background: "rgb(var(--c-bg-rgb) / 0.94)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            gap: 24,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 560,
              background: "var(--c-surface)",
              border: "1px solid rgb(var(--c-primary-rgb) / 0.35)",
              borderRadius: 14,
              padding: "1.5rem",
              fontFamily: "'DM Sans', sans-serif",
              color: "var(--c-text)",
              fontSize: "1rem",
              lineHeight: 1.6,
            }}
          >
            {closingGate}
          </div>
          <button
            type="button"
            onClick={() => closingGateResolveRef.current?.()}
            style={{
              background: "var(--c-primary)",
              border: "none",
              color: "#FFFFFF",
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              padding: "14px 26px",
              borderRadius: 99,
              cursor: "pointer",
            }}
          >
            Ver mi análisis →
          </button>
        </div>
      )}

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
  nodeId,
  infoMapa,
  onRetry,
  onListo,
  onExit,
  inputMode,
  onToggleMode,
}: {
  micGranted: boolean;
  nodeData: any;
  nodeId: string;
  infoMapa: { nombre_corto: string | null; minutos_estimados: number | null } | null;
  onRetry: () => void;
  onListo: () => void;
  onExit: () => void;
  inputMode: "voice" | "text";
  onToggleMode?: () => void;
}) {
  // Fase 4 (mensaje 151): el nodo grande, tu misión arriba, los pasos en una fila, y lo del micrófono
  // en un solo renglón (antes eran tres tarjetas que ocupaban media pantalla).
  const isText = inputMode === "text";
  const canStart = isText || micGranted;
  const hasIDo = !!nodeData?.practice_script?.phases?.i_do;
  const titulo = infoMapa?.nombre_corto || nodeData?.name || "";
  const minutos = infoMapa?.minutos_estimados;
  const mision = typeof nodeData?.field_mission === "string" && nodeData.field_mission.trim() ? nodeData.field_mission : null;
  const etiqueta = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" } as const;
  const pasos: { arriba: string; abajo: string }[] = [
    ...(hasIDo ? [{ arriba: "Paso 1", abajo: "Closer demuestra" }, { arriba: "Paso 2", abajo: "Tú con el cliente" }] : [{ arriba: "Sin demostración", abajo: "Tú y el cliente" }]),
    ...(minutos ? [{ arriba: "Toma", abajo: `${minutos} minutos` }] : []),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "max(12px, env(safe-area-inset-top)) var(--m-pantalla) 0" }}
    >
      <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ marginLeft: -10 }}>
          <BotonIcono onClick={onExit} etiqueta="Salir"><IconoCerrar /></BotonIcono>
        </div>
        {onToggleMode && <SelectorModo modo={inputMode} onCambiar={onToggleMode} />}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", maxWidth: 560, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", paddingTop: 16, paddingBottom: 16 }}>
        <div style={{ ...etiqueta, letterSpacing: "0.08em", fontSize: 13, color: "var(--c-text-2)" }}>Práctica · {nodeId}</div>
        <h1 style={{ margin: "8px 0 0", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 30, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--c-text)" }}>{titulo}</h1>
        {nodeData?.description && (
          <p style={{ margin: "10px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.5, color: "var(--c-text-soft)" }}>{nodeData.description}</p>
        )}

        {mision && (
          <div style={{ marginTop: 24, padding: 18, borderRadius: "var(--r-tarjeta)", background: "rgb(var(--c-primary-rgb) / 0.07)", border: "1px solid rgb(var(--c-primary-rgb) / 0.35)" }}>
            <div style={{ ...etiqueta, color: "var(--c-primary)" }}>Tu misión</div>
            <p style={{ margin: "8px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.5, color: "var(--c-text)", whiteSpace: "pre-wrap" }}>{mision}</p>
          </div>
        )}

        {nodeData && (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: `repeat(${pasos.length}, minmax(0, 1fr))`, gap: 8 }}>
            {pasos.map((p) => (
              <div key={p.arriba + p.abajo} style={{ padding: "14px 12px", borderRadius: 16, background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--c-text-2)" }}>{p.arriba}</div>
                <div style={{ marginTop: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, lineHeight: 1.3, color: "var(--c-text)" }}>{p.abajo}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, maxWidth: 560, width: "100%", margin: "0 auto", paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: "var(--c-surface)", marginBottom: 14 }}>
          {isText ? (
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-text-soft)" }}>Escribes tus turnos con calma. Enter para enviar.</span>
          ) : micGranted ? (
            <>
              <span aria-hidden style={{ width: 22, height: 22, flex: "none", borderRadius: 11, background: "var(--c-success)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--c-bg)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-text-soft)" }}>Micrófono listo · Sube el volumen · Busca silencio</span>
            </>
          ) : (
            <>
              <span aria-hidden style={{ width: 22, height: 22, flex: "none", borderRadius: 11, background: "var(--c-primary)", color: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>!</span>
              <span style={{ flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-text-soft)" }}>Permite el micrófono para practicar</span>
              <button type="button" onClick={onRetry} style={{ ...estiloBoton("texto"), height: 32, padding: "0 4px", color: "var(--c-primary)", fontSize: 14 }}>Reintentar</button>
            </>
          )}
        </div>
        <button type="button" onClick={onListo} disabled={!canStart} style={estiloBoton("principal", !canStart)}>
          {hasIDo ? "Ver la demostración" : "Estoy listo"}
        </button>
      </div>
    </motion.div>
  );
}

// ───────────────────────── VOICE ─────────────────────────

function VoicePhase({
  fichaCliente = null,
  cliente = null,
  nombreNodo = "",
  closerMsgs,
  nivelVoz = 0,
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
  onListoDemo,
}: {
  /** La tarjeta "Tu cliente": se muestra al empezar el turno del vendedor y desaparece cuando habla. */
  fichaCliente?: FichaVisible | null;
  /** El cliente de esta práctica: va al centro de la pantalla (Fase 4). */
  cliente?: FichaVisible | null;
  /** El nombre claro del nodo (el del mapa), para el encabezado. */
  nombreNodo?: string;
  /** Nivel de la voz del vendedor (0 a 1) mientras habla: mueve las barritas. */
  nivelVoz?: number;
  closerMsgs: Set<string>;
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
  onToggleMode?: () => void;
  transcript: { role: string; content: string }[];
  onTextSubmit: (txt: string) => void;
  onPlayAgentAudio: (txt: string) => void;
  /** Al terminar la demostración: pasar al turno del vendedor. */
  onListoDemo?: () => void;
}) {
  const isIDo = currentPhase === "i_do";

  const isText = inputMode === "text";

  const micDisabled = isAgentSpeaking;
  // Mensaje 123: le toca hablar al vendedor (nadie habla, nada se procesa, sin error).
  const teTocaHablar = !isUserListening && !isAgentSpeaking && !isProcessing && !connectionError;
  // La franja de lo que se dice (Fase 4): lo último que se dijo, o lo que vas diciendo mientras grabas.
  const ultimo = [...transcript].reverse().find((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim());
  const ultimoEsCliente = !!ultimo && ultimo.role === "assistant" && !isIDo && etiquetaAsistente(ultimo.content, closerMsgs) === "Cliente";
  const nombreCliente = cliente ? nombreVisible(cliente) : "Tu cliente";
  const franja: { quien: string; color: string; texto: string } | null = isUserListening && interimTranscript
    ? { quien: isIDo ? "Tú, como cliente" : "Tú", color: "var(--c-primary)", texto: interimTranscript }
    : ultimo
      ? ultimo.role === "user"
        ? { quien: isIDo ? "Tú, como cliente" : "Tú", color: "var(--c-primary)", texto: ultimo.content }
        : isIDo
          ? { quien: "Closer", color: "var(--c-primary)", texto: ultimo.content }
          : ultimoEsCliente
            ? { quien: nombreCliente, color: "var(--c-client)", texto: ultimo.content }
            : { quien: "Closer", color: "var(--c-primary)", texto: ultimo.content }
      : null;

  // Mensaje 154: la primera práctica con voz, tres pistas bajo el micrófono en lugar de la pantalla de
  // tutorial: saluda, habla con calma, escucha. Al volver a tocarte, se van para siempre.
  // 0: aún no grabas · 1: grabando · 2: el cliente responde · 3: ya no hay pistas.
  const [pasoGuia, setPasoGuia] = useState<0 | 1 | 2 | 3>(() => {
    try { return window.localStorage.getItem("closer_voice_tutorial_seen") === "true" ? 3 : 0; } catch { return 3; }
  });
  const guiaActiva = pasoGuia < 3 && !isIDo && !isText && !connectionError;
  // Si esta práctica empezó con pistas, el lugar bajo el micrófono conserva su alto al irse: nada brinca.
  const [conPistas] = useState(pasoGuia < 3 && !isIDo);
  const clienteYaHablo = useRef(false);
  useEffect(() => {
    if (!guiaActiva) return;
    if (pasoGuia === 0 && isUserListening) setPasoGuia(1);
    else if (pasoGuia === 1 && !isUserListening) { clienteYaHablo.current = false; setPasoGuia(2); }
    else if (pasoGuia === 2 && isAgentSpeaking) clienteYaHablo.current = true;
    else if (pasoGuia === 2 && teTocaHablar) {
      if (clienteYaHablo.current) {
        setPasoGuia(3);
        try { window.localStorage.setItem("closer_voice_tutorial_seen", "true"); } catch {}
        return;
      }
      // Entre enviar y que el cliente empiece a pensar hay un instante en que «te toca». Si sigue
      // tocándote después de eso (no se oyó nada que enviar), la pista vuelve a «Toca y saluda».
      const t = setTimeout(() => setPasoGuia(0), 1500);
      return () => clearTimeout(t);
    }
  }, [guiaActiva, pasoGuia, isUserListening, isAgentSpeaking, teTocaHablar]);
  const pista = !guiaActiva
    ? null
    : pasoGuia === 0
      ? `Toca y saluda a ${cliente?.tipo === "recurrente" ? cliente.nombre : "tu cliente"} como si llegaras a visitarlo.`
      : pasoGuia === 1
        ? "Habla con calma. Cuando termines, toca otra vez para enviar."
        : "Escúchalo. Cuando termine, te toca a ti.";

  const micLabel = isUserListening
    ? "Toca para enviar. Puedes pausar y seguir."
    : isAgentSpeaking
      ? isIDo ? "Closer está demostrando" : ultimoEsCliente ? "Escucha a tu cliente" : "Closer está hablando"
      : isProcessing
        ? `${nombreCliente} está pensando…`
        : isIDo
          ? "Toca para responder como cliente"
          : "Te toca. Toca para hablar";


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
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "1.2rem" }}
    >
      <style>{ESTILOS_PRACTICA}</style>

      {fichaCliente && (
        <div style={{ border: "1px solid rgb(var(--c-primary-rgb) / 0.35)", background: "rgb(var(--c-primary-rgb) / 0.07)", borderRadius: 14, padding: "12px 14px", marginBottom: 12 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--c-primary)", marginBottom: 4 }}>Tu cliente</div>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 16, color: "var(--c-text)" }}>{nombreVisible(fichaCliente)} · {fichaCliente.negocio}</div>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "rgb(var(--c-text-rgb) / 0.8)", marginTop: 2 }}>{lineaDelCliente(fichaCliente)}</div>
          {contextoDelCliente(fichaCliente).map((t) => (
            <div key={t} style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "rgb(var(--c-text-rgb) / 0.8)", marginTop: 2 }}>• {t}</div>
          ))}
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "var(--c-text)", marginTop: 8, fontWeight: 600 }}>{LLAMADO_A_LA_ACCION}</div>
        </div>
      )}
      {/* Fase 4: salir, el nodo al centro y el cambio a texto. Sin contador de turnos ni letrero de fase. */}
      <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", gap: 8, maxWidth: 560, width: "100%", margin: "0 auto" }}>
        <BotonIcono onClick={onExitClick} etiqueta="Salir"><IconoCerrar /></BotonIcono>
        <div style={{ textAlign: "center", minWidth: 0 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "var(--c-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombreNodo}</div>
          {isIDo && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--c-text-2)", marginTop: 2 }}>Demostración</div>}
        </div>
        {onToggleMode ? (
          <BotonIcono onClick={onToggleMode} etiqueta={isText ? "Cambiar a voz" : "Cambiar a texto"} color="var(--c-text-2)">
            {isText ? <IconoMicrofono tam={22} /> : <IconoTeclado />}
          </BotonIcono>
        ) : <span />}
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
                      {isIDo ? (isAgent ? "Closer (demo)" : "Tú (cliente)") : (isAgent ? etiquetaAsistente(m.content, closerMsgs) : "Tú")}
                    </div>
                    {isAgent && (
                      <button
                        onClick={() => onPlayAgentAudio(m.content)}
                        aria-label="Escuchar"
                        title="Escuchar"
                        style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12, padding: 0 }}
                      ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" /><path d="M16 9a4 4 0 0 1 0 6" /></svg></button>
                    )}
                  </div>
                  <div
                    style={{
                      maxWidth: "85%", padding: "10px 14px", borderRadius: 14,
                      background: isAgent ? "rgb(var(--c-primary-rgb) / 0.12)" : "rgba(255,255,255,0.08)",
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
                  style={{ background: ORANGE, color: "var(--c-bg)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 14, border: "none", borderRadius: 99, padding: "8px 20px", cursor: "pointer" }}
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
                  color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.4,
                  outline: "none",
                }}
              />
              <button
                onClick={submitText}
                disabled={textDisabled || !textDraft.trim()}
                aria-label="Enviar"
                style={{
                  width: 48, height: 48, borderRadius: 99, border: "none",
                  background: ORANGE, color: "var(--c-bg)",
                  cursor: textDisabled || !textDraft.trim() ? "not-allowed" : "pointer",
                  opacity: textDisabled || !textDraft.trim() ? 0.4 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 10px 30px -8px rgb(var(--c-primary-rgb) / 0.45)",
                }}
              ><IconoEnviar /></button>
            </div>
            <button
              onClick={onReplay}
              style={{ marginTop: 10, background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer", padding: 4 }}
            >Reiniciar práctica</button>
          </div>
          )}

        </>
      ) : (
        // ───────── Modo VOZ (Fase 4, mensaje 151) ─────────
        <>
          <div style={{ flex: 1, minHeight: 0, maxWidth: 560, width: "100%", margin: "0 auto", padding: "min(28px, 3dvh) 0 min(16px, 2dvh)", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {isIDo || !cliente ? (
              <EscenarioCloser hablando={isAgentSpeaking} rol={isIDo ? (iDoPassive ? "Demuestra como vendedor" : "Hace de vendedor; tú, de cliente") : "Tu coach"} />
            ) : (
              <EscenarioCliente
                nombre={nombreVisible(cliente)}
                sinNombre={cliente.tipo === "nuevo"}
                detalle={`${cliente.negocio} · ${cliente.tipo === "nuevo" ? "primera visita" : "cliente recurrente"}`}
                hablando={isAgentSpeaking && ultimoEsCliente}
                atenuado={isUserListening}
                pensando={isProcessing && !isAgentSpeaking}
                estado={
                  connectionError ? null
                  : isAgentSpeaking ? (ultimoEsCliente ? "Te está hablando" : "Closer te habla")
                  : isUserListening ? "Te escucha"
                  : isProcessing ? "Pensando"
                  : "Espera tu respuesta"
                }
              />
            )}
          </div>

          <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
            {connectionError ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "8px 0" }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", color: "var(--c-danger)", fontSize: 15, textAlign: "center", margin: 0 }}>{connectionError}</p>
                <button type="button" onClick={onRetry} style={{ ...estiloBoton("principal"), width: "auto", padding: "0 28px" }}>Reintentar</button>
              </div>
            ) : isAgentSpeaking ? (
              <FranjaVozAgente
                quien={isIDo || !cliente || etiquetaAsistente(vozDelAgente.leer().texto, closerMsgs) === "Closer" ? "Closer" : nombreCliente}
                colorQuien={isIDo || !cliente || etiquetaAsistente(vozDelAgente.leer().texto, closerMsgs) === "Closer" ? "var(--c-primary)" : "var(--c-client)"}
              />
            ) : franja ? (
              <FranjaDialogo quien={franja.quien} colorQuien={franja.color} texto={franja.texto} />
            ) : (
              <div style={{ height: 104, flexShrink: 0 }} />
            )}
          </div>

          <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", paddingTop: "min(30px, 3.2dvh)", paddingBottom: "calc(8px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", alignItems: "center", gap: "min(12px, 1.4dvh)" }}>
            {/* 151-C: el lugar del micrófono siempre ocupa lo mismo (96 px), con o sin micrófono, para que la
                franja no se mueva cuando termina la demostración y aparece «Listo, ahora yo». */}
            {isIDo && (iDoDemoDone || iDoPassive) ? (
              <>
                <div style={{ height: 96, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {iDoDemoDone && onListoDemo && (
                    <button type="button" onClick={onListoDemo} style={estiloBoton("principal")}>Listo, ahora yo</button>
                  )}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-text-2)", textAlign: "center", minHeight: 20 }}>
                  {iDoDemoDone ? "Ahora te toca a ti con el cliente." : "Escucha cómo lo hace Closer."}
                </div>
              </>
            ) : (
              <>
                <BotonMicrofono
                  estado={isUserListening ? "grabando" : teTocaHablar ? "te_toca" : "apagado"}
                  nivelVoz={nivelVoz}
                  etiqueta={micLabel}
                  onClick={onMicClick}
                />
                {pista ? (
                  <PistaPrimeraVez texto={pista} />
                ) : (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "var(--c-text-2)", textAlign: "center", minHeight: conPistas ? ALTO_PISTA : 20, boxSizing: "border-box", paddingTop: conPistas ? 16 : 0 }}>
                    {isIDo && !isUserListening && !isAgentSpeaking ? "Reacciona como cliente o toca «Listo, ahora yo»" : micLabel}
                  </div>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onReplay}
              disabled={isIDo && iDoDemoDone}
              style={{ ...estiloBoton("texto"), height: 36, color: "var(--c-disabled-text)", fontSize: 14, visibility: isIDo && iDoDemoDone ? "hidden" : "visible" }}
            >Reiniciar práctica</button>
          </div>
        </>
      )}
    </motion.div>
  );
}


// ───────────────────────── CONSENTIMIENTO ─────────────────────────
// Mensaje 125: una sola pantalla, un solo botón. Se muestra solo a quien no
// tiene guardado que acepta la grabación, y no se vuelve a pedir.

function ConsentimientoGrabacion({
  guardando,
  error,
  onAceptar,
  onSalir,
}: {
  guardando: boolean;
  error: string | null;
  onAceptar: () => void;
  onSalir: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem", textAlign: "center", gap: 16 }}
    >
      <CloserCharacter size={96} state="normal" />
      <h2 style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 22, margin: 0, color: "var(--c-text)" }}>Antes de practicar</h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.5, color: "rgb(var(--c-text-rgb) / 0.8)", maxWidth: 380, margin: 0 }}>
        Closer funciona con tu voz. Para practicar, tus prácticas se graban: así recibes tu calificación y tu manager te puede dar mejor coaching.
      </p>
      {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: RED, margin: 0 }}>{error}</p>}
      <button
        onClick={onAceptar}
        disabled={guardando}
        style={{ background: ORANGE, color: "var(--c-bg)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 99, padding: "14px 28px", cursor: guardando ? "wait" : "pointer", opacity: guardando ? 0.6 : 1, boxShadow: "0 10px 30px -8px rgb(var(--c-primary-rgb) / 0.45)" }}
      >
        {guardando ? "Guardando…" : "Acepto que se graben mis prácticas"}
      </button>
      <button
        onClick={onSalir}
        style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer", padding: 4 }}
      >
        Regresar al mapa
      </button>
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
        minHeight: 0,
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
          style={estiloBoton("principal")}
        >
          Ahora yo soy el vendedor
        </button>
      </div>
    </motion.div>
  );
}

// ───────────────────────── FEEDBACK ─────────────────────────

/**
 * Lo que dice la pantalla mientras se califica: los criterios REALES de este
 * nodo, uno por uno, y al final la revisión del auditor. Nunca nombra algo que
 * este nodo no mide ("analizando tu presentación" en un nodo de introducción).
 * No da vueltas: se queda en el último hasta que llega el resultado.
 */
export function mensajesDeAnalisis(practiceScript: any, nombres: Record<string, string>): string[] {
  const out: string[] = ["Leyendo tu conversación…"];
  for (const c of Array.isArray(practiceScript?.success_criteria) ? practiceScript.success_criteria : []) {
    if (c?.requires_audio) continue;
    const nombre = nombres[String(c?.regla_id ?? "")];
    if (nombre) out.push(`Revisando: ${nombre}…`);
  }
  out.push("Calculando tu calificación…", "Revisando tus consejos contra la doctrina…");
  return out;
}

type FeedbackStep = "analyzing" | "result" | "victory" | "eval_error" | "transcript_only";

function FallaCard({ falla }: { falla: FallaItem }) {
  const texto = { fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.5, margin: 0 } as const;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {falla.paso && <EtiquetaPaso paso={falla.paso} />}
      <p style={{ ...texto, fontSize: 16, color: "var(--c-text)", fontWeight: 600, lineHeight: 1.4 }}>{falla.error}</p>
      {falla.cita && <p style={{ ...texto, color: "var(--c-text-soft)" }}>Dijiste: «{falla.cita}»</p>}
      <p style={{ ...texto, fontSize: 14, color: "var(--c-danger)", fontWeight: 600 }}>{falla.efecto}</p>
      {falla.mejora && <p style={{ ...texto, color: "var(--c-primary)", fontWeight: 600 }}>{falla.mejora}</p>}
      {falla.ejemplo && <p style={{ ...texto, color: "var(--c-text-soft)", fontStyle: "italic" }}>«{falla.ejemplo}»</p>}
    </div>
  );
}

// En qué paso de la visita está lo que se marca (oct-2026): en un boss se
// califican habilidades de varios pasos y así el vendedor se ubica.
function EtiquetaPaso({ paso, habilidad }: { paso: string; habilidad?: string }) {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--c-text-2)" }}>
      {habilidad ? `${paso} · ${habilidad}` : paso}
    </div>
  );
}

function ObservationCard({ obs }: { obs: ObservationItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: "1px solid var(--c-elevated)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{ width: "100%", background: "transparent", border: "none", padding: "12px 18px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left", color: "inherit" }}
      >
        <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.4, color: "var(--c-text)" }}>
          {obs.paso && <EtiquetaPaso paso={obs.paso} habilidad={obs.habilidad} />}
          {obs.error}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--c-text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ flex: "none", transition: "transform 200ms ease", transform: open ? "rotate(90deg)" : "none" }}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: "0 18px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.5, color: "var(--c-primary)", fontWeight: 600 }}>{obs.mejora}</p>
          {obs.ejemplo && <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.5, color: "var(--c-text-soft)", fontStyle: "italic" }}>«{obs.ejemplo}»</p>}
        </div>
      )}
    </div>
  );
}

/**
 * «Consejo para lo que viene» (antes «Lo que viene después»): coaching fuera del alcance del nodo, que no cuenta
 * en la calificación. Dos puntos a la vista; el resto, con su ejemplo y su porqué, detrás de «Ver más».
 */
function ConsejosParaLoQueViene({ consejos }: { consejos: { observacion?: string; ejemplo?: string; por_que?: string }[] }) {
  const [todos, setTodos] = useState(false);
  const visibles = todos ? consejos : consejos.slice(0, 2);
  return (
    <div style={{ width: "100%", boxSizing: "border-box", padding: 18, borderRadius: "var(--r-tarjeta)", background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--c-client)" }}>Consejo para lo que viene</div>
      <div style={{ marginTop: 4, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--c-text-2)" }}>No cuenta en tu calificación.</div>
      {visibles.map((x, i) => (
        <div key={i} style={{ marginTop: 12, display: "flex", gap: 10 }}>
          <span aria-hidden style={{ width: 6, height: 6, flex: "none", marginTop: 9, borderRadius: 3, background: "var(--c-client)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.5, color: "var(--c-text)" }}>{x.observacion}</span>
            {todos && x.ejemplo ? <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.5, color: "var(--c-text-soft)", fontStyle: "italic" }}>«{x.ejemplo}»</span> : null}
            {todos && x.por_que ? <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.5, color: "var(--c-text-2)" }}>{x.por_que}</span> : null}
          </div>
        </div>
      ))}
      {!todos && (consejos.length > 2 || consejos.some((x) => x.ejemplo || x.por_que)) && (
        <button type="button" onClick={() => setTodos(true)} style={{ ...estiloBoton("texto"), height: 36, padding: 0, marginTop: 10, color: "var(--c-client)", fontSize: 15 }}>Ver más</button>
      )}
    </div>
  );
}


function ReplicaChat({
  worldId,
  nodeId,
  sessionId,
  practiceScript,
  evaluation,
  conversation,
  companyId,
  sellerId,
}: {
  worldId: number;
  nodeId: string;
  sessionId: string;
  practiceScript: any;
  evaluation: any;
  conversation: { role: string; content: string }[];
  companyId?: string | null;
  sellerId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userTurns = thread.filter((m) => m.role === "user").length;
  const limitReached = userTurns >= 3;

  if (worldId === 9) return null;

  async function send() {
    const msg = draft.trim();
    if (!msg || sending || limitReached) return;
    setSending(true);
    setError(null);
    const priorThread = thread;
    const nextThreadOptimistic = [...priorThread, { role: "user" as const, content: msg }];
    setThread(nextThreadOptimistic);
    setDraft("");
    try {
      const accessToken = await llaveUsuario();
      // Un tropiezo pasajero no debe obligar al vendedor a reescribir su
      // desacuerdo: se reintenta solo, una vez.
      const pedir = () => fetchFuncion(`${SUPABASE_URL}/functions/v1/closer-voice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          phase: "replica",
          node_id: nodeId,
          practice_script: practiceScript,
          original_evaluation: evaluation,
          conversation_history: conversation,
          replica_thread: priorThread,
          user_message: msg,
          session_id: sessionId,
          company_id: companyId ?? null,
          seller_id: sellerId ?? null,
        }),
      });
      let res = await pedir();
      if (!res.ok && res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1200));
        res = await pedir();
      }
      const raw = await res.text();
      if (!res.ok) throw new Error(`replica HTTP ${res.status}: ${raw.slice(0, 200)}`);
      const parsed = JSON.parse(raw) as { message?: string };
      const reply = typeof parsed.message === "string" ? parsed.message : "";
      if (!reply) throw new Error("respuesta vacía");
      setThread([...nextThreadOptimistic, { role: "assistant", content: reply }]);

      // Persist exchange as seller_event
      try {
        const form = new FormData();
        form.append(
          "meta",
          JSON.stringify({
            event_type: "evaluation_replica",
            node_id: nodeId,
            session_id: sessionId,
            payload: {
              session_id: sessionId,
              node_id: nodeId,
              turn_number: userTurns + 1,
              user_message: msg,
              closer_response: reply,
              original_score: evaluation?.score ?? null,
            },
          }),
        );
        await fetch(`${SUPABASE_URL}/functions/v1/save-practice-event`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON,
            Authorization: `Bearer ${accessToken || (await llaveUsuario())}`,
          },
          body: form,
        });
      } catch (e) {
        console.error("[replica] save-practice-event failed:", e);
      }
    } catch (e: any) {
      console.error("[replica] failed:", e);
      setThread(priorThread);
      setDraft(msg);
      setError("No pude responder ahora. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%",
          padding: "10px 14px",
          marginTop: 4,
          borderRadius: 99,
          border: "1px solid rgba(255,255,255,0.15)",
          background: "transparent",
          color: "rgba(255,255,255,0.7)",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          cursor: "pointer",
        }}
      >
        No estoy de acuerdo con mi evaluación
      </button>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        marginTop: 4,
        padding: 14,
        borderRadius: 14,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          fontFamily: "Syne, sans-serif",
          fontWeight: 700,
          fontSize: 13,
          color: "#fff",
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        Tu réplica
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {thread.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "88%",
              padding: "10px 12px",
              borderRadius: 12,
              background:
                m.role === "user" ? "rgb(var(--c-primary-rgb) / 0.18)" : "rgba(255,255,255,0.06)",
              color: "#fff",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              lineHeight: 1.45,
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div
            style={{
              alignSelf: "flex-start",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              fontStyle: "italic",
            }}
          >
            Closer está respondiendo…
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "rgb(var(--c-danger-rgb) / 0.9)",
          }}
        >
          {error}
        </div>
      )}

      {limitReached ? (
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.65)",
            fontStyle: "italic",
          }}
        >
          Tu comentario quedó registrado — el equipo revisa estos casos para mejorar el entrenamiento.
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          style={{ display: "flex", gap: 8 }}
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              userTurns === 0
                ? "Explica por qué no estás de acuerdo…"
                : `Mensaje ${userTurns + 1} de 3`
            }
            disabled={sending}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 99,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(0,0,0,0.3)",
              padding: "0 14px",
              color: "#fff",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 99,
              border: "none",
              background: ORANGE,
              color: "var(--c-bg)",
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 13,
              cursor: draft.trim() && !sending ? "pointer" : "not-allowed",
              opacity: draft.trim() && !sending ? 1 : 0.5,
            }}
          >
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}

function FeedbackPhase({
  nombresCriterio,
  closerMsgs,
  onContinue,
  onLeaveWithoutEval,
  conversation,
  feedback,
  worldId,
  nodeId,
  yaLoHabiaPasado = false,
  nombreCliente = null,
  esReto = false,
  sessionId,
  practiceScript,
  evaluation,
  companyId,
  sellerId,
  evalError,
  onRetryEvaluation,
}: {
  nombresCriterio?: Record<string, string>;
  closerMsgs: Set<string>;
  onContinue: (stars: 0 | 1 | 2 | 3) => void;
  /** Salir sin evaluación: no guarda estrellas, solo devuelve al mapa. */
  onLeaveWithoutEval: () => void;
  conversation: { role: string; content: string }[];
  feedback: FeedbackResult | null;
  worldId: number;
  nodeId: string;
  /** Ya estaba pasado antes de esta práctica: la frase de las estrellas no dice «desbloqueaste». */
  yaLoHabiaPasado?: boolean;
  /** El nombre del cliente de esta práctica, para la conversación que se relee mientras se califica. */
  nombreCliente?: string | null;
  /** Es un reto final: lo que desbloquea es el siguiente mundo. */
  esReto?: boolean;
  sessionId: string;
  practiceScript: any;
  evaluation: any;
  companyId?: string | null;
  sellerId?: string | null;
  evalError?: string | null;
  onRetryEvaluation?: () => void;
}) {
  const [step, setStep] = useState<FeedbackStep>("analyzing");
  const [msgIdx, setMsgIdx] = useState(0);
  const mensajes = mensajesDeAnalisis(practiceScript, nombresCriterio ?? {});
  const [slowNotice, setSlowNotice] = useState(false);

  useEffect(() => {
    if (feedback !== null) {
      setStep("result");
    }
  }, [feedback]);

  // Salida por error: si el evaluador falla o se pasa del timeout.
  useEffect(() => {
    if (evalError) setStep("eval_error");
  }, [evalError]);

  // Reintento: volvemos a la animación.
  useEffect(() => {
    if (!evalError && feedback === null && step === "eval_error") setStep("analyzing");
  }, [evalError, feedback, step]);

  // A los 25 s, aviso honesto: un análisis completo puede tardar más de un minuto.
  useEffect(() => {
    if (step !== "analyzing") {
      setSlowNotice(false);
      return;
    }
    setSlowNotice(false);
    const t = setTimeout(() => setSlowNotice(true), 25_000);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (step !== "analyzing") return;
    const i = setInterval(() => {
      setMsgIdx((p) => Math.min(p + 1, mensajes.length - 1));
    }, 2000);
    return () => clearInterval(i);
  }, [step]);


  const score = feedback?.score ?? 0;
  const stars: 0 | 1 | 2 | 3 = feedback?.stars ?? 0;
  const observations = feedback?.observations ?? [];
  const fallas = feedback?.fallas ?? [];

  if (step === "victory") {
    // Sin estrella no hay festejo: una pantalla neutra, sin confeti. La
    // estrella que ya se tenía no se pierde (el guardado toma el máximo).
    if (stars === 0) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 24, color: "var(--c-text)", marginBottom: 10 }}>Esta vez no salió.</div>
          <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 15, color: "rgb(var(--c-text-rgb) / 0.7)", maxWidth: 360, lineHeight: 1.5, marginBottom: 24 }}>
            No ganaste estrella en este intento, y las que ya tenías se conservan. Repite el nodo cuando quieras.
          </div>
          <button onClick={() => onContinue(0)} style={{ background: "var(--c-primary)", color: "var(--c-bg)", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, border: "none", borderRadius: 99, padding: "14px 28px", cursor: "pointer" }}>Volver al mapa →</button>
        </motion.div>
      );
    }
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, minHeight: 0 }}>
        <VictoryScreen
          stars={stars}
          title={stars >= 2 ? "¡Práctica completada!" : "Práctica registrada."}
          subtitle={lineaDeEstrellas(stars, { yaLoHabiaPasado, esReto, esElUltimo: nodeId === NODO_CERTIFICACION })}
          buttonText="Volver al mapa"
          onContinue={() => onContinue(stars)}
        />
      </motion.div>
    );
  }

  if (step === "result") {
    // Fase 4 (mensaje 152): la calificación centrada en su anillo, las estrellas con brillo y lo que lograste;
    // luego lo que te bajó la nota, las observaciones, un consejo corto y tu misión. «Continuar» siempre a la mano.
    const consejos: any[] = Array.isArray((feedback as any)?.siguiente_nivel) ? (feedback as any).siguiente_nivel : [];
    const etiqueta = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" } as const;
    const tarjeta = { width: "100%", boxSizing: "border-box", padding: 18, borderRadius: "var(--r-tarjeta)", background: "var(--c-surface)", border: "1px solid var(--c-border)" } as const;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ flex: 1, minHeight: 0, position: "relative", display: "flex", flexDirection: "column" }}
      >
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "max(12px, env(safe-area-inset-top)) var(--m-pantalla) 120px" }}>
          <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: "var(--c-text)", padding: "10px 0" }}>Tu práctica</div>

            <AnilloCalificacion calificacion={score} />
            <div style={{ display: "flex", gap: 6, marginTop: 4 }} aria-label={`${stars} de 3 estrellas`}>
              {[0, 1, 2].map((k) => <Estrella key={k} ganada={k < stars} tam={26} />)}
            </div>
            <p style={{ margin: 0, textAlign: "center", fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.45, color: "var(--c-text-soft)", maxWidth: 340 }}>
              {lineaDeEstrellas(stars, { yaLoHabiaPasado, esReto, esElUltimo: nodeId === NODO_CERTIFICACION })}
            </p>

            {/* Lo que te bajó la nota: va primero. Disputa 3.10 (oct-2026): una
                falla crítica dejó la nota en 30 y la pantalla no la mencionaba. */}
            {fallas.length > 0 && (
              <div style={{ ...tarjeta, marginTop: 14, borderLeft: "3px solid var(--c-danger)", display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ ...etiqueta, color: "var(--c-danger)" }}>Lo que te bajó la nota</div>
                {fallas.map((f, i) => (
                  <FallaCard key={i} falla={f} />
                ))}
              </div>
            )}

            {/* Observaciones */}
            {(observations.length > 0 || fallas.length === 0) && (
              <div style={{ ...tarjeta, padding: 0, overflow: "hidden", marginTop: fallas.length > 0 ? 0 : 14 }}>
                <div style={{ ...etiqueta, color: "var(--c-text-2)", padding: "16px 18px 6px" }}>
                  {observations.length === 0 ? (score >= 85 ? "Ejecución limpia" : "Sesión incompleta") : "Observaciones"}
                </div>
                {observations.length === 0 ? (
                  // Cero observaciones NO es un fallo: es que ejecutó bien todos los
                  // criterios de este nodo. Antes esto se pintaba como error.
                  <p style={{ margin: 0, padding: "0 18px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.5, color: "var(--c-text-soft)" }}>
                    {score >= 85
                      ? "Cumpliste todo lo que este nodo mide. No hay nada que corregir aquí."
                      : "La práctica terminó antes de que se viera lo que este nodo mide. Vuelve a intentarlo: esta nota no refleja lo que sabes."}
                  </p>
                ) : (
                  observations.map((o, i) => <ObservationCard key={i} obs={o} />)
                )}
              </div>
            )}

            {consejos.length > 0 && <ConsejosParaLoQueViene consejos={consejos} />}

            {feedback?.mision && (
              <div style={{ ...tarjeta, background: "rgb(var(--c-primary-rgb) / 0.07)", border: "1px solid rgb(var(--c-primary-rgb) / 0.35)" }}>
                <div style={{ ...etiqueta, letterSpacing: "0.1em", color: "var(--c-primary)" }}>Tu misión en la calle</div>
                <p style={{ margin: "8px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.5, color: "var(--c-text)" }}>{feedback.mision}</p>
              </div>
            )}

            {feedback?.radarLines && feedback.radarLines.length > 0 && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6, padding: "4px 4px 0" }}>
                {feedback.radarLines.map((line, i) => (
                  <p key={i} style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.5, color: "var(--c-text-2)" }}>{line}</p>
                ))}
              </div>
            )}

            <ConversationTranscript conversation={conversation} closerMsgs={closerMsgs} />

            {worldId !== 9 && evaluation && (
              <ReplicaChat
                worldId={worldId}
                nodeId={nodeId}
                sessionId={sessionId}
                practiceScript={practiceScript}
                evaluation={evaluation}
                conversation={conversation}
                companyId={companyId}
                sellerId={sellerId}
              />
            )}
          </div>
        </div>

        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "16px var(--m-pantalla) calc(16px + env(safe-area-inset-bottom))", background: "linear-gradient(to bottom, rgb(var(--c-bg-rgb) / 0) 0%, var(--c-bg) 30%)" }}>
          <button type="button" onClick={() => setStep("victory")} style={{ ...estiloBoton("principal"), maxWidth: 560, margin: "0 auto" }}>
            Continuar
          </button>
        </div>
      </motion.div>
    );
  }

  if (step === "eval_error") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          padding: "1.2rem",
        }}
      >
        <CloserCharacter size={86} state="motivation" />
        <div
          style={{
            fontFamily: "Syne, sans-serif",
            fontWeight: 800,
            fontSize: 22,
            color: "#fff",
            textAlign: "center",
          }}
        >
          No pude cerrar tu análisis
        </div>
        <div
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.6)",
            textAlign: "center",
            maxWidth: 400,
            lineHeight: 1.5,
          }}
        >
          {evalError} {evalError?.startsWith("No pude guardar tu práctica")
            ? ""
            : "Tu práctica quedó guardada: al reintentar no pierdes nada."}
        </div>
        <button
          onClick={() => onRetryEvaluation?.()}
          style={{
            width: "100%",
            maxWidth: 400,
            height: 52,
            borderRadius: 99,
            border: "none",
            background: ORANGE,
            color: "var(--c-bg)",
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 10px 30px -8px rgb(var(--c-primary-rgb) / 0.45)",
          }}
        >
          Reintentar análisis
        </button>
        <button
          onClick={() => setStep("transcript_only")}
          style={{
            width: "100%",
            maxWidth: 400,
            height: 48,
            borderRadius: 99,
            border: "1px solid rgba(255,255,255,0.18)",
            background: "transparent",
            color: "#fff",
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Ver mi conversación
        </button>
      </motion.div>
    );
  }

  if (step === "transcript_only") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "1.2rem" }}
      >
        <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 20, color: "#fff" }}>
            Tu conversación
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
            Sin análisis todavía. Puedes reintentarlo cuando quieras — la práctica está guardada.
          </div>
          <ConversationTranscript conversation={conversation} closerMsgs={closerMsgs} />
          <button
            onClick={() => onRetryEvaluation?.()}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 99,
              border: "none",
              background: ORANGE,
              color: "var(--c-bg)",
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Reintentar análisis
          </button>
          {/* Salida SIEMPRE disponible. Antes, si el reintento también fallaba,
              el vendedor quedaba atrapado y tenía que cerrar la app. Ningún
              error debe dejar sin salida: la práctica ya está guardada. */}
          <button
            onClick={onLeaveWithoutEval}
            style={{
              width: "100%",
              height: 48,
              borderRadius: 99,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "transparent",
              color: "rgba(255,255,255,0.75)",
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            Volver al mapa
          </button>
        </div>
      </motion.div>
    );
  }

  // analyzing — Fase 4 (mensaje 152): lo que se está revisando, con palomita al terminar cada cosa,
  // y debajo tu conversación para releerla mientras esperas. El tiempo no cambia: deja de sentirse.
  const turnosConversacion = conversation
    .filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim())
    .map((m) => ({
      quien: m.role === "user" ? "Tú" : etiquetaAsistente(m.content, closerMsgs) === "Closer" ? "Closer" : (nombreCliente || "Tu cliente"),
      esTuyo: m.role === "user",
      texto: m.content,
    }));
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "max(12px, env(safe-area-inset-top)) var(--m-pantalla) 0" }}
    >
      <style>{ESTILOS_PRACTICA}</style>
      <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <h1 style={{ margin: "20px 0 0", fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-0.02em", color: "var(--c-text)" }}>Revisando tu práctica</h1>
        <p aria-live="polite" style={{ margin: "6px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.45, color: slowNotice ? "var(--c-text-soft)" : "var(--c-text-2)" }}>
          {slowNotice
            ? "Lo estoy revisando con calma: puede tardar un par de minutos. No cierres la app."
            : "Toma un minuto. Mientras, relee lo que dijiste."}
        </p>
        <div style={{ marginTop: 18 }}>
          <ListaRevision pasos={mensajes.map((m) => m.replace(/^Revisando: /, "").replace(/…$/, ""))} actual={Math.min(msgIdx, mensajes.length - 1)} />
        </div>
        {turnosConversacion.length > 0 && (
          <>
            <div style={{ marginTop: 22, fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--c-text-2)" }}>Tu conversación</div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", marginTop: 10, paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
              <DialogoCompleto turnos={turnosConversacion} />
            </div>
          </>
        )}
      </div>
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
          background: "var(--c-surface)",
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

/**
 * Etiqueta de un mensaje del asistente en el transcript.
 * El Actor habla como cliente; pero al cortar, Closer sale del personaje con el
 * mensaje de cierre del guion (phases.closing.message / message_incomplete),
 * que es determinista. Ese mensaje se firma como Closer, no como Cliente —
 * si no, parece que el cliente felicitó al vendedor por su técnica de ventas.
 */
function etiquetaAsistente(content: string, closerMsgs: Set<string>): "Closer" | "Cliente" {
  return closerMsgs.has((content ?? "").trim()) ? "Closer" : "Cliente";
}

function ConversationTranscript({
  conversation,
  closerMsgs = new Set<string>(),
}: {
  conversation: { role: string; content: string }[];
  closerMsgs?: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const items = conversation.filter(
    (m) => (m.role === "user" || m.role === "assistant") && m.content?.trim(),
  );
  if (items.length === 0) return null;

  return (
    <div style={{ width: "100%", textAlign: "left" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} style={estiloBoton("secundario")}>
        {open ? "Ocultar tu conversación" : "Ver tu conversación"}
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
                  {isAgent ? etiquetaAsistente(m.content, closerMsgs) : "Tú"}
                </div>
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "10px 14px",
                    borderRadius: 14,
                    background: isAgent
                      ? "rgb(var(--c-primary-rgb) / 0.12)"
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
