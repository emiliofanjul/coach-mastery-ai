SELECT x.item, md5(x.v) AS huella FROM (
  SELECT 'nodo ' || id AS item, practice_script::text AS v FROM public.nodes WHERE id IN ('1.6','2.8','2.10','3.10','4.16','5.8','5.12','5.15','7.0','7.2','7.4')
  UNION ALL SELECT 'datos 2.8', concat_ws('|', name, description, field_mission) FROM public.nodes WHERE id = '2.8'
  UNION ALL SELECT 'skill ' || id, concat_ws('|', code, name, short_description, category, world_id_introduced, skill_type, status, regla_id) FROM public.skills WHERE id IN ('blocks.mala_experiencia','impulse.factores_impulso','objections.reframe','blocks.pre_emptive_strike')
  UNION ALL SELECT 'regla ' || id, concat_ws('|', paso, tipo, canal, procedencia, resumen, cita_cerebro) FROM public.reglas WHERE id IN ('blocks.mala_experiencia_al_llegar','impulse.factores')
  UNION ALL SELECT 'tarjetas 2.8', string_agg(concat_ws('|', card_order, card_type, title, body), '#' ORDER BY card_order) FROM public.node_cards WHERE node_id = '2.8'
  UNION ALL SELECT 'node_skills', string_agg(node_id || ':' || skill_id || ':' || relation || ':' || is_primary, ',' ORDER BY node_id, skill_id) FROM public.node_skills WHERE node_id IN ('2.8','2.10','4.16','5.12','5.15','7.0')
) x ORDER BY x.item;
