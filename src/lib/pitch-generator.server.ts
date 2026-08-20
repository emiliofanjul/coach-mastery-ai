// Closer — Generador de Pitch (Fase 2). Lógica server-only.
// Lee la doctrina VIVA de la base, llama a Claude con el prompt de la
// especificación (VERBATIM), valida con las 12 validaciones de código, y
// persiste las 6 secciones + missing_data.

export const PITCH_PROMPT_VERSION = "pitch-v1.0.0";
export const PITCH_MODEL = "claude-sonnet-4-5";
const TIMEOUT_MS = 300_000;

export const PITCH_STEPS_SPEC: Array<{
  step: number;
  key: string;
  kind: "guion" | "municion";
  world: number;
}> = [
  { step: 1, key: "introduccion", kind: "guion", world: 1 },
  { step: 2, key: "historia_breve", kind: "guion", world: 2 },
  { step: 3, key: "descubrimiento", kind: "municion", world: 3 },
  { step: 4, key: "presentacion", kind: "guion", world: 4 },
  { step: 5, key: "cierre", kind: "guion", world: 5 },
  { step: 6, key: "consolidacion", kind: "guion", world: 6 },
];

export function buildPitchPrompt(args: {
  skillsBlock: string;
  cardsBlock: string;
  brain: string;
  clientType: string;
  channel: string;
}): string {
  return `Eres Closer, el sistema de entrenamiento de ventas. Vas a escribir el pitch
de esta empresa para un tipo de cliente específico.

Este pitch lo va a leer el dueño del negocio y lo van a usar sus vendedores
en la calle. Si contradice algo de lo que Closer enseña, el usuario pierde
la confianza en todo el sistema. La coherencia con la doctrina no es un
detalle de calidad: es la condición de que esto sirva.

═══ DOCTRINA DISPONIBLE ═══
${args.skillsBlock}

${args.cardsBlock}

═══ LA EMPRESA ═══
${args.brain}

═══ EL ENCARGO ═══
Tipo de cliente: ${args.clientType}
Canal: ${args.channel}

═══ REGLAS DURAS ═══

1. EL PITCH ES LA LÍNEA RECTA. Solo lo que dice el vendedor. Nunca escribas
   respuestas del cliente. Escríbelo como si el cliente dijera que sí a todo.

2. LOS 6 PASOS, TODOS. Introducción, Historia Breve, Descubrimiento,
   Presentación, Cierre, Consolidación. Ninguno se salta.

3. EL DESCUBRIMIENTO NO LLEVA GUION. Es la única sección de tipo 'municion'.
   Entrega: los 3 territorios (producto / servicio / precio) traducidos a
   ESTE tipo de cliente, un banco de preguntas concretas por territorio, y
   las pistas típicas del giro. Encabézala con: "Esto no es un guion —
   elige según lo que te conteste."
   Un pitch que entrega "las 5 preguntas de descubrimiento" produce
   vendedores que las recitan, y eso es interrogatorio: falla del nodo 3.2.

4. USA EL LENGUAJE DE LA EMPRESA. Toma el tono, los términos y los productos
   del company_sales_brain. Si la empresa habla de "unidades", no escribas
   "piezas".

5. RESPETA LAS RESTRICCIONES. Lee la sección RESTRICCIONES del brain. Si
   prohíbe garantizar que un producto se venderá, el pitch no lo garantiza —
   y lo señalas con una advertencia visible en esa sección.

6. CADA SECCIÓN CITA SUS TÉCNICAS. Los skill_ids deben existir en la lista
   que recibiste. Nunca inventes un código ni cites una técnica que no esté.

7. NUNCA PIDAS QUE "PRUEBE". Pedirle al cliente que pruebe le pasa el riesgo
   a él, y la gente no quiere experimentar: quiere estar segura. En su lugar:
   convicción sin garantía ("no le puedo garantizar nada, pero estoy seguro
   de que se le va a mover") más la razón detrás ("porque en negocios como
   el suyo es de lo que más sale"). Y ahí se calla — nada de "y si no se
   mueve lo ajustamos", que mete una duda que el cliente no tenía.

8. IMPULSO CON VERDAD. Nada de urgencia inventada, escasez que no existe, ni
   prueba social fabricada. Si el brain no tiene datos de otros clientes, no
   inventes el ancla: pídelos en "lo que me falta".

9. EL RESUMEN DEL PEDIDO VA EN EL CIERRE, NUNCA EN LA PRESENTACIÓN. Antes de
   la pregunta de cierre, enumera brevemente lo que lleva: qué y cuánto.
   · En la presentación NO se enumera: hacerlo concreto mientras construyes
     valor hace que el cliente empiece a sumar el total, y eso sube el costo
     percibido en el peor momento.
   · En el cierre hace lo contrario: confirma que lo escuchaste, previene que
     cancele cuando llegue el pedido, y es la rampa natural del cierre —
     terminas de enumerar y sigues sin pausa con la alternativa.
   · BREVE Y SIN VOLVER A VENDER. Solo qué y cuánto. Si dentro del resumen
     se vuelve a justificar algo, deja de ser resumen y se convierte en una
     segunda presentación que reabre la decisión.
   · Con cliente RECURRENTE, el resumen menciona el pedido base solo como
     referencia ("en lugar de las de siempre") para que se note el
     incremento. No lo reabre: lo que se cierra es lo que se agrega.

═══ REGLAS POR TIPO DE CLIENTE ═══

NUEVO — el vendedor es un desconocido. Aplica la doctrina completa de
adquisición: ganarse la entrada, historia breve, encontrar el DOLOR,
presentar la solución.

RECURRENTE — el cliente ya compra y está contento. Aplica la doctrina de
desarrollo de cuenta:
  · El motivo declarado de la visita NO es levantar el pedido, es dar
    seguimiento. Al que solo toma pedidos lo reemplaza un WhatsApp.
  · El descubrimiento tiene DOS MITADES: hacia adentro (cómo va lo que ya
    le vendes) y hacia los lados (el HUECO — familias que compra con otro
    o que no compra con nadie).
  · Si la empresa tiene más de una familia de producto, la mitad lateral es
    obligatoria, con las tres herramientas: lee el lugar, pregunta por lo
    que le piden, ancla en negocios similares.
  · La presentación del hueco NO ataca al proveedor actual. Vende
    CONSOLIDACIÓN: menos proveedores que seguir, todo en una entrega.
  · El cierre es del INCREMENTO, no del pedido base. El pedido base ya iba
    a existir; no lo reabras.

AUTOCONSUMO — el cliente usa el producto, no lo revende. NUNCA preguntes
qué vende ni qué se le mueve: no vende nada. Pregunta qué USA, cuántas
unidades maneja, cada cuánto repone, cuánto le dura.

DISTRIBUIDOR — pregunta por sus líneas, a cuántos surte, qué zona cubre.

═══ REGLAS POR CANAL ═══

PRESENCIAL — todo aplica. En descubrimiento lateral, "lee el lugar" es la
herramienta principal.

TELÉFONO — no puedes ver el lugar, así que "lee el lugar" se sustituye por
preguntar el catálogo. Frases más cortas. Sin referencias visuales.

WHATSAPP — mensajes cortos, uno por idea. Sin párrafos largos. El cierre
tiene que ser contestable con una palabra.

═══ FORMATO DE SALIDA ═══

JSON con esta forma exacta:

{
  "sections": [
    { "step": 1,
      "section_key": "introduccion",
      "section_kind": "guion",
      "content": "lo que el vendedor dice, con saltos de línea",
      "rationale_short": "UNA sola frase. Es lo primero que ve el manager al
                          abrir el desplegable, y tiene que dejarlo entender en
                          tres segundos. Máximo 25 palabras.",
      "rationale_long": "el desarrollo completo, detrás de un 'leer más'.
                         Escrito para alguien que NO ha tomado el curso: explica
                         el mecanismo, no cites reglas.",
      "skill_ids": ["opening.estructura_apertura", "..."],
      "warning": "restricción de la empresa que aplica aquí, o null",
      "alternatives": [
        { "rank": 1, "label": "Recomendada",
          "content": "...", "why_ranked": "por qué va primero",
          "skill_ids": [...] },
        { "rank": 2, "label": "Si el cliente viene con prisa", ... }
      ]
    }
  ],
  "missing_data": [
    "pregunta concreta que le harías al manager para afinar el pitch"
  ]
}

═══ POR QUÉ EL RATIONALE VA EN DOS VERSIONES ═══

El pitch se lee en dos modos distintos. Construyéndolo, el manager quiere
entender. Usándolo, el vendedor necesita las palabras — y un párrafo de
cuatro líneas en un móvil se salta.

\`rationale_short\` es lo que hace que la sección quepa en pantalla. Una frase,
el mecanismo central, nada más. \`rationale_long\` es para quien quiere aprender.

Ejemplo de la diferencia:

  short: "El motivo declarado no es levantar el pedido: es dar seguimiento.
          Al que solo toma pedidos lo reemplaza un WhatsApp."

  long:  "Con un cliente nuevo la historia breve dice quién eres. Con un
          recurrente ya sabe quién eres — lo que necesita saber es por qué
          VINISTE HOY. Y aquí hay una decisión deliberada: el motivo
          declarado no es levantar pedido, es ver cómo le funcionó lo
          anterior. Eso te posiciona como alguien que da seguimiento, te
          abre la puerta al descubrimiento, y si algo salió mal te enteras
          tú antes de que se vuelva un motivo para cambiar de proveedor."

═══ SOBRE LAS ALTERNATIVAS ═══

Van RANKEADAS, y cada una explica por qué está en esa posición. Una lista
plana le pide al manager que adivine; una rankeada con su razón le enseña
el criterio.

El \`label\` es contextual — dice CUÁNDO conviene cada una, no solo cuál es
mejor en abstracto: "Recomendada", "Si notas algo nuevo en el lugar", "La
más segura", "Si el cliente es de trato rápido".

Genera alternativas en: introducción, historia breve y cierre. En el
descubrimiento no aplican (todo el banco de preguntas ya es un menú).

═══ SOBRE missing_data ═══

Lista lo que NO sabes y que haría el pitch mejor. Un experto que dice qué
le falta genera más confianza que uno que finge saberlo todo.

Sé específico: no "más información del cliente" sino "¿qué familias suelen
comprarse juntas? Si sé que quien lleva X termina llevando Y, el
descubrimiento lateral apunta ahí primero en vez de barrer todo el catálogo".

Responde ÚNICAMENTE con el objeto JSON. Sin texto antes ni después, sin
bloques de código markdown.`;
}

