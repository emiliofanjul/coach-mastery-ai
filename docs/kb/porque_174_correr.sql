-- Mensaje 174 · El porqué de cada falla (doc aprobado por Emilio el 24-nov-2026: «La línea recta y el porqué»).
--
-- Tres tablas nuevas, solo de lectura para la app:
--   mecanismos        los 12 mecanismos del Cerebro, con su «por qué funciona»;
--   reglas_mecanismo  cada una de las 116 reglas que califican, con su mecanismo;
--   va_despues        las 4 reglas de hacer algo antes de tiempo: dónde sí va y por qué ahí.
-- closer-voice las lee al calificar y le pone su porqué a cada falla y observación.
-- El evaluador NO las lee: no cambia ninguna nota. No toca ninguna otra tabla.
--
-- Para la herramienta de la base de Lovable: sin BEGIN/COMMIT (ella abre y cierra la
-- transacción). Si algo no está como se espera, falla y NO cambia nada.

DO $do$
BEGIN
  IF to_regclass('public.mecanismos') IS NOT NULL OR to_regclass('public.reglas_mecanismo') IS NOT NULL OR to_regclass('public.va_despues') IS NOT NULL THEN
    RAISE EXCEPTION '174 ya se aplicó: alguna de las tablas ya existe';
  END IF;
  IF (SELECT count(*) FROM public.reglas WHERE id IN ('blocks.air','blocks.air_sin_aceptar','blocks.air_sin_resume','blocks.ataque_en_disculpa','blocks.discute_bloqueo','blocks.dos_no_seguidos','blocks.insistir_tras_dos_no','blocks.mala_experiencia_al_llegar','blocks.se_rinde_al_bloqueo','close.aguanta_silencio','close.alternativa','close.asume_con_presion','close.asumir_venta','close.cierra_solo_incremento','close.descuento_de_panico','close.devuelve_el_volante','close.fishbbod','close.llena_el_silencio','close.mal_cierre','close.persigue','close.pide_aprobacion','close.reabre_pedido_base','close.sigue_presentando','close_with_action','consolidation.misma_actitud','consolidation.referido_en_frio','consolidation.rehash','consolidation.salida_seca','consolidation.sigue_vendiendo','consolidation.siguientes_pasos','consolidation.sobre_celebra','develop.visita_tramite','discovery.barrido','discovery.bordes_restriccion','discovery.dolor_directo','discovery.escalera_capas','discovery.escucha','discovery.fabrica_dolor','discovery.hueco','discovery.hueco_inventado','discovery.interrogatorio','discovery.lectura_falsa','discovery.lee_el_lugar','discovery.opinion_de_precio','discovery.pregunta_especifica','discovery.qtqp','discovery.receta_sin_diagnostico','discovery.rojo_insistir','discovery.rojo_vs_amarrado','discovery.rrr','discovery.solo_cerradas','discovery.suelta_amarrado','discovery.suggestive_language','impulse.avaricia','impulse.efecto_jones','impulse.factores','impulse.indiferencia','impulse.indiferencia_teatral','impulse.jones_vago','impulse.miedo_perdida','impulse.miedo_perdida_generico','impulse.presion_directa','impulse.ruega','impulse.tren_del_si','impulse.urgencia','monologo','objection.air_a_objecion','objection.cierra_sin_bala','objection.circulo_de_cierre','objection.discutir','objection.fff','objection.rrr','objection.rrr_sin_resume','objection.se_desanima','objection.vacia_el_cargador','opening.curiosidad_abierta','opening.energia_verbal','opening.especificidad','opening.estructura','opening.gasman','opening.halago_falso','opening.ice_breaker','opening.pide_permiso','opening.pitch_prematuro','opening.pregunta_cerrada','opening.se_disculpa','opening.sin_pregunta','present.argumento_del_hueco','present.ataca_proveedor','present.bala_generica','present.balas','present.beneficio_no_caracteristica','present.capital_del_record','present.caracteristica_sin_traducir','present.consolidacion_falsa','present.dos_mitades','present.dosificacion_balas','present.escalon_sin_motivo','present.garantiza','present.pide_que_pruebe','present.pintar_imagenes','present.plan_b','present.precio_unico','present.triple_desglose','relationship.cpr','relationship.familiaridad_excesiva','relationship.forms','relationship.interes_fingido','story.cierra_con_afirmacion','story.kill','story.kill_curriculum','story.kiss','story.nunca_sale','story.pregunta_despues','story.quien_eres_por_que','story.sale_sin_regresar')) <> 116 THEN
    RAISE EXCEPTION 'No están las 116 reglas que se esperaban';
  END IF;
