-- Insert stub rows for 8.0-8.3 so subsequent UPDATEs in M8 SQL apply.
INSERT INTO public.nodes (id, world_id, name, order_index, is_boss, node_type)
VALUES
  ('8.0', 8, 'Consolidación 8.0', 0, false, 'knowledge'),
  ('8.1', 8, 'Consolidación 8.1', 1, false, 'skill_drill'),
  ('8.2', 8, 'Consolidación 8.2', 2, false, 'skill_drill'),
  ('8.3', 8, 'Consolidación 8.3', 3, true,  'boss')
ON CONFLICT (id) DO NOTHING;

-- Corrige flags is_boss faltantes en la estructura ACTUAL del mapa.
UPDATE public.nodes SET is_boss = true WHERE id IN ('0.4','1.5','4.5','8.3');

-- ════════════════════════════════════════════════════════════
-- NODO 8.0 — DONDE LAS VENTAS SE SALVAN (knowledge)
-- ════════════════════════════════════════════════════════════
UPDATE public.nodes SET
  name = 'Donde las Ventas Se Salvan',
  description = 'La venta más frágil del mundo es la que se acaba de cerrar. Aprende por qué se caen — y el paso que las blinda.',
  node_type = 'knowledge', engine_type = 'classify', conversation_scope = NULL, difficulty_level = 2
WHERE id = '8.0';

DELETE FROM public.node_quiz_questions WHERE node_id = '8.0';
DELETE FROM public.node_cards WHERE node_id = '8.0';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('8.0', 1, 'concept', 'static',
  'El enemigo invisible: el remordimiento del comprador',
  'El cliente dijo que sí. Te fuiste feliz. Y esa noche, solo con su decisión, le llega la visita: "¿habré hecho bien? ¿y si no me rota? ¿qué le voy a decir a mi esposa si esto no jala?"

Eso es el remordimiento del comprador — y le pasa a TODOS. La diferencia entre la venta que se sostiene y la que se cancela mañana no es el producto: es con cuánta claridad y tranquilidad se quedó el cliente cuando saliste por la puerta.',
  NULL, NULL),
('8.0', 2, 'concept', 'static',
  'La causa #1 de cancelación: falta de comprensión.',
  'Las ventas no se caen porque el cliente "se arrepintió del producto". Se caen porque no entendió algo: cuándo llega, cuánto va a pagar exactamente, qué hace si algo sale mal, qué sigue después.

Cada hueco de comprensión es una grieta — y el remordimiento nocturno se mete por las grietas. La consolidación existe para sellarlas TODAS antes de irte: qué llega, cuándo llega, qué cuesta, qué hace él, qué haces tú, y a quién le habla si algo falla.',
  NULL, NULL),
('8.0', 3, 'concept', 'static',
  'El mal paso 5 y el buen paso 5',
  'MAL paso 5: toda la explicación al INICIO de la relación (el vendedor que abruma con condiciones antes de vender) y al final... nada: "¡excelente decisión! cualquier cosa me marca" — y se fue corriendo con su comisión.

BUEN paso 5: la explicación llega DESPUÉS del sí — concisa, clara, completa. Y el vendedor se va al final con calma, dejando dos cosas sembradas: la relación (CPR de despedida) y la siguiente puerta (la próxima visita, el conocido al que le puede servir).',
  NULL, NULL),
('8.0', 4, 'why_it_works', 'static',
  'La consolidación es donde nace tu segundo cliente.',
  'Un cliente bien consolidado hace dos cosas que valen oro: NO cancela (entendió todo, durmió tranquilo) y TE RECOMIENDA (la confianza del final de la visita es la que se cuenta a los amigos).

El vendedor promedio ve el sí como la meta. El Closer lo ve como la mitad: la venta se cierra en el paso 4 — pero se GANA en el 5. Y la siguiente venta, también.',
  NULL, NULL);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong) VALUES