function stripFence(t: string): string {
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (m ? m[1]! : t).trim();
}

function words(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

/** PASO 3 — las 12 validaciones. Devuelve la lista de fallos (vacía = pasa). */
export function validatePitch(
  parsed: any,
  ctx: { validSkillIds: Set<string>; brain: string; clientType: string; only?: string },
): string[] {
  const fails: string[] = [];
  const sections: any[] = Array.isArray(parsed?.sections) ? parsed.sections : [];

  // 1. Falta algún paso de los 6 (o el único esperado, en modo sección)
  for (const s of PITCH_STEPS_SPEC) {
    if (ctx.only && s.key !== ctx.only) continue;
    if (!sections.some((x) => x?.section_key === s.key)) {
      fails.push(`V1: falta el paso ${s.step} (${s.key})`);
    }
  }

  const byKey = (k: string) => sections.find((x) => x?.section_key === k);

  // 2. El descubrimiento viene como guion
  for (const s of sections) {
    const spec = PITCH_STEPS_SPEC.find((x) => x.key === s?.section_key);
    if (spec && s?.section_kind !== spec.kind) {
      fails.push(`V2: ${s.section_key} debe ser section_kind '${spec.kind}'`);
    }
  }

  // 3. Cita un skill_id que no existe
  for (const s of sections) {
    const ids: string[] = [
      ...(Array.isArray(s?.skill_ids) ? s.skill_ids : []),
      ...(Array.isArray(s?.alternatives)
        ? s.alternatives.flatMap((a: any) => (Array.isArray(a?.skill_ids) ? a.skill_ids : []))
        : []),
    ];
    for (const id of ids) {
      if (!ctx.validSkillIds.has(String(id))) {
        fails.push(`V3: skill_id inexistente "${id}" en ${s?.section_key}`);
      }
    }
  }

  const contentText = sections
    .map((s) =>
      [String(s?.content ?? "")]
        .concat((s?.alternatives ?? []).map((a: any) => String(a?.content ?? "")))
        .join("\n"),
    )
    .join("\n");
  const contentLower = contentText.toLowerCase();
  const brainLower = ctx.brain.toLowerCase();

  // 4. Términos de industria ajena a la empresa
  const FOREIGN = [
    "seguro de vida",
    "póliza",
    "bienes raíces",
    "inmueble",
    "hipoteca",
    "saas",
    "criptomoneda",
    "menú del restaurante",
  ];
  for (const term of FOREIGN) {
    if (contentLower.includes(term) && !brainLower.includes(term)) {
      fails.push(`V4: término de industria ajena "${term}"`);
    }
  }
  if (ctx.clientType === "autoconsumo") {
    if (/(qué|que)\s+(vende|se le mueve|le compran|revende)/i.test(contentText)) {
      fails.push("V4: en autoconsumo se pregunta qué vende");
    }
  }

  // 5. "para que lo pruebe" o equivalente
  const PROBAR = [
    "para que lo pruebe",
    "para que la pruebe",
    "para que las pruebe",
    "para que los pruebe",
    "pruébelo",
    "pruébela",
    "a prueba",
    "de prueba",
    "que lo pruebe",
    "haga la prueba",
  ];
  for (const p of PROBAR) {
    if (contentLower.includes(p)) fails.push(`V5: pide que pruebe ("${p}")`);
  }

  // 6. Garantiza que un producto se venderá, si el brain lo prohíbe
  const brainProhibeGarantia = /garant/i.test(ctx.brain) && /(no|prohib|nunca)/i.test(ctx.brain);
  if (brainProhibeGarantia) {
    const GARANTIA = [
      "le garantizo que se vende",
      "le garantizo que se va a vender",
      "garantizado que se vende",
      "se lo garantizo, se vende",
      "le aseguro que se vende",
      "le garantizo la venta",
    ];
    for (const g of GARANTIA) {
      if (contentLower.includes(g)) fails.push(`V6: garantiza venta ("${g}")`);
    }
  }

  // 7. Escribe respuestas del cliente
  if (/(^|\n)\s*(cliente|prospecto|el cliente)\s*[:：]/i.test(contentText)) {
    fails.push("V7: el contenido incluye turnos del cliente");
  }

  // 8. Los rank no son consecutivos desde 1
  for (const s of sections) {
    const alts = Array.isArray(s?.alternatives) ? s.alternatives : [];
    if (alts.length === 0) continue;
    const ranks = alts.map((a: any) => Number(a?.rank)).sort((a: number, b: number) => a - b);
    if (!ranks.every((r: number, i: number) => r === i + 1)) {
      fails.push(`V8: ranks no consecutivos en ${s?.section_key} (${ranks.join(",")})`);
    }
  }

  const UNITS =
    /\b\d+\s*(cajas?|piezas?|unidades?|litros?|paquetes?|bultos?|cubetas?|botes?|galones?|pzas?)\b/i;

  // 9. La presentación enumera cantidades del pedido
  const pres = byKey("presentacion");
  if (pres && UNITS.test(String(pres.content ?? ""))) {
    fails.push("V9: la presentación enumera cantidades del pedido");
  }

  // 10. El cierre no trae resumen del pedido
  const cierre = byKey("cierre");
  if (cierre) {
    const cText = String(cierre.content ?? "");
    const tieneResumen =
      UNITS.test(cText) ||
      /(entonces (lleva|le mando|serían|van)|le resumo|resumen del pedido|no se me vaya a olvidar|le agrego|\[?\s*(enumera|cantidad)[^\]]*\]|quedamos con|lo que lleva|en lugar de las de siempre)/i.test(
        cText,
      );
    if (!tieneResumen) fails.push("V10: el cierre no trae resumen del pedido");
  }

  // 11 y 12. rationale_short / rationale_long
  for (const s of sections) {
    const short = String(s?.rationale_short ?? "").trim();
    const long = String(s?.rationale_long ?? "").trim();
    if (!short) fails.push(`V12: falta rationale_short en ${s?.section_key}`);
    else if (words(short) > 25)
      fails.push(`V11: rationale_short de ${words(short)} palabras en ${s?.section_key}`);
    if (!long) fails.push(`V12: falta rationale_long en ${s?.section_key}`);
  }

  return fails;
}

