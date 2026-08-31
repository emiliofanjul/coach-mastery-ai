CREATE TABLE public.doctrina (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL,
  section_key text NOT NULL,
  order_index integer NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

CREATE INDEX doctrina_active_idx ON public.doctrina (is_active, version, order_index);

GRANT SELECT ON public.doctrina TO authenticated;
GRANT ALL ON public.doctrina TO service_role;

ALTER TABLE public.doctrina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctrina_read_authenticated" ON public.doctrina
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "doctrina_write_owner" ON public.doctrina
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "doctrina_update_owner" ON public.doctrina
  FOR UPDATE TO authenticated
  USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid)
  WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "doctrina_delete_owner" ON public.doctrina
  FOR DELETE TO authenticated
  USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);