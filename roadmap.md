# Roadmap

- [ ] Publicar mensajes 110 y 111 por autorización de Emilio del 30-oct-2026; no cambiar P2_10, reportar su falla aislada sin detener la publicación.

- [x] Mensaje 102: paso 0 confirmado con 630/47 pruebas vigentes y huellas exactas; las copias de preparación se excluyeron del baseline.
- [x] Mensaje 102: SQL protegido aplicado y huella final 23019881cc63ef786045c08cf0a68387; tres archivos movidos con MD5 exactos; desplegado solo harness-runner v3.22.0; 635/48 pruebas pasan y build automático OK.
- [x] Mensaje 102: G41/G42 pasan cuatro veces cada uno; G32/P3_8/P3_9/P3_9b pasan una vez. Texto 1.2 termina en 30 y muestra critical; 2.7c deja responder ambos bloqueos pero falla con 50 y pide_permiso_de_nuevo; 3.9b termina en 80, descubre hueco y no marca trámite. No publicar; detenido según paso 6, sin modificar evaluador ni Director.

- [x] Mensaje 101: 622 pruebas vigentes y todas las huellas iniciales confirmadas.
- [x] Mensaje 101: SQL protegido aplicado, cinco huellas finales y reemplazos exactos verificados; solo harness-runner desplegado; 630/47 pruebas pasan.
- [x] Mensaje 101: 630/47 pruebas; G32/G41 pasan 4/4; doce casos restantes pasan; sin casos 7.3. Reportadas notas, bases, restas y juez.
- [x] Emilio: paso 4 completado y reportado; pantalla crítica no alcanzada por permiso solo voz y falta de micrófono en sandbox.
- [x] Mensaje 101: publicación de 95–101 solicitada para closerapp.ai; despliegue final aún no confirmado.
- [ ] Emilio: verificar por voz pantalla crítica 1.2 sin preguntas; 2.7c y 3.9b. Bloqueador: requiere micrófono real.

- [x] Mensaje 100: 618 pruebas y huellas confirmadas; cinco reemplazos idénticos; desplegada solo closer-voice v2.9.3.
- [x] Mensaje 100: 622/46 pruebas pasan; G12 cuatro veces con 5; G32 falla tres de cuatro; red completa 52 pasan, 1 falla (G32), 5 omitidos.
- [x] Mensaje 100: G32 resuelto por mensaje 101; pantalla crítica queda para prueba por voz de Emilio.

- [x] Mensaje 97: confirmar huellas, actualizar regla, mover archivos exactos, desplegar solo la red y ejecutar las 14 corridas; 605/605 pruebas pasan.
- [x] Mensaje 97: G40 resuelto por mensaje 99 (4/4 pasa con 30).

- [x] Copiar los dos archivos de etiquetas boss tras verificar af0aca0 y comprobar identidad byte por byte.
- [x] Verificar las pruebas y las hojas de El Diagnóstico y de un boss completado en el mapa.

- [x] Fix typecheck build errors (SectionChat.tsx was corrupt; restored previous working version).
- [ ] Identify the affected `nuevo` pitch, client type, and recorded prompt version.
- [ ] Prove why V20/V21 were bypassed or failed.
- [ ] Add V22 (no fabricated clients/locations/case counts).
- [ ] Add V23 (`nuevo` cannot imply prior interactions or recurrent-account tools).
- [ ] Harden the introduction prompt for a genuine ice breaker and conversational opening.
- [ ] Regenerate the complete `nuevo` pitch and report validation retries and section lengths.
- [ ] Verify build and final database output.
