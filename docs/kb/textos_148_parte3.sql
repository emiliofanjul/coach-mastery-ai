-- Mensaje 148 · Limpieza de textos (ortografía) · PARTE 3 DE 3.
-- Solo acentos, signos ¿ y ñ: no cambia ninguna palabra, salvo «El cuarto Boss.» y sus parecidos, que dicen ahora
-- «Reto final del Mundo N.». Cada parte se corre sola y se revisa sola: cada texto cambia solo si hoy es exactamente
-- el esperado (por su huella md5), y el chequeo del final aborta la parte completa si algo no quedó.
-- Las partes no dependen entre sí: se pueden correr en cualquier orden, y correr una dos veces no cambia nada.

-- Las 4 preguntas del quiz del 3.0.
UPDATE public.node_quiz_questions SET question_text = $t$El cliente le dice al vendedor: "cuénteme, ¿qué me trae?" El vendedor responde arrancando su presentación completa de producto. ¿Qué hizo mal?$t$, option_a = $t$Nada — el cliente le pidió la presentación.$t$, option_b = $t$Recetó sin diagnosticar: aceptó la invitación a presentar sin saber todavía qué le duele a ese negocio.$t$, option_c = $t$Debió negarse a responder la pregunta.$t$, explanation_correct = $t$Esa invitación es una trampa dulce. El Closer responde con jiu-jitsu: "Con gusto — pero primero cuénteme un poco de su negocio para no hacerle perder tiempo con cosas que no le sirvan. ¿Qué es lo que más se le mueve?" Diagnóstico primero, siempre.$t$, explanation_wrong = $t$La invitación del cliente no cambia el orden del sistema. Presentar sin diagnosticar produce una presentación genérica — y las genéricas no venden. Lo correcto: agradecer la apertura y voltear a preguntar primero. El cliente lo respeta más, no menos.$t$
WHERE node_id = '3.0' AND question_order = 1 AND md5(question_text) = '2d2078934311b0187a2dd82a60196a75' AND md5(option_a) = 'b9fdf5e901d6ab03f5112f164c1554a2' AND md5(option_b) = '8888ed5351dbeed558ec88c1675e689e' AND md5(option_c) = 'a3ee3406bc669d1339bb5e6d3ae0838b' AND md5(explanation_correct) = '3a5c6b5e02a1a4831e5b1004f1270a83' AND md5(explanation_wrong) = 'd0a4f2f370dc90a515f11efdb7a24876';

UPDATE public.node_quiz_questions SET question_text = $t$¿Cuál es la diferencia central entre el vendedor promedio y el Doctor Vendedor?$t$, option_a = $t$El promedio busca dónde encajar su producto; el doctor primero entiende el negocio y luego conecta.$t$, option_b = $t$El doctor tiene más labia y carisma.$t$, explanation_correct = $t$Exacto. Uno llega con la receta escrita buscando paciente. El otro examina primero — y su receta, cuando llega, cae en tierra preparada. Por eso el que pregunta vende más que el que habla.$t$, explanation_wrong = $t$No es carisma ni horas — es el ORDEN. El promedio receta primero (su producto favorito buscando dónde caber). El doctor examina primero y receta después. Ese orden invertido es toda la diferencia en conversión.$t$
WHERE node_id = '3.0' AND question_order = 2 AND md5(question_text) = '9b82f3e733111932a91369d128fafac6' AND md5(option_a) = '55b7834deca4a7ea403b12665cb7504b' AND md5(option_b) = '293cae17c9e70c02c43eaa95c93a4686' AND md5(explanation_correct) = '9ca059b4625adc8d09c167a02aa08cff' AND md5(explanation_wrong) = '3e54491a5b64be442b4f2e8f9972ad08';

