SELECT x.item, x.filas, md5(x.v) AS huella FROM (
  SELECT 'orden mundo 2' AS item, count(*) AS filas, string_agg(id || ':' || order_index, ',' ORDER BY order_index) AS v FROM public.nodes WHERE world_id = 2
  UNION ALL
  SELECT 'nodos nuevos', count(*), string_agg(concat_ws('|', id, world_id, name, technique, order_index, is_boss, reps_required, difficulty_level, description, node_type, engine_type, field_mission, tipo_cliente), '#' ORDER BY id) FROM public.nodes WHERE id IN ('2.7b','2.7c')
  UNION ALL
  SELECT 'guion 2.7c', count(practice_script), string_agg(practice_script::text, '') FROM public.nodes WHERE id = '2.7c'
  UNION ALL
  SELECT 'tarjetas 2.7b', count(*), string_agg(concat_ws('|', card_order, card_type, title, body, flip_back_text), '#' ORDER BY card_order) FROM public.node_cards WHERE node_id = '2.7b'
  UNION ALL
  SELECT 'tarjetas 2.7c', count(*), string_agg(concat_ws('|', card_order, card_type, title, body, flip_back_text), '#' ORDER BY card_order) FROM public.node_cards WHERE node_id = '2.7c'
  UNION ALL
  SELECT 'quiz 2.7b', count(*), string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong, regla_id), '#' ORDER BY question_order) FROM public.node_quiz_questions WHERE node_id = '2.7b'
  UNION ALL
  SELECT 'reglas nuevas', count(*), string_agg(concat_ws('|', id, paso, tipo, canal, procedencia, resumen, cita_cerebro, severidad_default), '#' ORDER BY id) FROM public.reglas WHERE id IN ('blocks.dos_no_seguidos','blocks.insistir_tras_dos_no')
  UNION ALL
  SELECT 'skill nuevo', count(*), string_agg(concat_ws('|', id, code, name, short_description, category, world_id_introduced, skill_type, status, regla_id), '#') FROM public.skills WHERE id = 'blocks.dos_no_seguidos'
  UNION ALL
  SELECT 'node_skills', count(*), string_agg(concat_ws('|', node_id, skill_id, relation, weight, is_primary), '#' ORDER BY node_id, skill_id) FROM public.node_skills WHERE node_id IN ('2.7b','2.7c')
) x ORDER BY x.item;
SELECT (SELECT count(DISTINCT p.seller_id) FROM public.node_progress p JOIN public.nodes n ON n.id = p.node_id WHERE p.status = 'done' AND (n.world_id > 2 OR p.node_id IN ('2.8','2.9','2.10'))) AS vendedores_despues_del_27,
       (SELECT count(*) FROM public.node_progress WHERE node_id IN ('2.7b','2.7c') AND status = 'done') AS completados_nuevos;
