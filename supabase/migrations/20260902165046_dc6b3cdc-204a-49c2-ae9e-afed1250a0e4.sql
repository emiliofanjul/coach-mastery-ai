ALTER TABLE public.company_pitches ADD COLUMN relationship text;

UPDATE public.company_pitches SET relationship = CASE
  WHEN client_type = 'recurrente' THEN 'recurrente'
  ELSE 'nuevo' END;

DROP INDEX IF EXISTS public.company_pitches_unique_active;
ALTER TABLE public.company_pitches DROP CONSTRAINT IF EXISTS company_pitches_client_type_check;

UPDATE public.company_pitches SET client_type = CASE
  WHEN client_type = 'autoconsumo' THEN 'consume'
  WHEN client_type = 'distribuidor' THEN 'distribuye'
  ELSE 'revende' END;

ALTER TABLE public.company_pitches ALTER COLUMN relationship SET NOT NULL;
ALTER TABLE public.company_pitches ALTER COLUMN relationship SET DEFAULT 'nuevo';
ALTER TABLE public.company_pitches ADD CONSTRAINT company_pitches_relationship_check
  CHECK (relationship = ANY (ARRAY['nuevo'::text, 'recurrente'::text]));
ALTER TABLE public.company_pitches ADD CONSTRAINT company_pitches_client_type_check
  CHECK (client_type = ANY (ARRAY['revende'::text, 'consume'::text, 'distribuye'::text]));

CREATE UNIQUE INDEX company_pitches_unique_active
  ON public.company_pitches (company_id, relationship, client_type, channel)
  WHERE status <> 'archived';