('8.0', 1,
  'El cliente firmó el pedido. El vendedor, feliz: "¡Excelente decisión, no se va a arrepentir! Cualquier cosa me marca, ¿eh?" — y se va. Esa noche el cliente piensa: "¿y cuándo dijo que llegaba? ¿y si me mandan otra cosa?" ¿Qué pasó?',
  'Nada — la venta ya estaba cerrada.',
  'El vendedor dejó grietas de comprensión abiertas — y el remordimiento nocturno se mete exactamente por ahí. Esa venta está en riesgo.',
  'El cliente es indeciso, no es culpa del vendedor.',
  NULL, 'B',
  'La causa #1 de cancelación no es arrepentimiento del producto — es no haber entendido algo. Cuándo llega, qué hace si falla, qué sigue. Cada hueco es una grieta, y las grietas se sellan ANTES de salir por la puerta, no "cualquier cosa me marca".',
  'La venta cerrada es la venta más frágil que existe — esa noche llega el remordimiento del comprador, y busca grietas: ¿cuándo llega? ¿y si sale mal? El "cualquier cosa me marca" no sella nada. La consolidación era el paso que faltó — y puede costar la venta completa.'),
('8.0', 2,
  '¿Cuáles son los DOS propósitos del paso de consolidación?',
  'Cobrar rápido y salir a la siguiente visita.',
  'Dejar próximos pasos cristalinos (sellar la comprensión) y capitalizar al cliente positivo (relación + siguiente oportunidad).',
  'Repetir la presentación completa para reforzar la decisión.',
  NULL, 'B',
  'Los dos, en ese orden: primero la claridad — qué llega, cuándo, qué sigue, qué hace si algo falla — que blinda la venta contra el remordimiento. Y luego la cosecha: la relación sembrada y la puerta a la siguiente venta o al referido.',
  'Ni la prisa ni la re-presentación. Repetir la venta después del sí siembra dudas (¿por qué me sigue convenciendo?). Los dos propósitos reales: comprensión total (la venta que se entiende no se cancela) y capitalización (la relación y la siguiente puerta).'),
('8.0', 3,
  '¿Por qué "la venta se cierra en el paso 4 pero se GANA en el 5"?',
  'Porque en el 5 se firma el contrato legal.',
  'Porque el sí del paso 4 es frágil hasta que la comprensión y la confianza del paso 5 lo blindan — y porque del 5 salen la recompra y los referidos.',
  'Porque el paso 5 es donde se negocia el precio final.',
  NULL, 'B',
  'Exacto. Sin consolidación, el sí es una promesa a merced del remordimiento nocturno. Con ella, es una decisión blindada — y además sembraste la siguiente: el cliente que se queda tranquilo es el que te recomienda y te recompra.',
  'No es papeleo ni precio — es blindaje y siembra. El sí recién nacido es frágil: el paso 5 lo protege con comprensión total, y de pasada construye lo que vale más que esta venta: la relación que trae la siguiente.');

