## Objetivo
Sincronizar automáticamente el código de este proyecto de Lovable con un repositorio en la cuenta de GitHub `emiliofanjul1@hotmail.com`.

## Alcance
Git sync de Lovable (backup + edición bidireccional del código). No es el GitHub API connector para llamadas dentro de la app.

## Pasos

### 1. Iniciar Git sync desde el editor de Lovable
- En el editor del proyecto, abrir el menú **Plus (+)** del chat input.
- Seleccionar **GitHub → Connect project**.
- Esto abre el flujo de autorización de la GitHub App de Lovable.

### 2. Autorizar GitHub
- Iniciar sesión con la cuenta `emiliofanjul1@hotmail.com` si no está activa.
- Autorizar a la GitHub App de Lovable a acceder a la cuenta.

### 3. Seleccionar cuenta u organización
- Elegir la cuenta personal u organización de GitHub donde vivirá el repo.

### 4. Crear o seleccionar repositorio
- Lovable ofrece crear un repo nuevo con el código actual del proyecto.
- Confirmar el nombre del repositorio y crearlo.

### 5. Verificar sincronización
- Esperar que Lovable confirme que el repo está conectado.
- Opcional: hacer un pequeño cambio en Lovable y confirmar que aparece en GitHub, o viceversa.

## Notas
- Una vez conectado, los cambios en Lovable se empujan automáticamente a GitHub y los pushes a GitHub se reflejan en Lovable.
- Si más adelante querés que la app use la API de GitHub (issues, repos, etc.), eso requiere el GitHub connector aparte.

## Criterio de aceptación
- El proyecto aparece conectado a un repo de GitHub en el UI de Lovable.
- El código del proyecto está disponible en el repo de GitHub.