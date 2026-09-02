import { useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { pitchSectionChat } from "@/lib/pitch-chat.functions";
import { applySectionContent, logPitchFeedback, type PitchSection } from "@/lib/pitches";

type Msg = { role: "user" | "assistant"; content: string };

type Reply = {
  clasificacion: "estilo" | "hecho" | "doctrina";
  mensaje: string;
  propuesta: string | null;
  propuesta_label: string;
  propuesta_manager: string | null;
  acuerdo_pendiente: boolean;
};

const ETIQUETA: Record<Reply["clasificacion"], string> = {
  estilo: "es tu lenguaje",
  hecho: "es un hecho de tu negocio",
  doctrina: "aquí no coincidimos",
};

/**
 * Conversación sobre UNA sección. Closer nunca modifica el pitch por su cuenta:
 * propone el texto completo y el manager aplica con un botón. El tercer botón
 * ("Hacerlo como lo pedí") aparece solo después de 3 vueltas sin acuerdo — si
 * estuviera desde el primer turno, nadie leería el argumento.
 */
export function SectionChat({
  section,
  onApplied,
  onClose,
}: {
  section: PitchSection;
  onApplied: () => void;
  onClose: () => void;
}) {
  const ask = useServerFn(pitchSectionChat);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState<Reply | null>(null);
  const [applying, setApplying] = useState(false);
  const rounds = useRef(0);

  const desacuerdos = messages.filter((m) => m.role === "user").length;

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    setReply(null);
    try {
      const res: any = await ask({ data: { sectionId: section.id, messages: next } });
      if (!res?.ok) {
        toast.error(
          res?.error === "missing_api_key"
            ? "Falta configurar el modelo."
            : (res?.detail ?? "Closer no pudo responder."),
        );
        return;
      }
      rounds.current += 1;
      setReply(res as Reply);
      setMessages((prev) => [...prev, { role: "assistant", content: res.mensaje }]);
    } catch (e: any) {
      toast.error(e?.message ?? "Closer no pudo responder.");
    } finally {
      setSending(false);
    }
  }

  async function apply(content: string, forced: boolean) {
    setApplying(true);
    try {
      await applySectionContent(section.id, content, forced);
      await logPitchFeedback({
        pitch_id: section.pitch_id,
        section_id: section.id,
        manager_message: [...messages].reverse().find((m) => m.role === "user")?.content ?? null,
        closer_response: content,
        classification: forced ? "doctrina" : (reply?.clasificacion ?? null),
        outcome: forced ? "aplicado_por_el_equipo" : "aplicado",
      });
      toast.success(
        forced
          ? "Aplicado y marcado como decisión de tu equipo."
          : "Cambio aplicado a esta sección.",
      );
      onApplied();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "No se pudo aplicar el cambio.");
    } finally {
      setApplying(false);
    }
  }

  async function closeWithoutChange() {
    if (messages.length > 0) {
      try {
        await logPitchFeedback({
          pitch_id: section.pitch_id,
          section_id: section.id,
          manager_message: [...messages].reverse().find((m) => m.role === "user")?.content ?? null,
          closer_response: reply?.mensaje ?? null,
          classification: reply?.clasificacion ?? null,
          outcome: "sin_cambio",
        });
      } catch {
        /* la conversación ya quedó registrada turno por turno */
      }
    }
    onClose();
  }

  const mostrarForzar = desacuerdos >= 3 && reply?.clasificacion === "doctrina";

  return (
    <div className="mt-3 rounded-[10px] border border-white/10 bg-black/30 p-3">
      <div className="mb-2 text-[12px] text-white/50 font-['DM_Sans']">
        Dime qué le cambiarías a esta sección. Closer nunca la modifica solo: te muestra
        el texto y tú aplicas.
      </div>

      <div className="space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={[
              "whitespace-pre-wrap rounded-[10px] p-2.5 text-[13px] font-['DM_Sans']",
              m.role === "user"
                ? "bg-white/[0.06] text-white/85"
                : "bg-[#FF6B2B]/10 text-white/85",
            ].join(" ")}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="flex items-center gap-2 text-[12px] text-white/40 font-['DM_Sans']">
            <Loader2 className="h-3 w-3 animate-spin" /> Closer está pensando…
          </div>
        )}
      </div>

      {reply && (
        <div className="mt-2">
          <span className="rounded-[99px] bg-white/10 px-2 py-0.5 text-[10px] text-white/50 font-['DM_Sans']">
            {ETIQUETA[reply.clasificacion]}
          </span>
        </div>
      )}

      {reply?.propuesta && (
        <div className="mt-2 rounded-[10px] border border-[#FF6B2B]/30 bg-[#FF6B2B]/5 p-3">
          <div className="text-[11px] uppercase tracking-wide text-[#FF6B2B] font-['Syne'] font-bold">
            {reply.propuesta_label}
          </div>
          <p className="mt-1.5 whitespace-pre-wrap text-[13px] text-white/85 font-['DM_Sans']">
            {reply.propuesta}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => apply(reply.propuesta!, false)}
              disabled={applying}
              className="rounded-[99px] bg-[#FF6B2B] px-3.5 py-1.5 text-[12px] font-['Syne'] font-bold text-black disabled:opacity-50"
            >
              {applying
                ? "Aplicando…"
                : reply.clasificacion === "doctrina"
                  ? "Aplicar la alternativa"
                  : "Aplicar este cambio"}
            </button>
            <button
              onClick={() => setReply({ ...reply, propuesta: null })}
              className="rounded-[99px] border border-white/15 px-3.5 py-1.5 text-[12px] text-white/70 font-['DM_Sans']"
            >
              Seguir platicando
            </button>
            {mostrarForzar && reply.propuesta_manager && (
              <button
                onClick={() => apply(reply.propuesta_manager!, true)}
                disabled={applying}
                className="rounded-[99px] border border-red-400/40 px-3.5 py-1.5 text-[12px] text-red-200 font-['DM_Sans'] disabled:opacity-50"
              >
                Hacerlo como lo pedí
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Ej. quítale el descuento, o dilo con las palabras de mi gente"
          className="min-h-[44px] flex-1 resize-y rounded-[10px] border border-white/10 bg-black/40 p-2 text-[13px] text-white/90 font-['DM_Sans'] outline-none focus:border-[#FF6B2B]/50"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="rounded-[99px] bg-[#FF6B2B] p-2.5 text-black disabled:opacity-40"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={closeWithoutChange}
        className="mt-2 text-[12px] text-white/40 font-['DM_Sans'] hover:text-white/70"
      >
        Cerrar sin cambiar nada
      </button>
    </div>
  );
}
