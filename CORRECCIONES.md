# Correcciones y mejoras aplicadas (Updater + Código)

Este archivo resume los cambios relevantes realizados en el proyecto para estabilizar el flujo de actualizaciones (auto-updater + releases) y mejorar la base de código (Electron/Vite/TS, login y SQLite).

## Updater / Releases (electron-builder + GitHub)

### Publicación y artefactos consistentes
- Se configuró `electron-builder` para publicar en GitHub Releases:
  - `build.publish.provider = "github"`
  - `owner = "Furiade54"`, `repo = "ToolsMSSQL"`
  - `releaseType = "release"`
  - Archivo: `package.json`
- Se fijó un `artifactName` estable y sin espacios para evitar 404 del updater:
  - `ToolsMSSQL-Setup-${version}.${ext}`
  - Archivo: `package.json`
- Se incluyó `package.json` dentro de `build.files` junto con `dist/**/*` para que el empaquetado tenga la metadata necesaria:
  - Archivo: `package.json`

### Workflow de release (CI)
- Se añadió workflow para compilar y publicar cuando se pushea un tag `v*`:
  - Archivo: `.github/workflows/builder.yml`
- Se corrigió el paso de instalación en CI cambiando `npm ci` → `npm install` para evitar fallas por lockfile fuera de sync en el runner.

### Verificación de updater (salida de build)
- Se validó que `latest.yml` apunte al instalador correcto (mismo nombre del `artifactName`) y que se genere el `.blockmap`.
- Se validó que `app-update.yml` (dentro del paquete) tenga `owner/repo/provider/releaseType` correctos.

## Base del proyecto (Electron + Vite + TypeScript)

### Estructura por procesos y build
- Se separaron procesos `main`, `preload` y `renderer` y sus `tsconfig` para evitar conflictos de módulos.
- Vite quedó configurado con:
  - `root: "src/renderer"`
  - `base: "./"`
  - `build.outDir: "dist/renderer"`
  - Archivo: `vite.config.ts`

### Controles de ventana (frame:false)
- La ventana se ejecuta sin frame nativo (`frame: false`) y se agregaron controles de minimizar/maximizar/cerrar con IPC seguro:
  - Main: canales `window:minimize`, `window:maximize-toggle`, `window:close`
  - Preload: API `window.electronAPI.minimize/maximizeToggle/close`
  - Archivos: `src/main/main.cts`, `src/preload/preload.cts`, `src/renderer/App.tsx`

## Login/Registro + SQLite local

### Persistencia en SQLite (local)
- Se agregó SQLite embebido con `better-sqlite3` y se creó la tabla `users` en un archivo dentro de `app.getPath("userData")`:
  - Archivo DB: `toolsmssql.db`
  - Archivo: `src/main/main.cts`

### Seguridad básica
- Password hashing con `scrypt` + salt por usuario.
- Comparación en tiempo constante con `crypto.timingSafeEqual` para evitar comparaciones directas de strings.
- Rate limit básico para login (bloqueo temporal tras varios intentos fallidos) con error `rate-limited`.
  - Archivo: `src/main/main.cts`

### IPC Auth seguro
- Se expusieron handlers IPC en main:
  - `auth:register`
  - `auth:login`
- Se expuso API mínima en preload:
  - `window.electronAPI.auth.register/login`
  - Archivo: `src/preload/preload.cts`
- Tipado de `window.electronAPI` actualizado:
  - Archivo: `src/renderer/global.d.ts`

## UI de Login (moderna / minimalista)

### Jerarquía visual y UX
- Se reemplazó el layout con tabs por:
  - Título claro (“Accede a tu cuenta”) + enlace secundario (“Registrarse”) (y viceversa en modo registro).
- Un solo CTA principal de alto contraste:
  - “Iniciar sesión” (login)
  - “Registrarse” (registro)
- Inputs con mejor espaciado, bordes visibles, icono de usuario, y ojo dentro del campo de contraseña para mostrar/ocultar.
- Microcopy bajo contraseña:
  - “¿Olvidaste tu contraseña?” (en login).
- Estados visuales de error:
  - borde en rojo + mensaje visible; error general con `role="alert"`.
- Submit con Enter en los inputs y foco inicial en el usuario.
  - Archivo: `src/renderer/App.tsx`

### Persistencia de sesión
- Se guarda/restaura el usuario autenticado en `localStorage` y se agregó botón “Salir” para limpiar sesión.
  - Archivo: `src/renderer/App.tsx`

## Correcciones técnicas puntuales

### TypeScript (cleanup de listeners)
- Se corrigió el tipado y el cleanup de handlers `autoUpdate.on*` para evitar errores de “not callable”.
  - Archivo: `src/renderer/global.d.ts` y `src/renderer/App.tsx`

### TypeScript (narrowing en resultado de auth)
- Se corrigió el acceso a `result.error` para evitar el error:
  - “Property 'error' does not exist on type …”
  - Solución aplicada: guard con `'error' in result` antes de leer `result.error`.
  - Archivo: `src/renderer/App.tsx`

### Native addon (better-sqlite3) en dev
- Se corrigió el problema de incompatibilidad de `NODE_MODULE_VERSION` reconstruyendo el addon para Electron.
- Se agregó un script de rebuild y se integró al flujo de `dev`.
  - Archivo: `package.json`

