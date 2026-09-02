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
  relationship: "recurrente",
  clientType: "revende",
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

// ── V27 / V14b ───────────────────────────────────────────────────────────
describe("territorio precio y preguntas que asumen hechos", () => {
  const CON_PRECIO_DESNUDO =
    "¿Qué familias son las que más se te mueven? ¿Anticongelantes? ¿Aceite de motor? ¿Diésel? " +
    "¿Cada cuándo te surten? ¿Semanal? ¿Quincenal? ¿Mensual? " +
    "¿Qué presentación te sirve más? ¿Cubeta de 19? ¿Caja de 24? " +
    "¿A cómo estás comprando hoy el aceite de motor?";

  it("V27 rechaza la pregunta de precio sin opciones sugeridas", () => {
    const fails = validatePitch(
      wrap(section({ content: CON_PRECIO_DESNUDO })),
      ctx({ only: "descubrimiento", brain: BRAIN_SIN_PRECIOS }),
    );
    expect(fails.some((f) => f.startsWith("V27"))).toBe(true);
  });

  it("V27 acepta sugerir sobre plazo/frecuencia cuando el brain no trae precios", () => {
    const fails = validatePitch(
      {
        sections: [
          section({
            content:
              "¿Qué familias son las que más se te mueven? ¿Anticongelantes? ¿Aceite de motor? ¿Diésel? " +
              "¿Cada cuándo te surten? ¿Semanal? ¿Quincenal? ¿Mensual? " +
              "¿Cada cuándo te suben? ¿Cada mes? ¿Cada trimestre? ¿Sin aviso? " +
              "¿Te manejan crédito o de contado? ¿A 15 días? ¿A 30?",
          }),
        ],
        missing_data: ["los precios de lista por presentación"],
      },
      ctx({ only: "descubrimiento", brain: BRAIN_SIN_PRECIOS }),
    );
    expect(fails.filter((f) => f.startsWith("V27"))).toEqual([]);
    expect(fails.some((f) => f.startsWith("V26"))).toBe(false);
  });

  it("V27 exige que missing_data pida los precios de lista", () => {
    const fails = validatePitch(
      wrap(
        section({
          content:
            "¿Qué familias son las que más se te mueven? ¿Anticongelantes? ¿Aceite de motor? ¿Diésel? " +
            "¿Cada cuándo te surten? ¿Semanal? ¿Quincenal? ¿Mensual? " +
            "¿Cada cuándo te suben? ¿Cada mes? ¿Cada trimestre? ¿Sin aviso?",
        }),
      ),
      ctx({ only: "descubrimiento", brain: BRAIN_SIN_PRECIOS }),
    );
    expect(fails.some((f) => f.startsWith("V27") && /missing_data/.test(f))).toBe(true);
  });

  it("V14b rechaza la pregunta que asume que trabaja con varios proveedores", () => {
    const fails = validatePitch(
      wrap(
        section({
          content:
            section().content +
            " ¿Qué es lo que más te pesa de trabajar con varios proveedores?",
        }),
      ),
      ctx({ only: "descubrimiento" }),
    );
    expect(fails.some((f) => f.startsWith("V14b"))).toBe(true);
  });

  it("V14b no dispara con la versión en dos pasos", () => {
    const fails = validatePitch(
      wrap(
        section({
          content:
            section().content +
            " ¿Con cuántos proveedores te manejas hoy? ¿Uno? ¿Dos? ¿Más?",
        }),
      ),
      ctx({ only: "descubrimiento" }),
    );
    expect(fails.some((f) => f.startsWith("V14b"))).toBe(false);
  });
});

