// Mensaje 121 (2-nov-2026) · El juez cita, y el código comprueba sus citas.
// G42: el juez dijo tres de tres veces que «ante respuestas vagas no siguió con
// opciones», y el turno que sigue a la respuesta vaga es justo dar opciones.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PROMPT_JUEZ, HERRAMIENTA_JUICIOS, juiciosDeRespuesta, citaEnConversacion, juiciosConCitasValidas } from "../../../supabase/functions/_shared/juez_pruebas.ts";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const voz = leer("supabase/functions/closer-voice/index.ts");
const harness = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));
const g42 = harness.cases.find((c: any) => c.id === "G42_intenta_de_verdad_sin_hueco").transcript.map((t: any) => ({ role: t.role, content: t.text }));

describe("El juez cita antes de decidir", () => {
  it("el prompt y la herramienta piden citas con turno", () => {
    expect(PROMPT_JUEZ).toContain("8. CITA ANTES DE DECIDIR.");
    expect(PROMPT_JUEZ).toContain("cita las dos cosas: lo que pasó y el turno que siguió");
    const it = HERRAMIENTA_JUICIOS.input_schema.properties.juicios.items as any;
    expect(it.required).toEqual(["id", "tipo", "citas", "respuesta", "conducta"]);
    expect(Object.keys(it.properties).indexOf("citas")).toBeLessThan(Object.keys(it.properties).indexOf("conducta"));
  });
  it("las citas llegan en el juicio", () => {
    const r = { content: [{ type: "tool_use", name: HERRAMIENTA_JUICIOS.name, input: { juicios: [
      { id: "discovery.hueco", tipo: "criterio", citas: [{ turno: 6, quien: "cliente", dijo: "de todo un poco" }], respuesta: "x", conducta: "reprueba" }] } }] };
    expect(juiciosDeRespuesta(r)?.[0].citas).toEqual([{ turno: 6, quien: "cliente", dijo: "de todo un poco" }]);
  });
});

describe("El código comprueba las citas (G42)", () => {
  it("una cita que sí está en su turno, aunque le falten signos", () => {
    expect(citaEnConversacion({ turno: 6, quien: "cliente", dijo: "Pues de todo un poco, lo normal de una refaccionaria" }, g42)).toBe(true);
    expect(citaEnConversacion({ turno: 7, quien: "vendedor", dijo: "Como anticongelante grasas o aditivos" }, g42)).toBe(true);
  });
  it("una cita en otro turno, de otra persona o inventada, no vale", () => {
    expect(citaEnConversacion({ turno: 7, quien: "vendedor", dijo: "de todo un poco, lo normal" }, g42)).toBe(false);
    expect(citaEnConversacion({ turno: 6, quien: "vendedor", dijo: "de todo un poco" }, g42)).toBe(false);
    expect(citaEnConversacion({ turno: 7, quien: "vendedor", dijo: "le dejo una caja de líquido de frenos" }, g42)).toBe(false);
    expect(citaEnConversacion({ turno: 99, quien: "vendedor", dijo: "hola" }, g42)).toBe(false);
  });
  it("el juicio que quita algo con una cita falsa o sin citas se descarta; queda lo del evaluador", () => {
    const { validos, descartados } = juiciosConCitasValidas([
      { id: "a", tipo: "criterio", conducta: "pasa", citas: [{ turno: 7, quien: "vendedor", dijo: "Como anticongelante, grasas o aditivos" }] },
      { id: "b", tipo: "criterio", conducta: "pasa", citas: [{ turno: 7, quien: "vendedor", dijo: "de todo un poco, lo normal" }] },
      { id: "c", tipo: "falla", conducta: "pasa" },
    ], g42);
    expect(validos.map((j) => j.id)).toEqual(["a"]);
    expect(descartados.map((d) => d.id)).toEqual(["b", "c"]);
  });
  it("closer-voice aplica solo los juicios con citas válidas y deja en el log lo que recibió el juez", () => {
    expect(voz).toContain("const { validos, descartados } = juiciosConCitasValidas(juicios, fullHistory);");
    expect(voz).toContain("quitadasPorJuez = aplicarJuicios(evaluation, acusaciones, validos);");
    expect(voz).toContain("acusaciones: acusaciones.map((a) => ({ id: a.id, tipo: a.tipo, senalado: a.senalado.slice(0, 300) }))");
    // Mensaje 130: el tope del juez ya no es fijo (2000): crece con las acusaciones.
    expect(voz).toContain("max_tokens: tope, temperature: 0, system: PROMPT_JUEZ,");
  });
});

describe("Mensaje 122: un «reprueba» no se descarta, y lo que no pasó también se cita", () => {
  it("el juicio que reprueba se queda aunque no traiga citas (no cambia nada)", () => {
    const { validos, descartados } = juiciosConCitasValidas([{ id: "impulse.efecto_jones", tipo: "criterio", conducta: "reprueba" }], g42);
    expect(validos.map((j) => j.id)).toEqual(["impulse.efecto_jones"]);
    expect(descartados).toEqual([]);
  });
  it("el no_aplica sin citas sí se descarta", () => {
    expect(juiciosConCitasValidas([{ id: "x", tipo: "criterio", conducta: "no_aplica" }], g42).descartados.map((d) => d.id)).toEqual(["x"]);
  });
  it("el prompt pide citar dónde habría tenido que pasar", () => {
    expect(PROMPT_JUEZ).toContain("Si la prueba depende de que algo NO pasó, cita los turnos donde habría tenido que pasar.");
  });
});
