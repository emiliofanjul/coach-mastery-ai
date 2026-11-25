-- Mensaje 176 · SOLO si hay que regresar: deja el Cerebro, la regla y los guiones como antes del 176,
-- y retira la guía del vendedor (activa = false) sin borrarla. Volver a correr doctrina_176_datos.sql la reactiva.
-- Si algo no está como lo dejó el 176, falla y NO cambia nada.
DO $do$
DECLARE v int; n int; b text; ps jsonb; t text;
BEGIN
  -- 1. El Cerebro: se borra la versión del 176 y vuelve a activarse la anterior.
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  IF NOT EXISTS (SELECT 1 FROM public.doctrina WHERE version = v AND section_key = 'pasos' AND is_active AND strpos(body, $t$**Cuándo empiezan las preguntas de su negocio** `CAMPO`: en el mismo turno de tu historia breve, la pregunta va sobre él$t$) > 0) THEN RAISE EXCEPTION 'la versión activa del Cerebro no es la del 176'; END IF;
  SELECT count(*) INTO n FROM public.doctrina WHERE version = v - 1;
  IF n <> 7 THEN RAISE EXCEPTION 'la versión anterior del Cerebro no tiene 7 secciones'; END IF;
  DELETE FROM public.doctrina WHERE version = v;
  UPDATE public.doctrina SET is_active = true WHERE version = v - 1;
  -- 2. La regla opening.pitch_prematuro: hasta cuándo es pitch prematuro.
  SELECT resumen INTO t FROM public.reglas WHERE id = 'opening.pitch_prematuro';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Si la respuesta es sí y es antes de tiempo, es pitch prematuro, aunque no nombre ningún producto. ANTES DE TIEMPO: ofrecerle algo en la introducción o en la historia breve; o pedirle información de su operación mientras todavía no sabe quién eres y por qué pasaste, o en el mismo turno de tu historia breve, donde la pregunta va sobre él o sobre cómo le va. Ya que te presentaste y el cliente te contestó, preguntar por su operación es descubrimiento y no es esto. Tampoco cuando el cliente sacó una mala experiencia al llegar: ahí, después del motivo concreto de tu visita, se regresa al diagnóstico con una pregunta en el mismo turno.$t$, ''))) / length($t$Si la respuesta es sí y es antes de tiempo, es pitch prematuro, aunque no nombre ningún producto. ANTES DE TIEMPO: ofrecerle algo en la introducción o en la historia breve; o pedirle información de su operación mientras todavía no sabe quién eres y por qué pasaste, o en el mismo turno de tu historia breve, donde la pregunta va sobre él o sobre cómo le va. Ya que te presentaste y el cliente te contestó, preguntar por su operación es descubrimiento y no es esto. Tampoco cuando el cliente sacó una mala experiencia al llegar: ahí, después del motivo concreto de tu visita, se regresa al diagnóstico con una pregunta en el mismo turno.$t$) <> 1 THEN RAISE EXCEPTION 'opening.pitch_prematuro no tiene el texto esperado'; END IF;
  UPDATE public.reglas SET resumen = replace(resumen, $t$Si la respuesta es sí y es antes de tiempo, es pitch prematuro, aunque no nombre ningún producto. ANTES DE TIEMPO: ofrecerle algo en la introducción o en la historia breve; o pedirle información de su operación mientras todavía no sabe quién eres y por qué pasaste, o en el mismo turno de tu historia breve, donde la pregunta va sobre él o sobre cómo le va. Ya que te presentaste y el cliente te contestó, preguntar por su operación es descubrimiento y no es esto. Tampoco cuando el cliente sacó una mala experiencia al llegar: ahí, después del motivo concreto de tu visita, se regresa al diagnóstico con una pregunta en el mismo turno.$t$, $t$Si la respuesta es sí, es pitch prematuro, aunque no nombre ningún producto.$t$), updated_at = now() WHERE id = 'opening.pitch_prematuro';
  -- 3. Los guiones del mundo 2: la falla dice lo mismo que la regla.
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.1';
  IF ps IS NULL OR ps->>'version' <> '2.0.3' THEN RAISE EXCEPTION 'el guion 2.1 no está en la versión 2.0.3 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,3,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,3,description}' IS DISTINCT FROM $t$Aprovecha la presentacion para meter producto, promocion o motivo de venta, o le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) en el mismo turno de su historia breve: ahí la pregunta va sobre él o sobre cómo le va. La historia breve dice quien eres, no que vendes.$t$ THEN RAISE EXCEPTION 'el guion 2.1 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,3,description}', to_jsonb($t$Aprovecha la presentacion para meter producto, promocion o motivo de venta. La historia breve dice quien eres, no que vendes.$t$::text));
  t := ps->>'notes';
  IF t IS NULL OR right(t, length($t$ · 2.0.3 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$)) <> $t$ · 2.0.3 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$ THEN RAISE EXCEPTION 'las notas del guion 2.1 no terminan en la nota del 176'; END IF;
  ps := jsonb_set(ps, '{notes}', to_jsonb(left(t, length(t) - length($t$ · 2.0.3 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$))));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.0.2'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.1';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.2';
  IF ps IS NULL OR ps->>'version' <> '2.0.3' THEN RAISE EXCEPTION 'el guion 2.2 no está en la versión 2.0.3 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,3,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,3,description}' IS DISTINCT FROM $t$Mete producto, promocion o motivo de venta. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla.$t$ THEN RAISE EXCEPTION 'el guion 2.2 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,3,description}', to_jsonb($t$Mete producto, promocion o motivo de venta.$t$::text));
  t := ps->>'notes';
  IF t IS NULL OR right(t, length($t$ · 2.0.3 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$)) <> $t$ · 2.0.3 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$ THEN RAISE EXCEPTION 'las notas del guion 2.2 no terminan en la nota del 176'; END IF;
  ps := jsonb_set(ps, '{notes}', to_jsonb(left(t, length(t) - length($t$ · 2.0.3 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$))));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.0.2'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.2';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.5';
  IF ps IS NULL OR ps->>'version' <> '2.0.1' THEN RAISE EXCEPTION 'el guion 2.5 no está en la versión 2.0.1 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,3,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,3,description}' IS DISTINCT FROM $t$Mete producto, promocion o motivo de venta. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla.$t$ THEN RAISE EXCEPTION 'el guion 2.5 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,3,description}', to_jsonb($t$Mete producto, promocion o motivo de venta.$t$::text));
  t := ps->>'notes';
  IF t IS NULL OR right(t, length($t$ · 2.0.1 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$)) <> $t$ · 2.0.1 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$ THEN RAISE EXCEPTION 'las notas del guion 2.5 no terminan en la nota del 176'; END IF;
  ps := jsonb_set(ps, '{notes}', to_jsonb(left(t, length(t) - length($t$ · 2.0.1 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$))));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.0.0'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.5';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.8';
  IF ps IS NULL OR ps->>'version' <> '3.0.2' THEN RAISE EXCEPTION 'el guion 2.8 no está en la versión 3.0.2 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,4,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,4,description}' IS DISTINCT FROM $t$Mete producto, promoción o motivo de venta, o le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué viene. La pregunta que regresa al diagnóstico después del motivo concreto de su visita no es esta falla: es lo que pide este nodo.$t$ THEN RAISE EXCEPTION 'el guion 2.8 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,4,description}', to_jsonb($t$Mete producto, promoción o motivo de venta.$t$::text));
  t := ps->>'notes';
  IF t IS NULL OR right(t, length($t$ · 3.0.2 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$)) <> $t$ · 3.0.2 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$ THEN RAISE EXCEPTION 'las notas del guion 2.8 no terminan en la nota del 176'; END IF;
  ps := jsonb_set(ps, '{notes}', to_jsonb(left(t, length(t) - length($t$ · 3.0.2 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$))));
  ps := jsonb_set(ps, '{version}', to_jsonb('3.0.1'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.8';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.9';
  IF ps IS NULL OR ps->>'version' <> '2.0.2' THEN RAISE EXCEPTION 'el guion 2.9 no está en la versión 2.0.2 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,3,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,3,description}' IS DISTINCT FROM $t$Mete producto, promocion o motivo de venta. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla.$t$ THEN RAISE EXCEPTION 'el guion 2.9 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,3,description}', to_jsonb($t$Mete producto, promocion o motivo de venta.$t$::text));
  t := ps->>'notes';
  IF t IS NULL OR right(t, length($t$ · 2.0.2 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$)) <> $t$ · 2.0.2 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$ THEN RAISE EXCEPTION 'las notas del guion 2.9 no terminan en la nota del 176'; END IF;
  ps := jsonb_set(ps, '{notes}', to_jsonb(left(t, length(t) - length($t$ · 2.0.2 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$))));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.0.1'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.9';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.10';
  IF ps IS NULL OR ps->>'version' <> '2.1.6' THEN RAISE EXCEPTION 'el guion 2.10 no está en la versión 2.1.6 (está en %)', ps->>'version'; END IF;
  IF ps #>> '{failure_criteria,6,id}' IS DISTINCT FROM 'pitch_prematuro' OR ps #>> '{failure_criteria,6,description}' IS DISTINCT FROM $t$Mete producto, promocion o motivo de venta. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla. Identificarse con nombre y empresa es el trabajo de este paso, no una excepción: aquí SÍ se dice quién eres y por qué estás.$t$ THEN RAISE EXCEPTION 'el guion 2.10 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,6,description}', to_jsonb($t$Mete producto, promocion o motivo de venta. Identificarse con nombre y empresa es el trabajo de este paso, no una excepción: aquí SÍ se dice quién eres y por qué estás.$t$::text));
  t := ps->>'notes';
  IF t IS NULL OR right(t, length($t$ · 2.1.6 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$)) <> $t$ · 2.1.6 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$ THEN RAISE EXCEPTION 'las notas del guion 2.10 no terminan en la nota del 176'; END IF;
  ps := jsonb_set(ps, '{notes}', to_jsonb(left(t, length(t) - length($t$ · 2.1.6 (mensaje 176, 25-nov-2026): pitch_prematuro dice hasta cuándo, como la regla (Emilio).$t$))));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.1.5'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.10';
  -- 4. Verificación.
  SELECT count(*) INTO n FROM public.doctrina WHERE is_active;
  IF n <> 7 THEN RAISE EXCEPTION 'el Cerebro activo tiene % secciones, no 7', n; END IF;
END
$do$;
DO $do$
BEGIN
  IF to_regclass('public.guia_del_vendedor') IS NULL OR NOT EXISTS (SELECT 1 FROM public.guia_del_vendedor WHERE activa) THEN RAISE EXCEPTION 'No hay guía activa que retirar'; END IF;
END
$do$;
UPDATE public.guia_del_vendedor SET activa = false WHERE activa;
