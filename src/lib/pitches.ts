// Modelo compartido del Pitch Builder (Fase 1).
// Solo datos + helpers de lectura/escritura vía PostgREST.

import { restGet, restGetMaybeSingle, restMutate } from "@/lib/supabase-rest";

/** Eje 1 — RELACIÓN: ¿ya te compra? Define la estructura del pitch. */
export type Relationship = "nuevo" | "recurrente";
/** Eje 2 — USO: ¿qué hace con el producto? Define solo el vocabulario. */
export type ClientType = "revende" | "consume" | "distribuye";
export type Channel = "presencial" | "telefono" | "whatsapp";
export type PitchStatus = "draft" | "published" | "archived";

export type CompanyPitch = {
  id: string;
  company_id: string;
  relationship: Relationship;
  client_type: ClientType;
  channel: Channel;
  status: PitchStatus;
  version: number;
  published_at: string | null;
  updated_at: string | null;
  missing_data?: unknown[] | null;
};

export type PitchAlternative = {
  rank: number;
  label: string;
  content: string;
  why_ranked?: string;
  skill_ids?: string[];
};

export type PitchSection = {
  id: string;
  pitch_id: string;
  step: number;
  section_key: string;
  section_kind: "guion" | "municion";
  content: string | null;
  rationale_short: string | null;
  rationale_long: string | null;
  warning: string | null;
  skill_ids: string[] | null;
  alternatives: PitchAlternative[] | null;
  edited_by_manager?: boolean | null;
  prompt_version?: string | null;
  is_stale?: boolean | null;
  stale_reason?: string | null;
};

export type SkillRef = {
  id: string;
  code: string;
  name: string;
  world_id_introduced: number;
  node_id?: string | null;
};

/**
 * Catálogo de skills (nombre, código, mundo) + nodo donde se enseña.
 *
 * Resolución de la liga, en orden:
 *   1) node_skills con is_primary = true
 *   2) cualquier node_skills del skill
 *   3) primer nodo (order_index) del mundo donde se introduce el skill
 * Si ninguna resuelve, node_id queda null y el visor NO renderiza liga
 * (badge inerte) — nunca una liga muerta.
 */
export async function fetchSkillRefs(skillIds: string[]): Promise<Record<string, SkillRef>> {
  const ids = Array.from(new Set(skillIds.filter(Boolean)));
  if (ids.length === 0) return {};
  const list = ids.map((i) => `"${i}"`).join(",");
  const [skills, links] = await Promise.all([
    restGet<SkillRef>(`skills?select=id,code,name,world_id_introduced&id=in.(${list})`),
    restGet<{ skill_id: string; node_id: string; is_primary: boolean }>(
      `node_skills?select=skill_id,node_id,is_primary&skill_id=in.(${list})&order=is_primary.desc`,
    ),
  ]);

  // Fallback por mundo: primer nodo de cada mundo involucrado.
  const worlds = Array.from(new Set(skills.map((s) => s.world_id_introduced).filter((w) => w != null)));
  const firstNodeByWorld: Record<number, string> = {};
  if (worlds.length > 0) {
    const nodes = await restGet<{ id: string; world_id: number; order_index: number }>(
      `nodes?select=id,world_id,order_index&world_id=in.(${worlds.join(",")})&order=world_id.asc,order_index.asc`,
    );
    for (const n of nodes) {
      if (firstNodeByWorld[n.world_id] == null) firstNodeByWorld[n.world_id] = n.id;
    }
  }

  const out: Record<string, SkillRef> = {};
  for (const s of skills) {
    const primary = links.find((l) => l.skill_id === s.id && l.is_primary)?.node_id;
    const any = links.find((l) => l.skill_id === s.id)?.node_id;
    out[s.id] = {
      ...s,
      node_id: primary ?? any ?? firstNodeByWorld[s.world_id_introduced] ?? null,
    };
  }
  return out;
}

/**
 * El manager elige una alternativa que Closer mismo generó.
 * NO marca `edited_by_manager`: las tres alternativas son correctas según
 * doctrina, elegir entre ellas no es ir contra ella. Ese flag queda reservado
 * para cambios que contradigan la doctrina (edición forzada desde el chat).
 */
export async function applyAlternative(sectionId: string, content: string): Promise<void> {
  await restMutate(`pitch_sections?id=eq.${sectionId}`, {
    method: "PATCH",
    body: { content },
  });
}

