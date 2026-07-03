
CREATE OR REPLACE FUNCTION public.get_current_mastery(
  _mastery_score numeric,
  _last_practiced_at timestamptz
) RETURNS numeric
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _mastery_score IS NULL THEN 0
    WHEN _last_practiced_at IS NULL THEN _mastery_score
    ELSE GREATEST(
      0,
      _mastery_score - 0.5 * GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - _last_practiced_at)) / 86400)::int - 7)
    )
  END::numeric(5,2)
$$;

GRANT EXECUTE ON FUNCTION public.get_current_mastery(numeric, timestamptz) TO anon, authenticated, service_role;
