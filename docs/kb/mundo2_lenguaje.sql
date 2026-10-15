-- Mensaje 89 · Mundo 2 en lenguaje Closer (aprobado por Emilio, 15-oct-2026), el Cerebro con el interés genuino y los dos no seguidos en la puerta, y la falla se_disculpa_o_se_va del 2.7 y el 2.10.
-- Cada fila cambia solo si sigue igual que en los snapshots. Los chequeos del final abortan si algo no quedó.

-- 1. Tarjetas del Mundo 2
UPDATE public.node_cards SET title = $v$Ahora sí: quién eres$v$, body = $v$Tu introducción funcionó: el cliente ya te está poniendo atención.

En ese momento se está preguntando dos cosas: ¿quién es? y ¿a qué viene?

La historia breve le contesta las dos, rápido. Así deja de preguntárselo y te escucha con más atención.$v$, flip_back_text = NULL
  WHERE node_id = '2.0' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = 'cdb7c4fd594cefe237029356ee968e57';
UPDATE public.node_cards SET title = $v$KISS: mantenlo breve y simple$v$, body = $v$KISS viene del inglés: Keep It Short and Simple. Quiere decir: mantenlo breve y simple.

Lo contrario es KILL: Keep It Long and Lengthy. Mantenlo largo y pesado.

Tu historia breve dice quién eres y a qué vienes en dos o tres frases. No es la historia de tu empresa ni la lista de lo que vendes.

Siempre recuerda KISS: mantenlo breve y simple. Hablar de más hace que el cliente pierda el interés o se distraiga.$v$, flip_back_text = NULL
  WHERE node_id = '2.0' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = 'ccf022fe96c3c1e0d3310eaf680e66e2';
UPDATE public.node_cards SET title = $v$Las tres partes de tu historia breve$v$, body = $v$1. Quién eres: tu nombre y de dónde vienes.
2. A qué vienes: el motivo de tu visita, sin hablar de producto.
3. Una pregunta: para que el cliente te platique.

La pregunta es importante. Le pasa la palabra al cliente y la plática sigue.$v$, flip_back_text = NULL
  WHERE node_id = '2.0' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = '2c3def7b8114c283278116dbc3c64958';
UPDATE public.node_cards SET title = $v$Breve funciona mejor$v$, body = $v$Cuando por fin tienes la atención del cliente, dan ganas de contarle todo: los años de la empresa, los clientes que tienen, todo lo que manejas.

Pero cada frase de más le quita atención. Lo que a ti te suena impresionante, a él le suena a discurso.

Breve no es la versión incompleta. Es la que funciona.$v$, flip_back_text = NULL
  WHERE node_id = '2.0' AND card_order = 4 AND md5(concat_ws('|', title, body, flip_back_text)) = '5faaef0f6d529c475f0581a934ef4a39';
UPDATE public.node_cards SET title = $v$Después de tu historia, preguntas$v$, body = $v$Terminas de decir quién eres. ¿Ahora qué?

No toca explicar más. Toca preguntar.

Tu historia breve sirve para que el cliente esté listo para contestar tus preguntas. Así empiezas a conocer su negocio.$v$, flip_back_text = NULL
  WHERE node_id = '2.0' AND card_order = 5 AND md5(concat_ws('|', title, body, flip_back_text)) = '27f336a66d2f4fd8e26fa5bfce684eca';
UPDATE public.node_cards SET title = $v$Ahora con tus palabras$v$, body = $v$El cliente te va a preguntar quién eres. Tienes unos quince segundos.

1. Quién eres: tu nombre y de dónde vienes.
2. A qué vienes: el motivo de tu visita.
3. Una pregunta: para que te platique.

Tres frases bastan.$v$, flip_back_text = NULL
  WHERE node_id = '2.1' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = 'c321a0c0def8a37cf825eeea33182514';
UPDATE public.node_cards SET title = NULL, body = $v$Buenos días, mi nombre es Carlos y represento a una empresa con más de veinticinco años en el mercado, líderes en la región. Manejamos una línea completa con certificaciones internacionales y trabajamos con los principales negocios del estado…$v$, flip_back_text = $v$Todo es cierto, pero no sirve. En la segunda frase el cliente ya dejó de escuchar, y Carlos todavía no dice a qué viene.

El cliente no escuchó una presentación: escuchó un discurso.$v$
  WHERE node_id = '2.1' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = 'f923aa4a803542799d8b255abad51213';
UPDATE public.node_cards SET title = NULL, body = $v$Soy Carlos, de Distribuidora del Norte. Andamos visitando los negocios de esta zona y quise conocer el suyo. Cuénteme, ¿cuánto tiempo lleva con él?$v$, flip_back_text = $v$Tres frases. Dice quién es, a qué viene sin hablar de producto, y termina con una pregunta sobre el negocio del cliente.

El cliente ya sabe con quién habla, y tiene algo que contestar.$v$
  WHERE node_id = '2.1' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = 'd95d6984726115ac6b5c15519a1767a3';
UPDATE public.node_cards SET title = $v$Un comentario se queda ahí$v$, body = $v$"Se ve que le va muy bien aquí."

¿Qué te puede contestar el cliente? "Gracias." Y ya.

La plática se detiene y se queda esperando a que tú digas otra cosa.$v$, flip_back_text = NULL
  WHERE node_id = '2.2' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = '0db05476357a3d3647861c25e1386863';
UPDATE public.node_cards SET title = $v$Una pregunta mueve la plática$v$, body = $v$"Se ve que le va muy bien aquí. ¿Cuánto tiempo lleva con el negocio?"

Es el mismo comentario, con una pregunta al final. Ahora el cliente tiene algo que contestar, y te platica.

Por eso cada vez que hablas, terminas con una pregunta.$v$, flip_back_text = NULL
  WHERE node_id = '2.2' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = '2373c151202105db832f8ffa22f39a0b';
UPDATE public.node_cards SET title = $v$Tú llevas la plática$v$, body = $v$El cliente está en lo suyo: atendiendo, acomodando, haciendo cuentas. Él no va a mover la plática.

La mueves tú. Y la forma de moverla es terminar con una pregunta: así le pasas la palabra, y tú decides hacia dónde va la plática.$v$, flip_back_text = NULL
  WHERE node_id = '2.2' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = '197160bdedd31119458394de3e8411be';
UPDATE public.node_cards SET title = $v$A quién le compra la gente$v$, body = $v$Dos vendedores ofrecen lo mismo, al mismo precio. Uno le cae bien al cliente y el otro no.

¿A cuál le compra?

Cuando dos opciones se parecen, el cliente decide por la persona.$v$, flip_back_text = NULL
  WHERE node_id = '2.3' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = 'a4bf0288c3dc37441bc91d632775d935';
UPDATE public.node_cards SET title = $v$Tú eres parte de lo que vendes$v$, body = $v$Al principio, el cliente no puede saber si tu producto es bueno. No lo ha probado, no conoce tu empresa y no sabe si le van a cumplir.

