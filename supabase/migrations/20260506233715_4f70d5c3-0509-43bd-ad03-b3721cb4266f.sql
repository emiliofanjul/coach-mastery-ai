
-- ============================================================
-- TABLA 1: client_archetypes (catálogo público)
-- ============================================================
CREATE TABLE public.client_archetypes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL UNIQUE,
  difficulty_base integer NOT NULL CHECK (difficulty_base BETWEEN 1 AND 5),
  base_prompt text NOT NULL,
  objection_patterns jsonb NOT NULL DEFAULT '{}'::jsonb,
  buying_signal_style text NOT NULL,
  variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_boss_eligible boolean NOT NULL DEFAULT false,
  worlds_available integer[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_archetypes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "archetypes readable by authenticated"
  ON public.client_archetypes FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- TABLA 2: client_names (catálogo público)
-- ============================================================
CREATE TABLE public.client_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  gender text NOT NULL,
  avatar_style text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "names readable by authenticated"
  ON public.client_names FOR SELECT TO authenticated
  USING (true);

-- ============================================================
-- TABLA 3: seller_archetype_performance
-- ============================================================
CREATE TABLE public.seller_archetype_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  archetype_id uuid NOT NULL REFERENCES public.client_archetypes(id) ON DELETE CASCADE,
  sessions_count integer NOT NULL DEFAULT 0,
  avg_score numeric NOT NULL DEFAULT 0,
  last_score integer,
  improvement_trend text NOT NULL DEFAULT 'estable',
  times_assigned integer NOT NULL DEFAULT 0,
  last_practiced_at timestamptz,
  is_in_reinforcement_mode boolean NOT NULL DEFAULT false,
  consecutive_below_avg integer NOT NULL DEFAULT 0,
  consecutive_above_avg integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (seller_id, archetype_id)
);

CREATE INDEX idx_sap_seller ON public.seller_archetype_performance(seller_id);
CREATE INDEX idx_sap_company ON public.seller_archetype_performance(company_id);

ALTER TABLE public.seller_archetype_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "managers all archetype performance"
  ON public.seller_archetype_performance FOR ALL TO authenticated
  USING ((company_id = public.current_company_id()) AND public.is_manager())
  WITH CHECK ((company_id = public.current_company_id()) AND public.is_manager());

CREATE POLICY "seller reads own performance"
  ON public.seller_archetype_performance FOR SELECT TO authenticated
  USING (public.owns_seller(seller_id));

CREATE POLICY "seller writes own performance"
  ON public.seller_archetype_performance FOR INSERT TO authenticated
  WITH CHECK (public.owns_seller(seller_id) AND company_id = public.current_company_id());

CREATE POLICY "seller updates own performance"
  ON public.seller_archetype_performance FOR UPDATE TO authenticated
  USING (public.owns_seller(seller_id));

