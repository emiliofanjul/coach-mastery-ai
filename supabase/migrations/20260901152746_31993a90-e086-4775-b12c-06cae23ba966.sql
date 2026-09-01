CREATE OR REPLACE FUNCTION public.llm_usage_report(_from timestamptz, _to timestamptz)
RETURNS TABLE (
  company_id uuid,
  company_name text,
  phase text,
  model text,
  calls bigint,
  input_tokens bigint,
  cached_tokens bigint,
  cache_creation_tokens bigint,
  output_tokens bigint,
  avg_latency_ms numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.llm_usage_report(timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.llm_usage_report(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.llm_usage_report(timestamptz, timestamptz) TO service_role;