END
$do$;

CREATE TABLE public.mecanismos (
  id smallint PRIMARY KEY,
  nombre text NOT NULL CHECK (length(btrim(nombre)) > 0),
  porque text NOT NULL CHECK (length(btrim(porque)) > 0)
);
CREATE TABLE public.reglas_mecanismo (
  regla_id text PRIMARY KEY REFERENCES public.reglas(id) ON DELETE CASCADE,
  mecanismo_id smallint NOT NULL REFERENCES public.mecanismos(id)
);
CREATE TABLE public.va_despues (
  regla_id text PRIMARY KEY REFERENCES public.reglas(id) ON DELETE CASCADE,
  va_en text NOT NULL CHECK (length(btrim(va_en)) > 0),
  porque text NOT NULL CHECK (length(btrim(porque)) > 0)
);
COMMENT ON TABLE public.mecanismos IS 'Mensaje 174: los 12 mecanismos del Cerebro que explican por qué funciona lo que enseñamos (doc «La línea recta y el porqué», aprobado por Emilio el 24-nov-2026). Solo se muestra; no califica.';
COMMENT ON TABLE public.reglas_mecanismo IS 'Mensaje 174: el mecanismo de cada regla que califica. Solo se muestra; no califica.';
COMMENT ON TABLE public.va_despues IS 'Mensaje 174: las reglas de hacer algo antes de tiempo, dónde sí va y por qué ahí. Solo se muestra; no califica.';

ALTER TABLE public.mecanismos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reglas_mecanismo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.va_despues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cualquiera con sesión lee los mecanismos" ON public.mecanismos FOR SELECT TO authenticated USING (true);
CREATE POLICY "cualquiera con sesión lee el mecanismo de cada regla" ON public.reglas_mecanismo FOR SELECT TO authenticated USING (true);
CREATE POLICY "cualquiera con sesión lee lo que va después" ON public.va_despues FOR SELECT TO authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.mecanismos, public.reglas_mecanismo, public.va_despues FROM anon, authenticated;
-- Permisos explícitos (pedido de Lovable): la app solo lee; closer-voice lee con service_role.
GRANT SELECT ON public.mecanismos, public.reglas_mecanismo, public.va_despues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mecanismos, public.reglas_mecanismo, public.va_despues TO service_role;