UPDATE public.node_quiz_questions SET question_text = $t$Le preguntas al cliente qué tal le cumple su proveedor y responde, genuino y sin dudar: "excelente, la verdad cero quejas." ¿Qué hace el investigador?$t$, option_a = $t$Insistir en el proveedor con más preguntas hasta encontrar algo.$t$, option_b = $t$Cambiar de territorio: ese salió limpio — ahora explora producto o precio.$t$, explanation_correct = $t$Eso es el barrido. Un positivo limpio y genuino significa que el dolor no vive en ese territorio — no que no exista. Los otros dos territorios siguen sin examinar: ¿qué líneas le faltan?, ¿a cuánto está comprando? El mapa tiene tres zonas por algo.$t$, explanation_wrong = $t$Insistir en un territorio limpio te vuelve interrogador y quema la conversación; rendirte regala la visita. El dolor casi siempre existe — solo que vive en OTRO territorio. Positivo limpio = cambia de zona y sigue examinando.$t$
WHERE node_id = '3.0' AND question_order = 3 AND md5(question_text) = '464e2c8d71440b845911175a3cbff52e' AND md5(option_a) = '5d99d28ac7bb5a5a1b5d38f969525444' AND md5(option_b) = '57a86d22e876d6857acd0c8764ea1602' AND md5(explanation_correct) = '76792b2157eb4481df4f41eab69fb75f' AND md5(explanation_wrong) = 'b2ac260b8da8cf5f5a11c9e89ab15687';

UPDATE public.node_quiz_questions SET question_text = $t$¿Por qué el cliente baja la guardia cuando le preguntas de verdad por su negocio?$t$, option_b = $t$Porque los vendedores que él conoce hablan — el que pregunta y escucha no encaja en su alarma anti-vendedor.$t$, explanation_correct = $t$Su alarma está calibrada para el vendedor que llega hablando de su producto. El que pregunta con interés genuino por SU negocio rompe el patrón — y el cerebro del cliente lo reclasifica: de amenaza a conversación.$t$, explanation_wrong = $t$No es distracción ni confusión — es reclasificación. Su alarma anti-vendedor espera un monólogo de producto. Cuando en lugar de eso recibe interés genuino por su negocio, el patrón no coincide y la guardia baja. Preguntar es la forma más rápida de dejar de parecer vendedor.$t$
WHERE node_id = '3.0' AND question_order = 4 AND md5(question_text) = '0e67be824cedd530ec1cc32ebcaba749' AND md5(option_b) = '91926259348fd21dfea416e2c7de7891' AND md5(explanation_correct) = '35def841fbd7d83aea6c4cd4ed987a0b' AND md5(explanation_wrong) = '58a951073ed07c424980e35e2ca5b28d';

