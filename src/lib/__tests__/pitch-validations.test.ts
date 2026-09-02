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
  "Precio de lista: cubeta de 19 litros $1,850; caja de 24 $1,200.",
].join(" ");

// Brain SIN precios: para probar que V26 bloquea los rangos inventados.
const BRAIN_SIN_PRECIOS = BRAIN.replace("Precio de lista: cubeta de 19 litros $1,850; caja de 24 $1,200.", "");


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

// ── Fixtures de fallas REALES en producción ──────────────────────────────
// Estos outputs ya pasaron: son los mejores casos de prueba que existen.
describe("fixtures de outputs reales que fallaron", () => {
  it("V20: el descubrimiento de 5,573 caracteres (autoconsumo podrido)", () => {
    const fails = validatePitch(
      wrap(section({ content: "¿Anticongelantes? ¿Aceite? ".repeat(250) })),
      ctx({ only: "descubrimiento" }),
    );
    expect(fails.some((f) => f.startsWith("V20"))).toBe(true);
  });

  it("V22: los talleres inventados de Insurgentes", () => {
    const fails = validatePitch(
      {
        sections: [
          {
            step: 2,
            section_key: "historia_breve",
            section_kind: "guion",
            content:
              "Mire, en el taller Hermanos Pérez de avenida Insurgentes 420 subieron la rotación 30% desde que trabajan con nosotros.",
            rationale_short: "Prueba social.",
            rationale_long: "Efecto Jones con un caso concreto.",
            skill_ids: ["linea_recta"],
            alternatives: [],
          },
        ],
      },
      ctx(),
    );
    expect(fails.some((f) => f.startsWith("V22"))).toBe(true);
  });

  it("V26: marca sugerida que la empresa no maneja", () => {
    const fails = validatePitch(
      wrap(
        section({
          content:
            section().content +
            " ¿Qué marcas manejas? ¿Castrol? ¿Pennzoil? ¿Mobil?",
        }),
      ),
      ctx({ only: "descubrimiento" }),
    );
    expect(fails.filter((f) => f.startsWith("V26")).length).toBeGreaterThan(0);
  });

  it("V26: rango de precio inventado cuando el brain no trae precios", () => {
    const fails = validatePitch(
      wrap(
        section({
          content:
            "¿Qué familias se te mueven? ¿Anticongelantes? ¿Aceite de motor? " +
            "¿Cada cuándo te surten? ¿Semanal? ¿Quincenal? " +
            "¿Cada cuánto te ajustan? ¿Mensual? ¿Trimestral? " +
            "¿A cómo compras el aceite multigrado? ¿70? ¿80? ¿90?",
        }),
      ),
      ctx({ only: "descubrimiento", brain: BRAIN_SIN_PRECIOS }),
    );
    expect(fails.some((f) => f.startsWith("V26"))).toBe(true);
  });

  it("V26: no dispara con marcas que sí están en el brain", () => {
    const fails = validatePitch(
      wrap(section({ content: section().content + " ¿Trae Bardahl o Repsol?" })),
      ctx({
        only: "descubrimiento",
        brain: BRAIN + " Distribuimos las marcas Repsol, Bardahl y Mexlub.",
      }),
    );
    expect(fails.some((f) => f.startsWith("V26"))).toBe(false);
  });
});
