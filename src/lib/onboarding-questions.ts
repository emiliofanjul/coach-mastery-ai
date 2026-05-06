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
