// Disputas de calificación: se guardan, se filtran y se copian (oct-2026).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { armarReporteDisputas, filtrar, type Disputa } from "../disputas-reporte";

const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");
const pagina = readFileSync(join(process.cwd(), "src/routes/disputas.tsx"), "utf8");

const base = (x: Partial<Disputa>): Disputa => ({
  id: "1", created_at: "2026-10-01T16:58:00Z", node_id: "3.10", nota_original: 50,
  mensaje_vendedor: "Me dio tres no seguidos; por eso me fui.", respuesta_closer: "Tienes razón.",
  concede: true, criterio_id: "discovery.preguntas_capas", motivo: "La salida por la Regla de los No era la correcta.",
  contexto: {
    evaluacion: { veredictos_criterios: [{ criterio_id: "discovery.preguntas_capas", nivel: "parcial", falta: "Se quedó en capa 1" }] },
    conversacion: [{ role: "user", content: "¡Buenas tardes, don Ramón!" }, { role: "assistant", content: "No tengo tiempo." }],
  },
  revisada: false, nota_revision: null, ...x,
});

describe("filtrar", () => {
  const lista = [base({ id: "a" }), base({ id: "b", concede: false }), base({ id: "c", revisada: true, node_id: "1.2" })];
  it("concedidas, sin revisar, todas, y por nodo", () => {
    expect(filtrar(lista, "concedidas", "").map((d) => d.id)).toEqual(["a", "c"]);
    expect(filtrar(lista, "sin_revisar", "").map((d) => d.id)).toEqual(["a", "b"]);
    expect(filtrar(lista, "todas", "1.2").map((d) => d.id)).toEqual(["c"]);
  });
});

describe("el reporte para Claude trae todo lo necesario para hacer un caso de la red", () => {
  const r = armarReporteDisputas([base({})]);
  it("nodo, nota, veredicto de Closer, criterio y motivo", () => {
    expect(r).toMatch(/\[3\.10\] 2026-10-01 16:58 · nota 50 · CONCEDIDA · criterio discovery\.preguntas_capas/);
    expect(r).toMatch(/motivo: La salida por la Regla de los No era la correcta\./);
  });
  it("lo que decidió el evaluador y la conversación completa", () => {
    expect(r).toMatch(/decidió: preguntas_capas:parcial\(falta: Se quedó en capa 1\)/);
    expect(r).toMatch(/V: ¡Buenas tardes, don Ramón!/);
    expect(r).toMatch(/C: No tengo tiempo\./);
  });
});

describe("el servidor y la página", () => {
  it("la réplica dice si concede, en qué criterio y por qué", () => {
    expect(fn).toMatch(/"concede": true \| false,/);
    expect(fn).toMatch(/"criterio_id": "<id del criterio o de la falla que estaba mal, o null>"/);
  });
  it("el servidor guarda la disputa con su contexto, sin depender del teléfono", () => {
    expect(fn).toMatch(/await adminDisputa\.from\("disputas"\)\.insert\(\{/);
    expect(fn).toMatch(/conversacion: Array\.isArray\(conversation_history\)/);
  });
  it("solo los administradores de la plataforma entran", () => {
    expect(pagina).toMatch(/platform_admins\?select=user_id&user_id=eq\./);
    expect(pagina).toMatch(/Solo para el equipo de Closer/);
  });
});
