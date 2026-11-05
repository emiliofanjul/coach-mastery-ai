-- Mensaje 136 (5-nov-2026) · Mundo 5, tanda 1: el contenido.
-- Cerebro v19 → v20 (aguantar no garantiza el sí; buscarle solución a una objeción no es insistir), 1 regla,
-- tarjetas del mundo 5, 4 preguntas de quiz corregidas (5.0 y 5.4) y 15 nuevas (5.2, 5.5, 5.7, 5.9 y 5.11).
-- Todo protegido: cada cambio se hace solo si lo de hoy es exactamente lo esperado. El chequeo del final aborta si algo no quedó.
-- Correrlo dos veces no cambia nada.

DO $c$ DECLARE v int; BEGIN
  IF EXISTS (SELECT 1 FROM public.doctrina WHERE is_active AND strpos(body, $v$o te contestes solo. Si el cliente te pregunta algo, contestarle no es llenar el silencio.

**Aguantar no garantiza el sí** `CAMPO`: aguantar es el movimiento correcto, pero la gente no reacciona igual. Unos deciden ahí mismo; otros, aunque hayas hecho todo bien, te contestan *"déjeme pensarlo"*. Eso no es un castigo por algo que hiciste mal: es una objeción, y se trabaja como objeción.$v$) > 0) THEN RAISE NOTICE 'El Cerebro ya tiene el cambio del 136.'; RETURN; END IF;
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  IF v <> 19 THEN RAISE EXCEPTION 'se esperaba el Cerebro v19 y está el v%', v; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND is_active AND strpos(body, $v$o te contestes solo. Si el cliente te pregunta algo, contestarle no es llenar el silencio.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado (cambio 1)'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND is_active AND strpos(body, $v$- **«Lo voy a pensar» no es un «no»** `CAMPO`: es una objeción, y se maneja como objeción. Un «no» es *"no, gracias, ahorita no quiero"*.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado (cambio 2)'; END IF;
  INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
  SELECT v + 1, section_key, order_index, title, replace(replace(body, $v$o te contestes solo. Si el cliente te pregunta algo, contestarle no es llenar el silencio.$v$, $v$o te contestes solo. Si el cliente te pregunta algo, contestarle no es llenar el silencio.

**Aguantar no garantiza el sí** `CAMPO`: aguantar es el movimiento correcto, pero la gente no reacciona igual. Unos deciden ahí mismo; otros, aunque hayas hecho todo bien, te contestan *"déjeme pensarlo"*. Eso no es un castigo por algo que hiciste mal: es una objeción, y se trabaja como objeción.$v$), $v$- **«Lo voy a pensar» no es un «no»** `CAMPO`: es una objeción, y se maneja como objeción. Un «no» es *"no, gracias, ahorita no quiero"*.$v$, $v$- **«Lo voy a pensar» no es un «no»** `CAMPO`: es una objeción, y se maneja como objeción. Un «no» es *"no, gracias, ahorita no quiero"*.
- **Buscarle solución a una objeción no es insistir** `CAMPO`: *"ahorita no puedo, hasta el otro mes que cobre lo del contrato"* también es una objeción. Está bien darle la vuelta y volver a cerrar: hecho bien, no se siente insistente, porque estás buscando cómo ayudarlo. El límite es el de siempre: dos no seguidos y te vas.$v$), true, created_by
  FROM public.doctrina WHERE version = v AND is_active;
  UPDATE public.doctrina SET is_active = false WHERE is_active AND version = v;
END $c$;

UPDATE public.reglas SET resumen = $v$Después de pedir la decisión, el silencio es del cliente: el primero que habla después de un cierre, pierde. LA PRUEBA: después de pedir la decisión y antes de que el cliente decida, ¿el vendedor se queda en su pregunta —sin retractarse, suavizarla, agregar descuentos o argumentos, ni contestarse solo—? Contestar una pregunta del cliente no rompe el silencio. Aguantar no garantiza el sí: si después el cliente pone una objeción («déjeme pensarlo»), no es falla del vendedor; se trabaja como objeción.$v$, updated_at = now()
WHERE id = 'close.aguanta_silencio' AND resumen = $v$Después de pedir la decisión, el silencio es del cliente: el primero que habla después de un cierre, pierde. LA PRUEBA: después de pedir la decisión y antes de que el cliente decida, ¿el vendedor se queda en su pregunta —sin retractarse, suavizarla, agregar descuentos o argumentos, ni contestarse solo—? Contestar una pregunta del cliente no rompe el silencio.$v$;

UPDATE public.node_cards SET body = $v$No, si hiciste el trabajo. Un cierre no es algo que le haces a alguien: es un acuerdo, cuando el cliente se da cuenta de que el beneficio supera al costo y decide.

El cierre asumido es la CONSECUENCIA natural de una conversación donde el cliente conectó su dolor, hizo la cuenta, te fue diciendo que sí y preguntó cuándo entregas. Preguntarle "¿le interesa?" después de todo eso es ofenderlo: él ya te lo dijo de cinco formas.

Ahora, si NO hiciste el trabajo —sin valor, sin síes, sin señales—, el cierre asumido se siente como atropello y el cliente te frena. El cierre no arregla una mala conversación. Solo cosecha una buena.$v$
WHERE node_id = '5.0' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'b18e7b1432a8bdd6de864ac4bec4512e';

UPDATE public.node_cards SET body = $v$Antes de decir que sí, la gente manda señales. No lo hace a propósito, ni se da cuenta.

Son ocho, y se llaman FISHBBOD. También se les dice señales de alto, porque cuando aparecen, tu presentación tiene que DETENERSE.$v$
WHERE node_id = '5.2' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'f0ef0440b8e2e613d8f0a6b2ae5c3bff';

UPDATE public.node_cards SET body = $v$F — FUTURE TALK / Habla del futuro: ya se imagina teniéndolo
I — I WANT, I NEED / Quiero, necesito: lo dice en voz alta
S — SILENCE / Silencio: se queda pensando, calculando
H — HOW MUCH, HOW SOON / Cuánto, cuándo: pregunta condiciones
B — BODY LANGUAGE / Lenguaje corporal: se acerca, toma el producto
B — BASHING COMPETITOR / Habla mal de su proveedor actual
O — OFFERS OF COURTESY / Ofertas de cortesía: te ofrece café, una silla
D — DEEPER QUESTIONS / Preguntas más profundas: entra en detalle$v$
WHERE node_id = '5.2' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '6a85fdb02fb6a8502873c4cf0ae7bd82';

UPDATE public.node_cards SET title = $v$Las más fáciles de leer$v$, body = $v$HABLA DEL FUTURO — "¿y dónde me lo entregarían?", "si lo pido, ¿cada cuánto surten?"

SILENCIO — se queda callado, calculando. No lo llenes: está decidiendo.

CUÁNTO Y CUÁNDO — "¿cuánto sería lo mínimo?", "¿para cuándo lo tendría?". "¿Y cuándo me lo entregan?" es de las señales más fuertes que hay.

HABLA MAL DE SU PROVEEDOR — "el que tengo siempre me queda mal con las entregas".$v$
WHERE node_id = '5.2' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'bf90b913abb3a9993fb6618c870aa1b6';

UPDATE public.node_cards SET title = $v$Qué hacer cuando la ves: DETENTE$v$, body = $v$Aquí está el error que cuesta más ventas de las que nadie cree.

El cliente da una señal, el vendedor la ve, y como todavía le quedaban dos argumentos buenos, los suelta.

Y el impulso BAJA. Porque el cliente ya estaba listo, y seguir vendiéndole le comunica que hay algo que convencerlo, o peor, le da tiempo de encontrar una razón para no hacerlo.

Si la señal es una pregunta, la contestas y cierras en el mismo turno: "los jueves. ¿Se lo aparto para este o para el siguiente?". Agregar aunque sea un beneficio más es seguir presentando.

Señal de compra = deja de presentar y cierra. Aunque te queden balas. De hecho, sobre todo si te quedan.$v$
WHERE node_id = '5.2' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '256f9ffbcc5b6c7bf9fa1d5ef1f9c677';

UPDATE public.node_cards SET body = $v$"Está caro." "Ya tengo proveedor." "Déjeme pensarlo."

¿Sabes qué tienen en común? El cliente ENTENDIÓ tu oferta, la está considerando en serio... y te está diciendo qué le falta para decir que sí.

El que no tiene interés no objeta: se despide. "No, gracias, ahorita no quiero", y hasta ahí. El que objeta sigue en la plática. Una objeción bien respondida termina en venta.$v$
WHERE node_id = '5.4' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'fbd47825dc8da3b462b8a11d02365559';

UPDATE public.node_cards SET body = $v$BLOQUEO — el reflejo antes de entender: "no me interesa" antes de saber qué traes. Se atraviesa con AIR: le das la razón, lo ignoras y retomas. Ya lo dominas desde el Mundo 2.

OBJECIÓN — llega después de entender tu oferta, con un motivo concreto. Y aquí AIR NO APLICA: ignorar una objeción y cambiar de tema es faltarle al respeto a alguien que te habló en serio, y la confianza se rompe ahí mismo.

Confundirlos sale carísimo en las dos direcciones.$v$
WHERE node_id = '5.4' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '950833e3452f952f4af32323ec98daa1';

UPDATE public.node_cards SET title = $v$"Lo voy a pensar" no es un no.$v$, body = $v$Un no es "no, gracias, ahorita no quiero".

"Lo voy a pensar", "ahorita no puedo, hasta el otro mes que cobre" o "déjeme consultarlo con mi socio" no son un no: son objeciones. El cliente te está diciendo qué le falta.

Y a una objeción se le busca solución. Hecho bien, no se siente insistente: estás buscando cómo ayudarlo.$v$
WHERE node_id = '5.4' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '23bd5e1424da6642572269d4e32dc719';

UPDATE public.node_cards SET title = $v$Cada especie, su herramienta$v$, body = $v$BLOQUEO en la puerta → AIR. Esa ya la tienes.

OBJECIÓN MENOR, de las de todos los días —el precio, el día de entrega, el mínimo— → RRR: repites, respondes con un dato concreto y retomas. Es el siguiente nodo.

PREOCUPACIÓN SERIA O PERSONAL —le fallaron antes, anda apretado de dinero— → FFF: entiendo, sintió, encontramos. Viene después.

Y con cualquiera de las dos, nunca discutas: ganar la discusión es perder la venta.$v$
WHERE node_id = '5.4' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '3c5a42f6a4ad166292216dedb33e8fca';

UPDATE public.node_cards SET body = $v$En el Descubrimiento aprendiste RRR — Read, Relate, Relax: leer al cliente y ajustar tu ritmo.

Este es otro RRR distinto, con las mismas siglas. Así viene en la doctrina original, y por eso lo conservamos con su nombre.

R — REPEAT / Repite
R — REASSURE / Tranquiliza
R — RESUME / Retoma

Aquel sirve para leer personas. Este sirve para atravesar objeciones menores.$v$
WHERE node_id = '5.5' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '65f506cf74b4d515ad5234f1afe50143';

UPDATE public.node_cards SET title = $v$Para las de todos los días$v$, body = $v$Hay objeciones que salen una y otra vez y no son graves: el precio, el día de entrega, el mínimo. Algo que solo necesita una respuesta clara.

Para esas es RRR.

REPITE la objeción con sus palabras, para que vea que la escuchaste: "o sea que el jueves no le acomoda". TRANQUILIZA con la respuesta concreta. Y RETOMA donde ibas.$v$
WHERE node_id = '5.5' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '143f5007d6d37535cd4a3e87be141163';

UPDATE public.node_cards SET body = $v$Repetir y responder es fácil. Lo que falla siempre es lo que viene después.

El vendedor responde bien... y se queda callado esperando a ver si la respuesta le gustó. En ese silencio el cliente encuentra la siguiente objeción, o simplemente dice que lo va a pensar.

Retomar significa seguir de largo, en la misma respiración, como si la objeción hubiera sido un comentario más. Sin pausa.$v$
WHERE node_id = '5.5' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '84f40f79b3665c337ee297bd957bef80';

UPDATE public.node_cards SET title = $v$Cuándo NO usar RRR$v$, body = $v$RRR es para las objeciones menores, de las de todos los días: el precio, el día de entrega, el mínimo, la forma de pago. Cosas que se resuelven con un dato claro.

Si la usas para algo que de verdad le preocupa al cliente —que le fallaron antes, que anda apretado de dinero, que quedó mal con sus propios clientes—, se siente a que lo despachaste.

Para esas hay otra herramienta, y es la del siguiente nodo.$v$
WHERE node_id = '5.5' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '00b50bf08a1dde138138183969722f50';

UPDATE public.node_cards SET body = $v$REPITE — en sus propios términos: "Entiendo, le preocupa el plazo de entrega". Con eso ya sabe que lo escuchaste.

TRANQUILIZA — la respuesta concreta. Nada de generalidades: un dato, un tiempo, una condición.

RETOMA — sigues, en la misma respiración. Sin esperar a ver si le convenció.$v$
WHERE node_id = '5.6' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '1e9b230ab8a003761bb7ff5b5f10f813';

UPDATE public.node_cards SET flip_back_text = $v$Se defendió. Y la defensa confirma que hay algo que defender. Además no dio ni un dato concreto: puras afirmaciones que cualquiera diría. El cliente se queda con la misma duda, y ahora además incómodo.$v$
WHERE node_id = '5.6' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'f72febf21aacce0d402ef6d142f6ac5c';

UPDATE public.node_cards SET body = $v$Entiendo, le preocupa el plazo. Dentro de la ciudad entregamos en veinticuatro horas, y si pide antes de mediodía sale el mismo día. Y dígame, ¿cuántas cajas maneja usted al mes normalmente?$v$, flip_back_text = $v$Repitió, respondió con datos concretos y siguió sin pausa. Fíjate en que no preguntó si así sí le parece bien: eso habría abierto la puerta a otra duda. Retomó el control y avanzó.$v$
WHERE node_id = '5.6' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '5a9ce1f1eb712d43c7846e021bbdb7a6';

UPDATE public.node_cards SET title = $v$Cuando la objeción es de verdad$v$, body = $v$A veces lo que el cliente pone sobre la mesa no es un trámite. Es algo que le preocupa de verdad: le fallaron antes, tiene el flujo apretado, lo quemaron con una promesa.

Ahí RRR se queda corto. Responder rápido y seguir se siente a que no lo escuchaste.

Para esas existe FFF.$v$
WHERE node_id = '5.7' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '2554ce9e486101255b9d6fed5d116cb9';

UPDATE public.node_cards SET body = $v$F — FEEL / Entiendo
F — FELT / Sintió
F — FOUND / Encontramos

"Entiendo perfecto lo que me dice. Mi último cliente sentía lo mismo. Y lo que encontramos fue..."

Y ojo con esto, porque es lo que casi nadie sabe: FFF no termina en la tercera F. El procedimiento completo son CINCO pasos.$v$
WHERE node_id = '5.7' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '4553da91303e2e56f04d0a6fa69b52e9';

UPDATE public.node_cards SET body = $v$ENTIENDO — estar de acuerdo con él te vuelve distinto del vendedor promedio, y por eso te escucha. Nunca discutas con un cliente: ganar la discusión es perder la venta.

SINTIÓ — "mi último cliente sentía lo mismo". Le dice que no está solo y que su preocupación es normal.

ENCONTRAMOS — "y lo que encontramos fue...". Aquí va la razón por la que otros como él cambiaron de opinión. Fíjate que esto ES el Efecto Jones en acción.$v$
WHERE node_id = '5.7' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '1563906dc11f490fd60174375208004d';

UPDATE public.node_cards SET body = $v$PASO 4 — UNA BALA. La objeción tumbó el impulso. Responderla solo evita que siga cayendo. Lo que lo vuelve a subir es una bala: una sola, y cierras. Si sueltas tres de golpe, abrumas.

PASO 5 — CIERRA CON ACCIÓN. No preguntes si ya quedó claro. Muévelo al siguiente paso.

Cinco pasos. El que se queda en tres respondió la objeción y perdió la venta.$v$
WHERE node_id = '5.7' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '4901a8a15b72ab676ea01f1b26da99e6';

UPDATE public.node_cards SET body = $v$El cliente entendió tu oferta, le interesa, y trae una objeción real: el precio, su proveedor de años, o el socio al que le consulta todo.

Aquí va FFF completo, los cinco pasos. Y ojo con la trampa: tu instinto del Mundo 2 va a querer aplicar AIR. NO. Esto no es un reflejo: es una persona hablándote en serio. Respóndele en serio.$v$
WHERE node_id = '5.8' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'de32381dc72a368a21e207dc822c0826';

UPDATE public.node_cards SET body = $v$1. ENTIENDO — valida de verdad, sin peros.
2. SINTIÓ — mi último cliente sentía lo mismo.
3. ENCONTRAMOS — la razón por la que cambió de opinión.
4. UNA BALA — un hecho positivo para volver a subir el impulso. Una sola.
5. CIERRA CON ACCIÓN — el siguiente paso concreto.

Los cinco, completos. El que se queda en tres respondió la objeción y perdió la venta.$v$
WHERE node_id = '5.8' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '330831a8afbe7a8a8f81b8fd7b780b2d';

UPDATE public.node_cards SET body = $v$Es la regla que sostiene toda la técnica.

Cuando alguien te dice que le fallaron antes, la reacción natural es defenderte: "nosotros no somos así", "eso con nosotros no pasa". Y en ese momento lo pusiste a él en el papel de tener que defender su experiencia.

Estar de acuerdo primero te vuelve distinto del vendedor promedio, y por eso te escucha. Ganar la discusión es perder la venta.$v$
WHERE node_id = '5.8' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '06e34fa60fc6ad978dad291ea868fa54';

UPDATE public.node_cards SET body = $v$Ya tienes todas las piezas. Así se arman:

CIERRAS CON ACCIÓN.
Si llega una objeción, el impulso BAJA.
La atraviesas con RRR o con FFF.
RE-IMPULSAS con una bala nueva.
Y CIERRAS CON ACCIÓN otra vez.

Y si llega otra objeción, vuelves a girar. Eso es el Círculo de Cierre.$v$
WHERE node_id = '5.9' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '7652bcd7fef18fa1610a6b57ed8d987c';

UPDATE public.node_cards SET title = $v$Por qué el orden importa$v$, body = $v$El error más común de todos los que verás en este mundo: atravesar la objeción y cerrar de inmediato, saltándote la bala.

Técnicamente respondiste. Pero el impulso quedó abajo, y estás pidiendo una decisión en el punto más bajo de la conversación.

Atravesar detiene la caída. La bala lo vuelve a subir. Cerrar sin ese paso intermedio es pedirle a alguien desanimado que decida.$v$
WHERE node_id = '5.9' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'e18e32d21906a09833db82a8183403d3';

UPDATE public.node_cards SET title = $v$Aquí se entiende lo de guardar munición$v$, body = $v$Cada vuelta del círculo te consume una bala.

Si disparaste todo tu arsenal en la presentación porque querías impresionar, llegas a la tercera objeción sin nada nuevo que decir. Repites lo mismo tal cual, y repetir no sube el impulso: lo desgasta.

El vendedor que dosificó llega a la tercera vuelta con munición fresca. Por eso gana conversaciones que el otro pierde.$v$
WHERE node_id = '5.9' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '1f4232f284286771a152ab445ed38c6c';

UPDATE public.node_cards SET title = $v$Cuántas vueltas aguanta$v$, body = $v$El círculo puede girar varias veces en una misma conversación, y eso es normal: cada vuelta que completas bien te acerca.

Pero no es infinito. Hay un límite, y saber dónde está es tan importante como saber girar.

Ese límite lo vas a ver en "Cuando soltar".$v$
WHERE node_id = '5.9' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'ec7d8e64e121bbfeb11e7aca1f6a397e';

UPDATE public.node_cards SET title = $v$Los tres movimientos del círculo$v$, body = $v$Cuando llega la objeción:

1. ATRAVIESA — con RRR si es menor, con FFF si es de verdad.
2. RE-IMPULSA — una bala: algo positivo que no habías dicho, o algo que ya dijiste pero que ahora contesta su objeción.
3. CIERRA CON ACCIÓN — el siguiente paso concreto.

En ese orden, y sin saltarte el dos.$v$
WHERE node_id = '5.10' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '87436f502d8f94c05ae546f0a4e75f24';

UPDATE public.node_cards SET body = $v$Es tan natural saltárselo que hay que decirlo directo: atravesar una objeción NO sube el impulso. Solo detiene la caída.

Si atraviesas y cierras de inmediato, le estás pidiendo una decisión a alguien que sigue abajo. Y desde ahí la respuesta cómoda siempre es "déjeme lo pienso".

La bala es lo que lo vuelve a subir. Sin ella, técnicamente respondiste y prácticamente perdiste.$v$
WHERE node_id = '5.10' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '94affe58f953de7e8be1c72de3d5ee40';

UPDATE public.node_cards SET body = $v$Lo mejor es una bala que no hayas dicho. Si usas una que ya dijiste, conéctala con su objeción. Si te dijo "está caro": "por eso le sale más barato: ya no pierde cambios por quedarse sin aceite".

Lo que no sirve es repetirla igualita: le comunica al cliente que ya no tienes más, y eso baja el impulso en lugar de subirlo.

Aquí es donde por fin se entiende lo de dosificar. El vendedor que gastó todo su arsenal presumiendo al principio llega a este momento con la mano vacía.$v$
WHERE node_id = '5.10' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'c76f27a8ebeacf7fbc7f25a20343a4bc';

UPDATE public.node_cards SET title = $v$Avanzar tiene un límite$v$, body = $v$Todo este mundo te ha enseñado a seguir: atraviesa, re-impulsa, vuelve a cerrar.

Pero hay un punto donde seguir deja de construir y empieza a quemar. Y saber dónde está ese punto es tan importante como saber cerrar.$v$
WHERE node_id = '5.11' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'd03d5c209202a5bf8037e0faedcbaaa9';

UPDATE public.node_cards SET body = $v$Dos no seguidos y te vas. Así de simple, y aplica en toda la visita, también en el cierre.

Ojo: "lo voy a pensar" no es un no, ni "ahorita no puedo, hasta el otro mes que cobre". Son objeciones, y está bien buscarles solución: hecho bien, no se siente insistente, porque estás ayudándolo. Un no es "no, gracias, ahorita no quiero".

TIENEN QUE SER CONSECUTIVOS. Uno tras otro, sin que la conversación haya avanzado en medio.$v$
WHERE node_id = '5.11' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '5019fc6106461875bc721627e457dd13';

UPDATE public.node_cards SET body = $v$Cuando llegan los dos seguidos, hoy no es el día. No es fracaso tuyo: es información.

Y la manera de irte importa. El que insiste hasta incomodar quema la relación y ya no lo reciben. El que reconoce la situación y deja la puerta abierta, vuelve cuando las cosas cambien.

Cada minuto de más con un rojo se lo estás quitando a un amarillo que sí podía comprar hoy.$v$
WHERE node_id = '5.11' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '95a25f62d4e8968a96fd9920fbcc3eb7';

UPDATE public.node_cards SET body = $v$Lo más importante de la regla es la palabra SEGUIDOS.

El cliente dice que no, lo atraviesas, la conversación avanza, hablan de otra cosa, y más adelante dice otro no. Eso NO son dos no seguidos: es una conversación normal con dos momentos de fricción.

La racha se rompe en cuanto la conversación avanza. Solo cuentan los que llegan uno tras otro, sin que hayas logrado mover nada en medio.$v$
WHERE node_id = '5.11' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'bf5a95df3edc41d71cfa0fc2ba7c0cc2';

UPDATE public.node_cards SET body = $v$Resolviste "está caro" con tu mejor cuenta... y el cliente suelta: "sí, pero es que además ya tengo proveedor de años." Y detrás de esa, puede venir otra.

No es mala señal: es su proceso. Está sacando TODAS sus dudas antes del sí. La cadena es la antesala de la decisión.

Tu examen doble: cada objeción con SU bala (la repetida tal cual no convence, la apilada abruma), y tu ánimo idéntico en la primera y en la última. El cliente está midiendo tu temple tanto como tus respuestas.$v$
WHERE node_id = '5.12' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'e1e1ab6ae65bbd58ba1d93ffb14d9c69';

UPDATE public.node_cards SET body = $v$Cuando aguantas el silencio, el cliente termina de pensar y decide él. Y una decisión propia se defiende sola.

Cuando llenas el silencio, aunque cierre, la decisión quedó contaminada de tu ansiedad, y esas son las ventas que se caen a la semana.

Ojo con dos cosas. Si te pregunta algo, contéstale: eso no es llenar el silencio. Y aguantar no garantiza el sí, porque la gente no reacciona igual: si después de pensar te dice "déjeme pensarlo", no es castigo por algo que hiciste mal. Es una objeción, y la trabajas como objeción.

En este reto el cliente va a pensar de verdad. Tu examen no es hablar bien. Es callarte mejor.$v$
WHERE node_id = '5.13' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '993673e1c8f3fb62a93c225ae141f3d9';

UPDATE public.node_cards SET title = $v$El pedido base no está en duda$v$, body = $v$Con un cliente nuevo cierras la venta completa: o compra o no compra.

Con uno que ya te compra, el pedido de siempre ya iba a existir. No lo estás ganando: ya era tuyo antes de que llegaras.

Lo que sí está en juego es lo que agregaste. Las cajas de más. La familia nueva. ESO es lo que hay que cerrar.$v$
WHERE node_id = '5.14' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '0f002b9ba8adb7f7df5bd339c259d7c5';

UPDATE public.node_cards SET body = $v$Suena razonable confirmar todo al final: "entonces, ¿sí le mando lo de siempre más lo nuevo?".

Y lo que haces es poner en la mesa algo que ya estaba resuelto. El cliente empieza a revisar la orden completa, y de pronto también duda de lo que nunca había dudado.

Lo que ya está, se queda quieto. Solo cierras lo que agregaste.$v$
WHERE node_id = '5.14' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '45923ba3076b7d827b31343dec64bad1';

UPDATE public.node_cards SET body = $v$"¿Se las mando en la misma entrega o prefiere aparte?"
"¿Le pongo las cinco cajas o arrancamos con tres?"
"¿Se lo manejo igual que siempre, a crédito, o esta vez de contado?"

Las tres asumen que el incremento va. Ninguna pregunta si lo quiere. Y las dos opciones de cada una te sirven.

En cuanto preguntas, te callas. Si te dice "déjeme pensarlo", es una objeción: la trabajas como cualquier otra, y el pedido de siempre ni lo tocas.$v$
WHERE node_id = '5.14' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'bd8b6f96f868cf90d444462a9e0ac442';

UPDATE public.node_cards SET title = $v$El quinto Boss.$v$
WHERE node_id = '5.15' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '3f7f61483a6fe7db28cce49adde58af4';

UPDATE public.node_quiz_questions SET question_text = $v$El vendedor presentó bien, el cliente quedó contento, y el vendedor se despide: "Bueno, ahí me avisa cualquier cosa". ¿Qué faltó?$v$, option_a = $v$Nada: el cliente quedó contento.$v$, option_b = $v$Pedir la decisión: un cierre es pedir la decisión, sea sí o no.$v$, option_c = $v$Dejarle más información para que lo piense.$v$, explanation_correct = $v$Un cierre no siempre es una venta: es pedir la decisión, sea cual sea. "Ahí me avisa" ni siquiera es una pregunta: es una despedida, y la decisión se queda sin fecha.$v$, explanation_wrong = $v$Que quedara contento no es una decisión. Si no la pides, la plática se queda en "algún día". Y dejarle información es proponerle tú el aplazamiento.$v$, regla_id = $v$close.mal_cierre$v$
WHERE node_id = '5.0' AND question_order = 3 AND md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) = '92efa73d329cc039585099d8b873634b';

