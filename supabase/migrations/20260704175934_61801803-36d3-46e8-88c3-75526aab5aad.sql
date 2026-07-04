INSERT INTO public.nodes (id, world_id, name, order_index, is_boss, node_type, difficulty_level)
VALUES
  ('6.0', 6, 'Mundo 6.0', 0, false, 'knowledge', 1),
  ('6.1', 6, 'Mundo 6.1', 1, false, 'knowledge', 1),
  ('6.2', 6, 'Mundo 6.2', 2, false, 'knowledge', 1),
  ('6.3', 6, 'Mundo 6.3', 3, false, 'knowledge', 1),
  ('6.4', 6, 'Mundo 6.4', 4, true, 'knowledge', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.skills (id, code, name, short_description, category, world_id_introduced, skill_type, decay_half_life_days, requires_audio, status)
VALUES
('closing.cierre_asumido', 'S-050', 'El Cierre Asumido', 'Cierra con preguntas que asumen la decisión y ofrecen opciones (¿5 u 8 cajas? ¿lunes o miércoles?) — nunca preguntas que abren la puerta al no (¿le interesa? ¿qué piensa?).', 'closing', 6, 'tecnica', 180, false, 'active')
ON CONFLICT (id) DO NOTHING;

UPDATE public.nodes SET
  name = 'Un Cierre No Es Una Venta',
  description = 'Cerrar es extraer una decisión — a veces es sí, a veces es no, pero nunca es "déjeme pensarlo". Aprende a distinguir los cierres que funcionan de los que matan.',
  node_type = 'knowledge', engine_type = 'swipe', conversation_scope = NULL, difficulty_level = 2
WHERE id = '6.0';

DELETE FROM public.node_quiz_questions WHERE node_id = '6.0';
DELETE FROM public.node_cards WHERE node_id = '6.0';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('6.0', 1, 'concept', 'static',
  'El cierre no es magia. Es una decisión con fecha de hoy.',
  E'Cerrar no significa vender siempre. Significa EXTRAER UNA DECISIÓN: un sí, un no claro, un pedido concreto — algo que mueva la conversación de "algún día" a "hoy se decidió algo".\n\nEl peor resultado de una visita no es el no. Es el "déjeme pensarlo" eterno — la decisión sin fecha que se muere sola y te tiene regresando de a gratis.',
  NULL, NULL),
('6.0', 2, 'concept', 'static',
  'Los cierres que matan',
  E'"¿Entonces qué piensa?" — le pediste un veredicto sobre TODO. Abrumador.\n"¿Le interesa?" — pregunta de sí/no con el no gratis.\n"¿Quiere que le deje información?" — acabas de proponer TÚ el aplazamiento.\n"Bueno, ahí me avisa cualquier cosa..." — ni siquiera es una pregunta. Es una despedida.\n\n¿El patrón? Todos le abren la puerta al no — o peor, al limbo. Y el cliente, ante una puerta abierta, la usa. No por malo: por humano.',
  NULL, NULL),
('6.0', 3, 'concept', 'static',
  'Los cierres que funcionan: asumidos, con opciones.',
  E'"¿Empezamos con 5 cajas o le acomodo el combo de 8?"\n"¿Le entrego el lunes o mejor el miércoles?"\n"¿Se lo facturo o va con nota?"\n\nFíjate en la mecánica: la decisión de FONDO (comprar) ya se asume — la conversación entera la construyó. La pregunta es sobre los DETALLES, y cualquier respuesta que elija... es un sí.\n\nEn Closer esta regla es total: TODOS los cierres son asumidos. Sin excepción.',
  NULL, NULL),
('6.0', 4, 'why_it_works', 'static',
  '¿Y no es manipulación?',
  E'No — si hiciste el trabajo. El cierre asumido es la CONSECUENCIA natural de una conversación donde el cliente conectó su dolor, hizo la cuenta, asintió tres veces y preguntó cuándo entregas. Preguntarle "¿le interesa?" después de todo eso es ofenderlo — él ya te lo dijo de cinco formas.\n\nAhora, si NO hiciste el trabajo — sin valor, sin síes, sin señales — el cierre asumido se siente como atropello y el cliente te frena. El cierre no arregla una mala conversación. Solo cosecha una buena.',
  NULL, NULL);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong) VALUES
('6.0', 1,
  'Tras una gran conversación — dolor conectado, cuenta hecha, tres síes — el vendedor remata: "Entonces... ¿le interesa?" El cliente: "Pues déjeme pensarlo." ¿Qué pasó?',
  'El cliente nunca estuvo interesado.',
  'El vendedor abrió la puerta al limbo con una pregunta de sí/no — y el cliente, ante una puerta abierta, la usó.',
  'Faltó bajarle el precio.',
  NULL, 'B',
  'La conversación había construido el sí — y la pregunta lo regaló. "¿Le interesa?" invita a evaluar desde cero algo que ya estaba decidido en los hechos. El cierre correcto era asumir y ofrecer opciones: ¿5 u 8? ¿lunes o miércoles?',
  'El interés estaba — tres síes y la cuenta hecha lo prueban. Lo que falló fue la puerta: una pregunta de sí/no al final le ofrece al cliente una salida que no buscaba, y el "déjeme pensarlo" es la salida más cómoda. El precio no tuvo nada que ver.'),
