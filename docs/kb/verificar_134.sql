-- Solo lectura. Tiene que salir: 19 | 3 | 3 | true | 4
SELECT
  (SELECT max(version) FROM public.doctrina WHERE is_active) AS version_cerebro,
  (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '4.5') AS quiz_4_5,
  (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '4.13') AS quiz_4_13,
  (SELECT order_index FROM public.nodes WHERE id = '4.12') < (SELECT order_index FROM public.nodes WHERE id = '4.11') AS tren_antes_de_asumir,
  (SELECT count(*) FROM public.reglas WHERE id IN ('present.balas','present.argumento_del_hueco','present.consolidacion_falsa','impulse.factores') AND updated_at > now() - interval '1 day') AS reglas_actualizadas;
