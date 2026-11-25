-- Mensaje 176 · Verificación del regreso: debe dar lo de antes del 176.
SELECT 'cerebro' AS que, max(version)::text AS valor FROM public.doctrina WHERE is_active
UNION ALL SELECT 'secciones activas', count(*)::text FROM public.doctrina WHERE is_active
UNION ALL SELECT 'pasos', md5(body) FROM public.doctrina WHERE is_active AND section_key = 'pasos'
UNION ALL SELECT 'opening.pitch_prematuro', md5(resumen) FROM public.reglas WHERE id = 'opening.pitch_prematuro'
UNION ALL SELECT 'guion ' || id, practice_script->>'version' FROM public.nodes WHERE id IN ('2.1', '2.2', '2.5', '2.8', '2.9', '2.10')
UNION ALL SELECT 'guía existe', (to_regclass('public.guia_del_vendedor') IS NOT NULL)::text;
