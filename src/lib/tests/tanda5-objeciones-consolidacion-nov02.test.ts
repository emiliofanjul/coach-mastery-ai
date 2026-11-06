// Mensaje 120 (2-nov-2026) · Tandas 5 y 6: objeciones y consolidación.
// Decisiones de Emilio: después de la objeción va UNA bala y se cierra; la bala
// puede ser nueva, o una ya dicha si ahora se conecta con la objeción (repetirla
// tal cual es falla); discutir es contradecir o corregir; RRR repite con sus
// palabras; en el nodo que enseña una herramienta se usa esa; la otra venta
// escondida son los referidos y la siguiente visita, no venderle más hoy;
// explicar lo que sigue no es seguir vendiendo; referidos amarrados, no en frío.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const cards: any[] = JSON.parse(leer("docs/kb/cards_snapshot.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const regla = (id: string) => reglas.find((r) => r.id === id);
const ps = (id: string) => nodos.find((n) => n.id === id).practice_script;
const carta = (n: string, o: number) => cards.find((c) => c.node_id === n && c.card_order === o);
const TANDA = [
  "objection.discutir", "objection.rrr", "objection.rrr_sin_resume", "objection.fff", "objection.circulo_de_cierre",
  "objection.cierra_sin_bala", "objection.bala_repetida", "objection.air_a_objecion", "objection.vacia_el_cargador", "objection.se_desanima",
  "consolidation.rehash", "consolidation.sigue_vendiendo", "consolidation.misma_actitud", "consolidation.siguientes_pasos",
  "consolidation.sobre_celebra", "consolidation.referido_en_frio", "consolidation.salida_seca",
];

describe("Primero el Cerebro (v16)", () => {
  it("las decisiones están escritas", () => {
    expect(cerebro).toContain("4. **Re-impulsa con una bala** `CAMPO`: una sola, y cierras.");
    expect(cerebro).not.toContain("**Inserta 3 balas**");
    // Emilio, 6-nov (mensaje 138): la bala la escoge el vendedor; una ya dicha también se vale, aun tal cual.
    expect(cerebro).toContain("**La bala la escoges tú** `CAMPO`");
    expect(cerebro).toContain("**Qué es discutir** `CAMPO`");
    expect(cerebro).toContain("**¿Cuál usar?** `CAMPO`");
    expect(cerebro).toContain("**La otra venta escondida no es venderle más hoy** `CAMPO`");
    expect(cerebro).toContain("**Explicar lo que sigue no es seguir vendiendo** `CAMPO`");
    expect(cerebro).toContain("**Referidos** `CAMPO`");
  });
});

describe("Las reglas de las tandas son prueba y su cita está en el Cerebro", () => {
  for (const id of TANDA) {
    it(id, () => {
      expect(regla(id).resumen).toContain("LA PRUEBA");
      expect(cerebro).toContain(regla(id).cita_cerebro);
    });
  }
  it("lo que decidió Emilio, en las reglas", () => {
    expect(regla("objection.vacia_el_cargador").resumen).toContain("dos o más balas en la misma respuesta");
    expect(regla("objection.bala_repetida").resumen).toContain("también re-impulsa");
    expect(regla("objection.bala_repetida").tipo).toBe("principio");
    expect(regla("objection.circulo_de_cierre").resumen).toContain("una bala —la que escoja: una que no había dicho, o una ya dicha, aunque la repita tal cual—");
    expect(regla("consolidation.rehash").resumen).toContain("La otra venta no es venderle más hoy");
  });
});

describe("Guiones y tarjetas", () => {
  it("una sola bala, también en las tarjetas", () => {
    expect(carta("5.7", 4).body).toContain("PASO 4 — UNA BALA.");
    expect(carta("5.8", 2).body).toContain("4. UNA BALA");
    expect(carta("5.10", 3).title).toBe("La bala la escoges tú");
    for (const n of ["5.8", "5.12", "5.15"]) expect(ps(n).failure_criteria.find((f: any) => f.id === "vacia_el_cargador").description).toContain("dos o mas balas");
  });
});

describe("La red", () => {
  it("los 11 casos de las tandas 5 y 6 (desde la v3.32.0)", () => {
    for (const id of ["G93_una_bala_y_cierra", "G94_bala_ya_dicha_conectada", "G95_bala_repetida_tal_cual", "G96_apila_balas",
      "G97_discute_la_objecion", "G98_responde_sin_discutir", "G99_siguientes_pasos_claros", "G100_sigue_vendiendo",
      "G101_festeja_de_mas", "G102_referido_amarrado", "G103_referido_en_frio"])
      expect(harness.cases.find((c: any) => c.id === id), id).toBeDefined();
  });
});
