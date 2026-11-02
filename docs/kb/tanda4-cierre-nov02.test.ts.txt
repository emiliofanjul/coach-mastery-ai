// Mensaje 119 (2-nov-2026) · Tanda 4: cierre.
// Decisiones de Emilio: asumir es proponer y dejar elegir, presionar es dar por
// hecho lo que no aceptó; llenar el silencio es retractarse, suavizar, agregar o
// contestarse solo (contestar una pregunta del cliente no lo es); ante «¿y cuándo
// me lo entregan?» se contesta y se cierra en el mismo turno; «¿se lo mando?» y
// «¿le aparto 10 cajas?» son mal cierre, igual de graves; «lo voy a pensar» es
// objeción; dos «no» seguidos y te vas, también en el cierre; el descuento se vale
// si ya era de la oferta o es a cambio de algo; la minimización del dolor no se
// discute: se guarda para la presentación.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const cards: any[] = JSON.parse(leer("docs/kb/cards_snapshot.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const voz = leer("supabase/functions/closer-voice/index.ts");
const regla = (id: string) => reglas.find((r) => r.id === id);
const ps = (id: string) => nodos.find((n) => n.id === id).practice_script;
const carta = (n: string, o: number) => cards.find((c) => c.node_id === n && c.card_order === o);
const TANDA4 = [
  "close_with_action", "close.devuelve_el_volante", "close.asumir_venta", "close.mal_cierre", "close.alternativa",
  "close.aguanta_silencio", "close.llena_el_silencio", "close.fishbbod", "close.sigue_presentando", "close.cierra_solo_incremento",
  "close.reabre_pedido_base", "close.descuento_de_panico", "close.persigue", "close.asume_con_presion", "close.pide_aprobacion",
  "flow.dos_no_seguidos", "objections.regla_de_los_no", "objection.regla_de_los_no",
];

describe("Primero el Cerebro (v15)", () => {
  it("las decisiones están escritas", () => {
    expect(cerebro).toContain("**Pedir la compra con un sí o no también invita al no** `CAMPO`");
    expect(cerebro).toContain("**Asumir no es presionar** `CAMPO`");
    expect(cerebro).toContain("Si el cliente te pregunta algo, contestarle no es llenar el silencio.");
    expect(cerebro).toContain("**Contesta y cierra** `CAMPO`");
    expect(cerebro).toContain("**Cuándo sí se vale un descuento** `CAMPO`");
    expect(cerebro).toContain("**«Lo voy a pensar» no es un «no»** `CAMPO`");
    expect(cerebro).toContain("no se lo discutas `CAMPO`: guárdalo");
  });
  it("ya no hay tres «no» en el cierre", () => {
    expect(cerebro).not.toMatch(/3 no seguidos|Los 3 No|son tres \(ver/);
    expect(voz).not.toMatch(/son TRES|no le des el tercero|o tres en el cierre/);
  });
});

describe("Las reglas de la tanda son prueba y su cita está en el Cerebro", () => {
  for (const id of TANDA4) {
    it(id, () => {
      expect(regla(id).resumen).toContain("LA PRUEBA");
      expect(cerebro).toContain(regla(id).cita_cerebro);
    });
  }
  it("lo que decidió Emilio, en las reglas", () => {
    expect(regla("close.mal_cierre").resumen).toContain("«¿se lo mando?», «¿le aparto 10 cajas?». Es igual de grave.");
    expect(regla("close.mal_cierre").severidad_sugerida).toBe("critical");
    expect(regla("close.asume_con_presion").resumen).toContain("el cliente dice «déjeme ver» y él contesta «ya se lo apunté»");
    expect(regla("close.llena_el_silencio").resumen).toContain("Si el cliente le preguntó algo, contestarle no es esto.");
    expect(regla("close.descuento_de_panico").resumen).toContain("o el que se da a cambio de algo");
    expect(regla("flow.dos_no_seguidos").resumen).toContain("«Lo voy a pensar» es una objeción, no un «no».");
  });
});

describe("Los guiones y las tarjetas", () => {
  it("el 5.15 ya no cobra «tragarse la minimización»", () => {
    expect(ps("5.15").failure_criteria.some((f: any) => f.id === "traga_la_minimizacion")).toBe(false);
    expect(ps("5.15").phases.you_do.prompt).toContain("Si lo deja pasar y sigue, está bien: no se lo pidas.");
  });
  it("«¿se lo mando?» es mal cierre donde se cierra, y se enseña en el 5.0", () => {
    for (const [n, f] of [["4.11", "abre_puerta_al_no"], ["5.1", "abre_puerta_al_no"], ["5.14", "pregunta_si_quiere"], ["7.3", "pregunta_si_quiere"]])
      expect(ps(n).failure_criteria.find((x: any) => x.id === f).description).toContain("se lo mando?");
    expect(carta("5.0", 2).body).toContain("\"¿Se lo mando?\"");
  });
  it("el 5.11 enseña dos «no»", () => {
    expect(carta("5.11", 2).title).toBe("La regla: dos no SEGUIDOS y te vas");
    expect(carta("5.11", 3).body).toContain("Cuando llegan los dos seguidos");
  });
});

describe("La red", () => {
  it("los 9 casos de la tanda 4 (desde la v3.31.0)", () => {
    for (const id of ["G84_presiona_no_asume", "G85_alternativa_asumida", "G86_se_lo_mando", "G87_senal_contesta_y_cierra",
      "G88_senal_un_beneficio_mas", "G89_llena_el_silencio", "G90_contestar_no_es_llenar", "G91_descuento_a_cambio", "G92_descuento_de_panico"])
      expect(harness.cases.find((c: any) => c.id === id), id).toBeDefined();
  });
});
