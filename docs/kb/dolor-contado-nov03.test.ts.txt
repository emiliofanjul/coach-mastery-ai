import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Mensaje 131 (3-nov-2026), Emilio: el dolor ya está contado cuando el cliente
// dijo qué le pasa y qué le cuesta. Ahí la pista ya está excavada y el vendedor
// sigue con lo demás; una pregunta mal elegida después no cuenta contra la
// escalera de capas. (G105: el mismo juez decía «cumple» en la disputa y
// «abandonó» en la evaluación, con la misma regla: la regla no decía cuándo
// el dolor ya estaba contado.)

const raiz = resolve(__dirname, "../../..");
const leer = (p: string) => readFileSync(resolve(raiz, p), "utf8");
const cerebro = leer("docs/kb/cerebro_snapshot.md");
const reglas: any[] = JSON.parse(leer("docs/kb/reglas.json"));
const escalera = reglas.find((r) => r.id === "discovery.escalera_capas");
const red = JSON.parse(leer("supabase/functions/_shared/eval_harness_v1.json"));

describe("cuándo el dolor ya está contado", () => {
  it("el Cerebro lo dice, en la Escalera de Capas, después de la pregunta cerrada en la capa 3", () => {
    const i = cerebro.indexOf("**La pregunta cerrada en la capa 3**");
    const j = cerebro.indexOf("**Cuándo el dolor ya está contado** `CAMPO`");
    expect(i).toBeGreaterThan(0);
    expect(j).toBeGreaterThan(i);
    expect(cerebro).toContain("cuando el cliente ya dijo qué le pasa y qué le cuesta");
    expect(cerebro).toContain("Te guardas el dolor para la presentación y sigues con lo demás");
  });

  it("la prueba de la regla lo aplica, sin quitar lo que ya pedía", () => {
    expect(escalera.resumen).toContain("LA PRUEBA:");
    expect(escalera.resumen).toContain("El dolor ya está contado cuando el cliente dijo qué le pasa y qué le cuesta");
    expect(escalera.resumen).toContain("lo que el vendedor pregunte después no la deshace");
    expect(escalera.resumen).toContain("eso no cuenta contra esta regla");
    expect(escalera.resumen).toContain("se quedó en ella y la excavó hasta que el cliente contó el dolor");
    expect(escalera.resumen).toContain("Devolverle el dolor con sus palabras no se pide aquí");
    // La razón de fondo (no perder el impulso del cliente) es de Emilio: no va en el texto.
    expect(escalera.resumen).not.toMatch(/impulso/i);
    // Su cita sigue siendo literal del Cerebro.
    expect(cerebro).toContain(escalera.cita_cerebro);
  });

  it("la red tiene los dos lados: G105 (dolor contado, sigue → cumple) y G106 (suelta las pistas sin dolor → falla)", () => {
    expect(red.harness_version).toBe("v3.35.0");
    const g105 = red.cases.find((c: any) => c.id === "G105_espejo_no_contradice_su_criterio");
    expect(g105.expected.niveles_esperados["discovery.preguntas_capas"]).toBe("cumple");
    expect(g105.expected.must_not_flag).toContain("ignora_pistas");
    const g106 = red.cases.find((c: any) => c.id === "G106_suelta_la_pista_sin_el_dolor");
    expect(g106.node_id).toBe("3.2");
    expect(g106.expected.must_flag).toEqual(["ignora_pistas"]);
    const cliente = g106.transcript.filter((t: any) => t.role === "assistant").map((t: any) => t.text).join(" ");
    expect(cliente).toContain("aunque a veces se tarda en surtir");
    expect(cliente).toContain("Lo único es que el de las grasas luego me falla");
    // El cliente nunca dice qué le cuesta: el dolor no está contado.
    expect(cliente).not.toMatch(/pierdo|se me va|se me van|más caro|margen/);
  });
});
