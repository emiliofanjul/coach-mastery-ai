-- ============================================================
-- UNA SOLA FUENTE PARA "QUÉ ENTRENA UN NODO" — validada al escribir
--
-- Hasta hoy había tres lugares para lo mismo: la tabla node_skills (con
-- FK a skills), el JSON practice_script.scope.skills_in_focus, y los ids
-- de practice_script.success_criteria. La app leía uno con respaldo en
-- otro. El JSON aceptaba cualquier cosa, y así entró un criterio de éxito
-- (opening.curiosidad_abierta) sin skill: 422 en la práctica del 1.2 y
-- el 1.6 hasta que un vendedor lo abrió.
--
-- Después de esta migración:
--   · node_skills MANDA. Tiene FK a skills: un skill inexistente se
--     rechaza en la base.
--   · skills_in_focus deja de ser dato: el trigger lo deriva de los
--     success_criteria. Es una caché que la base mantiene.
--   · Un trigger BEFORE en nodes rechaza cualquier practice_script cuyos
--     criterios de éxito no estén en node_skills para ese nodo, cuyas
--     regla_id no existan, cuyos pesos no sumen 1.0, o que exceda el
--     límite de skills por tipo de nodo. La validación vive en la base,
--     al escribir. La migración del 4-sep habría fallado ese mismo día.
--   · skills.regla_id liga cada skill a la regla de doctrina que
--     operacionaliza (muchos skills → una regla). Explícito, no por
--     coincidencia de nombre.
-- ============================================================

-- ── 1. skills ↔ reglas, explícito ─────────────────────────────
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS regla_id text REFERENCES public.reglas(id);
COMMENT ON COLUMN public.skills.regla_id IS
  'Regla de doctrina (tabla reglas) que este skill operacionaliza. Varios skills pueden apoyarse en la misma regla. NULL solo para skills de mentalidad/fundamento aún no registrados.';

