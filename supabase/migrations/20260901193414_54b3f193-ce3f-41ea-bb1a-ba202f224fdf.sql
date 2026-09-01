
CREATE TABLE IF NOT EXISTS public.tts_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  company_id uuid REFERENCES public.companies(id),
  seller_id uuid REFERENCES public.sellers(id),
  session_id uuid,
  node_id text,
  phase text,
  characters integer NOT NULL DEFAULT 0,
  voice_id text,
  model text,
  latency_ms integer,
  cache_hit boolean NOT NULL DEFAULT false,
  estimated_usd numeric(10,5) NOT NULL DEFAULT 0
);

GRANT SELECT ON public.tts_calls TO authenticated;
GRANT ALL ON public.tts_calls TO service_role;

ALTER TABLE public.tts_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "managers read own company tts" ON public.tts_calls;
CREATE POLICY "managers read own company tts"
  ON public.tts_calls FOR SELECT TO authenticated
  USING (public.is_manager() AND company_id = public.current_company_id());

CREATE INDEX IF NOT EXISTS tts_calls_created_idx ON public.tts_calls (created_at DESC);
CREATE INDEX IF NOT EXISTS tts_calls_company_idx ON public.tts_calls (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS tts_calls_session_idx ON public.tts_calls (session_id);

-- Costo estimado por llamada de modelo, según precios públicos por millón de tokens.
CREATE OR REPLACE FUNCTION public.llm_call_usd(
  _model text, _input integer, _output integer, _cached integer, _cache_write integer
) RETURNS numeric
LANGUAGE sql IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT ROUND((
    CASE
      WHEN _model ILIKE '%haiku%' THEN
          COALESCE(_input,0) * 1.00 + COALESCE(_output,0) * 5.00
        + COALESCE(_cached,0) * 0.10 + COALESCE(_cache_write,0) * 1.25
      WHEN _model ILIKE '%gemini%pro%' THEN
          COALESCE(_input,0) * 1.25 + COALESCE(_output,0) * 10.00
        + COALESCE(_cached,0) * 0.31 + COALESCE(_cache_write,0) * 1.25
      WHEN _model ILIKE '%gemini%flash%' THEN
          COALESCE(_input,0) * 0.30 + COALESCE(_output,0) * 2.50
        + COALESCE(_cached,0) * 0.075 + COALESCE(_cache_write,0) * 0.30
      ELSE -- sonnet 4.5 y por defecto
          COALESCE(_input,0) * 3.00 + COALESCE(_output,0) * 15.00
        + COALESCE(_cached,0) * 0.30 + COALESCE(_cache_write,0) * 3.75
    END
  ) / 1000000.0, 5)::numeric
$$;

-- Reporte combinado: modelos (llm_calls) + voz (tts_calls) por empresa y rango.
CREATE OR REPLACE FUNCTION public.usage_cost_report(_from timestamptz, _to timestamptz)
RETURNS TABLE(
  company_id uuid,
  company_name text,
  llm_calls bigint,
  llm_input_tokens bigint,
  llm_cached_tokens bigint,
  llm_output_tokens bigint,
  llm_usd numeric,
  tts_calls bigint,
  tts_characters bigint,
  tts_cache_hits bigint,
  tts_usd numeric,
  total_usd numeric
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH allowed AS (
    SELECT c.id, c.name
    FROM public.companies c
    WHERE auth.uid() IN (
        '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid,
        '10d3617b-4bbe-49ba-b671-bc60982c1ab2'::uuid,
        '0672b476-5c81-4a0b-a9b0-e18496cd81c4'::uuid
      )
      OR (public.is_manager() AND c.id = public.current_company_id())
  ),
  l AS (
    SELECT l.company_id,
           count(*)::bigint AS calls,
           COALESCE(sum(l.input_tokens),0)::bigint AS input_tokens,
           COALESCE(sum(l.cached_tokens),0)::bigint AS cached_tokens,
           COALESCE(sum(l.output_tokens),0)::bigint AS output_tokens,
           COALESCE(sum(public.llm_call_usd(l.model, l.input_tokens, l.output_tokens, l.cached_tokens, l.cache_creation_tokens)),0)::numeric AS usd
    FROM public.llm_calls l
    WHERE l.created_at >= _from AND l.created_at < _to
    GROUP BY l.company_id
  ),
  t AS (
    SELECT t.company_id,
           count(*)::bigint AS calls,
           COALESCE(sum(t.characters),0)::bigint AS characters,
           count(*) FILTER (WHERE t.cache_hit)::bigint AS cache_hits,
           COALESCE(sum(t.estimated_usd),0)::numeric AS usd
    FROM public.tts_calls t
    WHERE t.created_at >= _from AND t.created_at < _to
    GROUP BY t.company_id
  )
  SELECT a.id, a.name,
         COALESCE(l.calls,0), COALESCE(l.input_tokens,0), COALESCE(l.cached_tokens,0),
         COALESCE(l.output_tokens,0), ROUND(COALESCE(l.usd,0),4),
         COALESCE(t.calls,0), COALESCE(t.characters,0), COALESCE(t.cache_hits,0),
         ROUND(COALESCE(t.usd,0),4),
         ROUND(COALESCE(l.usd,0) + COALESCE(t.usd,0),4)
  FROM allowed a
  LEFT JOIN l ON l.company_id = a.id
  LEFT JOIN t ON t.company_id = a.id
  ORDER BY 12 DESC NULLS LAST;
$$;
