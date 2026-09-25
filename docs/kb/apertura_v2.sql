-- ============================================================
-- LA APERTURA: una regla, un concepto — y la escalera de la especificidad
--
-- El primer reporte del harness encontró que tres reglas de la apertura
-- mezclaban dos conceptos cada una:
--   · pitch_prematuro decía "revelar a qué vienes", que es IDENTIFICARSE
--     (Paso 2), y castigó "ando visitando talleres" dicho después de conectar.
--     Lo que es pitch prematuro es hacer TRABAJO COMERCIAL antes de tiempo.
--   · sin_pregunta y pregunta_cerrada compartían una regla que decía
--     "pregunta de sí o no, o sin pregunta": el evaluador marcaba sin_pregunta
--     aunque el vendedor hubiera preguntado "¿cómo está?".
--   · estructura y personalización apuntaban a la misma regla.
-- Y la misma apertura evaluada dos veces sacó 92 y 55.
--
-- Decisión de Emilio (sept-2026): "¿cómo está?" SÍ cuenta como pregunta — es
-- el escalón 1 de la escalera de la especificidad (Cerebro, Paso 1). Una
-- pregunta de cortesía no es una falla: es el primer escalón. Por eso la
-- observación genérica deja de ser falla y pasa a ser el escalón 1.
--
-- Requisito: la sección "La escalera de la especificidad" ya debe estar en la
-- tabla doctrina — las reglas nuevas la citan.
-- ============================================================

-- ── 1. Reglas: nuevas y reescritas ────────────────────────────
INSERT INTO public.reglas (id, paso, tipo, canal, procedencia, resumen, cita_cerebro, severidad_default) VALUES
  ('opening.sin_pregunta', 1, 'error', 'universal', 'CAMPO', 'No hay ninguna pregunta que le devuelva la palabra al cliente. LA PRUEBA: ¿hay alguna frase que el cliente pueda contestar? Si la hay —aunque sea de cortesía, como "¿cómo está?"— esta falla NO aplica: la calidad de la pregunta se mide en la escalera de la especificidad, no aquí.', 'sin ninguna pregunta, el cliente no tiene qué contestar y la conversación se muere ahí', 'major'),
  ('opening.especificidad', 1, 'requisito', 'universal', 'CAMPO', 'La escalera de la especificidad: la observación y la pregunta se miden por qué tan específicas son para ESE cliente en ESE momento — ¿se la harías a cualquiera? Escalón 1, de cortesía ("¿cómo está?"): acredita un tercio. Escalón 2, del entorno ("veo que no paran, ¿siempre está así de movido?"): acredita completo con cliente nuevo. Escalón 3, de él ("¿cómo sigue? ¿va mejorando?"): la meta con un recurrente. Las mismas palabras pueden estar en escalones distintos: lo que sube el escalón es qué tanto sabe de él. Un escalón bajo NO es una falla: se acredita menos y se muestra cómo subir.', 'La observación y la pregunta de la apertura se miden igual', NULL),
  ('opening.pitch_prematuro', 1, 'error', 'universal', 'FUENTE', 'Hacer trabajo comercial antes de tiempo. LA PRUEBA: ¿esta frase le ofrece algo o le pide información de su operación comercial? Si la respuesta es sí, es pitch prematuro, aunque no nombre ningún producto. Ejemplos que ilustran —no delimitan—: ofrecer producto o promoción; preguntar por su proveedor, sus precios, sus marcas, su inventario, sus volúmenes o cada cuánto le surten. NO es esto decir quién eres o por qué pasaste ("ando visitando talleres de la zona"): eso es presentarse, y su momento es el Paso 2. Tampoco una pregunta sobre él o sobre cómo le va.', 'Aquí no dices quién eres ni a qué vienes. Eso es el Paso 2. Confundirlos es el error doctrinal más común', 'critical'),
  ('opening.pregunta_cerrada', 1, 'error', 'universal', 'FUENTE', 'Cerrar la apertura con una pregunta de sí o no. Le entrega al cliente la respuesta más fácil, que es no. (No hacer ninguna pregunta es otra falla: opening.sin_pregunta.)', 'le ofreces una salida que no le cuesta nada tomar', 'major')
ON CONFLICT (id) DO UPDATE SET
  paso = EXCLUDED.paso, tipo = EXCLUDED.tipo, canal = EXCLUDED.canal, procedencia = EXCLUDED.procedencia,
  resumen = EXCLUDED.resumen, cita_cerebro = EXCLUDED.cita_cerebro, severidad_default = EXCLUDED.severidad_default,
  updated_at = now();

