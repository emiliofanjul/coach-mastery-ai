// El auditor del feedback (sept-2026).
//
// Cada ejemplo, cada misión y cada "lo que viene después" pasa por una
// revisión contra las fallas del nodo, las reglas de su paso, el orden de los
// seis pasos y las reglas universales, ANTES de llegar al vendedor. Lo que
// viola algo se corrige o se descarta, en código. Es la misma pieza que hizo
// confiable al Pitch Builder: el modelo propone, el auditor revisa, el código
// aplica. Sin imports (Deno y Node).

export interface TextoAuditable { id: string; tipo: "mejora" | "ejemplo" | "mision" | "observacion_siguiente" | "ejemplo_siguiente"; texto: string; contexto?: string }
export interface VeredictoAuditor { id: string; ok: boolean; viola?: string[]; corregido?: string | null }

export const PROMPT_AUDITOR = `Eres el auditor de doctrina de Closer. Recibes textos que un coach va a mostrarle a un vendedor —cómo decir algo, una misión, consejos— y tu ÚNICO trabajo es verificar que cada texto cumpla la doctrina. No opinas de estilo.
Aplicas TODAS estas reglas:
1. ORDEN DE LOS PASOS: 1 Introducción (saludo + ice breaker; NO se dice quién eres ni a qué vienes), 2 Historia breve (quién eres y por qué estás ahí, en 2-3 frases, sin producto ni precio), 3 Descubrimiento (preguntas por capas; no se presenta), 4 Presentación, 5 Cierre, 6 Consolidación. Un texto que haga el trabajo de un paso POSTERIOR al del nodo, o que ponga un paso antes que otro ("di quién eres en las primeras dos frases" en la introducción), viola la doctrina.
2. FALLAS DEL NODO: un ejemplo NO puede disparar ninguna de las fallas listadas.
3. REGLAS DEL PASO: el texto no puede contradecir ninguna regla listada.
4. HECHOS DEL CLIENTE: todo dato del cliente que use un texto (un dolor, una visita anterior, una marca, una cifra) tiene que aparecer en la "conversacion" o en la "ficha_cliente". Si no aparece en ninguna, es inventado: viola "dato_inventado".
5. UNIVERSALES: nunca pedir permiso ni consentimiento ("¿me permite?", "¿le parece si…?", "¿está abierto a…?", "¿verdad?" buscando que confirme, "pausa para que confirme"); nunca ofrecer muestras, pruebas gratis ni "le dejo para que lo pruebe"; nunca groserías; nunca inventar hechos del cliente; nunca huecos de dato como "[empresa]"; un cierre siempre da alternativa ("¿el martes o el jueves?"), nunca pregunta abierta ("¿a qué hora le caigo?").
Para cada texto: "ok" true o false. Si false: "viola" con los ids que viola (una falla, una regla, o "orden" / "permiso" / "muestra" / "groseria" / "dato_inventado"), y "corregido": una versión que cumpla TODO lo anterior conservando la intención del coach — o null si no se puede sin cambiar la intención.
Responde SOLO con JSON: {"veredictos":[{"id":"…","ok":true,"viola":[],"corregido":null}]}`;

export function armarEntradaAuditor(args: { paso: number | null; fallas: { id: string; description?: string; severity?: string }[]; reglas: { id: string; resumen: string }[]; textos: TextoAuditable[]; conversacion?: { role: string; content: string }[]; ficha_cliente?: string }): string {
  return JSON.stringify({
    paso_del_nodo: args.paso,
    ficha_cliente: args.ficha_cliente ?? "",
    // Para verificar que un ejemplo no invente hechos del cliente: todo dato del
    // cliente en un ejemplo tiene que estar en esta conversación.
    conversacion: (args.conversacion ?? []).slice(-24).map((t) => ({ quien: t.role === "user" ? "vendedor" : "cliente", dijo: String(t.content ?? "").slice(0, 400) })),
    fallas_del_nodo: args.fallas.map((f) => ({ id: f.id, severidad: f.severity ?? "", descripcion: (f.description ?? "").slice(0, 300) })),
    reglas_del_paso: args.reglas.map((r) => ({ id: r.id, resumen: r.resumen.slice(0, 260) })),
    textos: args.textos.map((t) => ({ id: t.id, tipo: t.tipo, texto: t.texto, contexto: (t.contexto ?? "").slice(0, 200) })),
  });
}

