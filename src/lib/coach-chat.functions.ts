import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { armarAvance, armarTecnicas } from "@/lib/avance-coach";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatPayload {
  messages: Msg[];
  context?: string;
  sellerId?: string;
}

export const COACH_MODEL = "claude-sonnet-4-5";
export const COACH_PROMPT_VERSION = "coach-v2.2.0-avance";

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

TÚ SABES LO QUE YA LE ENSEÑASTE. Tú guías su entrenamiento. Abajo tienes
"SU MAPA" (qué nodos ya le enseñaste ✓, cuál le toca ▶ y cuáles todavía no ve
○) y "TÉCNICAS POR MUNDO" (dónde se enseña cada técnica). Antes de contestar:

1. UBICA EL TEMA DE LA PREGUNTA: ¿en qué mundo se enseña lo que pregunta? Usa
   TÉCNICAS POR MUNDO. Una objeción del cliente ("está caro", "ya tengo
   proveedor", "déjeme pensarlo", "no me interesa comprarle") se enseña en el
   mundo de El Cierre, aunque su causa venga de un paso anterior.

2. SOLO EXPLICAS TÉCNICAS QUE YA LE ENSEÑASTE O QUE ESTÁ APRENDIENDO AHORA. Las
   de un mundo marcado "TODAVÍA NO SE LAS ENSEÑAS" no las explicas, no las
   nombras como técnica y no le preguntas si las hizo (nada de "¿usaste el
   triple desglose?" si ese mundo está cerrado). Solo le dices en qué mundo las
   va a aprender.

3. SI EL TEMA ES DE UN MUNDO QUE TODAVÍA NO VE: MÁXIMO 4 FRASES. Un consejo
   práctico para hoy que solo use lo que ya sabe, y luego, con número y nombre
   del mundo: "Eso lo vas a trabajar a fondo en el Mundo 5, El Cierre. Sigue
   avanzando: cuando llegues, todo va a tener sentido." Si conecta, puedes
   decirle que el nodo que le toca (▶) le ayuda a llegar mejor. No lo mandes a
   nodos que todavía no puede abrir.

4. SI YA SE LO ENSEÑASTE (✓): dile que ya lo vio y dónde ("eso lo viste en el
   1.5, El Ice Breaker"), refréscale la técnica con más detalle (los pasos y un
   ejemplo, con su producto si está en el contexto de su empresa) y
   recomiéndale repetir ese nodo, o el boss de ese mundo, por su número y
   nombre. Si lo pasó con 1 estrella o sus skills de eso están bajos, dile que
   lo practique varias veces.

5. SI ES LO QUE LE TOCA (▶): dile que justo eso es lo que sigue y que lo
   practique ahora.

Solo nombra nodos que aparezcan en su mapa, con su número y nombre exactos.
Nunca le digas que algo "lo verá más adelante" si ya lo tiene con ✓.

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
    .select("id, company_id, full_name, certified_at")
    .eq("id", sellerId)
    .maybeSingle();

  if (!seller) {
    return {
      brainBlock: "No tenemos el contexto comercial de su empresa en esta conversación.",
      progresoBlock: "No conocemos su avance en el mapa en esta conversación.",
      companyId: null,
    };
  }

  const [{ data: company }, { data: worlds }, { data: skillState }, { data: nodes }, { data: progress }, { data: tecnicas }] = await Promise.all([
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
    supabaseAdmin.from("nodes").select("id, world_id, name, order_index, is_boss"),
    supabaseAdmin.from("node_progress").select("node_id, status, stars").eq("seller_id", seller.id),
    supabaseAdmin.from("skills").select("name, world_id_introduced, status"),
  ]);

  const brainRaw = company?.company_sales_brain;
  const brainBlock = brainRaw
    ? `Empresa: ${company?.name ?? "—"}${company?.industry ? ` (${company.industry})` : ""}\n\n${JSON.stringify(brainRaw, null, 2).slice(0, 12000)}`
    : `Empresa: ${company?.name ?? "—"}. Todavía no tiene cargado su cerebro de ventas: no inventes productos, precios ni ventajas.`;

  const skills = (skillState ?? []).length
    ? (skillState as any[])
        .map((s) => `${s.skill_id} (${Math.round(Number(s.mastery_score) || 0)})`)
        .join(", ")
    : "todavía sin evidencia de práctica";

  // El avance sale de su mapa real (node_progress), igual que lo ve él.
  const avance = armarAvance((worlds ?? []) as any[], (nodes ?? []) as any[], (progress ?? []) as any[], {
    nombre: seller.full_name,
    certificado: !!seller.certified_at,
  });
  const progresoBlock = `${avance.texto}

${armarTecnicas((worlds ?? []) as any[], (tecnicas ?? []) as any[], avance.mundoActual)}

Skills con evidencia (código y mastery 0-100): ${skills}`;

  return { brainBlock, progresoBlock, companyId: seller.company_id };
}

// Sesión obligatoria (oct-2026): antes cualquiera podía llamar al coach y gastar
// créditos, y con el id de otro vendedor leer el contexto de otra empresa.
// Ahora el coach siempre usa al vendedor de la sesión.
export const coachChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ChatPayload) => {
    if (!data || !Array.isArray(data.messages) || data.messages.length === 0) {
      throw new Error("Missing messages");
    }
    return data;
  })
  .handler(async ({ data, context }) => {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

    const { supabaseAdmin: adminSesion } = await import("@/integrations/supabase/client.server");
    const { data: propio } = await adminSesion
      .from("sellers")
      .select("id")
      .eq("profile_id", context.userId)
      .maybeSingle();

    const { getCerebro } = await import("@/lib/doctrina.server");
    const [cerebro, ctx] = await Promise.all([
      getCerebro(),
      loadCoachContext(propio?.id ?? undefined),
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
        seller_id: propio?.id ?? null,
        company_id: ctx.companyId,
      });
    } catch (e) {
      console.error("[coach-chat] llm_calls insert failed", e);
    }

    return { reply };
  });
