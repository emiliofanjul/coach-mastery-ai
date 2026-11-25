-- Mensaje 176 · Hasta cuándo es pitch prematuro (Emilio, 25-nov-2026) y la guía del vendedor.
-- Ofrecerle algo en la introducción o en la historia breve es pitch prematuro. Pedirle información de su operación también,
-- mientras no sabe quién eres y por qué pasaste, o en el mismo turno de tu historia breve. Ya que te presentaste y te contestó,
-- es descubrimiento. La excepción: la mala experiencia al llegar (2.8).
-- Cerebro (versión nueva), la regla, los guiones 2.1, 2.2, 2.5, 2.8, 2.9 y 2.10, y la tabla guia_del_vendedor.
-- Para la herramienta de la base de Lovable: sin BEGIN/COMMIT. Si algo no está como se espera, falla y NO cambia nada.
DO $do$
DECLARE v int; n int; b text; ps jsonb; t text;
BEGIN
  -- 1. El Cerebro: versión nueva completa (como siempre), con la sección 'pasos' aclarada.
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  SELECT count(*) INTO n FROM public.doctrina WHERE is_active AND version = v;
  IF n <> 7 THEN RAISE EXCEPTION 'la versión % del Cerebro tiene % secciones activas, no 7', v, n; END IF;
  SELECT body INTO b FROM public.doctrina WHERE is_active AND version = v AND section_key = 'pasos';
  IF strpos(b, $t$**Cuándo empiezan las preguntas de su negocio** `CAMPO`: en el mismo turno de tu historia breve, la pregunta va sobre él$t$) > 0 THEN RAISE EXCEPTION 'el Cerebro activo ya tiene el cambio del 176: no se aplica dos veces'; END IF;
  IF (length(b) - length(replace(b, $t$Tu historia breve no existe para que te entiendan a ti. **Existe para ganarte el derecho de preguntarle a él.**
$t$, ''))) / length($t$Tu historia breve no existe para que te entiendan a ti. **Existe para ganarte el derecho de preguntarle a él.**
$t$) <> 1 THEN RAISE EXCEPTION 'Cerebro: el texto viejo no aparece exactamente una vez'; END IF;
  b := replace(b, $t$Tu historia breve no existe para que te entiendan a ti. **Existe para ganarte el derecho de preguntarle a él.**
$t$, $t$Tu historia breve no existe para que te entiendan a ti. **Existe para ganarte el derecho de preguntarle a él.**

**Cuándo empiezan las preguntas de su negocio** `CAMPO`: en el mismo turno de tu historia breve, la pregunta va sobre él o sobre cómo le va —*"¿cuánto tiempo lleva con el taller?"*—. Ya que te contestó, empiezan las preguntas de su negocio: su proveedor, qué se le mueve, cómo le hace. Eso ya es descubrimiento. Antes de que sepa quién eres y por qué pasaste, preguntarle por su operación es trabajo comercial antes de tiempo. La excepción es la mala experiencia al llegar: después del motivo concreto de tu visita, regresas al diagnóstico con una pregunta en el mismo turno.
$t$);
  INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
  SELECT v + 1, section_key, order_index, title, CASE WHEN section_key = 'pasos' THEN b ELSE body END, true, created_by
  FROM public.doctrina WHERE is_active AND version = v;
  UPDATE public.doctrina SET is_active = false WHERE is_active AND version = v;
  -- 2. La regla opening.pitch_prematuro: hasta cuándo es pitch prematuro.
  SELECT resumen INTO t FROM public.reglas WHERE id = 'opening.pitch_prematuro';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Si la respuesta es sí, es pitch prematuro, aunque no nombre ningún producto.$t$, ''))) / length($t$Si la respuesta es sí, es pitch prematuro, aunque no nombre ningún producto.$t$) <> 1 THEN RAISE EXCEPTION 'opening.pitch_prematuro no tiene el texto esperado'; END IF;
  UPDATE public.reglas SET resumen = replace(resumen, $t$Si la respuesta es sí, es pitch prematuro, aunque no nombre ningún producto.$t$, $t$Si la respuesta es sí y es antes de tiempo, es pitch prematuro, aunque no nombre ningún producto. ANTES DE TIEMPO: ofrecerle algo en la introducción o en la historia breve; o pedirle información de su operación mientras todavía no sabe quién eres y por qué pasaste, o en el mismo turno de tu historia breve, donde la pregunta va sobre él o sobre cómo le va. Ya que te presentaste y el cliente te contestó, preguntar por su operación es descubrimiento y no es esto. Tampoco cuando el cliente sacó una mala experiencia al llegar: ahí, después del motivo concreto de tu visita, se regresa al diagnóstico con una pregunta en el mismo turno.$t$), updated_at = now() WHERE id = 'opening.pitch_prematuro';
  -- 3. Los guiones del mundo 2: la falla dice lo mismo que la regla.
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.1';
  IF ps IS NULL OR ps->>'version' <> '2.0.2' THEN RAISE EXCEPTION 'el guion 2.1 no está en la versión 2.0.2 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,3,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,3,description}' IS DISTINCT FROM $t$Aprovecha la presentacion para meter producto, promocion o motivo de venta. La historia breve dice quien eres, no que vendes.$t$ THEN RAISE EXCEPTION 'el guion 2.1 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,3,description}', to_jsonb($t$Aprovecha la presentacion para meter producto, promocion o motivo de venta, o le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) en el mismo turno de su historia breve: ahí la pregunta va sobre él o sobre cómo le va. La historia breve dice quien eres, no que vendes.$t$::text));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ · 2.0.3 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.0.3'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.1';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.2';
  IF ps IS NULL OR ps->>'version' <> '2.0.2' THEN RAISE EXCEPTION 'el guion 2.2 no está en la versión 2.0.2 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,3,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,3,description}' IS DISTINCT FROM $t$Mete producto, promocion o motivo de venta.$t$ THEN RAISE EXCEPTION 'el guion 2.2 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,3,description}', to_jsonb($t$Mete producto, promocion o motivo de venta. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla.$t$::text));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ · 2.0.3 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.0.3'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.2';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.5';
  IF ps IS NULL OR ps->>'version' <> '2.0.0' THEN RAISE EXCEPTION 'el guion 2.5 no está en la versión 2.0.0 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,3,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,3,description}' IS DISTINCT FROM $t$Mete producto, promocion o motivo de venta.$t$ THEN RAISE EXCEPTION 'el guion 2.5 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,3,description}', to_jsonb($t$Mete producto, promocion o motivo de venta. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla.$t$::text));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ · 2.0.1 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.0.1'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.5';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.8';
  IF ps IS NULL OR ps->>'version' <> '3.0.1' THEN RAISE EXCEPTION 'el guion 2.8 no está en la versión 3.0.1 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,4,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,4,description}' IS DISTINCT FROM $t$Mete producto, promoción o motivo de venta.$t$ THEN RAISE EXCEPTION 'el guion 2.8 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,4,description}', to_jsonb($t$Mete producto, promoción o motivo de venta, o le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué viene. La pregunta que regresa al diagnóstico después del motivo concreto de su visita no es esta falla: es lo que pide este nodo.$t$::text));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ · 3.0.2 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('3.0.2'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.8';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.9';
  IF ps IS NULL OR ps->>'version' <> '2.0.1' THEN RAISE EXCEPTION 'el guion 2.9 no está en la versión 2.0.1 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,3,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,3,description}' IS DISTINCT FROM $t$Mete producto, promocion o motivo de venta.$t$ THEN RAISE EXCEPTION 'el guion 2.9 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,3,description}', to_jsonb($t$Mete producto, promocion o motivo de venta. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla.$t$::text));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ · 2.0.2 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.0.2'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.9';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.10';
  IF ps IS NULL OR ps->>'version' <> '2.1.5' THEN RAISE EXCEPTION 'el guion 2.10 no está en la versión 2.1.5 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,6,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,6,description}' IS DISTINCT FROM $t$Mete producto, promocion o motivo de venta. Identificarse con nombre y empresa es el trabajo de este paso, no una excepción: aquí SÍ se dice quién eres y por qué estás.$t$ THEN RAISE EXCEPTION 'el guion 2.10 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,6,description}', to_jsonb($t$Mete producto, promocion o motivo de venta. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla. Identificarse con nombre y empresa es el trabajo de este paso, no una excepción: aquí SÍ se dice quién eres y por qué estás.$t$::text));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ · 2.1.6 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.1.6'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.10';
  -- 4. Verificación.
  SELECT count(*) INTO n FROM public.doctrina WHERE is_active;
  IF n <> 7 THEN RAISE EXCEPTION 'el Cerebro activo tiene % secciones, no 7', n; END IF;
