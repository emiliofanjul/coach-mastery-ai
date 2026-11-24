// Mensaje 166 (18-nov-2026) · La doctrina de las balas, de raíz.
// Emilio: ante una objeción, una o dos balas, a veces tres, que respondan a lo que
// dijo el cliente. «No está mal soltar 1 o 2 balas seguidas, incluso se pueden soltar
// 3 a veces». Lo que importa es cuidarlas para no quedarse sin ellas. Vaciar el
// cargador es soltar balas que no apuntan, soltar de jalón todo lo que trae, o
// gastarse tantas que en la siguiente objeción ya no tiene con qué. Cuatro o más en
// una respuesta es señal de alerta, no falla automática. Quedarse desarmado solo se
// ve donde hay una objeción después.
// Mensaje 167: «lo que encontraron» por sí solo no es la bala; si ahí nombra algo concreto suyo
// (producto, servicio o precio), sí lo es; un precio con su motivo es bala aunque ya se haya dicho;
// y los criterios no castigan el número.
// Primero el Cerebro; de ahí la regla, las tarjetas, los guiones y la red.
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
const caso = (id: string) => harness.cases.find((c: any) => c.id === id);

describe("Primero el Cerebro", () => {
  it("el paso 4 del FFF dice una o dos, a veces tres, que apunten, y define vaciar el cargador", () => {
    expect(cerebro).toContain("4. **Re-impulsa con la bala o las balas que respondan a lo que te dijo** `CAMPO`, y cierras. Una o dos es lo normal; a veces tres.");
    expect(cerebro).toContain("Cada bala tiene que apuntar a algo que el cliente dijo: su objeción, su dolor, su situación.");
    expect(cerebro).toContain("Vaciar el cargador es soltar balas que no apuntan a nada de lo que dijo, soltar de jalón todo lo que traes, o gastarte tantas que, cuando llega la siguiente objeción, ya no tienes con qué subir el impulso.");
    expect(cerebro).not.toContain("Tres de golpe sería vaciar el cargador");
    expect(cerebro).not.toContain("una sola, y cierras");
  });
  it("dice qué es una bala y por qué les decimos balas", () => {
    expect(cerebro).toContain("**Las balas son TUYAS.** Son hechos positivos y concretos");
    expect(cerebro).toContain("**Por qué les decimos balas** `CAMPO`");
  });
  it("cómo se sueltan ante una objeción: una o dos, a veces tres", () => {
    expect(cerebro).toContain("ante una objeción se re-impulsa con una o dos —a veces tres— que respondan a lo que te dijo.");
  });
});

describe("La regla es prueba, y su cita está en el Cerebro", () => {
  const r = () => regla("objection.vacia_el_cargador");
  it("tres partes, y ninguna cuenta balas", () => {
    expect(r().resumen).toContain("LA PRUEBA");
    expect(r().resumen).toContain("(1) ¿esta bala apunta a algo que el cliente dijo");
    expect(r().resumen).toContain("(2) ¿El vendedor le suelta de jalón una lista de todo lo que trae");
    // Mensaje 168 (Emilio, 23-nov): quedarse sin balas se califica por lo que se ve en ese turno, no con esta regla.
    expect(r().resumen).not.toContain("(3)");
    expect(r().resumen).toContain("Quedarse sin balas en la siguiente objeción no se califica con esta regla");
    expect(r().resumen).toContain("Una, dos o tres balas que apuntan a lo que dijo el cliente no son falla.");
    expect(r().resumen).toContain("Cuatro o más en una sola respuesta es señal de alerta");
    expect(r().resumen).not.toMatch(/dos o m[aá]s balas/);
  });
  it("su cita está en el Cerebro", () => {
    expect(cerebro).toContain(r().cita_cerebro);
  });
  it("present.balas dice lo mismo", () => {
    expect(regla("present.balas").resumen).toContain("lo normal es una o dos, a veces tres, y más no es falla si todas apuntan a lo que dijo y le quedan para lo que venga");
  });
});

