# Project rules

- Keep user-supplied regression tests in their explicitly requested destination, including `src/lib/tests`; default Vitest discovery includes both test directories.
- Existing evaluation Edge Functions remain maintained in place; deploy only the functions explicitly requested so unrelated live behavior stays unchanged.
- Harness evaluations use real UUID session IDs returned per case; closer-voice checks insert errors and protects background consumption writes with EdgeRuntime.waitUntil so usage can be correlated without silent failures.
- Short model calls in closer-voice use one instrumented wrapper with phase and session attribution so judge, auditor, client-profile and rewrite consumption is recorded alongside evaluation.
- Rated practices are recorded server-side before evaluation completion; phone audio and streaks complete that event by practice_session_id, preserving server data so phone failures cannot erase history.
- Keep the certification exam identifier in the shared certification module so practice completion and regression tests cannot drift to a retired map node.
- Keep app palette definitions in the global stylesheet's --c-* tokens and reference them from screens; only documented brand/canvas exceptions may use literal colors, so palette changes stay centralized.
- Keep Phase 2 shared controls in closer/piezas and their dimensions in global CSS tokens so screen sizing stays consistent.
- Render model emphasis through TextoCoach as React text and strong elements, never model HTML, so chat formatting cannot execute markup.
- Prefer nombre_corto in coach progress context with a full-name fallback so map and coach labels stay aligned.
- Carry optional unlock attribution in node-completion signals so map path animation distinguishes new progress from failed attempts and replays.
- Share onboarding presentation pieces in bienvenida-ui and keep the map guide separate from the reusable map-intro route, so first-visit guidance and menu replay remain independent.
- Derive map-guide node type and voice-practice distance in the shared guia-mapa helper from ordered map data, so guidance stays accurate when content changes.
- Reuse manager onboarding questions, direct brain mapping and existing save functions for personal practice setup, so commercial data stays grounded and both flows remain aligned.