-- Mensaje 88 · Mundo 1 en lenguaje Closer (versión aprobada por Emilio, 15-oct-2026).
-- Cada fila se actualiza solo si sigue igual que en el snapshot (huella md5). El bloque del final aborta si algo no quedó.

-- 1. Tarjetas
UPDATE public.node_cards SET title = $v$Una plática con orden$v$, body = $v$Vender es platicar con el cliente. Pero no es una plática cualquiera: es una plática con orden.

Imagina a dos vendedores que llegan al mismo negocio.

El primero entra y empieza a hablar de lo que vende. El cliente le dice: "Ahorita no, gracias".

El segundo saluda, comenta algo del negocio y hace una pregunta. El cliente le platica cómo le va. Al final, le compra.

Los dos venden lo mismo. La diferencia fue el orden.$v$, flip_back_text = NULL
  WHERE node_id = '1.0' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = 'f9b95047bad7323a3b29cf9cce5d6fc9';
UPDATE public.node_cards SET title = $v$Los 6 pasos$v$, body = $v$Toda venta pasa por seis pasos, siempre en este orden:

1. Introducción: solo tienes una oportunidad para causar una buena primera impresión.
2. Historia breve: le dices quién eres y a qué vienes.
3. Descubrimiento: haces preguntas para descubrir lo que el cliente necesita de verdad.
4. Presentación: le explicas cómo lo vas a ayudar a resolverlo.
5. Cierre: la plática llega a una decisión. Tú no se la pides: la das por hecha.
6. Consolidación: el cliente se va contento con su decisión y sabe qué sigue.

Cada paso es un mundo de este mapa, y te lo vamos a enseñar a detalle.$v$, flip_back_text = NULL
  WHERE node_id = '1.0' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = 'e2c0ed28e1f66609d64d8cf438155924';
UPDATE public.node_cards SET title = $v$Un paso a la vez, en orden$v$, body = $v$Los seis pasos van uno detrás del otro, en línea recta. Cada paso prepara el que sigue.

Mira lo que pasa si te saltas uno:

Si te saltas la historia breve, el cliente no sabe quién eres. No baja la guardia y no te cuenta lo que necesita.

Si te saltas el descubrimiento, no sabes qué necesita. Entonces le ofreces cualquier cosa, y te contesta: "No quiero nada, gracias".

Por eso vas paso por paso, en orden.$v$, flip_back_text = NULL
  WHERE node_id = '1.0' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = 'd88e2d0b9555d9c925a8932f2fdbbf42';
UPDATE public.node_cards SET title = $v$Cuando algo interrumpe la plática$v$, body = $v$Vas a la mitad de la visita. Le estás preguntando al encargado cómo le va con su proveedor.

De pronto llega un cliente y se va a atenderlo. O te hace una pregunta que no tiene nada que ver.

Eso pasa en casi todas las visitas, y está bien.

Cuando regresa contigo, no empiezas desde el saludo. Lo que ya platicaron no se pierde. Retomas la pregunta donde ibas y sigues.$v$, flip_back_text = NULL
  WHERE node_id = '1.0' AND card_order = 4 AND md5(concat_ws('|', title, body, flip_back_text)) = '10bdb3ad82af0ca972bf69b8ddab2543';
UPDATE public.node_cards SET title = $v$Tú decides cuándo salir y cuándo regresar$v$, body = $v$Otras veces eres tú el que cambia de tema, a propósito.

Por ejemplo: el encargado te cuenta que su hijo ya le ayuda en el negocio, y tú le preguntas cómo le va. Platican un poco de eso y te empieza a tener confianza.

Tú decides cuándo te sales de la línea recta y cuándo regresas. El cliente no te va a regresar: si la plática está agradable, ahí se queda.

Por eso el control es tuyo: te sales, regresas a donde ibas y sigues avanzando.$v$, flip_back_text = NULL
  WHERE node_id = '1.0' AND card_order = 5 AND md5(concat_ws('|', title, body, flip_back_text)) = '7800361c3263ec5e72474e610c350def';
