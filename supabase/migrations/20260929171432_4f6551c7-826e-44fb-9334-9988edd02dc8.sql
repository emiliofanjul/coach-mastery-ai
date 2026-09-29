-- Doctrina de lenguaje (sept-2026): Closer nunca dice groserías; el vendedor
-- no las necesita. Primero al Cerebro, con las palabras de Emilio (versión
-- nueva completa, como siempre); de ahí al registro, con su cita verificada.
INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
SELECT (SELECT max(version) FROM public.doctrina WHERE is_active) + 1, section_key, order_index, title,
  CASE WHEN section_key = 'fundamento' THEN rtrim(body) || E'\n\n' || $esc$## 1.6 Sin groserías `CAMPO` `UNIVERSAL`

Closer no dice groserías, y el vendedor no las necesita. Las groserías no hacen falta para comunicar lo que quieres decir, y en la mayoría de las empresas le quitan profesionalidad al vendedor. Si el cliente las usa, no hace falta imitarlo para conectar: se conecta con interés genuino y con el sistema, no con el lenguaje.$esc$ ELSE body END,
  true, created_by
FROM public.doctrina WHERE version = (SELECT max(version) FROM public.doctrina WHERE is_active);

UPDATE public.doctrina SET is_active = false
WHERE is_active AND version < (SELECT max(version) FROM public.doctrina WHERE is_active);

INSERT INTO public.reglas (id, paso, tipo, canal, procedencia, resumen, cita_cerebro)
VALUES ('mindset.sin_groserias', 0, 'principio', 'universal', 'CAMPO', 'Closer no dice groserías y el vendedor no las necesita: no hacen falta para comunicar lo que quiere decir y, en la mayoría de las empresas, le quitan profesionalidad. Si el cliente las usa, no hay que imitarlo para conectar: se conecta con interés genuino y con el sistema, no con el lenguaje.', 'Las groserías no hacen falta para comunicar lo que quieres decir')
ON CONFLICT (id) DO UPDATE SET resumen = EXCLUDED.resumen, cita_cerebro = EXCLUDED.cita_cerebro, updated_at = now();

DO $$
DECLARE v int; n int;
BEGIN
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  SELECT count(*) INTO n FROM public.doctrina WHERE is_active;
  IF n <> 7 THEN RAISE EXCEPTION 'la versión % del Cerebro tiene % secciones activas, no 7', v, n; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.doctrina WHERE version = v AND section_key = 'fundamento' AND body LIKE '%## 1.6 Sin groserías%') THEN RAISE EXCEPTION 'el fundamento no recibió la sección 1.6'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.doctrina d, public.reglas r WHERE d.version = v AND r.id = 'mindset.sin_groserias' AND d.body LIKE '%' || r.cita_cerebro || '%') THEN RAISE EXCEPTION 'la cita de la regla no está en el Cerebro'; END IF;
END $$;
