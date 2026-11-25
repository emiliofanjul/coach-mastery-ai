-- Mensaje 171 · Regreso: quita la tabla metas_practica. Nada más la usa salvo closer-voice,
-- que sin ella simplemente no muestra «lo que buscamos» (sigue calificando igual).
DO $do$
BEGIN
  IF to_regclass('public.metas_practica') IS NULL THEN
    RAISE EXCEPTION 'No hay nada que regresar: metas_practica no existe';
  END IF;
END
$do$;
DROP TABLE public.metas_practica;