Lo que sí puede ver desde el primer momento eres tú.

Por eso tú eres tanto o más el producto que lo que vendes.$v$, flip_back_text = NULL
  WHERE node_id = '2.3' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = '9702308154a293264ce17397ef3b89aa';
UPDATE public.node_cards SET title = $v$CPR: crear relaciones personales$v$, body = $v$CPR viene del inglés: Create Personal Relations. Quiere decir: crear relaciones personales.

El CPR no es un paso. No tiene un lugar en el mapa.

Lo haces durante toda la plática, desde que llegas hasta que te vas.$v$, flip_back_text = NULL
  WHERE node_id = '2.3' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = '5fdbf9ec68d3da2ec5390f2d371697e7';
UPDATE public.node_cards SET title = $v$Con confianza, te cuentan$v$, body = $v$En el siguiente mundo vas a aprender a hacer preguntas sobre el negocio del cliente: qué le funciona y qué le falla.

Esas preguntas funcionan cuando el cliente te tiene confianza. A un desconocido nadie le cuenta sus problemas. A alguien que le cae bien, sí.

Por eso el CPR es tan importante: hace que el cliente te conteste de verdad.$v$, flip_back_text = NULL
  WHERE node_id = '2.3' AND card_order = 4 AND md5(concat_ws('|', title, body, flip_back_text)) = 'db139dffb392cd250c77ce190af9ac75';
UPDATE public.node_cards SET title = $v$¿De qué le hablo?$v$, body = $v$Ya sabes que tienes que crear relación con el cliente. Llega el momento y no sabes de qué hablarle.

Se te ocurre el clima… y ya no sabes qué más.

Para eso existen cinco temas. Se llaman FORMS.$v$, flip_back_text = NULL
  WHERE node_id = '2.4' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = '045408484b0a7de247a6d923fa0bad99';
UPDATE public.node_cards SET title = $v$FORMS: los cinco temas$v$, body = $v$FORMS viene del inglés, una letra por tema:

F: Family (familia)
O: Occupation (ocupación)
R: Recreation (diversión, lo que hace en su tiempo libre)
M: Motivation (motivación)
S: Sports (deportes)

Con cualquier persona, siempre hay al menos uno de los cinco del que pueden platicar.$v$, flip_back_text = NULL
  WHERE node_id = '2.4' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = '94215388011f49395d00e21e5ec76433';
UPDATE public.node_cards SET title = $v$Los cinco, con ejemplos$v$, body = $v$Familia: la foto en el mostrador, el hijo que le ayuda en el negocio.

Ocupación: cuánto tiempo lleva, cómo empezó, a qué se dedicaba antes.

Diversión: qué hace cuando no está trabajando.

Motivación: por qué puso el negocio, qué quiere lograr.

Deportes: su equipo, el partido del fin de semana.

No necesitas los cinco. Con uno bien platicado basta.$v$, flip_back_text = NULL
  WHERE node_id = '2.4' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = 'b93ef33b45d282d284db2801ea15dc51';
UPDATE public.node_cards SET title = $v$Interésate en lo que le gusta$v$, body = $v$Interés genuino quiere decir interés de verdad. Un interés fingido se nota.

Pero no necesitas que te guste lo mismo que al cliente. Siempre te puedes interesar en lo que a él le emociona.

Por ejemplo: "Yo nunca le he entendido al ballet. Cuénteme, ¿qué es lo que le gusta?".

No le mientes, y lo pones a platicar de algo que le gusta.$v$, flip_back_text = NULL
  WHERE node_id = '2.4' AND card_order = 4 AND md5(concat_ws('|', title, body, flip_back_text)) = 'ce94e4240f88bdc02b96feb63a6dcc12';
UPDATE public.node_cards SET title = $v$Busca dónde se juntan sus intereses y los tuyos$v$, body = $v$Piensa en tu pareja. Si a ella le gusta el arte, la escuchas platicar de arte porque a ella le interesa. Y con el tiempo, a ti también te interesa más.

Con el cliente es igual. No siempre van a tener cosas en común, y está bien.

Busca el punto donde sus intereses y los tuyos se juntan. Eso es lo que hace que tu interés sea de verdad.$v$, flip_back_text = NULL
  WHERE node_id = '2.4' AND card_order = 5 AND md5(concat_ws('|', title, body, flip_back_text)) = '9d5412aab69cfd2b895916d943c229e5';
UPDATE public.node_cards SET title = $v$Te sales de la línea a propósito$v$, body = $v$¿Te acuerdas de la línea recta? Hay cosas que te sacan de ella.

Platicar de algo personal es una salida que tú decides. Dejas de avanzar un momento, platicas de lo personal y regresas a donde ibas.

Salirte es fácil. Lo que vas a practicar aquí es el regreso.$v$, flip_back_text = NULL
  WHERE node_id = '2.5' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = '9f30518656de2e328a8564581b2903d5';
UPDATE public.node_cards SET title = $v$Uno o dos intercambios, y regresas$v$, body = $v$Platicas uno o dos intercambios de lo personal y regresas al negocio.

Más adelante puedes volver a salirte. Pero siempre avanzando.

Hay dos errores:
- No salirte nunca. No hay confianza, y el cliente no te va a contar nada.
- Salirte y no regresar. La plática se queda en lo personal y no avanza.$v$, flip_back_text = NULL
  WHERE node_id = '2.5' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = 'b876e18e8eece52d7e1e87ed9cecdae6';
UPDATE public.node_cards SET title = $v$El cliente no te va a regresar$v$, body = $v$Cuando la plática está agradable, el cliente está a gusto. Nadie corta una plática agradable para hablar de negocios.

Él no te va a regresar al tema. El que regresa eres tú.

Si no lo haces, se te va la tarde platicando con un cliente muy contento que no te compra nada.$v$, flip_back_text = NULL
  WHERE node_id = '2.5' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = '3d80363186cb914d6586d0114170bb5c';
UPDATE public.node_cards SET title = $v$El primer "no"$v$, body = $v$Llegas, saludas bien, todo va bien. Y antes de que digas a qué vienes, el cliente te dice: "Ahorita no, gracias".

¿A qué te dice que no? Todavía no sabe quién eres ni a qué vienes.

No te está diciendo que no a ti ni a lo que traes. Lo dice por costumbre.$v$, flip_back_text = NULL
  WHERE node_id = '2.6' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = '9b613bffe603a586283883c03801302d';
UPDATE public.node_cards SET title = $v$El bloqueo: un "no" por costumbre$v$, body = $v$Hay dos tipos de "no": el bloqueo y la objeción.

El bloqueo llega antes de que el cliente sepa a qué vienes:
"Ahorita ando ocupado."
"No me interesa."
"No estoy comprando nada."
"Ya tengo con quién."

Se lo dice a cualquiera que llega, todos los días. No lo pensó.$v$, flip_back_text = NULL
  WHERE node_id = '2.6' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = '3b5302a7a8e1cbf2957f26edaf35e0f7';