-- ════════════════════════════════════════════════════════════
-- NODO 8.1 — SELLA EL TRATO (skill_drill)
-- ════════════════════════════════════════════════════════════
UPDATE public.nodes SET
  name = 'Sella el Trato',
  description = 'El cliente acaba de decir sí. Los siguientes tres minutos deciden si esa venta vive o se cae esta noche.',
  node_type = 'skill_drill', engine_type = NULL, conversation_scope = 'full', difficulty_level = 3,
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["consolidation.proteger_venta", "relationship.cpr"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "i_do": {
        "briefing": "El cliente acaba de decir que sí. Escucha lo que hago en los tres minutos siguientes — porque aquí es donde la venta se blinda o se agrieta. Claridad total, calma total, y la relación sembrada al final.",
        "first_message": "Acaba de decir: va, hágame el pedido de las 8. Yo NO celebro ni salgo corriendo. Sello: Perfecto Don Ramón — le repito cómo queda para que no haya sorpresas: son 8 cajas del multigrado, le llegan el lunes antes de mediodía, se paga contra entrega, y el flete ya va incluido. Si el lunes a la una no ha llegado el camión, me marca directo a mí — este es mi número. ¿Le quedó alguna duda de cómo va a funcionar? — Y ya que está tranquilo, la despedida siembra: Oiga, y que le vaya bonito el fin con los nietos que me platicó — el lunes que venga con la entrega me cuenta cómo quedó el partido. — Comprensión sellada. Relación sembrada. Esa venta ya no se cae."
      },
      "you_do": {
        "prompt": "Eres el dueño de un negocio que ACABA de decir que sí: tu primera línea de la sesión es el cierre del trato — Va, me convence. Hágame el pedido entonces — dicha con decisión pero con esa micro-inquietud de quien acaba de comprometerse. Tienes VIDA ya conocida en la conversación (elige 1: los nietos que ayudan el fin de semana / el equipo del que eres fan / la remodelación que traes a medias). TU MECÁNICA POST-SÍ: tienes TRES dudas latentes que NO preguntas de entrada — las sueltas solo si el vendedor NO las sella solo: (a) cuándo llega exactamente, (b) qué pasa si algo sale mal o no llega, (c) cuánto y cómo se paga al final. REGLAS ESPEJO: (1) Si el vendedor SELLA proactivamente — repite el trato completo con claridad (qué, cuándo, cuánto, qué hace si falla) y verifica tu comprensión — tus dudas mueren antes de nacer: confirmas tranquilo (perfecto, así quedamos entonces) y tu confianza se nota. (2) Si el vendedor CELEBRA y corre (¡excelente decisión! cualquier cosa me marca), tus dudas latentes salen una por una con tono de inquietud creciente: oiga, ¿y cuándo me estaría llegando eso?... ¿y si no llega qué hago?... y si las respuestas son vagas, tu remordimiento asoma: ¿sabe qué? déjeme confirmarle mañana mejor. (3) Si el vendedor RE-VENDE después del sí (más beneficios, más argumentos), te extraña: ya me convenció, hombre — ¿o hay algo que no me ha dicho? y una semilla de duda queda. (4) Si al final siembra la relación con tu vida (los nietos, el partido, la remodelación) con genuinidad, la despedida sale cálida y personal. Tu techo: cliente sellado y contento que repite los términos de vuelta.",
        "objective": "El vendedor consolida el sí recién nacido: (1) sella la comprensión proactivamente — repite el trato completo (qué llega, cuándo, cuánto, cómo se paga, qué hacer si algo falla) y verifica que el cliente lo entendió, matando las dudas antes de que nazcan; (2) no celebra en exceso ni re-vende lo vendido; (3) siembra la relación en la despedida retomando la vida del cliente (CPR de cierre). El scope se cubre cuando el cliente confirmó los términos tranquilo y la despedida salió cálida y personal."
      },
      "closing": {
        "message": "El sí que te dieron hace tres minutos era una promesa frágil. El que te llevas ahora es una decisión blindada — con la relación sembrada encima. Esa venta ya no se cae esta noche. Vamos al detalle."
      }
    },
    "success_criteria": [
      {"id": "consolidation.proteger_venta", "weight": 0.6, "description": "Sella la comprensión proactivamente tras el sí: repite el trato completo con claridad (producto, cantidad, fecha de entrega, monto y forma de pago, y qué hacer si algo falla) y verifica la comprensión del cliente — las tres dudas latentes mueren sin nacer o quedan respondidas con precisión. Sin celebración excesiva ni re-venta."},
      {"id": "relationship.cpr", "weight": 0.4, "description": "La despedida siembra la relación: retoma con genuinidad algo de la vida del cliente ya conocida en la conversación (los nietos, el partido, su proyecto) — el cierre es de personas, no de transacción."}
    ],
    "failure_criteria": [
      {"id": "celebra_y_corre", "severity": "critical", "description": "Tras el sí: celebración, agradecimiento efusivo y salida rápida (¡excelente decisión! cualquier cosa me marca) sin sellar la comprensión — las dudas del cliente nacen huérfanas y el remordimiento nocturno tiene la puerta abierta. El error que este mundo existe para matar."},
      {"id": "reabre_la_venta", "severity": "major", "description": "Sigue vendiendo después del sí — más beneficios, más argumentos: el cliente ya decidió y la re-venta solo siembra la duda de qué no le han dicho."},
      {"id": "proximos_pasos_vagos", "severity": "major", "description": "Su sellado es impreciso: fechas sin hora ni día concreto, montos sin número, ahí luego vemos cómo se paga — las grietas quedan abiertas con apariencia de selladas."},
      {"id": "sobre_celebra", "severity": "minor", "description": "El festejo desborda (¡no se va a arrepentir! ¡es la mejor decisión que ha tomado!) — huele a comisión y despierta la sospecha inversa."},
      {"id": "monologo", "severity": "minor", "description": "Sella en un bloque interminable sin verificar comprensión — recitar no es sellar."}
    ],
    "limits": {
      "max_turns": 8,
      "max_duration_seconds": 180,
      "min_turns_before_evaluation": 2
    },
    "notes": "El drill del post-sí: el Actor entra con el trato recién cerrado y tres dudas latentes que solo emergen si no se sellan proactivamente — la mecánica enseña que consolidar es adelantarse a las grietas, no responderlas. celebra_y_corre es critical: es EL antipatrón del paso 5."
  }'::jsonb
