INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
SELECT 2, section_key, order_index, title,
  CASE WHEN section_key='pasos' THEN replace(body, E'\n### Teoría del Gasman', E'\n' || $esc$### La escalera de la especificidad `CAMPO` `UNIVERSAL`

La observación y la pregunta de la apertura se miden igual: **¿se la harías a cualquiera?** Entre más específica para ESE cliente en ESE momento, más vale.

- **Escalón 1 — de cortesía.** Se la harías a cualquiera: *"¿cómo está?"*, *"qué gusto saludarlo"*. Cumple lo mínimo porque le devuelve la palabra, pero no construye nada.
- **Escalón 2 — del entorno.** Sale de lo que ves ahí, en ese momento: *"veo que no paran, ¿siempre está así de movido?"*. Solo tiene sentido en ese lugar.
- **Escalón 3 — de él.** Solo se la harías a él, porque sabes algo de antes: *"¿cómo sigue? ¿va mejorando?"*.

> **Las mismas palabras pueden estar en escalones distintos.** *"¿Cómo está?"* a secas es escalón 1; *"¿cómo está? ¿va mejorando?"* a alguien que estuvo enfermo es escalón 3. Lo que sube el escalón no son las palabras: es qué tanto sabe la pregunta de él.

**La relación cambia la escalera.** Con un cliente nuevo no existe el escalón 3 —no hay historia con él—, así que el escalón 2 es la excelencia. Con un recurrente la meta es el escalón 3, y el 2 puede ser un error: preguntarle si siempre está así de movido a alguien que visitas desde hace años le dice que no lo tienes presente (ver 4.1b).

**Una pregunta de cortesía no es una falla: es el primer escalón.** La falla es no preguntar nada: sin ninguna pregunta, el cliente no tiene qué contestar y la conversación se muere ahí.

**Y la pregunta que mejor devuelve la palabra es la que sale de la observación y cierra la apertura:** *"veo que no paran, ¿siempre está así de movido?"*. Un *"¿cómo está?"* dentro del saludo cumple, pero si después sigues hablando, el cliente espera a que termines en vez de contestar. Convertir la observación en la pregunta final es como se sube de escalón.$esc$ || E'\n\n### Teoría del Gasman') ELSE body END,
  true, created_by
FROM public.doctrina WHERE version=1 AND is_active;
UPDATE public.doctrina SET is_active=false WHERE version=1;
DO $$ BEGIN
  IF (SELECT count(*) FROM public.doctrina WHERE version=2 AND is_active) <> 7 THEN RAISE EXCEPTION 'faltan secciones v2'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.doctrina WHERE version=2 AND section_key='pasos' AND position('### La escalera de la especificidad' in body) BETWEEN 1 AND position('### Teoría del Gasman' in body)) THEN RAISE EXCEPTION 'escalera no insertada'; END IF;
END $$;