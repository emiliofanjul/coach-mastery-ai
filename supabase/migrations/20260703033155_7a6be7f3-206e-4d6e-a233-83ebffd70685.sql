
ALTER TABLE public.node_quiz_questions ALTER COLUMN option_d DROP NOT NULL;

-- ============================================================
-- NODO 0.2 — GASMAN
-- ============================================================
UPDATE public.nodes SET
  name = 'Gasman: Entra Como Si Pertenecieras',
  description = 'Ya practicaste el arranque sin disculpa. Ahora vas a entender por qué funciona — y esa claridad lo hace imparable.',
  node_type = 'knowledge',
  engine_type = 'classify',
  conversation_scope = NULL,
  difficulty_level = 1
WHERE id = '0.2';

DELETE FROM public.node_quiz_questions WHERE node_id = '0.2';
DELETE FROM public.node_cards WHERE node_id = '0.2';

INSERT INTO public.node_cards
  (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience)
VALUES
('0.2', 1, 'concept', 'static',
  'En 0.1 practicaste algo sin saber por qué funciona.',
  'Abriste sin pedir disculpas. Sin pedir permiso. Y funcionó mejor. Eso no fue casualidad — hay una teoría completa detrás, y viene de una historia real.',
  NULL, NULL),
('0.2', 2, 'concept', 'static',
  'El gasista de Londres',
  'Hace años en Londres, el gasista entraba a las casas a leer el medidor. Si hacía falta gas, rellenaba. Sin preguntar. Sin pedir permiso. Sin disculparse por estar ahí.

¿Por qué? Porque sabía que estaba destinado a estar ahí. Sabía que no era una intrusión. Esa certeza le daba una autoridad natural que todos a su alrededor aceptaban sin cuestionar.',
  NULL, NULL),
('0.2', 3, 'why_it_works', 'static',
  'La autoridad no se pide. Se asume.',
  'Cuando entras a un negocio disculpándote, le estás comunicando al cliente: "yo mismo creo que no debería estar aquí." Y el cliente te cree.

Cuando entras con la certeza del gasista — con la seguridad de quien tiene algo genuinamente valioso que ofrecer — el cliente también te cree.

Tú tienes excelentes productos que este negocio debería querer conocer. Actúa en consecuencia. Asume la venta hasta que te demuestren lo contrario.',
  NULL, NULL),
('0.2', 4, 'good_example', 'dynamic',
  NULL,
  'Ejemplo de entrada tipo gasman aplicada al contexto de la empresa: entrada con seguridad, calidez y autoridad natural — sin pedir permiso, sin disculparse, sin minimizarse.',
  'Entró como quien pertenece: saludo directo, presencia, cero disculpas. El cliente percibe seguridad — y la seguridad genera confianza.', NULL),
('0.2', 5, 'bad_example', 'dynamic',
  NULL,
  'Ejemplo de entrada tipo intruso aplicada al contexto de la empresa: disculpas, permisos, minimizarse ("solo le quito un minutito").',
  'Cada disculpa le confirma al cliente que esta visita es una molestia. El vendedor se declaró intruso antes de que el cliente decidiera nada.', NULL),
('0.2', 6, 'cta', 'static',
  NULL,
  'No necesitas más energía ni más labia. Necesitas la certeza del gasista: sabes por qué estás ahí, y es una buena razón. Demuéstralo en el siguiente reto.',
  NULL, NULL);

INSERT INTO public.node_quiz_questions
  (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong)
VALUES
('0.2', 1,
  'Un vendedor entra a una refaccionaria y dice: "Disculpe que lo interrumpa, ¿será que me regala dos minutitos?" ¿Cómo entró?',
  'Como gasman — fue educado y respetuoso.',
  'Como intruso — se declaró una molestia antes de empezar.',
  'Neutral — depende de cómo responda el cliente.',
  NULL, 'B',
  'Exacto. Ser educado no es el problema — disculparse por existir sí. Pidió perdón por estar ahí y le pidió al cliente que le "regalara" tiempo. Se declaró intruso él solito.',
  'Fíjate bien: pidió disculpas por interrumpir y pidió tiempo "regalado". La cortesía está bien — pero él se declaró una molestia antes de que el cliente decidiera nada. Eso es entrar como intruso.'),
