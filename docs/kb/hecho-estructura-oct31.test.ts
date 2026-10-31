// Mensaje 115 (31-oct-2026) · Un juicio no contradice un hecho.
// G04: «¡Buenos días! ¿Cómo le va? Qué gusto saludarlo.» La pregunta va en
// medio. El evaluador dejó la estructura en parcial, como dice su regla; el
// juez, dos de dos veces, leyó el orden al revés y la subió a cumple (73,
// esperado 25–65). Dónde va la pregunta es un hecho: lo decide el código.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { criteriosPorHechoDePregunta, FALTA_PREGUNTA_EN_MEDIO } from "../../../supabase/functions/_shared/hechos_pregunta.ts";
import { acusacionesConPrueba, aplicarJuicios } from "../../../supabase/functions/_shared/juez_pruebas.ts";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const voz = leer("supabase/functions/closer-voice/index.ts");
// Como en v_nodes_resueltos: cada criterio lleva el resumen de su regla.
const guion = () => {
  const ps = JSON.parse(JSON.stringify(nodos.find((n) => n.id === "1.2").practice_script));
  for (const c of ps.success_criteria) c.regla_resumen = reglas.find((r) => r.id === c.regla_id)?.resumen;
  return ps;
};
const ev = (pregunta: string, nivel: string) => ({
  analisis_turnos: [{ turno: 1, pregunta, ultima_frase: "Qué gusto saludarlo." }],
  veredictos_criterios: [{ criterio_id: "opening.estructura_apertura", nivel, falta: "la pregunta no cierra" }],
  flags_detected: [],
});
const nivel = (e: any) => e.veredictos_criterios[0].nivel;

describe("El hecho decide la estructura", () => {
  it("la regla lo dice: pregunta en medio es parcial", () => {
    expect(reglas.find((r) => r.id === "opening.estructura").resumen).toContain("Si la pregunta va en medio y el turno termina con un comentario, es parcial");
  });
  it("pregunta en medio y el evaluador dijo parcial: queda parcial y el juez no la revisa", () => {
    const e = ev("en_medio", "parcial"); const ps = guion();
    const d = criteriosPorHechoDePregunta(e, ps);
    expect(d).toEqual(["opening.estructura_apertura"]);
    const a = acusacionesConPrueba(e, ps, d);
    expect(a.map((x) => x.id)).not.toContain("opening.estructura_apertura");
    aplicarJuicios(e, a, [{ id: "opening.estructura_apertura", tipo: "criterio", conducta: "pasa" }]);
    expect(nivel(e)).toBe("parcial");
  });
  it("pregunta en medio y el evaluador dijo cumple: baja a parcial", () => {
    const e = ev("en_medio", "cumple");
    criteriosPorHechoDePregunta(e, guion());
    expect(nivel(e)).toBe("parcial");
    expect(e.veredictos_criterios[0].falta).toBe(FALTA_PREGUNTA_EN_MEDIO);
  });
  it("no_cumple se queda como lo dejó el evaluador", () => {
    const e = ev("en_medio", "no_cumple");
    criteriosPorHechoDePregunta(e, guion());
    expect(nivel(e)).toBe("no_cumple");
  });
  it("pregunta al final: el hecho no decide nada y el juez sí revisa", () => {
    const e = ev("al_final", "parcial"); const ps = guion();
    expect(criteriosPorHechoDePregunta(e, ps)).toEqual([]);
    expect(acusacionesConPrueba(e, ps, []).map((x) => x.id)).toContain("opening.estructura_apertura");
  });
  it("sin el hecho, no hace nada (falla abierta)", () => {
    const e = ev("en_medio", "cumple"); e.analisis_turnos = [{ turno: 1 } as any];
    expect(criteriosPorHechoDePregunta(e, guion())).toEqual([]);
    expect(nivel(e)).toBe("cumple");
  });
  it("closer-voice lo aplica antes del juez y se lo pasa", () => {
    const i = voz.indexOf("const criteriosPorHecho = criteriosPorHechoDePregunta(evaluation, practice_script);");
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(voz.indexOf("const acusaciones = acusacionesConPrueba(evaluation, practice_script, criteriosPorHecho);"));
  });
});
