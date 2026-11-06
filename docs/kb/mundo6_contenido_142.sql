-- Mensaje 142 (6-nov-2026) · Mundo 6 (Consolidación): el contenido.
-- Cerebro v21 → v22 (preguntar si le quedó alguna duda; acompañar no es ofrecer un plan B; pedir referidos es bueno),
-- 4 reglas, 17 tarjetas, 2 preguntas corregidas y 3 nuevas.
-- Todo protegido: cada cambio se hace solo si lo de hoy es exactamente lo esperado. El chequeo del final aborta si algo no quedó.
-- Correrlo dos veces no cambia nada.

DO $c$ DECLARE v int; BEGIN
  IF EXISTS (SELECT 1 FROM public.doctrina WHERE is_active AND strpos(body, $v$**Explicar lo que sigue no es seguir vendiendo** `CAMPO`: *"perfecto, se lo entrego el jueves en la mañana y me paga al recibir"* es lo correcto. *"¡Excelente decisión, no se va a arrepentir, con esto deja de perder clientes!"* es seguir vendiendo y festejar de más. Un *"gracias, don Chuy"* corto está bien.

**Pregúntale si le quedó alguna duda** `CAMPO`: es parte de la consolidación. Una duda que se queda puede terminar en cancelación, y ese es el momento de aclararla. Aunque te diga que no tiene ninguna, déjale claro que si en cualquier momento le surge una duda o necesita cualquier cosa, te puede contactar directamente y con gusto lo ayudas.

**Acompañar no es ofrecer un plan B** `CAMPO`: no anuncies por tu cuenta qué pasa si algo falla (*"si el lunes no llega el camión, me marca"*): le mete una duda que no tenía. Lo que da tranquilidad es el acompañamiento: *"todo va a salir bien; y si cualquier cosa no sale como esperaba, me marca o me escribe en cualquier momento"*. Si él te pregunta qué pasa si algo falla, ahí sí le contestas concreto: con quién, cómo y cuándo.$v$) > 0) THEN RAISE NOTICE 'El Cerebro ya tiene el cambio del 142.'; RETURN; END IF;
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  IF v <> 21 THEN RAISE EXCEPTION 'se esperaba el Cerebro v21 y está el v%', v; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND is_active AND strpos(body, $v$**Explicar lo que sigue no es seguir vendiendo** `CAMPO`: *"perfecto, se lo entrego el jueves en la mañana y me paga al recibir"* es lo correcto. *"¡Excelente decisión, no se va a arrepentir, con esto deja de perder clientes!"* es seguir vendiendo y festejar de más. Un *"gracias, don Chuy"* corto está bien.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado (cambio 1)'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND is_active AND strpos(body, $v$   **La diferencia con garantizar** `CAMPO`: garantizar es prometer el resultado como un hecho —*"se le va a vender seguro"*, *"no le va a fallar"*—. La convicción lo presenta como lo que tú crees y por qué.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado (cambio 2)'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND is_active AND strpos(body, $v$**Referidos** `CAMPO`: no son obligatorios, pero se valen.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado (cambio 3)'; END IF;
  INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
  SELECT v + 1, section_key, order_index, title, replace(replace(replace(body, $v$**Explicar lo que sigue no es seguir vendiendo** `CAMPO`: *"perfecto, se lo entrego el jueves en la mañana y me paga al recibir"* es lo correcto. *"¡Excelente decisión, no se va a arrepentir, con esto deja de perder clientes!"* es seguir vendiendo y festejar de más. Un *"gracias, don Chuy"* corto está bien.$v$, $v$**Explicar lo que sigue no es seguir vendiendo** `CAMPO`: *"perfecto, se lo entrego el jueves en la mañana y me paga al recibir"* es lo correcto. *"¡Excelente decisión, no se va a arrepentir, con esto deja de perder clientes!"* es seguir vendiendo y festejar de más. Un *"gracias, don Chuy"* corto está bien.

**Pregúntale si le quedó alguna duda** `CAMPO`: es parte de la consolidación. Una duda que se queda puede terminar en cancelación, y ese es el momento de aclararla. Aunque te diga que no tiene ninguna, déjale claro que si en cualquier momento le surge una duda o necesita cualquier cosa, te puede contactar directamente y con gusto lo ayudas.

**Acompañar no es ofrecer un plan B** `CAMPO`: no anuncies por tu cuenta qué pasa si algo falla (*"si el lunes no llega el camión, me marca"*): le mete una duda que no tenía. Lo que da tranquilidad es el acompañamiento: *"todo va a salir bien; y si cualquier cosa no sale como esperaba, me marca o me escribe en cualquier momento"*. Si él te pregunta qué pasa si algo falla, ahí sí le contestas concreto: con quién, cómo y cuándo.$v$), $v$   **La diferencia con garantizar** `CAMPO`: garantizar es prometer el resultado como un hecho —*"se le va a vender seguro"*, *"no le va a fallar"*—. La convicción lo presenta como lo que tú crees y por qué.$v$, $v$   **La diferencia con garantizar** `CAMPO`: garantizar es prometer el resultado como un hecho —*"se le va a vender seguro"*, *"no le va a fallar"*—. La convicción lo presenta como lo que tú crees y por qué.

   **Lo que sí controlas, sí se garantiza** `CAMPO`: la entrega, la atención y que cualquier problema se le resuelva dependen de ti y de tu empresa, y con años de historial atendiendo clientes se pueden garantizar: *"todo va a salir bien; y si cualquier cosa no sale como esperaba, me marca y se lo resolvemos"*. Lo que no se garantiza es lo que no controlas: que se le venda, que su cliente regrese.$v$), $v$**Referidos** `CAMPO`: no son obligatorios, pero se valen.$v$, $v$**Referidos** `CAMPO`: no son obligatorios, pero pedirlos es bueno.$v$), true, created_by
  FROM public.doctrina WHERE version = v AND is_active;
  UPDATE public.doctrina SET is_active = false WHERE is_active AND version = v;
END $c$;

UPDATE public.reglas SET resumen = $v$Dejar claro qué sigue: la falta de entendimiento es la causa número uno de cancelaciones. LA PRUEBA: después del sí, ¿el vendedor deja claro qué sigue —qué se entrega, cuándo, cuánto y cómo se paga— con datos concretos (día, cantidad, monto), no vagos («ahí luego vemos»)? Preguntarle si le quedó alguna duda y dejarle claro que lo puede contactar en cualquier momento es parte de esto. Anunciar por su cuenta qué pasa si algo falla no lo pide: eso es ofrecer un plan B.$v$, updated_at = now()
WHERE id = 'consolidation.siguientes_pasos' AND resumen = $v$Dejar claro qué sigue: la falta de entendimiento es la causa número uno de cancelaciones. LA PRUEBA: después del sí, ¿el vendedor deja claro qué sigue —qué se entrega, cuándo, cuánto y cómo se paga— con datos concretos (día, cantidad, monto), no vagos («ahí luego vemos»)?$v$;

UPDATE public.reglas SET resumen = $v$REHASH: todos tienen otra venta escondida. La otra venta no es venderle más hoy: son los referidos y la siguiente visita. LA PRUEBA: después del sí, ¿el vendedor deja abierta la siguiente oportunidad —la siguiente visita con día y propósito, o un referido amarrado a algo que el cliente dijo— sin ofrecerle nada más? El referido no es obligatorio: pedirlo amarrado suma, no pedirlo no resta.$v$, updated_at = now()
WHERE id = 'consolidation.rehash' AND resumen = $v$REHASH: todos tienen otra venta escondida. La otra venta no es venderle más hoy: son los referidos y la siguiente visita. LA PRUEBA: después del sí, ¿el vendedor deja abierta la siguiente oportunidad —la siguiente visita con día y propósito, o un referido amarrado a algo que el cliente dijo— sin ofrecerle nada más?$v$;

UPDATE public.reglas SET resumen = $v$Ofrecer el plan B mete una duda que el cliente no tenía y desmiente la convicción. LA PRUEBA: ¿el vendedor anuncia por adelantado qué harán si no funciona o si algo falla («y si no se mueve, lo ajustamos», «si el lunes no llega el camión, me marca»)? Si después no funciona, se ajusta; eso es Consolidación y no se anuncia antes. Acompañar no es esto: «todo va a salir bien; si cualquier cosa no sale como esperaba, me marca en cualquier momento». Contestar cuando el cliente pregunta qué pasa si algo falla tampoco.$v$, updated_at = now()
WHERE id = 'present.plan_b' AND resumen = $v$Ofrecer el plan B mete una duda que el cliente no tenía y desmiente la convicción. LA PRUEBA: ¿el vendedor anuncia por adelantado qué harán si no funciona («y si no se mueve, lo ajustamos»)? Si después no funciona, se ajusta; eso es Consolidación y no se anuncia antes.$v$;

UPDATE public.reglas SET resumen = $v$Garantizar lo que no controlas. Admitir lo que no controlas hace creíble lo que sí afirmas. LA PRUEBA: ¿el vendedor promete como un hecho un resultado que no controla —«se le va a vender seguro», «sus clientes van a regresar», «se lo garantizo» sobre la venta—? La convicción es otra cosa: decir lo que él cree y por qué («estoy seguro de que le va a servir, porque en negocios como el suyo…»). Garantizar lo que sí controla —la entrega, la atención, que cualquier problema se le resuelva— no es esto.$v$, updated_at = now()
WHERE id = 'present.garantiza' AND resumen = $v$Garantizar lo que no controlas. Admitir lo que no controlas hace creíble lo que sí afirmas. LA PRUEBA: ¿el vendedor promete el resultado como un hecho —«se le va a vender seguro», «no le va a fallar», «se lo garantizo»—? La convicción es otra cosa: decir lo que él cree y por qué («estoy seguro de que le va a servir, porque en negocios como el suyo…»).$v$;

UPDATE public.node_cards SET body = $v$REGLA 1 — Encuentra al cliente en un punto común de emoción al inicio, y construye desde ahí. No llegues gritando con alguien tranquilo ni apagado con alguien entusiasmado: empiezas donde está él, y de ahí suben juntos.

REGLA 2 — Cierra en el momento correcto. La curva tiene un pico, y después del pico baja. Esperar de más apaga lo que costó trabajo encender.

REGLA 3 — El impulso no termina cuando el cliente dice que sí: ahí empieza a caer. Eso también se trabaja, y lo vas a ver al final del mapa.$v$
WHERE node_id = '4.4' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '0ecdff7a66c429514112903a27beedb5';

UPDATE public.node_cards SET body = $v$El cliente dijo que sí. Te fuiste feliz. Y esa noche, solo con su decisión, le llega la visita: "¿habré hecho bien? ¿y si no se me mueve? ¿qué le voy a decir a mi esposa si esto no jala?"

Eso es el remordimiento del comprador, y le pasa a TODOS. La diferencia entre la venta que se sostiene y la que se cancela mañana no es el producto: es con cuánta claridad y tranquilidad se quedó el cliente cuando saliste por la puerta.$v$
WHERE node_id = '6.0' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'a385116b38bc61a2d5f78375e20b1203';

UPDATE public.node_cards SET body = $v$Las ventas no se caen porque el cliente "se arrepintió del producto". Se caen porque no entendió algo: cuándo llega, cuánto va a pagar exactamente, qué sigue después.

Cada hueco de comprensión es una grieta, y el remordimiento nocturno se mete por las grietas. La consolidación existe para sellarlas TODAS antes de irte: qué llega, cuándo, cuánto y cómo se paga. Y le preguntas si le quedó alguna duda: aunque te diga que no, le dejas claro que te puede buscar en cualquier momento.$v$
WHERE node_id = '6.0' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '7f9ca1d373c1e310c2d238ddf39ab21d';

UPDATE public.node_cards SET title = $v$La mala consolidación y la buena$v$, body = $v$MALA: el cliente dice que sí, y el vendedor festeja y se va: "¡excelente decisión! cualquier cosa me marca". Nada quedó claro.

BUENA: después del sí, la explicación llega concisa, clara y completa: qué, cuándo, cuánto y cómo se paga. Le preguntas si le quedó alguna duda, y te vas con calma, dejando dos cosas sembradas: la relación y la siguiente puerta (la próxima visita y, si se puede, un referido).$v$
WHERE node_id = '6.0' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '2342e79dbbae8a0b9d29c584dd5c8460';

UPDATE public.node_cards SET body = $v$Un cliente bien consolidado hace dos cosas que valen oro: NO cancela (entendió todo, durmió tranquilo) y TE RECOMIENDA (la confianza del final de la visita es la que se cuenta a los amigos).

El vendedor promedio ve el sí como la meta. El Closer lo ve como la mitad: la venta se cierra en el paso 5, pero se GANA en el 6. Y la siguiente venta, también.$v$
WHERE node_id = '6.0' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'c0df68c7f67859844a6858082133e070';

UPDATE public.node_cards SET body = $v$¿Te acuerdas de las tres reglas de oro del impulso? La tercera decía que el impulso no termina cuando el cliente dice que sí.

Ahí empieza a caer.

Es el arrepentimiento del comprador, y es automático. Apenas dice que sí, el cerebro empieza a buscar razones por las que a lo mejor no debió. No es desconfianza hacia ti: es como funcionamos todos.$v$
WHERE node_id = '6.1' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '808e9bb161dd2b0731846eb9773cfc97';

UPDATE public.node_cards SET body = $v$La reacción natural del vendedor es reforzar la compra. Recordarle lo bueno del producto, repetirle el ahorro, insistir en que tomó una gran decisión.

Y es exactamente lo que NO hay que hacer.

Seguir vendiendo después del sí le dice al cliente algo que no querías decirle: que necesitabas esa venta.$v$
WHERE node_id = '6.1' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '93513cc8fc7cc1bddf15af2e0154a5a9';

UPDATE public.node_cards SET title = $v$Por qué eso destruye todo lo anterior$v$, body = $v$Y si necesitabas la venta, entonces la indiferencia era actuada. Y si la indiferencia era actuada, también el interés por su negocio, también las preguntas, también la plática de su hijo.

Retroactivamente, toda la conversación se convierte en una técnica.

Ese es el riesgo real del rehash mal hecho: no solo no quita el arrepentimiento, sino que lo confirma.$v$
WHERE node_id = '6.1' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '6c0e70ac98b378e8129a1e7d226c5437';

UPDATE public.node_cards SET title = $v$Lo que sí funciona: no cambiar nada$v$, body = $v$El rehash correcto no es decir más cosas. Es DEMOSTRAR que nada cambió en ti.

Sigues indiferente sobre la compra. Sigues amigable sobre la relación. Y le das la confianza de que ahí vas a estar para lo que necesite.

Ni una palabra más de producto. Ni una justificación. Trato de amigo, igual que hace diez minutos.

Lo que sí haces es dejarle claro qué sigue: cuándo llega, cuánto y cómo paga. Explicar eso no es seguir vendiendo.$v$
WHERE node_id = '6.1' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '7f457a575b5ab181bc88c7d3c17afdee';

UPDATE public.node_cards SET title = $v$Por qué funciona$v$, body = $v$Porque prueba, sin decirlo, que todo lo anterior era real.

Si tu actitud es idéntica antes y después de la firma, el cliente concluye solo lo que ninguna frase habría logrado convencerlo: que no lo trataste así para venderle. Lo trataste así porque así eres.

Y con esa conclusión, el arrepentimiento no tiene de qué agarrarse. Se disuelve solo.$v$
WHERE node_id = '6.1' AND card_order = 5 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'bad4a4ee50d30bd74e98849ed108d726';

UPDATE public.node_cards SET title = $v$Los minutos que blindan la venta$v$, body = $v$El cliente acaba de decir sí, y su cabeza, sin que lo diga, ya está incubando preguntas: ¿cuándo me llega? ¿cuánto acabo pagando exactamente? ¿y si necesito algo?

Si se quedan sin respuesta, esta noche se convierten en remordimiento. Tu trabajo en los siguientes minutos: repite el trato completo —qué, cuándo, cuánto y cómo se paga— y pregúntale si le quedó alguna duda. Aunque te diga que no, déjale claro que te puede contactar en cualquier momento.$v$
WHERE node_id = '6.2' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'fadb5e503b83520d7b9795cfd7c683e7';

UPDATE public.node_cards SET body = $v$NO celebres de más: "¡no se va a arrepentir!" huele a comisión, y despierta la pregunta inversa: ¿de qué me podría arrepentir?

NO sigas vendiendo: el cliente ya decidió. Cada beneficio extra después del sí siembra la duda de qué no le has dicho.

NO anuncies qué pasa si algo falla: "si el camión no llega, me marca" le mete una duda que no tenía. Lo que da tranquilidad es acompañarlo: "todo va a salir bien; y si cualquier cosa no sale como esperaba, me marca o me escribe en cualquier momento".

NO salgas corriendo: la prisa del vendedor tras el sí es la imagen que el cliente recuerda esa noche.

Calma. Claridad. Y la relación sembrada al salir.$v$
WHERE node_id = '6.2' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '606762d9e32dbb1a630cfdc223db9ad0';

UPDATE public.node_cards SET body = $v$Ya sellaste la comprensión. El último toque es el CPR de cierre: retoma algo de SU vida que te contó en la plática: "que le vaya bonito el fin con los nietos; el lunes me cuenta cómo quedó el partido."

Ese detalle hace dos cosas: convierte la transacción en relación (la próxima visita ya no es de vendedor, es de conocido) y le deja al cliente la última emoción de la visita: calidez. Y la última emoción es la que se recuerda... y la que se cuenta.$v$
WHERE node_id = '6.2' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '9cd4e83c54cd73430f0fa0b6c31ef00d';

UPDATE public.node_cards SET title = $v$Cada cliente contento trae al siguiente, si le abres la puerta.$v$, body = $v$La visita perfecta no termina en la venta. Termina con la siguiente puerta abierta:

La siguiente visita: "yo paso cada semana; ¿le late que le caiga los lunes para que nunca ande corto?". Es servicio, tiene día y tiene razón. El cliente que acepta tu ruta te acaba de convertir en SU proveedor.

Y, si se puede, el referido: la puerta al siguiente cliente... que él ya te mencionó sin darse cuenta. No es obligatorio, pero pedirlo bien es bueno.$v$
WHERE node_id = '6.3' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'cf0e0566024b0408d1af3598bd897898';

UPDATE public.node_cards SET title = $v$El referido se amarra, o no se pide.$v$, body = $v$EN FRÍO suena así: "¿no tiene conocidos que quieran comprar?", y el cliente más contento del mundo se incomoda: le acabas de cobrar la confianza.

AMARRADO suena así: "ahorita que me platicó de su compadre el del negocio... ¿usted cree que a él le sirva esto? Si gusta, dígale que voy de su parte." Nació de SU plática, es ligero, y el que queda bien presentándote es ÉL.

La regla: si el cliente no te dio de dónde amarrarlo en la conversación, el referido se queda para la próxima visita. Nunca se fuerza.$v$
WHERE node_id = '6.3' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '9ed7049be7c57aeadd45c546bbc388aa';

UPDATE public.node_cards SET body = $v$Un vendedor que solo vende necesita encontrar cada cliente desde cero: puerta fría tras puerta fría, todos los días.

Un Closer que consolida construye una red: cada cliente sellado es una ruta semanal (la siguiente visita sin esfuerzo) y un puente a su compadre (una puerta tibia: "va de mi parte"). Con el tiempo, cada vez más ventas dejan de empezar en frío.

La Ley de los Promedios sigue mandando, pero la consolidación te mejora la proporción. Para siempre.$v$
WHERE node_id = '6.3' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '66e03c933b02e75b17b13720c7b2b5de';

UPDATE public.node_cards SET title = $v$El sexto Boss.$v$, body = $v$La venta ya está hecha: un administrador formal acaba de aprobar tu pedido. Y ahí empieza tu examen, porque a este señor todos sus proveedores le han fallado en los DETALLES: entregas tarde, cobros distintos, nadie que dé la cara.

Tu misión NO es vender: de hecho, vender algo más aquí es reprobar. Es sellar: cada término con hora y número, y cuando te pregunte qué pasa si algo falla, la respuesta con nombre y teléfono. Su cicatriz se sana con compromisos que se puedan cobrar. Relación sí, pero a su manera: formal, ganada, sin confiancitas.

Ganas cuando él repita tu trato de memoria... y le hable de ti al negocio de su hermano. Así se fabrica un aliado.$v$
WHERE node_id = '6.4' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '5b03553b38873aab55afaf31f630e592';

UPDATE public.node_quiz_questions SET explanation_correct = $v$La causa número uno de cancelación no es arrepentimiento del producto: es no haber entendido algo. Cuándo llega, cuánto y cómo paga, qué sigue. Cada hueco es una grieta, y las grietas se sellan ANTES de salir por la puerta. "Cualquier cosa me marca", solo y sin explicar nada, no sella nada.$v$, explanation_wrong = $v$La venta recién cerrada es la más frágil que existe: esa noche llega el remordimiento del comprador, y busca grietas: ¿cuándo llega? ¿cuánto pago? Un "cualquier cosa me marca" sin explicar nada no sella nada. La consolidación era el paso que faltó, y puede costar la venta completa.$v$
WHERE node_id = '6.0' AND question_order = 1 AND md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) = '670381c6fc5b91db54d5889a21a5a1d3';

UPDATE public.node_quiz_questions SET explanation_correct = $v$Los dos: la claridad —qué llega, cuándo, cuánto y cómo se paga, y si le quedó alguna duda—, que blinda la venta contra el remordimiento. Y la cosecha: la relación sembrada y la puerta a la siguiente visita o al referido.$v$
WHERE node_id = '6.0' AND question_order = 2 AND md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) = 'e2b9a7e5d83af2b8cfaa7eadfaa344db';

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '6.1', 1, $v$El cliente acaba de decir que sí. ¿Qué le pasa a su impulso?$v$, $v$Sigue subiendo: ya está convencido.$v$, $v$Empieza a caer: es el arrepentimiento del comprador, y es automático.$v$, $v$Se queda igual hasta que le entregues.$v$, NULL, 'B', $v$Eso es. Apenas dice que sí, el cerebro empieza a buscar razones por las que a lo mejor no debió. No es desconfianza hacia ti: es como funcionamos todos.$v$, $v$El impulso no termina en el sí: ahí empieza a caer. Es la tercera regla de oro de la curva, y le pasa a todos.$v$, 'consolidation.arrepentimiento'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '6.1' AND question_order = 1);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '6.1', 2, $v$Después del sí, el vendedor le dice: "Y acuérdese que con esto deja de perder clientes, y le dura el doble". ¿Qué provoca?$v$, $v$Refuerza la compra.$v$, $v$Le dice al cliente que necesitabas la venta, y toda la conversación se vuelve una técnica.$v$, $v$Nada: es la verdad.$v$, NULL, 'B', $v$Exacto. Si necesitabas la venta, la indiferencia era actuada, y también el interés por su negocio. Seguir vendiendo después del sí confirma el arrepentimiento en vez de quitarlo.$v$, $v$Suena a reforzar, pero hace lo contrario: le comunica que necesitabas la venta. Lo que funciona es demostrar que nada cambió en ti: cero producto.$v$, 'consolidation.sigue_vendiendo'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '6.1' AND question_order = 2);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '6.1', 3, $v$¿Cuál de estas SÍ va después del sí?$v$, $v$"¡Excelente decisión, no se va a arrepentir!"$v$, $v$"Perfecto, se lo entrego el jueves en la mañana y me paga al recibir."$v$, $v$"Y si quiere, le agrego unas cajas más de lo otro."$v$, NULL, 'B', $v$Correcto. Explicar lo que sigue no es seguir vendiendo: es dejarle claro qué pasa ahora, y eso evita cancelaciones.$v$, $v$La primera es festejar de más y la tercera es seguir vendiendo. Lo que va es dejar claro qué sigue: cuándo llega y cómo se paga.$v$, 'consolidation.siguientes_pasos'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '6.1' AND question_order = 3);

