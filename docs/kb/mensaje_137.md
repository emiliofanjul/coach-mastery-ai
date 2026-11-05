MENSAJE 137 — Mundo 5, tanda 2: las prácticas ligadas a la doctrina, y la red completa del mundo 5 (pegar en el proyecto REAL)

Va DESPUÉS del 136 (tiene que estar aplicado y publicado). Subí 7 archivos a docs/kb/. Ojo: nodos_snapshot.json ya lo subí encima del viejo, con el mismo nombre, así que llega con la huella NUEVA (compárala con la tabla del Paso 2). Las pruebas van con extensión .txt: al moverlas, quítales el .txt. Dentro de supabase/functions/, reemplaza con el editor o copiando el archivo, no con comandos de terminal. El SQL córrelo tal cual: verifica su md5 y pasa el texto leído del archivo.

POR QUÉ. El 136 corrigió las tarjetas y los quizzes del mundo 5; este corrige los guiones de sus prácticas con las mismas decisiones de Emilio (5-nov), para que el ejemplo, el cliente simulado y lo que se califica digan lo mismo que el Cerebro:
1. El silencio después del cierre (5.13 y 5.14). Aguantar es lo correcto, pero no garantiza el sí. La 5.14 castigaba lo contrario («da el cierre y espera la reacción»), y su cliente simulado usaba ese silencio para dudar: sale esa falla. En las dos, el cliente decide al azar, en algunas sesiones, poner una objeción aunque el vendedor lo haya hecho bien («déjeme pensarlo»). No es castigo: es una objeción, y se califica cómo la trabaja (nueva falla salta_la_bala, la del Círculo de Cierre, en los dos nodos).
2. FFF completo (5.8): el ejemplo muestra los cinco pasos (entiendo, sintió, encontramos, una bala y cierro con acción) y se califica cerrar sin bala (salta_la_bala). Sale la técnica de cuatro pasos que no está en el Cerebro (recibe, entiende, responde, avanza).
3. El cliente simulado no puede contradecir lo que se califica. En la 5.10 y la 5.12 rechazaba cualquier bala ya dicha, aunque el vendedor la conectara con la objeción; la regla dice que esa sí cuenta. Y en la 5.8 y la 5.12 se quejaba del «rollo» hasta el tercer argumento, cuando la falla cuenta desde el segundo.
4. Nunca se califica lo que no se ha enseñado, ni dos veces lo mismo. La 5.13 calificaba cómo responde al «¿y sí me conviene, verdad?» después del sí: eso es consolidación, del mundo 6. Sale sobre_reaseguro. La 5.3 castigaba dos veces «seguir presentando después de la señal», una con una regla del descubrimiento: sale ignora_pistas.
5. La 5.12 pedía FFF en cada objeción. El Cerebro dice que fuera del nodo que enseña una herramienta sirven RRR o FFF. Y su ejemplo le pedía al cliente que probara y comparara, que la 4.15 enseña que no se hace.
6. El jefe (5.15). Pelear la condición del cliente («pedido chico, por escrito») ahora se califica con close.asume_con_presion (ignorar un cambio que el cliente pidió es presionar), y no con una regla del descubrimiento. Cerrar con «¿le interesa?» ahora es falla grave también aquí (abre_puerta_al_no). El objetivo ya no dice «desmonta su minimización» (Emilio decidió que no se discute: se usa en la presentación). Y el prompt ya no cita números de nodo viejos.
7. Acentos en lo que el vendedor lee (5.1, 5.3, 5.6, 5.8, 5.10, 5.12, 5.13 y 5.14) y en 5 nombres del mapa: Las Señales de Compra, Objeción = Señal de Compra, FFF: Cuando la Preocupación Es de Verdad, El Círculo de Cierre y El Círculo en Vivo.

LA RED pasa a v3.38.0. Antes había 4 prácticas del mundo 5 sin ningún caso (5.6, 5.12, 5.14 y 5.15); ahora todas tienen. Son 9 casos nuevos:
- 5 ejecuciones perfectas, cada una con su traza: P5_6, P5_8 (FFF completo), P5_12, P5_14 (el cliente duda después de la alternativa y el vendedor trabaja la objeción) y P5_15.
- G111_responde_y_espera (5.6): la tercera R que falla.
- G112_fff_sin_bala (5.8): las tres F y cierra sin bala.
- G113_objecion_despues_de_aguantar (5.13): el vendedor aguanta, el cliente pone una objeción y el vendedor la trabaja. No debe salir llena_el_silencio.
- G114_reabre_lo_de_siempre (5.14).
No cambia ningún caso viejo.

QUÉ CAMBIA: 9 guiones (5.1, 5.3, 5.6, 5.8, 5.10, 5.12, 5.13, 5.14 y 5.15), 5 nombres de nodo, la red, una prueba nueva y una actualizada (mundo4-tanda2 fijaba la versión exacta de la red; ahora pide la v3.37.0 o posterior). El Cerebro, las reglas, las tarjetas y los quizzes no cambian: ya los cambió el 136.

