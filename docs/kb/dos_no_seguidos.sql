-- Mensaje 90 · Nodos 2.7b «Dos No Seguidos» (tarjetas y quiz) y 2.7c «Dos No en Vivo» (práctica por voz). Decisión de Emilio, 15-oct-2026.
-- Todo se crea solo si no existe. Los chequeos del principio y del final abortan si algo no está como debe.

-- 0. Antes de tocar nada: el Cerebro vigente tiene las dos citas y el Mundo 2 está como se espera.
DO $pre$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.doctrina WHERE is_active AND strpos(body, $v$si haces AIR y el cliente repite el bloqueo de inmediato, ya son dos no seguidos$v$) > 0) THEN RAISE EXCEPTION 'el Cerebro vigente no tiene la cita de blocks.dos_no_seguidos'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.doctrina WHERE is_active AND strpos(body, $v$Insistir más ya no es seguridad: es terquedad$v$) > 0) THEN RAISE EXCEPTION 'el Cerebro vigente no tiene la cita de blocks.insistir_tras_dos_no'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.nodes WHERE id = '2.7b') AND (SELECT string_agg(id || ':' || order_index, ',' ORDER BY order_index) FROM public.nodes WHERE world_id = 2) IS DISTINCT FROM '2.0:0,2.1:1,2.2:2,2.3:3,2.4:4,2.5:5,2.6:6,2.7:7,2.8:8,2.9:9,2.10:10' THEN RAISE EXCEPTION 'el orden del Mundo 2 no es el esperado'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.skills WHERE id = 'blocks.air' AND status = 'active') THEN RAISE EXCEPTION 'falta el skill blocks.air'; END IF;
  IF EXISTS (SELECT 1 FROM public.skills WHERE code = 'S-072' AND id <> 'blocks.dos_no_seguidos') THEN RAISE EXCEPTION 'el código S-072 ya lo usa otro skill'; END IF;
END $pre$;

-- 1. Reglas nuevas (sus citas están en el Cerebro vigente).
INSERT INTO public.reglas (id, paso, tipo, canal, procedencia, resumen, cita_cerebro, severidad_default) VALUES ('blocks.dos_no_seguidos', 0, 'herramienta', 'universal', 'CAMPO', $v$Si haces AIR y el cliente repite el bloqueo de inmediato, son dos no seguidos: hoy no es el día. Se queda de regresar en otro momento, con una alternativa concreta, o se despide con amabilidad. Tienen que ser consecutivos.$v$, $v$si haces AIR y el cliente repite el bloqueo de inmediato, ya son dos no seguidos$v$, NULL) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.reglas (id, paso, tipo, canal, procedencia, resumen, cita_cerebro, severidad_default) VALUES ('blocks.insistir_tras_dos_no', 0, 'error', 'universal', 'CAMPO', $v$Seguir insistiendo después de dos no seguidos en la puerta: ya no es seguridad, es terquedad.$v$, $v$Insistir más ya no es seguridad: es terquedad$v$, 'critical') ON CONFLICT (id) DO NOTHING;

-- 2. Skill nuevo, ligado a su regla.
INSERT INTO public.skills (id, code, name, short_description, category, world_id_introduced, skill_type, decay_half_life_days, requires_audio, status, regla_id) VALUES ('blocks.dos_no_seguidos', 'S-072', $v$Dos No Seguidos$v$, $v$Si el cliente repite el bloqueo justo después de tu AIR, no insistes: quedas de regresar otro día o te despides con amabilidad.$v$, 'blocks', 2, 'tecnica', 180, false, 'active', 'blocks.dos_no_seguidos') ON CONFLICT (id) DO NOTHING;

