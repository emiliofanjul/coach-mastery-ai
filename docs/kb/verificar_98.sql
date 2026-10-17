SELECT id, practice_script->>'version' AS version, md5(practice_script::text) AS huella FROM public.nodes WHERE id = '1.2';
SELECT c->>'id' AS falla, c->>'severity' AS severidad FROM public.v_nodes_resueltos v, jsonb_array_elements(v.practice_script_resuelto->'failure_criteria') c WHERE v.id = '1.2' ORDER BY 1;
