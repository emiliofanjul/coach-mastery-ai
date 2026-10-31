# Project rules

- Keep user-supplied regression tests in their explicitly requested destination, including `src/lib/tests`; default Vitest discovery includes both test directories.
- Existing evaluation Edge Functions remain maintained in place; deploy only the functions explicitly requested so unrelated live behavior stays unchanged.
- Harness evaluations use real UUID session IDs returned per case; closer-voice checks insert errors and protects background consumption writes with EdgeRuntime.waitUntil so usage can be correlated without silent failures.