('6.0', 2,
  '¿Por qué "¿le entrego el lunes o el miércoles?" funciona mejor que "¿quiere que le entregue?"',
  'Porque suena más profesional.',
  'Porque asume la decisión de fondo (ya construida por la conversación) y pregunta solo el detalle — cualquier opción que elija es un sí.',
  'Porque el lunes es mejor día de entrega.',
  NULL, 'B',
  'Esa es la mecánica del cierre asumido: la decisión grande ya la tomó la conversación — dolor, valor, síes, señales. La pregunta de opciones solo le da al cliente el volante de los detalles. Elegir miércoles ES decir sí.',
  'No es cuestión de sonar profesional ni de logística. Es arquitectura de la decisión: "¿quiere que...?" reabre la pregunta grande (¿compro o no?); "¿lunes o miércoles?" la da por resuelta y pregunta la chica. El cliente decide cómodo — y decide que sí.'),
('6.0', 3,
  'Un cliente escuchó todo, preguntó detalles... y al cierre dice: "No, fíjese que ahorita de verdad no puedo — hasta el otro mes que cobre lo del contrato." ¿Cómo salió esta visita?',
  'Mal — no hubo venta.',
  'Bien — hubo CIERRE: una decisión real, con razón concreta y fecha. Eso vale oro: sabes exactamente cuándo volver y con qué.',
  'Regular — debió insistir hasta convertir el no.',
  NULL, 'B',
  'Un cierre extrae una decisión — no siempre una venta. Este no es claro, tiene razón real y trae fecha: el otro mes, con dinero del contrato. Comparado con un "déjeme pensarlo" eterno, esto es un mapa del tesoro. Agenda la vuelta y consolida la relación.',
  'No confundas cierre con venta. La visita SÍ cerró: decisión clara, razón concreta, fecha de regreso. Insistir contra un "no puedo pagar ahorita" genuino solo quema la relación — la jugada es capitalizar la decisión: "perfecto, entonces lo veo el mes que entra ya con lo del contrato, ¿como qué fecha le cae?"');

