-- Mensaje 182 · Un bloqueo no es contestarte (Emilio, 25-nov-2026).
-- Después de aceptar un bloqueo, la pregunta va sobre él o sobre cómo le va; las de su negocio esperan a que entre a la plática.
-- Preguntarle cómo le va es sobre él, aunque mencione sus productos. Aceptar el bloqueo no da permiso de ofrecer.
-- Solo datos: Cerebro (versión nueva), la regla opening.pitch_prematuro, dos partes de la guía del vendedor,
-- los guiones 2.7 y 2.7c (agregan pitch_prematuro) y el 2.10 (su pitch_prematuro dice lo mismo que la regla).
-- Para la herramienta de la base de Lovable: sin BEGIN/COMMIT. Si algo no está como se espera, falla en su guarda y NO cambia nada.
DO $do$
DECLARE v int; n int; b text; ps jsonb; t text;
BEGIN
  -- 1. El Cerebro: versión nueva completa, con la sección 'pasos' aclarada.
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  SELECT count(*) INTO n FROM public.doctrina WHERE is_active AND version = v;
  IF n <> 7 THEN RAISE EXCEPTION 'la versión % del Cerebro tiene % secciones activas, no 7', v, n; END IF;
  SELECT body INTO b FROM public.doctrina WHERE is_active AND version = v AND section_key = 'pasos';
  IF strpos(b, $t$Un bloqueo no es contestarte: si te dice$t$) > 0 THEN RAISE EXCEPTION 'el Cerebro activo ya tiene el cambio del 182: no se aplica dos veces'; END IF;
  IF (length(b) - length(replace(b, $t$Eso ya es descubrimiento. Antes de que sepa quién eres$t$, ''))) / length($t$Eso ya es descubrimiento. Antes de que sepa quién eres$t$) <> 1 THEN RAISE EXCEPTION 'Cerebro: el texto viejo no aparece exactamente una vez'; END IF;
  b := replace(b, $t$Eso ya es descubrimiento. Antes de que sepa quién eres$t$, $t$Eso ya es descubrimiento. Un bloqueo no es contestarte: si te dice *"ahorita ando ocupado"* o *"no me interesa"*, lo aceptas y sigues con una pregunta sobre él o sobre cómo le va —*"¿así ha estado toda la semana?"*—; las de su negocio esperan a que entre a la plática. Preguntarle cómo le va —la semana, el negocio, la venta— es sobre él aunque mencione sus productos; preguntarle con quién se surte o cómo escoge a su proveedor ya es su operación. Antes de que sepa quién eres$t$);
  INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
  SELECT v + 1, section_key, order_index, title, CASE WHEN section_key = 'pasos' THEN b ELSE body END, true, created_by
  FROM public.doctrina WHERE is_active AND version = v;
  UPDATE public.doctrina SET is_active = false WHERE is_active AND version = v;
  -- 2. La regla opening.pitch_prematuro: un bloqueo no es contestarte; cómo le va es sobre él.
  SELECT resumen INTO t FROM public.reglas WHERE id = 'opening.pitch_prematuro';
  IF t IS NULL OR (length(t) - length(replace(t, $t$Ya que te presentaste y el cliente te contestó, preguntar por su operación es descubrimiento y no es esto.$t$, ''))) / length($t$Ya que te presentaste y el cliente te contestó, preguntar por su operación es descubrimiento y no es esto.$t$) <> 1 THEN RAISE EXCEPTION 'opening.pitch_prematuro no tiene el texto esperado'; END IF;
  t := replace(t, $t$Ya que te presentaste y el cliente te contestó, preguntar por su operación es descubrimiento y no es esto.$t$, $t$Ya que te presentaste y el cliente te contestó, preguntar por su operación es descubrimiento y no es esto. Un bloqueo («ahorita ando ocupado», «no me interesa») no es contestarte: después de aceptarlo, la pregunta va sobre él o sobre cómo le va, y preguntarle por su operación ahí todavía es antes de tiempo.$t$);
  IF t IS NULL OR (length(t) - length(replace(t, $t$Tampoco una pregunta sobre él o sobre cómo le va.$t$, ''))) / length($t$Tampoco una pregunta sobre él o sobre cómo le va.$t$) <> 1 THEN RAISE EXCEPTION 'opening.pitch_prematuro no tiene el texto esperado'; END IF;
  t := replace(t, $t$Tampoco una pregunta sobre él o sobre cómo le va.$t$, $t$Tampoco una pregunta sobre él o sobre cómo le va (la semana, el negocio, la venta, el movimiento), aunque mencione su negocio o sus productos: preguntarle cómo le va no es pedirle información de su operación.$t$);
  UPDATE public.reglas SET resumen = t, updated_at = now() WHERE id = 'opening.pitch_prematuro';
  -- 3. La guía del vendedor: el molde del paso 2 y los bloqueos dicen lo mismo.
  SELECT texto INTO t FROM public.guia_del_vendedor WHERE clave = 'paso_2' AND activa;
  IF t IS NULL OR (length(t) - length(replace(t, $t$Ya que te contestó, empiezan las preguntas de su negocio: eso ya es descubrimiento.$t$, ''))) / length($t$Ya que te contestó, empiezan las preguntas de su negocio: eso ya es descubrimiento.$t$) <> 1 THEN RAISE EXCEPTION 'la guía (paso_2) no tiene el texto esperado'; END IF;
  UPDATE public.guia_del_vendedor SET texto = replace(texto, $t$Ya que te contestó, empiezan las preguntas de su negocio: eso ya es descubrimiento.$t$, $t$Ya que te contestó, empiezan las preguntas de su negocio: eso ya es descubrimiento. Un bloqueo no es contestarte: después de aceptarlo, la pregunta sigue siendo sobre él o sobre cómo le va.$t$) WHERE clave = 'paso_2';
  SELECT texto INTO t FROM public.guia_del_vendedor WHERE clave = 'cuando_bloqueos' AND activa;
  IF t IS NULL OR (length(t) - length(replace(t, $t$Lo aceptas («claro»), no lo discutes y sigues con tu plática en el mismo turno, sin pedir permiso.$t$, ''))) / length($t$Lo aceptas («claro»), no lo discutes y sigues con tu plática en el mismo turno, sin pedir permiso.$t$) <> 1 THEN RAISE EXCEPTION 'la guía (cuando_bloqueos) no tiene el texto esperado'; END IF;
  UPDATE public.guia_del_vendedor SET texto = replace(texto, $t$Lo aceptas («claro»), no lo discutes y sigues con tu plática en el mismo turno, sin pedir permiso.$t$, $t$Lo aceptas («claro»), no lo discutes y sigues con tu plática en el mismo turno, sin pedir permiso: con una pregunta sobre él o sobre cómo le va, no de su negocio ni ofreciéndole nada.$t$) WHERE clave = 'cuando_bloqueos';
  -- 4. Los guiones: 2.7 y 2.7c califican pitch_prematuro; el 2.10 dice lo mismo que la regla.
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.7';
  IF ps IS NULL OR ps->>'version' <> '2.0.4' THEN RAISE EXCEPTION 'el guion 2.7 no está en la versión 2.0.4 (está en %)', ps->>'version'; END IF;
  IF jsonb_array_length(ps->'failure_criteria') <> 4 THEN RAISE EXCEPTION 'el guion 2.7 no tiene 4 fallas'; END IF;
  IF jsonb_path_exists(ps, '$.failure_criteria[*] ? (@.id == "pitch_prematuro")') THEN RAISE EXCEPTION 'el guion 2.7 ya tiene pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria}', (ps->'failure_criteria') || jsonb_build_array($t${"id": "pitch_prematuro", "regla_id": "opening.pitch_prematuro", "severity": "critical", "description": "Mete producto, promoción o motivo de venta, o le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo escoge a quién comprarle) antes de tiempo. Aceptar el bloqueo no da permiso de ofrecer ni de preguntarle por su negocio: un bloqueo no es contestarte. Después del AIR sigue con su plática, con una pregunta sobre él o sobre cómo le va; no con producto, no pidiendo el pedido y no con preguntas de su operación. Tampoco le pregunta por su operación antes de haberle dicho quién es y por qué pasó. Preguntarle cómo le va (la semana, el negocio, la venta, el movimiento) es sobre él aunque mencione sus productos, y no es esta falla."}$t$::jsonb));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ · 2.1.1 (mensaje 182, 25-nov-2026): pitch_prematuro también aquí, como en el resto del mundo 2. Un bloqueo no es contestarte: después del AIR, la pregunta va sobre él o sobre cómo le va (Emilio).$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.1.1'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.7';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.7c';
  IF ps IS NULL OR ps->>'version' <> '1.0.5' THEN RAISE EXCEPTION 'el guion 2.7c no está en la versión 1.0.5 (está en %)', ps->>'version'; END IF;
  IF jsonb_array_length(ps->'failure_criteria') <> 5 THEN RAISE EXCEPTION 'el guion 2.7c no tiene 5 fallas'; END IF;
  IF jsonb_path_exists(ps, '$.failure_criteria[*] ? (@.id == "pitch_prematuro")') THEN RAISE EXCEPTION 'el guion 2.7c ya tiene pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria}', (ps->'failure_criteria') || jsonb_build_array($t${"id": "pitch_prematuro", "regla_id": "opening.pitch_prematuro", "severity": "critical", "description": "Mete producto, promoción o motivo de venta, o le pregunta por su operación comercial (su proveedor, sus precios, sus marcas, qué se le mueve, cómo escoge a quién comprarle) antes de tiempo. Aceptar el bloqueo no da permiso de ofrecer ni de preguntarle por su negocio: un bloqueo no es contestarte. Después del AIR sigue con su plática, con una pregunta sobre él o sobre cómo le va; no con producto, no pidiendo el pedido y no con preguntas de su operación. Tampoco le pregunta por su operación antes de haberle dicho quién es y por qué pasó. Preguntarle cómo le va (la semana, el negocio, la venta, el movimiento) es sobre él aunque mencione sus productos, y no es esta falla. Después del segundo bloqueo, quedar de regresar con dos opciones de día («¿el jueves o el viernes?») no es ofrecer: no es esta falla."}$t$::jsonb));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ · 1.1.1 (mensaje 182, 25-nov-2026): pitch_prematuro también aquí, como en el resto del mundo 2. Un bloqueo no es contestarte: después del AIR, la pregunta va sobre él o sobre cómo le va (Emilio).$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('1.1.1'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.7c';
  SELECT practice_script INTO ps FROM public.nodes WHERE id = '2.10';
  IF ps IS NULL OR ps->>'version' <> '2.1.6' THEN RAISE EXCEPTION 'el guion 2.10 no está en la versión 2.1.6 (está en %)', ps->>'version'; END IF;
  t := ps #>> '{failure_criteria,6,description}';
  IF ps #>> '{failure_criteria,6,id}' IS DISTINCT FROM 'pitch_prematuro' OR t IS NULL OR (length(t) - length(replace(t, $t$Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla.$t$, ''))) / length($t$Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla.$t$) <> 1 THEN RAISE EXCEPTION 'el guion 2.10 no tiene la descripción esperada de pitch_prematuro'; END IF;
  ps := jsonb_set(ps, '{failure_criteria,6,description}', to_jsonb(replace(t, $t$Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla.$t$, $t$Ya que se presentó y el cliente le contestó, preguntar por su negocio es descubrimiento y no es esta falla. Un bloqueo no es contestarte: después de aceptarlo, la pregunta va sobre él o sobre cómo le va.$t$)));
  ps := jsonb_set(ps, '{notes}', to_jsonb(coalesce(ps->>'notes', '') || $t$ · 2.1.7 (mensaje 182, 25-nov-2026): un bloqueo no es contestarte, como la regla (Emilio).$t$));
  ps := jsonb_set(ps, '{version}', to_jsonb('2.1.7'::text));
  UPDATE public.nodes SET practice_script = ps WHERE id = '2.10';
  -- 5. Verificación.
  SELECT count(*) INTO n FROM public.doctrina WHERE is_active;
  IF n <> 7 THEN RAISE EXCEPTION 'el Cerebro activo tiene % secciones, no 7', n; END IF;
END
$do$;