export async function fetchPitchSections(pitchId: string): Promise<PitchSection[]> {
  return restGet<PitchSection>(
    `pitch_sections?select=id,pitch_id,step,section_key,section_kind,edited_by_manager,prompt_version,is_stale,stale_reason,content,rationale_short,rationale_long,warning,skill_ids,alternatives&pitch_id=eq.${pitchId}&order=step.asc`,
  );
}


export const RELATIONSHIPS: Array<{ key: Relationship; label: string; blurb: string }> = [
  {
    key: "nuevo",
    label: "Cliente nuevo",
    blurb: "Todavía no te compra: te presentas y buscas el dolor.",
  },
  {
    key: "recurrente",
    label: "Cliente recurrente",
    blurb: "Ya te compra: no te presentas, buscas el hueco lateral.",
  },
];

export const CLIENT_TYPES: Array<{ key: ClientType; label: string; blurb: string }> = [
  {
    key: "revende",
    label: "Revende",
    blurb: "Vende tu producto en su mostrador: rotación y margen.",
  },
  {
    key: "consume",
    label: "Consume",
    blurb: "Usa el producto él mismo: vende resultado, no reventa.",
  },
  {
    key: "distribuye",
    label: "Distribuye",
    blurb: "Surte a otros: líneas, zonas y respaldo.",
  },
];

export function pitchLabel(p: {
  relationship?: Relationship | string | null;
  client_type?: ClientType | string | null;
}): string {
  const rel = RELATIONSHIPS.find((r) => r.key === p.relationship)?.label ?? String(p.relationship ?? "");
  const use = CLIENT_TYPES.find((t) => t.key === p.client_type)?.label ?? String(p.client_type ?? "");
  return `${rel} · ${use}`;
}

export const CHANNELS: Array<{ key: Channel; label: string }> = [
  { key: "presencial", label: "Presencial" },
  { key: "telefono", label: "Teléfono" },
  { key: "whatsapp", label: "WhatsApp" },
];

export const PITCH_STEPS: Array<{
  step: number;
  key: string;
  label: string;
  kind: "guion" | "municion";
}> = [
  { step: 1, key: "introduccion", label: "Introducción", kind: "guion" },
  { step: 2, key: "historia_breve", label: "Historia breve", kind: "guion" },
  { step: 3, key: "descubrimiento", label: "Descubrimiento", kind: "municion" },
  { step: 4, key: "presentacion", label: "Presentación", kind: "guion" },
  { step: 5, key: "cierre", label: "Cierre", kind: "guion" },
  { step: 6, key: "consolidacion", label: "Consolidación", kind: "guion" },
];

export function statusLabel(status?: PitchStatus | null): string {
  if (status === "published") return "Publicado";
  if (status === "draft") return "Borrador";
  return "No activado";
}

export async function fetchCompanyPitches(companyId: string): Promise<CompanyPitch[]> {
  return restGet<CompanyPitch>(
    `company_pitches?select=id,company_id,relationship,client_type,channel,status,version,published_at,updated_at,missing_data&company_id=eq.${companyId}&status=neq.archived&order=created_at.asc`,
  );
}

export async function fetchPublishedPitches(companyId: string): Promise<CompanyPitch[]> {
  return restGet<CompanyPitch>(
    `company_pitches?select=id,company_id,relationship,client_type,channel,status,version,published_at,updated_at&company_id=eq.${companyId}&status=eq.published&order=relationship.asc,client_type.asc`,
  );
}

/** Crea el pitch en borrador y sus 6 secciones vacías. */
export async function activatePitch(args: {
  companyId: string;
  relationship: Relationship;
  clientType: ClientType;
  channel: Channel;
  createdBy: string;
}): Promise<CompanyPitch> {
  const rows = await restMutate<CompanyPitch>("company_pitches", {
    method: "POST",
    prefer: "return=representation",
    body: {
      company_id: args.companyId,
      relationship: args.relationship,
      client_type: args.clientType,
      channel: args.channel,
      status: "draft",
      created_by: args.createdBy,
    },
  });
  const pitch = rows[0];
  if (!pitch) throw new Error("No se pudo crear el pitch.");

  await restMutate("pitch_sections", {
    method: "POST",
    body: PITCH_STEPS.map((s) => ({
      pitch_id: pitch.id,
      step: s.step,
      section_key: s.key,
      order_index: s.step,
      section_kind: s.kind,
      content: null,
      rationale: null,
    })),
  });

  return pitch;
}