-- 3. Los dos nodos, justo después del 2.7. El 2.8, el 2.9 y el boss se recorren dos lugares.
DO $nod$ BEGIN
  IF EXISTS (SELECT 1 FROM public.nodes WHERE id = '2.7b') THEN RAISE NOTICE 'Los nodos 2.7b y 2.7c ya existen: no se tocan.'; RETURN; END IF;
  UPDATE public.nodes SET order_index = 12 WHERE id = '2.10' AND order_index = 10;
  UPDATE public.nodes SET order_index = 11 WHERE id = '2.9' AND order_index = 9;
  UPDATE public.nodes SET order_index = 10 WHERE id = '2.8' AND order_index = 8;
  INSERT INTO public.nodes (id, world_id, name, technique, order_index, is_boss, reps_required, difficulty_level, description, node_type, engine_type, field_mission, tipo_cliente) VALUES ('2.7b', 2, $v$Dos No Seguidos$v$, 'dos_no_seguidos', 8, false, 1, 1, $v$Ya sabes pasar un bloqueo con AIR. ¿Y si el cliente te lo repite? Aquí aprendes cuándo ya no insistir.$v$, 'knowledge', 'none', NULL, 'nuevo');
  INSERT INTO public.nodes (id, world_id, name, technique, order_index, is_boss, reps_required, difficulty_level, description, node_type, engine_type, field_mission, tipo_cliente) VALUES ('2.7c', 2, $v$Dos No en Vivo$v$, 'dos_no_seguidos', 9, false, 2, 2, $v$Ya sabes qué hacer con dos «no» seguidos. Ahora hazlo.$v$, 'skill_drill', 'claude', $v$TU MISION: te van a bloquear dos veces seguidas. Al primero, AIR: acéptalo, no lo pelees y sigue con lo tuyo. Al segundo, no insistas: queda de regresar otro día o despídete con amabilidad.$v$, 'nuevo');
END $nod$;

-- 4. Qué enseña y qué practica cada nodo (el guion del 2.7c lo exige antes de guardarse).
INSERT INTO public.node_skills (node_id, skill_id, relation, weight, is_primary) VALUES ('2.7b', 'blocks.dos_no_seguidos', 'introduces', 1.0, true) ON CONFLICT (node_id, skill_id) DO NOTHING;
INSERT INTO public.node_skills (node_id, skill_id, relation, weight, is_primary) VALUES ('2.7c', 'blocks.dos_no_seguidos', 'practices', 1.0, true) ON CONFLICT (node_id, skill_id) DO NOTHING;
INSERT INTO public.node_skills (node_id, skill_id, relation, weight, is_primary) VALUES ('2.7c', 'blocks.air', 'practices', 1.0, false) ON CONFLICT (node_id, skill_id) DO NOTHING;

