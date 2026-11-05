-- Solo lectura.
SELECT id, practice_script->>'version' AS version, md5(practice_script::text) AS huella FROM public.nodes WHERE id IN ('4.1','4.2','4.3','4.6','4.9','4.11','4.12','4.14','4.15','4.16','7.3') ORDER BY length(id), id;