END
$do$;

-- 5. La guía del vendedor: el molde de cada paso, «En cualquier paso», «Cuando el cliente…» y los factores de impulso.
--    La lee todo el que escribe frases para el vendedor (el coach, las disputas, y después el Pitch Builder y los agentes).
--    El regreso no borra la tabla: retira la guía (activa = false). Volver a correr este archivo la reactiva.
CREATE TABLE IF NOT EXISTS public.guia_del_vendedor (
  clave text PRIMARY KEY,
  orden smallint NOT NULL UNIQUE,
  titulo text NOT NULL CHECK (length(btrim(titulo)) > 0),
  texto text NOT NULL CHECK (length(btrim(texto)) > 0),
  activa boolean NOT NULL DEFAULT true,
  aprobada_el date NOT NULL DEFAULT DATE '2026-11-25'
);
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM public.guia_del_vendedor WHERE activa) THEN RAISE EXCEPTION '176 ya se aplicó: la guía del vendedor ya está activa'; END IF;
END
$do$;
COMMENT ON TABLE public.guia_del_vendedor IS 'Mensaje 176: la guía del vendedor (doc «Closer · El molde de cada paso», aprobado por Emilio el 25-nov-2026). Sale del Cerebro y las reglas; la recibe todo el que escribe frases para el vendedor. No califica. Solo cuentan las filas activas.';
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.guia_del_vendedor FROM anon, authenticated;
GRANT SELECT ON public.guia_del_vendedor TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guia_del_vendedor TO service_role;
ALTER TABLE public.guia_del_vendedor ENABLE ROW LEVEL SECURITY;
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'guia_del_vendedor' AND policyname = 'cualquiera con sesión lee la guía activa') THEN
    CREATE POLICY "cualquiera con sesión lee la guía activa" ON public.guia_del_vendedor FOR SELECT TO authenticated USING (activa);
  END IF;
