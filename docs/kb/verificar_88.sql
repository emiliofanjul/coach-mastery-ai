SELECT x.item, x.filas, md5(x.v) AS huella FROM (
  SELECT 'tarjetas 1.0' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '1.0'
  UNION ALL
  SELECT 'tarjetas 1.1' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '1.1'
  UNION ALL
  SELECT 'tarjetas 1.2' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '1.2'
  UNION ALL
  SELECT 'tarjetas 1.3' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '1.3'
  UNION ALL
  SELECT 'tarjetas 1.4' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '1.4'
  UNION ALL
  SELECT 'tarjetas 1.5' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '1.5'
  UNION ALL
  SELECT 'tarjetas 1.6' AS item, count(*) AS filas, string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order) AS v FROM public.node_cards WHERE node_id = '1.6'
  UNION ALL
  SELECT 'quiz 1.0', count(*), string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order) FROM public.node_quiz_questions WHERE node_id = '1.0'
  UNION ALL
  SELECT 'quiz 1.1', count(*), string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order) FROM public.node_quiz_questions WHERE node_id = '1.1'
  UNION ALL
  SELECT 'quiz 1.3', count(*), string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order) FROM public.node_quiz_questions WHERE node_id = '1.3'
) x ORDER BY x.item;
