-- ============================================================
-- CLOSER — PARCHE 3.2 v1.2.0 (FINAL)
-- ============================================================

INSERT INTO public.skills
  (id, code, name, short_description, category, world_id_introduced,
   level_required, mastery_threshold, reinforcement_threshold,
   skill_type, decay_half_life_days, requires_audio, status)
VALUES
  ('discovery.pregunta_especifica', 'S-052', 'Pregunta Especifica',
   'Vence el bien automatico: en vez de pedir opiniones generales, pregunta por datos y situaciones concretas que el cliente tiene que ir a buscar en su experiencia real. Es la base sobre la que despues se monta el Efecto Jones.',
   'discovery', 3, 'rookie', 80, 50, 'tecnica', 180, false, 'active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  category = EXCLUDED.category,
  world_id_introduced = EXCLUDED.world_id_introduced,
  status = 'active';

UPDATE public.nodes SET
  field_mission = 'AVERIGUA (los hechos, territorio por territorio):
· PRODUCTO — que se le mueve mas y que marcas maneja
· SERVICIO — quien lo surte y que tal le cumple
· PRECIO — a cuanto compra su producto estrella

Y ENCUENTRA (el dolor): en alguno de esos territorios hay algo que le duele. Ojo — si preguntas en generico te va a decir "bien" de reflejo. Pregunta por algo CONCRETO. Cuando caiga el "aunque...", excava con preguntas abiertas y cierra confirmandolo con sus palabras.',
  practice_script = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(
    practice_script,
    '{version}', '"1.2.0"'::jsonb),
    '{scope,skills_in_focus}', '["discovery.preguntas_capas","discovery.pregunta_especifica","discovery.dolor_real"]'::jsonb),
    '{phases,i_do}', '{
      "briefing": "Mira como trabajo con mapa y con pala — y fijate sobre todo en QUE TIPO de pregunta hago cuando subo de capa. No pregunto que tal le va, porque a eso cualquiera contesta bien de reflejo. Pregunto por algo CONCRETO. Esa es toda la diferencia entre una puerta cerrada y una abierta.",
      "first_message": "Territorio producto, capa de hechos: Que es lo que mas se le mueve aqui? — El aceite para moto, dice. Ahora la capa 2, y aqui esta todo el truco. Lo que NO hago: preguntarle que tal le va con su proveedor, porque me contesta bien y se acabo la conversacion. Lo que SI hago, algo concreto: Y de ese aceite de moto, le ha tocado quedarse sin cuando mas se lo piden? — Ahi ya no puede contestar bien de reflejo, tiene que ir a buscar el dato real: Pues fijese que si, a veces me deja colgado el proveedor. Ahora si excavo, con abiertas: Como cuanto le dura un faltante de esos? Le ha tocado decirle que no a un cliente? — Y sale completo, con coraje de verdad. Confirmo con sus palabras: Entonces lo que mas le pega es quedarse sin surtir cuando la venta esta, cierto? — ESO es un diagnostico terminado. Y ojo: hay una version todavia mas potente de esa pregunta, que es darle permiso contandole que a otros les pasa. Eso lo vas a trabajar a fondo mas adelante — si hoy te sale natural, usala."
    }'::jsonb),
    '{phases,you_do,prompt}', '"Eres el dueno de un negocio, relajado y cooperativo (buena conversacion previa — este drill aisla el descubrimiento). REGLA CERO — CUENTA LAS PREGUNTAS DE HECHOS: lleva un conteo mental de cuantas preguntas de capa 1 (hechos: que vendes, que marcas, a como compras, cuanto llevas) te ha hecho el vendedor SIN subir a capa 2. En cuanto respondas la TERCERA, tu siguiente respuesta DEBE incluir, de pasada, un DATO DE CONTEXTO del territorio donde vive tu dolor: un hecho neutro, sin evaluarlo ni quejarte (si tu dolor es de SERVICIO, mencionas quien te surte y desde cuando; si es de PRODUCTO, mencionas una linea o marca concreta que manejas o que te piden; si es de PRECIO, mencionas cada cuanto te ajustan precios). NO es una pista y NO lleva quejas: es solo un dato que le pone el territorio al alcance. Antes de enviar cada respuesta verifica: ya van 3 o mas preguntas de hechos sin capa 2? entonces esta respuesta lleva el dato de contexto. TU DOLOR: tienes UN dolor real oculto. Elige al azar UNO de estos seis, y recuerda en que territorio vive: PRODUCTO (a: faltantes de tu producto estrella que te hacen perder ventas / b: tus clientes piden una linea que tu proveedor no maneja), SERVICIO (c: tu proveedor te deja plantado con pedidos cada quincena / d: cuando hay un problema nadie te da la cara ni te resuelve), PRECIO (e: te subieron el precio dos veces este ano y tu margen esta apretado / f: tienes dinero congelado en un anaquel que no rota). REGLA DEL BIEN AUTOMATICO — LO MAS IMPORTANTE DE TU PERSONAJE: eres un comerciante real, y los comerciantes reales NO se quejan con desconocidos por cortesia. Ante cualquier pregunta GENERICA de opinion o experiencia (que tal le va, como se porta su proveedor, todo bien por aca, que tal el servicio) respondes SIEMPRE con un bien reflejo y cortes — bien, no me quejo / todo tranquilo / ahi la llevamos bien — SIN pista, AUNQUE la pregunta toque justo el territorio de tu dolor. No estas mintiendo: asi contesta cualquiera a un desconocido que pregunta en generico. LA PISTA SE GANA CON PREGUNTA CONCRETA: solo sueltas la pista sutil de tu dolor (bien, aunque a veces...) cuando el vendedor hace una pregunta que toca el territorio de tu dolor Y cumple UNA de estas dos condiciones: (1) ESPECIFICA — nombra un dato o una situacion concreta en vez de pedir una opinion general (cuantas veces al mes le llega incompleto?, le ha tocado quedarse sin su producto estrella?, cuanto le subieron el precio este ano?); o (2) NORMALIZADA — te da permiso de admitirlo contandote que a otros les pasa (varios clientes me comentan que batallan con faltantes, a usted le pasa?). Cualquiera de las dos vale igual. Si la pregunta concreta toca un territorio SIN dolor, la niegas limpio y genuino (no, eso si no, ahi voy bien) — sin frases ambiguas tipo en-ese-aspecto, por-ahora o mas-o-menos: en territorios sanos no hay medio-dolores. SI INSISTE EN UN DOLOR QUE NEGASTE: si ya negaste algo y el vendedor sigue insistiendo en convencerte de que si te pasa, te incomodas educadamente (ya le digo que con eso no batallo) y te vuelves mas cerrado y mas corto el resto de la conversacion. CAPA 3 — SOLO si el vendedor recoge la pista y profundiza en ella con una o dos preguntas mas, revelas el dolor completo con detalle y emocion real (es que fijese que...). NUNCA reveles el dolor completo si no te lo excavan. Si intenta presentar producto, respondes con evasiva educada (ah orale, suena bien) sin soltar mas informacion."'::jsonb),
    '{phases,you_do,objective}', '"El vendedor ejecuta un descubrimiento con estructura: preguntas de hechos que recorren los territorios (producto, servicio, precio), y sube de capa con preguntas CONCRETAS — especificas o normalizadas — porque a las genericas el cliente responde bien de reflejo. Cuando cae la pista, la excava con preguntas abiertas hasta que el cliente revela el dolor completo, y remata confirmandolo en palabras propias (entonces lo que mas le pega es X, verdad?). Cambiar de territorio ante una negacion limpia es ejecucion correcta, no falla. El scope se cubre cuando el dolor real fue revelado por el cliente Y confirmado verbalmente por el vendedor."'::jsonb)
