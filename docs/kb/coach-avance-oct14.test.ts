// "Tu coach" sabe lo que ya le enseñó al vendedor (14-oct-2026, Emilio).
// Antes leía sellers.current_world, que nunca se actualizaba: no distinguía lo
// ya enseñado de lo que falta.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { armarAvance, armarTecnicas } from "../avance-coach";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const coach = leer("src/lib/coach-chat.functions.ts");

const MUNDOS = [{ id: 1, name: "La Introducción" }, { id: 5, name: "El Cierre" }];
const NODOS = [
  { id: "1.2", world_id: 1, name: "La Fórmula", order_index: 2 },
  { id: "1.1", world_id: 1, name: "SCE", order_index: 1 },
  { id: "1.6", world_id: 1, name: "El Primer Contacto", order_index: 6, is_boss: true },
  { id: "5.8", world_id: 5, name: "FFF en Vivo", order_index: 8 },
];

describe("el avance sale del mapa real, como lo ve el vendedor", () => {
  it("el que le toca es el primer nodo sin completar, en el orden del mapa", () => {
    const a = armarAvance(MUNDOS, NODOS, [{ node_id: "1.1", status: "done", stars: 3 }]);
    expect(a.actual?.id).toBe("1.2");
    expect(a.mundoActual).toBe(1);
    expect(a.texto).toContain("✓ 1.1 SCE ★★★");
    expect(a.texto).toContain("▶ 1.2 La Fórmula");
    expect(a.texto).toContain("○ 5.8 FFF en Vivo");
    expect(a.texto).toContain("Mundo 5 — El Cierre [todavía no lo ve]");
  });
  it("repetir un nodo viejo no lo regresa", () => {
    const p = ["1.1", "1.2", "1.6", "5.8"].map((id) => ({ node_id: id, status: "done", stars: 2 }));
    const a = armarAvance(MUNDOS, NODOS, p);
    expect(a.actual).toBeNull();
    expect(a.texto).toContain("Ya completó todos los nodos del mapa.");
    expect(a.texto).toContain("✓ 5.8 FFF en Vivo ★★");
  });
  it("marca para repetir lo que pasó con 1 estrella", () => {
    const a = armarAvance(MUNDOS, NODOS, [{ node_id: "1.1", status: "done", stars: 1 }]);
    expect(a.texto).toContain("✓ 1.1 SCE ★ (1 estrella: conviene repetirlo)");
  });
});

describe("el coach usa ese mapa y sabe qué hacer con él", () => {
  it("ya no lee current_world ni current_node", () => {
    expect(coach).not.toContain("current_world");
    expect(coach).not.toContain("current_node");
    expect(coach).toContain('.from("node_progress").select("node_id, status, stars").eq("seller_id", seller.id)');
    expect(coach).toContain("armarAvance(");
  });
  it("ubica el tema; si no lo ve: máximo 4 frases y el mundo; si ya lo vio: refresca y manda a repetir el nodo", () => {
    expect(coach).toContain("UBICA EL TEMA DE LA PREGUNTA");
    expect(coach).toContain("se enseña en el\n   mundo de El Cierre, aunque su causa venga de un paso anterior");
    expect(coach).toContain("SOLO EXPLICAS TÉCNICAS QUE YA LE ENSEÑASTE O QUE ESTÁ APRENDIENDO AHORA");
    expect(coach).toContain("MÁXIMO 4 FRASES");
    expect(coach).toContain("SI YA SE LO ENSEÑASTE (✓)");
    expect(coach).toContain("recomiéndale repetir ese nodo");
    expect(coach).toContain("armarTecnicas(");
  });
});

describe("técnicas por mundo, marcadas contra su avance", () => {
  const MUNDOS = [{ id: 3, name: "El Descubrimiento" }, { id: 4, name: "La Presentación" }, { id: 5, name: "El Cierre" }];
  const T = [
    { name: "Preguntas por capas", world_id_introduced: 3, status: "active" },
    { name: "Triple Desglose de Precios", world_id_introduced: 4, status: "active" },
    { name: "FFF — Feel, Felt, Found", world_id_introduced: 5, status: "active" },
    { name: "FFF — Feel, Felt, Found", world_id_introduced: 5, status: "active" },
  ];
  it("vendedor en el mundo 3: lo del 4 y el 5 sale como no enseñado, sin repetidos", () => {
    const t = armarTecnicas(MUNDOS, T, 3);
    expect(t).toContain("Mundo 3 — El Descubrimiento [las está aprendiendo ahora]: Preguntas por capas");
    expect(t).toContain("Mundo 4 — La Presentación [TODAVÍA NO SE LAS ENSEÑAS: no las expliques]: Triple Desglose de Precios");
    expect(t.match(/FFF — Feel, Felt, Found/g)?.length).toBe(1);
  });
  it("vendedor en el mundo 5: lo anterior ya se lo enseñaste", () => {
    expect(armarTecnicas(MUNDOS, T, 5)).toContain("Mundo 4 — La Presentación [ya se las enseñaste]");
  });
});
