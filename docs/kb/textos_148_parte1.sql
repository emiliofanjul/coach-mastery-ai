-- Mensaje 148 · Limpieza de textos (ortografía) · PARTE 1 DE 3.
-- Solo acentos, signos ¿ y ñ: no cambia ninguna palabra, salvo «El cuarto Boss.» y sus parecidos, que dicen ahora
-- «Reto final del Mundo N.». Cada parte se corre sola y se revisa sola: cada texto cambia solo si hoy es exactamente
-- el esperado (por su huella md5), y el chequeo del final aborta la parte completa si algo no quedó.
-- Las partes no dependen entre sí: se pueden correr en cualquier orden, y correr una dos veces no cambia nada.

-- Los 7 lemas de los mundos.
UPDATE public.worlds AS w SET description = v.nuevo FROM (VALUES
  (1, '52c9493a65bab19056fb34a6537c6abc', $t$Aquí no vendes nada. Aquí te ganas el derecho a seguir hablando.$t$),
  (2, 'bf7ef3c33ae6d7024c76aab602a3955d', $t$El cliente ya te puso atención. Ahora necesita saber con quién está hablando.$t$),
  (3, 'cdfd532e13378964a666376e39fa5369', $t$Deja de recetar y empieza a diagnosticar. Aquí aprendes qué preguntar y cómo llegar al fondo.$t$),
  (4, '11af1d7ed3193c2d09429f0586471ebf', $t$Ya sabes qué le duele. Aquí aprendes a construir valor, subir el impulso y presentar el precio.$t$),
  (5, '133795088dc9b3a499f89dd52f48c5df', $t$Presentar sin cerrar es contar un cuento. Aquí aprendes a pedir la decisión y a atravesar lo que se atraviese.$t$),
  (6, 'edda796f08006d4d45ea81b2a7629124', $t$Ya dijo que sí. Lo que hagas ahora decide si esa venta se queda y si hay una siguiente.$t$),
  (7, 'a1d3affa6265a5a468e4b5e003c45e41', $t$Todo el sistema, sin ayudas. Aquí se sella tu certificación.$t$)
) AS v(id, md5_viejo, nuevo)
WHERE w.id = v.id AND md5(w.description) = v.md5_viejo;

