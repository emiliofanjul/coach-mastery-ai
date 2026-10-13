-- Mensaje 76 · nodo 2.2: se quita la falla turno_sin_pregunta (decisión de Emilio, oct-2026).
-- Medía lo mismo que el criterio story.relevancia_cliente: castigaba dos veces
-- el mismo turno, y el evaluador a veces la marcaba y a veces no. Idempotente.
UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        COALESCE((SELECT jsonb_agg(f ORDER BY i)
                    FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i)
                   WHERE f->>'id' <> 'turno_sin_pregunta'), '[]'::jsonb)),
      '{version}', to_jsonb('2.0.1'::text))
WHERE n.id = '2.2';
