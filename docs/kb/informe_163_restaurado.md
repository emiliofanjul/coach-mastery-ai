# Mensaje 163 — No publicado; restauración completa

## Decisión y límites de los datos

La corrida temporal del turno anterior no sobrevivió al reinicio. No puedo recuperar su tabla completa, G117/G118 ni sus conteos; los registros históricos disponibles solo cubren 19:51–19:57 UTC. Repetí con el mismo código de comprobación, llamando al evaluador en vivo como Emilio y conservando las respuestas completas. No es una corrida del runner desplegado con llave de servicio, y no la presento como idéntica a la anterior.

Claude agotó su saldo durante esta repetición. Hubo auditoria.vara.error en **6 casos**, por encima del máximo de 2 del Paso 6. G117 y G118 no pudieron evaluarse. **No publiqué.** Restauré las cinco huellas del Paso 0, retiré los dos archivos nuevos y la prueba nueva, y desplegué únicamente closer-voice y harness-runner. **1183/1183 pruebas en 98 archivos; compilación automática OK.** La restauración no resuelve el saldo insuficiente de Claude.

## Comparación

- Línea base del 10-nov, 18:00 UTC: primera corrida **144 pass, 3 fail, 5 skipped**. Tras repetir: **146 pass, 1 fail (G60), 5 skipped**.
- Repetición de hoy: **18 pass, 131 fail del corredor, 5 skipped**. De esos 131, **126 no tuvieron calificación** por saldo insuficiente; **5 devolvieron calificación pero falló la vara**, y el sexto error de vara está dentro de G18 (el chequeo de consistencia no lo detecta).
- Ningún resultado bloqueado por saldo demuestra una regresión doctrinal.
- **G57 y G60:** no alcanzaron una calificación hoy; no tengo dos fallas doctrinales nuevas. G57 falló una vez en la línea base por `vacia_las_balas` y `objections.bullet_theory: parcial`, después pasó. G60 falló dos veces por `missing expected flag: se_disculpa`; la repetición actual está bloqueada por saldo, no por esa razón.
- **G117 y G118:** bloqueados por saldo; **no hay ejemplos nuevos que pueda pegar**. Los ejemplos de la corrida anterior se perdieron con el archivo temporal.

## tiempos

**Línea base completa:**
```json
{
  "casos_medidos": 146,
  "promedio_ms": 28623,
  "mas_lentos": [
    {
      "id": "G105_espejo_no_contradice_su_criterio",
      "ms": 76712
    },
    {
      "id": "G106_suelta_la_pista_sin_el_dolor",
      "ms": 62693
    },
    {
      "id": "G76_interrogatorio",
      "ms": 60493
    }
  ],
  "sobre_90s": 0
}
```

**Repetición parcial, solo 22 resultados que devolvieron ms_total; NO comparable como promedio de toda la red:**
```json
{
  "casos_medidos": 22,
  "promedio_ms": 38414,
  "mas_lentos": [
    {
      "id": "G03_disculpa_inicial",
      "ms": 67357
    },
    {
      "id": "G12_groseria_del_usuario",
      "ms": 55552
    },
    {
      "id": "G02_pitch_prematuro",
      "ms": 53226
    }
  ],
  "sobre_90s": 0
}
```

## Tabla completa disponible

A = pass; V = calificación devuelta pero vara con error; B = bloqueado por saldo, sin calificación; S = skipped. G18 es A en el chequeo de consistencia, pero una de sus dos respuestas tuvo error de vara. Base/restas/nota son de la repetición actual.

