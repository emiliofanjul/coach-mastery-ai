// Mensaje 117 (2-nov-2026) · Tanda 3: descubrimiento.
// Decisiones de Emilio (31-oct y 2-nov): escuchar y subir de capa son dos reglas;
// no se cuentan territorios; devolver el dolor no es obligatorio (se usa en la
// presentación); la cerrada en capa 3 falla solo si todas lo son y el cliente
// deja de contar; nombrar una familia para preguntar no es recetar; dar opciones
// no es interrogatorio y varias preguntas en un turno ya es monólogo; el semáforo
// se mide como cliente y no como persona (ya no hay «verde amarrado»); preguntar,
// el efecto Jones y decir lo que ve no es inventar un hueco; nunca se pide la
// opinión del precio, y primero se enseña (tarjeta 3.2 #9).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const cards: any[] = JSON.parse(leer("docs/kb/cards_snapshot.json"));
const skills: any[] = JSON.parse(leer("docs/kb/skills_snapshot.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const regla = (id: string) => reglas.find((r) => r.id === id);
const ps = (id: string) => nodos.find((n) => n.id === id).practice_script;
const crit = (n: string, id: string) => [...ps(n).success_criteria, ...ps(n).failure_criteria].find((c: any) => c.id === id);
const carta = (n: string, o: number) => cards.find((c) => c.node_id === n && c.card_order === o);
const TANDA3 = [
  "discovery.escalera_capas", "discovery.escucha", "discovery.pregunta_especifica", "discovery.suggestive_language", "discovery.barrido",
  "discovery.dolor_directo", "discovery.confirmacion_con_sus_palabras", "discovery.fabrica_dolor", "discovery.rojo_vs_amarrado",
  "discovery.bordes_restriccion", "discovery.presiona_compromiso", "discovery.qtqp", "discovery.lee_el_lugar", "discovery.hueco_inventado",
  "discovery.rojo_insistir", "discovery.suelta_amarrado", "discovery.interrogatorio", "discovery.solo_cerradas", "discovery.lectura_falsa",
  "discovery.receta_sin_diagnostico", "discovery.opinion_de_precio", "discovery.hueco", "discovery.rrr", "develop.visita_tramite",
];

describe("Primero el Cerebro (v13)", () => {
  it("las decisiones están escritas", () => {
    expect(cerebro).toContain("**Devolverlo en ese momento no es obligatorio** `CAMPO`");
    expect(cerebro).toContain("**Tu siguiente pregunta nace de lo que él dijo** `CAMPO`");
    expect(cerebro).toContain("Está mal cuando todas son de sí o no y el cliente deja de contar.");
    expect(cerebro).toContain("**No se cuentan territorios** `CAMPO`");
    expect(cerebro).toContain("**Qué es recetar** `CAMPO`");
    expect(cerebro).toContain("Dar opciones después de preguntar");
    expect(cerebro).toContain("**Qué sí se vale y qué es inventar** `CAMPO`");
    expect(cerebro).toContain("**Puede ser verde como persona y rojo como cliente.**");
    expect(cerebro).toContain("tu tiempo de trabajo es para quien puede comprar");
  });
  it("ya no existe el «verde amarrado»", () => {
    expect(cerebro).not.toMatch(/verde amarrado|AMARRADO TEMPORALMENTE/);
  });
});

describe("Las reglas de la tanda son prueba y su cita está en el Cerebro", () => {
  for (const id of TANDA3) {
    it(id, () => {
      expect(regla(id).resumen).toContain("LA PRUEBA");
      expect(cerebro).toContain(regla(id).cita_cerebro);
    });
  }
  it("escuchar es su propia regla, y sus criterios apuntan a ella", () => {
    expect(regla("discovery.escucha").severidad_sugerida).toBe("major");
    for (const n of ["3.1", "3.3", "3.10"]) expect(crit(n, "discovery.escucha_activa").regla_id).toBe("discovery.escucha");
    expect(skills.find((s) => s.id === "discovery.escucha_activa").regla_id).toBe("discovery.escucha");
  });
  it("lo que decidió Emilio, en las reglas", () => {
    expect(regla("discovery.escalera_capas").resumen).toContain("No se cuentan territorios");
    expect(regla("discovery.escalera_capas").resumen).toContain("Devolverle el dolor con sus palabras no se pide aquí");
    expect(regla("discovery.interrogatorio").resumen).toContain("Varias preguntas en un mismo turno son monólogo, no esto");
    expect(regla("discovery.receta_sin_diagnostico").resumen).toContain("no es recetar: es buscar");
    expect(regla("discovery.hueco_inventado").resumen).toContain("Preguntar nunca es inventar.");
    expect(regla("discovery.rojo_vs_amarrado").resumen).toContain("puede ser verde como persona y rojo como cliente");
  });
});

describe("Los guiones", () => {
  it("el dolor del descubrimiento lo mide la escalera, sin pedir que se devuelva", () => {
    for (const n of ["3.2", "3.10", "5.15", "7.0", "7.4"]) expect(crit(n, "discovery.dolor_real").regla_id).toBe("discovery.escalera_capas");
    for (const n of ["3.2", "3.10", "7.0"]) expect(crit(n, "discovery.dolor_real").description).toMatch(/no se pide/);
  });
  it("la opinión del precio se califica donde se enseña (3.2) y en su jefe (3.10)", () => {
    for (const n of ["3.2", "3.10"]) expect(crit(n, "pide_opinion_precio")).toMatchObject({ regla_id: "discovery.opinion_de_precio", severity: "critical" });
    expect(carta("3.2", 9).body).toContain("¿cómo ve los precios?");
  });
  it("en el examen 7.1, el contrato cubre todo: hoy no hay nada que comprar", () => {
    expect(ps("7.1").phases.you_do.prompt).toContain("que cubre TODO lo que vende el vendedor");
  });
});

describe("Las tarjetas ya no piden confirmar el dolor", () => {
  it("3.0 #6 y 3.10 #1", () => {
    expect(carta("3.0", 6).body).not.toContain("Hasta que el cliente dice que si");
    expect(carta("3.10", 1).body).not.toContain("Confírmalo con sus palabras");
  });
});

describe("La red", () => {
  it("los 14 casos de la tanda 3 (desde la v3.30.0)", () => {
    const ids = ["G70_dolor_sin_devolverlo", "G71_opinion_del_precio", "G72_precio_por_hechos", "G73_nombrar_familia_no_es_receta",
      "G74_receta_en_diagnostico", "G75_opciones_no_es_interrogatorio", "G76_interrogatorio", "G77_cerradas_en_capa_tres",
      "G78_una_cerrada_suelta", "G79_hueco_con_jones", "G80_hueco_que_contradice", "G81_rojo_encantador_sale_bien",
      "G82_contrato_que_deja_algo", "G83_se_va_sin_averiguar"];
    for (const id of ids) expect(harness.cases.find((c: any) => c.id === id), id).toBeDefined();
  });
});

describe("Mensaje 118: decir lo que ve no se vale si contradice al cliente (G80)", () => {
  it("en el Cerebro y en la regla, la contradicción va primero", () => {
    expect(cerebro).toContain("siempre que no contradiga lo que el cliente ya dijo: si te dijo que está bien surtido, «se ve que le hace falta» es inventar.");
    const r = regla("discovery.hueco_inventado").resumen;
    expect(r).toContain("LA PRUEBA, en orden. (1) ¿El vendedor contradice lo que el cliente ya dijo");
    expect(r).toContain("Entonces es inventar, aunque diga que lo ve.");
    expect(r.indexOf("(1)")).toBeLessThan(r.indexOf("(2)"));
  });
});
