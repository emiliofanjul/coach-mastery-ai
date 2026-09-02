ALTER TABLE public.pitch_sections
  ADD COLUMN IF NOT EXISTS prompt_version text,
  ADD COLUMN IF NOT EXISTS is_stale boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stale_reason text;

CREATE OR REPLACE VIEW public.pitch_version_integrity
WITH (security_invoker = true) AS
SELECT
  p.id AS pitch_id,
  p.company_id,
  p.client_type,
  p.channel,
  p.status,
  count(s.id) AS sections,
  count(*) FILTER (WHERE s.prompt_version IS NULL) AS sections_sin_version,
  count(*) FILTER (WHERE s.is_stale) AS sections_desactualizadas,
  count(DISTINCT s.prompt_version) AS versiones_distintas,
  array_agg(DISTINCT coalesce(s.prompt_version, '(sin version)')) AS versiones
FROM public.company_pitches p
JOIN public.pitch_sections s ON s.pitch_id = p.id
GROUP BY p.id, p.company_id, p.client_type, p.channel, p.status
HAVING count(DISTINCT s.prompt_version) > 1
    OR count(*) FILTER (WHERE s.prompt_version IS NULL) > 0
    OR count(*) FILTER (WHERE s.is_stale) > 0;

GRANT SELECT ON public.pitch_version_integrity TO authenticated;
GRANT ALL ON public.pitch_version_integrity TO service_role;