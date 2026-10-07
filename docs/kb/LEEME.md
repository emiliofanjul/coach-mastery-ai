# Banco de pruebas de SQL

Prueba un SQL contra **el esquema real de la base** antes de correrlo en producción.

- `banco_vivo.mjs` arma una base en memoria (PGlite) con `docs/kb/esquema_vivo.sql`
  —tablas, restricciones, vínculos, índices, validadores y disparadores, exportados
  de producción— y la llena con las fotos de `docs/kb/` (nodos, habilidades,
  tarjetas, reglas, Cerebro). Los nodos se cargan con el validador de guiones activo.
- `probar_sql.mjs <archivo.sql>` corre el SQL dos veces seguidas (debe quedar igual)
  y dice si se acepta o el error exacto que daría la base.

Las fotos y `esquema_vivo.sql` deben ser **del mismo momento**: si no, el banco se
niega a cargar (por ejemplo, "el nodo X no está en el orden exportado").

Uso: `npm i --no-save @electric-sql/pglite && node scripts/banco/probar_sql.mjs ruta/al.sql`

Por qué existe (oct-2026): las migraciones del repositorio no describen la base
completa —varias tablas y columnas se crearon directo en ella—, y los SQL probados
contra suposiciones fallaban en producción. Si el esquema cambia, vuelve a exportar
`esquema_vivo.sql` con la consulta del mensaje 66.
