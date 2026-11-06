// El cliente recurrente con contexto (Emilio, 6-nov-2026): además de lo que ya compra y la última visita,
// la ficha trae cuánto pide normalmente y algo de su vida. El vendedor lo ve antes de empezar y el cliente
// simulado lo sabe: la práctica es más real y se practica la memoria. Lo personal sale de FORMS (Familia,
// Ocupación, Recreación, Motivación, Deporte), y recordarlo es hacer CPR. Es cotidiano: nunca salud, dinero,
// política, religión ni problemas personales.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { contextoDelCliente, lineaDelCliente, fichaRespaldoVisible } from "../cliente-practica";
import { validarFicha, fichaDeRespaldo, bloqueActor, bloqueEvaluador, PROMPT_FICHA } from "../../../supabase/functions/_shared/ficha_cliente";

const cerebro = readFileSync(join(process.cwd(), "docs/kb/cerebro_snapshot.md"), "utf8");
const reglas: any[] = JSON.parse(readFileSync(join(process.cwd(), "docs/kb/reglas.json"), "utf8"));

describe("recordar también es CPR (Emilio, 6-nov)", () => {
  it("el Cerebro y la regla lo dicen", () => {
    expect(cerebro).toContain("**Recordar también es CPR** `CAMPO`");
    expect(reglas.find((r) => r.id === "relationship.cpr").resumen).toContain("retomar por su cuenta lo personal que ya sabe de él (FORMS) también es CPR");
  });
  it("lo personal de la ficha sale de FORMS", () => {
    for (const camino of ["Familia (", "Ocupación (", "Recreación (", "Motivación (", "Deporte ("]) expect(PROMPT_FICHA).toContain(camino);
  });
});

const dalfan = "Lubricantes Repsol, Bardahl y Mexlub: aceite de motor, aceite de transmisión, grasas, anticongelantes";
const crudo = { nombre: "Don Chuy", negocio: "taller mecánico", ya_te_compra: "aceite de motor", ultima_visita: "hace una semana", le_compra_a_otro: "grasas", su_pedido: "unas seis cubetas cada martes", algo_personal: "su hija entra a la prepa en enero" };

describe("la ficha del recurrente trae contexto", () => {
  it("cuánto pide y algo de su vida pasan la validación", () => {
    const f = validarFicha(crudo, "recurrente", dalfan);
    expect(f.su_pedido).toBe("unas seis cubetas cada martes");
    expect(f.algo_personal).toBe("su hija entra a la prepa en enero");
  });
  it("lo personal delicado se cambia por algo cotidiano", () => {
    for (const malo of ["su esposa está en el hospital", "anda con deudas", "es muy de la iglesia", "se está divorciando", "le va al partido político"]) {
      expect(validarFicha({ ...crudo, algo_personal: malo }, "recurrente", dalfan).algo_personal).toBe(fichaDeRespaldo("recurrente").algo_personal);
    }
  });
  it("si falta o viene sin cantidad, queda el respaldo: la práctica nunca se queda sin contexto", () => {
    const f = validarFicha({ ...crudo, su_pedido: "lo de siempre", algo_personal: "" }, "recurrente", dalfan);
    expect(f.su_pedido).toBe(fichaDeRespaldo("recurrente").su_pedido);
    expect(f.algo_personal).toBe(fichaDeRespaldo("recurrente").algo_personal);
  });
  it("el cliente nuevo no trae nada de esto", () => {
    const f = validarFicha(crudo, "nuevo", dalfan);
    expect(f.su_pedido).toBeUndefined();
    expect(f.algo_personal).toBeUndefined();
    expect(contextoDelCliente(f)).toEqual([]);
  });
  it("el respaldo del teléfono y el del servidor son iguales", () => {
    expect(fichaRespaldoVisible("recurrente")).toEqual(fichaDeRespaldo("recurrente"));
  });
  it("el modelo sabe qué generar", () => {
    expect(PROMPT_FICHA).toContain('"su_pedido"');
    expect(PROMPT_FICHA).toContain('"algo_personal"');
    expect(PROMPT_FICHA).toContain("NUNCA salud, dinero, política, religión ni problemas personales");
  });
});

describe("los tres ven los mismos hechos", () => {
  const f = validarFicha(crudo, "recurrente", dalfan);
  it("el vendedor, en la tarjeta (sin revelar el hueco)", () => {
    expect(contextoDelCliente(f)).toEqual(["Normalmente te pide unas seis cubetas cada martes.", "De su vida: su hija entra a la prepa en enero."]);
    expect([lineaDelCliente(f), ...contextoDelCliente(f)].join(" ")).not.toMatch(/grasas/);
  });
  it("el cliente simulado", () => {
    const b = bloqueActor(f);
    expect(b).toContain("Normalmente le pides unas seis cubetas cada martes.");
    expect(b).toContain("Algo de tu vida que el vendedor ya sabe: su hija entra a la prepa en enero.");
  });
  it("el evaluador: recordarlo es legítimo", () => {
    const b = bloqueEvaluador(f);
    expect(b).toContain("normalmente le pide unas seis cubetas cada martes");
    expect(b).toContain("algo personal que el vendedor ya sabe: su hija entra a la prepa en enero");
    expect(b).toMatch(/Recordar un hecho de esta lista es legítimo/);
    expect(b).toContain("Retomar con interés genuino lo personal que ya sabe de él (FORMS) es hacer CPR.");
  });
  it("la pantalla lo muestra en la ventana y en la tarjeta de la práctica", () => {
    const ui = readFileSync(join(process.cwd(), "src/routes/nodo.$nodeId.practica.tsx"), "utf8");
    expect(ui.match(/\{contextoDelCliente\(fichaCliente\)\.map\(/g)?.length).toBe(2);
  });
});