WHERE id = '3.2';

UPDATE public.nodes SET
  practice_script = jsonb_set(practice_script, '{success_criteria}', '[
    {"id": "discovery.preguntas_capas", "weight": 0.35, "description": "Progresion visible de capas con mapa: preguntas de hechos primero (que, cuanto, cuales, a como), luego subida a capa 2, y excavacion con preguntas ABIERTAS una vez que aparece la pista (en capa 3 las abiertas son lo correcto: expanden el relato). Recorre territorios (producto, servicio, precio) en lugar de agotar uno solo; cambiar de territorio ante una negacion limpia es ejecucion CORRECTA y se acredita. Cada pregunta nace de la respuesta anterior. Cualquier territorio elegido para explorar primero es valido."},
    {"id": "discovery.pregunta_especifica", "weight": 0.30, "description": "Al subir a capa 2 pregunta por algo CONCRETO — un dato o una situacion que el cliente tiene que ir a buscar en su experiencia (cuantas veces al mes, le ha tocado quedarse sin, cuanto le subieron) — en lugar de pedir una opinion general (que tal le va, como se porta su proveedor), que solo produce un bien reflejo. Si ademas normaliza el dolor citando a otros clientes, se acredita igual: es la version avanzada del mismo principio y no se exige en este nodo. Nunca se acredita plantar un dolor inventado ni insistir en uno negado."},
    {"id": "discovery.dolor_real", "weight": 0.35, "description": "Detecta la pista (el aunque, el a veces, el lo unico), la excava hasta que el cliente revela el dolor completo, Y lo confirma verbalizandolo de vuelta en sus propias palabras. Quedarse en la pista sin excavarla, o excavarla sin confirmarla, no cumple. Preguntar el dolor directo (que problemas tiene?) tampoco: el dolor se deja emerger."}
  ]'::jsonb)
