-- ============================================================
-- CLOSER — MUNDO 2: LA HISTORIA BREVE  (reconstruccion v2)
-- ============================================================
-- Segunda parte de la migracion de 10 mundos -> 6 + certificacion.
-- Archivo AUTOCONTENIDO e IDEMPOTENTE: borra y reinserta el
-- Mundo 2 completo. Es la unica fuente de verdad de este mundo.
--
-- 11 nodos. Cuatro tecnicas que HOY NO EXISTEN en la app:
--   FORMS, el desvio con regreso, el Ataque Preventivo,
--   y Close With Action.
--
-- REGLAS APLICADAS:
--   Acronimo primero, desglose despues.
--   Ningun termino se usa antes del nodo que lo ensena.
--   knowledge 4-8 tarjetas / skill_drill 3 / boss 1.
--   Dificultad M2: knowledge 1, drill 2, boss 3.
--   Doctrina universal: sin contexto de industria horneado.
--   La palabra "pitch" nunca se usa en negativo.
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- PASO 1 — LIMPIAR EL MUNDO 2 VIEJO
-- ════════════════════════════════════════════════════════════

DELETE FROM public.node_quiz_questions
  WHERE node_id IN (SELECT id FROM public.nodes WHERE world_id = 2);
DELETE FROM public.node_cards
  WHERE node_id IN (SELECT id FROM public.nodes WHERE world_id = 2);
DELETE FROM public.node_progress
  WHERE node_id IN (SELECT id FROM public.nodes WHERE world_id = 2);
UPDATE public.practice_sessions SET node_id = NULL
  WHERE node_id IN (SELECT id FROM public.nodes WHERE world_id = 2);
DELETE FROM public.nodes WHERE world_id = 2;


-- ════════════════════════════════════════════════════════════
-- PASO 2 — LA TABLA WORLDS
-- ════════════════════════════════════════════════════════════

UPDATE public.worlds SET
  name = 'La Historia Breve',
  emotional_name = 'Quien Eres y Por Que Estas Aqui',
  description = 'El cliente ya te puso atencion. Ahora necesita saber con quien esta hablando.',
  order_index = 2,
  boss_level_name = 'BOSS: La Puerta Fria',
  boss_level_description = 'Un cliente que bloquea de entrada. Atraviesalo y sigue.'
WHERE id = 2;


-- ════════════════════════════════════════════════════════════
-- PASO 3 — SKILLS
-- ════════════════════════════════════════════════════════════

INSERT INTO public.skills
  (id, code, name, short_description, category, world_id_introduced,
   level_required, mastery_threshold, reinforcement_threshold,
   skill_type, decay_half_life_days, requires_audio, status)
