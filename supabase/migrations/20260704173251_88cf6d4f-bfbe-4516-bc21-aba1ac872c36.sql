-- Fix qualification codes
UPDATE public.skills SET code='S-037' WHERE id='qualification.luz_verde';
UPDATE public.skills SET code='S-038' WHERE id='qualification.senales_compra';

-- Insert skeleton nodes 5.0-5.5 (idempotent)
INSERT INTO public.nodes (id, world_id, name, order_index, is_boss, node_type)
VALUES
 ('5.0',5,'tmp',0,false,'knowledge'),
 ('5.1',5,'tmp',1,false,'skill_drill'),
 ('5.2',5,'tmp',2,false,'skill_drill'),
 ('5.3',5,'tmp',3,false,'skill_drill'),
 ('5.4',5,'tmp',4,false,'skill_drill'),
 ('5.5',5,'tmp',5,true,'boss')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CLOSER — MUNDO 5 COMPLETO: FACTORES DE IMPULSO
-- ============================================================

INSERT INTO public.skills (id, code, name, short_description, category, world_id_introduced, skill_type, decay_half_life_days, requires_audio, status)
VALUES
('impulse.curva_impulso', 'S-043', 'La Curva de Impulso', 'Entiende que el impulso de compra sube gradual y tiene un pico — y que se construye por escalones, sin abrumar al inicio ni dejar pasar el punto alto.', 'impulse', 5, 'conceptual', 365, false, 'active'),
('impulse.miedo_perdida', 'S-044', 'Miedo a la Pérdida', 'Hace tangible lo que el cliente está perdiendo HOY por no decidir — con datos reales de su negocio, nunca con amenazas inventadas.', 'impulse', 5, 'tecnica', 180, false, 'active'),
('impulse.urgencia', 'S-045', 'Urgencia', 'Da razones reales y verificables para decidir ahora: inventario real, fechas reales, ciclos reales del negocio. El movimiento crea emoción.', 'impulse', 5, 'tecnica', 180, false, 'active'),
('impulse.avaricia', 'S-046', 'Avaricia — Más por Menos', 'Muestra la ganancia extra concreta de decidir bien: el margen, el ahorro, el beneficio adicional — en números del negocio del cliente.', 'impulse', 5, 'tecnica', 180, false, 'active'),
('impulse.efecto_jones', 'S-047', 'Efecto Jones', 'Usa la prueba social real: otros negocios como el suyo ya lo venden y les funciona — específico y verificable, nunca inventado.', 'impulse', 5, 'tecnica', 180, false, 'active'),
('impulse.indiferencia', 'S-048', 'Indiferencia — SW3', 'Emocionado por el producto, indiferente a si ESTE cliente compra. La postura que elimina la presión y paradójicamente vende más.', 'impulse', 5, 'habito', 90, false, 'active'),
('impulse.poder_asumir', 'S-049', 'Poder de Asumir y Sugerir', 'Avanza asumiendo el interés y sugiriendo el siguiente paso con naturalidad — elimina las puertas al no sin presionar.', 'impulse', 5, 'tecnica', 180, false, 'active')
ON CONFLICT (id) DO NOTHING;

-- NODO 5.0
UPDATE public.nodes SET
  name = 'La Curva de Impulso',
  description = 'La decisión de compra no es un interruptor — es una curva que sube, hace pico y baja. Aprende a verla en vivo.',
  node_type = 'knowledge', engine_type = 'classify', conversation_scope = NULL, difficulty_level = 2
WHERE id = '5.0';

DELETE FROM public.node_quiz_questions WHERE node_id = '5.0';
DELETE FROM public.node_cards WHERE node_id = '5.0';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('5.0', 1, 'concept', 'static',
  'El impulso es una curva, no un interruptor.',
  'Nadie pasa de "no me interesa" a "lo compro" de golpe. El interés sube por una curva: escalón por escalón — un sí por aquí, una imagen que le gustó por allá, un dato que le hizo sentido.

Sube gradual... llega a un PICO... y si nadie hace nada con él, BAJA. El impulso que no se usa, se enfría. Y frío, ya no regresa igual.',
  NULL, NULL),
('5.0', 2, 'concept', 'static',
  'Los dos errores de la curva',
  'ERROR 1 — Abrumar al inicio: llegar con toda la artillería cuando el cliente está en el escalón cero. La curva no arranca a empujones — se espanta. Por eso los primeros pasos del sistema no venden: construyen.

ERROR 2 — Dejar pasar el pico: el cliente llegó arriba (pregunta precios, se imagina comprando, asiente a todo)... y el vendedor sigue presentando. Para cuando termina su rollo, la curva ya bajó. El momento se fue — y era EL momento.',
  NULL, NULL),
('5.0', 3, 'why_it_works', 'static',
  'Tu trabajo: leer en qué punto de la curva está.',
  'Curva subiendo: el cliente pregunta, asiente, se acerca — sigue alimentando con valor, síes e imágenes.

Pico: señales de compra claras y seguidas — deja de presentar. Lo que sigue ahí es avanzar (y eso lo dominarás en el mundo del cierre).

Curva bajando: respuestas que se enfrían, mirada al reloj — algo pasó; deja de empujar y vuelve a construir valor, o lee si es momento de retirarte bien.

Los factores de impulso que vas a aprender en este mundo son los aceleradores de esa curva. Pero primero tenías que ver la curva.',
  NULL, NULL);

INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong) VALUES
('5.0', 1,
  'A media presentación, el cliente interrumpe: "¿Y cómo estaría el precio? ¿Manejan entrega?" El vendedor responde: "Ahorita le digo, déjeme terminar de explicarle las otras líneas que manejamos." ¿Qué acaba de pasar?',
  'Bien hecho — la información completa es primero.',
  'El cliente llegó al pico de la curva... y el vendedor lo dejó pasar por terminar su rollo.',
  'El cliente estaba siendo grosero al interrumpir.',
  NULL, 'B',
  'Doble señal de compra (precio + entrega) = pico de la curva. Ese era EL momento. Cada minuto extra de presentación desde ahí no suma — enfría. El catálogo completo no le importa a alguien que ya quiere comprar.',
  'La interrupción del cliente era la mejor noticia del día: preguntó precio Y entrega — pico de curva, señales gritando. Seguir presentando ahí es servir el postre cuando el cliente ya pidió la cuenta. La información completa vale menos que el momento.'),
