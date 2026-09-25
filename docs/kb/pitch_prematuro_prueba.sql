-- ============================================================
-- opening.pitch_prematuro: de LISTA a PRUEBA
--
-- Decisión de Emilio (sept-2026): preguntar por proveedores en la apertura
-- es pitch_prematuro. Pero la corrección no es agregar "proveedores" a una
-- lista: una lista siempre está incompleta, y con el alcance cerrado del
-- evaluador, lo que no está en la lista no se castiga.
--
-- La regla ahora define una PRUEBA: ¿esta frase solo tiene sentido si vienes
-- a venderle? Los ejemplos ilustran; no delimitan. El evaluador aprende a leer
-- reglas así en la regla 9c de su prompt.
--
-- Respaldo en el Cerebro: Paso 1 — "aquí no dices quién eres ni a qué
-- vienes"; y el proveedor actual es el territorio SERVICIO del Descubrimiento.
-- El resolver lee la regla en vivo: llega a los 10 nodos que la usan.
-- ============================================================

UPDATE public.reglas
SET resumen = 'Revelar a qué vienes antes de conectar. LA PRUEBA: ¿esta frase solo tiene sentido si vienes a venderle? Si la respuesta es sí, es pitch prematuro, aunque no se mencione ningún producto. Ejemplos que ilustran —no delimitan—: ofrecer producto o promoción; preguntar por su proveedor, sus precios, sus marcas, su inventario, sus volúmenes o cada cuánto le surten. No cae aquí una pregunta sobre él o sobre cómo le va (cómo estuvo la semana, si siempre está así de movido): esa conversación la tendría cualquiera y no revela intención de venta.',
    updated_at = now()
WHERE id = 'opening.pitch_prematuro';

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.reglas
  WHERE id = 'opening.pitch_prematuro' AND resumen LIKE '%LA PRUEBA:%';
  IF n <> 1 THEN RAISE EXCEPTION 'opening.pitch_prematuro no quedó escrita como prueba'; END IF;
END $$;
