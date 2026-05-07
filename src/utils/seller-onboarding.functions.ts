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

    const systemPrompt = `Eres Closer, el mejor entrenador de ventas del mundo. Tu tono es directo, honesto y exigente porque crees en el vendedor. Nunca dices "bienvenido" de forma genérica. Nunca usas exclamaciones exageradas. Hablas directo, como un entrenador de alto rendimiento que cree genuinamente en la persona que tiene enfrente.`;

    const userPrompt = `Genera un mensaje personalizado de máximo 3 oraciones para ${data.name}.
Nivel: ${EXPERIENCE_LABELS[data.experience] ?? data.experience}.
Mayor reto: ${CHALLENGE_LABELS[data.challenge] ?? data.challenge}.
Empresa: ${data.companyName || "su empresa"}.

Reglas:
- Oración 1: reconoce específicamente su nivel con honestidad, no adulación.
- Oración 2: nombra su reto y por qué Closer es la solución exacta.
- Oración 3: la promesa concreta de lo que va a lograr.

Después genera una misión inicial siguiendo ESTAS REGLAS ESTRICTAS:
- UNA sola acción, DENTRO de la app, completable en menos de 10 minutos.
- Siempre invita a entrar al Mapa AHORA y completar el primer nodo / primera lección del Mundo 0.
- NUNCA pide hacer algo fuera de la app, ni algo complejo, ni tarea para "mañana".
- 1 a 2 oraciones máximo. Conecta el primer nodo con el reto específico del vendedor.

Ejemplos según reto:
- cierre: "Completa el primer nodo del Mapa. Toma menos de 10 minutos y es la base de todo lo que sigue."
- objeciones: "Entra al Mundo 0 y completa la primera lección. Ahí empieza el sistema que cambia cómo respondes cuando el cliente dice no."
- prospeccion: "Completa tu primer nodo hoy. En 10 minutos vas a tener algo concreto que aplicar mañana."
- retencion: "Entra al Mapa y completa el primer nodo. Es el primer paso para convertir clientes que compran una vez en clientes que siempre regresan."

Responde SOLO con JSON válido, sin markdown:
{"mensaje":"...","mision":"..."}`;

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
    const content: string = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { mensaje: string; mision: string };
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {
        mensaje: `${data.name}, hoy empieza tu entrenamiento real. Vamos a trabajar específicamente lo que más te cuesta. En las próximas semanas vas a ver resultados que no esperabas.`,
        mision: "Completa tu primera sesión de práctica de voz con tu cliente IA.",
      };
    }
    return parsed;
  });