DO $chk$ BEGIN
  IF (SELECT max(version) FROM public.doctrina WHERE is_active) <> 22 THEN RAISE EXCEPTION 'el Cerebro no quedó en v22'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE is_active AND strpos(body, $v$**Explicar lo que sigue no es seguir vendiendo** `CAMPO`: *"perfecto, se lo entrego el jueves en la mañana y me paga al recibir"* es lo correcto. *"¡Excelente decisión, no se va a arrepentir, con esto deja de perder clientes!"* es seguir vendiendo y festejar de más. Un *"gracias, don Chuy"* corto está bien.

**Pregúntale si le quedó alguna duda** `CAMPO`: es parte de la consolidación. Una duda que se queda puede terminar en cancelación, y ese es el momento de aclararla. Aunque te diga que no tiene ninguna, déjale claro que si en cualquier momento le surge una duda o necesita cualquier cosa, te puede contactar directamente y con gusto lo ayudas.

**Acompañar no es ofrecer un plan B** `CAMPO`: no anuncies por tu cuenta qué pasa si algo falla (*"si el lunes no llega el camión, me marca"*): le mete una duda que no tenía. Lo que da tranquilidad es el acompañamiento: *"todo va a salir bien; y si cualquier cosa no sale como esperaba, me marca o me escribe en cualquier momento"*. Si él te pregunta qué pasa si algo falla, ahí sí le contestas concreto: con quién, cómo y cuándo.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'un cambio del Cerebro no quedó'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE is_active AND strpos(body, $v$   **La diferencia con garantizar** `CAMPO`: garantizar es prometer el resultado como un hecho —*"se le va a vender seguro"*, *"no le va a fallar"*—. La convicción lo presenta como lo que tú crees y por qué.

   **Lo que sí controlas, sí se garantiza** `CAMPO`: la entrega, la atención y que cualquier problema se le resuelva dependen de ti y de tu empresa, y con años de historial atendiendo clientes se pueden garantizar: *"todo va a salir bien; y si cualquier cosa no sale como esperaba, me marca y se lo resolvemos"*. Lo que no se garantiza es lo que no controlas: que se le venda, que su cliente regrese.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'un cambio del Cerebro no quedó'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE is_active AND strpos(body, $v$**Referidos** `CAMPO`: no son obligatorios, pero pedirlos es bueno.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'un cambio del Cerebro no quedó'; END IF;
  IF (SELECT resumen FROM public.reglas WHERE id = 'consolidation.siguientes_pasos') IS DISTINCT FROM $v$Dejar claro qué sigue: la falta de entendimiento es la causa número uno de cancelaciones. LA PRUEBA: después del sí, ¿el vendedor deja claro qué sigue —qué se entrega, cuándo, cuánto y cómo se paga— con datos concretos (día, cantidad, monto), no vagos («ahí luego vemos»)? Preguntarle si le quedó alguna duda y dejarle claro que lo puede contactar en cualquier momento es parte de esto. Anunciar por su cuenta qué pasa si algo falla no lo pide: eso es ofrecer un plan B.$v$ THEN RAISE EXCEPTION 'la regla consolidation.siguientes_pasos no quedó'; END IF;
  IF (SELECT resumen FROM public.reglas WHERE id = 'consolidation.rehash') IS DISTINCT FROM $v$REHASH: todos tienen otra venta escondida. La otra venta no es venderle más hoy: son los referidos y la siguiente visita. LA PRUEBA: después del sí, ¿el vendedor deja abierta la siguiente oportunidad —la siguiente visita con día y propósito, o un referido amarrado a algo que el cliente dijo— sin ofrecerle nada más? El referido no es obligatorio: pedirlo amarrado suma, no pedirlo no resta.$v$ THEN RAISE EXCEPTION 'la regla consolidation.rehash no quedó'; END IF;
  IF (SELECT resumen FROM public.reglas WHERE id = 'present.plan_b') IS DISTINCT FROM $v$Ofrecer el plan B mete una duda que el cliente no tenía y desmiente la convicción. LA PRUEBA: ¿el vendedor anuncia por adelantado qué harán si no funciona o si algo falla («y si no se mueve, lo ajustamos», «si el lunes no llega el camión, me marca»)? Si después no funciona, se ajusta; eso es Consolidación y no se anuncia antes. Acompañar no es esto: «todo va a salir bien; si cualquier cosa no sale como esperaba, me marca en cualquier momento». Contestar cuando el cliente pregunta qué pasa si algo falla tampoco.$v$ THEN RAISE EXCEPTION 'la regla present.plan_b no quedó'; END IF;
  IF (SELECT resumen FROM public.reglas WHERE id = 'present.garantiza') IS DISTINCT FROM $v$Garantizar lo que no controlas. Admitir lo que no controlas hace creíble lo que sí afirmas. LA PRUEBA: ¿el vendedor promete como un hecho un resultado que no controla —«se le va a vender seguro», «sus clientes van a regresar», «se lo garantizo» sobre la venta—? La convicción es otra cosa: decir lo que él cree y por qué («estoy seguro de que le va a servir, porque en negocios como el suyo…»). Garantizar lo que sí controla —la entrega, la atención, que cualquier problema se le resuelva— no es esto.$v$ THEN RAISE EXCEPTION 'la regla present.garantiza no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.4' AND card_order = 4) IS DISTINCT FROM '9b6812bdc30c73c1f48a207c335b00c9' THEN RAISE EXCEPTION 'la tarjeta 4.4 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.0' AND card_order = 1) IS DISTINCT FROM '2f8b6dbc727a4cb799ccc89a1f0e6663' THEN RAISE EXCEPTION 'la tarjeta 6.0 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.0' AND card_order = 2) IS DISTINCT FROM 'fa2ccc6edf0e759ab7e90999b41fd2b8' THEN RAISE EXCEPTION 'la tarjeta 6.0 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.0' AND card_order = 3) IS DISTINCT FROM '8ca376b17d3252adaecc50821714536a' THEN RAISE EXCEPTION 'la tarjeta 6.0 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.0' AND card_order = 4) IS DISTINCT FROM 'eae68ffc89286108f0699fea96b717f6' THEN RAISE EXCEPTION 'la tarjeta 6.0 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.1' AND card_order = 1) IS DISTINCT FROM '70551cbc1a923964c91e6054df933fb9' THEN RAISE EXCEPTION 'la tarjeta 6.1 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.1' AND card_order = 2) IS DISTINCT FROM '535a8b625094d17a9fbdc60ec157b015' THEN RAISE EXCEPTION 'la tarjeta 6.1 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.1' AND card_order = 3) IS DISTINCT FROM 'a0ab5d46e9c30b9db3d707573c043f43' THEN RAISE EXCEPTION 'la tarjeta 6.1 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.1' AND card_order = 4) IS DISTINCT FROM 'fb86055899ceee4769141ddf946dd6a8' THEN RAISE EXCEPTION 'la tarjeta 6.1 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.1' AND card_order = 5) IS DISTINCT FROM '9f391b8887c8075374a2daa3522e8c4d' THEN RAISE EXCEPTION 'la tarjeta 6.1 #5 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.2' AND card_order = 1) IS DISTINCT FROM '31dd9b480cedb41731fc44fbdf111bbb' THEN RAISE EXCEPTION 'la tarjeta 6.2 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.2' AND card_order = 2) IS DISTINCT FROM 'fd884dc997e666b414338a58d64c7e5c' THEN RAISE EXCEPTION 'la tarjeta 6.2 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.2' AND card_order = 3) IS DISTINCT FROM 'a68fa7f663cc86e299e9bcf043dc3891' THEN RAISE EXCEPTION 'la tarjeta 6.2 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.3' AND card_order = 1) IS DISTINCT FROM '5b9be7337724386d0fce6b692ca8b90d' THEN RAISE EXCEPTION 'la tarjeta 6.3 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.3' AND card_order = 2) IS DISTINCT FROM '42cfc0d0bf7270de3bbb5dcf3fa85a68' THEN RAISE EXCEPTION 'la tarjeta 6.3 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.3' AND card_order = 3) IS DISTINCT FROM '4a270c564ab596d6b82f4151665006be' THEN RAISE EXCEPTION 'la tarjeta 6.3 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '6.4' AND card_order = 1) IS DISTINCT FROM '77db50283fc6fa356b54c3e739e4212f' THEN RAISE EXCEPTION 'la tarjeta 6.4 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '6.0' AND question_order = 1) IS DISTINCT FROM 'ebfd6e645e0d7a9f7e4da9edf5c91513' THEN RAISE EXCEPTION 'la pregunta 6.0 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '6.0' AND question_order = 2) IS DISTINCT FROM 'f527fd7b445a0131be52b2b392301561' THEN RAISE EXCEPTION 'la pregunta 6.0 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '6.1' AND question_order = 1) IS DISTINCT FROM 'e89a743d31df0b0d406c4baf632848ec' THEN RAISE EXCEPTION 'la pregunta 6.1 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '6.1' AND question_order = 2) IS DISTINCT FROM 'adbe534256ebb394522a088699e39f78' THEN RAISE EXCEPTION 'la pregunta 6.1 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '6.1' AND question_order = 3) IS DISTINCT FROM '1433fbedb7232e39598cd9c0adbf4e8b' THEN RAISE EXCEPTION 'la pregunta 6.1 #3 no quedó'; END IF;
END $chk$;