/** Saca los textos auditables de una evaluación ya saneada. */
export function textosDeEvaluacion(ev: any): TextoAuditable[] {
  const out: TextoAuditable[] = [];
  (Array.isArray(ev?.observations) ? ev.observations : []).forEach((o: any, i: number) => {
    if (typeof o?.mejora === "string" && o.mejora.trim()) out.push({ id: `obs${i}.mejora`, tipo: "mejora", texto: o.mejora, contexto: o.error });
    if (typeof o?.ejemplo === "string" && o.ejemplo.trim()) out.push({ id: `obs${i}.ejemplo`, tipo: "ejemplo", texto: o.ejemplo, contexto: o.error });
  });
  if (typeof ev?.mision === "string" && ev.mision.trim()) out.push({ id: "mision", tipo: "mision", texto: ev.mision });
  (Array.isArray(ev?.siguiente_nivel) ? ev.siguiente_nivel : []).forEach((s: any, i: number) => {
    if (typeof s?.observacion === "string" && s.observacion.trim()) out.push({ id: `sig${i}.observacion`, tipo: "observacion_siguiente", texto: s.observacion, contexto: s.regla_id });
    if (typeof s?.ejemplo === "string" && s.ejemplo.trim()) out.push({ id: `sig${i}.ejemplo`, tipo: "ejemplo_siguiente", texto: s.ejemplo, contexto: s.observacion });
  });
  return out;
}

export const MISION_DE_RESPALDO = "Repite este nodo aplicando exactamente lo que piden sus criterios: ahí está la mejora.";

/** Aplica los veredictos: corrige lo corregible, descarta lo demás. Modifica y devuelve la evaluación. */
export function aplicarAuditoria(ev: any, veredictos: unknown): { corregidos: number; descartados: number } {
  const lista = (Array.isArray(veredictos) ? veredictos : []) as VeredictoAuditor[];
  const porId = new Map(lista.filter((v) => v && typeof v.id === "string").map((v) => [v.id, v]));
  let corregidos = 0, descartados = 0;
  const arreglo = (id: string, actual: string): string | null => {
    const v = porId.get(id);
    if (!v || v.ok !== false) return actual;
    if (typeof v.corregido === "string" && v.corregido.trim()) { corregidos++; return v.corregido.trim(); }
    descartados++;
    return null;
  };
  (Array.isArray(ev?.observations) ? ev.observations : []).forEach((o: any, i: number) => {
    const m = arreglo(`obs${i}.mejora`, o.mejora); o.mejora = m ?? "";
    const e = arreglo(`obs${i}.ejemplo`, o.ejemplo); o.ejemplo = e ?? "";
  });
  if (typeof ev?.mision === "string") {
    const m = arreglo("mision", ev.mision);
    ev.mision = m ?? MISION_DE_RESPALDO;
  }
  if (Array.isArray(ev?.siguiente_nivel)) {
    ev.siguiente_nivel = ev.siguiente_nivel.filter((s: any, i: number) => {
      const o = arreglo(`sig${i}.observacion`, s.observacion);
      const e = arreglo(`sig${i}.ejemplo`, s.ejemplo);
      if (o === null || (e === null && s.ejemplo)) return false;
      s.observacion = o; s.ejemplo = e ?? "";
      return true;
    });
  }
  return { corregidos, descartados };
}

/** Extrae el primer objeto JSON de una respuesta, aunque venga con texto o cercas alrededor. */
export function extraerJson(crudo: string): any {
  const t = String(crudo ?? "").replace(/```json|```/g, "");
  const i = t.indexOf("{"), j = t.lastIndexOf("}");
  if (i < 0 || j <= i) throw new Error("sin JSON");
  return JSON.parse(t.slice(i, j + 1));
}

/**
 * Si el auditor no pudo correr, nada sin revisar llega al vendedor: se quitan
 * los ejemplos y "lo que viene después", y la misión cae en la de respaldo. Se
 * conservan las observaciones (qué criterio falló), que vienen de la rúbrica.
 */
export function fallaCerrada(ev: any): void {
  for (const o of Array.isArray(ev?.observations) ? ev.observations : []) o.ejemplo = "";
  if (typeof ev?.mision === "string") ev.mision = MISION_DE_RESPALDO;
  if (Array.isArray(ev?.siguiente_nivel)) ev.siguiente_nivel = ev.siguiente_nivel.filter((x: any) => x?.regla_id === "mindset.sin_groserias");
}