-- 5. El guion de la práctica por voz (lo revisa el trigger validar_practice_script).
UPDATE public.nodes SET practice_script = $g${"notes": "v1.0.0 Dos no seguidos en la puerta (Emilio, 15-oct-2026). El primer bloqueo se pasa con AIR; el segundo, seguido, ya es un hoy no: se queda de regresar o se despide con amabilidad. El espejo ensena: si insiste, el cliente se cierra; si se va bien, queda la puerta abierta.", "scope": {"skills_in_focus": ["blocks.air", "blocks.dos_no_seguidos"], "out_of_scope_behavior": "redirect"}, "limits": {"max_turns": 5, "max_duration_seconds": 180, "min_turns_before_evaluation": 3}, "phases": {"i_do": {"briefing": "Me van a bloquear dos veces seguidas.\n\nAl primero le hago AIR: lo acepto, no lo discuto y sigo con lo mio.\n\nAl segundo ya no insisto: hoy no es el dia. Quedo de regresar, con dos opciones de dia, o me despido con amabilidad.", "first_message": "Claro, se ve que hoy esta a tope. Le queda mejor que pase el jueves o el viernes en la manana?"}, "you_do": {"prompt": "REGLA NUMERO CERO, POR ENCIMA DE TODO LO DEMAS: en esta conversacion NO EXISTE el tema de que vende este senor, que trae, a que viene, ni en que te puede servir. Jamas preguntas eso. Ni con esas palabras ni con ninguna otra. Prohibidas de forma absoluta las frases: que se le ofrece, que necesita, que anda buscando, a que viene, que trae, de que se trata, en que le puedo servir, y cualquier variante. Tu no sabes que es vendedor y no te interesa averiguarlo. Si el menciona por su cuenta un producto o una marca, contestas ah orale y sigues con lo tuyo sin preguntar nada. Si te quedas sin saber que decir, hablas de tu propio negocio o del dia, nunca de el.\n\nEres el encargado de un negocio y hoy de verdad andas a tope. En tu PRIMERA respuesta, sin importar lo que diga el vendedor, sueltas un bloqueo de reflejo, con naturalidad y sin agresion: ahorita ando ocupado / no me interesa, gracias / no estoy comprando nada. DESPUES REACCIONAS ASI: 1) Si el vendedor ACEPTA tu bloqueo sin pelearlo y sigue con su tema (hace AIR), en tu SEGUNDA respuesta repites el bloqueo de inmediato, mas firme pero amable, porque hoy de verdad no puedes: de verdad, ahorita no puedo, ando a tope. 2) Si despues de ese segundo bloqueo el vendedor queda de regresar otro dia o se despide con amabilidad, aceptas con gusto y te despides bien (si, el jueves esta bien, pasele), y ahi termina. 3) Si despues del segundo bloqueo el vendedor SIGUE insistiendo (nomas un minutito, dejeme le explico, vuelve a preguntar de su tema), te molestas: contestas seco y lo despachas. 4) Si el vendedor DISCUTE tu primer bloqueo o intenta convencerte de que si te interesa, te cierras de verdad y lo despachas. 5) Si el vendedor se disculpa o se va con el primer bloqueo, lo dejas ir sin insistir. NUNCA cambias de opinion despues del segundo bloqueo: hoy no puedes. Responde en 1 o 2 frases.", "objective": "El vendedor pasa el primer bloqueo con AIR y, ante el segundo bloqueo seguido, no insiste: queda de regresar en otro momento o se despide con amabilidad. El scope se cubre cuando el vendedor ya respondio al segundo bloqueo."}, "closing": {"message": "Eso es leer bien el momento. Pasaste el primer no con AIR, y al segundo no insististe: te fuiste bien y la puerta queda abierta para la siguiente visita. Vamos al detalle.", "message_incomplete": "Ahi lo dejamos. Vamos al desglose y te digo como quedaron esos dos no."}}, "version": "1.0.0", "i_do_type": "demo", "failure_criteria": [{"id": "insiste_tras_dos", "regla_id": "blocks.insistir_tras_dos_no", "severity": "critical", "description": "Despues del segundo bloqueo seguido sigue insistiendo: pide un minutito, vuelve a su tema o trata de convencerlo. Ya no es seguridad, es terquedad, y el cliente lo recibe cerrado la proxima vez."}, {"id": "discute_el_bloqueo", "regla_id": "blocks.discute_bloqueo", "severity": "critical", "description": "Intenta convencer al cliente de que si le interesa o de que si tiene tiempo. Convierte un reflejo en una posicion, y ahora si tiene un no de verdad enfrente."}, {"id": "se_va_al_primero", "regla_id": "discovery.suelta_amarrado", "severity": "critical", "description": "Ante el PRIMER bloqueo se disculpa, se despide o promete volver despues, sin intentar AIR. Se rindio ante un reflejo que no significaba nada. Quedar de regresar es correcto solo despues del segundo bloqueo seguido.", "severity_override": {"razon": "escalada: habilidad espejo del nodo", "default": "major"}}, {"id": "pide_permiso_de_nuevo", "regla_id": "blocks.air_sin_resume", "severity": "major", "description": "Acepta el primer bloqueo pero despues pide autorizacion para seguir. Le devuelve el control al cliente justo despues de haberlo recuperado."}, {"id": "se_va_con_disculpa", "regla_id": "opening.pide_permiso", "severity": "minor", "description": "Se despide despues del segundo bloqueo, pero pidiendo perdon por haberlo molestado (perdon por quitarle su tiempo, disculpe la molestia). Se hace menos: trae algo que le puede servir y no tiene por que disculparse.", "severity_override": {"razon": "incidental: fuera del foco del nodo", "default": "critical"}}], "success_criteria": [{"id": "blocks.air", "weight": 0.4, "regla_id": "blocks.air", "description": "Pasa el PRIMER bloqueo con los tres movimientos: lo ACEPTA con un entiendo, claro que si o por supuesto; NO lo discute ni se justifica; y RETOMA su tema con naturalidad, sin pedir permiso otra vez."}, {"id": "blocks.dos_no_seguidos", "weight": 0.6, "regla_id": "blocks.dos_no_seguidos", "description": "Ante el SEGUNDO bloqueo seguido, no insiste: queda de regresar en otro momento (mejor con dos opciones de dia, como jueves o viernes) o se despide con amabilidad. Cualquiera de las dos cumple. Si sigue insistiendo, no cumple."}]}$g$::jsonb WHERE id = '2.7c' AND practice_script IS NULL;

