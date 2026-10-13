-- Mensaje 74 · criterio discovery.lee_el_lugar de 3.9 y 3.9b (disputa 3.9b, oct-2026).
-- Cambia SOLO la descripción de ese criterio y sube la versión del guion. Idempotente.

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{success_criteria}',
        (SELECT jsonb_agg(CASE WHEN c->>'id' = 'discovery.lee_el_lugar'
                               THEN jsonb_set(c, '{description}', to_jsonb('Mapea el catálogo del cliente más allá de lo que le pidió: averigua, de al menos una familia distinta a la del pedido, si el cliente la maneja y con quién. Cuenta aunque esa familia la nombre el propio cliente al contestar una pregunta abierta del vendedor (por ejemplo, ''¿qué otras líneas maneja?''): lo que se mide es que el vendedor la sacó a la conversación, no que la haya nombrado él. No se exige un número de familias. Tomar el pedido y despedirse no cumple, por muy correcta que sea la visita.'::text))
                               ELSE c END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'success_criteria') WITH ORDINALITY AS t(c, i))),
      '{version}', to_jsonb('1.0.1'::text))
WHERE n.id = '3.9b';

UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{success_criteria}',
        (SELECT jsonb_agg(CASE WHEN c->>'id' = 'discovery.lee_el_lugar'
                               THEN jsonb_set(c, '{description}', to_jsonb('Mapea el catálogo del cliente más allá de lo que ya le vende: averigua, de al menos una familia distinta a lo que hoy le vende, si el cliente la maneja y con quién. Cuenta aunque esa familia la nombre el propio cliente al contestar una pregunta abierta del vendedor (por ejemplo, ''¿qué otras líneas maneja?''): lo que se mide es que el vendedor la sacó a la conversación, no que la haya nombrado él. No se exige un número de familias. Levantar el pedido y despedirse no cumple, por muy correcta que sea la visita.'::text))
                               ELSE c END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'success_criteria') WITH ORDINALITY AS t(c, i))),
      '{version}', to_jsonb('2.0.1'::text))
WHERE n.id = '3.9';
