// Fuente única de la doctrina de Closer (El Cerebro).
//
// Este módulo es COMPARTIDO: lo usa el generador de pitches, el chat del
// Pitch Builder y cualquier componente futuro que necesite razonar con el
// sistema completo en vez de con un pedacito (una tarjeta, un skill, un
// practice_script).
//
// - getCerebro()            → documento completo de la versión activa
// - getCerebroSecciones()   → solo las secciones pedidas
// - getCriteriosEjecucion() → success/failure criteria de nodes.practice_script
//
// Cache en memoria, invalidado cuando cambia la versión activa.

import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type SectionKey =
  | "fundamento"
  | "pasos"
  | "mentalidad"
  | "aplicacion"
  | "canales"
  | "jerarquia"
  | "razonamiento";

export interface DoctrinaSection {
  section_key: string;
  order_index: number;
  title: string;
  body: string;
  version: number;
}

export interface Criterio {
  skill_id: string;
  tipo: "success" | "failure";
  severity: string | null;
  description: string;
  node_id: string;
  world_id: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;

let sectionsCache: { at: number; version: number; sections: DoctrinaSection[] } | null = null;

async function loadSections(): Promise<DoctrinaSection[]> {
  const now = Date.now();
  if (sectionsCache && now - sectionsCache.at < CACHE_TTL_MS) {
    return sectionsCache.sections;
  }

  // La versión activa manda: si sube la versión, el cache se invalida solo.
  const { data, error } = await supabaseAdmin
    .from("doctrina")
    .select("section_key, order_index, title, body, version")
    .eq("is_active", true)
    .order("version", { ascending: false })
    .order("order_index", { ascending: true });

  if (error) throw new Error(`doctrina: ${error.message}`);

  const rows = (data ?? []) as DoctrinaSection[];
  const version = rows.length ? Math.max(...rows.map((r) => r.version)) : 0;
  const sections = rows
    .filter((r) => r.version === version)
    .sort((a, b) => a.order_index - b.order_index);

  if (sectionsCache && sectionsCache.version !== version) {
    criteriosCache.clear();
  }
  sectionsCache = { at: now, version, sections };
  return sections;
}

function assemble(sections: DoctrinaSection[]): string {
  return sections.map((s) => s.body.trim()).join("\n\n---\n\n");
}

/** Documento completo de la versión activa, ensamblado en orden. */
export async function getCerebro(): Promise<string> {
  return assemble(await loadSections());
}

/** Solo las secciones pedidas (en el orden canónico del documento). */
export async function getCerebroSecciones(keys: string[]): Promise<string> {
  const wanted = new Set(keys);
  const sections = (await loadSections()).filter((s) => wanted.has(s.section_key));
  return assemble(sections);
}

/** Metadatos de la versión activa (útil para logs / prompt_version). */
export async function getCerebroVersion(): Promise<number> {
  await loadSections();
  return sectionsCache?.version ?? 0;
}

const criteriosCache = new Map<string, { at: number; value: Criterio[] }>();

interface ScriptCriterio {
  id?: unknown;
  severity?: unknown;
  description?: unknown;
}

function extract(
  script: unknown,
  nodeId: string,
  worldId: number,
): Criterio[] {
  const s = (script ?? {}) as Record<string, unknown>;
  const out: Criterio[] = [];
  for (const tipo of ["success", "failure"] as const) {
    const arr = s[`${tipo}_criteria`];
    if (!Array.isArray(arr)) continue;
    for (const raw of arr) {
      const c = (raw ?? {}) as ScriptCriterio;
      if (typeof c.id !== "string" || !c.id) continue;
      out.push({
        skill_id: c.id,
        tipo,
        severity: typeof c.severity === "string" ? c.severity : null,
        description: typeof c.description === "string" ? c.description : "",
        node_id: nodeId,
        world_id: worldId,
      });
    }
  }
  return out;
}

/**
 * Criterios de ejecución (cómo se JUZGA la ejecución) sacados de
 * nodes.practice_script. El Cerebro tiene los principios; esto tiene
 * la vara de medir.
 */
export async function getCriteriosEjecucion(opts: {
  worlds?: number[];
  nodeIds?: string[];
} = {}): Promise<Criterio[]> {
  const cacheKey = JSON.stringify({
    w: [...(opts.worlds ?? [])].sort((a, b) => a - b),
    n: [...(opts.nodeIds ?? [])].sort(),
  });
  const hit = criteriosCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  let q = supabaseAdmin
    .from("nodes")
    .select("id, world_id, order_index, practice_script")
    .not("practice_script", "is", null);

  if (opts.worlds?.length) q = q.in("world_id", opts.worlds);
  if (opts.nodeIds?.length) q = q.in("id", opts.nodeIds);

  const { data, error } = await q.order("world_id").order("order_index");
  if (error) throw new Error(`criterios: ${error.message}`);

  const value = (data ?? []).flatMap((n) =>
    extract(n.practice_script, n.id, n.world_id),
  );
  criteriosCache.set(cacheKey, { at: Date.now(), value });
  return value;
}

/** Fuerza recarga (tests, o tras publicar una versión nueva). */
export function invalidateDoctrinaCache(): void {
  sectionsCache = null;
  criteriosCache.clear();
}
