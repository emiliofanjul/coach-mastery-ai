-- La Regla de los No (sept-2026). Estaba en el Cerebro (Manejo de objeciones)
-- pero no en el registro: ni el evaluador ni el cliente simulado la conocían.
-- En el BOSS 3.10, el cliente dio un tercer "no" y el evaluador castigó la
-- salida correcta del vendedor.
INSERT INTO public.reglas (id, paso, tipo, canal, procedencia, resumen, cita_cerebro)
VALUES ('objections.regla_de_los_no', 0, 'principio', 'universal', 'CAMPO', 'La Regla de los No: tres ''no'' CONSECUTIVOS son luz roja (la fuente dice dos; Emilio usa tres, porque hay quien deja ir un sí solo porque el cliente tuvo objeciones). Con la luz roja, el vendedor sale rápido y bien: sin insistir, cuidando la relación y dejando una siguiente cita. Tienen que ser seguidos: si la conversación avanzó entre un no y otro, la racha se rompe. Salir así es la ejecución correcta, no una falta.', 'dos no seguidos, luz roja, sigue adelante')
ON CONFLICT (id) DO UPDATE SET resumen = EXCLUDED.resumen, cita_cerebro = EXCLUDED.cita_cerebro, updated_at = now();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.doctrina d, public.reglas r
                 WHERE d.is_active AND r.id = 'objections.regla_de_los_no' AND d.body LIKE '%' || r.cita_cerebro || '%')
  THEN RAISE EXCEPTION 'la cita de la Regla de los No no está en el Cerebro vigente'; END IF;
END $$;
