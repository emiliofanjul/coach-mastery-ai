
-- Tabla de cache de recomendaciones de coaching AI por vendedor
CREATE TABLE public.coach_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.sellers(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  prioridad text NOT NULL,
  plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  fortaleza text,
  input_summary jsonb,
  model text NOT NULL,
  prompt_version text NOT NULL DEFAULT 'v1',
  last_event_id uuid,
  events_considered int NOT NULL DEFAULT 0,
  notes_considered int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(seller_id)
);

GRANT SELECT ON public.coach_recommendations TO authenticated;
GRANT ALL ON public.coach_recommendations TO service_role;

ALTER TABLE public.coach_recommendations ENABLE ROW LEVEL SECURITY;

-- Managers de la empresa leen las recomendaciones de sus vendedores
CREATE POLICY "manager reads coach_recommendations of company"
  ON public.coach_recommendations FOR SELECT
  TO authenticated
  USING (public.is_manager() AND company_id = public.current_company_id());

-- El vendedor puede leer su propia recomendación (por si en el futuro se muestra)
CREATE POLICY "seller reads own coach_recommendations"
  ON public.coach_recommendations FOR SELECT
  TO authenticated
  USING (public.owns_seller(seller_id));

CREATE TRIGGER trg_coach_recommendations_updated_at
  BEFORE UPDATE ON public.coach_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_coach_recommendations_seller ON public.coach_recommendations(seller_id);
CREATE INDEX idx_coach_recommendations_company ON public.coach_recommendations(company_id);
