// Auditor de secciones de pitch.
//
// El generador RECIBE los criterios de ejecución como contexto. Eso no basta:
// contexto es sugerencia, no verificación. Este módulo cierra el ciclo — lee
// una sección ya escrita y la juzga con la MISMA vara con la que el evaluador
// califica a un vendedor en ese paso.
//
// Hace dos cosas que nadie hacía:
//   1. DERIVA los skill_ids del texto (antes los declaraba el modelo generador
//      y nunca se recalculaban al editar).
//   2. VERIFICA el texto contra los failure_criteria del paso.
//
// Disciplina anti-fabricación: toda violación exige una cita LITERAL del
// texto. El código descarta las que no aparecen textualmente. Es la misma
// lección del evaluador: sin evidencia documentada, no hay veredicto.

import { getCriteriosEjecucion } from "@/lib/doctrina.server";
import {
  PITCH_STEPS_SPEC,
  RECURRENTE_NODE_IDS,
  buildCriteriosBlock,
} from "@/lib/pitch-generator.server";

export const PITCH_AUDIT_MODEL = "claude-sonnet-4-5";
export const PITCH_AUDIT_PROMPT_VERSION = "pitch-audit-v2.0.0-veredictos";

export type AuditSeverity = "critical" | "major" | "minor" | "normal";
export type AuditStatus = "limpio" | "advertencia" | "falla";

export type AuditViolation = {
  criterio_id: string;
  severity: AuditSeverity;
  evidencia: string;
  explicacion: string;
};

export type AuditResult = {
  status: AuditStatus;
  skill_ids: string[];
  violations: AuditViolation[];
  /** Criterios de ÉXITO del paso que el texto no cumple. */
  no_cumplidos: AuditViolation[];
  sin_respaldo: string[];
  descartadas: number;
  skills_descartados: string[];
  prompt_version: string;
};

const SEVERITIES: AuditSeverity[] = ["critical", "major", "minor", "normal"];

const INSTRUCCIONES = `Eres el auditor de Closer. Recibes UNA sección de un pitch ya escrita y la
juzgas con los criterios de ejecución de ese paso — los mismos con los que
Closer califica a un vendedor real.

No reescribes nada. No opinas de estilo. Solo observas y reportas.

═══ ORDEN DE TRABAJO (obligatorio, en este orden) ═══

1. LECTURA LITERAL. Primero extraes, frase por frase, qué hace el texto:
   qué afirma, qué pregunta, qué pide. Sin juzgar todavía.
2. TÉCNICAS. Con la lectura hecha, dices qué skills del catálogo están
   REALMENTE ejecutadas en el texto. No las que debería tener: las que tiene.
   Si una técnica no es visible en el texto, no va.
3. VIOLACIONES. Recorres los criterios de falla uno por uno y marcas los que
   el texto incumple.
4. RESPALDO. Marcas toda afirmación concreta sobre el negocio (precios,
   marcas, plazos, clientes, referencias, ventajas) que NO puedas rastrear al
   cerebro de la empresa. Una afirmación que no rastrea a un dato es inventada.

═══ REGLA DURA DE EVIDENCIA ═══

Cada violación exige "evidencia": la cita LITERAL y EXACTA del texto que la
dispara, copiada carácter por carácter. Sin cita literal la violación se
descarta automáticamente. Si no puedes citar, no lo marques.

═══ SALIDA — SOLO JSON, sin texto alrededor ═══
{
  "lectura": ["qué hace cada frase, en orden"],
  "skill_ids": ["ids del catálogo realmente ejecutados"],
  "violations": [
    { "criterio_id": "id exacto del criterio de falla",
      "severity": "critical" | "major" | "minor",
      "evidencia": "cita literal del texto",
      "explicacion": "qué le pasa al cliente por esto, en una frase" }
  ],
  "sin_respaldo": ["afirmaciones que no rastrean al cerebro de la empresa"]
}`;

/** Normaliza para comparar citas: sin acentos, sin puntuación suelta, espacios colapsados. */
function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[«»"“”'‘’¿?¡!.,;:()\[\]—–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function auditStatusOf(
  violations: AuditViolation[],
  sinRespaldo: string[],
): AuditStatus {
  if (violations.some((v) => v.severity === "critical")) return "falla";
  if (violations.length > 0 || sinRespaldo.length > 0) return "advertencia";
  return "limpio";
}

/**
 * Audita una sección. `admin` es el cliente con service_role.
 * No escribe nada: devuelve el veredicto. Quien llama decide qué persiste.
 */
