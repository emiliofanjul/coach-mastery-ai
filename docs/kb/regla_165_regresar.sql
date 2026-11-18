-- Mensaje 165 · SOLO si hay que regresar: deja objection.vacia_el_cargador como estaba antes del 165.
-- Solo cambia si el texto actual es el del 165 (md5 39c501676aa893dba819baa5e74a7d66); si no, falla y no cambia nada.
DO $do$
DECLARE n int;
BEGIN
  UPDATE public.reglas
     SET resumen = $v$Apilar argumentos en una respuesta: las balas se dosifican. LA PRUEBA: al atender una objeción, ¿el vendedor suelta dos o más balas en la misma respuesta, en vez de una sola antes de cerrar?$v$
   WHERE id = 'objection.vacia_el_cargador'
     AND md5(resumen) = '39c501676aa893dba819baa5e74a7d66';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION 'NO SE CAMBIÓ NADA: objection.vacia_el_cargador no tiene el texto del 165 (filas: %)', n;
  END IF;
END
$do$;

-- Verificación: debe dar f4298c98cefd7f89cc31d2ca917c6c23
SELECT id, md5(resumen) FROM public.reglas WHERE id = 'objection.vacia_el_cargador';
