-- Mensaje 171 · Verificación (correr después de metas_171_correr.sql).
SELECT 'metas' AS que, count(*)::text AS valor FROM public.metas_practica
UNION ALL SELECT 'nodos con práctica sin meta', count(*)::text FROM public.nodes n
  WHERE n.practice_script IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.metas_practica m WHERE m.node_id = n.id)
UNION ALL SELECT 'rls', relrowsecurity::text FROM pg_class WHERE oid = 'public.metas_practica'::regclass
UNION ALL SELECT 'políticas', string_agg(policyname || ':' || cmd, ', ') FROM pg_policies WHERE schemaname='public' AND tablename='metas_practica'
UNION ALL SELECT 'authenticated puede escribir', (has_table_privilege('authenticated','public.metas_practica','INSERT') OR has_table_privilege('authenticated','public.metas_practica','UPDATE') OR has_table_privilege('authenticated','public.metas_practica','DELETE'))::text
UNION ALL SELECT 'huella del contenido', md5(string_agg(node_id || '|' || lo_que_buscamos || '|' || como_sabes, E'\n' ORDER BY node_id COLLATE "C")) FROM public.metas_practica;
