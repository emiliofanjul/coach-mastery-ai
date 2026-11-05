import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { fallasPorHechoDeLosNo, REGLA_INSISTIR } from "../../../supabase/functions/_shared/hechos_no";

// Mensaje 132 (Emilio, 3-nov-2026): «Es un segundo no, pero con una invitación
// a seguir, que incluso es un buying sign posible». G31: «de verdad traigo
// prisa. ¿Qué necesita saber exactamente?» salía como segundo «no» y le
// cobraban «insiste_tras_dos» al vendedor por contestar.

const raiz = resolve(__dirname, "../../..");
const leer = (p: string) => readFileSync(resolve(raiz, p), "utf8");
const voz = leer("supabase/functions/closer-voice/index.ts");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const regla = (id: string) => reglas.find((r) => r.id === id).resumen as string;
const red = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));

const guion = { failure_criteria: [{ id: "insiste_tras_dos", regla_id: REGLA_INSISTIR, severity: "critical" }] };
const historia = [
  { role: "user", content: "¡Buenas tardes, Don Rafa! ¿Así ha estado toda la semana?" },
  { role: "assistant", content: "No me interesa, gracias." },
  { role: "user", content: "Claro que sí, entiendo. ¿Y cuánto tiempo lleva con el negocio?" },
  { role: "assistant", content: "De verdad, ahorita ando a tope. A ver, ¿qué necesita? Dígame rápido." },
  { role: "user", content: "Voy rápido: ¿la tornillería con quién la trae?" },
];
const hechos = (h: string[]) => ({
  flags_detected: [] as string[],
  analisis_turnos: h.map((cliente_antes, i) => ({ turno: i + 1, texto_literal: "x", ultima_frase: "x", pregunta: "al_final", cliente_antes, se_va: "no", veredicto: "cumple", por_que: "x" })),
});

describe("el «no» que invita a seguir", () => {
  it("si el SEGUNDO «no» invita, contestarle no es insistir: no hay falla", () => {
    expect(fallasPorHechoDeLosNo(hechos(["no_hay", "rechaza", "rechaza_e_invita"]), guion, historia)).toEqual([]);
  });
  it("si el segundo «no» cierra, sigue siendo insistir (aunque el primero haya invitado)", () => {
    expect(fallasPorHechoDeLosNo(hechos(["no_hay", "rechaza", "rechaza"]), guion, historia)).toEqual(["insiste_tras_dos"]);
    expect(fallasPorHechoDeLosNo(hechos(["no_hay", "rechaza_e_invita", "rechaza"]), guion, historia)).toEqual(["insiste_tras_dos"]);
  });
  it("el evaluador lo anota como su propio hecho", () => {
    expect(voz).toContain('"cliente_antes": "<rechaza | rechaza_e_invita | no_rechaza | no_hay>"');
    expect(voz).toContain('"rechaza_e_invita" (dice que no, pero en la misma respuesta invita al vendedor a seguir');
    expect(voz).toContain("seguir para contestar su invitación NO es insistir");
  });
  it("el Cerebro y las tres reglas lo dicen", () => {
    expect(cerebro).toContain("**El «no» que invita** `CAMPO`");
    expect(cerebro).toContain("Contestarle no es insistir: hasta puede ser una señal de interés.");
    for (const id of ["blocks.insistir_tras_dos_no", "flow.dos_no_seguidos"]) {
      expect(regla(id)).toContain("sí es un «no», pero la puerta sigue abierta: contestar su invitación no es insistir.");
    }
    expect(regla("blocks.dos_no_seguidos")).toContain("contestarle no es insistir, y el criterio es no_aplica");
    // La prueba de un «no» sigue igual, letra por letra, en las dos reglas que la traen.
    const pruebaNo = (id: string) => regla(id).slice(regla(id).indexOf("LA PRUEBA DE UN «NO»"));
    expect(pruebaNo("blocks.insistir_tras_dos_no")).toBe(pruebaNo("flow.dos_no_seguidos"));
  });
  it("la red tiene el gemelo de G35: G107, donde el segundo «no» invita y el vendedor contesta corto", () => {
    expect(red.harness_version).toMatch(/^v3\.(3[6-9]|[4-9]\d)\./);
    const c = red.cases.find((x: any) => x.id === "G107_no_que_invita");
    expect(c.node_id).toBe("2.7c");
    expect(c.expected.must_not_flag).toContain("insiste_tras_dos");
    expect(c.transcript[3].text).toContain("¿qué necesita? Dígame rápido");
    const g35 = red.cases.find((x: any) => x.id === "G35_insiste_tras_dos_no");
    expect(g35.expected.must_flag).toEqual(["insiste_tras_dos"]);
  });
  it("cambió cómo se califica: la versión lo dice", () => {
    expect(voz).toContain('const PROMPT_VERSION = "v2.9.9";');
  });
});