| Caso | Antes¹ | Ahora | Base | Restas | Nota |
|---|---|---|---:|---|---:|
| G01_sce_perfecto | pass | A | 100 | — | 100 |
| G02_pitch_prematuro | pass | A | 0 | pitch_prematuro (critical): -30, sin_pregunta (critical): -30 | 0 |
| G03_disculpa_inicial | pass | A | 0 | pide_permiso (critical): -30, se_disculpa (critical): -30 | 0 |
| G04_sin_nombre_sin_entorno | pass | A | 53 | — | 53 |
| G05_usuario_callado | pass | A | 20 | sin_pregunta (critical): -30 | 5 |
| G06_fuera_de_scope_discovery | pass | A | 80 | pitch_prematuro (critical): -30 | 30 |
| G07_sacar_del_personaje | skipped | S | — | — | — |
| G08_max_turns_alcanzado | skipped | S | — | — | — |
| G09_scope_cubierto_corte_temprano | pass | A | 80 | — | 80 |
| G40_apertura_sin_pregunta | pass | A | 80 | sin_pregunta (critical): -30 | 30 |
| G10_energia_texto_no_evaluada | pass | A | 53 | — | 53 |
| G11_actor_no_suelta_bloqueos_sin_air | skipped | S | — | — | — |
| G12_groseria_del_usuario | pass | A | 20 | sin_pregunta (critical): -30 | 5 |
| G13a_ayuda_dentro_de_scope | pass | A | 20 | — | 20 |
| G13b_ayuda_fuera_de_scope | skipped | S | — | — | — |
| G14_apertura_en_ingles | pass | A | 53 | — | 53 |
| G15_scope_perfecto_mas_producto_al_final | pass | A | 80 | pitch_prematuro (critical): -30 | 30 |
| G16_transcript_vacio | skipped | S | — | — | — |
| G17_turno_larguisimo | pass | V | 60 | pitch_prematuro (critical): -30 | 30 |
| G18_dos_sesiones_mismo_usuario | pass | A | — | — | 100 |
| G19_criterios_citados_por_id | pass | V | 0 | pitch_prematuro (critical): -30, sin_pregunta (critical): -30 | 0 |
| G20_json_de_salida_valido | pass | A | 100 | — | 100 |
| G21_ejecucion_limpia_sin_observaciones | pass | A | 100 | — | 100 |
| G22_pregunta_hablada_sin_signo | pass | A | 100 | — | 100 |
| G23_curiosidad_abierta | pass | A | 100 | — | 100 |
| G24_pitch_prematuro_sin_ejemplo_listado | pass | V | 100 | pitch_prematuro (critical): -30 | 30 |
| G25_pregunta_de_cortesia_cuenta | pass | V | 53 | — | 53 |
| G26_especifica_pero_plana | pass | B | — | — | — |
| G27_buen_ice_breaker_cliente_frio | pass | B | — | — | — |
| G28_especifica_suena_a_inspeccion | pass | V | 85 | — | 85 |
| P2_1_perfecto | pass | B | — | — | — |
| P2_2_perfecto | pass | B | — | — | — |
| P2_5_perfecto | pass | B | — | — | — |
| P2_7_perfecto | pass | B | — | — | — |
| P2_7c_perfecto | pass | B | — | — | — |
| G35_insiste_tras_dos_no | pass | B | — | — | — |
| G36_se_va_al_primer_no | pass | B | — | — | — |
| G37_de_volada_no_es_permiso | pass | B | — | — | — |
| G38_no_pero_nada_mas_no_es_discutir | pass | B | — | — | — |
| G43_practica_real_2_7c_texto | pass | B | — | — | — |
| G39_de_rapido_no_es_hacerse_menos | pass | B | — | — | — |
| P2_8_perfecto | pass | B | — | — | — |
| P2_9_perfecto | pass | B | — | — | — |
| P2_10_perfecto | pass | B | — | — | — |
| P3_1_perfecto | pass | B | — | — | — |
| P3_2_perfecto | pass | B | — | — | — |
| P3_3_perfecto | pass | B | — | — | — |
| P3_4_perfecto | pass | B | — | — | — |
| P3_6_perfecto | pass | B | — | — | — |
| P3_8_perfecto | pass | B | — | — | — |
| P3_9_perfecto | pass | B | — | — | — |
| P3_10_perfecto | pass | B | — | — | — |
| G29_regla_de_los_no | pass | B | — | — | — |
| G44_sale_al_segundo_no | pass | B | — | — | — |
| G45_vago_no_es_no | pass | B | — | — | — |
| G30_corte_del_director_no_es_falta | pass | B | — | — | — |
| P3_9b_perfecto | pass | B | — | — | — |
| G31_falla_critica_se_explica | pass | B | — | — | — |
| G32_mapeo_con_pregunta_abierta | pass | B | — | — | — |
| G41_pregunta_sin_hueco | pass | B | — | — | — |
| G42_intenta_de_verdad_sin_hueco | pass | B | — | — | — |
| G33_intencion_en_voz_alta_no_es_pregunta | pass | B | — | — | — |
| G34_identificarse_no_es_pitch | pass | B | — | — | — |
| G46_jones_imaginado_concreto | pass | B | — | — | — |
| G47_jones_vago_a_medias | pass | B | — | — | — |
| G48_jones_se_cae | pass | B | — | — | — |
| G49_jones_sostenido | pass | B | — | — | — |
| G50_urgencia_con_razon | pass | B | — | — | — |
| G51_escasez_sin_razon | pass | B | — | — | — |
| G52_desglose_imaginado | pass | B | — | — | — |
| G53_escalon_sin_motivo | pass | B | — | — | — |
| G54_conviccion_sin_garantia | pass | B | — | — | — |
| G55_garantiza | pass | B | — | — | — |
| G56_que_lo_pruebe | pass | B | — | — | — |
| G57_balas_poco_a_poco | pass | B | — | — | — |
| G58_vacia_las_balas | pass | B | — | — | — |
| G59_promesa_sin_ancla | pass | B | — | — | — |
| G60_no_le_quito_mucho | fail | B | — | — | — |
| G61_de_volada_no_es_disculpa | pass | B | — | — | — |
| G62_si_o_no_que_invita | pass | B | — | — | — |
| G63_pregunta_que_da_salida | pass | B | — | — | — |
| G64_se_encoge | pass | B | — | — | — |
| G65_porque_es_parte_de_la_pieza | pass | B | — | — | — |
| G66_historia_con_curriculum | pass | B | — | — | — |
| G67_interes_de_compromiso | pass | B | — | — | — |
| G68_monologo | pass | B | — | — | — |
| G69_historia_que_da_vueltas | pass | B | — | — | — |
| G70_dolor_sin_devolverlo | pass | B | — | — | — |
| G71_opinion_del_precio | pass | B | — | — | — |
| G72_precio_por_hechos | pass | B | — | — | — |
| G73_nombrar_familia_no_es_receta | pass | B | — | — | — |
| G74_receta_en_diagnostico | pass | B | — | — | — |
| G75_opciones_no_es_interrogatorio | pass | B | — | — | — |
| G76_interrogatorio | pass | B | — | — | — |
| G77_cerradas_en_capa_tres | pass | B | — | — | — |
| G78_una_cerrada_suelta | pass | B | — | — | — |
| G79_hueco_con_jones | pass | B | — | — | — |
| G80_hueco_que_contradice | pass | B | — | — | — |
| G81_rojo_encantador_sale_bien | pass | B | — | — | — |
| G82_contrato_que_deja_algo | pass | B | — | — | — |
| G83_se_va_sin_averiguar | pass | B | — | — | — |
| G84_presiona_no_asume | pass | B | — | — | — |
| G85_alternativa_asumida | pass | B | — | — | — |
| G86_se_lo_mando | pass | B | — | — | — |
| G87_senal_contesta_y_cierra | pass | B | — | — | — |
| G88_senal_un_beneficio_mas | pass | B | — | — | — |
| G89_llena_el_silencio | pass | B | — | — | — |
| G90_contestar_no_es_llenar | pass | B | — | — | — |
| G91_descuento_a_cambio | pass | B | — | — | — |
| G92_descuento_de_panico | pass | B | — | — | — |
| G93_una_bala_y_cierra | pass | B | — | — | — |
| G94_bala_ya_dicha_conectada | pass | B | — | — | — |
| G95_bala_repetida_tal_cual | pass | B | — | — | — |
| G96_apila_balas | pass | B | — | — | — |
| G97_discute_la_objecion | pass | B | — | — | — |
| G98_responde_sin_discutir | pass | B | — | — | — |
| G99_siguientes_pasos_claros | pass | B | — | — | — |
| G100_sigue_vendiendo | pass | B | — | — | — |
| G101_festeja_de_mas | pass | B | — | — | — |
| G102_referido_amarrado | pass | B | — | — | — |
| G103_referido_en_frio | pass | B | — | — | — |
| G104_argumento_segun_el_caso | pass | B | — | — | — |
| G105_espejo_no_contradice_su_criterio | pass | B | — | — | — |
| G106_suelta_la_pista_sin_el_dolor | pass | B | — | — | — |
| G107_no_que_invita | pass | B | — | — | — |
| G108_proveedor_menos_sin_que_aplique | pass | B | — | — | — |
| G109_bala_de_servicio_que_sirve | pass | B | — | — | — |
| P4_1_perfecto | pass | B | — | — | — |
| P4_2_perfecto | pass | B | — | — | — |
| P4_3_perfecto | pass | B | — | — | — |
| P4_10_perfecto | pass | B | — | — | — |
| P4_11_perfecto | pass | B | — | — | — |
| G110_decide_por_el | pass | B | — | — | — |
| P4_12_perfecto | pass | B | — | — | — |
| P4_16_perfecto | pass | B | — | — | — |
| P5_6_perfecto | pass | B | — | — | — |
| G111_responde_y_espera | pass | B | — | — | — |
| P5_8_perfecto | pass | B | — | — | — |
| G112_fff_sin_bala | pass | B | — | — | — |
| P5_12_perfecto | pass | B | — | — | — |
| G113_objecion_despues_de_aguantar | pass | B | — | — | — |
| P5_14_perfecto | pass | B | — | — | — |
| G114_reabre_lo_de_siempre | pass | B | — | — | — |
| P5_15_perfecto | pass | B | — | — | — |
| G115_anuncia_plan_b | pass | B | — | — | — |
| P6_2_perfecto | pass | B | — | — | — |
| P6_3_perfecto | pass | B | — | — | — |
| G116_sin_referido | pass | B | — | — | — |
| P6_4_perfecto | pass | B | — | — | — |
| P7_0_perfecto | pass | B | — | — | — |
| P7_2_perfecto | pass | B | — | — | — |
| P7_4_perfecto | pass | B | — | — | — |
| G118_se_venden_mucho_es_trabajo_comercial | nuevo | B | — | — | — |
| G117_ejemplo_no_ensena_la_falla | nuevo | B | — | — | — |

