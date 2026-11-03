SELECT id, practice_script->>'version' AS version, md5(practice_script::text) AS huella FROM public.nodes WHERE id = '7.3';
