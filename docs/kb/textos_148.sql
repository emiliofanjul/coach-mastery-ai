-- Mensaje 148 · Limpieza de textos (ortografía). Solo acentos, signos ¿ y ñ: no cambia ninguna palabra,
-- salvo «El cuarto Boss.» y sus parecidos, que dicen ahora «Reto final del Mundo N.» (el 3.10 decía
-- «cuarto» y es el tercero; y en el mapa ya no se dice «Boss»).
-- 1) Los 7 lemas de los mundos.  2) 42 tarjetas (casi todo el mundo 3, una del 4.4 y los títulos de 4 retos finales).
-- 3) Las 4 preguntas del quiz del 3.0.
-- Cada texto cambia solo si hoy es exactamente el esperado. El chequeo del final aborta todo si algo no quedó.

UPDATE public.worlds AS w SET description = v.nuevo FROM (VALUES
  (1, $t$Aqui no vendes nada. Aqui te ganas el derecho a seguir hablando.$t$, $t$Aquí no vendes nada. Aquí te ganas el derecho a seguir hablando.$t$),
  (2, $t$El cliente ya te puso atencion. Ahora necesita saber con quien esta hablando.$t$, $t$El cliente ya te puso atención. Ahora necesita saber con quién está hablando.$t$),
  (3, $t$Deja de recetar y empieza a diagnosticar. Aqui aprendes que preguntar y como llegar al fondo.$t$, $t$Deja de recetar y empieza a diagnosticar. Aquí aprendes qué preguntar y cómo llegar al fondo.$t$),
  (4, $t$Ya sabes que le duele. Aqui aprendes a construir valor, subir el impulso y presentar el precio.$t$, $t$Ya sabes qué le duele. Aquí aprendes a construir valor, subir el impulso y presentar el precio.$t$),
  (5, $t$Presentar sin cerrar es contar un cuento. Aqui aprendes a pedir la decision y a atravesar lo que se atraviese.$t$, $t$Presentar sin cerrar es contar un cuento. Aquí aprendes a pedir la decisión y a atravesar lo que se atraviese.$t$),
  (6, $t$Ya dijo que si. Lo que hagas ahora decide si esa venta se queda y si hay una siguiente.$t$, $t$Ya dijo que sí. Lo que hagas ahora decide si esa venta se queda y si hay una siguiente.$t$),
  (7, $t$Todo el sistema, sin ayudas. Aqui se sella tu certificacion.$t$, $t$Todo el sistema, sin ayudas. Aquí se sella tu certificación.$t$)
) AS v(id, viejo, nuevo)
WHERE w.id = v.id AND w.description = v.viejo;

