/**
 * El onboarding del manager (oct-2026, diseñado con Emilio).
 *
 * Principio: "Closer ya sabe vender. Cuéntanos de tu empresa para que tus
 * vendedores practiquen con clientes iguales a los tuyos." El manager no le
 * enseña ventas a Closer: solo le dice cómo es su negocio y cómo opera.
 *
 * Cada pregunta existe porque una herramienta de la doctrina necesita un dato
 * que solo la empresa tiene (ver la tabla en la conversación del 9-oct):
 *   · los dos ejes del cliente (Cerebro 4.0b) → P2 y P4
 *   · territorio producto y hueco → P1 (líneas, no SKU ni precios)
 *   · la formalidad según el tamaño del cliente (doctrina de campo) → P3
 *   · modificadores de canal (Parte 5) y estilo (Nivel 4) → P5
 *   · Teoría de las Balas → P6 (lo que OFRECEN; si es bala lo decide Closer)
 *   · Triple desglose y la regla de no inventar impulso → P7
 *   · Ataque preventivo → P8
 *   · Restricciones de la empresa → P9
 * Lo que la doctrina resuelve sola (los dolores, el vocabulario por tipo de
 * cliente, con quién habla el vendedor) NO se pregunta.
 *
 * Todo aquí es puro: lo usan la pantalla y las pruebas.
 */

export type Respuesta = string | string[];
export type Respuestas = Record<string, Respuesta>;

export interface CampoOpciones {
  tipo: "opciones";
  id: string;
  etiqueta?: string;
  opciones: string[];
  multiple: boolean;
  /** Máximo de opciones (solo si multiple). */
  max?: number;
  /** Opciones que piden un dato corto al marcarlas: opción → placeholder. */
  detalle?: Record<string, string>;
  /** Solo se muestra (y se exige) si otro campo tiene este valor. */
  siCampo?: { id: string; valor: string };
  opcional?: boolean;
}
export interface CampoTexto {
  tipo: "texto";
  id: string;
  etiqueta?: string;
  placeholder: string;
  /** Mínimo de caracteres si es requerido. */
  min?: number;
  opcional?: boolean;
}
export type Campo = CampoOpciones | CampoTexto;

export interface Pregunta {
  id: string;
  numero: number;
  bloque: 1 | 2 | 3 | 4;
  texto: string;
  subtexto?: string;
  /** "¿Para qué lo usa Closer?" — se despliega al tocarlo. */
  porQue: string;
  campos: Campo[];
  /** Las del bloque 4 las propone Closer y el manager confirma. */
  propuestaPorCloser?: "negativos" | "restricciones";
}

export const BLOQUES: Record<1 | 2 | 3 | 4, string> = {
  1: "Qué ofreces y a quién",
  2: "Cómo trabaja tu equipo",
  3: "Lo que ofreces y cómo manejas el precio",
  4: "Closer propone, tú confirmas",
};

export const FRASE_DE_ENTRADA =
  "Closer ya sabe vender. Cuéntanos de tu empresa para que tus vendedores practiquen con clientes iguales a los tuyos.";

export const NOTA_LO_QUE_OFRECES =
  "Marca todo lo que ofreces, aunque tu competencia también lo tenga. Closer decide en cada práctica cuándo es una ventaja con ese cliente.";

