-- Mensaje 144 (6-nov-2026) · Mundo 7 (los exámenes): las tarjetas.
-- El Cerebro y las reglas no cambian.
-- 0 reglas, 4 tarjetas, 0 preguntas corregidas y 0 nuevas.
-- Todo protegido: cada cambio se hace solo si lo de hoy es exactamente lo esperado. El chequeo del final aborta si algo no quedó.
-- Correrlo dos veces no cambia nada.

UPDATE public.node_cards SET body = $v$Un cliente de verdad. Sin guion pedagógico, sin pistas, sin red.

Los seis pasos completos: ábrete la puerta, preséntate en un respiro, excava hasta el dolor, preséntale SU problema resuelto, cierra asumido en el pico, y sella el trato tan bien que ninguna duda nazca después.

Todo lo que aprendiste en seis mundos, en una sola conversación. Como va a ser en el campo, todos los días.$v$
WHERE node_id = '7.0' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '925dd54191d772c7a1da351f16b2c604';

UPDATE public.node_cards SET body = $v$A este señor le vendieron mal hace un año —ocho mil pesos de producto muerto— y juró no comprarle a nadie nuevo.

Primero te va a decir que no: es el reflejo de siempre, y se atraviesa con AIR. Luego te va a contar por qué. Eso ya no es un no: trae su razón, y eso lo hace una objeción. Su cicatriz se ESCUCHA.

Y si te ganas el derecho a seguir, enciéndelo como aprendiste: con su cuenta, con sus vecinos, con la convicción de un pedido chico. Sin pedirle que pruebe y sin ofrecerle salida; si él pone su condición, se la aceptas. Ese pedido chico es la victoria más grande de este mapa: el salto de fe de alguien que juró no volver a saltar.$v$
WHERE node_id = '7.2' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'da094deb88adcff3150abad8f64ed25b';

UPDATE public.node_cards SET title = $v$El examen que puedes reprobar sintiéndote bien$v$, body = $v$Este cliente lleva años comprándote. Te recibe con gusto, te da su pedido sin que se lo pidas, y se queda contento hagas lo que hagas.

Puedes terminar esta conversación con el pedido en la mano, sentir que fue una buena visita, y haber reprobado.

Porque la pregunta no es si saliste con pedido. Es si saliste sabiendo qué más puede comprarte, y si lograste que empezara a hacerlo.$v$
WHERE node_id = '7.3' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'ab427af172e749b678715080a5ebe01c';

UPDATE public.node_cards SET body = $v$Este es el cliente del que te hablaron cuando entraste a ventas: hostil, escéptico, regateador, el que hace que los vendedores promedio cambien de calle.

Te va a rechazar antes de escucharte. Va a objetar todo con números. Va a regatear como si le fuera la vida. Y al final se va a quedar callado, mirándote, sacando cuentas.

Adentro de todo eso hay una venta real, para quien ejecute el sistema completo sin quebrarse un milímetro.

Seis mundos te trajeron aquí. El vendedor no nace. Se hace, y hoy se certifica.$v$
WHERE node_id = '7.4' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'ca55c6da02481c085aa2e12aca024b24';

DO $chk$ BEGIN
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '7.0' AND card_order = 1) IS DISTINCT FROM '22b8ef35002c7f300e9c79c68af0409c' THEN RAISE EXCEPTION 'la tarjeta 7.0 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '7.2' AND card_order = 1) IS DISTINCT FROM '57e546d9906e7c23e5f55380465b9d3b' THEN RAISE EXCEPTION 'la tarjeta 7.2 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '7.3' AND card_order = 1) IS DISTINCT FROM 'a7cb64722dd65ca7ae45730f46d677d1' THEN RAISE EXCEPTION 'la tarjeta 7.3 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '7.4' AND card_order = 1) IS DISTINCT FROM '46b5d49ded75e18b9a4d5591095e0723' THEN RAISE EXCEPTION 'la tarjeta 7.4 #1 no quedó'; END IF;
END $chk$;
