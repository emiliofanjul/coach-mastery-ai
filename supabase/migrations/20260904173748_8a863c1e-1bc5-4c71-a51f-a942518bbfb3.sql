-- ============================================================
-- APERTURA — la identificación deja de ser un no-tema
--
-- El Cerebro (sección `pasos`, Paso 1) dice, textual:
--   "Qué NO es: aquí no dices quién eres ni a qué vienes. Eso es el
--    Paso 2. Confundirlos es el error doctrinal más común."
--   "La identificación (nombre y empresa) es permitida pero nunca
--    requerida aquí. Su ausencia jamás se penaliza."
--
-- Los practice_script de la apertura decían que identificarse "NO es
-- pitch", metido DENTRO del criterio de falla pitch_prematuro. Esa
-- aclaración es correcta de fondo — identificarse no es pitch — pero
-- vivía en el lugar equivocado y le enseñaba al evaluador a tratar la
-- identificación como un no-tema, cuando la doctrina la trata como algo
-- que conviene retrasar.
--
-- Doctrina de campo (Emilio): no se castiga, se premia dejar la
-- curiosidad abierta. Si el cliente pregunta "¿y usted quién es?",
-- ganaste la introducción: esa pregunta es la puerta natural al Paso 2.
--
-- Esta migración:
--   1. Saca la exención de pitch_prematuro en 1.2, 1.4, 1.6 y 2.10.
--   2. Agrega un criterio de éxito que PREMIA dejar el quién eres
--      abierto, en los dos nodos donde se evalúa la apertura completa
--      (1.2 y 1.6). Pesos rebalanceados para seguir sumando 1.0.
--   3. En 2.10 (Historia Breve) invierte el sentido: ahí identificarse
--      no es una excepción tolerada, es el trabajo del paso.
-- ============================================================

-- ── 1. Quitar la exención de los cuatro pitch_prematuro ─────────
-- Se opera sobre el texto del jsonb porque las frases son literales y
-- únicas. Es idempotente: si ya no está, no cambia nada.

UPDATE public.nodes
SET practice_script = replace(
      replace(
        replace(practice_script::text,
          ' Identificarse con nombre y empresa NO es pitch: es correcto y no se penaliza.', ''),
        ' Identificarse con nombre y empresa NO es pitch.', ''),
      ' Identificarse NO es pitch.', '')::jsonb
WHERE id IN ('1.2', '1.4', '1.6', '2.10')
  AND practice_script::text LIKE '%Identificarse%NO es pitch%';

-- ── 2. Premiar la curiosidad abierta en 1.2 ─────────────────────
-- Pesos actuales: estructura_apertura 0.5 + personalizacion 0.5.
-- Nuevos:         0.40 + 0.40 + curiosidad 0.20 = 1.00

UPDATE public.nodes
SET practice_script = jsonb_set(
  practice_script,
  '{success_criteria}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN c->>'id' = 'opening.estructura_apertura' THEN
          jsonb_set(
            jsonb_set(c, '{weight}', '0.40'),
            '{description}',
            to_jsonb(
              replace(c->>'description',
                ' NO se requiere identificarse con nombre y empresa.', '')
              || ' La identificación con nombre y empresa no se requiere aquí y su ausencia no se penaliza.'
            )
          )
        WHEN c->>'id' = 'opening.personalizacion' THEN jsonb_set(c, '{weight}', '0.40')
        ELSE c
      END
    )
    FROM jsonb_array_elements(practice_script->'success_criteria') c
  ) || jsonb_build_array(
    jsonb_build_object(
      'id', 'opening.curiosidad_abierta',
      'weight', 0.20,
      'description',
      'Deja abierto el quién eres: abre sin presentarse, de modo que el cliente se quede con la pregunta. Si el cliente termina preguntando quién es o de dónde viene, es el máximo de este criterio — esa pregunta es la puerta natural al Paso 2. Presentarse de entrada NO se penaliza: simplemente no acredita este criterio.'
    )
  )
)
WHERE id = '1.2'
  AND NOT practice_script::text LIKE '%opening.curiosidad_abierta%';

-- ── 3. Lo mismo en 1.6 (BOSS de la apertura) ────────────────────
-- Pesos actuales: 0.25 + 0.20 + 0.20 + 0.20 + 0.15 = 1.00
-- Nuevos:         0.20 + 0.20 + 0.15 + 0.20 + 0.10 + curiosidad 0.15

UPDATE public.nodes
SET practice_script = jsonb_set(
  practice_script,
  '{success_criteria}',
  (
    SELECT jsonb_agg(
      CASE c->>'id'
        WHEN 'opening.estructura_apertura' THEN
          jsonb_set(
            jsonb_set(c, '{weight}', '0.20'),
            '{description}',
            to_jsonb(
              replace(c->>'description',
                ' Identificarse con nombre y empresa es correcto y no se penaliza, pero tampoco se requiere.',
                ' Identificarse no se requiere aquí: eso es trabajo del Paso 2.')
            )
          )
        WHEN 'opening.personalizacion'        THEN jsonb_set(c, '{weight}', '0.20')
        WHEN 'opening.ice_breaker'            THEN jsonb_set(c, '{weight}', '0.15')
        WHEN 'opening.arranque_sin_disculpa'  THEN jsonb_set(c, '{weight}', '0.20')
        WHEN 'mindset.regla_10_por_ciento'    THEN jsonb_set(c, '{weight}', '0.10')
        ELSE c
      END
    )
    FROM jsonb_array_elements(practice_script->'success_criteria') c
  ) || jsonb_build_array(
    jsonb_build_object(
      'id', 'opening.curiosidad_abierta',
      'weight', 0.15,
      'description',
      'Deja abierto el quién eres: abre sin presentarse, de modo que el cliente se quede con la pregunta. Si el cliente termina preguntando quién es o de dónde viene, es el máximo de este criterio. Presentarse de entrada NO se penaliza: simplemente no acredita este criterio.'
    )
  )
)
WHERE id = '1.6'
  AND NOT practice_script::text LIKE '%opening.curiosidad_abierta%';

-- ── 4. En Historia Breve, identificarse es el trabajo del paso ──

UPDATE public.nodes
SET practice_script = jsonb_set(
  practice_script,
  '{failure_criteria}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN c->>'id' = 'pitch_prematuro' THEN
          jsonb_set(c, '{description}',
            to_jsonb(
              (c->>'description')
              || ' Identificarse con nombre y empresa es el trabajo de este paso, no una excepción: aquí SÍ se dice quién eres y por qué estás.'
            )
          )
        ELSE c
      END
    )
    FROM jsonb_array_elements(practice_script->'failure_criteria') c
  )
)
WHERE id = '2.10'
  AND practice_script->'failure_criteria' IS NOT NULL;

-- ── 5. Verificación: los pesos deben seguir sumando 1.0 ─────────

DO $$
DECLARE
  r record;
  suma numeric;
BEGIN
  FOR r IN SELECT id, practice_script FROM public.nodes
           WHERE id IN ('1.2', '1.6')
  LOOP
    SELECT round(sum((c->>'weight')::numeric), 4) INTO suma
    FROM jsonb_array_elements(r.practice_script->'success_criteria') c;
    IF suma IS DISTINCT FROM 1.0 THEN
      RAISE EXCEPTION 'Nodo %: los pesos suman %, deben sumar 1.0', r.id, suma;
    END IF;
  END LOOP;
END $$;