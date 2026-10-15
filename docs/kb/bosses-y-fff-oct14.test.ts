// Mensaje 80 (14-oct-2026, decisiones de Emilio): lo que califica cada boss,
// el FFF con su propia regla, y el 2.8 como "La Mala Experiencia al Llegar".
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => JSON.parse(readFileSync(join(process.cwd(), p), "utf8"));
const nodos: any[] = leer("docs/kb/nodos_snapshot.json");
const skills: any[] = leer("docs/kb/skills_snapshot.json");
const nodeSkills: any[] = leer("docs/kb/node_skills_snapshot.json");
const cards: any[] = leer("docs/kb/cards_snapshot.json");
const reglas: any[] = leer("docs/kb/reglas.json");

const nodo = (id: string) => nodos.find((n) => n.id === id);
const crit = (id: string) => Object.fromEntries(nodo(id).practice_script.success_criteria.map((c: any) => [c.id, c]));
const falla = (id: string, f: string) => nodo(id).practice_script.failure_criteria.find((x: any) => x.id === f);
const skill = (id: string) => skills.find((s) => s.id === id);

describe("El FFF se llama FFF y se mide con su regla", () => {
  it("el skill que antes se llamaba reencuadre apunta a la regla del FFF, no a la de RRR", () => {
    expect(skill("objections.reframe").name).toBe("FFF — Feel, Felt, Found");
    expect(skill("objections.reframe").regla_id).toBe("objection.fff");
  });
  it("ningún criterio de FFF quedó con otra regla", () => {
    const malos = nodos.flatMap((n) => (n.practice_script?.success_criteria ?? [])
      .filter((c: any) => c.id === "objections.reframe" && c.regla_id !== "objection.fff").map(() => n.id));
    expect(malos).toEqual([]);
  });
  it("ningún boss califica 'sin defensa' como criterio: ya es falla crítica", () => {
    for (const id of ["5.12", "5.15"]) expect(crit(id)["objections.no_defensivo"]).toBeUndefined();
  });
});

describe("Lo que califica cada boss", () => {
  it("4.16 La Presentación: factores de impulso, triple desglose, beneficio-no-característica, y CPR se queda en 15", () => {
    const c = crit("4.16");
    expect(c["impulse.factores_impulso"].weight).toBe(0.25);
    expect(c["presentation.price_breakdown"].description).toContain("nunca se inventa un descuento");
    expect(c["presentation.beneficio_no_caracteristica"]).toBeDefined();
    expect(c["relationship.cpr"].weight).toBe(0.15);
    expect(falla("4.16", "impulso_falso").severity).toBe("critical");
    expect(nodo("4.16").practice_script.phases.you_do.prompt).toContain("(6) PRECIO");
  });
  it("5.15 El Cierre: RRR para la objeción menor, FFF para la de confianza, y el círculo", () => {
    const c = crit("5.15");
    for (const id of ["objections.rrr_objeciones", "objections.reframe", "objections.circulo_cierre", "objections.bullet_theory"]) expect(c[id]).toBeDefined();
    expect(nodo("5.15").practice_script.phases.you_do.prompt).toContain("Se atiende con RRR");
  });
  it("7.0 examina AIR y devolver la palabra / seguir avanzando, y presentar genérico sigue siendo crítico", () => {
    const c = crit("7.0");
    expect(c["blocks.air"].description).toContain("no_aplica");
    expect(c["flow.close_with_action"]).toBeDefined();
    expect(falla("7.0", "presentacion_generica").severity).toBe("critical");
  });
  it("2.10 califica devolver la palabra", () => {
    expect(crit("2.10")["story.relevancia_cliente"].regla_id).toBe("story.pregunta_despues");
  });
  it("ningún guion pasa del límite de criterios (8 en boss, 6 en los demás) y los pesos suman 1", () => {
    const malos: string[] = [];
    for (const n of nodos) {
      const sc = n.practice_script?.success_criteria;
      if (!sc) continue;
      const max = n.node_type === "boss" ? 8 : 6;
      if (sc.length > max) malos.push(`${n.id}: ${sc.length} criterios`);
      const suma = sc.reduce((a: number, c: any) => a + c.weight, 0);
      if (Math.abs(suma - 1) > 1e-9) malos.push(`${n.id}: pesos suman ${suma}`);
    }
    expect(malos).toEqual([]);
  });
  it("cada criterio tiene su fila en node_skills (el trigger de la base lo exige)", () => {
    const hay = new Set(nodeSkills.map((x) => `${x.node_id}/${x.skill_id}`));
    const faltan = nodos.flatMap((n) => (n.practice_script?.success_criteria ?? [])
      .map((c: any) => `${n.id}/${c.id}`).filter((k: string) => !hay.has(k)));
    expect(faltan).toEqual([]);
  });
});

describe("2.8 — La Mala Experiencia al Llegar", () => {
  const ps = nodo("2.8").practice_script;
  it("ya no enseña a abrir con negativos: califica recibir la mala experiencia como objeción", () => {
    expect(nodo("2.8").name).toBe("La Mala Experiencia al Llegar");
    expect(ps.success_criteria.map((c: any) => c.id)).toEqual(["blocks.mala_experiencia"]);
    expect(JSON.stringify(ps.success_criteria)).not.toContain("pre_emptive_strike");
    expect(ps.phases.i_do.first_message).toContain("¿Con quién está trabajando ahorita?");
  });
  it("el skill vive en La Historia Breve y su regla cita el Cerebro", () => {
    expect(skill("blocks.mala_experiencia").world_id_introduced).toBe(2);
    expect(reglas.find((r) => r.id === "blocks.mala_experiencia_al_llegar").cita_cerebro).toContain("no es un bloqueo");
  });
  it("inventar el cambio es crítico; ignorarla o defenderse son espejo del criterio", () => {
    expect(falla("2.8", "cambio_inventado").severity).toBe("critical");
    expect(falla("2.8", "la_trata_como_bloqueo").espejo_de).toBe("blocks.mala_experiencia");
    expect(falla("2.8", "se_defiende").espejo_de).toBe("blocks.mala_experiencia");
  });
  it("las tres tarjetas cuentan la doctrina nueva", () => {
    const t = cards.filter((c) => c.node_id === "2.8").sort((a, b) => a.card_order - b.card_order).map((c) => c.title);
    // Títulos en lenguaje Closer desde el mensaje 89 (15-oct-2026).
    expect(t).toEqual(["Cuando el cliente ya trae una mala experiencia", "Escúchalo, dile a qué vienes y pregunta", "Tres errores que debes evitar"]);
  });
});
