// Mundo 2 en lenguaje Closer (15-oct-2026, Emilio): interés genuino en lo que le
// emociona al cliente, dos "no" seguidos en la puerta, y bloqueo u objeción según
// cuándo llega.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cards: any[] = JSON.parse(leer("docs/kb/cards_snapshot.json"));
const quizzes: any[] = JSON.parse(leer("docs/kb/quizzes_snapshot.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const m2 = cards.filter((c) => String(c.node_id).startsWith("2."));
const q2 = quizzes.filter((q) => String(q.node_id).startsWith("2."));
const texto = [...m2.map((c) => [c.title, c.body, c.flip_back_text].join(" ")), ...q2.map((q) => Object.values(q).join(" "))].join(" ");

describe("Mundo 2: interés genuino", () => {
  it("ya no manda a cambiar de tema si no te interesa", () => {
    expect(texto).not.toMatch(/no te interesa,? busca otro/i);
    expect(cerebro).not.toContain("busca otro de los cinco");
    expect(cerebro).toContain("siempre te puedes interesar en lo que a él le emociona");
  });
  it("la pregunta del futbol premia interesarte en lo que le gusta", () => {
    const q = q2.find((x) => x.node_id === "2.4" && x.question_order === 2);
    expect(q[`option_${q.correct_option.toLowerCase()}`]).toMatch(/qué le gusta de su equipo/);
  });
});

describe("Mundo 2: dos no seguidos en la puerta", () => {
  it("se enseña en el 2.7 y está en el Cerebro, distinto de los 3 del cierre", () => {
    expect(m2.find((c) => c.node_id === "2.7" && c.card_order === 5)?.title).toBe('Dos "no" seguidos');
    expect(cerebro).toContain("**Dos no seguidos en la puerta**");
    expect(cerebro).toContain("**Esta regla es del cierre.**");
  });
  it("quedar de regresar tras dos no seguidos no es la falla se_disculpa_o_se_va", () => {
    for (const id of ["2.7", "2.10"]) {
      const f = nodos.find((n) => n.id === id).practice_script.failure_criteria.find((x: any) => x.id === "se_disculpa_o_se_va");
      expect(f.description).toContain("dos no seguidos");
    }
  });
});

describe("Mundo 2: bloqueo u objeción depende de cuándo llega", () => {
  it("la pregunta de 'ya tengo proveedor' dice que llegó después de escucharte", () => {
    const q = q2.find((x) => x.node_id === "2.6" && x.question_order === 4);
    expect(q.question_text).toMatch(/Ya le explicaste/);
    expect(q.correct_option).toBe("B");
  });
  it("AIR se explica como Acepta, Ignora, Retoma", () => {
    expect(m2.find((c) => c.node_id === "2.6" && c.card_order === 5)?.body).toContain("R: Retoma.");
  });
});

describe("Mundo 2: lo que se califica se enseña", () => {
  it("el 2.2 califica ráfagas y preguntas de sí o no, y una tarjeta lo enseña", () => {
    const fallas = nodos.find((n) => n.id === "2.2").practice_script.failure_criteria.map((f: any) => f.id);
    expect(fallas).toEqual(expect.arrayContaining(["rafaga_de_preguntas", "solo_cerradas"]));
    expect(m2.find((c) => c.node_id === "2.2" && c.card_order === 4)?.title).toBe("Una pregunta a la vez");
  });
});
