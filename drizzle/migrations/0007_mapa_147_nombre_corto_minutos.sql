-- Mensaje 147 · Fase 3 del rediseño: el mapa.
-- 1) Dos columnas nuevas en nodes: nombre_corto (el que va bajo el nodo en el mapa) y minutos_estimados.
-- 2) Los 75 nombres claros (aprobados por Emilio el 7-nov: cada uno dice la técnica que enseña el nodo) y los minutos de cada nodo:
--    20 s por tarjeta y por pregunta del quiz + 1 min de demostración + 80 % del tiempo máximo
--    de su práctica + 1 min del análisis; mínimo 2. Se ajustarán con lo que tarden las prácticas reales.
-- 3) 13 nombres completos: acentos que faltaban, «El Rompe Hielo» (decisión de Emilio) y los del
--    mundo 7 sin «Examen:» ni «Boss Final:» (en el mapa ahora dicen «Reto final»).
-- Cada nombre completo cambia solo si hoy es exactamente el esperado. El chequeo del final aborta todo si algo no quedó.

ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS nombre_corto text;
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS minutos_estimados integer;

UPDATE public.nodes AS n SET nombre_corto = v.corto, minutos_estimados = v.minutos
FROM (VALUES
  ('1.0', 'Los 6 pasos de la venta', 3),
  ('1.1', 'SCE al llegar', 4),
  ('1.2', 'Abrir con un comentario', 5),
  ('1.3', 'Llegar con seguridad', 2),
  ('1.4', 'No pedir permiso', 5),
  ('1.5', 'Romper el hielo', 5),
  ('1.6', 'La llegada completa', 6),
  ('2.0', 'Historia breve: KISS', 2),
  ('2.1', 'Historia breve en vivo', 5),
  ('2.2', 'Terminar en pregunta', 6),
  ('2.3', 'CPR: crear confianza', 2),
  ('2.4', 'FORMS: de qué platicar', 3),
  ('2.5', 'Desviarse y regresar', 6),
  ('2.6', 'Bloqueo u objeción', 3),
  ('2.7', 'AIR en vivo', 6),
  ('2.7b', 'Dos «no»: hoy no es el día', 2),
  ('2.7c', 'Dos «no» en vivo', 5),
  ('2.8', 'Cliente con mala experiencia', 5),
  ('2.9', 'Seguir sin esperar permiso', 6),
  ('2.10', 'Abrir la plática completa', 6),
  ('3.0', 'Los 3 territorios del dolor', 4),
  ('3.1', 'RRR: lee, conecta, relaja', 6),
  ('3.2', 'Preguntas por capas', 8),
  ('3.3', 'Preguntar con lo que dijo', 6),
  ('3.4', 'CPR mientras preguntas', 6),
  ('3.5', '10/80/10: a quién dedicarte', 3),
  ('3.6', 'Salir con la puerta abierta', 6),
  ('3.7', 'Dolor y hueco', 2),
  ('3.8', 'Las 3 preguntas del lugar', 6),
  ('3.9', 'Encontrar el hueco', 7),
  ('3.9b', 'Cuando te piden solo', 7),
  ('3.10', 'El diagnóstico completo', 6),
  ('4.0', 'Valor contra costo', 3),
  ('4.1', 'Presentar sobre su dolor', 6),
  ('4.2', 'Beneficio, no característica', 6),
  ('4.3', 'Pintar la imagen', 6),
  ('4.4', 'La curva de impulso', 3),
  ('4.5', 'Las balas', 3),
  ('4.6', 'Una bala a la vez', 6),
  ('4.7', 'FUJPIG: las 6 emociones', 4),
  ('4.8', 'Lo que pierde por esperar', 6),
  ('4.9', 'Más por menos y Jones', 6),
  ('4.10', 'La postura indiferente', 6),
  ('4.11', 'Lenguaje asumido', 6),
  ('4.12', 'El tren del sí', 6),
  ('4.13', 'Triple desglose de precio', 3),
  ('4.14', 'Dar el precio y avanzar', 6),
  ('4.15', 'Presentar el hueco', 6),
  ('4.16', 'La presentación completa', 7),
  ('5.0', 'Cierres que sí funcionan', 2),
  ('5.1', 'Cierre asumido', 5),
  ('5.2', 'FISHBBOD: señales de compra', 2),
  ('5.3', 'Cerrar en el pico', 6),
  ('5.4', 'La objeción es interés', 2),
  ('5.5', 'RRR de objeciones', 2),
  ('5.6', 'RRR de objeciones en vivo', 6),
  ('5.7', 'FFF: la preocupación real', 2),
  ('5.8', 'FFF en vivo', 5),
  ('5.9', 'El círculo de cierre', 2),
  ('5.10', 'El círculo en vivo', 6),
  ('5.11', 'Dos «no» y te retiras', 2),
  ('5.12', 'Varias objeciones seguidas', 6),
  ('5.13', 'Cerrar y callarte', 5),
  ('5.14', 'Cerrar el incremento', 6),
  ('5.15', 'El cierre completo', 8),
  ('6.0', 'Evitar el arrepentimiento', 2),
  ('6.1', 'No volver a presentar', 3),
  ('6.2', 'Despedirte en positivo', 5),
  ('6.3', 'Pedir referidos', 5),
  ('6.4', 'Consolidar la venta', 5),
  ('7.0', 'La venta completa', 8),
  ('7.1', 'Cliente en luz roja', 5),
  ('7.2', 'Cliente indiferente', 7),
  ('7.3', 'Visita a cliente actual', 7),
  ('7.4', 'La certificación', 9)
) AS v(id, corto, minutos)
WHERE n.id = v.id;

