-- Mensaje 149 · Las descripciones de los nodos (la frase que se lee al tocar el nodo que sigue en el mapa).
-- 44 descripciones: acentos y ¿ que faltaban, y tres arreglos de fondo para que digan lo que el nodo enseña:
--   3.6  decía que con el que «quiere y no puede» rendirse es el error más caro. El nodo (y el Cerebro) enseñan
--        lo contrario: al que hoy no puede comprar, aunque te reciba con gusto, lo dejas rápido y con la puerta abierta.
--        Rendirse es caro con un amarillo, no con un rojo.
--   4.7  decía que hay seis balas. Son seis factores de impulso (FUJPIG); las balas son otra cosa.
--   6.4  decía «examen»; ahora «reto», como el resto del mapa.
-- Cada descripción cambia solo si hoy es exactamente la esperada (por su huella md5). El chequeo del final aborta todo si algo no quedó.

UPDATE public.nodes AS n SET description = v.nueva FROM (VALUES
  ('1.0', 'ca71d75a92cd27461e943f2c63ffa88d', $t$Antes de aprender qué decir, aprende cómo avanza una venta. Este es el mapa que vas a usar los siguientes seis mundos.$t$),
  ('1.1', '3b322033d43d9c030bdfc63d317f2468', $t$Ya sabes cómo avanza una venta. Ahora lo primero: los segundos que deciden si hay conversación o no.$t$),
  ('1.2', '3e0dfae956dc5bf451c9ec3500a2438d', $t$Ya viste qué decide los primeros segundos. Ahora ponlo en palabras: tu primera frase.$t$),
  ('1.3', '20f8569fc2b10204ef647328084a7aaa', $t$Tu primera frase ya está armada. Falta la postura con la que la dices, que pesa más que las palabras.$t$),
  ('1.4', '68ee3f6b2c663e9d421fd93afb9c3fe5', $t$Ya sabes que la autoridad se asume. Aquí lo pruebas con alguien que te va a hacer sentir que estorbas.$t$),
  ('2.0', '8ace7e95a1696ed69778cf03705e630c', $t$Ganaste los primeros segundos y el cliente te está poniendo atención. Ahora tiene dos preguntas en la cabeza: quién es este y qué quiere. Contéstalas antes de que se las conteste solo.$t$),
  ('2.10', '06670b65868cdc09a28ac47fafec3ffc', $t$Todo el mundo junto: bloqueo de entrada, quién eres, relación, y no soltar el control.$t$),
  ('2.2', '65cae6f10a0ff7c972f9715aba1bd98f', $t$Ya te presentaste. Lo que sigue decide si la conversación vive o se muere: devolverle la palabra.$t$),
  ('2.4', '79d2e4f41e4ee17b221307114b548102', $t$Ya sabes que necesitas crear relación. Aquí está de qué hablar.$t$),
  ('2.5', '19626a2c8c0cd92ccb13063f68d0eb3a', $t$Tienes los cinco temas. Ahora la parte difícil: entrar y REGRESAR.$t$),
  ('2.6', 'aabcf8668b9ce7e3a6c5a2ec667b3004', $t$La conversación va bien y de pronto te frenan. Aquí aprendes qué es ese freno y por qué casi nunca significa lo que parece.$t$),
  ('2.7', '919ec13e6cb8a17c22c73c7c3c0b892e', $t$Ya distingues un bloqueo de una objeción. Ahora atraviesa uno.$t$),
  ('2.9', '71164ea96f26e5767958ba829c6e30c0', $t$Atravesaste el bloqueo. ¿Y ahora qué? La respuesta decide si la conversación sigue o se muere ahí.$t$),
  ('3.0', '7cf78cd5268d26aff54a556899050a33', $t$El cliente ya sabe quién eres y te está dando conversación. Ahora viene el paso que separa al que receta del que examina.$t$),
  ('3.1', 'd319afeb3e22f7ad5be00388f4e15cfb', $t$Tienes el mapa de dónde buscar. Antes de preguntar, aprende a leer con quién estás hablando.$t$),
  ('3.10', '40467f064652bc505dec61e8f7729903', $t$El diagnóstico completo, con un cliente que no suelta su dolor fácil.$t$),
  ('3.3', '2ad8aa63d1becde2fc03de17ba17fe33', $t$Sabes preguntar por capas. Ahora asegúrate de que cada pregunta nazca de lo que acaba de decir.$t$),
  ('3.4', '6d68f95c0af5cb2b65d097a216bc2abc', $t$Preguntas bien y escuchas bien. Falta lo que hace que te contesten de verdad, aquí donde más importa.$t$),
  ('3.5', 'a3d738239872168f1986cf970113d8ac', $t$Ya sabes diagnosticar. Ahora decide en quién vale la pena invertir tu tiempo.$t$),
  ('3.6', 'c80d2c89a646e1eaf53fe00a3871a03d', $t$No todos los no son iguales. Aquí aprendes a reconocer al que hoy no te puede comprar, aunque te reciba con gusto, y a irte rápido dejando la puerta abierta.$t$),
  ('3.7', '28f3fd7fef32060393626c6b10d5059c', $t$Todo lo que aprendiste sirve para encontrar dolor. Pero un cliente contento no tiene dolor — y ahí es donde se pierde la mayor parte del dinero.$t$),
  ('3.8', '53573e776ab9e1a93345e379281fe69c', $t$Ya sabes que un cliente contento tiene huecos y no dolor. Aquí aprendes a encontrarlos.$t$),
  ('4.0', '8e34e1b5f0fcbc2a42f41075d5110322', $t$Ya sabes qué le duele. Ahora empieza la otra mitad de la venta: convertir ese dolor en valor.$t$),
  ('4.1', '26b0063679aef7b857982d725ac251d0', $t$Tienes la balanza. El primer movimiento es anclar tu presentación en lo que ÉL te contó.$t$),
  ('4.14', '4c8d72b5e099fe2f3b1e089978398cbd', $t$Sabes armar el precio. Ahora lo más importante: lo que pasa el segundo después de decirlo.$t$),
  ('4.15', '88412e5f61ac77fbb8fac9fbdd4756c3', $t$Encontraste una familia que compra con otro. Presentar eso no es como presentar una solución: no hay nada que resolver, hay un espacio que ocupar.$t$),
  ('4.2', '30e12523b5bb9e93ced044fd7d24a33e', $t$Conectaste con su dolor. Ahora que todo lo que digas signifique algo para él.$t$),
  ('4.3', 'd7d6e0f04f3a283fc5e39dac9f58850c', $t$Ya traduces beneficios. Ahora haz que se vea a sí mismo con el problema resuelto.$t$),
  ('4.4', '19fd2b79364365614850479c086a53c3', $t$El valor ya está construido. Ahora la otra mitad: cuánto quiere comprar, y cómo se mueve eso.$t$),
  ('4.5', '603d3304c089dcd49102e50667901d52', $t$Sabes que el impulso sube y baja. Aquí está con qué lo subes.$t$),
  ('4.7', '52cd849ce184a3507be6f2a2f25bf653', $t$Las balas son una manera de subir el impulso. Pero hay seis factores que lo mueven: FUJPIG.$t$),
  ('5.0', '4050c9072edcb9433cf3fef683e650f0', $t$Presentaste bien y el impulso está arriba. Presentar sin cerrar es contar un cuento.$t$),
  ('5.10', '72f04051e22b785d93fa7a64c692dab6', $t$Una objeción, una vuelta completa: atraviesa, re-impulsa, cierra.$t$),
  ('5.11', '69760c1a943da04f5fd4b9a170d2274a', $t$Sabes girar el círculo. Aquí aprendes dónde está el límite.$t$),
  ('5.14', '031d10f7a33ef9b3ebd524db224c3c53', $t$Con un cliente que ya te compra, el pedido no está en duda. Lo que hay que cerrar es lo que se agrega.$t$),
  ('5.2', '50caabb04d60d71708e55657af735f60', $t$Ya sabes pedir la decisión. Ahora aprende a leer cuándo el cliente ya está listo.$t$),
  ('5.4', '590c4c1e6b0c308201e9bc45d428dbfa', $t$Vas a cerrar y te ponen una razón para no comprar. Buenas noticias: eso significa que te está considerando.$t$),
  ('5.5', 'bcaa955ed452c2bfdc0613ee72d0dd3a', $t$Sabes que una objeción es buena señal. Aquí la herramienta para las de todos los días.$t$),
  ('5.6', '438de4a734d425f6954b080697ae92b3', $t$Atravesar objeciones menores sin frenar la conversación.$t$),
  ('5.7', '16261ef32bb3c61b5c395708d1dfc466', $t$RRR sirve para dudas de trámite. Cuando la preocupación es de verdad, hace falta otra cosa.$t$),
  ('6.0', 'f160dd782eb2614ad73463e0c731d079', $t$Ya dijo que sí. Y aquí es donde se caen más ventas de las que nadie cree.$t$),
  ('6.1', '572bd5a6e6aa14899578ff40888b5ed4', $t$Sabes que el impulso cae después del sí. Aquí aprendes a levantarlo sin cometer el error más peligroso de todo este paso.$t$),
  ('6.4', '742a0ebbe53657ea538efda53c332f3c', $t$La venta ya está hecha — y ese es exactamente el reto. Un comprador formal, un trato recién firmado, y tu misión: que salga blindado, claro y de tu lado.$t$),
  ('7.3', 'c1d466f42b28d925991e139cc1078870', $t$Un cliente que ya te compra desde hace años. Te va a dar su pedido y quedarse contento hagas lo que hagas. Crecer esa cuenta depende solo de ti.$t$)
) AS v(id, md5_vieja, nueva)
WHERE n.id = v.id AND md5(n.description) = v.md5_vieja;

