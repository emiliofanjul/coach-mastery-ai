import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { conReintentos, ESPERAS_REINTENTO_MS } from "../guardado-practica";
import { armarEventoDePractica, combinarPayload } from "../../../supabase/functions/_shared/evento_practica";

// Mensaje 129 (3-nov-2026). La práctica de Emilio del 3.10 se calificó y la
// calificación quedó guardada, pero nunca llegó a «Mi equipo»: el evento lo
// creaba solo el teléfono y, si fallaba, el error se perdía en su consola.
// LA PRUEBA de esta regla: toda práctica calificada llega al historial, falle
// lo que falle en el teléfono, y si algo falla queda registrado por qué.

const raiz = resolve(__dirname, "../../..");
const leer = (p: string) => readFileSync(resolve(raiz, p), "utf8");

const practica = {
  id: "cf319b93-b3d8-4ed0-9c12-c118da773997",
  seller_id: "e8ab27e1-5564-43c5-883d-c95503e3fc14",
  node_id: "3.10",
  world_id: 3,
  practice_type: "boss",
  is_boss_level: true,
  transcript: JSON.stringify([{ role: "user", text: "Hola, buen día" }]),
};
const resultado = {
  score: 30, stars: 0, cut_reason: "critical_failure", prompt_version: "v2.9.8", model: "claude-sonnet-4-5",
  criterios_cumplidos: ["discovery.preguntas_capas"], observations: [], flags_detected: ["pitch_prematuro"],
  mision: "Diagnostica sin presentar", fallas: [{ id: "pitch_prematuro", severidad: "critical" }],
  desglose: { base: 100 }, regresiones_detectadas: [{ skill_id: "s1", evidencia: "e" }, { malo: true }],
};

describe("el servidor arma el evento con la misma forma que el teléfono", () => {
  const ev = armarEventoDePractica({
    practica, resultado,
    extra: { skill_ids: ["discovery.escalera"], input_mode: "voice", director_decisions: [{ d: 1 }], incidentes_voz: [], audio_turnos: [{ turno: 1 }] },
    ficha_cliente: { nombre: "don Alberto" },
    session_id: "sess-1",
  });
  it("lo que lee «Mi equipo»: nota, estrellas, evaluación y conversación", () => {
    expect(ev.event_type).toBe("practice_session");
    expect(ev.seller_id).toBe(practica.seller_id);
    expect(ev.node_id).toBe("3.10");
    expect(ev.payload.score).toBe(30);
    expect(ev.payload.stars).toBe(0);
    expect(ev.payload.evaluation.fallas[0].id).toBe("pitch_prematuro");
    expect(ev.payload.transcript).toEqual([{ role: "user", text: "Hola, buen día" }]);
  });
  it("lo que pide el resto del sistema: práctica, tipo, skills, regresiones válidas y versión", () => {
    expect(ev.payload.practice_session_id).toBe(practica.id);
    expect(ev.payload.practice_type).toBe("boss");
    expect(ev.payload.is_boss_level).toBe(true);
    expect(ev.skill_ids).toEqual(["discovery.escalera"]);
    expect(ev.payload.evaluation.regresiones_detectadas).toEqual([{ skill_id: "s1", evidencia: "e" }]);
    expect(ev.payload.evaluation.audio_turnos).toEqual([{ turno: 1 }]);
    expect(ev.payload.evaluation.ficha_cliente).toEqual({ nombre: "don Alberto" });
    expect(ev.prompt_version).toBe("v2.9.8");
    expect(ev.payload.session_id).toBe("sess-1");
    expect(ev.payload.registrado_por).toBe("servidor");
  });
  it("si el teléfono no mandó la conversación, usa la de la práctica guardada; si no es JSON, queda vacía", () => {
    const sinExtra = armarEventoDePractica({ practica, resultado, extra: {}, ficha_cliente: null, session_id: null });
    expect(sinExtra.payload.transcript).toEqual([{ role: "user", text: "Hola, buen día" }]);
    const roto = armarEventoDePractica({ practica: { ...practica, transcript: "no es json" }, resultado, extra: {}, ficha_cliente: null, session_id: null });
    expect(roto.payload.transcript).toEqual([]);
  });
  it("lo que manda después el teléfono se agrega sin borrar lo del servidor", () => {
    const c = combinarPayload(ev.payload, { rachas: [{ skill_id: "s1", streak: 3 }], evaluation: { audio_turnos: [{ turno: 2 }] } });
    expect(c.rachas).toEqual([{ skill_id: "s1", streak: 3 }]);
    expect(c.evaluation.audio_turnos).toEqual([{ turno: 2 }]);
    expect(c.evaluation.fallas[0].id).toBe("pitch_prematuro");
    expect(c.score).toBe(30);
    expect(c.registrado_por).toBe("servidor+telefono");
  });
});

