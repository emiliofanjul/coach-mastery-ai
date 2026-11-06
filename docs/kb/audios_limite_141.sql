-- Mensaje 141 (6-nov-2026) · Seguridad 2: límite de tamaño para los audios de práctica.
-- Hoy el bucket practice-audio no tiene límite. El audio más grande que existe pesa 5.0 MB (el 95% pesa 4.2 MB o menos).
-- La app graba WAV mono de 16 kHz y 16 bits: 32 KB por segundo de voz del vendedor. 50 MB son unos 27 minutos de voz,
-- diez veces el audio más grande de hoy: ninguna práctica real se acerca. Solo cambia el tamaño máximo; los tipos de
-- archivo NO se restringen (hoy llegan audio/wav y audio/webm;codecs=opus, y un filtro mal puesto haría perder audios).
-- Protegido: solo cambia si hoy no hay límite. Correrlo dos veces no cambia nada.
UPDATE storage.buckets SET file_size_limit = 52428800
WHERE id = 'practice-audio' AND file_size_limit IS NULL;

DO $chk$ BEGIN
  IF (SELECT file_size_limit FROM storage.buckets WHERE id = 'practice-audio') IS DISTINCT FROM 52428800 THEN
    RAISE EXCEPTION 'el límite de practice-audio no quedó en 50 MB';
  END IF;
  IF (SELECT allowed_mime_types FROM storage.buckets WHERE id = 'practice-audio') IS NOT NULL THEN
    RAISE EXCEPTION 'practice-audio tiene filtro de tipos: no se esperaba';
  END IF;
END $chk$;
