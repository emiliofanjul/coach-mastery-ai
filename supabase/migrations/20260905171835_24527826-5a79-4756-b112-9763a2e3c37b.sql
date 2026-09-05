-- ============================================================
-- REGISTRO DE REGLAS + normalización de los practice_script
--
-- Antes: 391 criterios en 48 nodos, cada uno con texto y severidad
-- escritos a mano, sin liga a la doctrina. Mismo id, hasta 15 textos
-- y 3 severidades distintas.
--
-- Después: una tabla `reglas` (140 reglas, cada una con la cita
-- literal del Cerebro que la respalda). Cada criterio conserva su
-- descripción contextual —que es buena pedagogía— pero apunta a su
-- regla por `regla_id`, y su severidad se normaliza al default de la
-- regla salvo override DECLARADO con razón.
--
-- La forma del practice_script NO cambia: solo se agregan campos.
-- El evaluador sigue funcionando sin tocarlo.
--
-- Generada por código a partir de docs/kb/*_snapshot.json. Idempotente.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.reglas (
  id                  text PRIMARY KEY,
  paso                smallint NOT NULL,          -- 0 = transversal
  tipo                text NOT NULL CHECK (tipo IN ('requisito','error','herramienta','principio','premio','neutro')),
  canal               text NOT NULL CHECK (canal IN ('universal','presencial')),
  procedencia         text NOT NULL,              -- FUENTE / CAMPO / CLOSER
  resumen             text NOT NULL,
  cita_cerebro        text NOT NULL,              -- literal; el chequeo verifica que exista
  severidad_default   text CHECK (severidad_default IN ('minor','major','critical')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.reglas IS 'Registro canónico de reglas de doctrina. Fuente: el Cerebro (tabla doctrina). Ninguna regla existe sin cita literal.';

ALTER TABLE public.reglas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS reglas_lectura ON public.reglas;
CREATE POLICY reglas_lectura ON public.reglas FOR SELECT USING (true);

-- ── Semilla del registro ──────────────────────────────────────
INSERT INTO public.reglas (id, paso, tipo, canal, procedencia, resumen, cita_cerebro, severidad_default) VALUES
  ('opening.see', 1, 'herramienta', 'presencial', 'FUENTE', 'Sonrisa, Contacto visual, Entusiasmo. Se enseña y se pide; no se califica en texto.', 'signo internacional de amistad. Elimina el miedo y crea confianza', NULL),
  ('opening.energia_verbal', 1, 'requisito', 'universal', 'FUENTE', 'El equivalente evaluable del SEE: la energía que sale por las palabras.', 'Lo que sí se evalúa es su equivalente verbal: la energía que sale por las palabras', 'major'),
  ('opening.regla_10', 1, 'herramienta', 'presencial', 'FUENTE', 'Calibrar la propia energía 10% por encima de la del cliente. Es tono, no palabras.', 'Lee el nivel de emoción del cliente y ponte 10% por encima de él. No al doble: 10%', NULL),
  ('opening.ice_breaker', 1, 'requisito', 'universal', 'FUENTE', 'Cumplido genuino, chiste sencillo o comentario ligero sobre la persona, el lugar o algo en común. Entregarlo como pregunta es la forma que permite al cliente responder y relajarse.', 'Cumplido genuino, chiste sencillo o comentario ligero. Puede ser sobre la persona, el lugar, o algo en común', NULL),
  ('opening.halago_falso', 1, 'error', 'universal', 'FUENTE', 'Halago exagerado o inventado. El cliente lo detecta y se cierra más que antes.', 'El halago exagerado o inventado. El cliente lo lee al instante y se cierra más que antes', 'major'),
  ('opening.gasman', 1, 'requisito', 'universal', 'FUENTE', 'Entrar asumido y confiado, con la autoridad de quien debe estar ahí.', 'La autoridad no se pide. Se asume', NULL),
  ('opening.pide_permiso', 1, 'error', 'universal', 'FUENTE', 'Pedir autorización para hablar. Entrega el control y ofrece una salida gratis.', 'Cuando preguntas «¿tiene un minutito?» haces dos cosas a la vez — le entregas el control, y le ofreces una salida que no le cuesta nada tomar', 'critical'),
  ('opening.identificacion', 1, 'neutro', 'universal', 'CAMPO', 'Decir nombre y empresa está permitido pero nunca se requiere. Su ausencia jamás se penaliza.', 'La identificación (nombre y empresa) es permitida pero nunca requerida aquí. Su ausencia jamás se penaliza', NULL),
  ('opening.curiosidad_abierta', 1, 'premio', 'universal', 'CAMPO', 'Abrir sin identificarse deja al cliente con la pregunta. Que él pregunte quién eres es ganar la introducción.', 'Si el cliente pregunta «¿y usted quién es?», ganaste la introducción — esa pregunta es la puerta natural al Paso 2', NULL),
  ('opening.identificacion_prematura', 1, 'error', 'universal', 'CAMPO', 'Abrir identificándose ANTES de conectar. El orden es el problema, no el dato: identificarse después del ice breaker ya es Paso 2.', 'Aquí no dices quién eres ni a qué vienes. Eso es el Paso 2', 'minor'),
  ('opening.pitch_prematuro', 1, 'error', 'universal', 'FUENTE', 'Decir a qué vienes, mencionar producto, promoción o motivo de venta en la apertura.', 'Aquí no dices quién eres ni a qué vienes. Eso es el Paso 2. Confundirlos es el error doctrinal más común', 'critical'),
  ('story.quien_eres_por_que', 2, 'requisito', 'universal', 'FUENTE', 'Decir quién eres, qué estás haciendo y por qué necesitas su tiempo.', 'Quién eres, qué estás haciendo, por qué necesitas su tiempo. Lo más conciso posible', NULL),
  ('story.kiss', 2, 'requisito', 'universal', 'FUENTE', 'Keep It Short and Simple. Lo más conciso posible.', 'Quién eres, qué estás haciendo, por qué necesitas su tiempo. Lo más conciso posible', NULL),
  ('story.kill', 2, 'error', 'universal', 'FUENTE', 'Alargarse. Cada frase de más gasta la atención recién ganada y suena a discurso.', 'Cada frase de más gasta la atención que acabas de ganar. Lo que suena impresionante en tu cabeza suena a discurso en la de él', 'major'),
  ('story.pregunta_despues', 2, 'requisito', 'universal', 'FUENTE', 'Después de la historia, preguntas. La historia existe para ganarte el derecho de preguntarle a él.', 'Existe para ganarte el derecho de preguntarle a él', NULL),
  ('story.cierra_con_afirmacion', 2, 'error', 'universal', 'FUENTE', 'Terminar la historia sin pregunta deja al cliente sin qué contestar y le devuelve el control.', 'en la mayoría de los casos es más efectivo pasar directamente a las preguntas de calificación que dar una larga explicación', 'major'),
  ('relationship.cpr', 0, 'herramienta', 'universal', 'FUENTE', 'Create Personal Relations. Transversal a toda la conversación. Decide si tus argumentos pesan o se descuentan.', 'Se aplica durante TODA la conversación, no en un paso', NULL),
  ('relationship.forms', 0, 'herramienta', 'universal', 'FUENTE', 'Family, Occupation, Recreation, Motivation, Sports. Los cinco caminos a la persona.', 'Los cinco caminos a la persona. Más cumplidos genuinos y chistes sencillos', NULL),
  ('relationship.interes_fingido', 0, 'error', 'universal', 'FUENTE', 'Interés fingido. Cuesta más que no haber preguntado, porque el cliente sabe que le aplicaron una técnica.', 'Un interés fingido se nota, y cuesta más que no haber preguntado', 'major'),
  ('story.desvio_con_regreso', 0, 'herramienta', 'universal', 'CAMPO', 'Salir de la línea uno o dos intercambios y regresar. El cliente nunca te regresa.', 'El cliente NUNCA te va a regresar a la línea', NULL),
  ('story.nunca_sale', 0, 'error', 'universal', 'CAMPO', 'No salir nunca de la línea: sin relación, el Paso 3 recibe respuestas de cortesía.', 'Nunca salir → no hay relación, y no te van a contestar nada en el Paso 3', 'minor'),
  ('story.sale_sin_regresar', 0, 'error', 'universal', 'CAMPO', 'Salir a lo personal y no regresar. La venta se estanca en plática cómoda.', 'Salir y no regresar → el cliente se acomoda a platicar y la venta se estanca', 'major'),
  ('blocks.bloqueo_vs_objecion', 0, 'principio', 'universal', 'FUENTE', 'El bloqueo es reflejo y llega antes de entender; la objeción es razonada y llega después.', 'La misma frase se maneja de dos maneras opuestas según cuándo llegó', NULL),
  ('blocks.discute_bloqueo', 0, 'error', 'universal', 'FUENTE', 'Discutir un bloqueo lo convierte en posición y le crea al cliente un no que no tenía.', 'Le acabas de crear un «no» real que no tenía', 'critical'),
  ('blocks.air', 0, 'herramienta', 'universal', 'FUENTE', 'Agree, Ignore, Resume. Para bloqueos al inicio.', 'reconoce con «entiendo» o «por supuesto», no lo discutas, y continúa', NULL),
  ('blocks.air_sin_resume', 0, 'error', 'universal', 'FUENTE', 'Aceptar e ignorar bien pero no retomar: quedarse esperando o volver a pedir permiso.', 'El tercer movimiento es el que falla', 'major'),
  ('blocks.ataque_preventivo', 0, 'herramienta', 'universal', 'FUENTE', 'Dar el negativo conocido del territorio antes que el cliente.', 'si das la negativa antes de que el cliente lo haga, ya no es una negativa', 'major'),
  ('blocks.ataque_en_disculpa', 0, 'error', 'universal', 'FUENTE', 'Ataque preventivo en tono de disculpa: se vuelve defenderse de algo que nadie reclamó.', 'En tono de disculpa → deja de ser adelantarse y se vuelve defenderse de algo que nadie reclamó', 'major'),
  ('blocks.negativo_inventado', 0, 'error', 'universal', 'FUENTE', 'Adelantar un negativo que no existe: planta una preocupación nueva.', 'Con un negativo inventado → no desactivas nada, plantas una preocupación nueva', 'major'),
  ('close_with_action', 0, 'herramienta', 'universal', 'FUENTE+CAMPO', 'Pregunta o acción cuya respuesta solo tiene sentido si el cliente avanza. Se ejecuta en cada tramo de la línea.', 'Una pregunta o acción cuya respuesta solo tiene sentido si el cliente está avanzando. Su respuesta es el sí', NULL),
  ('close.devuelve_el_volante', 0, 'error', 'universal', 'CAMPO', 'Quedarse callado esperando permiso después de resolver algo. El cliente retoma el control.', 'No te está rechazando: le devolviste el volante', 'major'),
  ('discovery.examen_antes_receta', 3, 'principio', 'universal', 'CAMPO', 'Primero el examen, luego la receta. Diagnosticar antes de recetar.', 'Primero el examen, luego la receta', NULL),
  ('discovery.rrr', 3, 'herramienta', 'universal', 'FUENTE', 'Read, Relate, Relax. Leer ambiente, demografía y estado de ánimo, y adaptarse primero.', 'Tú te adaptas primero', 'major'),
  ('discovery.tres_territorios', 3, 'principio', 'universal', 'CLOSER', 'Todo dolor comercial vive en PRODUCTO, SERVICIO o PRECIO.', 'PRODUCTO — lo que vende o usa; SERVICIO — cómo lo trata su proveedor actual; PRECIO — lo que paga y lo que gana', NULL),
  ('discovery.opinion_de_precio', 3, 'error', 'universal', 'CAMPO', 'Pedirle al cliente su opinión o aprobación sobre precios. Crea una objeción que no existía y cede la autoridad.', 'NUNCA le pidas al cliente su opinión ni su aprobación sobre precios', 'critical'),
  ('discovery.precio_por_hechos', 3, 'requisito', 'universal', 'CAMPO', 'El territorio precio se investiga con hechos: a cómo compra, cada cuánto le suben, qué plazo, cuánto margen.', 'Lo que sí se investiga en este territorio son HECHOS, no opiniones', NULL),
  ('discovery.escalera_capas', 3, 'principio', 'universal', 'CLOSER', 'Capa 1 hechos, capa 2 la puerta, capa 3 el dolor. Solo se abre si recoges la pista.', 'CAPA 3 — El dolor. Solo se abre si recoges la pista y profundizas con preguntas abiertas', 'major'),
  ('discovery.pregunta_especifica', 3, 'herramienta', 'universal', 'CAMPO', 'Nombrar un dato o situación concreta que el cliente tenga que ir a buscar, en vez de preguntar al aire.', 'El «bien» no es información: es un reflejo social', 'minor'),
  ('discovery.pregunta_normalizada', 3, 'herramienta', 'universal', 'CAMPO', 'Dar permiso citando a otros. Es el Efecto Jones aplicado a descubrimiento.', 'Varios clientes me comentan que batallan con faltantes, ¿a usted le pasa?', NULL),
  ('discovery.suggestive_language', 0, 'herramienta', 'universal', 'FUENTE', 'Después de preguntar, sugerir tres o cuatro opciones reales del giro. Transversal: sirve después de cualquier pregunta.', 'La solución: después de preguntar, sugiere opciones', NULL),
  ('discovery.opciones_ajenas', 0, 'error', 'universal', 'FUENTE', 'Sugerir opciones que no son del giro del cliente: demuestra lo contrario de conocer su negocio.', 'Si sugieres familias que él no maneja, demuestras lo contrario de lo que buscabas', 'major'),
  ('discovery.planta_respuesta', 0, 'error', 'universal', 'FUENTE', 'Insistir en la propia opción cuando el cliente corrige. Su corrección es la respuesta buena.', 'Si el cliente te corrige, esa es la respuesta buena — no insistas en la tuya', 'major'),
  ('discovery.barrido', 3, 'herramienta', 'universal', 'CLOSER', 'Territorio limpio: ni insistir ni rendirse, cambiar de territorio.', 'Insistir en zona sana te vuelve interrogador; rendirte regala la visita', 'minor'),
  ('discovery.dolor_directo', 3, 'error', 'universal', 'CLOSER', 'Preguntar el dolor de frente. «¿Qué problemas tiene?» produce «ninguno», garantizado.', 'El dolor nunca se pregunta directo', 'major'),
  ('discovery.confirmacion_con_sus_palabras', 3, 'requisito', 'universal', 'CLOSER', 'Cuando el dolor aparece, devolvérselo con SUS palabras.', 'devuélveselo con SUS palabras', 'major'),
  ('discovery.confirmacion_no_requerida', 3, 'neutro', 'universal', 'CAMPO', 'La confirmación explícita del dolor no es requisito para avanzar. Basta evidencia suficiente.', 'Lo que no necesitas es su permiso verbal', NULL),
  ('discovery.fabrica_dolor', 3, 'error', 'universal', 'CAMPO', 'Afirmar un problema que el cliente ya negó o del que no hay indicio. Leer un dolor probable no es inventarlo.', 'Fabricar es afirmar un problema que el cliente ya negó o del que no hay ningún indicio', 'critical'),
  ('discovery.pelea_reconocimiento', 3, 'error', 'universal', 'CAMPO', 'Insistir en que el cliente admita el problema. Lo pone a la defensiva y mata lo emocional.', 'Insistir en que el cliente admita un problema lo pone a la defensiva y mata lo emocional, que era donde estaba la venta', 'major'),
  ('discovery.luz_verde', 3, 'principio', 'universal', 'FUENTE', '10% negativos, 80% indiferentes, 10% positivos. Salir rápido de los rojos.', '10% negativos · 80% indiferentes · 10% positivos', NULL),
  ('discovery.rojo_vs_amarrado', 3, 'principio', 'universal', 'CAMPO', 'El que quiere y no puede no es rojo: es verde amarrado. Se distinguen por el trato.', 'Este no es rojo: es verde amarrado', NULL),
  ('discovery.bordes_restriccion', 3, 'herramienta', 'universal', 'CAMPO', 'Casi toda restricción tiene bordes: qué cubre, qué queda fuera, hasta cuándo dura.', 'Casi toda restricción tiene bordes', 'major'),
  ('discovery.presiona_compromiso', 3, 'error', 'universal', 'CAMPO', 'Insistir en lo que el cliente ya dijo que está dentro de su compromiso: es pedirle que rompa su palabra.', 'insistir en eso es pedirle que rompa su palabra — y eso quema la relación', 'critical'),
  ('discovery.qtqp', 3, 'principio', 'universal', 'FUENTE', 'Quality Time with Quality People. Cada minuto con un rojo se lo quitas a un amarillo.', 'Perder tiempo y energía con las personas equivocadas destruye tu capacidad de ser lo suficientemente urgente', 'major'),
  ('present.beneficio_no_caracteristica', 4, 'requisito', 'universal', 'CLOSER', 'Traducir toda característica a dinero, clientes o tranquilidad.', 'Nadie compra lo que algo es: compran lo que van a ganar', NULL),
  ('present.caracteristica_sin_traducir', 4, 'error', 'universal', 'CLOSER', 'Enumerar características sin traducir a beneficio. Si el cliente puede decir «¿y eso a mí de qué me sirve?», falló.', 'Si el cliente puede contestar «¿y eso a mí de qué me sirve?», la traducción falló', 'major'),
  ('present.pintar_imagenes', 4, 'herramienta', 'universal', 'FUENTE', 'Que el cliente imagine que ya lo tiene. No argumenta, hace sentir.', 'Pintar imágenes — que imaginen que ya lo tienen', 'major'),
  ('present.balas', 4, 'herramienta', 'universal', 'FUENTE', 'Hechos positivos y concretos sobre ti, el producto o el precio.', 'La persona con más balas claramente tiene el control, siempre y cuando conserve su munición', NULL),
  ('present.bala_generica', 4, 'error', 'universal', 'FUENTE', 'Afirmación que la competencia podría decir igual. No era bala, era aire.', 'si la competencia puede decir exactamente lo mismo, no era bala', 'major'),
  ('present.dosificacion_balas', 4, 'requisito', 'universal', 'FUENTE', 'Guardar balas para los pasos 4 y 5. Gastarlas al principio deja la mano vacía cuando el impulso baje.', 'no dispares todas las balas al principio', 'major'),
  ('present.dos_mitades', 4, 'principio', 'universal', 'CAMPO', 'Primera mitad: lo que vas a hacer por él, sin producto. Segunda: producto y precio.', 'lo que vas a hacer por él', 'major'),
  ('present.precio_va_aqui', 4, 'requisito', 'universal', 'CAMPO', 'El precio sí va en la presentación. Omitirlo la deja a medias.', 'El precio SÍ va en la presentación', NULL),
  ('present.skus_en_presentacion', 4, 'error', 'universal', 'CAMPO', 'Enumerar SKUs con cantidades en la presentación: es escribir el cierre en el lugar equivocado.', 'Enumerar SKUs con cantidades en la presentación es escribir el cierre en el lugar equivocado', 'major'),
  ('present.triple_desglose', 4, 'requisito', 'universal', 'FUENTE+CAMPO', 'Tres cifras bajando, cada escalón con su motivo nombrado, y el ahorro dicho en voz alta.', 'cada escalón necesita un motivo nombrado', NULL),
  ('present.escalon_sin_motivo', 4, 'error', 'universal', 'CAMPO', 'Bajar el precio sin razón nombrada: dice que el primero estaba inflado y te vuelve regateable.', 'Un precio que baja sin razón le dice al cliente que el primero estaba inflado', 'major'),
  ('present.precio_unico', 4, 'error', 'universal', 'CAMPO', 'Dar un solo precio: es un gasto sin ahorro visible que lo compense.', 'Nunca un solo precio', 'major'),
  ('impulse.curva', 0, 'principio', 'universal', 'FUENTE', 'El impulso sube y baja; se construye gradualmente para no abrumar. Se cierra en el pico.', 'hay que construirlo gradualmente para no abrumar', NULL),
  ('impulse.miedo_perdida', 0, 'herramienta', 'universal', 'FUENTE', 'Miedo a la pérdida. Pesa más que la necesidad de ganancia.', 'Miedo a la pérdida > necesidad de ganancia', NULL),
  ('impulse.urgencia', 0, 'herramienta', 'universal', 'FUENTE', 'Urgencia. Motion creates emotion, y comunica que tienes éxito.', 'motion creates emotion', NULL),
  ('impulse.avaricia', 0, 'herramienta', 'universal', 'FUENTE', 'Avaricia. Contraste entre lo que costaba y lo que cuesta.', 'normalmente $100, con la promo queda en solo $59.99', NULL),
  ('impulse.indiferencia', 0, 'herramienta', 'universal', 'FUENTE', 'Indiferencia. SW3: Some Will, Some Won''t, So What. Entusiasmo por la persona, indiferencia por la compra.', 'be excited about the person and the product, but indifferent whether they buy', 'major'),
  ('impulse.efecto_jones', 0, 'herramienta', 'universal', 'FUENTE', 'Prueba social. La gente deja que sus cercanos validen el producto por ella.', 'La gente no confía naturalmente en un desconocido incentivado a vender — pero sí deja que sus vecinos, amigos y familia validen el producto por ella', NULL),
  ('impulse.jones_vago', 0, 'error', 'universal', 'CAMPO', 'Prueba social que el vendedor no puede sostener si el cliente pregunta «¿como quiénes?».', 'tengo como 20 clientes en esta zona que...', 'critical'),
  ('impulse.tren_del_si', 0, 'herramienta', 'universal', 'FUENTE', 'El cliente debería decir que sí al menos 6 veces durante el proceso.', 'El cliente debería decir que sí al menos 6 veces durante el proceso', 'minor'),
  ('impulse.opcion_que_permite_no', 0, 'error', 'universal', 'FUENTE', 'Dejar una opción que se puede traducir en un no.', 'Elimina cualquier opción que se pueda traducir en un no', 'major'),
  ('close.asumir_venta', 5, 'requisito', 'universal', 'FUENTE', 'Si llegaste aquí, presume que tienes un comprador.', 'presume que tienes un comprador', NULL),
  ('close.mal_cierre', 5, 'error', 'universal', 'FUENTE', 'Cierres que invitan al no: ¿le gustaría comprar?, ¿está interesado?, ¿qué le parece?', 'Malos cierres — todos invitan al no', 'critical'),
  ('close.alternativa', 5, 'herramienta', 'universal', 'FUENTE', 'Alternativas donde ambas opciones sirven.', 'Buenos cierres — alternativas donde ambas opciones sirven', NULL),
  ('close.aguanta_silencio', 5, 'requisito', 'universal', 'CAMPO', 'Después de pedir la decisión, no llenar el silencio.', 'El primero que habla después de un cierre, pierde', NULL),
  ('close.llena_el_silencio', 5, 'error', 'universal', 'CAMPO', 'Retirar la pregunta, suavizarla o contestarla uno mismo.', 'El vendedor que retira la pregunta, la suaviza o la contesta él mismo, pierde', 'major'),
  ('close.fishbbod', 5, 'principio', 'universal', 'FUENTE', 'Señales de compra. En cuanto reconoces una, detienes la presentación y cierras.', 'En cuanto reconoces una, DETIENES la presentación y CIERRAS', NULL),
  ('close.sigue_presentando', 5, 'error', 'universal', 'FUENTE', 'Ver la señal de compra y seguir vendiendo. El impulso baja.', 'Señal de compra = deja de presentar y cierra. Aunque te queden balas', 'major'),
  ('objection.es_senal_de_compra', 0, 'principio', 'universal', 'FUENTE', 'El que no tiene interés no objeta: se despide.', 'Objeción = señal de compra', NULL),
  ('objection.discutir', 0, 'error', 'universal', 'FUENTE', 'Discutir con el cliente. Ganar la discusión es perder la venta.', 'Nunca discutas con un cliente. Ganar la discusión es perder la venta', 'critical'),
  ('objection.rrr', 0, 'herramienta', 'universal', 'FUENTE', 'Repeat, Reassure, Resume. Para objeciones menores y comunes.', 'repite la objeción en sus términos, para que vea que la escuchaste', 'minor'),
  ('objection.rrr_sin_resume', 0, 'error', 'universal', 'FUENTE', 'Responder bien y quedarse callado. Ahí el cliente encuentra la siguiente objeción.', 'La tercera R es la que falla', 'major'),
  ('objection.fff', 0, 'herramienta', 'universal', 'FUENTE', 'Feel, Felt, Found, más tres balas y Close With Action. No termina en la tercera F.', 'FFF no termina en la tercera F', NULL),
  ('objection.circulo_de_cierre', 0, 'requisito', 'universal', 'CAMPO', 'Atravesar la objeción, re-impulsar con una bala NUEVA, y cerrar.', 'atravesar solo detiene la caída del impulso — no lo sube', 'major'),
  ('objection.cierra_sin_bala', 0, 'error', 'universal', 'CAMPO', 'Atravesar la objeción y cerrar de inmediato, saltándose la bala nueva.', 'El error más común: atravesar la objeción y cerrar de inmediato, saltándose la bala', 'major'),
  ('objection.bala_repetida', 0, 'error', 'universal', 'CAMPO', 'Re-impulsar con un argumento ya usado: comunica que ya no tienes más.', 'Repetir un argumento ya usado no sube nada', 'major'),
  ('objection.regla_de_los_no', 0, 'principio', 'universal', 'CAMPO', 'Tres no CONSECUTIVOS y sigues adelante. La racha se rompe si la conversación avanza.', 'Tienen que ser CONSECUTIVOS', NULL),
  ('consolidation.rehash', 6, 'herramienta', 'universal', 'FUENTE', 'Remember Everyone Has Another Sale Hidden. Capitalizar a un cliente ya positivo.', 'la gente compra de sus amigos mucho más fácil que de un desconocido', NULL),
  ('consolidation.arrepentimiento', 6, 'principio', 'universal', 'FUENTE', 'Apenas dice que sí, el impulso cae. Es automático y no es desconfianza.', 'Apenas dice que sí, el impulso cae', NULL),
  ('consolidation.sigue_vendiendo', 6, 'error', 'universal', 'CAMPO', 'Reforzar la compra después del sí. Le dice al cliente que necesitabas la venta, y toda la conversación se vuelve técnica retroactivamente.', 'Retroactivamente, toda la conversación se convierte en una técnica', 'critical'),
  ('consolidation.misma_actitud', 6, 'requisito', 'universal', 'CAMPO', 'Demostrar que nada cambió: misma indiferencia sobre la compra, misma calidez sobre la relación, cero producto.', 'Misma indiferencia sobre la compra. Misma calidez sobre la relación. Cero producto', NULL),
  ('consolidation.siguientes_pasos', 6, 'requisito', 'universal', 'FUENTE', 'Dejar claro qué sigue. La falta de entendimiento es la causa número uno de cancelaciones.', 'la causa número uno de cancelaciones es la falta de entendimiento', 'major'),
  ('monologo', 0, 'error', 'universal', 'FUENTE', 'Turnos largos que no dejan entrar al cliente. En cualquier paso.', 'de los discursos uno se defiende', 'minor'),
  ('story.kill_curriculum', 2, 'error', 'universal', 'FUENTE', 'Historia breve inflada con credenciales, años, catálogo.', 'Lo que suena impresionante en tu cabeza suena a discurso en la de él', 'major'),
  ('adapt.recurrente_sin_nombre', 2, 'requisito', 'universal', 'CAMPO', 'Con cliente que ya te conoce, la historia breve NO repite nombre ni empresa: solo el porqué de hoy.', 'con un cliente que ya te conoce, la Historia Breve NO incluye tu nombre ni el de tu empresa', NULL),
  ('adapt.omite_lo_resuelto', 0, 'requisito', 'universal', 'CAMPO', 'Si algo del objetivo del paso ya está resuelto con este cliente, no aparece en el texto.', 'Si concluiste que algo ya está resuelto, ese algo no aparece en el texto', NULL),
  ('adapt.observacion_de_primera_visita', 1, 'error', 'universal', 'CAMPO', 'Con un recurrente, observar como si fuera la primera vez comunica que no lo tienes presente.', 'Preguntarlo le comunica al cliente que no lo tiene presente', 'major'),
  ('discovery.dolor_vs_hueco', 3, 'principio', 'universal', 'CAMPO', 'El dolor tiene señal verbal (el «aunque»); el hueco no: se ve, no se oye.', 'HUECO — algo que podría comprarte y no te compra. No tiene señal verbal: se ve, no se oye', NULL),
  ('discovery.lee_el_lugar', 3, 'herramienta', 'universal', 'CAMPO', 'Lo que ves dice qué maneja y de quién: estante vacío es hueco, producto empolvado es dolor.', 'Un producto de otra marca es un espacio ocupado; un estante vacío es una familia que nadie cubre', NULL),
  ('discovery.pregunta_lo_que_le_piden', 3, 'herramienta', 'universal', 'CAMPO', '«¿Le ha tocado que le pidan algo que no maneje?» Demanda que existe sin oferta.', 'le ha tocado que le pidan algo que no maneje', NULL),
  ('discovery.hueco_inventado', 3, 'error', 'universal', 'CAMPO', 'Fabricar un hueco: venderle un problema que no tiene.', 'Descubrir un hueco es señalar algo que ya existe. Fabricarlo es venderle un problema que no tiene', 'critical'),
  ('present.argumento_del_hueco', 4, 'requisito', 'universal', 'CAMPO', 'La pregunta que define el argumento: ¿qué gana él con que tú se lo surtas? Consolidación, conveniencia, complementariedad o una condición concreta.', 'qué gana él con que tú se lo surtas', NULL),
  ('present.consolidacion_falsa', 4, 'error', 'universal', 'CAMPO', 'Usar «menos proveedores» cuando el producto es complementario y el cliente pasa a tener más, no menos.', 'La consolidación NO es un argumento universal', 'major'),
  ('present.ataca_proveedor', 4, 'error', 'universal', 'CAMPO', 'Criticar al proveedor actual es criticar la decisión del cliente.', 'Nunca ataques al proveedor actual', 'critical'),
  ('present.ventaja_no_verificable', 4, 'error', 'universal', 'CAMPO', 'Afirmar ventajas competitivas que no puedes sostener. En una cuenta de años se descubre siempre.', 'No afirmes ventajas que no puedes verificar', 'critical'),
  ('present.pide_que_pruebe', 4, 'error', 'universal', 'CAMPO', '«Le pongo unas pocas para que lo pruebe» le pasa el riesgo al cliente.', 'Nunca le pidas que «pruebe»', 'major'),
  ('present.conviccion_sin_garantia', 4, 'requisito', 'universal', 'CAMPO', '«No le puedo garantizar nada, pero estoy seguro de que le va a servir», más la razón detrás. Y ahí te callas.', 'Convicción, sin garantía', NULL),
  ('present.garantiza', 4, 'error', 'universal', 'CAMPO', 'Garantizar resultados. Admitir el límite es lo que hace creíble lo que sí afirmas.', 'Admitir lo que no controlas hace creíble lo que sí afirmas', 'major'),
  ('present.plan_b', 4, 'error', 'universal', 'CAMPO', '«Y si no funciona lo ajustamos» mete una duda que no tenía y desmiente la convicción.', 'No ofrezcas el plan B', 'major'),
  ('present.capital_del_record', 4, 'principio', 'universal', 'CAMPO', 'La segunda vez el cliente compra por tu récord. Solo se recomienda lo que de verdad sirve a ese perfil.', 'La primera vez que recomiendas algo, el cliente compra por la relación. La segunda vez, compra por tu récord', 'major'),
  ('close.cierra_solo_incremento', 5, 'requisito', 'universal', 'CAMPO', 'Con cliente que ya compra, se cierra lo que se agrega. El pedido base ya existía.', 'Lo que se cierra es lo que se agrega', NULL),
  ('close.reabre_pedido_base', 5, 'error', 'universal', 'CAMPO', 'Volver a confirmar o poner en duda el pedido de siempre invita al cliente a revisar toda la orden.', 'Reabrir el pedido base al cerrar pone sobre la mesa algo que ya estaba resuelto', 'major'),
  ('develop.visita_tramite', 0, 'error', 'universal', 'CAMPO', 'Levantar el pedido de siempre y despedirse sin explorar nada. Al que solo toma pedidos lo reemplaza un formulario.', 'Al que solo toma pedidos lo reemplaza un formulario', 'major'),
  ('discovery.rojo_insistir', 3, 'error', 'universal', 'FUENTE', 'Insistir ante un rojo genuino desgasta la actitud y le roba tiempo a un amarillo.', 'Sal de las luces rojas rápido y educadamente', 'major'),
  ('discovery.suelta_amarrado', 3, 'error', 'universal', 'CAMPO', 'Rendirse ante quien quiere y no puede: ese cliente sí quería comprar y el vendedor se fue solo.', 'con él, rendirse es la falla más cara del oficio', 'major'),
  ('discovery.interrogatorio', 3, 'error', 'universal', 'CAMPO', 'Ráfagas de preguntas desconectadas de las respuestas. Insistir en zona sana te vuelve interrogador.', 'Insistir en zona sana te vuelve interrogador', 'minor'),
  ('discovery.solo_cerradas', 3, 'error', 'universal', 'CLOSER', 'Todas las preguntas de sí o no. La capa 3 solo se abre con abiertas.', 'Solo se abre si recoges la pista y profundizas con preguntas abiertas', 'major'),
  ('discovery.lectura_falsa', 3, 'error', 'universal', 'FUENTE', 'Reconocer un estado que el cliente no mostró. Leer es leer, no suponer.', 'Tres cosas que leer: el ambiente, la demografía de la persona, y su estado de ánimo', 'major'),
  ('relationship.familiaridad_excesiva', 0, 'error', 'universal', 'FUENTE', 'Confianza que todavía no se ganó: apodos, tuteo forzado. Se construye en el registro del cliente.', 'Tú te adaptas primero', 'minor'),
  ('impulse.indiferencia_teatral', 0, 'error', 'universal', 'FUENTE', 'Fingir indiferencia con amenaza. La indiferencia real es tranquila.', 'be excited about the person and the product, but indifferent whether they buy', 'major'),
  ('impulse.presion_directa', 0, 'error', 'universal', 'FUENTE', 'Convertir la indiferencia en presión frontal para forzar la decisión.', 'Some Will, Some Won''t, So What', 'major'),
  ('impulse.ruega', 0, 'error', 'universal', 'FUENTE', 'Suplicar la oportunidad. Ellos tienen una oportunidad de comprarte; tú tienes cien clientes.', 'Ellos solo tienen una oportunidad de comprarte; tú tienes más de cien clientes', 'critical'),
  ('impulse.miedo_perdida_generico', 0, 'error', 'universal', 'FUENTE', 'Hablar de pérdida en abstracto sin anclar en algo concreto del cliente.', 'La gente dice que sí impulsivamente porque no quiere que algo se le vaya', 'major'),
  ('impulse.escasez_inventada', 0, 'error', 'universal', 'FUENTE', 'Inventar escasez, urgencia o promoción sin ancla real.', 'fabricar urgencia, escasez o problemas no lo es', 'critical'),
  ('close.descuento_de_panico', 5, 'error', 'universal', 'CAMPO', 'Ceder precio por pánico. El problema nunca está en el número: está en la balanza.', 'El problema nunca está en el número: está en la balanza', 'major'),
  ('close.persigue', 5, 'error', 'universal', 'FUENTE', 'Cambiar el asumir por súplica cuando el cliente titubea.', 'la mayoría de las personas que batallan para cerrar simplemente no están rompiendo la zona de confort que viene con pedir algo', 'major'),
  ('close.asume_con_presion', 5, 'error', 'universal', 'FUENTE', 'Confundir asumir con imponer: dar por cerrada una venta no aceptada.', 'Un cierre no es algo que le haces a alguien', 'major'),
  ('close.pide_aprobacion', 5, 'error', 'universal', 'FUENTE', 'Tras el precio, preguntar qué le parece o cómo lo ve. Invita al no.', '¿Qué le parece? · ¿Cómo lo ve?', 'critical'),
  ('consolidation.sobre_celebra', 6, 'error', 'universal', 'CAMPO', 'Festejo desbordado tras el sí. Huele a que necesitabas la venta.', 'Seguir vendiendo después del sí le dice al cliente que necesitabas la venta', 'major'),
  ('consolidation.referido_en_frio', 6, 'error', 'universal', 'FUENTE', 'Pedir referidos sin ancla y en tono transaccional.', 'la gente compra de sus amigos mucho más fácil que de un desconocido', 'major'),
  ('consolidation.salida_seca', 6, 'error', 'universal', 'FUENTE', 'Salir sin dejar puerta abierta ni cerrar en buenos términos.', 'Dejarlo positivo y entendiendo los siguientes pasos', 'major'),
  ('objection.air_a_objecion', 0, 'error', 'universal', 'FUENTE', 'Aplicar AIR a una objeción real: evadir a alguien que habló en serio.', 'E ignorar una objeción real ofende a alguien que sí te escuchó y sí pensó', 'critical'),
  ('objection.vacia_el_cargador', 0, 'error', 'universal', 'FUENTE', 'Apilar argumentos en una respuesta. Las balas se dosifican.', 'Reserva algunas para que no importe cuántas balas tenga tu cliente', 'major'),
  ('objection.se_desanima', 0, 'error', 'universal', 'FUENTE', 'La segunda objeción drena el ánimo. KILT: la actitud es la variable de entrada.', 'interactuar de más con él desgasta tu actitud, que es la variable de entrada de todo tu sistema', 'major'),
  ('discovery.receta_sin_diagnostico', 3, 'error', 'universal', 'CAMPO', 'Presentar producto o precio antes de terminar el diagnóstico. En cuanto presentas, el cliente deja de revelar. (Antes compartía etiqueta con opening.pitch_prematuro.)', 'Primero el examen, luego la receta', 'major'),
  ('opening.ice_breaker_generico', 1, 'error', 'universal', 'FUENTE', 'Observación que sirve para cualquier negocio y cualquier persona. No es de ESE cliente en ESE momento.', 'Puede ser sobre la persona, el lugar, o algo en común', 'major'),
  ('opening.pregunta_cerrada', 1, 'error', 'universal', 'FUENTE', 'Cerrar la apertura con pregunta de sí o no, o sin pregunta. Deja al cliente sin cómo entrar.', 'le ofreces una salida que no le cuesta nada tomar', 'major')
ON CONFLICT (id) DO UPDATE SET
  paso=EXCLUDED.paso, tipo=EXCLUDED.tipo, canal=EXCLUDED.canal, procedencia=EXCLUDED.procedencia,
  resumen=EXCLUDED.resumen, cita_cerebro=EXCLUDED.cita_cerebro, severidad_default=EXCLUDED.severidad_default,
  updated_at=now();


-- ── Normalización de los practice_script ──────────────────────
