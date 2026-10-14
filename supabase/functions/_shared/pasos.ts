// El paso de la visita al que pertenece cada cosa que se le marca al vendedor
// (oct-2026, idea de Emilio). En un boss se califican habilidades de varios
// pasos; sin decir de cuál viene cada una, el vendedor ve "AIR" en el boss de
// la Presentación y no sabe en qué momento de la visita falló. Con el paso
// ("La Historia Breve · AIR") lo ubica como lo piensa en la calle.
//
// Sin imports: lo usan la Edge Function y las pruebas con el mismo código.

export interface Catalogo {
  skills: { id: string; name?: string | null; world_id_introduced?: number | null; regla_id?: string | null }[];
  reglas: { id: string; paso?: number | string | null }[];
  mundos: { id: number; name: string }[];
}

const mundoDelNodo = (nodeId: string | null): number | null => {
  const n = Number(String(nodeId ?? "").split(".")[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Agrega "paso" (el nombre del mundo, que es el paso de la visita) a cada
 * observación —y "habilidad", su nombre— y a cada falla. Nunca quita ni cambia
 * nada más: si algo no se encuentra, simplemente no lleva etiqueta.
 */
export function etiquetarPasos(ev: any, practiceScript: any, nodeId: string | null, cat: Catalogo): void {
  const nombreMundo = new Map(cat.mundos.map((m) => [Number(m.id), String(m.name)]));
  const skillPorId = new Map(cat.skills.map((s) => [s.id, s]));
  const skillPorRegla = new Map<string, (typeof cat.skills)[number]>();
  for (const s of cat.skills) if (s.regla_id && !skillPorRegla.has(s.regla_id)) skillPorRegla.set(s.regla_id, s);
  const pasoDeRegla = new Map(cat.reglas.map((r) => [r.id, Number(r.paso ?? 0)]));
  const mundoNodo = mundoDelNodo(nodeId);

  for (const o of Array.isArray(ev?.observations) ? ev.observations : []) {
    const s = skillPorId.get(o?.criterio_id);
    const paso = s?.world_id_introduced ? nombreMundo.get(Number(s.world_id_introduced)) : undefined;
    if (paso) o.paso = paso;
    if (s?.name) o.habilidad = s.name;
  }

  const fallasGuion = new Map<string, any>(
    (Array.isArray(practiceScript?.failure_criteria) ? practiceScript.failure_criteria : [])
      .filter((f: any) => f && typeof f.id === "string").map((f: any) => [f.id, f]),
  );
  for (const f of Array.isArray(ev?.fallas) ? ev.fallas : []) {
    const regla = fallasGuion.get(f?.id)?.regla_id;
    const skill = regla ? skillPorRegla.get(regla) : undefined;
    const pasoRegla = regla ? pasoDeRegla.get(regla) : undefined;
    const mundo = skill?.world_id_introduced
      ? Number(skill.world_id_introduced)
      : pasoRegla && pasoRegla > 0 ? pasoRegla : mundoNodo;
    const paso = mundo ? nombreMundo.get(mundo) : undefined;
    if (paso) f.paso = paso;
  }
}
