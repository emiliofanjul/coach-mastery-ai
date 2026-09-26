UPDATE public.reglas SET resumen = 'Abrir sin identificarse deja al cliente con la pregunta. Que él pregunte quién eres es ganar la introducción. Identificarse es decir TU nombre o el de TU empresa. Usar el nombre DEL CLIENTE ("buenos días, Don Ramón") NO es identificarse: es personalización, y es bueno.', updated_at = now() WHERE id = 'opening.curiosidad_abierta';
UPDATE public.reglas SET resumen = 'Abrir identificándose ANTES de conectar. El orden es el problema, no el dato: identificarse después del ice breaker ya es Paso 2. Identificarse es decir TU nombre o el de TU empresa. Usar el nombre DEL CLIENTE ("buenos días, Don Ramón") NO es identificarse: es personalización, y es bueno.', updated_at = now() WHERE id = 'opening.identificacion_prematura';
UPDATE public.reglas SET resumen = 'La escalera de la especificidad: la observación y la pregunta se miden por qué tan específicas son para ESE cliente en ESE momento — ¿se la harías a cualquiera? Escalón 1, de cortesía ("¿cómo está?"): acredita un tercio. Escalón 2, del entorno ("veo que no paran, ¿siempre está así de movido?"): acredita completo con cliente nuevo. Escalón 3, de él ("¿cómo sigue? ¿va mejorando?"): la meta con un recurrente. Las mismas palabras pueden estar en escalones distintos: lo que sube el escalón es qué tanto sabe de él. Un escalón bajo NO es una falla: se acredita menos y se muestra cómo subir. El escalón 3 exige historia REAL con el cliente: si la conversación no muestra ninguna, no está disponible y no se sugiere — jamás inventando un recuerdo.', updated_at = now() WHERE id = 'opening.especificidad';

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.reglas
  WHERE id IN ('opening.curiosidad_abierta','opening.identificacion_prematura')
    AND resumen LIKE '%Usar el nombre DEL CLIENTE%';
  IF n <> 2 THEN RAISE EXCEPTION 'las reglas de identificación no quedaron definidas'; END IF;
  SELECT count(*) INTO n FROM public.reglas WHERE id = 'opening.especificidad' AND resumen LIKE '%no está disponible%';
  IF n <> 1 THEN RAISE EXCEPTION 'el escalón 3 no quedó cerrado sin historia'; END IF;
END $$;