-- Mensaje 182 · Verificación (después de doctrina_182_correr.sql, o del regreso).
SELECT 'cerebro' AS que, max(version)::text AS valor FROM public.doctrina WHERE is_active
UNION ALL SELECT 'secciones activas', count(*)::text FROM public.doctrina WHERE is_active
UNION ALL SELECT 'pasos', md5(body) FROM public.doctrina WHERE is_active AND section_key = 'pasos'
UNION ALL SELECT 'opening.pitch_prematuro', md5(resumen) FROM public.reglas WHERE id = 'opening.pitch_prematuro'
UNION ALL SELECT 'guía: huella', md5(string_agg(clave || '|' || titulo || '|' || texto, E'\n' ORDER BY orden)) FROM public.guia_del_vendedor WHERE activa
UNION ALL SELECT 'guion ' || id, (practice_script->>'version') || ' · ' || jsonb_array_length(practice_script->'failure_criteria') || ' fallas · ' || coalesce((SELECT md5(f::text) FROM jsonb_array_elements(practice_script->'failure_criteria') f WHERE f->>'id' = 'pitch_prematuro'), 'sin pitch_prematuro') FROM (SELECT * FROM public.nodes WHERE id IN ('2.7', '2.7c', '2.10') ORDER BY id) x;