export async function auditPitchSectionContent(args: {
  admin: any;
  apiKey: string;
  content: string;
  step: number;
  sectionKey: string;
  sectionKind: string;
  companyId: string;
  relationship: string;
}): Promise<AuditResult> {
  const { admin, apiKey, content } = args;

  const spec = PITCH_STEPS_SPEC.find((x) => x.step === Number(args.step));
  const extraNodes = String(args.relationship) === "recurrente" ? RECURRENTE_NODE_IDS : [];

  const [skillsRes, companyRes, criteriosWorlds, criteriosNodes] = await Promise.all([
    admin
      .from("skills")
      .select("id, code, name, short_description, category, world_id_introduced")
      .eq("status", "active")
      .order("world_id_introduced", { ascending: true }),
    admin
      .from("companies")
      .select("name, company_sales_brain")
      .eq("id", args.companyId)
      .maybeSingle(),
    getCriteriosEjecucion({ worlds: spec?.worlds ?? [] }),
    extraNodes.length ? getCriteriosEjecucion({ nodeIds: extraNodes }) : Promise.resolve([]),
  ]);

  const criterios = [...criteriosWorlds, ...criteriosNodes];
  const skillList = (skillsRes.data ?? []) as any[];
  const validSkillIds = new Set(skillList.map((s) => String(s.id)));
  // Un skill fuera del alcance del paso no es una etiqueta: es una señal de
  // que la sección se salió del paso. Se conserva, pero se puede marcar.
  const skillsBlock = skillList
    .map(
      (s) =>
        `- ${s.id} | ${s.name} | ${s.category} | Mundo ${s.world_id_introduced}${
          s.short_description ? ` | ${s.short_description}` : ""
        }`,
    )
    .join("\n");

  const brain = JSON.stringify(
    {
      empresa: (companyRes.data as any)?.name,
      brain: (companyRes.data as any)?.company_sales_brain ?? null,
    },
    null,
    2,
  ).slice(0, 12000);

  const system = `${INSTRUCCIONES}

═══ CATÁLOGO DE SKILLS (los únicos ids válidos) ═══
${skillsBlock}`;

  const user = `${buildCriteriosBlock(criterios)}

═══ CEREBRO DE LA EMPRESA (única fuente de hechos del negocio) ═══
${brain}

═══ LA SECCIÓN A AUDITAR ═══
Paso ${args.step} — ${args.sectionKey} (${args.sectionKind})
Pitch de cliente ${args.relationship}

TEXTO:
${content}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: PITCH_AUDIT_MODEL,
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`audit_model_error: ${(await res.text()).slice(0, 200)}`);

  const json: any = await res.json();
  const raw: string = (json?.content ?? [])
    .filter((b: any) => b?.type === "text")
    .map((b: any) => b.text)
    .join("")
    .trim();

  let parsed: any = null;
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : null;
  } catch {
    parsed = null;
  }
  if (!parsed) throw new Error("audit_parse_error");

  // skill_ids: solo los que existen en el catálogo.
  const skill_ids = [
    ...new Set(
      (Array.isArray(parsed.skill_ids) ? parsed.skill_ids : [])
        .map((x: unknown) => String(x))
        .filter((x: string) => validSkillIds.has(x)),
    ),
  ] as string[];

  // Violaciones: el id tiene que ser un criterio de falla real del alcance,
  // y la evidencia tiene que aparecer LITERALMENTE en el texto.
  const fallasValidas = new Map(
    criterios.filter((c) => c.tipo === "failure").map((c) => [c.skill_id, c]),
  );
  const contentNorm = normalizar(content);

  let descartadas = 0;
  const violations: AuditViolation[] = [];
  for (const raw of Array.isArray(parsed.violations) ? parsed.violations : []) {
    const id = String(raw?.criterio_id ?? "");
    const evidencia = String(raw?.evidencia ?? "").trim();
    const criterio = fallasValidas.get(id);
    if (!criterio || !evidencia) {
      descartadas++;
      continue;
    }
    if (!contentNorm.includes(normalizar(evidencia))) {
      descartadas++; // cita fabricada: fuera.
      continue;
    }
    const sev = String(raw?.severity ?? criterio.severity ?? "normal") as AuditSeverity;
    violations.push({
      criterio_id: id,
      severity: SEVERITIES.includes(sev) ? sev : "normal",
      evidencia,
      explicacion: String(raw?.explicacion ?? "").trim(),
    });
  }

  const sin_respaldo = (Array.isArray(parsed.sin_respaldo) ? parsed.sin_respaldo : [])
    .map((x: unknown) => String(x).trim())
    .filter(Boolean)
    .slice(0, 12);

  return {
    status: auditStatusOf(violations, sin_respaldo),
    skill_ids,
    violations,
    sin_respaldo,
    descartadas,
    prompt_version: PITCH_AUDIT_PROMPT_VERSION,
  };
}
