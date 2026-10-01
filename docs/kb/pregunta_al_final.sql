-- La pregunta va al final (decisión de Emilio, oct-2026): es la que le devuelve
-- la palabra al cliente, con control hacia donde quieres que vaya la
-- conversación. Primero al Cerebro (versión nueva completa); de ahí al
-- registro y a los nodos de apertura.
INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
SELECT (SELECT max(version) FROM public.doctrina WHERE is_active) + 1, section_key, order_index, title,
  replace(body, $v$**Y la pregunta que mejor devuelve la palabra es la que sale de la observación y cierra la apertura:** *"veo que no paran, ¿siempre está así de movido?"*. Un *"¿cómo está?"* dentro del saludo cumple, pero si después sigues hablando, el cliente espera a que termines en vez de contestar. Convertir la observación en la pregunta final es como se sube de escalón.$v$, $n$**La pregunta va al final: es la que le devuelve la palabra al cliente, con control hacia donde quieres que vaya la conversación.** La que mejor lo hace sale de la observación y cierra la apertura: *"veo que no paran, ¿siempre está así de movido?"*. Un *"¿cómo está?"* dentro del saludo no basta si después sigues hablando: el cliente espera a que termines en vez de contestar, y la palabra se la devolviste con un comentario, no con una pregunta. Convertir la observación en la pregunta final es como se sube de escalón.$n$), true, created_by
FROM public.doctrina WHERE version = (SELECT max(version) FROM public.doctrina WHERE is_active);

UPDATE public.doctrina SET is_active = false
WHERE is_active AND version < (SELECT max(version) FROM public.doctrina WHERE is_active);

UPDATE public.reglas SET cita_cerebro = 'La pregunta va al final: es la que le devuelve la palabra al cliente', resumen = 'La apertura tiene sus tres piezas: saludo, una observación y una pregunta que CIERRE el turno y le devuelva la palabra al cliente. Si están las tres y el turno termina con la pregunta —aunque sea de cortesía, como "¿cómo está?"—, este criterio se CUMPLE. Si la pregunta va en medio y el turno termina con un comentario, es parcial: falta que la pregunta cierre. Aquí solo se mide que las piezas estén; la calidad de cada una se mide en su propio criterio (la especificidad en la escalera, la ligereza en el ice breaker). Medirla también aquí sería castigar dos veces el mismo hecho. Si la pregunta es comercial, la pieza igual cuenta: lo comercial lo castiga pitch_prematuro, no la estructura. Castigarlo en los dos lados sería doble castigo.', updated_at = now() WHERE id = 'opening.estructura';

CREATE OR REPLACE FUNCTION pg_temp.estructura_final(ps jsonb, nodo text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE c jsonb; out jsonb := '[]'::jsonb;
BEGIN
  FOR c IN SELECT * FROM jsonb_array_elements(ps->'success_criteria') LOOP
    IF c->>'id' = 'opening.estructura_apertura' THEN
      c := jsonb_set(c, '{description}', to_jsonb(CASE
    WHEN nodo = '1.2' THEN 'La apertura tiene sus tres piezas: saludo con energía, una observación y una pregunta que CIERRE el turno y le devuelva la palabra al cliente. Si están las tres y el turno termina con la pregunta —aunque sea de cortesía—, este criterio se cumple. Si la pregunta va en medio y el turno termina con un comentario, es parcial: falta que la pregunta cierre. La calidad de la pregunta y de la observación no se mide aquí: se mide en la escalera de la especificidad. Sin producto, sin motivo de venta. La identificación con nombre y empresa no se requiere aquí y su ausencia no se penaliza.'
    WHEN nodo = '1.4' THEN 'Mantiene la estructura de apertura aprendida: saludo con energía, observación real y una pregunta que cierre el turno. La presión del cliente ocupado no debe desarmar la fórmula.'
    WHEN nodo = '1.6' THEN 'Las tres piezas presentes: saludo con energía, observación real y una pregunta que cierre el turno. Sin producto ni motivo de venta. Identificarse no se requiere aquí: eso es trabajo del Paso 2.'
    WHEN nodo = '7.0' THEN 'Apertura completa y calibrada: saludo + observación específica + una pregunta que cierre el turno y le devuelva la palabra, sin producto, con seguridad tipo gasman.'
        ELSE c->>'description' END));
    END IF;
    out := out || jsonb_build_array(c);
  END LOOP;
  RETURN jsonb_set(ps, '{success_criteria}', out);
END $$;
UPDATE public.nodes SET practice_script = pg_temp.estructura_final(practice_script, id) WHERE id IN ('1.2','1.4','1.6','7.0');

DO $$
DECLARE v int; n int;
BEGIN
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  SELECT count(*) INTO n FROM public.doctrina WHERE is_active;
  IF n <> 7 THEN RAISE EXCEPTION 'la versión % del Cerebro tiene % secciones activas, no 7', v, n; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.doctrina WHERE version = v AND body LIKE '%La pregunta va al final: es la que le devuelve la palabra%') THEN RAISE EXCEPTION 'el Cerebro no recibió el cambio'; END IF;
  IF EXISTS (SELECT 1 FROM public.doctrina WHERE version = v AND body LIKE '%dentro del saludo cumple, pero%') THEN RAISE EXCEPTION 'quedó el texto viejo'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.reglas WHERE id = 'opening.estructura' AND resumen LIKE '%CIERRE el turno%') THEN RAISE EXCEPTION 'la regla no se actualizó'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.doctrina d, public.reglas r WHERE d.version = v AND r.id = 'opening.estructura' AND d.body LIKE '%' || r.cita_cerebro || '%')
  THEN RAISE EXCEPTION 'la cita de opening.estructura no está en el Cerebro vigente'; END IF;
  SELECT count(*) INTO n FROM public.nodes, jsonb_array_elements(practice_script->'success_criteria') c
  WHERE id IN ('1.2','1.4','1.6','7.0') AND c->>'id' = 'opening.estructura_apertura' AND c->>'description' ILIKE '%cierre el turno%';
  IF n <> 4 THEN RAISE EXCEPTION 'solo % de 4 nodos quedaron actualizados', n; END IF;
END $$;