('5.0', 2,
  '¿Por qué "abrumar al inicio" mata la curva en lugar de acelerarla?',
  'Porque la curva sube por escalones — y el cliente en el escalón cero no tiene dónde recibir toda la artillería: se espanta en lugar de subir.',
  'Porque está prohibido hablar del producto.',
  'Porque los clientes prefieren vendedores callados.',
  NULL, 'A',
  'Exacto. El impulso se construye gradual: primero confianza, luego interés, luego deseo. Descargar todo en el minuto uno es pedirle a alguien que salte del piso al techo — no puede, y además le da miedo el intento.',
  'No es prohibición ni silencio — es secuencia. La curva necesita escalones: la apertura construye el primero, la historia el segundo, el descubrimiento el tercero... Saltárselos con artillería temprana no acelera la subida: derrumba la escalera.'),
('5.0', 3,
  'El vendedor nota que las respuestas del cliente se están enfriando: contestó "ajá" dos veces seguidas y miró su celular. ¿Qué dice la curva?',
  'Que hay que empujar más fuerte antes de que se acabe el tiempo.',
  'Que la curva va bajando: dejar de empujar, y volver a construir valor — o leer si es momento de retirarse bien.',
  'Que el cliente es un maleducado.',
  NULL, 'B',
  'Curva bajando se responde con menos presión, no con más. Empujar una curva que baja la hunde. Se regresa a lo que la subió (valor, su dolor, su escena) — o si ya no hay materia, se cierra la visita con calidad para volver otro día con la curva en cero, no en negativo.',
  'Empujar una curva que baja es acelerar cuesta abajo: cada insistencia la hunde más. Lo que baja la curva casi siempre es exceso de presión o pérdida de conexión — y ninguna de las dos se arregla con más presión. Se arregla con valor... o con una buena retirada.');

-- NODO 5.1
UPDATE public.nodes SET
  name = 'Lo Que Pierde por Esperar',
  description = 'Los dos primeros aceleradores: hacer visible lo que el cliente pierde HOY, y darle razones reales para decidir ahora.',
  node_type = 'skill_drill', engine_type = NULL, conversation_scope = 'presentation', difficulty_level = 3,
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["impulse.miedo_perdida", "impulse.urgencia"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "i_do": {
        "briefing": "Escucha los dos aceleradores — y fíjate en el detalle más importante: TODO lo que digo es verdad verificable. El miedo a la pérdida se construye con SUS números, y la urgencia con fechas y hechos reales. Ni una gota de teatro.",
        "first_message": "Miedo a la pérdida, con sus datos: Usted me dijo que pierde como dos clientes al mes por faltantes. Son veinticuatro al año, Don Ramón — y cada uno se lleva sus compras a la competencia... y a veces ya no regresa. Eso está pasando hoy, mientras platicamos. Urgencia, con hechos reales: Esta semana ando levantando los pedidos de la zona — si lo dejamos para la otra, su primer surtido le llegaría hasta el mes que entra. ¿Ve? Nada inventado: su pérdida es real y mi fecha es real. Por eso funciona."
      },
      "you_do": {
        "prompt": "Eres el dueño de un negocio al final de una buena presentación: el vendedor ya conectó con tu dolor (elígelo al azar: pierdes ~2 clientes al mes por faltantes de tu proveedor / tienes ~15 mil pesos muertos en un anaquel que no rota / tus clientes piden una línea que no consigues y se van con ella a otro lado) y estás INTERESADO PERO PASIVO: tu postura inicial es está bueno, déjeme pensarlo y luego le digo — sin rechazo, pura inercia de no decidir. TU REGLA ESPEJO: (A) si el vendedor hace TANGIBLE tu pérdida con TUS números y datos reales (lo que pierdes al mes, a dónde se va ese dinero, que está pasando HOY), tu pasividad se mueve: pues sí, viéndolo así... y preguntas algo concreto. (B) si te da una razón de urgencia REAL y verificable (su ruta de pedidos de la semana, tiempos de entrega reales, un ciclo real de tu negocio como la quincena o la temporada), tu decisión se acerca: preguntas por el siguiente paso. (C) si INVENTA escasez o urgencia con olor a teatro (es el último que me queda, la promoción se acaba HOY, ya casi no tengo), respondes con escepticismo directo: mmm, eso dicen todos, ¿no? — y tu confianza BAJA visiblemente. (D) si solo repite valor sin acelerador, permaneces amable y pasivo: sí, suena bien, yo le aviso.",
        "objective": "El vendedor mueve a un interesado-pasivo aplicando los dos aceleradores con verdad: (1) hace tangible la pérdida actual usando los números y datos que el cliente declaró (cuantifica lo que pierde por mes/año, nombra a dónde se va), y (2) da al menos una razón de urgencia real y verificable para decidir ahora (ruta, tiempos, ciclo del negocio) — sin inventar escasez ni teatro. El scope se cubre cuando el cliente pasó de déjeme pensarlo a preguntar por el siguiente paso concreto."
      },
      "closing": {
        "message": "Lo moviste — y sin inventarle nada: su pérdida era real y tu fecha era real. Así se acelera una curva sin quemar la confianza. Vamos al detalle."
      }
    },
    "success_criteria": [
      {"id": "impulse.miedo_perdida", "weight": 0.5, "description": "Hace tangible la pérdida ACTUAL con los datos del cliente: cuantifica (clientes/dinero por mes o año), nombra el destino de la pérdida (la competencia, el dinero muerto), y la ancla en el presente (está pasando hoy). Todo derivado de lo que el cliente declaró — nada inventado."},
      {"id": "impulse.urgencia", "weight": 0.5, "description": "Da al menos una razón real y verificable para decidir ahora: su ruta o ciclo de pedidos, tiempos de entrega concretos, o un ciclo real del negocio del cliente. La urgencia nace de hechos, no de presión — y el cliente la recibe sin escepticismo."}
    ],
    "failure_criteria": [
      {"id": "impulso_falso", "severity": "critical", "description": "Inventa escasez, urgencia o presión sin ancla real: es el último, la promo se acaba hoy, ya casi no tengo, otros lo están apartando. El cliente lo huele (eso dicen todos) y la confianza construida en tres mundos se quema en una frase. El pecado capital de este mundo."},
      {"id": "presion_directa", "severity": "major", "description": "Sustituye los aceleradores por presión frontal: ándele, anímese, no lo piense tanto, ¿entonces qué, sí o no? — empuja la curva en vez de acelerarla."},
      {"id": "perdida_generica", "severity": "major", "description": "Habla de pérdida en abstracto (está perdiendo dinero, le conviene) sin usar los números ni el dolor específico que el cliente declaró."},
      {"id": "monologo", "severity": "minor", "description": "Descarga ambos aceleradores en un solo bloque sin dejar reaccionar al cliente."}
    ],
    "limits": {
      "max_turns": 10,
      "max_duration_seconds": 210,
      "min_turns_before_evaluation": 2
    },
    "notes": "Primer drill de impulso. El Actor arranca en interesado-pasivo (déjeme pensarlo) — el estado real más común del campo. Espejo de tres vías: verdad tangible → movimiento; urgencia real → siguiente paso; teatro → escepticismo con castigo de confianza. impulso_falso es critical en TODO el mundo 5: la ética es el diseño."
  }'::jsonb
