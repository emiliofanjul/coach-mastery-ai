-- Mensaje 174 · Regreso: quita las tres tablas. closer-voice sin ellas simplemente no pone el porqué (califica igual).
DO $do$
BEGIN
  IF to_regclass('public.mecanismos') IS NULL THEN
    RAISE EXCEPTION 'No hay nada que regresar: mecanismos no existe';
  END IF;
END
$do$;
DROP TABLE public.va_despues;
DROP TABLE public.reglas_mecanismo;
DROP TABLE public.mecanismos;
