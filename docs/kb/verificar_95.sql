SELECT id, practice_script->>'version' AS version, md5(practice_script::text) AS huella FROM public.nodes WHERE id IN ('1.4','1.6','2.7','2.7c','2.10','7.0') ORDER BY id;
SELECT id, md5(concat_ws('|', paso, tipo, canal, procedencia, resumen, cita_cerebro, severidad_default)) AS huella FROM public.reglas WHERE id IN ('blocks.air','opening.se_disculpa') ORDER BY id;