WHERE id = '5.1';

DELETE FROM public.node_quiz_questions WHERE node_id = '5.1';
DELETE FROM public.node_cards WHERE node_id = '5.1';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('5.1', 1, 'concept', 'static',
  'El dolor de perder pesa el doble que el gusto de ganar.',
  'Así funciona la cabeza humana: perder $100 duele más que lo que alegra ganar $100. No es teoría — es cómo decidimos todos.

Por eso el acelerador más potente no es "mire lo que va a ganar" — es "mire lo que ya está perdiendo". La diferencia: la ganancia es futura e hipotética. La pérdida está pasando HOY, mientras platican.',
  NULL, NULL),
('5.1', 2, 'concept', 'static',
  'Se construye con SUS números — no con tus adjetivos.',
  'Débil: "Está perdiendo mucho dinero con esos faltantes."
Potente: "Usted me dijo que se le van dos clientes al mes. Son veinticuatro al año, Don Ramón — cada uno comprándole a la competencia. Y eso está pasando hoy."

La receta: toma el dolor que Él te declaró, ponle números, ponle destino (¿a dónde se va esa pérdida?), y áncla en el presente. Su propio dato, devuelto con peso. Contra eso no hay "déjeme pensarlo" que aguante.',
  NULL, NULL),
('5.1', 3, 'concept', 'static',
  'Urgencia: razones reales para decidir HOY.',
  'La urgencia honesta existe y sobra — no hay que inventarla:

Tu ruta es real: "esta semana levanto los pedidos de la zona; si lo dejamos, su surtido llega hasta el mes que entra."
Sus ciclos son reales: "la quincena se le viene encima — ¿la quiere recibir surtido o esperando?"
Los tiempos son reales: "el pedido tarda una semana en llegar; decidiendo hoy, lo tiene antes del fin de semana bueno."

El movimiento crea emoción. La fecha real crea decisión.',
  NULL, NULL),
('5.1', 4, 'why_it_works', 'static',
  'La línea roja: si no es verdad, no se dice.',
  '"Es el último que me queda." "La promoción se acaba HOY." "Ya me lo están apartando."

Si es verdad — dilo con todas sus letras. Si es teatro — el cliente lo huele ("eso dicen todos"), y la confianza que tardaste cuatro pasos en construir se quema en una frase. Y un cliente que te cachó una vez, te descuenta TODO lo que digas después.

En Closer, los aceleradores corren con gasolina de verdad. Es más lento de conseguir — y es lo único que no explota.',
  NULL, NULL);

