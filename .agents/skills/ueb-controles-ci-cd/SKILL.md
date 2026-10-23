---
name: ueb-controles-ci-cd
description: >-
  Estándares y ejecución obligatoria de la batería de controles de integración y despliegue
  continuo (CI/CD): linting, verificación de tipos TypeScript, pruebas con cobertura mínima
  del 80% y validación de compilación Cloudflare Workers/Vite.
---

# Controles de Integración y Despliegue Continuo (CI/CD)

Este manual define los controles de calidad automatizados e inquebrantables que todo cambio de código debe superar localmente antes de poder someterse al Paso 9 (commit, pull request y despliegue).

---

## 1. Relación con los Pipelines de GitHub Actions

El repositorio cuenta con dos flujos de trabajo de CI/CD en `.github/workflows/`:
1. **`ci.yml`**: Se dispara en cada Pull Request hacia `main`. Es un *status check* obligatorio para autorizar el merge.
2. **`deploy.yml`**: Se dispara en cada push o merge a `main`. Ejecuta pruebas con cobertura, aplica migraciones en Cloudflare D1 y despliega la aplicación.

Cualquier fallo en local causará el quiebre del pipeline remoto en GitHub Actions. Por tanto, es **mandatorio** ejecutar y verificar la batería completa en el entorno local antes de dar por completado el Paso 7.

---

## 2. La Batería de 4 Controles Locales Obligatorios

Antes de solicitar la aprobación del Paso 9 al usuario, el agente debe ejecutar secuencialmente y certificar en verde los siguientes 4 comandos:

```
[1. Lint] ➔ [2. Typecheck] ➔ [3. Pruebas & Cobertura] ➔ [4. Build]
```

### Control 1: Linter (ESLint)
Verifica las fronteras arquitectónicas (el frontend no importa backend, shared no importa capas superiores) y directrices de código limpio.
```bash
npm run lint
```
- **Criterio de éxito**: 0 errores.
- **Regla**: Prohibido el uso de `eslint-disable` en código de producción (`src/`) salvo casos excepcionales y justificados.

### Control 2: Verificación de Tipos (TypeScript)
Valida la integridad de tipos en los tres entornos del monolito: client (browser/DOM), server (Cloudflare Workers/ServiceWorker) y shared (isomórfico).
```bash
npm run typecheck
```
- **Criterio de éxito**: `tsc --noEmit` finaliza con código 0 y sin errores de tipado.

### Control 3: Pruebas Unitarias, Integración y Cobertura
Ejecuta la suite completa bajo Vitest y calcula el reporte de cobertura de código.
```bash
npm run test:ci
# o alternativamente:
npm run test:coverage
```
- **Criterio de éxito**:
  - 100% de las pruebas en estado `PASSED` (0 fallos).
  - Cobertura de líneas **superior o igual al 80 %** en el resumen global (`coverage/coverage-summary.json`).

### Control 4: Compilación y Empaquetado (Build)
Construye los artefactos de producción de la aplicación web y del Worker serverless.
```bash
npm run build
```
- **Criterio de éxito**: Generación exitosa de `dist/` (assets de Vite y bundle de Cloudflare Workers) sin advertencias críticas ni errores de empaquetado.

---

## 3. Protocolo ante Fallos en CI/CD

Si cualquiera de los 4 controles falla:
1. **Detención inmediata**: Prohibido saltar al Paso 8 o Paso 9.
2. **Diagnóstico**: Analizar el mensaje de error exacto (archivo, línea, regla infringida).
3. **Corrección de regresión**: Resolver la causa raíz sin eliminar pruebas ni alterar umbrales de cobertura.
4. **Re-ejecución**: Repetir la batería completa hasta obtener todos los indicadores en verde.