UPDATE public.node_cards SET title = $v$La objeción: un "no" pensado$v$, body = $v$La objeción llega después de que el cliente entendió lo que le ofreces:
"Está caro."
"Ya tengo proveedor y me cumple."
"Lo tengo que consultar."

Aquí el cliente sí lo pensó. Las objeciones las vas a aprender a manejar en el mundo del cierre.

Fíjate: "ya tengo proveedor" en la puerta, antes de saber a qué vienes, es un bloqueo. Después de escucharte, es una objeción. Lo que cuenta es cuándo llega.$v$, flip_back_text = NULL
  WHERE node_id = '2.6' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = '19478498f86585df82384d3333396b6a';
UPDATE public.node_cards SET title = $v$Por qué importa la diferencia$v$, body = $v$Si discutes un bloqueo, el cliente tiene que defenderlo. Y al defenderlo, se lo cree. Lo que era un "no" por costumbre se vuelve un "no" de verdad.

Y si ignoras una objeción, el cliente siente que no lo escuchaste, después de que sí lo pensó.

Por eso a cada uno se le contesta distinto.$v$, flip_back_text = NULL
  WHERE node_id = '2.6' AND card_order = 4 AND md5(concat_ws('|', title, body, flip_back_text)) = '7ecf3d8bffedd38e7f97dd4041eb0ec4';
UPDATE public.node_cards SET title = $v$AIR: cómo pasar un bloqueo$v$, body = $v$AIR viene del inglés: Agree, Ignore, Resume.

A: Acepta. "Entiendo", "claro que sí".
I: Ignora, en el sentido de que no lo discutes ni te justificas.
R: Retoma. Sigues con lo tuyo, con naturalidad.

Funciona porque nadie defiende un "no" que nadie le está peleando.$v$, flip_back_text = NULL
  WHERE node_id = '2.6' AND card_order = 5 AND md5(concat_ws('|', title, body, flip_back_text)) = 'b63a2472ca4133ac8ddad5842d3241fd';
UPDATE public.node_cards SET title = $v$Los tres pasos de AIR$v$, body = $v$Acepta: "entiendo", "claro que sí", "por supuesto". De buena manera.

Ignora: no lo discutes, no te justificas, no tratas de convencerlo.

Retoma: sigues con tu plática, con naturalidad.

Los tres caben en una sola frase.$v$, flip_back_text = NULL
  WHERE node_id = '2.7' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = '57970bc775bd74b1c178f328a8bde0dc';
UPDATE public.node_cards SET title = $v$Acepta y sigue, en la misma frase$v$, body = $v$Casi todos aceptan bien y casi todos logran no discutir.

El error está en lo tercero: se quedan callados esperando, o vuelven a pedir permiso: "Entiendo, claro… ¿entonces me permite un momentito?".

Aceptas y sigues, en la misma frase.$v$, flip_back_text = NULL
  WHERE node_id = '2.7' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = '9a8a78a2105662979d1c459ba0f3a65b';
UPDATE public.node_cards SET title = NULL, body = $v$Ah, pero es que solo le voy a quitar dos minutos, y de verdad esto sí le va a servir mucho. Déjeme le explico rápido…$v$, flip_back_text = $v$Discutió el bloqueo. El cliente dijo "ando ocupado" sin pensarlo. Ahora tiene que defenderlo, porque nadie se deja convencer de que no está ocupado.

Lo que era un "no" por costumbre se volvió un "no" de verdad.$v$
  WHERE node_id = '2.7' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = '65252354c47dddd4a8e8b5c93ef7c5c4';
UPDATE public.node_cards SET title = NULL, body = $v$Claro que sí, entiendo. Oiga, y dígame una cosa, ¿cuánto tiempo lleva usted aquí?$v$, flip_back_text = $v$Los tres pasos en una frase: acepta lo que le dijo, no lo discute y sigue con una pregunta.

No hay "pero", no hay excusas y no se queda esperando permiso.$v$
  WHERE node_id = '2.7' AND card_order = 4 AND md5(concat_ws('|', title, body, flip_back_text)) = '451362b36c3aff09300d63ae790849fc';
UPDATE public.node_cards SET title = $v$Cuando el cliente ya trae una mala experiencia$v$, body = $v$A veces el cliente ya trae una historia: "Ya me fallaron con las entregas". "Me cambiaron el precio". "El vendedor dejó de venir".

Eso no es un bloqueo. El bloqueo se dice por costumbre, y esto tiene una razón.

Por eso no se pasa con AIR: se escucha en serio.$v$, flip_back_text = NULL
  WHERE node_id = '2.8' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = 'b9ece4606fa51ea89cb2dd283a7863b7';
UPDATE public.node_cards SET title = $v$Escúchalo, dile a qué vienes y pregunta$v$, body = $v$1. Lo aceptas en serio, sin pelearlo y sin hacerlo menos.
2. Le dices el motivo real de tu visita: qué cambió, o por qué te mandaron con él.
3. Regresas a preguntar por su negocio.

"Entiendo perfecto lo que me dice. De hecho, justo por eso me mandaron con usted: desde hace unos meses cambiamos cómo surtimos esta zona, y varios negocios que tenían el mismo problema ya regresaron. Pero primero tengo que ver si lo podemos atender. ¿Con quién está trabajando ahorita?"$v$, flip_back_text = NULL
  WHERE node_id = '2.8' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = 'cda0ca89307ff6d3d246711bca13375e';
UPDATE public.node_cards SET title = $v$Tres errores que debes evitar$v$, body = $v$Ignorarla: si sigues como si nada, el cliente siente que tenía razón.

Defenderte: "eso no fue culpa nuestra". Ganas la discusión y pierdes al cliente.

Prometer sin pruebas: "perdón, pero yo sí soy diferente" suena a excusa. Y si le dices que algo cambió, tiene que ser cierto: si te pregunta "¿cómo qué?", tienes que poder contestarle.$v$, flip_back_text = NULL
  WHERE node_id = '2.8' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = '5b276ad1779e962803c05538c5dd87a3';
UPDATE public.node_cards SET title = $v$Después de resolver, sigue$v$, body = $v$El cliente te puso un freno y lo resolviste. ¿Ahora qué?

Muchos vendedores se quedan callados, esperando a que el cliente les dé permiso de seguir.

Ese momento es clave: lo que hagas ahí decide si la plática sigue.$v$, flip_back_text = NULL
  WHERE node_id = '2.9' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = 'e3086f516f9a75e03b83dc8ce00613eb';
UPDATE public.node_cards SET title = $v$Si te quedas callado, el cliente cierra la plática$v$, body = $v$Si te quedas callado, el cliente hace lo más fácil: despedirse con amabilidad. "Bueno, pues ahí luego me dice. Gracias, eh."

No te está diciendo que no. Le dejaste la plática a él, y tomó la salida más fácil.