UPDATE public.nodes SET
  name = 'El Cierre Asumido',
  description = 'La conversación ya construyó el sí. Tu único trabajo: preguntarlo sin regalarle la puerta al no.',
  node_type = 'skill_drill', engine_type = NULL, conversation_scope = 'close', difficulty_level = 3,
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["closing.cierre_asumido", "impulse.poder_asumir"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "i_do": {
        "briefing": "Escucha el momento exacto del cierre asumido. La conversación ya hizo todo el trabajo — yo nada más pregunto los detalles, con opciones donde cualquier respuesta es un sí.",
        "first_message": "El cliente ya conectó su dolor, ya hizo la cuenta, ya me preguntó cada cuánto surtimos. El cierre: Perfecto Don Ramón — entonces para que arranque la quincena surtido, ¿le armo el pedido con las 5 cajas o de una vez el combo de 8 que le baja el precio por pieza? — Y ya. Sin ¿le interesa?, sin ¿qué piensa? La decisión grande ya estaba tomada por la conversación. Yo solo pregunté la chica."
      },
      "you_do": {
        "prompt": "Eres el dueño de un negocio con la decisión prácticamente tomada: la conversación fue excelente — el vendedor conectó tu dolor (elígelo: faltantes que te cuestan clientes / anaquel de dinero muerto / línea que piden y no consigues), hiciste la cuenta y te salió a favor, asentiste varias veces y hasta preguntaste cada cuánto surten. Tu primera línea recapitula ese estado: Pues sí, la verdad la cuenta sale... y a mí eso de quedarme sin producto cada quincena ya me tiene harto. REGLAS ESPEJO: (1) Si el vendedor cierra ASUMIDO con opciones concretas (¿5 u 8?, ¿lunes o miércoles?, ¿factura o nota?), eliges una opción con naturalidad y la decisión queda tomada — puedes ajustar un detalle (mejor el miércoles porque el lunes recibo mercancía) pero avanzas. (2) Si el vendedor pregunta con puerta al no (¿le interesa?, ¿entonces qué piensa?, ¿quiere que le deje información?), usas la puerta con flojera natural: pues déjeme pensarlo tantito y le aviso — no porque no quieras: porque te la ofrecieron. (3) Si tras tu déjeme pensarlo el vendedor corrige y cierra asumido con opciones, todavía puedes avanzar (la curva sigue arriba). (4) Si el cierre asume detalles nunca platicados o cantidades absurdas, lo frenas: espérese, ¿de dónde sacó eso? (5) Si el vendedor sigue presentando en lugar de cerrar (más beneficios, más catálogo), te empiezas a enfriar visiblemente: bueno, sí, eso ya me lo había dicho...",
        "objective": "El vendedor detecta que la decisión está madura (la recapitulación del cliente lo grita) y cierra ASUMIDO a la primera oportunidad: pregunta de opciones concretas sobre detalles del pedido (cantidad, día, forma) donde cualquier respuesta es un sí — sin preguntas de interés, sin seguir presentando, sin abrir la puerta al no. El scope se cubre cuando el cliente eligió una opción y la decisión quedó tomada."
      },
      "closing": {
        "message": "¿Viste lo fácil? La conversación ya había hecho todo — tú solo preguntaste la decisión chica y la grande cayó sola. Así se cierra en Closer: siempre asumido. Vamos al detalle."
      }
    },
    "success_criteria": [
      {"id": "closing.cierre_asumido", "weight": 0.6, "description": "Cierra con pregunta asumida de opciones concretas y realistas (cantidad/día/forma sobre lo ya platicado) en el momento maduro — sin ¿le interesa?, sin ¿qué piensa?, sin ofrecer información para después. Si el cliente elige, confirma y sella con naturalidad."},
      {"id": "impulse.poder_asumir", "weight": 0.4, "description": "Todo su lenguaje del tramo final es de avance (cuándo/cuál/cómo) sobre los rieles de la conversación — referencia lo acordado (la cuenta que sacamos, lo de la quincena) sin reabrir la decisión de fondo."}
    ],
    "failure_criteria": [
      {"id": "abre_puerta_al_no", "severity": "critical", "description": "Cierra con pregunta de interés o de veredicto (¿le interesa?, ¿qué piensa?, ¿lo pensamos?) o propone él mismo el aplazamiento (¿le dejo información?) — en el nodo cuyo único tema es no abrir esa puerta, abrirla domina el score."},
      {"id": "sigue_presentando", "severity": "major", "description": "El cliente está maduro y el vendedor agrega beneficios, catálogo o argumentos en lugar de cerrar — deja pasar el momento y el cliente se enfría."},
      {"id": "atropello", "severity": "major", "description": "Su cierre asume cantidades o condiciones nunca platicadas — el asumido sin rieles."},
      {"id": "persigue", "severity": "major", "description": "Si el cliente titubea, cambia el asumir por súplica o descuento de pánico."},
      {"id": "monologo", "severity": "minor", "description": "Entierra su pregunta de cierre en un bloque largo — el cierre se pregunta y se calla."}
    ],
    "limits": {
      "max_turns": 8,
      "max_duration_seconds": 180,
      "min_turns_before_evaluation": 1
    },
    "notes": "Drill quirúrgico del momento del cierre: el Actor entra MADURO (recapitula su propio convencimiento) y el examen es puro: ¿asume con opciones o abre la puerta? La regla espejo da segunda oportunidad tras un déjeme pensarlo — el vendedor puede corregir en vivo, que es como se aprende. abre_puerta_al_no es critical: es EL tema del nodo."
  }'::jsonb
WHERE id = '6.1';

DELETE FROM public.node_quiz_questions WHERE node_id = '6.1';
DELETE FROM public.node_cards WHERE node_id = '6.1';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('6.1', 1, 'concept', 'static',
  'El momento maduro se ve así:',
  E'El cliente recapitula solo: "pues sí, la cuenta sale... y ya me tiene harto quedarme sin producto." Preguntó cada cuánto surtes. Asintió tres veces.\n\nLa decisión grande YA ESTÁ TOMADA — la tomó la conversación. Lo único que falta es que alguien la pregunte bien. Y "bien" significa: asumida, con opciones, sobre los detalles.\n\n"¿Le armo las 5 cajas o el combo de 8?" Cualquier respuesta es un sí.',
  NULL, NULL),
('6.1', 2, 'good_example', 'dynamic',
  NULL,
  'Ejemplo de cierre asumido aplicado al contexto de la empresa: pregunta de opciones concretas sobre detalles del pedido, referenciando lo construido en la conversación.',
  'La decisión de fondo se asume — la construyó la conversación. La pregunta es sobre el detalle, y elegir cualquier opción es decir sí.', NULL),
('6.1', 3, 'bad_example', 'dynamic',
  NULL,
  'Ejemplo de cierre con puerta al no aplicado al contexto de la empresa: pregunta de interés o veredicto tras una conversación que ya había construido el sí.',
  'La pregunta de interés reabre una decisión que ya estaba tomada — y le ofrece al cliente la salida cómoda del "déjeme pensarlo".', NULL);

UPDATE public.node_cards SET skill_ids = '{closing.cierre_asumido}' WHERE node_id = '6.1' AND card_type IN ('good_example','bad_example');

