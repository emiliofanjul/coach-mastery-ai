-- Mensaje 181 · SOLO si hay que regresar: quita la falla que agregó el 181 a los guiones 2.7 y 2.7c y les regresa su versión.
-- Si algo no está como lo dejó el 181, falla y NO cambia nada. Después corre guiones_181_verificar.sql.
DO $do$
DECLARE ps jsonb; t text;
BEGIN
  -- 2.7: se quita pitch_prematuro.
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.7';
  IF ps IS NULL OR ps->>'version' <> '2.1.0' THEN RAISE EXCEPTION 'el guion 2.7 no está en la versión 2.1.0 del 181 (está en %)', ps->>'version'; END IF;
  IF jsonb_array_length(ps->'failure_criteria') <> 5 OR ps #> '{failure_criteria,4}' IS DISTINCT FROM $t${"id": "pitch_prematuro", "regla_id": "opening.pitch_prematuro", "severity": "critical", "description": "Mete producto, promoción o motivo de venta: aceptar el bloqueo no da permiso de ofrecer. Después del AIR sigue con su plática (quién es y por qué pasó, o una pregunta sobre él o sobre cómo le va), no con producto ni pidiendo el pedido. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Preguntarle cómo le va (la semana, el negocio, el movimiento) es sobre él y no es esta falla. Ya que se presentó y el cliente le contestó, aunque sea con el bloqueo, preguntar por su negocio es descubrimiento y no es esta falla."}$t$::jsonb THEN RAISE EXCEPTION 'el guion 2.7 no termina en la falla que agregó el 181'; END IF;
  t := ps->>'notes';
  IF t IS NULL OR right(t, length($t$ · 2.1.0 (mensaje 181, 25-nov-2026): pitch_prematuro también aquí, como en el resto del mundo 2: aceptar el bloqueo no da permiso de ofrecer (Emilio).$t$)) <> $t$ · 2.1.0 (mensaje 181, 25-nov-2026): pitch_prematuro también aquí, como en el resto del mundo 2: aceptar el bloqueo no da permiso de ofrecer (Emilio).$t$ THEN RAISE EXCEPTION 'las notas del guion 2.7 no terminan en la nota del 181'; END IF;
  ps := ps #- '{failure_criteria,4}';
  ps := jsonb_set(ps, '{notes}', to_jsonb(left(t, length(t) - length($t$ · 2.1.0 (mensaje 181, 25-nov-2026): pitch_prematuro también aquí, como en el resto del mundo 2: aceptar el bloqueo no da permiso de ofrecer (Emilio).$t$))));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.0.4'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.7';
  -- 2.7c: se quita pitch_prematuro.
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.7c';
  IF ps IS NULL OR ps->>'version' <> '1.1.0' THEN RAISE EXCEPTION 'el guion 2.7c no está en la versión 1.1.0 del 181 (está en %)', ps->>'version'; END IF;
  IF jsonb_array_length(ps->'failure_criteria') <> 6 OR ps #> '{failure_criteria,5}' IS DISTINCT FROM $t${"id": "pitch_prematuro", "regla_id": "opening.pitch_prematuro", "severity": "critical", "description": "Mete producto, promoción o motivo de venta: aceptar el bloqueo no da permiso de ofrecer. Después del AIR sigue con su plática (quién es y por qué pasó, o una pregunta sobre él o sobre cómo le va), no con producto ni pidiendo el pedido. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Preguntarle cómo le va (la semana, el negocio, el movimiento) es sobre él y no es esta falla. Ya que se presentó y el cliente le contestó, aunque sea con el bloqueo, preguntar por su negocio es descubrimiento y no es esta falla. Después del segundo bloqueo, quedar de regresar con dos opciones de día («¿el jueves o el viernes?») no es ofrecer: no es esta falla."}$t$::jsonb THEN RAISE EXCEPTION 'el guion 2.7c no termina en la falla que agregó el 181'; END IF;
  t := ps->>'notes';
  IF t IS NULL OR right(t, length($t$ · 1.1.0 (mensaje 181, 25-nov-2026): pitch_prematuro también aquí, como en el resto del mundo 2: aceptar el bloqueo no da permiso de ofrecer (Emilio).$t$)) <> $t$ · 1.1.0 (mensaje 181, 25-nov-2026): pitch_prematuro también aquí, como en el resto del mundo 2: aceptar el bloqueo no da permiso de ofrecer (Emilio).$t$ THEN RAISE EXCEPTION 'las notas del guion 2.7c no terminan en la nota del 181'; END IF;
  ps := ps #- '{failure_criteria,5}';
  ps := jsonb_set(ps, '{notes}', to_jsonb(left(t, length(t) - length($t$ · 1.1.0 (mensaje 181, 25-nov-2026): pitch_prematuro también aquí, como en el resto del mundo 2: aceptar el bloqueo no da permiso de ofrecer (Emilio).$t$))));
  ps := jsonb_set(ps, '{version}', to_jsonb('1.0.5'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.7c';
END
$do$;