-- 6. Tarjetas. Copian el formato de las tarjetas del 2.7.
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '2.7b', 1, 'concept', $v$Cuando el cliente repite el bloqueo$v$, $v$Llegas y el cliente te dice: "Ahorita ando ocupado".

Haces AIR: "Claro que sí, entiendo. Oiga, ¿y cuánto tiempo lleva con el negocio?".

Y te contesta: "De verdad, ahorita no puedo".

Ese segundo "no" ya no es por costumbre. Hoy de verdad no es buen momento.$v$, NULL, card_content_type, audience, CASE WHEN cardinality(skill_ids) > 0 THEN ARRAY['blocks.dos_no_seguidos'] ELSE '{}'::text[] END FROM public.node_cards
  WHERE node_id = '2.7' AND card_order = 1 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '2.7b' AND card_order = 1);
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '2.7b', 2, 'concept', $v$Dos "no" seguidos: hoy no es el día$v$, $v$Al primer "no", haces AIR.

Si te dice otro "no" justo después, ya no insistes. Con ese cliente, hoy no es el día.

No es un fracaso: es leer bien el momento.

Recuerda que tienen que ser seguidos. Si entre uno y otro la plática avanzó, el primero ya quedó atrás.$v$, NULL, card_content_type, audience, CASE WHEN cardinality(skill_ids) > 0 THEN ARRAY['blocks.dos_no_seguidos'] ELSE '{}'::text[] END FROM public.node_cards
  WHERE node_id = '2.7' AND card_order = 1 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '2.7b' AND card_order = 2);
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '2.7b', 3, 'concept', $v$Quedas de regresar, o te despides bien$v$, $v$Tienes dos buenas salidas:

1. Quedar de regresar, con dos opciones de día: "¿Le queda mejor que pase el jueves o el viernes?".
2. Despedirte con amabilidad: "Claro, no le quito más tiempo. Que tenga buen día".

Las dos dejan la puerta abierta para la siguiente visita.$v$, NULL, card_content_type, audience, CASE WHEN cardinality(skill_ids) > 0 THEN ARRAY['blocks.dos_no_seguidos'] ELSE '{}'::text[] END FROM public.node_cards
  WHERE node_id = '2.7' AND card_order = 1 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '2.7b' AND card_order = 3);
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '2.7b', 4, 'why_it_works', $v$Si insistes, te vuelves terco$v$, $v$Insistir después de dos "no" seguidos ya no es seguridad. El cliente siente que no lo escuchas.

Y la próxima vez que te vea, te va a recibir cerrado.

Si hoy te vas bien, la puerta queda abierta.$v$, NULL, card_content_type, audience, CASE WHEN cardinality(skill_ids) > 0 THEN ARRAY['blocks.dos_no_seguidos'] ELSE '{}'::text[] END FROM public.node_cards
  WHERE node_id = '2.7' AND card_order = 1 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '2.7b' AND card_order = 4);
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '2.7c', 1, 'concept', $v$Lo que vas a practicar$v$, $v$El cliente te va a poner un bloqueo. Pásalo con AIR.