UPDATE public.nodes SET
  name = 'Cierra en el Pico',
  description = 'La señal de compra puede llegar a MITAD de tu presentación. Cuando llegue: cállate y cierra. Aunque te falte la mitad del guion.',
  node_type = 'skill_drill', engine_type = NULL, conversation_scope = 'close', difficulty_level = 4,
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["closing.lectura_senales", "qualification.senales_compra", "closing.cierre_asumido"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "i_do": {
        "briefing": "Esta es la disciplina más difícil del cierre: DEJAR DE PRESENTAR. Escucha — voy a la mitad de mi presentación cuando el cliente suelta la señal. Fíjate lo que hago: no termino mi guion. Cierro ahí.",
        "first_message": "Voy presentando: ...y además del surtido semanal, el producto trae— y el cliente me interrumpe: ¿Y si le pido hoy, cuándo me estaría llegando? — ALTO. Esa es la señal: ya se está imaginando el pedido. Mi guion traía tres beneficios más... y no los va a escuchar nadie: Le llega el lunes a primera hora. ¿Le armo las 5 o el combo de 8? — Cerré a mitad de presentación. El pico es del cliente, no de mi guion."
      },
      "you_do": {
        "prompt": "Eres el dueño de un negocio interesado: la conversación viene bien, el vendedor conectó tu dolor (elígelo y menciónalo al abrir: faltantes / anaquel muerto / línea que no consigues) y está presentando su solución. TU MECÁNICA CENTRAL: cuando el vendedor lleve 2-3 turnos de presentación decente, SUELTA UNA SEÑAL DE COMPRA CLARA a mitad de su flujo — elige una: ¿y si le pido hoy cuándo me llega? / ¿ese combo cómo viene, con factura? / ¿y usted pasa cada semana o cómo le hago para resurtir? La sueltas con interés genuino: tu curva está en el pico. REGLAS ESPEJO: (1) Si el vendedor DETIENE su presentación al oír tu señal y cierra asumido ahí mismo, respondes eligiendo opción — decisión tomada, con gusto. (2) Si el vendedor responde tu pregunta PERO sigue presentando (te contesta lo del lunes y continúa: ...y además le decía que el producto también...), tu curva EMPIEZA A BAJAR: tu siguiente respuesta es más tibia (ah ok, sí, suena bien), y si insiste con más presentación, bajas a mmm, bueno, déjeme pensarlo entonces — el pico pasó y no vuelve. (3) Si nunca suelta el guion, la sesión muere en tu déjeme pensarlo. (4) Si cierra bien tras la señal pero con atropello (cantidades no platicadas), lo frenas suave y esperas la corrección.",
        "objective": "El vendedor presenta con normalidad Y detecta la señal de compra que el cliente suelta a mitad del flujo: DETIENE la presentación en ese instante (aunque le falte guion), responde lo puntual de la señal si aplica, y cierra asumido con opciones ahí mismo — cosechando el pico. El scope se cubre cuando el cierre ocurrió inmediatamente después de la señal y el cliente eligió opción."
      },
      "closing": {
        "message": "Dejaste guion sin decir — y esa es exactamente la victoria. El pico era del cliente, no de tu presentación. Lo viste, te callaste y cerraste. Eso separa a los que presentan bonito de los que venden. Vamos al detalle."
      }
    },
    "success_criteria": [
      {"id": "closing.lectura_senales", "weight": 0.4, "description": "Detecta la señal de compra en el momento en que aparece — su turno inmediatamente posterior cambia de presentar a cerrar. La velocidad de reacción es el criterio: señal → cierre, sin beneficios extra en medio."},
      {"id": "closing.cierre_asumido", "weight": 0.35, "description": "El cierre tras la señal es asumido con opciones concretas — responde lo puntual de la señal (el dato del lunes) y pregunta la decisión chica, sin reabrir la grande."},
      {"id": "qualification.senales_compra", "weight": 0.25, "description": "Trata la pregunta del cliente como lo que es — una señal, no una interrupción: la respuesta la honra (contesta el dato) y la capitaliza (cierra), en lugar de despacharla para volver al guion."}
    ],
    "failure_criteria": [
      {"id": "sigue_presentando", "severity": "critical", "description": "Recibe la señal de compra y continúa presentando beneficios — deja pasar el pico. El asesino silencioso de ventas que este nodo existe para matar: sobre-presentar mata tantas ventas como presentar mal."},
      {"id": "abre_puerta_al_no", "severity": "major", "description": "Detiene la presentación ante la señal... y remata con ¿le interesa? — vio el pico y lo regaló."},
      {"id": "atropello", "severity": "minor", "description": "Cierra tras la señal pero asumiendo detalles nunca platicados."},
      {"id": "ignora_pistas", "severity": "major", "description": "Despacha la pregunta del cliente con un dato seco y vuelve al guion sin capitalizarla."},
      {"id": "monologo", "severity": "minor", "description": "Sus turnos de presentación son bloques largos — con menos aire para que la señal aparezca y se escuche."}
    ],
    "limits": {
      "max_turns": 10,
      "max_duration_seconds": 210,
      "min_turns_before_evaluation": 3
    },
    "notes": "El drill del timing: la señal llega a MITAD del flujo del vendedor y el examen es soltar el guion. La curva del Actor baja de forma gradual y realista si la señal se ignora (tibio → déjeme pensarlo) — el vendedor siente el costo del pico perdido en vivo. sigue_presentando es critical: es la razón de ser del nodo."
  }'::jsonb