UPDATE public.node_cards SET title = $v$Con un orden, sabes dónde fallaste$v$, body = $v$Hay visitas que no salen como esperabas: el cliente te dice que no quiere comprar nada.

Si no tienes un orden, lo único que te queda es pensar "no era mi día".

Con los seis pasos puedes revisar en cuál se atoró la plática. Por ejemplo: "le presenté antes de saber qué necesitaba".

Eso sí lo puedes corregir en tu siguiente visita.$v$, flip_back_text = NULL
  WHERE node_id = '1.0' AND card_order = 6 AND md5(concat_ws('|', title, body, flip_back_text)) = '00df553056334681c4cbf8234dff9dde';
UPDATE public.node_cards SET title = $v$Lo que el cliente ve cuando llegas$v$, body = $v$Cuando entras a un negocio, lo primero que nota el cliente no es lo que dices. Es cómo llegas.

Solo tienes una oportunidad para causar una buena primera impresión.

En este nodo aprendes tres cosas que te ayudan a lograrla.$v$, flip_back_text = NULL
  WHERE node_id = '1.1' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = '980f38bf7de9798aca43d69f9b3d9a4b';
UPDATE public.node_cards SET title = $v$Primero, que te ponga atención$v$, body = $v$Cuando llegas, el cliente está en lo suyo: atendiendo, acomodando, haciendo cuentas.

La introducción sirve para que deje eso por un momento y te ponga atención.

Todavía no le vendes nada. Primero, que te escuche.$v$, flip_back_text = NULL
  WHERE node_id = '1.1' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = 'e4eed0e1340a5a769fdf6bc623a9e207';
UPDATE public.node_cards SET title = $v$Las 3 cosas al llegar: SCE$v$, body = $v$Al llegar, tres cosas hacen la diferencia:

S: Sonrisa
C: Contacto visual
E: Entusiasmo

Vamos una por una.$v$, flip_back_text = NULL
  WHERE node_id = '1.1' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = '73c69d2db860bd91c708c153d96b8cf7';
UPDATE public.node_cards SET title = $v$S: Sonrisa$v$, body = $v$La sonrisa se entiende en todo el mundo: le dice al cliente que vienes como amigo.

Le quita la desconfianza y le da confianza en ti.

No es magia: hay clientes que tienen un mal día y no te van a sonreír de vuelta. Pero si llegas sonriendo, es mucho más fácil que la plática empiece bien.$v$, flip_back_text = NULL
  WHERE node_id = '1.1' AND card_order = 4 AND md5(concat_ws('|', title, body, flip_back_text)) = '9dff4b13b8222a30a7c5ab352405c590';
UPDATE public.node_cards SET title = $v$C: Contacto visual$v$, body = $v$Imagina que un amigo te dice: "Mañana paso por ti a las 5 para llevarte a tu cita con el doctor".

Si te lo dice viendo para otro lado, te quedas con la duda. Si te lo dice mirándote a los ojos, le crees.

Con el cliente pasa lo mismo. Mirarlo a los ojos le da confianza en ti, y te ayuda a llevar la plática.

Y cuando le prometes algo, o le dices algo que es importante que te crea, míralo a los ojos. Ahí es cuando más cuenta.$v$, flip_back_text = NULL
  WHERE node_id = '1.1' AND card_order = 5 AND md5(concat_ws('|', title, body, flip_back_text)) = '99c1f13246cf4b7c6513c4872f6eb2e7';
UPDATE public.node_cards SET title = $v$E: Entusiasmo$v$, body = $v$Que se te note el gusto de estar ahí.

Si suenas emocionado con lo que traes, el cliente piensa que es algo bueno y le da curiosidad, aunque todavía no sepa qué es.

Y al revés: si tú suenas aburrido de tu producto, nadie se va a emocionar más que tú.$v$, flip_back_text = NULL
  WHERE node_id = '1.1' AND card_order = 6 AND md5(concat_ws('|', title, body, flip_back_text)) = '16f9feefe4241ed638ad403136865246';