-- ── 2. El skill de personalización ahora operacionaliza la escalera ──
UPDATE public.skills SET regla_id = 'opening.especificidad' WHERE id = 'opening.personalizacion';

-- ── 3. Nodos de la apertura ───────────────────────────────────
-- Función auxiliar local: aplica los cambios a un practice_script.
CREATE OR REPLACE FUNCTION pg_temp.apertura_v2(ps jsonb, nodo text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE r jsonb := ps; c jsonb; out jsonb;
BEGIN
  -- éxito: personalización → escalera; en 1.2 se reescriben las dos descripciones
  out := '[]'::jsonb;
  FOR c IN SELECT * FROM jsonb_array_elements(r->'success_criteria') LOOP
    IF c->>'id' = 'opening.personalizacion' THEN
      c := jsonb_set(c, '{regla_id}', '"opening.especificidad"');
      IF nodo = '1.2' THEN c := jsonb_set(c, '{description}', to_jsonb('La observacion y la pregunta se miden en la escalera de la especificidad: se la harias a cualquiera? Escalon 1, de cortesia (buen dia, como esta): acredita un tercio. Escalon 2, algo de ESA persona o ESE lugar en ESE momento: acredita completo. Una observacion inventada que el cliente no confirma no cumple.'::text)); END IF;
    ELSIF c->>'id' = 'opening.estructura_apertura' AND nodo = '1.2' THEN
      c := jsonb_set(c, '{description}', to_jsonb('La apertura tiene las tres piezas: saludo con energia, observacion, y una pregunta que le devuelva la palabra. La mejor forma es que la pregunta salga de la observacion y cierre la apertura; una pregunta de cortesia dentro del saludo cumple lo minimo. Sin producto, sin motivo de venta. La identificacion con nombre y empresa no se requiere aqui y su ausencia no se penaliza.'::text));
    END IF;
    out := out || jsonb_build_array(c);
  END LOOP;
  r := jsonb_set(r, '{success_criteria}', out);

  -- falla: sin la observación genérica (ahora es escalón 1); sin_pregunta con regla propia
  out := '[]'::jsonb;
  FOR c IN SELECT * FROM jsonb_array_elements(r->'failure_criteria') LOOP
    CONTINUE WHEN c->>'id' IN ('observacion_generica', 'observacion_plana');
    IF c->>'id' = 'sin_pregunta' THEN
      c := jsonb_set(c, '{regla_id}', '"opening.sin_pregunta"');
    END IF;
    out := out || jsonb_build_array(c);
  END LOOP;
  RETURN jsonb_set(r, '{failure_criteria}', out);
END $$;

UPDATE public.nodes SET practice_script = pg_temp.apertura_v2(practice_script, id)
WHERE id IN ('1.2', '1.5', '1.6');

-- ── 4. Verificación ───────────────────────────────────────────
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.nodes, jsonb_array_elements(practice_script->'failure_criteria') c
  WHERE id IN ('1.2','1.5','1.6') AND c->>'id' IN ('observacion_generica','observacion_plana');
  IF n > 0 THEN RAISE EXCEPTION 'quedaron % criterios de observación genérica', n; END IF;

  SELECT count(*) INTO n FROM public.nodes, jsonb_array_elements(practice_script->'success_criteria') c
  WHERE id IN ('1.2','1.5','1.6') AND c->>'id' = 'opening.personalizacion' AND c->>'regla_id' <> 'opening.especificidad';
  IF n > 0 THEN RAISE EXCEPTION '% criterios de personalización sin la escalera', n; END IF;

  SELECT count(*) INTO n FROM public.nodes, jsonb_array_elements(practice_script->'failure_criteria') c
  WHERE c->>'id' = 'sin_pregunta' AND c->>'regla_id' <> 'opening.sin_pregunta';
  IF n > 0 THEN RAISE EXCEPTION '% sin_pregunta todavía comparten regla con pregunta_cerrada', n; END IF;

  SELECT count(*) INTO n FROM public.skills WHERE id = 'opening.personalizacion' AND regla_id = 'opening.especificidad';
  IF n <> 1 THEN RAISE EXCEPTION 'el skill opening.personalizacion no quedó ligado a la escalera'; END IF;
END $$;
