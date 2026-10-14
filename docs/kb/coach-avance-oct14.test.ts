// "Tu coach" sabe lo que ya le enseñó al vendedor (14-oct-2026, Emilio).
// Antes leía sellers.current_world, que nunca se actualizaba: no distinguía lo
// ya enseñado de lo que falta.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { armarAvance } from "../avance-coach";

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
  it("si no lo ha visto: breve y en qué mundo lo aprende; si ya lo vio: refresca y manda a repetir el nodo", () => {
    expect(coach).toContain("TÚ SABES LO QUE YA LE ENSEÑASTE");
    expect(coach).toContain("SI TODAVÍA NO LO VE (○)");
    expect(coach).toContain("Sigue avanzando: cuando llegues, todo va a tener sentido.");
    expect(coach).toContain("SI YA SE LO ENSEÑASTE (✓)");
    expect(coach).toContain("recomiéndale repetir ese nodo");
  });
});