-- NODO 5.2
UPDATE public.nodes SET
  name = 'Más por Menos y el Efecto Jones',
  description = 'Los otros dos aceleradores: la ganancia extra que se siente ganga, y la prueba social de los que ya le entraron.',
  node_type = 'skill_drill', engine_type = NULL, conversation_scope = 'presentation', difficulty_level = 3,
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["impulse.avaricia", "impulse.efecto_jones"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "i_do": {
        "briefing": "Los últimos dos aceleradores. La avaricia bien usada no es codicia — es mostrarle la ganancia EXTRA en números de su negocio. Y el efecto Jones es la fuerza más vieja del mundo: si a los de al lado les funciona, yo también quiero. Con nombres reales — o nada.",
        "first_message": "Más por menos, con números: Con el margen de esta línea, cada caja le deja ochenta pesos más que la que maneja — son como mil doscientos extra al mes sin vender ni una pieza más. Efecto Jones, con verdad: La refaccionaria de la San José le entró hace dos meses — el señor Aurelio ya va en su tercer pedido. Y el taller grande de la avenida, igual. Por esta zona ya se está moviendo fuerte. ¿Nota que no presioné? Solo le mostré la ganancia y le conté quién más ya la está cobrando."
      },
      "you_do": {
        "prompt": "Eres el dueño de un negocio al final de una buena presentación conectada a tu dolor (elígelo al azar como en drills previos) y estás en modo interesado-pasivo: suena bien, déjeme pensarlo. TU REGLA ESPEJO: (A) si el vendedor te muestra ganancia EXTRA con números concretos y creíbles de tu operación (margen por caja, ahorro al mes, beneficio adicional calculado), tu interés se activa: haces cuentas en voz alta (a ver, ¿ochenta por caja?...) y preguntas detalles. (B) si te da prueba social ESPECÍFICA y verificable (negocio con nombre o ubicación reconocible de tu zona, tiempo que lleva, resultado concreto), tu confianza sube: ah, ¿el de la San José? sí lo ubico... y tu resistencia baja visiblemente. (C) si la prueba social es VAGA (muchos clientes, varios negocios, todo mundo lo está llevando — sin un solo nombre o referencia verificable), respondes escéptico: ¿ah sí? ¿como quiénes? — y si no puede concretar, tu desconfianza sube. (D) si los números de ganancia son exagerados o redondos sin sustento (va a duplicar sus ventas), respondes: mmm, eso suena a mucho, ¿no?",
        "objective": "El vendedor aplica los dos aceleradores con concreción: (1) muestra la ganancia extra en números específicos y creíbles del negocio del cliente (margen, ahorro o beneficio mensual calculado), y (2) da prueba social específica y verificable — al menos una referencia con nombre, ubicación o detalle reconocible, con su resultado concreto. El scope se cubre cuando el cliente hizo cuentas en voz alta O validó la referencia social, y pasó de pasivo a preguntar por el siguiente paso."
      },
      "closing": {
        "message": "Le mostraste la ganancia con números y le contaste quién ya la está cobrando — y su déjeme pensarlo se convirtió en cuánto y cuándo. Así trabajan estos dos. Vamos al detalle."
      }
    },
    "success_criteria": [
      {"id": "impulse.avaricia", "weight": 0.5, "description": "Muestra ganancia extra con números concretos y creíbles del negocio del cliente: margen por unidad, beneficio mensual calculado, ahorro específico — cifras que el cliente puede verificar con sus propias cuentas, no promesas redondas (duplicar ventas)."},
      {"id": "impulse.efecto_jones", "weight": 0.5, "description": "Da al menos una prueba social específica y verificable: negocio con nombre, ubicación o seña reconocible + tiempo + resultado concreto. El cliente la puede validar (o al menos ubicar) — nunca el vago muchos clientes ya lo llevan."}
    ],
    "failure_criteria": [
      {"id": "impulso_falso", "severity": "critical", "description": "Inventa prueba social o números: referencias que no existen, cifras infladas, todo mundo lo lleva sin poder nombrar a nadie. Si el cliente pregunta ¿como quiénes? y no hay respuesta concreta, el factor era teatro."},
      {"id": "promesa_grandilocuente", "severity": "major", "description": "Ganancias exageradas sin sustento: va a duplicar sus ventas, se va a llenar de clientes — el cliente responde eso suena a mucho."},
      {"id": "presion_directa", "severity": "major", "description": "Cambia los aceleradores por empuje frontal: no se lo pierda, todos le están entrando, apúrese."},
      {"id": "perdida_generica", "severity": "minor", "description": "Ganancia en abstracto (le conviene, va a ganar más) sin un solo número."}
    ],
    "limits": {
      "max_turns": 10,
      "max_duration_seconds": 210,
      "min_turns_before_evaluation": 2
    },
    "notes": "El Actor valida especificidad: hace cuentas ante números creíbles, reconoce referencias reales de zona, y ataca lo vago con ¿como quiénes? — la pregunta que desnuda el Jones falso. El company_brain provee las referencias reales de cada empresa (clientes existentes de la zona) para que el ejemplo dinámico sea verificable."
  }'::jsonb
WHERE id = '5.2';

DELETE FROM public.node_quiz_questions WHERE node_id = '5.2';
DELETE FROM public.node_cards WHERE node_id = '5.2';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('5.2', 1, 'concept', 'static',
  'Más por menos: la ganancia que se siente ganga.',
  'A todos nos gusta ganar de más — es humano. El acelerador de la avaricia no es codicia: es mostrarle al cliente la ganancia EXTRA que hoy no está viendo.

Débil: "le conviene, va a ganar más."
Potente: "cada caja le deja ochenta pesos más que la que maneja — son mil doscientos extra al mes sin vender una pieza más."

La regla: números que ÉL pueda verificar con sus propias cuentas. Cuando el cliente hace la cuenta en voz alta... el acelerador ya está trabajando solo.',
  NULL, NULL),
('5.2', 2, 'concept', 'static',
  'El Efecto Jones: nadie quiere quedarse fuera.',
  'Es la fuerza más vieja del mundo: si al de al lado le está funcionando, yo también quiero. En los negocios pesa doble — porque quedarse fuera no es solo antojo: es la competencia ganándote clientes.

"La refaccionaria de la San José le entró hace dos meses — don Aurelio ya va en su tercer pedido."

Nombre, lugar, tiempo, resultado. El cliente lo puede ubicar, hasta preguntarle. Eso es prueba social — lo demás es rumor.',
  NULL, NULL),
('5.2', 3, 'why_it_works', 'static',
  'La prueba del "¿como quiénes?"',
  'Di "muchos negocios ya lo están llevando" y el cliente escéptico te va a soltar la pregunta que desnuda todo: "¿ah sí? ¿como quiénes?"

Si tienes nombres reales — la pregunta es tu mejor amiga: la respondes y la confianza sube en el acto. Si no los tienes — acabas de quemar el factor y de paso tu credibilidad.

Por eso el Jones se prepara ANTES de salir: ¿qué clientes reales de esta zona ya me compran? ¿qué resultados concretos puedo contar? Esa lista vale más que cualquier técnica.',
  NULL, NULL);