WHERE id = '8.1';

DELETE FROM public.node_quiz_questions WHERE node_id = '8.1';
DELETE FROM public.node_cards WHERE node_id = '8.1';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('8.1', 1, 'concept', 'static',
  'Los tres minutos que blindan la venta',
  'El cliente acaba de decir sí — y su cabeza, sin que lo diga, ya está incubando tres preguntas: ¿cuándo me llega? ¿qué hago si algo sale mal? ¿cuánto acabo pagando exactamente?

Si esas preguntas se quedan sin respuesta, esta noche se convierten en remordimiento. Tu trabajo en los siguientes tres minutos: matarlas ANTES de que nazcan. Repite el trato completo — qué, cuándo, cuánto, y el plan B si algo falla. Y verifica: "¿le quedó alguna duda de cómo va a funcionar?"',
  NULL, NULL),
('8.1', 2, 'concept', 'static',
  'Lo que NO se hace después del sí',
  'NO celebres de más: "¡no se va a arrepentir!" huele a comisión — y despierta la pregunta inversa: ¿de qué me podría arrepentir?

NO sigas vendiendo: el cliente ya decidió. Cada beneficio extra después del sí siembra la duda de qué no le has dicho.

NO salgas corriendo: la prisa del vendedor tras el sí es la imagen que el cliente recuerda esa noche — y no le gusta.

Calma. Claridad. Y la relación sembrada al salir.',
  NULL, NULL),
('8.1', 3, 'why_it_works', 'static',
  'La despedida es de personas, no de facturas.',
  'Ya sellaste la comprensión. El último toque es el CPR de cierre: retoma algo de SU vida que la conversación te regaló — "que le vaya bonito el fin con los nietos; el lunes me cuenta cómo quedó el partido."

Ese detalle hace dos cosas: convierte la transacción en relación (la próxima visita ya no es de vendedor — es de conocido), y le deja al cliente la última emoción de la visita: calidez. Y la última emoción es la que se recuerda... y la que se cuenta.',
  NULL, NULL);

