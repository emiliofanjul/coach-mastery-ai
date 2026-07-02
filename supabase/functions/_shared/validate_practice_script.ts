// Shared validator for practice_script. Uses Ajv (ESM build from esm.sh).
// A script that does NOT validate must NEVER be executed — callers should
// return an explicit error (422) with the list of validation errors.
//
// Two layers of checks:
//   1) JSON Schema (structural) — via Ajv.
//   2) Semantic checks the schema cannot express:
//      - Sum of success_criteria weights must equal 1.0 (±0.001).
//      - Every success_criteria.id and every scope.skills_in_focus id
//        must exist in public.skills with status='active'.
//
// The skills existence check requires a service-role Supabase client
// (passed in) so this file stays framework-agnostic.

import Ajv from "https://esm.sh/ajv@8.17.1";
import schema from "./practice_script_schema_v1.json" with { type: "json" };

const ajv = new Ajv({ allErrors: true, strict: false });
const validateSchema = ajv.compile(schema as Record<string, unknown>);

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validatePracticeScriptStructure(script: unknown): ValidationResult {
  const ok = validateSchema(script);
  if (ok) return { valid: true, errors: [] };
  const errors: ValidationError[] = (validateSchema.errors ?? []).map((e) => ({
    path: e.instancePath || e.schemaPath || "",
    message: `${e.message ?? "invalid"}${e.params ? ` (${JSON.stringify(e.params)})` : ""}`,
  }));
  return { valid: false, errors };
}

export function validateWeightsSum(script: any): ValidationError | null {
  const crits = Array.isArray(script?.success_criteria) ? script.success_criteria : [];
  const sum = crits.reduce((acc: number, c: any) => acc + (Number(c?.weight) || 0), 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    return {
      path: "/success_criteria",
      message: `sum of weights must be 1.0 (±0.001), got ${sum.toFixed(4)}`,
    };
  }
  return null;
}

// Verifies each success_criteria.id and scope.skills_in_focus exists
// in public.skills with status='active'. Returns the list of missing IDs.
export async function validateSkillsExist(
  script: any,
  admin: any,
): Promise<ValidationError[]> {
  const ids = new Set<string>();
  for (const c of script?.success_criteria ?? []) {
    if (typeof c?.id === "string") ids.add(c.id);
  }
  for (const s of script?.scope?.skills_in_focus ?? []) {
    if (typeof s === "string") ids.add(s);
  }
  if (ids.size === 0) return [];

  const idList = Array.from(ids);
  const { data, error } = await admin
    .from("skills")
    .select("id,status")
    .in("id", idList);
  if (error) {
    return [{ path: "/skills", message: `skills lookup failed: ${error.message}` }];
  }
  const activeIds = new Set(
    (data ?? []).filter((r: any) => r.status === "active").map((r: any) => r.id),
  );
  const missing = idList.filter((id) => !activeIds.has(id));
  return missing.map((id) => ({
    path: "/skills",
    message: `skill id '${id}' not found or not active in taxonomy`,
  }));
}

export async function validatePracticeScriptFull(
  script: unknown,
  admin: any,
): Promise<ValidationResult> {
  const structural = validatePracticeScriptStructure(script);
  if (!structural.valid) return structural;
  const errors: ValidationError[] = [];
  const w = validateWeightsSum(script);
  if (w) errors.push(w);
  errors.push(...(await validateSkillsExist(script, admin)));
  return { valid: errors.length === 0, errors };
}