// ───────────────────────── Datos faltantes (missing_data) ─────────────────────────
// El generador devuelve renglones sueltos y repetidos ("precios de lista" tres
// veces con distinta redacción). Aquí se agrupan en TEMAS accionables: una
// pregunta por tema, la llave del brain donde se guarda la respuesta, y qué
// secciones se pueden regenerar con ella.

export type MissingItem = {
  tema: string;
  pregunta: string;
  desbloquea: string;
  secciones_afectadas: string[];
  brain_key: string;
  prioridad: "alta" | "media" | "baja";
  detalle: string[];
};

type TopicSpec = Omit<MissingItem, "detalle"> & { match: RegExp };

/** El nombre/teléfono del vendedor NO es un dato faltante: es del lector. */
const NOT_MISSING =
  /(nombre|tel[eé]fono|whats\s?app|celular|contacto)\s+(completo\s+)?(del|de la|de tu|de los)?\s*(vendedor|ejecutiv|representante|asesor)/i;

const TOPICS: TopicSpec[] = [
  {
    tema: "Precios de lista y descuentos",
    pregunta:
      "¿Cuáles son tus precios por presentación y qué descuentos aplicas (volumen, contado, línea)?",
    desbloquea: "El triple desglose con cifras reales y las opciones de precio del descubrimiento",
    secciones_afectadas: ["presentacion", "descubrimiento"],
    brain_key: "PRESENTACIONES_Y_PRECIOS",
    prioridad: "alta",
    match: /(precio|lista de precios|tarifa|descuento|margen|costo)/i,
  },
  {
    tema: "Productos y presentaciones",
    pregunta: "¿Qué productos y líneas manejas, y en qué presentaciones se venden?",
    desbloquea: "Que el cierre enumere el pedido y el descubrimiento sugiera familias reales",
    secciones_afectadas: ["cierre", "descubrimiento"],
    brain_key: "PRODUCTOS_Y_PRESENTACIONES",
    prioridad: "alta",
    match: /(producto|presentaci[oó]n|l[ií]nea|familia|sku|cat[aá]logo)/i,
  },
  {
    tema: "Cantidades típicas del pedido",
    pregunta: "¿Qué cantidades maneja normalmente un cliente de este tipo en su pedido?",
    desbloquea: "El resumen del pedido en el cierre (qué y cuánto)",
    secciones_afectadas: ["cierre"],
    brain_key: "CANTIDADES_TIPICAS",
    prioridad: "alta",
    match: /(cantidad|volumen|pedido t[ií]pico|cu[aá]nto compra|rotaci[oó]n)/i,
  },
  {
    tema: "Condiciones comerciales",
    pregunta: "¿Manejas crédito? ¿Qué plazos, formas de pago y tiempos de entrega ofreces?",
    desbloquea: "La escalera de precio por plazo y el cierre con condiciones reales",
    secciones_afectadas: ["presentacion", "cierre"],
    brain_key: "CONDICIONES_COMERCIALES",
    prioridad: "media",
    match: /(cr[eé]dito|plazo|pago|contado|entrega|log[ií]stica|flete)/i,
  },
  {
    tema: "Casos reales de clientes",
    pregunta: "¿Tienes casos reales de clientes con resultados que se puedan mencionar?",
    desbloquea: "El Efecto Jones con casos verificables en vez de genéricos",
    secciones_afectadas: ["historia_breve", "presentacion"],
    brain_key: "CASOS_REALES",
    prioridad: "media",
    match: /(caso|testimonio|referencia|cliente que|resultado real|historia de)/i,
  },
  {
    tema: "Competencia y proveedores",
    pregunta: "¿Contra qué marcas o proveedores compites normalmente en esta zona?",
    desbloquea: "Sugerir marcas reales en el descubrimiento sin inventarlas",
    secciones_afectadas: ["descubrimiento"],
    brain_key: "COMPETENCIA",
    prioridad: "media",
    match: /(competencia|competidor|proveedor|marca)/i,
  },
  {
    tema: "Diferenciadores y respaldo",
    pregunta: "¿Qué te distingue de la competencia: garantía, respaldo técnico, servicio?",
    desbloquea: "La primera mitad de la presentación y la historia breve",
    secciones_afectadas: ["historia_breve", "presentacion"],
    brain_key: "DIFERENCIADORES",
    prioridad: "media",
    match: /(diferenciador|ventaja|garant[ií]a|respaldo|soporte|servicio|capacitaci[oó]n)/i,
  },
  {
    tema: "Seguimiento y frecuencia de visita",
    pregunta: "¿Cada cuándo se visita o se le llama a un cliente después de la venta?",
    desbloquea: "La consolidación con un compromiso concreto de seguimiento",
    secciones_afectadas: ["consolidacion"],
    brain_key: "SEGUIMIENTO",
    prioridad: "baja",
    match: /(seguimiento|visita|frecuencia|recompra|posventa|consolidaci[oó]n)/i,
  },
];