VALUES
  ('relationship.forms', 'S-055', 'FORMS',
   'Los cinco caminos a la persona: Family, Occupation, Recreation, Motivation, Sports. De que hablar para crear relacion personal.',
   'relationship', 2, 'rookie', 80, 50, 'tecnica', 180, false, 'active'),
  ('blocks.pre_emptive_strike', 'S-056', 'Ataque Preventivo',
   'Desactiva un negativo conocido diciendolo tu antes que el cliente. Si das la negativa antes de que el la de, deja de ser negativa.',
   'blocks', 2, 'rookie', 80, 50, 'tecnica', 180, false, 'active'),
  ('flow.close_with_action', 'S-057', 'Close With Action',
   'Avanzar en la linea sin esperar a que el cliente tome el control. Una pregunta o accion cuya respuesta solo tiene sentido si el cliente sigue avanzando.',
   'flow', 2, 'rookie', 80, 50, 'tecnica', 180, false, 'active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  category = EXCLUDED.category,
  world_id_introduced = EXCLUDED.world_id_introduced,
  status = 'active';

UPDATE public.skills SET world_id_introduced = 2
  WHERE id IN ('story.historia_breve','story.relevancia_cliente','story.brevedad',
               'blocks.air','relationship.cpr');


-- ════════════════════════════════════════════════════════════
-- PASO 4 — NODOS
-- ════════════════════════════════════════════════════════════

INSERT INTO public.nodes
  (id, world_id, name, technique, order_index, is_boss, reps_required,
   difficulty_level, description, node_type, engine_type, boss_goal,
   field_mission, practice_script)
VALUES

('2.0', 2, 'Quien Eres en 15 Segundos', 'kiss', 0, false, 1, 1,
 'El cliente tiene dos preguntas en la cabeza: quien es este y que quiere. Contestalas antes de que se las conteste solo.',
 'knowledge', 'none', NULL, NULL, NULL),

('2.1', 2, 'Tu Historia Breve', 'historia_breve', 1, false, 2, 2,
 'Quien eres, de donde vienes y por que estas ahi. En quince segundos.',
 'skill_drill', 'claude', NULL,
 'TU MISION: te acaban de preguntar quien eres. Contesta en quince segundos: quien, de donde y por que estas aqui. Y que le importe a EL, no a ti.',
 '{
   "version": "2.0.0", "i_do_type": "demo",
   "scope": {"skills_in_focus": ["story.historia_breve", "story.brevedad", "story.relevancia_cliente"], "out_of_scope_behavior": "redirect"},
   "phases": {
     "i_do": {
       "briefing": "Me van a preguntar quien soy. Cuenta cuantas frases uso: tres. Quien soy, por que estoy aqui, y una pregunta que le devuelve la palabra. Fijate en lo que NO digo: no cuento la historia de mi empresa, no enumero productos, no doy fechas ni cifras. Todo eso viene despues, y solo si el lo pide.",
       "first_message": "Soy Emilio, ando trabajando con los negocios de esta zona. Me tocaba pasar por aqui y quise conocer el suyo. Cuenteme, cuanto tiempo lleva con el?"
     },
     "you_do": {
       "prompt": "Eres el encargado de un negocio. La conversacion arranco bien y acabas de preguntarle al vendedor quien es. TU REGLA PRINCIPAL: reaccionas al LARGO y a la RELEVANCIA de su respuesta. Si contesta breve (dos o tres frases) y te dice algo que a TI te importa, te relajas, contestas con gusto y sigues la conversacion. Si se extiende — historia de la empresa, anos en el mercado, lista de productos, certificaciones, mas de cuatro frases seguidas — empiezas a desconectarte: contestas con ajam, miras a otro lado, dices que andas ocupado. No lo cortas de golpe, te vas apagando. Si te habla puro de el y de su empresa sin conectar con tu negocio, contestas cortes pero sin interes. Si termina con una pregunta abierta, la contestas con gusto. Si termina sin pregunta, te quedas callado esperando, y el silencio se siente incomodo. NUNCA preguntes por productos ni precios en este ejercicio. Responde en 1 o 2 frases.",
       "objective": "El vendedor responde quien es en dos o tres frases, conectando su presencia con algo que le importe al cliente, y devuelve la palabra con una pregunta. El scope se cubre cuando el cliente se relaja y sigue la conversacion por su propia voluntad."
     },
     "closing": {
       "message": "Eso es una historia breve. Quince segundos, dos piezas y un gancho. El cliente ya sabe con quien habla y sigue contigo, que es exactamente lo que este paso tiene que lograr. Vamos al detalle.",
       "message_incomplete": "Ahi lo dejamos, ya vi como te presentas. Vamos al desglose y te digo que le sobraba o que le faltaba."
     }
   },
   "success_criteria": [
     {"id": "story.historia_breve", "weight": 0.4, "description": "Dice quien es y por que esta ahi: nombre, de donde viene, y el motivo de la visita en terminos humanos. Las dos piezas presentes."},
     {"id": "story.brevedad", "weight": 0.35, "description": "Dos o tres frases. No historia de la empresa, no anos en el mercado, no lista de productos, no certificaciones. Cada frase de mas cuesta atencion."},
     {"id": "story.relevancia_cliente", "weight": 0.25, "description": "Conecta su presencia con algo que le importe al cliente, no consigo mismo. Y devuelve la palabra con una pregunta abierta en lugar de quedarse esperando."}
   ],
   "failure_criteria": [
     {"id": "historia_larga", "severity": "major", "description": "Se extiende mas alla de tres o cuatro frases: cuenta la trayectoria de la empresa, enumera productos, da cifras o certificaciones. El cliente se desconecta."},
     {"id": "curriculum", "severity": "major", "description": "Habla de si mismo y de su empresa sin conectar con el negocio del cliente. Correcto pero irrelevante."},
     {"id": "sin_gancho", "severity": "minor", "description": "Termina la historia sin devolver la palabra. Deja al cliente sin nada que contestar y la conversacion se queda en el aire."},
     {"id": "pitch_prematuro", "severity": "critical", "description": "Aprovecha la presentacion para meter producto, promocion o motivo de venta. La historia breve dice quien eres, no que vendes."}
   ],
   "limits": {"max_turns": 6, "max_duration_seconds": 150, "min_turns_before_evaluation": 2},
   "notes": "v2.0.0 El espejo es progresivo: el cliente no corta de golpe, se va apagando conforme la historia se alarga. Ensena la consecuencia real de perder la atencion."
 }'::jsonb),

('2.2', 2, 'Devuelve la Palabra', 'preguntas_no_afirmaciones', 2, false, 2, 2,
 'Las afirmaciones se ignoran. Las preguntas se contestan.',
 'skill_drill', 'claude', NULL,
 'TU MISION: que cada cosa que digas termine devolviendole la palabra al cliente. No sueltes afirmaciones al aire: haz preguntas que se tengan que contestar.',
 '{
   "version": "2.0.0", "i_do_type": "demo",
   "scope": {"skills_in_focus": ["story.relevancia_cliente"], "out_of_scope_behavior": "redirect"},
   "phases": {
     "i_do": {
       "briefing": "Fijate en como termina cada cosa que digo: con una pregunta. Nunca dejo una afirmacion sola en el aire, porque una afirmacion se puede ignorar sin que pase nada. Una pregunta no: el silencio despues de una pregunta se siente raro, y el cliente contesta.",
       "first_message": "Se ve que le va bien aqui. Y digame, cuanto tiempo lleva con el negocio?"
     },
     "you_do": {
       "prompt": "Eres el encargado de un negocio, en buena disposicion pero pasivo: no vas a llevar tu la conversacion. TU REGLA PRINCIPAL: contestas EXACTAMENTE lo que te preguntan y nada mas, y despues te quedas callado. Si el vendedor suelta una afirmacion sin pregunta (se ve que le va bien, que bonito local, ese producto es muy bueno), contestas con un si, un gracias o un ajam, y te quedas esperando en silencio. No ofreces informacion, no preguntas nada, no rellenas el silencio. Si te hace una pregunta abierta, contestas con gusto y con detalle. Si te hace una pregunta cerrada, contestas si o no y punto. NUNCA lleves tu la conversacion: eso es exactamente lo que el vendedor tiene que aprender a hacer. Responde en 1 o 2 frases.",
       "objective": "El vendedor sostiene la conversacion devolviendole la palabra al cliente: cada intervencion suya termina en una pregunta, preferentemente abierta. El scope se cubre cuando la conversacion avanza varios turnos sin morirse, con el cliente aportando informacion que no le pidieron directamente."
     },
     "closing": {
       "message": "Ahi esta la diferencia. Un cliente pasivo no sostiene una conversacion, y no tiene por que. El que la sostiene eres tu, y la sostienes preguntando. Vamos al detalle.",
       "message_incomplete": "Ahi lo dejamos, ya vi como llevas la conversacion. Vamos al desglose."
     }
   },
   "success_criteria": [
     {"id": "story.relevancia_cliente", "weight": 1.0, "description": "Cada intervencion del vendedor termina devolviendole la palabra al cliente con una pregunta, preferentemente abierta. La conversacion avanza sin morirse en silencios porque el vendedor la sostiene. Las afirmaciones sueltas sin pregunta no cumplen: se pueden ignorar."}
   ],
   "failure_criteria": [
     {"id": "afirmaciones_al_aire", "severity": "major", "description": "Suelta comentarios o afirmaciones sin cerrarlos con una pregunta. El cliente asiente y la conversacion se muere."},
     {"id": "rafaga_de_preguntas", "severity": "minor", "description": "Encadena preguntas sin construir sobre lo que el cliente acaba de responder. Se siente interrogatorio, no conversacion."},
     {"id": "cerradas_encadenadas", "severity": "minor", "description": "Solo hace preguntas de si o no. Se contestan en una palabra y no abren nada."},
     {"id": "pitch_prematuro", "severity": "critical", "description": "Mete producto, promocion o motivo de venta."}
   ],
   "limits": {"max_turns": 8, "max_duration_seconds": 180, "min_turns_before_evaluation": 3},
   "notes": "v2.0.0 El Actor es deliberadamente pasivo. La ensenanza es por vacio: si el vendedor no pregunta, no pasa nada, y el silencio hace el trabajo pedagogico."
 }'::jsonb),

('2.3', 2, 'Eres el Producto', 'cpr', 3, false, 1, 1,
 'Antes de que te compren algo, te compran a ti. Y sin eso, las preguntas que vienen despues no te las contestan.',
 'knowledge', 'none', NULL, NULL, NULL),

('2.4', 2, 'FORMS: Los Cinco Caminos', 'forms', 4, false, 1, 1,
 'Ya sabes que tienes que crear relacion. Aqui esta de que hablar.',
 'knowledge', 'none', NULL, NULL, NULL),

('2.5', 2, 'El Desvio con Regreso', 'cpr_desvio', 5, false, 2, 2,
 'Como crear relacion personal sin perder la venta.',
 'skill_drill', 'claude', NULL,
 'TU MISION: este cliente te va a dar pie para platicar de algo personal. Entrale de verdad, uno o dos intercambios, y REGRESA a la conversacion de negocio. La relacion se construye sin perder el rumbo.',
 '{
   "version": "2.0.0", "i_do_type": "demo",
   "scope": {"skills_in_focus": ["relationship.cpr", "relationship.forms"], "out_of_scope_behavior": "redirect"},
   "phases": {
     "i_do": {
       "briefing": "El cliente me va a soltar algo personal. Mira las dos cosas que hago: le entro de verdad, con interes real, uno o dos intercambios. Y REGRESO. No me quedo platicando media hora ni lo ignoro para seguir con lo mio. Salgo, conecto, y vuelvo a la linea.",
       "first_message": "Ah, con que su hijo le ayuda los fines. Que bueno, eso no se ve tan seguido. Y le gusta el negocio o va por otro lado? ... Mire que bien. Oiga, y volviendo a lo suyo, cuanto tiempo lleva usted con esto?"
     },
     "you_do": {
       "prompt": "Eres el encargado de un negocio, en buena disposicion. TU REGLA PRINCIPAL: en tu segunda o tercera respuesta sueltas de manera natural UN dato personal tuyo, sin darle importancia, como quien comenta al pasar. Elige uno al azar de estos cinco territorios: FAMILIA (un hijo que te ayuda, un hermano socio), OCUPACION (como empezaste, a que te dedicabas antes), RECREACION (que haces los domingos, una aficion), MOTIVACION (por que pusiste el negocio, para quien trabajas), DEPORTES (tu equipo, un partido). REACCIONAS ASI: si el vendedor IGNORA el dato personal y sigue de largo con lo suyo, te enfrias — contestas mas corto y ya no ofreces nada mas de ti en toda la sesion. Si el vendedor le ENTRA con interes real, te abres: contestas con gusto, das mas detalle, y puedes devolverle una pregunta personal a el. Si el vendedor se queda en lo personal MAS de dos intercambios sin volver al negocio, te acomodas a la platica y sigues platicando de la vida encantado, sin volver tu al tema del negocio jamas: la conversacion se vuelve social y ahi se queda. Nunca eres tu quien regresa al negocio. Responde en 1 o 2 frases, natural.",
       "objective": "El vendedor detecta el dato personal, le entra con interes genuino durante uno o dos intercambios, y REGRESA por su cuenta a la conversacion de negocio. El scope se cubre cuando el vendedor ha hecho las dos cosas: conectar y volver."
     },
     "closing": {
       "message": "Eso es un desvio con regreso. Le entraste de verdad, no de compromiso, y volviste tu solo. El cliente se abrio y la conversacion siguio avanzando. Las dos cosas al mismo tiempo. Vamos al detalle.",
       "message_incomplete": "Ahi lo dejamos. Vamos al desglose y te digo como quedo el desvio."
     }
   },
   "success_criteria": [
     {"id": "relationship.cpr", "weight": 0.5, "description": "Detecta el dato personal que el cliente dejo caer y le entra con interes genuino: pregunta sobre eso, comenta, se involucra. Ignorarlo o responder con un simple que bien no cumple. Si el cliente le devuelve una pregunta personal, responde como persona y no la esquiva."},
     {"id": "relationship.forms", "weight": 0.5, "description": "REGRESA a la conversacion de negocio por su propia cuenta despues de uno o dos intercambios personales. Quedarse en lo personal mas de dos intercambios no cumple: la relacion se construye sin perder el rumbo. El regreso debe ser natural, no un corte brusco."}
   ],
   "failure_criteria": [
     {"id": "ignora_lo_personal", "severity": "major", "description": "El cliente ofrece un dato personal y el vendedor lo pasa de largo para seguir con lo suyo. Perdio la unica puerta que le abrieron, y el cliente se cierra."},
     {"id": "se_queda_platicando", "severity": "major", "description": "Le entra a lo personal y ya no vuelve al negocio. La conversacion se vuelve social y la venta se estanca. El cliente esta encantado y no va a comprar nada."},
     {"id": "interes_de_compromiso", "severity": "minor", "description": "Reconoce el dato personal con un que bien o un que padre y cambia de tema de inmediato. Se nota que no le intereso, y eso cuesta mas que no haberlo mencionado."},
     {"id": "pitch_prematuro", "severity": "critical", "description": "Mete producto, promocion o motivo de venta."}
   ],
   "limits": {"max_turns": 10, "max_duration_seconds": 210, "min_turns_before_evaluation": 3},
   "notes": "v2.0.0 Nodo nuevo. El espejo mide LAS DOS MITADES: ignorar enfria, quedarse flotando estanca. Es la misma mecanica de espejo doble del 3.2. El dato personal sale al azar de los cinco territorios de FORMS."
 }'::jsonb),

('2.6', 2, 'El No Que No Es No', 'bloqueo_vs_objecion', 6, false, 1, 1,
 'El primer no casi nunca es un no. Aqui aprendes a distinguirlos, que es lo que decide como los manejas.',
 'knowledge', 'none', NULL, NULL, NULL),

('2.7', 2, 'AIR en Vivo', 'air', 7, false, 2, 2,
 'Atravesar un bloqueo sin pelear, sin disculparse y sin irse.',
 'skill_drill', 'claude', NULL,
 'TU MISION: te van a bloquear de entrada. No discutas, no te disculpes y no te vayas. Acepta lo que te dijo, no lo pelees, y sigue con lo tuyo.',
 '{
   "version": "2.0.0", "i_do_type": "demo",
   "scope": {"skills_in_focus": ["blocks.air"], "out_of_scope_behavior": "redirect"},
   "phases": {
     "i_do": {
       "briefing": "Me van a bloquear. Cuenta los tres movimientos: acepto lo que me dijo sin discutirlo, no lo peleo ni lo justifico, y sigo con lo mio como si nada. Fijate sobre todo en el tercero: no pido permiso otra vez, no pregunto si puedo seguir. Sigo.",
       "first_message": "Claro que si, entiendo. Oiga, y digame una cosa, cuanto tiempo lleva usted aqui?"
     },
     "you_do": {
       "prompt": "Eres el encargado de un negocio. En tu PRIMERA respuesta, sin importar lo que diga el vendedor, sueltas un bloqueo de reflejo: elige uno de estos y dilo con naturalidad, sin agresion, como quien despacha por costumbre — ahorita ando ocupado / no me interesa, gracias / no estoy comprando nada / ya tengo con quien. NO es personal, es un reflejo. DESPUES REACCIONAS ASI: si el vendedor DISCUTE, justifica o intenta convencerte de que si te interesa (es que solo son dos minutos, es que esto si le va a servir), tu bloqueo se endurece y se vuelve una posicion: ahora si te cierras de verdad y lo despachas. Si el vendedor SE DISCULPA o se va (perdon, con permiso, vengo despues), lo dejas ir sin insistir. Si el vendedor ACEPTA tu bloqueo sin pelearlo y sigue con su tema con naturalidad, tu tambien sigues con naturalidad: contestas su pregunta y la conversacion continua como si el bloqueo no hubiera existido. Asi funciona en la vida real: nadie defiende un reflejo si el otro no lo ataca. NUNCA vuelvas a bloquear despues del primero. Responde en 1 o 2 frases.",
       "objective": "El vendedor atraviesa el bloqueo con los tres movimientos: acepta, no lo pelea, y retoma su tema sin pedir permiso. El scope se cubre cuando la conversacion continua despues del bloqueo con el cliente participando con naturalidad."
     },
     "closing": {
       "message": "Eso es atravesar un bloqueo. No lo peleaste, no te disculpaste y no te fuiste. Lo aceptaste y seguiste, y el bloqueo se disolvio solo, porque nunca fue una posicion: era un reflejo. Vamos al detalle.",
       "message_incomplete": "Ahi lo dejamos. Vamos al desglose y te digo como quedo ese bloqueo."
     }
   },
   "success_criteria": [
     {"id": "blocks.air", "weight": 1.0, "description": "Los tres movimientos: ACEPTA el bloqueo con un entiendo, claro que si o por supuesto. NO lo discute, no lo justifica, no intenta convencer al cliente de lo contrario. RETOMA su tema con naturalidad y sin pedir permiso otra vez. El tercer movimiento es el que mas falla: muchos aceptan y despues se quedan esperando autorizacion."}
   ],
   "failure_criteria": [
     {"id": "discute_el_bloqueo", "severity": "critical", "description": "Intenta convencer al cliente de que si le interesa o de que si tiene tiempo. Convierte un reflejo en una posicion, y ahora si tiene un no de verdad enfrente."},
     {"id": "se_disculpa_o_se_va", "severity": "critical", "description": "Se disculpa, se despide o promete volver despues. Se rindio ante un reflejo que no significaba nada."},
     {"id": "pide_permiso_de_nuevo", "severity": "major", "description": "Acepta el bloqueo pero despues pide autorizacion para seguir. Le devuelve el control al cliente justo despues de haberlo recuperado."},
     {"id": "ignora_sin_aceptar", "severity": "minor", "description": "Sigue de largo sin reconocer lo que el cliente dijo. Se siente que no lo escucho, y eso enfria aunque tecnicamente avance."}
   ],
   "limits": {"max_turns": 8, "max_duration_seconds": 180, "min_turns_before_evaluation": 2},
   "notes": "v2.0.0 El espejo ensena la doctrina completa: el bloqueo se endurece si lo peleas y se disuelve si lo aceptas. La consecuencia hace el trabajo, no el feedback."
 }'::jsonb),

('2.8', 2, 'El Ataque Preventivo', 'pre_emptive_strike', 8, false, 2, 2,
 'Desactivar un negativo diciendolo tu, antes de que lo diga el cliente.',
 'skill_drill', 'claude', NULL,
 'TU MISION: este cliente trae un negativo que ya conoces, de esos que siempre salen. Adelantate: dilo tu primero, con naturalidad, antes de que el lo saque.',
 '{
   "version": "2.0.0", "i_do_type": "demo",
   "scope": {"skills_in_focus": ["blocks.pre_emptive_strike", "blocks.air"], "out_of_scope_behavior": "redirect"},
   "phases": {
     "i_do": {
       "briefing": "Hay negativos que salen siempre, que ya sabes que van a llegar. Mira lo que hago: lo digo yo primero, con naturalidad, sin dramatizarlo. Fijate en el efecto: cuando yo lo digo, deja de ser un arma del cliente y se vuelve parte de la conversacion. Ya no tiene con que sorprenderme.",
       "first_message": "Le voy a ser franco antes de que me lo pregunte: ya se que por aqui pasan muchos como yo y que casi todos prometen lo mismo. Por eso hoy no vengo a prometerle nada, vengo a conocer su negocio. Cuenteme, como le ha ido con eso?"
     },
     "you_do": {
       "prompt": "Eres el encargado de un negocio y traes UNA reserva concreta con los vendedores, que vas a soltar si te dan la oportunidad. Elige una al azar: ya me han fallado antes / todos prometen y nadie cumple / por aqui pasan muchos como usted / la ultima vez me salio mas caro de lo que me dijeron. REACCIONAS ASI: si el vendedor NO se adelanta, en tu segunda o tercera respuesta sacas tu reserva con firmeza, y a partir de ahi te mantienes escéptico y cuesta arriba el resto de la sesion. Si el vendedor SE ADELANTA y menciona el mismo negativo antes que tu, con naturalidad y sin dramatizarlo, te desarma: te ries o asientes, bajas la guardia notablemente, y le contestas con mas apertura que antes — porque alguien que reconoce lo malo se vuelve creible. Si el vendedor se adelanta pero lo hace en tono de DISCULPA o de justificacion (perdon si le han fallado, no todos somos iguales, yo si soy diferente), no funciona: te suena a excusa, no bajas la guardia y sacas tu reserva igual. Si inventa un negativo que no aplica o que tu no tenias, te confunde y te pone en alerta: ahora si dudas de algo que ni te preocupaba. Responde en 1 o 2 frases.",
       "objective": "El vendedor menciona el negativo conocido antes que el cliente, con naturalidad y sin tono de disculpa, desactivandolo. El scope se cubre cuando el cliente baja la guardia y responde con mas apertura de la que tenia."
     },
     "closing": {
       "message": "Eso es un ataque preventivo. Dijiste tu lo que el iba a usar, y al decirlo tu dejo de ser un arma. Ojo con la regla: solo funciona con negativos REALES y conocidos, y solo si lo dices sin disculparte. Vamos al detalle.",
       "message_incomplete": "Ahi lo dejamos. Vamos al desglose y te digo si el negativo alcanzo a desactivarse."
     }
   },
   "success_criteria": [
     {"id": "blocks.pre_emptive_strike", "weight": 0.7, "description": "Menciona un negativo real y conocido ANTES de que el cliente lo saque, con naturalidad y sin dramatizarlo. El tono importa: decirlo como dato desarma, decirlo como disculpa o justificacion no funciona y suena a excusa. Inventar un negativo que el cliente no tenia es peor que no hacerlo."},
     {"id": "blocks.air", "weight": 0.3, "description": "Si el cliente alcanza a sacar su reserva, la acepta sin pelearla y retoma. No se defiende ni intenta convencerlo de lo contrario."}
   ],
   "failure_criteria": [
     {"id": "no_se_adelanta", "severity": "major", "description": "Deja que el cliente saque el negativo primero. Ahora tiene que atravesar cuesta arriba algo que pudo haber desactivado gratis."},
     {"id": "tono_de_disculpa", "severity": "major", "description": "Se adelanta pero en tono de excusa: perdon si le han fallado, no todos somos iguales, yo si soy diferente. Suena a defensa y no desarma nada."},
     {"id": "negativo_inventado", "severity": "major", "description": "Menciona un negativo que el cliente no tenia. En lugar de desactivar, planta una duda nueva. La tecnica sirve para desarmar lo que ya existe, nunca para crear preocupaciones."},
     {"id": "pitch_prematuro", "severity": "critical", "description": "Mete producto, promocion o motivo de venta."}
   ],
   "limits": {"max_turns": 8, "max_duration_seconds": 180, "min_turns_before_evaluation": 2},
   "notes": "v2.0.0 Nodo nuevo. El espejo tiene cuatro estados: no adelantarse endurece, adelantarse bien desarma, adelantarse con disculpa no sirve, e inventar un negativo empeora. El cuarto estado protege la linea etica: la tecnica desarma, nunca planta."
 }'::jsonb),

('2.9', 2, 'Seguir Avanzando', 'close_with_action', 9, false, 2, 2,
 'Atravesaste el bloqueo. Y ahora que? La respuesta define si la conversacion sigue o se muere ahi.',
 'skill_drill', 'claude', NULL,
 'TU MISION: cada vez que resuelvas algo, avanza tu. No esperes a que el cliente decida que sigan. La conversacion la mueves tu.',
 '{
   "version": "2.0.0", "i_do_type": "demo",
   "scope": {"skills_in_focus": ["flow.close_with_action", "blocks.air"], "out_of_scope_behavior": "redirect"},
   "phases": {
     "i_do": {
       "briefing": "Fijate en el momento justo despues de resolver algo. Ahi es donde el vendedor promedio se queda callado, esperando permiso para seguir. Yo no. Resuelvo y avanzo en la misma frase, con la siguiente pregunta ya puesta. El cliente nunca tiene que decidir si seguimos, porque ya seguimos.",
       "first_message": "Claro, entiendo perfecto. Y digame, cuanto tiempo lleva usted con el negocio?"
     },
     "you_do": {
       "prompt": "Eres el encargado de un negocio. Vas a poner pequenos frenos a lo largo de la conversacion: en tu primera respuesta un bloqueo suave (ando ocupado, no me interesa), y mas adelante uno o dos frenos menores (una duda corta, un ahorita no se, un uf pues no se). TU REGLA PRINCIPAL: despues de CADA freno tuyo, observas que hace el vendedor. Si el vendedor resuelve y SE QUEDA CALLADO, o pregunta si puede continuar, o espera tu reaccion, entonces TU TOMAS EL CONTROL: dices bueno pues ahi luego me dice, gracias eh, y empiezas a despedirte con amabilidad. La conversacion se te acaba en las manos. Si el vendedor resuelve y AVANZA de inmediato con otra pregunta o retomando su tema sin pedir permiso, tu sigues la conversacion con naturalidad y contestas lo que te pregunte. Nunca eres tu quien reactiva la conversacion despues de un silencio. Responde en 1 o 2 frases.",
       "objective": "El vendedor avanza por su cuenta despues de cada freno del cliente, sin quedarse esperando ni pedir permiso para continuar. El scope se cubre cuando la conversacion sobrevive al menos dos frenos porque el vendedor la movio las dos veces."
     },
     "closing": {
       "message": "Eso es seguir avanzando. Cada vez que algo te freno, resolviste y seguiste tu, sin esperar a que el cliente decidiera. Esa es la diferencia entre una conversacion que avanza y una que se apaga en un silencio. Vamos al detalle.",
       "message_incomplete": "Ahi lo dejamos. Vamos al desglose y te digo donde se te fue el control."
     }
   },
   "success_criteria": [
     {"id": "flow.close_with_action", "weight": 0.7, "description": "Despues de cada freno del cliente, el vendedor avanza por su cuenta: hace la siguiente pregunta o retoma su tema en la misma intervencion, sin pausas de espera y sin pedir autorizacion. No deja que el cliente decida si la conversacion continua."},
     {"id": "blocks.air", "weight": 0.3, "description": "Cada freno se acepta sin pelearlo antes de avanzar. Avanzar sin reconocer lo que el cliente dijo se siente atropellado."}
   ],
   "failure_criteria": [
     {"id": "se_queda_esperando", "severity": "critical", "description": "Resuelve el freno y se queda callado esperando la reaccion del cliente. En ese silencio el cliente retoma el control y la conversacion se acaba."},
     {"id": "pide_autorizacion", "severity": "critical", "description": "Pregunta si puede continuar, si le permite seguir o si tiene mas tiempo. Le entrega el control justo despues de haberlo recuperado."},
     {"id": "avanza_atropellando", "severity": "minor", "description": "Avanza sin reconocer lo que el cliente acaba de decir. Se siente que no lo escucho."},
     {"id": "pitch_prematuro", "severity": "critical", "description": "Mete producto, promocion o motivo de venta."}
   ],
   "limits": {"max_turns": 10, "max_duration_seconds": 210, "min_turns_before_evaluation": 3},
   "notes": "v2.0.0 Nodo nuevo. Primera aparicion de Close With Action, en su version ligera: avanzar en la linea. Vuelve en M4 despues del precio y en M5 como cierre. El espejo castiga el silencio con la consecuencia real: el cliente se despide con amabilidad."
 }'::jsonb),

('2.10', 2, 'BOSS: La Puerta Fria', 'historia_breve_completa', 10, true, 1, 3,
 'Un cliente que bloquea de entrada. Todo el mundo, junto y sin ayudas.',
 'boss', 'claude',
 'Presentarse y sostener la conversacion con un cliente que bloquea de entrada: atravesar el bloqueo sin pelearlo, decir quien es en quince segundos, crear relacion personal con regreso, y avanzar sin pedir permiso hasta que el cliente participe por su propia voluntad.',
 'TU MISION: la conversacion completa con un cliente que no te la va a poner facil. Atraviesa el bloqueo, di quien eres en quince segundos, conecta como persona, y sigue avanzando tu. Sin disculpas y sin pedir permiso.',
 '{
   "version": "2.0.0", "i_do_type": "demo",
   "scope": {"skills_in_focus": ["blocks.air", "story.historia_breve", "story.brevedad", "relationship.cpr", "flow.close_with_action"], "out_of_scope_behavior": "redirect"},
   "phases": {
     "i_do": {
       "briefing": "Este es el examen del mundo. Bloqueo de entrada, historia breve, relacion personal y seguir avanzando: todo junto y con un cliente que no ayuda. Sin pistas.",
       "first_message": "Entiendo perfecto, no se preocupe. Soy Emilio, ando trabajando con los negocios de esta zona y quise pasar a conocer el suyo. Digame una cosa, cuanto tiempo lleva usted aqui?"
     },
     "you_do": {
       "prompt": "Eres el encargado de un negocio, ocupado y con poca paciencia para vendedores. En tu PRIMERA respuesta sueltas un bloqueo de reflejo, con naturalidad y sin agresion: ahorita ando ocupado / no me interesa / no estoy comprando nada. TU COMPORTAMIENTO: eres cortes pero cerrado y contestas corto. NO ofreces informacion y NO llevas la conversacion. REGLAS DE REACCION: 1) Si el vendedor pelea el bloqueo, se disculpa o se va, lo despachas y la conversacion termina. 2) Si lo acepta y sigue, continuas con naturalidad. 3) Si su historia breve se alarga mas de tres o cuatro frases, te desconectas: contestas ajam y dices que andas ocupado. 4) Si el vendedor resuelve algo y se queda callado esperando, TU tomas el control y empiezas a despedirte con amabilidad. 5) En tu tercera o cuarta respuesta, si la conversacion sigue viva, sueltas de manera natural UN dato personal tuyo, al pasar, sin darle importancia: elige entre familia, como empezaste, que haces los domingos, por que pusiste el negocio, o tu equipo. Si el vendedor lo ignora, te enfrias y ya no ofreces nada mas de ti. Si le entra con interes real, te abres notablemente. Si se queda platicando de eso mas de dos intercambios sin volver al negocio, te acomodas a platicar de la vida y ya nunca regresas tu al tema. 6) SOLO si el vendedor logra todo — atravesar el bloqueo, decir quien es breve y relevante, conectar contigo como persona y regresar, y avanzar sin pedir permiso — entonces te abres de verdad: le cuentas algo de tu negocio por tu cuenta y le preguntas en que le puede servir. Esa pregunta es la senal de que gano. NUNCA la hagas antes de que se lo gane. Responde en 1 o 2 frases.",
       "objective": "El vendedor atraviesa el bloqueo inicial, se presenta en quince segundos de forma relevante, conecta con el dato personal y regresa, y sostiene el avance sin pedir permiso. El scope se cubre cuando el cliente se abre por su propia voluntad y pregunta en que le puede servir."
     },
     "closing": {
       "message": "Ahi esta la puerta fria abierta. Atravesaste el bloqueo sin pelearlo, dijiste quien eras sin cansarlo, conectaste como persona y volviste, y nunca soltaste el control de la conversacion. Ese cliente ya quiere saber en que le puedes servir, y eso es exactamente lo que sigue. Vamos al detalle.",
       "message_incomplete": "Hasta aqui la sesion. Ya tengo lo que necesito para tu analisis. Vamos al desglose y te digo donde estuvo la diferencia."
     }
   },
   "success_criteria": [
     {"id": "blocks.air", "weight": 0.25, "description": "Atraviesa el bloqueo inicial: lo acepta, no lo pelea, y retoma sin pedir permiso."},
     {"id": "story.historia_breve", "weight": 0.2, "description": "Dice quien es y por que esta ahi: nombre, procedencia y motivo humano de la visita."},
     {"id": "story.brevedad", "weight": 0.15, "description": "Dos o tres frases. Sin trayectoria de empresa, sin lista de productos, sin cifras."},
     {"id": "relationship.cpr", "weight": 0.2, "description": "Detecta el dato personal, le entra con interes genuino, y REGRESA al negocio por su cuenta en uno o dos intercambios."},
     {"id": "flow.close_with_action", "weight": 0.2, "description": "Despues de cada freno avanza por su cuenta, sin quedarse esperando ni pedir autorizacion. Sostiene el control de la conversacion toda la sesion."}
   ],
   "failure_criteria": [
     {"id": "discute_el_bloqueo", "severity": "critical", "description": "Pelea el bloqueo inicial o intenta convencer al cliente de que si le interesa."},
     {"id": "se_disculpa_o_se_va", "severity": "critical", "description": "Se disculpa, se despide o promete volver despues."},
     {"id": "se_queda_esperando", "severity": "critical", "description": "Resuelve algo y se queda callado esperando permiso. El cliente toma el control y se despide."},
     {"id": "historia_larga", "severity": "major", "description": "La historia breve se extiende y el cliente se desconecta."},
     {"id": "ignora_lo_personal", "severity": "major", "description": "Pasa de largo el dato personal que el cliente ofrecio."},
     {"id": "se_queda_platicando", "severity": "major", "description": "Le entra a lo personal y ya no vuelve al negocio."},
     {"id": "pitch_prematuro", "severity": "critical", "description": "Mete producto, promocion o motivo de venta. Identificarse con nombre y empresa NO es pitch."}
   ],
   "limits": {"max_turns": 14, "max_duration_seconds": 300, "min_turns_before_evaluation": 4},
   "notes": "v2.0.0 BOSS del Mundo 2. Sin pistas garantizadas (R9). Acumulativo: el Mundo 1 se examina implicitamente porque una apertura mal hecha no abre la conversacion. La senal de exito es que el cliente pregunte en que le puede servir, que es la puerta al Descubrimiento."
 }'::jsonb);


-- ════════════════════════════════════════════════════════════
-- PASO 5 — TARJETAS
-- ════════════════════════════════════════════════════════════

INSERT INTO public.node_cards
  (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience)
VALUES

-- ── 2.0 QUIEN ERES EN 15 SEGUNDOS ────────────────────────────
('2.0', 1, 'concept', 'static',
 'El momento exacto de la historia breve',
 'Tu apertura funciono: el cliente te esta poniendo atencion. Y ahora su cabeza tiene dos preguntas gritando.

Quien es este? Y que quiere?

Si no las contestas rapido, se las contesta el solo. Y la respuesta que se inventa casi nunca te favorece: otro vendedor que me va a quitar el tiempo.',
 NULL, NULL),

('2.0', 2, 'concept', 'static',
 'KISS, no KILL',
 'KISS — Keep It Short and Simple. Corta y simple.
KILL — Keep It Long and Lengthy. Larga y pesada.

La historia breve contesta quien eres y por que estas ahi en dos o tres frases. No es tu curriculum. No son los veinticinco anos de tu empresa. No es el catalogo.

Es el puente mas corto entre no te conozco y a ver, cuenteme.',
 NULL, NULL),

('2.0', 3, 'concept', 'static',
 'Las dos piezas y el gancho',
 'PIEZA 1 — Quien soy. Nombre y de donde vienes, humano y simple.

PIEZA 2 — Por que estoy aqui. La razon de tu visita, en terminos de personas, no de producto.

EL GANCHO — cierras con una pregunta que le devuelve la palabra. Sin el gancho, terminas de hablar y se hace un silencio donde el cliente decide si sigue o no. Con el gancho, no hay silencio: hay una pregunta que contestar.',
 NULL, NULL),

('2.0', 4, 'why_it_works', 'static',
 'Por que corta funciona mejor que impresionante',
 'La tentacion es enorme: ya que tienes su atencion, quieres aprovecharla toda. Contarle la trayectoria, los premios, todo lo que manejas.

Y es justo al reves. Cada frase de mas gasta la atencion que acabas de ganar. Lo que suena impresionante en tu cabeza suena a discurso en la de el.

Corto no es un atajo ni una version reducida. Es la version que si funciona.',
 NULL, NULL),

('2.0', 5, 'concept', 'static',
 'Y despues de la historia, preguntas',
 'Un error comun es creer que despues de presentarte toca explicar mas.

No. Despues de presentarte toca PREGUNTAR. La doctrina es clara en esto: es mucho mas efectivo pasar directo a las preguntas que dar una explicacion larga.

Tu historia breve no existe para que el cliente te entienda a ti. Existe para ganarte el derecho de preguntarle a el.',
 NULL, NULL),

-- ── 2.1 TU HISTORIA BREVE (drill) ────────────────────────────
('2.1', 1, 'concept', 'static',
 'Ahora con tus palabras',
 'Te van a preguntar quien eres. Tienes quince segundos.

Quien soy — nombre y de donde vienes.
Por que estoy aqui — el motivo, en terminos humanos.
El gancho — una pregunta que le devuelve la palabra.

Tres frases. Ni una mas.',
 NULL, NULL),

('2.1', 2, 'good_example', 'static',
 NULL,
 'Soy Emilio, ando trabajando con los negocios de esta zona. Me tocaba pasar por aqui y quise conocer el suyo. Cuenteme, cuanto tiempo lleva con el?',
 'Tres frases, quince segundos. Dice quien es, por que esta ahi en terminos humanos (quise conocer su negocio, no vengo a venderle), y termina devolviendo la palabra. El cliente ya sabe con quien habla y tiene algo que contestar.',
 NULL),

('2.1', 3, 'bad_example', 'static',
 NULL,
 'Buenos dias, mi nombre es Emilio y represento a una empresa con mas de veinticinco anos en el mercado, lideres en la region, manejamos una linea completa con certificaciones internacionales y trabajamos con los principales negocios del estado...',
 'Todo es cierto y nada sirve. Se le acabo la atencion en la segunda frase y ni siquiera dijo por que esta ahi. El cliente no escucho una presentacion: escucho un discurso. Y de los discursos uno se defiende.',
 NULL),

-- ── 2.2 DEVUELVE LA PALABRA (drill) ──────────────────────────
('2.2', 1, 'concept', 'static',
 'Las afirmaciones se ignoran',
 'Se ve que le va muy bien aqui.

Que puede contestar el cliente a eso? Gracias. Y ya. La conversacion se queda ahi parada esperando que tu digas otra cosa.

Una afirmacion se puede ignorar sin que pase nada. Y el cliente que no sabe que hacer contigo, la ignora.',
 NULL, NULL),

('2.2', 2, 'concept', 'static',
 'Las preguntas se contestan',
 'Se ve que le va bien aqui. Cuanto tiempo lleva con el negocio?

Es la misma observacion, con cuatro palabras mas. Pero ahora el cliente tiene algo que hacer.

El silencio despues de una pregunta se siente raro, y la gente lo llena. Por eso una pregunta mueve la conversacion y una afirmacion la detiene.',
 NULL, NULL),

('2.2', 3, 'why_it_works', 'static',
 'La conversacion la sostienes tu',
 'Aqui va algo que hay que aceptar de entrada: el cliente no tiene ninguna obligacion de sostener esta conversacion. No te invito, no te esperaba, y tiene cosas que hacer.

Si tu no la mueves, se muere. Y no porque el sea grosero: porque no es su trabajo.

Ese es todo el ejercicio. Cada cosa que digas, termina devolviendo la palabra.',
 NULL, NULL),

-- ── 2.3 ERES EL PRODUCTO ─────────────────────────────────────
('2.3', 1, 'concept', 'static',
 'A quien le compra la gente',
 'Dos vendedores, mismo producto, mismo precio, mismas condiciones. Uno cae bien. El otro no.

No hace falta que adivines cual vende.

Y no es injusto ni irracional. Cuando dos opciones son iguales, lo unico que queda para decidir es con quien prefieres tratar.',
 NULL, NULL),

('2.3', 2, 'concept', 'static',
 'Eres tanto o mas el producto que lo que vendes',
 'Esa frase esta en la doctrina y hay que tomarla literal.

El cliente no puede evaluar tu producto todavia: no lo ha probado, no conoce tu empresa, no sabe si le van a cumplir. Lo unico que si puede evaluar, desde el primer segundo, eres tu.

Asi que mientras el decide si le crees o no a tu producto, ya decidio si te cree a ti.',
 NULL, NULL),

('2.3', 3, 'concept', 'static',
 'CPR: Crear Relaciones Personales',
 'C — Create / Crear
P — Personal / Personales
R — Relations / Relaciones

Crear relaciones personales. Y ojo con esto, porque es lo que lo hace distinto de todo lo demas que has aprendido: CPR no es un paso.

No va en un lugar del mapa. Se hace durante TODA la conversacion, desde el primer segundo hasta el ultimo.',
 NULL, NULL),

('2.3', 4, 'why_it_works', 'static',
 'Sin relacion, no te contestan',
 'En el siguiente mundo vas a aprender a hacer preguntas sobre el negocio del cliente: que le funciona, que le falla, que le duele.

Y aqui esta el problema: esas preguntas solo funcionan si te las contestan de verdad. A un desconocido nadie le cuenta sus problemas. A alguien que le cae bien, si.

Por eso el CPR no es un adorno ni una cortesia. Es la condicion para que lo que viene despues funcione.',
 NULL, NULL),

-- ── 2.4 FORMS ────────────────────────────────────────────────
('2.4', 1, 'concept', 'static',
 'De que le hablo?',
 'Aqui es donde se traba todo el mundo. Ya entendiste que hay que crear relacion, estas convencido, quieres hacerlo.

Y llega el momento y no sabes de que hablar. Se te ocurre el clima, y el clima ya lo usaste.

La doctrina resuelve eso con cinco temas. Se llaman FORMS.',
 NULL, NULL),

('2.4', 2, 'concept', 'static',
 'FORMS: los cinco caminos a la persona',
 'F — FAMILY / Familia
O — OCCUPATION / Ocupacion
R — RECREATION / Recreacion
M — MOTIVATION / Motivacion
S — SPORTS / Deportes

Cinco puertas. Siempre hay al menos una abierta, con cualquier persona, en cualquier lugar del mundo.

Vamos una por una.',
 NULL, NULL),

('2.4', 3, 'concept', 'static',
 'Los cinco, uno por uno',
 'FAMILIA — la foto en el mostrador, el hijo que ayuda los fines, el hermano socio.

OCUPACION — cuanto lleva, como empezo, a que se dedicaba antes.

RECREACION — que hace cuando no esta trabajando, alguna aficion.

MOTIVACION — por que puso el negocio, para quien trabaja, que quiere lograr.

DEPORTES — su equipo, el partido, lo que se este jugando.

No necesitas los cinco. Con uno bien trabajado basta.',
 NULL, NULL),

('2.4', 4, 'concept', 'static',
 'La palabra que lo decide todo: genuino',
 'La doctrina dice que el CPR se hace con cumplidos genuinos y chistes sencillos. La palabra importante ahi es genuinos.

Un interes fingido se nota siempre. Y cuesta mas que no haber preguntado nada, porque ahora el cliente sabe que le estas aplicando una tecnica.

La regla es simple: si de verdad no te interesa, no preguntes. Busca otra puerta que si te interese de verdad.',
 NULL, NULL),

('2.4', 5, 'why_it_works', 'static',
 'A la gente le encanta hablar de si misma',
 'No es un defecto de nadie. Es como estamos hechos.

Preguntale a alguien por su negocio, por sus hijos o por su equipo, y va a hablar con gusto. Y mientras habla pasan dos cosas al mismo tiempo: se relaja contigo, y te va conociendo.

Tu trabajo mientras tanto es escuchar de verdad. Pero sin soltar el rumbo, y eso es exactamente lo que practicas en el siguiente nodo.',
 NULL, NULL),

-- ── 2.5 EL DESVIO CON REGRESO (drill) ────────────────────────
('2.5', 1, 'concept', 'static',
 'Sales de la linea a proposito',
 'Te acuerdas de la linea recta? Hay cosas que te sacan de ella.

El CPR es la unica que sales tu, por voluntad propia, porque te conviene. Dejas de avanzar un momento, te vas a lo personal, y despues vuelves al punto donde ibas.

La salida es facil. Lo dificil, y lo que vas a practicar aqui, es el regreso.',
 NULL, NULL),

('2.5', 2, 'concept', 'static',
 'Uno o dos puntos, y regresas',
 'La regla es concreta: uno o dos intercambios personales, y vuelves al negocio.

Puedes volver a salir mas adelante, y de hecho conviene. Pero siempre avanzando.

Dos errores, y los dos cuestan la venta. Si nunca sales, no hay relacion y no te van a contestar nada. Si sales y no regresas, el cliente se acomoda a platicar, la conversacion se vuelve social y ahi se queda para siempre.',
 NULL, NULL),

('2.5', 3, 'why_it_works', 'static',
 'El cliente nunca te va a regresar',
 'Ojo con esto porque sorprende a todos.

Cuando la platica se pone agradable, el cliente esta comodo. Nadie interrumpe una conversacion agradable para hablar de negocios. El no tiene ninguna razon para regresarte a la linea.

El unico que puede regresar eres tu. Y si no lo haces, se te va la tarde platicando con alguien encantado que no te va a comprar nada.',
 NULL, NULL),

-- ── 2.6 EL NO QUE NO ES NO ───────────────────────────────────
('2.6', 1, 'concept', 'static',
 'El primer no casi nunca es un no',
 'Llegas, saludas bien, todo va bien. Y antes de que digas nada te sueltan: ahorita no, gracias.

Pregunta seria: a que te esta diciendo que no? Todavia no sabe quien eres ni a que vienes.

No te esta rechazando a ti ni a tu oferta. Esta cerrando una puerta antes de saber que hay del otro lado, y lo hace en automatico.',
 NULL, NULL),

('2.6', 2, 'concept', 'static',
 'Bloqueo: un reflejo',
 'Un BLOQUEO llega ANTES de entender.

Ahorita ando ocupado. No me interesa. No estoy comprando nada. Ya tengo con quien.

Fijate en lo que tienen en comun: ninguna requiere haber pensado. Son la respuesta que ese cliente le da a cualquiera que llega, todos los dias. Es la puerta cerrandose sola, no una decision.',
 NULL, NULL),

('2.6', 3, 'concept', 'static',
 'Objecion: una preocupacion real',
 'Una OBJECION llega DESPUES de entender.

Esta caro. Ya tengo proveedor y me cumple. Lo tengo que consultar. No es el momento por el flujo.

Aqui si hubo pensamiento. El cliente entendio lo que le ofreces, lo evaluo, y encontro un problema concreto. Eso es completamente distinto, y se maneja distinto. Las herramientas para objeciones las vas a aprender cuando llegues al cierre.',
 NULL, NULL),

('2.6', 4, 'why_it_works', 'static',
 'Por que importa tanto la diferencia',
 'Porque el mismo tratamiento aplicado al caso equivocado destruye la conversacion.

Si discutes con un reflejo, lo conviertes en una posicion. El cliente dijo no me interesa sin pensarlo, tu lo peleas, y ahora tiene que defenderlo. Le acabas de dar un no de verdad que no tenia.

Y al reves: ignorar una preocupacion real ofende a alguien que si te escucho y si penso.

La misma frase, no me interesa, se maneja de dos maneras opuestas segun cuando llego.',
 NULL, NULL),

('2.6', 5, 'concept', 'static',
 'AIR: la herramienta del bloqueo',
 'A — AGREE / Acepta
I — IGNORE / Ignora
R — RESUME / Resume

Acepta lo que te dijo con un entiendo o un claro que si. Ignoralo, en el sentido de no discutirlo ni justificarte. Y resume: sigue con lo tuyo, con naturalidad.

Suena demasiado simple para funcionar. Y funciona precisamente por eso: nadie defiende un reflejo si el otro no lo ataca.',
 NULL, NULL),

-- ── 2.7 AIR EN VIVO (drill) ──────────────────────────────────
('2.7', 1, 'concept', 'static',
 'Los tres movimientos',
 'ACEPTA — entiendo, claro que si, por supuesto. Sin ironia y sin discutir.

IGNORA — no lo peleas, no te justificas, no intentas convencerlo de que si le interesa.

RESUME — sigues con tu tema, con naturalidad, como si el bloqueo no hubiera pasado.

Tres movimientos, dos segundos.',
 NULL, NULL),

('2.7', 2, 'concept', 'static',
 'El tercero es el que falla',
 'Casi todos aceptan bien. Casi todos logran no discutir.

Y despues se quedan parados esperando. O peor: vuelven a pedir permiso. Entiendo, claro... entonces, si me permite un momentito?

Ahi se pierde todo lo ganado. Acabas de aceptar el bloqueo para despues entregarle otra vez el control.

Aceptar y seguir. En la misma frase.',
 NULL, NULL),

('2.7', 3, 'bad_example', 'static',
 NULL,
 'Ah, pero es que solo le voy a quitar dos minutos, y de verdad esto si le va a servir mucho, dejeme le explico rapido...',
 'Peleo el bloqueo. El cliente dijo ando ocupado sin pensarlo, y ahora tiene que sostenerlo, porque nadie se deja convencer de que no esta ocupado. Un reflejo se acaba de convertir en una posicion, y ahora si hay un no de verdad.',
 NULL),

-- ── 2.8 ATAQUE PREVENTIVO (drill) ────────────────────────────
('2.8', 1, 'concept', 'static',
 'Hay negativos que ya sabes que van a llegar',
 'Si llevas tiempo en tu zona, ya los conoces de memoria. Ya me han fallado antes. Todos prometen y nadie cumple. Por aqui pasan muchos como usted.

No son sorpresas. Son los mismos, casi siempre.

Y todo lo que es predecible se puede desactivar antes de que pase.',
 NULL, NULL),

('2.8', 2, 'concept', 'static',
 'Si tu lo dices primero, deja de ser un arma',
 'La doctrina lo dice asi: si das la negativa antes de que el cliente lo haga, ya no es una negativa.

Ya se que por aqui pasan muchos como yo y que casi todos prometen lo mismo.

Fijate en lo que acaba de pasar. Le quitaste el argumento de las manos. Y ademas te volviste creible, porque alguien que reconoce lo malo se gana el derecho a que le crean lo bueno.',
 NULL, NULL),

('2.8', 3, 'why_it_works', 'static',
 'Dos maneras de arruinarlo',
 'EN TONO DE DISCULPA. Perdon si le han fallado, pero yo si soy diferente. Eso ya no es adelantarse: es defenderse de algo que nadie te ha reclamado. Suena a excusa y no desarma nada.

CON UN NEGATIVO INVENTADO. Si mencionas un problema que ese cliente no tenia, no desactivaste nada: le plantaste una preocupacion nueva. Ahora esta pensando en algo que ni le inquietaba.

La tecnica sirve para desarmar lo que ya existe. Nunca para crear.',
 NULL, NULL),

-- ── 2.9 SEGUIR AVANZANDO (drill) ─────────────────────────────
('2.9', 1, 'concept', 'static',
 'El momento justo despues de resolver',
 'Atravesaste el bloqueo. Contestaste la duda. Resolviste lo que te frenaba.

Y ahora viene el segundo mas importante de toda la conversacion, el que casi nadie ve: que haces despues.

El vendedor promedio se queda callado. Espera. Como pidiendo permiso con la mirada para continuar.',
 NULL, NULL),

('2.9', 2, 'concept', 'static',
 'En ese silencio, el cliente retoma el control',
 'Y cuando el cliente retoma el control, hace lo mas comodo: cerrar con amabilidad. Bueno, pues ahi luego me dice. Gracias eh.

No te esta rechazando. Le devolviste el volante y el tomo la salida mas facil.

La regla es simple: resuelves y avanzas. En la misma intervencion, sin pausa. La conversacion la mueves tu hasta el final.',
 NULL, NULL),

('2.9', 3, 'why_it_works', 'static',
 'Nunca esperes a que te den permiso de seguir',
 'Esta es una de esas ideas que cambian la manera de vender: tu no necesitas autorizacion para continuar una conversacion que ya esta pasando.

Preguntar si puedes seguir es abrir una puerta que nadie te pidio que abrieras. Y siempre hay alguien dispuesto a salir por ella.

Sigues avanzando hasta que el cliente te detenga de verdad. Y cuando te detenga, resuelves y sigues otra vez.',
 NULL, NULL),

-- ── 2.10 BOSS ────────────────────────────────────────────────
('2.10', 1, 'concept', 'static',
 'La puerta fria',
 'Este cliente te bloquea en la primera frase. No es grosero: es lo que hace todos los dias con todos los que llegan.

Todo el mundo junto: atraviesa el bloqueo sin pelearlo, di quien eres en quince segundos, conecta con el como persona y regresa, y no sueltes el control de la conversacion en ningun momento.

Cuando te pregunte en que te puede servir, ganaste. Esa pregunta es la puerta al siguiente paso.',
 NULL, NULL);


-- ════════════════════════════════════════════════════════════
-- PASO 6 — QUIZZES
-- ════════════════════════════════════════════════════════════

INSERT INTO public.node_quiz_questions
  (node_id, question_order, question_text, option_a, option_b, option_c, option_d,
   correct_option, explanation_correct, explanation_wrong)
VALUES

('2.0', 1,
 'Que significa KISS y por que importa en la historia breve?',
 'Keep It Short and Simple: corta y simple, porque cada frase de mas gasta la atencion que acabas de ganar.',
 'Keep It Strong and Serious: seria y formal, para que te tomen en serio.',
 'Es una tecnica para cerrar ventas rapido.',
 NULL, 'A',
 'Exacto. Corta y simple. Lo contrario es KILL, Keep It Long and Lengthy, y es lo que hace que el cliente se desconecte justo cuando ya te habia puesto atencion.',
 'KISS es Keep It Short and Simple: corta y simple. La historia breve no busca impresionar ni sonar formal, busca ser el puente mas corto entre no te conozco y a ver, cuenteme.'),

('2.0', 2,
 'Terminas tu historia breve. Que sigue?',
 'Explicar con mas detalle lo que ofreces, ya que tienes su atencion.',
 'Preguntarle a el. La historia breve existe para ganarte el derecho de preguntar.',
 'Esperar a que el cliente diga algo.',
 NULL, 'B',
 'Asi es. La doctrina es clara: es mucho mas efectivo pasar directo a las preguntas que dar una explicacion larga. Tu historia no existe para que te entiendan a ti.',
 'Explicar mas gasta la atencion que acabas de ganar, y esperar deja la conversacion en el aire para que el cliente decida si sigue. Lo que sigue es preguntarle a el: para eso te ganaste el derecho.'),

('2.3', 1,
 'Por que se dice que eres tanto o mas el producto que lo que vendes?',
 'Porque tu comision depende de tu esfuerzo personal.',
 'Porque el cliente todavia no puede evaluar tu producto, pero a ti si te puede evaluar desde el primer segundo.',
 'Porque los productos son todos iguales.',
 NULL, 'B',
 'Correcto. No ha probado tu producto ni conoce tu empresa. Lo unico que si puede juzgar de inmediato eres tu, y esa decision la toma mucho antes que la otra.',
 'No es por la comision ni porque los productos sean iguales. Es que el cliente no tiene forma de evaluar tu producto todavia, pero a ti si te evalua desde que te ve. Esa es la unica informacion que tiene al principio.'),

('2.3', 2,
 'En que parte de la conversacion se hace el CPR?',
 'Justo despues de la historia breve, antes de pasar al siguiente paso.',
 'En toda la conversacion. No es un paso, es algo que haces de principio a fin.',
 'Solo al final, cuando ya cerraste.',
 NULL, 'B',
 'Asi es, y eso lo hace distinto de todo lo demas. Los seis pasos van en orden; el CPR los atraviesa todos.',
 'El CPR no ocupa un lugar en el mapa. Se hace durante toda la conversacion, desde el primer segundo hasta el ultimo. Es lo unico que no es un paso.'),

('2.4', 1,
 'Que significan las letras de FORMS?',
 'Family, Occupation, Recreation, Motivation, Sports.',
 'Focus, Order, Respect, Method, Sales.',
 'Es el nombre del formulario de calificacion del cliente.',
 NULL, 'A',
 'Familia, Ocupacion, Recreacion, Motivacion y Deportes. Cinco puertas a la persona, y siempre hay al menos una abierta.',
 'FORMS es Family, Occupation, Recreation, Motivation, Sports: los cinco temas para crear relacion personal. Vale la pena memorizarlos, porque son la respuesta a de que le hablo.'),

('2.4', 2,
 'Le preguntas a un cliente por su equipo de futbol y la verdad el tema no te interesa nada. Que haces?',
 'Preguntar igual: lo importante es que el cliente hable.',
 'Buscar otra de las cinco puertas que si te interese de verdad. El interes fingido se nota y cuesta mas que no preguntar.',
 'No hacer CPR con ese cliente.',
 NULL, 'B',
 'Exacto. La doctrina insiste en la palabra genuinos por algo. Hay cinco puertas justamente para que encuentres una que si te interese.',
 'Fingir interes se nota siempre, y sale mas caro que no preguntar, porque el cliente se da cuenta de que le estas aplicando una tecnica. Y renunciar al CPR tampoco: hay cinco puertas, busca otra.'),

('2.6', 1,
 'Un cliente te dice no me interesa antes de que le digas a que vienes. Que es eso?',
 'Una objecion: ya evaluo tu oferta y la rechazo.',
 'Un bloqueo: un reflejo que llega antes de entender. Todavia no sabe a que vienes.',
 'Una senal de que no es tu cliente.',
 NULL, 'B',
 'Correcto. No puede rechazar algo que todavia no conoce. Es la puerta cerrandose sola, la misma respuesta que le da a cualquiera que llega.',
 'No puede ser una objecion porque no sabe todavia que le ofreces: no hubo nada que evaluar. Es un bloqueo, un reflejo automatico. Y por eso no se discute, se atraviesa.'),

('2.6', 2,
 'Que pasa si discutes un bloqueo e intentas convencer al cliente de que si le interesa?',
 'Que entiende tu punto y te da la oportunidad.',
 'Que lo conviertes en una posicion: ahora tiene que defenderlo, y te acabas de crear un no de verdad.',
 'Nada, es lo normal insistir un poco.',
 NULL, 'B',
 'Asi es. Nadie se deja convencer de que no esta ocupado. Al pelearlo obligas al cliente a sostener algo que habia dicho sin pensar.',
 'Al contrario. Un bloqueo se dice sin pensar; si lo peleas, el cliente tiene que defenderlo, y al defenderlo se lo cree. Convertiste un reflejo en una posicion.'),

('2.6', 3,
 'Que significan las letras de AIR?',
 'Agree, Ignore, Resume: acepta, ignora, resume.',
 'Analiza, Investiga, Responde.',
 'Atiende, Insiste, Repite.',
 NULL, 'A',
 'Acepta lo que te dijo, no lo discutas, y sigue con lo tuyo. Tres movimientos, dos segundos.',
 'AIR es Agree, Ignore, Resume: acepta, ignora, resume. Ignorar aqui significa no discutirlo, no que lo pases por alto sin reconocerlo.'),

('2.6', 4,
 'Cual de estas es una OBJECION y no un bloqueo?',
 'Ahorita ando ocupado.',
 'Ya tengo proveedor y la verdad me cumple bien.',
 'No estoy comprando nada.',
 NULL, 'B',
 'Exacto. Esa llega despues de entender: el cliente evaluo su situacion y encontro una razon concreta. Las otras dos son reflejos que se dicen sin pensar.',
 'Esas dos son bloqueos: se dicen en automatico, sin haber evaluado nada. Ya tengo proveedor y me cumple bien es distinto, porque ahi si hubo un razonamiento sobre su situacion real.');
