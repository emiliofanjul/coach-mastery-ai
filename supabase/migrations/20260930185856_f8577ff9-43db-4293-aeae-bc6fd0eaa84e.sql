WITH orden AS (
  SELECT id, world_id, order_index FROM public.nodes
),
reparar AS (
  SELECT p.id
  FROM public.node_progress p
  JOIN orden o ON o.id = p.node_id
  WHERE p.status IS DISTINCT FROM 'done'
    AND EXISTS (
      SELECT 1 FROM public.node_progress p2
      JOIN orden o2 ON o2.id = p2.node_id
      WHERE p2.seller_id = p.seller_id
        AND (o2.world_id, o2.order_index) > (o.world_id, o.order_index)
        AND (p2.status = 'done' OR coalesce(p2.stars, 0) > 0)
    )
)
UPDATE public.node_progress SET status = 'done' WHERE id IN (SELECT id FROM reparar);

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n
  FROM public.node_progress p JOIN public.nodes o ON o.id = p.node_id
  WHERE p.status IS DISTINCT FROM 'done'
    AND EXISTS (SELECT 1 FROM public.node_progress p2 JOIN public.nodes o2 ON o2.id = p2.node_id
                WHERE p2.seller_id = p.seller_id AND (o2.world_id, o2.order_index) > (o.world_id, o.order_index)
                  AND (p2.status = 'done' OR coalesce(p2.stars, 0) > 0));
  IF n > 0 THEN RAISE EXCEPTION 'quedan % nodos bajados', n; END IF;
END $$;