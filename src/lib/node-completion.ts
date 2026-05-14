// Helpers compartidos para señalizar a /mapa que acaba de completarse un nodo
// y que debe ejecutar la secuencia de animación (estrellas, glow, candado…).

const KEY = "closer:nodeCompletion";

export interface NodeCompletionSignal {
  nodeId: string;
  stars: 1 | 2 | 3;
  // true si el nodo ya estaba completado antes (mejora) — no desbloquea siguiente
  isReplay: boolean;
  // true si las estrellas son mayores que las que ya tenía guardadas
  improved: boolean;
  ts: number;
}

export function setNodeCompletionSignal(s: Omit<NodeCompletionSignal, "ts">) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...s, ts: Date.now() }));
  } catch {}
}

export function consumeNodeCompletionSignal(): NodeCompletionSignal | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as NodeCompletionSignal;
    // expira tras 30s para no disparar animaciones viejas
    if (Date.now() - parsed.ts > 30_000) return null;
    return parsed;
  } catch {
    return null;
  }
}
