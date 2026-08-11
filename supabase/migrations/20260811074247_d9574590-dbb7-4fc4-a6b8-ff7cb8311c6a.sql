CREATE TABLE public.company_pitches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_type text NOT NULL CHECK (client_type IN ('nuevo','recurrente','autoconsumo','distribuidor')),
  channel text NOT NULL DEFAULT 'presencial' CHECK (channel IN ('presencial','telefono','whatsapp')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  version int NOT NULL DEFAULT 1,
  created_by uuid REFERENCES public.profiles(id),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX company_pitches_unique_active
  ON public.company_pitches (company_id, client_type, channel)
  WHERE status <> 'archived';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_pitches TO authenticated;
GRANT ALL ON public.company_pitches TO service_role;
ALTER TABLE public.company_pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers manage own company pitches" ON public.company_pitches
  FOR ALL TO authenticated
  USING (public.is_manager() AND company_id = public.current_company_id())
  WITH CHECK (public.is_manager() AND company_id = public.current_company_id());

CREATE POLICY "Members read published pitches" ON public.company_pitches
  FOR SELECT TO authenticated
  USING (status = 'published' AND company_id = public.current_company_id());

CREATE TRIGGER company_pitches_set_updated_at
  BEFORE UPDATE ON public.company_pitches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.pitch_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL REFERENCES public.company_pitches(id) ON DELETE CASCADE,
  step int NOT NULL,
  section_key text NOT NULL CHECK (section_key IN ('introduccion','historia_breve','descubrimiento','presentacion','cierre','consolidacion')),
  order_index int NOT NULL,
  content text,
  rationale text,
  skill_ids text[] NOT NULL DEFAULT '{}',
  alternatives jsonb NOT NULL DEFAULT '[]',
  section_kind text NOT NULL DEFAULT 'guion' CHECK (section_kind IN ('guion','municion')),
  edited_by_manager boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pitch_sections_pitch_idx ON public.pitch_sections (pitch_id, order_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitch_sections TO authenticated;
GRANT ALL ON public.pitch_sections TO service_role;
ALTER TABLE public.pitch_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers manage own pitch sections" ON public.pitch_sections
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.company_pitches p WHERE p.id = pitch_id AND p.company_id = public.current_company_id()) AND public.is_manager())
  WITH CHECK (EXISTS (SELECT 1 FROM public.company_pitches p WHERE p.id = pitch_id AND p.company_id = public.current_company_id()) AND public.is_manager());

CREATE POLICY "Members read published pitch sections" ON public.pitch_sections
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.company_pitches p WHERE p.id = pitch_id AND p.company_id = public.current_company_id() AND p.status = 'published'));

CREATE TABLE public.pitch_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL REFERENCES public.company_pitches(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.pitch_sections(id) ON DELETE SET NULL,
  manager_message text,
  closer_response text,
  classification text CHECK (classification IN ('estilo','hecho','doctrina')),
  outcome text CHECK (outcome IN ('aceptado','rechazado','forzado_por_manager')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitch_feedback TO authenticated;
GRANT ALL ON public.pitch_feedback TO service_role;
ALTER TABLE public.pitch_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers manage own pitch feedback" ON public.pitch_feedback
  FOR ALL TO authenticated
  USING (public.is_manager() AND EXISTS (SELECT 1 FROM public.company_pitches p WHERE p.id = pitch_id AND p.company_id = public.current_company_id()))
  WITH CHECK (public.is_manager() AND EXISTS (SELECT 1 FROM public.company_pitches p WHERE p.id = pitch_id AND p.company_id = public.current_company_id()));

CREATE TABLE public.pitch_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id uuid NOT NULL REFERENCES public.company_pitches(id) ON DELETE CASCADE,
  version int NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}',
  published_by uuid REFERENCES public.profiles(id),
  published_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pitch_versions TO authenticated;
GRANT ALL ON public.pitch_versions TO service_role;
ALTER TABLE public.pitch_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers manage own pitch versions" ON public.pitch_versions
  FOR ALL TO authenticated
  USING (public.is_manager() AND EXISTS (SELECT 1 FROM public.company_pitches p WHERE p.id = pitch_id AND p.company_id = public.current_company_id()))
  WITH CHECK (public.is_manager() AND EXISTS (SELECT 1 FROM public.company_pitches p WHERE p.id = pitch_id AND p.company_id = public.current_company_id()));