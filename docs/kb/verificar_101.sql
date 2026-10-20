SELECT id, practice_script->>'version' AS version, md5(practice_script::text) AS huella FROM public.nodes WHERE id IN ('3.8','3.9','3.9b','7.3') ORDER BY id;
SELECT id, md5(concat_ws('|', paso, tipo, canal, procedencia, resumen, cita_cerebro, severidad_default)) AS huella FROM public.reglas WHERE id = 'discovery.hueco';