UPDATE public.node_cards SET title = $v$La regla del 10%$v$, body = $v$Fíjate en la energía del cliente y ponte un poquito arriba de él: un 10% más. No el doble.

Si el cliente está tranquilo y tú llegas gritando, lo alejas. Si él está animado y tú llegas apagado, también.

Un poquito arriba de él lo contagia sin incomodarlo.$v$, flip_back_text = NULL
  WHERE node_id = '1.1' AND card_order = 7 AND md5(concat_ws('|', title, body, flip_back_text)) = 'fbed8e63fff9bb7bd8299f9b6a0bb7a4';
UPDATE public.node_cards SET title = $v$Lo que Closer no puede ver$v$, body = $v$Closer no puede ver tu sonrisa ni saber si miraste a los ojos. Por eso no te califica eso.

Te lo enseña y confía en que lo haces en cada visita. Tu manager te ayuda con eso en persona.

Aquí practicas lo que dices, y la energía que se nota en tus palabras.$v$, flip_back_text = NULL
  WHERE node_id = '1.1' AND card_order = 8 AND md5(concat_ws('|', title, body, flip_back_text)) = '67c87949f3ac92d98021cdad6b849571';
UPDATE public.node_cards SET title = $v$Tu primera frase$v$, body = $v$Así empieza tu visita:

1. Saludas con tu SCE: sonrisa, mirada y entusiasmo.
2. Comentas algo que notaste en su negocio, o algo que sabes de él.
3. Terminas con una pregunta sobre eso.

Con la pregunta, el cliente empieza a platicar y tú guías hacia dónde va la plática.

En el 1.5 le vas a agregar un toque ligero: el ice breaker (romper el hielo).$v$, flip_back_text = NULL
  WHERE node_id = '1.2' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = '6cf3dcd9e263badaba796d2b1104e67e';
UPDATE public.node_cards SET title = $v$El comentario tiene que ser de ese negocio$v$, body = $v$"Buenos días, ¿cómo está?" se lo puedes decir a cualquiera. El cliente contesta "bien, gracias" y se queda esperando.

"Se ve que aquí no para el movimiento desde temprano" solo se lo puedes decir a él, hoy. Por eso te contesta con más ganas.

Y si ya lo conoces, todavía mejor: pregúntale por algo que te platicó la vez pasada.$v$, flip_back_text = NULL
  WHERE node_id = '1.2' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = '49fee218708947e527ebd4e30384338c';
UPDATE public.node_cards SET title = NULL, body = $v$Buenos días, disculpe… ¿tiene un minutito?$v$, flip_back_text = $v$Aquí el vendedor se hizo menos. Pidió perdón y pidió permiso, como si el cliente le estuviera haciendo un favor al escucharlo.

Pero tú traes algo que le puede servir. No tienes por qué llegar disculpándote.

Esa forma de pensar la vas a ver en el siguiente nodo, con la teoría del Gasman.$v$
  WHERE node_id = '1.2' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = '6961ec38759995f222123e481f5e77d1';
UPDATE public.node_cards SET title = NULL, body = $v$¡Buenos días! Oiga, se ve que aquí no para el movimiento desde temprano. ¿Siempre está así de movido?$v$, flip_back_text = $v$Saluda con energía, comenta algo que notó en ese negocio y termina con una pregunta sobre eso.

El cliente empieza a platicar, y el vendedor sabe hacia dónde lleva la plática.$v$
  WHERE node_id = '1.2' AND card_order = 4 AND md5(concat_ws('|', title, body, flip_back_text)) = '2a55e488dcc2b400d858183c86f1bbe6';
UPDATE public.node_cards SET title = $v$La teoría del Gasman$v$, body = $v$Cuentan que en Londres, hace muchos años, los gasistas (los señores del gas) entraban a las casas sin pedir permiso.

Así se hacía, y todos lo esperaban. Llegaban, surtían el gas y se iban.

No se sentían mal por entrar: estaban ayudando a esa familia.