-- 13 tarjetas: 3.7·6, 3.7·7, 3.8·1, 3.8·2, 3.8·3, 3.9·1, 3.9·2, 3.9·3, 4.4·5, 3.10·1, 4.16·1, 5.15·1, 6.4·1
UPDATE public.node_cards AS c SET title = v.titulo, body = v.cuerpo FROM (VALUES
  ($t$3.7$t$, 6, 'cbbe6e62afbe786d0b756e52b914fc7d', 'f27f8f4e211ba257f3592ba3913b54c1', $t$La línea que no se cruza$t$, $t$Un hueco tiene que ser REAL y verificable: lo viste, te lo dijo, o lo sabes por su giro.

Descubrir un hueco es señalar algo que ya existe. Fabricarlo es venderle un problema que no tiene.

Lo primero construye una relación de años. Lo segundo la termina el día que el cliente se da cuenta — y con un cliente de cartera, ese día siempre llega.$t$),
  ($t$3.7$t$, 7, 'e93f4716a90a46752c1875f1433df848', 'dfcb548b5bdec477468af6dbc5f74a4c', $t$¿Y si no puedes ver el lugar?$t$, $t$Cuando la visita es por teléfono o por mensaje, la primera herramienta no existe: no hay mostrador que leer.

Ahí las otras dos cargan todo el trabajo. En lugar de observar el catálogo, lo preguntas: ¿qué familias maneja hoy además de lo que nos compra?

Misma mecánica, distinta entrada.$t$),
  ($t$3.8$t$, 1, 'f1dc8e2336dc048aeccea3e5d49f2dfe', '672c0486df90651d81fe0df2c4a1e94b', $t$Lo que no está, y lo que está y no se mueve$t$, $t$Dos lecturas del mismo mostrador que llevan a conversaciones opuestas:

LO QUE NO ESTÁ es oportunidad. Un estante vacío, una familia que no maneja, una marca de la competencia ocupando un espacio que podría ser tuyo.

LO QUE ESTÁ Y NO SE MUEVE es problema. Producto empolvado, cantidades que llevan meses ahí.

Lo primero se trabaja como hueco. Lo segundo es dolor, y ese sí se excava como aprendiste.$t$),
  ($t$3.8$t$, 2, 'ea02b23df825c0475bf500fc63bbd1c4', '335ebb7bbc63c1a993ae0dff7ccb4041', $t$Las tres preguntas que mapean$t$, $t$¿Qué otras líneas maneja aparte de lo nuestro?
¿Y esas de quién las trae?
De lo que le llega a pedir la gente, ¿hay algo que no maneje?

Tres preguntas, ningún problema, ningún dolor. Y al final sabes exactamente dónde están tus espacios.

Fíjate que ninguna suena a venta: suenan a interés por su negocio. Por eso las contesta sin ponerse a la defensiva.$t$),
  ($t$3.8$t$, 3, '6bfc4561cbf4e65c67038996d47f4350', 'b9b8ea9e67ba28560a6981933d074786', $t$La última es la más valiosa$t$, $t$De lo que le piden y no tiene: esa es la venta más fácil que vas a encontrar en tu vida.

No tienes que crear la necesidad ni convencer a nadie. La demanda ya existe, el cliente ya la está perdiendo, y le molesta perderla.

Y casi ningún vendedor la pregunta, porque está ocupado revisando lo que ya vende.$t$),
  ($t$3.9$t$, 1, '348f3ec0977dd6eece5c261537c150cf', '06d5aba2a1efac9ee6b7cbb8aace4950', $t$Este cliente te va a dar el pedido$t$, $t$Y con gusto. Sin que se lo pidas.

Esa es la trampa: la visita va a salir bien hagas lo que hagas. Vas a tener tu pedido, el cliente va a quedar contento, y te vas a ir sintiendo que hiciste tu trabajo.

Levanta el pedido. Es lo mínimo. Pero no te vayas ahí.$t$),
  ($t$3.9$t$, 2, '26f2afaeb80dddc92d5c355bfcef2cc1', '9c6b33086cc07daaa82ecddba6310602', $t$Las tres herramientas, en orden$t$, $t$1. MAPEA — qué otras líneas maneja aparte de lo tuyo, y de quién las trae.

2. PREGUNTA POR LO QUE LE PIDEN — ¿hay algo que le pidan y no tenga? Esa es demanda que ya existe.

3. ANCLA EN SIMILARES — varios negocios como el suyo también mueven tal cosa. ¿Usted eso lo maneja?

Tres preguntas. Dos minutos. Y sales sabiendo dónde están tus espacios.$t$),
  ($t$3.9$t$, 3, 'd540b4bbe184e39b901704e447823654', '85f260bb2b5e22a709bf1ec6bbfa4c8f', $t$Aquí no te va a castigar nadie$t$, $t$En los otros ejercicios, cuando lo haces mal, el cliente se cierra, te despacha o se enfría. La conversación te avisa.

Aquí no. Si solo levantas el pedido y te vas, el cliente queda contento y la visita fue un éxito.

Por eso este error dura años sin que nadie lo note: no duele. Simplemente nunca creces la cuenta, y nunca sabes por qué.$t$),
  ($t$4.4$t$, 5, 'f206b8fa4087729afdfddbf183e10154', '995c9dd5c6c793bf522ef88e28079148', $t$Gradualmente, no de golpe$t$, $t$La tentación es subir el impulso lo más rápido posible. Y es contraproducente.

Un cliente al que le echas encima todo el entusiasmo, todos los datos y toda la urgencia en dos minutos no se emociona: se abruma. Y un cliente abrumado se defiende.

La curva se construye por escalones. Cada cosa que dices sube un poco, dejas que asiente, y subes otro. Por eso los siguientes nodos entrenan un factor a la vez: en la calle se combinan, pero primero hay que saber usarlos por separado.$t$),
  ($t$3.10$t$, 1, '53db25493d62ed5207fc61d7b544fc7a', '4b03521f575782c9448ae8ba66ee7a2e', $t$Reto final del Mundo 3.$t$, $t$Un cliente analítico, apurado y desconfiado — le han hecho perder el tiempo antes. Trae un dolor real en el negocio, pero no se lo cuenta a cualquiera.

Tu misión: la conversación completa. Abrir. Presentarte. Atravesar el "no" que va a caer. Leer su prisa. Y excavar — capa por capa, pista por pista — hasta que el dolor salga completo. Cuando salga, apréndetelo con sus palabras: lo vas a usar después.

Y recuerda la regla del doctor: hoy NO se receta. Solo se diagnostica.$t$),
  ($t$4.16$t$, 1, '53db25493d62ed5207fc61d7b544fc7a', 'b470a828ad680444a12e525e0d34f7b9', $t$Reto final del Mundo 4.$t$, $t$Este cliente ya escuchó todas las promesas. Vendedores que juraban no fallar nunca — y fallaron. Su escudo: "eso mismo me dijo el anterior."

Tu misión: el ciclo completo. Excava su dolor. Gánatelo como persona. Y presenta con valor REAL — su problema, sus palabras, su negocio en la escena, síes que le nazcan solos. Ni una promesa grandilocuente: con los desconfiados, la promesa grande es veneno y el detalle concreto es oro.

Ganas cuando el desconfiado te pida los detalles del siguiente paso. Ahí sabrás que el valor pesó más que la cicatriz.$t$),
  ($t$5.15$t$, 1, '93256020ee0fa3cd77b6fb6c81ed7aac', 'c349aa9a39874cc1f68c479d6caee1fb', $t$Reto final del Mundo 5.$t$, $t$A este señor le prometieron y le fallaron — varias veces. Su escudo tiene años de grosor y una frase grabada: "eso mismo me dijo el anterior."

Te espera todo: un bloqueo en la puerta, un dolor que él mismo minimiza ("así es esto, todos fallan igual"), y la cadena final con la objeción más personal del campo: "¿y por qué le voy a creer a USTED?"

Cada bala tuya va a pasar por su lupa. Cada promesa sin ancla lo cierra un poco más. Y si lo logras, su rendición será a su manera: "le tomo la palabra — y lo apunto." No pelees su condición de prueba: hónrala. Ese pedido chico por escrito ES tu victoria — la confianza del desconfiado no se gana en una visita. Se gana cumpliéndole.$t$),
  ($t$6.4$t$, 1, 'f6e0cfbbd9e7ed3ca90bacd3e5dc7528', '2a83210249b524a849905337604bfa8a', $t$Reto final del Mundo 6.$t$, $t$La venta ya está hecha: un administrador formal acaba de aprobar tu pedido. Y ahí empieza tu examen, porque a este señor todos sus proveedores le han fallado en los DETALLES: entregas tarde, cobros distintos, nadie que dé la cara.

Tu misión NO es vender: de hecho, vender algo más aquí es reprobar. Es sellar: cada término con hora y número, y cuando te pregunte qué pasa si algo falla, la respuesta con nombre y teléfono. Su cicatriz se sana con compromisos que se puedan cobrar. Relación sí, pero a su manera: formal, ganada, sin confiancitas.

Ganas cuando él repita tu trato de memoria... y le hable de ti al negocio de su hermano. Así se fabrica un aliado.$t$)
) AS v(node_id, card_order, md5_titulo_viejo, md5_cuerpo_viejo, titulo, cuerpo)
WHERE c.node_id = v.node_id AND c.card_order = v.card_order AND md5(c.title) = v.md5_titulo_viejo AND md5(c.body) = v.md5_cuerpo_viejo;

