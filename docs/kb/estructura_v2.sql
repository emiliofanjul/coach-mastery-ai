-- ============================================================
-- La estructura de la apertura con su propia regla, y la prueba del escalón 2
--
-- La estructura compartía regla con el ice breaker: el evaluador la leía a
-- través del lente de la ligereza, y su texto en el 1.2 decía que una pregunta
-- de cortesía "cumple lo mínimo" — que el modelo leía unas veces como cumple y
-- otras como parcial (G10 sacó 100 en una corrida y 53 en las otras). Y medía
-- la calidad de la pregunta, que ya se mide en la escalera: doble castigo.
--
-- Decisión de Emilio (sept-2026) para el escalón 2: nombra algo concreto que
-- viste ahí; un adjetivo genérico ("qué bien se ve el local") es escalón 1.
-- ============================================================
INSERT INTO public.reglas (id, paso, tipo, canal, procedencia, resumen, cita_cerebro, severidad_default) VALUES
  ('opening.estructura', 1, 'requisito', 'universal', 'CAMPO', 'La apertura tiene sus tres piezas: saludo, una observación y alguna pregunta que le devuelva la palabra. Si están las tres —aunque la pregunta sea de cortesía, como "¿cómo está?"—, este criterio se CUMPLE. Aquí solo se mide que las piezas estén; la calidad de cada una se mide en su propio criterio (la especificidad en la escalera, la ligereza en el ice breaker). Medirla también aquí sería castigar dos veces el mismo hecho.', 'dentro del saludo cumple', NULL)
ON CONFLICT (id) DO UPDATE SET resumen = EXCLUDED.resumen, cita_cerebro = EXCLUDED.cita_cerebro, updated_at = now();

UPDATE public.reglas SET resumen = 'La escalera de la especificidad: la observación y la pregunta se miden por qué tan específicas son para ESE cliente en ESE momento — ¿se la harías a cualquiera? Escalón 1, de cortesía ("¿cómo está?"): acredita un tercio. Escalón 2, del entorno ("veo que no paran, ¿siempre está así de movido?"): acredita completo con cliente nuevo. Escalón 3, de él ("¿cómo sigue? ¿va mejorando?"): la meta con un recurrente. Las mismas palabras pueden estar en escalones distintos: lo que sube el escalón es qué tanto sabe de él. Un escalón bajo NO es una falla: se acredita menos y se muestra cómo subir. El escalón 3 exige historia REAL con el cliente: si la conversación no muestra ninguna, no está disponible y no se sugiere — jamás inventando un recuerdo. LA PRUEBA DEL ESCALÓN 2: nombra algo concreto que viste ahí —el movimiento, que está lleno, un cambio, algo nuevo—. Un adjetivo genérico ("qué bien se ve el local", "qué bonito") se lo dirías a cualquiera: es escalón 1.', updated_at = now() WHERE id = 'opening.especificidad';

UPDATE public.skills SET regla_id = 'opening.estructura' WHERE id = 'opening.estructura_apertura';

CREATE OR REPLACE FUNCTION pg_temp.estructura_v2(ps jsonb, nodo text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE c jsonb; out jsonb := '[]'::jsonb;
BEGIN
  FOR c IN SELECT * FROM jsonb_array_elements(ps->'success_criteria') LOOP
    IF c->>'id' = 'opening.estructura_apertura' THEN
      c := jsonb_set(c, '{regla_id}', '"opening.estructura"');
      IF nodo = '1.2' THEN c := jsonb_set(c, '{description}', to_jsonb('La apertura tiene sus tres piezas: saludo con energia, una observacion y alguna pregunta que le devuelva la palabra. Si estan las tres, aunque la pregunta sea de cortesia, este criterio se cumple. La calidad de la pregunta y de la observacion no se mide aqui: se mide en la escalera de la especificidad. Sin producto, sin motivo de venta. La identificacion con nombre y empresa no se requiere aqui y su ausencia no se penaliza.'::text)); END IF;
    END IF;
    out := out || jsonb_build_array(c);
  END LOOP;
  RETURN jsonb_set(ps, '{success_criteria}', out);
END $$;

UPDATE public.nodes SET practice_script = pg_temp.estructura_v2(practice_script, id)
WHERE practice_script->'success_criteria' @> '[{"id":"opening.estructura_apertura"}]';

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.nodes, jsonb_array_elements(practice_script->'success_criteria') c
  WHERE c->>'id' = 'opening.estructura_apertura' AND c->>'regla_id' <> 'opening.estructura';
  IF n > 0 THEN RAISE EXCEPTION '% criterios de estructura siguen en otra regla', n; END IF;
  SELECT count(*) INTO n FROM public.skills WHERE id = 'opening.estructura_apertura' AND regla_id = 'opening.estructura';
  IF n <> 1 THEN RAISE EXCEPTION 'el skill de estructura no quedó ligado'; END IF;
  SELECT count(*) INTO n FROM public.reglas WHERE id = 'opening.especificidad' AND resumen LIKE '%nombra algo concreto%';
  IF n <> 1 THEN RAISE EXCEPTION 'la prueba del escalón 2 no quedó escrita'; END IF;
END $$;
