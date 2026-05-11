
ALTER TABLE public.nodes ALTER COLUMN conversation_scope DROP DEFAULT;
ALTER TABLE public.nodes ALTER COLUMN conversation_scope DROP NOT NULL;
UPDATE public.nodes SET conversation_scope = NULL WHERE id = '0.0';
