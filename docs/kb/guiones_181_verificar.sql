-- Mensaje 181 · Verificación. Una fila por guion: versión, cuántas fallas tiene y el md5 de su pitch_prematuro (vacío si no tiene).
SELECT id AS guion, practice_script->>'version' AS version, jsonb_array_length(practice_script->'failure_criteria')::text AS fallas,
  coalesce((SELECT md5(f::text) FROM jsonb_array_elements(practice_script->'failure_criteria') f WHERE f->>'id' = 'pitch_prematuro'), '') AS pitch_prematuro
FROM public.nodes WHERE id IN ('2.7', '2.7c') ORDER BY id;