UPDATE public.node_cards AS c SET title = v.titulo, body = v.cuerpo FROM (VALUES
  ($t$3.0$t$, 1, $t$Imagina esta consulta.$t$, $t$Entras al consultorio. El doctor, sin preguntarte nada, sin revisarte, te dice: "Tomese estas pastillas, son buenisimas, a todos mis pacientes les funcionan."

Le crees? Te las tomas?

Eso EXACTO siente un cliente cuando le presentas el producto sin haberle preguntado nada.$t$, $t$Imagina esta consulta.$t$, $t$Entras al consultorio. El doctor, sin preguntarte nada, sin revisarte, te dice: "Tómese estas pastillas, son buenísimas, a todos mis pacientes les funcionan."

¿Le crees? ¿Te las tomas?

Eso EXACTO siente un cliente cuando le presentas el producto sin haberle preguntado nada.$t$),
  ($t$3.0$t$, 2, $t$El diagnostico es lo que te separa.$t$, $t$El vendedor promedio llega a recetar: trae su producto favorito en la mente y busca donde encajarlo.

El Closer llega a diagnosticar: pregunta, escucha, entiende el negocio — y SOLO entonces conecta lo que vende con lo que descubrio.

La ironia: el que diagnostica vende mas que el que receta. Porque la gente no compra productos — compra soluciones a SUS problemas.$t$, $t$El diagnóstico es lo que te separa.$t$, $t$El vendedor promedio llega a recetar: trae su producto favorito en la mente y busca dónde encajarlo.

El Closer llega a diagnosticar: pregunta, escucha, entiende el negocio — y SOLO entonces conecta lo que vende con lo que descubrió.

La ironía: el que diagnostica vende más que el que receta. Porque la gente no compra productos — compra soluciones a SUS problemas.$t$),
  ($t$3.0$t$, 3, $t$El mapa del dolor: los 3 Territorios$t$, $t$Un doctor no examina al azar: sabe donde buscar. Tu tambien. TODO dolor comercial de un cliente vive en uno de tres territorios:

PRODUCTO — lo que vende o usa: faltantes de su estrella, lineas que no rotan, marcas que le piden y no consigue.

SERVICIO — como lo trata su proveedor: entregas que no llegan, plantones, nadie que de la cara.

PRECIO — lo que paga y lo que gana: margen apretado, subidas sin aviso, dinero congelado parado.

Ya no preguntas al azar. Preguntas con mapa.$t$, $t$El mapa del dolor: los 3 Territorios$t$, $t$Un doctor no examina al azar: sabe dónde buscar. Tú también. TODO dolor comercial de un cliente vive en uno de tres territorios:

PRODUCTO — lo que vende o usa: faltantes de su estrella, líneas que no rotan, marcas que le piden y no consigue.

SERVICIO — cómo lo trata su proveedor: entregas que no llegan, plantones, nadie que dé la cara.

PRECIO — lo que paga y lo que gana: margen apretado, subidas sin aviso, dinero congelado parado.

Ya no preguntas al azar. Preguntas con mapa.$t$),
  ($t$3.0$t$, 4, $t$El mismo territorio se pregunta distinto$t$, $t$Los tres territorios son siempre los mismos. Lo que cambia es COMO preguntas, segun a quien le estas vendiendo.

SI TU CLIENTE REVENDE lo que le compras: le preguntas por lo que mas maneja, por lo que sus clientes le piden y no tiene, por lo que se le queda parado.

SI TU CLIENTE CONSUME lo que le vendes: no le preguntes que vende, porque no vende nada. Preguntale que USA, cuantas unidades maneja, cada cuanto repone, cuanto le dura.

SI TU CLIENTE DISTRIBUYE: le preguntas por sus lineas, por a cuantos surte, por la zona que cubre.

Mismo mapa, tres traducciones. Preguntarle a un consumidor que maneja mas es la manera mas rapida de que se de cuenta de que no entendiste su negocio.$t$, $t$El mismo territorio se pregunta distinto$t$, $t$Los tres territorios son siempre los mismos. Lo que cambia es CÓMO preguntas, según a quién le estás vendiendo.

SI TU CLIENTE REVENDE lo que le compras: le preguntas por lo que más maneja, por lo que sus clientes le piden y no tiene, por lo que se le queda parado.

SI TU CLIENTE CONSUME lo que le vendes: no le preguntes qué vende, porque no vende nada. Pregúntale qué USA, cuántas unidades maneja, cada cuánto repone, cuánto le dura.

SI TU CLIENTE DISTRIBUYE: le preguntas por sus líneas, por a cuántos surte, por la zona que cubre.

Mismo mapa, tres traducciones. Preguntarle a un consumidor qué maneja más es la manera más rápida de que se dé cuenta de que no entendiste su negocio.$t$),
  ($t$3.0$t$, 5, $t$Por que preguntar vende mas que hablar$t$, $t$Cuando preguntas de verdad, pasan tres cosas a tu favor:

El cliente se siente escuchado — y baja la guardia que le pone a los vendedores. Te da la municion exacta — te dice literalmente que le duele y que necesita. Y tu presentacion deja de ser generica — cada palabra que digas despues va a estar conectada con lo que EL te conto.

Preguntar no retrasa la venta. La construye.$t$, $t$Por qué preguntar vende más que hablar$t$, $t$Cuando preguntas de verdad, pasan tres cosas a tu favor:

El cliente se siente escuchado — y baja la guardia que le pone a los vendedores. Te da la munición exacta — te dice literalmente qué le duele y qué necesita. Y tu presentación deja de ser genérica — cada palabra que digas después va a estar conectada con lo que ÉL te contó.

Preguntar no retrasa la venta. La construye.$t$),
  ($t$3.0$t$, 6, $t$La regla del investigador$t$, $t$El dolor NUNCA se pregunta directo. "Que problemas tiene?" produce un "ninguno, todo bien" — garantizado.

El dolor se deja emerger: preguntas por los hechos de un territorio, subes a la experiencia, y esperas el flaqueo — el "aunque...", el "a veces...", el "lo unico es que...".

Y cuando el dolor sale, apréndetelo con SUS palabras. Se lo puedes repetir en ese momento, o quedarte callado y seguir. Lo importante es no olvidarlo: lo vas a usar en la presentación.$t$, $t$La regla del investigador$t$, $t$El dolor NUNCA se pregunta directo. "¿Qué problemas tiene?" produce un "ninguno, todo bien" — garantizado.

El dolor se deja emerger: preguntas por los hechos de un territorio, subes a la experiencia, y esperas el flaqueo — el "aunque...", el "a veces...", el "lo único es que...".

Y cuando el dolor sale, apréndetelo con SUS palabras. Se lo puedes repetir en ese momento, o quedarte callado y seguir. Lo importante es no olvidarlo: lo vas a usar en la presentación.$t$),
  ($t$3.0$t$, 7, $t$Tu nuevo orden mental$t$, $t$De este mundo en adelante, tu regla es la del doctor: primero el examen, luego la receta.

Ya te ganaste el derecho de hacer preguntas de negocio — abriste bien, te presentaste bien. Ahora si: recorre los territorios, escucha, profundiza. La presentacion puede esperar. El diagnostico, no.$t$, $t$Tu nuevo orden mental$t$, $t$De este mundo en adelante, tu regla es la del doctor: primero el examen, luego la receta.

Ya te ganaste el derecho de hacer preguntas de negocio — abriste bien, te presentaste bien. Ahora sí: recorre los territorios, escucha, profundiza. La presentación puede esperar. El diagnóstico, no.$t$),
  ($t$3.2$t$, 1, $t$El dolor real nunca esta en la superficie.$t$, $t$Preguntale a cualquier cliente "como va el negocio?" y te dira "bien, gracias a Dios."

Es cierto? Mas o menos. Todo negocio trae algo que le duele — y ya sabes donde buscarlo: en el PRODUCTO, en el SERVICIO o en el PRECIO. Pero eso no se cuenta al primer desconocido que pregunta. Se cuenta a quien se gana la respuesta... pelando capas.$t$, $t$El dolor real nunca está en la superficie.$t$, $t$Pregúntale a cualquier cliente "¿cómo va el negocio?" y te dirá "bien, gracias a Dios."

¿Es cierto? Más o menos. Todo negocio trae algo que le duele — y ya sabes dónde buscarlo: en el PRODUCTO, en el SERVICIO o en el PRECIO. Pero eso no se cuenta al primer desconocido que pregunta. Se cuenta a quien se gana la respuesta... pelando capas.$t$),
  ($t$3.2$t$, 2, $t$Las tres capas$t$, $t$CAPA 1 — Hechos: faciles de responder, cero riesgo. "Que maneja mas?" "Quien lo surte?" "A como le llega?" Abren la platica y te dan el mapa de sus territorios.

CAPA 2 — La puerta al dolor: aqui el cliente puede soltar una PISTA... o cerrarte la puerta con un "bien". Todo depende de COMO preguntes.

CAPA 3 — El dolor completo: solo se abre si recoges la pista y profundizas con preguntas abiertas. Aqui te cuenta lo que de verdad le duele, con detalle y con emocion.$t$, $t$Las tres capas$t$, $t$CAPA 1 — Hechos: fáciles de responder, cero riesgo. "¿Qué maneja más?" "¿Quién lo surte?" "¿A cómo le llega?" Abren la plática y te dan el mapa de sus territorios.

CAPA 2 — La puerta al dolor: aquí el cliente puede soltar una PISTA... o cerrarte la puerta con un "bien". Todo depende de CÓMO preguntes.

CAPA 3 — El dolor completo: solo se abre si recoges la pista y profundizas con preguntas abiertas. Aquí te cuenta lo que de verdad le duele, con detalle y con emoción.$t$),
  ($t$3.2$t$, 3, $t$Cuidado con el "bien" automatico.$t$, $t$"Y que tal le va con su proveedor?" — "Bien, no me quejo."

Esa respuesta no es informacion: es un reflejo. Nadie le cuenta sus problemas a un desconocido que pregunta en generico, por dos razones: la respuesta cortes ya la trae cargada, y admitir un problema se siente como quejarse o como aceptar que eligio mal.

La pregunta generica no falla por mala suerte. Falla siempre. Y el vendedor promedio la escucha, piensa "aqui no hay nada" y se va con las manos vacias.$t$, $t$Cuidado con el "bien" automático.$t$, $t$"¿Y qué tal le va con su proveedor?" — "Bien, no me quejo."

Esa respuesta no es información: es un reflejo. Nadie le cuenta sus problemas a un desconocido que pregunta en genérico, por dos razones: la respuesta cortés ya la trae cargada, y admitir un problema se siente como quejarse o como aceptar que eligió mal.

La pregunta genérica no falla por mala suerte. Falla siempre. Y el vendedor promedio la escucha, piensa "aquí no hay nada" y se va con las manos vacías.$t$),
  ($t$3.2$t$, 4, $t$La pregunta que no se puede contestar con "bien"$t$, $t$La solucion es simple: cambia la opinion general por algo CONCRETO.

En vez de "que tal le va con su proveedor?" -> "le ha tocado quedarse sin su producto estrella?"
En vez de "que tal anda el precio?" -> "cuanto le subieron este ano?"
En vez de "todo bien por aca?" -> "cuantas veces al mes le llega incompleto el pedido?"

Ya no puede disparar el reflejo: tiene que ir a buscar un dato real de su negocio. Eso es todo — no es una tecnica complicada, es dejar de preguntar en general.

Mas adelante vas a aprender una version aun mas potente: darle permiso de admitirlo contandole que a otros les pasa. Por ahora, con preguntar concreto ya cambias el juego.$t$, $t$La pregunta que no se puede contestar con "bien"$t$, $t$La solución es simple: cambia la opinión general por algo CONCRETO.

En vez de "¿qué tal le va con su proveedor?" -> "¿le ha tocado quedarse sin su producto estrella?"
En vez de "¿qué tal anda el precio?" -> "¿cuánto le subieron este año?"
En vez de "¿todo bien por acá?" -> "¿cuántas veces al mes le llega incompleto el pedido?"

Ya no puede disparar el reflejo: tiene que ir a buscar un dato real de su negocio. Eso es todo — no es una técnica complicada, es dejar de preguntar en general.

Más adelante vas a aprender una versión aún más potente: darle permiso de admitirlo contándole que a otros les pasa. Por ahora, con preguntar concreto ya cambias el juego.$t$),
  ($t$3.2$t$, 5, $t$Y aun asi te va a decir que no sabe$t$, $t$Preguntaste concreto y el cliente contesta pues no se, o se queda pensando y suelta cualquier cosa.

No es que no quiera. Es que una pregunta abierta lo obliga a construir la respuesta desde cero, y eso cuesta trabajo. Como no le urge ayudarte, contesta lo mas corto que puede.

La solucion es darle de donde agarrarse.$t$, $t$Y aun así te va a decir que no sabe$t$, $t$Preguntaste concreto y el cliente contesta pues no sé, o se queda pensando y suelta cualquier cosa.

No es que no quiera. Es que una pregunta abierta lo obliga a construir la respuesta desde cero, y eso cuesta trabajo. Como no le urge ayudarte, contesta lo más corto que puede.

La solución es darle de dónde agarrarse.$t$),
  ($t$3.2$t$, 6, $t$Suggestive Language: sugiere opciones$t$, $t$Despues de preguntar, avienta tres o cuatro opciones.

Que familias son las que mas se te mueven? Anticongelantes? Aceite de motor? Diesel? Moto?

A como compras el liquido de frenos? 70? 80? 90?

Y aqui esta lo bueno: o elige una de tus opciones, o te CORRIGE con el dato real — no, mas bien 95.

Esa correccion es justo la informacion que buscabas, y la pregunta abierta nunca te la habria dado.$t$, $t$Suggestive Language: sugiere opciones$t$, $t$Después de preguntar, avienta tres o cuatro opciones.

¿Qué familias son las que más se te mueven? ¿Anticongelantes? ¿Aceite de motor? ¿Diésel? ¿Moto?

¿A cómo compras el líquido de frenos? ¿70? ¿80? ¿90?

Y aquí está lo bueno: o elige una de tus opciones, o te CORRIGE con el dato real — no, más bien 95.

Esa corrección es justo la información que buscabas, y la pregunta abierta nunca te la habría dado.$t$),
  ($t$3.2$t$, 7, $t$La palabra magica: "aunque..."$t$, $t$Cuando tu pregunta abre la puerta, escucha con lupa los peros y los aunques: "bien, aunque a veces batalla uno", "sin queja, lo unico es que...".

Eso NO es relleno — es el cliente asomando el dolor para ver si te interesa. Si lo dejas pasar, la puerta se cierra y no se vuelve a abrir. Si lo recoges con una pregunta ABIERTA ("como cuanto le dura ese batallar?"), la capa 3 se abre sola.

Concreta para abrir. Abierta para excavar. Ese es el orden, y no se invierte.$t$, $t$La palabra mágica: "aunque..."$t$, $t$Cuando tu pregunta abre la puerta, escucha con lupa los peros y los aunques: "bien, aunque a veces batalla uno", "sin queja, lo único es que...".

Eso NO es relleno — es el cliente asomando el dolor para ver si te interesa. Si lo dejas pasar, la puerta se cierra y no se vuelve a abrir. Si lo recoges con una pregunta ABIERTA ("¿como cuánto le dura ese batallar?"), la capa 3 se abre sola.

Concreta para abrir. Abierta para excavar. Ese es el orden, y no se invierte.$t$),
  ($t$3.2$t$, 8, $t$Y si de verdad no hay nada ahi? El barrido.$t$, $t$A veces preguntas concreto y el cliente lo niega limpio: "no, eso si no, mi proveedor me cumple bien." Y es verdad.

Ahi el vendedor promedio hace una de dos: insiste hasta volverse pesado, o se rinde. El investigador hace la tercera: le CREE, y CAMBIA DE TERRITORIO. Servicio salio sano? Explora producto: "y hay algo que sus clientes le pidan y batalle para conseguir?" O precio: "y a como le esta llegando su estrella?"

El dolor casi siempre existe. Solo que vive en OTRA zona del mapa. Negacion limpia = siguiente territorio.$t$, $t$¿Y si de verdad no hay nada ahí? El barrido.$t$, $t$A veces preguntas concreto y el cliente lo niega limpio: "no, eso sí no, mi proveedor me cumple bien." Y es verdad.

Ahí el vendedor promedio hace una de dos: insiste hasta volverse pesado, o se rinde. El investigador hace la tercera: le CREE, y CAMBIA DE TERRITORIO. ¿Servicio salió sano? Explora producto: "¿y hay algo que sus clientes le pidan y batalle para conseguir?" O precio: "¿y a cómo le está llegando su estrella?"

El dolor casi siempre existe. Solo que vive en OTRA zona del mapa. Negación limpia = siguiente territorio.$t$),
  ($t$3.3$t$, 1, $t$El cliente te está regalando oro. ¿Lo estás viendo?$t$, $t$"Aqui lo que mas jala es esa linea, sobre todo desde que mi hijo le entro al negocio."

El vendedor con guion escucha: la linea que mas jala — dato para su lista.

El Closer escucha: MI HIJO le entro al negocio — la historia completa del lugar, regalada de pasada.

Cada respuesta trae un regalo que nadie pidio. La diferencia esta en quien lo recoge.$t$, $t$El cliente te está regalando oro. ¿Lo estás viendo?$t$, $t$"Aquí lo que más jala es esa línea, sobre todo desde que mi hijo le entró al negocio."

El vendedor con guion escucha: la línea que más jala — dato para su lista.

El Closer escucha: MI HIJO le entró al negocio — la historia completa del lugar, regalada de pasada.

Cada respuesta trae un regalo que nadie pidió. La diferencia está en quién lo recoge.$t$),
  ($t$3.3$t$, 2, $t$La regla: tu siguiente frase nace de la suya.$t$, $t$Escucha la respuesta completa. Encuentra el regalo, que es el dato que no pediste. Y pregunta sobre EL, usando las palabras del cliente.

"Su hijo tambien anda metido aqui? Y el fue el de la idea?"

Fijate en lo que NO hiciste: no sacaste tu siguiente pregunta de la lista. La conversacion va por donde el la abrio, y por eso se siente conversacion y no interrogatorio.$t$, $t$La regla: tu siguiente frase nace de la suya.$t$, $t$Escucha la respuesta completa. Encuentra el regalo, que es el dato que no pediste. Y pregunta sobre ÉL, usando las palabras del cliente.

"¿Su hijo también anda metido aquí? ¿Y él fue el de la idea?"

Fíjate en lo que NO hiciste: no sacaste tu siguiente pregunta de la lista. La conversación va por donde él la abrió, y por eso se siente conversación y no interrogatorio.$t$),
  ($t$3.4$t$, 1, $t$Un cuestionario no abre a nadie$t$, $t$Ya sabes preguntar por capas y ya sabes recorrer los tres territorios. Y aun asi te pueden contestar puros datos secos.

Porque hay una diferencia enorme entre alguien que te contesta y alguien que se te abre. Los datos te los da cualquiera. El dolor solo te lo cuenta quien confia en ti.

El cuestionario perfecto, hecho por un desconocido, no llega al fondo nunca.$t$, $t$Un cuestionario no abre a nadie$t$, $t$Ya sabes preguntar por capas y ya sabes recorrer los tres territorios. Y aun así te pueden contestar puros datos secos.

Porque hay una diferencia enorme entre alguien que te contesta y alguien que se te abre. Los datos te los da cualquiera. El dolor solo te lo cuenta quien confía en ti.

El cuestionario perfecto, hecho por un desconocido, no llega al fondo nunca.$t$),
  ($t$3.4$t$, 2, $t$Intercala, no separes$t$, $t$El error natural es hacer dos bloques: primero las preguntas de negocio y al final, si sobra tiempo, algo personal.

No funciona asi. Se intercala.

Preguntas de un territorio. Recoges algo personal que te suelta. Le entras un momento. Y regresas al siguiente territorio. La conversacion se siente humana de principio a fin, y las respuestas se vuelven mas hondas conforme avanza.$t$, $t$Intercala, no separes$t$, $t$El error natural es hacer dos bloques: primero las preguntas de negocio y al final, si sobra tiempo, algo personal.

No funciona así. Se intercala.

Preguntas de un territorio. Recoges algo personal que te suelta. Le entras un momento. Y regresas al siguiente territorio. La conversación se siente humana de principio a fin, y las respuestas se vuelven más hondas conforme avanza.$t$),
  ($t$3.4$t$, 3, $t$Aqui es donde mas facil se hace$t$, $t$En este paso el CPR casi se hace solo, y por eso es el mejor lugar para practicarlo.

Estas preguntando por su negocio: cuanto lleva, como empezo, quien le ayuda. Todo eso ya es territorio personal. Solo tienes que reconocer cuando el cliente te abre una puerta, y entrar.

Y aqui vale doble: no solo construye relacion. Es lo que hace que te contesten la siguiente pregunta de verdad.$t$, $t$Aquí es donde más fácil se hace$t$, $t$En este paso el CPR casi se hace solo, y por eso es el mejor lugar para practicarlo.

Estas preguntando por su negocio: cuánto lleva, cómo empezó, quién le ayuda. Todo eso ya es territorio personal. Solo tienes que reconocer cuando el cliente te abre una puerta, y entrar.

Y aquí vale doble: no solo construye relación. Es lo que hace que te contesten la siguiente pregunta de verdad.$t$),
  ($t$3.5$t$, 5, $t$QTQP: tiempo de calidad con gente de calidad$t$, $t$Q — QUALITY
T — TIME
Q — QUALITY
P — PEOPLE

Tiempo de calidad con gente de calidad.

La doctrina lo dice sin rodeos: perder tiempo y energia con las personas equivocadas destruye tu capacidad de ser urgente. Y la urgencia es de lo que vive tu ley de promedios.

No se trata de despreciar a nadie. Se trata de que tu dia tiene un numero fijo de horas, y cada una que le regalas a un rojo se la quitas a un amarillo que si podia comprar.$t$, $t$QTQP: tiempo de calidad con gente de calidad$t$, $t$Q — QUALITY
T — TIME
Q — QUALITY
P — PEOPLE

Tiempo de calidad con gente de calidad.

La doctrina lo dice sin rodeos: perder tiempo y energía con las personas equivocadas destruye tu capacidad de ser urgente. Y la urgencia es de lo que vive tu ley de promedios.

No se trata de despreciar a nadie. Se trata de que tu día tiene un número fijo de horas, y cada una que le regalas a un rojo se la quitas a un amarillo que sí podía comprar.$t$),
  ($t$3.6$t$, 1, $t$Irse tambien es una habilidad$t$, $t$Nadie te ensena a irte. Te ensenan a entrar, a preguntar, a presentar, a cerrar. Pero irse a tiempo casi nunca se practica.

Y es de las cosas que mas dinero cuestan. El vendedor que se queda una hora convenciendo a alguien que nunca iba a comprar, no perdio una venta: perdio las tres que pudo haber visitado.

La doctrina es clara: sal de las luces rojas rapido y educadamente.$t$, $t$Irse también es una habilidad$t$, $t$Nadie te enseña a irte. Te enseñan a entrar, a preguntar, a presentar, a cerrar. Pero irse a tiempo casi nunca se practica.

Y es de las cosas que más dinero cuestan. El vendedor que se queda una hora convenciendo a alguien que nunca iba a comprar, no perdió una venta: perdió las tres que pudo haber visitado.

La doctrina es clara: sal de las luces rojas rápido y educadamente.$t$),
  ($t$3.6$t$, 2, $t$La luz roja no siempre es hostil$t$, $t$Es facil salirse de una conversacion con alguien grosero. El problema es el otro caso.

Hay clientes encantadores, platicadores, que te reciben con gusto y te dan una hora de su tiempo. Y no pueden comprar. Acaban de firmar contrato, no son ellos quienes deciden, o estan por cerrar el local.

La trampa no es el rechazo. Es lo agradable que se siente quedarse.$t$, $t$La luz roja no siempre es hostil$t$, $t$Es fácil salirse de una conversación con alguien grosero. El problema es el otro caso.

Hay clientes encantadores, platicadores, que te reciben con gusto y te dan una hora de su tiempo. Y no pueden comprar. Acaban de firmar contrato, no son ellos quienes deciden, o están por cerrar el local.

La trampa no es el rechazo. Es lo agradable que se siente quedarse.$t$),
  ($t$3.6$t$, 3, $t$Salir bien es dejar la puerta abierta$t$, $t$Rojo hoy no es rojo para siempre. El contrato se vence, el dueno regresa, el negocio se estabiliza.

Por eso la salida importa tanto como la entrada. El que insiste hasta incomodar quema la relacion y ya no lo reciben. El que reconoce la situacion y deja su numero con naturalidad, tiene la puerta abierta cuando cambien las cosas.

Reconoce, deja abierto, y muevete. Tu tiempo vale.$t$, $t$Salir bien es dejar la puerta abierta$t$, $t$Rojo hoy no es rojo para siempre. El contrato se vence, el dueño regresa, el negocio se estabiliza.

Por eso la salida importa tanto como la entrada. El que insiste hasta incomodar quema la relación y ya no lo reciben. El que reconoce la situación y deja su número con naturalidad, tiene la puerta abierta cuando cambien las cosas.

Reconoce, deja abierto, y muévete. Tu tiempo vale.$t$),
  ($t$3.7$t$, 1, $t$Hay dos juegos distintos$t$, $t$Todo lo que llevas aprendido sirve para un juego: convertir a un desconocido en cliente. Te ganas la entrada, te presentas, encuentras el dolor, presentas, cierras.

Pero hay un segundo juego que casi nadie sabe que es distinto: convertir a un cliente en un cliente mas grande.

Ya te conoce. Ya te compra. Ya confia en ti. Y aun asi, la mayor parte de lo que gasta al ano en lo que tu vendes, se lo compra a alguien mas.$t$, $t$Hay dos juegos distintos$t$, $t$Todo lo que llevas aprendido sirve para un juego: convertir a un desconocido en cliente. Te ganas la entrada, te presentas, encuentras el dolor, presentas, cierras.

Pero hay un segundo juego que casi nadie sabe que es distinto: convertir a un cliente en un cliente más grande.

Ya te conoce. Ya te compra. Ya confía en ti. Y aun así, la mayor parte de lo que gasta al año en lo que tú vendes, se lo compra a alguien más.$t$),
  ($t$3.7$t$, 2, $t$El enemigo: la visita que se vuelve tramite$t$, $t$El vendedor lleva tres anos visitando al mismo cliente. La relacion es buena, lo reciben con gusto. Y cada visita es igual: saluda, levanta el pedido de siempre, se despide.

No esta haciendo mal su trabajo. Esta buscando dolor en alguien que no tiene dolor, no encuentra nada, y hace lo unico que queda.

Y ahi esta el riesgo de verdad: al que solo toma pedidos lo reemplaza un mensaje de WhatsApp. Un vendedor que nada mas transcribe lo que el cliente ya iba a pedir no esta haciendo nada que un formulario no pueda hacer mas barato.$t$, $t$El enemigo: la visita que se vuelve trámite$t$, $t$El vendedor lleva tres años visitando al mismo cliente. La relación es buena, lo reciben con gusto. Y cada visita es igual: saluda, levanta el pedido de siempre, se despide.

No está haciendo mal su trabajo. Está buscando dolor en alguien que no tiene dolor, no encuentra nada, y hace lo único que queda.

Y ahí está el riesgo de verdad: al que solo toma pedidos lo reemplaza un mensaje de WhatsApp. Un vendedor que nada más transcribe lo que el cliente ya iba a pedir no está haciendo nada que un formulario no pueda hacer más barato.$t$),
  ($t$3.7$t$, 3, $t$Dolor y hueco: las dos oportunidades$t$, $t$DOLOR — algo anda mal con lo que ya te compra. Se le acaba entre visitas. Se le quedo parado. El precio le aprieta.

HUECO — algo que podria comprarte y no te compra. Una familia que maneja con otro proveedor. Una que no maneja nadie. Una que sus clientes le piden y el no tiene.

Son dos cosas distintas y se buscan distinto. Confundirlas es la razon por la que tantos vendedores visitan durante anos sin crecer una sola cuenta.$t$, $t$Dolor y hueco: las dos oportunidades$t$, $t$DOLOR — algo anda mal con lo que ya te compra. Se le acaba entre visitas. Se le quedó parado. El precio le aprieta.

HUECO — algo que podría comprarte y no te compra. Una familia que maneja con otro proveedor. Una que no maneja nadie. Una que sus clientes le piden y él no tiene.

Son dos cosas distintas y se buscan distinto. Confundirlas es la razón por la que tantos vendedores visitan durante años sin crecer una sola cuenta.$t$),
  ($t$3.7$t$, 4, $t$El hueco se ve, no se oye$t$, $t$El dolor tiene senal: el aunque. Bien... aunque a veces me quedo corto. Por eso lo encuentras preguntando por capas.

El hueco no tiene ninguna senal verbal. El cliente no te va a decir oiga, hay una familia que le compro a otro. Para el eso no es un tema: ya lo tiene resuelto.

Por eso la escalera de capas no sirve aqui. No hay nada que excavar. Hay algo que MIRAR.$t$, $t$El hueco se ve, no se oye$t$, $t$El dolor tiene señal: el aunque. Bien... aunque a veces me quedo corto. Por eso lo encuentras preguntando por capas.

El hueco no tiene ninguna señal verbal. El cliente no te va a decir oiga, hay una familia que le compro a otro. Para él eso no es un tema: ya lo tiene resuelto.

Por eso la escalera de capas no sirve aquí. No hay nada que excavar. Hay algo que MIRAR.$t$),
  ($t$3.7$t$, 5, $t$Las tres herramientas del hueco$t$, $t$1. LEE EL LUGAR. El mostrador te dice todo antes de preguntar. Un producto de otra marca es un espacio que podria ser tuyo. Un estante vacio es una familia que no maneja nadie.

2. PREGUNTA POR LO QUE LE PIDEN. Le ha tocado que le pidan algo que usted no maneje? Es demanda que ya existe sin oferta que la cubra: la venta mas facil que hay.

3. ANCLA EN NEGOCIOS COMO EL SUYO. Varios negocios como el suyo tambien mueven tal cosa, usted eso lo maneja? Es prueba social, y tiene que ser verdad.$t$, $t$Las tres herramientas del hueco$t$, $t$1. LEE EL LUGAR. El mostrador te dice todo antes de preguntar. Un producto de otra marca es un espacio que podría ser tuyo. Un estante vacío es una familia que no maneja nadie.

2. PREGUNTA POR LO QUE LE PIDEN. ¿Le ha tocado que le pidan algo que usted no maneje? Es demanda que ya existe sin oferta que la cubra: la venta más fácil que hay.

3. ANCLA EN NEGOCIOS COMO EL SUYO. Varios negocios como el suyo también mueven tal cosa, ¿usted eso lo maneja? Es prueba social, y tiene que ser verdad.$t$),
  ($t$3.7$t$, 6, $t$La linea que no se cruza$t$, $t$Un hueco tiene que ser REAL y verificable: lo viste, te lo dijo, o lo sabes por su giro.

Descubrir un hueco es senalar algo que ya existe. Fabricarlo es venderle un problema que no tiene.

Lo primero construye una relacion de anos. Lo segundo la termina el dia que el cliente se da cuenta — y con un cliente de cartera, ese dia siempre llega.$t$, $t$La línea que no se cruza$t$, $t$Un hueco tiene que ser REAL y verificable: lo viste, te lo dijo, o lo sabes por su giro.

Descubrir un hueco es señalar algo que ya existe. Fabricarlo es venderle un problema que no tiene.

Lo primero construye una relación de años. Lo segundo la termina el día que el cliente se da cuenta — y con un cliente de cartera, ese día siempre llega.$t$),
  ($t$3.7$t$, 7, $t$Y si no puedes ver el lugar$t$, $t$Cuando la visita es por telefono o por mensaje, la primera herramienta no existe: no hay mostrador que leer.

Ahi las otras dos cargan todo el trabajo. En lugar de observar el catalogo, lo preguntas: que familias maneja hoy ademas de lo que nos compra?

Misma mecanica, distinta entrada.$t$, $t$¿Y si no puedes ver el lugar?$t$, $t$Cuando la visita es por teléfono o por mensaje, la primera herramienta no existe: no hay mostrador que leer.

Ahí las otras dos cargan todo el trabajo. En lugar de observar el catálogo, lo preguntas: ¿qué familias maneja hoy además de lo que nos compra?

Misma mecánica, distinta entrada.$t$),
  ($t$3.8$t$, 1, $t$Lo que no esta, y lo que esta y no se mueve$t$, $t$Dos lecturas del mismo mostrador que llevan a conversaciones opuestas:

LO QUE NO ESTA es oportunidad. Un estante vacio, una familia que no maneja, una marca de la competencia ocupando un espacio que podria ser tuyo.

LO QUE ESTA Y NO SE MUEVE es problema. Producto empolvado, cantidades que llevan meses ahi.

Lo primero se trabaja como hueco. Lo segundo es dolor, y ese si se excava como aprendiste.$t$, $t$Lo que no está, y lo que está y no se mueve$t$, $t$Dos lecturas del mismo mostrador que llevan a conversaciones opuestas:

LO QUE NO ESTÁ es oportunidad. Un estante vacío, una familia que no maneja, una marca de la competencia ocupando un espacio que podría ser tuyo.

LO QUE ESTÁ Y NO SE MUEVE es problema. Producto empolvado, cantidades que llevan meses ahí.

Lo primero se trabaja como hueco. Lo segundo es dolor, y ese sí se excava como aprendiste.$t$),
  ($t$3.8$t$, 2, $t$Las tres preguntas que mapean$t$, $t$Que otras lineas maneja aparte de lo nuestro?
Y esas de quien las trae?
De lo que le llega a pedir la gente, hay algo que no maneje?

Tres preguntas, ningun problema, ningun dolor. Y al final sabes exactamente donde estan tus espacios.

Fijate que ninguna suena a venta: suenan a interes por su negocio. Por eso las contesta sin ponerse a la defensiva.$t$, $t$Las tres preguntas que mapean$t$, $t$¿Qué otras líneas maneja aparte de lo nuestro?
¿Y esas de quién las trae?
De lo que le llega a pedir la gente, ¿hay algo que no maneje?

Tres preguntas, ningún problema, ningún dolor. Y al final sabes exactamente dónde están tus espacios.

Fíjate que ninguna suena a venta: suenan a interés por su negocio. Por eso las contesta sin ponerse a la defensiva.$t$),
  ($t$3.8$t$, 3, $t$La ultima es la mas valiosa$t$, $t$De lo que le piden y no tiene: esa es la venta mas facil que vas a encontrar en tu vida.

No tienes que crear la necesidad ni convencer a nadie. La demanda ya existe, el cliente ya la esta perdiendo, y le molesta perderla.

Y casi ningun vendedor la pregunta, porque esta ocupado revisando lo que ya vende.$t$, $t$La última es la más valiosa$t$, $t$De lo que le piden y no tiene: esa es la venta más fácil que vas a encontrar en tu vida.

No tienes que crear la necesidad ni convencer a nadie. La demanda ya existe, el cliente ya la está perdiendo, y le molesta perderla.

Y casi ningún vendedor la pregunta, porque está ocupado revisando lo que ya vende.$t$),
  ($t$3.9$t$, 1, $t$Este cliente te va a dar el pedido$t$, $t$Y con gusto. Sin que se lo pidas.

Esa es la trampa: la visita va a salir bien hagas lo que hagas. Vas a tener tu pedido, el cliente va a quedar contento, y te vas a ir sintiendo que hiciste tu trabajo.

Levanta el pedido. Es lo minimo. Pero no te vayas ahi.$t$, $t$Este cliente te va a dar el pedido$t$, $t$Y con gusto. Sin que se lo pidas.

Esa es la trampa: la visita va a salir bien hagas lo que hagas. Vas a tener tu pedido, el cliente va a quedar contento, y te vas a ir sintiendo que hiciste tu trabajo.

Levanta el pedido. Es lo mínimo. Pero no te vayas ahí.$t$),
  ($t$3.9$t$, 2, $t$Las tres herramientas, en orden$t$, $t$1. MAPEA — que otras lineas maneja aparte de lo tuyo, y de quien las trae.

2. PREGUNTA POR LO QUE LE PIDEN — hay algo que le pidan y no tenga? Esa es demanda que ya existe.

3. ANCLA EN SIMILARES — varios negocios como el suyo tambien mueven tal cosa. Usted eso lo maneja?

Tres preguntas. Dos minutos. Y sales sabiendo donde estan tus espacios.$t$, $t$Las tres herramientas, en orden$t$, $t$1. MAPEA — qué otras líneas maneja aparte de lo tuyo, y de quién las trae.

2. PREGUNTA POR LO QUE LE PIDEN — ¿hay algo que le pidan y no tenga? Esa es demanda que ya existe.

3. ANCLA EN SIMILARES — varios negocios como el suyo también mueven tal cosa. ¿Usted eso lo maneja?

Tres preguntas. Dos minutos. Y sales sabiendo dónde están tus espacios.$t$),
  ($t$3.9$t$, 3, $t$Aqui no te va a castigar nadie$t$, $t$En los otros ejercicios, cuando lo haces mal, el cliente se cierra, te despacha o se enfria. La conversacion te avisa.

Aqui no. Si solo levantas el pedido y te vas, el cliente queda contento y la visita fue un exito.

Por eso este error dura anos sin que nadie lo note: no duele. Simplemente nunca creces la cuenta, y nunca sabes por que.$t$, $t$Aquí no te va a castigar nadie$t$, $t$En los otros ejercicios, cuando lo haces mal, el cliente se cierra, te despacha o se enfría. La conversación te avisa.

Aquí no. Si solo levantas el pedido y te vas, el cliente queda contento y la visita fue un éxito.

Por eso este error dura años sin que nadie lo note: no duele. Simplemente nunca creces la cuenta, y nunca sabes por qué.$t$),
  ($t$4.4$t$, 5, $t$Gradualmente, no de golpe$t$, $t$La tentacion es subir el impulso lo mas rapido posible. Y es contraproducente.

Un cliente al que le echas encima todo el entusiasmo, todos los datos y toda la urgencia en dos minutos no se emociona: se abruma. Y un cliente abrumado se defiende.

La curva se construye por escalones. Cada cosa que dices sube un poco, dejas que asiente, y subes otro. Por eso los siguientes nodos entrenan un factor a la vez: en la calle se combinan, pero primero hay que saber usarlos por separado.$t$, $t$Gradualmente, no de golpe$t$, $t$La tentación es subir el impulso lo más rápido posible. Y es contraproducente.

Un cliente al que le echas encima todo el entusiasmo, todos los datos y toda la urgencia en dos minutos no se emociona: se abruma. Y un cliente abrumado se defiende.

La curva se construye por escalones. Cada cosa que dices sube un poco, dejas que asiente, y subes otro. Por eso los siguientes nodos entrenan un factor a la vez: en la calle se combinan, pero primero hay que saber usarlos por separado.$t$),
  ($t$3.10$t$, 1, $t$El cuarto Boss.$t$, $t$Un cliente analítico, apurado y desconfiado — le han hecho perder el tiempo antes. Trae un dolor real en el negocio, pero no se lo cuenta a cualquiera.

Tu misión: la conversación completa. Abrir. Presentarte. Atravesar el "no" que va a caer. Leer su prisa. Y excavar — capa por capa, pista por pista — hasta que el dolor salga completo. Cuando salga, apréndetelo con sus palabras: lo vas a usar después.

Y recuerda la regla del doctor: hoy NO se receta. Solo se diagnostica.$t$, $t$Reto final del Mundo 3.$t$, $t$Un cliente analítico, apurado y desconfiado — le han hecho perder el tiempo antes. Trae un dolor real en el negocio, pero no se lo cuenta a cualquiera.

Tu misión: la conversación completa. Abrir. Presentarte. Atravesar el "no" que va a caer. Leer su prisa. Y excavar — capa por capa, pista por pista — hasta que el dolor salga completo. Cuando salga, apréndetelo con sus palabras: lo vas a usar después.

Y recuerda la regla del doctor: hoy NO se receta. Solo se diagnostica.$t$),
  ($t$4.16$t$, 1, $t$El cuarto Boss.$t$, $t$Este cliente ya escuchó todas las promesas. Vendedores que juraban no fallar nunca — y fallaron. Su escudo: "eso mismo me dijo el anterior."

Tu misión: el ciclo completo. Excava su dolor. Gánatelo como persona. Y presenta con valor REAL — su problema, sus palabras, su negocio en la escena, síes que le nazcan solos. Ni una promesa grandilocuente: con los desconfiados, la promesa grande es veneno y el detalle concreto es oro.

Ganas cuando el desconfiado te pida los detalles del siguiente paso. Ahí sabrás que el valor pesó más que la cicatriz.$t$, $t$Reto final del Mundo 4.$t$, $t$Este cliente ya escuchó todas las promesas. Vendedores que juraban no fallar nunca — y fallaron. Su escudo: "eso mismo me dijo el anterior."

Tu misión: el ciclo completo. Excava su dolor. Gánatelo como persona. Y presenta con valor REAL — su problema, sus palabras, su negocio en la escena, síes que le nazcan solos. Ni una promesa grandilocuente: con los desconfiados, la promesa grande es veneno y el detalle concreto es oro.

Ganas cuando el desconfiado te pida los detalles del siguiente paso. Ahí sabrás que el valor pesó más que la cicatriz.$t$),
  ($t$5.15$t$, 1, $t$El quinto Boss.$t$, $t$A este señor le prometieron y le fallaron — varias veces. Su escudo tiene años de grosor y una frase grabada: "eso mismo me dijo el anterior."

Te espera todo: un bloqueo en la puerta, un dolor que él mismo minimiza ("así es esto, todos fallan igual"), y la cadena final con la objeción más personal del campo: "¿y por qué le voy a creer a USTED?"

Cada bala tuya va a pasar por su lupa. Cada promesa sin ancla lo cierra un poco más. Y si lo logras, su rendición será a su manera: "le tomo la palabra — y lo apunto." No pelees su condición de prueba: hónrala. Ese pedido chico por escrito ES tu victoria — la confianza del desconfiado no se gana en una visita. Se gana cumpliéndole.$t$, $t$Reto final del Mundo 5.$t$, $t$A este señor le prometieron y le fallaron — varias veces. Su escudo tiene años de grosor y una frase grabada: "eso mismo me dijo el anterior."

Te espera todo: un bloqueo en la puerta, un dolor que él mismo minimiza ("así es esto, todos fallan igual"), y la cadena final con la objeción más personal del campo: "¿y por qué le voy a creer a USTED?"

Cada bala tuya va a pasar por su lupa. Cada promesa sin ancla lo cierra un poco más. Y si lo logras, su rendición será a su manera: "le tomo la palabra — y lo apunto." No pelees su condición de prueba: hónrala. Ese pedido chico por escrito ES tu victoria — la confianza del desconfiado no se gana en una visita. Se gana cumpliéndole.$t$),
  ($t$6.4$t$, 1, $t$El sexto Boss.$t$, $t$La venta ya está hecha: un administrador formal acaba de aprobar tu pedido. Y ahí empieza tu examen, porque a este señor todos sus proveedores le han fallado en los DETALLES: entregas tarde, cobros distintos, nadie que dé la cara.

Tu misión NO es vender: de hecho, vender algo más aquí es reprobar. Es sellar: cada término con hora y número, y cuando te pregunte qué pasa si algo falla, la respuesta con nombre y teléfono. Su cicatriz se sana con compromisos que se puedan cobrar. Relación sí, pero a su manera: formal, ganada, sin confiancitas.

Ganas cuando él repita tu trato de memoria... y le hable de ti al negocio de su hermano. Así se fabrica un aliado.$t$, $t$Reto final del Mundo 6.$t$, $t$La venta ya está hecha: un administrador formal acaba de aprobar tu pedido. Y ahí empieza tu examen, porque a este señor todos sus proveedores le han fallado en los DETALLES: entregas tarde, cobros distintos, nadie que dé la cara.

Tu misión NO es vender: de hecho, vender algo más aquí es reprobar. Es sellar: cada término con hora y número, y cuando te pregunte qué pasa si algo falla, la respuesta con nombre y teléfono. Su cicatriz se sana con compromisos que se puedan cobrar. Relación sí, pero a su manera: formal, ganada, sin confiancitas.

Ganas cuando él repita tu trato de memoria... y le hable de ti al negocio de su hermano. Así se fabrica un aliado.$t$)
) AS v(node_id, card_order, titulo_viejo, cuerpo_viejo, titulo, cuerpo)
WHERE c.node_id = v.node_id AND c.card_order = v.card_order AND c.title = v.titulo_viejo AND c.body = v.cuerpo_viejo;

