-- Solo lectura.
SELECT
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'evaluaciones_practica' AND column_name IN ('evento_id', 'error_evento')) AS columnas_nuevas,
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.fallas_app'::regclass) AS fallas_con_candado,
  has_table_privilege('authenticated', 'public.fallas_app', 'SELECT') AS vendedor_puede_leer_fallas,
  has_table_privilege('authenticated', 'public.fallas_app', 'INSERT') AS vendedor_puede_escribir_fallas,
  has_table_privilege('service_role', 'public.fallas_app', 'SELECT') AS servidor_puede_leer_fallas,
  (SELECT pg_get_constraintdef(oid) ILIKE '%regression_alert%' FROM pg_constraint WHERE conname = 'seller_events_event_type_check' AND conrelid = 'public.seller_events'::regclass) AS acepta_regression_alert,
  (SELECT count(*) FROM public.evaluaciones_practica e WHERE e.estado = 'lista' AND NOT EXISTS (
     SELECT 1 FROM public.seller_events s WHERE s.seller_id = e.seller_id AND s.event_type = 'practice_session' AND s.payload->>'practice_session_id' = e.practice_session_id::text)) AS calificadas_sin_historial,
  (SELECT count(*) FROM public.seller_events WHERE payload->>'registrado_por' = 'recuperado_mensaje_129') AS recuperadas;
