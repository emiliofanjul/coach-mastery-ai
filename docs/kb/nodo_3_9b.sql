-- Nodo nuevo 3.9b: "El Cliente que Llega Pidiendo" (oct-2026, decisión de Emilio).
-- Gemelo del 3.9 con un cliente NUEVO de luz verde, que pide algo en cuanto
-- sabe quién eres. Va justo después del 3.9 y antes del BOSS 3.10.
-- Y desde ahora, el tipo de cliente que declara un nodo manda siempre: los
-- nodos de cliente recurrente son con cliente recurrente para todas las
-- empresas (todo cliente nuevo se vuelve recurrente en la siguiente visita).

-- 0. El hueco tiene su propia regla (Cerebro: "algo que podría comprarte y no te compra"). Antes, en 3.8, 3.9
--    y 7.3, el criterio del hueco colgaba de la regla de "leer el lugar": dos
--    conceptos en una regla. Primero la regla, luego los nodos, luego el nuevo.
INSERT INTO public.reglas (id, paso, tipo, canal, procedencia, resumen, cita_cerebro)
VALUES ('discovery.hueco', 3, 'concepto', 'universal', 'CAMPO', 'El hueco es algo que el cliente podría comprarte y no te compra: una familia que le compra a otro proveedor, o una que le piden y no maneja. No tiene señal verbal: se ve o se pregunta. Identificarlo es nombrarlo en la conversación, no solo preguntar. Tiene que ser real y verificable.', 'algo que podría comprarte y no te compra')
ON CONFLICT (id) DO UPDATE SET resumen = EXCLUDED.resumen, cita_cerebro = EXCLUDED.cita_cerebro, updated_at = now();