describe("Tarjetas y guiones dicen lo mismo que el Cerebro", () => {
  const MUNDO5 = ["5.7", "5.8", "5.9", "5.10", "5.12", "5.13", "5.14", "5.15"];
  const viejo = /(?<!MENOS )UNA BALA|UNA bala|una sola bala|Una sola\.|una sola, la que|dos o m[aá]s (balas|argumentos)|dos o mas balas/;
  it("ninguna tarjeta del mundo 5 pide una sola bala", () => {
    for (const c of cards.filter((c) => MUNDO5.includes(c.node_id))) expect(`${c.node_id}#${c.card_order} ${c.body}`).not.toMatch(viejo);
  });
  it("ningún guion del mundo 5 pide una sola bala ni cuenta el cargador desde dos", () => {
    for (const id of MUNDO5) {
      const s = ps(id);
      if (!s) continue;
      const { notes, ...sinNotas } = s; // las notas guardan la historia
      expect(`${id} ${JSON.stringify(sinNotas)}`).not.toMatch(viejo);
    }
  });
  it("la tarjeta 4.5 #1 dice por qué les decimos balas", () => {
    expect(cards.find((c) => c.node_id === "4.5" && c.card_order === 1).body).toContain("Por eso les decimos balas");
  });
  it("el cliente simulado no se abruma con una, dos o tres que apuntan, y siente el desarme donde hay segunda objeción", () => {
    expect(ps("5.8").phases.you_do.prompt).toContain("Una, dos o tres balas que le hablan a tu objeción NO te abruman");
    for (const id of ["5.12", "5.15"]) expect(ps(id).phases.you_do.prompt).toContain("en la segunda ya no tiene nada concreto que le hable a tu nueva duda");
    expect(ps("5.8").phases.you_do.prompt).not.toContain("en la segunda ya no tiene nada concreto");
  });
  it("las versiones subieron", () => {
    expect(ps("5.8").version).toBe("1.2.0");
    expect(ps("5.10").version).toBe("2.3.0");
    expect(ps("5.12").version).toBe("1.4.0");
    expect(ps("5.15").version).toBe("1.4.0");
  });
});

describe("«Lo que encontraron» (mensaje 167): por sí solo no es la bala; con algo concreto del vendedor, sí", () => {
  const absoluto = /encontr[a-z]+»?"?(?: de FFF| otros clientes)?,? (?:en FFF, )?no (?:es|cuenta como) (?:la )?bala/i;
  it("el Cerebro lo dice, con el precio con su motivo", () => {
    expect(cerebro).toContain("Pero si ahí nombras algo concreto tuyo —de tu producto, tu servicio o tu precio, como «con la entrega cada martes nunca más perdieron una venta»—, eso sí es una bala.");
    expect(cerebro).toContain("Un precio con su motivo —«el primer pedido se lo dejo en mil cincuenta»— también lo es, aunque ya lo hayas dicho.");
    expect(cerebro).not.toContain("«Lo que encontramos» no es la bala");
  });
  it("ninguna regla, tarjeta ni guion lo dice de forma absoluta", () => {
    for (const r of reglas) expect(`${r.id} ${r.resumen}`).not.toMatch(absoluto);
    for (const c of cards) expect(`${c.node_id}#${c.card_order} ${c.body}`).not.toMatch(absoluto);
    for (const n of nodos) {
      if (!n.practice_script) continue;
      const { notes, ...sinNotas } = n.practice_script;
      expect(`${n.id} ${JSON.stringify(sinNotas)}`).not.toMatch(absoluto);
    }
  });
  it("salta_la_bala: la prueba dice qué sí cuenta", () => {
    const r = regla("objection.cierra_sin_bala").resumen;
    expect(r).toContain("eso sí es bala");
    expect(r).toContain("Un precio con su motivo");
    expect(r).toContain("Una bala ya dicha, aunque la repita tal cual, sí cuenta.");
  });
});

