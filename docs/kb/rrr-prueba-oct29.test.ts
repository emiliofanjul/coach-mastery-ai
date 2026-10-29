// Mensaje 107 (29-oct-2026). En el 106, el P3_1 (ejecución perfecta del 3.1)
// sacó 70 en dos de tres corridas: el evaluador dejó RRR en parcial porque «el
// primer turno no lee el estado visible». La regla decía «Leer ambiente,
// demografía y estado de ánimo, y adaptarse primero», sin prueba: «primero» se
// leía como «en tu primera frase», cuando el Cerebro dice quién se adapta («Tú
// te adaptas primero»), y antes de que el cliente conteste no hay estado que
// leer en la conversación. Ahora es una prueba, y el juez la revisa.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { acusacionesConPrueba } from "../../../supabase/functions/_shared/juez_pruebas";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const nodos: any[] = JSON.parse(leer("docs/kb/nodos_snapshot.json"));
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const r = reglas.find((x) => x.id === "discovery.rrr");

describe("Primero el Cerebro", () => {
  it("lo que se lee y quién se adapta", () => {
    expect(cerebro).toContain("Tres cosas que leer: **el ambiente, la demografía de la persona, y su estado de ánimo.**");
    expect(cerebro).toContain("no quieres forzar a nadie a subir a tu nivel de emoción ni a adaptarse a ti. **Tú te adaptas primero.**");
    expect(cerebro).toContain(r.cita_cerebro);
  });
});

describe("La regla es una prueba", () => {
  it("lee, conecta y relaja ante el estado que el cliente ya mostró", () => {
    expect(r.resumen).toContain("LA PRUEBA: ante el estado que el cliente ya mostró —en lo que dice, en cómo lo dice o en lo que se ve—, ¿el vendedor lo lee (lo menciona o reacciona a él), conecta (lo reconoce con naturalidad) y relaja (ajusta su ritmo y su forma a ese estado)?");
  });
  it("solo se pide leer lo que ya se mostró; «primero» es quién se adapta", () => {
    expect(r.resumen).toContain("Solo se le pide leer lo que ya se mostró en la conversación: si el estado del cliente no aparece hasta que contesta, la lectura empieza ahí.");
    expect(r.resumen).toContain("«Primero» quiere decir que el que se adapta eres tú, no el cliente.");
    expect(r.resumen).not.toContain("adaptarse primero.");
  });
  it("sigue siendo la herramienta del paso 3, con su severidad", () => {
    expect(r).toMatchObject({ paso: 3, tipo: "herramienta", canal: "universal", procedencia: "FUENTE", severidad_sugerida: "major" });
  });
  it("la usan el 3.1 y el 3.10, y el juez ya revisa sus acusaciones", () => {
    const usan = nodos.filter((n) => [...(n.practice_script?.success_criteria ?? []), ...(n.practice_script?.failure_criteria ?? [])].some((c: any) => c.regla_id === "discovery.rrr")).map((n) => n.id).sort();
    expect(usan).toEqual(["3.1", "3.10"]);
    const ps = { success_criteria: [{ id: "mindset.rrr", regla_resumen: r.resumen }], failure_criteria: [] };
    const ev = { flags_detected: [], veredictos_criterios: [{ criterio_id: "mindset.rrr", nivel: "parcial", falta: "el primer turno no lee el estado visible" }] };
    expect(acusacionesConPrueba(ev, ps).map((a) => a.id)).toEqual(["mindset.rrr"]);
  });
});

describe("La red", () => {
  it("P3_1 sigue esperando 85–100 con RRR en cumple", () => {
    const c = harness.cases.find((x: any) => x.id === "P3_1_perfecto");
    expect(c.expected.score_range).toEqual([85, 100]);
    expect(c.expected.niveles_esperados["mindset.rrr"]).toBe("cumple");
  });
});
