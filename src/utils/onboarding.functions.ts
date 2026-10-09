/**
 * Server functions del onboarding del manager (oct-2026).
 *
 * 1. proponerDelCampo: con lo que ya contestó el manager, Closer propone las
 *    objeciones típicas de su giro y las reglas operativas de una empresa como
 *    la suya. El manager palomea, corrige y agrega. Si falla, la pantalla usa
 *    una lista de respaldo: el onboarding nunca se bloquea.
 * 2. generateCompanyBrain: arma el cerebro de la empresa y su radiografía. Los
 *    datos comerciales (líneas, lo que ofrece, condiciones, objeciones, reglas)
 *    NO pasan por el modelo: llegan ya armados desde las respuestas
 *    (cerebroDirecto), así nada se reescribe ni se inventa. El modelo solo
 *    redacta el cliente típico, el tono y la radiografía.
 * 3. ajustarRadiografia: el manager corrige o agrega algo con sus palabras.
 *
 * Modelo: claude-sonnet-4-5 (Anthropic directo, como el resto de Closer).
 */
import { createServerFn } from "@tanstack/react-start";
import {
  CLAVES_CEREBRO as BRAIN_KEYS,
  SECCIONES_RADIOGRAFIA,
  aplicarAjuste,
  type SeccionRadiografia,
} from "@/lib/onboarding-questions";

const MODEL = "claude-sonnet-4-5";
const PROMPT_VERSION = "onboarding-company-v3";

type Linea = { pregunta: string; respuesta: string };

interface PropuestaPayload {
  respuestas: Linea[];
  companyName: string;
  companyId?: string | null;
}
interface BrainPayload {
  respuestas: Linea[];
  directo: Record<string, string>;
  companyName: string;
  companyId?: string | null;
}

const enTexto = (rs: Linea[]) =>
  rs
    .filter((r) => (r.respuesta ?? "").trim())
    .map((r) => `P: ${r.pregunta}\nR: ${r.respuesta}`)
    .join("\n\n");

