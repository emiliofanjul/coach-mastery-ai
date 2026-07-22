# DALFAN — Volcado forense

Hay **3 companies llamadas DALFAN** (no 2). Datos crudos:

| id (corto) | creada | manager | sellers | invites | events | node_progress | brain |
|---|---|---|---|---|---|---|---|
| `aeb89d76…` | 2026-05-06 23:00 | **emiliofanjul1@** (real) | **2** (Emilio, Gabriella) | 3 | **17** | **15** | limpieza a granel |
| `38d8aff3…` | 2026-05-06 23:41 | emiliofanju**1**@ (typo) | 0 | 3 | 0 | 0 | lubricantes Bardahl/Repsol |
| `20fa9c90…` | 2026-05-07 00:00 | emiliofanjul@ (typo, sin "1") | 0 | 0 | 0 | 0 | **NULL** (onboarding nunca terminó) |

**Cuenta viva:** `aeb89d76` es la única con vendedores, eventos y progreso. El manager real (emiliofanjul1) ya apunta ahí. Los dos duplicados son huérfanos de las cuentas typo que ya identificamos en el ticket anterior.

**Brain vivo (`aeb89d76`, limpieza):**
- PRODUCTOS_ACTIVOS: "Artículos de limpieza a granel y de marca propia"
- CLIENTE_TIPICO: dueño/gerente de distribuidora; margen, rotación, logística
- CONTEXTO_DE_VENTA: seguimiento recurrente WhatsApp/llamada, 15-30 min
- TONO_DETECTADO: Familiar — relación de negocio continua
- OBJECIONES_REALES: 4 (precio competencia, pedido mínimo, tiempos de entrega, competencia funciona mejor)
- ARGUMENTOS_DE_VALOR: 3 (precio-calidad, socio confiable, catálogo amplio)
- RESTRICCIONES: no prometer envíos sin verificar inventario
- DON_RAMON_RESPUESTA: "Qué tal, Carlos. Fíjate que se me está acabando el multiusos y el cloro…" ← a eliminar del brain

**Brain huérfano bueno (`38d8aff3`, Bardahl):** lubricantes Bardahl/Repsol, refaccionaria/taller, tono directo, 4 objeciones, 4 argumentos. Es el que se usó en toda la documentación anterior (Bardahl aparece hardcodeado en varios prompts como ejemplo).

## Decisión que necesito de tu lado

Los vendedores vivos (Gaby + Emilio) están practicando contra el brain de **limpieza**, pero toda la doctrina y ejemplos del sistema mencionan **Bardahl**. Dos opciones:

- **A) Consolidar sobre `aeb89d76` (viva)**, sobrescribiendo su brain con el de Bardahl (`38d8aff3`). Cero migración de datos, los 17 events y 15 node_progress se preservan. Los 3 invites de `38d8aff3` se pierden (no fueron usados).
- **B) Consolidar sobre `aeb89d76` manteniendo el brain de limpieza** actual (es el que Emilio llenó en su onboarding real). Bardahl era solo el ejemplo genérico.

Los duplicados `38d8aff3` y `20fa9c90` se borran en ambos casos (después de decidir A o B).

**No toco nada hasta que confirmes A o B.**

---

# Plan de esta entrega (lo que sí ejecuto ahora)

## 1. Limpieza de `DON_RAMON_RESPUESTA`

- `src/utils/onboarding.functions.ts`: quitar `DON_RAMON_RESPUESTA` de la lista de llaves obligatorias del prompt de generación del brain. La respuesta de preview del arquetipo se sigue generando en la pantalla del onboarding (útil para que el manager oiga cómo suena su cliente), pero como **campo efímero** de la respuesta — nunca se persiste dentro de `company_sales_brain`.
- Auditar cualquier otra ruta que escriba al brain (`update_company_brain` RPC, `/mi-empresa`, cualquier función edge) para confirmar que ninguna vuelve a inyectar la llave.
- Migración `UPDATE companies SET company_sales_brain = company_sales_brain - 'DON_RAMON_RESPUESTA' WHERE company_sales_brain ? 'DON_RAMON_RESPUESTA'` (afecta las 2 companies que hoy la tienen).
- `/mi-empresa`: filtrar `DON_RAMON_RESPUESTA` de la lista de "Otros campos" para que nunca se muestre aunque quede en algún brain futuro.

## 2. `/mi-empresa` — construir pero dejar tras un gate

- Construir la ruta completa con los 7 campos canónicos (PRODUCTOS_ACTIVOS, CLIENTE_TIPICO, CONTEXTO_DE_VENTA, OBJECIONES_REALES, ARGUMENTOS_DE_VALOR, TONO_DETECTADO, RESTRICCIONES) + sección "Otros campos" (excluyendo DON_RAMON_RESPUESTA).
- RLS: solo el manager de esa company (usa `update_company_brain` RPC que ya valida `is_manager()`).
- **Ocultar el botón de nav "Mi Empresa"** hasta que resuelvas A/B — así el manager no edita el brain equivocado. Feature-flag simple: comentar la entrada en el header y dejar la ruta accesible solo por URL directa para pruebas.
- Cuando confirmes A/B y ejecute la consolidación, destapo el botón en el mismo turno.

## Detalles técnicos

- Migración SQL única: `UPDATE ... - 'DON_RAMON_RESPUESTA'` + comentario para futuros mantenedores.
- Edge function / RPC: no requieren cambio porque `update_company_brain` acepta el JSON tal cual — la garantía de no-persistencia queda en el prompt de generación (paso 1) y en el UI de /mi-empresa (que nunca ofrecerá esa llave).
- No borro las 2 companies duplicadas en este turno; van en el siguiente cuando decidas A o B.

**Bloqueadores para cerrar el ciclo:** tu decisión A vs B sobre el brain de la company viva.
