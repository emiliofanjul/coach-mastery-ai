// Estado en memoria (React Context) para señalizar a /mapa que acaba de
// completarse un nodo. Reemplaza el flujo anterior basado en sessionStorage,
// que sufría race conditions con la carga asíncrona de los nodos del mapa.

import { createContext, useContext, useRef, useState, type ReactNode } from "react";

export interface NodeCompletionSignal {
  nodeId: string;
  stars: 1 | 2 | 3;
  // true si el nodo ya estaba completado antes (mejora) — no desbloquea siguiente
  isReplay: boolean;
  // true si las estrellas son mayores que las que ya tenía guardadas
  improved: boolean;
  ts: number;
}

interface Ctx {
  signal: NodeCompletionSignal | null;
  setSignal: (s: Omit<NodeCompletionSignal, "ts">) => void;
  clearSignal: () => void;
}

const NodeCompletionContext = createContext<Ctx | null>(null);

export function NodeCompletionProvider({ children }: { children: ReactNode }) {
  const [signal, setSignalState] = useState<NodeCompletionSignal | null>(null);
  // Ref espejo para evitar setear dos veces (StrictMode doble-render del quiz)
  const lastTsRef = useRef<number>(0);

  const setSignal = (s: Omit<NodeCompletionSignal, "ts">) => {
    const ts = Date.now();
    if (ts - lastTsRef.current < 50) return; // dedupe rapidísimo
    lastTsRef.current = ts;
    setSignalState({ ...s, ts });
  };

  const clearSignal = () => setSignalState(null);

  return (
    <NodeCompletionContext.Provider value={{ signal, setSignal, clearSignal }}>
      {children}
    </NodeCompletionContext.Provider>
  );
}

export function useNodeCompletion(): Ctx {
  const ctx = useContext(NodeCompletionContext);
  if (!ctx) {
    throw new Error("useNodeCompletion must be used within NodeCompletionProvider");
  }
  return ctx;
}
