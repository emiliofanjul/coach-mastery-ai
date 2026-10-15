import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { armarAvance, armarTecnicas } from "@/lib/avance-coach";
import { extraerTema, revisarRespuesta, promptReescritura, recorteSeguro } from "@/lib/coach-guardia";
import { LENGUAJE_CLOSER } from "@/lib/lenguaje-closer";

type Msg = { role: "user" | "assistant"; content: string };

interface ChatPayload {
  messages: Msg[];
  context?: string;
  sellerId?: string;
}

export const COACH_MODEL = "claude-sonnet-4-5";
export const COACH_PROMPT_VERSION = "coach-v2.4.0-lenguaje";

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
   TÉCNICAS POR MUNDO y el Cerebro. Ojo con "Bloqueo vs Objeción": la misma
   frase se maneja distinto según cuándo llegó. Si el cliente la soltó ANTES
   de entender (en la puerta, "no me quiso escuchar", "ni me dejó hablar"), es
   un BLOQUEO: se atraviesa con AIR y eso es del mundo de La Historia Breve.
   Si llegó DESPUÉS de que le presentaste ("está caro" tras darle el precio,
   "déjeme pensarlo"), es una OBJECIÓN y se enseña en el mundo de El Cierre,
   aunque su causa venga de un paso anterior.
   EMPIEZA SIEMPRE tu respuesta con una línea exacta "[TEMA: Mundo N]", con el
   número del mundo donde se enseña el tema (o "[TEMA: general]" si es de
   mentalidad o no es de un mundo). Esa línea no la ve el vendedor.

2. SOLO EXPLICAS TÉCNICAS QUE YA LE ENSEÑASTE O QUE ESTÁ APRENDIENDO AHORA. Las
   de un mundo marcado "TODAVÍA NO SE LAS ENSEÑAS" no las explicas, no las
   nombras como técnica y no le preguntas si las hizo (nada de "¿usaste el
   triple desglose?" si ese mundo está cerrado). Tampoco uses su vocabulario
   (por ejemplo "bala" si las balas no se las has enseñado): dilo con palabras
   de todos los días. Solo le dices en qué mundo las va a aprender.

3. SI EL TEMA ES DE UN MUNDO QUE TODAVÍA NO VE: MÁXIMO 4 FRASES, en prosa,
   sin listas. Un consejo práctico para hoy que solo use lo que ya sabe, y
   luego, con número y nombre
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
vacías. Nunca digas que eres una IA ni menciones modelos.

${LENGUAJE_CLOSER}`;

async function loadCoachContext(sellerId?: string): Promise<{
  brainBlock: string;
  progresoBlock: string;
  companyId: string | null;
  mundoActual?: number | null;
  nombresMundo?: Map<number, string>;
  cerradasPorMundo?: Map<number, string[]>;
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

  // Para la guardia: el mundo donde va y los nombres de técnicas que todavía no ve.
  const mundoActual = avance.mundoActual;
  const nombresMundo = new Map(((worlds ?? []) as any[]).map((w) => [Number(w.id), String(w.name ?? "")]));
  const cerradasPorMundo = new Map<number, string[]>();
  for (const t of (tecnicas ?? []) as any[]) {
    if (t?.status && t.status !== "active") continue;
    const w = Number(t?.world_id_introduced);
    if (mundoActual === null || !(w > mundoActual)) continue;
    const l = cerradasPorMundo.get(w) ?? [];
    if (!l.includes(t.name)) l.push(String(t.name));
    cerradasPorMundo.set(w, l);
  }
  return { brainBlock, progresoBlock, companyId: seller.company_id, mundoActual, nombresMundo, cerradasPorMundo };
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
    const borrador: string = (json?.content ?? [])
      .filter((b: any) => b?.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();

    // Guardia: si el tema es de un mundo que todavía no ve, la respuesta tiene
    // que ser breve, no nombrar técnicas de ese mundo y decir dónde lo aprende.
    // Si no cumple, se reescribe una vez y se vuelve a revisar; si la
    // reescritura falla o tampoco cumple, se recorta en código.
    const tema = extraerTema(borrador);
    let reply = tema.texto;
    let guardia: any = null;
    const cerradas = [...(ctx.cerradasPorMundo?.values() ?? [])].flat();
    const revision = revisarRespuesta({ mundoTema: tema.mundo, mundoActual: ctx.mundoActual ?? null, texto: reply, nombresCerrados: cerradas });
    if (revision.reescribir && tema.mundo !== null) {
      const opcionesTema = { mundoTema: tema.mundo, nombreMundo: ctx.nombresMundo?.get(tema.mundo) ?? "", nombresCerrados: cerradas };
      let reescrita = "";
      const t0 = Date.now();
      try {
        const ultima = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? "";
        const r2 = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
          body: JSON.stringify({
            model: COACH_MODEL,
            max_tokens: 400,
            system: promptReescritura(opcionesTema),
            messages: [{ role: "user", content: `PREGUNTA DEL VENDEDOR:\n${ultima}\n\nBORRADOR:\n${reply}` }],
          }),
        });
        if (r2.ok) {
          const j2: any = await r2.json();
          reescrita = extraerTema(((j2?.content ?? []).filter((b: any) => b?.type === "text").map((b: any) => b.text).join("")).trim()).texto;
          guardia = { j2, latency_ms: Date.now() - t0 };
        }
      } catch (e) {
        console.error("[coach-chat] la reescritura falló", e);
      }
      const segunda = reescrita
        ? revisarRespuesta({ mundoTema: tema.mundo, mundoActual: ctx.mundoActual ?? null, texto: reescrita, nombresCerrados: cerradas })
        : { reescribir: true, motivos: ["sin reescritura"] };
      reply = segunda.reescribir ? recorteSeguro(reescrita || reply, opcionesTema) : reescrita;
      console.warn(
        segunda.reescribir ? "[coach-chat] guardia: se reescribió y además se recortó en código" : "[coach-chat] guardia: se reescribió",
        { motivos: revision.motivos, segunda: segunda.motivos },
      );
    }

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
    if (guardia) {
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        await supabaseAdmin.from("llm_calls").insert({
          phase: "coach_chat_guardia",
          prompt_version: COACH_PROMPT_VERSION,
          model: COACH_MODEL,
          input_tokens: guardia.j2?.usage?.input_tokens ?? null,
          output_tokens: guardia.j2?.usage?.output_tokens ?? null,
          latency_ms: guardia.latency_ms,
          seller_id: propio?.id ?? null,
          company_id: ctx.companyId,
        });
      } catch (e) {
        console.error("[coach-chat] llm_calls (guardia) insert failed", e);
      }
    }

    return { reply };
  });
