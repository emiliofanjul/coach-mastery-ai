CREATE TABLE public.node_quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id text NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  question_order integer NOT NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_option text NOT NULL CHECK (correct_option IN ('A','B','C','D')),
  explanation_correct text NOT NULL,
  explanation_wrong text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (node_id, question_order)
);

ALTER TABLE public.node_quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "node_quiz_questions readable by authenticated"
ON public.node_quiz_questions
FOR SELECT
TO authenticated
USING (true);

CREATE INDEX idx_node_quiz_questions_node ON public.node_quiz_questions(node_id, question_order);