-- ============================================================
-- FUNCIÓN: select_archetype_for_session
-- ============================================================
CREATE OR REPLACE FUNCTION public.select_archetype_for_session(
  _seller_id uuid,
  _world_id integer,
  _node_id text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _selected uuid;
  _seller_avg numeric;
  _recent uuid[];
  _is_boss_final boolean;
BEGIN
  _is_boss_final := (_world_id = 9 AND _node_id ILIKE '%boss%');

  -- Promedio general del vendedor
  SELECT COALESCE(AVG(avg_score), 0) INTO _seller_avg
  FROM public.seller_archetype_performance
  WHERE seller_id = _seller_id AND sessions_count > 0;

  -- Últimos 3 arquetipos practicados (para evitar repetición)
  SELECT COALESCE(array_agg(archetype_id ORDER BY last_practiced_at DESC), '{}')
    INTO _recent
  FROM (
    SELECT archetype_id, last_practiced_at
    FROM public.seller_archetype_performance
    WHERE seller_id = _seller_id AND last_practiced_at IS NOT NULL
    ORDER BY last_practiced_at DESC
    LIMIT 3
  ) r;

  -- Regla 7: Boss Final — combinación dominio + dificultad
  IF _is_boss_final THEN
    SELECT sap.archetype_id INTO _selected
    FROM public.seller_archetype_performance sap
    JOIN public.client_archetypes ca ON ca.id = sap.archetype_id
    WHERE sap.seller_id = _seller_id
      AND ca.is_boss_eligible = true
      AND _world_id = ANY(ca.worlds_available)
    ORDER BY sap.avg_score DESC, ca.difficulty_base DESC
    LIMIT 1;

    IF _selected IS NOT NULL THEN
      RETURN _selected;
    END IF;
  END IF;

  -- Regla 3: 33% probabilidad de modo refuerzo
  IF random() < 0.33 THEN
    SELECT sap.archetype_id INTO _selected
    FROM public.seller_archetype_performance sap
    JOIN public.client_archetypes ca ON ca.id = sap.archetype_id
    WHERE sap.seller_id = _seller_id
      AND sap.is_in_reinforcement_mode = true
      AND _world_id = ANY(ca.worlds_available)
    ORDER BY random()
    LIMIT 1;

    IF _selected IS NOT NULL THEN
      RETURN _selected;
    END IF;
  END IF;

  -- Selección normal: arquetipos del mundo, sin repetir últimos 3
  SELECT ca.id INTO _selected
  FROM public.client_archetypes ca
  WHERE _world_id = ANY(ca.worlds_available)
    AND NOT (ca.id = ANY(_recent))
  ORDER BY random()
  LIMIT 1;

  -- Fallback: si todos repiten, ignora la restricción de no repetición
  IF _selected IS NULL THEN
    SELECT ca.id INTO _selected
    FROM public.client_archetypes ca
    WHERE _world_id = ANY(ca.worlds_available)
    ORDER BY random()
    LIMIT 1;
  END IF;

  RETURN _selected;
END;
$$;

-- ============================================================
-- SEED DATA: 12 arquetipos base
-- ============================================================
INSERT INTO public.client_archetypes (type, difficulty_base, base_prompt, buying_signal_style, is_boss_eligible, worlds_available, objection_patterns, variations) VALUES
('verde_facil', 1,
 'Eres un cliente receptivo desde el primer momento. Das señales de compra claras y frecuentes. Lanzas pocas objeciones y son blandas. Si el vendedor hace su trabajo básico bien, compras.',
 'obvias', false, ARRAY[0,1,2],
 '{"orden":["interes_general"],"intensidad":"baja"}'::jsonb,
 '[{"mood":"entusiasta"},{"mood":"curioso"},{"mood":"apurado_positivo"}]'::jsonb),

('amigable_no_compra', 2,
 'Eres muy amigable y conversador. Te interesa platicar pero siempre encuentras una razón válida para no comprar HOY. Pides información, prometes pensarlo, vuelves al tema personal.',
 'sutiles', false, ARRAY[0,1,2,3],
 '{"orden":["lo_pienso","despues","consulto"],"intensidad":"media"}'::jsonb,
 '[{"excusa":"economia"},{"excusa":"tiempo"},{"excusa":"familia"}]'::jsonb),

('ocupado', 2,
 'Tienes muy poco tiempo. Respuestas cortas y secas. Te distraes con el celular o personas que pasan. Necesitas que el vendedor vaya al grano en menos de 30 segundos o pierdes interés.',
 'sutiles', false, ARRAY[1,2,3,4],
 '{"orden":["sin_tiempo","al_grano"],"intensidad":"media"}'::jsonb,
 '[{"contexto":"telefono_constante"},{"contexto":"empleado_interrumpe"},{"contexto":"prisa_real"}]'::jsonb),

('leal_proveedor', 3,
 'Tienes un proveedor actual con el que estás razonablemente contento. No buscas cambiar. Solo te moverías si el vendedor diagnostica un hueco real que tu proveedor no cubre.',
 'sutiles', true, ARRAY[2,3,4,5],
 '{"orden":["ya_tengo","contento_actual","no_busco"],"intensidad":"media_alta"}'::jsonb,
 '[{"hueco":"servicio"},{"hueco":"precio_pequeno"},{"hueco":"variedad"}]'::jsonb),

('precio_obsesivo', 3,
 'Todo lo evalúas por precio. Comparas constantemente con la competencia. Sin un triple desglose claro de valor vs precio no te mueves. Pides descuentos repetidamente.',
 'sutiles', true, ARRAY[3,4,5,6],
 '{"orden":["caro","mas_barato","descuento"],"intensidad":"alta"}'::jsonb,
 '[{"comparativa":"online"},{"comparativa":"competidor_directo"},{"comparativa":"version_anterior"}]'::jsonb),

('necesita_consultar', 3,
 'Te interesa pero nunca decides solo. Siempre hay alguien más: socio, esposa, jefe, contador. Aunque te convenzas, dirás que necesitas consultar antes de cerrar.',
 'sutiles', true, ARRAY[3,4,5,6],
 '{"orden":["consulto","no_decido_solo","despues_de_hablar"],"intensidad":"media"}'::jsonb,
 '[{"figura":"esposa"},{"figura":"socio"},{"figura":"jefe"}]'::jsonb),

('analitico', 3,
 'Pides datos concretos y verificables. Comparas características técnicas. No compras sin información dura. Cuestionas afirmaciones generales y pides especificaciones.',
 'sutiles', true, ARRAY[4,5,6,7],
 '{"orden":["dame_datos","fuente","comparativa_tecnica"],"intensidad":"alta"}'::jsonb,
 '[{"foco":"specs"},{"foco":"roi"},{"foco":"garantias"}]'::jsonb),

('desconfiado', 4,
 'Eres escéptico ante cualquier argumento del vendedor. Cuestionas todo lo que dice. Necesitas prueba social fuerte (clientes reales, casos verificables) para considerar avanzar.',
 'casi_invisibles', true, ARRAY[4,5,6,7],
 '{"orden":["no_te_creo","quien_mas","pruebamelo"],"intensidad":"alta"}'::jsonb,
 '[{"sospecha":"engano_pasado"},{"sospecha":"reputacion_industria"},{"sospecha":"vendedor_presionante"}]'::jsonb),

('cicatriz_emocional', 4,
 'Tuviste una mala experiencia con un producto/proveedor similar. Estás cerrado emocionalmente al inicio. Solo si el vendedor hace FFF (Feel-Felt-Found) genuino te abres.',
 'casi_invisibles', true, ARRAY[5,6,7,8],
 '{"orden":["ya_me_paso","perdi_dinero","no_otra_vez"],"intensidad":"alta"}'::jsonb,
 '[{"trauma":"producto_fallo"},{"trauma":"servicio_postventa"},{"trauma":"engano_comercial"}]'::jsonb),

('corporativo_formal', 4,
 'Operas con proceso formal de compra. Múltiples aprobaciones. Lenguaje corporativo y estructurado. Solicitas documentos, propuestas escritas, RFP, plazos formales.',
 'sutiles', true, ARRAY[5,6,7,8],
 '{"orden":["procedimiento","comite","documentacion"],"intensidad":"media"}'::jsonb,
 '[{"rol":"compras"},{"rol":"finanzas"},{"rol":"director_area"}]'::jsonb),

('agresivo', 5,
 'Eres hostil desde el primer segundo. Pones a prueba al vendedor con sarcasmo o desafío directo. Reaccionas mal a cualquier presión. Solo KILT y manejo emocional impecable te calman.',
 'casi_invisibles', true, ARRAY[6,7,8,9],
 '{"orden":["ataque_directo","sarcasmo","reto"],"intensidad":"muy_alta"}'::jsonb,
 '[{"detonante":"interrupcion"},{"detonante":"presuncion"},{"detonante":"prisa"}]'::jsonb),

('red_light_recuperable', 4,
 'Empiezas en Red Light claro: cerrado, frío, casi descartando la conversación. Pero si el vendedor aplica AIR correctamente puedes abrirte. Eres muy sensible a la actitud.',
 'casi_invisibles', true, ARRAY[6,7,8,9],
 '{"orden":["no_me_interesa","ya_dije_que_no","mejor_otro_dia"],"intensidad":"muy_alta"}'::jsonb,
 '[{"señal_apertura":"empatia_real"},{"señal_apertura":"silencio_respetuoso"},{"señal_apertura":"pregunta_humana"}]'::jsonb);

-- ============================================================
-- SEED DATA: 8 nombres iniciales
-- ============================================================
INSERT INTO public.client_names (name, gender, avatar_style) VALUES
('Don Ramón', 'masculino', 'señor mexicano 55-65 años, bigote, camisa de cuadros, gesto serio amable'),
('Doña Carmen', 'femenino', 'señora mexicana 55-65 años, cabello recogido, blusa formal, mirada directa'),
('Don Jorge', 'masculino', 'hombre mexicano 45-55 años, lentes, camisa polo, expresión analítica'),
('El Licenciado Herrera', 'masculino', 'ejecutivo mexicano 50 años, traje oscuro, corbata, expresión formal'),
('Don Felipe', 'masculino', 'hombre mexicano 60 años, sombrero o gorra, ropa de trabajo, manos curtidas'),
('Doña Lupita', 'femenino', 'señora mexicana 50 años, sonrisa cálida, delantal o ropa de tienda'),
('Don Roberto', 'masculino', 'empresario mexicano 55 años, guayabera o camisa fina, reloj visible'),
('Don Memo', 'masculino', 'hombre mexicano 40-50 años, look casual moderno, expresión escéptica');
