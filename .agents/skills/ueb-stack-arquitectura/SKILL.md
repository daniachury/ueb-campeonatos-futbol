---
name: ueb-stack-arquitectura
description: >-
  Referencia técnica, estructura de capas y mejores prácticas del stack tecnológico:
  Cloudflare Workers, Hono v4, Cloudflare D1 (SQLite), Vite, React 18 SPA, Zod y contratos
  compartidos en src/shared/.
---

# Stack Tecnológico y Arquitectura del Proyecto

Este documento detalla la estructura modular, las capas técnicas y los estándares de ingeniería aplicados en **UEB Campeonatos de Fútbol**.

---

## 1. Mapa de Arquitectura

El proyecto está diseñado como un monorepo modular con separación clara entre backend serverless, frontend SPA y contratos compartidos:

```
ueb-campeonatos-futbol/
├── migrations/         # Migraciones SQL secuenciales para Cloudflare D1 (0001_ a N_)
├── seeds/              # Datos de prueba para desarrollo local
├── src/
│   ├── shared/         # Tipos TypeScript y esquemas Zod compartidos (isomórficos)
│   ├── server/         # Backend: Hono v4 sobre Cloudflare Workers runtime
│   │   ├── features/   # Módulos de dominio (auth, torneos, equipos, etc.)
│   │   ├── middleware/ # Auth, sesión, auditoría, manejo de errores
│   │   └── index.ts    # Punto de entrada de la API Hono
│   └── client/         # Frontend: Vite + React 18 SPA
│       ├── features/   # Módulos por dominio de usuario
│       ├── components/ # Componentes UI reutilizables
│       ├── context/    # Proveedores de estado (SesionContext, etc.)
│       └── styles/     # tema.css (tokens v3 Neón Minimal) y global.css
```

---

## 2. Tecnologías y Racional Técnico

| Capa | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Runtime Backend** | Cloudflare Workers | Ejecución serverless en el Edge sin cold starts, alta velocidad y baja latencia. |
| **Framework API** | Hono v4 | Microframework ligero para Edge/Workers; routing de alto rendimiento y middleware componible. |
| **Base de Datos** | Cloudflare D1 (SQLite) | Base de datos relacional serverless, compatible con SQL estándar, transacciones ACID y bajo costo. |
| **Frontend SPA** | Vite + React 18 | Empaquetado instantáneo con HMR, renderizado concurrente y control total de componentes UI. |
| **Validación & Tipado** | TypeScript + Zod | Seguridad de tipos de extremo a extremo y validación estricta de esquemas en tiempo de ejecución. |
| **Estilos** | CSS Modules + Vanilla CSS | Aislamiento de selectores sin dependencias pesadas, respetando los tokens de `tema.css`. |
| **Testing** | Vitest + Testing Library + MSW | Suite de pruebas ultra-rápida con mocks de red estandarizados y cobertura >80%. |

---

## 3. Patrones y Buenas Prácticas por Capa

### A. Capa Compartida (`src/shared/`)
- Todo DTO de petición o respuesta que cruce la red debe definirse como un esquema Zod en `src/shared/types.ts`.
- Se infieren los tipos TypeScript a partir de Zod (`z.infer<typeof Esquema>`).
- Prohibido duplicar interfaces entre cliente y servidor.

### B. Capa Backend (`src/server/`)
- **Consultas a D1**: Usar siempre sentencias preparadas para prevenir inyección SQL:
  ```typescript
  const stmt = db.prepare('SELECT * FROM equipos WHERE id = ?').bind(id);
  const resultado = await stmt.first();
  ```
- **Manejo de Errores**: Retornar respuestas JSON con código HTTP apropiado (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict).
- **Inmutabilidad**: Toda lectura y escritura respeta las restricciones de integridad relacional definidas en las migraciones de D1.

### C. Capa Frontend (`src/client/`)
- **Organización por Features**: Cada pantalla o funcionalidad pertenece a `src/client/features/<modulo>/`.
- **CSS Modules**: Los estilos específicos se colocan en `[NombreComponente].module.css` y consumen los tokens globales de `tema.css`.
- **Hooks y Sesión**:
  - `useSesion()` provee el estado del usuario autenticado.
  - Al suscribirse o reaccionar a cambios de sesión en `useEffect`, depender de valores primitivos (`usuarioActual?.id`) para no disparar re-renders innecesarios por regeneración de objetos de prueba.
- **Prevención de Renders en Cascada**:
  - Prohibido hacer `setState` síncrono al montar un `useEffect` si ese estado puede derivarse en el render o en el estado inicial de `useState`.

---

## 4. Comandos de Verificación del Stack

```bash
# Servidor de desarrollo (Vite + Hono mock/proxy)
npm run dev

# Verificación de tipos TypeScript en todo el proyecto
npm run typecheck

# Linter ESLint
npm run lint

# Ejecución de pruebas unitarias e integración
npm run test:run

# Cobertura de pruebas (debe ser >= 80%)
npm run test:coverage

# Pruebas End-to-End
npm run test:e2e
```