UPDATE public.nodes AS n SET name = v.nuevo
FROM (VALUES
  ('1.0', 'La Linea Recta', 'La Línea Recta'),
  ('1.5', 'El Ice Breaker', 'El Rompe Hielo'),
  ('2.0', 'Quien Eres en 15 Segundos', 'Quién Eres en 15 Segundos'),
  ('2.5', 'El Desvio con Regreso', 'El Desvío con Regreso'),
  ('3.5', 'Luz Verde: A Quien Le Dedicas Tu Tiempo', 'Luz Verde: A Quién Le Dedicas Tu Tiempo'),
  ('4.2', 'Beneficio, No Caracteristica', 'Beneficio, No Característica'),
  ('4.9', 'Mas por Menos y el Efecto Jones', 'Más por Menos y el Efecto Jones'),
  ('5.11', 'Cuando Soltar', 'Cuándo Soltar'),
  ('7.0', 'Examen: La Conversación Completa', 'La Conversación Completa'),
  ('7.1', 'Examen: La Luz Roja', 'La Luz Roja'),
  ('7.2', 'Examen: El Indiferente', 'El Indiferente'),
  ('7.3', 'Examen: La Visita de Ruta', 'La Visita de Ruta'),
  ('7.4', 'Boss Final: El Certificado', 'El Certificado')
) AS v(id, viejo, nuevo)
WHERE n.id = v.id AND n.name = v.viejo;

DO $chk$
DECLARE faltan int; malos int;
BEGIN
  SELECT 75 - count(*) INTO faltan FROM public.nodes WHERE id IN ('1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '2.7b', '2.7c', '2.8', '2.9', '2.10', '3.0', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '3.9', '3.9b', '3.10', '4.0', '4.1', '4.2', '4.3', '4.4', '4.5', '4.6', '4.7', '4.8', '4.9', '4.10', '4.11', '4.12', '4.13', '4.14', '4.15', '4.16', '5.0', '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8', '5.9', '5.10', '5.11', '5.12', '5.13', '5.14', '5.15', '6.0', '6.1', '6.2', '6.3', '6.4', '7.0', '7.1', '7.2', '7.3', '7.4') AND nombre_corto IS NOT NULL AND nombre_corto <> '' AND minutos_estimados >= 1;
  IF faltan > 0 THEN RAISE EXCEPTION 'Mensaje 147: % de los 75 nodos sin nombre corto o sin minutos (¿falta alguno?)', faltan; END IF;
  SELECT count(*) INTO malos FROM public.nodes AS n JOIN (VALUES
    ('1.0', 'La Línea Recta'),
    ('1.5', 'El Rompe Hielo'),
    ('2.0', 'Quién Eres en 15 Segundos'),
    ('2.5', 'El Desvío con Regreso'),
    ('3.5', 'Luz Verde: A Quién Le Dedicas Tu Tiempo'),
    ('4.2', 'Beneficio, No Característica'),
    ('4.9', 'Más por Menos y el Efecto Jones'),
    ('5.11', 'Cuándo Soltar'),
    ('7.0', 'La Conversación Completa'),
    ('7.1', 'La Luz Roja'),
    ('7.2', 'El Indiferente'),
    ('7.3', 'La Visita de Ruta'),
    ('7.4', 'El Certificado')
  ) AS v(id, nuevo) ON n.id = v.id WHERE n.name <> v.nuevo;
  IF malos > 0 THEN RAISE EXCEPTION 'Mensaje 147: % nombres completos no quedaron como se esperaba (¿alguno estaba distinto?)', malos; END IF;
END $chk$;