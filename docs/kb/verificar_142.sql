-- Solo lectura. Dos consultas.
-- 1) Tiene que salir: 22 | 3   — antes del 142: 21 | 0
SELECT (SELECT max(version) FROM public.doctrina WHERE is_active) AS version_cerebro,
       (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '6.1') AS quiz_6_1;
-- 2) El nombre del 6.0 y los guiones del mundo 6.
SELECT id, name, practice_script->>'version' AS version, md5(practice_script::text) AS huella
FROM public.nodes WHERE world_id = 6 ORDER BY id;
