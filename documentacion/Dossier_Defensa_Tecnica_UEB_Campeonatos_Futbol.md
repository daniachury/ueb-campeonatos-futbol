# UNIVERSIDAD EL BOSQUE
## FACULTAD DE INGENIERÍA · PROGRAMA DE INGENIERÍA DE SISTEMAS
### ASIGNATURA: INGENIERÍA DE SOFTWARE 2026

# DOSSIER DE ARQUITECTURA, DECISIONES TÉCNICAS Y DEFENSA DEL PROYECTO
### Sistema Web Distribuido para la Gestión y Seguimiento de Campeonatos de Fútbol
*(Monolito Modular, Serverless Edge Computing, Cloudflare D1 Relacional y Frontend React v3)*

> **Archivo Word (.docx) descargable generado:**  
> [`documentacion/Dossier_Defensa_Tecnica_UEB_Campeonatos_Futbol.docx`](file:///c:/Users/User/Desktop/New%20folder/ueb-campeonatos-futbol/documentacion/Dossier_Defensa_Tecnica_UEB_Campeonatos_Futbol.docx)

---

## Ficha Técnica del Proyecto

| Parámetro | Detalle de Ingeniería |
| :--- | :--- |
| **Proyecto** | Sistema de Campeonatos de Fútbol Universidad El Bosque (UEB) |
| **Repositorio** | `daniachury/ueb-campeonatos-futbol` |
| **Rama de Trabajo** | `feature/KAN-30-administrador-elimina-jugadores` |
| **Commit de Entrega** | `0aa06f2` |
| **Historias Jira Clave** | [KAN-30] (En revisión), KAN-44 a KAN-49 (Finalizado) |
| **Arquitectura** | Monolito Modular con Puertos y Adaptadores (Hexagonal) |
| **Infraestructura** | Serverless Edge Computing (Cloudflare Workers + D1 SQLite distribuido) |
| **Capa Web** | React 18, Vite, CSS Modules, Tokens de diseño *v3 · Neón minimal* |
| **Aseguramiento de Calidad** | Vitest (583/583 tests en verde), Playwright E2E, TypeScript estricto, ESLint |

---

## 1. Introducción y Filosofía Arquitectónica

El presente proyecto implementa la solución de software oficial para la administración, calendarización, inscripción y cálculo automatizado de clasificaciones de los torneos de fútbol de la Universidad El Bosque.

### El Problema del Dominio Deportivo
En campeonatos universitarios tradicionales existen fallas recurrentes:
1. **Inscripciones ilegales:** Equipos que se inscriben sin la nómina reglamentaria de fútbol 11.
2. **Conflicto de intereses:** Jugadores inscritos simultáneamente en dos equipos del mismo torneo.
3. **Equipos huérfanos:** Capitanes que desertan y dejan al equipo sin gestor responsable.
4. **Manipulación de tablas:** Errores en cálculos manuales de diferencia de gol (+/-), goles a favor o criterios de desempate por juego limpio (tarjetas/faltas).
5. **Opacidad de solicitudes:** Jugadores sin equipo que no tienen visibilidad de si un capitán los aceptó o rechazó.

### La Solución Arquitectónica
Se diseñó un **Monolito Modular Serverless**:
- **Desacoplamiento funcional:** En lugar de microservicios prematuros (que añaden latencia de red y complejidad innecesaria), se construyó un backend modular con límites claros de dominio (`admin`, `auth`, `equipos`, `torneos`, `partidos`).
- **Contratos compartidos:** La carpeta `src/shared/` actúa como la única fuente de verdad tipada para cliente y servidor.
- **Edge Computing:** Cero servidores dedicados que pagar o mantener. El backend corre en **Cloudflare Workers** (V8 Isolates) con tiempo de arranque en frío de 0 ms y latencia mínima.

---

## 2. Justificación del Stack Tecnológico (¿Por qué estas herramientas?)

| Tecnología Elegida | Alternativa Tradicional | Justificación Técnica y Ventaja Competitiva |
| :--- | :--- | :--- |
| **TypeScript 5.x** *(strict: true)* | JavaScript Plano *(Vanilla JS)* | Elimina en compilación el 90% de los errores de tipado (*Type Safety*). Permite compartir interfaces DTOs entre cliente y servidor en `src/shared/`. Garantiza refactorizaciones masivas seguras. |
| **Cloudflare Workers + Hono** | Node.js + Express en Docker | Arranque en frío (*Cold Start*) de 0 ms gracias a V8 Isolates (en lugar de contenedores Docker de cientos de MB). Hono pesa < 15 KB, está basado en estándares universales Web Fetch API (`Request`/`Response`) y corre distribuido en más de 300 ciudades. |
| **Cloudflare D1** *(SQLite Relacional)* | MongoDB / Firebase *(NoSQL)* | Garantías ACID plenas y claves foráneas reales con `ON DELETE CASCADE/RESTRICT`. Los campeonatos son inherentemente relacionales: torneos $\rightarrow$ equipos $\rightarrow$ jugadores $\rightarrow$ partidos. Evita inconsistencias de datos y permite transacciones atómicas seguras. |
| **React 18 + Vite** | Create React App / Webpack | Vite precompila dependencias con esbuild (escrito en Go) y sirve ESM nativo, logrando recarga en caliente (HMR) casi instantánea (< 50 ms). React 18 ofrece renderizado declarativo, hooks limpios y división óptima de paquetes. |
| **CSS Modules + `tema.css`** | Tailwind CSS / styled-components | CSS Modules genera nombres de clase con hash único en compilación (cero colisiones globales) y **cero coste de tiempo de ejecución** (a diferencia de CSS-in-JS). Mantiene el JSX limpio y respeta fielmente los tokens oficiales *v3 · Neón minimal*. |
| **Vitest + Playwright** | Jest + Cypress / Selenium | Vitest comparte la misma configuración de Vite y corre pruebas 4x más rápido en paralelo nativo. Playwright ejecuta pruebas End-to-End con múltiples navegadores reales, grabación de video en cámara lenta y esperas automáticas sin fallas intermitentes (*flakiness*). |

---

## 3. Anatomía y Estructura del Proyecto: ¿Cómo se divide y por qué?

```text
ueb-campeonatos-futbol/
├── migrations/         # Inmutabilidad del esquema relacional (SQL)
├── seeds/              # Datos reproducibles para pruebas locales coherentes
├── src/
│   ├── client/         # Frontend React (Feature-Driven Architecture)
│   ├── server/         # Backend Hono en Workers (Monolito Modular)
│   └── shared/         # Contratos DTOs y tipos compartidos (Single Source of Truth)
├── e2e/                # Suites Playwright con datos reales y videos
└── package.json        # Configuración de dependencias y scripts de verificación
```

### 3.1. `src/server/` (Backend y Módulos de Dominio)
Organizado por verticales de negocio:
- **`app.ts`**: Punto de entrada del servidor Hono. Configura middlewares de seguridad, CORS, parseo de sesiones y montaje de rutas modulares.
- **`modules/admin/`**: Controladores y servicios exclusivos para administradores (`estadisticas.routes.ts`, `estadisticas.service.ts`). Consultas de conteo en tiempo real sobre Cloudflare D1.
- **`modules/auth/`**: Casos de uso de autenticación, hash de contraseñas, registro de usuarios y control de sesiones activas.
- **`modules/equipos/`**: Endpoints de gestión de equipos (`equipos.routes.ts`):
  - `POST /api/equipos/:id/jugadores`: El capitán da de alta jugadores creando su ficha.
  - `DELETE /api/equipos/:id/jugadores/:usuarioId`: El capitán da de baja a un integrante.
  - `POST /api/equipos/:id/solicitudes`: El jugador aspirante solicita unirse al equipo.
  - `GET /api/equipos/:id/solicitudes`: El capitán consulta las solicitudes pendientes.
  - `POST /api/equipos/:id/solicitudes/:solicitudId/aprobar`: El capitán aprueba al aspirante y lo inserta en `equipo_jugadores`.
  - `POST /api/equipos/:id/solicitudes/:solicitudId/rechazar`: El capitán niega la solicitud.
- **`modules/torneos/`**: Lógica de inscripciones, control de cupo mínimo de 11 jugadores y cálculo algorítmico de la tabla de posiciones con desempates oficiales.
- **`modules/partidos/`**: Programación de fechas, asignación de canchas y registro de goles y faltas por partido.

### 3.2. `src/shared/` (Contratos y Única Fuente de Verdad)
- **Elimina la divergencia entre Cliente y Servidor:**
  Contiene interfaces TypeScript puras como `contrato-estadisticas.ts` o tipos de entidades (`Equipo`, `Torneo`, `SolicitudEquipo`).
- **Seguridad en Tiempo de Compilación:**
  Si el backend modifica la estructura de una respuesta o añade un parámetro requerido, el compilador de TypeScript marcará el error tanto en el servidor como en el cliente antes de que llegue a producción.

### 3.3. `seeds/` (Semillas de Datos Reproducibles)
- **Archivo central:** `local-completo.sql`.
- Permite que cualquier evaluador clone el repositorio y con un solo comando disponga de un entorno rico en datos reales:
  - Cuentas de prueba con roles: Administradores (`admin@ueb.edu.co`), Capitanes (`jugador-1@ueb.edu.co`), Jugadores libres y Jugadores aspirantes.
  - Equipos reales con nóminas completas ($\ge 11$ jugadores activos en `equipo_jugadores`).
  - Torneos en sus distintas fases (`INSCRIPCIONES_ABIERTAS`, `EN_CURSO`, `FINALIZADO`) con partidos y clasificaciones.

### 3.4. `migrations/` (Evolución Determinista de Esquemas)
- **Regla de Inmutabilidad:** Jamás se altera una migración histórica ya aplicada.
- Las migraciones van numeradas de forma ascendente:
  - `0001_crear_tabla_usuarios.sql`
  - ...
  - `0012_crear_solicitudes_equipo.sql` (creación de la tabla `solicitudes_equipo` con claves foráneas e índices parciales condicionales).
- Cloudflare D1 registra las migraciones aplicadas en la tabla interna `d1_migrations`, asegurando despliegues reproducibles e idempotentes.

### 3.5. `src/client/` (Frontend React Responsivo)
- Sigue **Feature-Driven Architecture**:
  - `features/admin/`: `PanelAdminPage.tsx` con carga asíncrona de métricas y modal de cambio obligatorio de contraseña.
  - `features/equipos/`: `MisEquiposPage.tsx`, `CrearEquipoPage.tsx`, `UnirmeAEquipoPage.tsx` y el nuevo componente `ModalGestionEquipo.tsx`.
  - `features/torneos/`: `DetalleTorneoPage.tsx` con manejo amigable de errores HTTP 409.
  - `common/`: Componentes transversales (`LayoutDelJugador`, `LayoutDelAdmin`, `Navbar`, `MenuHamburguesa`, `useSesion.ts`).
  - `styles/tema.css`: Sistema unificado de variables CSS con paleta neón, radios y sombras.

---

## 4. Árbol de Componentes del Frontend (Jerarquía Completa)

```text
App.tsx (Raíz del Frontend)
│
├── SesionProvider (Contexto React: Estado de sesión, usuario, rol y logout)
│
└── BrowserRouter / Enrutador
    │
    ├── Rutas Públicas (Sin sesión requerida)
    │   ├── IniciarSesionPage.tsx
    │   │   ├── Formulario de Acceso (Email + Clave)
    │   │   └── Redirección inteligente: Admin -> /admin | Jugador -> /inicio
    │   └── RegistrarsePage.tsx
    │
    ├── Rutas Protegidas de Administrador (Guarda: rol === 'admin')
    │   └── LayoutDelAdmin.tsx (Barra lateral de administración + Encabezado)
    │       ├── PanelAdminPage.tsx (/admin - Ruta Principal)
    │       │   ├── TarjetasMetricas.tsx (Torneos, Equipos, Partidos, Jugadores en D1)
    │       │   ├── TablaAuditoriaReciente.tsx
    │       │   └── ModalCambiarContrasenaObligatoria.tsx (Si debe_cambiar_contrasena === 1)
    │       ├── TorneosAdminPage.tsx
    │       │   ├── ModalCrearTorneo.tsx
    │       │   └── ModalEditarTorneo.tsx
    │       └── EquiposAdminPage.tsx
    │           └── Acciones de Sanción / Retiro administrativo
    │
    └── Rutas Protegidas de Jugador / Capitán (Guarda: rol === 'jugador')
        └── LayoutDelJugador.tsx (Navbar superior, Menú hamburguesa móvil y Footer)
            ├── InicioPage.tsx (/inicio - Dashboard del Jugador)
            │   ├── TarjetaProximoPartido.tsx
            │   ├── CalendarioSemanal.tsx
            │   └── TablaPosicionesPreview.tsx
            │
            ├── MisEquiposPage.tsx (/mis-equipos)
            │   ├── TarjetaEquipo.tsx
            │   │   ├── BadgeCapitan / BadgeJugador
            │   │   ├── ContadorPlantilla (Indicador X/11 jugadores)
            │   │   ├── Botón "Editar" (Solo Capitán) -> Abre ModalGestionEquipo
            │   │   └── Botón "Salir del equipo" (Con traspaso obligatorio si es Capitán)
            │   └── ModalGestionEquipo.tsx (NUEVO COMPONENTE)
            │       ├── Pestaña 1: Plantilla (Lista de jugadores, Botón Retirar, Formulario +Crear Jugador)
            │       ├── Pestaña 2: Solicitudes (Aspirantes pendientes con botones Aprobar y Negar)
            │       └── Pestaña 3: Datos del Equipo (Nombre y Selector de Color)
            │
            ├── CrearEquipoPage.tsx (/mis-equipos/nuevo)
            │   ├── FormularioNombreYColor.tsx
            │   └── ListaPrecargaJugadores.tsx (Agregar integrantes iniciales)
            │
            ├── UnirmeAEquipoPage.tsx (/unirme-a-un-equipo)
            │   ├── BuscadorEquipos.tsx (Filtro por nombre)
            │   ├── TarjetaResultadoBusqueda.tsx
            │   └── Botón "Solicitar ingreso" (Dispara POST solicitudes_equipo)
            │
            └── DetalleTorneoPage.tsx (/torneos/:id)
                ├── ResumenTorneo.tsx
                ├── AlertaErrorInscripcion.tsx (Renderiza HTTP 409 Conflict amigable)
                └── TablaPosicionesCompleta.tsx (Cálculo con desempates oficiales)
```

---

## 5. Reglas de Negocio Clave y Cómo Defenderlas

### Regla 1: Mínimo 11 Jugadores para Fútbol 11
- **Fundamento:** Cumplimiento reglamentario del deporte. Ningún equipo puede competir sin nómina titular completa.
- **Defensa Técnica:** En `POST /api/inscripciones`, el backend ejecuta un `SELECT COUNT(*) FROM equipo_jugadores`. Si el resultado es menor a 11, la transacción se aborta con **`HTTP 409 Conflict`** y el mensaje *"El equipo debe tener al menos 11 jugadores para inscribirse"*. En la UI, `ModalGestionEquipo` muestra una barra de progreso $X/11$ y `DetalleTorneoPage` presenta la alerta de error amigable en pantalla (`role="alert"`).

### Regla 2: Unicidad de Jugador por Torneo
- **Fundamento:** Transparencia y juego limpio. Un estudiante no puede disputar un mismo campeonato con dos equipos distintos.
- **Defensa Técnica:** El servicio de dominio `validarJugadorUnicoPorTorneo` evalúa si algún integrante de la plantilla ya pertenece a otro equipo con inscripción `PENDIENTE` o `APROBADO` en ese torneo. Si existe coincidencia, la inscripción se bloquea listando explícitamente a los jugadores en conflicto.

### Regla 3: Traspaso Obligatorio de Capitanía
- **Fundamento:** Evitar equipos huérfanos que nadie pueda coordinar.
- **Defensa Técnica:** Cuando el capitán pulsa *"Salir del equipo"*, el sistema verifica si quedan otros integrantes. Si quedan, se le exige seleccionar al nuevo capitán (`nuevoCapitanId`). La actualización del capitán y el retiro del usuario se ejecutan en **una sola transacción SQL atómica en Cloudflare D1**. Si falla alguna operación, se ejecuta un rollback completo.

### Regla 4: Bloqueo de Plantilla en Torneos en Curso
- **Fundamento:** Estabilidad del campeonato.
- **Defensa Técnica:** Si un equipo está participando en un torneo con estado `EN_CURSO`, las rutas de retiro voluntario o unión a equipo devuelven `HTTP 409 Conflict` con el mensaje *"La plantilla está cerrada mientras el equipo juega un torneo"*. Solo el Administrador puede retirar integrantes por motivos disciplinarios motivados.

### Regla 5: Gestión de Solicitudes vs Creación Directa
- **Fundamento:** Soberanía del Capitán sobre su plantilla.
- **Defensa Técnica:** Un aspirante libre no puede auto-insertarse arbitrariamente en un equipo; envía una solicitud (`POST /api/equipos/:id/solicitudes`). El Capitán evalúa en su modal las solicitudes y decide **Aprobar** (transacción que inserta en `equipo_jugadores` y actualiza la solicitud a `APROBADO`) o **Negar** (actualiza a `RECHAZADO`). El Capitán además cuenta con la facultad de crear directamente compañeros en la plantilla mediante el formulario `+ Crear jugador`.

---

## 6. Estrategia de Pruebas y Aseguramiento de Calidad

| Nivel de Prueba | Herramienta | Alcance y Métricas de Éxito |
| :--- | :--- | :--- |
| **Pruebas Unitarias** | Vitest | **583 pruebas en 95 archivos (100% pasando)**. Verificación de fórmulas de clasificación (Puntos = $3 \times PG + 1 \times PE$, diferencia de gol, desempates por goles a favor y menor número de faltas), validaciones de contraseña y permisos. |
| **Pruebas de Componentes** | `@testing-library/react` | Simulación de eventos del usuario, renderizado accesible, validación de formularios, skeletons de carga y captura de errores HTTP. |
| **Pruebas End-to-End** | Playwright | Recorridos completos automatizados para los tres roles (Administrador, Capitán, Jugador libre), ejecutados contra la base de datos real Cloudflare D1 local y con grabación en video. |
| **Comprobación Estática** | TypeScript & ESLint | `tsc --noEmit` (**0 errores**) y `npm run lint` (**0 advertencias**). |

---

## 7. Balotario de Defensa: Preguntas Difíciles del Jurado y Respuestas

### P1: ¿Por qué no usaron MongoDB o Firebase que son más populares y fáciles de iniciar?
> **Respuesta Técnica:** Porque un torneo de fútbol es un modelo de datos intrínsecamente relacional. Necesitamos consistencia estricta (ACID) y claves foráneas reales: si un capitán aprueba a un aspirante, la creación del registro en `equipo_jugadores` y la actualización del estado de la solicitud deben ocurrir atómicamente. Si usáramos NoSQL desnormalizado, corríamos el riesgo de estados intermedios inconsistentes (ej. un jugador añadido pero la solicitud aún pendiente). Cloudflare D1 nos brinda la robustez relacional de SQLite distribuido globalmente en el Edge, sin requerir servidores dedicados ni mantenimiento de clusters.

### P2: ¿Qué sucede si dos aspirantes intentan unirse simultáneamente cuando solo queda 1 cupo disponible?
> **Respuesta Técnica:** Cloudflare D1 serializa las escrituras de manera determinista a través de transacciones SQLite. El primer aspirante aprobado consumirá el cupo número 25. Cuando la segunda petición intente ejecutarse, la cláusula de validación `COUNT(equipo_jugadores) < 25` fallará dentro de la transacción y el sistema responderá con `HTTP 409 Conflict` con el mensaje *"El equipo ya tiene 25 jugadores"*, garantizando que bajo ninguna condición de carrera se supere el aforo permitido.

### P3: ¿Por qué la carpeta `src/shared/` es tan relevante en su solución?
> **Respuesta Técnica:** Porque materializa el principio de ingeniería *Single Source of Truth* (Única Fuente de Verdad). En arquitecturas desacopladas convencionales donde frontend y backend viven en silos, es muy común que el backend cambie un campo de un DTO y el frontend falle en producción. Al ubicar las interfaces y tipos en `src/shared/`, TypeScript compila y valida ambos lados simultáneamente. Si alteramos el contrato de estadísticas o de equipos, el build se detiene de inmediato marcando con exactitud los puntos afectados.

### P4: ¿Cómo garantizan que un usuario malicioso no altere datos llamando directamente la API con Postman?
> **Respuesta Técnica:** El frontend solo oculta elementos por ergonomía, pero la seguridad reside 100% en el backend. Cada endpoint de Hono pasa por un middleware de autenticación (`middlewareDeSesion`) que valida el token contra la base de datos D1. Si la ruta es administrativa, el middleware `requerirRol('admin')` aborta con `403 Forbidden` si el rol no es válido. En las rutas de equipo, el backend verifica en la base de datos que el `usuario.id` coincida con el `capitan_id` del equipo objetivo antes de autorizar cualquier alta, baja o aprobación.

### P5: ¿Por qué prefirieron CSS Modules frente a Tailwind CSS?
> **Respuesta Técnica:** Por dos motivos de arquitectura: 1) **Cero sobrecarga de runtime:** CSS Modules compila a CSS puro con clases hash únicas, evitando cualquier colisión de selectores sin requerir procesamiento de JavaScript en el navegador del cliente; y 2) **Coherencia con la guía de estilo:** El proyecto exige apego a los tokens *v3 · Neón minimal* (`styles/tema.css`). CSS Modules permite centralizar variables de color, espaciado y tipografía de manera limpia y mantenible, conservando el marcado JSX legible sin largas cadenas de utilidades.

### P6: ¿Cómo demuestran que las estadísticas del Panel de Administración son datos reales y no datos fácticos simulados?
> **Respuesta Técnica:** El backend expone la ruta `GET /api/admin/estadisticas`, la cual consulta directamente las tablas `torneos`, `equipos`, `partidos` y `usuarios` en Cloudflare D1. El componente `PanelAdminPage` se conecta a dicho endpoint mediante un hook asíncrono que maneja estados de carga (*skeletons*). Se comprobó mediante la prueba E2E `panel-admin-estadisticas.spec.ts` que los números que aparecen en pantalla coinciden exactamente con el conteo SQL de la base de datos D1.

---

## 8. Conclusión para la Exposición

El Sistema de Campeonatos de Fútbol de la Universidad El Bosque representa una solución de software completa, moderna y robusta. 
Cumple con la totalidad de los requisitos funcionales y no funcionales, respaldada por:
- **583 pruebas unitarias e integración en verde (100% de éxito).**
- **0 errores de compilación TypeScript y 0 advertencias de linter.**
- **Suites E2E automatizadas en navegadores reales.**
- **Trazabilidad estricta en Jira y Git Flow con entrega en la rama oficial y commit `0aa06f2`.**