-- 14 tarjetas: 3.0·1, 3.0·2, 3.0·3, 3.0·4, 3.0·5, 3.0·6, 3.0·7, 3.2·1, 3.2·2, 3.2·3, 3.2·4, 3.2·5, 3.2·6, 3.2·7
UPDATE public.node_cards AS c SET title = v.titulo, body = v.cuerpo FROM (VALUES
  ($t$3.0$t$, 1, '6a31b58ff40bad8a33bb569476747f12', 'ec0fac84da93e10aaf18d4505ebe1617', $t$Imagina esta consulta.$t$, $t$Entras al consultorio. El doctor, sin preguntarte nada, sin revisarte, te dice: "Tómese estas pastillas, son buenísimas, a todos mis pacientes les funcionan."

¿Le crees? ¿Te las tomas?

Eso EXACTO siente un cliente cuando le presentas el producto sin haberle preguntado nada.$t$),
  ($t$3.0$t$, 2, 'f02e3eb7f351b403fa1aab0aab2988a0', '700563464faa3245c155bb6915f97620', $t$El diagnóstico es lo que te separa.$t$, $t$El vendedor promedio llega a recetar: trae su producto favorito en la mente y busca dónde encajarlo.

El Closer llega a diagnosticar: pregunta, escucha, entiende el negocio — y SOLO entonces conecta lo que vende con lo que descubrió.

La ironía: el que diagnostica vende más que el que receta. Porque la gente no compra productos — compra soluciones a SUS problemas.$t$),
  ($t$3.0$t$, 3, '03364b28a75dfe6b6b16972eec2780c0', '099785949e8cbe155fbadde87ed6a66a', $t$El mapa del dolor: los 3 Territorios$t$, $t$Un doctor no examina al azar: sabe dónde buscar. Tú también. TODO dolor comercial de un cliente vive en uno de tres territorios:

PRODUCTO — lo que vende o usa: faltantes de su estrella, líneas que no rotan, marcas que le piden y no consigue.

SERVICIO — cómo lo trata su proveedor: entregas que no llegan, plantones, nadie que dé la cara.

PRECIO — lo que paga y lo que gana: margen apretado, subidas sin aviso, dinero congelado parado.

Ya no preguntas al azar. Preguntas con mapa.$t$),
  ($t$3.0$t$, 4, 'b37927dc852a29f93223e5f12c3702f3', 'd93fda0100a26e9d47d48ae562c8013b', $t$El mismo territorio se pregunta distinto$t$, $t$Los tres territorios son siempre los mismos. Lo que cambia es CÓMO preguntas, según a quién le estás vendiendo.

SI TU CLIENTE REVENDE lo que le compras: le preguntas por lo que más maneja, por lo que sus clientes le piden y no tiene, por lo que se le queda parado.

SI TU CLIENTE CONSUME lo que le vendes: no le preguntes qué vende, porque no vende nada. Pregúntale qué USA, cuántas unidades maneja, cada cuánto repone, cuánto le dura.

SI TU CLIENTE DISTRIBUYE: le preguntas por sus líneas, por a cuántos surte, por la zona que cubre.

Mismo mapa, tres traducciones. Preguntarle a un consumidor qué maneja más es la manera más rápida de que se dé cuenta de que no entendiste su negocio.$t$),
  ($t$3.0$t$, 5, '92880e2022cad9f9c979e5a53bb4a6f6', '2eed99a394af7999875eb98195fe8d71', $t$Por qué preguntar vende más que hablar$t$, $t$Cuando preguntas de verdad, pasan tres cosas a tu favor:

El cliente se siente escuchado — y baja la guardia que le pone a los vendedores. Te da la munición exacta — te dice literalmente qué le duele y qué necesita. Y tu presentación deja de ser genérica — cada palabra que digas después va a estar conectada con lo que ÉL te contó.

Preguntar no retrasa la venta. La construye.$t$),
  ($t$3.0$t$, 6, '67b6177b9ff8e59072b8e07c112544b0', '9605ea2570264ba2494b68d7fc6f68b5', $t$La regla del investigador$t$, $t$El dolor NUNCA se pregunta directo. "¿Qué problemas tiene?" produce un "ninguno, todo bien" — garantizado.

El dolor se deja emerger: preguntas por los hechos de un territorio, subes a la experiencia, y esperas el flaqueo — el "aunque...", el "a veces...", el "lo único es que...".

Y cuando el dolor sale, apréndetelo con SUS palabras. Se lo puedes repetir en ese momento, o quedarte callado y seguir. Lo importante es no olvidarlo: lo vas a usar en la presentación.$t$),
  ($t$3.0$t$, 7, '6aba87a1b94b9a9f568c311e9f04397a', 'f31de9da9b701647062240c5f34d1fcb', $t$Tu nuevo orden mental$t$, $t$De este mundo en adelante, tu regla es la del doctor: primero el examen, luego la receta.

Ya te ganaste el derecho de hacer preguntas de negocio — abriste bien, te presentaste bien. Ahora sí: recorre los territorios, escucha, profundiza. La presentación puede esperar. El diagnóstico, no.$t$),
  ($t$3.2$t$, 1, 'b4b8b99a9899456272b50a9898a31e4b', '45f93a9eb78c0a20baf66ac04450d3b1', $t$El dolor real nunca está en la superficie.$t$, $t$Pregúntale a cualquier cliente "¿cómo va el negocio?" y te dirá "bien, gracias a Dios."

¿Es cierto? Más o menos. Todo negocio trae algo que le duele — y ya sabes dónde buscarlo: en el PRODUCTO, en el SERVICIO o en el PRECIO. Pero eso no se cuenta al primer desconocido que pregunta. Se cuenta a quien se gana la respuesta... pelando capas.$t$),
  ($t$3.2$t$, 2, 'e159b28aa05e1dde6181cee0ae1b0d0e', '0cd8e6038066e96257bea0d961976244', $t$Las tres capas$t$, $t$CAPA 1 — Hechos: fáciles de responder, cero riesgo. "¿Qué maneja más?" "¿Quién lo surte?" "¿A cómo le llega?" Abren la plática y te dan el mapa de sus territorios.

CAPA 2 — La puerta al dolor: aquí el cliente puede soltar una PISTA... o cerrarte la puerta con un "bien". Todo depende de CÓMO preguntes.

CAPA 3 — El dolor completo: solo se abre si recoges la pista y profundizas con preguntas abiertas. Aquí te cuenta lo que de verdad le duele, con detalle y con emoción.$t$),
  ($t$3.2$t$, 3, 'a5acd2d21343bdc5e34c3db19c57c314', '8fa24cfd1556df9f94051259979467e8', $t$Cuidado con el "bien" automático.$t$, $t$"¿Y qué tal le va con su proveedor?" — "Bien, no me quejo."

Esa respuesta no es información: es un reflejo. Nadie le cuenta sus problemas a un desconocido que pregunta en genérico, por dos razones: la respuesta cortés ya la trae cargada, y admitir un problema se siente como quejarse o como aceptar que eligió mal.

La pregunta genérica no falla por mala suerte. Falla siempre. Y el vendedor promedio la escucha, piensa "aquí no hay nada" y se va con las manos vacías.$t$),
  ($t$3.2$t$, 4, 'a61d6ee2ba49a23be6d45d86cb15dea1', '4ae5824f74fa4ad0a28f39120cfcfec0', $t$La pregunta que no se puede contestar con "bien"$t$, $t$La solución es simple: cambia la opinión general por algo CONCRETO.

En vez de "¿qué tal le va con su proveedor?" -> "¿le ha tocado quedarse sin su producto estrella?"
En vez de "¿qué tal anda el precio?" -> "¿cuánto le subieron este año?"
En vez de "¿todo bien por acá?" -> "¿cuántas veces al mes le llega incompleto el pedido?"

Ya no puede disparar el reflejo: tiene que ir a buscar un dato real de su negocio. Eso es todo — no es una técnica complicada, es dejar de preguntar en general.

Más adelante vas a aprender una versión aún más potente: darle permiso de admitirlo contándole que a otros les pasa. Por ahora, con preguntar concreto ya cambias el juego.$t$),
  ($t$3.2$t$, 5, 'f000d493e9521836a4a7fdab5531ee4b', 'd91a7e86dc22cb8dfa47febd144ac419', $t$Y aun así te va a decir que no sabe$t$, $t$Preguntaste concreto y el cliente contesta pues no sé, o se queda pensando y suelta cualquier cosa.

No es que no quiera. Es que una pregunta abierta lo obliga a construir la respuesta desde cero, y eso cuesta trabajo. Como no le urge ayudarte, contesta lo más corto que puede.

La solución es darle de dónde agarrarse.$t$),
  ($t$3.2$t$, 6, '383a62f4237808e1b0230fe81f6c369b', '6fd2e2a454a34ac144458c5eccd799f1', $t$Suggestive Language: sugiere opciones$t$, $t$Después de preguntar, avienta tres o cuatro opciones.

¿Qué familias son las que más se te mueven? ¿Anticongelantes? ¿Aceite de motor? ¿Diésel? ¿Moto?

¿A cómo compras el líquido de frenos? ¿70? ¿80? ¿90?

Y aquí está lo bueno: o elige una de tus opciones, o te CORRIGE con el dato real — no, más bien 95.

Esa corrección es justo la información que buscabas, y la pregunta abierta nunca te la habría dado.$t$),
  ($t$3.2$t$, 7, '81970cf1566be9e68d08ca3310009799', 'b09ef950f47315934dc0881f1330b542', $t$La palabra mágica: "aunque..."$t$, $t$Cuando tu pregunta abre la puerta, escucha con lupa los peros y los aunques: "bien, aunque a veces batalla uno", "sin queja, lo único es que...".

Eso NO es relleno — es el cliente asomando el dolor para ver si te interesa. Si lo dejas pasar, la puerta se cierra y no se vuelve a abrir. Si lo recoges con una pregunta ABIERTA ("¿como cuánto le dura ese batallar?"), la capa 3 se abre sola.

Concreta para abrir. Abierta para excavar. Ese es el orden, y no se invierte.$t$)
) AS v(node_id, card_order, md5_titulo_viejo, md5_cuerpo_viejo, titulo, cuerpo)
WHERE c.node_id = v.node_id AND c.card_order = v.card_order AND md5(c.title) = v.md5_titulo_viejo AND md5(c.body) = v.md5_cuerpo_viejo;