UPDATE public.node_quiz_questions SET question_text = $t$El cliente le dice al vendedor: "cuénteme, ¿qué me trae?" El vendedor responde arrancando su presentación completa de producto. ¿Qué hizo mal?$t$, option_a = $t$Nada — el cliente le pidió la presentación.$t$, option_b = $t$Recetó sin diagnosticar: aceptó la invitación a presentar sin saber todavía qué le duele a ese negocio.$t$, option_c = $t$Debió negarse a responder la pregunta.$t$, explanation_correct = $t$Esa invitación es una trampa dulce. El Closer responde con jiu-jitsu: "Con gusto — pero primero cuénteme un poco de su negocio para no hacerle perder tiempo con cosas que no le sirvan. ¿Qué es lo que más se le mueve?" Diagnóstico primero, siempre.$t$, explanation_wrong = $t$La invitación del cliente no cambia el orden del sistema. Presentar sin diagnosticar produce una presentación genérica — y las genéricas no venden. Lo correcto: agradecer la apertura y voltear a preguntar primero. El cliente lo respeta más, no menos.$t$
WHERE node_id = '3.0' AND question_order = 1 AND question_text = $t$El cliente le dice al vendedor: "cuenteme, que me trae?" El vendedor responde arrancando su presentacion completa de producto. Que hizo mal?$t$ AND option_a = $t$Nada — el cliente le pidio la presentacion.$t$ AND option_b = $t$Receto sin diagnosticar: acepto la invitacion a presentar sin saber todavia que le duele a ese negocio.$t$ AND option_c = $t$Debio negarse a responder la pregunta.$t$ AND explanation_correct = $t$Esa invitacion es una trampa dulce. El Closer responde con jiu-jitsu: "Con gusto — pero primero cuenteme un poco de su negocio para no hacerle perder tiempo con cosas que no le sirvan. Que es lo que mas se le mueve?" Diagnostico primero, siempre.$t$ AND explanation_wrong = $t$La invitacion del cliente no cambia el orden del sistema. Presentar sin diagnosticar produce una presentacion generica — y las genericas no venden. Lo correcto: agradecer la apertura y voltear a preguntar primero. El cliente lo respeta mas, no menos.$t$;