export const PREGUNTAS: Pregunta[] = [
  {
    id: "p1_que_venden",
    numero: 1,
    bloque: 1,
    texto: "¿Qué venden?",
    subtexto: "Tus líneas principales. No hace falta el catálogo completo ni los precios.",
    porQue:
      "Closer arma a cada cliente de práctica con tus líneas: lo que ya te compra, lo que le compra a otro y lo que podrías ofrecerle. Solo usa las líneas que escribas aquí; nunca inventa un producto o servicio que no manejas. Los precios y presentaciones cambian, por eso no se piden aquí: los pones al momento en el Pitch Builder.",
    campos: [
      {
        tipo: "opciones",
        id: "p1_tipo",
        opciones: ["Productos", "Servicios", "Los dos"],
        multiple: false,
      },
      {
        tipo: "texto",
        id: "p1_lineas",
        etiqueta: "Tus líneas principales",
        placeholder: "Ej: aceites para motor, grasas, anticongelantes, aditivos, líquido de frenos",
        min: 10,
      },
    ],
  },
  {
    id: "p2_clientes",
    numero: 2,
    bloque: 1,
    texto: "¿Qué hacen tus clientes con lo que les vendes?",
    subtexto: "Marca todo lo que aplique.",
    porQue:
      "La doctrina de Closer distingue a los clientes por lo que hacen con lo que les vendes. Al que revende se le pregunta qué maneja y qué le piden; al que lo consume, qué usa y cada cuánto repone; al que distribuye, sus líneas y a cuántos surte. Con tus giros, el cliente de práctica tiene el negocio, el vocabulario y los problemas de tus clientes reales.",
    campos: [
      {
        tipo: "opciones",
        id: "p2_uso",
        opciones: ["Lo revenden", "Lo consumen en su operación", "Lo distribuyen"],
        multiple: true,
      },
      {
        tipo: "texto",
        id: "p2_giros",
        etiqueta: "¿Qué tipo de negocios son?",
        placeholder: "Ej: refaccionarias, talleres mecánicos, flotillas, constructoras",
        min: 3,
      },
    ],
  },
  {
    id: "p3_monto",
    numero: 3,
    bloque: 1,
    texto: "¿Cuánto te compra un cliente al mes?",
    subtexto: "Marca todos los rangos que tengas en tu cartera.",
    porQue:
      "El sistema de venta es el mismo con un cliente chico y con uno grande, pero la formalidad cambia: una compra grande lleva más preguntas, más datos y más tiempo para decidir; una chica se decide en la visita. Closer arma clientes de los tamaños que marques, para que tus vendedores practiquen los dos ritmos.",
    campos: [
      {
        tipo: "opciones",
        id: "p3_rangos",
        opciones: ["Menos de $5,000", "$5,000 a $50,000", "$50,000 a $500,000", "Más de $500,000"],
        multiple: true,
      },
    ],
  },
  {
    id: "p4_cartera",
    numero: 4,
    bloque: 2,
    texto: "¿Tus vendedores visitan más clientes que ya les compran o nuevos?",
    porQue:
      "Conseguir un cliente nuevo y hacer crecer uno que ya te compra son dos juegos distintos. Con el nuevo te presentas y buscas un dolor; con el que ya te compra no te presentas y buscas lo que todavía no te compra. Closer reparte las prácticas según tu cartera, y con la frecuencia de visita el cliente de práctica sabe cuándo lo visitaste por última vez.",
    campos: [
      {
        tipo: "opciones",
        id: "p4_cartera",
        opciones: [
          "Mayormente clientes que ya nos compran",
          "Mayormente clientes nuevos",
          "Mitad y mitad",
        ],
        multiple: false,
      },
      {
        tipo: "opciones",
        id: "p4_frecuencia",
        etiqueta: "¿Cada cuánto visitan al mismo cliente?",
        opciones: ["Cada semana", "Cada 2 semanas", "Cada mes", "Depende del cliente"],
        multiple: false,
      },
    ],
  },
  {
    id: "p5_canal",
    numero: 5,
    bloque: 2,
    texto: "¿Cómo venden?",
    subtexto: "Marca todo lo que aplique.",
    porQue:
      "La estructura de la venta no cambia por el canal, pero la ejecución sí: en persona cuenta lo que ves y el lenguaje corporal; por teléfono, el tono y las pausas; por mensaje, que cada idea vaya corta. Y el trato de tú o de usted hace que el cliente de práctica hable como los tuyos.",
    campos: [
      {
        tipo: "opciones",
        id: "p5_canal",
        opciones: ["En persona", "Por teléfono", "Por WhatsApp", "Por videollamada"],
        multiple: true,
      },
      {
        tipo: "opciones",
        id: "p5_trato",
        etiqueta: "¿A tus clientes les hablan de tú o de usted?",
        opciones: ["De usted", "De tú", "Depende del cliente"],
        multiple: false,
      },
    ],
  },
  {
    id: "p6_ofrecen",
    numero: 6,
    bloque: 3,
    texto: "¿Qué ofreces?",
    subtexto: NOTA_LO_QUE_OFRECES,
    porQue:
      "Closer enseña a usar balas: hechos concretos que el vendedor puede sostener sobre su empresa, su producto y su precio. Una bala sirve con un cliente y no con otro: el crédito pesa con el que paga de contado; la entrega inmediata, con el que se queda sin producto. Con lo que marques, tus vendedores practican con las balas que de verdad tienen, y Closer marca como error cualquier ventaja que no ofreces.",
    campos: [
      {
        tipo: "opciones",
        id: "p6_producto",
        etiqueta: "Producto",
        multiple: true,
        opcional: true,
        opciones: [
          "Marcas reconocidas",
          "Marca propia o exclusiva en la zona",
          "Surtido completo de la línea",
          "Calidad o certificaciones",
          "Garantía",
          "Asesoría técnica",
          "Presentaciones para cada tamaño de cliente",
        ],
        detalle: { "Marcas reconocidas": "¿cuáles?", Garantía: "¿de qué tipo?" },
      },
      {
        tipo: "opciones",
        id: "p6_servicio",
        etiqueta: "Servicio",
        multiple: true,
        opcional: true,
        opciones: [
          "Entrega en la visita",
          "Entrega el mismo día o al día siguiente",
          "Entrega programada",
          "Visita con frecuencia fija",
          "Pedidos completos, sin faltantes",
          "Cambios y devoluciones",
          "Pedidos por WhatsApp o teléfono",
          "Años de experiencia en la zona",
        ],
        detalle: {
          "Entrega programada": "¿cada cuánto?",
          "Años de experiencia en la zona": "¿cuántos?",
        },
      },
      {
        tipo: "opciones",
        id: "p6_precio",
        etiqueta: "Precio",
        multiple: true,
        opcional: true,
        opciones: [
          "Precio competitivo en algunas líneas",
          "Crédito",
          "Sin mínimo de compra",
          "Avisamos antes de los aumentos",
          "Precio por volumen",
        ],
        detalle: {
          "Precio competitivo en algunas líneas": "¿en cuáles?",
          Crédito: "¿a cuántos días?",
        },
      },
    ],
  },
  {
    id: "p7_precio",
    numero: 7,
    bloque: 3,
    texto: "¿Cómo manejan el precio?",
    porQue:
      "Closer enseña a presentar el precio en escalera, y cada escalón necesita un motivo real. Con tus condiciones, el vendedor practica solo con los descuentos y plazos que de verdad puede dar, y el evaluador marca como error una condición inventada.",
    campos: [
      {
        tipo: "opciones",
        id: "p7_modo",
        opciones: ["Precio fijo, sin descuentos", "Manejamos descuentos"],
        multiple: false,
      },
      {
        tipo: "opciones",
        id: "p7_descuentos",
        etiqueta: "¿Cuáles descuentos?",
        multiple: true,
        siCampo: { id: "p7_modo", valor: "Manejamos descuentos" },
        opciones: [
          "Por primer pedido",
          "Por volumen",
          "Por pago de contado",
          "Por pronto pago",
          "Promoción del mes o de temporada",
        ],
        detalle: { "Por volumen": "¿desde cuánto?", "Por pronto pago": "¿en cuántos días?" },
      },
      {
        tipo: "opciones",
        id: "p7_cobro",
        etiqueta: "¿Cómo se cobra?",
        opciones: ["Contado", "Crédito", "Los dos"],
        multiple: false,
        detalle: { Crédito: "¿a cuántos días?", "Los dos": "crédito ¿a cuántos días?" },
      },
    ],
  },
  {
    id: "p8_negativos",
    numero: 8,
    bloque: 4,
    texto: "¿Esto es lo que más escuchan tus vendedores?",
    subtexto:
      "Closer lo propuso para tu giro. Deja marcado lo que sí escuchan y agrega lo que falte, con las palabras de tus clientes.",
    porQue:
      "Una de las técnicas de Closer es el ataque preventivo: decir el negativo antes que el cliente. Para practicarlo, el cliente de práctica usa las objeciones que tus vendedores escuchan de verdad, con las palabras de tus clientes. Saber a quién le compran hoy sirve para que el vendedor no se sorprenda; nunca para hablar mal de nadie: Closer jamás ataca a la competencia.",
    propuestaPorCloser: "negativos",
    campos: [
      { tipo: "opciones", id: "p8_negativos", opciones: [], multiple: true },
      {
        tipo: "texto",
        id: "p8_competencia",
        etiqueta: "¿A quién le compran hoy tus clientes?",
        placeholder: "Ej: distribuidores locales, otras marcas, directo de fábrica…",
        opcional: true,
      },
    ],
  },
  {
    id: "p9_restricciones",
    numero: 9,
    bloque: 4,
    texto: "¿Qué nunca debe hacer tu equipo?",
    subtexto:
      "Closer ya prohíbe mentir, garantizar lo que no controlas y atacar a la competencia. Aquí van las reglas de tu empresa.",
    porQue:
      "Las reglas de la doctrina Closer las aplica siempre. Aquí agregas las de tu empresa, para que Closer las respete en las prácticas y marque como error cuando un vendedor las rompe.",
    propuestaPorCloser: "restricciones",
    campos: [
      { tipo: "opciones", id: "p9_restricciones", opciones: [], multiple: true, opcional: true },
    ],
  },
];