-- NODO 5.3
UPDATE public.nodes SET
  name = 'La Postura del Indiferente',
  description = 'La paradoja más rara de las ventas: entre menos necesitas la venta, más vendes. Hoy la practicas contra un cliente que juega a hacerse el difícil.',
  node_type = 'skill_drill', engine_type = NULL, conversation_scope = 'presentation', difficulty_level = 3,
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["impulse.indiferencia", "mindset.kilt"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "i_do": {
        "briefing": "Escucha la postura del indiferente. El cliente se hace el difícil esperando que yo ruegue — y yo estoy emocionado por mi producto pero perfectamente tranquilo con su decisión. Esa combinación desarma: la presión desaparece... y sin presión, el interés de él respira.",
        "first_message": "Cliente: Mmm, la verdad no sé... hay muchos proveedores dando vueltas, ¿qué tiene usted de especial? Yo: Mire, la verdad — el producto me encanta y por eso lo traigo. Pero si le sirve o no, eso lo decide usted, que conoce su negocio mejor que nadie. Al de la San José le funcionó para su rotación; si a usted no le hace sentido, no pasa nada — la zona es grande. ¿Le platico cómo lo está usando él, o lo dejamos para otra vuelta? ¿Nota? Cero ruego. Y ahora el que no quiere que me vaya... es él."
      },
      "you_do": {
        "prompt": "Eres el dueño de un negocio de tipo REGATEADOR-PROBADOR: te interesa lo que el vendedor trae (ya te presentó con valor conectado a tu dolor — dalo por hecho y elígelo al azar), pero tu deporte es hacerte el difícil para ver si el vendedor se desespera y ruega — así consigues mejores condiciones y de paso mides con quién tratas. TUS JUGADAS (usa 2-3 en la sesión): no sé, hay muchos proveedores dando vueltas... / ¿y qué tiene usted de especial? / la verdad no me urge... / déjeme ver qué me ofrece el otro primero. TU REGLA ESPEJO: si el vendedor mantiene la POSTURA INDIFERENTE (sigue emocionado por su producto pero tranquilo con tu decisión: te da la razón sin pelear, no ruega, no mejora la oferta sin que la pidas, hasta te ofrece con naturalidad dejarlo para otra vuelta), tus jugadas se agotan — sueltas el juego y muestras tu interés real: bueno, a ver, ¿y cómo estaría eso en pedidos? Si el vendedor RUEGA (insiste, se pone nervioso, suplica la oportunidad) o SE DESINFLA en descuentos y concesiones no pedidas, hueles sangre: aprietas más jugadas y tu respeto baja — al final dices déjeme pensarlo con tono de victoria. Si el vendedor se ofende o se pica con tus jugadas, la conversación se enfría.",
        "objective": "El vendedor sostiene la postura del indiferente ante un regateador-probador: responde a las jugadas de difícil con tranquilidad y sin pelear (puede darle la razón: claro, hay muchos proveedores), mantiene el entusiasmo por su producto sin rogar ni ofrecer concesiones no pedidas, y conserva la disposición genuina de retirarse bien (si no le hace sentido, no pasa nada / lo dejamos para otra vuelta) — hasta que el cliente suelta el juego y muestra su interés real. El scope se cubre cuando el cliente abandonó las jugadas y preguntó en serio por el siguiente paso."
      },
      "closing": {
        "message": "Se le acabaron las jugadas — porque no encontró desesperación que apretar. Esa es la paradoja: el que está dispuesto a irse es al que no dejan ir. Vamos al detalle."
      }
    },
    "success_criteria": [
      {"id": "impulse.indiferencia", "weight": 0.6, "description": "Sostiene la postura SW3 ante todas las jugadas: entusiasmo por el producto intacto + tranquilidad total con la decisión del cliente. No ruega, no insiste con desesperación, no ofrece descuentos ni concesiones no pedidas, y expresa al menos una vez con naturalidad su disposición a retirarse bien (no pasa nada, lo dejamos para otra vuelta)."},
      {"id": "mindset.kilt", "weight": 0.4, "description": "Cero enganche emocional con las jugadas del difícil: ni se ofende, ni se pica, ni pierde la calidez. Responde a las provocaciones (¿qué tiene de especial?) con amabilidad y sin defensividad — el juego del cliente no le mueve el texto."}
    ],
    "failure_criteria": [
      {"id": "ruega", "severity": "critical", "description": "Suplica la oportunidad o insiste con desesperación: deme chance, no se va a arrepentir, de verdad se lo pido — la sangre que el regateador estaba oliendo. El fallo central de este drill."},
      {"id": "concesion_no_pedida", "severity": "major", "description": "Se desinfla ante las jugadas ofreciendo descuentos, regalos o mejoras que nadie pidió — le enseñó al cliente que hacerse el difícil paga."},
      {"id": "se_derrumba", "severity": "major", "description": "Se ofende, se pica o pierde la calidez ante las jugadas del difícil."},
      {"id": "presion_directa", "severity": "major", "description": "Convierte la indiferencia en su opuesto: presión frontal para forzar la decisión."},
      {"id": "impulso_falso", "severity": "major", "description": "Finge indiferencia con teatro obvio (bueno pues ahí muere, me voy con su competencia) — la indiferencia real es tranquila, no amenazante."}
    ],
    "limits": {
      "max_turns": 12,
      "max_duration_seconds": 240,
      "min_turns_before_evaluation": 3
    },
    "notes": "El Actor regateador-probador es un arquetipo real del campo LATAM: prueba con jugadas de difícil buscando desesperación que apretar. El espejo: postura sostenida → las jugadas se agotan; ruego o concesión → huele sangre y aprieta. La indiferencia SW3 es hábito (decay 90) — de los skills que más se oxidan bajo presión de cuota real."
  }'::jsonb
WHERE id = '5.3';

