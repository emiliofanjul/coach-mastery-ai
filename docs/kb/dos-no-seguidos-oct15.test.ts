// Nodos 2.7b «Dos No Seguidos» y 2.7c «Dos No en Vivo» (15-oct-2026, Emilio):
// si haces AIR y el cliente repite el bloqueo de inmediato, quedas de regresar
// o te despides con amabilidad. Todo lo que hace funcionar una práctica queda
// ligado: Cerebro, reglas, skill, node_skills, guion, tarjetas, quiz y red.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const J = (p: string) => JSON.parse(leer(p));
const nodos: any[] = J("docs/kb/nodos_snapshot.json");
const cards: any[] = J("docs/kb/cards_snapshot.json");
const quizzes: any[] = J("docs/kb/quizzes_snapshot.json");
const reglas: any[] = J("docs/kb/reglas.json");
const skills: any[] = J("docs/kb/skills_snapshot.json");
const nodeSkills: any[] = J("docs/kb/node_skills_snapshot.json");
const harness = J("supabase/functions/_shared/eval_harness_v1.json");
const cerebro = leer("docs/kb/cerebro_snapshot.md").replace(/\*/g, "");
const guion = nodos.find((n) => n.id === "2.7c")?.practice_script;

describe("Dos no seguidos: la doctrina", () => {
  it("las dos reglas citan el Cerebro vigente", () => {
    for (const id of ["blocks.dos_no_seguidos", "blocks.insistir_tras_dos_no"]) {
      const r = reglas.find((x) => x.id === id);
      expect(r, id).toBeTruthy();
      expect(cerebro).toContain(r.cita_cerebro);
    }
  });
  it("el skill es del Mundo 2 y está ligado a su regla", () => {
    const s = skills.find((x) => x.id === "blocks.dos_no_seguidos");
    expect(s).toMatchObject({ world_id_introduced: 2, status: "active", regla_id: "blocks.dos_no_seguidos", code: "S-072" });
  });
});

describe("Dos no seguidos: los nodos", () => {
  it("van justo después del 2.7: el 2.7b es teoría y el 2.7c práctica", () => {
    const ids = nodos.filter((n) => n.world_id === 2).map((n) => n.id);
    expect(ids.indexOf("2.7b")).toBe(ids.indexOf("2.7") + 1);
    expect(ids.indexOf("2.7c")).toBe(ids.indexOf("2.7") + 2);
    expect(nodos.find((n) => n.id === "2.7b")).toMatchObject({ node_type: "knowledge", practice_script: null });
    expect(nodos.find((n) => n.id === "2.7c")?.node_type).toBe("skill_drill");
  });
  it("el 2.7b tiene sus tarjetas y su quiz, cada pregunta con su regla", () => {
    expect(cards.filter((c) => c.node_id === "2.7b")).toHaveLength(4);
    const q = quizzes.filter((x) => x.node_id === "2.7b");
    expect(q).toHaveLength(3);
    for (const x of q) expect(reglas.some((r) => r.id === x.regla_id)).toBe(true);
  });
  it("el 2.7c tiene sus tarjetas y no tiene quiz (las tarjetas llevan directo a la práctica)", () => {
    expect(cards.filter((c) => c.node_id === "2.7c").map((c) => c.card_type)).toEqual(["concept", "bad_example", "good_example"]);
    expect(quizzes.filter((x) => x.node_id === "2.7c")).toHaveLength(0);
  });
  it("node_skills: el 2.7b introduce el skill y el 2.7c lo practica junto con AIR", () => {
    const filas = nodeSkills.filter((r) => ["2.7b", "2.7c"].includes(r.node_id)).map((r) => `${r.node_id}|${r.skill_id}|${r.relation}`);
    expect(filas.sort()).toEqual(["2.7b|blocks.dos_no_seguidos|introduces", "2.7c|blocks.air|practices", "2.7c|blocks.dos_no_seguidos|practices"]);
  });
});

describe("Dos no seguidos: la práctica por voz", () => {
  it("califica AIR (40%) y dos no seguidos (60%), cada uno con su regla", () => {
    expect(guion.success_criteria.map((c: any) => [c.id, c.weight, c.regla_id])).toEqual([
      ["blocks.air", 0.4, "blocks.air"],
      ["blocks.dos_no_seguidos", 0.6, "blocks.dos_no_seguidos"],
    ]);
  });
  it("insistir después del segundo no, discutir y rendirse al primero son críticos", () => {
    const sev = Object.fromEntries(guion.failure_criteria.map((f: any) => [f.id, f.severity]));
    expect(sev).toMatchObject({ insiste_tras_dos: "critical", discute_el_bloqueo: "critical", se_va_al_primero: "critical", se_va_con_disculpa: "minor" });
  });
  it("el cliente repite el bloqueo solo si el vendedor hizo AIR, y respeta la regla cero", () => {
    const p = guion.phases.you_do.prompt;
    expect(p.startsWith("REGLA NUMERO CERO")).toBe(true);
    expect(p).toContain("en tu SEGUNDA respuesta repites el bloqueo de inmediato");
    expect(guion.limits.min_turns_before_evaluation).toBe(3);
  });
  it("la red de pruebas tiene el caso perfecto, el que insiste y el que se va al primero", () => {
    const ids = harness.cases.filter((c: any) => c.node_id === "2.7c").map((c: any) => c.id);
    expect(ids).toEqual(["P2_7c_perfecto", "G35_insiste_tras_dos_no", "G36_se_va_al_primer_no"]);
    expect(harness.harness_version).toBe("v3.14.0");
  });
});