Quizá no fue exactamente así, pero la historia ayuda a entender la idea: cuando sabes que traes algo que le sirve al cliente, llegas seguro.$v$, flip_back_text = NULL
  WHERE node_id = '1.3' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = '2cbbae78dc56b7f4aabcf014d2561acb';
UPDATE public.node_cards SET title = $v$Por qué no debes pedir permiso$v$, body = $v$Cuando preguntas "¿tiene un minutito?", el cliente tiene dos opciones: sí o no.

Y "no" es la más fácil. No le cuesta nada y lo deja tranquilo.

Cuando contesta "ahorita no", no está siendo grosero. Tú le diste esa opción y la tomó.$v$, flip_back_text = NULL
  WHERE node_id = '1.3' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = '31f68b64a9fa008d990914453b463652';
UPDATE public.node_cards SET title = $v$Llega seguro, sin ser prepotente$v$, body = $v$No se trata de ser prepotente ni de pasarte de listo. Se trata de llegar seguro, porque traes algo que le puede servir.

El que llega seguro saluda, no pide permiso. Comenta, no se disculpa. Pregunta, no suplica.

La diferencia se nota desde el primer segundo, aunque las palabras sean casi las mismas.$v$, flip_back_text = NULL
  WHERE node_id = '1.3' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = 'e1365972bce59602f0fbc3e254b7c351';
UPDATE public.node_cards SET title = $v$Le gusta comprar, no que le vendan$v$, body = $v$A la gente le gusta comprar. Lo que no le gusta es sentir que le están vendiendo.

Cuando entras pidiendo permiso, el cliente piensa: "Aquí viene otro vendedor".

Cuando entras seguro y en buen plan, la plática empieza tranquila.$v$, flip_back_text = NULL
  WHERE node_id = '1.3' AND card_order = 4 AND md5(concat_ws('|', title, body, flip_back_text)) = '161dd21f06619a210e2b6390f7863694';
UPDATE public.node_cards SET title = $v$Cuando el cliente está ocupado$v$, body = $v$Vas a llegar con clientes que traen prisa, que están atendiendo o que tienen las manos llenas.

Vas a sentir ganas de bajar la voz, hablar rápido o pedir permiso.

Es su negocio y lo respetas. Pero que esté ocupado no cambia lo que traes: algo que le puede servir. Mantén tu energía, un poquito arriba de la suya, y sigue con tu primera frase.$v$, flip_back_text = NULL
  WHERE node_id = '1.4' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = '2eb8363ce42fc0633b56355e22d98e3e';
UPDATE public.node_cards SET title = $v$Frases que debes evitar$v$, body = $v$Estas cinco suenan educadas, pero todas le dan al cliente una forma fácil de despedirte:

"Perdón que lo moleste."
"¿Tiene un minutito?"
"Solo será un segundo."
"Disculpe la molestia."
"No le quito mucho tiempo."

Ninguna es grosera, pero todas te cuestan la plática. Sácalas de tu vocabulario.$v$, flip_back_text = NULL
  WHERE node_id = '1.4' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = '425ce5083316aea89dafb1ffe49ca168';
UPDATE public.node_cards SET title = $v$Decir que lo ves ocupado no es pedir permiso$v$, body = $v$Mira la diferencia:

"Ya veo que lo agarré en plena carga. Qué bueno, eso quiere decir que hay trabajo." Aquí le dices que lo ves ocupado y sigues con la misma energía.

"Perdón, veo que está ocupado, ¿quiere que venga después?" Aquí le estás dando la opción de que te vayas. Y la va a tomar.$v$, flip_back_text = NULL
  WHERE node_id = '1.4' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = '92f37bf3e06cd18bb4cfef6a832326ea';
UPDATE public.node_cards SET title = $v$Comentario o ice breaker: la diferencia$v$, body = $v$Las dos frases dicen lo mismo:

"Veo que hay mucho movimiento." Es cierto, pero no pasa nada. El cliente dice "sí" y sigue igual de serio.

"Ya se le juntaron todos hoy, ¿verdad?" Es lo mismo, pero con un toque de humor. Y el cliente te contesta con una sonrisa.

