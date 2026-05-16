import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatPayload {
  messages: Msg[];
  context?: string;
}

export const coachChat = createServerFn({ method: "POST" })
  .inputValidator((data: ChatPayload) => {
    if (!data || !Array.isArray(data.messages) || data.messages.length === 0) {
      throw new Error("Missing messages");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `Eres Closer, el coach de ventas del vendedor.

Filosofía: Doctor Vendedor — diagnosticas antes de recetar. Eres directo, breve, con autoridad cálida. Nunca preguntas "¿qué quieres hacer?". Guías, decides, instruyes.

Reglas:
- Respuestas cortas (máximo 3-4 frases salvo que el vendedor pida desarrollar).
- Español de México, tono profesional pero humano. Nunca "¡Excelente!" ni felicitaciones vacías.
- Si te preguntan algo de ventas, da una respuesta concreta y accionable.
- Si te preguntan algo fuera de ventas, responde breve y reconduces al entrenamiento.
- Nunca digas que eres una IA ni menciones modelos.${data.context ? `\n\nContexto actual del vendedor: ${data.context}` : ""}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI gateway error ${res.status}: ${txt}`);
    }

    const json = await res.json();
    const reply: string = json?.choices?.[0]?.message?.content ?? "";
    return { reply };
  });
