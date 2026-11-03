import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  obtenerCalificacion,
  CalificacionTardada,
  CalificacionFallida,
  ESPERA_MAXIMA_TELEFONO_MS,
  PROCESANDO_ABANDONADA_MS as ABANDONADA_TELEFONO,
  type FilaCalificacion,
} from "../evaluacion-guardada";
import {
  decidirEvaluacion,
  esIdDePractica,
  PROCESANDO_ABANDONADA_MS,
  ESPERA_MAXIMA_TELEFONO_MS as ESPERA_SERVIDOR,
} from "../../../supabase/functions/_shared/evaluacion_guardada";

// Mensaje 126 (3-nov-2026). Emilio practicó el 3.10 y vio «El análisis tardó
// demasiado». La causa: el teléfono cortaba a los 60 s fijos y el servidor
// (evaluador + juez + auditor) puede tardar más. La calificación se perdía y
// al reintentar se calculaba otra vez. LA PRUEBA de esta regla: ninguna
// calificación se pierde porque el teléfono dejó de esperar, y reintentar
// trae la misma, sin calcularla de nuevo.

const raiz = resolve(__dirname, "../../..");
const leer = (p: string) => readFileSync(resolve(raiz, p), "utf8");

/** Un reloj falso: dormir avanza el tiempo sin esperar de verdad. */
function reloj() {
  let t = 1_000_000;
  return { ahora: () => t, dormir: async (ms: number) => { t += ms; } };
}

describe("el servidor decide qué hacer con una calificación ya pedida", () => {
  const ahora = Date.parse("2026-11-03T18:00:00Z");
  const hace = (ms: number) => new Date(ahora - ms).toISOString();

  it("sin fila, empieza", () => {
    expect(decidirEvaluacion(null, ahora)).toBe("empezar");
  });
  it("lista: la devuelve tal cual (no la vuelve a calcular)", () => {
    expect(decidirEvaluacion({ estado: "lista", resultado: { score: 70 }, actualizada_en: hace(5_000) }, ahora)).toBe("devolver");
  });
  it("procesando reciente: espera (no la calcula dos veces)", () => {
    expect(decidirEvaluacion({ estado: "procesando", actualizada_en: hace(90_000) }, ahora)).toBe("esperar");
  });
  it("procesando abandonada (el trabajo murió): vuelve a empezar", () => {
    expect(decidirEvaluacion({ estado: "procesando", actualizada_en: hace(PROCESANDO_ABANDONADA_MS + 1) }, ahora)).toBe("empezar");
  });
  it("error: reintentar la vuelve a calcular", () => {
    expect(decidirEvaluacion({ estado: "error", actualizada_en: hace(1_000) }, ahora)).toBe("empezar");
  });
  it("solo acepta ids de práctica con forma de uuid", () => {
    expect(esIdDePractica("3f1c2a9e-1b2c-4d5e-8f90-123456789abc")).toBe(true);
    expect(esIdDePractica("abc")).toBe(false);
    expect(esIdDePractica("x' or 1=1")).toBe(false);
    expect(esIdDePractica(null)).toBe(false);
  });
  it("teléfono y servidor usan los mismos tiempos, y el teléfono se rinde después de que el servidor acepta volver a empezar", () => {
    expect(ABANDONADA_TELEFONO).toBe(PROCESANDO_ABANDONADA_MS);
    expect(ESPERA_MAXIMA_TELEFONO_MS).toBe(ESPERA_SERVIDOR);
    expect(ESPERA_MAXIMA_TELEFONO_MS).toBeGreaterThan(PROCESANDO_ABANDONADA_MS);
    // Lo que tumbó a Emilio: un límite de un minuto. Ya no hay nada parecido.
    expect(ESPERA_MAXIMA_TELEFONO_MS).toBeGreaterThanOrEqual(180_000);
  });
});