INSERT INTO public.mecanismos (id, nombre, porque) VALUES
  (1, 'La atención en tres tercios', 'Cuando llegas, el cliente sigue un tercio en lo suyo y otro tercio preguntándose quién eres y qué quieres. Solo un tercio te escucha. Cada paso recupera un pedazo: si te saltas pasos, le hablas a un tercio de persona.'),
  (2, 'La alarma del vendedor', 'A la gente le gusta comprar, pero no que le vendan. En cuanto siente que le están vendiendo, todo lo que digas después lo escucha con desconfianza. Casi todo el sistema es vender sin prender esa alarma.'),
  (3, 'La balanza', 'Nadie compra por precio: compra cuando lo que gana pesa más que lo que le cuesta. Cada frase sube o baja uno de los dos platos. No hay frases neutras.'),
  (4, 'El volante', 'El que pregunta conduce. Si terminas en afirmación o te quedas callado esperando permiso, le devuelves el volante, y el cliente lo usa para cerrar la plática con amabilidad.'),
  (5, 'Bajar la guardia', 'El cliente llega a la defensiva. Una observación que solo le aplica a él y algo de ligereza le dicen que eres una persona, no un vendedor más.'),
  (6, 'Confianza antes que argumentos', 'Un argumento perfecto dicho por alguien en quien no confía no pesa. Uno sencillo dicho por alguien cercano, sí. Por eso sales a lo personal, y por eso regresas.'),
  (7, 'Primero el examen, luego la receta', 'El que llega a recetar trae su producto buscando dónde meterlo. En cuanto presentas, el cliente deja de contarte. Sin su dolor dicho por él no hay impulso que construir.'),
  (8, 'La decisión es emocional', 'El cliente siente primero y después se da la razón. Por eso funciona que se imagine con el problema resuelto, y por eso pelear para que admita algo mata la venta.'),
  (9, 'La curva del impulso', 'El impulso se construye poco a poco y se cierra en el pico. Una objeción lo tumba; la bala lo vuelve a subir. Si cierras abajo o sigues presentando después de la señal, lo dejas caer.'),
  (10, 'La presión genera resistencia', 'Un cierre no es algo que le haces al cliente: el cliente se lo hace solo. Si empujas o ruegas, se defiende. Si asumes con calma y te da igual el resultado, la resistencia se disuelve.'),
  (11, 'El arrepentimiento del comprador', 'Apenas dice que sí, el impulso cae y su cabeza busca razones para echarse para atrás. Lo que lo protege es dejar todo claro y mostrar que nada cambió. Seguir vendiendo lo confirma.'),
  (12, 'Tu tiempo va a quien puede comprar', 'Algunos sí, algunos no, ¿y qué? Con quien hoy no puede, sales rápido y bien. Con quien está entre el sí y el no, no te rindes.');

