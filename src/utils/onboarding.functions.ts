/**
 * Server function: genera el Company Sales Brain + una respuesta de preview.
 *
 * Modelo: claude-sonnet-4-5 (Anthropic directo, igual que el Actor, el
 * Evaluador, el Director y el generador de pitch). El onboarding es la ENTRADA
 * de todo el sistema: un brain corto contamina entrenamiento, pitches y coach.
 * Cuesta centavos por empresa y se corre una vez — no es lugar para ahorrar.
 *
 * IMPORTANTE: el brain persistible SOLO contiene las llaves canónicas
 * (BRAIN_KEYS). La respuesta de preview del cliente típico se devuelve como
 * `__preview_response` y NUNCA debe escribirse dentro de
 * companies.company_sales_brain.
 */
import { createServerFn } from "@tanstack/react-start";

type AnswerInput = { question: string; answer: string };

interface BrainPayload {
  answers: AnswerInput[];
  companyName: string;
  openerLine: string;
  companyId?: string | null;
}

const MODEL = "claude-sonnet-4-5";
const PROMPT_VERSION = "onboarding-company-v2-sonnet";

const BRAIN_KEYS = [
  // Núcleo original
  "PRODUCTOS_ACTIVOS",
  "CLIENTE_TIPICO",
  "ARGUMENTOS_DE_VALOR",
  "OBJECIONES_REALES",
  "CONTEXTO_DE_VENTA",
  "RESTRICCIONES",
  "TONO_DETECTADO",
  // Catálogo con números (bloque 4)
  "PRESENTACIONES_Y_PRECIOS",
  "CANTIDADES_TIPICAS",
  "PROMOCIONES_Y_CONDICIONES",
  "PRODUCTOS_QUE_SE_COMPRAN_JUNTOS",
  // Cartera y territorio (bloque 5)
  "TIPOS_DE_CLIENTE_QUE_ATIENDE",
  "FRECUENCIA_DE_VISITA",
  "FAMILIAS_QUE_SE_PIERDEN_CON_LA_COMPETENCIA",
  "PERFILES_DE_CLIENTE_Y_QUE_MUEVE_CADA_UNO",
  // Campo (bloque 6)
  "NEGATIVOS_COMUNES_DEL_TERRITORIO",
  "COMPETENCIA_DIRECTA",
] as const;

const SYSTEM_PROMPT = `Eres el sistema de inteligencia comercial de Closer.

Con base en las respuestas del onboarding del manager, devuelves un objeto JSON con EXACTAMENTE estas claves:

{
  "PRODUCTOS_ACTIVOS": "string corto, lista de productos/marcas",
  "CLIENTE_TIPICO": "string, perfil del cliente, cómo piensa, qué le importa",
  "ARGUMENTOS_DE_VALOR": "string con 3-5 argumentos separados por punto y coma",
  "OBJECIONES_REALES": "string con 3-5 objeciones probables separadas por punto y coma",
  "CONTEXTO_DE_VENTA": "string, escenario típico (tipo de interacción, duración, ambiente)",
  "RESTRICCIONES": "string, lo que nunca debe decir/hacer el equipo",
  "TONO_DETECTADO": "string corto (Ej: 'Informal — trato de confianza')",
  "PRESENTACIONES_Y_PRECIOS": "string, SKU/producto + presentación + precio de lista, uno por línea. COPIA los datos tal como los dio el manager: cifras exactas, sin redondear, sin inventar SKUs ni precios que no estén en sus respuestas",
  "CANTIDADES_TIPICAS": "string, qué y cuánto pide un cliente promedio por visita, por familia de producto",
  "PROMOCIONES_Y_CONDICIONES": "string, promociones vigentes, condiciones de crédito y mínimos de pedido. Solo lo declarado",
  "PRODUCTOS_QUE_SE_COMPRAN_JUNTOS": "string, familias que suelen ir en el mismo pedido, en pares o tríos concretos",
  "TIPOS_DE_CLIENTE_QUE_ATIENDE": "string, tipos de cliente + proporción aproximada declarada",
  "FRECUENCIA_DE_VISITA": "string corto, cada cuánto pasa el vendedor por el mismo cliente",
  "FAMILIAS_QUE_SE_PIERDEN_CON_LA_COMPETENCIA": "string, familias que el cliente compra a otro proveedor y por qué",
  "PERFILES_DE_CLIENTE_Y_QUE_MUEVE_CADA_UNO": "string, por perfil: qué compra y qué le importa. Formato 'Perfil: qué rota — qué le mueve', uno por línea",
  "NEGATIVOS_COMUNES_DEL_TERRITORIO": "string, los negativos con las palabras textuales del cliente, separados por punto y coma",
  "COMPETENCIA_DIRECTA": "string, contra quién compite el equipo y con qué llega cada competidor",
  "PREVIEW_RESPUESTA_CLIENTE": "string de 1 a 2 líneas. Una respuesta REALISTA del cliente típico a la frase del vendedor del preview. Como hablaría un dueño de negocio mexicano real. Sirve SOLO para mostrar el preview en el onboarding — no forma parte del brain persistente."
}

REGLAS DURAS:
1. NO INVENTES HECHOS COMERCIALES. Precios, presentaciones, promociones, mínimos, cantidades y nombres de competidores solo pueden salir de lo que el manager escribió. Si un dato no está, deja la llave con lo que sí haya o con string vacío. Un dato inventado se convierte en una promesa falsa en boca de un vendedor real.
2. COMPETENCIA_DIRECTA es SOLO defensiva: sirve para que el vendedor sepa contra qué compite. Jamás la redactes como ataque, descalificación o comparación de superioridad.
3. Conserva el lenguaje del territorio: si el manager escribió "cubeta", no escribas "contenedor de 19 litros".
4. Sé exhaustivo con los datos duros: no resumas ni recortes listas de precios o presentaciones.

Devuelve SOLO el objeto JSON. Sin markdown. Sin texto adicional.`;