Eso es un ice breaker (romper el hielo): un comentario ligero que hace sonreír al cliente.$v$, flip_back_text = NULL
  WHERE node_id = '1.5' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = '508e5d663b8dfee47a5d950a018625fb';
UPDATE public.node_cards SET title = $v$¿De qué puede ser el ice breaker?$v$, body = $v$De lo que sea, mientras sea verdad:

De la persona: algo que notas de ella, como lo que trae puesto o cómo trata a su gente.

Del lugar o del momento: el movimiento, el clima, la hora.

De algo que tengan en común: el equipo de fútbol, el barrio, un conocido.

Lo único que no funciona es lo inventado.$v$, flip_back_text = NULL
  WHERE node_id = '1.5' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = 'dbe143883554bd01c5c4a69a262c6b48';
UPDATE public.node_cards SET title = $v$No exageres los halagos$v$, body = $v$Hay vendedores que quieren caer bien y se pasan: halagos exagerados, chistes que no vienen al caso, confianza que nadie les dio.

El cliente lo nota de inmediato y se cierra más que antes.

Un comentario pequeño y verdadero vale más que un halago grande e inventado.$v$, flip_back_text = NULL
  WHERE node_id = '1.5' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = '37488d2efe6ae4cf5422702ddacf987b';
UPDATE public.node_cards SET title = $v$El reto: todo junto$v$, body = $v$Este cliente ya ha visto pasar a muchos vendedores. No es grosero, pero no regala su tiempo.

Contesta en tres palabras. No pregunta. Sigue en lo suyo.

Para que se abra, necesitas las tres cosas juntas: llegas seguro y sin pedir permiso, haces un comentario ligero y verdadero, y terminas con una pregunta que no se conteste con sí o no.

Si te pregunta quién eres, lo lograste. Esa pregunta es la entrada al siguiente paso.$v$, flip_back_text = NULL
  WHERE node_id = '1.6' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = '76f2667f7274e438b60caf716f706329';
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '1.0', 7, 'concept', $v$Sirve con cualquier cliente$v$, $v$Estos seis pasos sirven con cualquier cliente: uno que visitas por primera vez o uno que te compra desde hace años. Y sirven vendas lo que vendas.

Los pasos son siempre los mismos. Lo que cambia es cómo los haces con cada cliente.

Por ejemplo: con un cliente nuevo comentas algo que notaste en su negocio. Con uno de años, le preguntas por algo que te platicó la vez pasada.

Los seis pasos son la base. Encima pones tu forma de ser y lo que sabes de cada cliente.$v$, NULL, card_content_type, audience, skill_ids FROM public.node_cards
  WHERE node_id = '1.0' AND card_order = 6 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '1.0' AND card_order = 7);

-- 2. Quizzes
UPDATE public.node_quiz_questions SET question_text = $v$Un vendedor llega, saluda y de inmediato le explica al cliente lo que vende. ¿Qué se saltó?$v$, option_a = $v$La historia breve y el descubrimiento.$v$, option_b = $v$Nada: ir al grano ahorra tiempo.$v$, option_c = $v$El cierre.$v$, correct_option = 'A', explanation_correct = $v$Exacto. Antes de presentar, el cliente tiene que saber quién eres y tú tienes que saber qué necesita. Si no, le hablas de algo que no pidió.$v$, explanation_wrong = $v$Ir al grano parece rápido, pero no funciona. Antes de presentar, el cliente tiene que saber quién eres (paso 2) y tú tienes que saber qué necesita (paso 3).$v$
  WHERE node_id = '1.0' AND question_order = 1 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = 'b42b2643f12cdb7188bef912940451f2';
UPDATE public.node_quiz_questions SET question_text = $v$Vas a la mitad de la visita y el encargado se va a atender a otro cliente. Cuando regresa, ¿qué haces?$v$, option_a = $v$Empiezo otra vez desde el saludo.$v$, option_b = $v$Me despido: esa venta ya no va.$v$, option_c = $v$Retomo la plática donde iba.$v$, correct_option = 'C', explanation_correct = $v$Así es. Lo que ya platicaron no se pierde. Retomas donde ibas y sigues.$v$, explanation_wrong = $v$No hace falta empezar de nuevo ni irte. Lo que ya platicaron se queda. Retomas donde ibas y sigues.$v$
  WHERE node_id = '1.0' AND question_order = 2 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = 'f0ffe2bedbd8d81e17815079e392636e';
