-- Mensaje 170 · Verificación, solo lectura. Correr aparte, después de seguridad_170_correr.sql.
-- ───────────────────────── Verificación ─────────────────────────
SELECT 'avanzar_nodo' AS que, count(*)::text AS valor FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='avanzar_nodo'
UNION ALL SELECT 'politicas node_progress', string_agg(policyname || ':' || cmd, ', ' ORDER BY policyname) FROM pg_policies WHERE schemaname='public' AND tablename='node_progress'
UNION ALL SELECT 'politicas practice_sessions', string_agg(policyname || ':' || cmd, ', ' ORDER BY policyname) FROM pg_policies WHERE schemaname='public' AND tablename='practice_sessions'
UNION ALL SELECT 'politicas audio', string_agg(policyname || ':' || cmd, ', ' ORDER BY policyname) FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname LIKE 'practice_audio%'
UNION ALL SELECT 'tipos de audio', array_to_string(allowed_mime_types, ',') FROM storage.buckets WHERE id='practice-audio'
UNION ALL SELECT 'sufijo de prueba', public._gen_invite_suffix()
UNION ALL SELECT 'proteger certified_at', (strpos(pg_get_functiondef('public.proteger_campos_sensibles()'::regprocedure), 'certified_at') > 0)::text
UNION ALL SELECT 'apply con límite', (strpos(pg_get_functiondef('public.apply_invite_code(text)'::regprocedure), 'rate_limited') > 0)::text
UNION ALL SELECT 'join con límite', (strpos(pg_get_functiondef('public.join_company_with_code(text)'::regprocedure), 'rate_limited') > 0)::text;