DO $chk$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM public.nodes AS x JOIN (VALUES
    ('1.0', 'e3a25a3db6cae5df0777ac536795e640'),
    ('1.1', '25e09f48d2dc372b15b8726c2152c204'),
    ('1.2', '4ca6a4d74c8c364d32137d5886596861'),
    ('1.3', 'b88efd3984d3f3ce6b079e7a25171c72'),
    ('1.4', '0ffc5236ebaeeae6fcd1c3dd07f9db91'),
    ('2.0', '8ea0d45490f7fc4564882b0047249dc8'),
    ('2.10', 'ac10cebe2e0f3bf0464f76ae7732f455'),
    ('2.2', '89b2998485468ba18b2c5db88996a33b'),
    ('2.4', '425f3bc917761d7f8e50d325d4ea6452'),
    ('2.5', '95af234a3274bb12e692b9e2e259dc5e'),
    ('2.6', '0fc99be527d860b711f7b9fe596a62c5'),
    ('2.7', 'dc5461489c0273d4a5bdd8b87ce2553f'),
    ('2.9', '136053c859b9221f1530ffebe0f527aa'),
    ('3.0', '45e3b11a79bef686720111c52deee470'),
    ('3.1', '7169a343e58615630015c82a8c75bbc8'),
    ('3.10', '991cf555571d3d4c3239b0b8489914b6'),
    ('3.3', '6df7ce6222789c6774dfea031ea9bead'),
    ('3.4', 'c82dc1f06adbd8e71622ea61e19b1c15'),
    ('3.5', 'a69a594dfc52a49e430be928c5428264'),
    ('3.6', '11aedef4947ea8d6ea26c5e45a310d74'),
    ('3.7', '5c762e3884f199cd93886d925008a280'),
    ('3.8', '9783c51adbe6f41f474801570c6d68e7'),
    ('4.0', 'bf208b62cd1a922824bfde489ec3c83c'),
    ('4.1', '3a8b3cc5b4bc0bc75425708486ee88ed'),
    ('4.14', '48422680bdd394edc79637f741a57bf4'),
    ('4.15', '525944bc49ab5cfd1981a0280328fe1c'),
    ('4.2', 'a4ed708adcb389f002acc8b053d71f06'),
    ('4.3', '97bebfc989c3f4dda163eb6b254135f3'),
    ('4.4', 'a17890a0a61ae2325ef23577467b8012'),
    ('4.5', 'c748ebb87849bed43313d488eb6742e7'),
    ('4.7', '5a03928ea9218ed53f4d553eca0e6fda'),
    ('5.0', '122f1a1617f8af1d8386c10671ff9a1e'),
    ('5.10', 'feca23d497c13d5e03dfff5f1d9f9504'),
    ('5.11', '19e9482445dc50ba2c48b56b72e6829a'),
    ('5.14', '2db641896c96a9e1bf4064e068d4a368'),
    ('5.2', '96560f1d901531d7c3c96616499d916a'),
    ('5.4', 'f0e54f96ae1ab4a12bbd651729fb1873'),
    ('5.5', 'ad54d6a029d9f5b5d83d4c3b2ca044f4'),
    ('5.6', '96e6bb9b89c4732204bd62668eecd657'),
    ('5.7', '49fe65c8772e67278118d06bbdfe88b7'),
    ('6.0', '91daabb268b8fc9ea442ce609a096fb5'),
    ('6.1', 'e80a5a63171f681b59ba4538b2ac19ec'),
    ('6.4', '0bb0678e71c86820d9bc547a17ffc4f1'),
    ('7.3', '9e1667a07adbabf836b6fd3f3b6647a4')
  ) AS v(id, h) ON x.id = v.id AND md5(x.description) = v.h;
  IF n <> 44 THEN RAISE EXCEPTION 'Mensaje 149: solo % de las 44 descripciones quedaron (¿alguna estaba distinta?)', n; END IF;
END $chk$;
