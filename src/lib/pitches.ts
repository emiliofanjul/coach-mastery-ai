// Modelo compartido del Pitch Builder (Fase 1).
// Solo datos + helpers de lectura/escritura vía PostgREST.

import { restGet, restMutate } from "@/lib/supabase-rest";

export type ClientType = "nuevo" | "recurrente" | "autoconsumo" | "distribuidor";
export type Channel = "presencial" | "telefono" | "whatsapp";
export type PitchStatus = "draft" | "published" | "archived";

export type CompanyPitch = {
  id: string;
  company_id: string;
  client_type: ClientType;
  channel: Channel;
  status: PitchStatus;
  version: number;
  published_at: string | null;
  updated_at: string | null;
  missing_data?: string[] | null;
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
};

export type SkillRef = {
  id: string;
  code: string;
  name: string;
  world_id_introduced: number;
  node_id?: string | null;
};

/** Catálogo de skills (nombre, código, mundo) + nodo primario donde se enseña. */
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
  const out: Record<string, SkillRef> = {};
  for (const s of skills) {
    out[s.id] = { ...s, node_id: links.find((l) => l.skill_id === s.id)?.node_id ?? null };
  }
  return out;
}

/** El manager elige una alternativa: reemplaza el content y marca edición. */
export async function applyAlternative(sectionId: string, content: string): Promise<void> {
  await restMutate("pitch_sections", {
    method: "PATCH",
    path: `pitch_sections?id=eq.${sectionId}`,
    body: { content, edited_by_manager: true },
  });
}

export async function fetchPitchSections(pitchId: string): Promise<PitchSection[]> {
  return restGet<PitchSection>(
    `pitch_sections?select=id,pitch_id,step,section_key,section_kind,edited_by_manager,content,rationale_short,rationale_long,warning,skill_ids,alternatives&pitch_id=eq.${pitchId}&order=step.asc`,
  );
}


export const CLIENT_TYPES: Array<{ key: ClientType; label: string; blurb: string }> = [
  {
    key: "nuevo",
    label: "Cliente nuevo",
    blurb: "Primera visita: no te conoce, no confía todavía.",
  },
  {
    key: "recurrente",
    label: "Cliente recurrente",
    blurb: "Ya te compra: el reto es crecer el ticket sin quemar la relación.",
  },
  {
    key: "autoconsumo",
    label: "Autoconsumo",
    blurb: "Usa el producto él mismo: vende resultado, no reventa.",
  },
  {
    key: "distribuidor",
    label: "Distribuidor",
    blurb: "Revende: vende rotación, margen y respaldo.",
  },
];

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
    `company_pitches?select=id,company_id,client_type,channel,status,version,published_at,updated_at,missing_data&company_id=eq.${companyId}&status=neq.archived&order=created_at.asc`,
  );
}

export async function fetchPublishedPitches(companyId: string): Promise<CompanyPitch[]> {
  return restGet<CompanyPitch>(
    `company_pitches?select=id,company_id,client_type,channel,status,version,published_at,updated_at&company_id=eq.${companyId}&status=eq.published&order=client_type.asc`,
  );
}

/** Crea el pitch en borrador y sus 6 secciones vacías. */
export async function activatePitch(args: {
  companyId: string;
  clientType: ClientType;
  channel: Channel;
  createdBy: string;
}): Promise<CompanyPitch> {
  const rows = await restMutate<CompanyPitch>("company_pitches", {
    method: "POST",
    prefer: "return=representation",
    body: {
      company_id: args.companyId,
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