export const TOTAL_PREGUNTAS = PREGUNTAS.length;

/** Texto libre de cada pregunta: "¿Algo más que Closer deba saber?" */
export const libreDe = (preguntaId: string) => `${preguntaId}__libre`;
/** Dato corto de una opción marcada (ej. "Crédito" → "30 días"). */
export const detalleDe = (campoId: string, opcion: string) => `${campoId}::${opcion}`;

/** Lo que Closer propone si no se pudo generar (nunca se bloquea el onboarding). */
export const NEGATIVOS_DE_RESPALDO = [
  "Ya tengo proveedor",
  "Todavía tengo, pásate la otra semana",
  "Está caro",
  "Ahorita no tengo dinero",
  "Déjame lo pienso",
  "Con el que tengo me va bien",
];
export const RESTRICCIONES_DE_RESPALDO = [
  "Prometer fechas de entrega sin confirmarlas",
  "Dar precios o descuentos no autorizados",
  "Ofrecer crédito sin aprobación",
  "Comprometer productos que no hay en existencia",
];

// ── Lectura de respuestas ──────────────────────────────────────────────

const comoLista = (v: Respuesta | undefined): string[] =>
  Array.isArray(v)
    ? v.filter((x) => typeof x === "string" && x.trim())
    : typeof v === "string" && v.trim()
      ? [v]
      : [];
