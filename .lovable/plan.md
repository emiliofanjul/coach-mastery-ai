# Fase 10 — Integración ElevenLabs

Implementación de la pantalla de práctica de voz con el agente Closer Coach (estructura I DO / YOU DO) y conexión al flujo del mapa.

## Pasos

### 1. Instalar dependencia
- `bun add @elevenlabs/react`

### 2. Editar `src/routes/nodo.$nodeId.tsx`
- Reemplazar el bloque `onCta` (líneas ~237-243) del `BottomButton`:
  - Si `node.node_type === "knowledge"` → navega a `/nodo/$nodeId/quiz`
  - En cualquier otro caso (`skill_drill`, `full_sim`, `boss`) → navega a `/nodo/$nodeId/practica`

### 3. Crear `src/routes/nodo.$nodeId.practica.tsx`
Ruta nueva con `createFileRoute("/nodo/$nodeId/practica")`. Componente `PracticaPage` con tres fases manejadas por estado `phase: "prep" | "voice" | "feedback"`.

**Hook al nivel superior:** `useConversation` declarado una sola vez en `PracticaPage` (no dentro de condicionales). Maneja `onMessage` para acumular `transcriptFull` con `currentPhaseRef.current`, detecta "ahora es tu turno" para cambiar a `you_do`, y detecta "vamos al detalle" para llamar `handleSessionEnd()`.

**Fase PREP:**
- Solicita micrófono al montar con `getUserMedia({ audio: true })`.
- 3 checks animados con framer-motion stagger 0.3s (micrófono según permiso, volumen, lugar sin ruido).
- Botón "Listo →" naranja `#FF6B2B`, deshabilitado hasta que `micGranted`.
- Al click: carga en paralelo `sellers` (por `auth.user.id`), `nodes` (por `nodeId`) y `companies` (por `seller.company_id`), guarda en estado y pasa a `phase = "voice"`.
- Botón ✕ arriba izquierda → `/mapa`.

**Fase VOICE:**
- `useEffect` dispara `startVoiceSession()` al entrar.
- `conversation.startSession({ agentId: "agent_0901krktpk9pfjztj3djbc6en2fc", connectionType: "webrtc", overrides: { agent: { firstMessage: <prompt I DO / YOU DO con contexto del vendedor, empresa y nodo> } } })`.
- Banner superior cambia color/texto según `currentPhase` (azul `#4DABF7` para `i_do`, naranja `#FF6B2B` para `you_do`).
- Centro: `CloserCharacter size=120 state="normal"` + anillo SVG pulsante (azul si `isSpeaking`, naranja si `you_do && !isSpeaking`, blanco idle).
- Subtexto "Escucha con atención" solo si `i_do && isSpeaking`.
- Botón "Ver de nuevo" solo en `i_do`: cierra sesión, limpia transcript y vuelve a iniciar.
- Botón ✕ → dialog de confirmación → `endSession()` → `/mapa`.

**`handleSessionEnd()`:** cierra la sesión, filtra mensajes `you_do`, inserta fila en `practice_sessions` (`practice_type: "skill_drill"`, `world_id: 0`, `transcript` como JSON), guarda `sessionId`, pasa a `phase = "feedback"`.

**Fase FEEDBACK:**
- Pantalla "Analizando tu práctica" con `CloserCharacter state="motivation"`, 3 puntos pulsantes y micro-mensajes rotando cada 2s.
- Tras 3s muestra `VictoryScreen` con `stars=2`, título "¡Práctica completada!", botón "Ver mapa →".
- `onContinue`: upsert `node_progress` (status `done`, 2 estrellas), busca siguiente nodo del mismo mundo por `order_index`, lo marca `current` y actualiza `sellers.current_node`. Llama `setNodeCompletionSignal({ nodeId, stars: 2, isReplay: false, improved: true })` y navega a `/mapa`.

### 4. Verificación
- Build automático debe pasar (sin tocar `routeTree.gen.ts` manualmente).
- Verificar que `useConversation` queda al top-level y que el ref `currentPhaseRef` se mantiene sincronizado con `currentPhase`.

## Detalles técnicos

- **Diseño:** fondo `#08080F`, max-width 560px, padding lateral 1.2rem, mobile-first. Tipografías Syne (títulos) y DM Sans (cuerpo). Botones radius 99px, cards radius 14px. Naranja `#FF6B2B` solo para acción principal.
- **Agente público:** se usa `agentId` directo (sin token server-side). El prompt completo se inyecta vía `overrides.agent.firstMessage` — esto requiere que los overrides estén habilitados en el panel de ElevenLabs.
- **Micrófono activo en ambas fases:** ElevenLabs gestiona los turnos; no se silencia manualmente.
- **Persistencia:** insert en `practice_sessions` ocurre antes de feedback; upserts de `node_progress` y avance de `current_node` ocurren al pulsar "Ver mapa →".
- **Sin gates ni bloqueos:** consistente con la filosofía Closer — no se valida calificación mínima, siempre se otorgan 2 estrellas en esta fase inicial.
- **Tipos:** `transcriptFull` usa el tipo dado; `sellerData/nodeData/companyData` se tipan como `any` por simplicidad inicial.
