-- Mensaje 140 (6-nov-2026) · Seguridad 1: los reportes de costos solo para los administradores de la plataforma.
-- Hoy llm_usage_report y usage_cost_report dejan ver todas las empresas a 3 ids escritos a mano (uno es Emilio; los otros
-- dos son cuentas creadas por error de dedo). Ahora el acceso total sale de la tabla platform_admins. Los managers siguen
-- viendo solo su empresa, igual que hoy. Nada más cambia: mismo nombre, mismos argumentos, mismas columnas, mismos permisos.
-- Protegido: solo reemplaza si la función de hoy tiene los ids escritos a mano; el chequeo del final aborta si algo no quedó.
-- Correrlo dos veces no cambia nada.
DO $p$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.platform_admins) THEN RAISE EXCEPTION 'platform_admins está vacía: nadie podría ver los reportes completos'; END IF;
END $p$;

DO $a$ BEGIN
  IF strpos(pg_get_functiondef('public.llm_usage_report(timestamp with time zone, timestamp with time zone)'::regprocedure), '10d3617b-4bbe-49ba-b671-bc60982c1ab2') > 0 THEN
    EXECUTE $q$CREATE OR REPLACE FUNCTION public.llm_usage_report(_from timestamp with time zone, _to timestamp with time zone)
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
      EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
      OR (public.is_manager() AND l.company_id = public.current_company_id())
    )
  GROUP BY l.company_id, c.name, l.phase, l.model
  ORDER BY 1, 3;
$function$$q$;
  END IF;
  IF strpos(pg_get_functiondef('public.usage_cost_report(timestamp with time zone, timestamp with time zone)'::regprocedure), '10d3617b-4bbe-49ba-b671-bc60982c1ab2') > 0 THEN
    EXECUTE $q$CREATE OR REPLACE FUNCTION public.usage_cost_report(_from timestamp with time zone, _to timestamp with time zone)
 RETURNS TABLE(company_id uuid, company_name text, llm_calls bigint, llm_input_tokens bigint, llm_cached_tokens bigint, llm_output_tokens bigint, llm_usd numeric, tts_calls bigint, tts_characters bigint, tts_cache_hits bigint, tts_usd numeric, total_usd numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH allowed AS (
    SELECT c.id, c.name
    FROM public.companies c
    WHERE EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
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
$function$$q$;
  END IF;
END $a$;

DO $chk$ DECLARE f text; BEGIN
  FOREACH f IN ARRAY ARRAY['public.llm_usage_report(timestamp with time zone, timestamp with time zone)', 'public.usage_cost_report(timestamp with time zone, timestamp with time zone)'] LOOP
    IF strpos(pg_get_functiondef(f::regprocedure), '59940ac9') > 0 OR strpos(pg_get_functiondef(f::regprocedure), '10d3617b') > 0 OR strpos(pg_get_functiondef(f::regprocedure), '0672b476') > 0 THEN
      RAISE EXCEPTION 'la función % todavía tiene ids escritos a mano', f;
    END IF;
    IF strpos(pg_get_functiondef(f::regprocedure), 'pa.user_id = auth.uid()') = 0 THEN
      RAISE EXCEPTION 'la función % no quedó con platform_admins', f;
    END IF;
    IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = f::regprocedure) THEN RAISE EXCEPTION 'la función % perdió SECURITY DEFINER', f; END IF;
  END LOOP;
END $chk$;