CREATE OR REPLACE FUNCTION pg_temp.regla_hueco(ps jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE c jsonb; out jsonb := '[]'::jsonb;
BEGIN
  FOR c IN SELECT * FROM jsonb_array_elements(ps->'success_criteria') LOOP
    IF c->>'id' = 'discovery.hueco' THEN c := jsonb_set(c, '{regla_id}', '"discovery.hueco"'); END IF;
    out := out || jsonb_build_array(c);
  END LOOP;
  RETURN jsonb_set(ps, '{success_criteria}', out);
END $$;
UPDATE public.nodes SET practice_script = pg_temp.regla_hueco(practice_script) WHERE id IN ('3.8', '3.9', '7.3');
UPDATE public.skills SET regla_id = 'discovery.hueco' WHERE id = 'discovery.hueco';

-- 1. Hacer lugar: todos los nodos después del 3.9 se recorren un lugar.
UPDATE public.nodes SET order_index = order_index + 1
WHERE order_index > (SELECT order_index FROM public.nodes WHERE id = '3.9')
  AND world_id = 3
  AND NOT EXISTS (SELECT 1 FROM public.nodes WHERE id = '3.9b');  -- solo la primera vez

-- 2. El nodo: copia todas las columnas del 3.9 y cambia lo que es suyo.
INSERT INTO public.nodes
SELECT (jsonb_populate_record(NULL::public.nodes, to_jsonb(n) || jsonb_build_object(
  'id', '3.9b',
  'name', 'El Cliente que Llega Pidiendo',
  'description', 'Un cliente nuevo de luz verde te pide algo en cuanto sabe quién eres. Tómale el pedido, y descubre qué más puede comprarte desde la primera visita.',
  'order_index', n.order_index + 1,
  'is_boss', false,
  'tipo_cliente', 'nuevo',
  'field_mission', 'En tu próxima visita a un cliente nuevo que te pida algo solo, tómale el pedido y antes de irte pregúntale qué otras líneas maneja y con quién.',
  'practice_script', '{"notes": "v1.0.0 Nodo nuevo (oct-2026, Emilio): gemelo del 3.9 con un cliente NUEVO de luz verde, que pide algo en cuanto sabe quién eres. Misma falla espejo: tomar lo que te pidió y salir. Lo que te pidió es la puerta, no el techo.", "scope": {"skills_in_focus": ["discovery.hueco", "discovery.lee_el_lugar", "impulse.efecto_jones"], "out_of_scope_behavior": "redirect"}, "limits": {"max_turns": 14, "max_duration_seconds": 280, "min_turns_before_evaluation": 3}, "phases": {"i_do": {"briefing": "Este cliente es nuevo y es luz verde: en cuanto supo quién soy, me pidió algo.\n\nLa tentación es anotar y salir corriendo con el pedido. No. Primero se lo tomo, sin ponerlo en duda, porque me da pie. Pero no me voy ahí.\n\nMapeo lo que maneja. Pregunto por lo que le piden y no tiene. Y anclo en negocios como el suyo. Lo que me pidió es la puerta, no el techo.", "first_message": "Perfecto, se lo anoto.\n\nOiga, y ya que ando por acá — aparte de esto que me pidió, ¿qué otras líneas maneja?\n\nÉl: (me dice cuáles, y con quién)\n\nY de lo que le llega a pedir la gente, ¿hay algo que no tenga y termine mandando a otro lado?\n\nÉl: (ahí sale la demanda que está perdiendo)\n\nMire, y le comento: varios negocios como el suyo por acá también nos mueven esa línea. ¿Usted eso lo llega a manejar o lo deja pasar?"}, "you_do": {"prompt": "REGLA NUMERO CERO: eres un cliente NUEVO, contento, de LUZ VERDE, sin ningún problema. Si te preguntan si algo anda mal, contestas con sinceridad que no. NO inventes dolores.\n\nEs la PRIMERA vez que este vendedor te visita: no lo conoces ni a él ni a su empresa. Nunca hables de ''lo de siempre'', de ''la vez pasada'' ni de algo que ya le compres. Adopta el tipo de negocio y las familias de producto del contexto de la empresa.\n\nEN CUANTO EL VENDEDOR TE DICE QUIÉN ES O QUÉ TRAE, le pides UNA cosa concreta de lo que él maneja, con cantidad, porque justo se te está acabando: ''¿Ustedes traen X? Qué bueno, porque ya se me está acabando. Tráigame tantas.'' Con gusto y sin rodeos. Si todavía no te dijo qué trae, se lo preguntas tú: ''¿Y usted qué maneja?''.\n\nTU CATÁLOGO: manejas varias familias. La que le acabas de pedir se te está acabando. Otras 2 se las compras a OTRO proveedor desde hace años. Y hay 1 que tus clientes te piden y tú no manejas, así que los mandas a otro lado.\n\nCOMO REACCIONAS:\n\nSI EL VENDEDOR SOLO TE TOMA EL PEDIDO y se despide: le agradeces, quedas contento, y la visita termina bien. NO le ofreces nada más, NO le insinúas que hay más, y NO te molestas. Este es el caso importante: todo sale bien y el vendedor nunca se entera de nada.\n\nSI TE PREGUNTA POR TU CATÁLOGO: le dices con naturalidad qué familias manejas y con quién las traes. Nunca digas que le compras algo a él: solo le acabas de pedir una cosa. SI TE PREGUNTA POR LO QUE TE PIDEN Y NO TIENES: se lo cuentas sin problema.\n\nSI TE ANCLA EN OTROS NEGOCIOS (varios negocios como el suyo mueven tal cosa): te da curiosidad genuina y preguntas más — cuánto se mueve, quién lo trae, cómo les va. Ahí tu interés SUBE de forma visible.\n\nSI TE INVENTA UNA NECESIDAD que no tienes: te extrañas y lo corriges con calma. Eso no lo manejo ni me lo piden.\n\nResponde en 1 o 2 frases, natural.\n\nREGLA DE OPCIONES SUGERIDAS: si el vendedor hace una pregunta y ADEMÁS te avienta tres o cuatro opciones concretas, contestas de inmediato con un dato ESPECÍFICO — o eliges una de sus opciones, o lo corriges con el producto o la cifra real. Si te hace una pregunta abierta sin opciones y no tienes el dato a la mano, SÍ puedes contestar vago.", "objective": "El vendedor le toma el pedido al cliente nuevo que llegó pidiendo y ADEMÁS descubre al menos un hueco concreto usando las herramientas: mapear el catálogo, preguntar por lo que le piden y no tiene, o anclar en negocios similares. El scope se cubre cuando el vendedor identifica un espacio real y el cliente lo confirma."}, "closing": {"message": "Ahí está la diferencia. El cliente te pidió solo, y tú no te conformaste con lo que te pidió: desde la primera visita saliste sabiendo qué más puede comprarte. Vamos al detalle.", "message_incomplete": "Ahí lo dejamos. Vamos al desglose y te digo qué se quedó sobre la mesa en esa primera visita."}}, "version": "1.0.0", "i_do_type": "demo", "failure_criteria": [{"id": "solo_levanta_pedido", "regla_id": "develop.visita_tramite", "severity": "critical", "description": "Toma el pedido que el cliente le hizo y se despide sin explorar nada más. La visita sale bien, el cliente queda contento, y el vendedor no se entera de lo que ese cliente compra en otro lado. Con un cliente que llegó pidiendo solo, es la falla más fácil de no notar.", "severity_override": {"razon": "escalada: habilidad espejo del nodo", "default": "major"}}, {"id": "hueco_inventado", "regla_id": "discovery.hueco_inventado", "severity": "critical", "description": "Afirma que el cliente necesita algo sin evidencia y sin que el cliente lo haya dicho. Fabricar un hueco es venderle un problema que no tiene, y un cliente nuevo que lo descubre ya no te vuelve a creer."}, {"id": "jones_falso", "regla_id": "impulse.jones_vago", "severity": "critical", "description": "Inventa que otros negocios compran algo, o cifras que no puede sostener. La prueba social tiene que ser real y verificable."}, {"id": "busca_dolor_donde_no_hay", "regla_id": "discovery.dolor_directo", "severity": "minor", "description": "Insiste en buscar problemas con un cliente que ya dijo que esta contento, en lugar de buscar el hueco.", "severity_override": {"razon": "incidental: fuera del foco del nodo", "default": "major"}}], "success_criteria": [{"id": "discovery.hueco", "weight": 0.45, "regla_id": "discovery.hueco", "description": "Identifica y nombra al menos un hueco concreto: una familia que el cliente compra con otro proveedor, o una que le piden y no maneja. No basta con preguntar: el hueco debe quedar identificado en la conversacion."}, {"id": "discovery.lee_el_lugar", "weight": 0.35, "regla_id": "discovery.lee_el_lugar", "description": "Mapea el catálogo del cliente más allá de lo que le pidió: averigua, de al menos una familia que no le pidió, si el cliente la maneja y con quién. No se exige un número de familias. Tomar el pedido y despedirse no cumple, por muy correcta que sea la visita."}, {"id": "impulse.efecto_jones", "weight": 0.2, "regla_id": "impulse.efecto_jones", "description": "Ancla en negocios similares para abrir una familia nueva (negocios como el suyo tambien mueven X). Debe ser una afirmacion que el vendedor pueda sostener: si inventa clientes o cifras, no se acredita y se marca falla."}]}'::jsonb
))).*
FROM public.nodes n WHERE n.id = '3.9'
ON CONFLICT (id) DO NOTHING;

-- 3. Sus habilidades: las mismas del 3.9, como práctica (la primaria sigue en el 3.9).
INSERT INTO public.node_skills (node_id, skill_id, relation, weight, is_primary)
SELECT '3.9b', skill_id, relation, weight, false FROM public.node_skills WHERE node_id = '3.9'
ON CONFLICT (node_id, skill_id) DO NOTHING;

-- 4. Sus tarjetas.
DELETE FROM public.node_cards WHERE node_id = '3.9b';
INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES ('3.9b', 1, 'concept', 'static', 'El cliente que te pide solo', 'Uno de cada diez clientes es luz verde: en cuanto sabe quién eres y qué traes, te pide algo. "¿Ustedes traen esto? Tráigame diez cajas, que ya se me está acabando."

Es la visita más fácil del mundo, y por eso es una trampa. El vendedor anota, da las gracias y se va feliz con su pedido. Y nunca se entera de todo lo demás que ese cliente compra en otro lado.', NULL, NULL);
INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES ('3.9b', 2, 'concept', 'static', 'Lo que te pidió es la puerta, no el techo.', 'Primero le tomas el pedido, sin ponerlo en duda: él ya decidió, y eso no se toca.

Y luego, en lugar de irte, usas lo que ya sabes: mapeas qué otras líneas maneja y con quién; preguntas qué le piden que no tiene; y anclas en negocios como el suyo. Dos minutos más, y sales sabiendo dónde están tus espacios.', NULL, NULL);
INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES ('3.9b', 3, 'why_it_works', 'static', 'Por qué la primera visita define la cuenta', 'Un cliente que te pidió solo ya confía en ti: te acaba de abrir la puerta. Es el mejor momento para conocer su negocio, porque todavía no te ha puesto en una caja.

Si en la primera visita solo te llevas lo que te pidió, para él serás "el de eso". Si ese día descubres su catálogo, serás su proveedor.', NULL, NULL);

-- 5. Quien ya pasó el BOSS del mundo 3 no tiene que regresar: se le da por hecho.
INSERT INTO public.node_progress (seller_id, company_id, node_id, status, stars)
SELECT p.seller_id, p.company_id, '3.9b', 'done', NULL
FROM public.node_progress p
WHERE p.node_id = '3.10' AND p.status = 'done'
  AND NOT EXISTS (SELECT 1 FROM public.node_progress x WHERE x.seller_id = p.seller_id AND x.node_id = '3.9b');

DO $$
DECLARE o39 int; o39b int; o310 int; n int;
BEGIN
  SELECT order_index INTO o39 FROM public.nodes WHERE id = '3.9';
  SELECT order_index INTO o39b FROM public.nodes WHERE id = '3.9b';
  SELECT order_index INTO o310 FROM public.nodes WHERE id = '3.10';
  IF NOT (o39b = o39 + 1 AND o310 = o39b + 1) THEN RAISE EXCEPTION 'orden incorrecto: 3.9=%, 3.9b=%, 3.10=%', o39, o39b, o310; END IF;
  SELECT count(*) INTO n FROM public.node_cards WHERE node_id = '3.9b';
  IF n <> 3 THEN RAISE EXCEPTION 'tarjetas: %', n; END IF;
  SELECT count(*) INTO n FROM public.node_skills WHERE node_id = '3.9b';
  IF n = 0 THEN RAISE EXCEPTION 'sin habilidades'; END IF;
  IF (SELECT tipo_cliente FROM public.nodes WHERE id = '3.9b') <> 'nuevo' THEN RAISE EXCEPTION 'tipo de cliente'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.doctrina d, public.reglas r WHERE d.is_active AND r.id = 'discovery.hueco' AND d.body LIKE '%' || r.cita_cerebro || '%')
  THEN RAISE EXCEPTION 'la cita de discovery.hueco no está en el Cerebro vigente'; END IF;
  SELECT count(*) INTO n FROM public.nodes, jsonb_array_elements(practice_script->'success_criteria') c
  WHERE id IN ('3.8','3.9','3.9b','7.3') AND c->>'id' = 'discovery.hueco' AND c->>'regla_id' = 'discovery.hueco';
  IF n <> 4 THEN RAISE EXCEPTION 'solo % de 4 nodos usan la regla del hueco', n; END IF;
END $$;