async function logLlmCall(
  admin: any,
  row: { input_tokens: number | null; output_tokens: number | null; latency_ms: number },
) {
  try {
    await admin.from("llm_calls").insert({
      phase: "generate_pitch",
      prompt_version: PITCH_PROMPT_VERSION,
      model: PITCH_MODEL,
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
      latency_ms: row.latency_ms,
    });
  } catch (e) {
    console.error("[generate-pitch] llm_calls insert failed", e);
  }
}

async function callClaude(admin: any, system: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const start = Date.now();
  try {
    // Streaming: la generación completa supera el límite de una respuesta
    // no-streaming de Anthropic para outputs largos.
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: PITCH_MODEL,
        max_tokens: 16000,
        stream: true,
        system,
        messages: [{ role: "user", content: "Genera el pitch ahora. Solo el objeto JSON." }],
      }),
      signal: controller.signal,
    });
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      await logLlmCall(admin, {
        input_tokens: null,
        output_tokens: null,
        latency_ms: Date.now() - start,
      });
      throw new Error(`Claude ${res.status}: ${detail.slice(0, 400)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        let evt: any;
        try {
          evt = JSON.parse(payload);
        } catch {
          continue;
        }
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          text += evt.delta.text ?? "";
        } else if (evt.type === "message_start") {
          inputTokens = evt.message?.usage?.input_tokens ?? null;
        } else if (evt.type === "message_delta") {
          outputTokens = evt.usage?.output_tokens ?? outputTokens;
        }
      }
    }

    await logLlmCall(admin, {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      latency_ms: Date.now() - start,
    });
    return text;
  } finally {
    clearTimeout(t);
  }
}


export type GeneratePitchResult =
  | { ok: true; generated: any; prompt_version: string; dry_run?: boolean }
  | { ok: false; error: string; failed_validations?: string[]; detail?: string };

export type GenerateSectionResult =
  | {
      ok: true;
      step: number;
      section_key: string;
      section: any;
      missing_data: string[];
      prompt_version: string;
      dry_run?: boolean;
    }
  | {
      ok: false;
      step: number;
      section_key?: string;
      error: string;
      failed_validations?: string[];
      detail?: string;
    };

/** Doctrina VIVA acotada: skills completas + tarjetas SOLO del mundo del paso. */
async function loadContext(admin: any, pitch: any, world: number) {
  const [skillsRes, nodesRes, companyRes] = await Promise.all([
    admin
      .from("skills")
      .select("id, code, name, short_description, category, world_id_introduced")
      .eq("status", "active")
      .order("world_id_introduced", { ascending: true }),
    admin.from("nodes").select("id").eq("world_id", world).eq("node_type", "knowledge"),
    admin
      .from("companies")
      .select("name, company_sales_brain")
      .eq("id", pitch.company_id)
      .maybeSingle(),
  ]);

  const nodeIds = ((nodesRes.data ?? []) as any[]).map((n) => String(n.id));
  let cards: any[] = [];
  if (nodeIds.length > 0) {
    const cardsRes = await admin
      .from("node_cards")
      .select("node_id, title, body, card_type, card_order")
      .in("node_id", nodeIds)
      .in("card_type", ["concept", "why_it_works"])
      .order("node_id", { ascending: true })
      .order("card_order", { ascending: true });
    cards = (cardsRes.data ?? []) as any[];
  }

  const skillList = (skillsRes.data ?? []) as any[];
  const validSkillIds = new Set(skillList.map((s) => String(s.id)));
  const skillsBlock = skillList
    .map(
      (s) =>
        `- id: ${s.id} | code: ${s.code} | ${s.name} | ${s.category} | Mundo ${s.world_id_introduced}${
          s.short_description ? ` | ${s.short_description}` : ""
        }`,
    )
    .join("\n");
  const cardsBlock = cards
    .map((c) => `[${c.node_id} · ${c.card_type}] ${c.title ?? ""}\n${c.body ?? ""}`)
    .join("\n\n");
  const brain = JSON.stringify(
    {
      empresa: (companyRes.data as any)?.name,
      brain: (companyRes.data as any)?.company_sales_brain,
    },
    null,
    2,
  );

  return { validSkillIds, skillsBlock, cardsBlock, brain };
}

/** Genera UNA sección. Prompt acotado al mundo del paso + secciones previas. */
export async function runPitchSection(args: {
  pitchId: string;
  step: number;
  companyId?: string | null;
  dryRun?: boolean;
}): Promise<GenerateSectionResult> {
  const spec = PITCH_STEPS_SPEC.find((s) => s.step === args.step);
  if (!spec) return { ok: false, step: args.step, error: "bad_step" };

  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) return { ok: false, step: args.step, error: "missing_api_key" };

  const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");

  const { data: pitch } = await admin
    .from("company_pitches")
    .select("id, company_id, client_type, channel")
    .eq("id", args.pitchId)
    .maybeSingle();
  if (!pitch) return { ok: false, step: args.step, error: "pitch_not_found" };
  if (args.companyId && pitch.company_id !== args.companyId) {
    return { ok: false, step: args.step, error: "forbidden" };
  }

  const { validSkillIds, skillsBlock, cardsBlock, brain } = await loadContext(
    admin,
    pitch,
    spec.world,
  );

  // Contexto de coherencia: solo el content de las secciones ya escritas.
  const { data: prevRows } = await admin
    .from("pitch_sections")
    .select("step, section_key, content")
    .eq("pitch_id", args.pitchId)
    .lt("step", spec.step)
    .order("step", { ascending: true });
  const prev = ((prevRows ?? []) as any[]).filter((r) => r.content);
  const prevBlock =
    prev.length > 0
      ? `═══ SECCIONES YA ESCRITAS DE ESTE MISMO PITCH ═══\nÚsalas para mantener la coherencia: lo que escribas ahora tiene que conectar con esto. No las repitas ni las reescribas.\n\n${prev
          .map((r) => `── ${r.step}. ${r.section_key} ──\n${r.content}`)
          .join("\n\n")}`
      : "";

  const base = buildPitchPrompt({
    skillsBlock,
    cardsBlock,
    brain,
    clientType: String(pitch.client_type),
    channel: String(pitch.channel),
  });

  const scope = `═══ ALCANCE DE ESTA LLAMADA ═══

El pitch se escribe por partes. En esta llamada escribes ÚNICAMENTE el
paso ${spec.step}: ${spec.key} (section_kind "${spec.kind}"). No escribas
los otros pasos.

${prevBlock}

FORMATO DE SALIDA (sustituye al anterior): responde ÚNICAMENTE con este
objeto JSON, sin texto alrededor y sin markdown:

{
  "section": { ...el objeto de sección con la misma forma descrita arriba,
                con "step": ${spec.step}, "section_key": "${spec.key}",
                "section_kind": "${spec.kind}" },
  "missing_data": ["lo que te falta saber para afinar ESTA sección"]
}`;

  const system = `${base}\n\n${scope}`;

  let section: any = null;
  let missing: string[] = [];
  let fails: string[] = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    const prompt =
      attempt === 1
        ? system
        : `${system}\n\n═══ REINTENTO ═══\nEl intento anterior falló estas validaciones. Corrígelas todas:\n${fails
            .map((f) => `- ${f}`)
            .join("\n")}`;
    let raw = "";
    try {
      raw = await callClaude(admin, prompt, apiKey);
    } catch (e) {
      return {
        ok: false,
        step: spec.step,
        section_key: spec.key,
        error: "model_error",
        detail: String((e as Error)?.message ?? e),
      };
    }
    let parsed: any = null;
    try {
      parsed = JSON.parse(stripFence(raw));
    } catch {
      fails = ["V0: la respuesta no es JSON válido"];
      continue;
    }
    section = parsed?.section ?? (Array.isArray(parsed?.sections) ? parsed.sections[0] : null);
    missing = Array.isArray(parsed?.missing_data) ? parsed.missing_data : [];
    if (!section) {
      fails = ["V0: la respuesta no trae la sección"];
      continue;
    }
    section.step = spec.step;
    section.section_key = spec.key;
    fails = validatePitch(
      { sections: [section] },
      { validSkillIds, brain, clientType: String(pitch.client_type), only: spec.key },
    );
    if (fails.length === 0) break;
  }

  if (!section || fails.length > 0) {
    return {
      ok: false,
      step: spec.step,
      section_key: spec.key,
      error: "validation_failed",
      failed_validations: fails,
      ...(section ? { detail: String(section.content ?? "").slice(0, 1200) } : {}),
    };
  }


  if (args.dryRun) {
    return {
      ok: true,
      step: spec.step,
      section_key: spec.key,
      section,
      missing_data: missing,
      prompt_version: PITCH_PROMPT_VERSION,
      dry_run: true,
    };
  }

  // Persistir solo esta sección
  await admin.from("pitch_sections").delete().eq("pitch_id", args.pitchId).eq("step", spec.step);
  const { error: insErr } = await admin.from("pitch_sections").insert([
    {
      pitch_id: args.pitchId,
      step: spec.step,
      section_key: spec.key,
      order_index: spec.step,
      section_kind: spec.kind,
      content: section?.content ?? null,
      rationale_short: section?.rationale_short ?? null,
      rationale_long: section?.rationale_long ?? null,
      warning: section?.warning ?? null,
      skill_ids: Array.isArray(section?.skill_ids) ? section.skill_ids : [],
      alternatives: Array.isArray(section?.alternatives) ? section.alternatives : [],
      edited_by_manager: false,
    },
  ] as any);
  if (insErr) {
    return {
      ok: false,
      step: spec.step,
      section_key: spec.key,
      error: "persist_failed",
      detail: insErr.message,
    };
  }

  // missing_data acumulado (paso 1 reinicia)
  const { data: cur } = await admin
    .from("company_pitches")
    .select("missing_data")
    .eq("id", args.pitchId)
    .maybeSingle();
  const prevMissing =
    spec.step === 1 ? [] : Array.isArray((cur as any)?.missing_data) ? (cur as any).missing_data : [];
  const merged = Array.from(new Set([...prevMissing, ...missing])).slice(0, 24);
  await admin
    .from("company_pitches")
    .update({ missing_data: merged, status: "draft" } as any)
    .eq("id", args.pitchId);

  return {
    ok: true,
    step: spec.step,
    section_key: spec.key,
    section,
    missing_data: merged,
    prompt_version: PITCH_PROMPT_VERSION,
  };
}

/** Las 6 secciones en orden (una llamada por sección). */
export async function runPitchGeneration(args: {
  pitchId: string;
  companyId?: string | null;
  dryRun?: boolean;
}): Promise<GeneratePitchResult> {
  const sections: any[] = [];
  let missing: string[] = [];
  for (const spec of PITCH_STEPS_SPEC) {
    const res = await runPitchSection({
      pitchId: args.pitchId,
      step: spec.step,
      ...(args.companyId !== undefined ? { companyId: args.companyId } : {}),
      ...(args.dryRun !== undefined ? { dryRun: args.dryRun } : {}),
    });
    if (!res.ok) {
      return {
        ok: false,
        error: res.error,
        ...(res.failed_validations
          ? { failed_validations: res.failed_validations.map((f) => `[${spec.key}] ${f}`) }
          : {}),
        ...(res.detail ? { detail: `[${spec.key}] ${res.detail}` } : {}),
      };
    }
    sections.push(res.section);
    missing = res.missing_data;
  }
  return {
    ok: true,
    generated: { sections, missing_data: missing },
    prompt_version: PITCH_PROMPT_VERSION,
    ...(args.dryRun ? { dry_run: true } : {}),
  };
}
