import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Mensaje 136 (Emilio, 5-nov-2026): el mundo 5 se liga a la doctrina, paso por paso.
// · Aguantar el silencio después del cierre es lo correcto, pero no garantiza el sí: si el cliente dice
//   «déjeme pensarlo», no es castigo, es una objeción y se trabaja como objeción.
// · «Ahorita no puedo, hasta el otro mes que cobre» es una objeción: buscarle solución no es insistir,
//   siempre respetando los dos no.
// · El 5.4 enseñaba un «reencuadre» que no está en el Cerebro: ahora enseña el mapa (AIR, RRR, FFF).
// · FFF se practica completo: los cinco pasos.

const kb = (f: string) => readFileSync(resolve(__dirname, "../../../docs/kb", f), "utf8");
const cerebro = kb("cerebro_snapshot.md");
const reglas: any[] = JSON.parse(kb("reglas.json"));
const tarjetas: any[] = JSON.parse(kb("cards_snapshot.json"));
const quizzes: any[] = JSON.parse(kb("quizzes_snapshot.json"));
const regla = (id: string) => reglas.find((r) => r.id === id).resumen as string;
const t = (n: string, o: number) => tarjetas.find((x) => x.node_id === n && x.card_order === o);
const q = (n: string, o: number) => quizzes.find((x) => x.node_id === n && x.question_order === o);
const mundo5 = tarjetas.filter((x) => /^5\./.test(x.node_id));
const texto = (x: any) => `${x.title ?? ""} ${x.body ?? ""} ${x.flip_back_text ?? ""}`;

describe("aguantar el silencio no garantiza el sí", () => {
  it("el Cerebro, la regla y la tarjeta del 5.13 lo dicen igual", () => {
    expect(cerebro).toContain("**Aguantar no garantiza el sí** `CAMPO`");
    expect(cerebro).toContain("Eso no es un castigo por algo que hiciste mal: es una objeción, y se trabaja como objeción.");
    expect(regla("close.aguanta_silencio")).toContain("Aguantar no garantiza el sí");
    expect(t("5.13", 3).body).toContain("Si te pregunta algo, contéstale: eso no es llenar el silencio.");
    expect(t("5.13", 3).body).toContain("Es una objeción, y la trabajas como objeción.");
    expect(t("5.14", 3).body).toContain("En cuanto preguntas, te callas.");
  });
});

describe("«ahorita no puedo, hasta el otro mes» es una objeción", () => {
  it("el Cerebro y el 5.11 lo enseñan", () => {
    expect(cerebro).toContain("**Buscarle solución a una objeción no es insistir** `CAMPO`");
    expect(t("5.11", 2).body).toContain("ni \"ahorita no puedo, hasta el otro mes que cobre\". Son objeciones");
  });
  it("el quiz del 5.0 ya no dice que se acepta y se agenda la vuelta", () => {
    expect(q("5.0", 3).question_text).not.toContain("hasta el otro mes");
    expect(q("5.0", 3).option_b).toContain("Pedir la decisión");
    expect(q("5.11", 2).correct_option).toBe("B");
    expect(q("5.11", 2).option_b).toContain("Una objeción");
  });
});

describe("el 5.4 se apega a la doctrina", () => {
  it("sin el «reencuadre» inventado", () => {
    expect(mundo5.map(texto).join(" ")).not.toMatch(/reencuadre/i);
    expect(quizzes.filter((x) => /^5\./.test(x.node_id)).map((x) => JSON.stringify(x)).join(" ")).not.toMatch(/reencuadre/i);
  });
  it("«lo voy a pensar» es objeción, no despedida", () => {
    expect(texto(t("5.4", 1))).not.toMatch(/ah[ií] lo pensamos/i);
    expect(t("5.4", 3).title).toBe("\"Lo voy a pensar\" no es un no.");
    expect(t("5.4", 4).body).toContain("→ RRR");
    expect(t("5.4", 4).body).toContain("→ FFF");
    expect(q("5.4", 2).option_b).toBe("Una objeción: se trabaja como objeción.");
  });
});

describe("FFF completo: los cinco pasos", () => {
  it("el 5.8 ya no deja los dos últimos para después", () => {
    expect(t("5.8", 2).body).toContain("5. CIERRA CON ACCIÓN");
    expect(t("5.8", 2).body).toContain("Los cinco, completos.");
    expect(texto(t("5.8", 2))).not.toMatch(/m[aá]s adelante/i);
    expect(t("5.8", 1).body).toContain("Aquí va FFF completo, los cinco pasos.");
  });
});

describe("las lecciones del mundo 5 tienen su quiz", () => {
  it("5.2, 5.5, 5.7, 5.9 y 5.11: tres preguntas cada uno, con regla que existe", () => {
    for (const n of ["5.2", "5.5", "5.7", "5.9", "5.11"]) {
      const qs = quizzes.filter((x) => x.node_id === n);
      expect(qs).toHaveLength(3);
      for (const x of qs) expect(reglas.some((r) => r.id === x.regla_id)).toBe(true);
    }
  });
});

describe("detalles del mundo 5", () => {
  it("la señal más fuerte es la del Cerebro, y el jefe es el quinto", () => {
    expect(t("5.2", 3).body).toContain("\"¿Y cuándo me lo entregan?\" es de las señales más fuertes que hay.");
    expect(t("5.15", 1).title).toBe("Reto final del Mundo 5.");
    expect(t("5.9", 4).body).not.toContain("el siguiente nodo");
  });
  it("con acentos", () => {
    const todo = mundo5.map(texto).join(" ");
    for (const malo of ["senales", "Tambien", "objecion", "circulo", "accion", "respiracion", "dejeme", "Fijate", "facil", "Asi", "Aqui"]) {
      expect(todo).not.toMatch(new RegExp(`(^|[^\\p{L}])${malo}($|[^\\p{L}])`, "u"));
    }
  });
});
