-- ============================================================
-- CLOSER — MUNDO 1: LA INTRODUCCION  (reconstruccion v2)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.archivo_mentalidad_nodes AS
  SELECT * FROM public.nodes WHERE world_id = 1;

CREATE TABLE IF NOT EXISTS public.archivo_mentalidad_cards AS
  SELECT c.* FROM public.node_cards c
  WHERE c.node_id IN (SELECT id FROM public.nodes WHERE world_id = 1);

CREATE TABLE IF NOT EXISTS public.archivo_mentalidad_quiz AS
  SELECT q.* FROM public.node_quiz_questions q
  WHERE q.node_id IN (SELECT id FROM public.nodes WHERE world_id = 1);


-- ════════════════════════════════════════════════════════════
-- PASO 2 — LIMPIAR: M1 viejo (mentalidad) y M0 viejo (intro)
-- ════════════════════════════════════════════════════════════

DELETE FROM public.node_quiz_questions
  WHERE node_id IN (SELECT id FROM public.nodes WHERE world_id IN (0,1));
DELETE FROM public.node_cards
  WHERE node_id IN (SELECT id FROM public.nodes WHERE world_id IN (0,1));
DELETE FROM public.node_progress
  WHERE node_id IN (SELECT id FROM public.nodes WHERE world_id IN (0,1));
UPDATE public.practice_sessions SET node_id = NULL
  WHERE node_id IN (SELECT id FROM public.nodes WHERE world_id IN (0,1));
DELETE FROM public.nodes WHERE world_id IN (0,1);


-- ════════════════════════════════════════════════════════════
-- PASO 3 — LA TABLA WORLDS
-- ════════════════════════════════════════════════════════════

UPDATE public.worlds SET
  name = 'La Introduccion',
  emotional_name = 'Los Primeros 5 Segundos',
  description = 'Aqui no vendes nada. Aqui te ganas el derecho a seguir hablando.',
  order_index = 1,
  boss_level_name = 'BOSS: La Primera Impresion',
  boss_level_description = 'Un cliente ocupado y cortante. Sin ayudas.'
WHERE id = 1;

UPDATE public.practice_sessions SET world_id = NULL WHERE world_id = 0;

DELETE FROM public.worlds WHERE id = 0;


-- ════════════════════════════════════════════════════════════
-- PASO 4 — SKILLS
-- ════════════════════════════════════════════════════════════

INSERT INTO public.skills
  (id, code, name, short_description, category, world_id_introduced,
   level_required, mastery_threshold, reinforcement_threshold,
   skill_type, decay_half_life_days, requires_audio, status)
