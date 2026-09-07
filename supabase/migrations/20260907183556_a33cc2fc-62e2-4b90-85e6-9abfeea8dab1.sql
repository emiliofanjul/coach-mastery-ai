-- Cada pregunta de quiz apunta a la regla que evalúa. Generado del mapeo manual.

UPDATE public.node_quiz_questions SET regla_id = 'opening.pitch_prematuro' WHERE node_id = '1.0' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'story.desvio_con_regreso' WHERE node_id = '1.0' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'story.sale_sin_regresar' WHERE node_id = '1.0' AND question_order = 3;
UPDATE public.node_quiz_questions SET regla_id = 'opening.energia_verbal' WHERE node_id = '1.1' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'opening.see' WHERE node_id = '1.1' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'opening.see' WHERE node_id = '1.1' AND question_order = 3;
UPDATE public.node_quiz_questions SET regla_id = 'opening.pide_permiso' WHERE node_id = '1.3' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'opening.gasman' WHERE node_id = '1.3' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'opening.see' WHERE node_id = '1.3' AND question_order = 3;
UPDATE public.node_quiz_questions SET regla_id = 'story.kiss' WHERE node_id = '2.0' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'story.pregunta_despues' WHERE node_id = '2.0' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'relationship.cpr' WHERE node_id = '2.3' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'relationship.cpr' WHERE node_id = '2.3' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'relationship.forms' WHERE node_id = '2.4' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'relationship.interes_fingido' WHERE node_id = '2.4' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'blocks.bloqueo_vs_objecion' WHERE node_id = '2.6' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'blocks.discute_bloqueo' WHERE node_id = '2.6' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'blocks.air' WHERE node_id = '2.6' AND question_order = 3;
UPDATE public.node_quiz_questions SET regla_id = 'blocks.bloqueo_vs_objecion' WHERE node_id = '2.6' AND question_order = 4;
UPDATE public.node_quiz_questions SET regla_id = 'discovery.receta_sin_diagnostico' WHERE node_id = '3.0' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'discovery.examen_antes_receta' WHERE node_id = '3.0' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'discovery.barrido' WHERE node_id = '3.0' AND question_order = 3;
UPDATE public.node_quiz_questions SET regla_id = 'discovery.examen_antes_receta' WHERE node_id = '3.0' AND question_order = 4;
UPDATE public.node_quiz_questions SET regla_id = 'close.fishbbod' WHERE node_id = '3.5' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'discovery.luz_verde' WHERE node_id = '3.5' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'discovery.rojo_insistir' WHERE node_id = '3.5' AND question_order = 3;
UPDATE public.node_quiz_questions SET regla_id = 'present.beneficio_no_caracteristica' WHERE node_id = '4.0' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'close.descuento_de_panico' WHERE node_id = '4.0' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'present.dos_mitades' WHERE node_id = '4.0' AND question_order = 3;
UPDATE public.node_quiz_questions SET regla_id = 'close.sigue_presentando' WHERE node_id = '4.4' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'impulse.curva' WHERE node_id = '4.4' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'impulse.curva' WHERE node_id = '4.4' AND question_order = 3;
UPDATE public.node_quiz_questions SET regla_id = 'close.mal_cierre' WHERE node_id = '5.0' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'close.alternativa' WHERE node_id = '5.0' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'close.asumir_venta' WHERE node_id = '5.0' AND question_order = 3;
UPDATE public.node_quiz_questions SET regla_id = 'objection.air_a_objecion' WHERE node_id = '5.4' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'objection.es_senal_de_compra' WHERE node_id = '5.4' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'objection.es_senal_de_compra' WHERE node_id = '5.4' AND question_order = 3;
UPDATE public.node_quiz_questions SET regla_id = 'consolidation.siguientes_pasos' WHERE node_id = '6.0' AND question_order = 1;
UPDATE public.node_quiz_questions SET regla_id = 'consolidation.siguientes_pasos' WHERE node_id = '6.0' AND question_order = 2;
UPDATE public.node_quiz_questions SET regla_id = 'consolidation.arrepentimiento' WHERE node_id = '6.0' AND question_order = 3;

-- Quiz 6.0#3 usaba la numeración de la fuente (5 pasos). En Closer el cierre es
-- el Paso 5 y la consolidación el Paso 6. Se reescribe completo, no con replace.
UPDATE public.node_quiz_questions SET
  question_text = '¿Por qué "la venta se cierra en el Paso 5 pero se GANA en el 6"?',
  option_a = 'Porque en el 6 se firma el contrato legal.',
  option_b = 'Porque el sí del Paso 5 es frágil hasta que la comprensión y la confianza del Paso 6 lo blindan — y porque del 6 salen la recompra y los referidos.',
  option_c = 'Porque el Paso 6 es donde se negocia el precio final.',
  option_d = NULL,
  explanation_correct = 'Exacto. Sin consolidación, el sí es una promesa a merced del remordimiento nocturno. Con ella, es una decisión blindada — y además sembraste la siguiente: el cliente que se queda tranquilo es el que te recomienda y te recompra.',
  explanation_wrong = 'No es papeleo ni precio — es blindaje y siembra. El sí recién nacido es frágil: el Paso 6 lo protege con comprensión total, y de pasada construye lo que vale más que esta venta: la relación que trae la siguiente.'
WHERE node_id = '6.0' AND question_order = 3;

DO $$
DECLARE sin int;
BEGIN
  SELECT count(*) INTO sin FROM public.node_quiz_questions WHERE regla_id IS NULL;
  IF sin > 0 THEN RAISE EXCEPTION '% preguntas de quiz sin regla_id', sin; END IF;
END $$;