('0.2', 2,
  'Otro vendedor entra al mismo negocio: "¡Buenos días Don Jorge! Qué buen movimiento tiene hoy. Ando visitando los negocios de la zona." ¿Cómo entró?',
  'Como intruso — no pidió permiso para hablar.',
  'Como gasman — entró con la certeza de quien pertenece.',
  'Arrogante — le faltó humildad.',
  NULL, 'B',
  'Así es. Saludo directo, observación genuina, presencia natural. No pidió permiso para existir — y fíjate que tampoco fue grosero ni arrogante. La autoridad del gasman es tranquila, no prepotente.',
  'Vuelve a leerlo: saludó con nombre, observó el negocio, explicó su presencia con naturalidad. No hay arrogancia — hay certeza tranquila. Eso es exactamente el gasman: ni pedir permiso, ni imponerse. Pertenecer.'),
('0.2', 3,
  'La certeza del gasista venía de que sabía que estaba destinado a estar ahí. En ventas, ¿de dónde sale esa misma certeza?',
  'De años de experiencia — solo los veteranos la tienen.',
  'De fingir seguridad aunque no la sientas.',
  'De saber que tienes algo genuinamente valioso que este negocio debería conocer.',
  NULL, 'C',
  'Esa es la raíz. No es actuación ni antigüedad: es convicción real en lo que ofreces. Cuando de verdad crees que tu producto ayuda a este negocio, entrar con autoridad deja de ser un truco — es lo natural.',
  'La certeza del gasman no viene de fingir ni de los años. Viene de algo más simple: saber que lo que traes vale la pena. Si crees eso de verdad, la autoridad sale sola.');

-- ============================================================
-- NODO 0.3 — REGLA DEL 10%
-- ============================================================
UPDATE public.nodes SET
  name = 'La Regla del 10%',
  description = 'La energía no es un volumen fijo. Se calibra. Aprende a leer al cliente y mantenerte exactamente un paso arriba.',
  node_type = 'skill_drill',
  engine_type = NULL,
  conversation_scope = 'first_impression',
  difficulty_level = 2,
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["mindset.regla_10_por_ciento", "opening.sce", "opening.arranque_sin_disculpa"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "i_do": {
        "briefing": "Mira cómo cambia mi apertura según el cliente. Primero un cliente apagado, luego uno animado. Fíjate: nunca lo igualo — me mantengo un poquito arriba de su energía. Ni lo apabullo, ni me apago.",
        "first_message": "Con un cliente serio y callado: Buenos días Don Roberto. Se ve tranquilo el día hoy, ¿verdad? — calmado, cálido, sin explotar de energía. Ahora con un cliente platicador y animado: ¡Don Roberto, buenos días! ¡Qué gusto verlo con tanto movimiento! — igualo su ánimo y le sumo un poco. La regla: descubre su nivel de emoción, y mantente un 10% más emocionado que él."
      },
      "you_do": {
        "prompt": "Eres el dueño de un negocio recibiendo la visita de un vendedor que no conoces. IMPORTANTE: al iniciar la sesión, elige al azar UNA de estas dos personalidades y mantenla consistente toda la conversación: (A) BAJA ENERGÍA: hablas poco, respuestas cortas, tono seco pero no grosero, estás algo cansado; (B) ALTA ENERGÍA: eres platicador, entusiasta, hablas con exclamaciones, te gusta el relajo. No reveles cuál elegiste — el vendedor debe leerte y adaptarse. Respondes con naturalidad a su saludo según tu personalidad.",
        "objective": "El vendedor ejecuta su apertura (saludo con nombre, observación del entorno, sin disculpa, sin producto) ADAPTANDO su estilo a la energía del cliente: ante el cliente de baja energía, apertura calmada y cálida sin sobreactuar (frases moderadas, sin exceso de exclamaciones); ante el cliente de alta energía, apertura animada que iguala y sube ligeramente el tono (entusiasmo verbal explícito). El scope se cubre cuando la apertura está completa y visiblemente calibrada al cliente."
      },
      "closing": {
        "message": "Muy bien, ahí lo dejamos. Leíste al cliente y ajustaste — eso es exactamente la regla del 10%. Vamos a ver el detalle."
      }
    },
    "success_criteria": [
      {"id": "mindset.regla_10_por_ciento", "weight": 0.5, "description": "Adapta visiblemente su estilo verbal a la energía del cliente: ante cliente seco, frases moderadas y cálidas sin sobreactuar ni apagarse; ante cliente animado, entusiasmo verbal explícito que iguala y sube ligeramente. La adaptación debe notarse en la elección de palabras y estructura, comparando sus mensajes con los del cliente."},
      {"id": "opening.sce", "weight": 0.25, "description": "Apertura completa: saludo con energía en las palabras + observación del entorno o del cliente + inicio de conversación. Sin producto, sin empresa, sin motivo de venta."},
      {"id": "opening.arranque_sin_disculpa", "weight": 0.25, "description": "Abre con seguridad tipo gasman: sin disculpas, sin pedir permiso, sin minimizarse."}
    ],
    "failure_criteria": [
      {"id": "energia_desalineada", "severity": "major", "description": "Ignora por completo la energía del cliente: responde con euforia a un cliente seco (lo apabulla) o con frases planas y mínimas a un cliente animado (lo apaga). Se detecta comparando el estilo de sus mensajes contra el estilo de los mensajes del cliente."},
      {"id": "disculpa_inicial", "severity": "major", "description": "Abre pidiendo perdón o permiso: disculpe la molestia, perdón, no le quito tiempo."},
      {"id": "pitch_prematuro", "severity": "major", "description": "Menciona producto, empresa, promoción o motivo de venta durante la apertura."},
      {"id": "monologo", "severity": "minor", "description": "Turno excesivamente largo que no da espacio al cliente."}
    ],
    "limits": {
      "max_turns": 8,
      "max_duration_seconds": 150,
      "min_turns_before_evaluation": 2
    },
    "notes": "Primera vez que el Actor varía personalidad (A/B aleatoria). La calibración se evalúa por señales TEXTUALES (longitud, exclamaciones, elección de palabras relativa al cliente) — honesto sin audio. Cuando exista pipeline de audio, se agregará el criterio prosódico real."
  }'::jsonb