UPDATE public.node_quiz_questions SET explanation_correct = $v$Exacto: la herramienta correcta en el momento equivocado. Ese cliente entendió la oferta y dio un motivo concreto: merece una respuesta de verdad, no una evasión. AIR es para el reflejo de la puerta; a las objeciones se les responde con RRR o con FFF.$v$, explanation_wrong = $v$Parece AIR de libro, pero mira el MOMENTO: llegó después de la presentación, con un motivo concreto (proveedor, precio). Eso es objeción, no bloqueo. Evadirla cambiando de tema le dice al cliente "no tengo respuesta", y la conversación seria se acabó ahí.$v$
WHERE node_id = '5.4' AND question_order = 1 AND md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) = '8f9418ccf6ffafc1ef21fc5a32702c3b';

UPDATE public.node_quiz_questions SET question_text = $v$Después de tu presentación, el cliente dice: "Déjeme pensarlo". ¿Qué es?$v$, option_a = $v$Un no: te despides y quedas de regresar.$v$, option_b = $v$Una objeción: se trabaja como objeción.$v$, option_c = $v$Un bloqueo: lo atraviesas con AIR.$v$, explanation_correct = $v$Eso es. "Lo voy a pensar" no es un no: es una objeción. Te está diciendo que algo le falta, y a eso se le busca solución.$v$, explanation_wrong = $v$Un no es "no, gracias, ahorita no quiero". "Déjeme pensarlo" llega después de entender tu oferta: es una objeción, y se trabaja como objeción. AIR es para el reflejo de la puerta.$v$, regla_id = $v$objection.regla_de_los_no$v$
WHERE node_id = '5.4' AND question_order = 2 AND md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) = 'c92821c213e22fb0f58eae6647b1cab7';

