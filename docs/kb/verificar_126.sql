-- Solo lectura. Confirma que la tabla, su candado y su regla de lectura existen.
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evaluaciones_practica') AS tabla,
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.evaluaciones_practica'::regclass) AS candado_activo,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'evaluaciones_practica') AS reglas,
  has_table_privilege('authenticated', 'public.evaluaciones_practica', 'INSERT') AS vendedor_puede_escribir,
  has_table_privilege('anon', 'public.evaluaciones_practica', 'SELECT') AS anonimo_puede_leer;
