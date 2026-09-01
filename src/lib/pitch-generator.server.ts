// Closer — Generador de Pitch. Lógica server-only.
// Bebe del Cerebro (doctrina.server.ts): documento completo + criterios de
// ejecución de los practice_script. Ya NO inyecta tarjetas sueltas por mundo.

import {
  getCerebro,
  getCriteriosEjecucion,
  type Criterio,
} from "@/lib/doctrina.server";



export const PITCH_PROMPT_VERSION = "pitch-v2.2.0-cerebro-v21-esqueleto";
export const PITCH_MODEL = "claude-sonnet-4-5";
const TIMEOUT_MS = 300_000;

/** V20 — largo máximo del `content` por sección (caracteres). Total objetivo < 4,500. */
export const MAX_CONTENT_CHARS: Record<string, number> = {
  introduccion: 250,
  historia_breve: 250,
  descubrimiento: 1200,
  presentacion: 700,
  cierre: 400,
  consolidacion: 350,
};

/** V21 — alternativas. */
export const MAX_ALTS = 3;
export const MAX_ALT_CHARS = 200;

const LIMIT_LINES = Object.entries(MAX_CONTENT_CHARS)
  .map(([k, v]) => `  · ${k}: máximo ${v} caracteres`)
  .join("\n");


/** Nodos de desarrollo de cuenta: doctrina repartida que ningún mapeo por paso cubre. */
export const RECURRENTE_NODE_IDS = ["3.7", "3.8", "3.9", "4.15", "5.14", "7.3"];

export const PITCH_STEPS_SPEC: Array<{
  step: number;
  key: string;
  kind: "guion" | "municion";
  worlds: number[];
}> = [
  { step: 1, key: "introduccion", kind: "guion", worlds: [1] },
  { step: 2, key: "historia_breve", kind: "guion", worlds: [1, 2] },
  { step: 3, key: "descubrimiento", kind: "municion", worlds: [2, 3] },
  { step: 4, key: "presentacion", kind: "guion", worlds: [3, 4] },
  { step: 5, key: "cierre", kind: "guion", worlds: [4, 5] },
  { step: 6, key: "consolidacion", kind: "guion", worlds: [5, 6] },
];

