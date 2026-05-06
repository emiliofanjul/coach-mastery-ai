import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * CoachBubble — botón flotante del coach.
 *
 * Filosofía:
 *  - Siempre disponible pero nunca compitiendo por atención.
 *  - Esquina inferior derecha. Pequeño cuando cerrado.
 *  - Modal de chat sobre la pantalla actual cuando se abre.
 *  - NO ocupa espacio en el flujo. NO es una sección del Home.
 *  - Color azul Coach (no naranja) — el coach es voz didáctica,
 *    no la acción principal.
 *  - Se oculta automáticamente durante práctica de voz.
 */
interface CoachBubbleProps {
  hidden?: boolean;
  context?: string; // pista de en qué pantalla está el usuario
}

export function CoachBubble({ hidden = false, context }: CoachBubbleProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  if (hidden) return null;

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Hablar con tu coach"
        className={cn(
          "fixed bottom-5 right-5 z-40",
          "h-14 w-14 rounded-full",
          "bg-primary text-primary-foreground",
          "glow-orange",
          "flex items-center justify-center",
          "transition-transform duration-200 hover:scale-105 active:scale-95",
          open && "opacity-0 pointer-events-none",
        )}
      >
        <MessageCircle className="h-6 w-6" strokeWidth={2.2} />
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm animate-[fade-up_0.2s_ease-out]"
          onClick={() => setOpen(false)}
        >
          <div
            className="card-closer w-full sm:max-w-md mx-0 sm:mx-4 mb-0 sm:mb-0 rounded-t-2xl sm:rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="eyebrow">Tu coach</p>
                <h3 className="font-display font-semibold text-lg leading-tight">
                  Pregunta lo que sea
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="h-9 w-9 rounded-full hover:bg-accent flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="px-5 py-5 space-y-3 max-h-[55vh] overflow-y-auto">
              {/* Mensaje semilla del coach */}
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary-soft text-primary flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm leading-relaxed">
                  Estoy aquí. Cualquier duda sobre lo que estás aprendiendo —
                  o algo que viste hoy en campo — pregúntame.
                  {context && (
                    <span className="block mt-2 text-muted-foreground text-xs">
                      Contexto: {context}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form
              className="flex items-center gap-2 px-4 py-3 border-t border-border bg-surface-elevated"
              onSubmit={(e) => {
                e.preventDefault();
                // Wired al backend en su fase. Por ahora solo limpia.
                setDraft("");
              }}
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="flex-1 h-11 rounded-full bg-input border border-border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button
                type="submit"
                variant="primary"
                size="icon"
                disabled={!draft.trim()}
                aria-label="Enviar"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