DO $chk$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.worlds AS w JOIN (VALUES
    (1, '330f51ac51bf437ad5392bd7473ff5a0'),
    (2, '0a3e12652368507a22c5ac78f9dcb5f2'),
    (3, '9582d883dc7978cd7d962401c1dd20a2'),
    (4, '197ab043e3b200c283d48d064559cbc1'),
    (5, '6f3f1e2ecf0b573552ba6edf8c5ef554'),
    (6, '992074ca425d4a3b758fbe192404113c'),
    (7, '971f5245a9d4c719511440764006920e')
  ) AS v(id, h) ON w.id = v.id AND md5(w.description) = v.h;
  IF n <> 7 THEN RAISE EXCEPTION 'Mensaje 148, parte 1 de 3: solo % de los 7 lemas quedaron (¿alguno estaba distinto?)', n; END IF;
  SELECT count(*) INTO n FROM public.node_cards AS c JOIN (VALUES
    ('3.0', 1, '6a31b58ff40bad8a33bb569476747f12', '2c801c75bb0bdae6a1b2de4833d1eef4'),
    ('3.0', 2, 'fd3440d0860f29441d287637ecabca5f', '863146a1e18964972fbcf94afabcc135'),
    ('3.0', 3, '03364b28a75dfe6b6b16972eec2780c0', 'c7c41036a49a78b2aba8cfb5ba9532ab'),
    ('3.0', 4, 'b37927dc852a29f93223e5f12c3702f3', 'edce6d2c6f2c328f026340ade4c6368a'),
    ('3.0', 5, '212f1112dc67a08b0bb0eadb1dd717a3', '3132087955ffb179a22e8daef8999421'),
    ('3.0', 6, '67b6177b9ff8e59072b8e07c112544b0', '09d7a27a22b03610616743ce26216a77'),
    ('3.0', 7, '6aba87a1b94b9a9f568c311e9f04397a', 'c679c8d733bcbf9296cf529b323d2bbd'),
    ('3.2', 1, 'b11f425ca99ba2d28beaca6009e6d07a', 'cc4adb02730ab25229f14b08c743758e'),
    ('3.2', 2, 'e159b28aa05e1dde6181cee0ae1b0d0e', '798fba7d9cac2d7e322fee883636e4ea'),
    ('3.2', 3, 'baab7c17cc9eca52356ff469715ca835', '967a3e56cac08afbe6d8233eb2fe2554'),
    ('3.2', 4, 'a61d6ee2ba49a23be6d45d86cb15dea1', 'b6048e4cf63c9615c5ab3110a44b0b0f'),
    ('3.2', 5, '2e456f7308f19664382c67634a682898', 'e9fd55bfee9ae653b582e12e3dfbfdbb'),
    ('3.2', 6, '383a62f4237808e1b0230fe81f6c369b', '199fe162acadfd58861ed9ff2e5cebe1'),
    ('3.2', 7, 'b11483f42af7a61d46039bfadabd2af1', '46b58635b75668f151d0852403957c9a')
  ) AS v(node_id, card_order, t, b) ON c.node_id = v.node_id AND c.card_order = v.card_order AND md5(c.title) = v.t AND md5(c.body) = v.b;
  IF n <> 14 THEN RAISE EXCEPTION 'Mensaje 148, parte 1 de 3: solo % de sus 14 tarjetas quedaron (¿alguna estaba distinta?)', n; END IF;
END $chk$;
