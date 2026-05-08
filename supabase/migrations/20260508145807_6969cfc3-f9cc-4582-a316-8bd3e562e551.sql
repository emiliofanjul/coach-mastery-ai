-- Swap content of worlds 0 and 1: world 0 becomes "La Introducción", world 1 becomes "Mentalidad"
CREATE TEMP TABLE _w_swap AS SELECT * FROM public.worlds WHERE id IN (0,1);

UPDATE public.worlds w
SET name = t.name,
    emotional_name = t.emotional_name,
    description = t.description,
    color = t.color,
    icon = t.icon,
    boss_level_name = t.boss_level_name,
    boss_level_description = t.boss_level_description
FROM _w_swap t
WHERE (w.id = 0 AND t.id = 1) OR (w.id = 1 AND t.id = 0);

-- Swap nodes: ids '0.x' <-> '1.x' and world_id 0 <-> 1
UPDATE public.nodes SET id = 'TMP_' || id WHERE world_id IN (0,1);

UPDATE public.nodes
SET id = '1.' || substring(id from 7),
    world_id = 1
WHERE id LIKE 'TMP_0.%';

UPDATE public.nodes
SET id = '0.' || substring(id from 7),
    world_id = 0
WHERE id LIKE 'TMP_1.%';

-- Swap 0/1 inside archetype world availability arrays
UPDATE public.client_archetypes
SET worlds_available = ARRAY(
  SELECT CASE WHEN x = 0 THEN 1 WHEN x = 1 THEN 0 ELSE x END
  FROM unnest(worlds_available) x
)
WHERE 0 = ANY(worlds_available) OR 1 = ANY(worlds_available);

-- Ensure sellers point to first node of new World 0 (La Introducción)
UPDATE public.sellers
SET current_world = 0, current_node = '0.1'
WHERE current_world IN (0,1);