UPDATE public.skills SET regla_id = 'blocks.air' WHERE id = 'blocks.air';
UPDATE public.skills SET regla_id = 'blocks.air' WHERE id = 'blocks.no_engancharse';
UPDATE public.skills SET regla_id = 'blocks.ataque_preventivo' WHERE id = 'blocks.pre_emptive_strike';
UPDATE public.skills SET regla_id = 'close.cierra_solo_incremento' WHERE id = 'closing.cerrar_incremento';
UPDATE public.skills SET regla_id = 'close.alternativa' WHERE id = 'closing.cierre_asumido';
UPDATE public.skills SET regla_id = 'close.asumir_venta' WHERE id = 'closing.cierre_natural';
UPDATE public.skills SET regla_id = 'close.fishbbod' WHERE id = 'closing.lectura_senales';
UPDATE public.skills SET regla_id = 'close.aguanta_silencio' WHERE id = 'closing.sin_miedo';
UPDATE public.skills SET regla_id = 'consolidation.siguientes_pasos' WHERE id = 'consolidation.proteger_venta';
UPDATE public.skills SET regla_id = 'consolidation.rehash' WHERE id = 'consolidation.rehash';
UPDATE public.skills SET regla_id = 'consolidation.misma_actitud' WHERE id = 'consolidation.relacion_largo_plazo';
UPDATE public.skills SET regla_id = 'consolidation.rehash' WHERE id = 'consolidation.siguiente_oportunidad';
UPDATE public.skills SET regla_id = 'discovery.confirmacion_con_sus_palabras' WHERE id = 'discovery.dolor_real';
UPDATE public.skills SET regla_id = 'discovery.escalera_capas' WHERE id = 'discovery.escucha_activa';
UPDATE public.skills SET regla_id = 'discovery.lee_el_lugar' WHERE id = 'discovery.hueco';
UPDATE public.skills SET regla_id = 'discovery.lee_el_lugar' WHERE id = 'discovery.lee_el_lugar';
UPDATE public.skills SET regla_id = 'discovery.pregunta_especifica' WHERE id = 'discovery.pregunta_especifica';
UPDATE public.skills SET regla_id = 'discovery.examen_antes_receta' WHERE id = 'discovery.preguntar_antes_presentar';
UPDATE public.skills SET regla_id = 'discovery.escalera_capas' WHERE id = 'discovery.preguntas_capas';
UPDATE public.skills SET regla_id = 'discovery.suggestive_language' WHERE id = 'discovery.suggestive_language';
UPDATE public.skills SET regla_id = 'close_with_action' WHERE id = 'flow.close_with_action';
UPDATE public.skills SET regla_id = 'impulse.avaricia' WHERE id = 'impulse.avaricia';
UPDATE public.skills SET regla_id = 'impulse.curva' WHERE id = 'impulse.curva_impulso';
UPDATE public.skills SET regla_id = 'impulse.efecto_jones' WHERE id = 'impulse.efecto_jones';
UPDATE public.skills SET regla_id = 'impulse.indiferencia' WHERE id = 'impulse.indiferencia';
UPDATE public.skills SET regla_id = 'impulse.miedo_perdida' WHERE id = 'impulse.miedo_perdida';
UPDATE public.skills SET regla_id = 'close.asumir_venta' WHERE id = 'impulse.poder_asumir';
UPDATE public.skills SET regla_id = 'impulse.urgencia' WHERE id = 'impulse.urgencia';
UPDATE public.skills SET regla_id = 'opening.gasman' WHERE id = 'mindset.gasman_theory';
UPDATE public.skills SET regla_id = 'impulse.indiferencia' WHERE id = 'mindset.kilt';
UPDATE public.skills SET regla_id = 'opening.energia_verbal' WHERE id = 'mindset.regla_10_por_ciento';
UPDATE public.skills SET regla_id = 'discovery.rrr' WHERE id = 'mindset.rrr';
UPDATE public.skills SET regla_id = 'present.balas' WHERE id = 'objections.bullet_theory';
UPDATE public.skills SET regla_id = 'objection.circulo_de_cierre' WHERE id = 'objections.circulo_cierre';
UPDATE public.skills SET regla_id = 'objection.fff' WHERE id = 'objections.fff';
UPDATE public.skills SET regla_id = 'objection.discutir' WHERE id = 'objections.no_defensivo';
UPDATE public.skills SET regla_id = 'objection.rrr' WHERE id = 'objections.reframe';
UPDATE public.skills SET regla_id = 'objection.regla_de_los_no' WHERE id = 'objections.regla_no';
UPDATE public.skills SET regla_id = 'objection.rrr' WHERE id = 'objections.rrr_objeciones';
UPDATE public.skills SET regla_id = 'opening.gasman' WHERE id = 'opening.arranque_sin_disculpa';
UPDATE public.skills SET regla_id = 'opening.curiosidad_abierta' WHERE id = 'opening.curiosidad_abierta';
UPDATE public.skills SET regla_id = 'opening.energia_verbal' WHERE id = 'opening.energia_vocal';
UPDATE public.skills SET regla_id = 'opening.ice_breaker' WHERE id = 'opening.estructura_apertura';
UPDATE public.skills SET regla_id = 'opening.ice_breaker' WHERE id = 'opening.ice_breaker';
UPDATE public.skills SET regla_id = 'opening.ice_breaker' WHERE id = 'opening.personalizacion';
UPDATE public.skills SET regla_id = 'opening.see' WHERE id = 'opening.sce';
UPDATE public.skills SET regla_id = 'opening.see' WHERE id = 'opening.sonrisa_audible';
UPDATE public.skills SET regla_id = 'present.beneficio_no_caracteristica' WHERE id = 'presentation.beneficio_no_caracteristica';
UPDATE public.skills SET regla_id = 'present.dos_mitades' WHERE id = 'presentation.conectar_dolor';
UPDATE public.skills SET regla_id = 'present.argumento_del_hueco' WHERE id = 'presentation.consolidacion_proveedor';
UPDATE public.skills SET regla_id = 'present.beneficio_no_caracteristica' WHERE id = 'presentation.costo_vs_valor';
UPDATE public.skills SET regla_id = 'present.pintar_imagenes' WHERE id = 'presentation.pintar_imagenes';
UPDATE public.skills SET regla_id = 'present.triple_desglose' WHERE id = 'presentation.price_breakdown';
UPDATE public.skills SET regla_id = 'impulse.tren_del_si' WHERE id = 'presentation.tren_si_si';
UPDATE public.skills SET regla_id = 'present.beneficio_no_caracteristica' WHERE id = 'presentation.valor_personalizado';
UPDATE public.skills SET regla_id = 'discovery.rojo_vs_amarrado' WHERE id = 'qualification.luz_verde';
UPDATE public.skills SET regla_id = 'close.fishbbod' WHERE id = 'qualification.senales_compra';
UPDATE public.skills SET regla_id = 'relationship.cpr' WHERE id = 'relationship.cpr';
UPDATE public.skills SET regla_id = 'relationship.forms' WHERE id = 'relationship.forms';
UPDATE public.skills SET regla_id = 'story.kiss' WHERE id = 'story.brevedad';
UPDATE public.skills SET regla_id = 'story.quien_eres_por_que' WHERE id = 'story.historia_breve';
UPDATE public.skills SET regla_id = 'story.pregunta_despues' WHERE id = 'story.relevancia_cliente';