export function buildPitchPrompt(args: {
  skillsBlock: string;
  cerebroBlock: string;
  criteriosBlock: string;
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

No memorices frases prohibidas: razona con los principios del Cerebro. Si
un principio dice que toda pregunta que permita aprobar o posponer entrega
el control, entonces "¿cómo lo ves?", "¿le parece?" y "¿le late?" están
todas mal aunque ninguna aparezca escrita abajo.

═══ EL CEREBRO DE CLOSER (doctrina completa) ═══
${args.cerebroBlock}

═══ SKILLS ACTIVAS (los únicos skill_ids válidos) ═══
${args.skillsBlock}

${args.criteriosBlock}

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
   · PROHIBIDO EL MARCADOR VACÍO. Nunca escribas "[enumera los productos]",
     "[cantidad]" ni ningún corchete de relleno: el vendedor lee esto en la
     calle y un hueco no se puede decir en voz alta.
   · SI EL BRAIN NO TRAE los productos con sus presentaciones y las
     cantidades típicas, no los inventes: escribe el cierre sin enumerar
     (que fluya como texto decible) y agrega a missing_data exactamente esta
     petición: "¿Cuáles son tus productos con sus presentaciones, y qué
     cantidades típicas maneja un cliente ${args.clientType}? Con eso el
     cierre puede enumerar el pedido en lugar de dejarlo en genérico."


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

═══ ESTE PITCH SE APRENDE, NO SE LEE ═══

El vendedor lo repasa antes de entrar y se lleva el esqueleto en la cabeza.
En campo se explaya con sus palabras — lo que necesita de ti son los pasos
claros y las frases clave, no un documento completo.

Escribe el ESQUELETO, no el desarrollo. Cada sección debe caber en media
pantalla de celular.

· Introducción, historia breve, cierre y consolidación: 2 o 3 frases. Nada más.
· Presentación: la estructura de la propuesta, no el guion palabra por palabra
  de cada producto.
· Descubrimiento: los 3 territorios con 2 o 3 preguntas cada uno, no un
  catálogo. Un banco de 25 preguntas no se usa: se abandona.

Si tienes que elegir entre completo y usable, elige USABLE. Lo que quede
fuera vive en el mapa, y el vendedor lo aprende ahí.

Esto NO es permiso para bajar el estándar: la doctrina se aplica igual, solo
que en menos palabras. Recortas volumen, nunca calidad.

LÍMITES DUROS DEL \`content\` (se validan; si te pasas, la sección se rechaza):
${LIMIT_LINES}

Los rationale_short y rationale_long NO tienen este límite: viven detrás del
desplegable y no estorban la lectura.

═══ SOBRE LAS ALTERNATIVAS ═══

Van RANKEADAS, y cada una explica por qué está en esa posición. Una lista
plana le pide al manager que adivine; una rankeada con su razón le enseña
el criterio.

El \`label\` es contextual — dice CUÁNDO conviene cada una, no solo cuál es
mejor en abstracto: "Recomendada", "Si notas algo nuevo en el lugar", "La
más segura", "Si el cliente es de trato rápido".

Genera alternativas en: introducción, historia breve y cierre. En el
descubrimiento no aplican (todo el banco de preguntas ya es un menú).

LÍMITE DURO: máximo ${MAX_ALTS} alternativas por sección, y cada una máximo
${MAX_ALT_CHARS} caracteres. Una alternativa es una variante de la MISMA frase,
no otro pitch adentro del pitch.


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

/** Parsea la respuesta por bloques delimitados (el texto largo va fuera del JSON). */
export function parseDelimited(
  raw: string,
  spec: { step: number; key: string; kind: "guion" | "municion" },
): { section: any; missing_data: string[] } | null {
  const text = raw.replace(/```[a-z]*\n?/gi, "");
  const grab = (tag: string) => {
    const m = text.match(new RegExp(`---${tag}---\\s*([\\s\\S]*?)\\s*---END-${tag}---`));
    return m ? m[1]! : null;
  };

  const content = grab("CONTENT");
  const metaRaw = grab("META");
  if (!content || !metaRaw) return null;

  let meta: any = {};
  try {
    meta = JSON.parse(metaRaw.trim().replace(/^[^{]*/, "").replace(/[^}]*$/, ""));
  } catch {
    return null;
  }

  const alternatives: any[] = [];
  for (let i = 1; i <= 6; i++) {
    const block = grab(`ALT-${i}`);
    if (!block) break;
    const lines = block.split("\n");
    let label = "";
    let why = "";
    const body: string[] = [];
    for (const line of lines) {
      const l = line.trim();
      if (!label && /^LABEL\s*:/i.test(l)) label = l.replace(/^LABEL\s*:/i, "").trim();
      else if (!why && /^WHY\s*:/i.test(l)) why = l.replace(/^WHY\s*:/i, "").trim();
      else body.push(line);
    }
    alternatives.push({
      rank: i,
      label: label || `Opción ${i}`,
      content: body.join("\n").trim(),
      why_ranked: why,
    });
  }

  return {
    section: {
      step: spec.step,
      section_key: spec.key,
      section_kind: spec.kind,
      content: content.trim(),
      rationale_short: meta.rationale_short ?? null,
      rationale_long: meta.rationale_long ?? null,
      skill_ids: Array.isArray(meta.skill_ids) ? meta.skill_ids : [],
      warning: meta.warning ?? null,
      alternatives,
    },
    missing_data: Array.isArray(meta.missing_data) ? meta.missing_data.map(String) : [],
  };
}



