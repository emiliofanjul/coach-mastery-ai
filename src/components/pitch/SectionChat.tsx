import { useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { pitchSectionChat } from "@/lib/pitch-chat.functions";
import { logPitchFeedback, type PitchSection } from "@/lib/pitches";
import { applyPitchSection } from "@/lib/pitch-audit.functions";

type Msg = { role: "user" | "assistant"; content: string };

type Reply = {
  clasificacion: "estilo" | "hecho" | "correccion" | "doctrina";
  mensaje: string;
  propuesta: string | null;
  propuesta_label: string;
  propuesta_manager: string | null;
  acuerdo_pendiente: boolean;
};

const ETIQUETA: Record = {
  estilo: "es tu lenguaje",
  hecho: "es un hecho de tu negocio",
  correccion: "tienes razón, el pitch estaba mal",
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
  const applyFn = useServerFn(applyPitchSection);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState(null);
  const [applying, setApplying] = useState(false);
  const [audit, setAudit] = useState;
    sin_respaldo: string[];
  }>(null);
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
      const res: any = await applyFn({
        data: { sectionId: section.id, content, editedByManager: forced },
      });
      if (!res?.ok) throw new Error("No se pudo aplicar el cambio.");
      const veredicto = res.audit ?? null;
      setAudit(veredicto);
      await logPitchFeedback({
        pitch_id: section.pitch_id,
        section_id: section.id,
        manager_message: [...messages].reverse().find((m) => m.role === "user")?.content ?? null,
        closer_response: content,
        classification: forced ? "doctrina" : (reply?.clasificacion ?? null),
        outcome: forced ? "aplicado_por_el_equipo" : "aplicado",
      });
      if (veredicto && veredicto.status !== "limpio") {
        toast.warning(
          veredicto.status === "falla"
            ? "Aplicado, pero la sección incumple un criterio grave."
            : "Aplicado, con observaciones.",
        );
        onApplied();
        return; // se queda abierto para que vea el veredicto
      }
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
    


      


        Dime qué le cambiarías a esta sección. Closer nunca la modifica solo: te muestra
        el texto y tú aplicas.
      


      


        {messages.map((m, i) => (
          


            {m.content}
          


        ))}
        {sending && (
          


             Closer está pensando…
          


        )}
      


      {reply && (
        


          
            {ETIQUETA[reply.clasificacion]}
          
        


      )}

      {reply?.propuesta && (
        


          


            {reply.propuesta_label}
          


          


            {reply.propuesta}
          


          


             apply(reply.propuesta!, false)}
              disabled={applying}
              className="rounded-[99px] bg-[#FF6B2B] px-3.5 py-1.5 text-[12px] font-['Syne'] font-bold text-black disabled:opacity-50"
            >
              {applying
                ? "Aplicando…"
                : reply.clasificacion === "doctrina"
                  ? "Aplicar la alternativa"
                  : "Aplicar este cambio"}
            
             setReply({ ...reply, propuesta: null })}
              className="rounded-[99px] border border-white/15 px-3.5 py-1.5 text-[12px] text-white/70 font-['DM_Sans']"
            >
              Seguir platicando
            
            {mostrarForzar && reply.propuesta_manager && (
               apply(reply.propuesta_manager!, true)}
                disabled={applying}
                className="rounded-[99px] border border-red-400/40 px-3.5 py-1.5 text-[12px] text-red-200 font-['DM_Sans'] disabled:opacity-50"
              >
                Hacerlo como lo pedí
              
            )}
          


        


      )}

      {audit && audit.status !== "limpio" && (
        


          


            {audit.status === "falla" ? "Revisión: falla un criterio" : "Revisión: con observaciones"}
          


          


            {audit.violations.map((v, i) => (
              


                «{v.evidencia}» — {v.explicacion}
              


            ))}
            {audit.sin_respaldo.map((x, i) => (
              


                Sin respaldo en el cerebro de tu empresa: {x}
              


            ))}
          


        


      )}

      


         setInput(e.target.value)}
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