VALUES
  ('foundation.linea_recta', 'S-053', 'La Linea Recta',
   'Entiende que una venta avanza en orden, que nada te regresa, y que cuando algo te saca de la linea tu trabajo es volver y seguir avanzando.',
   'foundation', 1, 'rookie', 80, 50, 'concepto', 365, false, 'active'),
  ('opening.ice_breaker', 'S-054', 'Ice Breaker',
   'Rompe la tension con un comentario ligero y genuino sobre la persona, el lugar o algo en comun. Baja la guardia antes de que exista una conversacion de negocio.',
   'opening', 1, 'rookie', 80, 50, 'tecnica', 180, false, 'active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  category = EXCLUDED.category,
  world_id_introduced = EXCLUDED.world_id_introduced,
  status = 'active';

UPDATE public.skills SET world_id_introduced = 1
  WHERE id IN ('opening.sce','opening.estructura_apertura','opening.personalizacion',
               'opening.arranque_sin_disculpa','mindset.gasman','mindset.regla_10_por_ciento');


-- ════════════════════════════════════════════════════════════
-- PASO 5 — NODOS
-- ════════════════════════════════════════════════════════════

INSERT INTO public.nodes
  (id, world_id, name, technique, order_index, is_boss, reps_required,
   difficulty_level, description, node_type, engine_type, boss_goal,
   field_mission, practice_script)
VALUES

-- ── 1.0 · LA LINEA RECTA ─────────────────────────────────────
('1.0', 1, 'La Linea Recta', 'linea_recta', 0, false, 1, 1,
 'Antes de aprender que decir, aprende como avanza una venta. Este es el mapa que vas a usar los siguientes seis mundos.',
 'knowledge', 'none', NULL, NULL, NULL),

-- ── 1.1 · LOS PRIMEROS SEGUNDOS ──────────────────────────────
('1.1', 1, 'Los Primeros Segundos', 'sce', 1, false, 1, 1,
 'En los primeros segundos el cliente ya decidio si quiere seguir hablando contigo. Aqui aprendes que decide eso.',
 'knowledge', 'none', NULL, NULL, NULL),

-- ── 1.2 · TU PRIMERA FRASE ───────────────────────────────────
('1.2', 1, 'Tu Primera Frase', 'estructura_apertura', 2, false, 2, 1,
 'La version del SCE que si se puede escribir: saludo, observacion y pregunta abierta.',
 'skill_drill', 'claude', NULL,
 'TU MISION: abre una conversacion con alguien que no te conoce. Tres cosas: saluda con energia, comenta algo real que veas de el o de su lugar, y termina con una pregunta que no se pueda contestar con si o no.',
 '{
   "version": "2.0.0",
   "i_do_type": "demo",
   "scope": {
     "skills_in_focus": ["opening.estructura_apertura", "opening.personalizacion"],
     "out_of_scope_behavior": "redirect"
   },
   "phases": {
     "i_do": {
       "briefing": "Mira mi apertura y cuenta tres cosas: el saludo con energia, la observacion de algo real que veo, y la pregunta abierta al final. Fijate sobre todo en la observacion — no digo algo que le diria a cualquiera, digo algo que solo aplica a EL. Esa es la parte que abre la puerta.",
       "first_message": "Buenos dias! Oiga, se ve que aqui no para el movimiento desde temprano. Que tal ha estado la semana?"
     },
     "you_do": {
       "prompt": "Eres el encargado de un negocio. Estas en tu rutina normal, ni de buenas ni de malas, disponible pero no entusiasmado. Un desconocido acaba de llegar. TU REGLA PRINCIPAL: tu apertura depende ENTERAMENTE de la calidad de la primera frase del vendedor. Si su observacion es GENERICA (buenos dias, como esta, que tal todo) respondes con cortesia minima y corta — bien, gracias — y te quedas esperando, sin ofrecer nada. Si su observacion es ESPECIFICA de ti o de tu lugar (algo que noto de verdad y que no le diria a cualquiera), respondes con gusto, comentas algo de vuelta y la conversacion arranca sola. Si te hace una pregunta CERRADA de si o no (tiene un minuto, esta ocupado, puedo pasar), contestas lo mas facil: no, ahorita no. Y ya no ofreces nada mas. NUNCA preguntas que vende ni de que se trata a menos que el vendedor haya hecho las tres cosas bien. NUNCA hables tu de productos ni de negocio: este ejercicio es solo la apertura. Responde en 1 o 2 frases, natural, como habla un comerciante real.",
       "objective": "El vendedor ejecuta una apertura completa: saludo con energia, observacion especifica de ese cliente o ese lugar, y pregunta abierta que le devuelve la palabra. El scope se cubre cuando el cliente responde con gusto y comenta algo de vuelta por su propia voluntad. Identificarse con nombre y empresa es correcto pero NO se requiere en este nodo."
     },
     "closing": {
       "message": "Eso es una apertura. Saludo con energia, observacion que solo aplica a el, y una pregunta que abre en lugar de cerrar. Con eso ya te ganaste los siguientes segundos. Vamos al detalle.",
       "message_incomplete": "Ahi lo dejamos, ya vi como abres. Vamos al desglose y te digo cual era la siguiente pieza."
     }
   },
   "success_criteria": [
     {"id": "opening.estructura_apertura", "weight": 0.5, "description": "La apertura tiene las tres piezas: saludo con energia, observacion, y pregunta abierta al final. El orden importa: la pregunta cierra la apertura y le devuelve la palabra al cliente. Sin producto, sin motivo de venta. NO se requiere que se identifique con nombre ni empresa: eso pertenece a la Historia Breve y su ausencia aqui no resta."},
     {"id": "opening.personalizacion", "weight": 0.5, "description": "La observacion es de ESA persona o ESE lugar en ESE momento: algo que no le diria a cualquiera. Un saludo generico (buen dia, como esta, que tal todo) no cumple. Tampoco cumple una observacion inventada que el cliente no confirma."}
   ],
   "failure_criteria": [
     {"id": "pregunta_cerrada", "severity": "major", "description": "Cierra la apertura con una pregunta de si o no (tiene un minuto, puedo pasar, esta ocupado). Le entrega al cliente la respuesta mas facil, que es no."},
     {"id": "observacion_generica", "severity": "major", "description": "La observacion sirve para cualquier negocio y cualquier persona. No comunica que lo esta viendo a EL."},
     {"id": "pitch_prematuro", "severity": "critical", "description": "Menciona producto, promocion o motivo de venta en la apertura. Identificarse con nombre y empresa NO es pitch: es correcto y no se penaliza."},
     {"id": "sin_pregunta", "severity": "major", "description": "Saluda y observa pero no pregunta nada. La conversacion se muere ahi porque el cliente no tiene que contestar."}
   ],
   "limits": {"max_turns": 6, "max_duration_seconds": 150, "min_turns_before_evaluation": 2},
   "notes": "v2.0.0 Mundo 1 reconstruido. R11 aplicada: la identificacion no se requiere ni se espera aqui. El espejo es la mecanica central: la respuesta del cliente es directamente proporcional a la especificidad de la observacion."
 }'::jsonb),

-- ── 1.3 · ENTRA COMO SI PERTENECIERAS ────────────────────────
('1.3', 1, 'Entra Como Si Pertenecieras', 'gasman', 3, false, 1, 1,
 'Por que pedir permiso te mata, y que hacer en lugar de eso.',
 'knowledge', 'none', NULL, NULL, NULL),

-- ── 1.4 · ENTRAR SIN DISCULPA ────────────────────────────────
('1.4', 1, 'Entrar Sin Disculpa', 'arranque_sin_disculpa', 4, false, 2, 1,
 'Ejecutar la apertura con postura, frente a alguien que te va a hacer sentir que estorbas.',
 'skill_drill', 'claude', NULL,
 'TU MISION: este cliente esta ocupado y te lo va a hacer notar. Abre igual, sin disculparte y sin pedir permiso. No eres una interrupcion.',
 '{
   "version": "2.0.0",
   "i_do_type": "demo",
   "scope": {
     "skills_in_focus": ["opening.arranque_sin_disculpa", "mindset.regla_10_por_ciento", "opening.estructura_apertura"],
     "out_of_scope_behavior": "redirect"
   },
   "phases": {
     "i_do": {
       "briefing": "Este cliente esta ocupado y me lo va a hacer sentir. Fijate en lo que NO hago: no me disculpo, no pregunto si tiene tiempo, no digo solo sera un segundito. Reconozco que esta ocupado y sigo con la misma energia, como quien tiene derecho a estar ahi.",
       "first_message": "Buenos dias! Ya veo que lo agarre en plena carga. Que bueno, eso quiere decir que hay trabajo. Como ha estado el movimiento esta semana?"
     },
     "you_do": {
       "prompt": "Eres el encargado de un negocio y estas genuinamente ocupado: atendiendo, acomodando, con cosas en la mano. No eres grosero, pero tampoco tienes tiempo que regalar y lo demuestras. TU REGLA PRINCIPAL: reaccionas a la POSTURA del vendedor, no a sus palabras. Si se disculpa, pide permiso o se minimiza (perdon que lo moleste, tiene un minutito, solo sera un segundo, disculpe la molestia), tomas el control de inmediato y lo despachas con naturalidad: ahorita ando ocupado, venga en otro momento. No es maldad, es que te dio la salida y la tomaste. Si entra con postura, reconoce que estas ocupado sin pedir permiso y mantiene su energia, le contestas de igual a igual aunque sigas trabajando: le das una respuesta breve pero real, sin despacharlo. Puedes estar distraido, contestar corto o seguir con lo tuyo mientras hablas. NUNCA preguntes que vende. Responde en 1 o 2 frases.",
       "objective": "El vendedor sostiene una apertura completa frente a un cliente ocupado, sin disculparse, sin pedir permiso y sin encogerse. El scope se cubre cuando el cliente, a pesar de estar ocupado, le contesta de igual a igual con una respuesta real en lugar de despacharlo."
     },
     "closing": {
       "message": "Eso es entrar sin disculpa. Reconociste que estaba ocupado sin convertirlo en un permiso que pedir. La diferencia entre estorbar y pertenecer no esta en las palabras: esta en la postura. Vamos al detalle.",
       "message_incomplete": "Ahi lo dejamos, ya vi con que postura entras. Vamos al desglose."
     }
   },
   "success_criteria": [
     {"id": "opening.arranque_sin_disculpa", "weight": 0.45, "description": "Cero disculpas, cero peticiones de permiso, cero minimizarse. Nada de perdon que lo moleste, tiene un minutito, solo sera un segundo, disculpe la molestia, no le quito mucho tiempo. Reconocer que el cliente esta ocupado SI es correcto y suma, siempre que no se convierta en pedir autorizacion para seguir."},
     {"id": "mindset.regla_10_por_ciento", "weight": 0.25, "description": "Sostiene la energia y la postura aunque el cliente conteste corto, siga trabajando o no le de atencion completa. No baja el volumen ni se encoge ante la indiferencia."},
     {"id": "opening.estructura_apertura", "weight": 0.3, "description": "Mantiene la estructura de apertura aprendida: saludo con energia, observacion real, pregunta abierta. La presion del cliente ocupado no debe desarmar la formula."}
   ],
   "failure_criteria": [
     {"id": "pide_permiso", "severity": "critical", "description": "Pide autorizacion para hablar o para seguir: tiene un minuto, puedo robarle un momento, me permite. Le entrega el control al cliente y la respuesta mas facil siempre es no."},
     {"id": "se_disculpa", "severity": "critical", "description": "Abre disculpandose o minimizando su presencia. Comunica que sabe que estorba, y el cliente lo trata en consecuencia."},
     {"id": "se_encoge", "severity": "major", "description": "Ante la primera senal de que el cliente esta ocupado, baja la energia, se acorta o empieza a despedirse. Se rindio antes de que lo corrieran."},
     {"id": "pitch_prematuro", "severity": "critical", "description": "Menciona producto, promocion o motivo de venta. Identificarse con nombre y empresa NO es pitch."}
   ],
   "limits": {"max_turns": 8, "max_duration_seconds": 180, "min_turns_before_evaluation": 2},
   "notes": "v2.0.0 El espejo castiga la disculpa con la consecuencia real de campo: el cliente toma el control y despacha. No hay regano, hay consecuencia."
 }'::jsonb),

-- ── 1.5 · EL ICE BREAKER ─────────────────────────────────────
('1.5', 1, 'El Ice Breaker', 'ice_breaker', 5, false, 2, 1,
 'La diferencia entre una observacion plana y una que de verdad rompe el hielo.',
 'skill_drill', 'claude', NULL,
 'TU MISION: rompe el hielo. Un comentario ligero y genuino sobre el, sobre el lugar o sobre algo que compartan. Que se sienta persona, no cliente.',
 '{
   "version": "2.0.0",
   "i_do_type": "demo",
   "scope": {
     "skills_in_focus": ["opening.ice_breaker", "opening.personalizacion"],
     "out_of_scope_behavior": "redirect"
   },
   "phases": {
     "i_do": {
       "briefing": "Las dos frases dicen lo mismo, pero solo una rompe el hielo. Se ve mucho movimiento es plana: es verdad y no pasa nada. Ya se le juntaron todos hoy, verdad? es ligera, tiene un guino, y el cliente contesta con humor. Fijate en la diferencia, porque es toda la diferencia.",
       "first_message": "Buenas! Uy, veo que hoy se le juntaron todos al mismo tiempo, verdad? Asi o mas movido. Y siempre es asi los jueves o hoy le toco?"
     },
     "you_do": {
       "prompt": "Eres una persona atendiendo su negocio. Empiezas con la guardia normal de quien ve llegar a un desconocido: cortes pero cerrado. TU REGLA PRINCIPAL: solo bajas la guardia si el vendedor dice algo LIGERO y GENUINO. Si su comentario es plano o meramente descriptivo (se ve movido, esta grande su local, hay mucha gente), contestas con un si seco o un ajam y te quedas igual de cerrado. Si su comentario tiene ligereza, humor suave o calidez real, y ademas es sobre algo verdadero de ti, de tu lugar o de algo que compartan, entonces sonries, contestas con humor de vuelta y ahi si baja la guardia: la conversacion se siente entre personas. Si el comentario suena FORZADO, ensayado, exagerado o falso (halagos desmedidos, chistes que no vienen al caso, familiaridad excesiva), te incomodas y te cierras MAS que al principio: contestas seco y cortante. NUNCA preguntes que vende. Responde en 1 o 2 frases, como habla la gente de verdad.",
       "objective": "El vendedor rompe el hielo con un comentario ligero y genuino sobre la persona, el lugar o algo en comun. El scope se cubre cuando el cliente baja la guardia de verdad: contesta con humor o calidez de vuelta y la conversacion pasa de tramite a conversacion entre personas."
     },
     "closing": {
       "message": "Eso es romper el hielo. No fue un chiste ni un halago: fue un comentario ligero sobre algo verdadero. En un segundo dejaste de ser un vendedor tocando la puerta y te volviste una persona hablando con otra. Vamos al detalle.",
       "message_incomplete": "Ahi lo dejamos, ya vi como entras. Vamos al desglose y te digo que le faltaba."
     }
   },
   "success_criteria": [
     {"id": "opening.ice_breaker", "weight": 0.6, "description": "El comentario tiene ligereza real: humor suave, un guino, calidez. No es solo descriptivo. Se distingue de una observacion plana en que invita a contestar con gusto, no solo a confirmar. Cualquier tema sirve: la persona, el lugar, el momento o algo en comun."},
     {"id": "opening.personalizacion", "weight": 0.4, "description": "El comentario es sobre algo VERDADERO y especifico. Un halago inventado, exagerado o que el cliente no puede confirmar no cumple, y ademas cuesta: se siente falso."}
   ],
   "failure_criteria": [
     {"id": "observacion_plana", "severity": "major", "description": "El comentario es correcto pero no rompe nada: describe lo obvio sin ligereza. El cliente confirma y la guardia sigue arriba."},
     {"id": "halago_falso", "severity": "major", "description": "Cumplido exagerado, inventado o que suena ensayado. Cuesta mas de lo que gana: el cliente se cierra mas que al inicio."},
     {"id": "familiaridad_excesiva", "severity": "minor", "description": "Confianza que todavia no se gano: apodos, bromas personales, tuteo forzado con alguien que no le dio pie."},
     {"id": "pitch_prematuro", "severity": "critical", "description": "Menciona producto, promocion o motivo de venta."}
   ],
   "limits": {"max_turns": 6, "max_duration_seconds": 150, "min_turns_before_evaluation": 2},
   "notes": "v2.0.0 Nodo nuevo. El espejo tiene TRES estados y esa es la ensenanza: plano no abre, genuino abre, falso cierra mas que al inicio. Doctrina universal: el ice breaker puede ser sobre la persona, el entorno o algo en comun. No esta atado a ningun tipo de negocio."
 }'::jsonb),

-- ── 1.6 · BOSS: LA PRIMERA IMPRESION ─────────────────────────
('1.6', 1, 'BOSS: La Primera Impresion', 'apertura_completa', 6, true, 1, 2,
 'Un cliente ocupado y cortante. Todo lo del mundo, sin ayudas.',
 'boss', 'claude',
 'Abrir con un cliente que no facilita nada: sostener la estructura completa de apertura, romper el hielo de verdad y mantener la postura sin pedir permiso, hasta que el cliente participe de la conversacion por su propia voluntad.',
 'TU MISION: la apertura completa, con un cliente que no te la va a poner facil. Saludo con energia, algo ligero y verdadero que rompa el hielo, y una pregunta abierta. Sin disculpas y sin pedir permiso.',
 '{
   "version": "2.0.0",
   "i_do_type": "demo",
   "scope": {
     "skills_in_focus": ["opening.estructura_apertura", "opening.personalizacion", "opening.ice_breaker", "opening.arranque_sin_disculpa", "mindset.regla_10_por_ciento"],
     "out_of_scope_behavior": "redirect"
   },
   "phases": {
     "i_do": {
       "briefing": "Este es el examen del mundo. Todo lo que practicaste por separado, junto y con un cliente que no ayuda. No hay pistas ni facilidades: si la apertura no esta completa, el cliente no se abre.",
       "first_message": "Buenos dias! Ya lo vi en friega desde que venia llegando. Se nota que aqui no se descansa, eh? Oiga, y como ha estado la semana por aca?"
     },
     "you_do": {
       "prompt": "Eres el encargado de un negocio, ocupado y de pocas palabras. No eres grosero: eres alguien que ya vio pasar a muchos vendedores y no regala tiempo. TU COMPORTAMIENTO POR DEFECTO es cortes y cerrado: contestas en tres o cuatro palabras, sin ofrecer nada, sin preguntar nada. SOLO TE ABRES SI SE GANAN: si el vendedor se disculpa, pide permiso o se minimiza, lo despachas de inmediato con un ahorita ando ocupado. Si su observacion es generica o plana, contestas con monosilabos y sigues en lo tuyo. Si te hace una pregunta cerrada, contestas no y se acabo. Si el vendedor logra las tres cosas — entra con postura sin pedir permiso, dice algo ligero y verdadero que te haga sonreir o contestar de vuelta, y cierra con una pregunta abierta — entonces si: bajas la guardia, contestas con gusto, comentas algo de tu negocio por tu cuenta y le preguntas quien es. Esa pregunta es la senal de que gano la apertura. NUNCA preguntes quien es antes de que se lo gane. NUNCA hables de productos. Responde en 1 o 2 frases.",
       "objective": "El vendedor ejecuta la apertura completa frente a un cliente que no facilita nada: entra con postura y sin pedir permiso, rompe el hielo con algo ligero y verdadero, y abre con una pregunta que le devuelve la palabra. El scope se cubre cuando el cliente baja la guardia por su propia voluntad y pregunta quien es el vendedor, que es la puerta natural al siguiente paso."
     },
     "closing": {
       "message": "Ahi esta la primera impresion completa. Entraste con postura, rompiste el hielo con algo verdadero y abriste la conversacion sin pedirle permiso a nadie. Ese cliente ya quiere saber quien eres, y eso es exactamente lo que sigue. Vamos al detalle.",
       "message_incomplete": "Hasta aqui la sesion. Ya tengo lo que necesito para tu analisis. Vamos al desglose y te digo donde estuvo la diferencia."
     }
   },
   "success_criteria": [
     {"id": "opening.estructura_apertura", "weight": 0.25, "description": "Las tres piezas presentes: saludo con energia, observacion real, pregunta abierta. Sin producto ni motivo de venta. Identificarse con nombre y empresa es correcto y no se penaliza, pero tampoco se requiere."},
     {"id": "opening.personalizacion", "weight": 0.2, "description": "La observacion es de ESE cliente y ESE momento, verificable en lo que el cliente dice o hace. Nada generico ni inventado."},
     {"id": "opening.ice_breaker", "weight": 0.2, "description": "Hay ligereza real que baja la guardia: humor suave, un guino o calidez genuina. Un comentario meramente descriptivo no cumple."},
     {"id": "opening.arranque_sin_disculpa", "weight": 0.2, "description": "Cero disculpas, cero peticiones de permiso, cero minimizarse durante TODA la sesion, incluso despues de una respuesta seca."},
     {"id": "mindset.regla_10_por_ciento", "weight": 0.15, "description": "Sostiene energia y postura frente a la sequedad del cliente. No se encoge, no baja el volumen, no empieza a despedirse."}
   ],
   "failure_criteria": [
     {"id": "pide_permiso", "severity": "critical", "description": "Pide autorizacion en cualquier momento de la sesion. En el boss este error domina el resultado: la primera impresion murio ahi."},
     {"id": "se_disculpa", "severity": "critical", "description": "Se disculpa o minimiza su presencia en cualquier momento."},
     {"id": "pitch_prematuro", "severity": "critical", "description": "Menciona producto, promocion o motivo de venta. Identificarse NO es pitch."},
     {"id": "pregunta_cerrada", "severity": "major", "description": "Cierra la apertura con una pregunta de si o no."},
     {"id": "observacion_generica", "severity": "major", "description": "Saludo o comentario que serviria para cualquier persona en cualquier lugar."},
     {"id": "se_encoge", "severity": "major", "description": "Ante la sequedad del cliente baja la energia o empieza a retirarse."}
   ],
   "limits": {"max_turns": 10, "max_duration_seconds": 240, "min_turns_before_evaluation": 3},
   "notes": "v2.0.0 BOSS del Mundo 1. Sin pista garantizada y sin ayudas (R9): el gimnasio garantiza la oportunidad, el examen no. La senal de exito es que el cliente pregunte quien es el vendedor, que es la puerta natural al Mundo 2."
 }'::jsonb);


-- ════════════════════════════════════════════════════════════
-- PASO 6 — TARJETAS
-- ════════════════════════════════════════════════════════════

INSERT INTO public.node_cards
  (node_id, card_order, card_type, card_content_type, title, body, flip_back_text, audience)
VALUES

-- ── 1.0 LA LINEA RECTA ───────────────────────────────────────
('1.0', 1, 'concept', 'static',
 'Una venta no es una platica. Tiene un orden.',
 'Dos vendedores tocan la misma puerta el mismo dia.

El primero entra y suelta lo que vende. El cliente escucha veinte segundos, dice que ahorita no, y se acabo.

El segundo entra, saluda, comenta algo, pregunta. Cinco minutos despues el cliente le esta contando como va su negocio. Quince minutos despues compra.

Mismo producto. Mismo precio. Misma persona atendiendo. Lo unico distinto fue el ORDEN.',
 NULL, NULL),

('1.0', 2, 'concept', 'static',
 'Los 6 pasos',
 'Toda venta recorre los mismos seis pasos, siempre en este orden:

1. INTRODUCCION — te ganas el derecho a seguir hablando
2. HISTORIA BREVE — quien eres y por que estas ahi
3. DESCUBRIMIENTO — que necesita de verdad
4. PRESENTACION — como lo que tienes resuelve eso
5. CIERRE — le pides la decision
6. CONSOLIDACION — proteges lo que acabas de lograr

Cada uno es un mundo completo de este mapa. Por ahora solo necesitas saber que existen y en que orden van.',
 NULL, NULL),

('1.0', 3, 'concept', 'static',
 'Se avanza en linea recta',
 'Imagina una linea que se dibuja de izquierda a derecha. Empiezas en el paso 1 y avanzas.

Cada paso se apoya en el anterior. No puedes descubrir que necesita alguien que todavia no sabe quien eres. No puedes presentarle algo a alguien cuya necesidad no conoces. No puedes cerrarle a alguien al que no le presentaste nada.

Saltarte un paso es construir sobre nada. Y se cae.',
 NULL, NULL),

('1.0', 4, 'concept', 'static',
 'Nada te regresa',
 'Vas dibujando la linea hacia la derecha y de pronto algo te detiene.

En ese momento dejas de avanzar y la linea sube: te saliste. Pero fijate bien en lo que NO pasa — la linea no regresa. Lo que ya recorriste, ya quedo. Nunca vuelves a empezar de cero.

Solo estas en pausa. Y la pausa dura lo que tu decidas que dure.',
 NULL, NULL),

('1.0', 5, 'concept', 'static',
 'Cuando algo te saca, regresas',
 'A veces va a ser el cliente el que te detenga. A veces vas a salirte tu, a proposito, porque conviene.

Vas a aprender exactamente que son esas cosas y como manejar cada una. Cada mundo te va a dar las herramientas para las que aparecen ahi.

Por ahora quedate con la regla, porque no cambia nunca: sales, resuelves, REGRESAS al punto donde estabas, y sigues avanzando.',
 NULL, NULL),

('1.0', 6, 'why_it_works', 'static',
 'Tu pregunta cuando algo salga mal',
 'Todos los vendedores tienen visitas que se caen. La diferencia esta en que se preguntan despues.

El vendedor promedio se pregunta que se le olvido decir. Y como no tiene un orden en la cabeza, la respuesta siempre es la misma: no se, supongo que no era mi dia.

Tu vas a tener otra pregunta: en que punto de la linea sali, y por que no regrese.

Esa pregunta si tiene respuesta. Y una respuesta se puede corregir manana.',
 NULL, NULL),

-- ── 1.1 LOS PRIMEROS SEGUNDOS ────────────────────────────────
('1.1', 1, 'concept', 'static',
 'Ya te juzgaron antes de que hables',
 'Entras a un lugar. La persona que atiende voltea y te ve.

En ese instante, antes de que digas una sola palabra, ya decidio algo: si eres cliente, si eres conocido, o si eres alguien que le va a quitar el tiempo.

Todavia no abres la boca y la conversacion ya empezo.',
 NULL, NULL),

('1.1', 2, 'concept', 'static',
 'Lo primero que todos quieren aprender es a cerrar',
 'Y es el error mas comun.

Cerrar es el paso 5. Si los primeros diez segundos se sienten a vendedor, nunca vas a llegar al paso 5, porque no va a haber conversacion que cerrar.

Los primeros segundos no venden nada. Solo hacen una cosa, y es suficiente: te compran el derecho a seguir hablando.',
 NULL, NULL),

('1.1', 3, 'concept', 'static',
 'Los SEE factors — en espanol, SCE',
 'Tres cosas deciden esos primeros segundos:

S — SMILE / Sonrisa
E — EYE CONTACT / Contacto visual
E — ENTHUSIASM / Entusiasmo

En espanol lo decimos SCE: Sonrisa, Contacto visual, Entusiasmo. Es lo mismo.

Tres cosas. Ni una mas. Vamos una por una.',
 NULL, NULL),

('1.1', 4, 'concept', 'static',
 'S — Sonrisa',
 'Es el signo internacional de amistad. Funciona igual en cualquier pais, en cualquier idioma y con cualquier persona.

Lo que hace: elimina el miedo. Nadie se pone a la defensiva con alguien que llega sonriendo, porque una sonrisa dice sin palabras que no vienes a pelear.

Y tiene que ser genuina. La sonrisa falsa se nota mas que ninguna otra cosa.',
 NULL, NULL),

('1.1', 5, 'concept', 'static',
 'E — Contacto visual',
 'Mirar a la persona a los ojos. No al piso, no al celular, no al producto del anaquel.

Lo que hace: genera confianza y te da el control de la conversacion. El que mira a los ojos se ve seguro; el que esquiva la mirada se ve como alguien que esconde algo.

Es la parte mas facil de la doctrina y la que mas se olvida cuando hay nervios.',
 NULL, NULL),

('1.1', 6, 'concept', 'static',
 'E — Entusiasmo',
 'Energia real de estar ahi.

Lo que hace: es contagioso, y funciona por deduccion. Si tu suenas emocionado con lo que traes, la otra persona asume que hablas de algo emocionante. Todavia no sabe que es, y ya le interesa mas.

Al reves tambien funciona: si tu suenas aburrido de tu propio producto, nadie va a estar mas emocionado que tu.',
 NULL, NULL),

('1.1', 7, 'why_it_works', 'static',
 'La sonrisa se oye',
 'Aqui va un secreto de los grandes: el SCE tambien vive en tus PALABRAS.

Una persona que sonrie elige palabras distintas. Prueba a decir buenos dias sonriendo y sin sonreir. Es la misma frase y no suena igual.

En Closer entrenas ese reflejo verbal: como suena tu energia en lo que dices. Es la parte del SCE que si podemos practicar aqui.',
 NULL, NULL),

('1.1', 8, 'concept', 'static',
 'Esto se practica en persona',
 'Seamos claros: Closer no puede ver tu sonrisa, no puede saber si miraste a los ojos, y no puede medir tu energia real.

Te lo ensena, te pide que lo hagas, y confia en que lo haces. Nunca te va a calificar por eso, porque calificar lo que no se puede ver seria inventar.

Esa parte la afinas en cada visita real, y tu entrenador te la corrige en persona. Lo que si vamos a entrenar aqui, a fondo, es todo lo que sale por tus palabras.',
 NULL, NULL),

-- ── 1.3 GASMAN ──────────────────────────────────────────────
('1.3', 1, 'concept', 'static',
 'El gasista de Londres',
 'Un hombre tenia que entrar a cientos de casas al mes a leer el medidor del gas.

No tocaba pidiendo permiso. No preguntaba si era buen momento. Llegaba, saludaba, decia a que iba, y pasaba.

Nadie lo detenia nunca. Y no era porque tuviera un permiso especial ni un uniforme magico. Era porque se comportaba exactamente como alguien que tiene derecho a estar ahi.

A eso le llamamos la teoria del Gasman.',
 NULL, NULL),

('1.3', 2, 'concept', 'static',
 'El permiso que pides es el permiso que te niegan',
 'Cuando preguntas tiene un minutito?, estas haciendo dos cosas al mismo tiempo.

Le entregas el control de la conversacion. Y le das a elegir entre dos opciones, donde la mas facil, la que no le cuesta nada y lo deja tranquilo, es decir que no.

Nadie te esta siendo grosero cuando contesta ahorita no. Le ofreciste esa salida y la tomo. Cualquiera lo haria.',
 NULL, NULL),

('1.3', 3, 'concept', 'static',
 'La autoridad no se pide. Se asume.',
 'No se trata de ser prepotente ni de pasarte de listo. Se trata de una decision que tomas antes de entrar: yo pertenezco aqui.

El que pertenece saluda, no pide permiso. Comenta, no se disculpa. Pregunta, no suplica.

Y la diferencia se nota en el primer segundo, aunque las palabras sean casi iguales.',
 NULL, NULL),

('1.3', 4, 'why_it_works', 'static',
 'Solo el 10% es lo que dices',
 'De todo lo que comunicas en esos primeros segundos, apenas una decima parte son tus palabras.

El resto es como las dices y como te paras: tu postura, tu ritmo, tu volumen, si te ves comodo o incomodo.

Por eso la frase perfecta dicha con inseguridad no funciona, y una frase sencilla dicha con postura si. No estas aprendiendo un guion. Estas aprendiendo a llegar de otra manera.',
 NULL, NULL);


-- ════════════════════════════════════════════════════════════
-- PASO 7 — QUIZZES
-- ════════════════════════════════════════════════════════════

INSERT INTO public.node_quiz_questions
  (node_id, question_order, question_text, option_a, option_b, option_c, option_d,
   correct_option, explanation_correct, explanation_wrong)
VALUES

-- ── 1.0 ──────────────────────────────────────────────────────
('1.0', 1,
 'Un vendedor llega, saluda, y de inmediato le explica al cliente el producto que trae. Que paso se salto?',
 'Ninguno, ir al grano ahorra tiempo.',
 'Se salto la historia breve y el descubrimiento: presento sin que el cliente supiera quien era ni que necesitaba.',
 'Se salto el cierre.',
 NULL, 'B',
 'Exacto. Presentar es el paso 4. Llegar ahi sin haber pasado por los pasos 2 y 3 es construir sobre nada: el cliente no sabe con quien habla y tu no sabes que necesita. Por eso esa presentacion no se sostiene.',
 'Ir al grano se siente eficiente y es lo contrario. La presentacion es el paso 4 y solo funciona si antes el cliente supo quien eres (paso 2) y tu supiste que necesita (paso 3). Sin eso, le estas hablando de algo que no pidio.'),

('1.0', 2,
 'Vas avanzando bien en la conversacion y el cliente te interrumpe con algo que te detiene. Que le pasa a tu linea?',
 'Se borra: hay que empezar la conversacion desde el principio.',
 'Se pausa: sales de la linea, resuelves, y regresas al punto donde estabas.',
 'Se acaba: si te detuvieron, esa venta ya no va.',
 NULL, 'B',
 'Asi es. Lo que ya recorriste no se borra. Sales, resuelves, y vuelves exactamente al punto donde ibas. La pausa dura lo que tu decidas que dure.',
 'Ninguna de las dos. Lo que ya recorriste ya quedo: el cliente no olvida quien eres ni lo que ya platicaron. No se borra ni se acaba, solo se pausa. Tu trabajo es regresar a la linea y seguir avanzando.'),

('1.0', 3,
 'Se te cayo una visita y quieres entender por que. Cual es la pregunta util?',
 'Que se me olvido decir?',
 'En que punto de la linea sali, y por que no regrese?',
 'Sera que no era mi dia?',
 NULL, 'B',
 'Esa pregunta si tiene respuesta, y una respuesta se puede corregir manana. Las otras dos terminan en encogerse de hombros.',
 'Esas dos preguntas no llevan a ningun lado: una te deja repasando frases sueltas y la otra le echa la culpa a la suerte. Con la linea en la cabeza puedes ubicar el punto exacto donde se salio la conversacion, y eso si se corrige.'),

-- ── 1.1 ──────────────────────────────────────────────────────
('1.1', 1,
 'Que hacen los primeros diez segundos de una conversacion de venta?',
 'Deciden si te va a comprar.',
 'Te ganan el derecho a seguir hablando.',
 'Definen el precio que vas a poder cobrar.',
 NULL, 'B',
 'Correcto. En diez segundos nadie decide una compra. Lo que si decide es si vale la pena seguir escuchandote, y sin eso no hay nada mas.',
 'La compra se decide mucho despues, en el paso 5. Lo unico que hacen los primeros segundos, y es suficiente, es ganarte el derecho a seguir hablando. Si eso se pierde, ya no importa que tan bueno sea lo que traias.'),

('1.1', 2,
 'Que significan las tres letras de SCE?',
 'Saludo, Cortesia, Empatia.',
 'Sonrisa, Contacto visual, Entusiasmo.',
 'Seguridad, Confianza, Energia.',
 NULL, 'B',
 'Sonrisa, Contacto visual y Entusiasmo. En ingles son los SEE factors: Smile, Eye contact, Enthusiasm. Tres cosas, ni una mas.',
 'Son Sonrisa, Contacto visual y Entusiasmo. Vienen de los SEE factors en ingles: Smile, Eye contact, Enthusiasm. Vale la pena memorizarlas asi, porque son las tres cosas que deciden los primeros segundos.'),

('1.1', 3,
 'Por que Closer no te va a calificar tu sonrisa ni tu contacto visual?',
 'Porque no son importantes.',
 'Porque no puede verlos ni oirlos, y calificar lo que no se puede observar seria inventar.',
 'Porque solo importan en las ventas por telefono.',
 NULL, 'B',
 'Asi es. Son parte fundamental de la doctrina y se practican en cada visita real. Pero Closer solo evalua lo que de verdad puede observar en tus palabras. Lo demas te lo ensena y confia en ti.',
 'Al contrario, son fundamentales, y por eso se ensenan. Lo que pasa es que Closer no puede verte ni oirte, y una calificacion inventada no te sirve de nada. Esa parte la afinas en campo con tu entrenador.'),

-- ── 1.3 ──────────────────────────────────────────────────────
('1.3', 1,
 'Por que falla preguntar tiene un minutito? aunque suene educado?',
 'Porque es demasiado informal.',
 'Porque le entrega el control al cliente y le ofrece una salida facil: la respuesta que no le cuesta nada es no.',
 'Porque un minuto no alcanza para nada.',
 NULL, 'B',
 'Exacto. No es un problema de educacion sino de estructura: le diste a elegir, y la opcion comoda siempre es la que no lo compromete. El cliente no esta siendo grosero, esta tomando la salida que tu le abriste.',
 'El problema no es el tono ni la duracion. Es que esa pregunta le entrega el control y le abre una salida que no le cuesta nada tomar. Cualquiera contestaria que no.'),

('1.3', 2,
 'Que hacia distinto el gasista de Londres?',
 'Tenia un permiso especial que le abria las puertas.',
 'Se comportaba como alguien que tiene derecho a estar ahi, y por eso nadie lo cuestionaba.',
 'Iba acompanado para que nadie lo detuviera.',
 NULL, 'B',
 'Asi es. No era el permiso ni el uniforme: era la postura. La autoridad no se pide, se asume. Y se nota en el primer segundo.',
 'No era ningun permiso ni respaldo externo. Era que actuaba como quien pertenece: llegaba, saludaba y pasaba. La gente reacciona a esa postura mucho antes de reaccionar a las palabras.'),

('1.3', 3,
 'Si solo el 10% de lo que comunicas son tus palabras, que significa eso para ti?',
 'Que las palabras no importan y puedes decir cualquier cosa.',
 'Que una frase perfecta dicha con inseguridad no funciona, y una frase sencilla dicha con postura si.',
 'Que hay que hablar mas fuerte que el cliente.',
 NULL, 'B',
 'Correcto. Por eso no estas memorizando un guion: estas aprendiendo a llegar de otra manera. La misma frase, con otra postura, produce otra conversacion.',
 'Las palabras si importan, y no se trata de subir el volumen. Se trata de que el 90% restante es como las dices y como te paras. Por eso el mismo saludo puede abrir una puerta o cerrarla.');