INSERT INTO public.reglas_mecanismo (regla_id, mecanismo_id) VALUES
  ('blocks.air', 4),
  ('blocks.air_sin_aceptar', 2),
  ('blocks.air_sin_resume', 4),
  ('blocks.ataque_en_disculpa', 3),
  ('blocks.discute_bloqueo', 10),
  ('blocks.dos_no_seguidos', 12),
  ('blocks.insistir_tras_dos_no', 12),
  ('blocks.mala_experiencia_al_llegar', 6),
  ('blocks.se_rinde_al_bloqueo', 12),
  ('close.aguanta_silencio', 10),
  ('close.alternativa', 10),
  ('close.asume_con_presion', 10),
  ('close.asumir_venta', 10),
  ('close.cierra_solo_incremento', 3),
  ('close.descuento_de_panico', 3),
  ('close.devuelve_el_volante', 4),
  ('close.fishbbod', 9),
  ('close.llena_el_silencio', 10),
  ('close.mal_cierre', 10),
  ('close.persigue', 10),
  ('close.pide_aprobacion', 4),
  ('close.reabre_pedido_base', 3),
  ('close.sigue_presentando', 9),
  ('close_with_action', 4),
  ('consolidation.misma_actitud', 11),
  ('consolidation.referido_en_frio', 11),
  ('consolidation.rehash', 11),
  ('consolidation.salida_seca', 11),
  ('consolidation.sigue_vendiendo', 11),
  ('consolidation.siguientes_pasos', 11),
  ('consolidation.sobre_celebra', 11),
  ('develop.visita_tramite', 7),
  ('discovery.barrido', 7),
  ('discovery.bordes_restriccion', 7),
  ('discovery.dolor_directo', 7),
  ('discovery.escalera_capas', 7),
  ('discovery.escucha', 7),
  ('discovery.fabrica_dolor', 8),
  ('discovery.hueco', 7),
  ('discovery.hueco_inventado', 7),
  ('discovery.interrogatorio', 7),
  ('discovery.lectura_falsa', 2),
  ('discovery.lee_el_lugar', 7),
  ('discovery.opinion_de_precio', 3),
  ('discovery.pregunta_especifica', 7),
  ('discovery.qtqp', 12),
  ('discovery.receta_sin_diagnostico', 7),
  ('discovery.rojo_insistir', 12),
  ('discovery.rojo_vs_amarrado', 12),
  ('discovery.rrr', 5),
  ('discovery.solo_cerradas', 7),
  ('discovery.suelta_amarrado', 12),
  ('discovery.suggestive_language', 7),
  ('impulse.avaricia', 3),
  ('impulse.efecto_jones', 9),
  ('impulse.factores', 9),
  ('impulse.indiferencia', 10),
  ('impulse.indiferencia_teatral', 10),
  ('impulse.jones_vago', 3),
  ('impulse.miedo_perdida', 8),
  ('impulse.miedo_perdida_generico', 8),
  ('impulse.presion_directa', 10),
  ('impulse.ruega', 10),
  ('impulse.tren_del_si', 9),
  ('impulse.urgencia', 9),
  ('monologo', 4),
  ('objection.air_a_objecion', 6),
  ('objection.cierra_sin_bala', 9),
  ('objection.circulo_de_cierre', 9),
  ('objection.discutir', 2),
  ('objection.fff', 2),
  ('objection.rrr', 4),
  ('objection.rrr_sin_resume', 4),
  ('objection.se_desanima', 10),
  ('objection.vacia_el_cargador', 9),
  ('opening.curiosidad_abierta', 5),
  ('opening.energia_verbal', 5),
  ('opening.especificidad', 5),
  ('opening.estructura', 5),
  ('opening.gasman', 2),
  ('opening.halago_falso', 2),
  ('opening.ice_breaker', 5),
  ('opening.pide_permiso', 2),
  ('opening.pitch_prematuro', 1),
  ('opening.pregunta_cerrada', 4),
  ('opening.se_disculpa', 3),
  ('opening.sin_pregunta', 4),
  ('present.argumento_del_hueco', 3),
  ('present.ataca_proveedor', 2),
  ('present.bala_generica', 3),
  ('present.balas', 9),
  ('present.beneficio_no_caracteristica', 8),
  ('present.capital_del_record', 6),
  ('present.caracteristica_sin_traducir', 8),
  ('present.consolidacion_falsa', 3),
  ('present.dos_mitades', 7),
  ('present.dosificacion_balas', 9),
  ('present.escalon_sin_motivo', 3),
  ('present.garantiza', 3),
  ('present.pide_que_pruebe', 3),
  ('present.pintar_imagenes', 8),
  ('present.plan_b', 3),
  ('present.precio_unico', 3),
  ('present.triple_desglose', 3),
  ('relationship.cpr', 6),
  ('relationship.familiaridad_excesiva', 6),
  ('relationship.forms', 6),
  ('relationship.interes_fingido', 2),
  ('story.cierra_con_afirmacion', 4),
  ('story.kill', 1),
  ('story.kill_curriculum', 1),
  ('story.kiss', 1),
  ('story.nunca_sale', 6),
  ('story.pregunta_despues', 4),
  ('story.quien_eres_por_que', 1),
  ('story.sale_sin_regresar', 6);

INSERT INTO public.va_despues (regla_id, va_en, porque) VALUES
  ('opening.pitch_prematuro', 'el paso 3 si es preguntar por su negocio, o el paso 4 si es ofrecer tu producto', 'Ahí ya sabe quién eres y por qué pasaste, y tu pregunta suena a que quieres entender su negocio. Antes, suena a que vienes a venderle y se prende la alarma.'),
  ('discovery.receta_sin_diagnostico', 'el paso 4, después de confirmarle el dolor', 'En cuanto presentas, el cliente deja de contarte. Lo que no te dijo ya no lo vas a saber.'),
  ('close.sigue_presentando', 'el paso 5: cerrar en ese momento', 'La señal de compra es el pico del impulso. Si sigues presentando, el impulso baja solo.'),
  ('consolidation.sigue_vendiendo', 'la siguiente visita', 'Después del sí lo que toca es protegerlo. La otra venta escondida son los referidos y la siguiente visita, no más producto hoy.');

DO $do$
BEGIN
  IF (SELECT count(*) FROM public.mecanismos) <> 12 OR (SELECT count(*) FROM public.reglas_mecanismo) <> 116 OR (SELECT count(*) FROM public.va_despues) <> 4 THEN
    RAISE EXCEPTION 'No quedaron 12 mecanismos, 116 reglas y 4 de va_despues';
  END IF;
END
$do$;
