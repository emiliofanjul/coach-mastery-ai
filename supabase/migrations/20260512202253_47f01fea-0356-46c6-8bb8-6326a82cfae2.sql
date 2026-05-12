ALTER TABLE public.nodes DROP CONSTRAINT IF EXISTS nodes_conversation_scope_check;

ALTER TABLE public.nodes
ADD CONSTRAINT nodes_conversation_scope_check
CHECK (conversation_scope IS NULL OR conversation_scope IN (
  'first_impression',
  'short_story',
  'discovery',
  'presentation',
  'close',
  'full'
));