WHERE id = '3.2';

UPDATE public.nodes SET
  practice_script = jsonb_set(practice_script, '{failure_criteria}', '[
    {"id": "ignora_pistas", "severity": "major", "description": "El cliente deja caer la pista del dolor (aunque a veces..., lo unico es que...) y el vendedor la pasa de largo — cambia de tema o dispara la siguiente pregunta de su lista."},
    {"id": "pregunta_generica_en_capa2", "severity": "minor", "description": "Sube de capa con preguntas genericas de opinion (que tal le va, todo bien por aca) que producen un bien reflejo, y al recibirlo se conforma y sigue de largo en lugar de reformular preguntando por algo concreto."},
    {"id": "insiste_dolor_negado", "severity": "major", "description": "El cliente niega limpio un problema y el vendedor insiste en convencerlo de que si le pasa. Preguntar concreto sirve para descubrir un dolor real; nunca para plantar uno que no existe. Ante la negacion, se le cree y se cambia de territorio."},
    {"id": "insistencia_territorio_seco", "severity": "minor", "description": "El cliente da una negacion limpia y genuina en un territorio y el vendedor sigue ahi con mas y mas preguntas en lugar de cambiar de territorio — interroga la zona sana."},
    {"id": "interrogatorio", "severity": "minor", "description": "Preguntas en rafaga sin construir sobre las respuestas — el cliente se siente en el ministerio publico, no en una conversacion."},
    {"id": "pitch_prematuro", "severity": "critical", "description": "Presenta el producto al detectar el dolor (o antes). El descubrimiento se contamina: en cuanto presentas, el cliente deja de revelar. La presentacion tiene su propio mundo."},
    {"id": "pregunta_cerrada_en_capa_profunda", "severity": "minor", "description": "Ya que el dolor asomo (capa 3), profundiza con cerradas de si/no que cortan la revelacion en lugar de abiertas que la expanden. Aplica SOLO a capa 3: en capa 2 la pregunta concreta y acotada es lo correcto."}
  ]'::jsonb)
WHERE id = '3.2';

DELETE FROM public.node_cards WHERE node_id = '3.2';

