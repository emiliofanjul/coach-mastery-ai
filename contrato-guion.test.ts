// El contrato debe aceptar el guion RESUELTO, no solo el crudo.
//
// Sept-2026: al resolver los criterios contra la tabla reglas se agregaron
// campos (regla_id, cita_cerebro, severity_override…) que el schema rechazaba
// por additionalProperties:false. Resultado: 422 en los 48 nodos y la práctica
// caída. El contrato hacía bien su trabajo; lo que faltaba era actualizarlo.
// Esta prueba valida cada nodo real contra el schema real.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const schema = JSON.parse(
  readFileSync(join(root, "supabase/functions/_shared/practice_script_schema_v1.json"), "utf8"),
);
const reglas: any[] = JSON.parse(readFileSync(join(root, "docs/kb/reglas.json"), "utf8"));
const nodos: any[] = JSON.parse(readFileSync(join(root, "docs/kb/nodos_snapshot.json"), "utf8"));
const porId = new Map(reglas.map((r) => [r.id, r]));

/** Réplica en TS de resolver_practice_script(), para validar sin base de datos. */
function resolver(ps: any): any {
  if (!ps) return ps;
  const out = JSON.parse(JSON.stringify(ps));
  for (const tipo of ["success_criteria", "failure_criteria"] as const) {
    if (!Array.isArray(out[tipo])) continue;
    out[tipo] = out[tipo].map((c: any) => {
      const r = c.regla_id ? porId.get(c.regla_id) : null;
      if (!r) return c;
      const desc =
        c.description && c.description !== r.resumen
          ? `${r.resumen} — En este nodo: ${c.description}`
          : r.resumen;
      const extra: any = {
        description: desc,
        contexto_nodo: c.description,
        regla_resumen: r.resumen,
        cita_cerebro: r.cita_cerebro,
        regla_tipo: r.tipo,
        regla_canal: r.canal,
      };
      if (tipo === "failure_criteria") {
        extra.severity = c.severity_override
          ? c.severity
          : (r.severidad_sugerida ?? c.severity);
      }
      return { ...c, ...extra };
    });
  }
  return out;
}

/**
 * Comprobación de la parte del contrato que nos falló: campos permitidos y
 * requeridos en los criterios. Sin dependencia de ajv — la Edge Function usa
 * su propia copia desde esm.sh y no queremos una versión distinta aquí.
 */
function revisarCriterios(ps: any): string[] {
  const errs: string[] = [];
  for (const tipo of ["success_criteria", "failure_criteria"] as const) {
    const def = schema.properties[tipo]?.items;
    if (!def || !Array.isArray(ps?.[tipo])) continue;
    const permitidos = new Set(Object.keys(def.properties ?? {}));
    const requeridos: string[] = def.required ?? [];
    ps[tipo].forEach((c: any, i: number) => {
      for (const k of Object.keys(c)) {
        if (!permitidos.has(k)) errs.push(`/${tipo}/${i}: campo no permitido '${k}'`);
      }
      for (const k of requeridos) {
        if (c[k] === undefined) errs.push(`/${tipo}/${i}: falta '${k}'`);
      }
    });
  }
  return errs;
}

const conScript = nodos.filter((n) => n.practice_script);

describe("Contrato del practice_script", () => {
  it("acepta el guion resuelto de todos los nodos", () => {
    const fallos = conScript
      .map((n) => {
        const ps = typeof n.practice_script === "string" ? JSON.parse(n.practice_script) : n.practice_script;
        const errs = revisarCriterios(resolver(ps));
        return errs.length ? `${n.id}: ${errs.join("; ")}` : null;
      })
      .filter(Boolean);
    expect(fallos).toEqual([]);
  });

  it("skills_in_focus: hasta 8 en BOSS, 6 en entrenamiento", () => {
    const malos = conScript
      .map((n) => {
        const ps = typeof n.practice_script === "string" ? JSON.parse(n.practice_script) : n.practice_script;
        const foco = ps?.scope?.skills_in_focus ?? [];
        const max = n.node_type === "boss" ? 8 : 6;
        return foco.length > max ? `${n.id} (${n.node_type}): ${foco.length} > ${max}` : null;
      })
      .filter(Boolean);
    expect(malos).toEqual([]);
  });
});