/** PASO 3 — las 12 validaciones. Devuelve la lista de fallos (vacía = pasa). */
export function validatePitch(
  parsed: any,
  ctx: {
    validSkillIds: Set<string>;
    brain: string;
    clientType: string;
    only?: string;
    missingData?: string[];
  },
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

  const isMunicion = (s: any) =>
    String(s?.section_kind ?? "") === "municion" ||
    PITCH_STEPS_SPEC.find((x) => x.key === s?.section_key)?.kind === "municion";

  const textOf = (s: any) =>
    [String(s?.content ?? "")]
      .concat((s?.alternatives ?? []).map((a: any) => String(a?.content ?? "")))
      .join("\n");

  const contentText = sections.map(textOf).join("\n");
  const contentLower = contentText.toLowerCase();
  // V4/V5/V5b/V17 están escritas para GUION literal. En un banco de preguntas
  // diagnósticas ('municion') verbos como "probar" y las plantillas con
  // corchetes son legítimos, así que esas secciones quedan exceptuadas.
  const guionSections = sections.filter((s) => !isMunicion(s));
  const guionText = guionSections.map(textOf).join("\n");
  const guionLower = guionText.toLowerCase();
  const brainLower = ctx.brain.toLowerCase();

  // 4. Términos de industria ajena a la empresa (solo guion)
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
    if (guionLower.includes(term) && !brainLower.includes(term)) {
      fails.push(`V4: término de industria ajena "${term}"`);
    }
  }
  if (ctx.clientType === "autoconsumo") {
    if (/(qué|que)\s+(vende|se le mueve|le compran|revende)/i.test(guionText)) {
      fails.push("V4: en autoconsumo se pregunta qué vende");
    }
  }

  // 5. "para que lo pruebe" o cualquier variante de pedirle al cliente que pruebe (solo guion)
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
    if (guionLower.includes(p)) fails.push(`V5: pide que pruebe ("${p}")`);
  }
  // 5b. Variantes conjugadas: "pruebas cómo responde", "para probar con esa",
  //     "ya tienes para probar". El cliente no prueba: compra lo que le falta.
  const PROBAR_RX =
    /\b(prueb(?:a|as|e|es|en|o)|pru[eé]b\w*|probar(?:lo|la|los|las)?)\b/gi;
  const probMatches = Array.from(new Set((guionText.match(PROBAR_RX) ?? []).map((m) => m.toLowerCase())));
  for (const m of probMatches) {
    if (PROBAR.some((p) => guionLower.includes(p))) break;
    fails.push(
      `V5b: le pide al cliente que pruebe ("${m}"); el pedido se cierra sobre lo que le falta, no sobre una prueba`,
    );
  }

  // 14. Territorio PRECIO (Nivel 2, regla 14) — aplica a TODAS las secciones,
  //     munición incluida: nunca se le pide opinión al cliente sobre el precio.
  const PRECIO_OPINION = [
    /(c[óo]mo|qu[ée])\s+(ve|ves|le parece|te parece|opina|opinas)[^.?!]{0,40}\bprecio/i,
    /\bprecio[^.?!]{0,40}(c[óo]mo lo ve|qu[ée] opina|le parece|te parece)/i,
    /(muy|est[áa])\s+(caro|arriba)\b/i,
    /(algo|qu[ée])[^.?!]{0,30}(sient(?:a|as|e|es))[^.?!]{0,30}(caro|arriba|precio)/i,
    /(c[óo]mo|qu[ée])\s+(ve|ves|le parece|te parece|opina|opinas)[^.?!]{0,40}\b(los precios|el costo)/i,
  ];
  for (const s of sections) {
    const t = textOf(s);
    for (const rx of PRECIO_OPINION) {
      const m = t.match(rx);
      if (m) {
        fails.push(
          `V14: pide opinión sobre el precio en ${s?.section_key} ("${m[0]}"); el precio se afirma con hechos, nunca se somete a opinión del cliente`,
        );
        break;
      }
    }
  }


  // 5c. Pregunta de aprobación o alternativa que permite posponer (solo guion).
  const APROBACION = [
    "cómo lo ves",
    "como lo ves",
    "cómo ves si",
    "como ves si",
    "le parece",
    "te parece",
    "le entramos",
    "le late",
    "le gustaría",
    "qué opina",
    "que opina",
    "está de acuerdo",
    "le interesa",
    "qué dice",
    "que dice",
  ];
  const POSPONER = [
    "o mejor lo dejamos",
    "prefiere esperar",
    "prefieres esperar",
    "lo dejamos para",
    "dejarlo para",
    "prefiere que lo metamos en la siguiente",
    "prefieres que lo metamos en la siguiente",
    "prefiere que lo metamos en la próxima",
    "prefieres que lo metamos en la próxima",
    "o lo vemos después",
    "o lo vemos despues",
    "con más calma",
    "con mas calma",
    "lo piensa",
    "lo piensas",
  ];
  // V19 aplica a TODAS las secciones (munición incluida: un banco de preguntas
  // nunca pide aprobación ni opinión). V18 (posponer) es de guion literal.
  for (const s of sections) {
    const t = textOf(s).toLowerCase();
    for (const p of APROBACION) {
      if (t.includes(p))
        fails.push(
          `V19: pregunta de aprobación en ${s?.section_key} ("${p}"); el cierre asume y dirige, no pide permiso`,
        );
    }
    if (isMunicion(s)) continue;
    for (const p of POSPONER) {
      if (t.includes(p))
        fails.push(
          `V18: ofrece posponer en ${s?.section_key} ("${p}"); nunca le des al cliente la opción de dejarlo para después`,
        );
    }
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

  // 10. El cierre no trae resumen del pedido (qué y cuánto, concreto).
  //     Si el brain no tiene productos/presentaciones/cantidades, el generador
  //     debe escribirlo genérico Y declararlo en missing_data. Nunca marcadores.
  const cierre = byKey("cierre");
  if (cierre) {
    const cText = String(cierre.content ?? "");
    if (/\[[^\]\n]{0,120}\]/.test(cText)) {
      fails.push("V10: el cierre usa un marcador vacío en lugar de enumerar el pedido");
    } else if (!UNITS.test(cText)) {
      const declarado = (ctx.missingData ?? []).some((m) =>
        /(producto|presentaci|cantidad)/i.test(String(m)),
      );
      if (!declarado) {
        fails.push(
          "V10: el cierre no enumera el pedido (qué y cuánto) y tampoco declara en missing_data que faltan los productos, presentaciones y cantidades típicas",
        );
      }
    }
  }


  // 17. Ningún corchete de relleno en las secciones de GUION (content ni alternatives).
  //     Las secciones 'municion' quedan exceptuadas: un banco de preguntas puede
  //     usar plantillas. Escape igual que V10: sin el marcador + missing_data.
  const BRACKET = /\[[^\]\n]{0,120}\]/;
  for (const s of guionSections) {
    const key = String(s?.section_key ?? "");

    const cText = String(s?.content ?? "");
    if (BRACKET.test(cText)) {
      const m = cText.match(BRACKET)?.[0] ?? "";
      fails.push(
        `V17: corchete de relleno en el contenido de ${key} ("${m}"); escríbelo sin el marcador y declara el dato faltante en missing_data`,
      );
    }
    const alts = Array.isArray(s?.alternatives) ? s.alternatives : [];
    for (const a of alts) {
      const aText = String(a?.content ?? "");
      if (BRACKET.test(aText)) {
        const m = aText.match(BRACKET)?.[0] ?? "";
        fails.push(
          `V17: corchete de relleno en la alternativa #${a?.rank} de ${key} ("${m}"); escríbela sin el marcador y declara el dato faltante en missing_data`,
        );
      }
    }
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
  row: {
    input_tokens: number | null;
    output_tokens: number | null;
    cached_tokens?: number | null;
    cache_creation_tokens?: number | null;
    latency_ms: number;
    company_id?: string | null;
  },
) {
  try {
    await admin.from("llm_calls").insert({
      phase: "generate_pitch",
      prompt_version: PITCH_PROMPT_VERSION,
      model: PITCH_MODEL,
      input_tokens: row.input_tokens,
      output_tokens: row.output_tokens,
      cached_tokens: row.cached_tokens ?? null,
      cache_creation_tokens: row.cache_creation_tokens ?? null,
      latency_ms: row.latency_ms,
      company_id: row.company_id ?? null,
    });
  } catch (e) {
    console.error("[generate-pitch] llm_calls insert failed", e);
  }
}

