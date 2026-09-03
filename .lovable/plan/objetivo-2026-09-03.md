## Objetivo
Ejecutar la migración `closer_mundo3_v2_tres_territorios.sql` (auditoría de pitch + vía "correccion" en feedback) y guardarla como `supabase/migrations/20260903120000_pitch_audit_y_correccion.sql`.

## Alcance
Solo la migración SQL adjunta. No se modifica código de la app ni otras tablas.

## Pasos

### 1. Ejecutar la migración en Lovable Cloud
- Usar el migration tool con el SQL exacto proporcionado.
- Descripción: "Pitch Builder: auditoría de secciones + vía 'correccion' en feedback."

### 2. Guardar el archivo en el repo
- Crear/actualizar `supabase/migrations/20260903120000_pitch_audit_y_correccion.sql` con el mismo SQL.

### 3. Verificar
- Confirmar que `pitch_sections` tiene las columnas `audit`, `audited_at` y `audit_status`.
- Confirmar que el CHECK de `pitch_feedback.classification` acepta `'correccion'`.

## Criterio de aceptación
- La migración se ejecuta sin errores.
- Las columnas y el constraint quedan como se describe en el SQL.
- El archivo de migración existe en `supabase/migrations/`.
