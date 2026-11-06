-- Mensaje 143 (6-nov-2026) · Recordar también es CPR: el Cerebro y una regla.
-- Cerebro v22 → v23 (recordar también es CPR),
-- 1 reglas, 0 tarjetas, 0 preguntas corregidas y 0 nuevas.
-- Todo protegido: cada cambio se hace solo si lo de hoy es exactamente lo esperado. El chequeo del final aborta si algo no quedó.
-- Correrlo dos veces no cambia nada.

DO $c$ DECLARE v int; BEGIN
  IF EXISTS (SELECT 1 FROM public.doctrina WHERE is_active AND strpos(body, $v$**No requiere cierta personalidad ni ser naturalmente extrovertido: se aprende.**

**Recordar también es CPR** `CAMPO`: con un cliente que ya conoces, retomar lo que te contó de su familia, su ocupación, su recreación, su motivación o su deporte —*"¿y cómo le fue a su hija con lo de la prepa?"*— es hacer CPR. Crear, mantener y hacer crecer la relación personal con el cliente es de lo más importante.$v$) > 0) THEN RAISE NOTICE 'El Cerebro ya tiene el cambio del 143.'; RETURN; END IF;
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  IF v <> 22 THEN RAISE EXCEPTION 'se esperaba el Cerebro v22 y está el v%', v; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE version = v AND is_active AND strpos(body, $v$**No requiere cierta personalidad ni ser naturalmente extrovertido: se aprende.**$v$) > 0) <> 1 THEN RAISE EXCEPTION 'el Cerebro vigente no tiene el texto esperado (cambio 1)'; END IF;
  INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
  SELECT v + 1, section_key, order_index, title, replace(body, $v$**No requiere cierta personalidad ni ser naturalmente extrovertido: se aprende.**$v$, $v$**No requiere cierta personalidad ni ser naturalmente extrovertido: se aprende.**

**Recordar también es CPR** `CAMPO`: con un cliente que ya conoces, retomar lo que te contó de su familia, su ocupación, su recreación, su motivación o su deporte —*"¿y cómo le fue a su hija con lo de la prepa?"*— es hacer CPR. Crear, mantener y hacer crecer la relación personal con el cliente es de lo más importante.$v$), true, created_by
  FROM public.doctrina WHERE version = v AND is_active;
  UPDATE public.doctrina SET is_active = false WHERE is_active AND version = v;
END $c$;

UPDATE public.reglas SET resumen = $v$Create Personal Relations, durante toda la conversación: decide si tus argumentos pesan o se descuentan. LA PRUEBA: cuando el cliente deja ver algo personal —familia, trabajo, pasatiempos, motivaciones, deportes—, ¿el vendedor le entra con interés genuino (una pregunta de seguimiento o un comentario sobre eso) y luego regresa al negocio por su cuenta? Con un cliente que ya conoce, retomar por su cuenta lo personal que ya sabe de él (FORMS) también es CPR. Cuánto pide cada nodo lo dice el nodo.$v$, updated_at = now()
WHERE id = 'relationship.cpr' AND resumen = $v$Create Personal Relations, durante toda la conversación: decide si tus argumentos pesan o se descuentan. LA PRUEBA: cuando el cliente deja ver algo personal —familia, trabajo, pasatiempos, motivaciones, deportes—, ¿el vendedor le entra con interés genuino (una pregunta de seguimiento o un comentario sobre eso) y luego regresa al negocio por su cuenta? Cuánto pide cada nodo lo dice el nodo.$v$;

DO $chk$ BEGIN
  IF (SELECT max(version) FROM public.doctrina WHERE is_active) <> 23 THEN RAISE EXCEPTION 'el Cerebro no quedó en v23'; END IF;
  IF (SELECT count(*) FROM public.doctrina WHERE is_active AND strpos(body, $v$**No requiere cierta personalidad ni ser naturalmente extrovertido: se aprende.**

**Recordar también es CPR** `CAMPO`: con un cliente que ya conoces, retomar lo que te contó de su familia, su ocupación, su recreación, su motivación o su deporte —*"¿y cómo le fue a su hija con lo de la prepa?"*— es hacer CPR. Crear, mantener y hacer crecer la relación personal con el cliente es de lo más importante.$v$) > 0) <> 1 THEN RAISE EXCEPTION 'un cambio del Cerebro no quedó'; END IF;
  IF (SELECT resumen FROM public.reglas WHERE id = 'relationship.cpr') IS DISTINCT FROM $v$Create Personal Relations, durante toda la conversación: decide si tus argumentos pesan o se descuentan. LA PRUEBA: cuando el cliente deja ver algo personal —familia, trabajo, pasatiempos, motivaciones, deportes—, ¿el vendedor le entra con interés genuino (una pregunta de seguimiento o un comentario sobre eso) y luego regresa al negocio por su cuenta? Con un cliente que ya conoce, retomar por su cuenta lo personal que ya sabe de él (FORMS) también es CPR. Cuánto pide cada nodo lo dice el nodo.$v$ THEN RAISE EXCEPTION 'la regla relationship.cpr no quedó'; END IF;
END $chk$;
