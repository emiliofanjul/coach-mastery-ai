-- Mensaje 77 · fallas espejo: se detectan y se muestran, pero no restan aparte (decisión de Emilio, oct-2026).
-- Agrega "espejo_de" a 13 fallas de nodos normales, regresa turno_sin_pregunta al 2.2 como espejo, y sube la versión de cada guion.
-- Idempotente. CORRER SOLO DESPUÉS de desplegar closer-voice: el schema nuevo es el que acepta "espejo_de".

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE f->>'id' WHEN 'se_encoge' THEN f || jsonb_build_object('espejo_de', 'mindset.regla_10_por_ciento') ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('2.0.1'::text))
WHERE n.id = '1.4';

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        jsonb_build_array('{"id": "turno_sin_pregunta", "regla_id": "close.devuelve_el_volante", "severity": "major", "description": "Un turno del vendedor NO termina en pregunta: cierra con una afirmacion, un comentario o un agradecimiento. Verifica leyendo la ULTIMA frase literal de ese turno. Si termina en signo de interrogacion o es una pregunta implicita, este fallo NO aplica, sin importar cuantas afirmaciones haya dicho antes.", "espejo_de": "story.relevancia_cliente"}'::jsonb)
        || COALESCE((SELECT jsonb_agg(f ORDER BY i)
                       FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i)
                      WHERE f->>'id' <> 'turno_sin_pregunta'), '[]'::jsonb)),
      '{version}', to_jsonb('2.0.2'::text))
WHERE n.id = '2.2';

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE f->>'id' WHEN 'no_se_adelanta' THEN f || jsonb_build_object('espejo_de', 'blocks.pre_emptive_strike') ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('2.0.1'::text))
WHERE n.id = '2.8';

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE f->>'id' WHEN 'ignora_estado' THEN f || jsonb_build_object('espejo_de', 'mindset.rrr') ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('1.0.1'::text))
WHERE n.id = '3.1';

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE f->>'id' WHEN 'ignora_pistas' THEN f || jsonb_build_object('espejo_de', 'discovery.preguntas_capas') WHEN 'pregunta_generica_en_capa2' THEN f || jsonb_build_object('espejo_de', 'discovery.pregunta_especifica') ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('1.3.1'::text))
WHERE n.id = '3.2';

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE f->>'id' WHEN 'conversacion_desconectada' THEN f || jsonb_build_object('espejo_de', 'discovery.escucha_activa') ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('1.0.1'::text))
WHERE n.id = '3.3';

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE f->>'id' WHEN 'explica_sin_pintar' THEN f || jsonb_build_object('espejo_de', 'presentation.pintar_imagenes') WHEN 'imagen_generica' THEN f || jsonb_build_object('espejo_de', 'presentation.pintar_imagenes') WHEN 'presentacion_generica' THEN f || jsonb_build_object('espejo_de', 'presentation.conectar_dolor') ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('1.0.1'::text))
WHERE n.id = '4.3';

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE f->>'id' WHEN 'se_derrumba' THEN f || jsonb_build_object('espejo_de', 'impulse.indiferencia') ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('1.0.1'::text))
WHERE n.id = '4.10';

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE f->>'id' WHEN 'cierra_con_afirmacion' THEN f || jsonb_build_object('espejo_de', 'presentation.tren_si_si') ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('1.0.1'::text))
WHERE n.id = '4.12';

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE f->>'id' WHEN 'no_repite' THEN f || jsonb_build_object('espejo_de', 'objections.rrr_objeciones') ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('2.0.1'::text))
WHERE n.id = '5.6';

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE f->>'id' WHEN 'proximos_pasos_vagos' THEN f || jsonb_build_object('espejo_de', 'consolidation.proteger_venta') ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('1.0.1'::text))
WHERE n.id = '6.2';
