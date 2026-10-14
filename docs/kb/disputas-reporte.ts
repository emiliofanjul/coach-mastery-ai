// El reporte de disputas que se copia para analizarlo con Claude (oct-2026).
// Puro: sin navegador ni base de datos, para probarlo ejecutándolo.

export interface Disputa {
  id: string;
  created_at: string;
  node_id: string | null;
  nota_original: number | null;
  mensaje_vendedor: string;
  respuesta_closer: string;
  concede: boolean | null;
  criterio_id: string | null;
  motivo: string | null;
  contexto: { evaluacion?: any; conversacion?: { role: string; content: string }[] } | null;
  revisada: boolean;
  nota_revision: string | null;
}

export type Filtro = "concedidas" | "sin_revisar" | "todas";

export function filtrar(lista: Disputa[], filtro: Filtro, nodo: string): Disputa[] {
  return lista.filter((d) =>
    (filtro === "todas" || (filtro === "concedidas" && d.concede === true) || (filtro === "sin_revisar" && !d.revisada)) &&
    (!nodo || d.node_id === nodo));
}

function veredictos(ev: any): string {
  const vs = Array.isArray(ev?.veredictos_criterios) ? ev.veredictos_criterios : [];
  return vs.map((v: any) => `${String(v?.criterio_id ?? "").split(".").pop()}:${v?.nivel ?? "?"}${v?.falta ? `(falta: ${String(v.falta).slice(0, 80)})` : ""}`).join(" ");
}

const CORTE: Record<string, string> = {
  max_duration: "se acabó el tiempo", max_turns: "se acabaron los turnos",
  scope_covered: "objetivo cumplido", evidence_sufficient: "evidencia suficiente", critical_failure: "falla crítica",
};

/** Qué le bajó la nota (oct-2026): sin esto, una nota de 30 por falla crítica no se explicaba. */
function fallas(ev: any): string {
  const fs = Array.isArray(ev?.fallas) ? ev.fallas : [];
  if (fs.length) return fs.map((f: any) => `${f?.id}(${f?.severidad})${f?.cita ? `: "${String(f.cita).slice(0, 120)}"` : ""}`).join(" · ");
  const flags = Array.isArray(ev?.flags_detected) ? ev.flags_detected : [];
  return flags.join(", ");
}

export function armarReporteDisputas(lista: Disputa[]): string {
  const lineas: string[] = [`DISPUTAS · ${lista.length} · concedidas: ${lista.filter((d) => d.concede === true).length}`];
  for (const d of lista) {
    lineas.push("");
    lineas.push(`[${d.node_id ?? "?"}] ${d.created_at.slice(0, 16).replace("T", " ")} · nota ${d.nota_original ?? "?"} · ${d.concede === true ? "CONCEDIDA" : d.concede === false ? "sostenida" : "sin dato"}${d.criterio_id ? ` · criterio ${d.criterio_id}` : ""}`);
    if (d.motivo) lineas.push(`   motivo: ${d.motivo}`);
    lineas.push(`   vendedor: ${d.mensaje_vendedor}`);
    lineas.push(`   closer: ${d.respuesta_closer}`);
    const ev = d.contexto?.evaluacion;
    if (ev) lineas.push(`   decidió: ${veredictos(ev)}`);
    if (ev && fallas(ev)) lineas.push(`   fallas: ${fallas(ev)}`);
    if (ev?.cut_reason) lineas.push(`   terminó: ${CORTE[ev.cut_reason] ?? ev.cut_reason}`);
    const conv = d.contexto?.conversacion ?? [];
    if (conv.length) {
      lineas.push("   conversación:");
      for (const t of conv) lineas.push(`     ${t.role === "user" ? "V" : "C"}: ${String(t.content ?? "").replace(/\s+/g, " ").slice(0, 600)}`);
    }
    if (d.nota_revision) lineas.push(`   nota de revisión: ${d.nota_revision}`);
  }
  return lineas.join("\n");
}
