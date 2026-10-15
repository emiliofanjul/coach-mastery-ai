SELECT x.item, x.filas, md5(x.v) AS huella FROM (
  SELECT 'tarjetas 2.0' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '2.0'
  UNION ALL
  SELECT 'tarjetas 2.1' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '2.1'
  UNION ALL
  SELECT 'tarjetas 2.2' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '2.2'
  UNION ALL
  SELECT 'tarjetas 2.3' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '2.3'
  UNION ALL
  SELECT 'tarjetas 2.4' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '2.4'
  UNION ALL
  SELECT 'tarjetas 2.5' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '2.5'
  UNION ALL
  SELECT 'tarjetas 2.6' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '2.6'
  UNION ALL
  SELECT 'tarjetas 2.7' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '2.7'
  UNION ALL
  SELECT 'tarjetas 2.8' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '2.8'
  UNION ALL
  SELECT 'tarjetas 2.9' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '2.9'
  UNION ALL
  SELECT 'tarjetas 2.10' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '2.10'
  UNION ALL
  SELECT 'quiz 2.0', count(*), string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order) FROM public.node_quiz_questions WHERE node_id = '2.0'
  UNION ALL
  SELECT 'quiz 2.3', count(*), string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order) FROM public.node_quiz_questions WHERE node_id = '2.3'
  UNION ALL
  SELECT 'quiz 2.4', count(*), string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order) FROM public.node_quiz_questions WHERE node_id = '2.4'
  UNION ALL
  SELECT 'quiz 2.6', count(*), string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order) FROM public.node_quiz_questions WHERE node_id = '2.6'
  UNION ALL
  SELECT 'guion 2.7', 1, practice_script::text FROM public.nodes WHERE id = '2.7'
  UNION ALL
  SELECT 'guion 2.10', 1, practice_script::text FROM public.nodes WHERE id = '2.10'
) x ORDER BY x.item;
SELECT version AS cerebro_version, count(*) AS secciones, bool_or(body LIKE '%Dos no seguidos en la puerta%') AS tiene_dos_no, bool_or(body LIKE '%busca otro de los cinco%') AS tiene_texto_viejo FROM public.doctrina WHERE is_active GROUP BY version;
