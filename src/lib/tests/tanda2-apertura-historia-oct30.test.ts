// Mensaje 112 (30-oct-2026) · Tanda 2: apertura, bloqueos, historia breve y relación.
// Decisiones de Emilio: «no le quito mucho» es hacerse menos y «de volada» no;
// la brevedad se mide por piezas (explicar el porqué es parte de la pieza); la
// pregunta cerrada es la que con su «no» da la salida; encogerse se ve en las
// palabras; en la práctica lo que se ve se imagina y solo no se vale
// contradecir lo que el cliente dijo (lo relativo no contradice); el monólogo
// no se mide en palabras; el interés genuino pregunta o comenta sobre eso.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const regla = (id: string) => reglas.find((r) => r.id === id);
const nodo = (id: string) => nodos.find((n) => n.id === id);
const caso = (id: string) => harness.cases.find((c: any) => c.id === id);
const TANDA2 = [
  "blocks.air", "blocks.air_sin_aceptar", "blocks.air_sin_resume", "blocks.ataque_en_disculpa", "blocks.discute_bloqueo",
  "blocks.dos_no_seguidos", "blocks.insistir_tras_dos_no", "blocks.mala_experiencia_al_llegar", "blocks.se_rinde_al_bloqueo",
  "monologo", "opening.curiosidad_abierta", "opening.energia_verbal", "opening.especificidad", "opening.estructura",
  "opening.gasman", "opening.halago_falso", "opening.ice_breaker", "opening.pide_permiso", "opening.pitch_prematuro",
  "opening.pregunta_cerrada", "opening.se_disculpa", "opening.sin_pregunta", "relationship.cpr",
  "relationship.familiaridad_excesiva", "relationship.forms", "relationship.interes_fingido", "story.cierra_con_afirmacion",
  "story.kill", "story.kill_curriculum", "story.kiss", "story.nunca_sale", "story.pregunta_despues",
  "story.quien_eres_por_que", "story.sale_sin_regresar",
];

describe("Primero el Cerebro (v12)", () => {
  it("las siete decisiones están escritas", () => {
    expect(cerebro).toContain("**Ir rápido no es hacerse menos** `CAMPO`");
    expect(cerebro).toContain("(*\"no le quito mucho\"*): le dices que sabes que estorbas.");
    expect(cerebro).toContain("**Cómo se mide** `CAMPO`: por piezas, no por frases.");
    expect(cerebro).toContain("Una frase que explica el porqué es parte de esa pieza.");
    expect(cerebro).toContain("**Pregunta cerrada** `CAMPO`: la que falla no es la de sí o no, sino la que con su «no» le da la salida");
    expect(cerebro).toContain("Encogerse en las palabras se ve así `CAMPO`");
    expect(cerebro).toContain("Lo relativo no es contradicción");
    expect(cerebro).toContain("**Monólogo** `CAMPO`: no se mide en palabras.");
    expect(cerebro).toContain("Un *\"qué bien\"* y cambiar de tema es interés de compromiso.");
  });
});

describe("Las 34 reglas de la tanda son prueba y su cita está en el Cerebro", () => {
  for (const id of TANDA2) {
    it(id, () => {
      expect(regla(id).resumen).toContain("LA PRUEBA");
      expect(cerebro).toContain(regla(id).cita_cerebro);
    });
  }
  it("lo que decidió Emilio, en las reglas", () => {
    expect(regla("opening.pregunta_cerrada").resumen).toContain("no es esta falla");
    expect(regla("story.kiss").resumen).toContain("Se mide por piezas, no por frases");
    expect(regla("story.kill").resumen).toContain("Una frase que explica el porqué es parte de esa pieza: no es de más.");
    expect(regla("opening.halago_falso").resumen).toContain("Lo relativo («mucha gente», «muy movido») no es contradicción.");
    expect(regla("opening.halago_falso").resumen).not.toMatch(/inventad/);
    expect(regla("monologo").resumen).toContain("No se mide en palabras");
    expect(regla("relationship.interes_fingido").resumen).toContain("sin una pregunta de seguimiento ni un comentario sobre eso");
  });
});

describe("Los guiones", () => {
  it("1.5 y 1.6 ya no piden «verdadero» ni «verificable»", () => {
    for (const id of ["1.5", "1.6"]) {
      const ps = nodo(id).practice_script;
      for (const c of [...ps.success_criteria, ...ps.failure_criteria]) expect(c.description).not.toMatch(/VERDADERO|verificable|inventad/);
    }
  });
  it("la pregunta cerrada es la que da la salida (1.2, 1.6)", () => {
    for (const id of ["1.2", "1.6"]) expect(nodo(id).practice_script.failure_criteria.find((f: any) => f.id === "pregunta_cerrada").description).toContain("cuyo no le da la salida");
  });
  it("la brevedad es por piezas (2.1, 2.10)", () => {
    for (const id of ["2.1", "2.10"]) {
      const ps = nodo(id).practice_script;
      expect(ps.success_criteria.find((c: any) => c.id === "story.brevedad").description).toContain("cada pieza una vez");
      expect(ps.success_criteria.find((c: any) => c.id === "story.brevedad").description).not.toContain("Dos o tres frases");
    }
  });
});

describe("La red", () => {
  it("los 9 casos de la tanda 2 (desde la v3.28.0)", () => {
    for (const id of ["G60_no_le_quito_mucho", "G61_de_volada_no_es_disculpa", "G62_si_o_no_que_invita", "G63_pregunta_que_da_salida", "G64_se_encoge", "G65_porque_es_parte_de_la_pieza", "G66_historia_con_curriculum", "G67_interes_de_compromiso", "G68_monologo"]) {
      expect(caso(id)).toBeDefined();
    }
    expect(caso("G60_no_le_quito_mucho").expected.must_flag).toEqual(["se_disculpa"]);
    expect(caso("G61_de_volada_no_es_disculpa").expected.must_not_flag).toContain("se_disculpa");
  });
  it("el P2_10 (la frase que explica el porqué) espera brevedad en cumple", () => {
    expect(caso("P2_10_perfecto").expected.niveles_esperados["story.brevedad"]).toBe("cumple");
  });
});