Por eso: resuelves y sigues, en la misma frase, sin pausa.$v$, flip_back_text = NULL
  WHERE node_id = '2.9' AND card_order = 2 AND md5(concat_ws('|', title, body, flip_back_text)) = 'c68e7be635e11c76c024a1a2f6c4738c';
UPDATE public.node_cards SET title = $v$No esperes permiso para seguir$v$, body = $v$No necesitas permiso para seguir una plática que ya está pasando.

Si preguntas "¿puedo seguir?", le das al cliente la opción de decir que no.

Sigue avanzando hasta que el cliente te detenga de verdad. Y cuando te detenga, lo resuelves y sigues otra vez.$v$, flip_back_text = NULL
  WHERE node_id = '2.9' AND card_order = 3 AND md5(concat_ws('|', title, body, flip_back_text)) = 'fcec5494c4e1cc4986ab75b518fdfac2';
UPDATE public.node_cards SET title = $v$El reto: todo junto$v$, body = $v$Este cliente te pone un bloqueo en la primera frase. No es grosero: se lo dice a todos los que llegan.

Usa todo lo que aprendiste en este mundo: pasa el bloqueo con AIR, di quién eres en tres frases, platica de algo personal y regresa al negocio, y no sueltes la plática.

Si te pregunta "¿en qué le puedo ayudar?", lo lograste. Esa pregunta es la entrada al siguiente paso.$v$, flip_back_text = NULL
  WHERE node_id = '2.10' AND card_order = 1 AND md5(concat_ws('|', title, body, flip_back_text)) = 'bb41bf65911cd1192b630482a9f4101f';
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '2.2', 4, 'concept', $v$Una pregunta a la vez$v$, $v$Haz una pregunta y escucha la respuesta. La siguiente pregunta sale de lo que te contestó.

Si haces tres preguntas seguidas, se siente como interrogatorio.

Y busca preguntas que lo pongan a platicar. "¿Le va bien?" se contesta con un "sí". "¿Cómo le ha ido este año?" lo pone a contarte.$v$, NULL, card_content_type, audience, skill_ids FROM public.node_cards
  WHERE node_id = '2.2' AND card_order = 3 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '2.2' AND card_order = 4);
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '2.3', 5, 'concept', $v$Con confianza, te creen$v$, $v$Imagina que un amigo te dice: "Ese taller es bueno, llévale tu carro". Le crees.

Ahora imagina que te lo dice el dueño del taller. Ya no le crees igual, porque él gana si vas.

Es la misma frase, y no pesa lo mismo. Mientras más confianza te tiene el cliente, más te cree lo que le dices.$v$, NULL, card_content_type, audience, skill_ids FROM public.node_cards
  WHERE node_id = '2.3' AND card_order = 4 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '2.3' AND card_order = 5);
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '2.4', 6, 'concept', $v$No tienes que ser platicador$v$, $v$No necesitas una personalidad especial para crear relación con el cliente. Se aprende.

Pregúntale por lo que le gusta y escucha de verdad lo que te cuenta.

Y no olvides a qué vienes: en el siguiente nodo practicas cómo regresar al negocio.$v$, NULL, card_content_type, audience, skill_ids FROM public.node_cards
  WHERE node_id = '2.4' AND card_order = 5 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '2.4' AND card_order = 6);
INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text, card_content_type, audience, skill_ids)
  SELECT '2.7', 5, 'concept', $v$Dos "no" seguidos$v$, $v$A veces haces AIR y el cliente te repite el bloqueo: "De verdad, ahorita no puedo".

Ya son dos "no" seguidos. Ahí lo mejor es quedar de regresar en otro momento: "¿Le queda mejor que pase el jueves o el viernes?".

Si sigues insistiendo, ya no es seguridad: te vuelves terco.

Tienen que ser seguidos. Si el cliente te dice que no, lo pasas con AIR y la plática avanza, ese "no" ya quedó atrás.$v$, NULL, card_content_type, audience, skill_ids FROM public.node_cards
  WHERE node_id = '2.7' AND card_order = 4 AND NOT EXISTS (SELECT 1 FROM public.node_cards WHERE node_id = '2.7' AND card_order = 5);

-- 2. Quiz del Mundo 2
UPDATE public.node_quiz_questions SET question_text = $v$El cliente te pregunta quién eres. ¿Cuál respuesta va con KISS?$v$, option_a = $v$Le cuentas la historia de tu empresa para que te tome en serio.$v$, option_b = $v$Le das la lista de todo lo que manejas, por si algo le interesa.$v$, option_c = $v$Le dices tu nombre, de dónde vienes y a qué vienes, en dos o tres frases.$v$, correct_option = 'C', explanation_correct = $v$Exacto. Breve y simple. Hablar de más hace que el cliente pierda el interés.$v$, explanation_wrong = $v$KISS es mantenlo breve y simple. La historia de tu empresa y la lista de productos hacen que el cliente pierda el interés. Basta con quién eres y a qué vienes, en dos o tres frases.$v$
  WHERE node_id = '2.0' AND question_order = 1 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = 'db668c9816640f37b5a62f25f362590c';
UPDATE public.node_quiz_questions SET question_text = $v$Terminas tu historia breve. ¿Qué sigue?$v$, option_a = $v$Explicar con más detalle lo que ofreces, ya que tienes su atención.$v$, option_b = $v$Hacerle una pregunta sobre su negocio.$v$, option_c = $v$Esperar a que el cliente diga algo.$v$, correct_option = 'B', explanation_correct = $v$Así es. Tu historia breve sirve para que el cliente esté listo para contestar tus preguntas.$v$, explanation_wrong = $v$Explicar más le quita atención, y esperar deja la plática en el aire. Lo que sigue es preguntarle por su negocio.$v$
  WHERE node_id = '2.0' AND question_order = 2 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '89d481f596810141a91d100da1145561';
UPDATE public.node_quiz_questions SET question_text = $v$¿Por qué tú eres tanto o más el producto que lo que vendes?$v$, option_a = $v$Porque el cliente todavía no puede saber si tu producto es bueno, pero a ti sí te puede ver desde el primer momento.$v$, option_b = $v$Porque tu comisión depende de tu esfuerzo.$v$, option_c = $v$Porque todos los productos son iguales.$v$, correct_option = 'A', explanation_correct = $v$Correcto. No ha probado tu producto ni conoce tu empresa. Lo que sí puede ver desde el principio eres tú.$v$, explanation_wrong = $v$No es por la comisión ni porque los productos sean iguales. Al principio el cliente no puede saber si tu producto es bueno, pero a ti sí te ve desde el primer momento.$v$
  WHERE node_id = '2.3' AND question_order = 1 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '6b62fb869be6db92dbed2b6eb2ff11e4';