UPDATE public.node_quiz_questions SET question_text = $t$¿Cuál es la diferencia central entre el vendedor promedio y el Doctor Vendedor?$t$, option_a = $t$El promedio busca dónde encajar su producto; el doctor primero entiende el negocio y luego conecta.$t$, option_b = $t$El doctor tiene más labia y carisma.$t$, explanation_correct = $t$Exacto. Uno llega con la receta escrita buscando paciente. El otro examina primero — y su receta, cuando llega, cae en tierra preparada. Por eso el que pregunta vende más que el que habla.$t$, explanation_wrong = $t$No es carisma ni horas — es el ORDEN. El promedio receta primero (su producto favorito buscando dónde caber). El doctor examina primero y receta después. Ese orden invertido es toda la diferencia en conversión.$t$
WHERE node_id = '3.0' AND question_order = 2 AND question_text = $t$Cual es la diferencia central entre el vendedor promedio y el Doctor Vendedor?$t$ AND option_a = $t$El promedio busca donde encajar su producto; el doctor primero entiende el negocio y luego conecta.$t$ AND option_b = $t$El doctor tiene mas labia y carisma.$t$ AND explanation_correct = $t$Exacto. Uno llega con la receta escrita buscando paciente. El otro examina primero — y su receta, cuando llega, cae en tierra preparada. Por eso el que pregunta vende mas que el que habla.$t$ AND explanation_wrong = $t$No es carisma ni horas — es el ORDEN. El promedio receta primero (su producto favorito buscando donde caber). El doctor examina primero y receta despues. Ese orden invertido es toda la diferencia en conversion.$t$;