// Bloque de prompt. Lo FIJO entre las secciones de un mismo pitch (Cerebro,
// company_brain, skills) va primero y con cache_control; lo variable después.
export type PitchPromptBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral"; ttl?: string };
};

async function callClaude(
  admin: any,
  system: string | PitchPromptBlock[],
  apiKey: string,
  companyId?: string | null,
): Promise<string> {
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
        // TTL extendido: una sección tarda 2-3 min, más que los 5 min por
        // defecto entre la 1ª y la 6ª sección del mismo pitch.
        "anthropic-beta": "extended-cache-ttl-2025-04-11",
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
        company_id: companyId ?? null,
      });
      throw new Error(`Claude ${res.status}: ${detail.slice(0, 400)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let text = "";
    let inputTokens: number | null = null;
    let outputTokens: number | null = null;
    let cachedTokens: number | null = null;
    let cacheCreationTokens: number | null = null;
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
          cachedTokens = evt.message?.usage?.cache_read_input_tokens ?? null;
          cacheCreationTokens = evt.message?.usage?.cache_creation_input_tokens ?? null;
        } else if (evt.type === "message_delta") {
          outputTokens = evt.usage?.output_tokens ?? outputTokens;
        }
      }
    }

    console.log("[generate-pitch] usage", { inputTokens, cachedTokens, cacheCreationTokens, outputTokens });
    await logLlmCall(admin, {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cached_tokens: cachedTokens,
      cache_creation_tokens: cacheCreationTokens,
      latency_ms: Date.now() - start,
      company_id: companyId ?? null,
    });
    return text;
  } finally {
    clearTimeout(t);
  }
}


export type GeneratePitchResult =
  | { ok: true; generated: any; prompt_version: string; dry_run?: boolean }
  | { ok: false; error: string; failed_validations?: string[]; detail?: string };

export type PitchAttemptLog = { attempt: number; ms: number; fails: string[] };

export type GenerateSectionResult =
  | {
      ok: true;
      step: number;
      section_key: string;
      section: any;
      missing_data: string[];
      prompt_version: string;
      dry_run?: boolean;
      attempts?: PitchAttemptLog[];
    }
  | {
      ok: false;
      step: number;
      section_key?: string;
      error: string;
      failed_validations?: string[];
      detail?: string;
      attempts?: PitchAttemptLog[];
    };


/** Formatea los criterios de ejecución tal como los ve el modelo. */
export function buildCriteriosBlock(criterios: Criterio[]): string {
  const seen = new Set<string>();
  const esperados: string[] = [];
  const fallas: string[] = [];
  for (const c of criterios) {
    const k = `${c.tipo}|${c.skill_id}|${c.description}`;
    if (seen.has(k)) continue;
    seen.add(k);
    if (c.tipo === "success") esperados.push(`- ${c.skill_id}: ${c.description}`);
    else fallas.push(`- [${(c.severity ?? "normal").toUpperCase()}] ${c.skill_id}: ${c.description}`);
  }
  return `═══ CRITERIOS DE EJECUCIÓN ═══
Así evalúa Closer a un vendedor en este paso. El pitch que escribas
tiene que poder pasar esta misma evaluación.

SE ESPERA:
${esperados.join("\n") || "- (sin criterios de éxito registrados para este alcance)"}

SE MARCA COMO FALLA:
${fallas.join("\n") || "- (sin criterios de falla registrados para este alcance)"}

Los CRITICAL son inviolables.`;
}

/** Doctrina VIVA: Cerebro completo + criterios de ejecución del alcance de la sección. */
async function loadContext(
  admin: any,
  pitch: any,
  spec: { key: string; worlds: number[] },
) {
  const extraNodes =
    String(pitch.client_type) === "recurrente" ? RECURRENTE_NODE_IDS : [];

  const [skillsRes, companyRes, cerebroBlock, criteriosWorlds, criteriosNodes] =
    await Promise.all([
      admin
        .from("skills")
        .select("id, code, name, short_description, category, world_id_introduced")
        .eq("status", "active")
        .order("world_id_introduced", { ascending: true }),
      admin
        .from("companies")
        .select("name, company_sales_brain")
        .eq("id", pitch.company_id)
        .maybeSingle(),
      getCerebro(),
      getCriteriosEjecucion({ worlds: spec.worlds }),
      extraNodes.length ? getCriteriosEjecucion({ nodeIds: extraNodes }) : Promise.resolve([]),
    ]);

  const criterios = [...criteriosWorlds, ...criteriosNodes];

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
  const brain = JSON.stringify(
    {
      empresa: (companyRes.data as any)?.name,
      brain: (companyRes.data as any)?.company_sales_brain,
    },
    null,
    2,
  );

  return {
    validSkillIds,
    skillsBlock,
    cerebroBlock,
    criterios,
    criteriosBlock: buildCriteriosBlock(criterios),
    brain,
  };
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

  const { validSkillIds, skillsBlock, cerebroBlock, criteriosBlock, brain } =
    await loadContext(admin, pitch, spec);


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

  // El bloque base (Cerebro + skills + empresa + reglas duras) es IDÉNTICO en
  // las 6 secciones del mismo pitch → se cachea. Los criterios de ejecución
  // cambian por sección, así que salen del base y viajan en el bloque variable.
  const base = buildPitchPrompt({
    skillsBlock,
    cerebroBlock,
    criteriosBlock: "",
    brain,
    clientType: String(pitch.client_type),
    channel: String(pitch.channel),
  });


  const scope = `═══ ALCANCE DE ESTA LLAMADA ═══

El pitch se escribe por partes. En esta llamada escribes ÚNICAMENTE el
paso ${spec.step}: ${spec.key} (section_kind "${spec.kind}"). No escribas
los otros pasos.

${prevBlock}

═══ REGLA ABSOLUTA: NI APROBACIÓN NI PRUEBA NI POSPONER ═══

En las secciones de guion (introducción, historia, presentación, cierre y
consolidación):

· PROHIBIDO pedir aprobación: "¿cómo lo ves?", "¿le parece?", "¿le
  entramos?", "¿le late?", "¿qué opina?", "¿le gustaría?", "¿le interesa?"
  y cualquier variante que permita al cliente aprobar o rechazar. Se asume
  y se dirige: "Se lo mando junto en la entrega del jueves."
· PROHIBIDO ofrecer posponer, aunque sea como segunda opción de una
  alternativa: "o mejor lo dejamos para la próxima", "prefieres esperar",
  "lo piensas con calma". Si hay dos opciones, las dos avanzan (jueves o
  viernes; con o sin la línea nueva) — nunca una que sea no comprar.
· PROHIBIDO pedirle al cliente que pruebe: "para que lo pruebe", "pruebas
  cómo responde", "ya tienes para probar". Nada de "probar", "prueba" ni
  sus conjugaciones. El pedido se cierra sobre lo que le falta y se vende,
  no sobre un experimento.

═══ REGLA ABSOLUTA: CERO CORCHETES DE RELLENO ═══

En el contenido y en TODAS las alternativas está TERMINANTEMENTE PROHIBIDO
cualquier corchete de relleno donde debería ir un dato concreto de la
empresa: "[producto]", "[cantidad]", "[marca]", "[nombre]", "[línea]",
"[X]", "[Y]", "[Z]" y similares. El vendedor lee el pitch en voz alta tal
como está escrito; un hueco no se puede decir.

Solo hay dos caminos:
A) Si LA EMPRESA (arriba) trae el dato: escríbelo real y concreto.
B) Si NO lo trae: escribe la frase SIN el marcador, de forma que funcione
   en genérico y sea decible, y declara el dato faltante en missing_data.

   ✗ "Vi que trae [producto/exhibidor/línea nueva] nuevo"
   ✓ "Vi que tiene cosas nuevas por acá"
     + missing_data: "¿Qué productos o exhibidores suelen tener los
       clientes de este tipo? Con eso la observación de apertura puede ser
       específica en lugar de genérica."

