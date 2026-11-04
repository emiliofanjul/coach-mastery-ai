-- Solo lectura. Tiene que salir: 18 | true | 3 | true
SELECT
  (SELECT max(version) FROM public.doctrina WHERE is_active) AS version_cerebro,
  (SELECT count(*) = 1 FROM public.doctrina WHERE is_active AND strpos(body, '**El «no» que invita** `CAMPO`') > 0) AS cerebro_tiene_el_parrafo,
  (SELECT count(*) FROM public.reglas WHERE id IN ('blocks.insistir_tras_dos_no','flow.dos_no_seguidos','blocks.dos_no_seguidos') AND (strpos(resumen, 'contestar su invitación no es insistir') > 0 OR strpos(resumen, 'contestarle no es insistir') > 0)) AS reglas_con_la_invitacion,
  (SELECT count(*) = 0 FROM public.doctrina WHERE is_active AND version <> 18) AS solo_v18_activa;
