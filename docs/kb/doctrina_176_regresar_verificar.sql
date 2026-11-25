-- Mensaje 176 · Verificación del regreso: el Cerebro, la regla y los guiones como antes del 176, y la guía retirada (0 activas, 11 retiradas).
SELECT 'cerebro' AS que, max(version)::text AS valor FROM public.doctrina WHERE is_active
UNION ALL SELECT 'secciones activas', count(*)::text FROM public.doctrina WHERE is_active
UNION ALL SELECT 'pasos', md5(body) FROM public.doctrina WHERE is_active AND section_key = 'pasos'
UNION ALL SELECT 'opening.pitch_prematuro', md5(resumen) FROM public.reglas WHERE id = 'opening.pitch_prematuro'
UNION ALL SELECT 'guion ' || id, practice_script->>'version' FROM public.nodes WHERE id IN ('2.1', '2.2', '2.5', '2.8', '2.9', '2.10')
UNION ALL SELECT 'guía: partes activas', count(*)::text FROM public.guia_del_vendedor WHERE activa
UNION ALL SELECT 'guía: partes retiradas', count(*)::text FROM public.guia_del_vendedor WHERE NOT activa;