Nunca un corchete vacío: o el dato real, o una frase que funcione sin él.

${
  spec.key === "cierre"
    ? `═══ EL RESUMEN DEL PEDIDO EN ESTE CIERRE ═══

Está TERMINANTEMENTE PROHIBIDO cualquier corchete de relleno: nada de
"[cantidad]", "[producto]", "[presentación]", "[enumera ...]". El vendedor
lee esto en voz alta frente al cliente; un hueco no se puede decir.

Tienes dos caminos, y solo dos:

A) Si LA EMPRESA (arriba) trae productos concretos con presentaciones y
   cantidades típicas: enumera de verdad, con números y unidades reales
   ("tres cubetas de 19 litros del 25W-50 y dos cajas de 24 del 20W-50").

B) Si NO los trae: escribe el resumen en genérico pero DECIBLE, sin
   corchetes y sin inventar productos. Por ejemplo:
   "Entonces le confirmo: lo de siempre igual, más lo que acabamos de ver
   que le hace falta. Se lo mando junto en la misma entrega."
   Y en missing_data incluye EXACTAMENTE esta petición:
   "¿Cuáles son tus productos con sus presentaciones, y qué cantidades
   típicas maneja un cliente ${String(pitch.client_type)}? Con eso el cierre
   puede enumerar el pedido en lugar de dejarlo en genérico."
`
    : ""
}