UPDATE public.node_quiz_questions SET question_text = $v$Fuiste a una visita y el cliente te dijo que no quería comprar nada. ¿Qué te conviene preguntarte para mejorar?$v$, option_a = $v$¿Qué se me olvidó decir?$v$, option_b = $v$¿En qué paso se atoró la plática?$v$, option_c = $v$¿Será que no era mi día?$v$, correct_option = 'B', explanation_correct = $v$Exacto. Si sabes en qué paso se atoró, sabes qué corregir en la siguiente visita.$v$, explanation_wrong = $v$Esas preguntas no te ayudan a mejorar. Pregúntate en qué paso se atoró la plática: eso sí lo puedes corregir en la siguiente visita.$v$
  WHERE node_id = '1.0' AND question_order = 3 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '45214aa45eaec8ddcfef92c24ee013d4';
UPDATE public.node_quiz_questions SET question_text = $v$El cliente te recibe tranquilo, sin mucha energía. ¿Cómo llegas tú?$v$, option_a = $v$Gritando de emoción, para animarlo.$v$, option_b = $v$Igual de apagado que él, para no incomodarlo.$v$, option_c = $v$Un poquito más animado que él.$v$, correct_option = 'C', explanation_correct = $v$Exacto. Un 10% arriba de él lo contagia sin incomodarlo.$v$, explanation_wrong = $v$Ni gritando ni apagado. Ponte un poquito arriba de su energía, un 10% más: así lo contagias sin incomodarlo.$v$
  WHERE node_id = '1.1' AND question_order = 1 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = 'cb06b38eb6616cc8889e511d85635658';
UPDATE public.node_quiz_questions SET question_text = $v$¿Qué quieren decir las tres letras de SCE?$v$, option_a = $v$Sonrisa, contacto visual y entusiasmo.$v$, option_b = $v$Saludo, cortesía y empatía.$v$, option_c = $v$Seguridad, confianza y energía.$v$, correct_option = 'A', explanation_correct = $v$Así es: sonrisa, contacto visual y entusiasmo. Las tres te ayudan a causar una buena primera impresión.$v$, explanation_wrong = $v$Son sonrisa, contacto visual y entusiasmo. Las tres te ayudan a causar una buena primera impresión.$v$
  WHERE node_id = '1.1' AND question_order = 2 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '2875fba2d02a6e8878651624e72f9ba9';
UPDATE public.node_quiz_questions SET question_text = $v$¿Por qué Closer no te califica la sonrisa ni el contacto visual?$v$, option_a = $v$Porque no son importantes.$v$, option_b = $v$Porque solo importan en las ventas por teléfono.$v$, option_c = $v$Porque no puede verlos.$v$, correct_option = 'C', explanation_correct = $v$Así es. Son muy importantes, pero Closer no puede verte. Por eso te los enseña y confía en que los haces en cada visita.$v$, explanation_wrong = $v$Al contrario: son muy importantes. Pero Closer no puede verte, así que no puede calificarlos. Esa parte la practicas en tus visitas.$v$
  WHERE node_id = '1.1' AND question_order = 3 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '57e4cf6370a04b512e1beb22ab759f6b';
UPDATE public.node_quiz_questions SET question_text = $v$¿Por qué no conviene preguntar "¿tiene un minutito?", aunque suene educado?$v$, option_a = $v$Porque le das la opción de decir que no, y es la más fácil.$v$, option_b = $v$Porque es muy informal.$v$, option_c = $v$Porque un minuto no alcanza para nada.$v$, correct_option = 'A', explanation_correct = $v$Exacto. Le diste dos opciones, sí o no, y "no" no le cuesta nada. No es grosero: tomó la opción que tú le diste.$v$, explanation_wrong = $v$No es por el tono ni por el tiempo. Le diste dos opciones, sí o no, y "no" es la más fácil.$v$
  WHERE node_id = '1.3' AND question_order = 1 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '3f09750bb8d585565468fdc6701ba4da';
