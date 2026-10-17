-- Mensaje 98 · Solo lectura. ¿Cuántas prácticas reales caen entre 60 y 69, por nodo, y cuántos vendedores pasaron un nodo solo con una nota de 60 a 69?
-- Sirve para decidir si las 2 estrellas suben a 70. No cambia nada.
SELECT node_id,
       count(*) AS practicas,
       count(*) FILTER (WHERE score >= 60 AND score < 70) AS de_60_a_69,
       round(100.0 * count(*) FILTER (WHERE score >= 60 AND score < 70) / count(*), 1) AS pct_60_a_69
FROM public.practice_sessions
WHERE score IS NOT NULL AND node_id IS NOT NULL
GROUP BY node_id
ORDER BY split_part(node_id, '.', 1)::int, node_id;

WITH mejor AS (
  SELECT seller_id, node_id, max(score) AS mejor_nota
  FROM public.practice_sessions
  WHERE score IS NOT NULL AND node_id IS NOT NULL
  GROUP BY seller_id, node_id
)
SELECT node_id,
       count(*) AS vendedores,
       count(*) FILTER (WHERE mejor_nota >= 60 AND mejor_nota < 70) AS solo_con_60_a_69
FROM mejor
GROUP BY node_id
HAVING count(*) FILTER (WHERE mejor_nota >= 60 AND mejor_nota < 70) > 0
ORDER BY split_part(node_id, '.', 1)::int, node_id;