WHERE id = '0.3';

DELETE FROM public.node_quiz_questions WHERE node_id = '0.3';
DELETE FROM public.node_cards WHERE node_id = '0.3';

INSERT INTO public.node_cards
  (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience)
VALUES
('0.3', 1, 'concept', 'static',
  'El error de los vendedores con "mucha energía"',
  'Un error común es intimidar a las personas llegando demasiado emocionado desde el principio. La energía alta no es mala — mal calibrada, sí. Si el cliente está en 3 y tú llegas en 10, no lo contagias: lo espantas.',
  NULL, NULL),
('0.3', 2, 'concept', 'static',
  'La Regla del 10%',
  'Descubre el nivel de emoción de tu cliente — y mantente un 10% más emocionado que él.

¿Cliente serio y callado? Tú: calmado, cálido, un paso arriba. ¿Cliente platicador y animado? Tú: igualas su ánimo y le sumas un poco.

Nunca lo igualas exacto (te vuelves invisible). Nunca lo doblas (lo apabullas). Siempre un 10% arriba: suficiente para jalar, no para empujar.',
  NULL, NULL),
('0.3', 3, 'why_it_works', 'static',
  '¿Por qué 10% y no 50%?',
  'Porque las personas no saltan de emoción — suben por escalones. Tu trabajo en la introducción no es ponerlas eufóricas: es subirlas UN escalón. Y eso solo se logra desde un escalón cercano al suyo.

Si estás demasiado lejos de su nivel, no hay puente. Si estás en el mismo, no hay a dónde subir. Un 10% arriba es el puente perfecto.',
  NULL, NULL),
('0.3', 4, 'concept', 'static',
  'En este reto, el cliente cambia.',
  'Vas a practicar tu apertura — la misma del nodo anterior — pero ahora el cliente puede recibirte apagado o puede recibirte animado. No sabes cuál te va a tocar.

Tu trabajo: leerlo en sus primeras palabras y calibrar tu apertura a la suya. Un 10% arriba. Ni más, ni menos.',
  NULL, NULL);