PASO 0 — Confirma (si algo es distinto, no lo reemplaces: dime qué cambió y espera):
1. Que el 136 está aplicado y que hoy pasan 1024 pruebas en 80 archivos.
2. El md5 de estos archivos tal como están hoy:
   - supabase/functions/_shared/eval_harness_v1.json: 68feab85953a9b5cf03649954b16a3e5
   - mundo4-tanda2-nov05.test.ts: 720e96d6b3443ef8378aad35e03517a1
3. Solo lectura: corre docs/kb/verificar_137.sql (md5 dd7282dda2916be2f84e0a71bdf49635). Las versiones de hoy tienen que ser: 5.1 1.0.1 · 5.3 1.0.1 · 5.6 2.0.3 · 5.8 1.0.4 · 5.10 2.0.2 · 5.12 1.1.3 · 5.13 1.0.1 · 5.14 2.0.1 · 5.15 1.2.1. Y los nombres de hoy: 5.2 «Las Senales de Compra», 5.4 «Objecion = Senal de Compra», 5.7 «FFF: Cuando la Preocupacion Es de Verdad», 5.9 «El Circulo de Cierre», 5.10 «El Circulo en Vivo».

PASO 1 — Verifica el md5 de docs/kb/mundo5_practicas_137.sql (d827461489b39446eb3d1b4e1812b418) y córrelo tal cual, en una sola ejecución. Cada guion se reemplaza solo si está en la versión de arriba, y cada nombre solo si es el de hoy. El chequeo del final compara la huella exacta de los 9 guiones y los 5 nombres. Lo probé en una base local con el estado actual: corrido dos veces, los 75 guiones y los nombres quedan idénticos al snapshot nuevo; con un guion en otra versión aborta, y con otro nombre también. Después corre verificar_137.sql otra vez. Los 5 nombres tienen que salir con acento, y estos guiones así:

| nodo | versión | huella |
|---|---|---|
| 5.1 | 1.0.2 | edd072c082660078a02e8a0bbb8fadbf |
| 5.3 | 1.0.2 | aca81dd453f5208e32fc3ba031e2b27e |
| 5.6 | 2.0.4 | 6558fc7d02fc8b3d6d3d864e4231566b |
| 5.8 | 1.1.0 | 74b8703c1a964b330461af317937e47b |
| 5.10 | 2.1.0 | 95fb7f1159182733968831cfc323ac1a |
| 5.12 | 1.2.0 | 9fec5127fde95b9e55c951ec46aaf060 |
| 5.13 | 1.1.0 | c6328cdb2431115bff615b1d56b43974 |
| 5.14 | 2.1.0 | ffe498db2efc878c3e4ffe0aacae80a1 |
| 5.15 | 1.3.0 | 437e13a52013d1f11592cb912834d220 |

Los demás nodos del mundo 5 no cambian. Borra los dos SQL de docs/kb/.

PASO 2 — Archivos:

| Archivo en docs/kb/ | Destino | md5 |
|---|---|---|
| nodos_snapshot.json | se queda en docs/kb/ | fad042a3a95aad6001fd40107effb9f5 |
| eval_harness_v1.json | supabase/functions/_shared/eval_harness_v1.json | 969635c937581f15bce5ab9e371e7993 |
| mundo5-tanda2-nov05.test.ts.txt | mundo5-tanda2-nov05.test.ts, junto a las demás pruebas (nuevo) | ce7cf4d193bc0db31e60486a2cfbc4a0 |
| mundo4-tanda2-nov05.test.ts.txt | mundo4-tanda2-nov05.test.ts, donde está hoy | 8add0599dd7ecb6130f3bf37f1421a57 |

PASO 3 — Despliega harness-runner (lleva la red). closer-voice no cambia.

PASO 4 — Verificación:
1. Pruebas: deben pasar 1035 en 81 archivos. Build sin errores, también los tipos.
2. La red, una vez cada uno:
   - los 9 nuevos: P5_6_perfecto, G111_responde_y_espera, P5_8_perfecto, G112_fff_sin_bala, P5_12_perfecto, G113_objecion_despues_de_aguantar, P5_14_perfecto, G114_reabre_lo_de_siempre y P5_15_perfecto;
   - los de los guiones que cambiaron: G84_presiona_no_asume, G85_alternativa_asumida, G86_se_lo_mando, G87_senal_contesta_y_cierra, G88_senal_un_beneficio_mas, G89_llena_el_silencio, G90_contestar_no_es_llenar, G91_descuento_a_cambio, G92_descuento_de_panico, G93_una_bala_y_cierra, G94_bala_ya_dicha_conectada, G95_bala_repetida_tal_cual, G96_apila_balas, G97_discute_la_objecion y G98_responde_sin_discutir.
3. Pégame la tabla de siempre (id, resultado, base, restas y nota) y el bloque «tiempos».
4. Detente y pégame todo si el SQL aborta, si una huella no coincide o si un caso falla dos veces. De cada falla, pega los juicios del juez con su razón y sus citas.
5. Si todo sale bien, publica (así los nombres con acento quedan en el mapa) y dime el resultado de cada paso.
