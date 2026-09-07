-- ── Quiz 1.3#3: la pregunta del "10% de las palabras" no existe en la doctrina.
-- Se reemplaza por una basada en el fundamento 1.7 (lo que no se califica se enseña igual).
UPDATE public.node_quiz_questions SET
  question_text = 'Closer te enseña la sonrisa, el contacto visual y la postura, pero en la práctica de texto no te los califica. ¿Qué haces con eso?',
  option_a = 'Ignorarlo: si no se califica, no cuenta.', option_b = 'Practicarlo igual, porque en el campo la ejecución pesa más que el guion, y la app no es el examen: es el terreno de práctica.', option_c = 'Escribirlo en el texto (por ejemplo «sonrío») para que el evaluador lo vea.', option_d = NULL,
  correct_option = 'B',
  explanation_correct = 'Exacto. Lo que no se puede calificar se enseña igual y se pide igual. Un vendedor que solo entrena lo que se le califica llega al campo entrenado a medias.',
  explanation_wrong = 'Lo físico no cabe en un texto, pero sí cabe en tu preparación. La app te dice de frente qué no puede medir para que tú lo practiques de todos modos.'
WHERE node_id = '1.3' AND question_order = 3 AND question_text ILIKE '%10%%';