UPDATE public.node_quiz_questions SET question_text = $t$Le preguntas al cliente qué tal le cumple su proveedor y responde, genuino y sin dudar: "excelente, la verdad cero quejas." ¿Qué hace el investigador?$t$, option_a = $t$Insistir en el proveedor con más preguntas hasta encontrar algo.$t$, option_b = $t$Cambiar de territorio: ese salió limpio — ahora explora producto o precio.$t$, explanation_correct = $t$Eso es el barrido. Un positivo limpio y genuino significa que el dolor no vive en ese territorio — no que no exista. Los otros dos territorios siguen sin examinar: ¿qué líneas le faltan?, ¿a cuánto está comprando? El mapa tiene tres zonas por algo.$t$, explanation_wrong = $t$Insistir en un territorio limpio te vuelve interrogador y quema la conversación; rendirte regala la visita. El dolor casi siempre existe — solo que vive en OTRO territorio. Positivo limpio = cambia de zona y sigue examinando.$t$
WHERE node_id = '3.0' AND question_order = 3 AND question_text = $t$Le preguntas al cliente que tal le cumple su proveedor y responde, genuino y sin dudar: "excelente, la verdad cero quejas." Que hace el investigador?$t$ AND option_a = $t$Insistir en el proveedor con mas preguntas hasta encontrar algo.$t$ AND option_b = $t$Cambiar de territorio: ese salio limpio — ahora explora producto o precio.$t$ AND explanation_correct = $t$Eso es el barrido. Un positivo limpio y genuino significa que el dolor no vive en ese territorio — no que no exista. Los otros dos territorios siguen sin examinar: que lineas le faltan? a cuanto esta comprando? El mapa tiene tres zonas por algo.$t$ AND explanation_wrong = $t$Insistir en un territorio limpio te vuelve interrogador y quema la conversacion; rendirte regala la visita. El dolor casi siempre existe — solo que vive en OTRO territorio. Positivo limpio = cambia de zona y sigue examinando.$t$;