¹ Antes incluye las repeticiones de G57, G60 y P7_4.

Cambios comprobados con respuesta: pass→V en G17, G19, G24, G25 y G28 (errores de la revisión, durante el bloqueo de saldo). Los demás pass→B son llamadas sin evaluación, no juicios nuevos. G57 y G60 también quedaron B; cinco S siguen S; G117 y G118 son nuevos y B. La tabla enumera todos los casos, sin convertir B en un fallo doctrinal.

## Vara

**Primera pasada conservada de la repetición:** revisados **103**, reprobados **0**, corregidos **0**, descartados **0**; **6 casos con error**: G17, G18 (una respuesta), G19, G24, G25 y G28. **Son conteos parciales**, no la suma de la corrida perdida. Las 43 repeticiones posteriores quedaron bloqueadas por saldo y no añadieron conteos.

## Observaciones añadidas

En la repetición conservada, **3 casos** tienen `observaciones_de_la_rubrica`: G02, G13a y G19. El registro consultable conserva **2 líneas**: G02 (opening.curiosidad_abierta) y G13a (opening.personalizacion). G19 está confirmado por su respuesta, no por una línea recuperable. En el tramo recuperable de la corrida anterior, 19:51–19:57 UTC, **0 líneas**; el total de aquella corrida es **desconocido**.

