/**
 * Definición declarativa de las 9 preguntas del onboarding del manager.
 * Cada pregunta vive en un bloque (1-3) y un step (0-8) del flujo.
 *
 * Step 0 = Welcome (sin pregunta)
 * Step 1-3 = Bloque 1 (Negocio): Q1, Q2, Q3
 * Step 4 = Bloque 1 cont: Q4 (ticket + frecuencia, dos campos)
 * Step 5 = Bloque 2 (Proceso): Q5 + Q6 + Q7
 * Step 6 = Bloque 3 (Solo tú sabes): Q8 + Q9
 * Step 7 = Calibración / preview Don Ramón
 * Step 8 = Company Sales Brain
 * Step 9 = Agregar vendedores
 */

export type QuestionId =
  | "q1_que_vendes"
  | "q2_a_quien"
  | "q3_como_gana"
  | "q4_ticket"
  | "q4_frecuencia"
  | "q5_interaccion"
  | "q6_duracion"
  | "q7_relacion"
  | "q8_diferenciador"
  | "q9_restricciones";

export interface QuestionDef {
  id: QuestionId;
  block: 1 | 2 | 3;
  text: string;
  subtext?: string;
}

export const QUESTIONS: Record<QuestionId, QuestionDef> = {
  q1_que_vendes: {
    id: "q1_que_vendes",
    block: 1,
    text: "¿Qué vendes exactamente?",
    subtext: "Productos, marcas, líneas principales. Sé específico.",
  },
  q2_a_quien: {
    id: "q2_a_quien",
    block: 1,
    text: "¿A quién le vendes?",
    subtext: "Tipo de negocio, quién decide la compra.",
  },
  q3_como_gana: {
    id: "q3_como_gana",
    block: 1,
    text: "¿Cómo gana tu cliente con lo que vendes?",
    subtext: "Qué beneficio real obtiene cuando compra tu producto.",
  },
  q4_ticket: {
    id: "q4_ticket",
    block: 1,
    text: "Ticket promedio por visita",
  },
  q4_frecuencia: {
    id: "q4_frecuencia",
    block: 1,
    text: "Frecuencia de compra",
  },
  q5_interaccion: {
    id: "q5_interaccion",
    block: 2,
    text: "¿Qué tipo de interacción hace tu equipo?",
    subtext: "Selecciona todas las que apliquen",
  },
  q6_duracion: {
    id: "q6_duracion",
    block: 2,
    text: "¿Cuánto dura normalmente una interacción de venta?",
  },
  q7_relacion: {
    id: "q7_relacion",
    block: 2,
    text: "¿El cliente normalmente ya te conoce o es completamente nuevo?",
  },
  q8_diferenciador: {
    id: "q8_diferenciador",
    block: 3,
    text: "¿Por qué un cliente les compra a ustedes y no a la competencia?",
    subtext: "Sé honesto. No lo que debería ser. Lo que realmente pasa.",
  },
  q9_restricciones: {
    id: "q9_restricciones",
    block: 3,
    text: "¿Qué nunca debe decir o hacer tu equipo en una venta?",
    subtext: "Errores que has visto, promesas que no se pueden cumplir, temas a evitar.",
  },
};

export const FRECUENCIA_OPTIONS = ["Semanal", "Cada 2 semanas", "Mensual", "Variable"];
export const INTERACCION_OPTIONS = [
  { id: "frio", label: "Visitas en frío a negocios", icon: "🚪" },
  { id: "recurrente", label: "Visitas a clientes recurrentes", icon: "🔄" },
  { id: "telefono", label: "Llamadas telefónicas", icon: "📞" },
  { id: "whatsapp", label: "WhatsApp o mensajes", icon: "💬" },
  { id: "mostrador", label: "Clientes que llegan al negocio", icon: "🏪" },
  { id: "citas", label: "Citas programadas", icon: "🤝" },
];
export const DURACION_OPTIONS = [
  "Menos de 5 minutos",
  "5 a 15 minutos",
  "15 a 30 minutos",
  "Más de 30 minutos",
];
export const RELACION_OPTIONS = [
  { id: "recurrentes", icon: "🔥", title: "Mayormente clientes recurrentes", desc: "Ya conocen a mis vendedores y la marca" },
  { id: "nuevos", icon: "❄️", title: "Mayormente clientes nuevos", desc: "Mis vendedores prospectan constantemente" },
  { id: "mitad", icon: "⚡", title: "Mitad y mitad", desc: "Mezcla de ambos tipos" },
];

