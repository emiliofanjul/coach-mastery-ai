-- Solo lectura.
SELECT id, name, practice_script->>'version' AS version, md5(practice_script::text) AS huella FROM public.nodes WHERE world_id = 5 ORDER BY length(id), id;