-- ── 2. El skill que faltaba (criterio agregado el 4-sep sin su skill) ──
INSERT INTO public.skills
  (id, code, name, short_description, category, world_id_introduced,
   skill_type, decay_half_life_days, requires_audio, status, regla_id)
VALUES
  ('opening.curiosidad_abierta', 'S-058', 'Curiosidad Abierta',
   'Abre sin presentarse, de modo que el cliente se quede con la pregunta de quién eres. Si él termina preguntándolo, ganaste la introducción: esa pregunta es la puerta natural al Paso 2. Presentarse de entrada no se penaliza, simplemente no acredita esta habilidad.',
   'opening', 1, 'tecnica', 180, false, 'active', 'opening.curiosidad_abierta')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, short_description = EXCLUDED.short_description,
  status = 'active', regla_id = EXCLUDED.regla_id;

-- Se introduce en 1.2 (primario) y se practica en 1.6, como el resto del catálogo.
INSERT INTO public.node_skills (node_id, skill_id, relation, weight, is_primary) VALUES
  ('1.2', 'opening.curiosidad_abierta', 'introduces', 1.0, true),
  ('1.6', 'opening.curiosidad_abierta', 'practices',  1.0, false)
ON CONFLICT (node_id, skill_id) DO NOTHING;

-- ── 3. Validación al escribir ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.validar_practice_script()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ps        jsonb := NEW.practice_script;
  c         jsonb;
  ids       text[] := ARRAY[]::text[];
  faltan    text[] := ARRAY[]::text[];
  reglas_r  text[] := ARRAY[]::text[];
  suma      numeric := 0;
  maxfoco   int := CASE WHEN NEW.node_type = 'boss' THEN 8 ELSE 6 END;
