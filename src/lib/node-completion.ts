// Señal efímera quiz → mapa basada en sessionStorage.
// El Context de React no sobrevive a navegaciones que remontan el árbol,
// así que usamos sessionStorage con un TTL corto para evitar señales viejas.

const KEY = "closer:nodeCompletion";
const TTL_MS = 30_000;

export interface NodeCompletionSignal {
  nodeId: string;
  stars: 1 | 2 | 3;
  isReplay: boolean;
  improved: boolean;
  timestamp: number;
}

export function setNodeCompletionSignal(
  s: Omit<NodeCompletionSignal, "timestamp">,
) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({ ...s, timestamp: Date.now() }),
    );
  } catch {
    /* noop */
  }
}

// Lee y borra atómicamente la señal. Devuelve null si no hay o si expiró.
export function consumeNodeCompletionSignal(): NodeCompletionSignal | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY); // borrar SIEMPRE, antes de validar TTL
    const sig = JSON.parse(raw) as NodeCompletionSignal;
    if (!sig || typeof sig.timestamp !== "number") return null;
    if (Date.now() - sig.timestamp > TTL_MS) return null;
    return sig;
  } catch {
    return null;
  }
}
