// LO QUE BAJÓ LA NOTA SE VE, Y VA PRIMERO (mensaje 163, 10-nov-2026).
//
// El caso (8-nov, nodo 1.2): la vendedora se presentó con su nombre en cuatro
// intentos seguidos. Eso le quitaba un criterio completo cada vez. En el primer
// intento el evaluador no escribió ninguna observación sobre eso: perdió los
// puntos y la pantalla no le dijo por qué. No podía corregir lo que no veía.
//
// La causa: las observaciones las escoge el modelo (de 0 a 3), y nada obligaba
// a que cada criterio que bajó la nota tuviera la suya, ni a que la que más
// pesó fuera primero. La nota la calcula el código; lo que se le explica al
// vendedor tiene que salir de esa misma cuenta.
//
// Ahora, con la rúbrica ya calculada:
//   1. Todo criterio que quedó sin crédito completo tiene su observación. Si el
//      evaluador no la escribió, se arma con el motivo que él mismo dio al
//      decidir el nivel («falta»). No se inventa nada: es su veredicto.
//   2. Van ordenadas por los puntos que costó cada una: la que más bajó la nota,
//      primero. La pantalla muestra las tres primeras.
//
// Sin imports: funciona en Deno y en Node (se prueba ejecutándolo).

export interface LineaDesglose { criterio_id: string; peso: number; nivel: string; credito: number; falta?: string }

/** Puntos de la base (sobre 100) que costó un criterio. Un «no aplica» no cuesta: salió de la cuenta. */
export function puntosPerdidos(d: LineaDesglose): number {
  if (!d || d.nivel === "no_aplica") return 0;
  const peso = Number(d.peso), credito = Number(d.credito);
  if (!Number.isFinite(peso) || !Number.isFinite(credito)) return 0;
  return Math.max(0, peso * (1 - credito));
}

const conMayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Completa y ordena las observaciones con la cuenta de la rúbrica. Modifica la
 * evaluación. Devuelve los criterios a los que les faltaba su observación.
 */
export function completarYOrdenarObservaciones(ev: any, desglose: LineaDesglose[]): { agregadas: string[] } {
  const lineas = (Array.isArray(desglose) ? desglose : []).filter((d) => d && typeof d.criterio_id === "string");
  const observaciones: any[] = Array.isArray(ev?.observations) ? ev.observations : [];
  // El motivo completo viene del veredicto (el desglose lo trae recortado).
  const motivo = new Map<string, string>();
  for (const v of Array.isArray(ev?.veredictos_criterios) ? ev.veredictos_criterios : []) {
    if (typeof v?.criterio_id === "string" && typeof v?.falta === "string" && v.falta.trim()) motivo.set(v.criterio_id, v.falta.trim());
  }
  const agregadas: string[] = [];
  for (const d of lineas) {
    if (puntosPerdidos(d) <= 0) continue;
    // Solo lo que el evaluador dejó en «parcial» o «no cumple». Un «cumple» en
    // un escalón intermedio no es un error: no se le pone como observación.
    if (d.nivel !== "parcial" && d.nivel !== "no_cumple") continue;
    if (observaciones.some((o) => o?.criterio_id === d.criterio_id)) continue;
    const falta = motivo.get(d.criterio_id) ?? (typeof d.falta === "string" ? d.falta.trim() : "");
    // Sin motivo no hay qué decirle: no se inventa un texto.
    if (!falta) continue;
    observaciones.push({ criterio_id: d.criterio_id, error: conMayuscula(falta), mejora: "", ejemplo: "", de_la_rubrica: true });
    agregadas.push(d.criterio_id);
  }
  const perdido = new Map(lineas.map((d) => [d.criterio_id, puntosPerdidos(d)]));
  // Orden estable: a igual costo, se respeta el orden en que venían.
  ev.observations = observaciones
    .map((o, i) => ({ o, i, p: perdido.get(o?.criterio_id) ?? -1 }))
    .sort((a, b) => b.p - a.p || a.i - b.i)
    .map((x) => x.o);
  return { agregadas };
}