async function llamarClaude(
  system: string,
  user: string,
  maxTokens: number,
  phase: string,
  companyId?: string | null,
) {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");
  const started = Date.now();
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.3,
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [
        { role: "user", content: user },
        { role: "assistant", content: "{" },
      ],
    }),
  });
  if (res.status === 429) throw new Error("rate_limit");
  if (res.status === 402) throw new Error("payment_required");
  if (!res.ok) {
    console.error("[onboarding] Anthropic", res.status, (await res.text()).slice(0, 300));
    throw new Error("ai_error");
  }
  const json = await res.json();
  const { logAnthropicCall } = await import("@/lib/llm-usage.server");
  await logAnthropicCall({
    phase,
    model: MODEL,
    promptVersion: PROMPT_VERSION,
    usage: json?.usage ?? null,
    latencyMs: Date.now() - started,
    companyId: companyId ?? null,
  });
  const text: string = json?.content?.[0]?.text ?? "";
  try {
    return JSON.parse(`{${text}`) as Record<string, unknown>;
  } catch {
    const m = `{${text}`.match(/\{[\s\S]*\}/);
    try {
      return m ? (JSON.parse(m[0]) as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
}

const listaDeTextos = (v: unknown, max: number): string[] =>
  Array.isArray(v)
    ? [
        ...new Set(
          v
            .map((x) => (typeof x === "string" ? x.replace(/\s+/g, " ").trim() : ""))
            .filter((x) => x.length > 2 && x.length <= 120),
        ),
      ].slice(0, max)
    : [];

const PROMPT_PROPUESTA = `Eres el sistema de Closer, una app de entrenamiento de ventas de campo B2B en Latinoamérica.
Un manager acaba de describir su empresa. Propón dos listas que él va a confirmar o corregir.

1. "negativos": las 6 cosas que los clientes de ESTE giro le dicen más seguido a un vendedor para no comprarle o para posponer. Con las palabras textuales de un cliente mexicano de ese giro, entre comillas no. Cortas (máximo 8 palabras), como se dicen en la calle. Mezcla las universales ("ya tengo proveedor") con las propias del giro. Sin explicar nada.
2. "restricciones": 4 o 5 reglas operativas que una empresa como esta suele imponer a sus vendedores, redactadas como lo que NO se debe hacer, empezando con verbo en infinitivo (ej. "Prometer fechas de entrega sin confirmarlas"). Solo reglas de operación de la empresa. NO incluyas lo que ya es ética universal (mentir, hablar mal de la competencia, garantizar resultados): eso Closer ya lo aplica siempre.

REGLAS: no inventes datos comerciales de la empresa (precios, marcas, plazos, nombres de competidores). Si mencionas una línea, que sea una de las que escribió el manager.

Responde SOLO con JSON: {"negativos": ["..."], "restricciones": ["..."]}`;

export const proponerDelCampo = createServerFn({ method: "POST" })
  .inputValidator((data: PropuestaPayload) => {
    if (!data || !Array.isArray(data.respuestas)) throw new Error("Missing answers");
    return data;
  })
  .handler(async ({ data }) => {
    const raw = await llamarClaude(
      PROMPT_PROPUESTA,
      `Empresa: ${data.companyName}\n\n${enTexto(data.respuestas)}`,
      800,
      "onboarding_propuesta",
      data.companyId,
    );
    return {
      negativos: listaDeTextos(raw.negativos, 8),
      restricciones: listaDeTextos(raw.restricciones, 6),
    };
  });

// La radiografía: ver SECCIONES_RADIOGRAFIA en onboarding-questions.ts.

const FORMATO_RADIOGRAFIA = `"RADIOGRAFIA": {
    "empresa": "qué vende la empresa (sus líneas) y si son productos o servicios",
    "clientes": "a qué giros les vende, qué hacen esos clientes con lo que compran y de qué tamaño son",
    "equipo": "su cartera (clientes que ya compran o nuevos), cada cuánto visitan, por qué canal y con qué trato",
    "oferta": "lo que ofrece en producto, servicio y precio, y cómo maneja descuentos y cobro",
    "calle": "algunas de las cosas que sus vendedores escuchan hoy (presentadas como ejemplos, no como lista cerrada), a quién le compran hoy sus clientes y lo que su equipo nunca debe hacer",
    "cliente_tipico": "2 o 3 frases sobre LOS CLIENTES (en plural) con los que van a practicar: nombra las combinaciones que aplican a esta empresa según sus respuestas —clientes que ya le compran y clientes nuevos, los que revenden, los que lo consumen en su operación o los que distribuyen, chicos y grandes— y qué cambia en la visita con cada uno. Deja claro que su mercado tiene muchos perfiles distintos, no uno solo, y que Closer los entrena todos con el mismo sistema"
  }`;

const REGLAS_RADIOGRAFIA = `LA RADIOGRAFÍA: Closer le habla al manager, de tú, con seguridad y en pocas palabras, como quien acaba de entender su negocio. Cada sección: 1 a 3 frases. Empieza la de "empresa" con el nombre de la empresa (ej. "DALFAN vende..."). SOLO repite lo que está en las respuestas, con las palabras del manager: no agregues ni un dato, no lo adornes, no opines si algo es bueno o malo, no prometas resultados. Si una sección no tiene datos, escribe una frase corta diciendo que no lo especificó.`;

const PROMPT_CEREBRO = `Eres el sistema de Closer, una app de entrenamiento de ventas de campo B2B en Latinoamérica.
Con las respuestas del onboarding de un manager, devuelves un JSON con EXACTAMENTE estas claves:

{
  "CLIENTE_TIPICO": "los distintos perfiles de cliente de esta empresa, uno por línea: giro, tamaño, si ya le compra o es nuevo, qué hace con lo que compra, cómo habla y qué le importa. Tantos perfiles como combinaciones reales salgan de las respuestas; nunca uno solo si el manager marcó varios giros, usos o tamaños.",
  "TONO_DETECTADO": "string corto, ej. 'De usted — trato cordial de confianza'",
  ${FORMATO_RADIOGRAFIA}
}

${REGLAS_RADIOGRAFIA}

REGLAS DURAS:
1. NO INVENTES HECHOS COMERCIALES de la empresa: precios, marcas, promociones, plazos o competidores que el manager no escribió.
2. Conserva el lenguaje del territorio: si el manager escribió "cubeta", no escribas "contenedor de 19 litros".

Devuelve SOLO el objeto JSON. Sin markdown. Sin texto adicional.`;

function radiografiaDe(raw: Record<string, unknown>): SeccionRadiografia[] {
  const r = (raw["RADIOGRAFIA"] ?? {}) as Record<string, unknown>;
  return SECCIONES_RADIOGRAFIA.map((s) => ({
    titulo: s.titulo,
    texto: typeof r[s.id] === "string" ? (r[s.id] as string).trim() : "",
  })).filter((s) => s.texto);
}

export const generateCompanyBrain = createServerFn({ method: "POST" })
  .inputValidator((data: BrainPayload) => {
    if (!data || !Array.isArray(data.respuestas) || !data.directo)
      throw new Error("Missing answers");
    return data;
  })
  .handler(async ({ data }) => {
    const raw = await llamarClaude(
      PROMPT_CEREBRO,
      `Empresa: ${data.companyName}\n\n${enTexto(data.respuestas)}`,
      2000,
      "onboarding_company",
      data.companyId,
    );
    const texto = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string).trim() : "");

    // Cerebro persistible: solo llaves canónicas. Lo comercial viene directo
    // de las respuestas; el modelo solo aporta el cliente típico y el tono.
    const brain: Record<string, string> = {};
    for (const k of BRAIN_KEYS)
      brain[k] = typeof data.directo[k] === "string" ? data.directo[k] : "";
    brain["CLIENTE_TIPICO"] = texto("CLIENTE_TIPICO");
    brain["TONO_DETECTADO"] = texto("TONO_DETECTADO") || "Profesional";

    return { brain, radiografia: radiografiaDe(raw) };
  });

