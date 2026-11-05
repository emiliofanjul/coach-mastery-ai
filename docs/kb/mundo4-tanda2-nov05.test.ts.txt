import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Mensaje 135 (Emilio, 5-nov-2026): las prácticas del mundo 4 se ligan a la doctrina,
// igual que las tarjetas del 134. Nada se parcha: cada guion enseña y califica lo que
// el Cerebro dice, en el orden en que se enseña.

const raiz = resolve(__dirname, "../../..");
const nodos: any[] = JSON.parse(readFileSync(resolve(raiz, "docs/kb/nodos_snapshot.json"), "utf8"));
const red = JSON.parse(readFileSync(resolve(raiz, "supabase/functions/_shared/eval_harness_v1.json"), "utf8"));
const ps = (id: string) => nodos.find((n) => n.id === id).practice_script;
const fallas = (id: string) => ps(id).failure_criteria.map((f: any) => f.id);
const criterio = (id: string, c: string) => ps(id).success_criteria.find((x: any) => x.id === c).description as string;
const caso = (id: string) => red.cases.find((c: any) => c.id === id);
const vendedorModelo = (id: string) => `${ps(id).phases.i_do?.briefing ?? ""} ${ps(id).phases.i_do?.first_message ?? ""}`;

describe("el vendedor modelo no promete garantías", () => {
  it("4.1 y 4.12", () => {
    for (const id of ["4.1", "4.12"]) expect(vendedorModelo(id)).not.toMatch(/garantizad/i);
    expect(vendedorModelo("4.12")).not.toContain("¿me explico?");
  });
});

describe("nunca se califica lo que todavía no se enseña", () => {
  it("4.2 ya no califica la promesa sin sustento; se califica en las balas (4.6), con su caso", () => {
    expect(fallas("4.2")).not.toContain("promesa_sin_ancla");
    expect(caso("G59_promesa_sin_ancla").node_id).toBe("4.6");
    expect(caso("G59_promesa_sin_ancla").expected.must_flag).toEqual(["bala_inflada"]);
    expect(fallas("4.6")).toContain("bala_inflada");
  });
  it("4.6: llegar al precio no es falla (el precio va en la presentación); unas tres balas antes del precio", () => {
    expect(fallas("4.6")).not.toContain("pitch_prematuro");
    expect(vendedorModelo("4.6")).toContain("En la presentación, unas tres antes del precio es lo normal.");
    expect(vendedorModelo("4.6")).not.toContain("No suelto tres seguidas");
  });
});

describe("asumir: das opciones y él escoge", () => {
  it("4.11: el vendedor modelo da a escoger; el cliente castiga que decida por él", () => {
    expect(vendedorModelo("4.11")).toContain("¿Se la traigo el jueves o el viernes, que ando por acá?");
    expect(vendedorModelo("4.11")).not.toContain("Se la traigo el jueves que ando por acá y");
    expect(ps("4.11").phases.you_do.prompt).toContain("decide por ti el día o la cantidad sin darte a escoger");
    expect(criterio("4.11", "impulse.poder_asumir")).toContain("y sin decidir por él: el cliente escoge");
    expect(ps("4.11").version).toBe("1.1.0");
  });
  it("la red: asumir bien (P4_11) y decidir por él (G110)", () => {
    expect(caso("P4_11_perfecto").expected.niveles_esperados["impulse.poder_asumir"]).toBe("cumple");
    expect(caso("G110_decide_por_el").expected.must_flag).toEqual(["asume_con_presion"]);
  });
});

describe("el hueco: la misma balanza, con balas escogidas para su caso", () => {
  for (const id of ["4.15", "7.3"]) {
    it(`${id}: el cliente decide al azar si le pesa tener tantos proveedores o prefiere tener dos`, () => {
      const p = ps(id).phases.you_do.prompt;
      expect(p).toContain("TU POSTURA SOBRE PROVEEDORES (eligela al azar al empezar y sostenla toda la sesion");
      expect(p).toContain("(b) prefieres tener dos proveedores para lo mismo, por si uno te falla");
      expect(p).not.toContain("SI TE HABLA DE CONSOLIDAR");
      expect(criterio(id, "presentation.consolidacion_proveedor")).toMatch(/bala de producto, servicio o precio que le sube el valor o le baja el costo/);
      const f = ps(id).failure_criteria.find((x: any) => x.id === "proveedor_menos_sin_que_aplique");
      expect(f.regla_id).toBe("present.consolidacion_falsa");
      expect(f.espejo_de).toBe("presentation.consolidacion_proveedor");
    });
  }
  it("4.15: el vendedor modelo da una bala de servicio, no «un proveedor menos»", () => {
    expect(vendedorModelo("4.15")).toContain("como ya lo visito cada semana, se lo puedo traer en la misma entrega");
    expect(vendedorModelo("4.15")).not.toMatch(/proveedor menos|Menos pedidos que seguir/);
  });
  it("la red: bala que sirve (G109), proveedor menos sin que aplique (G108), y el G54 donde sí aplica porque el cliente lo dijo", () => {
    expect(caso("G108_proveedor_menos_sin_que_aplique").expected.must_flag).toEqual(["proveedor_menos_sin_que_aplique"]);
    expect(caso("G109_bala_de_servicio_que_sirve").expected.niveles_esperados["presentation.consolidacion_proveedor"]).toBe("cumple");
    const g54 = caso("G54_conviccion_sin_garantia");
    expect(g54.transcript[2].text).toContain("la verdad sí es un relajo andar con tantos proveedores");
    expect(g54.expected.must_not_flag).toContain("proveedor_menos_sin_que_aplique");
  });
});

describe("la avaricia y el jefe", () => {
  it("4.9: la brecha entre lo que vale y lo que cuesta; sin la falla repetida", () => {
    expect(criterio("4.9", "impulse.avaricia")).toContain("Hace visible la brecha entre lo que vale y lo que le cuesta");
    expect(fallas("4.9")).not.toContain("perdida_generica");
    expect(vendedorModelo("4.9")).not.toContain("La negocios");
  });
  it("4.16: el precio va en la presentación, aunque no lo pregunte; P = poder de sugestión", () => {
    expect(criterio("4.16", "presentation.price_breakdown")).toContain("aunque el cliente no lo haya preguntado");
    expect(criterio("4.16", "impulse.factores_impulso")).toContain("poder de sugestión");
  });
});

describe("la red cubre todas las prácticas del mundo 4", () => {
  it("cada práctica del mundo 4 tiene al menos un caso", () => {
    const practicas = nodos.filter((n) => n.world_id === 4 && n.practice_script?.success_criteria?.length).map((n) => n.id);
    const sinCaso = practicas.filter((id) => !red.cases.some((c: any) => c.node_id === id));
    expect(sinCaso).toEqual([]);
  });
  it("los casos perfectos nuevos traen su traza, y cada frase está en la conversación", () => {
    for (const id of ["P4_1_perfecto", "P4_2_perfecto", "P4_3_perfecto", "P4_10_perfecto", "P4_11_perfecto", "P4_12_perfecto", "P4_16_perfecto"]) {
      const c = caso(id);
      const texto = c.transcript.map((t: any) => t.text).join(" ");
      for (const frase of Object.values(c.traza) as string[]) expect(texto).toContain(frase);
      expect(c.expected.score_range).toEqual([85, 100]);
    }
    expect(red.harness_version).toBe("v3.37.0");
  });
});
