-- ============================================================
-- La ligereza se juzga en lo que dice el vendedor, nunca por la reacción
-- del cliente (decisión de Emilio, sept-2026).
--
-- "Un chiste que le da risa a casi todo el mundo puede no darle risa a un
-- red light o a una persona que viene enojada ese día, y no por eso se hizo
-- mal." Cerebro: controlables vs no controlables; KILT — indiferencia.
--
-- Requisito: la sección "Especificidad y ligereza son dos cosas distintas"
-- ya debe estar en la tabla doctrina.
-- ============================================================
UPDATE public.reglas SET resumen = 'Cumplido genuino, chiste sencillo o comentario ligero sobre la persona, el lugar o algo en común. Entregarlo como pregunta es la forma que permite al cliente responder y relajarse. La ligereza se juzga en lo que dice el vendedor —humor suave, un guiño o calidez en las palabras—, nunca por la reacción del cliente: un buen chiste que no le hace gracia a un cliente rojo o de mal humor se hizo bien. Especificidad y ligereza son cosas distintas: esta regla mide la ligereza; la especificidad la mide opening.especificidad.', updated_at = now()
WHERE id = 'opening.ice_breaker';

DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.reglas WHERE id = 'opening.ice_breaker' AND resumen LIKE '%nunca por la reacción del cliente%';
  IF n <> 1 THEN RAISE EXCEPTION 'la regla del ice breaker no quedó actualizada'; END IF;
END $$;
