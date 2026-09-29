-- La estructura cuenta la pregunta aunque sea comercial: lo comercial lo castiga
-- pitch_prematuro. (G17: el evaluador a veces descontaba la pregunta comercial
-- de la estructura, además del pitch: doble castigo del mismo hecho.)
UPDATE public.reglas SET resumen = 'La apertura tiene sus tres piezas: saludo, una observación y alguna pregunta que le devuelva la palabra. Si están las tres —aunque la pregunta sea de cortesía, como "¿cómo está?"—, este criterio se CUMPLE. Aquí solo se mide que las piezas estén; la calidad de cada una se mide en su propio criterio (la especificidad en la escalera, la ligereza en el ice breaker). Medirla también aquí sería castigar dos veces el mismo hecho. Si la pregunta es comercial, la pieza igual cuenta: lo comercial lo castiga pitch_prematuro, no la estructura. Castigarlo en los dos lados sería doble castigo.', updated_at = now() WHERE id = 'opening.estructura';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.reglas WHERE id = 'opening.estructura' AND resumen LIKE '%lo castiga pitch_prematuro%')
  THEN RAISE EXCEPTION 'la regla de estructura no quedó actualizada'; END IF;
END $$;
