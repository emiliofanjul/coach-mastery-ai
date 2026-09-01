/**
 * Registro unificado de consumo de modelos en `llm_calls`.
 * Se usa para las llamadas que van por el AI Gateway de Lovable (onboarding),
 * que antes no quedaban medidas en llm_usage_report.
 */

export type GatewayUsage = {
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  prompt_tokens_details?: { cached_tokens?: number | null } | null;
} | null;

export async function logGatewayCall(args: {
  phase: string;
  model: string;
  promptVersion: string;
  usage: GatewayUsage;
  latencyMs: number;
  companyId?: string | null;
  sellerId?: string | null;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("llm_calls").insert({
      phase: args.phase,
      prompt_version: args.promptVersion,
      model: args.model,
      input_tokens: args.usage?.prompt_tokens ?? null,
      output_tokens: args.usage?.completion_tokens ?? null,
      cached_tokens: args.usage?.prompt_tokens_details?.cached_tokens ?? null,
      cache_creation_tokens: null,
      latency_ms: args.latencyMs,
      company_id: args.companyId ?? null,
      seller_id: args.sellerId ?? null,
    });
  } catch (e) {
    console.error("[llm-usage] insert failed", args.phase, e);
  }
}

export type AnthropicUsage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
} | null;

/** Misma medición, para las llamadas que van directo a Anthropic. */
export async function logAnthropicCall(args: {
  phase: string;
  model: string;
  promptVersion: string;
  usage: AnthropicUsage;
  latencyMs: number;
  companyId?: string | null;
  sellerId?: string | null;
}): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("llm_calls").insert({
      phase: args.phase,
      prompt_version: args.promptVersion,
      model: args.model,
      input_tokens: args.usage?.input_tokens ?? null,
      output_tokens: args.usage?.output_tokens ?? null,
      cached_tokens: args.usage?.cache_read_input_tokens ?? null,
      cache_creation_tokens: args.usage?.cache_creation_input_tokens ?? null,
      latency_ms: args.latencyMs,
      company_id: args.companyId ?? null,
      seller_id: args.sellerId ?? null,
    });
  } catch (e) {
    console.error("[llm-usage] anthropic insert failed", args.phase, e);
  }
}