const comoTexto = (v: Respuesta | undefined): string => (typeof v === "string" ? v.trim() : "");

/** ¿Se muestra este campo con las respuestas actuales? */
export function campoVisible(c: Campo, r: Respuestas): boolean {
  if (c.tipo !== "opciones" || !c.siCampo) return true;
  return comoLista(r[c.siCampo.id]).includes(c.siCampo.valor);
}

/** ¿La pregunta tiene lo mínimo para avanzar? */
export function preguntaCompleta(p: Pregunta, r: Respuestas): boolean {
  if (p.id === "p6_ofrecen") {
    // Basta con marcar algo en cualquiera de las tres secciones, o escribirlo.
    const algo = p.campos.some((c) => comoLista(r[c.id]).length > 0);
    return algo || comoTexto(r[libreDe(p.id)]).length > 0;
  }
  if (p.id === "p8_negativos") {
    return comoLista(r.p8_negativos).length > 0 || comoTexto(r[libreDe(p.id)]).length > 0;
  }
  return p.campos.every((c) => {
    if (c.opcional || !campoVisible(c, r)) return true;
    if (c.tipo === "texto") return comoTexto(r[c.id]).length >= (c.min ?? 1);
    return comoLista(r[c.id]).length > 0;
  });
}

/** Una opción con su dato corto, si lo tiene: "Crédito (30 días)". */
function conDetalle(campo: CampoOpciones, opcion: string, r: Respuestas): string {
  const d = comoTexto(r[detalleDe(campo.id, opcion)]);
  return d ? `${opcion} (${d})` : opcion;
}

