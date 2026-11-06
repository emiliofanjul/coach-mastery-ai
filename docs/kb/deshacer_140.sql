-- DESHACER del mensaje 140: deja las dos funciones exactamente como estaban antes (con los 3 ids escritos a mano).
-- Solo correrlo si Emilio lo pide.
CREATE OR REPLACE FUNCTION public.llm_usage_report(_from timestamp with time zone, _to timestamp with time zone)
 RETURNS TABLE(company_id uuid, company_name text, phase text, model text, calls bigint, input_tokens bigint, cached_tokens bigint, cache_creation_tokens bigint, output_tokens bigint, avg_latency_ms numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    l.company_id,
    c.name,
    l.phase,
    l.model,
    count(*)::bigint,
    COALESCE(sum(l.input_tokens), 0)::bigint,
    COALESCE(sum(l.cached_tokens), 0)::bigint,
    COALESCE(sum(l.cache_creation_tokens), 0)::bigint,
    COALESCE(sum(l.output_tokens), 0)::bigint,
    ROUND(AVG(l.latency_ms)::numeric, 0)
  FROM public.llm_calls l
  LEFT JOIN public.companies c ON c.id = l.company_id
  WHERE l.created_at >= _from
    AND l.created_at < _to
    AND (
      auth.uid() IN (
        '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid,
        '10d3617b-4bbe-49ba-b671-bc60982c1ab2'::uuid,
        '0672b476-5c81-4a0b-a9b0-e18496cd81c4'::uuid
      )
      OR (public.is_manager() AND l.company_id = public.current_company_id())
    )
  GROUP BY l.company_id, c.name, l.phase, l.model
  ORDER BY 1, 3;
$function$;

CREATE OR REPLACE FUNCTION public.usage_cost_report(_from timestamp with time zone, _to timestamp with time zone)
 RETURNS TABLE(company_id uuid, company_name text, llm_calls bigint, llm_input_tokens bigint, llm_cached_tokens bigint, llm_output_tokens bigint, llm_usd numeric, tts_calls bigint, tts_characters bigint, tts_cache_hits bigint, tts_usd numeric, total_usd numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
