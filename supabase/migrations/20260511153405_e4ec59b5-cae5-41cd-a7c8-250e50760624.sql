CREATE TABLE public.node_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id text NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  card_order integer NOT NULL,
  card_type text NOT NULL,
  title text,
  body text NOT NULL,
  flip_back_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (node_id, card_order)
);

CREATE INDEX idx_node_cards_node_id_order ON public.node_cards(node_id, card_order);

ALTER TABLE public.node_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "node_cards readable by authenticated"
ON public.node_cards
FOR SELECT
TO authenticated
USING (true);

INSERT INTO public.node_cards (node_id, card_order, card_type, title, body, flip_back_text) VALUES
('0.0', 1, 'concept', 'Título del concepto', 'Aquí va la explicación del concepto. Este texto es placeholder y será reemplazado con el contenido real.', NULL),
('0.0', 2, 'why_it_works', NULL, 'Aquí va la explicación de por qué funciona. Placeholder.', NULL),
('0.0', 3, 'good_example', NULL, 'Aquí va el ejemplo bueno. Placeholder.', 'Aquí va la explicación de por qué funciona. Placeholder.'),
('0.0', 4, 'bad_example', NULL, 'Aquí va el ejemplo malo. Placeholder.', 'Aquí va la explicación de por qué falla. Placeholder.'),
('0.0', 5, 'cta', NULL, 'Ya conoces la base. Ahora entrena el reflejo.', NULL);