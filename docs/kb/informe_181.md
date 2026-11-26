# Mensaje 181 — resultado y regreso

**Regresé el 181 por la condición que indicaste: la práctica del 2.7 se calificó mal.** Penalizó como pitch prematuro la pregunta permitida después de presentarse y aceptar el bloqueo. No fue un regreso por las fallas de la red.

## Pasos 0–5

- Paso 0 exacto: 1336 pruebas en 108 archivos; siete MD5 coincidentes; prueba nueva ausente; guiones 2.0.4 y 1.0.5.
- Las cuatro entregas coincidían. Instalé solo alcance.ts y la red con las copias autorizadas; sus huellas finales eran las solicitadas.
- Instalador ejecutado una vez: «Listo: 9 archivos, todos con su md5 esperado.» Todas las huellas finales coincidieron. Retiré las cuatro entregas y conservé los tres SQL.
- Pasaron 1345 pruebas en 109 archivos y la compilación automática terminó sin errores. No ejecuté una revisión manual separada de tipos; no dispongo de un informe separado de esa revisión.
- SQL ejecutado tal cual, sin cambios de estructura. Verificación:

| guion | versión | fallas | pitch_prematuro |
|---|---|---|---|
| 2.7 | 2.1.0 | 5 | 45b8398baa550d9de9cb1dbd81429cfe |
| 2.7c | 1.1.0 | 6 | 4a745650ce8cc8902bf12a7c647c77e0 |

- Desplegué únicamente closer-voice y harness-runner. Solicité publicar en https://closerapp.ai.

## Red v3.49.0: 8 pasan, 2 no pasan

| Caso | Resultado | Nota | Qué salió |
|---|---|---:|---|
| G126_ofrece_despues_del_air | Pasa | 0 | pitch_prematuro crítico; AIR no cumple por ofrecer y pedir pedido |
| G127_air_y_pregunta_de_su_negocio | **No pasa** | 30 | pitch_prematuro, prohibido por el caso; esperaba 85–100; AIR cumple |
| P2_7_perfecto | Pasa | 100 | AIR cumple; sin restas |
| P2_7c_perfecto | Pasa | 100 | AIR y dos_no_seguidos cumplen; sin restas |
| G35_insiste_tras_dos_no | Pasa | 10 | insiste_tras_dos crítico |
| G36_se_va_al_primer_no | Pasa | 0 | se_va_al_primero crítico y se_va_con_disculpa minor |
| G37_de_volada_no_es_permiso | Pasa | 100 | AIR y dos_no_seguidos cumplen |
| G38_no_pero_nada_mas_no_es_discutir | **No pasa** | 30 | pitch_prematuro crítico; esperaba 70–100; AIR y dos_no_seguidos cumplen |
| G43_practica_real_2_7c_texto | Pasa | 100 | Sin restas; AIR y dos_no_seguidos cumplen |
| G107_no_que_invita | Pasa | 30 | pitch_prematuro crítico, permitido en este caso como indicaste |

Cada caso tuvo una corrida. G38 había pasado las tres corridas del 178; esta vez falla por pitch_prematuro, no por discutir el bloqueo. Resultados completos y sesiones: docs/kb/red_181.json.

## Práctica 2.7 con vendedor temporal, nunca con uno real

Sesión: `8d41ab05-47b0-48f5-8278-33378f536d5a`.

Primer turno, el mismo del 180:

> Buenas tardes, ¿cómo está? Soy Emilio, de Aceites y Lubricantes Dalfán. Ando visitando talleres de la zona y quise conocer el suyo. ¿Cómo le ha ido últimamente?

El cliente respondió: «Ahorita ando ocupado, gracias.»

Segundo turno, el mismo del primer 2.7 del 180, sin pedir el pedido:

> Lo entiendo perfectamente, y qué bueno que ya tenga a alguien que lo atienda. Muchos de los talleres con los que trabajo me decían lo mismo al principio. Fuera de eso, ¿qué es lo que más cuida usted cuando elige a quién comprarle?

La práctica terminó y mostró la calificación en pantalla. Leí también el resultado guardado:

- **Estado:** lista.
- **Score:** 0.
- **Fallas:** discute_el_bloqueo (critical) y pitch_prematuro (critical).
- **alcance:** null, no apareció aviso.
- **auditoria.alcance:** `{ "aviso": false, "latencia_ms": 1164 }`.
- **Duración guardada de la calificación:** 36.796 segundos. La espera observada por pantalla fue aproximadamente 66 segundos; no son la misma medida.

La primera falla cita «Lo entiendo perfectamente, y qué bueno que ya tenga a alguien que lo atienda.»: interpretó que el cliente tenía proveedor cuando solo dijo que estaba ocupado. No usé esa falla como motivo del regreso.

La segunda, que sí es el motivo del regreso, cita:

> ¿qué es lo que más cuida usted cuando elige a quién comprarle?

Y explica:

> Preguntaste por su operación comercial (cómo elige proveedor) justo después del bloqueo, antes de que el cliente aceptara la conversación. Eso es trabajo comercial antes de tiempo.

Su mejora contradice lo aprobado en el 181:

> Después del AIR, sigue con una pregunta sobre él o sobre cómo le va, no sobre su negocio.

Resultado completo guardado en docs/kb/practica_181.json. No modifiqué cuentas reales ni limpié registros con SQL. Las filas de esta práctica temporal permanecen porque la app no ofrece borrarlas; no toqué vendedores temporales anteriores.

## Regreso verificado

Ejecuté guiones_181_regresar_correr.sql tal cual y después el SQL de verificación:

| guion | versión | fallas | pitch_prematuro |
|---|---|---|---|
| 2.7 | 2.0.4 | 4 | vacío |
| 2.7c | 1.0.5 | 5 | vacío |

Restauré los archivos de funciones con el editor. Las siete huellas son exactamente las del paso 0; eliminé air-sin-ofrecer-nov25.test.ts. Pasan de nuevo **1336 pruebas en 108 archivos** y la compilación automática está sin errores.

Redesplegué únicamente closer-voice y harness-runner anteriores y solicité publicar la restauración en https://closerapp.ai. La solicitud de publicación no confirma por sí sola la finalización del despliegue. El 181 no queda activo.

## Alerta crítica de seguridad, sin cambios

**Título literal:** “Any signed-in user can guess a company invite”.

**Función:** `public._gen_invite_suffix()`; los códigos son aceptados por `join_company_with_code`.

**Qué dice:** el sufijo de cuatro caracteres usa `random()` de PostgreSQL, que no es un generador criptográfico; por ello podrían adivinarse invitaciones válidas y entrar en empresas ajenas.

**Qué propone:** que los códigos que conceden acceso sean impredecibles. El hallazgo no contiene una receta concreta ni SQL de corrección. No cambié esa función, los códigos ni sus permisos.

**metas_practica:** solicito ignorar la alerta con tu razón literal: «Son los objetivos públicos de cada práctica, sin datos de nadie; la tabla es de solo lectura (decisión del mensaje 171)». La herramienta exige aprobar una tarjeta para ignorar una alerta crítica; hasta aprobarla sigue activa.