-- Solo lectura. Tiene que salir: 17 | true | true | true
SELECT
  (SELECT max(version) FROM public.doctrina WHERE is_active) AS version_cerebro,
  (SELECT count(*) = 1 FROM public.doctrina WHERE is_active AND strpos(body, '**Cuándo el dolor ya está contado** `CAMPO`') > 0) AS cerebro_tiene_el_parrafo,
  (SELECT strpos(resumen, 'El dolor ya está contado cuando el cliente dijo qué le pasa y qué le cuesta') > 0 FROM public.reglas WHERE id = 'discovery.escalera_capas') AS regla_tiene_la_prueba,
  (SELECT count(*) = 0 FROM public.doctrina WHERE is_active AND version <> 17) AS solo_v17_activa;
