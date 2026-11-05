-- Mensaje 134 (5-nov-2026) · Mundo 4, tanda 1: el contenido.
-- Cerebro v18 → v19 (balas de producto, servicio y precio; el hueco con la misma balanza), 4 reglas,
-- tarjetas del mundo 4, 6 preguntas de quiz nuevas (4.5 y 4.13) y el orden: el tren del sí (4.12) va antes de asumir (4.11).
-- Todo protegido: cada cambio se hace solo si lo de hoy es exactamente lo esperado. El chequeo del final aborta si algo no quedó.
-- Correrlo dos veces no cambia nada.

DO $c$ DECLARE v int; BEGIN
  IF EXISTS (SELECT 1 FROM public.doctrina WHERE is_active AND strpos(body, $v$**Las balas son TUYAS.** Son hechos positivos y concretos, y salen de tres lugares `CAMPO`:
- **El producto** — lo que lo diferencia: presentación, marca, rendimiento, mejoras, datos, certificaciones
- **El servicio** — tú y tu empresa (experiencia, años en la zona, casos de éxito, dedicación) y cómo se lo haces llegar (entrega, cada cuánto lo visitas, plazo, atención)
- **El precio** — propuesta de valor, descuentos con su motivo, comparación

Con cada bala mueves la balanza: subes el valor o bajas el costo.$v$) > 0) THEN RAISE NOTICE 'El Cerebro ya tiene el cambio del 134.'; RETURN; END IF;
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  IF v <> 18 THEN RAISE EXCEPTION 'se esperaba el Cerebro v18 y está el v%', v; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND is_active AND strpos(body, $v$**Las balas son TUYAS.** Son hechos positivos y concretos sobre:
- **Ti / tu empresa** — experiencia, premios, casos de éxito, dedicación
- **El producto** — lo que lo diferencia, mejoras, datos, certificaciones
- **El precio** — propuesta de valor, descuentos, financiamiento, comparación$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado (cambio 1)'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND is_active AND strpos(body, $v$**La pregunta que define el argumento: ¿qué gana él con que tú se lo surtas?**

Y la respuesta depende del caso, no de una fórmula. Posibilidades reales:

- **Consolidación** — si el cliente trata con muchos proveedores y eso le pesa, reducir el número tiene valor por sí mismo
- **Conveniencia** — te ve de todos modos; agregar una familia no le suma trabajo
- **Complementariedad** — lo que ofreces se usa junto con lo que ya te compra
- **Una condición concreta** — plazo, disponibilidad, presentación, tiempo de entrega

> ⚠️ **La consolidación NO es un argumento universal.** Si tu producto es complementario y el cliente ya tiene cinco proveedores, con la familia nueva pasa a tener **seis, no cuatro**. Ahí *"menos proveedores que seguir"* es falso, y usarlo te desacredita.
>
> Antes de usarlo, verifica que el cliente **efectivamente vaya a reducir** su número de proveedores.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado (cambio 2)'; END IF;
  INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
  SELECT v + 1, section_key, order_index, title, replace(replace(body, $v$**Las balas son TUYAS.** Son hechos positivos y concretos sobre:
- **Ti / tu empresa** — experiencia, premios, casos de éxito, dedicación
- **El producto** — lo que lo diferencia, mejoras, datos, certificaciones
- **El precio** — propuesta de valor, descuentos, financiamiento, comparación$v$, $v$**Las balas son TUYAS.** Son hechos positivos y concretos, y salen de tres lugares `CAMPO`:
- **El producto** — lo que lo diferencia: presentación, marca, rendimiento, mejoras, datos, certificaciones
- **El servicio** — tú y tu empresa (experiencia, años en la zona, casos de éxito, dedicación) y cómo se lo haces llegar (entrega, cada cuánto lo visitas, plazo, atención)
- **El precio** — propuesta de valor, descuentos con su motivo, comparación

Con cada bala mueves la balanza: subes el valor o bajas el costo.$v$), $v$**La pregunta que define el argumento: ¿qué gana él con que tú se lo surtas?**

Y la respuesta depende del caso, no de una fórmula. Posibilidades reales:

- **Consolidación** — si el cliente trata con muchos proveedores y eso le pesa, reducir el número tiene valor por sí mismo
- **Conveniencia** — te ve de todos modos; agregar una familia no le suma trabajo
- **Complementariedad** — lo que ofreces se usa junto con lo que ya te compra
- **Una condición concreta** — plazo, disponibilidad, presentación, tiempo de entrega

> ⚠️ **La consolidación NO es un argumento universal.** Si tu producto es complementario y el cliente ya tiene cinco proveedores, con la familia nueva pasa a tener **seis, no cuatro**. Ahí *"menos proveedores que seguir"* es falso, y usarlo te desacredita.
>
> Antes de usarlo, verifica que el cliente **efectivamente vaya a reducir** su número de proveedores.$v$, $v$**La pregunta que define el argumento: ¿qué gana él con que tú se lo surtas?**

Es la balanza de siempre: qué valor le sumas o qué costo le bajas. Y se contesta con balas de los mismos tres lugares —**producto**, **servicio** y **precio**—, escogidas para SU caso, no de una fórmula. Por ejemplo:

- **Servicio que le baja el costo** — *"como ya lo visito cada semana, se lo traigo en la misma entrega, sin pedido aparte"*
- **Producto** — la presentación que le acomoda, o algo que se vende junto con lo que ya te compra
- **Precio** — un descuento con su motivo, o una condición de pago

> ⚠️ **La consolidación NO es un argumento universal.** *"Así tiene un proveedor menos"* es una bala de servicio solo cuando aplica: cuando el cliente deja ver que le pesa tratar con tantos proveedores, o que dejaría al otro. Muchos negocios tienen dos o tres proveedores para el mismo producto, a propósito, por si uno les falla. Y si la familia es nueva para él, no le quitas un proveedor: le sumas uno.
>
> Usarla donde no aplica es una bala inventada, y te desacredita.$v$), true, created_by
  FROM public.doctrina WHERE version = v AND is_active;
  UPDATE public.doctrina SET is_active = false WHERE is_active AND version = v;
END $c$;

UPDATE public.reglas SET resumen = $v$Balas: hechos positivos y concretos sobre el producto, el servicio (tú, tu empresa y cómo se lo haces llegar) o el precio. Con cada una subes el valor o bajas el costo. Se sueltan poco a poco, conforme hace falta subir el impulso: en la presentación unas tres cosas positivas antes del precio, y ante una objeción una bala nueva. LA PRUEBA DE UNA BALA: ¿la competencia podría decir exactamente lo mismo? Si sí, no era bala. En la práctica todo es imaginario: no se califica si es real, sino si es concreto.$v$, updated_at = now()
WHERE id = 'present.balas' AND resumen = $v$Balas: hechos positivos y concretos sobre ti, el producto o el precio. Se sueltan poco a poco, conforme hace falta subir el impulso: en la presentación unas tres cosas positivas antes del precio, y ante una objeción una bala nueva. LA PRUEBA DE UNA BALA: ¿la competencia podría decir exactamente lo mismo? Si sí, no era bala. En la práctica todo es imaginario: no se califica si es real, sino si es concreto.$v$;

UPDATE public.reglas SET resumen = $v$La pregunta que define el argumento de un hueco: ¿qué gana él con que tú se lo surtas? Es la balanza: qué valor le sumas o qué costo le bajas, con balas de producto, servicio o precio escogidas para su caso. LA PRUEBA: ¿el vendedor le da al cliente una razón para surtirse con él —algo que le sube el valor o le baja el costo— que corresponde a su caso? «Un proveedor menos» solo vale si el cliente dejó ver que le pesa tratar con tantos proveedores o que dejaría al otro; si no lo dijo, o si la familia es nueva para él, decir «menos proveedores» contradice su propio caso.$v$, updated_at = now()
WHERE id = 'present.argumento_del_hueco' AND resumen = $v$La pregunta que define el argumento de un hueco: ¿qué gana él con que tú se lo surtas? Consolidación, conveniencia, complementariedad o una condición concreta. LA PRUEBA: ¿el vendedor le da al cliente una razón para surtirse con él que corresponde a su caso? La consolidación solo vale si de verdad le reduce proveedores: si la plática muestra que la familia nueva se suma a las que ya tiene con otros, decir «menos proveedores» contradice su propio caso.$v$;

UPDATE public.reglas SET resumen = $v$Usar «un proveedor menos» donde no aplica: el cliente no dejó ver que le pesa tratar con tantos proveedores ni que dejaría al otro, o la familia es nueva para él y pasa a tener más proveedores, no menos. LA PRUEBA: ¿el vendedor le dice al cliente que con él tendrá menos proveedores sin que el cliente lo haya dejado ver, o para una familia que no maneja? Entonces es una bala inventada.$v$, updated_at = now()
WHERE id = 'present.consolidacion_falsa' AND resumen = $v$Usar «menos proveedores» cuando el producto es complementario y el cliente pasa a tener más, no menos.$v$;

UPDATE public.reglas SET resumen = $v$Sube el impulso con los factores de FUJPIG: miedo a la pérdida, urgencia, efecto Jones, poder de sugestión (el tren del sí y asumir), indiferencia y avaricia. LA PRUEBA: ¿cuántos factores distintos usó el vendedor, y cada uno con algo concreto del negocio del cliente o de la oferta? Un factor dicho en general («le conviene», «todos lo llevan», «aproveche») cuenta a medias. En la práctica todo es imaginario: no se califica si es real, sino si es concreto.$v$, updated_at = now()
WHERE id = 'impulse.factores' AND resumen = $v$Sube el impulso con los factores de FUJPIG: miedo a la pérdida, urgencia, efecto Jones, poder de asumir, indiferencia y avaricia. LA PRUEBA: ¿cuántos factores distintos usó el vendedor, y cada uno con algo concreto del negocio del cliente o de la oferta? Un factor dicho en general («le conviene», «todos lo llevan», «aproveche») cuenta a medias. En la práctica todo es imaginario: no se califica si es real, sino si es concreto.$v$;

UPDATE public.node_cards SET body = $v$"Esto le rinde el doble antes del siguiente cambio" → SUBE EL VALOR.

"Y se lo traigo en la misma visita, sin pedido aparte" → BAJA EL COSTO.

"Bueno, si no le alcanza, hay uno más económico..." → BAJA EL VALOR (acabas de decirle que lo bueno no era para él).

"Le manejo pedido mínimo de veinte piezas" → SUBE EL COSTO.

Misma conversación, cuatro frases, cuatro efectos distintos. Escucha la tuya así.$v$
WHERE node_id = '4.0' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '338296f23bd7a8e7b97fee471fcf1333';

UPDATE public.node_cards SET title = $v$Siempre estás haciendo una de cuatro cosas$v$, body = $v$Esto es lo que convierte la balanza en una herramienta y no solo en una idea bonita.

Cada frase que dices, cada gesto, cada silencio, hace una de estas cuatro cosas:

SUBE el valor percibido.
LO BAJA.
SUBE el costo percibido.
LO BAJA.

No hay frases neutras. Cuando titubeas al dar un precio, subes el costo. Cuando cuentas un caso real de otro cliente, subes el valor. Cuando te disculpas por algo, bajas el valor.

A partir de ahora, escucha tu propia presentación así: ¿qué plato acabo de mover?$v$
WHERE node_id = '4.0' AND card_order = 5 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '92b033c5def6cc3c3dba987c060d9c11';

UPDATE public.node_cards SET flip_back_text = $v$Esta presentación serviría idéntica en cualquier negocio de la ciudad — y por eso no vende en ninguno. Genérico = invisible.$v$
WHERE node_id = '4.1' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'c6db4715a778f0b5a27633e2bce331c9';

UPDATE public.node_cards SET title = $v$Nadie compra características$v$, body = $v$Le dices al cliente que tu producto tiene una formulación más estable a temperatura alta.

Y él piensa: ¿y?

No es que no le importe. Es que le hablaste en tu idioma. Una característica es lo que el producto ES. Y nadie compra lo que algo es: compran lo que van a ganar con eso.$v$
WHERE node_id = '4.2' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'b461b85894c5710316c0de034ff10871';

UPDATE public.node_cards SET body = $v$Toda característica se puede traducir a una de tres cosas que sí le importan a cualquier dueño de negocio:

DINERO — gana más o gasta menos.
CLIENTES — vende más o los conserva.
TRANQUILIDAD — menos problemas, menos tiempo perdido, menos gente reclamando.

Si no puedes traducir una característica a una de esas tres, probablemente no valía la pena mencionarla.$v$
WHERE node_id = '4.2' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '267408d96b9ae6d23ab88544075684ca';

UPDATE public.node_cards SET body = $v$"Este producto tiene formulación sintética de última generación, con aditivos antidesgaste y certificación internacional."$v$, flip_back_text = $v$Todo cierto, todo impresionante, y el cliente no entendió nada de lo que gana. Escuchó tres características seguidas en el idioma del vendedor. La respuesta natural es la que más duele: ¿y eso a mí de qué me sirve?$v$
WHERE node_id = '4.2' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '47b04e81a4370ea03fbb04d3f875193e';

UPDATE public.node_cards SET body = $v$"Este dura casi el doble antes del siguiente cambio. Para usted, eso son la mitad de servicios al año por unidad, y clientes que regresan contentos en lugar de regresar a reclamar."$v$, flip_back_text = $v$La misma característica, traducida. Dijo lo que el producto hace y, en la misma frase, lo que el cliente gana: menos trabajo repetido y clientes que vuelven de buenas. Ya no es información técnica: es una razón para comprar.$v$
WHERE node_id = '4.2' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '7bf0d594df1a3dcc2f8d742886402424';

UPDATE public.node_cards SET body = $v$"El producto tiene buen movimiento y margen competitivo." — Tu cliente escuchó un dato. Los datos se evalúan... y se olvidan.

"Imagínese la quincena que viene: llega su cliente de siempre por sus tres litros — y ahora SÍ los tiene." — Tu cliente se VIO en la escena. Y de una escena donde está ganando, nadie se quiere salir.

La gente no compra productos. Compra la película de su vida con el problema resuelto.$v$
WHERE node_id = '4.3' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'bdbc7b4b7b52fdb5d971b8f208a3a360';

UPDATE public.node_cards SET body = $v$Tres brochazos:

EL MOMENTO — ponle tiempo y lugar: "la quincena que viene", "el sábado en la mañana cuando esto se llena".
EL PERSONAJE — mete a SU gente: "su cliente de siempre", "el muchacho que le ayuda", "el de las unidades que viene cada semana".
EL DESENLACE — el dolor resuelto, con ganancia visible: "se lo lleva, le deja la ganancia a usted y no al de enfrente."

Y la llave de entrada, siempre: "Imagínese que..."$v$
WHERE node_id = '4.3' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'a80ee8666dd6d5e9e10cdb183c1f9a70';

UPDATE public.node_cards SET body = $v$Imagínalo así: los dos entran a la conversación con munición.

Tus balas son razones para comprar. Las del cliente son razones para no hacerlo.

La doctrina lo dice claro: la persona con más balas claramente tiene el control, siempre y cuando conserve su munición. Esa última parte es la que casi nadie respeta.$v$
WHERE node_id = '4.5' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '3562ccb0f02d88981c6eae2866a0f5eb';

UPDATE public.node_cards SET title = $v$Qué es una bala$v$, body = $v$Una bala es un HECHO POSITIVO y concreto que sube el impulso del cliente.

No es una opinión. No es un adjetivo. "Somos los mejores" no es una bala: es aire. "Llevamos catorce años surtiendo esta zona" sí lo es.

La prueba: si la competencia puede decir exactamente lo mismo, no era una bala.$v$
WHERE node_id = '4.5' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'c2da98edbca5b156f9ab75a9442bd529';

UPDATE public.node_cards SET title = $v$De dónde salen: producto, servicio y precio$v$, body = $v$PRODUCTO — lo que lo hace distinto: la presentación, la marca, cuánto rinde, datos duros, certificaciones.

SERVICIO — tú, tu empresa y cómo se lo haces llegar: años en la zona, casos de éxito, tu dedicación, cada cuánto lo visitas, en cuánto tiempo le entregas, el plazo que le das.

PRECIO — la propuesta de valor, los descuentos con su motivo, la comparación honesta con lo que hay.

Y cada bala mueve la balanza: sube el valor o baja el costo.

Antes de salir a la calle deberías tener claras al menos tres de cada uno.$v$
WHERE node_id = '4.5' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '2fafc6e76907d9ed1e8b7e3157e6b82c';

UPDATE public.node_cards SET body = $v$No dispares todas las balas al principio.

Es la tentación natural: tienes al cliente escuchando y quieres impresionarlo con todo lo que traes. Y ahí es donde te quedas desarmado.

Reserva algunas. En la presentación, con unas tres cosas positivas antes del precio basta. Las demás guárdalas para cuando de verdad hagan falta, porque lo que viene después cambia el juego.$v$
WHERE node_id = '4.5' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'f2a60d13171ee8fa0475730b6ed1d6d0';

UPDATE public.node_cards SET title = $v$Por qué se guardan$v$, body = $v$Más adelante en el mapa vas a ver qué pasa cuando el cliente pone una razón para no comprar.

Cuando eso ocurre, su impulso BAJA. Y responderle bien no lo sube: solo evita que siga cayendo.

Lo que lo vuelve a subir es una bala nueva. Si ya las gastaste todas presumiendo al principio, llegas a ese momento con la mano vacía. Por eso se dosifican.$v$
WHERE node_id = '4.5' AND card_order = 5 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'de9cf0f508bcc116d75c3f1f373a144a';

UPDATE public.node_cards SET body = $v$El error natural es soltar todo lo bueno de golpe, como quien vacía el cargador.

Y pasa algo curioso: el impulso sube un momento y después CAE. El cliente se satura, deja de procesar y se defiende con un "pues suena bien todo, déjeme lo pienso".

Una bala. Pausa. Ves cómo reacciona. Y de ahí decides la siguiente. En la presentación, unas tres antes del precio es lo normal; el error es vaciar el cargador.$v$
WHERE node_id = '4.6' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'c4c7880bedb80671e4d02b36e4c58441';

UPDATE public.node_cards SET body = $v$"Somos los mejores del mercado." "Tenemos mucha calidad." "Damos buen servicio."

Ninguna de esas mueve nada, porque cualquiera las dice y ninguna se puede comprobar.

"Catorce años surtiendo esta zona." "Entrega en veinticuatro horas dentro de la ciudad." "Tres negocios de esta misma calle ya lo manejan."

Esas sí. Números, tiempos, hechos que se pueden comprobar.$v$
WHERE node_id = '4.6' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '3f033ebf199e8075082cd00013b6403d';

UPDATE public.node_cards SET title = $v$Exagerar cuesta más que callarse$v$, body = $v$Cuando una bala suena demasiado buena, el cliente no se emociona: se pone escéptico. Y una vez que duda de un dato tuyo, empieza a dudar de todos.

El impulso construido con verdad se sostiene. El construido con exageración se cae solo, y se lleva tu credibilidad de paso.

Si no tienes una bala buena para ese momento, no inventes una. Usa la que sí tienes.$v$
WHERE node_id = '4.6' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '900605470359487c795ca08b7a9aa29b';

UPDATE public.node_cards SET title = $v$El impulso es otra palabra para la emoción$v$, body = $v$Ya sabes que el impulso es del cliente: qué tanto quiere comprar, en este momento.

Y no sube solo. Sube porque tú haces algo que lo mueve.

Hay seis maneras de moverlo. Se llaman FUJPIG, y las vas a practicar una por una en los nodos que siguen.$v$
WHERE node_id = '4.7' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'cf3656611f10c89815c2a429ce3a213f';

UPDATE public.node_cards SET body = $v$F — FEAR OF LOSS / Miedo a la pérdida
U — URGENCY / Urgencia
J — JONES EFFECT / Efecto Jones
P — POWER OF SUGGESTION / Poder de sugestión
I — INDIFFERENCE / Indiferencia
G — GREED / Avaricia

Seis. Ni una más. Y funcionan combinadas: casi nunca vas a usar una sola.$v$
WHERE node_id = '4.7' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'b6af5cfc0b30b0ce5bf526086126b9df';

UPDATE public.node_cards SET body = $v$MIEDO A LA PÉRDIDA. La doctrina lo dice sin rodeos: el miedo a perder es mayor que la necesidad de ganar. A la gente le mueve más no quedarse sin algo que la posibilidad de obtenerlo.

URGENCIA. El movimiento crea emoción. Una decisión que puede esperar, espera para siempre.

Las dos van juntas casi siempre: qué se le va, y por qué se le va hoy.$v$
WHERE node_id = '4.7' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '63ae87b70cafc823925758c4406d783d';

UPDATE public.node_cards SET body = $v$EFECTO JONES. Viene de "keeping up with the Joneses": la gente copia a la gente. Otros negocios como el suyo ya lo hacen. Ojo con esto: entre más concreto (qué negocio, dónde, qué le pasó), más pesa. "Todo mundo lo lleva" sigue siendo Efecto Jones, pero desperdiciado. Y en la calle tiene que ser real: inventarlo es la peor decisión que puedes tomar.

AVARICIA. La sensación de estar obteniendo más por menos: lo que vale contra lo que le cuesta. No es codicia fea: es la satisfacción legítima de sentir que hiciste un buen trato.$v$
WHERE node_id = '4.7' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '98a71d069d8789dacb8975eab4b48b91';

UPDATE public.node_cards SET title = $v$P e I: sugerir y no necesitar$v$, body = $v$PODER DE SUGESTIÓN. Llevas la conversación hacia el resultado, con dos herramientas: el tren del sí (preguntas cuya respuesta natural es sí, nacidas de lo que el cliente te contó) y asumir (das por hecho el siguiente paso y le das a escoger entre opciones donde las dos te sirven). Nada de preguntas de sí o no sobre la compra.

INDIFERENCIA. Sé lo opuesto a un vendedor. Emocionado con la persona y con el producto, indiferente a si compra. Suena raro y es lo que más funciona: la presión genera resistencia, y quitar la presión la disuelve.$v$
WHERE node_id = '4.7' AND card_order = 5 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '35162df8697e09d86daeac94e3c7a2d6';

UPDATE public.node_cards SET title = $v$La línea que nunca se cruza$v$, body = $v$Los seis factores son poderosos, y por eso hay una regla que no se negocia.

El impulso se construye con VERDAD. Urgencia que no existe, escasez inventada, otros clientes que nunca compraron: todo eso está prohibido, y no por moral abstracta.

Es práctico: un impulso falso se derrumba en cuanto el cliente lo descubre, y se lleva la venta, la relación y tu reputación en la zona.

En la práctica de Closer todo es imaginario: puedes imaginar clientes, ejemplos y descuentos, porque lo que practicas es usar la herramienta. Aprovéchalo para practicar con lo que tu empresa SÍ tiene: así llegas a la calle sabiendo usarlo.$v$
WHERE node_id = '4.7' AND card_order = 6 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '7cfcb2068562915c97aebd10e1a1c16f';

UPDATE public.node_cards SET body = $v$Débil: "Está perdiendo mucho dinero con esos faltantes."
Potente: "Usted me dijo que se le van dos clientes al mes. Son veinticuatro al año, don Ramón — cada uno comprándole a la competencia. Y eso está pasando hoy."

La receta: toma el dolor que él te declaró, ponle números, ponle destino (¿a dónde se va esa pérdida?) y ánclalo en el presente. Su propio dato, devuelto con peso.$v$
WHERE node_id = '4.8' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '0862b6c9a0567ccfdb9ec3c1676359a4';

UPDATE public.node_cards SET body = $v$La urgencia honesta existe y sobra — no hay que inventarla:

Tu ruta es real: "esta semana levanto los pedidos de la zona; si lo dejamos, su surtido llega hasta el mes que entra."
Sus ciclos son reales: "la quincena se le viene encima; si lo pedimos hoy, la agarra surtido."
Los tiempos son reales: "el pedido tarda una semana en llegar; decidiendo hoy, lo tiene antes del fin de semana bueno."

El movimiento crea emoción. La fecha real crea decisión.$v$
WHERE node_id = '4.8' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'ca1e4570eaad944fe73acf12f19ad003';

UPDATE public.node_cards SET body = $v$A todos nos gusta ganar de más — es humano. El acelerador de la avaricia no es codicia: es hacer visible la brecha entre lo que algo vale y lo que le cuesta.

Débil: "le conviene, va a ganar más."
Potente: "Esta caja normalmente sale en mil doscientos; a usted le queda en mil cincuenta. Y como le deja ochenta pesos más por caja que la que maneja, son como mil doscientos extra al mes."

La regla: números que ÉL pueda verificar con sus propias cuentas. Cuando el cliente hace la cuenta en voz alta... el acelerador ya está trabajando solo.$v$
WHERE node_id = '4.9' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '7d03e0989c796bf9888e7340f2e4a06c';

UPDATE public.node_cards SET body = $v$Es la fuerza más vieja del mundo: si al de al lado le está funcionando, yo también quiero. En los negocios pesa doble — porque quedarse fuera no es solo antojo: es la competencia ganándote clientes.

"El negocio de la calle San José le entró hace dos meses — don Aurelio ya va en su tercer pedido."

Nombre, lugar, tiempo, resultado. El cliente lo puede ubicar, hasta preguntarle. Eso es prueba social — lo demás es rumor.$v$
WHERE node_id = '4.9' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'ee6cb9b8b3d4d34aa499847d0720be55';

UPDATE public.node_cards SET body = $v$Ojo con el matiz — indiferencia NO es frialdad ni desgano. Se resume en SW3: Some Will, Some Won't, So What. Algunos sí, algunos no... ¿y qué?

Por tu PRODUCTO: entusiasmo genuino, siempre. "El producto me encanta y por eso lo traigo."
Por SU DECISIÓN: tranquilidad total. "Si le sirve, qué bueno. Si no, no pasa nada — la zona es grande."

Y la frase que desarma a cualquier difícil: "¿Le platico cómo lo está usando el de la San José... o lo dejamos para otra vuelta?" El que está dispuesto a irse es, misteriosamente, al que no dejan ir.$v$
WHERE node_id = '4.10' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'b44ceea7f3afbc51edf659802d439814';

UPDATE public.node_cards SET body = $v$"Mire, para su movimiento lo que le va a funcionar es la caja mixta. ¿Se la traigo el jueves o el viernes, que ando por acá?"

Qué hizo esa frase: sugirió QUÉ (específico para su caso), le dio a escoger CUÁNDO entre dos opciones, y las dos son un sí. No pidió permiso.

El cliente escoge — y al escoger, ya dijo que sí, aunque sea de forma indirecta. Y si quiere ajustar algo ("mejor media caja"), ajustar también es participar del plan.$v$
WHERE node_id = '4.11' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '1bb2699ddc0348bd6029a7da52b85cc5';

UPDATE public.node_cards SET body = $v$Asumir es proponer el camino natural y dejar que el cliente escoja.

Presionar es decidir por él: dar por cerrado lo que no aceptó ("ya se lo apunté"), meter cantidades o condiciones que nunca platicaron, o ignorar un cambio que te pidió.

La diferencia está en quién decide. Si le das opciones y él escoge, asumiste bien. Si decides tú por él, presionaste.

En el siguiente mundo, esta habilidad se gradúa: se llama cierre.$v$
WHERE node_id = '4.11' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '32021f4e7b3420c0470c11f265275cb4';

UPDATE public.node_cards SET body = $v$"Usted me decía que le da coraje mandar clientes a la competencia, ¿verdad?" — Sí.
"Y un cliente que se va, a veces ya no regresa, ¿no le ha pasado?" — Sí, me ha pasado.
"Entonces tener el producto cuando se lo piden le cuida justo eso, ¿verdad?" — Pues sí.

Tres síes. Tres escalones. El cliente lleva tres acuerdos contigo antes de hablar de ningún pedido — y decir el cuarto sí es más fácil que decir el primero. Así funciona el impulso.$v$
WHERE node_id = '4.12' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'ab0f1fa7c8444369c2901c493186bbb6';

UPDATE public.node_cards SET body = $v$Esa es la fórmula, y toda la técnica sale de ahí.

El cliente no compara tu precio contra cero. Lo compara contra lo que cree que vale. Si construiste bien el valor, tu precio ya se siente justo antes de que lo digas.

Y el ahorro no es una idea abstracta: es la distancia entre esas dos cifras. Tu trabajo es hacerla visible.$v$
WHERE node_id = '4.13' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'd2b89ff98e3c1e40726d316e1fbf0727';

UPDATE public.node_cards SET body = $v$No des un solo número. Da tres, bajando:

NORMALMENTE — lo que cuesta de lista. Aquí hace match con lo que el cliente ya esperaba.

CON EL PRIMER DESCUENTO — por ser cliente nuevo, por el volumen, por lo que aplique.

CON EL SEGUNDO — por pago de contado, por cerrar hoy, por lo que corresponda.

Cien. Noventa. Ochenta. El cliente no escuchó un precio: vio bajar uno.$v$
WHERE node_id = '4.13' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '1993785789f48bd90a7d4d61cb16ac9a';

UPDATE public.node_cards SET title = $v$Cada escalón necesita un motivo$v$, body = $v$Esta es la regla que hace que funcione, y la que casi todos rompen.

Un precio que baja SIN razón le dice al cliente algo terrible: el primero estaba inflado. Y a partir de ahí te vuelve regateable, porque si bajó dos veces solo, va a bajar otra vez si presiona.

Un precio que baja POR RAZONES NOMBRADAS hace lo contrario: confirma que los cien eran reales, y cada escalón se vuelve una bala de precio.

Nunca bajes un número sin decir por qué.$v$
WHERE node_id = '4.13' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '1601104ec63837a0566722274321b74b';

UPDATE public.node_cards SET title = $v$Por qué se ve y no solo se escucha$v$, body = $v$Si dices "queda en ochenta", el cliente escucha un gasto de ochenta.

Si dices "normalmente cien, con su descuento de cliente nuevo noventa, y de contado ochenta", el cliente ve veinte pesos de ahorro que antes no existían.

Es el mismo número final. Pero uno se siente costo y el otro se siente ganancia. Y como el segundo descuento depende de algo que puede hacer HOY, aparece solo lo que ya conoces: el miedo a perder.$v$
WHERE node_id = '4.13' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'd83c8f447edced713f722ccac29d4517';

UPDATE public.node_cards SET title = $v$Y después del número, no te calles$v$, body = $v$Aquí es donde mueren más ventas que en ningún otro punto de la conversación.

El vendedor da el precio y se queda callado, esperando la reacción. Y en ese silencio el cliente hace lo único que puede hacer sin comprometerse: "lo voy a pensar".

Lo que sigue después del precio es tan importante que tiene su propio nodo. Es el siguiente.$v$
WHERE node_id = '4.13' AND card_order = 5 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'cb11e2ce613e5753f0ddecc200c3a5eb';

UPDATE public.node_cards SET body = $v$Este nodo no entrena una cosa: entrena dos que en la calle siempre van pegadas.

PRIMERO el desglose: tres números bajando, con su motivo cada uno.

Y DE INMEDIATO, sin pausa, el movimiento al siguiente paso.

Separados no funcionan. Un desglose perfecto seguido de silencio se convierte en un "lo voy a pensar".$v$
WHERE node_id = '4.14' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '45223c0de9082108caefaec4b5e67c3d';

UPDATE public.node_cards SET body = $v$"Le queda en novecientos sesenta." ... "¿Qué le parece?"$v$, flip_back_text = $v$Dos errores en una frase. Un solo número, así que el cliente escuchó un gasto y no un ahorro. Y después le preguntó qué le parece, que es entregarle el control justo en el momento más delicado. La respuesta cómoda a esa pregunta siempre es "déjeme lo pienso".$v$
WHERE node_id = '4.14' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'af6e1fb3de1cd55693cdbefbe778fff3';

UPDATE public.node_cards SET body = $v$"Normalmente le sale en mil doscientos. Como es su primer pedido, mil cincuenta. Y de contado se lo dejo en novecientos sesenta: son doscientos cuarenta de ahorro. Para que lo tenga esta semana, ¿le acomoda más jueves o viernes?"$v$, flip_back_text = $v$Tres números bajando, cada uno con su razón, y el ahorro dicho en voz alta. Y sin respirar, ya lo movió a escoger una fecha. Fíjate en lo que NO hizo: no preguntó si le parece bien ni si lo quiere. La respuesta a "¿jueves o viernes?" ya es un sí.$v$
WHERE node_id = '4.14' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '1e50e7a8ac6e634ee00c43b682397941';

UPDATE public.node_cards SET title = $v$Aquí no hay nada que resolver$v$, body = $v$Cuando presentas una solución a un dolor, el cliente ya sabe que algo le duele. Tu trabajo es conectar.

Con un hueco es distinto: el cliente está contento. No le duele nada. Esa familia ya se la surte alguien más, o no la maneja.

No hay problema que resolver, pero la balanza sigue ahí. La pregunta es la misma de siempre: ¿qué gana él con que tú se lo surtas?$v$
WHERE node_id = '4.15' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '1929439a447968a913df38fb2e202215';

UPDATE public.node_cards SET body = $v$Es la tentación natural: si le fallan, si le cobran caro, si se tardan.

Y es la manera más rápida de cerrar la puerta. Si el cliente lleva años con ese proveedor, criticarlo es criticar SU decisión. Y la gente defiende sus decisiones, aunque sean malas.

Lo correcto es lo contrario: reconócelo. "Qué bueno que lo tenga cubierto." Desde ahí sí se puede hablar.$v$
WHERE node_id = '4.15' AND card_order = 2 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '4c03458c5edee50a4c82315987655328';

UPDATE public.node_cards SET title = $v$Tus balas, escogidas para su caso$v$, body = $v$Para un hueco usas las mismas balas de siempre: producto, servicio y precio. Lo que cambia es cuáles escoges, porque tienen que servirle a ÉL.

"Como ya lo visito cada semana, se lo traigo en la misma entrega, sin pedido aparte." Es una bala de servicio que le baja el costo: su tiempo y su esfuerzo.

Ojo con "así tiene un proveedor menos": solo es bala si él te dejó ver que le pesa tratar con tantos proveedores. Muchos negocios tienen dos proveedores para lo mismo, a propósito, por si uno les falla. Y si es una familia que no maneja, no le quitas un proveedor: le sumas uno.$v$
WHERE node_id = '4.15' AND card_order = 3 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '8ec71df9f44904d24465e0a9d0cffbf4';

UPDATE public.node_cards SET body = $v$"Le pongo unas pocas nada más para que lo pruebe y vea si le funciona."$v$, flip_back_text = $v$Suena humilde y es lo peor que puedes decir: le estás diciendo "yo no sé si esto sirve, averígualo tú con tu dinero". La gente no quiere experimentar: está cómoda donde está, y probar algo nuevo es riesgo. Le pasaste el riesgo a él.$v$
WHERE node_id = '4.15' AND card_order = 4 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '1056f9205a0033d7baa0f3da82493e58';

UPDATE public.node_cards SET body = $v$"Yo no le puedo garantizar nada, pero estoy seguro de que se le va a mover. Se lo digo porque en los negocios de por acá es de lo que más sale."$v$, flip_back_text = $v$Dos movimientos y se calla. Reconocer que no puede garantizar es justamente lo que hace creíble lo que sí afirma. Y la razón detrás convierte su convicción en algo que se puede comprobar, en vez de puro entusiasmo de vendedor. Ojo con lo que NO dijo: nada de "y si no se mueve, lo ajustamos". Eso le metería una duda que el cliente no tenía.$v$
WHERE node_id = '4.15' AND card_order = 5 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = '30e016c3fd6db0db2ee40c07e5aaf8fd';

UPDATE public.node_cards SET title = $v$El cuarto Boss.$v$
WHERE node_id = '4.16' AND card_order = 1 AND md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) = 'b1be4b94e643018032da34fe7e569f6c';

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '4.5', 1, $v$¿Cuál de estas frases es una bala?$v$, $v$"Somos los mejores de la zona."$v$, $v$"Llevamos catorce años surtiendo esta zona."$v$, $v$"Damos un servicio de calidad."$v$, NULL, 'B', $v$Exacto: es un hecho concreto que la competencia no puede decir igual. Eso es una bala.$v$, $v$Las otras dos las puede decir cualquier competidor. Si la competencia puede decir exactamente lo mismo, no es bala: es aire.$v$, 'present.bala_generica'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '4.5' AND question_order = 1);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '4.5', 2, $v$"Como ya lo visito cada semana, se lo traigo en la misma entrega, sin pedido aparte." ¿De dónde sale esa bala?$v$, $v$Del producto.$v$, $v$Del servicio.$v$, $v$Del precio.$v$, NULL, 'B', $v$Es una bala de servicio: cómo se lo haces llegar. Y le baja el costo: su tiempo y su esfuerzo.$v$, $v$No habla del producto ni del precio: habla de cómo se lo haces llegar. Eso es servicio, y le baja el costo al cliente.$v$, 'present.balas'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '4.5' AND question_order = 2);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '4.5', 3, $v$El cliente escucha con interés y el vendedor le suelta de jalón diez cosas buenas de su producto, su servicio y su precio. ¿Qué problema le va a traer?$v$, $v$Ninguno: entre más balas, más impulso.$v$, $v$Se queda sin munición para cuando el cliente ponga razones para no comprar.$v$, $v$Que el cliente le va a pedir descuento.$v$, NULL, 'B', $v$Correcto. Cuando el cliente ponga una razón para no comprar, lo que vuelve a subir su impulso es una bala nueva. Si ya las gastó todas, llega con la mano vacía.$v$, $v$El problema es la munición: en la presentación, unas tres cosas positivas antes del precio bastan. Las demás se guardan para cuando el cliente ponga razones para no comprar.$v$, 'present.dosificacion_balas'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '4.5' AND question_order = 3);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '4.13', 1, $v$¿Cuál es el triple desglose bien hecho?$v$, $v$"Le queda en ochenta."$v$, $v$"Normalmente cien, luego noventa, y le queda en ochenta."$v$, $v$"Normalmente cien, por ser cliente nuevo noventa, y de contado ochenta: son veinte de ahorro."$v$, NULL, 'C', $v$Exacto: tres números bajando, cada uno con su motivo, y el ahorro dicho en voz alta.$v$, $v$El primero es un solo número: el cliente escucha un gasto. El segundo baja sin decir por qué: parece que el primer precio estaba inflado. El bueno es el tercero.$v$, 'present.triple_desglose'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '4.13' AND question_order = 1);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '4.13', 2, $v$¿Qué le dice al cliente un precio que baja sin ninguna razón?$v$, $v$Que el primer precio estaba inflado, y que si presiona, va a bajar otra vez.$v$, $v$Que el vendedor es generoso.$v$, $v$Nada: el cliente solo se fija en el número final.$v$, NULL, 'A', $v$Correcto. Por eso cada escalón necesita su motivo: así confirmas que el primer precio era real y no te vuelves regateable.$v$, $v$Un precio que baja solo le enseña al cliente que el primero estaba inflado. Y si bajó dos veces sin razón, va a presionar para que baje otra vez.$v$, 'present.escalon_sin_motivo'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '4.13' AND question_order = 2);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id)
SELECT '4.13', 3, $v$Acabas de decir el último número del desglose. ¿Qué haces?$v$, $v$Me quedo callado para que el cliente lo piense.$v$, $v$Le pregunto: "¿qué le parece?"$v$, $v$Avanzo de inmediato al siguiente paso: "¿le acomoda más jueves o viernes?"$v$, NULL, 'C', $v$Exacto. Después del número, sin pausa, el siguiente paso. Contestar "¿jueves o viernes?" ya es un sí.$v$, $v$En el silencio, el cliente dice "lo voy a pensar". Y "¿qué le parece?" le entrega el control. Lo que sigue es avanzar de inmediato con el siguiente paso.$v$, 'close.devuelve_el_volante'
WHERE NOT EXISTS (SELECT 1 FROM public.node_quiz_questions WHERE node_id = '4.13' AND question_order = 3);