export const generateCompanyBrain = createServerFn({ method: "POST" })
  .inputValidator((data: BrainPayload) => {
    if (!data || !Array.isArray(data.answers) || data.answers.length === 0) {
      throw new Error("Missing answers");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const userPrompt =
      `Empresa: ${data.companyName}\n\n` +
      data.answers
        .filter((a) => (a.answer ?? "").trim().length > 0)
        .map((a) => `P: ${a.question}\nR: ${a.answer}`)
        .join("\n\n") +
      `\n\nFrase del vendedor para el preview: "${data.openerLine}"`;

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
        max_tokens: 8000,
        system: [
          // El system prompt es idéntico en todos los onboardings → se cachea.
          { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        ],
        messages: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: "{" },
        ],
      }),
    });

    if (res.status === 429) throw new Error("rate_limit");
    if (res.status === 402) throw new Error("payment_required");
    if (!res.ok) {
      const t = await res.text();
      console.error("Anthropic error", res.status, t);
      throw new Error("ai_error");
    }

    const json = await res.json();
    const { logAnthropicCall } = await import("@/lib/llm-usage.server");
    await logAnthropicCall({
      phase: "onboarding_company",
      model: MODEL,
      promptVersion: PROMPT_VERSION,
      usage: json?.usage ?? null,
      latencyMs: Date.now() - started,
      companyId: data.companyId ?? null,
    });

    const text: string = json?.content?.[0]?.text ?? "";
    let raw: Record<string, unknown>;
    try {
      // Se prellenó "{" en el turno del asistente para forzar JSON puro.
      raw = JSON.parse(`{${text}`);
    } catch {
      try {
        const m = text.match(/\{[\s\S]*\}/);
        raw = m ? JSON.parse(m[0]) : {};
      } catch {
        raw = {};
      }
    }

    // Brain persistible: solo llaves canónicas, valores string.
    const brain: Record<string, string> = {};
    for (const k of BRAIN_KEYS) {
      brain[k] = typeof raw[k] === "string" ? (raw[k] as string) : "";
    }
    if (!brain['TONO_DETECTADO']) brain['TONO_DETECTADO'] = "Profesional";

    // Respuesta de preview: efímera, se devuelve aparte con prefijo `__`
    // para que sea imposible confundirla con una llave real del brain.
    const previewResponse =
      typeof raw['PREVIEW_RESPUESTA_CLIENTE'] === "string"
        ? (raw['PREVIEW_RESPUESTA_CLIENTE'] as string)
        : "Pues a ver, cuénteme qué trae.";

    return { ...brain, __preview_response: previewResponse };
  });
