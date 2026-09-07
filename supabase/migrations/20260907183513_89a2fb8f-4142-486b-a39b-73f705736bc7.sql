-- ============================================================
-- LA TABLA reglas PASA DE DOCUMENTACIÓN A EJECUCIÓN
--
-- Hasta hoy cada criterio de practice_script llevaba su propia
-- description y severity. La migración anterior los ligó a reglas por
-- regla_id, pero el evaluador seguía leyendo los campos del nodo.
--
-- Esta migración resuelve el practice_script EN LA BASE, así:
--   · description = definición canónica de la regla + contexto del nodo
--   · severity    = default de la regla, salvo override declarado
--   · cita_cerebro viaja con cada criterio (para que el evaluador cite)
--
-- Todo consumidor —TanStack, Edge Functions, lo que venga— lee la vista
-- v_nodes_resueltos y recibe lo mismo. Si mañana cambias la severidad
-- de una regla, todos los nodos sin override la heredan al instante.
-- ============================================================

CREATE OR REPLACE FUNCTION public.resolver_practice_script(ps jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  resultado jsonb := ps;
  tipo text;
  lista jsonb;
  nuevo jsonb;
  c jsonb;
  r public.reglas%ROWTYPE;
  descripcion text;
  severidad text;
BEGIN
  IF ps IS NULL THEN RETURN NULL; END IF;

  FOREACH tipo IN ARRAY ARRAY['success_criteria', 'failure_criteria'] LOOP
    lista := ps -> tipo;
    IF lista IS NULL OR jsonb_typeof(lista) <> 'array' THEN CONTINUE; END IF;

    nuevo := '[]'::jsonb;
    FOR c IN SELECT * FROM jsonb_array_elements(lista) LOOP
      IF c ? 'regla_id' THEN
        SELECT * INTO r FROM public.reglas WHERE id = c->>'regla_id';
        IF FOUND THEN
          -- Definición canónica primero; el contexto del nodo después.
          -- El evaluador ve UNA descripción, así que van juntas.
          descripcion := r.resumen;
          IF coalesce(c->>'description','') <> '' AND c->>'description' <> r.resumen THEN
            descripcion := descripcion || ' — En este nodo: ' || (c->>'description');
          END IF;

          -- Severidad: default de la regla salvo override declarado.
          IF tipo = 'failure_criteria' THEN
            IF c ? 'severity_override' THEN
              severidad := c->>'severity';                -- el nodo lo declaró, se respeta
            ELSE
              severidad := coalesce(r.severidad_default, c->>'severity');
            END IF;
            c := jsonb_set(c, '{severity}', to_jsonb(severidad));
          END IF;

          c := c
            || jsonb_build_object(
                 'description',   descripcion,
                 'contexto_nodo', c->>'description',
                 'regla_resumen', r.resumen,
                 'cita_cerebro',  r.cita_cerebro,
                 'regla_tipo',    r.tipo,
                 'regla_canal',   r.canal
               );
        END IF;
      END IF;
      nuevo := nuevo || jsonb_build_array(c);
    END LOOP;
    resultado := jsonb_set(resultado, ARRAY[tipo], nuevo);
  END LOOP;

  RETURN resultado;
END;
$$;

COMMENT ON FUNCTION public.resolver_practice_script(jsonb) IS
  'Devuelve un practice_script con cada criterio resuelto contra la tabla reglas: definición canónica, severidad por defecto salvo override declarado, y cita del Cerebro.';

-- ── La vista que consumen todos ───────────────────────────────
CREATE OR REPLACE VIEW public.v_nodes_resueltos
WITH (security_invoker = true)
AS
SELECT
  n.*,
  public.resolver_practice_script(n.practice_script) AS practice_script_resuelto
FROM public.nodes n;

COMMENT ON VIEW public.v_nodes_resueltos IS
  'nodes + practice_script_resuelto. Es lo que deben leer el evaluador, el Director, el Pitch Builder y cualquier actividad futura. Nunca leer practice_script crudo para evaluar.';

-- ── Quizzes: cada pregunta apunta a la regla que evalúa ────────
-- Es lo que permite que mañana un quiz se cambie por un minijuego sin
-- perder la liga con la doctrina: la actividad cambia, la regla no.
ALTER TABLE public.node_quiz_questions
  ADD COLUMN IF NOT EXISTS regla_id text REFERENCES public.reglas(id);

CREATE INDEX IF NOT EXISTS node_quiz_questions_regla_idx ON public.node_quiz_questions (regla_id);

-- Los valores se cargan en una migración aparte, generada del mapeo manual.

-- ── Verificación ──────────────────────────────────────────────
DO $$
DECLARE muestra jsonb; sin_resolver int;
BEGIN
  -- Toda regla_id presente se resolvió (trae cita_cerebro)
  SELECT count(*) INTO sin_resolver
  FROM public.v_nodes_resueltos n,
       jsonb_array_elements(coalesce(n.practice_script_resuelto->'success_criteria','[]'::jsonb)
                         || coalesce(n.practice_script_resuelto->'failure_criteria','[]'::jsonb)) c
  WHERE c ? 'regla_id' AND NOT (c ? 'cita_cerebro');
  IF sin_resolver > 0 THEN
    RAISE EXCEPTION '% criterios con regla_id no se resolvieron', sin_resolver;
  END IF;
END $$;