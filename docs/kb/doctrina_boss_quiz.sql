-- Mensaje 78 · Doctrina del ataque preventivo, nombres de los boss, críticas en certificación y quiz del 4.7.
-- Decisiones de Emilio (14-oct-2026). Idempotente en lo que se puede; los chequeos del final abortan si algo no quedó.

-- 1. Cerebro: versión nueva completa con el ataque preventivo reescrito.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.doctrina WHERE is_active AND body LIKE '%Tres formas de arruinarlo%') THEN
    RAISE NOTICE 'El Cerebro ya tiene el ataque preventivo nuevo: no se crea otra versión.';
    RETURN;
  END IF;
  INSERT INTO public.doctrina (version, section_key, order_index, title, body, is_active, created_by)
  SELECT (SELECT max(version) FROM public.doctrina WHERE is_active) + 1, section_key, order_index, title,
    replace(replace(replace(body, $v$### Ataque Preventivo `FUENTE` `UNIVERSAL`
**Cuándo:** intro o historia breve, si hay negativos comunes del territorio.
**Cómo:** *"si das la negativa antes de que el cliente lo haga, ya no es una negativa."*

**El mecanismo:** le quitas el argumento de las manos, y además te vuelves creíble — **quien reconoce lo malo se gana el derecho a que le crean lo bueno.**

**Dos formas de arruinarlo:**
- **En tono de disculpa** → deja de ser adelantarse y se vuelve defenderse de algo que nadie reclamó
- **Con un negativo inventado** → no desactivas nada, plantas una preocupación nueva$v$, $v$### Ataque Preventivo `FUENTE + CAMPO` `UNIVERSAL`
**Qué es:** decir tú el negativo antes de que lo diga el cliente. *"si das la negativa antes de que el cliente lo haga, ya no es una negativa."*

**El mecanismo:** le quitas el argumento de las manos, y además te vuelves creíble — **quien reconoce lo malo se gana el derecho a que le crean lo bueno.**

**Cuándo sí:**
1. **En la presentación**, con los negativos conocidos de tu oferta: los que salen con muchos clientes del territorio (precio, mínimos, días de entrega). Lo dices justo antes de que salga, cuando ya hay dolor y valor sobre la mesa.
2. **Al regresar con un cliente que en la visita pasada te dio una objeción**, sobre todo si por ella fue luz roja. Esa objeción es la razón de la nueva visita, y abres con ella: *"Lo vuelvo a visitar porque la vez pasada me comentó que [X], y desde entonces cambiamos [Y]."* Solo si el cambio es real.
3. **Con un cliente que te saca la misma objeción en cada visita:** en la siguiente, adelántasela tú, en la presentación.

**Cuándo no:** al llegar con un cliente nuevo. No abres con negativos que el cliente no ha dicho: le plantas una preocupación que no tenía y hablas de tu oferta antes de diagnosticar.

**Si el cliente saca una mala experiencia al llegar** (*"ya me han fallado"*, *"todos prometen y nadie cumple"*), no es un bloqueo para atravesar con AIR: es una preocupación real y se maneja como objeción, con Feel–Felt–Found, regresando al diagnóstico con una pregunta: *"Entiendo perfecto lo que me dice. De hecho, justo por eso me mandaron a visitarlo: desde hace unos meses solucionamos [X], y varios negocios como el suyo que tenían el mismo problema ya regresaron y están notando el cambio. Pero primero tengo que ver si lo podemos atender o no. ¿Con quién está trabajando ahorita?"* El cambio y los negocios que regresaron tienen que ser reales y comprobables.

**Tres formas de arruinarlo:**
- **En tono de disculpa** → deja de ser adelantarse y se vuelve defenderse de algo que nadie reclamó
- **Con un negativo inventado** → no desactivas nada, plantas una preocupación nueva
- **Con un cambio que no es real** → el cliente lo comprueba en la siguiente entrega y pierdes lo poco que te quedaba de credibilidad$v$), $v$| Bloqueos → AIR, Ataque Preventivo | Salida **impuesta** al inicio |
| Objeciones → RRR, FFF | Salida **impuesta** después de entender |$v$, $v$| Bloqueos → AIR | Salida **impuesta** al inicio |
| Objeciones → RRR, FFF | Salida **impuesta** después de entender |
| Ataque Preventivo | Te adelantas tú a una objeción que ya sabes que viene |$v$), $v$| **Ataque Preventivo** | Intro o historia breve, negativos conocidos del territorio | Da el negativo antes que el cliente |$v$, $v$| **Ataque Preventivo** | En la presentación, con los negativos conocidos de tu oferta; o al regresar con un cliente que ya te dio esa objeción | Da el negativo antes que el cliente |$v$),
    true, created_by
  FROM public.doctrina WHERE version = (SELECT max(version) FROM public.doctrina WHERE is_active);
  UPDATE public.doctrina SET is_active = false
  WHERE is_active AND version < (SELECT max(version) FROM public.doctrina WHERE is_active);
