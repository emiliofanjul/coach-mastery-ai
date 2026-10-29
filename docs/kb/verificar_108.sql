SELECT id, md5(concat_ws('|', paso, tipo, canal, procedencia, resumen, cita_cerebro, severidad_default)) AS huella FROM public.reglas WHERE id IN ('blocks.insistir_tras_dos_no','flow.dos_no_seguidos') ORDER BY id;
SELECT max(version) AS version_cerebro, count(*) AS secciones, md5(string_agg(body, '#' ORDER BY order_index)) AS huella_cerebro FROM public.doctrina WHERE is_active;