UPDATE public.node_quiz_questions SET question_text = $v$¿En qué parte de la plática se hace el CPR?$v$, option_a = $v$Justo después de la historia breve, y luego ya no.$v$, option_b = $v$Solo al final, cuando ya cerraste.$v$, option_c = $v$En toda la plática, desde que llegas hasta que te vas.$v$, correct_option = 'C', explanation_correct = $v$Así es. Los seis pasos van en orden, y el CPR va en todos.$v$, explanation_wrong = $v$El CPR no es un paso ni tiene un lugar en el mapa. Lo haces durante toda la plática.$v$
  WHERE node_id = '2.3' AND question_order = 2 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '3862d6cce4acd1e2f76fa113481b51e9';
UPDATE public.node_quiz_questions SET question_text = $v$En el mostrador hay una foto del cliente con su hijo, los dos con la playera de su equipo. ¿Por cuál tema de FORMS puedes empezar a platicar?$v$, option_a = $v$Motivación o diversión.$v$, option_b = $v$Familia o deportes.$v$, option_c = $v$Ocupación, porque es un negocio.$v$, correct_option = 'B', explanation_correct = $v$Exacto. La foto te abre dos temas: su familia y su equipo. Escoge el que de verdad te interese.$v$, explanation_wrong = $v$La foto te abre dos temas: su familia (el hijo) y los deportes (la playera del equipo). Escoge el que de verdad te interese.$v$
  WHERE node_id = '2.4' AND question_order = 1 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = 'e2777f4da7e84933c56f76f4a565cf1f';
UPDATE public.node_quiz_questions SET question_text = $v$Le preguntas a un cliente por su equipo de futbol y a ti el futbol no te interesa. ¿Qué haces?$v$, option_a = $v$Le pregunto qué le gusta de su equipo y escucho de verdad lo que me cuenta.$v$, option_b = $v$Le digo que yo también le voy a su equipo, para caerle bien.$v$, option_c = $v$Cambio de tema rápido, porque a mí no me interesa.$v$, correct_option = 'A', explanation_correct = $v$Exacto. No tiene que gustarte lo mismo. Te interesas en lo que a él le emociona, sin mentir.$v$, explanation_wrong = $v$Fingir que te gusta se nota, y cambiar de tema le dice que no te importa. Siempre te puedes interesar en lo que a él le emociona: pregúntale qué le gusta y escúchalo.$v$
  WHERE node_id = '2.4' AND question_order = 2 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '3c5532967e28cef1d7b7087d7e64ae49';
UPDATE public.node_quiz_questions SET question_text = $v$Un cliente te dice "no me interesa" antes de que le digas a qué vienes. ¿Qué es eso?$v$, option_a = $v$Una objeción: ya pensó tu oferta y no le gustó.$v$, option_b = $v$Una señal de que no es tu cliente.$v$, option_c = $v$Un bloqueo: lo dice por costumbre. Todavía no sabe a qué vienes.$v$, correct_option = 'C', explanation_correct = $v$Correcto. No puede decirle que no a algo que todavía no conoce. Se lo dice a cualquiera que llega.$v$, explanation_wrong = $v$Todavía no sabe a qué vienes, así que no pudo pensarlo. Es un bloqueo: lo dice por costumbre. Por eso no se discute.$v$
  WHERE node_id = '2.6' AND question_order = 1 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '40dfb131d44e306f128e3a58733ef0b3';
UPDATE public.node_quiz_questions SET question_text = $v$¿Qué pasa si discutes un bloqueo y tratas de convencer al cliente de que sí le interesa?$v$, option_a = $v$Que entiende tu punto y te da la oportunidad.$v$, option_b = $v$Que tiene que defender su "no", y al defenderlo se lo cree.$v$, option_c = $v$Nada, es normal insistir un poco.$v$, correct_option = 'B', explanation_correct = $v$Así es. Lo dijo sin pensar. Si lo peleas, lo tiene que defender, y se vuelve un "no" de verdad.$v$, explanation_wrong = $v$Al contrario. Lo dijo sin pensar, pero si lo peleas lo tiene que defender, y al defenderlo se lo cree.$v$
  WHERE node_id = '2.6' AND question_order = 2 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '4614835e7f9faf20d65409583f1a9e01';
UPDATE public.node_quiz_questions SET question_text = $v$Llegas y el cliente te dice: "Ahorita ando ocupado". ¿Cuál respuesta es AIR?$v$, option_a = $v$"Claro que sí, entiendo. Oiga, ¿y cuánto tiempo lleva con el negocio?"$v$, option_b = $v$"Solo le quito dos minutos, de verdad le va a servir."$v$, option_c = $v$"Perdón, ¿quiere que regrese otro día?"$v$, correct_option = 'A', explanation_correct = $v$Exacto. Acepta, no lo discute y retoma con una pregunta, todo en una frase.$v$, explanation_wrong = $v$La B discute el bloqueo y la C se rinde. AIR es aceptar, no discutir y retomar: "Claro que sí, entiendo" y sigues con una pregunta.$v$
  WHERE node_id = '2.6' AND question_order = 3 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = 'b922af66d6259c2ea1b3a6257ced30d8';
UPDATE public.node_quiz_questions SET question_text = $v$Ya le explicaste al cliente cómo trabajas, y te dice: "Ya tengo proveedor y la verdad me cumple bien". ¿Qué es eso?$v$, option_a = $v$Un bloqueo, porque es una frase que dicen muchos clientes.$v$, option_b = $v$Una objeción, porque llegó después de que te escuchó.$v$, option_c = $v$Una señal de que ya no hay nada que hacer.$v$, correct_option = 'B', explanation_correct = $v$Exacto. Lo dijo después de entender lo que ofreces: sí lo pensó. Lo que cuenta es cuándo llega.$v$, explanation_wrong = $v$La misma frase en la puerta, antes de saber a qué vienes, sería un bloqueo. Aquí llegó después de escucharte: es una objeción. Lo que cuenta es cuándo llega.$v$
  WHERE node_id = '2.6' AND question_order = 4 AND md5(concat_ws('|', question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong)) = '3f307da9c1ea0bd9350b983d23939a93';

