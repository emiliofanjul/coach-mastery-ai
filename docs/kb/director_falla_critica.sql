-- Mensaje 93 · MIGRACIÓN: el Director registra qué falla crítica vio y con qué frase, y si el código la descartó.
ALTER TABLE public.director_decisions ADD COLUMN IF NOT EXISTS falla_critica_id text;
ALTER TABLE public.director_decisions ADD COLUMN IF NOT EXISTS falla_critica_cita text;
ALTER TABLE public.director_decisions ADD COLUMN IF NOT EXISTS falla_critica_descartada boolean;
