/**
 * Server function: genera el Company Sales Brain + un turno de Don Ramón
 * usando Lovable AI Gateway (modelo Gemini 2.5 Pro).
 *
 * No requiere API key adicional — LOVABLE_API_KEY ya está en el sandbox.
 */
import { createServerFn } from "@tanstack/react-start";

type AnswerInput = { question: string; answer: string };

interface BrainPayload {
  answers: AnswerInput[];
  companyName: string;
  openerLine: string; // primera frase del vendedor para generar respuesta de Don Ramón
}

export const generateCompanyBrain = createServerFn({ method: "POST" })
  .inputValidator((data: BrainPayload) => {
    if (!data || !Array.isArray(data.answers) || data.answers.length === 0) {
      throw new Error("Missing answers");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt =
      `Empresa: ${data.companyName}\n\n` +
      data.answers.map((a) => `P: ${a.question}\nR: ${a.answer}`).join("\n\n") +
      `\n\nFrase del vendedor para el preview: "${data.openerLine}"`;

    const systemPrompt = `Eres el sistema de inteligencia comercial de Closer.

Con base en las respuestas del onboarding del manager, devuelves un objeto JSON con EXACTAMENTE estas claves:

{
  "PRODUCTOS_ACTIVOS": "string corto, lista de productos/marcas",
  "CLIENTE_TIPICO": "string, perfil del cliente, cómo piensa, qué le importa",
  "ARGUMENTOS_DE_VALOR": "string con 3-5 argumentos separados por punto y coma",
  "OBJECIONES_REALES": "string con 3-5 objeciones probables separadas por punto y coma",
  "CONTEXTO_DE_VENTA": "string, escenario típico (tipo de interacción, duración, ambiente)",
  "RESTRICCIONES": "string, lo que nunca debe decir/hacer el equipo",
  "TONO_DETECTADO": "string corto (Ej: 'Informal — trato de confianza')",
  "DON_RAMON_RESPUESTA": "string de 1 a 2 líneas. Una respuesta REALISTA del cliente típico al saludo del vendedor. Como hablaría un dueño de negocio mexicano real."
}

Devuelve SOLO el objeto JSON. Sin markdown. Sin texto adicional.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("rate_limit");
    if (res.status === 402) throw new Error("payment_required");
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      throw new Error("ai_error");
    }

    const json = await res.json();
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    let brain: Record<string, string>;
    try {
      brain = JSON.parse(content);
    } catch {
      // fallback minimo
      brain = {
        PRODUCTOS_ACTIVOS: "",
        CLIENTE_TIPICO: "",
        ARGUMENTOS_DE_VALOR: "",
        OBJECIONES_REALES: "",
        CONTEXTO_DE_VENTA: "",
        RESTRICCIONES: "",
        TONO_DETECTADO: "Profesional",
        DON_RAMON_RESPUESTA: "Pues a ver, cuénteme qué trae.",
      };
    }
    return brain;
  });