## Textos reprobados: todas las líneas históricas recuperadas

Estos tres registros pertenecen a la corrida anterior. Sin el mapa caso→session_id perdido, identifico sesión y nodo; no invento el id del caso. Hay **4 textos**, **2 corregidos y 2 descartados**. Ninguno aparece en la repetición conservada.

```text
2026-11-10T19:52:46.341Z WARNING [closer-voice] la misma vara: textos del coach que reprobaron una prueba del nodo {
  "session_id": "90906e93-1470-4d09-bb09-12d9491341a1",
  "node_id": "4.15",
  "detalle": [
    {
      "id": "obs1.ejemplo",
      "tipo": "ejemplo",
      "falla": "pide_que_pruebe",
      "frase": "No le puedo garantizar nada, pero estoy seguro de que se le va a mover, porque en talleres como el suyo la grasa de litio es de lo que más sale, y si la tiene siempre a la mano, sus clientes la encuentran y usted vende más.",
      "por_que": "Presenta la compra como experimento: 'a ver si se le mueve'. Le pasa el riesgo al cliente de probar si funciona.",
      "quedo": "corregido"
    }
  ]
}
```

```text
2026-11-10T19:54:30.239Z WARNING [closer-voice] la misma vara: textos del coach que reprobaron una prueba del nodo {
  "session_id": "9cc45048-168e-412f-ab94-979efe3ed587",
  "node_id": "5.6",
  "detalle": [
    {
      "id": "fal0.ejemplo",
      "tipo": "ejemplo",
      "falla": "no_repite",
      "frase": "Dentro de la ciudad entregamos en veinticuatro horas. ¿Cuántas cajas quiere que le traiga en el primer pedido?",
      "por_que": "Responde con dato concreto y retoma con pregunta del siguiente paso. No repite la objeción con palabras del cliente, falta la primera pieza del RRR.",
      "quedo": "corregido"
    }
  ]
}
```