describe("Los criterios no castigan el número (mensaje 167)", () => {
  it("el criterio de balas del 5.8 y del 5.12 no pone tope", () => {
    const b8 = ps("5.8").success_criteria.find((c: any) => c.id === "objections.bullet_theory").description;
    const b12 = ps("5.12").success_criteria.find((c: any) => c.id === "objections.bullet_theory").description;
    expect(b8).toContain("más no le resta si todas apuntan");
    expect(b12).toContain("más no le resta si todas apuntan)");
    expect(b12).not.toContain("cuida su munición");
    expect(b8).not.toMatch(/—una o dos, a veces tres—/);
  });
});

describe("Quedarse sin balas se califica por lo que se ve (mensaje 168)", () => {
  it("5.12 y 5.15 tienen salta_la_bala, y vaciar el cargador ya no habla de la segunda objeción", () => {
    for (const id of ["5.12", "5.15"]) {
      const fallas = ps(id).failure_criteria;
      const salta = fallas.find((f: any) => f.id === "salta_la_bala");
      expect(salta.regla_id).toBe("objection.cierra_sin_bala");
      expect(salta.severity).toBe("major");
      expect(salta.description).toContain("eso es bala_se_cae, no esta");
      expect(salta.description).toContain("la explicacion le dice que ahi se le fueron");
      expect(fallas.find((f: any) => f.id === "vacia_el_cargador").description).not.toContain("segunda");
    }
  });
  it("lo que se enseña no cambia: el Cerebro y el cliente simulado siguen hablando de cuidarlas", () => {
    expect(cerebro).toContain("o gastarte tantas que, cuando llega la siguiente objeción, ya no tienes con qué subir el impulso");
    for (const id of ["5.12", "5.15"]) expect(ps(id).phases.you_do.prompt).toContain("en la segunda ya no tiene nada concreto que le hable a tu nueva duda");
  });
});

describe("La red (v3.46.0)", () => {
  it("dos y tres que apuntan no son falla; desarmado sí; cuatro que apuntan y le quedan, no", () => {
    expect(harness.harness_version).toBe("v3.46.0");
    expect(caso("G119_dos_balas_que_apuntan").expected.must_not_flag).toContain("vacia_el_cargador");
    expect(caso("G120_tres_balas_que_apuntan").expected.must_not_flag).toContain("vacia_el_cargador");
    expect(caso("G121_se_queda_desarmado").expected.must_flag).toEqual(["salta_la_bala"]);
    expect(caso("G121_se_queda_desarmado").expected.must_not_flag).toContain("vacia_el_cargador");
    expect(caso("G122_cuatro_que_apuntan_y_le_quedan").expected.must_not_flag).toContain("vacia_el_cargador");
    expect(caso("G96_apila_balas").expected.must_flag).toContain("vacia_el_cargador");
    expect(caso("G120_tres_balas_que_apuntan").expected.niveles_esperados["objections.bullet_theory"]).toBe("cumple");
    expect(caso("G122_cuatro_que_apuntan_y_le_quedan").expected.niveles_esperados["objections.bullet_theory"]).toBe("cumple");
    expect(caso("G123_precio_con_su_motivo_es_bala").expected.must_not_flag).toContain("salta_la_bala");
    expect(caso("G98_responde_sin_discutir").expected.must_flag).toEqual(["salta_la_bala"]);
  });
  it("el desarme se prueba solo donde hay una segunda objeción", () => {
    for (const id of ["G121_se_queda_desarmado", "G122_cuatro_que_apuntan_y_le_quedan"]) {
      expect(caso(id).node_id).toBe("5.12");
      expect(caso(id).transcript.filter((t: any) => t.role === "assistant").length).toBeGreaterThanOrEqual(3);
    }
  });
  it("el FFF con dos balas de V2 sigue quedando igual", () => {
    const v2 = harness.cases.find((c: any) => c.id.startsWith("V2_"));
    expect(v2.vara_textos[0].debe).toBe("quedar_igual");
    expect(v2.vara_textos[1].debe).toBe("cambiar");
  });
});
