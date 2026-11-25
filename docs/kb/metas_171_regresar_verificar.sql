-- Mensaje 171 · Verificación del regreso.
SELECT 'metas_practica existe' AS que, (to_regclass('public.metas_practica') IS NOT NULL)::text AS valor;
