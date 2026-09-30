-- La práctica por texto viene APAGADA por omisión; el manager la prende si
-- quiere (decisión de Emilio, sept-2026). La columna se creó hace un momento
-- encendida; ningún manager la ha tocado todavía, así que se apaga en todas.
ALTER TABLE public.companies ALTER COLUMN permite_texto SET DEFAULT false;
UPDATE public.companies SET permite_texto = false WHERE permite_texto IS DISTINCT FROM false;

DO $$ BEGIN
  IF (SELECT column_default FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'permite_texto') <> 'false'
  THEN RAISE EXCEPTION 'el valor por omisión no quedó en false'; END IF;
  IF EXISTS (SELECT 1 FROM public.companies WHERE permite_texto) THEN RAISE EXCEPTION 'quedan empresas con texto encendido'; END IF;
END $$;
