-- Mensaje 82 · El avance del vendedor sale de su mapa real (14-oct-2026).
-- sellers.current_world nunca se actualizaba (se quedaba en 0) y current_node
-- retrocedía al repetir un nodo viejo. El coach, la recomendación del manager y
-- las pantallas de equipo leían esas columnas. Ahora la base las calcula igual
-- que el mapa: nodos en orden (mundo, orden); el primero sin node_progress
-- 'done' es el que le toca. Nadie puede escribir otro valor encima.

CREATE OR REPLACE FUNCTION public.sellers_avance_real()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nodo  text;
  v_mundo int;
BEGIN
  SELECT n.id, n.world_id INTO v_nodo, v_mundo
  FROM public.nodes n
  WHERE NOT EXISTS (
    SELECT 1 FROM public.node_progress p
    WHERE p.seller_id = NEW.id AND p.node_id = n.id AND p.status = 'done'
  )
  ORDER BY n.world_id, n.order_index
  LIMIT 1;
  IF v_nodo IS NULL THEN
    -- Ya completó todo: se queda en el último nodo del mapa.
    SELECT n.id, n.world_id INTO v_nodo, v_mundo
    FROM public.nodes n ORDER BY n.world_id DESC, n.order_index DESC LIMIT 1;
  END IF;
  IF v_nodo IS NOT NULL THEN
    NEW.current_node := v_nodo;
    NEW.current_world := v_mundo;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sellers_avance_real ON public.sellers;
CREATE TRIGGER trg_sellers_avance_real
  BEFORE INSERT OR UPDATE OF current_node, current_world ON public.sellers
  FOR EACH ROW EXECUTE FUNCTION public.sellers_avance_real();

CREATE OR REPLACE FUNCTION public.node_progress_avance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Tocar current_node dispara el cálculo de arriba.
  UPDATE public.sellers SET current_node = current_node
  WHERE id = CASE WHEN TG_OP = 'DELETE' THEN OLD.seller_id ELSE NEW.seller_id END;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_node_progress_avance ON public.node_progress;
CREATE TRIGGER trg_node_progress_avance
  AFTER INSERT OR DELETE OR UPDATE OF status ON public.node_progress
  FOR EACH ROW EXECUTE FUNCTION public.node_progress_avance();

-- Recalcula a todos los vendedores con lo que ya tienen.
UPDATE public.sellers SET current_node = current_node;

-- Chequeo: ningún vendedor queda con un nodo distinto al que le toca en su mapa.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.sellers s
  WHERE s.current_node IS DISTINCT FROM coalesce(
    (SELECT x.id FROM public.nodes x
      WHERE NOT EXISTS (SELECT 1 FROM public.node_progress p WHERE p.seller_id = s.id AND p.node_id = x.id AND p.status = 'done')
      ORDER BY x.world_id, x.order_index LIMIT 1),
    (SELECT x.id FROM public.nodes x ORDER BY x.world_id DESC, x.order_index DESC LIMIT 1));
  IF n > 0 THEN RAISE EXCEPTION '% vendedores no quedaron con su avance real', n; END IF;
END $$;