/** Lo marcado en un campo de opciones, con sus detalles. */
export function marcado(campo: CampoOpciones, r: Respuestas): string[] {
  if (!campoVisible(campo, r)) return [];
  return comoLista(r[campo.id]).map((o) => conDetalle(campo, o, r));
}

const campo = (id: string): Campo => {
  for (const p of PREGUNTAS) for (const c of p.campos) if (c.id === id) return c;
  throw new Error(`campo desconocido: ${id}`);
};
const op = (id: string) => campo(id) as CampoOpciones;

/**
 * Cada pregunta en una línea legible: lo que se guarda en
 * company_onboarding_answers y lo que lee el modelo.
 */
export function respuestasEnTexto(
  r: Respuestas,
): { id: string; bloque: number; pregunta: string; respuesta: string }[] {
  return PREGUNTAS.map((p) => {
    const partes: string[] = [];
    for (const c of p.campos) {
      if (!campoVisible(c, r)) continue;
      const valor = c.tipo === "texto" ? comoTexto(r[c.id]) : marcado(c, r).join(", ");
      if (valor) partes.push(c.etiqueta ? `${c.etiqueta}: ${valor}` : valor);
    }
    const libre = comoTexto(r[libreDe(p.id)]);
    if (libre) partes.push(`Además: ${libre}`);
    return { id: p.id, bloque: p.bloque, pregunta: p.texto, respuesta: partes.join(" · ") };
  });
}

/**
 * La parte del cerebro de la empresa que sale DIRECTO de lo que escribió el
 * manager, sin pasar por el modelo: así ningún dato comercial (líneas,
 * condiciones, lo que ofrece) puede reescribirse ni inventarse. El modelo solo
 * redacta CLIENTE_TIPICO y el tono, y genera la vista previa.
 */
export function cerebroDirecto(r: Respuestas): Record<string, string> {
  const libre = (id: string) => comoTexto(r[libreDe(id)]);
  const junta = (...xs: string[]) => xs.filter(Boolean).join(". ");

  const lineas = comoTexto(r.p1_lineas);
  const tipo = comoLista(r.p1_tipo)[0] ?? "";
  const uso = marcado(op("p2_uso"), r);
  const giros = comoTexto(r.p2_giros);
  const rangos = marcado(op("p3_rangos"), r);
  const cartera = comoLista(r.p4_cartera)[0] ?? "";
  const frecuencia = comoLista(r.p4_frecuencia)[0] ?? "";
  const canal = marcado(op("p5_canal"), r);
  const trato = comoLista(r.p5_trato)[0] ?? "";

  const producto = marcado(op("p6_producto"), r);
  const servicio = marcado(op("p6_servicio"), r);
  const precio = marcado(op("p6_precio"), r);
  const modo = comoLista(r.p7_modo)[0] ?? "";
  const descuentos = marcado(op("p7_descuentos"), r);
  const cobro = marcado(op("p7_cobro"), r)[0] ?? "";
  const negativos = comoLista(r.p8_negativos);
  const competencia = comoTexto(r.p8_competencia);
  const restricciones = comoLista(r.p9_restricciones);

  const lista = (xs: string[]) => xs.join("; ");

  return {
    PRODUCTOS_ACTIVOS: junta(
      tipo && tipo !== "Productos" ? `${tipo}: ${lineas}` : lineas,
      libre("p1_que_venden"),
    ),
    TIPOS_DE_CLIENTE_QUE_ATIENDE: junta(
      giros && `Giros: ${giros}`,
      uso.length ? `Qué hacen con lo que les vendemos: ${uso.join(", ")}` : "",
      cartera && `Cartera: ${cartera}`,
      libre("p2_clientes"),
    ),
    FRECUENCIA_DE_VISITA: frecuencia,
    CONTEXTO_DE_VENTA: junta(
      canal.length ? `Canal: ${canal.join(", ")}` : "",
      trato && `Trato: ${trato}`,
      rangos.length ? `Compra mensual de sus clientes: ${rangos.join(", ")}` : "",
      cartera && `Cartera: ${cartera}`,
      frecuencia && `Visitas: ${frecuencia}`,
      libre("p3_monto"),
      libre("p4_cartera"),
      libre("p5_canal"),
    ),
    ARGUMENTOS_DE_VALOR: lista([
      ...producto.map((x) => `Producto: ${x}`),
      ...servicio.map((x) => `Servicio: ${x}`),
      ...precio.map((x) => `Precio: ${x}`),
      ...(libre("p6_ofrecen") ? [libre("p6_ofrecen")] : []),
    ]),
    PROMOCIONES_Y_CONDICIONES: junta(
      modo === "Precio fijo, sin descuentos"
        ? "Precio fijo, sin descuentos"
        : descuentos.length
          ? `Descuentos: ${descuentos.join(", ")}`
          : "",
      cobro && `Cobro: ${cobro}`,
      libre("p7_precio"),
    ),
    NEGATIVOS_COMUNES_DEL_TERRITORIO: lista([
      ...negativos,
      ...(libre("p8_negativos") ? [libre("p8_negativos")] : []),
    ]),
    OBJECIONES_REALES: lista(negativos),
    COMPETENCIA_DIRECTA: competencia,
    RESTRICCIONES: lista([
      ...restricciones,
      ...(libre("p9_restricciones") ? [libre("p9_restricciones")] : []),
    ]),
  };
}

