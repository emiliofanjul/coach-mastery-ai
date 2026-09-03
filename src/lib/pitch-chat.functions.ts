import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const PITCH_CHAT_MODEL = "claude-sonnet-4-5";
export const PITCH_CHAT_PROMPT_VERSION = "pitch-chat-v2.0.0-criterios";

type Msg = { role: "user" | "assistant"; content: string };

const REGLAS = `═══ QUÉ ESTÁS HACIENDO ═══

Un manager te pide un cambio en UNA sección de su pitch. Tú clasificas lo que
pide en una de cuatro vías y respondes en consecuencia. Hablas en español de
México, directo, sin adornos, sin emojis, máximo 90 palabras por respuesta.

═══ ANTES DE RESPONDER (obligatorio) ═══

Abajo vienen los CRITERIOS DE EJECUCIÓN de este paso: la vara exacta con la
que Closer califica a un vendedor. El Cerebro tiene los principios; los
criterios tienen la medida. Ubica primero qué criterios toca lo que pide el
manager, y sólo después clasifica.

Dos prohibiciones duras:
· NUNCA niegues que existe una regla sin haber mirado los criterios. Si algo
  no aparece ahí, dilo así: "en los criterios de este paso no aparece".
· NUNCA mandes algo a otro paso para no atenderlo. Si el criterio de ESTE
  paso lo pide, aquí se resuelve.

1) ESTILO / PALABRAS → ACEPTA. Él conoce el lenguaje de su gente mejor que tú.
   Reescribe la sección con su lenguaje, conservando la mecánica.
   clasificacion: "estilo".

2) HECHO DE SU NEGOCIO → ACEPTA. Precios, políticas, condiciones, productos,
   lo que su empresa permite o prohíbe. Él sabe; tú no. Reescribe respetando
   el hecho, y si el hecho quita una pieza de la mecánica, resuélvela por otra
   dimensión (plazo, volumen, presentación, línea) en vez de defender la pieza.
   clasificacion: "hecho".

3) EL MANAGER TIENE RAZÓN → CORRIGE. Los criterios le dan la razón y el texto
   actual es el que está mal. No lo discutas: acéptalo y arregla la sección.
   Di qué criterio lo respalda, en términos de lo que le pasa al cliente.
   Dos formas, las dos van aquí:
   a) el texto actual incumple un criterio y él lo cachó.
   b) él tiene razón en QUÉ falta, pero la ejecución que propone incumple otro
      criterio. Entonces aceptas su intención y entregas la ejecución correcta,
      explicando la diferencia entre las dos. No lo mandes a otro paso.
   clasificacion: "correccion".

4) CONTRADICE LA DOCTRINA → CONVERSA. No cites la regla por su nombre: explica
   el MECANISMO en términos de lo que le pasa al cliente.
   ✗ "eso viola el Triple Desglose"
   ✓ "un precio solo se recibe como gasto; en escalera el cliente ve el ahorro"
   Y ofrece una ALTERNATIVA que logre lo que él quiere sin romper la mecánica.
   clasificacion: "doctrina".

═══ CÓMO TE COMPORTAS EN EL DESACUERDO (regla dura) ═══

· NO CAPITULES POR INSISTENCIA. Si repite su petición sin información nueva,
  tu posición NO cambia — pero tampoco repitas el mismo argumento: ofrece OTRA
  alternativa, por otra dimensión.
· CEDER ANTE UN CRITERIO NO ES CAPITULAR. Si al revisar los criterios resulta
  que él tiene razón, reclasifica a "correccion" en ese mismo turno. Sostener
  una posición que los criterios no respaldan no es firmeza: es un error.
· SÍ CAMBIA tu posición si te da un HECHO que no tenías ("mi empresa no me deja
  dar descuentos"). Eso no es ir contra la doctrina: es un hecho del negocio.
  RECLASIFICA a "hecho", acéptalo y propón la escalera sobre otra dimensión.
  Al reclasificar, di explícitamente qué dato te hizo cambiar.
· Nunca digas "tienes razón" para terminar la discusión. Dilo cuando un
  criterio o un hecho suyo lo respalde — y entonces di cuál fue.
· No te disculpes ni pidas permiso. No preguntes "¿qué quieres hacer?".
· A partir de la TERCERA vuelta sin acuerdo doctrinal, ofrécelo explícitamente:
  "Seguimos sin coincidir. Puedo hacerlo como lo pides y marcarlo como decisión
  de tu equipo, o dejarlo. ¿Cómo le hacemos?" — y pon acuerdo_pendiente: true.

═══ LA PROPUESTA ═══

Siempre que propongas una versión (porque aceptaste, o como alternativa),
devuelve el TEXTO COMPLETO de la sección como quedaría, en "propuesta".
El manager la va a ver antes de aplicarla: nunca modificas nada tú.
Si en ese turno no hay versión que mostrar (solo estás preguntando algo),
propuesta = null.

Respeta SIEMPRE los límites de la sección y las reglas duras: cero corchetes de
relleno, cero cifras de dinero que la empresa no traiga, cero preguntas de
opinión sobre el precio.

═══ FORMATO DE SALIDA — SOLO JSON, sin texto alrededor ═══
{ "clasificacion": "estilo" | "hecho" | "correccion" | "doctrina",
  "criterios_tocados": ["ids de los criterios que aplican, o []"],
  "mensaje": "lo que le dices al manager",
  "propuesta": "texto completo de la sección como quedaría, o null",
  "propuesta_label": "etiqueta corta del botón, p.ej. 'Con tu lenguaje' o 'La alternativa'",
  "propuesta_manager": "solo cuando acuerdo_pendiente es true: el texto completo de la sección HECHA COMO ÉL LA PIDE, para que pueda aplicarla como decisión de su equipo; si no, null",
  "acuerdo_pendiente": true | false }`;

