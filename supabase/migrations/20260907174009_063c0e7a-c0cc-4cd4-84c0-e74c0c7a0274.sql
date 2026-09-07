-- ── Verificaciones (la migración falla si algo no cuadra) ─────
DO $$
DECLARE huerfanos int; sin_regla int; pesos_mal int;
BEGIN
  -- 1. Todo criterio apunta a una regla que existe
  SELECT count(*) INTO huerfanos FROM public.nodes n,
    jsonb_array_elements(coalesce(n.practice_script->'success_criteria','[]'::jsonb) || coalesce(n.practice_script->'failure_criteria','[]'::jsonb)) c
    LEFT JOIN public.reglas r ON r.id = c->>'regla_id'
    WHERE n.practice_script IS NOT NULL AND r.id IS NULL;
  IF huerfanos > 0 THEN RAISE EXCEPTION '% criterios apuntan a reglas inexistentes', huerfanos; END IF;

  -- 2. Ningún criterio se quedó sin regla_id
  SELECT count(*) INTO sin_regla FROM public.nodes n,
    jsonb_array_elements(coalesce(n.practice_script->'success_criteria','[]'::jsonb) || coalesce(n.practice_script->'failure_criteria','[]'::jsonb)) c
    WHERE n.practice_script IS NOT NULL AND c->>'regla_id' IS NULL;
  IF sin_regla > 0 THEN RAISE EXCEPTION '% criterios sin regla_id', sin_regla; END IF;

  -- 3. Los pesos de éxito siguen sumando 1.0 (no los tocamos, pero verificamos)
  SELECT count(*) INTO pesos_mal FROM (
    SELECT n.id, round(sum((c->>'weight')::numeric),3) s FROM public.nodes n,
      jsonb_array_elements(n.practice_script->'success_criteria') c
    WHERE n.practice_script->'success_criteria' IS NOT NULL GROUP BY n.id) t WHERE s NOT BETWEEN 0.99 AND 1.01;
  IF pesos_mal > 0 THEN RAISE EXCEPTION '% nodos con pesos que no suman 1.0', pesos_mal; END IF;
END $$;

-- Vista de coherencia: severidades que se apartan del default, con su razón.
CREATE OR REPLACE VIEW public.v_severidad_overrides AS
SELECT n.id AS nodo, n.node_type, c->>'id' AS criterio, c->>'regla_id' AS regla,
       c->>'severity' AS severidad, c->'severity_override'->>'default' AS default_regla,
       c->'severity_override'->>'razon' AS razon
FROM public.nodes n, jsonb_array_elements(n.practice_script->'failure_criteria') c
WHERE c ? 'severity_override';