-- Mensaje 181 · El 2.7 y el 2.7c también califican el pitch prematuro (Emilio, 25-nov-2026).
-- Aceptar el bloqueo no da permiso de ofrecer: después del AIR se sigue con la plática, no con producto ni pidiendo el pedido.
-- Solo datos: agrega la falla pitch_prematuro (regla opening.pitch_prematuro, critical) a los guiones 2.7 y 2.7c y sube su versión.
-- Para la herramienta de la base de Lovable: sin BEGIN/COMMIT. Si algo no está como se espera, falla en su guarda y NO cambia nada.
DO $do$
DECLARE ps jsonb; t text;
BEGIN
  -- 2.7: se agrega pitch_prematuro.
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.7';
  IF ps IS NULL OR ps->>'version' <> '2.0.4' THEN RAISE EXCEPTION 'el guion 2.7 no está en la versión 2.0.4 (está en %)', ps->>'version'; END IF;
  IF jsonb_array_length(ps->'failure_criteria') <> 4 THEN RAISE EXCEPTION 'el guion 2.7 no tiene 4 fallas'; END IF;
  IF jsonb_path_exists(ps, '$.failure_criteria[*] ? (@.id == "pitch_prematuro")') THEN RAISE EXCEPTION 'el guion 2.7 ya tiene pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria}', (ps->'failure_criteria') || jsonb_build_array($t${"id": "pitch_prematuro", "regla_id": "opening.pitch_prematuro", "severity": "critical", "description": "Mete producto, promoción o motivo de venta: aceptar el bloqueo no da permiso de ofrecer. Después del AIR sigue con su plática (quién es y por qué pasó, o una pregunta sobre él o sobre cómo le va), no con producto ni pidiendo el pedido. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Preguntarle cómo le va (la semana, el negocio, el movimiento) es sobre él y no es esta falla. Ya que se presentó y el cliente le contestó, aunque sea con el bloqueo, preguntar por su negocio es descubrimiento y no es esta falla."}$t$::jsonb));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ · 2.1.0 (mensaje 181, 25-nov-2026): pitch_prematuro también aquí, como en el resto del mundo 2: aceptar el bloqueo no da permiso de ofrecer (Emilio).$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.1.0'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.7';
  -- 2.7c: se agrega pitch_prematuro.
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.7c';
  IF ps IS NULL OR ps->>'version' <> '1.0.5' THEN RAISE EXCEPTION 'el guion 2.7c no está en la versión 1.0.5 (está en %)', ps->>'version'; END IF;
  IF jsonb_array_length(ps->'failure_criteria') <> 5 THEN RAISE EXCEPTION 'el guion 2.7c no tiene 5 fallas'; END IF;
  IF jsonb_path_exists(ps, '$.failure_criteria[*] ? (@.id == "pitch_prematuro")') THEN RAISE EXCEPTION 'el guion 2.7c ya tiene pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria}', (ps->'failure_criteria') || jsonb_build_array($t${"id": "pitch_prematuro", "regla_id": "opening.pitch_prematuro", "severity": "critical", "description": "Mete producto, promoción o motivo de venta: aceptar el bloqueo no da permiso de ofrecer. Después del AIR sigue con su plática (quién es y por qué pasó, o una pregunta sobre él o sobre cómo le va), no con producto ni pidiendo el pedido. O le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo le hace con un producto) antes de haberle dicho quién es y por qué pasó, o en el mismo turno en que se lo dice. Preguntarle cómo le va (la semana, el negocio, el movimiento) es sobre él y no es esta falla. Ya que se presentó y el cliente le contestó, aunque sea con el bloqueo, preguntar por su negocio es descubrimiento y no es esta falla. Después del segundo bloqueo, quedar de regresar con dos opciones de día («¿el jueves o el viernes?») no es ofrecer: no es esta falla."}$t$::jsonb));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ · 1.1.0 (mensaje 181, 25-nov-2026): pitch_prematuro también aquí, como en el resto del mundo 2: aceptar el bloqueo no da permiso de ofrecer (Emilio).$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('1.1.0'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.7c';
END
$do$;