WHERE id = '6.2';

DELETE FROM public.node_quiz_questions WHERE node_id = '6.2';
DELETE FROM public.node_cards WHERE node_id = '6.2';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('6.2', 1, 'concept', 'static',
  'La señal no espera a que termines.',
  E'Vas a la mitad de tu presentación — te faltan tres beneficios del guion — y el cliente suelta: "¿y si le pido hoy, cuándo me llega?"\n\nEso NO es una interrupción. Es la señal de compra: ya se está imaginando el pedido en su bodega. Su curva llegó al pico AHORITA — no cuando tú termines.\n\nY el pico no espera. Cada beneficio extra que agregues después de la señal es cuesta abajo.',
  NULL, NULL),
('6.2', 2, 'concept', 'static',
  'La disciplina: cállate y cierra.',
  E'Suena fácil. No lo es — traes el guion en la cabeza, los beneficios que ensayaste, la sensación de que "falta explicar más."\n\nLa regla cuando aparece la señal: (1) DETENTE — el guion muere ahí, sin duelo. (2) HONRA la señal — responde lo puntual que preguntó: "le llega el lunes a primera hora." (3) CIERRA asumido en la misma respiración: "¿le armo las 5 o el combo de 8?"\n\nSeñal → dato → cierre. Tres segundos. Lo demás del guion... que descanse en paz.',
  NULL, NULL),
('6.2', 3, 'why_it_works', 'static',
  'Sobre-presentar mata tantas ventas como presentar mal.',
  E'¿Por qué duele tanto seguir hablando? Porque el cliente en el pico ya DECIDIÓ — y cada argumento nuevo le da material para re-evaluar. "¿Y además tiene esta otra característica?" — "mmm, ¿y esa para qué la quiero yo?" La duda que no existía, la sembraste tú.\n\nEn este reto, el cliente va a soltar la señal a mitad de tu presentación. Si la cosechas, cierras en tres frases. Si sigues con tu guion... vas a ver — en vivo — cómo se enfría un pico. Y esa lección no se olvida.',
  NULL, NULL);