UPDATE public.node_quiz_questions SET question_text = $v$¿Cuál es la diferencia entre el cliente que objeta y el que no tiene interés?$v$, option_a = $v$Ninguna: los dos te están diciendo que no.$v$, option_b = $v$El que objeta sigue en la plática y te dice qué le falta; el que no tiene interés se despide: "no, gracias".$v$, explanation_correct = $v$El que no tiene interés no objeta: se despide. La objeción trae contenido —caro, proveedor, consultar— porque hay interés real detrás. Alégrate cuando escuches una: la venta sigue viva.$v$, explanation_wrong = $v$Suenan parecido y son opuestos. El que no tiene interés dice "no, gracias" y ahí se acaba. El que objeta sigue en la plática y te está diciendo qué le falta para el sí.$v$
WHERE node_id = '5.4' AND question_order = 3 AND md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) = '772184357ead70060ceed9c51568c651';

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.2', 1, $v$A mitad de tu presentación el cliente pregunta: "¿Y si le pido hoy, cuándo me llega?". ¿Qué es eso?$v$, $v$Una interrupción: le contestas y sigues donde ibas.$v$, $v$Una señal de compra: le contestas y cierras ahí mismo.$v$, $v$Una objeción.$v$, NULL, 'B', $v$Es de las señales más fuertes que hay: ya se está imaginando el pedido. Le contestas y cierras en el mismo turno: "el lunes. ¿Le armo las 5 o el combo de 8?".$v$, $v$No es interrupción ni objeción: es una señal de compra. Si contestas y sigues presentando, el impulso baja. Contestas y cierras en el mismo turno.$v$, 'close.fishbbod'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.2' AND question_order = 1);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.2', 2, $v$Te quedan dos beneficios buenos por decir y el cliente ya dio una señal de compra. ¿Qué haces con ellos?$v$, $v$Los dices rápido y luego cierras.$v$, $v$Te los guardas y cierras.$v$, $v$Dices el mejor de los dos y cierras.$v$, NULL, 'B', $v$Señal de compra = deja de presentar y cierra, aunque te queden balas. Esas balas te van a servir si después pone una objeción.$v$, $v$Aunque sea un beneficio más, ya es seguir presentando: el cliente estaba listo y le das tiempo de encontrar una razón para no hacerlo. Te los guardas y cierras.$v$, 'close.sigue_presentando'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.2' AND question_order = 2);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.2', 3, $v$¿Cuál de estas NO es una señal de compra?$v$, $v$"¿Y eso cada cuánto me lo surten?"$v$, $v$"El que tengo ahorita siempre me queda mal."$v$, $v$"No, gracias, ahorita no me interesa."$v$, NULL, 'C', $v$Correcto. Las dos primeras son señales: habla del futuro y habla mal de su proveedor. "No, gracias" es un no.$v$, $v$"¿Cada cuánto me lo surten?" es hablar del futuro, y "el que tengo siempre me queda mal" es hablar mal de su proveedor: las dos son señales. La que no es señal es "no, gracias".$v$, 'close.fishbbod'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.2' AND question_order = 3);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.5', 1, $v$El cliente dice: "El jueves no me acomoda". ¿Cuál es el RRR completo?$v$, $v$"No se preocupe, lo vemos."$v$, $v$"O sea que el jueves no le acomoda. También paso los martes por su zona. ¿Se lo traigo el martes o el jueves de la otra semana?"$v$, $v$"O sea que el jueves no le acomoda. También paso los martes por su zona."$v$, NULL, 'B', $v$Las tres R: repite con sus palabras, responde con un dato concreto (los martes) y retoma sin pausa con la siguiente pregunta.$v$, $v$La primera no repite ni da un dato. La tercera repite y responde, pero se queda callada esperando: le falta retomar.$v$, 'objection.rrr'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.5' AND question_order = 1);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.5', 2, $v$¿Cuál de las tres R es la que casi nadie hace?$v$, $v$Repetir.$v$, $v$Tranquilizar.$v$, $v$Retomar.$v$, NULL, 'C', $v$Eso es. El vendedor responde bien y se queda callado esperando a ver si convenció. En ese silencio el cliente encuentra otra objeción, o dice que lo va a pensar.$v$, $v$Repetir y responder es fácil. Lo que falla es retomar: seguir de largo, en la misma respiración, sin esperar a ver si le convenció.$v$, 'objection.rrr_sin_resume'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.5' AND question_order = 2);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.5', 3, $v$El cliente te cuenta que su proveedor anterior le falló y él quedó mal con sus propios clientes. ¿Usas RRR?$v$, $v$Sí: repites, respondes y retomas.$v$, $v$No: es una preocupación seria y personal, y para esa va otra herramienta.$v$, $v$No: es un bloqueo, y va AIR.$v$, NULL, 'B', $v$Correcto. RRR es para las de todos los días: precio, día de entrega, mínimo. Con algo que de verdad le preocupa, responder rápido y seguir se siente a que lo despachaste.$v$, $v$Esto no es un trámite ni un reflejo de la puerta: le preocupa de verdad. Con RRR se sentiría despachado. Para esas hay otra herramienta, la del siguiente nodo.$v$, 'objection.fff'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.5' AND question_order = 3);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.7', 1, $v$¿En qué termina FFF?$v$, $v$En la tercera F: "lo que encontramos fue...".$v$, $v$En una bala y un cierre con acción.$v$, $v$En preguntarle si ya le quedó claro.$v$, NULL, 'B', $v$Son cinco pasos: entiendo, sintió, encontramos, una bala y cierras con acción. El que se queda en tres respondió la objeción y perdió la venta.$v$, $v$FFF no termina en la tercera F: después va una bala, para volver a subir el impulso, y el cierre con acción. Y preguntar si quedó claro le devuelve el control al cliente.$v$, 'objection.fff'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.7' AND question_order = 1);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.7', 2, $v$El cliente dice: "Ya me han fallado antes". El vendedor contesta: "No, con nosotros eso no pasa, somos muy cumplidos". ¿Qué hizo?$v$, $v$Bien: le dio seguridad.$v$, $v$Discutió: le dijo que su preocupación no vale.$v$, $v$Usó FFF.$v$, NULL, 'B', $v$Exacto. Ganar la discusión es perder la venta. Lo correcto era: "Entiendo cómo se siente. Otro cliente sintió lo mismo, y lo que encontró fue...".$v$, $v$Contradecirlo es discutir, aunque suene a seguridad: lo pone a defender su experiencia. Con FFF primero estás de acuerdo con él, y por eso te escucha.$v$, 'objection.discutir'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.7' AND question_order = 2);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.7', 3, $v$En "lo que encontramos fue...", ¿qué factor de impulso estás usando?$v$, $v$El Efecto Jones.$v$, $v$La urgencia.$v$, $v$La avaricia.$v$, NULL, 'A', $v$Eso es: otros como él cambiaron de opinión, y eso pesa más que lo que diga un vendedor. Entre más concreto, más pesa.$v$, $v$Es el Efecto Jones: la gente no le cree a un desconocido que quiere venderle, pero sí deja que otros como ella le validen el producto.$v$, 'objection.fff'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.7' AND question_order = 3);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.9', 1, $v$Atraviesas bien la objeción y cierras de inmediato. ¿Qué te saltaste?$v$, $v$Nada: respondiste y cerraste.$v$, $v$La bala: atravesar solo detiene la caída del impulso, y la bala lo vuelve a subir.$v$, $v$Repetir la objeción.$v$, NULL, 'B', $v$Correcto. Sin la bala, le pides una decisión a alguien que sigue abajo, y desde ahí la respuesta cómoda siempre es "déjeme lo pienso".$v$, $v$Técnicamente respondiste, pero el impulso quedó abajo. Lo que lo vuelve a subir es una bala, y de ahí cierras.$v$, 'objection.cierra_sin_bala'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.9' AND question_order = 1);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.9', 2, $v$¿En qué orden va el Círculo de Cierre?$v$, $v$Cierras con acción, llega la objeción, la atraviesas, re-impulsas con una bala y cierras otra vez.$v$, $v$Llega la objeción, cierras, y luego das la bala.$v$, $v$Das la bala, llega la objeción y cierras.$v$, NULL, 'A', $v$Eso es. Y si llega otra objeción, vuelves a girar.$v$, $v$El orden importa: atravesar detiene la caída, la bala vuelve a subir el impulso, y hasta entonces cierras.$v$, 'objection.circulo_de_cierre'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.9' AND question_order = 2);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.9', 3, $v$¿Por qué conviene no gastar todas tus balas en la presentación?$v$, $v$Para que la plática dure más.$v$, $v$Porque cada vuelta del círculo te consume una bala, y sin munición nueva llegas con la mano vacía.$v$, $v$Porque el cliente se aburre.$v$, NULL, 'B', $v$Correcto. El que dosificó llega a la tercera vuelta con munición fresca. El que vació el cargador repite lo mismo, y repetir desgasta.$v$, $v$Es por la munición: cada objeción pide una bala para volver a subir el impulso. Si ya las gastaste todas, solo te queda repetir, y repetir no sube nada.$v$, 'present.dosificacion_balas'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.9' AND question_order = 3);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.11', 1, $v$El cliente dice que no, lo atraviesas, platican un rato de su negocio, y más adelante dice que no otra vez. ¿Ya son dos no?$v$, $v$Sí: ya van dos, te vas.$v$, $v$No: entre uno y otro la conversación avanzó, y eso rompe la racha.$v$, $v$Depende de qué tan fuerte lo diga.$v$, NULL, 'B', $v$Exacto. Solo cuentan los que llegan uno tras otro, sin que la conversación avance en medio. Esto es una conversación normal con dos momentos de fricción.$v$, $v$La palabra clave es SEGUIDOS. Si entre uno y otro la conversación avanzó, la racha se rompió.$v$, 'objection.regla_de_los_no'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.11' AND question_order = 1);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.11', 2, $v$Al cerrar, el cliente dice: "Ahorita no puedo, hasta el otro mes que cobre lo del contrato". ¿Qué es?$v$, $v$Un no: te despides y quedas de volver el otro mes.$v$, $v$Una objeción: está bien buscarle solución y volver a cerrar.$v$, $v$Un bloqueo: lo atraviesas con AIR.$v$, NULL, 'B', $v$Pone una condición: es una objeción, no un no. Buscarle solución no es insistir; hecho bien, estás ayudándolo. El límite es el de siempre: dos no seguidos y te vas.$v$, $v$Un no es "no, gracias, ahorita no quiero". Esto trae una condición concreta: es una objeción, y está bien darle la vuelta y volver a cerrar.$v$, 'objection.regla_de_los_no'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.11' AND question_order = 2);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '5.11', 3, $v$Llegaron dos no seguidos en el cierre. ¿Qué haces?$v$, $v$Le ofreces un descuento para salvar la venta.$v$, $v$Te despides bien y le dejas la puerta abierta.$v$, $v$Le preguntas por qué no.$v$, NULL, 'B', $v$Hoy no es el día, y eso es información, no fracaso. El que deja la puerta abierta vuelve cuando las cosas cambian.$v$, $v$Después de dos no seguidos, seguir es quemar la relación, y un descuento por pánico además te quita margen y respeto. Te despides bien y dejas la puerta abierta.$v$, 'objection.regla_de_los_no'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '5.11' AND question_order = 3);