export const TOTAL_STEPS = 8; // pasos visibles para la barra (welcome no cuenta)

/* ───────────────────────────────────────────────────────────────
   BLOQUE 4-6 — Catálogo comercial y territorio.
   El cuestionario es largo A PROPÓSITO: de aquí se alimenta todo
   Closer. Cada dato que no se pida es un dato que el sistema tiene
   que inventar. Se responde por secciones, con progreso guardado:
   el manager puede salir y volver sin perder nada.
   ─────────────────────────────────────────────────────────────── */

export type ExtQuestionKind = "textarea" | "text" | "pills" | "checks";

export interface ExtQuestion {
  /** Se mapea 1:1 a una llave del Company Sales Brain. */
  id: string;
  brainKey: string;
  text: string;
  subtext?: string;
  placeholder?: string;
  kind: ExtQuestionKind;
  min?: number;
  max?: number;
  options?: string[];
  /** Nota de uso que viaja al modelo junto con la respuesta. */
  usageNote?: string;
  optional?: boolean;
}

export interface ExtSection {
  id: string;
  block: number;
  label: string;
  intro?: string;
  questions: ExtQuestion[];
}

export const EXT_SECTIONS: ExtSection[] = [
  {
    id: "catalogo",
    block: 4,
    label: "Bloque 4 — Tu catálogo con números",
    intro:
      "Aquí es donde Closer deja de hablar en genérico. Con presentaciones, precios y cantidades reales, el entrenamiento y los pitches usan tus productos, no ejemplos inventados.",
    questions: [
      {
        id: "presentaciones_y_precios",
        brainKey: "PRESENTACIONES_Y_PRECIOS",
        text: "Presentaciones y precios de lista",
        subtext:
          "SKU o nombre + presentación + precio de lista. Una por línea. Entre más completo, menos tiene que inventar Closer.",
        placeholder:
          "Ej:\nBardahl 20W-50 · caja 12/1L · $1,140\nBardahl 20W-50 · cubeta 19L · $1,690\nRepsol Elite 5W-30 · caja 12/1L · $1,980",
        kind: "textarea",
        min: 40,
        max: 4000,
      },
      {
        id: "cantidades_tipicas",
        brainKey: "CANTIDADES_TIPICAS",
        text: "¿Qué pide un cliente promedio por visita?",
        subtext: "Cantidades reales por familia de producto. Es lo que hace creíble una sugerencia de incremento.",
        placeholder: "Ej: 2 cajas de 20W-50, 1 cubeta de multigrado, 1 caja de aditivos. Un taller chico: media caja.",
        kind: "textarea",
        min: 25,
        max: 1200,
      },
      {
        id: "promociones_y_condiciones",
        brainKey: "PROMOCIONES_Y_CONDICIONES",
        text: "Promociones vigentes, crédito y mínimos",
        subtext: "Lo que el vendedor SÍ puede ofrecer hoy. Si no está aquí, Closer no lo va a usar.",
        placeholder:
          "Ej: 10+1 en caja de 20W-50 hasta fin de mes. Crédito a 15 días con cliente de 3 meses. Pedido mínimo $2,000 para entrega sin costo.",
        kind: "textarea",
        min: 25,
        max: 1500,
      },
      {
        id: "productos_que_se_compran_juntos",
        brainKey: "PRODUCTOS_QUE_SE_COMPRAN_JUNTOS",
        text: "¿Qué familias suelen ir en el mismo pedido?",
        subtext:
          "Permite que el descubrimiento lateral apunte a lo probable en vez de barrer todo el catálogo.",
        placeholder: "Ej: quien lleva aceite de motor casi siempre lleva filtro y limpiador de inyectores; anticongelante va con líquido de frenos.",
        kind: "textarea",
        min: 25,
        max: 1200,
      },
    ],
  },
  {
    id: "cartera",
    block: 5,
    label: "Bloque 5 — Tu cartera y tu territorio",
    intro:
      "Esto define a quién enfrenta el vendedor y qué doctrina aplica Closer. Hoy el sistema lo está adivinando.",
    questions: [
      {
        id: "tipos_de_cliente_que_atiende",
        brainKey: "TIPOS_DE_CLIENTE_QUE_ATIENDE",
        text: "¿Qué tipos de cliente atiende tu equipo?",
        subtext: "Marca todos los que apliquen. En la siguiente línea nos dices la proporción aproximada.",
        kind: "checks",
        options: ["Cliente nuevo", "Cliente recurrente", "Autoconsumo", "Distribuidor"],
      },
      {
        id: "proporcion_tipos_cliente",
        brainKey: "TIPOS_DE_CLIENTE_QUE_ATIENDE_PROPORCION",
        text: "Proporción aproximada",
        subtext: "Aproximado está bien. Define qué pitch y qué doctrina pesa más.",
        placeholder: "Ej: 70% recurrente, 20% nuevo, 10% distribuidor.",
        kind: "text",
      },
      {
        id: "frecuencia_de_visita",
        brainKey: "FRECUENCIA_DE_VISITA",
        text: "¿Cada cuánto pasa un vendedor por el mismo cliente?",
        subtext: "Aparece directo en el pitch de cliente recurrente.",
        kind: "pills",
        options: ["Semanal", "Cada 2 semanas", "Mensual", "Variable / por ruta"],
      },
      {
        id: "familias_que_se_pierden",
        brainKey: "FAMILIAS_QUE_SE_PIERDEN_CON_LA_COMPETENCIA",
        text: "¿Qué familias te compra el cliente a otro proveedor?",
        subtext: "El hueco más grande de tu cartera. El pitch de recurrente lo prioriza.",
        placeholder: "Ej: filtros casi siempre los compran con el distribuidor local; en anticongelante nos ganan por precio.",
        kind: "textarea",
        min: 25,
        max: 1200,
      },
      {
        id: "perfiles_de_cliente",
        brainKey: "PERFILES_DE_CLIENTE_Y_QUE_MUEVE_CADA_UNO",
        text: "¿Qué compra típicamente cada perfil de cliente?",
        subtext:
          "Refaccionaria vs taller vs flotilla vs autoservicio. Sin esto el anclaje del Efecto Jones se queda genérico, y solo funciona si es específico y verdadero.",
        placeholder:
          "Ej: Refaccionaria: rota multigrado barato y filtros, le importa el margen. Taller: 20W-50 en cubeta, le importa que no le falte. Flotilla: volumen y factura.",
        kind: "textarea",
        min: 40,
        max: 2000,
      },
    ],
  },
  {
    id: "campo",
    block: 6,
    label: "Bloque 6 — Lo que se escucha en la calle",
    intro:
      "Materia prima directa del entrenamiento: los negativos reales de tu territorio y contra quién compite tu equipo.",
    questions: [
      {
        id: "negativos_comunes",
        brainKey: "NEGATIVOS_COMUNES_DEL_TERRITORIO",
        text: "¿Qué escuchan tus vendedores una y otra vez?",
        subtext:
          "Los negativos reales, con las palabras del cliente. Es de donde sale el Ataque Preventivo, que hoy no tiene de dónde salir.",
        placeholder:
          "Ej: \"ya tengo proveedor\", \"está muy caro el litro\", \"la marca no me la piden\", \"ahorita no tengo con qué\", \"déjame lo pienso\".",
        kind: "textarea",
        min: 30,
        max: 2000,
      },
      {
        id: "competencia_directa",
        brainKey: "COMPETENCIA_DIRECTA",
        text: "¿Contra quién compite tu equipo?",
        subtext:
          "Marcas y distribuidores que el cliente ya tiene o que pasan por el mismo territorio, y con qué llegan.",
        placeholder: "Ej: Roshfrans por precio, Mobil por marca, y un distribuidor local que da 30 días de crédito.",
        kind: "textarea",
        min: 25,
        max: 1500,
        usageNote:
          "USO ESTRICTO: este dato existe SOLO para que el vendedor sepa contra qué compite y no lo tomen por sorpresa. NUNCA para atacar al competidor, descalificarlo ni para afirmar ventajas comparativas. Eso es Nivel 1 de la doctrina.",
      },
    ],
  },
];

export const EXT_TOTAL_QUESTIONS = EXT_SECTIONS.reduce((n, s) => n + s.questions.length, 0);