UPDATE public.nodes SET
  name = 'Sin Miedo',
  description = 'Pediste la decisión... y el cliente se quedó callado. Ese silencio es el momento más incómodo de las ventas — y quien lo aguanta, gana.',
  node_type = 'skill_drill', engine_type = NULL, conversation_scope = 'close', difficulty_level = 4,
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["closing.sin_miedo", "impulse.indiferencia"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "i_do": {
        "briefing": "Te voy a enseñar el momento donde más ventas se suicidan: el silencio después del cierre. Escucha lo que hago después de preguntar — NADA. Y escucha lo que el miedo le hace hacer a otros.",
        "first_message": "Cierro: ¿Le armo las 5 cajas o el combo de 8? — Y el cliente se queda callado. Piensa. El silencio pesa... y aquí es donde el vendedor con miedo se suicida: Bueno, si le parece mucho también hay de 3... o si quiere lo piensa y... — ¡Acaba de deshacer su propio cierre! El cliente ni había dicho nada. Yo, en cambio: pregunto... y me callo. Tres segundos. Cinco. Los que sean. El que habla primero después del cierre, pierde — y no vas a ser tú."
      },
      "you_do": {
        "prompt": "Eres el dueño de un negocio convencido pero DELIBERATIVO: la conversación fue buena, el valor está claro, y cuando algo te convence... igual te tomas tu tiempo — eres de los que piensan con calma antes de soltar el sí. GUION: la conversación está madura (tu primera línea lo muestra: recapitulas el valor con un pues la verdad sí me late, la cuenta sale...). Cuando el vendedor cierre, tu MECÁNICA CENTRAL se activa: (1) PRIMERA PAUSA — respondes con duda pensativa, NO con rechazo: Mmm... — o — Déjeme ver... — estás pensando de verdad, sopesando. (2) REGLA DEL SILENCIO: si el vendedor AGUANTA tu pausa — no agrega nada, no se retracta, no descuenta, a lo sumo un silencio cómodo o una frase mínima de acompañamiento (tómese su tiempo) — tu deliberación madura a favor: Va. Vamos a hacerlo. ¿Dijo que el lunes llega? y eliges. (3) Si el vendedor LLENA EL SILENCIO — se retracta (bueno, si le parece mucho...), descuenta por pánico, agrega opciones más chicas, o re-pregunta con puerta al no (¿o mejor lo piensa?) — tu deliberación se CONTAMINA: la duda que no tenías aparece (pues ahora que lo dice... déjeme pensarlo bien) y la decisión se aplaza. (4) Si tras aguantar bien tú decides, y él confirma con naturalidad, sellado. (5) Segunda ola opcional: tras tu Va, puedes soltar un ¿y sí me conviene, verdad? — buscando reaseguro: la respuesta correcta es breve y firme (la cuenta que sacamos lo dice solo); la insegura o sobre-vendedora te contamina de nuevo.",
        "objective": "El vendedor cierra asumido y AGUANTA el silencio deliberativo del cliente: tras su pregunta de cierre, no agrega, no se retracta, no descuenta ni reabre la decisión — sostiene la pausa con serenidad (silencio o acompañamiento mínimo) hasta que el cliente decide solo. Si el cliente busca reaseguro, responde breve y firme sin re-vender. El scope se cubre cuando el cliente decidió afirmativamente tras deliberar y la decisión quedó sellada."
      },
      "closing": {
        "message": "Preguntaste... y te callaste. El silencio pesó — y lo aguantaste. Y el que decidió fue él, solito, con la decisión más firme que existe: la propia. Eso es cerrar sin miedo. Vamos al detalle."
      }
    },
    "success_criteria": [
      {"id": "closing.sin_miedo", "weight": 0.6, "description": "Cierra con claridad y sostiene el silencio deliberativo: tras su pregunta de cierre no se retracta, no descuenta, no agrega opciones menores ni reabre la decisión — sus turnos durante la pausa son silencio o acompañamiento mínimo y sereno. Ante la búsqueda de reaseguro, responde breve y firme sin re-vender."},
      {"id": "impulse.indiferencia", "weight": 0.4, "description": "La serenidad SW3 sostiene el momento: cero ansiedad textual durante la deliberación del cliente, cero necesidad de acelerar su decisión — cálido, presente y en calma con cualquier resultado."}
    ],
    "failure_criteria": [
      {"id": "llena_el_silencio", "severity": "critical", "description": "Tras cerrar, no aguanta la pausa: se retracta (si le parece mucho hay de 3...), descuenta por pánico, apila argumentos nuevos o reabre con ¿o mejor lo piensa? — deshace su propio cierre y siembra la duda que no existía. El suicidio clásico que este nodo entrena a evitar."},
      {"id": "abre_puerta_al_no", "severity": "major", "description": "Su cierre inicial ya llega con puerta (¿le interesa?) — el silencio que sigue es de otro examen."},
      {"id": "persigue", "severity": "major", "description": "Presiona la deliberación: ándele, anímese, ¿entonces qué? — el silencio del cliente no es invitación a empujar."},
      {"id": "sobre_reaseguro", "severity": "minor", "description": "Ante el ¿y sí me conviene, verdad?, responde re-vendiendo con un bloque de argumentos — la firmeza breve era la respuesta."},
      {"id": "monologo", "severity": "minor", "description": "Cualquier bloque largo en la fase de deliberación."}
    ],
    "limits": {
      "max_turns": 8,
      "max_duration_seconds": 180,
      "min_turns_before_evaluation": 2
    },
    "notes": "El nodo del silencio: el Actor delibera de verdad (pausas pensativas que NO son rechazo) y decide a favor solo si el vendedor aguanta. La mecánica enseña la lección contraintuitiva: la pausa del cliente es su proceso, no tu fracaso. La segunda ola (reaseguro) entrena la firmeza breve. llena_el_silencio es critical — es EL tema. En texto, el silencio del vendedor se manifiesta como acompañamiento mínimo; cuando exista pipeline de audio, este nodo ganará su dimensión real de pausas medidas."
  }'::jsonb
WHERE id = '6.3';

DELETE FROM public.node_quiz_questions WHERE node_id = '6.3';
DELETE FROM public.node_cards WHERE node_id = '6.3';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('6.3', 1, 'concept', 'static',
  'El momento donde más ventas se suicidan',
  E'Cerraste bien: "¿le armo las 5 o el combo de 8?" Y el cliente... se queda callado. Piensa.\n\nTres segundos de silencio. Cinco. Pesan como losas — y el miedo te susurra: "di algo, se está arrepintiendo, ofrécele algo más chico..."\n\nMentira. Está DELIBERANDO. Ese silencio es su proceso de decir que sí — y el único que puede arruinarlo eres tú.',
  NULL, NULL),