// ── Dos ejes: relación (nuevo|recurrente) × uso (revende|consume|distribuye) ──
describe("dos ejes: relación y uso", () => {
  const pres = (content: string) => ({
    step: 4,
    section_key: "presentacion",
    section_kind: "guion",
    content,
    rationale_short: "Conecta el dolor con la solución y pone el precio.",
    rationale_long:
      "La presentación resuelve el dolor encontrado y aterriza el precio en su triple desglose para que la cifra llegue con motivo y no sola.",
    skill_ids: ["linea_recta"],
    alternatives: [{ rank: 1, content: "Te lo dejo en cubeta y te bajo el costo por litro.", skill_ids: [] }],
  });

  it("V28: acepta la presentación con triple desglose (dos cifras con motivo)", () => {
    const fails = validatePitch(
      wrap(
        pres(
          "Lo que te está costando es la merma. Te lo resuelvo con presentación grande: " +
            "la cubeta de 19 litros te sale en $1,850 porque el costo por litro baja con el volumen, " +
            "y la caja de 24 en $1,200 porque ahí ya entras a precio de lista de distribuidor.",
        ),
      ),
      ctx({ only: "presentacion" }),
    );
    expect(fails.filter((f) => f.startsWith("V28"))).toEqual([]);
  });

  it("V28: rechaza la presentación sin desglose ni petición de precios", () => {
    const fails = validatePitch(
      wrap(pres("Lo que te está costando es la merma y eso te lo resuelvo con nuestra línea premium.")),
      ctx({ only: "presentacion" }),
    );
    expect(fails.some((f) => f.startsWith("V28"))).toBe(true);
  });

  it("V28: acepta estructura sin cifras si missing_data pide los precios de lista", () => {
    const fails = validatePitch(
      wrap(
        pres(
          "Te resuelvo la merma con presentación grande: el precio se desglosa por presentación, " +
            "por volumen y por plazo de pago, para que veas dónde ganas en cada escalón.",
        ),
      ),
      ctx({
        only: "presentacion",
        brain: BRAIN_SIN_PRECIOS,
        missingData: ["Tus precios de lista por presentación."],
      }),
    );
    expect(fails.filter((f) => f.startsWith("V28"))).toEqual([]);
  });

  it("V28/V9: rechaza enumerar SKUs con cantidades en la presentación", () => {
    const fails = validatePitch(
      wrap(
        pres(
          "Te llevas 3 cubetas de anticongelante a $1,850, 2 cajas de aceite de motor de 24 a $1,200 " +
            "y 4 cubetas de diésel a $1,850, y con eso cubres el mes completo sin quedarte corto.",
        ),
      ),
      ctx({ only: "presentacion" }),
    );
    // El resumen del pedido pertenece al cierre, no aquí.
    expect(fails.length).toBeGreaterThan(0);
  });

  it("V29: recurrente no se presenta con nombre y empresa", () => {
    const fails = validatePitch(
      wrap({
        step: 1,
        section_key: "introduccion",
        section_kind: "guion",
        content: "Buenas, soy Emilio de DALFAN, vengo a ver cómo le fue con lo del mes pasado.",
        rationale_short: "Abre la visita.",
        rationale_long:
          "La apertura debe reconectar con el cliente sin robarle tiempo y abrir la conversación de seguimiento.",
        skill_ids: ["linea_recta"],
        alternatives: [{ rank: 1, content: "Buenas, ¿cómo le fue con lo del mes pasado?", skill_ids: [] }],
      }),
      ctx({ only: "introduccion", relationship: "recurrente" }),
    );
    expect(fails.some((f) => f.startsWith("V29"))).toBe(true);
  });

  it("V29: recurrente no abre preguntando características permanentes", () => {
    const fails = validatePitch(
      wrap({
        step: 1,
        section_key: "introduccion",
        section_kind: "guion",
        content: "Qué tal, ¿ya tiene rato con el negocio aquí?",
        rationale_short: "Abre la visita.",
        rationale_long:
          "La apertura debe reconectar con el cliente sin robarle tiempo y abrir la conversación de seguimiento.",
        skill_ids: ["linea_recta"],
        alternatives: [{ rank: 1, content: "Qué tal, ¿cómo se movió la semana?", skill_ids: [] }],
      }),
      ctx({ only: "introduccion", relationship: "recurrente" }),
    );
    expect(fails.some((f) => f.startsWith("V29"))).toBe(true);
  });

  it("V30: nuevo no puede referenciar interacciones previas", () => {
    const fails = validatePitch(
      wrap({
        step: 6,
        section_key: "consolidacion",
        section_kind: "guion",
        content: "Te lo mando como la vez pasada y quedamos igual que siempre.",
        rationale_short: "Cierra la visita dejando el siguiente paso puesto.",
        rationale_long:
          "La consolidación deja amarrado el siguiente contacto para que la relación no dependa de que el cliente se acuerde.",
        skill_ids: ["linea_recta"],
        alternatives: [{ rank: 1, content: "Te lo mando el jueves y paso el lunes.", skill_ids: [] }],
      }),
      ctx({ only: "consolidacion", relationship: "nuevo" }),
    );
    expect(fails.some((f) => f.startsWith("V30"))).toBe(true);
  });

  it("V4: a un cliente que CONSUME no se le pregunta qué vende", () => {
    const fails = validatePitch(
      wrap({
        step: 1,
        section_key: "introduccion",
        section_kind: "guion",
        content: "Qué tal, ¿qué vende más aquí?",
        rationale_short: "Abre la visita.",
        rationale_long:
          "La apertura debe abrir conversación sin robarle tiempo y sin entrar todavía al descubrimiento.",
        skill_ids: ["linea_recta"],
        alternatives: [{ rank: 1, content: "Qué tal, ¿qué tal la semana?", skill_ids: [] }],
      }),
      ctx({ only: "introduccion", relationship: "nuevo", clientType: "consume" }),
    );
    expect(fails.some((f) => f.startsWith("V4"))).toBe(true);
  });
});

