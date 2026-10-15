// Mundo 1 en lenguaje Closer (15-oct-2026, Emilio): fácil, directo, claro, positivo,
// y solo con lo que dice la doctrina.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => JSON.parse(readFileSync(join(process.cwd(), p), "utf8"));
const cards: any[] = leer("docs/kb/cards_snapshot.json");
const quizzes: any[] = leer("docs/kb/quizzes_snapshot.json");
const nodos: any[] = leer("docs/kb/nodos_snapshot.json");
const m1 = cards.filter((c) => String(c.node_id).startsWith("1."));
const texto = (c: any) => [c.title, c.body, c.flip_back_text].filter(Boolean).join(" ");
const todo = [...m1.map(texto), ...quizzes.filter((q) => String(q.node_id).startsWith("1.")).map((q) => Object.values(q).join(" "))].join(" ");

describe("Mundo 1: lo que ya no dice", () => {
  it("nada de 'derecho' a estar ahí o a seguir hablando", () => expect(todo).not.toMatch(/derecho a/i));
  it("el 10% no es la parte de lo que comunicas con palabras (no está en el Cerebro)", () => expect(todo).not.toMatch(/10% de lo que|décima parte|decima parte/i));
  it("ni promesas falsas ni pedir la decisión", () => {
    expect(todo).not.toMatch(/nadie se pone a la defensiva/i);
    expect(todo).not.toMatch(/le pides la decisi/i);
  });
});

describe("Mundo 1: lo que se califica se enseña antes", () => {
  it("la regla del 10% se enseña en el 1.1 y se califica en el 1.4 y el 1.6", () => {
    expect(m1.some((c) => c.node_id === "1.1" && /regla del 10%/i.test(texto(c)))).toBe(true);
    for (const id of ["1.4", "1.6"]) {
      const s = nodos.find((n) => n.id === id).practice_script.success_criteria.map((x: any) => x.id);
      expect(s).toContain("mindset.regla_10_por_ciento");
    }
  });
  it("el 1.0 explica que los pasos sirven con clientes nuevos y de años", () => {
    const c = m1.find((x) => x.node_id === "1.0" && x.card_order === 7);
    expect(c?.title).toBe("Sirve con cualquier cliente");
    expect(c?.body).toMatch(/desde hace años/);
  });
  it("el cierre se da por hecho", () => {
    expect(m1.find((x) => x.node_id === "1.0" && x.card_order === 2)?.body).toContain("Tú no se la pides: la das por hecha.");
  });
});
