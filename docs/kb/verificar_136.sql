-- Solo lectura. Tiene que salir: 20 | 3 | 3 | 3 | 3 | 3 | 1
SELECT
  (SELECT max(version) FROM public.doctrina WHERE is_active) AS version_cerebro,
  (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '5.2') AS quiz_5_2,
  (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '5.5') AS quiz_5_5,
  (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '5.7') AS quiz_5_7,
  (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '5.9') AS quiz_5_9,
  (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '5.11') AS quiz_5_11,
  (SELECT count(*) FROM public.reglas WHERE id = 'close.aguanta_silencio' AND updated_at > now() - interval '1 day') AS regla_actualizada;