INSERT INTO public.node_cards (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience) VALUES
('3.2', 1, 'concept', 'static',
  'El dolor real nunca esta en la superficie.',
  'Preguntale a cualquier cliente "como va el negocio?" y te dira "bien, gracias a Dios."

Es cierto? Mas o menos. Todo negocio trae algo que le duele — y ya sabes donde buscarlo: en el PRODUCTO, en el SERVICIO o en el PRECIO. Pero eso no se cuenta al primer desconocido que pregunta. Se cuenta a quien se gana la respuesta... pelando capas.',
  NULL, NULL),
('3.2', 2, 'concept', 'static',
  'Las tres capas',
  'CAPA 1 — Hechos: faciles de responder, cero riesgo. "Que se le mueve mas?" "Quien lo surte?" "A como le llega?" Abren la platica y te dan el mapa de sus territorios.

CAPA 2 — La puerta al dolor: aqui el cliente puede soltar una PISTA... o cerrarte la puerta con un "bien". Todo depende de COMO preguntes.

CAPA 3 — El dolor completo: solo se abre si recoges la pista y profundizas con preguntas abiertas. Aqui te cuenta lo que de verdad le duele, con detalle y con emocion.',
  NULL, NULL),
('3.2', 3, 'concept', 'static',
  'Cuidado con el "bien" automatico.',
  '"Y que tal le va con su proveedor?" — "Bien, no me quejo."

Esa respuesta no es informacion: es un reflejo. Nadie le cuenta sus problemas a un desconocido que pregunta en generico, por dos razones: la respuesta cortes ya la trae cargada, y admitir un problema se siente como quejarse o como aceptar que eligio mal.

La pregunta generica no falla por mala suerte. Falla siempre. Y el vendedor promedio la escucha, piensa "aqui no hay nada" y se va con las manos vacias.',
  NULL, NULL),
('3.2', 4, 'concept', 'static',
  'La pregunta que no se puede contestar con "bien"',
  'La solucion es simple: cambia la opinion general por algo CONCRETO.

En vez de "que tal le va con su proveedor?" -> "le ha tocado quedarse sin su producto estrella?"
En vez de "que tal anda el precio?" -> "cuanto le subieron este ano?"
En vez de "todo bien por aca?" -> "cuantas veces al mes le llega incompleto el pedido?"

Ya no puede disparar el reflejo: tiene que ir a buscar un dato real de su negocio. Eso es todo — no es una tecnica complicada, es dejar de preguntar en general.

Mas adelante vas a aprender una version aun mas potente: darle permiso de admitirlo contandole que a otros les pasa. Por ahora, con preguntar concreto ya cambias el juego.',
  NULL, NULL),
('3.2', 5, 'why_it_works', 'static',
  'La palabra magica: "aunque..."',
  'Cuando tu pregunta abre la puerta, escucha con lupa los peros y los aunques: "bien, aunque a veces batalla uno", "sin queja, lo unico es que...".

Eso NO es relleno — es el cliente asomando el dolor para ver si te interesa. Si lo dejas pasar, la puerta se cierra y no se vuelve a abrir. Si lo recoges con una pregunta ABIERTA ("como cuanto le dura ese batallar?"), la capa 3 se abre sola.

Concreta para abrir. Abierta para excavar. Ese es el orden, y no se invierte.',
  NULL, NULL),
('3.2', 6, 'concept', 'static',
  'Y si de verdad no hay nada ahi? El barrido.',
  'A veces preguntas concreto y el cliente lo niega limpio: "no, eso si no, mi proveedor me cumple bien." Y es verdad.

Ahi el vendedor promedio hace una de dos: insiste hasta volverse pesado, o se rinde. El investigador hace la tercera: le CREE, y CAMBIA DE TERRITORIO. Servicio salio sano? Explora producto: "y hay algo que sus clientes le pidan y batalle para conseguir?" O precio: "y a como le esta llegando su estrella?"

El dolor casi siempre existe. Solo que vive en OTRA zona del mapa. Negacion limpia = siguiente territorio.',
  NULL, NULL);