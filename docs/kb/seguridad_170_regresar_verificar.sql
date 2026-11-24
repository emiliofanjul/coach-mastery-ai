-- Mensaje 170 · Verificación del regreso, solo lectura. Correr aparte.
SELECT 'avanzar_nodo' AS que, count(*)::text AS valor FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='avanzar_nodo'
UNION ALL SELECT 'politicas node_progress', string_agg(policyname || ':' || cmd, ', ' ORDER BY policyname) FROM pg_policies WHERE schemaname='public' AND tablename='node_progress'
UNION ALL SELECT 'politicas practice_sessions', string_agg(policyname || ':' || cmd, ', ' ORDER BY policyname) FROM pg_policies WHERE schemaname='public' AND tablename='practice_sessions'
UNION ALL SELECT 'politicas audio', string_agg(policyname || ':' || cmd, ', ' ORDER BY policyname) FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname LIKE 'practice_audio%';