// El manager corrige o agrega algo a su radiografía. Aquí el modelo SÍ toca
// datos comerciales, pero solo los que el manager corrigió con sus palabras:
// él es la fuente. Cada ajuste queda también, tal cual, en AJUSTES_DEL_MANAGER,
// que el cliente de práctica y el evaluador leen con el resto del cerebro.
const PROMPT_AJUSTE = `Eres el sistema de Closer. Un manager revisó la radiografía de su empresa y te dice qué corregir o agregar.

Recibes el cerebro actual de la empresa (JSON) y el ajuste del manager. Devuelves un JSON con:
{
  "CAMBIOS": { "LLAVE": "nuevo valor completo de esa llave" },
  ${FORMATO_RADIOGRAFIA}
}

En "CAMBIOS" van SOLO las llaves del cerebro que el ajuste modifica, con su valor completo ya corregido (no solo la parte nueva). Aplica el ajuste con fidelidad y con las palabras del manager. No cambies nada que el ajuste no toque. No agregues ningún dato que no esté en el cerebro o en el ajuste. Si el ajuste no corresponde a ninguna llave, deja "CAMBIOS" vacío.

La radiografía se vuelve a escribir completa, ya con el ajuste.
${REGLAS_RADIOGRAFIA}

Devuelve SOLO el objeto JSON. Sin markdown. Sin texto adicional.`;

interface AjustePayload {
  brain: Record<string, string>;
  ajuste: string;
  companyName: string;
  companyId?: string | null;
}

export const ajustarRadiografia = createServerFn({ method: "POST" })
  .inputValidator((data: AjustePayload) => {
    if (!data || !data.brain || typeof data.ajuste !== "string" || !data.ajuste.trim())
      throw new Error("Missing adjustment");
    return data;
  })
  .handler(async ({ data }) => {
    const raw = await llamarClaude(
      PROMPT_AJUSTE,
      `Empresa: ${data.companyName}\n\nCEREBRO ACTUAL:\n${JSON.stringify(data.brain, null, 2)}\n\nAJUSTE DEL MANAGER:\n${data.ajuste.trim()}`,
      2500,
      "onboarding_ajuste",
      data.companyId,
    );
    const cambios = (raw["CAMBIOS"] ?? {}) as Record<string, unknown>;
    const brain = aplicarAjuste(data.brain, cambios, data.ajuste);
    return { brain, radiografia: radiografiaDe(raw) };
  });
