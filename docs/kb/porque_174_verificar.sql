-- Mensaje 174 · Verificación (correr después de porque_174_correr.sql).
SELECT 'mecanismos' AS que, count(*)::text AS valor FROM public.mecanismos
UNION ALL SELECT 'reglas con mecanismo', count(*)::text FROM public.reglas_mecanismo
UNION ALL SELECT 'va_despues', count(*)::text FROM public.va_despues
UNION ALL SELECT 'rls', string_agg(relname || ':' || relrowsecurity::text, ', ' ORDER BY relname) FROM pg_class WHERE oid IN ('public.mecanismos'::regclass, 'public.reglas_mecanismo'::regclass, 'public.va_despues'::regclass)
UNION ALL SELECT 'políticas', string_agg(tablename || ':' || cmd, ', ' ORDER BY tablename) FROM pg_policies WHERE schemaname='public' AND tablename IN ('mecanismos','reglas_mecanismo','va_despues')
UNION ALL SELECT 'authenticated puede escribir', bool_or(has_table_privilege('authenticated', t, 'INSERT') OR has_table_privilege('authenticated', t, 'UPDATE') OR has_table_privilege('authenticated', t, 'DELETE'))::text FROM unnest(ARRAY['public.mecanismos','public.reglas_mecanismo','public.va_despues']) AS t
UNION ALL SELECT 'huella del contenido', md5(
  (SELECT string_agg(id || '|' || nombre || '|' || porque, E'\n' ORDER BY id) FROM public.mecanismos) || E'\n#\n' ||
  (SELECT string_agg(regla_id || '|' || mecanismo_id, E'\n' ORDER BY regla_id COLLATE "C") FROM public.reglas_mecanismo) || E'\n#\n' ||
  (SELECT string_agg(regla_id || '|' || va_en || '|' || porque, E'\n' ORDER BY regla_id COLLATE "C") FROM public.va_despues));