Luego te va a poner otro, justo después. Ahí ya no insistes: quedas de regresar en otro momento, o te despides con amabilidad.

Esto pasa todos los días en la calle. Aquí lo practicas para que te salga natural.$v$, NULL, card_content_type, audience, CASE WHEN cardinality(skill_ids) > 0 THEN ARRAY['blocks.dos_no_seguidos'] ELSE '{}'::text[] END FROM public.node_cards
  WHERE node_id = '2.7' AND card_order = 1 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '2.7c' AND card_order = 1);
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '2.7c', 2, 'bad_example', NULL, $v$Ándele, nomás un minutito. Le prometo que no se va a arrepentir…$v$, $v$El cliente ya le dijo dos veces que no, seguidas, y el vendedor siguió insistiendo.

Ya no es seguridad: es terquedad. El cliente se va a acordar de eso la próxima vez.$v$, card_content_type, audience, CASE WHEN cardinality(skill_ids) > 0 THEN ARRAY['blocks.dos_no_seguidos'] ELSE '{}'::text[] END FROM public.node_cards
  WHERE node_id = '2.7' AND card_order = 1 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '2.7c' AND card_order = 2);
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '2.7c', 3, 'good_example', NULL, $v$Claro, se ve que hoy está a tope. ¿Le queda mejor que pase el jueves o el viernes en la mañana?$v$, $v$Reconoce el momento, no insiste y deja la siguiente visita amarrada con dos opciones de día.

Sin pedir perdón y sin pelear.$v$, card_content_type, audience, CASE WHEN cardinality(skill_ids) > 0 THEN ARRAY['blocks.dos_no_seguidos'] ELSE '{}'::text[] END FROM public.node_cards
  WHERE node_id = '2.7' AND card_order = 1 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '2.7c' AND card_order = 3);

-- 7. Quiz del 2.7b.
INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong, regla_id)
  SELECT '2.7b', 1, $v$Haces AIR y el cliente te dice otra vez: "De verdad, ahorita no puedo". ¿Qué haces?$v$, $v$Insisto con otra pregunta: a la tercera me escucha.$v$, $v$Le pido perdón por haberlo molestado y me voy.$v$, $v$Quedo de regresar: "¿Le queda mejor que pase el jueves o el viernes?"$v$, 'C', $v$Exacto. Son dos "no" seguidos: hoy no es el día. Quedas de regresar y la puerta queda abierta.$v$, $v$Insistir te vuelve terco, y pedir perdón te hace menos. Son dos "no" seguidos: quedas de regresar o te despides con amabilidad.$v$, 'blocks.dos_no_seguidos' WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '2.7b' AND question_order = 1);
INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong, regla_id)
  SELECT '2.7b', 2, $v$El cliente te dice "ahorita ando ocupado", haces AIR y te platica de su negocio. Más adelante te dice "no sé, ahorita no". ¿Son dos "no" seguidos?$v$, $v$Sí, ya son dos: me despido.$v$, $v$No: entre uno y otro la plática avanzó.$v$, $v$Sí, porque los dos son bloqueos.$v$, 'B', $v$Así es. La plática avanzó entre uno y otro, así que el primero ya quedó atrás. Sigues con la plática.$v$, $v$Tienen que ser seguidos. Aquí la plática avanzó entre uno y otro, así que el primero ya quedó atrás.$v$, 'blocks.dos_no_seguidos' WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '2.7b' AND question_order = 2);
INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong, regla_id)
  SELECT '2.7b', 3, $v$¿Por qué no conviene insistir después de dos "no" seguidos?$v$, $v$Porque te vuelves terco, y la próxima vez el cliente te recibe cerrado.$v$, $v$Porque se te acaba el tiempo de la visita.$v$, $v$Porque nunca se debe insistir con un cliente.$v$, 'A', $v$Exacto. Si hoy te vas bien, la puerta queda abierta para la siguiente visita.$v$, $v$Al primer "no" sí sigues, con AIR. Lo que no conviene es insistir después de dos seguidos: te vuelves terco y la próxima vez te recibe cerrado.$v$, 'blocks.insistir_tras_dos_no' WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '2.7b' AND question_order = 3);

