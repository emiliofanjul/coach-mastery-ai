-- El manager decide si su equipo puede practicar por texto (sept-2026).
-- La voz es la práctica principal. Por omisión se permite, para no cambiarle
-- nada a ninguna empresa hasta que su manager lo decida.
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS permite_texto boolean NOT NULL DEFAULT true;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'permite_texto')
  THEN RAISE EXCEPTION 'no se creó la columna permite_texto'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' AND cmd IN ('UPDATE', 'ALL'))
  THEN RAISE EXCEPTION 'no hay política para que el manager actualice su empresa'; END IF;
END $$;
