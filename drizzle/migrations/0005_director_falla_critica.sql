ALTER TABLE public.director_decisions ADD COLUMN IF NOT EXISTS falla_critica_id text;
ALTER TABLE public.director_decisions ADD COLUMN IF NOT EXISTS falla_critica_cita text;
ALTER TABLE public.director_decisions ADD COLUMN IF NOT EXISTS falla_critica_descartada boolean;