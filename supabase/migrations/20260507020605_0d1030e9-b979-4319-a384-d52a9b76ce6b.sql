
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS difficulty_level integer NOT NULL DEFAULT 1;

-- Non-boss difficulty by world
UPDATE public.nodes SET difficulty_level = 1 WHERE is_boss = false AND world_id IN (0,1);
UPDATE public.nodes SET difficulty_level = 2 WHERE is_boss = false AND world_id IN (2,3);
UPDATE public.nodes SET difficulty_level = 3 WHERE is_boss = false AND world_id IN (4,5);
UPDATE public.nodes SET difficulty_level = 4 WHERE is_boss = false AND world_id IN (6,7);
UPDATE public.nodes SET difficulty_level = 5 WHERE is_boss = false AND world_id IN (8,9);

-- Boss difficulty (per spec)
UPDATE public.nodes SET difficulty_level = 2 WHERE is_boss = true AND world_id = 0;
UPDATE public.nodes SET difficulty_level = 2 WHERE is_boss = true AND world_id = 1;
UPDATE public.nodes SET difficulty_level = 3 WHERE is_boss = true AND world_id = 2;
UPDATE public.nodes SET difficulty_level = 3 WHERE is_boss = true AND world_id = 3;
UPDATE public.nodes SET difficulty_level = 4 WHERE is_boss = true AND world_id = 4;
UPDATE public.nodes SET difficulty_level = 4 WHERE is_boss = true AND world_id = 5;
UPDATE public.nodes SET difficulty_level = 4 WHERE is_boss = true AND world_id = 6;
UPDATE public.nodes SET difficulty_level = 5 WHERE is_boss = true AND world_id = 7;
UPDATE public.nodes SET difficulty_level = 5 WHERE is_boss = true AND world_id = 8;
UPDATE public.nodes SET difficulty_level = 5 WHERE is_boss = true AND world_id = 9;