DELETE FROM public.node_quiz_questions WHERE node_id = '5.3';
DELETE FROM public.node_cards WHERE node_id = '5.3';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('5.3', 1, 'concept', 'static',
  'La paradoja: el que necesita la venta, la espanta.',
  'El cliente huele la necesidad como los perros huelen el miedo. Un vendedor que RUEGA le dice al cliente dos cosas sin querer: que nadie más le está comprando (mala señal)... y que apretándolo va a sacar mejores condiciones (peor señal).

El indiferente comunica lo contrario: mi producto se mueve, mi zona es grande, y tu decisión — cualquiera que sea — no me quita el sueño. Y esa seguridad, paradójicamente, es magnética.',
  NULL, NULL),
('5.3', 2, 'concept', 'static',
  'SW3 en el campo: emocionado por el producto, tranquilo con la decisión.',
  'Ojo con el matiz — indiferencia NO es frialdad ni desgano:

Por tu PRODUCTO: entusiasmo genuino, siempre. "El producto me encanta y por eso lo traigo."
Por SU DECISIÓN: tranquilidad total. "Si le sirve, qué bueno. Si no, no pasa nada — la zona es grande."

Y la frase que desarma a cualquier difícil: "¿Le platico cómo lo está usando el de la San José... o lo dejamos para otra vuelta?" El que está dispuesto a irse es, misteriosamente, al que no dejan ir.',
  NULL, NULL),
('5.3', 3, 'why_it_works', 'static',
  'El juego del difícil se acaba cuando no hay miedo que apretar.',
  'Hay clientes que juegan a hacerse los difíciles como deporte: "hay muchos proveedores...", "¿y usted qué tiene de especial?", "no me urge...". No es rechazo — es una prueba: están midiendo si ruegas.

Si ruegas o sueltas descuentos no pedidos: hueles a miedo, y el juego se pone peor — acabas regalando margen y respeto.

Si sostienes la postura — tranquilo, cálido, dispuesto a volver otro día — las jugadas se agotan solas. Y detrás del juego aparece el interés real que estuvo ahí todo el tiempo.',
  NULL, NULL);

-- NODO 5.4
UPDATE public.nodes SET
  name = 'El Poder de Asumir',
  description = 'El último acelerador — y el puente directo al cierre: avanzar asumiendo el interés, sugiriendo el paso siguiente como lo más natural del mundo.',
  node_type = 'skill_drill', engine_type = NULL, conversation_scope = 'presentation', difficulty_level = 3,
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["impulse.poder_asumir", "presentation.tren_si_si"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "i_do": {
        "briefing": "El último acelerador. Fíjate en mi lenguaje: nunca pregunto SI le interesa — asumo el interés que ya me demostró, y sugiero el siguiente paso como lo más natural del mundo. Cada frase avanza sin abrir una sola puerta al no.",
        "first_message": "Lenguaje que abre puertas al no: ¿Le interesaría probarlo? ¿Quiere que le mande información? — cada pregunta invita un no gratis. Lenguaje que asume: Mire, para su rotación lo que le va a funcionar es empezar con la caja mixta. Se la traigo el jueves que ando por acá y ya la quincena la agarra surtido. Le va a encantar cómo se mueve. — ¿Notó? No pregunté si quiere: sugerí cuál, cuándo y qué sigue. Si algo no le late, él me lo dice — pero yo no le regalo la puerta del no."
      },
      "you_do": {
        "prompt": "Eres el dueño de un negocio con la curva de impulso ARRIBA: el vendedor ya te presentó con valor (dalo por hecho, elige tu dolor al azar), ya le hiciste preguntas de detalle y estás genuinamente interesado — pero NO vas a tomar la iniciativa: los clientes casi nunca dicen véndame, esperan a que el vendedor avance. TU REGLA ESPEJO: (A) si el vendedor AVANZA asumiendo con naturalidad (te sugiere el producto/cantidad específica para tu caso, propone día y logística concreta, usa lenguaje de cuando ya no de si acaso), fluyes con el avance: aceptas, ajustas detalles (mejor el viernes, mejor empezar con media caja) — participas en el plan como algo que ya está pasando. (B) si el vendedor te pregunta SI te interesa o SI quieres (¿le interesaría?, ¿quiere que...?, ¿cómo ve?), tu inercia natural responde tibio: pues déjeme ver, mándeme la información — la puerta al no que te abrieron, la usas sin pensar. (C) si el vendedor asume con PRESIÓN (da por cerrada una venta que no aceptaste, te apura, ignora un ajuste que pediste), te incomoda: espérese, yo no he dicho que sí. (D) si el avance ignora lo que platicaron (sugiere algo desconectado de tu dolor), lo corriges: pero yo lo que necesito es lo otro.",
        "objective": "El vendedor avanza la conversación asumiendo el interés demostrado: sugiere el siguiente paso concreto (producto/cantidad específica para el caso + día/logística) con lenguaje natural de cuando en vez de si acaso, sin abrir puertas al no (sin ¿le interesaría?, ¿quiere que...?) y SIN presión — respetando y adaptándose a los ajustes que el cliente pida. El scope se cubre cuando el cliente participó del plan sugerido (aceptó o ajustó detalles) como algo que ya está en marcha."
      },
      "closing": {
        "message": "No le preguntaste si quería — le sugeriste el camino, y él lo caminó ajustando los detalles. Eso es asumir: ni presión ni permiso. En el siguiente mundo, esta habilidad se convierte en el cierre. Vamos al detalle."
      }
    },
    "success_criteria": [
      {"id": "impulse.poder_asumir", "weight": 0.6, "description": "Avanza asumiendo: sugiere el siguiente paso concreto (qué producto/cantidad + cuándo/cómo) con lenguaje de cuando en vez de si acaso, sin una sola pregunta que abra la puerta al no (¿le interesaría?, ¿quiere que le mande info?, ¿cómo ve?), y adaptándose con flexibilidad a los ajustes del cliente — asumir sin presionar."},
      {"id": "presentation.tren_si_si", "weight": 0.4, "description": "El avance viene preparado: antes o durante la sugerencia, siembra al menos un sí genuino anclado en lo conversado que hace el paso siguiente sentirse natural (esto le resuelve lo de sus faltantes, ¿verdad? → entonces empezamos con...)."}
    ],
    "failure_criteria": [
      {"id": "abre_puerta_al_no", "severity": "major", "description": "Pregunta si en vez de asumir cuando: ¿le interesaría?, ¿quiere que le mande información?, ¿lo piensa y me avisa? — cada una invita el no gratis y el cliente la usa (déjeme ver)."},
      {"id": "asume_con_presion", "severity": "critical", "description": "Confunde asumir con imponer: da por cerrada una venta no aceptada, ignora los ajustes que el cliente pide, o apura la decisión — el cliente responde espérese, yo no he dicho que sí. La línea entre asumir y presionar es EL aprendizaje de este nodo."},
      {"id": "avance_desconectado", "severity": "major", "description": "Su sugerencia ignora lo conversado: propone producto o plan desconectado del dolor y los detalles que el cliente dio."},
      {"id": "presion_directa", "severity": "major", "description": "Empuje frontal en lugar de sugerencia natural: ándele, anímese, firme aquí."}
    ],
    "limits": {
      "max_turns": 10,
      "max_duration_seconds": 210,
      "min_turns_before_evaluation": 2
    },
    "notes": "El puente directo al M6: el cierre asumido es esta habilidad aplicada al momento de la decisión. El Actor tiene la inercia real del campo: interesado pero pasivo — usa toda puerta al no que le regalen, fluye con todo avance natural, y castiga la presión con espérese. La distinción asumir/presionar (critical) es el corazón ético del nodo."
  }'::jsonb