describe("el teléfono reintenta y no se rinde en silencio", () => {
  const sinEspera = { esperar: async () => {} };
  it("a la primera", async () => {
    const r = await conReintentos(async () => ({ status: 200, texto: "{}" }), sinEspera);
    expect(r).toMatchObject({ ok: true, intentos: 1 });
  });
  it("sin señal dos veces y luego sí", async () => {
    let n = 0;
    const r = await conReintentos(async () => { n++; if (n < 3) throw new Error("Failed to fetch"); return { status: 200, texto: "" }; }, sinEspera);
    expect(r).toMatchObject({ ok: true, intentos: 3 });
  });
  it("si nunca se logra, dice por qué (para registrarlo)", async () => {
    const r = await conReintentos(async () => ({ status: 500, texto: "Insert failed" }), sinEspera);
    expect(r.ok).toBe(false);
    expect(r.intentos).toBe(ESPERAS_REINTENTO_MS.length + 1);
    expect(r.detalle).toContain("HTTP 500: Insert failed");
  });
  it("un rechazo que no cambia al repetir (400, 404) no se reintenta", async () => {
    let n = 0;
    const r = await conReintentos(async () => { n++; return { status: 404, texto: "Seller not found" }; }, sinEspera);
    expect(n).toBe(1);
    expect(r).toMatchObject({ ok: false, status: 404 });
  });
  it("la sesión caducada (401) sí se reintenta: el siguiente intento lleva la sesión renovada", async () => {
    let n = 0;
    const r = await conReintentos(async () => { n++; return n === 1 ? { status: 401, texto: "" } : { status: 200, texto: "" }; }, sinEspera);
    expect(r).toMatchObject({ ok: true, intentos: 2 });
  });
});

describe("las piezas están conectadas", () => {
  const voz = leer("supabase/functions/closer-voice/index.ts");
  const guardar = leer("supabase/functions/save-practice-event/index.ts");
  const practicaTsx = leer("src/routes/nodo.$nodeId.practica.tsx");

  it("el servidor crea el evento ANTES de marcar la calificación como lista", () => {
    const iEvento = voz.indexOf("await guardarEventoDePractica(admin, armarEventoDePractica(");
    const iLista = voz.indexOf('estado = "lista";', iEvento);
    const iUpdate = voz.indexOf("evento_id: eventoId, error_evento: errorEvento,");
    expect(iEvento).toBeGreaterThan(0);
    expect(iLista).toBeGreaterThan(iEvento);
    expect(iUpdate).toBeGreaterThan(iLista);
  });

  it("guardar desde el teléfono completa el evento existente en vez de duplicarlo", () => {
    expect(guardar).toContain("await buscarEventoDePractica(admin, seller.id, practiceSessionId)");
    expect(guardar).toContain("payload: combinarPayload(existente.payload, payload)");
  });

  it("las rachas del radar se leen de donde las manda la app", () => {
    expect(guardar).toContain("(payload as any)?.rachas");
    expect(practicaTsx).toMatch(/rachas,\s*\n\s*\n?\s*\},\s*\n\s*\}\),/);
  });

  it("el teléfono manda lo del evento al pedir la calificación, reintenta el guardado y registra la falla", () => {
    expect(practicaTsx).toContain("evento: {");
    expect(practicaTsx).toContain("transcript: transcriptFullRef.current,");
    expect(practicaTsx).toContain("const r = await conReintentos(");
    expect(practicaTsx).toContain('donde: "save-practice-event"');
    expect(practicaTsx).toContain("bytes_audio: audioBlob?.size ?? 0");
    expect(practicaTsx).not.toContain('console.error("[save-practice-event] failed:", uplErr);\n        }');
  });
});
