SELECT id, md5(concat_ws('|', paso, tipo, canal, procedencia, resumen, cita_cerebro, severidad_default)) AS huella FROM public.reglas WHERE id = 'discovery.rrr';
