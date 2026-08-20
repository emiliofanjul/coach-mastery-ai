ALTER TABLE public.pitch_sections
  ADD COLUMN IF NOT EXISTS rationale_short text,
  ADD COLUMN IF NOT EXISTS rationale_long text,
  ADD COLUMN IF NOT EXISTS warning text;

UPDATE public.pitch_sections SET rationale_short = rationale WHERE rationale IS NOT NULL AND rationale_short IS NULL;

ALTER TABLE public.pitch_sections DROP COLUMN IF EXISTS rationale;

ALTER TABLE public.company_pitches
  ADD COLUMN IF NOT EXISTS missing_data jsonb NOT NULL DEFAULT '[]'::jsonb;