// Una falla espejo no puede contradecir a su criterio (mensaje 128, 3-nov-2026).
//
// Algunas fallas son el reverso de un criterio del mismo nodo («espejo_de»):
// «ignora_pistas» es el reverso de «discovery.preguntas_capas». Se juzgan con
// la MISMA regla y la misma prueba. Entonces no pueden salir las dos cosas: si
// el criterio salió «cumple» (el vendedor recogió la pista y la excavó), la
// falla «dejó pasar la pista» es falsa.
//
// Disputa del 3.10 (3-nov): el evaluador dio preguntas_capas: cumple y
// dolor_real: cumple, y a la vez marcó ignora_pistas. Al vendedor le salió como
// error algo que la misma evaluación decía que hizo bien. El prompt ya decía
// «si el criterio salió no_cumple o parcial por ese hecho, la falla va»; lo
// que no existía era la garantía. Ahora la da el código: va DESPUÉS del juez
// (que puede corregir el nivel de un criterio) y ANTES de la nota.
//
// Solo aplica a fallas que NO son critical: una critical nunca es espejo
// (esEspejo en puntuacion.ts), y hoy ningún nodo tiene una.

export interface FallaQuitadaPorEspejo { id: string; tipo: "falla"; razon: string }

export function quitarEspejosDeCriteriosCumplidos(ev: any, ps: any): FallaQuitadaPorEspejo[] {
  const flags: unknown[] = Array.isArray(ev?.flags_detected) ? ev.flags_detected : [];
  if (flags.length === 0) return [];
  const fallas: any[] = Array.isArray(ps?.failure_criteria) ? ps.failure_criteria : [];
  const veredictos: any[] = Array.isArray(ev?.veredictos_criterios) ? ev.veredictos_criterios : [];
  const nivel = new Map<string, string>();
  for (const v of veredictos) if (v && typeof v.criterio_id === "string") nivel.set(v.criterio_id, String(v.nivel ?? ""));

  const quitadas: FallaQuitadaPorEspejo[] = [];
  for (const id of flags) {
    const f = fallas.find((x) => x?.id === id);
    if (!f || f.severity === "critical") continue;
    const espejo = typeof f.espejo_de === "string" ? f.espejo_de.trim() : "";
    if (!espejo) continue;
    const n = nivel.get(espejo);
    if (n === "cumple" || n === "no_aplica") {
      quitadas.push({ id: String(id), tipo: "falla", razon: `su criterio espejo ${espejo} salió "${n}"` });
    }
  }
  if (quitadas.length === 0) return [];
  const fuera = new Set(quitadas.map((q) => q.id));
  ev.flags_detected = flags.filter((id) => !fuera.has(String(id)));
  if (Array.isArray(ev.evidencia_flags)) ev.evidencia_flags = ev.evidencia_flags.filter((e: any) => !fuera.has(String(e?.id)));
  return quitadas;
}
