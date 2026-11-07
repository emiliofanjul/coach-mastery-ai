/**
 * Server function: genera el mensaje personalizado de bienvenida del vendedor
 * + su primera misión, usando Lovable AI Gateway (Gemini 2.5 Pro).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  cierre: "Cerrar la venta: al final, el cliente no se decide",
  objeciones: "Responder objeciones: no sabe qué decir cuando le dicen que no",
  prospeccion: "Conseguir clientes nuevos: le cuesta entrar a negocios que no lo conocen",
  retencion: "Que le sigan comprando: sus clientes se van con la competencia",
};

// Sesión obligatoria (oct-2026): antes cualquiera podía llamarla y gastar créditos.
export const generateSellerWelcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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

Escribe como le hablaría en persona un buen gerente de ventas: palabras sencillas, frases cortas, nada de frases de póster ni metáforas. No empieces con su nombre: la pantalla ya lo saluda por su nombre arriba del mensaje.

El mensaje tiene 2 partes:

PARTE 1 — El mensaje principal (2 oraciones cortas, máximo 45 palabras en total):
- Oración 1: Nombra su reto tal como lo vive en la calle, sin adularlo.
- Oración 2: Dile que ese reto no se arregla con un truco: se arregla dominando toda la venta, y que aquí va a entrenar paso a paso, empezando por lo básico.

PARTE 2 — Lo que va a lograr (1 oración corta, máximo 20 palabras):
Algo concreto que va a poder hacer en sus visitas cuando termine el camino. Habla de lo que él va a saber hacer, no de resultados que no dependen de él (no prometas más ventas ni dinero).

Ejemplos del tono correcto:

Para vendedor con experiencia cuyo reto es cerrar:
{"mensaje":"Llegas al final de la visita y el cliente no se decide. Eso no se arregla con una frase de cierre: se arregla con todo lo que haces antes, y aquí vas a entrenar eso paso a paso.","expectativa":"Cerrar con naturalidad, porque el cliente ya vio por qué le conviene."}

Para vendedor nuevo cuyo reto son las objeciones:
{"mensaje":"Cuando el cliente te dice que no, te quedas sin saber qué decir. Las objeciones no se responden con frases memorizadas: aquí vas a aprender paso a paso a entrar, a escuchar y a leer al cliente.","expectativa":"Entender qué hay detrás de un no y responderlo con calma."}

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
      promptVersion: "onboarding-seller-v2",
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
        mensaje: `Lo que hoy te cuesta no se arregla con un truco: se arregla dominando toda la venta, y aquí vas a entrenarla paso a paso, empezando por lo básico.`,
        expectativa: "Saber qué hacer en cada parte de la visita, de la entrada al cierre.",
      };
    }
    return parsed;
  });