END $$;

-- 2. La regla del ataque preventivo dice cuándo sí y cuándo no.
UPDATE public.reglas SET resumen = $v$Dar tú el negativo antes que el cliente: en la presentación, con los negativos conocidos de tu oferta, o al regresar con un cliente que ya te dio esa objeción. Nunca al llegar con un cliente nuevo.$v$, updated_at = now() WHERE id = 'blocks.ataque_preventivo';

-- 3. Los mundos con acentos, y los boss sin el prefijo "BOSS:" (el mapa ya pone "BOSS DE <paso>").
UPDATE public.worlds SET name = 'La Introducción' WHERE id = 1;
UPDATE public.worlds SET name = 'La Historia Breve' WHERE id = 2;
UPDATE public.worlds SET name = 'El Descubrimiento' WHERE id = 3;
UPDATE public.worlds SET name = 'La Presentación' WHERE id = 4;
UPDATE public.worlds SET name = 'El Cierre' WHERE id = 5;
UPDATE public.worlds SET name = 'La Consolidación' WHERE id = 6;
UPDATE public.worlds SET name = 'Certificación' WHERE id = 7;
UPDATE public.nodes SET name = 'La Primera Impresión' WHERE id = '1.6';
UPDATE public.nodes SET name = 'La Puerta Fría' WHERE id = '2.10';
UPDATE public.nodes SET name = 'El Diagnóstico' WHERE id = '3.10';
UPDATE public.nodes SET name = 'Construye el Valor' WHERE id = '4.16';
UPDATE public.nodes SET name = 'Extrae la Decisión' WHERE id = '5.15';
UPDATE public.nodes SET name = 'De Cliente a Aliado' WHERE id = '6.4';
UPDATE public.nodes SET name = 'Examen: La Conversación Completa' WHERE id = '7.0';
UPDATE public.nodes SET name = 'Examen: La Luz Roja' WHERE id = '7.1';
UPDATE public.nodes SET name = 'Examen: El Indiferente' WHERE id = '7.2';
UPDATE public.nodes SET name = 'Examen: La Visita de Ruta' WHERE id = '7.3';
UPDATE public.nodes SET name = 'Boss Final: El Certificado' WHERE id = '7.4';

-- 4. En los exámenes de certificación, presentar sin conectar con el dolor es crítico.
UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE WHEN f->>'id' = 'presentacion_generica'
                               THEN f || jsonb_build_object('severity', 'critical', 'severity_override', '{"default": "major", "razon": "Certificación: presentar sin conectar con el dolor no puede aprobar un examen (decisión de Emilio, oct-2026)"}'::jsonb)
                               ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('1.0.1'::text))
WHERE n.id = '7.0';
UPDATE public.nodes n
SET practice_script = jsonb_set(
      jsonb_set(n.practice_script, '{failure_criteria}',
        (SELECT jsonb_agg(CASE WHEN f->>'id' = 'presentacion_generica'
                               THEN f || jsonb_build_object('severity', 'critical', 'severity_override', '{"default": "major", "razon": "Certificación: presentar sin conectar con el dolor no puede aprobar un examen (decisión de Emilio, oct-2026)"}'::jsonb)
                               ELSE f END ORDER BY i)
           FROM jsonb_array_elements(n.practice_script->'failure_criteria') WITH ORDINALITY AS t(f, i))),
      '{version}', to_jsonb('1.0.1'::text))
WHERE n.id = '7.2';

