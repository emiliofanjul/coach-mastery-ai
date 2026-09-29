// "Lo que viene después" amarrado a la doctrina, probado ejecutándolo.
// Sept-2026: en el 3.6 aconsejó ofrecer una muestra y cerrar con "¿a qué hora
// le caigo mejor?" en pleno descubrimiento. Sin regla del paso, no pasa.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { filtrarSiguienteNivel, pasoDelNodo } from "../../../supabase/functions/_shared/siguiente_nivel";

const pasos = new Map<string, number>([
  ["discovery.rojo_vs_amarrado", 3], ["discovery.escalera_capas", 3], ["discovery.dolor_real", 3],
  ["flow.close_with_action", 0], ["close.asumir_venta", 5], ["present.beneficio_no_caracteristica", 4],
]);

describe("pasoDelNodo", () => {
  it("el 3.6 es del paso 3 (descubrimiento)", () => {
    expect(pasoDelNodo([{ regla_id: "discovery.rojo_vs_amarrado" }, { regla_id: "discovery.escalera_capas" }], pasos)).toBe(3);
  });
  it("las reglas de fundamentos (paso 0) no deciden el paso", () => {
    expect(pasoDelNodo([{ regla_id: "flow.close_with_action" }, { regla_id: "discovery.dolor_real" }], pasos)).toBe(3);
  });
  it("sin reglas conocidas no hay paso", () => {
    expect(pasoDelNodo([{ regla_id: "x" }], pasos)).toBeNull();
  });
});

describe("filtrarSiguienteNivel", () => {
  const permitidas = new Set(["discovery.rojo_vs_amarrado", "discovery.escalera_capas", "discovery.dolor_real"]);
  it("el consejo real del 3.6 (cerrar con muestra) se descarta: cita una regla de cierre", () => {
    const r = filtrarSiguienteNivel([{
      observacion: "Encontraste el borde disponible pero no cerraste con acción concreta",
      ejemplo: "Déjeme le traigo una muestra mañana. ¿A qué hora le caigo mejor?",
      por_que: "Cerrar con acción concreta convierte el descubrimiento en venta", regla_id: "close.asumir_venta",
    }], permitidas);
    expect(r.conservados).toEqual([]);
    expect(r.descartados).toBe(1);
  });
  it("un consejo sin regla se descarta", () => {
    expect(filtrarSiguienteNivel([{ observacion: "algo", ejemplo: "algo" }], permitidas).conservados).toEqual([]);
  });
  it("un consejo del mismo paso, con su regla, se conserva", () => {
    const r = filtrarSiguienteNivel([{
      observacion: "En la línea libre también cabía buscar el dolor",
      ejemplo: "¿Y cómo le ha ido con el líquido de frenos que maneja ahorita?",
      por_que: "La venta de hoy vive en lo que sí puede comprar", regla_id: "discovery.escalera_capas",
    }], permitidas);
    expect(r.conservados).toHaveLength(1);
    expect(r.conservados[0].regla_id).toBe("discovery.escalera_capas");
  });
  it("máximo dos", () => {
    const uno = { observacion: "a", ejemplo: "b", por_que: "c", regla_id: "discovery.dolor_real" };
    expect(filtrarSiguienteNivel([uno, uno, uno], permitidas).conservados).toHaveLength(2);
  });
  it("sin reglas permitidas, nada pasa (falla cerrada)", () => {
    expect(filtrarSiguienteNivel([{ observacion: "a", regla_id: "discovery.dolor_real" }], new Set()).conservados).toEqual([]);
  });
});

describe("el evaluador usa el filtro y le da la doctrina del paso", () => {
  const fn = readFileSync(join(process.cwd(), "supabase/functions/closer-voice/index.ts"), "utf8");
  it("filtra en código y pasa las reglas del paso al prompt", () => {
    expect(fn).toMatch(/filtrarSiguienteNivel\(\(evaluation as any\)\.siguiente_nivel, permitidasSiguiente\)/);
    expect(fn).toMatch(/buildEvaluateBlocks\(practice_script, cut_reason, radarSkills, reglasSiguiente\)/);
  });
  it("el prompt ya no invita a dar doctrina de pasos posteriores", () => {
    expect(fn).not.toMatch(/típicamente doctrina de pasos posteriores/);
    expect(fn).toMatch(/DENTRO DEL MISMO PASO que entrena este nodo/);
    expect(fn).toMatch(/PROHIBIDO recomendar el trabajo de un paso posterior/);
  });
});