DO $chk$ BEGIN
  IF (SELECT max(version) FROM public.doctrina WHERE is_active) <> 20 THEN RAISE EXCEPTION 'el Cerebro no quedó en v20'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE is_active AND strpos(body, $v$o te contestes solo. Si el cliente te pregunta algo, contestarle no es llenar el silencio.

**Aguantar no garantiza el sí** `CAMPO`: aguantar es el movimiento correcto, pero la gente no reacciona igual. Unos deciden ahí mismo; otros, aunque hayas hecho todo bien, te contestan *"déjeme pensarlo"*. Eso no es un castigo por algo que hiciste mal: es una objeción, y se trabaja como objeción.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'un cambio del Cerebro no quedó'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE is_active AND strpos(body, $v$- **«Lo voy a pensar» no es un «no»** `CAMPO`: es una objeción, y se maneja como objeción. Un «no» es *"no, gracias, ahorita no quiero"*.
- **Buscarle solución a una objeción no es insistir** `CAMPO`: *"ahorita no puedo, hasta el otro mes que cobre lo del contrato"* también es una objeción. Está bien darle la vuelta y volver a cerrar: hecho bien, no se siente insistente, porque estás buscando cómo ayudarlo. El límite es el de siempre: dos no seguidos y te vas.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'un cambio del Cerebro no quedó'; END IF;
  IF (SELECT resumen FROM public.reglas WHERE id = 'close.aguanta_silencio') IS DISTINCT FROM $v$Después de pedir la decisión, el silencio es del cliente: el primero que habla después de un cierre, pierde. LA PRUEBA: después de pedir la decisión y antes de que el cliente decida, ¿el vendedor se queda en su pregunta —sin retractarse, suavizarla, agregar descuentos o argumentos, ni contestarse solo—? Contestar una pregunta del cliente no rompe el silencio. Aguantar no garantiza el sí: si después el cliente pone una objeción («déjeme pensarlo»), no es falla del vendedor; se trabaja como objeción.$v$ THEN RAISE EXCEPTION 'la regla close.aguanta_silencio no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.0' AND card_order = 4) IS DISTINCT FROM '580adfe4bb10b3fb52d489c876dc557c' THEN RAISE EXCEPTION 'la tarjeta 5.0 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.2' AND card_order = 1) IS DISTINCT FROM 'ad828a8ea9fbe603af164cb9587a3312' THEN RAISE EXCEPTION 'la tarjeta 5.2 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.2' AND card_order = 2) IS DISTINCT FROM '70154256846dcf3b45f728f2ace7239b' THEN RAISE EXCEPTION 'la tarjeta 5.2 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.2' AND card_order = 3) IS DISTINCT FROM '48465dc5d1bbf6c3f76ffe6457ff6974' THEN RAISE EXCEPTION 'la tarjeta 5.2 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.2' AND card_order = 4) IS DISTINCT FROM '1c48d9f6cb2d76a27222fb5ebae68969' THEN RAISE EXCEPTION 'la tarjeta 5.2 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.4' AND card_order = 1) IS DISTINCT FROM 'c84cb000e26c105a88e5232892b3b0aa' THEN RAISE EXCEPTION 'la tarjeta 5.4 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.4' AND card_order = 2) IS DISTINCT FROM '7d9588dd04ff1238dd26a67964cbb17f' THEN RAISE EXCEPTION 'la tarjeta 5.4 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.4' AND card_order = 3) IS DISTINCT FROM 'f3fc39184738ca69a761e852e049c7ed' THEN RAISE EXCEPTION 'la tarjeta 5.4 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.4' AND card_order = 4) IS DISTINCT FROM '54fb3d755105e3eb40280504ad01ed47' THEN RAISE EXCEPTION 'la tarjeta 5.4 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.5' AND card_order = 1) IS DISTINCT FROM '7794baf031717c44b6bc65ca247d6862' THEN RAISE EXCEPTION 'la tarjeta 5.5 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.5' AND card_order = 2) IS DISTINCT FROM '87145af1cee6771a35aecb6a260bbbcd' THEN RAISE EXCEPTION 'la tarjeta 5.5 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.5' AND card_order = 3) IS DISTINCT FROM '242d74e2179d28899c8e444b45ec4a65' THEN RAISE EXCEPTION 'la tarjeta 5.5 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.5' AND card_order = 4) IS DISTINCT FROM '9c08ae32a5dd5358ad474a4993cd7dd4' THEN RAISE EXCEPTION 'la tarjeta 5.5 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.6' AND card_order = 1) IS DISTINCT FROM '4927f36538d217c52191fea637fa3bd2' THEN RAISE EXCEPTION 'la tarjeta 5.6 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.6' AND card_order = 2) IS DISTINCT FROM '5248ab92b7ced207ba3a1d8946af8af1' THEN RAISE EXCEPTION 'la tarjeta 5.6 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.6' AND card_order = 3) IS DISTINCT FROM 'c225b67a5020e3204a13c49901c13fee' THEN RAISE EXCEPTION 'la tarjeta 5.6 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.7' AND card_order = 1) IS DISTINCT FROM '69eb7e698acddb35aa68365f27284561' THEN RAISE EXCEPTION 'la tarjeta 5.7 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.7' AND card_order = 2) IS DISTINCT FROM '65baef5bed207d5df05fef0fd68c5221' THEN RAISE EXCEPTION 'la tarjeta 5.7 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.7' AND card_order = 3) IS DISTINCT FROM 'f17e7ce3025e1d1ed95a89183453ab47' THEN RAISE EXCEPTION 'la tarjeta 5.7 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.7' AND card_order = 4) IS DISTINCT FROM 'f3e9bfea36b40565b0c7153a34492480' THEN RAISE EXCEPTION 'la tarjeta 5.7 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.8' AND card_order = 1) IS DISTINCT FROM '55aa2c7d75a706713bef447effc77508' THEN RAISE EXCEPTION 'la tarjeta 5.8 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.8' AND card_order = 2) IS DISTINCT FROM 'c1d50a899b1bf5726c6da1828bc71691' THEN RAISE EXCEPTION 'la tarjeta 5.8 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.8' AND card_order = 3) IS DISTINCT FROM 'a2570f4380b037ca310fdf2b925b5859' THEN RAISE EXCEPTION 'la tarjeta 5.8 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.9' AND card_order = 1) IS DISTINCT FROM '8cafa74b1137a682f175ef5f1e47d5c1' THEN RAISE EXCEPTION 'la tarjeta 5.9 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.9' AND card_order = 2) IS DISTINCT FROM '71e87047b2e90a34da67d35a8eec2e68' THEN RAISE EXCEPTION 'la tarjeta 5.9 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.9' AND card_order = 3) IS DISTINCT FROM '9bfa0733c58afe3bc730ea1fbde41b20' THEN RAISE EXCEPTION 'la tarjeta 5.9 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.9' AND card_order = 4) IS DISTINCT FROM '3e448a18fc9a95158bd3682cd387de0b' THEN RAISE EXCEPTION 'la tarjeta 5.9 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.10' AND card_order = 1) IS DISTINCT FROM '70433a02bae560897ef9e0ec982542f9' THEN RAISE EXCEPTION 'la tarjeta 5.10 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.10' AND card_order = 2) IS DISTINCT FROM '2c64504dfb28d0542afd87857ffcd7cf' THEN RAISE EXCEPTION 'la tarjeta 5.10 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.10' AND card_order = 3) IS DISTINCT FROM 'e998a7c6569578da900ad46c06062853' THEN RAISE EXCEPTION 'la tarjeta 5.10 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.11' AND card_order = 1) IS DISTINCT FROM '57b58fba3f47b77f02c3cb99586bb23f' THEN RAISE EXCEPTION 'la tarjeta 5.11 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.11' AND card_order = 2) IS DISTINCT FROM 'f9fd19d3c62df627868635e347b48f89' THEN RAISE EXCEPTION 'la tarjeta 5.11 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.11' AND card_order = 3) IS DISTINCT FROM '1731c85fe3c782e4769bd5290520f3d5' THEN RAISE EXCEPTION 'la tarjeta 5.11 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.11' AND card_order = 4) IS DISTINCT FROM 'd8b5d7d7cdba0e55cace88e7877502f9' THEN RAISE EXCEPTION 'la tarjeta 5.11 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.12' AND card_order = 1) IS DISTINCT FROM '69a966b93900f7bae46528c3fc625edf' THEN RAISE EXCEPTION 'la tarjeta 5.12 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.13' AND card_order = 3) IS DISTINCT FROM '29c717c3e935cd0aab9d3da087d995a4' THEN RAISE EXCEPTION 'la tarjeta 5.13 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.14' AND card_order = 1) IS DISTINCT FROM 'fc308166e94f6a3df2909d79e46e3240' THEN RAISE EXCEPTION 'la tarjeta 5.14 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.14' AND card_order = 2) IS DISTINCT FROM '8fefcf437f233e398195bfece6e38e24' THEN RAISE EXCEPTION 'la tarjeta 5.14 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.14' AND card_order = 3) IS DISTINCT FROM '5e572455b5a50b4f11ea40d8678d074e' THEN RAISE EXCEPTION 'la tarjeta 5.14 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '5.15' AND card_order = 1) IS DISTINCT FROM '8c7c68062dcb34c5739ae13ab08bf9f4' THEN RAISE EXCEPTION 'la tarjeta 5.15 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.0' AND question_order = 1) IS DISTINCT FROM '0d605228f2055241c973c672be30c43d' THEN RAISE EXCEPTION 'la pregunta 5.0 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.0' AND question_order = 2) IS DISTINCT FROM 'cd8d704c113538101cc9a600005d9465' THEN RAISE EXCEPTION 'la pregunta 5.0 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.0' AND question_order = 3) IS DISTINCT FROM 'cf09e2292711bc56d5caf016bc5a0ba7' THEN RAISE EXCEPTION 'la pregunta 5.0 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.4' AND question_order = 1) IS DISTINCT FROM '3212a3198fd66142fc649489d4ba0bd1' THEN RAISE EXCEPTION 'la pregunta 5.4 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.4' AND question_order = 2) IS DISTINCT FROM '80a07fa08c6856838e63b70000b8a94d' THEN RAISE EXCEPTION 'la pregunta 5.4 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.4' AND question_order = 3) IS DISTINCT FROM '2b71d079a4c3e934ed4046554785d344' THEN RAISE EXCEPTION 'la pregunta 5.4 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.2' AND question_order = 1) IS DISTINCT FROM '3d09141985faa9e3419878c5454a70f6' THEN RAISE EXCEPTION 'la pregunta 5.2 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.2' AND question_order = 2) IS DISTINCT FROM 'a6e6d64eb6b90431d41920ccd0878863' THEN RAISE EXCEPTION 'la pregunta 5.2 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.2' AND question_order = 3) IS DISTINCT FROM 'e76c8c139f75f257053866d62d6d3c0e' THEN RAISE EXCEPTION 'la pregunta 5.2 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.5' AND question_order = 1) IS DISTINCT FROM '3921dafc17180ba4dfe58f9ad0e4078d' THEN RAISE EXCEPTION 'la pregunta 5.5 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.5' AND question_order = 2) IS DISTINCT FROM 'b5b7d6d3bd85903d05b79aa99a44011e' THEN RAISE EXCEPTION 'la pregunta 5.5 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.5' AND question_order = 3) IS DISTINCT FROM '72c7e956ebc4e3ec98dfac4c2d8c1469' THEN RAISE EXCEPTION 'la pregunta 5.5 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.7' AND question_order = 1) IS DISTINCT FROM '275f6324c016bfc6d827cb87d1dc9813' THEN RAISE EXCEPTION 'la pregunta 5.7 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.7' AND question_order = 2) IS DISTINCT FROM '56804947daefc4b2b531632cc52adff0' THEN RAISE EXCEPTION 'la pregunta 5.7 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.7' AND question_order = 3) IS DISTINCT FROM '1c7458d15a6ee6f09453ee1386fb9e72' THEN RAISE EXCEPTION 'la pregunta 5.7 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.9' AND question_order = 1) IS DISTINCT FROM '06c1119f87fb09d6b79b802e993e042b' THEN RAISE EXCEPTION 'la pregunta 5.9 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.9' AND question_order = 2) IS DISTINCT FROM '64c8dd62b55e4658de0034454907f939' THEN RAISE EXCEPTION 'la pregunta 5.9 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.9' AND question_order = 3) IS DISTINCT FROM '8f029ac565ba323a8646092a1fb66d64' THEN RAISE EXCEPTION 'la pregunta 5.9 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.11' AND question_order = 1) IS DISTINCT FROM '31f214c47a3570cede3ec57e3557dd84' THEN RAISE EXCEPTION 'la pregunta 5.11 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.11' AND question_order = 2) IS DISTINCT FROM 'ccd01bf89fa29f6584b912f851f636ae' THEN RAISE EXCEPTION 'la pregunta 5.11 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', coalesce(question_text,''), coalesce(option_a,''), coalesce(option_b,''), coalesce(option_c,''), coalesce(option_d,''), coalesce(correct_option,''), coalesce(explanation_correct,''), coalesce(explanation_wrong,''), coalesce(regla_id,''))) FROM public.node_quiz_questions WHERE node_id = '5.11' AND question_order = 3) IS DISTINCT FROM '3ff877ca50f4a17bea162229b605f4de' THEN RAISE EXCEPTION 'la pregunta 5.11 #3 no quedó'; END IF;
  IF (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '5.2') <> 3 THEN RAISE EXCEPTION 'el quiz del 5.2 no quedó con 3 preguntas'; END IF;
  IF (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '5.5') <> 3 THEN RAISE EXCEPTION 'el quiz del 5.5 no quedó con 3 preguntas'; END IF;
  IF (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '5.7') <> 3 THEN RAISE EXCEPTION 'el quiz del 5.7 no quedó con 3 preguntas'; END IF;
  IF (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '5.9') <> 3 THEN RAISE EXCEPTION 'el quiz del 5.9 no quedó con 3 preguntas'; END IF;
  IF (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '5.11') <> 3 THEN RAISE EXCEPTION 'el quiz del 5.11 no quedó con 3 preguntas'; END IF;
END $chk$;
