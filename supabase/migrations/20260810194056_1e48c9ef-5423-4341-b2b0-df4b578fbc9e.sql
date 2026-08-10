GRANT UPDATE, DELETE ON public.worlds TO authenticated;

CREATE POLICY "emilio_can_update_worlds" ON public.worlds
  FOR UPDATE TO authenticated
  USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid)
  WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_delete_worlds" ON public.worlds
  FOR DELETE TO authenticated
  USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);