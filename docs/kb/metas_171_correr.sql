-- Mensaje 171 · Lo que buscamos en cada práctica (doc aprobado por Emilio el 24-nov-2026).
--
-- Una tabla nueva, metas_practica: por cada uno de los 50 nodos con práctica, «lo que
-- buscamos» y «cómo sabes que lo lograste». closer-voice la lee al calificar y la pone
-- en la pantalla de resultados. El evaluador NO la lee: no cambia ninguna nota.
-- No toca ninguna otra tabla, ni guiones, ni versiones.
--
-- Para la herramienta de la base de Lovable: ella abre y cierra la transacción, así
-- que este archivo no trae BEGIN/COMMIT. Si algo no está como se espera, falla y NO
-- cambia nada. La verificación va aparte (metas_171_verificar.sql).

DO $do$
BEGIN
  IF to_regclass('public.metas_practica') IS NOT NULL THEN
    RAISE EXCEPTION '171 ya se aplicó: metas_practica ya existe';
  END IF;
  IF (SELECT count(*) FROM public.nodes WHERE id IN ('1.2','1.4','1.5','1.6','2.1','2.2','2.5','2.7','2.7c','2.8','2.9','2.10','3.1','3.2','3.3','3.4','3.6','3.8','3.9','3.9b','3.10','4.1','4.2','4.3','4.6','4.8','4.9','4.10','4.11','4.12','4.14','4.15','4.16','5.1','5.3','5.6','5.8','5.10','5.12','5.13','5.14','5.15','6.2','6.3','6.4','7.0','7.1','7.2','7.3','7.4') AND practice_script IS NOT NULL) <> 50 THEN
    RAISE EXCEPTION 'No están los 50 nodos con práctica que se esperaban';
  END IF;
  IF (SELECT count(*) FROM public.nodes WHERE practice_script IS NOT NULL) <> 50 THEN
    RAISE EXCEPTION 'Hay nodos con práctica que no están en el doc aprobado';
  END IF;
END
$do$;

