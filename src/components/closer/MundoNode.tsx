import { Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MundoNode — nodo individual del mapa de entrenamiento.
 *
 * Filosofía revelación progresiva:
 *  - active:    iluminado, naranja, halo pulsando — único nodo accionable
 *  - completed: marcado, color suave — logro permanente, NUNCA se pierde
 *  - next:      silueta visible, indica qué viene
 *  - locked:    en niebla, no se ve hasta que el anterior se completa
 *  - boss:      anillo doble — Boss Level del mundo
 */
export type NodeStatus = "active" | "completed" | "next" | "locked" | "boss-active" | "boss-completed" | "boss-locked";

interface MundoNodeProps {
  label: string;
  emoji?: string;
  status: NodeStatus;
  onClick?: () => void;
  className?: string;
}

export function MundoNode({ label, emoji, status, onClick, className }: MundoNodeProps) {
  const isBoss = status.startsWith("boss");
  const isActive = status === "active" || status === "boss-active";
  const isCompleted = status === "completed" || status === "boss-completed";
  const isLocked = status === "locked" || status === "boss-locked";
  const isNext = status === "next";

  return (
    <button
      type="button"
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      aria-label={`${isBoss ? "Boss Level: " : ""}${label}`}
      className={cn(
        "group relative flex flex-col items-center gap-2 transition-all duration-200",
        !isLocked && "hover:-translate-y-0.5 active:scale-95",
        className,
      )}
    >
      {/* Anillo del nodo */}
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all",
          "h-16 w-16",
          isBoss && "h-20 w-20",
          isActive &&
            "bg-primary text-primary-foreground shadow-[var(--shadow-orange)] animate-pulse-orange",
          isCompleted &&
            "bg-primary-soft text-primary border border-primary/40",
          isNext &&
            "bg-surface border border-border-strong text-muted-foreground opacity-90",
          isLocked &&
            "bg-surface border border-border text-muted-foreground/40",
          isBoss && (isActive || isCompleted) && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
        )}
      >
        {isLocked ? (
          <Lock className="h-5 w-5" />
        ) : isCompleted ? (
          <Check className="h-7 w-7" strokeWidth={3} />
        ) : (
          <span className="text-2xl leading-none">{emoji ?? "•"}</span>
        )}

        {isBoss && !isLocked && (
          <span className="absolute -top-2 -right-2 text-[10px] font-display font-bold uppercase tracking-wider bg-background border border-primary text-primary px-1.5 py-0.5 rounded-full">
            Boss
          </span>
        )}
      </span>

      {/* Label */}
      <span
        className={cn(
          "text-xs font-display font-semibold text-center max-w-[88px] leading-tight",
          isActive && "text-foreground",
          isCompleted && "text-primary",
          isNext && "text-muted-foreground",
          isLocked && "text-muted-foreground/50",
        )}
      >
        {isLocked ? "—" : label}
      </span>
    </button>
  );
}
