CREATE OR REPLACE FUNCTION pg_temp.apertura_v3(ps jsonb, nodo text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE c jsonb; out jsonb := '[]'::jsonb;
BEGIN
  FOR c IN SELECT * FROM jsonb_array_elements(ps->'success_criteria') LOOP
    IF c->>'id' = 'opening.curiosidad_abierta' THEN
      c := jsonb_set(c, '{description}', to_jsonb(CASE WHEN nodo = '1.2' THEN 'Deja abierto el quién eres: abre sin decir su nombre ni el de su empresa. Si no se presentó, este criterio se cumple. Que el cliente termine preguntando quién es confirma que funcionó —y esa pregunta es la puerta natural al Paso 2—, pero que no lo pregunte no le quita nada. Usar el nombre del cliente no es presentarse. Presentarse de entrada no se penaliza: simplemente no acredita este criterio.' ELSE 'Deja abierto el quién eres: abre sin decir su nombre ni el de su empresa. Si no se presentó, este criterio se cumple. Que el cliente termine preguntando quién es confirma que funcionó, pero que no lo pregunte no le quita nada. Usar el nombre del cliente no es presentarse. Presentarse de entrada no se penaliza: simplemente no acredita este criterio.' END));
    ELSIF c->>'id' = 'opening.ice_breaker' AND nodo = '1.6' THEN
      c := jsonb_set(c, '{description}', to_jsonb('Hay un cumplido genuino, un chiste sencillo o un comentario ligero —casual y amable, sin peso comercial— sobre la persona, el lugar o algo en común. Lo que no cumple es un comentario que suena a inspección: contarle la mercancía o describir en frío lo que ve.'::text));
    END IF;
    out := out || jsonb_build_array(c);
  END LOOP;
  RETURN jsonb_set(ps, '{success_criteria}', out);
END $$;

UPDATE public.nodes SET practice_script = pg_temp.apertura_v3(practice_script, id) WHERE id IN ('1.2', '1.6');
UPDATE public.reglas SET resumen = 'Abrir sin identificarse deja al cliente con la pregunta. Que él pregunte quién eres es ganar la introducción: lo confirma, pero no es requisito — si el vendedor no se identificó, cumple. Identificarse es decir TU nombre o el de TU empresa. Usar el nombre DEL CLIENTE ("buenos días, Don Ramón") NO es identificarse: es personalización, y es bueno.', updated_at = now() WHERE id = 'opening.curiosidad_abierta';

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.nodes, jsonb_array_elements(practice_script->'success_criteria') c
  WHERE id IN ('1.2','1.6') AND c->>'id' = 'opening.curiosidad_abierta' AND c->>'description' LIKE '%es el máximo%';
  IF n > 0 THEN RAISE EXCEPTION 'la curiosidad sigue condicionada a la reacción del cliente'; END IF;
  SELECT count(*) INTO n FROM public.nodes, jsonb_array_elements(practice_script->'success_criteria') c
  WHERE id = '1.6' AND c->>'id' = 'opening.ice_breaker' AND c->>'description' LIKE '%meramente descriptivo%';
  IF n > 0 THEN RAISE EXCEPTION 'el ice breaker del 1.6 sigue contradiciendo al Cerebro'; END IF;
END $$;