CREATE TABLE public.metas_practica (
  node_id text PRIMARY KEY REFERENCES public.nodes(id) ON DELETE CASCADE,
  lo_que_buscamos text NOT NULL CHECK (length(btrim(lo_que_buscamos)) > 0),
  como_sabes text NOT NULL CHECK (length(btrim(como_sabes)) > 0),
  aprobada_el date NOT NULL DEFAULT DATE '2026-11-24',
  actualizada_en timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.metas_practica IS 'Mensaje 171: lo que buscamos en cada práctica y cómo sabe el vendedor que lo logró (doc «Lo que buscamos en cada práctica», aprobado por Emilio el 24-nov-2026). Solo se muestra; no califica.';

ALTER TABLE public.metas_practica ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cualquiera con sesión lee las metas" ON public.metas_practica FOR SELECT TO authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.metas_practica FROM anon, authenticated;

INSERT INTO public.metas_practica (node_id, lo_que_buscamos, como_sabes) VALUES
  ('1.2', 'Que tu primera frase baje la guardia del cliente: un saludo con energía, algo que notaste de él o de su lugar, y una pregunta que le devuelva la palabra. Aquí solo practicamos esa primera frase; lo demás viene después.', 'Te contesta con gusto y te comenta algo de vuelta, sin que se lo pidas.'),
  ('1.4', 'Que entres de igual a igual aunque el cliente esté ocupado: sin disculparte, sin pedir permiso y sin encogerte. Si entras pidiendo perdón, el cliente te trata como alguien que estorba.', 'Aunque está ocupado, te contesta de verdad en lugar de despacharte.'),
  ('1.5', 'Que rompas el hielo con un comentario ligero y verdadero sobre la persona, el lugar o algo en común, para que la visita deje de ser un trámite.', 'Te contesta con humor o calidez y la plática se vuelve entre personas.'),
  ('1.6', 'Que juntes toda la apertura con un cliente que no te facilita nada: entrar con postura, romper el hielo y devolverle la palabra.', 'Baja la guardia por su cuenta y te pregunta quién eres.'),
  ('2.1', 'Que digas quién eres en dos o tres frases, conectadas con algo que le importe a él, y le devuelvas la palabra. Si hablas de ti de más, el cliente se aburre y la guardia vuelve a subir.', 'Se relaja y sigue la conversación por su cuenta.'),
  ('2.2', 'Que cada turno tuyo termine con una pregunta, para que el cliente hable y la conversación no se muera.', 'La plática dura al menos tres turnos tuyos y el cliente te va dando información.'),
  ('2.5', 'Que cuando el cliente te suelte algo personal le entres con interés de verdad, y luego regreses tú solo al negocio.', 'Conectaron en lo personal y la conversación volvió al negocio porque tú la regresaste.'),
  ('2.7', 'Que un bloqueo no te saque de la conversación: lo aceptas, no lo peleas y retomas tu tema sin pedir permiso.', 'Después del bloqueo, el cliente sigue participando con naturalidad.'),
  ('2.7c', 'Que pases el primer bloqueo con AIR y, si llega un segundo seguido, no insistas: quedas de regresar o te despides bien. Así la puerta queda abierta para la próxima.', 'Respondiste al segundo bloqueo sin insistir y la relación quedó bien.'),
  ('2.8', 'Que recibas la mala experiencia del cliente como una preocupación real: sin pelearla ni minimizarla, con un motivo concreto de tu visita, y una pregunta que regrese al negocio.', 'Baja la guardia y te contesta con un dato de su negocio.'),
  ('2.9', 'Que después de cada freno del cliente tú muevas la conversación, sin quedarte esperando ni pedir permiso. Si te quedas esperando, el impulso se cae.', 'La conversación sobrevive al menos dos frenos porque tú la moviste las dos veces.'),
  ('2.10', 'Que juntes la entrada completa con un cliente frío: pasar el bloqueo, presentarte en quince segundos, conectar en lo personal y regresar, sin pedir permiso.', 'Se abre por su cuenta y te pregunta en qué le puedes servir.'),
  ('3.1', 'Que leas cómo viene el cliente (con prisa, con ganas de platicar o preocupado), se lo reconozcas de forma natural y ajustes tu ritmo a él.', 'Se relaja a la vista y la plática avanza a preguntas que van con su estado.'),
  ('3.2', 'Que bajes por capas con preguntas concretas hasta que el cliente te diga su dolor real con sus palabras, y se lo confirmes. Sin dolor no hay impulso que construir.', 'El cliente te revela el dolor y tú se lo confirmas en voz alta.'),
  ('3.3', 'Que tus preguntas nazcan de lo que te dice el cliente: recoges lo que te regala de pasada y le preguntas con sus propias palabras, en vez de seguir tu lista.', 'Recogiste al menos dos pistas y sus respuestas se volvieron más ricas.'),
  ('3.4', 'Que en medio del diagnóstico metas uno o dos toques personales y siempre regreses al negocio. La confianza es lo que hace que te suelte el dolor.', 'Se abre notablemente y te suelta la pista de su dolor.'),
  ('3.6', 'Que descubras por qué no te está comprando y distingas si es un no de verdad o un impedimento que se va a acabar. Si es un no, sales bien y rápido; si es un impedimento, buscas lo que sí puede comprarte hoy y dejas sembrado el regreso.', 'Tomaste el camino que tocaba para ese cliente.'),
  ('3.8', 'Que conozcas el negocio del cliente más allá de lo que ya te compra: qué otras familias maneja, con quién las compra y qué le piden que no tiene.', 'Encontraste al menos un hueco concreto.'),
  ('3.9', 'Que levantes el pedido de siempre y además descubras al menos un hueco real. El pedido de siempre lo saca cualquiera; el hueco es donde creces.', 'Encontraste un hueco y el cliente te lo confirma.'),
  ('3.9b', 'Que al cliente nuevo que llega pidiendo le tomes el pedido y además descubras al menos un hueco real.', 'Encontraste un hueco y el cliente te lo confirma.'),
  ('3.10', 'Que hagas el diagnóstico completo con un cliente analítico y con prisa, desde la apertura hasta el dolor confirmado.', 'El cliente te revela su dolor real y tú se lo confirmas.'),
  ('4.1', 'Que tu presentación arranque del dolor que te contó el cliente («usted me dijo que…») y le muestre tu producto como la solución de ESE problema. Si presentas sin conectar, suenas como un anuncio.', 'Te hace una pregunta de detalle o te suelta una señal de compra.'),
  ('4.2', 'Que cada característica que digas la traduzcas a lo que gana él: dinero, clientes, tiempo o tranquilidad.', 'Se engancha con al menos dos beneficios y los conecta con su situación.'),
  ('4.3', 'Que le pintes al menos dos escenas concretas de SU negocio con el problema resuelto, para que se vea ahí.', 'Entra en la escena: la completa con sus detalles o dice que se ve en ella.'),
  ('4.6', 'Que subas el impulso soltando balas concretas poco a poco, viendo cómo reacciona con cada una, sin saturarlo ni exagerar.', 'Su interés sube con al menos dos balas bien colocadas.'),
  ('4.8', 'Que muevas al cliente que dice «déjeme pensarlo»: le haces ver lo que pierde hoy con sus propios números, y le das una razón concreta para decidir ahora.', 'Pasa de «déjeme pensarlo» a preguntarte por el siguiente paso.'),
  ('4.9', 'Que le hagas ver la diferencia entre lo que vale y lo que le cuesta con números de su negocio, y le des una referencia de otro cliente con nombre y lugar.', 'Hace cuentas en voz alta o valida la referencia, y pregunta por el siguiente paso.'),
  ('4.10', 'Que ante el cliente que se hace el difícil sostengas la calma: sin pelear, sin rogar, sin regalar nada que no pidió, y dispuesto a irte bien. La presión genera resistencia; quitarla la disuelve.', 'Deja de jugar y te pregunta en serio por el siguiente paso.'),
  ('4.11', 'Que avances asumiendo el interés que ya mostró: le sugieres el siguiente paso concreto y le das a escoger entre dos síes.', 'Escoge una opción o te ajusta un detalle.'),
  ('4.12', 'Que en tu presentación le hagas al menos tres preguntas naturales, ancladas en lo que él te dijo, que te conteste que sí con gusto. Cada sí sube el impulso hacia el cierre.', 'Llegas al tercer sí natural del cliente.'),
  ('4.14', 'Que presentes el precio en escalones, cada uno con su motivo, y avances de inmediato con la pregunta del siguiente paso, sin dejar silencio después del número.', 'Contesta tu pregunta y la conversación sigue, en lugar de «lo voy a pensar».'),
  ('4.15', 'Que le presentes la familia que hoy le compra a otro sin atacar a ese proveedor, con una bala que le sirva a su caso, y con convicción: sin garantizar y sin pedirle que «pruebe».', 'Muestra interés real y te pregunta más.'),
  ('4.16', 'Que con un cliente desconfiado juntes todo: el dolor excavado, la conexión personal y una presentación conectada con su escena y su precio.', 'Te pregunta por detalles del siguiente paso: cómo surtiría, cada cuánto, qué necesita.'),
  ('5.1', 'Que cuando la decisión ya está madura cierres a la primera oportunidad, asumiendo, con opciones donde cualquier respuesta es un sí.', 'Escoge una opción y la decisión queda tomada.'),
  ('5.3', 'Que cuando el cliente suelte una señal de compra detengas la presentación ahí mismo, aunque te falte guion, y cierres asumido. La señal es el pico del impulso: si sigues presentando, lo dejas caer.', 'Cerraste justo después de la señal y el cliente escogió.'),
  ('5.6', 'Que atravieses cada objeción menor y retomes sin pausa, sin perder el control de la conversación.', 'Acepta tus respuestas y la conversación avanza, en vez de volverse un interrogatorio.'),
  ('5.8', 'Que ante una objeción seria hagas el FFF completo: entiendes cómo se siente, otros sintieron lo mismo y lo que encontraron. Después re-impulsas con la bala o las balas que respondan a lo que te dijo, y cierras con acción. La objeción tumba el impulso; la bala lo vuelve a subir.', 'Reconoce el punto y te contesta avanzando.'),
  ('5.10', 'Que completes el círculo ante una objeción: la atraviesas sin discutir, re-impulsas con una bala (nueva o ya dicha) y vuelves a cerrar con acción. Si cierras sin bala, pides la decisión en el punto más bajo del ánimo.', 'Recupera el ánimo y te contesta avanzando al siguiente paso.'),
  ('5.12', 'Que sostengas dos objeciones seguidas: cada una atendida sin discutir y con sus propias balas, y la misma calma de la primera a la última. Cuida tus balas: cada objeción pide la suya.', 'La segunda objeción queda resuelta y el cliente avanza.'),
  ('5.13', 'Que después de cerrar aguantes el silencio del cliente: no agregas nada, no te retractas, no descuentas. El primero que habla después de un cierre, pierde.', 'El cliente decide después de su pausa, o después de que atendiste su objeción.'),
  ('5.14', 'Que cierres solo lo que se agrega al pedido de siempre, asumiéndolo, con dos opciones que te sirven, sin volver a poner en duda el pedido base.', 'Responde a la opción y el incremento queda confirmado.'),
  ('5.15', 'Que con el desconfiado extremo completes toda la conversación: el bloqueo, el dolor, una presentación sin promesas sin ancla, y dos objeciones seguidas, cada una con su bala concreta.', 'Queda cerrado un primer pedido.'),
  ('6.2', 'Que protejas el sí recién nacido: repites el trato completo (qué llega, cuándo, cuánto y cómo se paga), le preguntas si le quedó alguna duda y te despides cálido, sin celebrar de más ni volver a vender.', 'Confirma los términos tranquilo y la despedida sale cálida y personal.'),
  ('6.3', 'Que dejes abierta la siguiente visita como un servicio concreto para él, con día y razón. Si pides un referido, que sea amarrado al conocido que él mencionó, sin presión.', 'La siguiente visita queda acordada.'),
  ('6.4', 'Que con un comprador formal selles cada término con la precisión que él necesita, cures la mala experiencia con su proveedor anterior con compromisos concretos, y no vendas nada nuevo después del sí.', 'Te repite los términos con confianza y la relación queda pensada a largo plazo.'),
  ('7.0', 'Que conduzcas los seis pasos completos: apertura, historia breve, descubrimiento hasta el dolor, presentación conectada, cierre en el momento correcto y consolidación.', 'La venta queda cerrada y el cliente te repite los términos tranquilo.'),
  ('7.1', 'Que descubras pronto cuándo un cliente no te va a comprar, dejes de vender en cuanto lo sabes y salgas bien: breve, cálido y con la puerta abierta. De las luces rojas se sale rápido y educadamente; tu tiempo va a las verdes y las amarillas.', 'La visita cierra cálida y breve, con la relación intacta, en pocos turnos.'),
  ('7.2', 'Que conviertas al cliente con una cicatriz: pasas su bloqueo, honras la mala experiencia cuando aparece, excavas su dolor actual y enciendes la decisión con al menos dos razones concretas.', 'Acepta un primer pedido chico.'),
  ('7.3', 'Que en la visita al cliente de siempre no la vuelvas trámite: encuentras un hueco real, lo presentas sin atacar a su proveedor, cierras el incremento asumiendo y te despides sin volver a vender.', 'El incremento queda confirmado.'),
  ('7.4', 'Que sostengas el sistema completo bajo presión máxima: bloqueo, dolor, presentación conectada, objeciones encadenadas con su bala concreta, cierre en la señal y consolidación.', 'El trato queda cerrado y consolidado, con el «me cumple, ¿eh?» del cliente como sello.');

DO $do$
BEGIN
  IF (SELECT count(*) FROM public.metas_practica) <> 50 THEN
    RAISE EXCEPTION 'No quedaron las 50 metas';
  END IF;
  IF EXISTS (SELECT 1 FROM public.nodes n WHERE n.practice_script IS NOT NULL
             AND NOT EXISTS (SELECT 1 FROM public.metas_practica m WHERE m.node_id = n.id)) THEN
    RAISE EXCEPTION 'Un nodo con práctica se quedó sin meta';
  END IF;
END
$do$;