BEGIN
  IF ps IS NULL THEN RETURN NEW; END IF;

  -- a) Cada criterio de éxito es un skill que este nodo entrena (node_skills)
  FOR c IN SELECT * FROM jsonb_array_elements(coalesce(ps->'success_criteria','[]'::jsonb)) LOOP
    ids := ids || (c->>'id');
    suma := suma + coalesce((c->>'weight')::numeric, 0);
    IF NOT EXISTS (SELECT 1 FROM public.node_skills ns WHERE ns.node_id = NEW.id AND ns.skill_id = c->>'id') THEN
      faltan := faltan || (c->>'id');
    END IF;
  END LOOP;
  IF array_length(faltan,1) > 0 THEN
    RAISE EXCEPTION 'nodo %: criterios de éxito sin fila en node_skills: %. Registra primero el skill en node_skills.', NEW.id, faltan;
  END IF;

  -- b) Pesos de éxito suman 1.0
  IF array_length(ids,1) > 0 AND (suma < 0.99 OR suma > 1.01) THEN
    RAISE EXCEPTION 'nodo %: los pesos de success_criteria suman %, deben sumar 1.0', NEW.id, suma;
  END IF;

  -- c) Toda regla_id existe
  SELECT array_agg(DISTINCT x->>'regla_id') INTO reglas_r
  FROM jsonb_array_elements(coalesce(ps->'success_criteria','[]'::jsonb) || coalesce(ps->'failure_criteria','[]'::jsonb)) x
  WHERE x ? 'regla_id' AND NOT EXISTS (SELECT 1 FROM public.reglas r WHERE r.id = x->>'regla_id');
  IF reglas_r IS NOT NULL THEN
    RAISE EXCEPTION 'nodo %: regla_id inexistentes: %', NEW.id, reglas_r;
  END IF;

  -- d) skills_in_focus se DERIVA de los criterios de éxito. No es dato.
  IF array_length(ids,1) > maxfoco THEN
    RAISE EXCEPTION 'nodo % (%): % skills en foco; máximo %', NEW.id, coalesce(NEW.node_type,'?'), array_length(ids,1), maxfoco;
  END IF;
  IF array_length(ids,1) > 0 THEN
    NEW.practice_script := jsonb_set(
      coalesce(ps,'{}'::jsonb),
      '{scope,skills_in_focus}',
      to_jsonb(ids),
      true
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_practice_script ON public.nodes;
CREATE TRIGGER trg_validar_practice_script
  BEFORE INSERT OR UPDATE OF practice_script, node_type ON public.nodes
  FOR EACH ROW EXECUTE FUNCTION public.validar_practice_script();

COMMENT ON FUNCTION public.validar_practice_script() IS
  'Rechaza practice_script incoherentes al escribir: criterios sin node_skills, regla_id inexistentes, pesos ≠ 1.0, foco excedido. Deriva scope.skills_in_focus de success_criteria.';

-- ── 4. Pasar todos los nodos por el trigger ───────────────────
-- Valida el estado actual completo y normaliza skills_in_focus. Si algún
-- nodo está incoherente, la migración falla aquí y lo dice.
UPDATE public.nodes SET practice_script = practice_script WHERE practice_script IS NOT NULL;

-- ── 5. Verificación final ─────────────────────────────────────
DO $$
DECLARE huecos int; sin_regla text;
BEGIN
  -- skills_in_focus == ids de success_criteria en todos los nodos
  SELECT count(*) INTO huecos FROM public.nodes n
  WHERE n.practice_script IS NOT NULL
    AND (SELECT coalesce(array_agg(x #>> '{}' ORDER BY 1),'{}') FROM jsonb_array_elements(n.practice_script->'scope'->'skills_in_focus') x)
     <> (SELECT coalesce(array_agg(c->>'id' ORDER BY 1),'{}') FROM jsonb_array_elements(n.practice_script->'success_criteria') c);
  IF huecos > 0 THEN RAISE EXCEPTION '% nodos con skills_in_focus ≠ criterios', huecos; END IF;

  -- todo skill que aparece en un criterio de éxito tiene regla_id
  SELECT string_agg(DISTINCT c->>'id', ', ') INTO sin_regla
  FROM public.nodes n, jsonb_array_elements(n.practice_script->'success_criteria') c
  JOIN public.skills s ON s.id = c->>'id'
  WHERE s.regla_id IS NULL;
  IF sin_regla IS NOT NULL THEN RAISE EXCEPTION 'skills medidos sin regla_id: %', sin_regla; END IF;
END $$;