const OTROS: Omit<MissingItem, "detalle"> = {
  tema: "Otros datos por confirmar",
  pregunta: "¿Puedes darme estos datos sueltos que Closer necesitó y no encontró?",
  desbloquea: "Afinar detalles del pitch",
  secciones_afectadas: [],
  brain_key: "OTROS_DATOS",
  prioridad: "baja",
};

const ORDEN: Record<MissingItem["prioridad"], number> = { alta: 0, media: 1, baja: 2 };

/** Agrupa y deduplica los renglones crudos del generador en temas accionables. */
export function normalizeMissingData(raw: unknown): MissingItem[] {
  const list: string[] = Array.isArray(raw)
    ? raw
        .map((r) => (typeof r === "string" ? r : String((r as any)?.pregunta ?? (r as any)?.tema ?? "")))
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const buckets = new Map<string, MissingItem>();
  for (const line of list) {
    if (NOT_MISSING.test(line)) continue; // el nombre del vendedor no es un faltante
    const spec = TOPICS.find((t) => t.match.test(line));
    const base = spec ? (({ match, ...rest }) => rest)(spec) : OTROS;
    const cur = buckets.get(base.brain_key) ?? { ...base, detalle: [] };
    if (!cur.detalle.some((d) => d.toLowerCase() === line.toLowerCase())) cur.detalle.push(line);
    buckets.set(base.brain_key, cur);
  }
  return Array.from(buckets.values()).sort(
    (a, b) => ORDEN[a.prioridad] - ORDEN[b.prioridad] || a.tema.localeCompare(b.tema),
  );
}

/** Guarda la respuesta del manager en el cerebro de la empresa, bajo su llave. */
export async function saveBrainAnswer(
  companyId: string,
  brainKey: string,
  answer: string,
): Promise<void> {
  const company = await restGetMaybeSingle<{ company_sales_brain: Record<string, unknown> | null }>(
    `companies?select=company_sales_brain&id=eq.${companyId}&limit=1`,
  );
  const brain = { ...(company?.company_sales_brain ?? {}), [brainKey]: answer };
  await restMutate(`rpc/update_company_brain`, { method: "POST", body: { _brain: brain } });
}

/** Quita del missing_data guardado los renglones ya cubiertos por un tema. */
export async function dropMissingTopic(
  pitchId: string,
  current: unknown,
  item: MissingItem,
): Promise<void> {
  const list: string[] = Array.isArray(current) ? current.map(String) : [];
  const rest = list.filter((l) => !item.detalle.some((d) => d.toLowerCase() === l.toLowerCase()));
  await restMutate(`company_pitches?id=eq.${pitchId}`, {
    method: "PATCH",
    body: { missing_data: rest },
  });
}

// ───────────────────────── Placeholders del lector ─────────────────────────
// El pitch lo leen todos los vendedores: "[tu nombre]" no es un dato faltante,
// es una variable que se resuelve con el perfil de quien lo está leyendo.

export function fillReaderPlaceholders(
  text: string | null | undefined,
  reader: { name?: string | null; phone?: string | null },
): string {
  let out = String(text ?? "");
  const name = (reader.name ?? "").trim();
  const phone = (reader.phone ?? "").trim();
  out = out.replace(/\[tu nombre\]/gi, name || "[tu nombre]");
  out = out.replace(/\[tu (tel[eé]fono|whatsapp|n[uú]mero)\]/gi, phone || "[tu teléfono]");
  return out;
}

/** Aplica un contenido acordado en el chat de la sección. */
export async function applySectionContent(
  sectionId: string,
  content: string,
  editedByManager: boolean,
): Promise<void> {
  await restMutate(`pitch_sections?id=eq.${sectionId}`, {
    method: "PATCH",
    body: editedByManager ? { content, edited_by_manager: true } : { content },
  });
}

export async function logPitchFeedback(row: {
  pitch_id: string;
  section_id: string;
  manager_message: string | null;
  closer_response: string | null;
  classification: string | null;
  outcome: string | null;
}): Promise<void> {
  await restMutate(`pitch_feedback`, { method: "POST", body: row });
}
