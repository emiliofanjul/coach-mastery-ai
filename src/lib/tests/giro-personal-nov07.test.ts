// Mensajes 156-157 (7-nov-2026) · Quien entrena por su cuenta cuenta su negocio «justo a tiempo».
// Decisión de Emilio: obligatorio, pero nunca al registrarse (ahí todavía no le sirve y se iría): cada dato
// justo antes del primer nodo que lo necesita, con su porqué. Y todo lo puede ver y editar en «Tu negocio».
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { PUERTAS, TEXTO_PERSONAL, ORDEN_PREGUNTAS, puertaPendiente, compararNodos, contestada, completa, respuestasParaGuardar, VISTAS } from "@/lib/giro-personal";
import { PREGUNTAS, cerebroDirecto } from "@/lib/onboarding-questions";

const leer = (p: string) => fs.readFileSync(path.resolve(__dirname, "../../..", p), "utf8");
const practica = leer("src/routes/nodo.$nodeId.practica.tsx");
const giro = leer("src/components/closer/GiroPersonal.tsx");
const guardar = leer("src/lib/giro-guardar.ts");
const nodos: { id: string; node_type: string }[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));

describe("Cuándo se pide cada cosa", () => {
  it("las 5 puertas, en orden, antes del primer nodo que usa cada dato", () => {
    expect(PUERTAS.map((p) => [p.antesDe, p.preguntas])).toEqual([
      ["1.2", ["p1_que_venden", "p2_clientes", "p3_monto", "p5_canal"]],
      ["3.8", ["p4_cartera"]],
      ["4.1", ["p6_ofrecen", "p9_restricciones"]],
      ["4.9", ["p7_precio"]],
      ["5.6", ["p8_negativos"]],
    ]);
    // Todas las preguntas del manager, cada una una sola vez.
    expect([...ORDEN_PREGUNTAS].sort()).toEqual(PREGUNTAS.map((p) => p.id).sort());
    // Cada puerta está antes de un nodo con práctica (el que la necesita).
    for (const p of PUERTAS) expect(nodos.find((n) => n.id === p.antesDe)?.node_type).not.toBe("knowledge");
  });
  it("el orden de los nodos es el del mapa", () => {
    expect(["2.10", "2.7c", "2.8", "2.7", "2.7b", "1.6"].sort(compararNodos)).toEqual(["1.6", "2.7", "2.7b", "2.7c", "2.8", "2.10"]);
  });
  it("antes del 1.2 no se pide nada; en el 1.2, la primera puerta; si ya la contestó, nada hasta el 3.8", () => {
    expect(puertaPendiente("1.0", {})).toBeNull();
    expect(puertaPendiente("1.2", {})?.id).toBe("cliente");
    expect(puertaPendiente("2.5", {})?.id).toBe("cliente"); // si se la saltó (cuenta vieja), en la siguiente práctica
    const r = { [VISTAS]: ["p1_que_venden", "p2_clientes", "p3_monto", "p5_canal"] };
    expect(puertaPendiente("3.6", r)).toBeNull();
    expect(puertaPendiente("3.8", r)?.id).toBe("cartera");
    expect(puertaPendiente("5.6", { [VISTAS]: ORDEN_PREGUNTAS })).toBeNull();
  });
  it("las cuentas de antes del 157 (cerebro sin respuestas) no repiten las 3 primeras: solo el canal", () => {
    const p = puertaPendiente("1.4", {}, { PRODUCTOS_ACTIVOS: "aceites" });
    expect(p?.preguntas).toEqual(["p5_canal"]);
  });
  it("solo a cuentas personales, antes de crear la ficha del cliente", () => {
    expect(practica).toContain("is_personal,respuestas_giro&id=eq.${seller.company_id}");
    expect(practica).toContain("if ((company as any)?.is_personal === true) {");
    const gate = practica.indexOf("const puerta = puertaPendiente(nodeId, respuestas, (company as any)?.company_sales_brain);");
    expect(gate).toBeGreaterThan(0);
    expect(gate).toBeLessThan(practica.indexOf('phase: "ficha_cliente"'));
    expect(practica).toMatch(/onListo=\{\(\) => \{\s*setPideGiro\(null\);\s*void handleListo\(\);/);
  });
});

describe("Qué se pregunta y cómo", () => {
  it("cada pregunta, dicha a quien vende él mismo y con su porqué", () => {
    for (const id of ORDEN_PREGUNTAS) {
      const t = TEXTO_PERSONAL[id];
      expect(t.porQue.length).toBeGreaterThan(40);
      expect(t.titulo + (t.sub ?? "") + t.porQue).not.toMatch(/tus vendedores|tu equipo/);
    }
  });
  it("obligatorias: sin lo mínimo no se avanza; lo opcional (sus reglas) se puede dejar vacío", () => {
    expect(completa("p1_que_venden", {})).toBe(false);
    expect(completa("p1_que_venden", { p1_tipo: "Productos", p1_lineas: "aceites para motor" })).toBe(true);
    expect(completa("p5_canal", { p5_canal: ["En persona"] })).toBe(false);
    expect(completa("p5_canal", { p5_canal: ["En persona"], p5_trato: ["De usted"] })).toBe(true);
    expect(completa("p9_restricciones", {})).toBe(true);
    expect(giro).toContain("disabled={!listo}");
    expect(giro).not.toMatch(/Ahora no|Saltar/);
  });
  it("visto cuenta como contestado, aunque lo opcional quede vacío", () => {
    const r = respuestasParaGuardar({ p1_lineas: "aceites", vacio: "  ", lista: [] }, ["p9_restricciones"]);
    expect(r).toEqual({ p1_lineas: "aceites", [VISTAS]: ["p9_restricciones"] });
    expect(contestada("p9_restricciones", r)).toBe(true);
  });
});

describe("Qué se guarda", () => {
  it("lo comercial va directo de sus palabras: nada se inventa", () => {
    const d = cerebroDirecto({ p1_tipo: "Productos", p1_lineas: "aceites para motor", p5_canal: ["En persona"], p5_trato: ["De usted"] });
    expect(d.PRODUCTOS_ACTIVOS).toBe("aceites para motor");
    expect(d.CONTEXTO_DE_VENTA).toContain("Trato: De usted");
  });
  it("respuestas y cerebro juntos (guardar_giro); si el modelo falla, se guarda lo directo", () => {
    expect(guardar).toContain('restMutate("rpc/guardar_giro", { method: "POST", body: { _respuestas: r, _brain: brain } });');
    expect(guardar).toMatch(/catch \(e\) \{\s*console\.error\("\[giro\] el modelo no respondió; se guarda lo directo:"/);
  });
});

describe("«Tu negocio»: lo ve y lo edita", () => {
  const pagina = leer("src/routes/tu-negocio.tsx");
  const shell = leer("src/components/app/AppShell.tsx");
  const perfil = leer("src/routes/mi-perfil.tsx");
  it("le dice que él le da forma a su cliente, y que lo puede cambiar", () => {
    expect(pagina).toContain("Entre más le cuentes a Closer, más se parece tu cliente de práctica a los tuyos");
    expect(pagina).toContain("Listo. Tu cliente de práctica ya usa esto desde tu siguiente práctica.");
  });
  it("lo que aún no le pide aparece con el nodo antes del cual se lo pedirá, y lo puede contestar ya", () => {
    expect(pagina).toContain("Si quieres, contéstalo desde ya.");
    expect(pagina).toContain('{nada ? "Contestar" : "Editar"}');
  });
  it("solo cuentas personales (los equipos usan «Mi Empresa»); está en el menú y en «Mi Perfil»", () => {
    expect(pagina).toContain("if (!e?.is_personal) return navigate({ to: \"/mapa\", replace: true });");
    expect(shell).toContain('const PERSONAL_ITEM: NavItem = { to: "/tu-negocio", label: "Tu negocio", icon: Store };');
    expect(shell).toContain("...(isPersonal ? [PERSONAL_ITEM] : []),");
    expect(perfil).toContain('onClick={() => navigate({ to: "/tu-negocio" })}');
  });
  it("guarda igual que las puertas", () => {
    expect(pagina).toContain("await guardarGiro({ respuestas: r, vistasAhora: puerta.preguntas, cerebroAnterior: empresa.company_sales_brain, companyId: empresa.id });");
  });
});
