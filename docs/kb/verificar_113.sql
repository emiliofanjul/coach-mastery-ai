SELECT id, practice_script->>'version' AS version, md5(practice_script::text) AS huella FROM public.nodes WHERE id = '2.1';
SELECT id, md5(concat_ws('|', paso, tipo, canal, procedencia, resumen, cita_cerebro, severidad_default)) AS huella FROM public.reglas WHERE id IN ('story.kill','story.kill_curriculum') ORDER BY id;