-- 8. Quien ya completó algo después del 2.7 no regresa: los dos nodos le quedan completados, sin estrellas, y los puede practicar cuando quiera.
INSERT INTO public.node_progress (seller_id, company_id, node_id, status, stars)
SELECT v.seller_id, v.company_id, x.node_id, 'done', 0
FROM (SELECT DISTINCT ON (p.seller_id) p.seller_id, p.company_id FROM public.node_progress p JOIN public.nodes n ON n.id = p.node_id
      WHERE p.status = 'done' AND (n.world_id > 2 OR p.node_id IN ('2.8','2.9','2.10')) ORDER BY p.seller_id, p.created_at) v
CROSS JOIN (VALUES ('2.7b'), ('2.7c')) x(node_id)
WHERE NOT EXISTS (SELECT 1 FROM public.node_progress q WHERE q.seller_id = v.seller_id AND q.node_id = x.node_id);

-- 9. Chequeo final: si algo no quedó, se aborta todo.
DO $chk$ DECLARE n int; BEGIN
  IF (SELECT string_agg(id || ':' || order_index, ',' ORDER BY order_index) FROM public.nodes WHERE world_id = 2) IS DISTINCT FROM '2.0:0,2.1:1,2.2:2,2.3:3,2.4:4,2.5:5,2.6:6,2.7:7,2.7b:8,2.7c:9,2.8:10,2.9:11,2.10:12' THEN RAISE EXCEPTION 'el orden del Mundo 2 no quedó'; END IF;
  IF (SELECT md5(practice_script::text) FROM public.nodes WHERE id = '2.7c') IS DISTINCT FROM '1c24425bb61aeb274ae71bc743f97f06' THEN RAISE EXCEPTION 'el guion del 2.7c no quedó'; END IF;
  IF (SELECT count(*) FROM public.node_cards WHERE node_id = '2.7b') <> 4 OR (SELECT count(*) FROM public.node_cards WHERE node_id = '2.7c') <> 3 THEN RAISE EXCEPTION 'las tarjetas no quedaron'; END IF;
  IF (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '2.7b') <> 3 THEN RAISE EXCEPTION 'el quiz del 2.7b no quedó'; END IF;
  IF (SELECT count(*) FROM public.node_skills WHERE node_id IN ('2.7b','2.7c')) <> 3 THEN RAISE EXCEPTION 'las habilidades de los nodos no quedaron'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.skills WHERE id = 'blocks.dos_no_seguidos' AND status = 'active' AND regla_id = 'blocks.dos_no_seguidos' AND world_id_introduced = 2) THEN RAISE EXCEPTION 'el skill no quedó'; END IF;
  SELECT count(*) INTO n FROM public.reglas r WHERE r.id IN ('blocks.dos_no_seguidos','blocks.insistir_tras_dos_no') AND EXISTS (SELECT 1 FROM public.doctrina d WHERE d.is_active AND strpos(d.body, r.cita_cerebro) > 0);
  IF n <> 2 THEN RAISE EXCEPTION 'las reglas nuevas no quedaron con su cita'; END IF;
  -- Nadie que ya iba después del 2.7 quedó con esos nodos pendientes.
  SELECT count(*) INTO n FROM (SELECT DISTINCT p.seller_id FROM public.node_progress p JOIN public.nodes nn ON nn.id = p.node_id WHERE p.status = 'done' AND (nn.world_id > 2 OR p.node_id IN ('2.8','2.9','2.10'))) v
   WHERE (SELECT count(*) FROM public.node_progress q WHERE q.seller_id = v.seller_id AND q.node_id IN ('2.7b','2.7c') AND q.status = 'done') <> 2;
  IF n > 0 THEN RAISE EXCEPTION '% vendedores quedarían regresados', n; END IF;
END $chk$;