-- ════════════════════════════════════════════════════════════
-- NODO 8.2 — LA SIGUIENTE PUERTA (skill_drill)
-- ════════════════════════════════════════════════════════════
UPDATE public.nodes SET
  name = 'La Siguiente Puerta',
  description = 'El cliente contento es la mejor puerta a tu siguiente cliente — si sabes abrirla sin que rechine.',
  node_type = 'skill_drill', engine_type = NULL, conversation_scope = 'full', difficulty_level = 3,
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["consolidation.siguiente_oportunidad", "relationship.cpr"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "i_do": {
        "briefing": "El cliente quedó contento y sellado. Escucha cómo abro la siguiente puerta — la próxima visita y el referido — sin que suene a formulario ni a cobro de favor.",
        "first_message": "El trato está sellado y el ambiente es bueno. Primera puerta, la recompra: Entonces quedamos así — yo paso cada semana por esta ruta; ¿le late que le caiga los lunes para ver cómo va rotando y que nunca ande corto? — Natural: es servicio, no acoso. Segunda puerta, el referido — anclada en la plática, nunca en frío: Oiga, ahorita que me platicó de su compadre el del taller de la Juárez... ¿usted cree que a él le sirva esto de la entrega semanal? Si gusta, dígale que voy de su parte — nomás eso. — Fíjate: nació de SU plática, es una pregunta ligera, y el que queda bien presentándome... es él."
      },
      "you_do": {
        "prompt": "Eres el dueño de un negocio con el trato recién sellado y de buen humor: el vendedor hizo bien su trabajo, estás contento con la compra. Tu primera línea lo refleja: Pues quedamos entonces — la verdad se me hace buen trato. En tu conversación previa (dala por ocurrida) mencionaste de pasada DOS anclas: un conocido con negocio similar (elige: tu compadre el del taller de la otra colonia / tu cuñado que tiene la refaccionaria por el mercado) y que tú andas ocupado los fines de semana. REGLAS ESPEJO: (1) RECOMPRA — si el vendedor propone la siguiente visita con naturalidad de servicio (día concreto, razón útil: para que no ande corto), aceptas con gusto y hasta sugieres el mejor día. Si no la propone, no la ofreces tú. (2) REFERIDO — si el vendedor ancla la pregunta en el conocido que TÚ mencionaste, con ligereza y sin presión (¿cree que le sirva? / dígale que voy de su parte), respondes generoso: le das el nombre, dónde está, y hasta un consejo (dígale que va de mi parte, pero cáigale en la mañana que en la tarde anda de malas). (3) Si el referido llega EN FRÍO y transaccional (¿no tiene conocidos que quieran comprar? / me ayudaría mucho con referencias / ¿me pasa 3 contactos?), te incomoda visiblemente: pues... déjeme pensar quién... la verdad no sé — y evades. (4) Si insiste tras tu evasión, la incomodidad crece: mire, mejor luego le aviso si se me ocurre alguien. (5) Si el vendedor cierra la visita cálido retomando tu vida, la despedida sale de conocidos.",
        "objective": "El vendedor abre las dos puertas siguientes con naturalidad: (1) propone la próxima visita como servicio concreto (día, razón útil para el cliente) y (2) pide el referido ANCLADO en el conocido que el propio cliente mencionó — con ligereza, sin presión y sin tono transaccional — logrando nombre y bendición (voy de su parte). El scope se cubre cuando ambas puertas quedaron abiertas: siguiente visita acordada y referido concedido con gusto."
      },
      "closing": {
        "message": "Saliste con más de lo que entraste: la venta, la próxima visita agendada... y un compadre esperándote de su parte. Esa es la matemática silenciosa de la consolidación: cada cliente bien cerrado trae al siguiente. Vamos al detalle."
      }
    },
    "success_criteria": [
      {"id": "consolidation.siguiente_oportunidad", "weight": 0.6, "description": "Abre ambas puertas con naturalidad: la recompra como servicio concreto (día y razón útil, no acoso) y el referido anclado en el conocido que el cliente mencionó — pregunta ligera, sin presión, que obtiene nombre y bendición. Nunca pide referidos en frío ni en tono transaccional."},
      {"id": "relationship.cpr", "weight": 0.4, "description": "El tono de todo el tramo es de relación: retoma las anclas personales del cliente, la despedida es cálida y de conocidos — las puertas se abren desde la confianza construida, no desde el formulario."}
    ],
    "failure_criteria": [
      {"id": "referido_en_frio", "severity": "critical", "description": "Pide referidos sin ancla y en tono transaccional (¿no tiene conocidos que quieran comprar?, ¿me pasa unos contactos?) — el cliente contento se incomoda y la puerta rechina. El error central del nodo: el referido se ancla en la plática del cliente o no se pide."},
      {"id": "insiste_tras_evasion", "severity": "major", "description": "El cliente evadió el referido y el vendedor vuelve a pedirlo — la incomodidad escala y contamina la despedida."},
      {"id": "proximos_pasos_vagos", "severity": "major", "description": "Su siguiente visita es vaga (ahí me doy una vuelta un día de estos) — la puerta de la recompra queda entreabierta y sin fecha."},
      {"id": "sobre_celebra", "severity": "minor", "description": "Convierte el buen humor del cliente en festejo propio excesivo."},
      {"id": "monologo", "severity": "minor", "description": "Abre las puertas en bloque recitado sin espacio para el cliente."}
    ],
    "limits": {
      "max_turns": 8,
      "max_duration_seconds": 180,
      "min_turns_before_evaluation": 2
    },
    "notes": "El drill de la cosecha relacional: el Actor trae dos anclas sembradas (el conocido y su agenda) y premia al vendedor que las usa — el referido anclado fluye generoso, el frío incomoda. referido_en_frio es critical: la diferencia entre capitalizar la confianza y cobrarla."
  }'::jsonb
