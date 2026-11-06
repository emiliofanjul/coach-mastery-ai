// Mensaje 144 (Emilio, 6-nov-2026): el mundo 7 (los exámenes) ligado a la doctrina de los mundos 1 a 6.
// · La certificación se da al pasar el examen final (7.4) con 85 o más. Decía "9.3", un id del mapa viejo.
// · En el 7.2, la cicatriz trae su razón: es objeción, no un segundo no. El vendedor no pide que pruebe ni
//   ofrece salida (4.4): propone con convicción un pedido chico; si el cliente pone su condición, la acepta.
// · Las objeciones se atienden con RRR o FFF, una bala y volver a cerrar: no hay «reencuadre».
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NODO_CERTIFICACION } from "../certificacion";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const cards: any[] = JSON.parse(leer("docs/kb/cards_snapshot.json"));
const red = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const ps = (id: string) => nodos.find((n) => n.id === id).practice_script;
const fallas = (id: string) => ps(id).failure_criteria.map((f: any) => f.id);
const carta = (n: string) => cards.find((c) => c.node_id === n && c.card_order === 1);

describe("la certificación", () => {
  it("es el examen final, y ese nodo existe", () => {
    expect(NODO_CERTIFICACION).toBe("7.4");
    expect(nodos.find((n) => n.id === NODO_CERTIFICACION)?.node_type).toBe("boss");
    const ui = leer("src/routes/nodo.$nodeId.practica.tsx");
    expect(ui).toContain("if (nodeId === NODO_CERTIFICACION && finalScore >= 85 && !sellerData.certified_at) {");
    expect(ui).not.toContain('nodeId === "9.3"');
  });
});

describe("los exámenes", () => {
  it("sin «reencuadre» ni conteos viejos", () => {
    for (const id of ["7.0", "7.1", "7.2", "7.3", "7.4"]) expect(JSON.stringify(ps(id)).replace(/objections\.reframe/g, "")).not.toMatch(/reframe|reencuadre|mundo 9|\[nombre\]/i);
    for (const n of ["7.0", "7.4"]) expect(`${carta(n).body}`).not.toMatch(/ocho mundos/i);
  });
  it("7.2: la cicatriz es objeción, sin «a prueba» ni salida, y se acepta la condición del cliente", () => {
    expect(carta("7.2").body).toContain("Eso ya no es un no: trae su razón, y eso lo hace una objeción.");
    expect(ps("7.2").phases.you_do.prompt).not.toContain("a prueba, con salida");
    for (const f of ["pide_que_pruebe", "anuncia_plan_b", "pelea_la_condicion"]) expect(fallas("7.2")).toContain(f);
  });
  it("7.0 y 7.4: la objeción lleva su bala", () => {
    for (const id of ["7.0", "7.4"]) expect(fallas(id)).toContain("salta_la_bala");
    expect(ps("7.0").failure_criteria.find((f: any) => f.id === "celebra_y_corre").regla_id).toBe("consolidation.siguientes_pasos");
  });
  it("cada examen tiene casos en la red, y los de 7.0, 7.2 y 7.4 una ejecución perfecta", () => {
    for (const id of ["7.0", "7.1", "7.2", "7.3", "7.4"]) expect(red.cases.some((c: any) => c.node_id === id), id).toBe(true);
    for (const id of ["7.0", "7.2", "7.4"]) expect(red.cases.some((c: any) => c.node_id === id && c.tipo === "perfecto"), id).toBe(true);
  });
});
