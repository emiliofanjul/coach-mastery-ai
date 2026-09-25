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