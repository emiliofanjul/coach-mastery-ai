-- Mensaje 114 · Diagnóstico de llm_calls (solo lectura).
-- 1. Lo último guardado, por fase.
SELECT phase, max(created_at) AS ultimo, count(*) FILTER (WHERE created_at > now() - interval '7 days') AS ultimos_7_dias
FROM public.llm_calls GROUP BY phase ORDER BY ultimo DESC;
-- 2. ¿Hubo prácticas reales después del 29-oct a las 12:01? Si hay, debieron dejar llamadas.
SELECT date_trunc('day', created_at) AS dia, count(*) AS practicas
FROM public.seller_events WHERE created_at > '2026-10-28' GROUP BY 1 ORDER BY 1;
-- 3. Las columnas de llm_calls que no aceptan vacío (por si algo nuevo se volvió obligatorio).
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'llm_calls' ORDER BY ordinal_position;
-- 4. Triggers o restricciones sobre llm_calls.
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.llm_calls'::regclass;
SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.llm_calls'::regclass AND NOT tgisinternal;
