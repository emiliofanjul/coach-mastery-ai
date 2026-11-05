-- Mensaje 133 · Solo lectura. El contenido vigente del mundo 4, para compararlo con lo que tengo.
-- 1) Por nodo del mundo 4: tarjetas, preguntas del quiz y versión del guion, con su huella.
SELECT n.id AS nodo,
  (SELECT count(*) FROM public.node_cards c WHERE c.node_id = n.id) AS tarjetas,
  (SELECT md5(string_agg(concat_ws('|', c.card_order, coalesce(c.card_type,''), coalesce(c.title,''), coalesce(c.body,''), coalesce(c.flip_back_text,'')), '#' ORDER BY c.card_order)) FROM public.node_cards c WHERE c.node_id = n.id) AS huella_tarjetas,
  (SELECT count(*) FROM public.node_quiz_questions q WHERE q.node_id = n.id) AS preguntas,
  (SELECT md5(string_agg(concat_ws('|', q.question_order, coalesce(q.question_text,''), coalesce(q.option_a,''), coalesce(q.option_b,''), coalesce(q.option_c,''), coalesce(q.option_d,''), coalesce(q.correct_option::text,''), coalesce(q.explanation_correct,''), coalesce(q.explanation_wrong,''), coalesce(q.regla_id,'')), '#' ORDER BY q.question_order)) FROM public.node_quiz_questions q WHERE q.node_id = n.id) AS huella_quiz,
  n.practice_script->>'version' AS version_guion
FROM public.nodes n WHERE n.world_id = 4
ORDER BY n.world_id, length(n.id), n.id;

-- 2) Todas las lecciones (nodos sin práctica) de todos los mundos: cuántas preguntas de quiz tienen hoy.
SELECT n.id AS nodo, n.name, (SELECT count(*) FROM public.node_quiz_questions q WHERE q.node_id = n.id) AS preguntas
FROM public.nodes n
WHERE n.practice_script IS NULL OR jsonb_array_length(coalesce(n.practice_script->'success_criteria','[]'::jsonb)) = 0
ORDER BY n.world_id, length(n.id), n.id;