/** Las llaves del cerebro de la empresa que consume el resto de Closer. */
export const CLAVES_CEREBRO = [
  "PRODUCTOS_ACTIVOS",
  "CLIENTE_TIPICO",
  "ARGUMENTOS_DE_VALOR",
  "OBJECIONES_REALES",
  "CONTEXTO_DE_VENTA",
  "RESTRICCIONES",
  "TONO_DETECTADO",
  "PRESENTACIONES_Y_PRECIOS",
  "CANTIDADES_TIPICAS",
  "PROMOCIONES_Y_CONDICIONES",
  "PRODUCTOS_QUE_SE_COMPRAN_JUNTOS",
  "TIPOS_DE_CLIENTE_QUE_ATIENDE",
  "FRECUENCIA_DE_VISITA",
  "FAMILIAS_QUE_SE_PIERDEN_CON_LA_COMPETENCIA",
  "PERFILES_DE_CLIENTE_Y_QUE_MUEVE_CADA_UNO",
  "NEGATIVOS_COMUNES_DEL_TERRITORIO",
  "COMPETENCIA_DIRECTA",
] as const;

/**
 * La radiografía (oct-2026, pedido de Emilio): al terminar, Closer le describe
 * al manager su empresa con lo que le acaba de contar, para que la confirme o
 * la corrija ahí mismo. Seis secciones fijas; el modelo solo redacta lo que
 * está en las respuestas.
 */
export const SECCIONES_RADIOGRAFIA = [
  { id: "empresa", titulo: "Tu empresa" },
  { id: "clientes", titulo: "Tus clientes" },
  { id: "equipo", titulo: "Cómo trabaja tu equipo" },
  { id: "oferta", titulo: "Lo que ofreces y tu precio" },
  { id: "calle", titulo: "Algunas cosas que se escuchan hoy en la calle" },
  { id: "cliente_tipico", titulo: "Los clientes con los que van a practicar" },
] as const;
export type SeccionRadiografia = { titulo: string; texto: string };

/**
 * Aplica la corrección del manager: el modelo propone el nuevo valor de las
 * llaves que tocó el ajuste, pero solo se aceptan llaves canónicas con texto.
 * El ajuste, tal cual lo escribió el manager, se acumula en
 * AJUSTES_DEL_MANAGER, que el cliente de práctica lee con el resto del cerebro.
 */
export function aplicarAjuste(
  brain: Record<string, string>,
  cambios: Record<string, unknown>,
  ajuste: string,
): Record<string, string> {
  const out = { ...brain };
  const validas = new Set<string>(CLAVES_CEREBRO);
  for (const [k, v] of Object.entries(cambios ?? {})) {
    if (validas.has(k) && typeof v === "string" && v.trim()) out[k] = v.trim();
  }
  const previo = (out["AJUSTES_DEL_MANAGER"] ?? "").trim();
  out["AJUSTES_DEL_MANAGER"] = [previo, ajuste.trim()].filter(Boolean).join("\n");
  return out;
}