DO $o$ DECLARE a int; b int; BEGIN
  SELECT order_index INTO a FROM public.nodes WHERE id = '4.11';
  SELECT order_index INTO b FROM public.nodes WHERE id = '4.12';
  IF a IS NULL OR b IS NULL THEN RAISE EXCEPTION 'no encontré los nodos 4.11 y 4.12'; END IF;
  IF a < b THEN
    UPDATE public.nodes SET order_index = CASE id WHEN '4.11' THEN b WHEN '4.12' THEN a END WHERE id IN ('4.11', '4.12');
  END IF;
END $o$;

DO $chk$ BEGIN
  IF (SELECT max(version) FROM public.doctrina WHERE is_active) <> 19 THEN RAISE EXCEPTION 'el Cerebro no quedó en v19'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE is_active AND strpos(body, $v$**Las balas son TUYAS.** Son hechos positivos y concretos, y salen de tres lugares `CAMPO`:
- **El producto** — lo que lo diferencia: presentación, marca, rendimiento, mejoras, datos, certificaciones
- **El servicio** — tú y tu empresa (experiencia, años en la zona, casos de éxito, dedicación) y cómo se lo haces llegar (entrega, cada cuánto lo visitas, plazo, atención)
- **El precio** — propuesta de valor, descuentos con su motivo, comparación

Con cada bala mueves la balanza: subes el valor o bajas el costo.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'un cambio del Cerebro no quedó'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE is_active AND strpos(body, $v$**La pregunta que define el argumento: ¿qué gana él con que tú se lo surtas?**

Es la balanza de siempre: qué valor le sumas o qué costo le bajas. Y se contesta con balas de los mismos tres lugares —**producto**, **servicio** y **precio**—, escogidas para SU caso, no de una fórmula. Por ejemplo:

- **Servicio que le baja el costo** — *"como ya lo visito cada semana, se lo traigo en la misma entrega, sin pedido aparte"*
- **Producto** — la presentación que le acomoda, o algo que se vende junto con lo que ya te compra
- **Precio** — un descuento con su motivo, o una condición de pago

> ⚠️ **La consolidación NO es un argumento universal.** *"Así tiene un proveedor menos"* es una bala de servicio solo cuando aplica: cuando el cliente deja ver que le pesa tratar con tantos proveedores, o que dejaría al otro. Muchos negocios tienen dos o tres proveedores para el mismo producto, a propósito, por si uno les falla. Y si la familia es nueva para él, no le quitas un proveedor: le sumas uno.
>
> Usarla donde no aplica es una bala inventada, y te desacredita.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'un cambio del Cerebro no quedó'; END IF;
  IF (SELECT resumen FROM public.reglas WHERE id = 'present.balas') IS DISTINCT FROM $v$Balas: hechos positivos y concretos sobre el producto, el servicio (tú, tu empresa y cómo se lo haces llegar) o el precio. Con cada una subes el valor o bajas el costo. Se sueltan poco a poco, conforme hace falta subir el impulso: en la presentación unas tres cosas positivas antes del precio, y ante una objeción una bala nueva. LA PRUEBA DE UNA BALA: ¿la competencia podría decir exactamente lo mismo? Si sí, no era bala. En la práctica todo es imaginario: no se califica si es real, sino si es concreto.$v$ THEN RAISE EXCEPTION 'la regla present.balas no quedó'; END IF;
  IF (SELECT resumen FROM public.reglas WHERE id = 'present.argumento_del_hueco') IS DISTINCT FROM $v$La pregunta que define el argumento de un hueco: ¿qué gana él con que tú se lo surtas? Es la balanza: qué valor le sumas o qué costo le bajas, con balas de producto, servicio o precio escogidas para su caso. LA PRUEBA: ¿el vendedor le da al cliente una razón para surtirse con él —algo que le sube el valor o le baja el costo— que corresponde a su caso? «Un proveedor menos» solo vale si el cliente dejó ver que le pesa tratar con tantos proveedores o que dejaría al otro; si no lo dijo, o si la familia es nueva para él, decir «menos proveedores» contradice su propio caso.$v$ THEN RAISE EXCEPTION 'la regla present.argumento_del_hueco no quedó'; END IF;
  IF (SELECT resumen FROM public.reglas WHERE id = 'present.consolidacion_falsa') IS DISTINCT FROM $v$Usar «un proveedor menos» donde no aplica: el cliente no dejó ver que le pesa tratar con tantos proveedores ni que dejaría al otro, o la familia es nueva para él y pasa a tener más proveedores, no menos. LA PRUEBA: ¿el vendedor le dice al cliente que con él tendrá menos proveedores sin que el cliente lo haya dejado ver, o para una familia que no maneja? Entonces es una bala inventada.$v$ THEN RAISE EXCEPTION 'la regla present.consolidacion_falsa no quedó'; END IF;
  IF (SELECT resumen FROM public.reglas WHERE id = 'impulse.factores') IS DISTINCT FROM $v$Sube el impulso con los factores de FUJPIG: miedo a la pérdida, urgencia, efecto Jones, poder de sugestión (el tren del sí y asumir), indiferencia y avaricia. LA PRUEBA: ¿cuántos factores distintos usó el vendedor, y cada uno con algo concreto del negocio del cliente o de la oferta? Un factor dicho en general («le conviene», «todos lo llevan», «aproveche») cuenta a medias. En la práctica todo es imaginario: no se califica si es real, sino si es concreto.$v$ THEN RAISE EXCEPTION 'la regla impulse.factores no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.0' AND card_order = 4) IS DISTINCT FROM '258b830208072574846a77469056022d' THEN RAISE EXCEPTION 'la tarjeta 4.0 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.0' AND card_order = 5) IS DISTINCT FROM '252c71c4e82870035643a0fdc3a6aa6a' THEN RAISE EXCEPTION 'la tarjeta 4.0 #5 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.1' AND card_order = 2) IS DISTINCT FROM '2e7b665e88c6cbc7f3d72efa3d0a6a8a' THEN RAISE EXCEPTION 'la tarjeta 4.1 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.2' AND card_order = 1) IS DISTINCT FROM '2a9ba73a90a01a41b92b958a9daa366f' THEN RAISE EXCEPTION 'la tarjeta 4.2 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.2' AND card_order = 2) IS DISTINCT FROM '28f090dd0089934d52f4f41b1e9021d7' THEN RAISE EXCEPTION 'la tarjeta 4.2 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.2' AND card_order = 3) IS DISTINCT FROM '0e6ac9bc28732b9d1b5324004d1f6b4e' THEN RAISE EXCEPTION 'la tarjeta 4.2 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.2' AND card_order = 4) IS DISTINCT FROM 'c7081b6e616834edaa27b1800f1ecaee' THEN RAISE EXCEPTION 'la tarjeta 4.2 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.3' AND card_order = 1) IS DISTINCT FROM 'b0e760fcbdff0ffad64d7bc7a9704101' THEN RAISE EXCEPTION 'la tarjeta 4.3 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.3' AND card_order = 2) IS DISTINCT FROM '5cbf25a9b111d6bc2c089338b4a6e836' THEN RAISE EXCEPTION 'la tarjeta 4.3 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.5' AND card_order = 1) IS DISTINCT FROM 'a5b83c75863351bc4e145655b9f48f2a' THEN RAISE EXCEPTION 'la tarjeta 4.5 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.5' AND card_order = 2) IS DISTINCT FROM '5cea6889f74d50fb903cd3e34b5ecfdc' THEN RAISE EXCEPTION 'la tarjeta 4.5 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.5' AND card_order = 3) IS DISTINCT FROM 'f2ab38f56d93469f0a4a7389f4184de1' THEN RAISE EXCEPTION 'la tarjeta 4.5 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.5' AND card_order = 4) IS DISTINCT FROM '271fd4eb87f15618cf71cd946bc9457c' THEN RAISE EXCEPTION 'la tarjeta 4.5 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.5' AND card_order = 5) IS DISTINCT FROM 'd917290dbeacd76f2f865d3a72967294' THEN RAISE EXCEPTION 'la tarjeta 4.5 #5 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.6' AND card_order = 1) IS DISTINCT FROM 'dfe158feceb7d854783c1f2557ae06f7' THEN RAISE EXCEPTION 'la tarjeta 4.6 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.6' AND card_order = 2) IS DISTINCT FROM 'f16b1f1e82bd1340c9c78ee7c9ce3f25' THEN RAISE EXCEPTION 'la tarjeta 4.6 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.6' AND card_order = 3) IS DISTINCT FROM 'da9c98e67870b005482d1bc0b8c31dae' THEN RAISE EXCEPTION 'la tarjeta 4.6 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.7' AND card_order = 1) IS DISTINCT FROM 'db66eb119b3bbc04cc4f963c6a4fabbf' THEN RAISE EXCEPTION 'la tarjeta 4.7 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.7' AND card_order = 2) IS DISTINCT FROM 'da617429e637de3878414f5454e065ed' THEN RAISE EXCEPTION 'la tarjeta 4.7 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.7' AND card_order = 3) IS DISTINCT FROM 'e21bfd976303635f0f678ad7603286e5' THEN RAISE EXCEPTION 'la tarjeta 4.7 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.7' AND card_order = 4) IS DISTINCT FROM '9bb9560c0b85f2a4787e316bd164c787' THEN RAISE EXCEPTION 'la tarjeta 4.7 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.7' AND card_order = 5) IS DISTINCT FROM '208a1fc544bc75d078c4e23c6228214e' THEN RAISE EXCEPTION 'la tarjeta 4.7 #5 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.7' AND card_order = 6) IS DISTINCT FROM 'ca9ff4db426f8bcd66f1182a18ea25e8' THEN RAISE EXCEPTION 'la tarjeta 4.7 #6 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.8' AND card_order = 2) IS DISTINCT FROM '76b2993064ccc4425581212e3bfd71ef' THEN RAISE EXCEPTION 'la tarjeta 4.8 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.8' AND card_order = 3) IS DISTINCT FROM 'f6c67fd7d2ee4a229adb3d40d6824130' THEN RAISE EXCEPTION 'la tarjeta 4.8 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.9' AND card_order = 1) IS DISTINCT FROM 'a83addfa447fe1221348ad08804293d0' THEN RAISE EXCEPTION 'la tarjeta 4.9 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.9' AND card_order = 2) IS DISTINCT FROM 'ad080fefb994bb7f418c96eeb019067e' THEN RAISE EXCEPTION 'la tarjeta 4.9 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.10' AND card_order = 2) IS DISTINCT FROM '0f5ab3ab98b85675b86d6c2932c2775e' THEN RAISE EXCEPTION 'la tarjeta 4.10 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.11' AND card_order = 2) IS DISTINCT FROM '41b70b41c0904b2f981c963d87f2afa2' THEN RAISE EXCEPTION 'la tarjeta 4.11 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.11' AND card_order = 3) IS DISTINCT FROM '3ae366984ecad891e81bd2af55b5f3b3' THEN RAISE EXCEPTION 'la tarjeta 4.11 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.12' AND card_order = 1) IS DISTINCT FROM '6b68f145b0d970857d93010f4f793105' THEN RAISE EXCEPTION 'la tarjeta 4.12 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.13' AND card_order = 1) IS DISTINCT FROM 'd8c14861521d8e87a3dc956bd239ab00' THEN RAISE EXCEPTION 'la tarjeta 4.13 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.13' AND card_order = 2) IS DISTINCT FROM '02177ab3c3299b7b1560d415c6ebf7ab' THEN RAISE EXCEPTION 'la tarjeta 4.13 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.13' AND card_order = 3) IS DISTINCT FROM '7157ca4f2695e8d236a5b98dd6ea4461' THEN RAISE EXCEPTION 'la tarjeta 4.13 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.13' AND card_order = 4) IS DISTINCT FROM '571cad5a19a5fd3b604dc9152f08ca79' THEN RAISE EXCEPTION 'la tarjeta 4.13 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.13' AND card_order = 5) IS DISTINCT FROM '33717a4c3b92d288560b0e182d68397d' THEN RAISE EXCEPTION 'la tarjeta 4.13 #5 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.14' AND card_order = 1) IS DISTINCT FROM 'b4d8c97f71b577014029662d944e5400' THEN RAISE EXCEPTION 'la tarjeta 4.14 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.14' AND card_order = 2) IS DISTINCT FROM '7f8e205efa4070eadd2fdc81e290825f' THEN RAISE EXCEPTION 'la tarjeta 4.14 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.14' AND card_order = 3) IS DISTINCT FROM '26422e409744fd209de990a10f4f604b' THEN RAISE EXCEPTION 'la tarjeta 4.14 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.15' AND card_order = 1) IS DISTINCT FROM 'c532f751de72e1441bca15b25e7637e6' THEN RAISE EXCEPTION 'la tarjeta 4.15 #1 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.15' AND card_order = 2) IS DISTINCT FROM '5ddd986a7e8a79102b7468f0bbfc0e8f' THEN RAISE EXCEPTION 'la tarjeta 4.15 #2 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.15' AND card_order = 3) IS DISTINCT FROM '7ac2d0fff463f8e9044bccdc4caecf76' THEN RAISE EXCEPTION 'la tarjeta 4.15 #3 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.15' AND card_order = 4) IS DISTINCT FROM '3669bda235af66a8f1a30a6b927c8685' THEN RAISE EXCEPTION 'la tarjeta 4.15 #4 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.15' AND card_order = 5) IS DISTINCT FROM '207535e1483335221f04b907e7ba56fe' THEN RAISE EXCEPTION 'la tarjeta 4.15 #5 no quedó'; END IF;
  IF (SELECT md5(concat_ws('|', card_order, coalesce(card_type,''), coalesce(title,''), coalesce(body,''), coalesce(flip_back_text,''))) FROM public.node_cards WHERE node_id = '4.16' AND card_order = 1) IS DISTINCT FROM '3f07972e1e775e44ffdcf75baab6e92d' THEN RAISE EXCEPTION 'la tarjeta 4.16 #1 no quedó'; END IF;
  IF (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '4.5') <> 3 THEN RAISE EXCEPTION 'el quiz del 4.5 no quedó con 3 preguntas'; END IF;
  IF (SELECT count(*) FROM public.node_quiz_questions WHERE node_id = '4.13') <> 3 THEN RAISE EXCEPTION 'el quiz del 4.13 no quedó con 3 preguntas'; END IF;
  IF (SELECT order_index FROM public.nodes WHERE id = '4.12') >= (SELECT order_index FROM public.nodes WHERE id = '4.11') THEN RAISE EXCEPTION 'el 4.12 no quedó antes del 4.11'; END IF;
END $chk$;