-- 3. Cerebro: versión nueva con el interés genuino (FORMS) y los dos no seguidos en la puerta (AIR).
DO $c$
DECLARE v int;
BEGIN
  IF EXISTS (SELECT 1 FROM public.doctrina WHERE is_active AND body LIKE '%Dos no seguidos en la puerta%') THEN
    RAISE NOTICE 'El Cerebro ya tiene los cambios del 89: no se crea otra versión.'; RETURN;
  END IF;
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND strpos(body, $v$Si un tema no te interesa de verdad, busca otro de los cinco.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado: %', $v$Si un tema no te interesa de verdad, busca otro de los cinco$v$; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND strpos(body, $v$vuelven a pedir permiso. Ahí se pierde todo lo ganado.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado: %', $v$vuelven a pedir permiso. Ahí se pierde todo lo ganado.$v$; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND strpos(body, $v$- **Campo `CAMPO`:** Emilio usa **3 no seguidos**, porque hay gente que deja ir un sí solo porque el cliente tuvo preguntas u objeciones$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado: %', $v$- **Campo `CAMPO`:** Emilio usa **3 no seguidos**, porque ha$v$; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND strpos(body, $v$| Los 3 No seguidos |$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado: %', $v$| Los 3 No seguidos |$v$; END IF;
  INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
  SELECT v + 1, section_key, order_index, title, replace(replace(replace(replace(body, $v$Si un tema no te interesa de verdad, busca otro de los cinco.$v$, $v$Y aunque el tema no sea tuyo, siempre te puedes interesar en lo que a él le emociona: *"yo nunca le he entendido al ballet; cuénteme, ¿qué es lo que le gusta?"*. No es mentir: es buscar el punto donde sus intereses y los tuyos se juntan, como haces con alguien que quieres. `CAMPO`$v$), $v$vuelven a pedir permiso. Ahí se pierde todo lo ganado.$v$, $v$vuelven a pedir permiso. Ahí se pierde todo lo ganado.

**Dos no seguidos en la puerta** `CAMPO`: si haces AIR y el cliente repite el bloqueo de inmediato, ya son dos no seguidos. Ahí lo correcto es quedar de regresar en otro momento, con una alternativa concreta: *"¿le queda mejor que pase el jueves o el viernes?"*. Insistir más ya no es seguridad: es terquedad. Tienen que ser consecutivos: si la conversación avanzó entre uno y otro, el primero ya quedó atrás. En el cierre la regla es otra (ver La Regla de los No).$v$), $v$- **Campo `CAMPO`:** Emilio usa **3 no seguidos**, porque hay gente que deja ir un sí solo porque el cliente tuvo preguntas u objeciones$v$, $v$- **Campo `CAMPO`:** Emilio usa **3 no seguidos**, porque hay gente que deja ir un sí solo porque el cliente tuvo preguntas u objeciones
- **Esta regla es del cierre.** En los bloqueos de la puerta son **dos** no seguidos y quedas de regresar (ver AIR).$v$), $v$| Los 3 No seguidos |$v$, $v$| Los 3 No seguidos (en el cierre) |$v$), true, created_by
  FROM public.doctrina WHERE version = v;
  UPDATE public.doctrina SET is_active = false WHERE is_active AND version = v;
END $c$;

-- 4. La falla se_disculpa_o_se_va es ante el primer bloqueo: con dos no seguidos, quedar de regresar es lo correcto.
UPDATE public.nodes SET practice_script = $g${"notes": "v2.0.0 El espejo ensena la doctrina completa: el bloqueo se endurece si lo peleas y se disuelve si lo aceptas. La consecuencia hace el trabajo, no el feedback.", "scope": {"skills_in_focus": ["blocks.air"], "out_of_scope_behavior": "redirect"}, "limits": {"max_turns": 5, "max_duration_seconds": 180, "min_turns_before_evaluation": 2}, "phases": {"i_do": {"briefing": "Me van a bloquear.\n\nCuenta los tres movimientos: acepto lo que me dijo sin discutirlo, no lo peleo ni lo justifico, y sigo con lo mio como si nada.\n\nFijate sobre todo en el tercero: no pido permiso otra vez, no pregunto si puedo seguir. Sigo.", "first_message": "Claro que si, entiendo. Oiga, y digame una cosa, cuanto tiempo lleva usted aqui?"}, "you_do": {"prompt": "REGLA NUMERO CERO, POR ENCIMA DE TODO LO DEMAS: en esta conversacion NO EXISTE el tema de que vende este senor, que trae, a que viene, ni en que te puede servir. Jamas preguntas eso. Ni con esas palabras ni con ninguna otra. Prohibidas de forma absoluta las frases: que se le ofrece, que necesita, que anda buscando, a que viene, que trae, de que se trata, en que le puedo servir, y cualquier variante. Tu no sabes que es vendedor y no te interesa averiguarlo. Si el menciona por su cuenta un producto o una marca, contestas ah orale y sigues con lo tuyo sin preguntar nada. Si te quedas sin saber que decir, hablas de tu propio negocio o del dia, nunca de el.\n\nEres el encargado de un negocio. En tu PRIMERA respuesta, sin importar lo que diga el vendedor, sueltas un bloqueo de reflejo: elige uno de estos y dilo con naturalidad, sin agresion, como quien despacha por costumbre — ahorita ando ocupado / no me interesa, gracias / no estoy comprando nada / ya tengo con quien. NO es personal, es un reflejo. DESPUES REACCIONAS ASI: si el vendedor DISCUTE, justifica o intenta convencerte de que si te interesa (es que solo son dos minutos, es que esto si le va a servir), tu bloqueo se endurece y se vuelve una posicion: ahora si te cierras de verdad y lo despachas. Si el vendedor SE DISCULPA o se va (perdon, con permiso, vengo despues), lo dejas ir sin insistir. Si el vendedor ACEPTA tu bloqueo sin pelearlo y sigue con su tema con naturalidad, tu tambien sigues con naturalidad: contestas su pregunta y la conversacion continua como si el bloqueo no hubiera existido. Asi funciona en la vida real: nadie defiende un reflejo si el otro no lo ataca. NUNCA vuelvas a bloquear despues del primero. Responde en 1 o 2 frases.", "objective": "El vendedor atraviesa el bloqueo con los tres movimientos: acepta, no lo pelea, y retoma su tema sin pedir permiso. El scope se cubre cuando la conversacion continua despues del bloqueo con el cliente participando con naturalidad."}, "closing": {"message": "Eso es atravesar un bloqueo. No lo peleaste, no te disculpaste y no te fuiste. Lo aceptaste y seguiste, y el bloqueo se disolvio solo, porque nunca fue una posicion: era un reflejo. Vamos al detalle.", "message_incomplete": "Ahi lo dejamos. Vamos al desglose y te digo como quedo ese bloqueo."}}, "version": "2.0.1", "i_do_type": "demo", "failure_criteria": [{"id": "discute_el_bloqueo", "regla_id": "blocks.discute_bloqueo", "severity": "critical", "description": "Intenta convencer al cliente de que si le interesa o de que si tiene tiempo. Convierte un reflejo en una posicion, y ahora si tiene un no de verdad enfrente."}, {"id": "se_disculpa_o_se_va", "regla_id": "discovery.suelta_amarrado", "severity": "critical", "description": "Ante el bloqueo, se disculpa, se despide o promete volver despues. Se rindio ante un reflejo que no significaba nada. Si el cliente REPITE el bloqueo justo despues del AIR (dos no seguidos), quedar de regresar en otro momento es lo correcto y no es esta falla.", "severity_override": {"razon": "escalada: habilidad espejo del nodo", "default": "major"}}, {"id": "pide_permiso_de_nuevo", "regla_id": "blocks.air_sin_resume", "severity": "major", "description": "Acepta el bloqueo pero despues pide autorizacion para seguir. Le devuelve el control al cliente justo despues de haberlo recuperado."}, {"id": "ignora_sin_aceptar", "regla_id": "blocks.air_sin_resume", "severity": "minor", "description": "Sigue de largo sin reconocer lo que el cliente dijo. Se siente que no lo escucho, y eso enfria aunque tecnicamente avance.", "severity_override": {"razon": "incidental: fuera del foco del nodo", "default": "major"}}], "success_criteria": [{"id": "blocks.air", "weight": 1, "regla_id": "blocks.air", "description": "Los tres movimientos: ACEPTA el bloqueo con un entiendo, claro que si o por supuesto. NO lo discute, no lo justifica, no intenta convencer al cliente de lo contrario. RETOMA su tema con naturalidad y sin pedir permiso otra vez. El tercer movimiento es el que mas falla: muchos aceptan y despues se quedan esperando autorizacion."}]}$g$::jsonb WHERE id = '2.7' AND practice_script->>'version' = '2.0.0';
UPDATE public.nodes SET practice_script = $g${"notes": "v2.0.0 BOSS del Mundo 2. Sin pistas garantizadas (R9). Acumulativo: el Mundo 1 se examina implicitamente porque una apertura mal hecha no abre la conversacion. La senal de exito es que el cliente pregunte en que le puede servir, que es la puerta al Descubrimiento.", "scope": {"skills_in_focus": ["blocks.air", "story.historia_breve", "story.brevedad", "relationship.cpr", "flow.close_with_action", "story.relevancia_cliente"], "out_of_scope_behavior": "redirect"}, "limits": {"max_turns": 12, "max_duration_seconds": 300, "min_turns_before_evaluation": 4}, "phases": {"i_do": {"briefing": "Este es el examen del mundo. Bloqueo de entrada, historia breve, relacion personal y seguir avanzando: todo junto y con un cliente que no ayuda.\n\nSin pistas.", "first_message": "Entiendo perfecto, no se preocupe. Soy Emilio, ando trabajando con los negocios de esta zona y quise pasar a conocer el suyo.\n\nDigame una cosa, cuanto tiempo lleva usted aqui?"}, "you_do": {"prompt": "REGLA NUMERO CERO, POR ENCIMA DE TODO LO DEMAS: en esta conversacion NO EXISTE el tema de que vende este senor, que trae, a que viene, ni en que te puede servir. Jamas preguntas eso. Ni con esas palabras ni con ninguna otra. Prohibidas de forma absoluta las frases: que se le ofrece, que necesita, que anda buscando, a que viene, que trae, de que se trata, en que le puedo servir, y cualquier variante. Tu no sabes que es vendedor y no te interesa averiguarlo. Si el menciona por su cuenta un producto o una marca, contestas ah orale y sigues con lo tuyo sin preguntar nada. Si te quedas sin saber que decir, hablas de tu propio negocio o del dia, nunca de el.\n\nEres el encargado de un negocio, ocupado y con poca paciencia para vendedores. En tu PRIMERA respuesta sueltas un bloqueo de reflejo, con naturalidad y sin agresion: ahorita ando ocupado / no me interesa / no estoy comprando nada. TU COMPORTAMIENTO: eres cortes pero cerrado y contestas corto. NO ofreces informacion y NO llevas la conversacion. REGLAS DE REACCION: 1) Si el vendedor pelea el bloqueo, se disculpa o se va, lo despachas y la conversacion termina. 2) Si lo acepta y sigue, continuas con naturalidad. 3) Si su historia breve se alarga mas de tres o cuatro frases, te desconectas: contestas ajam y dices que andas ocupado. 4) Si el vendedor resuelve algo y se queda callado esperando, TU tomas el control y empiezas a despedirte con amabilidad. 5) En tu tercera o cuarta respuesta, si la conversacion sigue viva, sueltas de manera natural UN dato personal tuyo, al pasar, sin darle importancia: elige entre familia, como empezaste, que haces los domingos, por que pusiste el negocio, o tu equipo. Si el vendedor lo ignora, te enfrias y ya no ofreces nada mas de ti. Si le entra con interes real, te abres notablemente. Si se queda platicando de eso mas de dos intercambios sin volver al negocio, te acomodas a platicar de la vida y ya nunca regresas tu al tema. 6) SOLO si el vendedor logra todo — atravesar el bloqueo, decir quien es breve y relevante, conectar contigo como persona y regresar, y avanzar sin pedir permiso — entonces te abres de verdad: le cuentas algo de tu negocio por tu cuenta y le preguntas en que le puede servir. Esa pregunta es la senal de que gano. NUNCA la hagas antes de que se lo gane. Responde en 1 o 2 frases.", "objective": "El vendedor atraviesa el bloqueo inicial, se presenta en quince segundos de forma relevante, conecta con el dato personal y regresa, y sostiene el avance sin pedir permiso. El scope se cubre cuando el cliente se abre por su propia voluntad y pregunta en que le puede servir."}, "closing": {"message": "Ahi esta la puerta fria abierta. Atravesaste el bloqueo sin pelearlo, dijiste quien eras sin cansarlo, conectaste como persona y volviste, y nunca soltaste el control de la conversacion. Ese cliente ya quiere saber en que le puedes servir, y eso es exactamente lo que sigue. Vamos al detalle.", "message_incomplete": "Hasta aqui la sesion. Ya tengo lo que necesito para tu analisis. Vamos al desglose y te digo donde estuvo la diferencia."}}, "version": "2.1.1", "i_do_type": "demo", "failure_criteria": [{"id": "discute_el_bloqueo", "regla_id": "blocks.discute_bloqueo", "severity": "critical", "description": "Pelea el bloqueo inicial o intenta convencer al cliente de que si le interesa."}, {"id": "se_disculpa_o_se_va", "regla_id": "discovery.suelta_amarrado", "severity": "critical", "description": "Ante el bloqueo, se disculpa, se despide o promete volver despues. Si el cliente REPITE el bloqueo justo despues del AIR (dos no seguidos), quedar de regresar en otro momento es lo correcto y no es esta falla.", "severity_override": {"razon": "boss: escalada", "default": "major"}}, {"id": "se_queda_esperando", "regla_id": "close.devuelve_el_volante", "severity": "critical", "description": "Resuelve algo y se queda callado esperando permiso. El cliente toma el control y se despide.", "severity_override": {"razon": "boss: escalada", "default": "major"}}, {"id": "historia_larga", "regla_id": "story.kill", "severity": "major", "description": "La historia breve se extiende y el cliente se desconecta."}, {"id": "ignora_lo_personal", "regla_id": "story.nunca_sale", "severity": "major", "description": "Pasa de largo el dato personal que el cliente ofrecio.", "severity_override": {"razon": "boss: escalada", "default": "minor"}}, {"id": "se_queda_platicando", "regla_id": "story.sale_sin_regresar", "severity": "major", "description": "Le entra a lo personal y ya no vuelve al negocio."}, {"id": "pitch_prematuro", "regla_id": "opening.pitch_prematuro", "severity": "critical", "description": "Mete producto, promocion o motivo de venta. Identificarse con nombre y empresa es el trabajo de este paso, no una excepción: aquí SÍ se dice quién eres y por qué estás."}], "success_criteria": [{"id": "blocks.air", "weight": 0.25, "regla_id": "blocks.air", "description": "Atraviesa el bloqueo inicial: lo acepta, no lo pelea, y retoma sin pedir permiso."}, {"id": "story.historia_breve", "weight": 0.15, "regla_id": "story.quien_eres_por_que", "description": "Dice quien es y por que esta ahi: nombre, procedencia y motivo humano de la visita."}, {"id": "story.brevedad", "weight": 0.1, "regla_id": "story.kiss", "description": "Dos o tres frases. Sin trayectoria de empresa, sin lista de productos, sin cifras."}, {"id": "relationship.cpr", "weight": 0.2, "regla_id": "relationship.cpr", "description": "Detecta el dato personal, le entra con interes genuino, y REGRESA al negocio por su cuenta en uno o dos intercambios."}, {"id": "flow.close_with_action", "weight": 0.15, "regla_id": "close_with_action", "description": "Despues de cada freno avanza por su cuenta, sin quedarse esperando ni pedir autorizacion. Sostiene el control de la conversacion toda la sesion."}, {"id": "story.relevancia_cliente", "weight": 0.15, "regla_id": "story.pregunta_despues", "description": "Sus turnos terminan devolviéndole la palabra al cliente con una pregunta: no deja afirmaciones sueltas en el aire."}]}$g$::jsonb WHERE id = '2.10' AND practice_script->>'version' = '2.1.0';

-- 5. Chequeo final: si algo no quedó, se aborta todo.
DO $chk$ DECLARE v int; n int; BEGIN
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '2.0') IS DISTINCT FROM '03d95733d128a8e79ac7a440fd4d3910' THEN RAISE EXCEPTION 'las tarjetas del 2.0 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '2.1') IS DISTINCT FROM '074a563d2446c0fdb1139b1d12eb39ba' THEN RAISE EXCEPTION 'las tarjetas del 2.1 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '2.2') IS DISTINCT FROM '6cbd9514cd328ee15592102b8a71bdc3' THEN RAISE EXCEPTION 'las tarjetas del 2.2 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '2.3') IS DISTINCT FROM 'f817e91b6a72b14ebc7178025ca9ce87' THEN RAISE EXCEPTION 'las tarjetas del 2.3 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '2.4') IS DISTINCT FROM 'eebc3e585665053d3463a087ae648d87' THEN RAISE EXCEPTION 'las tarjetas del 2.4 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '2.5') IS DISTINCT FROM 'd752e2f791cd834668b2a5dde25488fa' THEN RAISE EXCEPTION 'las tarjetas del 2.5 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '2.6') IS DISTINCT FROM '6fc769289a896ec60306389e0aaf4887' THEN RAISE EXCEPTION 'las tarjetas del 2.6 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '2.7') IS DISTINCT FROM '0538747940dbe4b314a7d8f02f89a60d' THEN RAISE EXCEPTION 'las tarjetas del 2.7 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '2.8') IS DISTINCT FROM '7e69c5c20e0e23b75982eb2a5652bad4' THEN RAISE EXCEPTION 'las tarjetas del 2.8 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '2.9') IS DISTINCT FROM 'eb00ccb1d53b43cdfea5fda771994405' THEN RAISE EXCEPTION 'las tarjetas del 2.9 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', card_order, title, body, flip_back_text), '#' ORDER BY card_order)) FROM public.node_cards WHERE node_id = '2.10') IS DISTINCT FROM 'b6192efaa0beb08c03238dd267d22691' THEN RAISE EXCEPTION 'las tarjetas del 2.10 no quedaron'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order)) FROM public.node_quiz_questions WHERE node_id = '2.0') IS DISTINCT FROM '66bbac4c436ca6320f6a4ba8d16fdedc' THEN RAISE EXCEPTION 'el quiz del 2.0 no quedó'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order)) FROM public.node_quiz_questions WHERE node_id = '2.3') IS DISTINCT FROM 'a838d8dc51e22552a377b7f598afcfe6' THEN RAISE EXCEPTION 'el quiz del 2.3 no quedó'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order)) FROM public.node_quiz_questions WHERE node_id = '2.4') IS DISTINCT FROM '7ebb739ec555a704b5c5ec718c412f55' THEN RAISE EXCEPTION 'el quiz del 2.4 no quedó'; END IF;
  IF (SELECT md5(string_agg(concat_ws('|', question_order, question_text, option_a, option_b, option_c, correct_option, explanation_correct, explanation_wrong), '#' ORDER BY question_order)) FROM public.node_quiz_questions WHERE node_id = '2.6') IS DISTINCT FROM 'b1ae93bd6431b35393a9bff8cbd14d64' THEN RAISE EXCEPTION 'el quiz del 2.6 no quedó'; END IF;
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  SELECT count(*) INTO n FROM public.doctrina WHERE is_active;
  IF n <> 7 THEN RAISE EXCEPTION 'el Cerebro tiene % secciones activas, no 7', n; END IF;
  IF (SELECT count(DISTINCT version) FROM public.doctrina WHERE is_active) <> 1 THEN RAISE EXCEPTION 'hay más de una versión activa del Cerebro'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.doctrina WHERE version = v AND body LIKE '%Dos no seguidos en la puerta%') THEN RAISE EXCEPTION 'el Cerebro no recibió los dos no seguidos'; END IF;
  IF EXISTS (SELECT 1 FROM public.doctrina WHERE version = v AND body LIKE '%busca otro de los cinco%') THEN RAISE EXCEPTION 'quedó el texto viejo de FORMS'; END IF;
  -- Ninguna cita de regla que estaba en la versión anterior se pierde en la nueva.
  SELECT count(*) INTO n FROM public.reglas r
   WHERE EXISTS (SELECT 1 FROM public.doctrina d WHERE d.version = v - 1 AND strpos(d.body, r.cita_cerebro) > 0)
     AND NOT EXISTS (SELECT 1 FROM public.doctrina d WHERE d.version = v AND strpos(d.body, r.cita_cerebro) > 0);
  IF n > 0 THEN RAISE EXCEPTION '% citas de reglas ya no están en el Cerebro', n; END IF;
  IF (SELECT md5(practice_script::text) FROM public.nodes WHERE id = '2.7') IS DISTINCT FROM '635a5af758b3262dd2a27f5ade518742' THEN RAISE EXCEPTION 'el guion del 2.7 no quedó'; END IF;
  IF (SELECT md5(practice_script::text) FROM public.nodes WHERE id = '2.10') IS DISTINCT FROM 'cee513f5eed2de97bb7d455b1b06f9b6' THEN RAISE EXCEPTION 'el guion del 2.10 no quedó'; END IF;
END $chk$;