```text
2026-11-10T19:55:08.363Z WARNING [closer-voice] la misma vara: textos del coach que reprobaron una prueba del nodo {
  "session_id": "de0b7321-cf62-4c45-ad58-0bba342b4c42",
  "node_id": "5.8",
  "detalle": [
    {
      "id": "obs0.ejemplo",
      "tipo": "ejemplo",
      "falla": "vacia_el_cargador",
      "frase": "Entiendo cómo se siente, don Chuy. Otros clientes sintieron lo mismo, y lo que encontraron fue que con la entrega cada martes nunca más perdieron una venta por falta de aceite. Y el primer pedido se lo dejo en mil cincuenta en vez de mil doscientos. ¿Se la traigo este martes o el siguiente?",
      "por_que": "Suelta dos balas: 'nunca más perdieron una venta' y 'mil cincuenta en vez de mil doscientos', antes de cerrar.",
      "quedo": "descartado"
    },
    {
      "id": "fal0.ejemplo",
      "tipo": "ejemplo",
      "falla": "vacia_el_cargador",
      "frase": "Entiendo cómo se siente, don Chuy. Otros clientes sintieron lo mismo, y lo que encontraron fue que con la entrega cada martes nunca más perdieron una venta por falta de aceite. Y el primer pedido se lo dejo en mil cincuenta en vez de mil doscientos. ¿Se la traigo este martes o el siguiente?",
      "por_que": "Suelta dos balas: 'nunca más perdieron una venta' y 'mil cincuenta en vez de mil doscientos', antes de cerrar.",
      "quedo": "descartado"
    }
  ]
}
```

## Restauración verificada

| Archivo | MD5 restaurado |
|---|---|
| closer-voice/index.ts | 8b4721da8e49aaddccb5b9ea9c077c04 |
| harness-runner/index.ts | 32bea52073c02aa7ad814a034c561bc6 |
| _shared/eval_harness_v1.json | 5c5ec3c82ade93e3b9714a56e1003785 |
| src/lib/practicas-admin.ts | 5e8c3ecc84967667d1f8ffb478196b20 |
| src/routes/nodo.$nodeId.practica.tsx | 26b35a537fa467c3a1b4bb095f85293f |

No se modificaron datos, Cerebro, reglas, tarjetas, guiones ni otras funciones. No se solicitó publicación.
