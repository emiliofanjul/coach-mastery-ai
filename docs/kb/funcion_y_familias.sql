-- Dos ajustes de la red v3.7.0 (oct-2026).
-- 1. La pregunta que cierra la apertura se juzga por función (voz sin signos).
-- 2. El criterio "lee el lugar" del 3.9 decía "qué otras familias" en plural, y
--    el evaluador contaba familias (disputa concedida, caso G30). Ahora dice
--    "al menos una familia" y que no se exige un número.
UPDATE public.reglas SET resumen = 'La apertura tiene sus tres piezas: saludo, una observación y una pregunta que CIERRE el turno y le devuelva la palabra al cliente. Si están las tres y el turno termina con la pregunta —aunque sea de cortesía, como "¿cómo está?"—, este criterio se CUMPLE. Si la pregunta va en medio y el turno termina con un comentario, es parcial: falta que la pregunta cierre. Aquí solo se mide que las piezas estén; la calidad de cada una se mide en su propio criterio (la especificidad en la escalera, la ligereza en el ice breaker). Medirla también aquí sería castigar dos veces el mismo hecho. Si la pregunta es comercial, la pieza igual cuenta: lo comercial lo castiga pitch_prematuro, no la estructura. Castigarlo en los dos lados sería doble castigo. La pregunta que cierra se juzga por función: si la última frase invita a responder (aunque, en voz, no lleve signos) o el cliente la contestó, el turno termina en pregunta.', updated_at = now() WHERE id = 'opening.estructura';

CREATE OR REPLACE FUNCTION pg_temp.lee_el_lugar(ps jsonb) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE c jsonb; out jsonb := '[]'::jsonb;
BEGIN
  FOR c IN SELECT * FROM jsonb_array_elements(ps->'success_criteria') LOOP
    IF c->>'id' = 'discovery.lee_el_lugar' THEN c := jsonb_set(c, '{description}', to_jsonb('Mapea el catálogo del cliente más allá de lo que ya le vende: averigua, de al menos una familia que hoy no le vende, si el cliente la maneja y con quién. No se exige un número de familias. Levantar el pedido y despedirse no cumple, por muy correcta que sea la visita.'::text)); END IF;
    out := out || jsonb_build_array(c);
  END LOOP;
  RETURN jsonb_set(ps, '{success_criteria}', out);
END $$;
UPDATE public.nodes SET practice_script = pg_temp.lee_el_lugar(practice_script) WHERE id = '3.9';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.reglas WHERE id = 'opening.estructura' AND resumen LIKE '%se juzga por función%') THEN RAISE EXCEPTION 'la regla de estructura no se actualizó'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.nodes, jsonb_array_elements(practice_script->'success_criteria') c
                 WHERE id = '3.9' AND c->>'id' = 'discovery.lee_el_lugar' AND c->>'description' LIKE '%No se exige un número de familias%')
  THEN RAISE EXCEPTION 'el criterio del 3.9 no se actualizó'; END IF;
END $$;