('6.3', 2, 'concept', 'static',
  'El que habla primero, pierde.',
  E'"Bueno, si le parece mucho también hay de 3 cajas... o si quiere lo piensa..."\n\n¿Qué acaba de pasar? El vendedor deshizo SU PROPIO cierre. El cliente no había dicho nada — iba a decir que sí — y el vendedor le sembró la duda, le achicó el pedido y le regaló la salida. Todo por no aguantar cinco segundos.\n\nLa regla es brutal de simple: cierras... y te callas. El silencio es del cliente. Respétalo.',
  NULL, NULL),
('6.3', 3, 'why_it_works', 'static',
  'La decisión que él toma solo, es la que no se cae.',
  E'Cuando aguantas el silencio, el cliente termina su deliberación y decide él — y una decisión propia se defiende sola: no hay remordimiento, no hay "me presionaron", no hay cancelación mañana.\n\nCuando llenas el silencio, aunque cierre, la decisión quedó contaminada de tu ansiedad — y esas son las ventas que se caen a la semana.\n\nEn este reto el cliente va a pensar de verdad. Tu examen no es hablar bien. Es callarte mejor.',
  NULL, NULL);

UPDATE public.nodes SET
  name = 'BOSS: Extrae la Decisión',
  description = 'La conversación completa contra el cliente que todo lo mide en pesos. Constrúyele el valor, aguanta su presión — y extráele la decisión.',
  node_type = 'boss', engine_type = NULL, conversation_scope = 'close', difficulty_level = 4,
  is_boss = true,
  boss_goal = 'Conducir la conversación completa — del saludo al cierre — con un cliente obsesionado con el precio: construir valor antes que hablar de dinero, sostener el precio sin descuentos de pánico, cerrar asumido en el pico y aguantar el silencio hasta extraer la decisión.',
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["closing.cierre_asumido", "closing.lectura_senales", "closing.sin_miedo", "presentation.conectar_dolor", "impulse.miedo_perdida", "impulse.indiferencia"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "you_do": {
        "prompt": "Eres el dueño de un negocio de perfil PRECIO-OBSESIVO: todo lo mides en pesos, presumes de nunca pagar de más, y tu primera pregunta ante cualquier producto es cuánto cuesta. No eres grosero — eres tacaño con orgullo. GUION: (1) Recibes la apertura con normalidad seca; en tus primeras 2-3 respuestas sueltas UN bloqueo reflejo suave (ando ocupado / hoy no ando comprando) — espejo AIR estándar. (2) Tienes un DOLOR REAL (elige: faltantes quincenales que te cuestan clientes / anaquel con ocho mil pesos muertos / línea pedida que no consigues) — revelable solo por capas con la pista del aunque. (3) TU MECÁNICA DE PRECIO: en cuanto el vendedor menciona su producto o empieza a presentar, INTERRUMPES con la pregunta: ¿y cuánto cuesta eso? — es tu prueba de fuego. Regla espejo: si el vendedor te da el precio seco sin valor construido, lo destrozas: uy no, carísimo, el otro me lo da más barato — y tu interés muere salvo rescate excepcional. Si el vendedor POSPONE el precio con naturalidad y sigue construyendo valor primero (ahorita le digo el número exacto — pero primero déjeme enseñarle la cuenta que le va a importar más), lo respetas: a ver, sorpréndame. (4) Cuando el valor esté construido (tu pérdida calculada con tus números te pone serio) y el precio llegue anclado a esa cuenta, haces UNA presión final de regateo: ¿y si me lo deja en menos le entro hoy? — espejo: descuento de pánico = hueles debilidad y aprietas más (entonces sí puede bajarle, ¿verdad? bájele otro poco); firmeza serena con estructura (el precio es ese porque la cuenta ya lo paga solo — si quiere volumen, el combo de 8 le baja la pieza) = respeto y avance. (5) Cuando el vendedor cierre asumido, tu deliberación de tacaño se activa: pausa pensativa (mmm... déjeme sacar cuentas...) — si aguanta el silencio, decides a favor: va, pero me lo entrega el lunes sin falta; si lo llena con retrocesos, la duda te gana y aplázas. (6) Señal de compra: cuando el valor te convenza, sueltas un ¿y el pedido mínimo cuál es? a mitad de su flujo — quien la cosecha, cierra; quien sigue presentando, te enfría. Tu techo: trato cerrado con condición práctica — nunca entusiasmo.",
        "objective": "El vendedor conduce la conversación completa con el precio-obsesivo: apertura y AIR estándar, excava el dolor por capas, POSPONE la pregunta de precio hasta construir el valor (la cuenta de la pérdida con los números del cliente), entrega el precio anclado al valor, sostiene el regateo sin descuentos de pánico (firmeza con estructura), cosecha la señal de compra cerrando asumido en el pico, y aguanta la deliberación final en silencio hasta que el cliente decide. El scope se cubre cuando el trato quedó cerrado con opción elegida."
      },
      "closing": {
        "message": "El señor que nunca paga de más acaba de decidir contigo — sin un solo descuento de pánico. Construiste el valor, sostuviste el precio, cosechaste el pico y aguantaste el silencio. Eso es extraer una decisión. El mundo del cierre es tuyo. Vamos al desglose."
      }
    },
    "success_criteria": [
      {"id": "closing.cierre_asumido", "weight": 0.2, "description": "El cierre llega asumido con opciones en el momento del pico — sin preguntas de interés ni puertas al no en todo el tramo final."},
      {"id": "closing.sin_miedo", "weight": 0.2, "description": "Sostiene la deliberación final en silencio sereno — sin retractarse, descontar ni reabrir — hasta la decisión propia del cliente. Y sostiene el regateo previo con firmeza estructurada, sin descuentos de pánico."},
      {"id": "presentation.conectar_dolor", "weight": 0.2, "description": "Pospone el precio ante la prueba de fuego y construye el valor primero: el dolor excavado, la cuenta con los números del cliente, y el precio entregado ANCLADO a esa cuenta."},
      {"id": "impulse.miedo_perdida", "weight": 0.15, "description": "La matemática de la pérdida actual del cliente — con sus datos — es el ancla que hace chico al precio."},
      {"id": "closing.lectura_senales", "weight": 0.15, "description": "Cosecha la señal (¿y el pedido mínimo?) deteniendo el flujo y cerrando ahí — sin beneficios extra tras la señal."},
      {"id": "impulse.indiferencia", "weight": 0.1, "description": "SW3 ante el destrozo de precio y el regateo: sereno, sin perseguir, sin ansiedad textual — el tacaño respeta al que no necesita venderle."}
    ],
    "failure_criteria": [
      {"id": "precio_sin_valor", "severity": "critical", "description": "Suelta el precio seco ante la primera pregunta, sin valor construido — el destrozo del cliente (carísimo) domina el resto de la sesión. La lección central contra el precio-obsesivo."},
      {"id": "descuento_de_panico", "severity": "critical", "description": "Cede al regateo bajando el precio sin estructura ni razón — el tacaño huele la debilidad y aprieta más: el precio pierde piso y la venta, dignidad."},
      {"id": "llena_el_silencio", "severity": "major", "description": "No aguanta la deliberación final: se retracta, achica el pedido o reabre la decisión."},
      {"id": "sigue_presentando", "severity": "major", "description": "Deja pasar la señal del pedido mínimo por seguir con el guion."},
      {"id": "abre_puerta_al_no", "severity": "major", "description": "Cierra con pregunta de interés o propone el aplazamiento."},
      {"id": "debate_bloqueo", "severity": "major", "description": "Argumenta el bloqueo inicial en lugar de atravesarlo con AIR."},
      {"id": "impulso_falso", "severity": "critical", "description": "Inventa datos, escasez o urgencia para sostener el precio o acelerar el cierre."},
      {"id": "monologo", "severity": "minor", "description": "Bloques largos que le dan aire al tacaño para atrincherarse."}
    ],
    "limits": {
      "max_turns": 20,
      "max_duration_seconds": 480,
      "min_turns_before_evaluation": 8
    },
    "notes": "BOSS del Mundo 6 contra el arquetipo precio_obsesivo d4."
  }'::jsonb
