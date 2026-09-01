GRANT SELECT, INSERT, UPDATE, DELETE ON public.node_skills TO authenticated;
GRANT ALL ON public.node_skills TO service_role;

CREATE POLICY "emilio_can_insert_node_skills" ON public.node_skills
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_update_node_skills" ON public.node_skills
  FOR UPDATE TO authenticated
  USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid)
  WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_delete_node_skills" ON public.node_skills
  FOR DELETE TO authenticated
  USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);