UPDATE public.node_quiz_questions SET question_text = $t$¿Por qué el cliente baja la guardia cuando le preguntas de verdad por su negocio?$t$, option_b = $t$Porque los vendedores que él conoce hablan — el que pregunta y escucha no encaja en su alarma anti-vendedor.$t$, explanation_correct = $t$Su alarma está calibrada para el vendedor que llega hablando de su producto. El que pregunta con interés genuino por SU negocio rompe el patrón — y el cerebro del cliente lo reclasifica: de amenaza a conversación.$t$, explanation_wrong = $t$No es distracción ni confusión — es reclasificación. Su alarma anti-vendedor espera un monólogo de producto. Cuando en lugar de eso recibe interés genuino por su negocio, el patrón no coincide y la guardia baja. Preguntar es la forma más rápida de dejar de parecer vendedor.$t$
WHERE node_id = '3.0' AND question_order = 4 AND question_text = $t$Por que el cliente baja la guardia cuando le preguntas de verdad por su negocio?$t$ AND option_b = $t$Porque los vendedores que el conoce hablan — el que pregunta y escucha no encaja en su alarma anti-vendedor.$t$ AND explanation_correct = $t$Su alarma esta calibrada para el vendedor que llega hablando de su producto. El que pregunta con interes genuino por SU negocio rompe el patron — y el cerebro del cliente lo reclasifica: de amenaza a conversacion.$t$ AND explanation_wrong = $t$No es distraccion ni confusion — es reclasificacion. Su alarma anti-vendedor espera un monologo de producto. Cuando en lugar de eso recibe interes genuino por su negocio, el patron no coincide y la guardia baja. Preguntar es la forma mas rapida de dejar de parecer vendedor.$t$;

