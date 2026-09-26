// Reporte compacto de la red de seguridad, para pegar en la conversación.
// Solo incluye lo que hay que revisar: resumen por corrida, fallas con lo que
// decidió el evaluador, y casos cuya nota cambió entre corridas.
export type Caso = { id: string; node_id: string; mundo: number; descripcion: string };
export type Resultado = {
  status: "pass" | "fail" | "skipped" | "error";
  score: number | null;
  reasons: string[];
  veredictos: string[];
};

/** Texto compacto para pegar en la conversación: solo lo que hay que revisar. */
export function armarReporte(
  version: string, casos: Caso[], corridas: number, res: Record<string, Resultado[]>, mundos: number[],
): string {
  const lineas: string[] = [];
  const fecha = new Date().toISOString().slice(0, 16).replace("T", " ");
  lineas.push(`RED ${version} · ${fecha} · ${casos.length} casos × ${corridas} corrida(s) · mundos ${mundos.join(",")}`);
  for (let k = 0; k < corridas; k++) {
    const rs = casos.map((c) => res[c.id]?.[k]).filter(Boolean) as Resultado[];
    const cuenta = (s: string) => rs.filter((r) => r.status === s).length;
    lineas.push(`corrida ${k + 1}: ${cuenta("pass")} ✓ · ${cuenta("fail")} ✗ · ${cuenta("skipped")} omitidos · ${cuenta("error")} errores`);
  }
  const notas = (c: Caso) => (res[c.id] ?? []).map((r) => (r.score ?? "—")).join("·");
  const fallas = casos.filter((c) => (res[c.id] ?? []).some((r) => r.status === "fail" || r.status === "error"));
  if (fallas.length) {
    lineas.push("", "FALLAS");
    for (const c of fallas) {
      const ult = [...(res[c.id] ?? [])].reverse().find((r) => r.status === "fail" || r.status === "error")!;
      lineas.push(`${c.id} [${c.node_id}] ${notas(c)} — ${ult.reasons.join(" | ")}`);
      if (ult.veredictos.length) lineas.push(`   decidió: ${ult.veredictos.join(" ")}`);
    }
  }
  const inestables = casos.filter((c) => {
    const s = (res[c.id] ?? []).map((r) => r.score).filter((x) => typeof x === "number");
    return s.length > 1 && new Set(s).size > 1;
  });
  if (inestables.length) {
    lineas.push("", "INESTABLES (la nota cambió entre corridas)");
    for (const c of inestables) {
      lineas.push(`${c.id} [${c.node_id}] ${notas(c)}`);
      (res[c.id] ?? []).forEach((r, k) => lineas.push(`   c${k + 1}: ${r.veredictos.join(" ") || "(sin desglose)"}`));
    }
  }
  if (!fallas.length && !inestables.length) lineas.push("", "Todo en verde y estable.");
  return lineas.join("\n");
}

