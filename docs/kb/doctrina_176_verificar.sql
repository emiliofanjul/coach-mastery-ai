-- Mensaje 176 · Verificación (correr después de doctrina_176_estructura.sql y doctrina_176_datos.sql).
SELECT 'cerebro' AS que, max(version)::text AS valor FROM public.doctrina WHERE is_active
UNION ALL SELECT 'secciones activas', count(*)::text FROM public.doctrina WHERE is_active
UNION ALL SELECT 'pasos', md5(body) FROM public.doctrina WHERE is_active AND section_key = 'pasos'
UNION ALL SELECT 'opening.pitch_prematuro', md5(resumen) FROM public.reglas WHERE id = 'opening.pitch_prematuro'
UNION ALL SELECT 'guion ' || id, practice_script->>'version' FROM public.nodes WHERE id IN ('2.1', '2.2', '2.5', '2.8', '2.9', '2.10')
UNION ALL SELECT 'guía: partes activas', count(*)::text FROM public.guia_del_vendedor WHERE activa
UNION ALL SELECT 'guía: partes retiradas', count(*)::text FROM public.guia_del_vendedor WHERE NOT activa
UNION ALL SELECT 'guía: huella', md5(string_agg(clave || '|' || titulo || '|' || texto, E'\n' ORDER BY orden)) FROM public.guia_del_vendedor WHERE activa
UNION ALL SELECT 'guía: rls', relrowsecurity::text FROM pg_class WHERE oid = 'public.guia_del_vendedor'::regclass
UNION ALL SELECT 'guía: política', string_agg(policyname || ':' || cmd || ':' || qual, ', ') FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guia_del_vendedor'
UNION ALL SELECT 'guía: authenticated puede leer', has_table_privilege('authenticated','public.guia_del_vendedor','SELECT')::text
UNION ALL SELECT 'guía: authenticated puede escribir', (has_table_privilege('authenticated','public.guia_del_vendedor','INSERT') OR has_table_privilege('authenticated','public.guia_del_vendedor','UPDATE') OR has_table_privilege('authenticated','public.guia_del_vendedor','DELETE'))::text
UNION ALL SELECT 'guía: service_role puede leer', has_table_privilege('service_role','public.guia_del_vendedor','SELECT')::text;