WHERE id = '6.4';

DELETE FROM public.node_quiz_questions WHERE node_id = '6.4';
DELETE FROM public.node_cards WHERE node_id = '6.4';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('6.4', 1, 'concept', 'static',
  'El séptimo Boss.',
  E'Este señor presume de nunca pagar de más. Su primera pregunta va a ser "¿cuánto cuesta?" — y es una trampa: el precio sin valor construido siempre es carísimo.\n\nTu misión, la conversación completa: atraviesa su bloqueo, excava su dolor, POSPONLE el precio con gracia hasta que la cuenta de SU pérdida hable por ti. Sostén el regateo sin regalar un peso de pánico — si cedes, aprieta más. Cosecha su señal. Cierra asumido. Y cuando se quede callado sacando cuentas... cállate tú también.\n\nEl que nunca paga de más está a punto de pagarte con gusto. Si haces el trabajo.',
  NULL, NULL);

UPDATE public.nodes
SET practice_script = jsonb_set(practice_script, '{limits,max_turns}', '8'::jsonb)
WHERE id = '0.1' AND practice_script IS NOT NULL
  AND (practice_script->'limits'->>'max_turns')::int > 8;

CREATE TABLE IF NOT EXISTS public.director_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  session_id uuid,
  node_id text,
  decision text NOT NULL,
  cut_reason text,
  user_turns int,
  elapsed_seconds numeric,
  classifier_ran boolean,
  scope_covered boolean,
  evidence_sufficient boolean,
  latency_ms int,
  director_version text
);
GRANT SELECT ON public.director_decisions TO authenticated;
GRANT ALL ON public.director_decisions TO service_role;
ALTER TABLE public.director_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "director_decisions readable by authenticated"
  ON public.director_decisions FOR SELECT TO authenticated USING (true);