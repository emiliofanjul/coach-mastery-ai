// Harness de validaciones SIN llamar al modelo.
// Las validaciones de texto contra regla (largo, corchetes, skill_ids, ranks,
// veracidad, contexto, suggestive language) son puras: se prueban con outputs
// guardados y cuestan cero. Solo la verificación final necesita el modelo.
import { describe, expect, it } from "vitest";
import { validatePitch, MAX_CONTENT_CHARS, MAX_ALT_CHARS } from "@/lib/pitch-generator.server";

const BRAIN = [
  "DALFAN distribuye lubricantes y aditivos: anticongelantes, aceite de motor,",
  "línea diésel, línea moto, líquido de frenos. Presentaciones de 19 litros y",
  "cajas de 24. Cobertura en refaccionarias y talleres.",
].join(" ");

const ctx = (over: Partial<Parameters<typeof validatePitch>[1]> = {}) => ({
  validSkillIds: new Set(["linea_recta", "sce", "mindset"]),
  brain: BRAIN,
  clientType: "recurrente",
  ...over,
});

function section(over: Record<string, unknown> = {}) {
  return {
    step: 3,
    section_key: "descubrimiento",
    section_kind: "municion",
    content:
      "¿Qué familias son las que más se te mueven? ¿Anticongelantes? ¿Aceite de motor? ¿Diésel? " +
      "¿A cómo compras el líquido de frenos? ¿70? ¿80? ¿90? " +
      "¿Cada cuándo te surten? ¿Semanal? ¿Quincenal? ¿Mensual?",
    rationale_short: "Da opciones reales para que corrija con su dato.",
    rationale_long:
      "Suggestive Language: al sugerir familias y precios reales, el cliente elige o corrige con el dato exacto, y esa corrección es información que la pregunta abierta no saca.",
    skill_ids: ["sce"],

    alternatives: [{ rank: 1, content: "¿Qué línea se te queda parada? ¿Moto? ¿Diésel?", skill_ids: [] }],
    ...over,
  };
}

const wrap = (s: Record<string, unknown>) => ({ sections: [s] });

describe("validaciones de pitch sin modelo", () => {
  it("acepta un descubrimiento con Suggestive Language y sin corchetes", () => {
    const fails = validatePitch(wrap(section()), ctx({ only: "descubrimiento" }));
    expect(fails).toEqual([]);
  });

  it("V17 ahora también rechaza corchetes en secciones munición", () => {
    const fails = validatePitch(
      wrap(section({ content: section().content + " ¿Cuánto lleva de [familia específica]?" })),
      ctx({ only: "descubrimiento" }),
    );
    expect(fails.some((f) => f.startsWith("V17"))).toBe(true);
  });

  it("V25 exige al menos 3 preguntas con opciones sugeridas en el descubrimiento", () => {
    const fails = validatePitch(
      wrap(
        section({
          content:
            "¿Qué familias son las que más se te mueven? ¿A cómo compras el líquido de frenos? ¿Cada cuándo te surten?",
        }),
      ),
      ctx({ only: "descubrimiento" }),
    );
    expect(fails.some((f) => f.startsWith("V25"))).toBe(true);
  });

  it("V20 rechaza una sección más larga que su límite", () => {
    const long = "¿Sí? ¿No? ".repeat(400);
    const fails = validatePitch(
      wrap(section({ content: long })),
      ctx({ only: "descubrimiento" }),
    );
    expect(fails.some((f) => f.startsWith("V20"))).toBe(true);
    expect(long.length).toBeGreaterThan(MAX_CONTENT_CHARS["descubrimiento"]!);
  });

  it("V21 rechaza alternativas de más de 200 caracteres y más de 3", () => {
    const fails = validatePitch(
      wrap(
        section({
          alternatives: [
            { rank: 1, content: "a".repeat(MAX_ALT_CHARS + 1), skill_ids: [] },
            { rank: 2, content: "b", skill_ids: [] },
            { rank: 3, content: "c", skill_ids: [] },
            { rank: 4, content: "d", skill_ids: [] },
          ],
        }),
      ),
      ctx({ only: "descubrimiento" }),
    );
    expect(fails.filter((f) => f.startsWith("V21")).length).toBe(2);
  });

  it("V3 rechaza un skill_id inexistente", () => {
    const fails = validatePitch(
      wrap(section({ skill_ids: ["skill_que_no_existe"] })),
      ctx({ only: "descubrimiento" }),
    );
    expect(fails.some((f) => f.startsWith("V3"))).toBe(true);
  });
});