WHERE id = '8.2';

DELETE FROM public.node_quiz_questions WHERE node_id = '8.2';
DELETE FROM public.node_cards WHERE node_id = '8.2';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('8.2', 1, 'concept', 'static',
  'Cada cliente contento trae al siguiente — si le abres la puerta.',
  'La visita perfecta no termina en la venta. Termina con DOS puertas abiertas:

La recompra: "yo paso cada semana — ¿le late que le caiga los lunes para que nunca ande corto?" Es servicio, tiene día y tiene razón. El cliente que acepta tu ruta te acaba de convertir en SU proveedor.

El referido: la puerta al siguiente cliente... que él ya te mencionó sin darse cuenta.',
  NULL, NULL),
('8.2', 2, 'concept', 'static',
  'El referido se ancla — o no se pide.',
  'EN FRÍO suena así: "¿no tiene conocidos que quieran comprar?" — y el cliente más contento del mundo se incomoda: le acabas de cobrar la confianza.

ANCLADO suena así: "ahorita que me platicó de su compadre el del taller... ¿usted cree que a él le sirva esto? Si gusta, dígale que voy de su parte." — nació de SU plática, es ligero, y el que queda bien presentándote es ÉL.

La regla: si el cliente no te regaló el ancla en la conversación, la puerta del referido se queda para la próxima visita. Nunca se fuerza.',
  NULL, NULL),
('8.2', 3, 'why_it_works', 'static',
  'La matemática silenciosa de la consolidación',
  'Un vendedor que solo vende necesita encontrar cada cliente desde cero — puerta fría tras puerta fría, todos los días.

Un Closer que consolida construye una red: cada cliente sellado es una ruta semanal (recompra sin esfuerzo) y un puente a su compadre (puerta tibia, "va de mi parte"). A los seis meses, la mitad de sus ventas ya no empiezan en frío.

La Ley de los Promedios sigue mandando — pero la consolidación te mejora la proporción. Para siempre.',
  NULL, NULL);