-- 5. Quiz del 4.7 (FUJPIG): fácil, una pregunta por idea.
DELETE FROM public.node_quiz_questions WHERE node_id = '4.7';
INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id) VALUES ('4.7', 1, $v$Los seis factores de impulso (FUJPIG) sirven para lo mismo. ¿Para qué?$v$, $v$Para que el cliente quiera comprar ahora: suben su emoción.$v$, $v$Para bajar el precio sin perder margen.$v$, $v$Para conseguir la cita con el dueño.$v$, NULL, 'A', $v$Exacto. El impulso es otra palabra para la emoción, y los seis factores son las seis maneras de subirlo.$v$, $v$No. Los factores no tocan el precio ni la cita: son las seis maneras de subir el impulso, que es otra palabra para la emoción del cliente.$v$, 'impulse.curva');
INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id) VALUES ('4.7', 2, $v$"Varios talleres de esta misma calle ya lo manejan, y le puedo decir cuáles." ¿Qué factor está usando?$v$, $v$Urgencia$v$, $v$Efecto Jones$v$, $v$Avaricia$v$, NULL, 'B', $v$Eso es Efecto Jones: la gente deja que otros negocios como el suyo validen el producto. Y funciona porque se puede comprobar.$v$, $v$Es Efecto Jones: otros negocios como el suyo ya lo hacen. La clave es que sea real y comprobable: si el cliente pregunta "¿como quiénes?", tienes nombres.$v$, 'impulse.efecto_jones');
INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id) VALUES ('4.7', 3, $v$"Si lo deja pasar, el mes que entra le vuelve a faltar el anticongelante en plena temporada." ¿Qué factor es?$v$, $v$Miedo a la pérdida$v$, $v$Indiferencia$v$, $v$Poder de asumir$v$, NULL, 'A', $v$Miedo a la pérdida: lo que el cliente pierde por no decidir. Pesa más que la promesa de ganar.$v$, $v$Es miedo a la pérdida: le muestras lo que se le va si no decide, con algo concreto de su negocio.$v$, 'impulse.miedo_perdida');
INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id) VALUES ('4.7', 4, $v$"Normalmente la caja sale en $1,200; con su volumen le queda en $1,050." ¿Qué factor es?$v$, $v$Urgencia$v$, $v$Avaricia$v$, $v$Efecto Jones$v$, NULL, 'B', $v$Avaricia: el contraste entre lo que costaba y lo que cuesta. La sensación legítima de obtener más por menos.$v$, $v$Es avaricia: el contraste entre lo que normalmente cuesta y lo que le queda a él.$v$, 'impulse.avaricia');
INSERT INTO public.node_quiz_questions (node_id, question_order, question_text, option_a, option_b, option_c, option_d, correct_option, explanation_correct, explanation_wrong, regla_id) VALUES ('4.7', 5, $v$¿Cuál de estas frases NUNCA se vale, aunque suba el impulso?$v$, $v$"Esta promoción termina el viernes", si de verdad termina el viernes.$v$, $v$"Solo me quedan tres cajas", cuando en la bodega hay cien.$v$, $v$"Otros negocios como el suyo ya lo venden", si es verdad.$v$, NULL, 'B', $v$Correcto. El impulso se construye con verdad: una escasez inventada se derrumba en cuanto el cliente la descubre, y se lleva la venta y tu credibilidad.$v$, $v$La que nunca se vale es la escasez inventada. Las otras dos son buenas si son verdad: el impulso se construye con verdad.$v$, 'impulse.escasez_inventada');

-- Chequeos: si algo no quedó, se aborta todo.
DO $$
DECLARE v int; n int;
BEGIN
  SELECT max(version) INTO v FROM public.doctrina WHERE is_active;
  SELECT count(*) INTO n FROM public.doctrina WHERE is_active;
  IF n <> 7 THEN RAISE EXCEPTION 'la versión % del Cerebro tiene % secciones activas, no 7', v, n; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.doctrina WHERE version = v AND body LIKE '%Tres formas de arruinarlo%') THEN RAISE EXCEPTION 'el Cerebro no recibió la sección nueva'; END IF;
  IF EXISTS (SELECT 1 FROM public.doctrina WHERE version = v AND body LIKE '%intro o historia breve, si hay negativos comunes%') THEN RAISE EXCEPTION 'quedó el texto viejo de la sección'; END IF;
  IF EXISTS (SELECT 1 FROM public.doctrina WHERE version = v AND body LIKE '%Intro o historia breve, negativos conocidos del territorio%') THEN RAISE EXCEPTION 'quedó el texto viejo de la tabla de técnicas'; END IF;
  IF EXISTS (SELECT 1 FROM public.doctrina WHERE version = v AND body LIKE '%Bloqueos → AIR, Ataque Preventivo%') THEN RAISE EXCEPTION 'quedó el texto viejo de la línea'; END IF;
  -- Toda cita de las reglas del ataque preventivo sigue existiendo en el Cerebro vigente.
  SELECT count(*) INTO n FROM public.reglas r
   WHERE r.id IN ('blocks.ataque_preventivo','blocks.ataque_en_disculpa','blocks.negativo_inventado')
     AND NOT EXISTS (SELECT 1 FROM public.doctrina d WHERE d.version = v AND replace(d.body, '*', '') LIKE '%' || r.cita_cerebro || '%');
  IF n > 0 THEN RAISE EXCEPTION '% citas del ataque preventivo ya no están en el Cerebro', n; END IF;
  SELECT count(*) INTO n FROM public.nodes, jsonb_array_elements(practice_script->'failure_criteria') f
   WHERE id IN ('7.0','7.2') AND f->>'id' = 'presentacion_generica' AND f->>'severity' = 'critical';
  IF n <> 2 THEN RAISE EXCEPTION 'presentacion_generica critical en % de 2 exámenes', n; END IF;
  SELECT count(*) INTO n FROM public.node_quiz_questions WHERE node_id = '4.7';
  IF n <> 5 THEN RAISE EXCEPTION 'el quiz del 4.7 tiene % preguntas, no 5', n; END IF;
END $$;
