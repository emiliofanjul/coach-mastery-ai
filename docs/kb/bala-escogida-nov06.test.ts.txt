import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Mensaje 138 (Emilio, 6-nov-2026): la bala del re-impulso.
// · «Lo que encontramos» de FFF no es la bala: son dos pasos. Cerrar con «¿le armo las diez para este jueves
//   o para el siguiente?» sí es close with action; lo que faltaba era la bala.
// · La bala no tiene que ser nueva: el vendedor escoge cuál usar para volver a subir el impulso. Repetir una
//   tal cual también se vale: no es igual de efectivo, pero ratifica que es verdad y da seguridad.

const leer = (p: string) => readFileSync(resolve(__dirname, "../../..", p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const cards: any[] = JSON.parse(leer("docs/kb/cards_snapshot.json"));
const red = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const regla = (id: string) => reglas.find((r) => r.id === id);
const caso = (id: string) => red.cases.find((c: any) => c.id === id);

describe("la bala la escoge el vendedor", () => {
  it("el Cerebro ya no exige que sea nueva", () => {
    expect(cerebro).not.toContain("una bala NUEVA");
    expect(cerebro).not.toContain("una bala nueva");
    expect(cerebro).toContain("Volver a decir una ya dicha, aunque sea tal cual, también se vale");
    expect(cerebro).toContain("«Lo que encontramos» no es la bala: es el paso 3.");
  });
  it("las reglas lo dicen igual, con su cita en el Cerebro", () => {
    for (const id of ["objection.bala_repetida", "objection.circulo_de_cierre", "objection.cierra_sin_bala", "objection.fff", "present.balas"])
      expect(cerebro).toContain(regla(id).cita_cerebro);
    expect(regla("objection.cierra_sin_bala").resumen).toContain("«Lo que encontraron» de FFF no cuenta como bala");
    expect(regla("objection.bala_repetida").severidad_sugerida).toBeNull();
  });
  it("ninguna práctica castiga repetir una bala", () => {
    for (const n of nodos) {
      if (!n.practice_script) continue;
      for (const f of n.practice_script.failure_criteria) expect(f.regla_id, `${n.id} ${f.id}`).not.toBe("objection.bala_repetida");
    }
  });
  it("ninguna tarjeta pide bala nueva", () => {
    for (const c of cards) expect(`${c.title} ${c.body}`, `${c.node_id} #${c.card_order}`).not.toMatch(/bala nueva|bala NUEVA/);
  });
});

describe("la red", () => {
  it("«lo que encontraron», aunque sea concreto, no es la bala", () => {
    expect(caso("G98_responde_sin_discutir").expected.must_flag).toEqual(["salta_la_bala"]);
  });
  it("una bala ya dicha, repetida tal cual, sí re-impulsa", () => {
    expect(caso("G95_bala_repetida_tal_cual").expected).toEqual({ must_not_flag: ["salta_la_bala"] });
  });
});