describe("el teléfono espera la calificación guardada", () => {
  it("si ya estaba lista (un reintento), la trae de inmediato", async () => {
    const r = reloj();
    const texto = await obtenerCalificacion({
      pedir: async () => ({ status: 200, texto: '{"score":70}' }),
      leer: async () => { throw new Error("no debería preguntar"); },
      ...r,
    });
    expect(JSON.parse(texto).score).toBe(70);
  });

  it("aunque el servidor tarde 3 minutos, la calificación llega (antes se perdía al minuto)", async () => {
    const r = reloj();
    const inicio = r.ahora();
    const texto = await obtenerCalificacion({
      pedir: async () => ({ status: 202, texto: '{"estado":"procesando"}' }),
      leer: async (): Promise<FilaCalificacion> =>
        r.ahora() - inicio < 180_000 ? { estado: "procesando" } : { estado: "lista", resultado: { score: 64 } },
      ...r,
    });
    expect(JSON.parse(texto).score).toBe(64);
    expect(r.ahora() - inicio).toBeGreaterThanOrEqual(180_000);
  });

  it("si el servidor falló, lo dice (y el botón reintenta)", async () => {
    const r = reloj();
    await expect(obtenerCalificacion({
      pedir: async () => ({ status: 202, texto: "" }),
      leer: async () => ({ estado: "error", error: "HTTP 502" }),
      ...r,
    })).rejects.toBeInstanceOf(CalificacionFallida);
  });

  it("un rechazo del servidor (no 200 ni 202) es una falla, sin esperar", async () => {
    const r = reloj();
    await expect(obtenerCalificacion({
      pedir: async () => ({ status: 403, texto: "Esta práctica no es tuya" }),
      leer: async () => null,
      ...r,
    })).rejects.toBeInstanceOf(CalificacionFallida);
  });

  it("si se corta la señal un momento al preguntar, sigue preguntando", async () => {
    const r = reloj();
    let n = 0;
    const texto = await obtenerCalificacion({
      pedir: async () => ({ status: 202, texto: "" }),
      leer: async () => {
        n++;
        if (n <= 3) throw new Error("sin señal");
        return { estado: "lista", resultado: { score: 90 } };
      },
      ...r,
    });
    expect(JSON.parse(texto).score).toBe(90);
  });

  it("si se cortó la señal al pedir pero el servidor sí lo recibió, la calificación llega igual", async () => {
    const r = reloj();
    const texto = await obtenerCalificacion({
      pedir: async () => { throw new Error("Failed to fetch"); },
      leer: async () => ({ estado: "lista", resultado: { score: 55 } }),
      ...r,
    });
    expect(JSON.parse(texto).score).toBe(55);
  });

  it("si el pedido nunca llegó, no espera minutos: avisa para reintentar", async () => {
    const r = reloj();
    const inicio = r.ahora();
    await expect(obtenerCalificacion({
      pedir: async () => { throw new Error("Failed to fetch"); },
      leer: async () => null,
      ...r,
    })).rejects.toBeInstanceOf(CalificacionFallida);
    expect(r.ahora() - inicio).toBeLessThan(60_000);
  });

  it("si de verdad no termina, al final ofrece reintentar (nunca se queda colgado)", async () => {
    const r = reloj();
    await expect(obtenerCalificacion({
      pedir: async () => ({ status: 202, texto: "" }),
      leer: async () => ({ estado: "procesando" }),
      ...r,
    })).rejects.toBeInstanceOf(CalificacionTardada);
  });
});

describe("las piezas están conectadas", () => {
  const practica = leer("src/routes/nodo.$nodeId.practica.tsx");
  const voz = leer("supabase/functions/closer-voice/index.ts");

  it("la práctica pide la calificación de SU práctica guardada y espera la fila", () => {
    expect(practica).toContain("practice_session_id: practiceSessionId");
    expect(practica).toContain("obtenerCalificacion(");
    expect(practica).toContain("evaluaciones_practica?select=estado,resultado,error");
    // El corte fijo de 60 s ya no existe.
    expect(practica).not.toMatch(/setTimeout\(\(\) => ctrl\.abort\(\), 60_000\)/);
    expect(practica).not.toContain("El análisis tardó demasiado");
  });

  it("si la práctica no se guardó, no dice que está guardada", () => {
    expect(practica).toContain("No pude guardar tu práctica.");
    expect(practica).not.toContain("{evalError} Tu conversación completa quedó guardada.");
  });

  it("el servidor guarda la calificación en segundo plano, solo para el dueño de la práctica", () => {
    expect(voz).toMatch(/body\.phase === "evaluate" && practiceSessionId != null/);
    expect(voz).toContain("async function evaluacionGuardada(");
    expect(voz).toContain('practica.seller_id !== quien.sellerId');
    expect(voz).toContain("enSegundoPlano((async () => {");
    expect(voz).toContain('.from("evaluaciones_practica")');
    // El cálculo es el mismo de siempre: la red (sin practice_session_id) y la
    // práctica real pasan por la misma función.
    expect(voz).toContain("const r = await atender(body);");
    expect(voz).toContain("return await atender(body);");
  });

  it("la red reporta cuánto tarda la calificación más lenta", () => {
    const red = leer("supabase/functions/harness-runner/index.ts");
    expect(red).toContain("tiempos: resumenDeTiempos(results)");
    expect(red).toContain("sobre_90s");
  });
});
