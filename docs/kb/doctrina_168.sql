-- Mensaje 168 · La doctrina de las balas (Emilio, 18-nov).
-- Ante una objeción: una o dos balas, a veces tres, que respondan a lo que dijo el cliente.
-- Vaciar el cargador: balas que no apuntan, una lista de todo lo que trae, o gastarse tantas que en la siguiente objeción ya no tiene con qué.
-- «Lo que encontraron» por sí solo no es la bala; si ahí nombra algo concreto suyo (producto, servicio o precio), sí lo es.
-- Quedarse sin balas se califica por lo que se ve (no dio bala: salta_la_bala, nueva en 5.12 y 5.15); la explicación dice la causa.
-- Primero el Cerebro (versión nueva), de ahí la regla, las tarjetas y los guiones. Todo en un solo bloque:
-- si un solo texto no está como se espera, falla y NO cambia nada.
DO $do$
DECLARE v int; n int; b text; ps jsonb; t text;
BEGIN
  -- 1. El Cerebro: versión nueva completa (como siempre), con la sección 'pasos' corregida.
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  SELECT count(*) INTO n FROM public.doctrina WHERE is_active AND version = v;
  IF n <> 7 THEN RAISE EXCEPTION 'la versión % del Cerebro tiene % secciones activas, no 7', v, n; END IF;
  SELECT body INTO b FROM public.doctrina WHERE is_active AND version = v AND section_key = 'pasos';
  IF strpos(b, $t$4. **Re-impulsa con la bala o las balas que respondan a lo que te dijo** `CAMPO`, y cierras. Una o dos es lo normal; a veces tres. Cada bala tiene que apuntar a algo que el cliente dijo: su objeción, su dolor, su situación. Y cuídalas: cada objeción que venga después te va a pedir otra. Vaciar el cargador es soltar balas que no apuntan a nada de lo que dijo, soltar de jalón todo lo que traes, o gastarte tantas que, cuando llega la siguiente objeción, ya no tienes con qué subir el impulso. «Lo que encontramos» es el paso 3, y por sí solo no es la bala: si te quedas en «les convino» y cierras, no re-impulsaste. Pero si ahí nombras algo concreto tuyo —de tu producto, tu servicio o tu precio, como «con la entrega cada martes nunca más perdieron una venta»—, eso sí es una bala. Un precio con su motivo —«el primer pedido se lo dejo en mil cincuenta»— también lo es, aunque ya lo hayas dicho.$t$) > 0 THEN RAISE EXCEPTION 'el Cerebro activo ya tiene el cambio del 168: no se aplica dos veces'; END IF;
  IF (length(b) - length(replace(b, $t$> *"La persona con más balas claramente tiene el control, siempre y cuando conserve su munición."*
$t$, ''))) / length($t$> *"La persona con más balas claramente tiene el control, siempre y cuando conserve su munición."*
$t$) <> 1 THEN RAISE EXCEPTION 'Cerebro: el texto viejo 1 no aparece exactamente una vez'; END IF;
  b := replace(b, $t$> *"La persona con más balas claramente tiene el control, siempre y cuando conserve su munición."*
$t$, $t$> *"La persona con más balas claramente tiene el control, siempre y cuando conserve su munición."*

**Por qué les decimos balas** `CAMPO`: en la conversación los dos traen munición. Las tuyas son razones para comprar; las del cliente, razones para no hacerlo. Cada bala que disparas sube el impulso, pero no son infinitas: el que se queda sin ellas se queda desarmado.
$t$);
  IF (length(b) - length(replace(b, $t$ante una objeción se reimpulsa con la bala que escojas para ese momento.$t$, ''))) / length($t$ante una objeción se reimpulsa con la bala que escojas para ese momento.$t$) <> 1 THEN RAISE EXCEPTION 'Cerebro: el texto viejo 2 no aparece exactamente una vez'; END IF;
  b := replace(b, $t$ante una objeción se reimpulsa con la bala que escojas para ese momento.$t$, $t$ante una objeción se re-impulsa con una o dos —a veces tres— que respondan a lo que te dijo.$t$);
  IF (length(b) - length(replace(b, $t$4. **Re-impulsa con una bala** `CAMPO`: una sola, y cierras. Tres de golpe sería vaciar el cargador. «Lo que encontramos» no es la bala: es el paso 3. La bala va aparte, después.$t$, ''))) / length($t$4. **Re-impulsa con una bala** `CAMPO`: una sola, y cierras. Tres de golpe sería vaciar el cargador. «Lo que encontramos» no es la bala: es el paso 3. La bala va aparte, después.$t$) <> 1 THEN RAISE EXCEPTION 'Cerebro: el texto viejo 3 no aparece exactamente una vez'; END IF;
  b := replace(b, $t$4. **Re-impulsa con una bala** `CAMPO`: una sola, y cierras. Tres de golpe sería vaciar el cargador. «Lo que encontramos» no es la bala: es el paso 3. La bala va aparte, después.$t$, $t$4. **Re-impulsa con la bala o las balas que respondan a lo que te dijo** `CAMPO`, y cierras. Una o dos es lo normal; a veces tres. Cada bala tiene que apuntar a algo que el cliente dijo: su objeción, su dolor, su situación. Y cuídalas: cada objeción que venga después te va a pedir otra. Vaciar el cargador es soltar balas que no apuntan a nada de lo que dijo, soltar de jalón todo lo que traes, o gastarte tantas que, cuando llega la siguiente objeción, ya no tienes con qué subir el impulso. «Lo que encontramos» es el paso 3, y por sí solo no es la bala: si te quedas en «les convino» y cierras, no re-impulsaste. Pero si ahí nombras algo concreto tuyo —de tu producto, tu servicio o tu precio, como «con la entrega cada martes nunca más perdieron una venta»—, eso sí es una bala. Un precio con su motivo —«el primer pedido se lo dejo en mil cincuenta»— también lo es, aunque ya lo hayas dicho.$t$);
  INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
  SELECT v + 1, section_key, order_index, title, CASE WHEN section_key = 'pasos' THEN b ELSE body END, true, created_by
  FROM public.doctrina WHERE is_active AND version = v;
  UPDATE public.doctrina SET is_active = false WHERE is_active AND version = v;
  -- 2. Reglas.
  UPDATE public.reglas SET resumen = $t$Vaciar el cargador: gastar las balas sin cuidarlas. Ante una objeción, lo normal es re-impulsar con una o dos balas, a veces tres, que respondan a lo que dijo el cliente; cada objeción que venga después va a pedir otra. LA PRUEBA, al atender una objeción, bala por bala: (1) ¿esta bala apunta a algo que el cliente dijo —su objeción, su dolor, su situación—? Una bala que no apunta a nada de lo que dijo es una bala gastada: es falla. (2) ¿El vendedor le suelta de jalón una lista de todo lo que trae, en vez de escoger las que responden a lo que dijo? Es falla. Una, dos o tres balas que apuntan a lo que dijo el cliente no son falla. Cuatro o más en una sola respuesta es señal de alerta: revísalas una por una con más cuidado; si todas apuntan y las escogió, no es falla. Quedarse sin balas en la siguiente objeción no se califica con esta regla: se califica lo que se ve en ese turno (no dio bala, o dio aire). Si antes soltó muchas, la explicación le dice que ahí se le fueron: cada objeción pide la suya.$t$, cita_cerebro = $t$Vaciar el cargador es soltar balas que no apuntan a nada de lo que dijo$t$, updated_at = now()
   WHERE id = 'objection.vacia_el_cargador' AND md5(resumen) = 'f4298c98cefd7f89cc31d2ca917c6c23' AND cita_cerebro = $t$Reserva algunas para que no importe cuántas balas tenga tu cliente$t$;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'objection.vacia_el_cargador no tiene el texto esperado'; END IF;
  SELECT resumen INTO t FROM public.reglas WHERE id = 'present.balas';
  IF t IS NULL OR (length(t) - length(replace(t, $t$y ante una objeción la bala que el vendedor escoja para ese momento.$t$, ''))) / length($t$y ante una objeción la bala que el vendedor escoja para ese momento.$t$) <> 1 THEN RAISE EXCEPTION 'present.balas no tiene el texto esperado'; END IF;
  UPDATE public.reglas SET resumen = replace(resumen, $t$y ante una objeción la bala que el vendedor escoja para ese momento.$t$, $t$y ante una objeción las que el vendedor escoja porque responden a lo que dijo el cliente: lo normal es una o dos, a veces tres, y más no es falla si todas apuntan a lo que dijo y le quedan para lo que venga.$t$), updated_at = now() WHERE id = 'present.balas';
  SELECT resumen INTO t FROM public.reglas WHERE id = 'objection.fff';
  IF t IS NULL OR (length(t) - length(replace(t, $t$«Lo que encontraron» no es la bala: es la tercera F.$t$, ''))) / length($t$«Lo que encontraron» no es la bala: es la tercera F.$t$) <> 1 THEN RAISE EXCEPTION 'objection.fff no tiene el texto esperado'; END IF;
  UPDATE public.reglas SET resumen = replace(resumen, $t$«Lo que encontraron» no es la bala: es la tercera F.$t$, $t$«Lo que encontraron» por sí solo no es la bala: es la tercera F; si ahí nombra algo concreto suyo —de su producto, su servicio o su precio—, eso sí es bala.$t$), updated_at = now() WHERE id = 'objection.fff';
  SELECT resumen INTO t FROM public.reglas WHERE id = 'objection.circulo_de_cierre';
  IF t IS NULL OR (length(t) - length(replace(t, $t$«Lo que encontraron» de FFF no es la bala: es el paso anterior.$t$, ''))) / length($t$«Lo que encontraron» de FFF no es la bala: es el paso anterior.$t$) <> 1 THEN RAISE EXCEPTION 'objection.circulo_de_cierre no tiene el texto esperado'; END IF;
  UPDATE public.reglas SET resumen = replace(resumen, $t$«Lo que encontraron» de FFF no es la bala: es el paso anterior.$t$, $t$«Lo que encontraron» de FFF, por sí solo, no es la bala: es el paso anterior; si ahí nombra algo concreto suyo —de su producto, su servicio o su precio—, eso sí es bala.$t$), updated_at = now() WHERE id = 'objection.circulo_de_cierre';
  SELECT resumen INTO t FROM public.reglas WHERE id = 'objection.cierra_sin_bala';
  IF t IS NULL OR (length(t) - length(replace(t, $t$«Lo que encontraron» de FFF no cuenta como bala, aunque sea concreto: es la tercera F, y la bala va aparte. Una bala ya dicha, aunque la repita tal cual, sí cuenta.$t$, ''))) / length($t$«Lo que encontraron» de FFF no cuenta como bala, aunque sea concreto: es la tercera F, y la bala va aparte. Una bala ya dicha, aunque la repita tal cual, sí cuenta.$t$) <> 1 THEN RAISE EXCEPTION 'objection.cierra_sin_bala no tiene el texto esperado'; END IF;
  UPDATE public.reglas SET resumen = replace(resumen, $t$«Lo que encontraron» de FFF no cuenta como bala, aunque sea concreto: es la tercera F, y la bala va aparte. Una bala ya dicha, aunque la repita tal cual, sí cuenta.$t$, $t$«Lo que encontraron» de FFF, por sí solo —«les convino», «dejaron de perder ventas»—, no cuenta como bala: es la tercera F. Pero si ahí nombra algo concreto suyo, de su producto, su servicio o su precio —«con la entrega cada martes nunca más perdieron una venta»—, eso sí es bala. Un precio con su motivo —«el primer pedido se lo dejo en mil cincuenta»— también es bala de precio. Una bala ya dicha, aunque la repita tal cual, sí cuenta.$t$), updated_at = now() WHERE id = 'objection.cierra_sin_bala';
  -- 3. Tarjetas.
  SELECT count(*) INTO n FROM public.node_cards WHERE node_id = '4.5' AND card_order = 1;
  IF n <> 1 THEN RAISE EXCEPTION 'la tarjeta 4.5 #1 no es una sola (%)', n; END IF;
  SELECT body INTO t FROM public.node_cards WHERE node_id = '4.5' AND card_order = 1;
  IF (length(t) - length(replace(t, $t$Tus balas son razones para comprar. Las del cliente son razones para no hacerlo.

$t$, ''))) / length($t$Tus balas son razones para comprar. Las del cliente son razones para no hacerlo.

$t$) <> 1 THEN RAISE EXCEPTION 'la tarjeta 4.5 #1 no tiene el texto esperado'; END IF;
  UPDATE public.node_cards SET body = replace(body, $t$Tus balas son razones para comprar. Las del cliente son razones para no hacerlo.

$t$, $t$Tus balas son razones para comprar. Las del cliente son razones para no hacerlo.

Por eso les decimos balas: cada una que disparas sube el impulso del cliente. Pero no son infinitas, y el que se queda sin ellas se queda desarmado.

$t$) WHERE node_id = '4.5' AND card_order = 1;
  SELECT count(*) INTO n FROM public.node_cards WHERE node_id = '5.7' AND card_order = 4;
  IF n <> 1 THEN RAISE EXCEPTION 'la tarjeta 5.7 #4 no es una sola (%)', n; END IF;
  SELECT body INTO t FROM public.node_cards WHERE node_id = '5.7' AND card_order = 4;
  IF (length(t) - length(replace(t, $t$PASO 4 — UNA BALA. La objeción tumbó el impulso. Responderla solo evita que siga cayendo. Lo que lo vuelve a subir es una bala: una sola, y cierras. Si sueltas tres de golpe, abrumas.$t$, ''))) / length($t$PASO 4 — UNA BALA. La objeción tumbó el impulso. Responderla solo evita que siga cayendo. Lo que lo vuelve a subir es una bala: una sola, y cierras. Si sueltas tres de golpe, abrumas.$t$) <> 1 THEN RAISE EXCEPTION 'la tarjeta 5.7 #4 no tiene el texto esperado'; END IF;
  UPDATE public.node_cards SET body = replace(body, $t$PASO 4 — UNA BALA. La objeción tumbó el impulso. Responderla solo evita que siga cayendo. Lo que lo vuelve a subir es una bala: una sola, y cierras. Si sueltas tres de golpe, abrumas.$t$, $t$PASO 4 — RE-IMPULSA CON BALAS. La objeción tumbó el impulso. Responderla solo evita que siga cayendo. Lo que lo vuelve a subir son balas: una o dos, a veces tres, que respondan a lo que te dijo. Y cuídalas: si llega otra objeción, te va a pedir las suyas.$t$) WHERE node_id = '5.7' AND card_order = 4;
  SELECT count(*) INTO n FROM public.node_cards WHERE node_id = '5.8' AND card_order = 2;
  IF n <> 1 THEN RAISE EXCEPTION 'la tarjeta 5.8 #2 no es una sola (%)', n; END IF;
  SELECT body INTO t FROM public.node_cards WHERE node_id = '5.8' AND card_order = 2;
  IF (length(t) - length(replace(t, $t$4. UNA BALA — un hecho positivo para volver a subir el impulso. Una sola.$t$, ''))) / length($t$4. UNA BALA — un hecho positivo para volver a subir el impulso. Una sola.$t$) <> 1 THEN RAISE EXCEPTION 'la tarjeta 5.8 #2 no tiene el texto esperado'; END IF;
  UPDATE public.node_cards SET body = replace(body, $t$4. UNA BALA — un hecho positivo para volver a subir el impulso. Una sola.$t$, $t$4. LA BALA — uno o dos hechos positivos, a veces tres, que respondan a su objeción, para volver a subir el impulso.$t$) WHERE node_id = '5.8' AND card_order = 2;
  SELECT count(*) INTO n FROM public.node_cards WHERE node_id = '5.10' AND card_order = 1;
  IF n <> 1 THEN RAISE EXCEPTION 'la tarjeta 5.10 #1 no es una sola (%)', n; END IF;
  SELECT body INTO t FROM public.node_cards WHERE node_id = '5.10' AND card_order = 1;
  IF (length(t) - length(replace(t, $t$2. RE-IMPULSA — una bala: la que escojas para volver a subirle el ánimo a ese cliente.$t$, ''))) / length($t$2. RE-IMPULSA — una bala: la que escojas para volver a subirle el ánimo a ese cliente.$t$) <> 1 THEN RAISE EXCEPTION 'la tarjeta 5.10 #1 no tiene el texto esperado'; END IF;
  UPDATE public.node_cards SET body = replace(body, $t$2. RE-IMPULSA — una bala: la que escojas para volver a subirle el ánimo a ese cliente.$t$, $t$2. RE-IMPULSA — con la bala o las balas que escojas para volver a subirle el ánimo a ese cliente: una o dos, a veces tres, que respondan a lo que te dijo.$t$) WHERE node_id = '5.10' AND card_order = 1;
  SELECT count(*) INTO n FROM public.node_cards WHERE node_id = '5.12' AND card_order = 1;
  IF n <> 1 THEN RAISE EXCEPTION 'la tarjeta 5.12 #1 no es una sola (%)', n; END IF;
  SELECT body INTO t FROM public.node_cards WHERE node_id = '5.12' AND card_order = 1;
  IF (length(t) - length(replace(t, $t$cada objeción con SU bala (una sola, la que le convenga a esa objeción; la apilada abruma)$t$, ''))) / length($t$cada objeción con SU bala (una sola, la que le convenga a esa objeción; la apilada abruma)$t$) <> 1 THEN RAISE EXCEPTION 'la tarjeta 5.12 #1 no tiene el texto esperado'; END IF;
  UPDATE public.node_cards SET body = replace(body, $t$cada objeción con SU bala (una sola, la que le convenga a esa objeción; la apilada abruma)$t$, $t$cada objeción con SUS balas (una o dos, a veces tres, que respondan a esa objeción; y cuídalas, porque la segunda objeción te va a pedir las suyas)$t$) WHERE node_id = '5.12' AND card_order = 1;
  SELECT count(*) INTO n FROM public.node_cards WHERE node_id = '5.10' AND card_order = 1;
  IF n <> 1 THEN RAISE EXCEPTION 'la tarjeta 5.10 #1 no es una sola (%)', n; END IF;
  SELECT body INTO t FROM public.node_cards WHERE node_id = '5.10' AND card_order = 1;
  IF (length(t) - length(replace(t, $t$Ojo: en FFF, "lo que encontramos" no es la bala. La bala va aparte, después.$t$, ''))) / length($t$Ojo: en FFF, "lo que encontramos" no es la bala. La bala va aparte, después.$t$) <> 1 THEN RAISE EXCEPTION 'la tarjeta 5.10 #1 no tiene el texto esperado'; END IF;
  UPDATE public.node_cards SET body = replace(body, $t$Ojo: en FFF, "lo que encontramos" no es la bala. La bala va aparte, después.$t$, $t$Ojo: en FFF, "lo que encontramos" por sí solo no es la bala: si te quedas en "les convino", no re-impulsaste. Pero si ahí nombras algo concreto tuyo, como "con la entrega cada martes nunca más perdieron una venta", eso sí es bala.$t$) WHERE node_id = '5.10' AND card_order = 1;
  -- 4. Guiones de práctica.
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '5.8';
  IF ps IS NULL OR ps->>'version' <> '1.1.1' THEN RAISE EXCEPTION 'el guion 5.8 no está en la versión 1.1.1 (está en %)', ps->>'version'; END IF;
  t := ps #>> '{phases,i_do,first_message}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Cinco pasos, una sola bala, y sin defenderme.$t$, ''))) / length($t$Cinco pasos, una sola bala, y sin defenderme.$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.8 no tiene el texto esperado en phases.i_do.first_message'; END IF;
  ps := jsonb_set(ps, '{phases,i_do,first_message}', to_jsonb(replace(t, $t$Cinco pasos, una sola bala, y sin defenderme.$t$, $t$Cinco pasos, una bala que le habla a su objeción, y sin defenderme.$t$)));
  t := ps #>> '{phases,you_do,prompt}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$te da UNA bala concreta y te propone el siguiente paso$t$, ''))) / length($t$te da UNA bala concreta y te propone el siguiente paso$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.8 no tiene el texto esperado en phases.you_do.prompt'; END IF;
  ps := jsonb_set(ps, '{phases,you_do,prompt}', to_jsonb(replace(t, $t$te da UNA bala concreta y te propone el siguiente paso$t$, $t$te da una o dos balas concretas (a veces tres) que le hablan a tu objeción y te propone el siguiente paso$t$)));
  t := ps #>> '{phases,you_do,prompt}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$(4) Si vacía el cargador (dos o más argumentos apilados en una respuesta), te abruma: bueno, bueno, tampoco me eche el rollo completo.$t$, ''))) / length($t$(4) Si vacía el cargador (dos o más argumentos apilados en una respuesta), te abruma: bueno, bueno, tampoco me eche el rollo completo.$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.8 no tiene el texto esperado en phases.you_do.prompt'; END IF;
  ps := jsonb_set(ps, '{phases,you_do,prompt}', to_jsonb(replace(t, $t$(4) Si vacía el cargador (dos o más argumentos apilados en una respuesta), te abruma: bueno, bueno, tampoco me eche el rollo completo.$t$, $t$(4) Si vacía el cargador —te suelta cosas que no tienen que ver con lo que le dijiste, o una lista de todo lo que trae—, te abruma: bueno, bueno, tampoco me eche el rollo completo. Una, dos o tres balas que le hablan a tu objeción NO te abruman: te convencen.$t$)));
  t := ps #>> '{phases,you_do,prompt}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$lo que encontraron otros clientes no cuenta como bala$t$, ''))) / length($t$lo que encontraron otros clientes no cuenta como bala$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.8 no tiene el texto esperado en phases.you_do.prompt'; END IF;
  ps := jsonb_set(ps, '{phases,you_do,prompt}', to_jsonb(replace(t, $t$lo que encontraron otros clientes no cuenta como bala$t$, $t$lo que encontraron otros clientes, por sí solo, no cuenta como bala, pero si ahí te nombra algo concreto suyo —su entrega, su producto, su precio— sí cuenta$t$)));
  t := ps #>> '{phases,you_do,objective}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$re-impulsa con UNA bala concreta y cierra con acción$t$, ''))) / length($t$re-impulsa con UNA bala concreta y cierra con acción$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.8 no tiene el texto esperado en phases.you_do.objective'; END IF;
  ps := jsonb_set(ps, '{phases,you_do,objective}', to_jsonb(replace(t, $t$re-impulsa con UNA bala concreta y cierra con acción$t$, $t$re-impulsa con una o dos balas concretas (a veces tres) que responden a su objeción y cierra con acción$t$)));
  t := ps #>> '{failure_criteria,2,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Suelta dos o mas balas en la misma respuesta a la objecion, en vez de una sola antes de cerrar: abruma, ninguna pega, y se queda sin municion.$t$, ''))) / length($t$Suelta dos o mas balas en la misma respuesta a la objecion, en vez de una sola antes de cerrar: abruma, ninguna pega, y se queda sin municion.$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.8 no tiene el texto esperado en failure_criteria.2.description'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,2,description}', to_jsonb(replace(t, $t$Suelta dos o mas balas en la misma respuesta a la objecion, en vez de una sola antes de cerrar: abruma, ninguna pega, y se queda sin municion.$t$, $t$Suelta balas que no apuntan a nada de lo que dijo el cliente, o una lista de todo lo que trae: abruma, ninguna pega, y se queda sin munición. Una, dos o tres balas que responden a la objeción no son esta falla.$t$)));
  t := ps #>> '{success_criteria,2,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Su re-impulso es UNA bala concreta, que responde a la objeción que puso el cliente: nunca argumentos apilados ni aire declarativo, y aguanta el ¿a poco?$t$, ''))) / length($t$Su re-impulso es UNA bala concreta, que responde a la objeción que puso el cliente: nunca argumentos apilados ni aire declarativo, y aguanta el ¿a poco?$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.8 no tiene el texto esperado en success_criteria.2.description'; END IF;
  ps := jsonb_set(ps, '{success_criteria,2,description}', to_jsonb(replace(t, $t$Su re-impulso es UNA bala concreta, que responde a la objeción que puso el cliente: nunca argumentos apilados ni aire declarativo, y aguanta el ¿a poco?$t$, $t$Su re-impulso son balas concretas, y cada una responde a la objeción que puso el cliente (lo normal es una o dos, a veces tres; más no le resta si todas apuntan): ninguna que no apunte a lo que dijo, ninguna lista de todo lo que trae, nada de aire declarativo, y aguantan el ¿a poco?$t$)));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ v1.2.0 (mensaje 168, Emilio 18 y 23-nov): ante la objeción, una o dos balas, a veces tres, que respondan a lo que dijo el cliente. Vaciar el cargador es soltar balas que no apuntan, soltar de jalón todo lo que trae, o gastarse tantas que no quede con qué para la siguiente objeción; ya no se cuenta desde dos.$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('1.2.0'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '5.8';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '5.10';
  IF ps IS NULL OR ps->>'version' <> '2.2.0' THEN RAISE EXCEPTION 'el guion 5.10 no está en la versión 2.2.0 (está en %)', ps->>'version'; END IF;
  t := ps #>> '{phases,you_do,prompt}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$te da UNA BALA —un hecho positivo concreto, nuevo o que ya te habia dicho—$t$, ''))) / length($t$te da UNA BALA —un hecho positivo concreto, nuevo o que ya te habia dicho—$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.10 no tiene el texto esperado en phases.you_do.prompt'; END IF;
  ps := jsonb_set(ps, '{phases,you_do,prompt}', to_jsonb(replace(t, $t$te da UNA BALA —un hecho positivo concreto, nuevo o que ya te habia dicho—$t$, $t$te da AL MENOS UNA BALA —un hecho positivo concreto, nuevo o que ya te habia dicho; una o dos, a veces tres, que le hablen a tu preocupacion, tambien estan bien—$t$)));
  t := ps #>> '{phases,you_do,prompt}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$(lo que encontraron otros clientes no cuenta como bala)$t$, ''))) / length($t$(lo que encontraron otros clientes no cuenta como bala)$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.10 no tiene el texto esperado en phases.you_do.prompt'; END IF;
  ps := jsonb_set(ps, '{phases,you_do,prompt}', to_jsonb(replace(t, $t$(lo que encontraron otros clientes no cuenta como bala)$t$, $t$(lo que encontraron otros clientes, por si solo, no cuenta como bala; si ahi te nombra algo concreto suyo —su entrega, su producto, su precio—, si cuenta)$t$)));
  t := ps #>> '{phases,you_do,objective}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$re-impulsa con UNA bala (la que escoja: nueva o ya dicha)$t$, ''))) / length($t$re-impulsa con UNA bala (la que escoja: nueva o ya dicha)$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.10 no tiene el texto esperado en phases.you_do.objective'; END IF;
  ps := jsonb_set(ps, '{phases,you_do,objective}', to_jsonb(replace(t, $t$re-impulsa con UNA bala (la que escoja: nueva o ya dicha)$t$, $t$re-impulsa con la bala o las balas que escoja (nuevas o ya dichas)$t$)));
  t := ps #>> '{success_criteria,1,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$mete UNA bala concreta, la que escoja para volver a subir el impulso:$t$, ''))) / length($t$mete UNA bala concreta, la que escoja para volver a subir el impulso:$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.10 no tiene el texto esperado en success_criteria.1.description'; END IF;
  ps := jsonb_set(ps, '{success_criteria,1,description}', to_jsonb(replace(t, $t$mete UNA bala concreta, la que escoja para volver a subir el impulso:$t$, $t$mete al menos una bala concreta, la que escoja para volver a subir el impulso:$t$)));
  t := ps #>> '{success_criteria,1,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Lo que encontraron otros clientes, en FFF, no es la bala.$t$, ''))) / length($t$Lo que encontraron otros clientes, en FFF, no es la bala.$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.10 no tiene el texto esperado en success_criteria.1.description'; END IF;
  ps := jsonb_set(ps, '{success_criteria,1,description}', to_jsonb(replace(t, $t$Lo que encontraron otros clientes, en FFF, no es la bala.$t$, $t$Lo que encontraron otros clientes, en FFF, por sí solo no es la bala; si ahí nombra algo concreto suyo —de su producto, su servicio o su precio—, sí lo es.$t$)));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ v2.3.0 (mensaje 168, Emilio 18 y 23-nov): el re-impulso puede ser una o dos balas, a veces tres, que respondan a la preocupación; lo que no se vale es saltárselo.$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.3.0'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '5.10';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '5.12';
  IF ps IS NULL OR ps->>'version' <> '1.3.0' THEN RAISE EXCEPTION 'el guion 5.12 no está en la versión 1.3.0 (está en %)', ps->>'version'; END IF;
  t := ps #>> '{phases,you_do,prompt}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$cargador vaciado (dos o más argumentos juntos) → te abruma y la cadena se alarga;$t$, ''))) / length($t$cargador vaciado (dos o más argumentos juntos) → te abruma y la cadena se alarga;$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.12 no tiene el texto esperado en phases.you_do.prompt'; END IF;
  ps := jsonb_set(ps, '{phases,you_do,prompt}', to_jsonb(replace(t, $t$cargador vaciado (dos o más argumentos juntos) → te abruma y la cadena se alarga;$t$, $t$cargador vaciado (te suelta cosas que no tienen que ver con tu duda, o una lista de todo lo que trae) → te abruma y la cadena se alarga; una, dos o tres balas que le hablan a tu duda no te abruman; si en la primera te soltó todo lo que traía y en la segunda ya no tiene nada concreto que le hable a tu nueva duda, lo notas y no te convence: ¿y eso qué tiene que ver con lo que le digo?;$t$)));
  t := ps #>> '{phases,you_do,objective}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$y le da SU propia bala, la que escoja para esa objeción (sin apilarlas),$t$, ''))) / length($t$y le da SU propia bala, la que escoja para esa objeción (sin apilarlas),$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.12 no tiene el texto esperado en phases.you_do.objective'; END IF;
  ps := jsonb_set(ps, '{phases,you_do,objective}', to_jsonb(replace(t, $t$y le da SU propia bala, la que escoja para esa objeción (sin apilarlas),$t$, $t$y le da sus propias balas, las que escoja porque responden a esa objeción (una o dos, a veces tres, cuidándolas para la siguiente),$t$)));
  t := ps #>> '{failure_criteria,2,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Suelta dos o mas balas en una misma respuesta de la cadena.$t$, ''))) / length($t$Suelta dos o mas balas en una misma respuesta de la cadena.$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.12 no tiene el texto esperado en failure_criteria.2.description'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,2,description}', to_jsonb(replace(t, $t$Suelta dos o mas balas en una misma respuesta de la cadena.$t$, $t$Suelta balas que no apuntan a la objeción, o una lista de todo lo que trae.$t$)));
  t := ps #>> '{success_criteria,1,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Dosificación bajo presión: UNA bala por objeción, la que el vendedor escoja para esa objeción (puede ser una ya dicha), sin apilar argumentos, y sus balas aguantan el ¿a poco?$t$, ''))) / length($t$Dosificación bajo presión: UNA bala por objeción, la que el vendedor escoja para esa objeción (puede ser una ya dicha), sin apilar argumentos, y sus balas aguantan el ¿a poco?$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.12 no tiene el texto esperado en success_criteria.1.description'; END IF;
  ps := jsonb_set(ps, '{success_criteria,1,description}', to_jsonb(replace(t, $t$Dosificación bajo presión: UNA bala por objeción, la que el vendedor escoja para esa objeción (puede ser una ya dicha), sin apilar argumentos, y sus balas aguantan el ¿a poco?$t$, $t$Dosificación bajo presión: para cada objeción, las balas que el vendedor escoja porque responden a ella (puede ser una ya dicha; lo normal es una o dos, a veces tres, y más no le resta si todas apuntan), y sus balas aguantan el ¿a poco?$t$)));
  t := ps #>> '{success_criteria,3,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$re-impulsa con UNA bala (la que escoja: una que no habia dicho o una ya dicha)$t$, ''))) / length($t$re-impulsa con UNA bala (la que escoja: una que no habia dicho o una ya dicha)$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.12 no tiene el texto esperado en success_criteria.3.description'; END IF;
  ps := jsonb_set(ps, '{success_criteria,3,description}', to_jsonb(replace(t, $t$re-impulsa con UNA bala (la que escoja: una que no habia dicho o una ya dicha)$t$, $t$re-impulsa con la bala o las balas que escoja (nuevas o ya dichas)$t$)));
  t := ps #>> '{success_criteria,3,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Lo que encontraron de FFF no es la bala.$t$, ''))) / length($t$Lo que encontraron de FFF no es la bala.$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.12 no tiene el texto esperado en success_criteria.3.description'; END IF;
  ps := jsonb_set(ps, '{success_criteria,3,description}', to_jsonb(replace(t, $t$Lo que encontraron de FFF no es la bala.$t$, $t$Lo que encontraron de FFF, por sí solo, no es la bala; si ahí nombra algo concreto suyo, sí lo es.$t$)));
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(ps->'failure_criteria') x WHERE x->>'id' = 'salta_la_bala') THEN RAISE EXCEPTION 'el guion 5.12 ya tiene la falla salta_la_bala'; END IF;
  ps := jsonb_set(ps, '{failure_criteria}', (ps->'failure_criteria') || jsonb_build_array($t${"id": "salta_la_bala", "regla_id": "objection.cierra_sin_bala", "severity": "major", "description": "Ante cualquiera de las objeciones, la atiende y vuelve a pedir la decision sin dar antes ninguna bala que suba el impulso. Si lo que da es aire («de verdad le conviene»), eso es bala_se_cae, no esta. Si en una objecion anterior solto muchas balas, la explicacion le dice que ahi se le fueron: cada objecion pide la suya."}$t$::jsonb));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ v1.4.0 (mensaje 168, Emilio 18 y 23-nov): el cargador ya no se cuenta desde dos. Cada objeción con una o dos balas, a veces tres, que respondan a ella; vaciar el cargador es soltar balas que no apuntan, soltar de jalón todo lo que trae, o gastarse tantas en la primera que en la segunda ya no tiene nada concreto. El espejo hace sentir eso último; en la calificación, lo que se ve en la segunda objeción es salta_la_bala (no da bala) o bala_se_cae (da aire), y la explicación le dice la causa.$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('1.4.0'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '5.12';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '5.15';
  IF ps IS NULL OR ps->>'version' <> '1.3.1' THEN RAISE EXCEPTION 'el guion 5.15 no está en la versión 1.3.1 (está en %)', ps->>'version'; END IF;
  t := ps #>> '{phases,you_do,prompt}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$cargador vaciado te abruma,$t$, ''))) / length($t$cargador vaciado te abruma,$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.15 no tiene el texto esperado en phases.you_do.prompt'; END IF;
  ps := jsonb_set(ps, '{phases,you_do,prompt}', to_jsonb(replace(t, $t$cargador vaciado te abruma,$t$, $t$cargador vaciado (balas que no tienen que ver con lo que le dijiste, o una lista de todo lo que trae) te abruma; si en la primera te soltó todo lo que traía y en la segunda ya no tiene nada concreto que le hable a tu nueva duda, lo notas y no te convence: ¿y eso qué tiene que ver con lo que le digo?;$t$)));
  t := ps #>> '{failure_criteria,6,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Bajo presion suelta dos o mas balas en una misma respuesta.$t$, ''))) / length($t$Bajo presion suelta dos o mas balas en una misma respuesta.$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.15 no tiene el texto esperado en failure_criteria.6.description'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,6,description}', to_jsonb(replace(t, $t$Bajo presion suelta dos o mas balas en una misma respuesta.$t$, $t$Bajo presión suelta balas que no apuntan a la objeción, o una lista de todo lo que trae.$t$)));
  t := ps #>> '{success_criteria,4,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$re-impulsa con UNA bala (la que escoja: una que no habia dicho o una ya dicha)$t$, ''))) / length($t$re-impulsa con UNA bala (la que escoja: una que no habia dicho o una ya dicha)$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.15 no tiene el texto esperado en success_criteria.4.description'; END IF;
  ps := jsonb_set(ps, '{success_criteria,4,description}', to_jsonb(replace(t, $t$re-impulsa con UNA bala (la que escoja: una que no habia dicho o una ya dicha)$t$, $t$re-impulsa con la bala o las balas que escoja (nuevas o ya dichas)$t$)));
  t := ps #>> '{success_criteria,4,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Lo que encontraron de FFF no es la bala.$t$, ''))) / length($t$Lo que encontraron de FFF no es la bala.$t$) <> 1 THEN RAISE EXCEPTION 'el guion 5.15 no tiene el texto esperado en success_criteria.4.description'; END IF;
  ps := jsonb_set(ps, '{success_criteria,4,description}', to_jsonb(replace(t, $t$Lo que encontraron de FFF no es la bala.$t$, $t$Lo que encontraron de FFF, por sí solo, no es la bala; si ahí nombra algo concreto suyo, sí lo es.$t$)));
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(ps->'failure_criteria') x WHERE x->>'id' = 'salta_la_bala') THEN RAISE EXCEPTION 'el guion 5.15 ya tiene la falla salta_la_bala'; END IF;
  ps := jsonb_set(ps, '{failure_criteria}', (ps->'failure_criteria') || jsonb_build_array($t${"id": "salta_la_bala", "regla_id": "objection.cierra_sin_bala", "severity": "major", "description": "Ante cualquiera de las objeciones, la atiende y vuelve a pedir la decision sin dar antes ninguna bala que suba el impulso. Si lo que da es aire («de verdad le conviene»), eso es bala_se_cae, no esta. Si en una objecion anterior solto muchas balas, la explicacion le dice que ahi se le fueron: cada objecion pide la suya."}$t$::jsonb));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ v1.4.0 (mensaje 168, Emilio 18 y 23-nov): el cargador ya no se cuenta desde dos; vaciarlo es soltar balas que no apuntan, soltar de jalón todo lo que trae, o gastarse tantas en la primera objeción que en la segunda ya no tiene nada concreto; en la calificación, lo que se ve en la segunda objeción es salta_la_bala (no da bala) o bala_se_cae (da aire), y la explicación le dice la causa.$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('1.4.0'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '5.15';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '7.0';
  IF ps IS NULL OR ps->>'version' <> '1.2.0' THEN RAISE EXCEPTION 'el guion 7.0 no está en la versión 1.2.0 (está en %)', ps->>'version'; END IF;
  t := ps #>> '{failure_criteria,5,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Lo que encontraron otros clientes, en FFF, no es la bala.$t$, ''))) / length($t$Lo que encontraron otros clientes, en FFF, no es la bala.$t$) <> 1 THEN RAISE EXCEPTION 'el guion 7.0 no tiene el texto esperado en failure_criteria.5.description'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,5,description}', to_jsonb(replace(t, $t$Lo que encontraron otros clientes, en FFF, no es la bala.$t$, $t$Lo que encontraron otros clientes, en FFF, por sí solo no es la bala; si ahí nombra algo concreto suyo —de su producto, su servicio o su precio—, sí lo es.$t$)));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ v1.2.1 (mensaje 168, Emilio 18 y 23-nov): «lo que encontraron» por sí solo no es la bala; si ahí nombra algo concreto suyo, de su producto, su servicio o su precio, sí lo es.$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('1.2.1'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '7.0';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '7.4';
  IF ps IS NULL OR ps->>'version' <> '1.1.0' THEN RAISE EXCEPTION 'el guion 7.4 no está en la versión 1.1.0 (está en %)', ps->>'version'; END IF;
  t := ps #>> '{failure_criteria,4,description}';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Lo que encontraron otros clientes, en FFF, no es la bala.$t$, ''))) / length($t$Lo que encontraron otros clientes, en FFF, no es la bala.$t$) <> 1 THEN RAISE EXCEPTION 'el guion 7.4 no tiene el texto esperado en failure_criteria.4.description'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,4,description}', to_jsonb(replace(t, $t$Lo que encontraron otros clientes, en FFF, no es la bala.$t$, $t$Lo que encontraron otros clientes, en FFF, por sí solo no es la bala; si ahí nombra algo concreto suyo —de su producto, su servicio o su precio—, sí lo es.$t$)));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ v1.1.1 (mensaje 168, Emilio 18 y 23-nov): «lo que encontraron» por sí solo no es la bala; si ahí nombra algo concreto suyo, de su producto, su servicio o su precio, sí lo es.$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('1.1.1'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '7.4';
  -- 5. Verificación.
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  SELECT count(*) INTO n FROM public.doctrina WHERE is_active;
  IF n <> 7 THEN RAISE EXCEPTION 'el Cerebro activo tiene % secciones, no 7', n; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.doctrina d, public.reglas r WHERE d.is_active AND d.section_key = 'pasos' AND r.id = 'objection.vacia_el_cargador' AND strpos(d.body, r.cita_cerebro) > 0) THEN RAISE EXCEPTION 'la cita de objection.vacia_el_cargador no está en el Cerebro activo'; END IF;
END
$do$;

-- Para pegarle a Claude: la versión del Cerebro activa y los md5 de lo que cambió.
SELECT 'cerebro' AS que, max(version)::text AS valor FROM public.doctrina WHERE is_active
UNION ALL SELECT 'pasos', md5(body) FROM public.doctrina WHERE is_active AND section_key = 'pasos'
UNION ALL SELECT id, md5(resumen) FROM public.reglas WHERE id IN ('objection.vacia_el_cargador', 'present.balas', 'objection.fff', 'objection.circulo_de_cierre', 'objection.cierra_sin_bala')
UNION ALL SELECT 'tarjeta ' || node_id || ' #' || card_order, md5(body) FROM public.node_cards WHERE (node_id, card_order) IN (('4.5', 1), ('5.7', 4), ('5.8', 2), ('5.10', 1), ('5.12', 1))
UNION ALL SELECT 'guion ' || id, practice_script->>'version' FROM public.nodes WHERE id IN ('5.8', '5.10', '5.12', '5.15', '7.0', '7.4');
