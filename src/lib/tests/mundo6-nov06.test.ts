import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Mensaje 142 (Emilio, 6-nov-2026): el mundo 6 (Consolidación) ligado a la doctrina.
// · No se anuncia por adelantado qué pasa si algo falla (es el plan B del 4.4). Lo que da tranquilidad es
//   acompañar: «todo va a salir bien; si cualquier cosa no sale como esperaba, me marca».
// · Lo que sí controlas (la entrega, la atención, resolver cualquier problema) sí se garantiza; lo que no, no.
// · Preguntar si le quedó alguna duda es parte de la consolidación; aunque diga que no, se le deja claro que
//   puede contactar al vendedor en cualquier momento.
// · Pedir referidos es bueno, amarrados a lo que el cliente dijo. No son obligatorios.
// · Nunca se califica lo que el vendedor no puede saber: lo personal y el conocido los dice el cliente en la práctica.

const leer = (p: string) => readFileSync(resolve(__dirname, "../../..", p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const cards: any[] = JSON.parse(leer("docs/kb/cards_snapshot.json"));
const quizzes: any[] = JSON.parse(leer("docs/kb/quizzes_snapshot.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const red = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const regla = (id: string) => reglas.find((r) => r.id === id).resumen as string;
const carta = (n: string, o: number) => cards.find((c) => c.node_id === n && c.card_order === o);
const ps = (id: string) => nodos.find((n) => n.id === id).practice_script;
const fallas = (id: string) => ps(id).failure_criteria.map((f: any) => f.id);
const caso = (id: string) => red.cases.find((c: any) => c.id === id);
const texto = (c: any) => `${c.title ?? ""} ${c.body ?? ""} ${c.flip_back_text ?? ""}`;

describe("el Cerebro y las reglas", () => {
  it("lo que decidió Emilio está escrito", () => {
    expect(cerebro).toContain("**Pregúntale si le quedó alguna duda** `CAMPO`");
    expect(cerebro).toContain("**Acompañar no es ofrecer un plan B** `CAMPO`");
    expect(cerebro).toContain("**Referidos** `CAMPO`: no son obligatorios, pero pedirlos es bueno.");
    expect(regla("consolidation.siguientes_pasos")).toContain("Preguntarle si le quedó alguna duda");
    expect(regla("consolidation.rehash")).toContain("pedirlo amarrado suma, no pedirlo no resta");
    expect(regla("present.plan_b")).toContain("Acompañar no es esto");
  });
  it("lo que sí controlas, sí se garantiza (Emilio, 6-nov)", () => {
    expect(cerebro).toContain("**Lo que sí controlas, sí se garantiza** `CAMPO`");
    expect(cerebro).toContain("2. **No garantizar lo que no controlas.**");
    expect(regla("present.garantiza")).toContain("Garantizar lo que sí controla");
    expect(cerebro).toContain("*\"todo va a salir bien; y si cualquier cosa no sale como esperaba, me marca o me escribe en cualquier momento\"*");
  });
});

describe("las tarjetas del mundo 6", () => {
  it("la consolidación es el paso 6", () => {
    expect(carta("6.0", 4).body).toContain("la venta se cierra en el paso 5, pero se GANA en el 6");
    expect(cards.filter((c) => c.node_id === "6.0").map(texto).join(" ")).not.toMatch(/paso 5 y el buen paso 5|MAL paso 5/);
  });
  it("ya no enseñan a anunciar qué pasa si algo falla", () => {
    const todo = cards.filter((c) => /^6\./.test(c.node_id)).map(texto).join(" ");
    expect(todo).not.toContain("a quién le habla si algo falla");
    expect(todo).not.toContain("el plan B si algo falla");
    expect(carta("6.2", 2).body).toContain("NO anuncies qué pasa si algo falla");
  });
  it("sin cifras inventadas, con el jefe bien contado y con acentos", () => {
    expect(carta("6.3", 3).body).not.toContain("seis meses");
    expect(carta("6.4", 1).title).toBe("El sexto Boss.");
    for (const n of ["6.1", "4.4"]) for (const c of cards.filter((x) => x.node_id === n))
      expect(texto(c)).not.toMatch(/(^|[^\p{L}])(despues|tambien|decision|conversacion|tecnica|automatico|ahi|si,)($|[^\p{L}])/u);
  });
  it("la 6.1 tiene su quiz", () => {
    expect(quizzes.filter((q) => q.node_id === "6.1")).toHaveLength(3);
  });
});

describe("las prácticas", () => {
  it("6.2: sella, pregunta si quedó alguna duda, acompaña y no anuncia el plan B", () => {
    expect(fallas("6.2")).toContain("anuncia_plan_b");
    expect(ps("6.2").phases.i_do.first_message).toContain("¿Le quedó alguna duda?");
    expect(ps("6.2").phases.i_do.first_message).not.toContain("no ha llegado el camión");
    expect(ps("6.2").failure_criteria.find((f: any) => f.id === "celebra_y_corre").regla_id).toBe("consolidation.siguientes_pasos");
  });
  it("6.2 y 6.3: lo personal y el conocido los dice el cliente en esta misma práctica", () => {
    expect(ps("6.2").phases.you_do.prompt).not.toContain("ya conocida en la conversación");
    expect(ps("6.2").phases.you_do.prompt).toContain("Es lo único personal que el vendedor sabe de ti.");
    expect(ps("6.3").phases.you_do.prompt).not.toContain("dala por ocurrida");
    expect(ps("6.3").phases.you_do.prompt).toContain("las mencionas TÚ de pasada en tus dos primeras líneas");
  });
  it("6.3: el referido no es obligatorio", () => {
    expect(ps("6.3").phases.you_do.objective).toContain("El scope se cubre cuando la siguiente visita quedó acordada.");
    expect(caso("G116_sin_referido").expected.must_not_flag).toContain("referido_en_frio");
  });
  it("6.4: el jefe del mundo 6", () => {
    expect(ps("6.4").notes).toContain("BOSS del Mundo 6");
    expect(ps("6.4").failure_criteria.find((f: any) => f.id === "celebra_y_corre").regla_id).toBe("consolidation.siguientes_pasos");
  });
});

describe("la red cubre todas las prácticas del mundo 6", () => {
  it("cada práctica tiene una ejecución perfecta", () => {
    for (const id of ["6.2", "6.3", "6.4"]) expect(red.cases.some((c: any) => c.node_id === id && c.tipo === "perfecto"), id).toBe(true);
    expect(caso("G115_anuncia_plan_b").expected.must_flag).toEqual(["anuncia_plan_b"]);
  });
});
