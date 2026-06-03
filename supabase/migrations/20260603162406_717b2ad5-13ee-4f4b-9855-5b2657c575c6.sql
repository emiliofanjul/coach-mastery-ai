UPDATE public.nodes
SET practice_script = jsonb_set(
  COALESCE(practice_script, '{}'::jsonb),
  '{i_do_type}',
  '"demo"'::jsonb,
  true
)
WHERE id = '0.1';