UPDATE public.node_quiz_questions SET question_text = $v$¿Por qué los gasistas de Londres entraban sin pedir permiso?$v$, option_a = $v$Tenían un permiso especial.$v$, option_b = $v$Sabían que iban a ayudar, y por eso llegaban seguros.$v$, option_c = $v$Siempre iban acompañados.$v$, correct_option = 'B', explanation_correct = $v$Así es. Sabían que traían algo que le servía a esa familia, y llegaban seguros.$v$, explanation_wrong = $v$No era un permiso ni que fueran acompañados. Sabían que iban a ayudar, y por eso llegaban seguros.$v$
  WHERE node_id = '1.3' AND question_order = 2 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = 'b0e990883789cb7c6dceb48a253fd2c8';
UPDATE public.node_quiz_questions SET question_text = $v$Closer te enseña la sonrisa y el contacto visual, pero en la práctica no te los califica. ¿Qué haces?$v$, option_a = $v$Los dejo: si no se califican, no cuentan.$v$, option_b = $v$Escribo "sonrío" en mi respuesta para que se tomen en cuenta.$v$, option_c = $v$Los practico igual en cada visita, porque en la calle cuentan mucho.$v$, correct_option = 'C', explanation_correct = $v$Exacto. Closer no los puede ver, pero en la calle cuentan mucho. Practícalos en cada visita.$v$, explanation_wrong = $v$Closer no los puede ver, pero en la calle cuentan mucho. Practícalos en cada visita, aunque aquí no se califiquen.$v$
  WHERE node_id = '1.3' AND question_order = 3 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '4a1480aa54690a01c53ef9a07cc127a9';

-- 3. Chequeo: cada nodo del Mundo 1 tiene que quedar exactamente así.
DO $chk$ DECLARE r record; BEGIN
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '1.0') IS DISTINCT FROM '0edee1b197e16c2764761835bc28458a' THEN RAISE EXCEPTION 'las tarjetas del 1.0 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '1.1') IS DISTINCT FROM '0843f809e9902740443468bb1cbdaa07' THEN RAISE EXCEPTION 'las tarjetas del 1.1 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '1.2') IS DISTINCT FROM 'f624439a7ea02c47ba105c3a23da441d' THEN RAISE EXCEPTION 'las tarjetas del 1.2 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '1.3') IS DISTINCT FROM 'dc20529ee3667437bbb2da0ae0e6fa8b' THEN RAISE EXCEPTION 'las tarjetas del 1.3 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '1.4') IS DISTINCT FROM 'b892bca98d86f21fe5a0ecf88dd42372' THEN RAISE EXCEPTION 'las tarjetas del 1.4 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '1.5') IS DISTINCT FROM 'a0c09cdaf273a5363d5b79cfec86460d' THEN RAISE EXCEPTION 'las tarjetas del 1.5 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '1.6') IS DISTINCT FROM '55cf55b1cb69650cf37ee6fece138329' THEN RAISE EXCEPTION 'las tarjetas del 1.6 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order)) FROM public.node_quiz_questions WHERE node_id = '1.0') IS DISTINCT FROM '8c2f017997b5b5143906efedc6c5ce6c' THEN RAISE EXCEPTION 'el quiz del 1.0 no quedó'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order)) FROM public.node_quiz_questions WHERE node_id = '1.1') IS DISTINCT FROM 'f3a31cb26bfcd2e01b76287a1f18150d' THEN RAISE EXCEPTION 'el quiz del 1.1 no quedó'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order)) FROM public.node_quiz_questions WHERE node_id = '1.3') IS DISTINCT FROM '118017d6e006f3af1e000ac248953b71' THEN RAISE EXCEPTION 'el quiz del 1.3 no quedó'; END IF;
END $chk$;