-- ════════════════════════════════════════════════════════════
-- NODO 8.3 — BOSS: DE CLIENTE A ALIADO (full_sim)
-- ════════════════════════════════════════════════════════════
UPDATE public.nodes SET
  name = 'BOSS: De Cliente a Aliado',
  description = 'La venta ya está hecha — y ese es exactamente el examen. Un comprador formal, un trato recién firmado, y tu misión: que salga blindado, claro y de tu lado.',
  node_type = 'boss', engine_type = NULL, conversation_scope = 'full', difficulty_level = 4,
  boss_goal = 'Consolidar una venta recién cerrada con un comprador formal y meticuloso: sellar la comprensión hasta que él repita los términos con confianza, construir la relación con la formalidad que su perfil exige, y abrir la siguiente puerta — sin vender nada nuevo. Aquí vender de más es FALLAR.',
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["consolidation.proteger_venta", "consolidation.siguiente_oportunidad", "consolidation.relacion_largo_plazo", "relationship.cpr"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "you_do": {
        "prompt": "Eres el comprador/administrador FORMAL de un negocio establecido: meticuloso, ordenado, de trato correcto pero distante — las decisiones las documentas y los proveedores te han fallado antes en los DETALLES (entregas tarde, cobros distintos a lo hablado, nadie que responda cuando algo falla). ACABAS de aprobar la compra: tu primera línea es formal y trae la primera prueba — Muy bien, queda aprobado el pedido entonces. Ahora sí, dígame exactamente cómo vamos a operar esto — porque le soy franco: con el proveedor anterior lo hablado y lo entregado nunca coincidió. GUION DE PRUEBAS (una por vez, según avance): (1) PRUEBA DE PRECISIÓN — a cualquier término vago respondes pidiendo exactitud: ¿antes de mediodía es qué hora? / ¿contra entrega en efectivo o acepta transferencia? / ¿y eso queda por escrito dónde? Si el vendedor sella con precisión (fechas con hora, montos con número, canal de reclamo con nombre y teléfono), tu confianza sube visiblemente y lo reconoces: así da gusto, oiga. (2) PRUEBA DEL REMORDIMIENTO ANTICIPADO — a mitad de la consolidación sueltas tu cicatriz: ¿y si el camión no llega el lunes, yo a quién le hablo? — porque el anterior nada más no daba la cara. Espejo: respuesta concreta (nombre, teléfono, compromiso con plan B) = cicatriz sanada; respuesta vaga (no se preocupe, no va a pasar) = tu formalidad se enfría: eso mismo decía el otro. (3) PRUEBA DE LA RE-VENTA — si el vendedor intenta agregar productos o beneficios nuevos tras la aprobación, lo cortas formal: señor, la compra ya está aprobada — no la complique. (4) RELACIÓN A SU MANERA — eres formal, no frío: si el vendedor construye relación respetando tu estilo (interés genuino por el negocio y su historia, sin exceso de confiancitas), te abres UN grado: sueltas que llevas doce años administrando esto y que valoras a los proveedores que duran. Si se pone confianzudo de más (compadre, bromas tempranas), te retraes: guardemos las formas, ¿le parece? (5) SIGUIENTE PUERTA — si propone la visita siguiente con día y propósito concreto, la agendas formalmente (los lunes entonces, quedará anotado); el referido solo lo concedes si quedaste GENUINAMENTE convencido de la operación — y a tu manera: le voy a comentar al administrador del negocio de mi hermano — si él le llama, es que le hablé bien de usted. Tu techo: aliado formal — repites los términos de vuelta con confianza y cierras con un trato de largo plazo insinuado.",
        "objective": "El vendedor consolida la venta aprobada con el comprador formal: sella cada término con la precisión que el perfil exige (horas, montos, canales, plan B con nombre), sana la cicatriz del proveedor anterior con compromisos concretos, NO vende nada nuevo tras la aprobación, construye la relación en el registro formal del cliente (sin confiancitas), y abre la siguiente puerta con estructura (visita agendada). El scope se cubre cuando el cliente repite los términos de vuelta con confianza y la relación queda establecida en clave de largo plazo."
      },
      "closing": {
        "message": "Un administrador que ha visto fallar a todos sus proveedores acaba de repetir tu trato de memoria, agendar tu visita y hablarle de ti al negocio de su hermano. Eso no fue una venta — fue el nacimiento de un aliado. La consolidación es tuya. Vamos al desglose del mundo."
      }
    },
    "success_criteria": [
      {"id": "consolidation.proteger_venta", "weight": 0.35, "description": "Sella cada término con precisión de comprador formal: fechas con hora, montos con número, forma de pago explícita, y el plan B con nombre y canal concreto — supera las pruebas de precisión y sana la cicatriz del proveedor anterior con compromisos verificables, nunca con no se preocupe."},
      {"id": "consolidation.relacion_largo_plazo", "weight": 0.25, "description": "Ni un producto ni un beneficio nuevo tras la aprobación — la sesión completa opera en clave de proteger y construir, no de vender. Y el horizonte que comunica es de largo plazo: proveedor que dura, no visita que cobra."},
      {"id": "relationship.cpr", "weight": 0.2, "description": "Construye la relación EN EL REGISTRO del cliente: interés genuino y respetuoso por el negocio y su historia, sin confiancitas prematuras — logra el grado de apertura del formal (los doce años, el valor de los proveedores que duran)."},
      {"id": "consolidation.siguiente_oportunidad", "weight": 0.2, "description": "Abre la siguiente puerta con la estructura que el perfil pide: visita siguiente con día y propósito, agendada formalmente — y si el referido llega, es porque la operación convenció, no porque se pidió en frío."}
    ],
    "failure_criteria": [
      {"id": "reabre_la_venta", "severity": "critical", "description": "Intenta vender o agregar cualquier cosa tras la aprobación — el formal lo corta (no la complique) y el boss_goal se traiciona: aquí vender de más es fallar."},
      {"id": "proximos_pasos_vagos", "severity": "critical", "description": "Términos imprecisos ante el perfil que documenta todo: fechas sin hora, montos sin número, no se preocupe como plan B — la cicatriz del proveedor anterior se reabre: eso mismo decía el otro."},
      {"id": "celebra_y_corre", "severity": "major", "description": "Festeja la aprobación y acelera la salida sin sellar — el antipatrón del paso 5 ante el cliente que más lo castiga."},
      {"id": "confianzudo", "severity": "major", "description": "Rompe el registro formal con exceso de confianza prematura (compadre, bromas, palmadas verbales) — el cliente se retrae: guardemos las formas."},
      {"id": "referido_en_frio", "severity": "major", "description": "Pide el referido sin que la operación lo haya ganado — el formal lo considera una imprudencia."},
      {"id": "sobre_celebra", "severity": "minor", "description": "Elogios y festejos desbordados que el perfil formal lee como falta de seriedad."},
      {"id": "monologo", "severity": "minor", "description": "Bloques largos — el formal aprecia la precisión, no el discurso."}
    ],
    "limits": {
      "max_turns": 14,
      "max_duration_seconds": 300,
      "min_turns_before_evaluation": 5
    },
    "notes": "BOSS del Mundo 8 contra el arquetipo corporativo_formal d4 — el primer boss donde el boss_goal NO incluye vender: la venta ya ocurrió y agregarle es critical. Tres pruebas del perfil: precisión (el formal castiga la vaguedad), la cicatriz del proveedor anterior (remordimiento anticipado — se sana con concreto, se reabre con no se preocupe), y el registro relacional (formal ≠ frío; confianzudo = retroceso). La rendición a su manera: repite los términos de memoria y le habla de ti al negocio de su hermano."
  }'::jsonb
WHERE id = '8.3';

DELETE FROM public.node_quiz_questions WHERE node_id = '8.3';
DELETE FROM public.node_cards WHERE node_id = '8.3';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('8.3', 1, 'concept', 'static',
  'El octavo Boss.',
  'La venta ya está hecha — un administrador formal acaba de aprobar tu pedido. Y ahí empieza tu examen, porque a este señor todos sus proveedores le han fallado en los DETALLES: entregas tarde, cobros distintos, nadie que dé la cara.

Tu misión NO es vender — de hecho, vender algo más aquí es reprobar. Es sellar: cada término con hora y número, el plan B con nombre y teléfono, su cicatriz sanada con compromisos que se puedan cobrar. Relación sí — pero a su manera: formal, ganada, sin confiancitas.

Ganas cuando él repita tu trato de memoria... y le hable de ti al negocio de su hermano. Así se fabrica un aliado.',
  NULL, NULL);