END
$do$;
INSERT INTO public.guia_del_vendedor (clave, orden, titulo, texto) VALUES
  ($t$en_cualquier_paso$t$, 0, $t$En cualquier paso$t$, $t$Estas valen para toda frase, sea del paso que sea.

- Turno corto, que el cliente pueda contestar. Una idea y una pregunta, no un discurso ni varias preguntas juntas.
- Termina avanzando. Con una pregunta que le devuelva la palabra o con el siguiente paso, nunca quedando a esperar permiso. En la apertura cuenta cualquier pregunta; desde la historia breve, cada turno termina así.
- Reconoce lo que dijo el cliente antes de seguir. Un «entiendo», un «claro» o algo que muestre que lo escuchó.
- En el registro del cliente. Sin apodos, tuteo ni confianza que no se ha ganado.
- Sin presión y sin ruegos. Nada de «ándele», «deme chance» ni escasez sin razón.
- Sin pedir permiso ni disculparse. Nada de «¿tiene un minutito?» ni «perdón que lo moleste».
- Si el cliente suelta algo personal, le entra con interés de verdad y regresa al negocio en uno o dos intercambios.$t$),
  ($t$paso_1$t$, 1, $t$Paso 1 · Introducción$t$, $t$- Tiene que: saludo con energía; una observación de él o de su lugar, que no le dirías a cualquiera; algo de ligereza.
- No puede: ofrecer algo ni preguntar por su operación comercial; halago exagerado; identificarse antes de conectar (nombre y empresa se permiten después del rompehielo, nunca se piden).
- Termina: con una pregunta que le devuelva la palabra y que no se pueda contestar con un «no» que corte la plática.
- Ejemplo: «¡Buenas tardes! Veo que no paran, ¿siempre está así de movido?»$t$),
  ($t$paso_2$t$, 2, $t$Paso 2 · Historia breve$t$, $t$- Tiene que: quién eres (nombre y empresa) y por qué pasaste, en términos humanos, en dos o tres frases. Con un cliente que ya te conoce, solo el porqué de hoy.
- No puede: ofrecer ni explicar el producto; presumir la empresa (años, premios, catálogo, «los mejores»); preguntar por su operación comercial: su proveedor, sus precios, sus marcas, su inventario, qué se le mueve o cómo le hace con un producto.
- Termina: con una pregunta sobre él o sobre cómo le va. Ya que te contestó, empiezan las preguntas de su negocio: eso ya es descubrimiento. La excepción es la mala experiencia al llegar: después del motivo concreto de tu visita, regresas al diagnóstico con una pregunta en el mismo turno.
- Ejemplo: «Soy Carlos, de Distribuidora del Norte. Andamos visitando los negocios de esta zona y quise conocer el suyo. Cuénteme, ¿cuánto tiempo lleva con él?»$t$),
  ($t$paso_3$t$, 3, $t$Paso 3 · Descubrimiento$t$, $t$- Tiene que: cada pregunta nace de lo que él dijo, con sus palabras; preguntas concretas que tenga que buscar en su experiencia; abiertas cuando aparece una pista. Si contesta vago, le das tres o cuatro opciones reales de su giro.
- No puede: hablar de tu producto, sus beneficios, su precio o una promoción; preguntar el dolor directo («¿qué problemas tiene?»); pedirle su opinión de los precios; afirmar un problema que negó o del que no hay indicio.
- Termina: con una pregunta que recoge lo último que dijo.
- Ejemplo: «Varios clientes me comentan que batallan con faltantes en temporada, ¿a usted le pasa?»$t$),
  ($t$paso_4$t$, 4, $t$Paso 4 · Presentación$t$, $t$- Tiene que: arrancar de su dolor o su hueco con sus palabras («como me dijo que…»); cada característica traducida a lo que gana (dinero, clientes o tranquilidad); balas concretas, poco a poco; una escena de su negocio con el problema resuelto; el precio en escalones, cada uno con su motivo, y el ahorro dicho; convicción sin garantía.
- No puede: lo que cualquier competidor diría («somos los mejores»); garantizar lo que no controlas; pedirle que «pruebe»; anunciar un plan B; hablar mal de su proveedor; un solo precio; bajar el precio sin motivo; soltar todas las balas de jalón.
- Termina: con una pregunta o un paso que avance, nunca pidiendo aprobación («¿qué le parece?»).$t$),
  ($t$paso_5$t$, 5, $t$Paso 5 · Cierre$t$, $t$- Tiene que: asumir: hablar de cuándo, cuál, cuánto y cómo; una alternativa donde las dos opciones son sí. Ante una objeción: atenderla sin discutir, re-impulsar con una o dos balas que respondan a lo que dijo, y volver a cerrar con acción.
- No puede: cierres que invitan al no («¿le gustaría?», «¿se lo mando?»); llenar el silencio, suavizar o retractarse; rogar o presionar; bajar el precio por pánico; seguir presentando después de una señal de compra; cerrar sin bala después de una objeción; reabrir el pedido de siempre.
- Termina: en la pregunta de cierre, y ahí se calla.
- Ejemplo: «¿Se lo dejo el jueves o le acomoda mejor el viernes?»$t$),
  ($t$paso_6$t$, 6, $t$Paso 6 · Consolidación$t$, $t$- Tiene que: dejar claro qué sigue, con datos (qué llega, cuándo, cuánto y cómo se paga); la misma calidez de antes; la siguiente visita con día y razón.
- No puede: seguir vendiendo, repetir beneficios u ofrecer algo más; celebrar de más; pedir referidos en frío (solo amarrados a alguien que él mencionó); irse seco.
- Termina: con la siguiente visita acordada o una despedida cálida.$t$),
  ($t$cuando_bloqueos$t$, 7, $t$Cuando el cliente… · Bloqueos: al inicio, antes de entender$t$, $t$- Te frena por reflejo («ahorita no», «estoy ocupado», «no me interesa»): AIR. Lo aceptas («claro»), no lo discutes y sigues con tu plática en el mismo turno, sin pedir permiso. Por qué: el bloqueo es un reflejo, no una decisión; si lo discutes lo vuelves posición y le creas un no que no tenía (la presión genera resistencia).
- Te repite el bloqueo enseguida (dos no seguidos): quedas de regresar con una alternativa concreta («¿le caigo el jueves o el viernes?») o te despides bien. Por qué: hoy no es el día; insistir ya no es seguridad, es terquedad, y quema la siguiente visita (tu tiempo va a quien puede comprar).
- Te saca una mala experiencia al llegar: no es un bloqueo. La tomas en serio, sin pelearla ni minimizarla; le das un motivo concreto de por qué vienes ahora, y regresas con una pregunta. Por qué: es una preocupación real; si la atropellas con AIR, confirma que eres igual al que le falló (confianza antes que argumentos).$t$),
  ($t$cuando_objeciones$t$, 8, $t$Cuando el cliente… · Objeciones: después de entender$t$, $t$Una objeción es una señal de compra: el que no tiene interés no objeta, se despide. Tumba el impulso, y tu trabajo es atravesarla y volver a subirlo.

- Pone una objeción menor y común (precio, día de entrega, mínimo): RRR. La repites con sus palabras («o sea que el jueves no le acomoda»), respondes con algo concreto y retomas sin pausa. Por qué: si respondes y te callas, en ese silencio encuentra la siguiente objeción o te dice que lo va a pensar (el volante).
- Pone una preocupación seria o personal: FFF. «Entiendo cómo se siente», «otros sintieron lo mismo», «lo que encontraron fue…». Nunca discutes. Por qué: estar de acuerdo primero te vuelve distinto del vendedor promedio, y por eso te escucha (la alarma del vendedor).
- Ya atendiste su objeción: el círculo de cierre. Re-impulsas con una o dos balas que respondan a lo que dijo, a veces tres, y vuelves a cerrar con acción. Por qué: atravesar solo detiene la caída; no sube el impulso. Si cierras sin bala, pides la decisión en el punto más bajo y la respuesta cómoda es «déjeme lo pienso» (la curva del impulso).
- Te pone otra objeción después: cada objeción con sus propias balas, y la misma calma de la primera. Por qué: si soltaste todas tus balas en la primera, te quedas sin con qué subir el impulso; y si te desanimas, el cliente lo siente (la curva del impulso).
- Te dice «lo voy a pensar»: no es un no, es una objeción. Le haces ver lo que pierde hoy con sus propios números y le das una razón concreta para decidir ahora. Por qué: «lo pienso» es la respuesta cómoda cuando el impulso está bajo; el miedo a perder mueve más que las ganas de ganar (la decisión es emocional).
- Regatea o se hace el difícil: sostienes la calma y el precio. Solo bajas si te da algo a cambio (volumen, contado), y con el motivo dicho. Por qué: bajar por pánico le dice que el primer precio estaba inflado y te vuelve regateable (la balanza).$t$),
  ($t$cuando_senales$t$, 9, $t$Cuando el cliente… · Señales: cuándo cerrar y cuándo irte$t$, $t$- Da una señal de compra (habla del futuro, dice «lo quiero» o «lo necesito», se queda callado pensando, pregunta cuánto o cuándo, critica a su proveedor, te ofrece algo o hace preguntas más profundas): dejas de presentar y cierras asumido, aunque te queden balas. Si la señal es una pregunta, la contestas y cierras en el mismo turno. Por qué: la señal es el pico del impulso; si sigues vendiendo, le dices que hay algo de qué convencerlo y le das tiempo de encontrar un no (la curva del impulso).
- Se queda callado después de tu cierre: aguantas; no agregas nada, no te retractas, no descuentas. Por qué: el primero que habla después de un cierre, pierde (la presión genera resistencia).
- Te dice que no puede comprar (un contrato, una política, el dinero): una o dos preguntas para ver los bordes (qué cubre, qué queda fuera, hasta cuándo). Si es un rojo, sales rápido y bien; si es un amarillo, buscas lo que sí puede comprar hoy y dejas sembrado el regreso. Por qué: casi toda restricción tiene bordes; soltar a un amarillo es la falla más cara del oficio; quedarse con un rojo le roba tiempo al siguiente (tu tiempo va a quien puede comprar).
- Contesta vago («bien», «ahí va»): le preguntas por algo concreto que tenga que buscar en su experiencia, le das tres o cuatro opciones reales de su giro, o normalizas: «varios clientes me comentan que…, ¿a usted le pasa?». Por qué: el «bien» es un reflejo social, no información (primero el examen, luego la receta).
- Te suelta algo personal: le entras con interés de verdad y regresas al negocio en uno o dos intercambios, tú solo. Por qué: sin relación, tus preguntas reciben respuestas de cortesía; y el cliente nunca te regresa al negocio (confianza antes que argumentos).$t$),
  ($t$factores$t$, 10, $t$Los factores de impulso$t$, $t$El impulso es otra palabra para la emoción. Estos factores lo suben, sobre todo con el 80% indiferente, que no tiene un problema urgente y aun así compra. Todos se usan con verdad: inventar urgencia, escasez o promociones está prohibido.

- Miedo a la pérdida. Dónde: presentación, cierre y «lo voy a pensar». Cuidado: con algo concreto de su negocio (cuánto pierde, a dónde se va, desde cuándo); en abstracto no mueve nada. Por qué: perder algo pesa más que ganar algo.
- Urgencia. Dónde: cierre y «lo voy a pensar». Cuidado: siempre con una razón concreta para hoy (tu ruta, el tiempo de entrega, un ciclo de su negocio); sin «ándele» ni prisa sin motivo. Por qué: el movimiento genera la emoción y la razón le da el porqué.
- Avaricia. Dónde: el precio, en la presentación. Cuidado: el precio regular primero, después los escalones con su motivo, y el ahorro dicho en voz alta. Por qué: la brecha entre lo que vale y lo que le cuesta genera el impulso.
- Indiferencia. Dónde: siempre; sobre todo ante el regateo, la provocación o la duda. Cuidado: tranquila y cálida; nada de amenazas ni desplantes («usted se lo pierde»). Por qué: algunos sí, algunos no, ¿y qué? Quitar la presión disuelve la resistencia.
- Efecto Jones. Dónde: presentación y objeciones (la tercera F). Cuidado: con nombre y lugar («la refaccionaria de don Pepe, aquí en la Juárez»); si no lo puedes sostener cuando te pregunta «¿como quiénes?», no lo digas. Por qué: la gente no le cree a un desconocido que le quiere vender, pero sí a negocios como el suyo.
- Poder de sugestión. Dónde: toda la conversación (el tren del sí y asumir). Cuidado: los síes nacen de lo que él dijo, no de obviedades («¿verdad que quiere ganar más?»); ninguna opción que se pueda contestar con un no. Por qué: cada sí hace más fácil el siguiente, y el del final cuesta menos.

Dos herramientas más suben el impulso en la presentación:
- Las balas: hechos concretos de tu producto, tu servicio o tu precio. Unas tres en la presentación, sin soltarlas todas de jalón; el resto se guarda para las objeciones.
- Pintar la escena: ponerlo dentro de un momento concreto de su negocio con el problema resuelto. No argumenta: hace sentir.$t$)
ON CONFLICT (clave) DO UPDATE SET orden = EXCLUDED.orden, titulo = EXCLUDED.titulo, texto = EXCLUDED.texto, activa = true;
DO $do$
BEGIN
  IF (SELECT count(*) FROM public.guia_del_vendedor WHERE activa) <> 11 OR (SELECT count(*) FROM public.guia_del_vendedor) <> 11 THEN RAISE EXCEPTION 'No quedaron exactamente las 11 partes de la guía, activas'; END IF;
END
$do$;