WHERE id = '5.4';

DELETE FROM public.node_quiz_questions WHERE node_id = '5.4';
DELETE FROM public.node_cards WHERE node_id = '5.4';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('5.4', 1, 'concept', 'static',
  'Cada "¿le interesaría?" es un no gratis.',
  '"¿Le interesaría probarlo?" — Pues déjeme ver.
"¿Quiere que le mande información?" — Sí, mándemela. (Nunca la lee.)
"¿Lo piensa y me avisa?" — Claro. (No avisa.)

¿Ves el patrón? Cada pregunta de SI abre una puerta al no — y la inercia humana siempre agarra la salida fácil. El cliente interesado no necesita que le preguntes si quiere. Necesita que le muestres el camino.',
  NULL, NULL),
('5.4', 2, 'concept', 'static',
  'Asumir: lenguaje de "cuando", no de "si acaso".',
  '"Mire, para su rotación lo que le va a funcionar es la caja mixta. Se la traigo el jueves que ando por acá — y la quincena la agarra surtido."

Qué hizo esa frase: sugirió QUÉ (específico para su caso), sugirió CUÁNDO (día concreto), y pintó el resultado. Ni una pregunta de permiso.

¿Y si algo no le late al cliente? Él lo dice — "mejor el viernes", "mejor media caja" — y fíjate: ajustar detalles ES participar del plan. El que negocia el día del pedido... ya está pidiendo.',
  NULL, NULL),
('5.4', 3, 'why_it_works', 'static',
  'La línea sagrada: asumir NO es presionar.',
  'Asumir es sugerir el camino natural y dejar al cliente caminar — con libertad total de ajustar o parar.

Presionar es dar por cerrado lo que no se aceptó, ignorar sus ajustes, o apurar. La respuesta del cliente te dice de qué lado estás: si fluye y ajusta detalles, asumiste bien. Si dice "espérese, yo no he dicho que sí" — cruzaste la línea, y toca dar un paso atrás con gracia: "tiene razón, me emocioné — ¿usted cómo lo ve?"

El poder de asumir funciona porque respeta: sugiere sin encerrar. En el siguiente mundo, esta habilidad se gradúa: se llama cierre.',
  NULL, NULL);