// ── V26 extendida a todas las secciones: dinero inventado ──
describe("V26 en todas las secciones (cifras de dinero sin sustento)", () => {
  const pres4 = (content: string) => ({
    step: 4,
    section_key: "presentacion",
    section_kind: "guion",
    content,
    rationale_short: "Conecta el dolor con la solución y pone el precio en escalera con su motivo.",
    rationale_long:
      "La presentación resuelve el dolor encontrado y aterriza el precio en su desglose para que la cifra llegue con motivo y no sola.",
    skill_ids: ["linea_recta"],
    alternatives: [{ rank: 1, content: "Te lo dejo en cubeta y baja el costo por litro.", skill_ids: [] }],
  });

  it("rechaza la presentación con cifras de precio que NO están en el brain", () => {
    const fails = validatePitch(
      wrap(
        pres4(
          "El precio de lista son $850 por cubeta. Como es cliente recurrente le queda en $780, " +
            "y de contado cierra en $720: son $130 de ahorro por cubeta.",
        ),
      ),
      ctx({ only: "presentacion", brain: BRAIN_SIN_PRECIOS }),
    );
    expect(fails.some((f) => f.startsWith("V26"))).toBe(true);
  });

  it("acepta cifras de precio que sí están en el brain", () => {
    const fails = validatePitch(
      wrap(
        pres4(
          "La cubeta de 19 litros te sale en $1,850 porque el costo por litro baja con el volumen, " +
            "y la caja de 24 en $1,200 porque ahí entras a precio de lista.",
        ),
      ),
      ctx({ only: "presentacion" }),
    );
    expect(fails.filter((f) => f.startsWith("V26"))).toEqual([]);
    expect(fails.filter((f) => f.startsWith("V28"))).toEqual([]);
  });

  it("no bloquea plazos, frecuencias ni cantidades", () => {
    const fails = validatePitch(
      wrap(
        pres4(
          "Le sale en el precio de lista; como es cliente recurrente le aplica el descuento por " +
            "volumen; y de contado baja otro tanto. Le surtimos cada 15 días y le entregamos en 24 horas.",
        ),
      ),
      ctx({
        only: "presentacion",
        brain: BRAIN_SIN_PRECIOS,
        missingData: ["Precios de lista por presentación"],
      }),
    );
    expect(fails.filter((f) => f.startsWith("V26"))).toEqual([]);
    expect(fails.filter((f) => f.startsWith("V28"))).toEqual([]);
  });

  it("V11 acepta rationale_short de hasta 30 palabras", () => {
    const short = Array.from({ length: 30 }, (_, i) => `palabra${i + 1}`).join(" ");
    const fails = validatePitch(
      wrap(pres4("Le sale en el precio de lista; de contado baja otro tanto.")),
      ctx({ only: "presentacion", brain: BRAIN_SIN_PRECIOS, missingData: ["precios de lista"] }),
    );
    expect(fails.filter((f) => f.startsWith("V11"))).toEqual([]);
    const fails31 = validatePitch(
      wrap({ ...pres4("Le sale en el precio de lista; de contado baja otro tanto."), rationale_short: short + " extra" }),
      ctx({ only: "presentacion", brain: BRAIN_SIN_PRECIOS, missingData: ["precios de lista"] }),
    );
    expect(fails31.some((f) => f.startsWith("V11"))).toBe(true);
  });
});

// ── Datos faltantes: agrupación, deduplicación y variables del lector ──
import { normalizeMissingData, fillReaderPlaceholders } from "@/lib/pitches";

describe("missing_data agrupado", () => {
  it("deduplica tres redacciones de precios en un solo tema", () => {
    const items = normalizeMissingData([
      "¿Cuáles son tus precios de lista?",
      "Necesito la lista de precios por presentación",
      "¿Qué descuentos aplicas por volumen?",
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]!.brain_key).toBe("PRESENTACIONES_Y_PRECIOS");
    expect(items[0]!.detalle).toHaveLength(3);
    expect(items[0]!.secciones_afectadas).toContain("presentacion");
  });

  it("descarta el nombre y el teléfono del vendedor: no son datos faltantes", () => {
    const items = normalizeMissingData([
      "¿Cuál es el nombre del vendedor?",
      "¿Cuál es el teléfono del vendedor para el cierre?",
    ]);
    expect(items).toHaveLength(0);
  });

  it("ordena por prioridad: precios antes que seguimiento", () => {
    const items = normalizeMissingData([
      "¿Cada cuándo se hace el seguimiento posventa?",
      "¿Cuáles son tus precios de lista?",
    ]);
    expect(items[0]!.prioridad).toBe("alta");
    expect(items[1]!.brain_key).toBe("SEGUIMIENTO");
  });
});

describe("variables del lector", () => {
  it("sustituye [tu nombre] con el nombre de quien lee", () => {
    expect(fillReaderPlaceholders("Soy [tu nombre], de Bardahl.", { name: "Emilio" })).toBe(
      "Soy Emilio, de Bardahl.",
    );
  });

  it("deja el marcador si el perfil no trae el dato", () => {
    expect(fillReaderPlaceholders("Soy [tu nombre].", {})).toBe("Soy [tu nombre].");
  });
});
