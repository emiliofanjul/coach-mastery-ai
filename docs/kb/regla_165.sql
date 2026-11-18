-- Mensaje 165 · objection.vacia_el_cargador: la prueba aclara que «lo que encontraron» del FFF no es bala.
-- Misma frase que ya trae objection.cierra_sin_bala (Cerebro, paso 4 del FFF: «"Lo que encontramos" no es la bala: es el paso 3. La bala va aparte, después.»).
-- Solo cambia si el texto actual es exactamente el esperado (md5 f4298c98cefd7f89cc31d2ca917c6c23); si no, falla y no cambia nada.
DO $do$
DECLARE n int;
BEGIN
  UPDATE public.reglas
     SET resumen = $v$Apilar argumentos en una respuesta: las balas se dosifican. LA PRUEBA: al atender una objeción, ¿el vendedor suelta dos o más balas en la misma respuesta, en vez de una sola antes de cerrar? «Lo que encontraron» de FFF no cuenta como bala, aunque sea concreto: es la tercera F, y la bala va aparte.$v$
   WHERE id = 'objection.vacia_el_cargador'
     AND md5(resumen) = 'f4298c98cefd7f89cc31d2ca917c6c23';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION 'NO SE CAMBIÓ NADA: objection.vacia_el_cargador no tiene el texto esperado (filas: %)', n;
  END IF;
END
$do$;

-- Verificación: debe dar 39c501676aa893dba819baa5e74a7d66
SELECT id, md5(resumen) FROM public.reglas WHERE id = 'objection.vacia_el_cargador';