-- NODO 5.5 BOSS
UPDATE public.nodes SET
  name = 'BOSS: Enciende al Indiferente',
  description = 'El cliente más difícil que has visto: amable, platicador... y sin la mínima intención de comprar. Tu misión: encender su curva desde cero absoluto.',
  node_type = 'boss', engine_type = NULL, conversation_scope = 'presentation', difficulty_level = 4,
  is_boss = true,
  boss_goal = 'Convertir a un amigable-que-no-compra: construir la curva de impulso desde cero absoluto usando al menos dos factores FUJPIG con verdad, sostener la postura indiferente ante su pasividad encantadora, y avanzar asumiendo hasta que participe de un plan concreto.',
  practice_script = '{
    "version": "1.0.0",
    "i_do_type": "demo",
    "scope": {
      "skills_in_focus": ["impulse.miedo_perdida", "impulse.urgencia", "impulse.efecto_jones", "impulse.indiferencia", "impulse.poder_asumir", "discovery.dolor_real"],
      "out_of_scope_behavior": "redirect"
    },
    "phases": {
      "you_do": {
        "prompt": "Eres el dueño de un negocio del arquetipo AMIGABLE-QUE-NO-COMPRA: encantador, platicador, te cae bien todo el mundo — y tienes años perfeccionando el arte de que los vendedores se vayan contentos y sin venderte nada. Tu arma no es el rechazo: es la amabilidad infinita sin compromiso. GUION: (1) Recibes de maravilla: plática, calidez, hasta café ofreces. (2) Tienes un DOLOR REAL pero MINIMIZADO — elige al azar: (pierdes clientes por faltantes pero así es esto, uno se acostumbra / dinero muerto en anaquel pero ahí luego sale / te piden una línea que no tienes pero tampoco es tanto) — lo mencionas de pasada restándole importancia, y solo reconoces su peso real si el vendedor lo excava Y te lo cuantifica con tus propios números. (3) TUS EVASIVAS ENCANTADORAS (usa 2-3): está muy bien lo que trae, déjeme pensarlo con calma / mándeme la información y yo le hablo / ahorita como que no, pero en unos meses seguro / oiga ¿y usted de dónde es? (cambias de tema con plática). (4) REGLA DE ENCENDIDO — tu curva solo sube con factores VERDADEROS: si te cuantifican la pérdida con TUS números, tu minimización se agrieta (pues sí, viéndolo en pesos sí es dinero...); si te dan urgencia real o Jones específico de tu zona, preguntas detalles concretos; si el vendedor sostiene indiferencia tranquila ante tus evasivas (dispuesto a irse, sin rogar), tu respeto sube y sueltas una evasiva menos; si AVANZA asumiendo con plan concreto, y tu curva ya subió, participas ajustando detalles. (5) Ante presión, ruego o teatro (escasez falsa): tu amabilidad se vuelve despedida — bueno, pues muchas gracias por venir, aquí tiene su casa — la salida encantadora de siempre. Tu techo: participar del plan con ajustes — nunca euforia.",
        "objective": "El vendedor enciende la curva de un amigable-que-no-compra desde cero: excava y cuantifica el dolor minimizado hasta que el cliente reconozca su peso real, aplica al menos DOS factores de impulso con verdad (pérdida cuantificada, urgencia real, Jones específico), sostiene la postura indiferente ante las evasivas encantadoras (sin rogar, sin presionar, dispuesto a retirarse bien), y remata avanzando con el poder de asumir hasta que el cliente participe de un plan concreto (acepta o ajusta producto/día/cantidad). El scope se cubre cuando el plan quedó participado — no solo escuchado."
      },
      "closing": {
        "message": "El maestro de despedir vendedores contentos... acaba de ajustar contigo el día del pedido. Encendiste una curva que llevaba años apagada — con verdad, con postura y sin una gota de ruego. El cierre te espera en el siguiente mundo. Vamos al desglose."
      }
    },
    "success_criteria": [
      {"id": "discovery.dolor_real", "weight": 0.2, "description": "Excava el dolor minimizado y lo CUANTIFICA con los números del cliente hasta que él mismo reconozca su peso real (pues sí, viéndolo en pesos...) — la grieta en la minimización es el requisito de todo lo demás."},
      {"id": "impulse.miedo_perdida", "weight": 0.175, "description": "Hace tangible la pérdida actual con datos del cliente: cuantificada, con destino, anclada en el presente."},
      {"id": "impulse.urgencia", "weight": 0.15, "description": "Al menos una razón real y verificable para decidir ahora — ruta, tiempos o ciclos reales. (Urgencia o Jones: al menos dos factores totales en la sesión.)"},
      {"id": "impulse.efecto_jones", "weight": 0.15, "description": "Prueba social específica y verificable de su zona si la usa — nombre, seña, resultado. Nunca el vago todos lo llevan."},
      {"id": "impulse.indiferencia", "weight": 0.175, "description": "Postura sostenida ante las evasivas encantadoras: no ruega, no presiona, no suelta concesiones no pedidas, y expresa disposición genuina de retirarse bien al menos una vez."},
      {"id": "impulse.poder_asumir", "weight": 0.15, "description": "Remata avanzando con plan concreto asumido (qué + cuándo) sin abrir puertas al no — y el cliente participa ajustando."}
    ],
    "failure_criteria": [
      {"id": "impulso_falso", "severity": "critical", "description": "Teatro en cualquier factor: escasez inventada, urgencia falsa, Jones sin nombres. El amigable te despide con su sonrisa de siempre y no vuelves a entrar."},
      {"id": "ruega", "severity": "critical", "description": "Suplica o insiste con desesperación ante las evasivas — el amigable te palmea la espalda y te despide contento."},
      {"id": "se_traga_las_evasivas", "severity": "major", "description": "Acepta las evasivas encantadoras como si fueran acuerdos (ok, le mando la información y me avisa) sin trabajar la curva — se va contento y sin nada, como todos los anteriores."},
      {"id": "presion_directa", "severity": "major", "description": "Empuje frontal ante la pasividad: la amabilidad del cliente se vuelve despedida."},
      {"id": "abre_puerta_al_no", "severity": "major", "description": "Remata con ¿le interesaría? y el cliente usa la puerta con su encanto habitual."},
      {"id": "perdida_generica", "severity": "minor", "description": "Habla de pérdida en abstracto sin cuantificar con los números del cliente."},
      {"id": "monologo", "severity": "minor", "description": "Bloques largos — con el platicador, el monólogo es rendirse al cambio de tema."}
    ],
    "limits": {
      "max_turns": 18,
      "max_duration_seconds": 420,
      "min_turns_before_evaluation": 8
    },
    "notes": "BOSS del Mundo 5 — el arquetipo amigable_no_compra d4: el más engañoso del campo porque se siente como éxito mientras te despide sin nada. El failure distintivo se_traga_las_evasivas captura su mecanismo exacto (mándeme la info y yo le hablo aceptado como logro). Integra M3 (excavar/cuantificar) + M5 completo. La minimización del dolor (así es esto, uno se acostumbra) es la capa extra sobre la mecánica de capas del M3."
  }'::jsonb
WHERE id = '5.5';

DELETE FROM public.node_quiz_questions WHERE node_id = '5.5';
DELETE FROM public.node_cards WHERE node_id = '5.5';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('5.5', 1, 'concept', 'static',
  'El sexto Boss.',
  'Este señor es el cliente favorito de todos los vendedores... que nunca le venden nada. Amable, platicador, te ofrece café — y lleva años perfeccionando el arte de despedirte contento y con las manos vacías. "Mándeme la información y yo le hablo."

Tu misión: encender una curva que lleva años apagada. Excava el dolor que él minimiza. Cuantifícaselo con SUS números. Aplica tus factores — con verdad, siempre con verdad. Sostén la postura cuando te suelte sus evasivas encantadoras. Y cuando la curva suba... asume el avance.

Ganas cuando el maestro de las despedidas esté ajustando contigo el día del pedido.',
  NULL, NULL);