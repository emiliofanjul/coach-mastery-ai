GRANT INSERT, UPDATE, DELETE ON TABLE public.nodes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.node_cards TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.node_quiz_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.skills TO authenticated;

CREATE POLICY "emilio_can_insert_nodes"
ON public.nodes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_update_nodes"
ON public.nodes
FOR UPDATE
TO authenticated
USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid)
WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_delete_nodes"
ON public.nodes
FOR DELETE
TO authenticated
USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_insert_node_cards"
ON public.node_cards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_update_node_cards"
ON public.node_cards
FOR UPDATE
TO authenticated
USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid)
WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_delete_node_cards"
ON public.node_cards
FOR DELETE
TO authenticated
USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_insert_node_quiz_questions"
ON public.node_quiz_questions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_update_node_quiz_questions"
ON public.node_quiz_questions
FOR UPDATE
TO authenticated
USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid)
WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_delete_node_quiz_questions"
ON public.node_quiz_questions
FOR DELETE
TO authenticated
USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_insert_skills"
ON public.skills
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_update_skills"
ON public.skills
FOR UPDATE
TO authenticated
USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid)
WITH CHECK (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);

CREATE POLICY "emilio_can_delete_skills"
ON public.skills
FOR DELETE
TO authenticated
USING (auth.uid() = '59940ac9-fc91-43b5-a7a5-9555953eb39b'::uuid);