-- ============================================================
-- NODO 0.4 — BOSS: LA PRIMERA IMPRESIÓN
-- ============================================================
UPDATE public.nodes SET
  name = 'BOSS: La Primera Impresión',
  description = 'Sin demostración. Sin pistas. Un cliente real, ocupado, y tus primeros 10 segundos. Todo lo del Mundo 0, junto.',
  node_type = 'boss',
  engine_type = NULL,
  conversation_scope = 'first_impression',
  difficulty_level = 3,
  boss_goal = 'Ejecutar una primera impresión completa y calibrada con un cliente ocupado: apertura tipo gasman, personalizada, adaptada a su energía — y ganarse la conversación sin haber mencionado producto.',
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["opening.sce", "opening.arranque_sin_disculpa", "opening.estructura_apertura", "opening.personalizacion", "mindset.regla_10_por_ciento"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "you_do": {
        "prompt": "Eres el dueño de un negocio en un día OCUPADO: estás atendiendo cosas, tienes poco tiempo y tu energía es funcional y seca — no grosera, no hostil, simplemente estás trabajando y un vendedor desconocido acaba de llegar. NO bloqueas ni rechazas (no dices no me interesa ni váyase) — el vendedor aún no aprende a manejar eso. Pero tampoco le regalas la conversación: tus primeras respuestas son cortas y ocupadas (dígame, qué se le ofrece, ando corto de tiempo). Si el vendedor abre BIEN — con calidez genuina, usando tu nombre, observando tu negocio, sin venderte nada todavía, y calibrado a tu energía ocupada — te vas ablandando gradualmente: tus respuestas se alargan, sueltas algo personal del negocio. Si abre mal (disculpándose, vendiendo de entrada, o con euforia desalineada a tu prisa), te mantienes seco y ocupado sin ablandarte.",
        "objective": "El vendedor ejecuta la primera impresión completa ante un cliente ocupado: apertura con estructura (saludo + observación específica + inicio de conversación), personalizada (nombre + algo observable del negocio), sin disculpa ni permiso (gasman), sin mencionar producto/empresa/motivo de venta, y con energía calibrada a un cliente seco y ocupado (cálido pero moderado, sin euforia). El scope se cubre cuando el cliente se ha ablandado visiblemente — sus respuestas se alargaron o soltó algo personal — como resultado de una apertura bien ejecutada."
      },
      "closing": {
        "message": "Ahí está. Eso fue una primera impresión de verdad — cliente ocupado, cero ayuda, y te ganaste la conversación. Veamos el desglose de tu Mundo 0."
      }
    },
    "success_criteria": [
      {"id": "opening.estructura_apertura", "weight": 0.25, "description": "Apertura con estructura completa: saludo + observación específica del entorno o del momento + inicio de conversación. Sin producto, empresa ni motivo de venta."},
      {"id": "opening.personalizacion", "weight": 0.2, "description": "Usa el nombre del cliente y referencia algo específico y observable de su negocio o su situación (el movimiento, la hora, la clientela). Genérico = no cumple."},
      {"id": "opening.arranque_sin_disculpa", "weight": 0.25, "description": "Entra como gasman: sin disculpas, sin pedir permiso, sin minimizarse, incluso ante las respuestas secas del cliente. Mantiene la seguridad cuando el cliente responde cortante."},
      {"id": "mindset.regla_10_por_ciento", "weight": 0.15, "description": "Calibrado al cliente ocupado: cálido pero moderado. Sin euforia ni exceso de exclamaciones ante un cliente seco y con prisa. Respeta el ritmo del cliente en la longitud de sus propios mensajes."},
      {"id": "opening.sce", "weight": 0.15, "description": "La apertura completa transmite energía y calidez en las palabras a lo largo de TODOS sus turnos, no solo el primero. La consistencia es el examen."}
    ],
    "failure_criteria": [
      {"id": "disculpa_inicial", "severity": "major", "description": "Abre pidiendo perdón o permiso, o se minimiza ante la sequedad del cliente (perdón por molestarlo, ya veo que está ocupado, mejor vengo después)."},
      {"id": "pitch_prematuro", "severity": "critical", "description": "Menciona producto, empresa, promoción o motivo de venta. En el boss, este error domina el score: la primera impresión murió."},
      {"id": "energia_desalineada", "severity": "major", "description": "Euforia o exceso de exclamaciones ante un cliente visiblemente ocupado y seco."},
      {"id": "monologo", "severity": "minor", "description": "Turno excesivamente largo que no respeta la prisa del cliente."},
      {"id": "se_derrumba", "severity": "major", "description": "Ante las respuestas secas del cliente, pierde la seguridad: se pone nervioso en el texto, titubea, abandona la estructura o corta la apertura a la mitad."}
    ],
    "limits": {
      "max_turns": 10,
      "max_duration_seconds": 180,
      "min_turns_before_evaluation": 3
    },
    "notes": "BOSS del Mundo 0. Sin i_do (el schema lo permite: phases solo requiere you_do). El Actor NO bloquea (AIR no enseñado — regla de taught_skills) pero es seco y ocupado: la dificultad es sostener la apertura ante frialdad, no atravesar un rechazo. El ablandamiento gradual del Actor es la señal de scope cubierto — el Director la clasifica desde el objective."
  }'::jsonb
WHERE id = '0.4';

DELETE FROM public.node_quiz_questions WHERE node_id = '0.4';
DELETE FROM public.node_cards WHERE node_id = '0.4';

INSERT INTO public.node_cards
  (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience)
VALUES
('0.4', 1, 'concept', 'static',
  'El primer Boss.',
  'Un cliente real. Un día ocupado. Tus primeros 10 segundos.

Sin demostración. Sin pistas. Todo lo que aprendiste en este mundo — el sistema, el SCE, el gasman, la regla del 10% — junto, de una vez.

Los mejores vendedores no brillan cuando el cliente es fácil. Brillan cuando el cliente está ocupado y aún así se ganan la conversación.',
  NULL, NULL);
