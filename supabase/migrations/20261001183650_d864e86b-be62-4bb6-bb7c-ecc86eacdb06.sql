-- El perfil del cliente de cada práctica (oct-2026, aprobado por Emilio).
-- Cada nodo dice con qué cliente se enseña mejor; el manager puede limitarlo
-- a los clientes que su equipo de verdad atiende.

ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS tipo_cliente text NOT NULL DEFAULT 'cualquiera';
ALTER TABLE public.nodes DROP CONSTRAINT IF EXISTS nodes_tipo_cliente_check;
ALTER TABLE public.nodes ADD CONSTRAINT nodes_tipo_cliente_check CHECK (tipo_cliente IN ('nuevo', 'recurrente', 'cualquiera'));

-- Recurrente: lo que enseñan solo existe con alguien que ya te compra (el hueco,
-- el incremento, la visita de ruta).
UPDATE public.nodes SET tipo_cliente = 'recurrente' WHERE id IN ('3.7', '3.8', '3.9', '4.9', '4.15', '5.14', '7.3');
-- Nuevo: se enseña mejor con alguien que no te conoce (la apertura, la
-- curiosidad y la historia breve no tienen sentido si ya sabe quién eres).
UPDATE public.nodes SET tipo_cliente = 'nuevo'
WHERE split_part(id, '.', 1) IN ('1', '2') OR id IN ('3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.10', '7.1', '7.2');
-- El resto: cualquiera (se alterna).

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tipos_cliente text NOT NULL DEFAULT 'ambos';
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_tipos_cliente_check;
ALTER TABLE public.companies ADD CONSTRAINT companies_tipos_cliente_check CHECK (tipos_cliente IN ('ambos', 'solo_nuevos', 'solo_recurrentes'));

DO $$
DECLARE r int; n int;
BEGIN
  SELECT count(*) INTO r FROM public.nodes WHERE tipo_cliente = 'recurrente';
  SELECT count(*) INTO n FROM public.nodes WHERE tipo_cliente = 'nuevo';
  IF r <> 7 THEN RAISE EXCEPTION 'nodos de cliente recurrente: % (se esperaban 7)', r; END IF;
  IF n < 20 THEN RAISE EXCEPTION 'nodos de cliente nuevo: % (se esperaban al menos 20)', n; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'companies' AND cmd IN ('UPDATE', 'ALL'))
  THEN RAISE EXCEPTION 'no hay política para que el manager actualice su empresa'; END IF;
  RAISE NOTICE 'recurrente: %, nuevo: %, cualquiera: %', r, n, (SELECT count(*) FROM public.nodes WHERE tipo_cliente = 'cualquiera');
END $$;