DO $chk$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.node_cards AS c JOIN (VALUES
    ('3.7', 6, '27bd7fa9e228997af6b1870faea61dee', '0016793c8311d0df585da487f55d728b'),
    ('3.7', 7, 'efa7d470251bb5e66dab2b2c485f6691', 'c4ae67d65a98964b8a609b645b11989e'),
    ('3.8', 1, 'bab945197bf4299c2cac1403d7d7242a', '2e4ab2e65b02a7c1bdd9168239082a42'),
    ('3.8', 2, 'ea02b23df825c0475bf500fc63bbd1c4', 'c7d9dc0c58ea1aa9806a0ad8606d376b'),
    ('3.8', 3, 'd9cb987acea3bcdd5c7f69e3c2291135', '1d8a18217b2bc75824bc003dd691557b'),
    ('3.9', 1, '348f3ec0977dd6eece5c261537c150cf', '820a881714b54490b159e6773388672d'),
    ('3.9', 2, '26f2afaeb80dddc92d5c355bfcef2cc1', '1375e2777c9b448522fa752d75c8ad9c'),
    ('3.9', 3, '36ab2e636f97e09a9f37d2425f67b5d8', '5909a2940797ed9c3d1cd758e4ff9586'),
    ('4.4', 5, 'f206b8fa4087729afdfddbf183e10154', '8f7740406ffc5e88c8592b7596ca8f99'),
    ('3.10', 1, '72b1d89f1b54245605dec69fcddd891e', '4b03521f575782c9448ae8ba66ee7a2e'),
    ('4.16', 1, '3833772bb9e361d53cae7b3191cf630c', 'b470a828ad680444a12e525e0d34f7b9'),
    ('5.15', 1, 'a2691e565cbae5b74ffa1a05c1320f03', 'c349aa9a39874cc1f68c479d6caee1fb'),
    ('6.4', 1, '21a655cff4177079dc2151e2268e664a', '2a83210249b524a849905337604bfa8a')
  ) AS v(node_id, card_order, t, b) ON c.node_id = v.node_id AND c.card_order = v.card_order AND md5(c.title) = v.t AND md5(c.body) = v.b;
  IF n <> 13 THEN RAISE EXCEPTION 'Mensaje 148, parte 3 de 3: solo % de sus 13 tarjetas quedaron (¿alguna estaba distinta?)', n; END IF;
  SELECT count(*) INTO n FROM public.node_quiz_questions WHERE (node_id = '3.0' AND question_order = 1 AND md5(question_text) = '12ed165c78544921a84cf58d2a4a4bd4' AND md5(option_a) = '8995bee14fc34a6748d9769506f4e6ed' AND md5(option_b) = 'bc46c092fe5e98a496619f1baef0a82b' AND md5(option_c) = 'b6d3dfcc67964b2ce880aa660823e4a4' AND md5(explanation_correct) = '37c022621b6210501c0199782f1f1c2e' AND md5(explanation_wrong) = '32aeee635ce45656fabc62b94ba602b8') OR (node_id = '3.0' AND question_order = 2 AND md5(question_text) = '5768b601003108cad7688cbb4fb3ce3a' AND md5(option_a) = '157865a1d3b4ceda5809b2e9dc6bb4ae' AND md5(option_b) = '189f638902466bc55a52d09c05c0194d' AND md5(explanation_correct) = '37b97fb4b8fc3ece267058dc2ab6daf6' AND md5(explanation_wrong) = 'b95b9bef937df611f8900663e541181d') OR (node_id = '3.0' AND question_order = 3 AND md5(question_text) = '5a1f2a65b7f9d405fc7d50cf9f774e9e' AND md5(option_a) = '03be8c9e30e5229168e28cc078d4208d' AND md5(option_b) = 'c443fcfdcde75ad98dc1585cc3f0a287' AND md5(explanation_correct) = 'd6500734a64de45823c1af42c9eaaf27' AND md5(explanation_wrong) = '43b55d1ce78e6a7fc233fd93d7b7a2c0') OR (node_id = '3.0' AND question_order = 4 AND md5(question_text) = '2508d1358d53c959b54f1546b97c065b' AND md5(option_b) = '293f77d7ed75f9748530258fc192b5a8' AND md5(explanation_correct) = '220925f78f9561e0fc354e18b7ad5724' AND md5(explanation_wrong) = '12450a66e5ebc5553f6ef74d197453f0');
  IF n <> 4 THEN RAISE EXCEPTION 'Mensaje 148, parte 3 de 3: solo % de las 4 preguntas quedaron (¿alguna estaba distinta?)', n; END IF;
END $chk$;