DO $chk$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.worlds AS w JOIN (VALUES
    (1, $t$Aquí no vendes nada. Aquí te ganas el derecho a seguir hablando.$t$),
    (2, $t$El cliente ya te puso atención. Ahora necesita saber con quién está hablando.$t$),
    (3, $t$Deja de recetar y empieza a diagnosticar. Aquí aprendes qué preguntar y cómo llegar al fondo.$t$),
    (4, $t$Ya sabes qué le duele. Aquí aprendes a construir valor, subir el impulso y presentar el precio.$t$),
    (5, $t$Presentar sin cerrar es contar un cuento. Aquí aprendes a pedir la decisión y a atravesar lo que se atraviese.$t$),
    (6, $t$Ya dijo que sí. Lo que hagas ahora decide si esa venta se queda y si hay una siguiente.$t$),
    (7, $t$Todo el sistema, sin ayudas. Aquí se sella tu certificación.$t$)
  ) AS v(id, nuevo) ON w.id = v.id AND w.description = v.nuevo;
  IF n <> 7 THEN RAISE EXCEPTION 'Mensaje 148: solo % de los 7 lemas quedaron (¿alguno estaba distinto?)', n; END IF;
  SELECT count(*) INTO n FROM public.node_cards AS c JOIN (VALUES
    ($t$3.0$t$, 1, $t$Imagina esta consulta.$t$, $t$Entras al consultorio. El doctor, sin preguntarte nada, sin revisarte, te dice: "Tómese estas pastillas, son buenísimas, a todos mis pacientes les funcionan."

¿Le crees? ¿Te las tomas?

Eso EXACTO siente un cliente cuando le presentas el producto sin haberle preguntado nada.$t$),
    ($t$3.0$t$, 2, $t$El diagnóstico es lo que te separa.$t$, $t$El vendedor promedio llega a recetar: trae su producto favorito en la mente y busca dónde encajarlo.

El Closer llega a diagnosticar: pregunta, escucha, entiende el negocio — y SOLO entonces conecta lo que vende con lo que descubrió.

La ironía: el que diagnostica vende más que el que receta. Porque la gente no compra productos — compra soluciones a SUS problemas.$t$),
    ($t$3.0$t$, 3, $t$El mapa del dolor: los 3 Territorios$t$, $t$Un doctor no examina al azar: sabe dónde buscar. Tú también. TODO dolor comercial de un cliente vive en uno de tres territorios:

PRODUCTO — lo que vende o usa: faltantes de su estrella, líneas que no rotan, marcas que le piden y no consigue.

SERVICIO — cómo lo trata su proveedor: entregas que no llegan, plantones, nadie que dé la cara.

PRECIO — lo que paga y lo que gana: margen apretado, subidas sin aviso, dinero congelado parado.

Ya no preguntas al azar. Preguntas con mapa.$t$),
    ($t$3.0$t$, 4, $t$El mismo territorio se pregunta distinto$t$, $t$Los tres territorios son siempre los mismos. Lo que cambia es CÓMO preguntas, según a quién le estás vendiendo.

SI TU CLIENTE REVENDE lo que le compras: le preguntas por lo que más maneja, por lo que sus clientes le piden y no tiene, por lo que se le queda parado.

SI TU CLIENTE CONSUME lo que le vendes: no le preguntes qué vende, porque no vende nada. Pregúntale qué USA, cuántas unidades maneja, cada cuánto repone, cuánto le dura.

SI TU CLIENTE DISTRIBUYE: le preguntas por sus líneas, por a cuántos surte, por la zona que cubre.

Mismo mapa, tres traducciones. Preguntarle a un consumidor qué maneja más es la manera más rápida de que se dé cuenta de que no entendiste su negocio.$t$),
    ($t$3.0$t$, 5, $t$Por qué preguntar vende más que hablar$t$, $t$Cuando preguntas de verdad, pasan tres cosas a tu favor:

El cliente se siente escuchado — y baja la guardia que le pone a los vendedores. Te da la munición exacta — te dice literalmente qué le duele y qué necesita. Y tu presentación deja de ser genérica — cada palabra que digas después va a estar conectada con lo que ÉL te contó.

Preguntar no retrasa la venta. La construye.$t$),
    ($t$3.0$t$, 6, $t$La regla del investigador$t$, $t$El dolor NUNCA se pregunta directo. "¿Qué problemas tiene?" produce un "ninguno, todo bien" — garantizado.

El dolor se deja emerger: preguntas por los hechos de un territorio, subes a la experiencia, y esperas el flaqueo — el "aunque...", el "a veces...", el "lo único es que...".

Y cuando el dolor sale, apréndetelo con SUS palabras. Se lo puedes repetir en ese momento, o quedarte callado y seguir. Lo importante es no olvidarlo: lo vas a usar en la presentación.$t$),
    ($t$3.0$t$, 7, $t$Tu nuevo orden mental$t$, $t$De este mundo en adelante, tu regla es la del doctor: primero el examen, luego la receta.

Ya te ganaste el derecho de hacer preguntas de negocio — abriste bien, te presentaste bien. Ahora sí: recorre los territorios, escucha, profundiza. La presentación puede esperar. El diagnóstico, no.$t$),
    ($t$3.2$t$, 1, $t$El dolor real nunca está en la superficie.$t$, $t$Pregúntale a cualquier cliente "¿cómo va el negocio?" y te dirá "bien, gracias a Dios."

¿Es cierto? Más o menos. Todo negocio trae algo que le duele — y ya sabes dónde buscarlo: en el PRODUCTO, en el SERVICIO o en el PRECIO. Pero eso no se cuenta al primer desconocido que pregunta. Se cuenta a quien se gana la respuesta... pelando capas.$t$),
    ($t$3.2$t$, 2, $t$Las tres capas$t$, $t$CAPA 1 — Hechos: fáciles de responder, cero riesgo. "¿Qué maneja más?" "¿Quién lo surte?" "¿A cómo le llega?" Abren la plática y te dan el mapa de sus territorios.

CAPA 2 — La puerta al dolor: aquí el cliente puede soltar una PISTA... o cerrarte la puerta con un "bien". Todo depende de CÓMO preguntes.

CAPA 3 — El dolor completo: solo se abre si recoges la pista y profundizas con preguntas abiertas. Aquí te cuenta lo que de verdad le duele, con detalle y con emoción.$t$),
    ($t$3.2$t$, 3, $t$Cuidado con el "bien" automático.$t$, $t$"¿Y qué tal le va con su proveedor?" — "Bien, no me quejo."

Esa respuesta no es información: es un reflejo. Nadie le cuenta sus problemas a un desconocido que pregunta en genérico, por dos razones: la respuesta cortés ya la trae cargada, y admitir un problema se siente como quejarse o como aceptar que eligió mal.

La pregunta genérica no falla por mala suerte. Falla siempre. Y el vendedor promedio la escucha, piensa "aquí no hay nada" y se va con las manos vacías.$t$),
    ($t$3.2$t$, 4, $t$La pregunta que no se puede contestar con "bien"$t$, $t$La solución es simple: cambia la opinión general por algo CONCRETO.

En vez de "¿qué tal le va con su proveedor?" -> "¿le ha tocado quedarse sin su producto estrella?"
En vez de "¿qué tal anda el precio?" -> "¿cuánto le subieron este año?"
En vez de "¿todo bien por acá?" -> "¿cuántas veces al mes le llega incompleto el pedido?"

Ya no puede disparar el reflejo: tiene que ir a buscar un dato real de su negocio. Eso es todo — no es una técnica complicada, es dejar de preguntar en general.

Más adelante vas a aprender una versión aún más potente: darle permiso de admitirlo contándole que a otros les pasa. Por ahora, con preguntar concreto ya cambias el juego.$t$),
    ($t$3.2$t$, 5, $t$Y aun así te va a decir que no sabe$t$, $t$Preguntaste concreto y el cliente contesta pues no sé, o se queda pensando y suelta cualquier cosa.

No es que no quiera. Es que una pregunta abierta lo obliga a construir la respuesta desde cero, y eso cuesta trabajo. Como no le urge ayudarte, contesta lo más corto que puede.

La solución es darle de dónde agarrarse.$t$),
    ($t$3.2$t$, 6, $t$Suggestive Language: sugiere opciones$t$, $t$Después de preguntar, avienta tres o cuatro opciones.

¿Qué familias son las que más se te mueven? ¿Anticongelantes? ¿Aceite de motor? ¿Diésel? ¿Moto?

¿A cómo compras el líquido de frenos? ¿70? ¿80? ¿90?

Y aquí está lo bueno: o elige una de tus opciones, o te CORRIGE con el dato real — no, más bien 95.

Esa corrección es justo la información que buscabas, y la pregunta abierta nunca te la habría dado.$t$),
    ($t$3.2$t$, 7, $t$La palabra mágica: "aunque..."$t$, $t$Cuando tu pregunta abre la puerta, escucha con lupa los peros y los aunques: "bien, aunque a veces batalla uno", "sin queja, lo único es que...".

Eso NO es relleno — es el cliente asomando el dolor para ver si te interesa. Si lo dejas pasar, la puerta se cierra y no se vuelve a abrir. Si lo recoges con una pregunta ABIERTA ("¿como cuánto le dura ese batallar?"), la capa 3 se abre sola.

Concreta para abrir. Abierta para excavar. Ese es el orden, y no se invierte.$t$),
    ($t$3.2$t$, 8, $t$¿Y si de verdad no hay nada ahí? El barrido.$t$, $t$A veces preguntas concreto y el cliente lo niega limpio: "no, eso sí no, mi proveedor me cumple bien." Y es verdad.

Ahí el vendedor promedio hace una de dos: insiste hasta volverse pesado, o se rinde. El investigador hace la tercera: le CREE, y CAMBIA DE TERRITORIO. ¿Servicio salió sano? Explora producto: "¿y hay algo que sus clientes le pidan y batalle para conseguir?" O precio: "¿y a cómo le está llegando su estrella?"

El dolor casi siempre existe. Solo que vive en OTRA zona del mapa. Negación limpia = siguiente territorio.$t$),
    ($t$3.3$t$, 1, $t$El cliente te está regalando oro. ¿Lo estás viendo?$t$, $t$"Aquí lo que más jala es esa línea, sobre todo desde que mi hijo le entró al negocio."

El vendedor con guion escucha: la línea que más jala — dato para su lista.

El Closer escucha: MI HIJO le entró al negocio — la historia completa del lugar, regalada de pasada.

Cada respuesta trae un regalo que nadie pidió. La diferencia está en quién lo recoge.$t$),
    ($t$3.3$t$, 2, $t$La regla: tu siguiente frase nace de la suya.$t$, $t$Escucha la respuesta completa. Encuentra el regalo, que es el dato que no pediste. Y pregunta sobre ÉL, usando las palabras del cliente.

"¿Su hijo también anda metido aquí? ¿Y él fue el de la idea?"

Fíjate en lo que NO hiciste: no sacaste tu siguiente pregunta de la lista. La conversación va por donde él la abrió, y por eso se siente conversación y no interrogatorio.$t$),
    ($t$3.4$t$, 1, $t$Un cuestionario no abre a nadie$t$, $t$Ya sabes preguntar por capas y ya sabes recorrer los tres territorios. Y aun así te pueden contestar puros datos secos.

Porque hay una diferencia enorme entre alguien que te contesta y alguien que se te abre. Los datos te los da cualquiera. El dolor solo te lo cuenta quien confía en ti.

El cuestionario perfecto, hecho por un desconocido, no llega al fondo nunca.$t$),
    ($t$3.4$t$, 2, $t$Intercala, no separes$t$, $t$El error natural es hacer dos bloques: primero las preguntas de negocio y al final, si sobra tiempo, algo personal.

No funciona así. Se intercala.

Preguntas de un territorio. Recoges algo personal que te suelta. Le entras un momento. Y regresas al siguiente territorio. La conversación se siente humana de principio a fin, y las respuestas se vuelven más hondas conforme avanza.$t$),
    ($t$3.4$t$, 3, $t$Aquí es donde más fácil se hace$t$, $t$En este paso el CPR casi se hace solo, y por eso es el mejor lugar para practicarlo.

Estas preguntando por su negocio: cuánto lleva, cómo empezó, quién le ayuda. Todo eso ya es territorio personal. Solo tienes que reconocer cuando el cliente te abre una puerta, y entrar.

Y aquí vale doble: no solo construye relación. Es lo que hace que te contesten la siguiente pregunta de verdad.$t$),
    ($t$3.5$t$, 5, $t$QTQP: tiempo de calidad con gente de calidad$t$, $t$Q — QUALITY
T — TIME
Q — QUALITY
P — PEOPLE

Tiempo de calidad con gente de calidad.

La doctrina lo dice sin rodeos: perder tiempo y energía con las personas equivocadas destruye tu capacidad de ser urgente. Y la urgencia es de lo que vive tu ley de promedios.

No se trata de despreciar a nadie. Se trata de que tu día tiene un número fijo de horas, y cada una que le regalas a un rojo se la quitas a un amarillo que sí podía comprar.$t$),
    ($t$3.6$t$, 1, $t$Irse también es una habilidad$t$, $t$Nadie te enseña a irte. Te enseñan a entrar, a preguntar, a presentar, a cerrar. Pero irse a tiempo casi nunca se practica.

Y es de las cosas que más dinero cuestan. El vendedor que se queda una hora convenciendo a alguien que nunca iba a comprar, no perdió una venta: perdió las tres que pudo haber visitado.

La doctrina es clara: sal de las luces rojas rápido y educadamente.$t$),
    ($t$3.6$t$, 2, $t$La luz roja no siempre es hostil$t$, $t$Es fácil salirse de una conversación con alguien grosero. El problema es el otro caso.

Hay clientes encantadores, platicadores, que te reciben con gusto y te dan una hora de su tiempo. Y no pueden comprar. Acaban de firmar contrato, no son ellos quienes deciden, o están por cerrar el local.

La trampa no es el rechazo. Es lo agradable que se siente quedarse.$t$),
    ($t$3.6$t$, 3, $t$Salir bien es dejar la puerta abierta$t$, $t$Rojo hoy no es rojo para siempre. El contrato se vence, el dueño regresa, el negocio se estabiliza.

Por eso la salida importa tanto como la entrada. El que insiste hasta incomodar quema la relación y ya no lo reciben. El que reconoce la situación y deja su número con naturalidad, tiene la puerta abierta cuando cambien las cosas.

Reconoce, deja abierto, y muévete. Tu tiempo vale.$t$),
    ($t$3.7$t$, 1, $t$Hay dos juegos distintos$t$, $t$Todo lo que llevas aprendido sirve para un juego: convertir a un desconocido en cliente. Te ganas la entrada, te presentas, encuentras el dolor, presentas, cierras.

Pero hay un segundo juego que casi nadie sabe que es distinto: convertir a un cliente en un cliente más grande.

Ya te conoce. Ya te compra. Ya confía en ti. Y aun así, la mayor parte de lo que gasta al año en lo que tú vendes, se lo compra a alguien más.$t$),
    ($t$3.7$t$, 2, $t$El enemigo: la visita que se vuelve trámite$t$, $t$El vendedor lleva tres años visitando al mismo cliente. La relación es buena, lo reciben con gusto. Y cada visita es igual: saluda, levanta el pedido de siempre, se despide.

No está haciendo mal su trabajo. Está buscando dolor en alguien que no tiene dolor, no encuentra nada, y hace lo único que queda.

Y ahí está el riesgo de verdad: al que solo toma pedidos lo reemplaza un mensaje de WhatsApp. Un vendedor que nada más transcribe lo que el cliente ya iba a pedir no está haciendo nada que un formulario no pueda hacer más barato.$t$),
    ($t$3.7$t$, 3, $t$Dolor y hueco: las dos oportunidades$t$, $t$DOLOR — algo anda mal con lo que ya te compra. Se le acaba entre visitas. Se le quedó parado. El precio le aprieta.

HUECO — algo que podría comprarte y no te compra. Una familia que maneja con otro proveedor. Una que no maneja nadie. Una que sus clientes le piden y él no tiene.

Son dos cosas distintas y se buscan distinto. Confundirlas es la razón por la que tantos vendedores visitan durante años sin crecer una sola cuenta.$t$),
    ($t$3.7$t$, 4, $t$El hueco se ve, no se oye$t$, $t$El dolor tiene señal: el aunque. Bien... aunque a veces me quedo corto. Por eso lo encuentras preguntando por capas.

El hueco no tiene ninguna señal verbal. El cliente no te va a decir oiga, hay una familia que le compro a otro. Para él eso no es un tema: ya lo tiene resuelto.

Por eso la escalera de capas no sirve aquí. No hay nada que excavar. Hay algo que MIRAR.$t$),
    ($t$3.7$t$, 5, $t$Las tres herramientas del hueco$t$, $t$1. LEE EL LUGAR. El mostrador te dice todo antes de preguntar. Un producto de otra marca es un espacio que podría ser tuyo. Un estante vacío es una familia que no maneja nadie.

2. PREGUNTA POR LO QUE LE PIDEN. ¿Le ha tocado que le pidan algo que usted no maneje? Es demanda que ya existe sin oferta que la cubra: la venta más fácil que hay.

3. ANCLA EN NEGOCIOS COMO EL SUYO. Varios negocios como el suyo también mueven tal cosa, ¿usted eso lo maneja? Es prueba social, y tiene que ser verdad.$t$),
    ($t$3.7$t$, 6, $t$La línea que no se cruza$t$, $t$Un hueco tiene que ser REAL y verificable: lo viste, te lo dijo, o lo sabes por su giro.

Descubrir un hueco es señalar algo que ya existe. Fabricarlo es venderle un problema que no tiene.

Lo primero construye una relación de años. Lo segundo la termina el día que el cliente se da cuenta — y con un cliente de cartera, ese día siempre llega.$t$),
    ($t$3.7$t$, 7, $t$¿Y si no puedes ver el lugar?$t$, $t$Cuando la visita es por teléfono o por mensaje, la primera herramienta no existe: no hay mostrador que leer.

Ahí las otras dos cargan todo el trabajo. En lugar de observar el catálogo, lo preguntas: ¿qué familias maneja hoy además de lo que nos compra?

Misma mecánica, distinta entrada.$t$),
    ($t$3.8$t$, 1, $t$Lo que no está, y lo que está y no se mueve$t$, $t$Dos lecturas del mismo mostrador que llevan a conversaciones opuestas:

LO QUE NO ESTÁ es oportunidad. Un estante vacío, una familia que no maneja, una marca de la competencia ocupando un espacio que podría ser tuyo.

LO QUE ESTÁ Y NO SE MUEVE es problema. Producto empolvado, cantidades que llevan meses ahí.

Lo primero se trabaja como hueco. Lo segundo es dolor, y ese sí se excava como aprendiste.$t$),
    ($t$3.8$t$, 2, $t$Las tres preguntas que mapean$t$, $t$¿Qué otras líneas maneja aparte de lo nuestro?
¿Y esas de quién las trae?
De lo que le llega a pedir la gente, ¿hay algo que no maneje?

Tres preguntas, ningún problema, ningún dolor. Y al final sabes exactamente dónde están tus espacios.

Fíjate que ninguna suena a venta: suenan a interés por su negocio. Por eso las contesta sin ponerse a la defensiva.$t$),
    ($t$3.8$t$, 3, $t$La última es la más valiosa$t$, $t$De lo que le piden y no tiene: esa es la venta más fácil que vas a encontrar en tu vida.

No tienes que crear la necesidad ni convencer a nadie. La demanda ya existe, el cliente ya la está perdiendo, y le molesta perderla.

Y casi ningún vendedor la pregunta, porque está ocupado revisando lo que ya vende.$t$),
    ($t$3.9$t$, 1, $t$Este cliente te va a dar el pedido$t$, $t$Y con gusto. Sin que se lo pidas.

Esa es la trampa: la visita va a salir bien hagas lo que hagas. Vas a tener tu pedido, el cliente va a quedar contento, y te vas a ir sintiendo que hiciste tu trabajo.

Levanta el pedido. Es lo mínimo. Pero no te vayas ahí.$t$),
    ($t$3.9$t$, 2, $t$Las tres herramientas, en orden$t$, $t$1. MAPEA — qué otras líneas maneja aparte de lo tuyo, y de quién las trae.

2. PREGUNTA POR LO QUE LE PIDEN — ¿hay algo que le pidan y no tenga? Esa es demanda que ya existe.

3. ANCLA EN SIMILARES — varios negocios como el suyo también mueven tal cosa. ¿Usted eso lo maneja?

Tres preguntas. Dos minutos. Y sales sabiendo dónde están tus espacios.$t$),
    ($t$3.9$t$, 3, $t$Aquí no te va a castigar nadie$t$, $t$En los otros ejercicios, cuando lo haces mal, el cliente se cierra, te despacha o se enfría. La conversación te avisa.

Aquí no. Si solo levantas el pedido y te vas, el cliente queda contento y la visita fue un éxito.

Por eso este error dura años sin que nadie lo note: no duele. Simplemente nunca creces la cuenta, y nunca sabes por qué.$t$),
    ($t$4.4$t$, 5, $t$Gradualmente, no de golpe$t$, $t$La tentación es subir el impulso lo más rápido posible. Y es contraproducente.

Un cliente al que le echas encima todo el entusiasmo, todos los datos y toda la urgencia en dos minutos no se emociona: se abruma. Y un cliente abrumado se defiende.

La curva se construye por escalones. Cada cosa que dices sube un poco, dejas que asiente, y subes otro. Por eso los siguientes nodos entrenan un factor a la vez: en la calle se combinan, pero primero hay que saber usarlos por separado.$t$),
    ($t$3.10$t$, 1, $t$Reto final del Mundo 3.$t$, $t$Un cliente analítico, apurado y desconfiado — le han hecho perder el tiempo antes. Trae un dolor real en el negocio, pero no se lo cuenta a cualquiera.

Tu misión: la conversación completa. Abrir. Presentarte. Atravesar el "no" que va a caer. Leer su prisa. Y excavar — capa por capa, pista por pista — hasta que el dolor salga completo. Cuando salga, apréndetelo con sus palabras: lo vas a usar después.

Y recuerda la regla del doctor: hoy NO se receta. Solo se diagnostica.$t$),
    ($t$4.16$t$, 1, $t$Reto final del Mundo 4.$t$, $t$Este cliente ya escuchó todas las promesas. Vendedores que juraban no fallar nunca — y fallaron. Su escudo: "eso mismo me dijo el anterior."

Tu misión: el ciclo completo. Excava su dolor. Gánatelo como persona. Y presenta con valor REAL — su problema, sus palabras, su negocio en la escena, síes que le nazcan solos. Ni una promesa grandilocuente: con los desconfiados, la promesa grande es veneno y el detalle concreto es oro.

Ganas cuando el desconfiado te pida los detalles del siguiente paso. Ahí sabrás que el valor pesó más que la cicatriz.$t$),
    ($t$5.15$t$, 1, $t$Reto final del Mundo 5.$t$, $t$A este señor le prometieron y le fallaron — varias veces. Su escudo tiene años de grosor y una frase grabada: "eso mismo me dijo el anterior."

Te espera todo: un bloqueo en la puerta, un dolor que él mismo minimiza ("así es esto, todos fallan igual"), y la cadena final con la objeción más personal del campo: "¿y por qué le voy a creer a USTED?"

Cada bala tuya va a pasar por su lupa. Cada promesa sin ancla lo cierra un poco más. Y si lo logras, su rendición será a su manera: "le tomo la palabra — y lo apunto." No pelees su condición de prueba: hónrala. Ese pedido chico por escrito ES tu victoria — la confianza del desconfiado no se gana en una visita. Se gana cumpliéndole.$t$),
    ($t$6.4$t$, 1, $t$Reto final del Mundo 6.$t$, $t$La venta ya está hecha: un administrador formal acaba de aprobar tu pedido. Y ahí empieza tu examen, porque a este señor todos sus proveedores le han fallado en los DETALLES: entregas tarde, cobros distintos, nadie que dé la cara.

Tu misión NO es vender: de hecho, vender algo más aquí es reprobar. Es sellar: cada término con hora y número, y cuando te pregunte qué pasa si algo falla, la respuesta con nombre y teléfono. Su cicatriz se sana con compromisos que se puedan cobrar. Relación sí, pero a su manera: formal, ganada, sin confiancitas.

Ganas cuando él repita tu trato de memoria... y le hable de ti al negocio de su hermano. Así se fabrica un aliado.$t$)
  ) AS v(node_id, card_order, titulo, cuerpo) ON c.node_id = v.node_id AND c.card_order = v.card_order AND c.title = v.titulo AND c.body = v.cuerpo;
  IF n <> 42 THEN RAISE EXCEPTION 'Mensaje 148: solo % de las 42 tarjetas quedaron (¿alguna estaba distinta?)', n; END IF;
  SELECT count(*) INTO n FROM public.node_quiz_questions WHERE (node_id = '3.0' AND question_order = 1 AND question_text = $t$El cliente le dice al vendedor: "cuénteme, ¿qué me trae?" El vendedor responde arrancando su presentación completa de producto. ¿Qué hizo mal?$t$ AND option_a = $t$Nada — el cliente le pidió la presentación.$t$ AND option_b = $t$Recetó sin diagnosticar: aceptó la invitación a presentar sin saber todavía qué le duele a ese negocio.$t$ AND option_c = $t$Debió negarse a responder la pregunta.$t$ AND explanation_correct = $t$Esa invitación es una trampa dulce. El Closer responde con jiu-jitsu: "Con gusto — pero primero cuénteme un poco de su negocio para no hacerle perder tiempo con cosas que no le sirvan. ¿Qué es lo que más se le mueve?" Diagnóstico primero, siempre.$t$ AND explanation_wrong = $t$La invitación del cliente no cambia el orden del sistema. Presentar sin diagnosticar produce una presentación genérica — y las genéricas no venden. Lo correcto: agradecer la apertura y voltear a preguntar primero. El cliente lo respeta más, no menos.$t$) OR (node_id = '3.0' AND question_order = 2 AND question_text = $t$¿Cuál es la diferencia central entre el vendedor promedio y el Doctor Vendedor?$t$ AND option_a = $t$El promedio busca dónde encajar su producto; el doctor primero entiende el negocio y luego conecta.$t$ AND option_b = $t$El doctor tiene más labia y carisma.$t$ AND explanation_correct = $t$Exacto. Uno llega con la receta escrita buscando paciente. El otro examina primero — y su receta, cuando llega, cae en tierra preparada. Por eso el que pregunta vende más que el que habla.$t$ AND explanation_wrong = $t$No es carisma ni horas — es el ORDEN. El promedio receta primero (su producto favorito buscando dónde caber). El doctor examina primero y receta después. Ese orden invertido es toda la diferencia en conversión.$t$) OR (node_id = '3.0' AND question_order = 3 AND question_text = $t$Le preguntas al cliente qué tal le cumple su proveedor y responde, genuino y sin dudar: "excelente, la verdad cero quejas." ¿Qué hace el investigador?$t$ AND option_a = $t$Insistir en el proveedor con más preguntas hasta encontrar algo.$t$ AND option_b = $t$Cambiar de territorio: ese salió limpio — ahora explora producto o precio.$t$ AND explanation_correct = $t$Eso es el barrido. Un positivo limpio y genuino significa que el dolor no vive en ese territorio — no que no exista. Los otros dos territorios siguen sin examinar: ¿qué líneas le faltan?, ¿a cuánto está comprando? El mapa tiene tres zonas por algo.$t$ AND explanation_wrong = $t$Insistir en un territorio limpio te vuelve interrogador y quema la conversación; rendirte regala la visita. El dolor casi siempre existe — solo que vive en OTRO territorio. Positivo limpio = cambia de zona y sigue examinando.$t$) OR (node_id = '3.0' AND question_order = 4 AND question_text = $t$¿Por qué el cliente baja la guardia cuando le preguntas de verdad por su negocio?$t$ AND option_b = $t$Porque los vendedores que él conoce hablan — el que pregunta y escucha no encaja en su alarma anti-vendedor.$t$ AND explanation_correct = $t$Su alarma está calibrada para el vendedor que llega hablando de su producto. El que pregunta con interés genuino por SU negocio rompe el patrón — y el cerebro del cliente lo reclasifica: de amenaza a conversación.$t$ AND explanation_wrong = $t$No es distracción ni confusión — es reclasificación. Su alarma anti-vendedor espera un monólogo de producto. Cuando en lugar de eso recibe interés genuino por su negocio, el patrón no coincide y la guardia baja. Preguntar es la forma más rápida de dejar de parecer vendedor.$t$);
  IF n <> 4 THEN RAISE EXCEPTION 'Mensaje 148: solo % de las 4 preguntas quedaron (¿alguna estaba distinta?)', n; END IF;
END $chk$;
