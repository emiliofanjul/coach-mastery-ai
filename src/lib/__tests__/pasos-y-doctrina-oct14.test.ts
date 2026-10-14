// Decisiones de Emilio del 14-oct-2026: el ataque preventivo, el paso de cada
// cosa que se marca, los nombres de los boss, las críticas en certificación y
// el quiz de FUJPIG.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { etiquetarPasos } from "../../../supabase/functions/_shared/pasos";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const quizzes: any[] = JSON.parse(leer("docs/kb/quizzes_snapshot.json"));
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));

const CAT = {
  mundos: [
    { id: 1, name: "La Introducción" }, { id: 2, name: "La Historia Breve" }, { id: 3, name: "El Descubrimiento" },
    { id: 4, name: "La Presentación" }, { id: 5, name: "El Cierre" }, { id: 6, name: "La Consolidación" },
  ],
  skills: [
    { id: "blocks.air", name: "AIR", world_id_introduced: 2, regla_id: "blocks.air" },
    { id: "presentation.conectar_dolor", name: "Conectar con el dolor", world_id_introduced: 4, regla_id: "present.conectar" },
  ],
  reglas: [{ id: "objection.discutir", paso: 0 }, { id: "discovery.receta_sin_diagnostico", paso: 3 }],
};

describe("el paso de la visita en cada cosa que se marca", () => {
  it("una observación lleva el paso donde se enseñó su habilidad, y su nombre", () => {
    const ev: any = { observations: [{ criterio_id: "blocks.air", error: "x" }], fallas: [] };
    etiquetarPasos(ev, { failure_criteria: [] }, "4.16", CAT);
    expect(ev.observations[0].paso).toBe("La Historia Breve");
    expect(ev.observations[0].habilidad).toBe("AIR");
  });
  it("una falla toma el paso de su regla; si la regla es universal, el del nodo", () => {
    const ps = { failure_criteria: [{ id: "pitch_prematuro", regla_id: "discovery.receta_sin_diagnostico" }, { id: "se_defiende", regla_id: "objection.discutir" }] };
    const ev: any = { observations: [], fallas: [{ id: "pitch_prematuro" }, { id: "se_defiende" }] };
    etiquetarPasos(ev, ps, "5.15", CAT);
    expect(ev.fallas[0].paso).toBe("El Descubrimiento");
    expect(ev.fallas[1].paso).toBe("El Cierre");
  });
  it("si no encuentra nada, no inventa etiqueta", () => {
    const ev: any = { observations: [{ criterio_id: "no.existe" }], fallas: [] };
    etiquetarPasos(ev, {}, null, CAT);
    expect(ev.observations[0].paso).toBeUndefined();
  });
  it("closer-voice las agrega sin poder tumbar la evaluación, y la pantalla las muestra", () => {
    const voz = leer("supabase/functions/closer-voice/index.ts");
    expect(voz).toContain("etiquetarPasos(evaluation, practice_script, node_id");
    expect(voz).toContain("sin etiquetas de paso (fail-open)");
    const ui = leer("src/routes/nodo.$nodeId.practica.tsx");
    expect(ui).toContain("<EtiquetaPaso paso={obs.paso} habilidad={obs.habilidad} />");
    expect(ui).toContain("<EtiquetaPaso paso={falla.paso} />");
  });
});

describe("los boss dicen de qué paso son", () => {
  it("el mapa pone 'BOSS DE <paso>' y los nombres ya no repiten 'BOSS:'", () => {
    const mapa = leer("src/routes/mapa.tsx");
    // "de" + "el" = "del": "BOSS DEL DESCUBRIMIENTO", nunca "BOSS DE EL…".
    const cuerpo = mapa.slice(mapa.indexOf("function etiquetaBoss"), mapa.indexOf("function NodeSheetBody"));
    const etiquetaBoss = new Function("worldName", cuerpo.slice(cuerpo.indexOf("{") + 1, cuerpo.lastIndexOf("}")).replace(/: string \| null/g, "")) as (w: string | null) => string;
    expect(etiquetaBoss("El Descubrimiento")).toBe("BOSS DEL DESCUBRIMIENTO");
    expect(etiquetaBoss("El Cierre")).toBe("BOSS DEL CIERRE");
    expect(etiquetaBoss("La Presentación")).toBe("BOSS DE LA PRESENTACIÓN");
    expect(etiquetaBoss("Certificación")).toBe("BOSS DE CERTIFICACIÓN");
    // También en un boss ya completado.
    expect(mapa.match(/\{etiquetaBoss\(worldName\)\}/g)?.length).toBe(2);
    const malos = nodos.filter((n) => n.node_type === "boss" && /^BOSS:/i.test(n.name)).map((n) => n.id);
    expect(malos).toEqual([]);
  });
});

describe("ataque preventivo (doctrina de Emilio)", () => {
  it("el Cerebro dice cuándo sí, cuándo no, y qué hacer con la mala experiencia al llegar", () => {
    expect(cerebro).toContain("**En la presentación**, con los negativos conocidos de tu oferta");
    expect(cerebro).toContain("**Al regresar con un cliente que en la visita pasada te dio una objeción**");
    expect(cerebro).toContain("**Cuándo no:** al llegar con un cliente nuevo.");
    expect(cerebro).toContain("no es un bloqueo para atravesar con AIR: es una preocupación real y se maneja como objeción, con Feel–Felt–Found");
    expect(cerebro).not.toContain("intro o historia breve, si hay negativos comunes del territorio");
    expect(cerebro).not.toContain("Bloqueos → AIR, Ataque Preventivo");
  });
  it("la regla lo resume igual", () => {
    expect(reglas.find((r) => r.id === "blocks.ataque_preventivo").resumen).toContain("Nunca al llegar con un cliente nuevo");
  });
});

describe("certificación", () => {
  it("presentar sin conectar con el dolor es crítico en los exámenes 7.0 y 7.2", () => {
    for (const id of ["7.0", "7.2"]) {
      const f = nodos.find((n) => n.id === id).practice_script.failure_criteria.find((x: any) => x.id === "presentacion_generica");
      expect(f.severity, id).toBe("critical");
      expect(f.severity_override.default).toBe("major");
    }
  });
});

describe("FUJPIG tiene su quiz", () => {
  it("el 4.7 pregunta qué son, reconoce tres factores y marca la escasez inventada", () => {
    const q = quizzes.filter((x) => x.node_id === "4.7");
    expect(q.map((x) => x.regla_id)).toEqual(["impulse.curva", "impulse.efecto_jones", "impulse.miedo_perdida", "impulse.avaricia", "impulse.escasez_inventada"]);
  });
});