export const pitchSectionChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sectionId: string; messages: Msg[] }) => {
    if (!input?.sectionId) throw new Error("sectionId required");
    if (!Array.isArray(input.messages) || input.messages.length === 0)
      throw new Error("messages required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, company_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile || profile.role !== "manager" || !profile.company_id) {
      return { ok: false as const, error: "forbidden" };
    }

    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) return { ok: false as const, error: "missing_api_key" };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getCerebro, getCriteriosEjecucion } = await import("@/lib/doctrina.server");
    const { PITCH_STEPS_SPEC, RECURRENTE_NODE_IDS, buildCriteriosBlock } = await import(
      "@/lib/pitch-generator.server"
    );

    const { data: section } = await supabaseAdmin
      .from("pitch_sections")
      .select("id, pitch_id, step, section_key, section_kind, content, rationale_short")
      .eq("id", data.sectionId)
      .maybeSingle();
    if (!section) return { ok: false as const, error: "not_found" };

    const { data: pitch } = await supabaseAdmin
      .from("company_pitches")
      .select("id, company_id, relationship, client_type, channel")
      .eq("id", (section as any).pitch_id)
      .maybeSingle();
    if (!pitch || (pitch as any).company_id !== profile.company_id) {
      return { ok: false as const, error: "forbidden" };
    }

    // Mismo alcance que usa el generador para esta sección: si el chat no ve
    // los mismos criterios, discute doctrina sin la vara de medir.
    const spec = PITCH_STEPS_SPEC.find((x) => x.step === Number((section as any).step));
    const extraNodes =
      String((pitch as any).relationship) === "recurrente" ? RECURRENTE_NODE_IDS : [];

    const [cerebro, companyRes, criteriosWorlds, criteriosNodes] = await Promise.all([
      getCerebro(),
      supabaseAdmin
        .from("companies")
        .select("name, industry, company_sales_brain")
        .eq("id", (pitch as any).company_id)
        .maybeSingle(),
      getCriteriosEjecucion({ worlds: spec?.worlds ?? [] }),
      extraNodes.length ? getCriteriosEjecucion({ nodeIds: extraNodes }) : Promise.resolve([]),
    ]);
    const company: any = companyRes.data;
    const criteriosBlock = buildCriteriosBlock([...criteriosWorlds, ...criteriosNodes]);

    const cached = `Eres Closer, el entrenador de ventas, hablando con el manager de una empresa
sobre el pitch que le generaste.

═══ EL CEREBRO DE CLOSER (los principios) ═══
${cerebro}

${REGLAS}`;

    const variable = `${criteriosBlock}

═══ LA EMPRESA ═══
${company?.name ?? "—"}${company?.industry ? ` (${company.industry})` : ""}
${
  company?.company_sales_brain
    ? JSON.stringify(company.company_sales_brain, null, 2).slice(0, 10000)
    : "Sin cerebro cargado: no inventes productos ni precios."
}

═══ LA SECCIÓN EN DISCUSIÓN ═══
Pitch: cliente ${(pitch as any).relationship} · ${(pitch as any).client_type} · canal ${(pitch as any).channel}
Paso ${(section as any).step} — ${(section as any).section_key} (${(section as any).section_kind})

TEXTO ACTUAL:
${(section as any).content ?? "(vacío)"}`;

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
        model: PITCH_CHAT_MODEL,
        max_tokens: 1600,
        system: [
          { type: "text", text: cached, cache_control: { type: "ephemeral", ttl: "1h" } },
          { type: "text", text: variable },
        ],
        messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false as const, error: "model_error", detail: txt.slice(0, 300) };
    }
    const json: any = await res.json();
    const raw: string = (json?.content ?? [])
      .filter((b: any) => b?.type === "text")
      .map((b: any) => b.text)
      .join("")
      .trim();

    let parsed: any = null;
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : null;
    } catch {
      parsed = null;
    }
    const reply = {
      clasificacion: (["estilo", "hecho", "correccion", "doctrina"] as const).includes(
        parsed?.clasificacion,
      )
        ? (parsed.clasificacion as "estilo" | "hecho" | "correccion" | "doctrina")
        : ("doctrina" as const),
      mensaje: String(parsed?.mensaje ?? raw).trim(),
      propuesta:
        typeof parsed?.propuesta === "string" && parsed.propuesta.trim()
          ? String(parsed.propuesta).trim()
          : null,
      propuesta_label: String(parsed?.propuesta_label ?? "La versión nueva"),
      propuesta_manager:
        typeof parsed?.propuesta_manager === "string" && parsed.propuesta_manager.trim()
          ? String(parsed.propuesta_manager).trim()
          : null,
      acuerdo_pendiente: parsed?.acuerdo_pendiente === true,
    };

    const lastUser = [...data.messages].reverse().find((m) => m.role === "user")?.content ?? null;
    try {
      await supabaseAdmin.from("pitch_feedback").insert({
        pitch_id: (section as any).pitch_id,
        section_id: (section as any).id,
        manager_message: lastUser,
        closer_response: reply.mensaje,
        classification: reply.clasificacion,
        outcome: "en_conversacion",
      } as any);
      await supabaseAdmin.from("llm_calls").insert({
        phase: "pitch_section_chat",
        prompt_version: PITCH_CHAT_PROMPT_VERSION,
        model: PITCH_CHAT_MODEL,
        input_tokens: json?.usage?.input_tokens ?? null,
        output_tokens: json?.usage?.output_tokens ?? null,
        cached_tokens: json?.usage?.cache_read_input_tokens ?? null,
        cache_creation_tokens: json?.usage?.cache_creation_input_tokens ?? null,
        latency_ms: Date.now() - started,
        company_id: (pitch as any).company_id,
      } as any);
    } catch (e) {
      console.error("[pitch-chat] log failed", e);
    }

    return { ok: true as const, ...reply };
  });
