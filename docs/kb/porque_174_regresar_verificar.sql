-- Mensaje 174 · Verificación del regreso.
SELECT 'quedan tablas del 174' AS que, (to_regclass('public.mecanismos') IS NOT NULL OR to_regclass('public.reglas_mecanismo') IS NOT NULL OR to_regclass('public.va_despues') IS NOT NULL)::text AS valor;
