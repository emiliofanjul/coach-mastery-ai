/**
 * Server function: genera el mensaje personalizado de bienvenida del vendedor
 * + su primera misión, usando Lovable AI Gateway (Gemini 2.5 Pro).
 */
import { createServerFn } from "@tanstack/react-start";

interface SellerWelcomePayload {
  name: string;
  experience: string; // "nuevo" | "intermedio" | "experto"
  challenge: string; // "cierre" | "objeciones" | "prospeccion" | "retencion"
  companyName: string;
  companyId?: string | null;
  sellerId?: string | null;
}

const EXPERIENCE_LABELS: Record<string, string> = {
  nuevo: "Soy nuevo (menos de 6 meses)",
  intermedio: "Tengo algo de experiencia (6 meses a 2 años)",
  experto: "Soy vendedor con experiencia (más de 2 años)",
};

const CHALLENGE_LABELS: Record<string, string> = {
  cierre: "Cerrar más ventas",
  objeciones: "Manejar objeciones",
  prospeccion: "Conseguir clientes nuevos",
  retencion: "Retener clientes actuales",
};

export const generateSellerWelcome = createServerFn({ method: "POST" })
  .inputValidator((data: SellerWelcomePayload) => {
    if (!data?.name || !data?.experience || !data?.challenge) {
      throw new Error("missing_fields");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Eres Closer, el mejor entrenador de ventas del mundo. Tu tono es directo y honesto. Crees en el vendedor pero no lo adulas. Nunca usas exclamaciones. Nunca dices bienvenido de forma genérica.`;

    const userPrompt = `Genera un mensaje para ${data.name}.
Nivel de experiencia: ${EXPERIENCE_LABELS[data.experience] ?? data.experience}.
Mayor reto: ${CHALLENGE_LABELS[data.challenge] ?? data.challenge}.
Empresa: ${data.companyName || "su empresa"}.

El mensaje tiene 2 partes:

PARTE 1 — El mensaje principal (máximo 3 oraciones):
- Oración 1: Reconoce su reto específico con honestidad. No con adulación.
- Oración 2: Explícale que ese reto no se resuelve con un truco o una técnica aislada. Se resuelve dominando el sistema completo de ventas paso a paso.
- Oración 3: La promesa concreta de lo que va a lograr cuando complete el camino.

PARTE 2 — La expectativa (1 oración):
Explícale que el mapa que está a punto de ver no es una lista de tips. Es el sistema completo que va a convertir su mayor reto en su mayor fortaleza. Esta oración debe hacer que el vendedor entre al mapa con la mentalidad correcta: esto toma tiempo y esfuerzo, pero cada paso tiene una razón de ser.

Ejemplos del tono correcto:

Para vendedor con experiencia que quiere cerrar más:
"Carlos, llevas años llegando casi al final y perdiendo la venta en el último momento. Ese problema no se arregla solo aprendiendo a cerrar — se arregla construyendo todo lo que viene antes del cierre, que es donde realmente se gana o se pierde. El mapa que vas a ver ahora es el sistema completo: cada mundo que completes te acerca más al punto donde cerrar se vuelve la consecuencia natural de todo lo que hiciste bien antes."

Para vendedor nuevo que quiere manejar objeciones:
"Juan, las objeciones no se manejan memorizando respuestas. Se manejan entendiendo por qué el cliente las da y qué está buscando realmente cuando las dice. Para llegar ahí necesitas construir la base primero: cómo entrar, cómo leer al cliente, cómo crear valor antes de que aparezca la objeción. El mapa que vas a ver te lleva por ese camino exacto, en el orden correcto."

Responde SOLO con JSON válido, sin markdown:
{"mensaje":"texto completo de las 3 oraciones","expectativa":"la oración de expectativa"}`;

    const started = Date.now();
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
      console.error("AI gateway error", res.status, await res.text());
      throw new Error("ai_error");
    }

    const json = await res.json();
    const { logGatewayCall } = await import("@/lib/llm-usage.server");
    await logGatewayCall({
      phase: "onboarding_seller",
      model: "google/gemini-2.5-pro",
      promptVersion: "onboarding-seller-v1",
      usage: json?.usage ?? null,
      latencyMs: Date.now() - started,
      companyId: data.companyId ?? null,
      sellerId: data.sellerId ?? null,
    });
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { mensaje: string; expectativa: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        mensaje: `${data.name}, tu reto es real y no se resuelve con un truco aislado. Se resuelve dominando el sistema completo de ventas paso a paso, en el orden correcto. Cuando completes el camino, lo que hoy te cuesta se va a convertir en tu mayor fortaleza.`,
        expectativa: "El mapa que vas a ver no es una lista de tips: es el sistema completo que convierte tu mayor reto en tu mayor fortaleza.",
      };
    }
    return parsed;
  });
