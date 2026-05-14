// Reglas de estrellas para nodos de práctica de voz.
// Esta lógica está lista para usarse cuando se construyan los nodos de voz.

export type VoiceOutcome =
  | {
      kind: "victory";
      stars: 1 | 2 | 3;
      title: string;
      subtitle: string;
    }
  | {
      kind: "retry";
      stars: 0;
      title: string;
      subtitle: string;
      primaryButtonText: string;
      action: "restartVoicePractice" | "goToFirstCard";
    };

/**
 * Convierte un score 0-100 (evaluador GPT) en una decisión de pantalla
 * de cierre para nodos de voz.
 *
 *  85-100 → 3 estrellas (Victory)
 *  70-84  → 2 estrellas (Victory)
 *  60-69  → 1 estrella  (Victory)
 *  40-59  → 0 estrellas (Retry — restartVoicePractice)
 *  < 40   → 0 estrellas (Retry — goToFirstCard)
 */
export function voiceOutcomeFromScore(score: number): VoiceOutcome {
  if (score >= 85) {
    return {
      kind: "victory",
      stars: 3,
      title: "¡Nodo completado!",
      subtitle: "Sólido. Al siguiente.",
    };
  }
  if (score >= 70) {
    return {
      kind: "victory",
      stars: 2,
      title: "Bien hecho.",
      subtitle: "Puedes sacar 3 estrellas. Sigue avanzando.",
    };
  }
  if (score >= 60) {
    return {
      kind: "victory",
      stars: 1,
      title: "Pasaste.",
      subtitle: "Hay más por mejorar aquí. Sigue y regresa.",
    };
  }
  if (score >= 40) {
    return {
      kind: "retry",
      stars: 0,
      title: "Sigue practicando.",
      subtitle: "Cada intento te acerca más. Inténtalo de nuevo.",
      primaryButtonText: "Intentar de nuevo →",
      action: "restartVoicePractice",
    };
  }
  return {
    kind: "retry",
    stars: 0,
    title: "Hay trabajo que hacer.",
    subtitle: "Repasa las tarjetas del nodo y vuelve a intentarlo.",
    primaryButtonText: "Repasar tarjetas →",
    action: "goToFirstCard",
  };
}
