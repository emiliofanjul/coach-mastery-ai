-- Nodo 3.3: la descripción de discovery.preguntas_capas era una copia exacta de
-- la de discovery.escucha_activa. El evaluador calificaba dos veces la escucha y
-- nunca las capas. Se restituye desde la regla discovery.escalera_capas
-- ("capa 1 hechos, capa 2 la puerta, capa 3 el dolor").
UPDATE public.nodes
SET practice_script = jsonb_set(practice_script, '{success_criteria}', (
  SELECT jsonb_agg(CASE WHEN c->>'id' = 'discovery.preguntas_capas'
                        THEN jsonb_set(c, '{description}', to_jsonb('Sostiene el avance del diagnostico por capas: ademas de recoger el dato que el cliente regala, sigue subiendo en el territorio de negocio —de los hechos a la puerta y de ahi al dolor— con preguntas que nacen de las respuestas anteriores. Recoger lo lateral no debe detener el diagnostico.'::text)) ELSE c END)
  FROM jsonb_array_elements(practice_script->'success_criteria') c))
WHERE id = '3.3';

DO $$
DECLARE n int;
BEGIN
  SELECT count(DISTINCT c->>'description') INTO n FROM public.nodes, jsonb_array_elements(practice_script->'success_criteria') c WHERE id = '3.3';
  IF n < 2 THEN RAISE EXCEPTION 'el nodo 3.3 sigue con descripciones duplicadas'; END IF;
END $$;
