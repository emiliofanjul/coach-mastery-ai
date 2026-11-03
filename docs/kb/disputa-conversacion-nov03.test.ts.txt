import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { vistaDeDisputa, type Disputa } from "../disputas-reporte";

// 3-nov-2026, Emilio: en la página de disputas hay que ver la conversación,
// «porque si no, no sabemos qué estamos analizando».

const base: Disputa = {
  id: "d1", created_at: "2026-11-03T17:56:00Z", node_id: "3.10", nota_original: 30,
  mensaje_vendedor: "ya tenía el dolor", respuesta_closer: "Tienes razón", concede: true,
  criterio_id: "pitch_prematuro", motivo: "m", revisada: false, nota_revision: null,
  contexto: {
    evaluacion: {
      cut_reason: "critical_failure",
      fallas: [{ id: "pitch_prematuro", severidad: "critical", cita: "Le traigo la línea completa" }],
      veredictos_criterios: [{ criterio_id: "discovery.excava_pista", nivel: "cumple" }],
    },
    conversacion: [
      { role: "assistant", content: "Buenas, ¿qué se le ofrece?" },
      { role: "user", content: "¿Qué es lo que más le molesta de su proveedor?" },
      { role: "assistant", content: "Que no me entrega a tiempo." },
    ],
  },
};

describe("la disputa se ve con su conversación", () => {
  it("numera los turnos como los cita Closer y dice quién habló", () => {
    const v = vistaDeDisputa(base);
    expect(v.turnos.map((t) => `${t.n}:${t.quien}`)).toEqual(["1:Cliente", "2:Vendedor", "3:Cliente"]);
    expect(v.turnos[2].texto).toBe("Que no me entrega a tiempo.");
  });
  it("muestra qué falla le bajó la nota, con lo que dijo, y cómo terminó", () => {
    const v = vistaDeDisputa(base);
    expect(v.fallas).toContain("pitch_prematuro(critical)");
    expect(v.fallas).toContain("Le traigo la línea completa");
    expect(v.decidio).toContain("excava_pista:cumple");
    expect(v.termino).toBe("falla crítica");
  });
  it("una disputa vieja sin contexto no rompe la página", () => {
    const v = vistaDeDisputa({ ...base, contexto: null });
    expect(v.turnos).toEqual([]);
    expect(v.fallas).toBe("");
    expect(v.termino).toBeNull();
  });
  it("la página la muestra en cada disputa", () => {
    const pagina = readFileSync(resolve(__dirname, "../../routes/disputas.tsx"), "utf8");
    expect(pagina).toContain("<ConversacionDeDisputa d={d} />");
    expect(pagina).toContain("Ver conversación y calificación");
  });
});
