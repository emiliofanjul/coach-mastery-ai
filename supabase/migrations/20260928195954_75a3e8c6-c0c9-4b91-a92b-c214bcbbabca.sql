-- ============================================================
-- "Presentarse" definido en primera persona, sin pronombres ambiguos.
-- El texto anterior decía "sin decir SU nombre" (¿del vendedor o del cliente?)
-- y la regla "decir TU nombre" (¿de quién?). El evaluador seguía leyendo
-- "Buenos días, Don Ramón" o "sir" como si el vendedor se presentara.
-- Y la especificidad deja explícito que no mide la ligereza (Cerebro:
-- "cuatro cajas de filtros… es muy específico, y suena a inspección").
-- ============================================================
UPDATE public.reglas SET resumen = 'Abrir sin identificarse deja al cliente con la pregunta. Que él pregunte quién eres es ganar la introducción: lo confirma, pero no es requisito — si el vendedor no se identificó, cumple. Identificarse es que el vendedor diga EN PRIMERA PERSONA quién es: "soy…", "me llamo…", "vengo de…", o el nombre de la empresa que representa. Usar el nombre DEL CLIENTE, o dirigirse a él con "don", "señor" o "sir", NO es identificarse: es personalización, y es bueno.', updated_at = now() WHERE id = 'opening.curiosidad_abierta';
UPDATE public.reglas SET resumen = 'Abrir identificándose ANTES de conectar. El orden es el problema, no el dato: identificarse después del ice breaker ya es Paso 2. Identificarse es que el vendedor diga EN PRIMERA PERSONA quién es: "soy…", "me llamo…", "vengo de…", o el nombre de la empresa que representa. Usar el nombre DEL CLIENTE, o dirigirse a él con "don", "señor" o "sir", NO es identificarse: es personalización, y es bueno.', updated_at = now() WHERE id = 'opening.identificacion_prematura';
UPDATE public.reglas SET resumen = 'La escalera de la especificidad: la observación y la pregunta se miden por qué tan específicas son para ESE cliente en ESE momento — ¿se la harías a cualquiera? Escalón 1, de cortesía ("¿cómo está?"): acredita un tercio. Escalón 2, del entorno ("veo que no paran, ¿siempre está así de movido?"): acredita completo con cliente nuevo. Escalón 3, de él ("¿cómo sigue? ¿va mejorando?"): la meta con un recurrente. Las mismas palabras pueden estar en escalones distintos: lo que sube el escalón es qué tanto sabe de él. Un escalón bajo NO es una falla: se acredita menos y se muestra cómo subir. El escalón 3 exige historia REAL con el cliente: si la conversación no muestra ninguna, no está disponible y no se sugiere — jamás inventando un recuerdo. LA PRUEBA DEL ESCALÓN 2: nombra algo concreto que viste ahí —el movimiento, que está lleno, un cambio, algo nuevo—. Un adjetivo genérico ("qué bien se ve el local", "qué bonito") se lo dirías a cualquiera: es escalón 1. La especificidad NO mide si el comentario es ligero o si suena a inspección: eso lo mide el ice breaker. Contarle la mercancía ("cuatro cajas de filtros de una marca y dos de otra") es muy específico —escalón 2— aunque no rompa el hielo.', updated_at = now() WHERE id = 'opening.especificidad';

CREATE OR REPLACE FUNCTION pg_temp.cur_v3(ps jsonb, nodo text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE c jsonb; out jsonb := '[]'::jsonb;
BEGIN
  FOR c IN SELECT * FROM jsonb_array_elements(ps->'success_criteria') LOOP
    IF c->>'id' = 'opening.curiosidad_abierta' THEN
      c := jsonb_set(c, '{description}', to_jsonb(CASE WHEN nodo = '1.2' THEN 'Deja abierto quién es el vendedor: abre sin presentarse, es decir, sin decir en primera persona su propio nombre ni el de la empresa que representa. Si no se presentó, este criterio se cumple. Dirigirse al cliente por su nombre o con ''don'', ''señor'' o ''sir'' NO es presentarse. Que el cliente termine preguntando quién es confirma que funcionó —y esa pregunta es la puerta natural al Paso 2—, pero que no lo pregunte no le quita nada. Presentarse de entrada no se penaliza: simplemente no acredita este criterio.' ELSE 'Deja abierto quién es el vendedor: abre sin presentarse, es decir, sin decir en primera persona su propio nombre ni el de la empresa que representa. Si no se presentó, este criterio se cumple. Dirigirse al cliente por su nombre o con ''don'', ''señor'' o ''sir'' NO es presentarse. Que el cliente termine preguntando quién es confirma que funcionó, pero que no lo pregunte no le quita nada. Presentarse de entrada no se penaliza: simplemente no acredita este criterio.' END));
    END IF;
    out := out || jsonb_build_array(c);
  END LOOP;
  RETURN jsonb_set(ps, '{success_criteria}', out);
END $$;
UPDATE public.nodes SET practice_script = pg_temp.cur_v3(practice_script, id) WHERE id IN ('1.2','1.6');

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.reglas WHERE resumen LIKE '%TU nombre%';
  IF n > 0 THEN RAISE EXCEPTION 'quedan reglas con "TU nombre"'; END IF;
  SELECT count(*) INTO n FROM public.nodes, jsonb_array_elements(practice_script->'success_criteria') c
  WHERE id IN ('1.2','1.6') AND c->>'id' = 'opening.curiosidad_abierta' AND c->>'description' NOT LIKE '%en primera persona%';
  IF n > 0 THEN RAISE EXCEPTION 'la curiosidad no quedó definida en primera persona'; END IF;
END $$;
