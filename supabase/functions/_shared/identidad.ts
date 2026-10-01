// Verificaciones de HECHO que no deben depender del modelo (sept-2026).
// Sin imports: lo usan Deno y las pruebas.

const PRESENTACION = /(^|[^a-záéíóúñü])(soy|me llamo|mi nombre es|vengo de|le hablo de|trabajo (?:en|con|para)|represento a)(?=$|[^a-záéíóúñü])/i;

function palabraCompleta(texto: string, palabra: string): boolean {
  const p = palabra.trim().toLowerCase();
  if (p.length < 3) return false;
  const esc = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-záéíóúñü])${esc}(?=$|[^a-záéíóúñü])`, "i").test(texto.toLowerCase());
}

/**
 * ¿El vendedor se presentó? Doctrina: presentarse es decir EN PRIMERA PERSONA
 * quién es ("soy…", "me llamo…", "vengo de…") o el nombre de su empresa. Usar
 * el nombre del cliente, "don" o "sir" no es presentarse. El modelo a veces lo
 * confunde; esto se verifica en el texto.
 */
export function vendedorSePresento(turnosVendedor: string[], nombreVendedor?: string | null, empresa?: string | null): boolean {
  const primerNombre = String(nombreVendedor ?? "").trim().split(/\s+/)[0] ?? "";
  return turnosVendedor.some((t) =>
    PRESENTACION.test(t) || (primerNombre && palabraCompleta(t, primerNombre)) || (empresa ? palabraCompleta(t, empresa) : false));
}

/** El nombre de la empresa, si el cerebro empieza con "Nombre: …". */
export function empresaDelCerebro(cerebro: unknown): string | null {
  const m = /^\s*([^:\n]{3,60}):/.exec(String(cerebro ?? ""));
  return m ? m[1].trim() : null;
}

/**
 * Recuerdos inventados. Hoy toda práctica es una PRIMERA visita (aún no hay
 * ficha del cliente): ningún consejo puede citar una visita anterior ni
 * proponer el escalón 3, que la doctrina solo ofrece con historia real.
 */
export const RECUERDO_INVENTADO = /(la última vez|la vez pasada|la otra vez que|cuando vine|cuando pasé|visita (?:anterior|pasada)|cliente recurrente|escal[oó]n 3)/i;

export function sanearRecuerdos(ev: any, misionDeRespaldo: string): number {
  let quitados = 0;
  for (const o of Array.isArray(ev?.observations) ? ev.observations : []) {
    if (RECUERDO_INVENTADO.test(String(o?.ejemplo ?? ""))) { o.ejemplo = ""; quitados++; }
    if (RECUERDO_INVENTADO.test(String(o?.mejora ?? ""))) { o.mejora = ""; quitados++; }
  }
  if (RECUERDO_INVENTADO.test(String(ev?.mision ?? ""))) { ev.mision = misionDeRespaldo; quitados++; }
  if (Array.isArray(ev?.siguiente_nivel)) {
    const antes = ev.siguiente_nivel.length;
    ev.siguiente_nivel = ev.siguiente_nivel.filter((x: any) =>
      !RECUERDO_INVENTADO.test(`${x?.observacion ?? ""} ${x?.ejemplo ?? ""} ${x?.por_que ?? ""}`));
    quitados += antes - ev.siguiente_nivel.length;
  }
  return quitados;
}
