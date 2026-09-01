import { createServerFn } from "@tanstack/react-start";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatPayload {
  messages: Msg[];
  context?: string;
  sellerId?: string;
}

export const COACH_MODEL = "claude-sonnet-4-5";
export const COACH_PROMPT_VERSION = "coach-v2.0.0-cerebro";

const REGLAS = `═══ CÓMO RESPONDES ═══

ERES CLOSER. Respondes DESDE la doctrina que tienes arriba, nunca desde
conocimiento general de ventas. Si algo no está en el Cerebro, dilo: "eso no
está en el sistema, déjame no inventarte una respuesta". NUNCA rellenes un
hueco de doctrina con lo que sepas de ventas por fuera: una respuesta que
contradice el mapa destruye la confianza en todo el entrenamiento.

CITA DE DÓNDE SALE. Cuando expliques algo, di en qué paso o mundo se enseña:
"eso es FFF, lo trabajas a fondo en el Mundo 5". El vendedor aprende dónde
buscar, y refuerza el mapa en vez de sustituirlo. Solo cita mundos y nodos
que existan en el mapa que recibiste; si no sabes el número, di el nombre del
paso sin inventar numeración.

RESPETA SU AVANCE. Si pregunta algo de un mundo que todavía no ve, respóndele
lo esencial y dile dónde lo va a trabajar completo. No le adelantes el sistema
entero.

DIAGNOSTICA ANTES DE RECETAR. Si la pregunta es vaga ("no estoy vendiendo"),
pregunta UNA cosa concreta antes de responder. Es la misma doctrina que le
enseñas a él.

DISTINGUE LOS DOS TIPOS DE PREGUNTA:
 · Técnica ("¿cómo cierro?") → Partes 1, 2 y 4 del Cerebro.
 · Mentalidad ("llevo tres días sin cerrar") → Parte 3. No es problema de
   técnica: es de protección de la actitud. No le receten técnica a un
   problema de actitud.

NO INVENTES HECHOS COMERCIALES. Ventajas, comparaciones con la competencia,
datos de mercado, precios: eso no es doctrina, es información de la empresa.
Si no está en su contexto, dilo.

ESTILO. Español de México, directo, sin relleno. Respuestas cortas (3-5
frases salvo que pida desarrollo). Nada de "¡Excelente!" ni felicitaciones
vacías. Nunca digas que eres una IA ni menciones modelos.`;

async function loadCoachContext(sellerId?: string): Promise<{
  brainBlock: string;
  progresoBlock: string;
  companyId: string | null;
}> {
  if (!sellerId) {
    return {
      brainBlock: "No tenemos el contexto comercial de su empresa en esta conversación.",
      progresoBlock: "No conocemos su avance en el mapa en esta conversación.",
      companyId: null,
    };
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: seller } = await supabaseAdmin
    .from("sellers")
    .select("id, company_id, full_name, current_world, current_node, certified_at")
    .eq("id", sellerId)
    .maybeSingle();

  if (!seller) {
    return {
      brainBlock: "No tenemos el contexto comercial de su empresa en esta conversación.",
      progresoBlock: "No conocemos su avance en el mapa en esta conversación.",
      companyId: null,
    };
  }

  const [{ data: company }, { data: worlds }, { data: skillState }] = await Promise.all([
    supabaseAdmin
      .from("companies")
      .select("name, industry, company_sales_brain")
      .eq("id", seller.company_id)
      .maybeSingle(),
    supabaseAdmin.from("worlds").select("id, name, description").order("order_index"),
    supabaseAdmin
      .from("seller_skill_state")
      .select("skill_id, mastery_score")
      .eq("seller_id", seller.id)
      .order("mastery_score", { ascending: false })
      .limit(60),
  ]);

  const brainRaw = company?.company_sales_brain;
  const brainBlock = brainRaw
    ? `Empresa: ${company?.name ?? "—"}${company?.industry ? ` (${company.industry})` : ""}\n\n${JSON.stringify(brainRaw, null, 2).slice(0, 12000)}`
    : `Empresa: ${company?.name ?? "—"}. Todavía no tiene cargado su cerebro de ventas: no inventes productos, precios ni ventajas.`;

  const mapa = (worlds ?? [])
    .map((w: any) => {
      const estado =
        w.id < seller.current_world
          ? "ya lo pasó"
          : w.id === seller.current_world
            ? "AQUÍ VA HOY"
            : "todavía no lo ve";
      return `· Mundo ${w.id} — ${w.name} [${estado}]`;
    })
    .join("\n");

  const skills = (skillState ?? []).length
    ? (skillState as any[])
        .map((s) => `${s.skill_id} (${Math.round(Number(s.mastery_score) || 0)})`)
        .join(", ")
    : "todavía sin evidencia de práctica";

  const progresoBlock = `Vendedor: ${seller.full_name ?? "—"}
Va en el Mundo ${seller.current_world}, nodo ${seller.current_node}.${seller.certified_at ? " Está certificado." : ""}

Mapa:
${mapa}

Skills con evidencia (código y mastery 0-100): ${skills}`;

  return { brainBlock, progresoBlock, companyId: seller.company_id };
}

export const coachChat = createServerFn({ method: "POST" })
  .inputValidator((data: ChatPayload) => {
    if (!data || !Array.isArray(data.messages) || data.messages.length === 0) {
      throw new Error("Missing messages");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { getCerebro } = await import("@/lib/doctrina.server");
    const [cerebro, ctx] = await Promise.all([
      getCerebro(),
      loadCoachContext(data.sellerId),
    ]);

    // Bloque FIJO (idéntico para todos los vendedores) → cacheado.
    const cached = `Eres Closer, el entrenador de ventas. Este es el sistema completo que enseñas.

═══ EL CEREBRO DE CLOSER (doctrina completa — tu única fuente) ═══
${cerebro}

${REGLAS}`;

    // Bloque VARIABLE: empresa + progreso + pantalla.
    const variable = `═══ LA EMPRESA DE ESTE VENDEDOR ═══
${ctx.brainBlock}

═══ SU AVANCE ═══
${ctx.progresoBlock}${data.context ? `\n\nEstá en la pantalla: ${data.context}` : ""}`;

    const started = Date.now();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
        "anthropic-beta": "extended-cache-ttl-2025-04-11",
      },
      body: JSON.stringify({
        model: COACH_MODEL,
        max_tokens: 1200,
        system: [
          { type: "text", text: cached, cache_control: { type: "ephemeral", ttl: "1h" } },
          { type: "text", text: variable },
        ],
        messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Claude ${res.status}: ${txt.slice(0, 400)}`);
    }

    const json: any = await res.json();
    const reply: string = (json?.content ?? [])
      .filter((b: any) => b?.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("llm_calls").insert({
        phase: "coach_chat",
        prompt_version: COACH_PROMPT_VERSION,
        model: COACH_MODEL,
        input_tokens: json?.usage?.input_tokens ?? null,
        output_tokens: json?.usage?.output_tokens ?? null,
        cached_tokens: json?.usage?.cache_read_input_tokens ?? null,
        cache_creation_tokens: json?.usage?.cache_creation_input_tokens ?? null,
        latency_ms: Date.now() - started,
        seller_id: data.sellerId ?? null,
        company_id: ctx.companyId,
      });
    } catch (e) {
      console.error("[coach-chat] llm_calls insert failed", e);
    }

    return { reply };
  });
