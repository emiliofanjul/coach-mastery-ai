// EL HECHO DE LOS «NO» (mensaje 105, 28-oct-2026).
//
// Doctrina (Emilio, mensaje 104): fuera del cierre, dos «no» seguidos son la
// señal de que hoy no es el día. En la puerta, después del segundo, se queda
// de regresar; seguir con su tema es insistir (blocks.insistir_tras_dos_no).
//
// El evaluador casi nunca lo marcaba en el G29: revisa toda la práctica de un
// jalón, y contar «no» seguidos y ver qué dijo el vendedor justo después es
// justo lo que se le escapa. Es lo mismo que pasó con la apertura sin pregunta
// (mensaje 99), y se arregla igual: separar el HECHO del JUICIO.
//
// El evaluador solo anota dos hechos por turno del vendedor:
//   cliente_antes: la respuesta del cliente justo antes, con la prueba de un
//                  «no» (flow.dos_no_seguidos): "rechaza" | "no_rechaza" | "no_hay".
//   se_va:         si en ese turno el vendedor deja la visita para otro momento
//                  o se despide: "si" | "no".
// El código cuenta. Y como la regla trae su prueba, el juez revisa la
// acusación antes de que cuente: si el evaluador anotó mal un hecho, el juez
// la quita.
//
// Solo actúa EN LA PUERTA, que es lo que la regla mide: la respuesta del
// cliente a la apertura y la siguiente. Fuera de la puerta (al buscar el hueco
// se deja de buscar, no se va uno; en el cierre son tres) no agrega nada. Solo
// AGREGA, nunca quita. Si los hechos no vienen completos, o no cuadran con la
// conversación, no hace nada (falla abierta: queda lo que dijo el evaluador).

export type ClienteAntes = "rechaza" | "no_rechaza" | "no_hay";
const CLIENTE_ANTES: ClienteAntes[] = ["rechaza", "no_rechaza", "no_hay"];
const SE_VA = ["si", "no"];

export const REGLA_INSISTIR = "blocks.insistir_tras_dos_no";

export const EVIDENCIA_INSISTE = {
  error: (segundoNo: string) =>
    `El cliente te dio dos «no» seguidos en la puerta (el segundo: «${segundoNo}») y seguiste con tu tema. Ahí ya no es seguridad: es terquedad.`,
  mejora: "Al segundo «no» seguido, queda de regresar con una alternativa concreta: «Lo dejo trabajar. ¿Le queda mejor que pase el jueves o el viernes?».",
};

const recorta = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…");

type Bloque = { quien: "vendedor" | "cliente"; texto: string };

/** La conversación en bloques: los mensajes seguidos de la misma persona son un solo turno. */
export function bloques(historia: { role?: string; content?: unknown }[]): Bloque[] {
  const out: Bloque[] = [];
  for (const t of Array.isArray(historia) ? historia : []) {
    const quien = t?.role === "user" ? "vendedor" : t?.role === "assistant" ? "cliente" : null;
    if (!quien) continue;
    const texto = String(t?.content ?? "").trim();
    if (!texto) continue;
    const ultimo = out[out.length - 1];
    if (ultimo && ultimo.quien === quien) ultimo.texto += " " + texto;
    else out.push({ quien, texto });
  }
  return out;
}

/**
 * Agrega la falla de "insiste tras dos no" si los hechos lo dicen: el cliente
 * rechazó la apertura, rechazó otra vez el turno siguiente, y el vendedor no
 * se fue. Devuelve los ids agregados.
 */
export function fallasPorHechoDeLosNo(ev: any, ps: any, historia: { role?: string; content?: unknown }[]): string[] {
  const fallas: any[] = Array.isArray(ps?.failure_criteria) ? ps.failure_criteria : [];
  const ligadas = fallas.filter((f) => f?.regla_id === REGLA_INSISTIR && typeof f?.id === "string");
  if (ligadas.length === 0) return [];

  const turnos: any[] = Array.isArray(ev?.analisis_turnos) ? ev.analisis_turnos : [];
  if (turnos.length === 0) return [];
  if (!turnos.every((t) => CLIENTE_ANTES.includes(t?.cliente_antes) && SE_VA.includes(t?.se_va))) return [];
  const orden = [...turnos].sort((a, b) => Number(a?.turno ?? 0) - Number(b?.turno ?? 0));

  // Los hechos tienen que cuadrar con la conversación: un hecho por cada turno
  // del vendedor, y "no_hay" exactamente donde el cliente no habló antes.
  const bs = bloques(historia);
  const delVendedor = bs.map((b, i) => ({ b, i })).filter((x) => x.b.quien === "vendedor");
  if (delVendedor.length !== orden.length) return [];
  for (let k = 0; k < orden.length; k++) {
    const hayCliente = delVendedor[k].i > 0 && bs[delVendedor[k].i - 1].quien === "cliente";
    if ((orden[k].cliente_antes === "no_hay") === hayCliente) return [];
  }

  // La puerta: el vendedor abre, el cliente contesta la apertura y luego el
  // siguiente turno. Si el cliente habló primero, no es esta puerta.
  if (orden.length < 3 || orden[0].cliente_antes !== "no_hay") return [];
  const [, despuesDelPrimero, despuesDelSegundo] = orden;
  if (despuesDelPrimero.cliente_antes !== "rechaza" || despuesDelSegundo.cliente_antes !== "rechaza") return [];
  if (despuesDelPrimero.se_va === "si" || despuesDelSegundo.se_va === "si") return [];

  const segundoNo = bs[delVendedor[2].i - 1].texto;
  const loQueSiguio = delVendedor[2].b.texto;
  const agregadas: string[] = [];
  for (const f of ligadas) {
    if (!Array.isArray(ev.flags_detected)) ev.flags_detected = [];
    if (ev.flags_detected.includes(f.id)) continue;
    ev.flags_detected.push(f.id);
    if (!Array.isArray(ev.evidencia_flags)) ev.evidencia_flags = [];
    if (!ev.evidencia_flags.some((e: any) => e?.id === f.id)) {
      ev.evidencia_flags.push({
        id: f.id,
        // La cita es lo que dijo el vendedor (la app la muestra como «Dijiste:»).
        cita: loQueSiguio.slice(0, 300),
        error: EVIDENCIA_INSISTE.error(recorta(segundoNo, 120)),
        mejora: EVIDENCIA_INSISTE.mejora,
        ejemplo: "",
      });
    }
    agregadas.push(f.id);
  }
  return agregadas;
}
