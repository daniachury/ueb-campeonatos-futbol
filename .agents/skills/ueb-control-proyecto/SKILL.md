---
name: ueb-control-proyecto
description: >-
  Guía y ejecución obligatoria del protocolo de 9 pasos para el ciclo de vida de desarrollo
  de software en UEB Campeonatos, control de versiones Git, integración con historias Jira KAN,
  compuertas de aprobación obligatoria por fase y cumplimiento estricto del Paso 9.
---

# Control de Proyecto, Protocolo de 9 Pasos y Compuertas de Aprobación

Este protocolo establece el flujo de trabajo estandarizado para el desarrollo de cualquier funcionalidad, corrección o tarea en el proyecto **UEB Campeonatos de Fútbol**.

---

## 1. Regla de Oro: Compuertas de Aprobación Obligatoria por Fase

> [!IMPORTANT]
> **COMPUERTAS DE APROBACIÓN**: El asistente **NO puede avanzar automáticamente entre fases sin aprobación del usuario**.
> En cada fase, el asistente debe presentar **QUÉ** se va a realizar, **CÓMO** se va a implementar (archivos, contratos, consultas o componentes) y **ESPERAR APROBACIÓN EXPRESA** antes de crear o modificar código.

El ciclo se divide en 5 compuertas:

```
[FASE 1: Diagnóstico & Rama]   ──>  [Aprobación 1]
[FASE 2: Backend & Base D1]   ──>  [Aprobación 2]
[FASE 3: Frontend v3 Neón]    ──>  [Aprobación 3]
[FASE 4: Batería CI/CD Local] ──>  [Aprobación 4]
[FASE 5: Entrega Paso 9]      ──>  [Aprobación 5 (Commit/Push/Jira)]
```

---

## 2. El Ciclo Detallado de 9 Pasos

### Fase 1: Preparación, Diagnóstico y Rama (Pasos 1 y 2)
- **Paso 1: Requisitos KAN**:
  - Indicar que esta haciendo en cada paso.
  - Extraer los criterios de aceptación de Jira (`KAN-XX`).
  - Definir la rama de trabajo: `feature/KAN-XX-descripcion-corta` o `fix/KAN-XX-descripcion-corta`.
  - Indicar que paso termino
- **Paso 2: Diagnóstico y Reproducción**:
  - Si es bug: prueba que falle antes de tocar código.
  - Si es feature: mapear puntos de integración en `src/server/` y `src/client/`.
-  **Desición 1**: Presentar el resumen del diagnóstico y esperar autorización del usuario para proceder a la Fase 2.

### Fase 2: Backend y Base de Datos D1 (Pasos 3 y 4)
- **Paso 3: Diseño Técnico**:
  - Definir esquemas Zod en `src/shared/`.
  - Diseñar endpoints en Hono y consultas preparadas en D1.
  - Indicar que paso termino.
- **Paso 4: Implementación Backend & D1**:
  - Si requiere base de datos, crear **NUEVA migración incremental** en `migrations/` (ej. `0013_...sql`).
  - **Inmutabilidad**: Prohibido alterar migraciones `0001_` a `0012_`.
-  **Desición 2**: Presentar la propuesta de código de migración, esquemas y endpoints. Esperar aprobación antes de pasar a la Fase 3.

### Fase 3: Frontend v3 Neón Minimal (Paso 5)
- **Paso 5: Implementación Frontend**:
  - Componentes en `src/client/features/<modulo>/` con CSS Modules (`*.module.css`).
  - Uso exclusivo de tokens de `src/client/styles/tema.css` (`--color-fondo-app`, `--color-acento`, etc.).
  - **Prohibido**: `setState` síncrono dentro del cuerpo de `useEffect` (regla `react-hooks/set-state-in-effect`).
  - En dependencias de `useEffect`, usar identificadores primitivos (ej. `usuarioActual?.id`).
-  **Desición 3**: Presentar la propuesta de interfaz y componentes. Esperar aprobación antes de pasar a la Fase 4.

### Fase 4: Pruebas y Batería de CI/CD Local (Pasos 6 y 7)
- **Paso 6: Pruebas Unitarias e Integración**:
  - Pruebas en Vitest (`*.test.ts`, `*.test.tsx`).
  - Indicar que paso termino.
- **Paso 7: Controles de CI/CD Locales Obligatorios**:
  - Ejecutar la batería completa (definida en `ueb-controles-ci-cd`):
    1. `npm run lint` (0 errores).
    2. `npm run typecheck` (0 errores de TypeScript).
    3. `npm run test:ci` o `npm run test:coverage` (cobertura de líneas $\ge 80\%$).
    4. `npm run build` (compilación limpia de Vite y Cloudflare Workers).
-  **Desición 4**: Presentar los reportes en verde de los 4 comandos de CI/CD. Esperar confirmación para la Fase 5.

### Fase 5: Verificación E2E y Entrega (Pasos 8 y 9)
- **Paso 8: Verificación Visual**:
  - Validar contraste, visualización responsiva (360px móvil y >=1024px escritorio).
  - Indicar que paso termino
- **Paso 9: Compuerta Estricta de Entrega (Paso 9 Gate)**:
  > [!CAUTION]
  > **COMPUERTA ESTRICTA**: El agente tiene **terminantemente prohibido** ejecutar `git commit`, `git push`, `git pull` o transicionar estados en Jira de forma autónoma.
  - Presentar el Write-Up oficial de entrega en formato Definition of Done (DoD).
  - Esperar confirmación explícita (ej. "si paso 9 con commit").

---

## 3. Formato Obligatorio del Write-Up de Entrega (Paso 9)

```markdown
## Historia de Jira

KAN-XX · UEB-Proyect-XX · _título de la historia_

## Qué cambia

- Descripción concisa de cambios backend/D1.
- Descripción concisa de cambios frontend/UI.
- Nuevos tests o contratos añadidos.

## Cómo probarlo

1. Paso a paso para reproducir y verificar en local.
2. Credenciales o rol requerido (ej. capitán, admin, jugador).
3. Resultado esperado visible en pantalla.

## Checklist (Definition of Done)

- [ ] La rama y el título del PR incluyen la clave de Jira (ej. `KAN-50`).
- [ ] Batería CI/CD completa en verde (lint, typecheck, tests y build).
- [ ] La cobertura de líneas no baja del 80 %.
- [ ] Se cumplen todos los escenarios de aceptación de la historia.
- [ ] Si cambia la base de datos, hay una migración nueva en `migrations/` (nunca se edita una ya aplicada).
- [ ] Si cambió la forma de ejecutar o desplegar, se actualizó el README.
```