FORMATO DE SALIDA (sustituye por completo al anterior): responde con
bloques delimitados, NO con un solo JSON. El texto largo va FUERA del JSON.

---CONTENT---
el texto de la sección, en texto plano, con saltos de línea normales,
comillas normales, sin escapes y sin markdown
---END-CONTENT---
---ALT-1---
LABEL: nombre contextual de la alternativa (cuándo conviene)
WHY: por qué va en esta posición
el texto de la alternativa, en texto plano
---END-ALT-1---
---META---
{ "rationale_short": "UNA frase de 25 palabras o menos — cuéntalas antes de escribirla",
  "rationale_long": "el desarrollo completo",
  "skill_ids": ["..."],
  "warning": null,
  "missing_data": ["lo que te falta saber para afinar ESTA sección"] }
---END-META---

Reglas del formato:
· El JSON de META es corto: nunca metas ahí el texto del pitch.
· Las alternativas van en bloques ---ALT-n---, numerados desde 1 y
  consecutivos. Genera alternativas solo en introducción, historia breve y
  cierre; en las demás secciones omite los bloques ALT.
· Nada de texto fuera de los bloques.`;


  // Bloque fijo (cacheado, TTL 1h) primero; variable después.
  const cachedBase: PitchPromptBlock = {
    type: "text",
    text: base,
    cache_control: { type: "ephemeral", ttl: "1h" },
  };
  const variable = `${criteriosBlock}\n\n${scope}`;

  let section: any = null;
  let missing: string[] = [];
  let fails: string[] = [];
  const attemptLog: Array<{ attempt: number; ms: number; fails: string[] }> = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const tail =
      attempt === 1
        ? variable
        : `${variable}\n\n═══ REINTENTO ═══\nEl intento anterior falló estas validaciones. Corrígelas todas SIN romper ninguna otra regla:\n${fails
            .map((f) => `- ${f}`)
            .join("\n")}\n\nRECORDATORIO INVIOLABLE al corregir: CERO corchetes de relleno en el contenido y en las alternativas ("[producto]", "[marca]", "[otra marca]", "[otro proveedor]", "[número]", "[precio]", "[X]"...). Si no tienes el dato, escribe la frase de forma genérica pero decible y declara el faltante en missing_data. Y rationale_short: 25 palabras o menos, cuéntalas.`;
    const prompt: PitchPromptBlock[] = [cachedBase, { type: "text", text: tail }];
    let raw = "";
    const t0 = Date.now();
    try {
      raw = await callClaude(admin, prompt, apiKey, pitch.company_id ?? null);
    } catch (e) {
      return {
        ok: false,
        step: spec.step,
        section_key: spec.key,
        error: "model_error",
        detail: String((e as Error)?.message ?? e),
        ...(attemptLog.length ? { attempts: attemptLog } : {}),
      } as any;
    }
    const parsed = parseDelimited(raw, spec);
    if (!parsed) {
      fails = ["V0: la respuesta no trae los bloques ---CONTENT--- / ---META---"];
      attemptLog.push({ attempt, ms: Date.now() - t0, fails });
      continue;
    }
    section = parsed.section;
    missing = parsed.missing_data;
    fails = validatePitch(
      { sections: [section] },
      {
        validSkillIds,
        brain,
        clientType: String(pitch.client_type),
        only: spec.key,
        missingData: missing,
      },
    );
    attemptLog.push({ attempt, ms: Date.now() - t0, fails });
    if (fails.length === 0) break;
  }



  if (!section || fails.length > 0) {
    return {
      ok: false,
      step: spec.step,
      section_key: spec.key,
      error: "validation_failed",
      failed_validations: fails,
      attempts: attemptLog,
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
      attempts: attemptLog,
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
    attempts: attemptLog,
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
