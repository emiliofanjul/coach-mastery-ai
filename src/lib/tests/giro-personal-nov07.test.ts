// Mensaje 156 (7-nov-2026) · Quien entrena por su cuenta cuenta qué vende antes de su primera práctica.
// Decisión de Emilio: obligatorio, pero no al registrarse (ahí todavía no le sirve y se iría): justo antes
// de su primera práctica con voz, con su porqué. Sin esto practicaba con un cliente genérico.
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { tieneGiro, PREGUNTAS_PERSONAL } from "@/components/closer/GiroPersonal";
import { preguntaCompleta, cerebroDirecto } from "@/lib/onboarding-questions";

const leer = (p: string) => fs.readFileSync(path.resolve(__dirname, "../../..", p), "utf8");
const practica = leer("src/routes/nodo.$nodeId.practica.tsx");
const giro = leer("src/components/closer/GiroPersonal.tsx");

describe("Cuándo se pregunta", () => {
  it("solo a cuentas personales sin giro, antes de crear la ficha del cliente", () => {
    expect(practica).toContain("is_personal&id=eq.${seller.company_id}");
    expect(practica).toContain("if ((company as any)?.is_personal === true && !tieneGiro((company as any)?.company_sales_brain)) {");
    const gate = practica.indexOf("setPideGiro({ companyId: seller.company_id });");
    const ficha = practica.indexOf('phase: "ficha_cliente"');
    expect(gate).toBeGreaterThan(0);
    expect(gate).toBeLessThan(ficha);
  });
  it("hay giro cuando ya sabe qué vende", () => {
    expect(tieneGiro(null)).toBe(false);
    expect(tieneGiro({})).toBe(false);
    expect(tieneGiro('{"PRODUCTOS_ACTIVOS":"  "}')).toBe(false);
    expect(tieneGiro({ PRODUCTOS_ACTIVOS: "aceites, grasas" })).toBe(true);
    expect(tieneGiro('{"PRODUCTOS_ACTIVOS":"aceites"}')).toBe(true);
  });
});

describe("Qué se pregunta", () => {
  it("las 3 del primer bloque del manager, dichas a quien vende él mismo, cada una con su porqué", () => {
    expect(PREGUNTAS_PERSONAL.map((p) => p.base.id)).toEqual(["p1_que_venden", "p2_clientes", "p3_monto"]);
    for (const p of PREGUNTAS_PERSONAL) {
      expect(p.porQue.length).toBeGreaterThan(30);
      expect(p.titulo + p.sub + p.porQue).not.toMatch(/tus vendedores|tu equipo/);
    }
    expect(giro).toContain("Tu cliente está por llegar");
    expect(giro).toContain("Son 3 preguntas. Toma un minuto, y solo se hace una vez.");
  });
  it("son obligatorias: sin lo mínimo no se avanza", () => {
    const [p1, p2, p3] = PREGUNTAS_PERSONAL.map((p) => p.base);
    expect(preguntaCompleta(p1, {})).toBe(false);
    expect(preguntaCompleta(p1, { p1_tipo: "Productos", p1_lineas: "aceites para motor" })).toBe(true);
    expect(preguntaCompleta(p2, { p2_uso: ["Lo revenden"] })).toBe(false);
    expect(preguntaCompleta(p2, { p2_uso: ["Lo revenden"], p2_giros: "refaccionarias" })).toBe(true);
    expect(preguntaCompleta(p3, { p3_rangos: ["Menos de $5,000"] })).toBe(true);
    expect(giro).toContain("disabled={!completa}");
    expect(giro).not.toMatch(/Ahora no|Saltar/);
  });
});

describe("Qué se guarda", () => {
  it("lo comercial va directo de sus palabras: nada se inventa", () => {
    const d = cerebroDirecto({ p1_tipo: "Productos", p1_lineas: "aceites para motor", p2_uso: ["Lo revenden"], p2_giros: "refaccionarias", p3_rangos: ["$5,000 a $50,000"] });
    expect(d.PRODUCTOS_ACTIVOS).toBe("aceites para motor");
    expect(d.TIPOS_DE_CLIENTE_QUE_ATIENDE).toContain("refaccionarias");
    expect(d.CONTEXTO_DE_VENTA).toContain("$5,000 a $50,000");
  });
  it("si el modelo falla se guarda lo directo, y la práctica sigue con el cerebro nuevo", () => {
    expect(giro).toContain('restMutate("rpc/update_company_brain", { method: "POST", body: { _brain: brain } });');
    expect(giro).toMatch(/catch \(e\) \{\s*\/\/ Sin el cliente típico redactado/);
    expect(practica).toMatch(/onListo=\{\(\) => \{\s*setPideGiro\(null\);\s*void handleListo\(\);/);
  });
});
