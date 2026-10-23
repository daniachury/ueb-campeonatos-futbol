---
name: ueb-restricciones-negocio
description: >-
  Reglas de negocio, restricciones de integridad y directrices de dominio para el sistema
  de campeonatos de fútbol UEB: torneos fútbol 11, unicidad de jugador por torneo, gestión
  de capitanía y plantillas, estados y auditoría.
---

# Restricciones Globales y Reglas de Negocio UEB

Este documento define la lógica de negocio y las restricciones de integridad que deben cumplirse en todos los endpoints de backend y validaciones de interfaz de usuario.

---

## 1. Torneos y Modalidad Fútbol 11

- **Modalidad Oficial**: El sistema gestiona campeonatos de fútbol 11.
- **Mínimo de Jugadores por Equipo**:
  - Para que una plantilla sea válida para competir o para que una inscripción a un torneo sea formalmente aprobada, el equipo debe contar con un **mínimo de 11 jugadores** inscritos y confirmados.
  - El sistema debe alertar al capitán si el equipo tiene menos de 11 integrantes antes del cierre de inscripciones.
- **Ciclo de Estados del Torneo**:
  - `borrador`: Torneo en configuración inicial. No visible al público general ni abierto a inscripciones.
  - `publicado`: Torneo visible. Periodo de inscripciones abierto para capitanes de equipos.
  - `en_curso`: Fixture generado y partidos en disputa. Las inscripciones de nuevos equipos quedan automáticamente cerradas.
  - `finalizado`: Todos los partidos completados, tabla de posiciones congelada y campeón coronado.
  - `cancelado`: Torneo suspendido.

---

## 2. Unicidad de Jugadores e Inscripciones

- **Regla de Unicidad por Torneo**:
  - Un jugador **solo puede estar inscrito en un (1) solo equipo** por cada torneo activo.
  - Si un usuario ya pertenece a la plantilla de un equipo inscrito en el Torneo A, el backend debe rechazar con código HTTP `409 Conflict` cualquier intento de inscribirlo en otro equipo para ese mismo Torneo A.
- **Flujo de Solicitudes de Ingreso**:
  1. **Solicitud iniciada por el jugador**:
     - El jugador solicita unirse a un equipo. Estado inicial: `pendiente`.
     - Solo el **Capitán** del equipo (o un `admin`) tiene la potestad de **aprobar** o **rechazar** la solicitud.
  2. **Invitación iniciada por el capitán**:
     - El capitán invita a un usuario registrado. Estado inicial: `invitado`.
     - El jugador puede aceptar o declinar desde su panel o perfil.

---

## 3. Capitanía y Gestión de Plantilla

- **Unicidad de Capitán**: Cada equipo tiene exactamente un (1) capitán activo.
- **Permisos Exclusivos del Capitán**:
  - Crear y editar el perfil del equipo (nombre, color, escudo, lema).
  - Gestionar la plantilla: invitar jugadores, aprobar/rechazar solicitudes de ingreso y desvincular integrantes.
  - Inscribir al equipo en torneos disponibles.
- **Cesión de Capitanía**:
  - Si el capitán decide abandonar el equipo, está obligado a **ceder la capitanía** a otro miembro de la plantilla antes de salir.
  - Si el capitán es el único integrante y decide salir, el equipo pasa a estado disuelto o eliminado.

---

## 4. Inmutabilidad de Migraciones y Datos Históricos

- **Inmutabilidad D1**:
  - Las migraciones `0001_` a `0012_` ya aplicadas son **estrictamente inmutables**.
  - No se permite editar archivos SQL históricos. Nuevos cambios de esquema requieren crear `migrations/0013_...sql` en adelante.
- **Inmutabilidad de Partidos Finalizados**:
  - Una vez que un partido pasa al estado `finalizado` y el acta arbitral es firmada, los resultados, goles y amonestaciones no pueden ser modificados por capitanes ni árbitros.
  - Cualquier rectificación extraordinaria requiere privilegios de `admin` y genera un registro en la tabla de auditoría (`tabla_auditoria_admins`).

---

## 5. Matriz de Roles y Permisos

| Rol | Alcance y Facultades |
| :--- | :--- |
| **`admin`** | Acceso global total. Puede aprobar torneos, crear sedes/canchas, resolver conflictos de plantillas y gestionar auditoría. |
| **`organizador`** | Planifica fixture, gestiona sedes y asigna árbitros a torneos específicos. |
| **`capitan`** | Administra su propio equipo, gestiona fichajes, aprueba solicitudes y formaliza inscripciones a torneos. |
| **`jugador`** | Consulta torneos, solicita ingreso a equipos, revisa sus estadísticas individuales y partidos jugados. |
| **`arbitro`** | Registra marcadores, incidencias, tarjetas y actas de los partidos asignados. |
| **`espectador`** | Consulta pública de tablas de clasificación, calendario de encuentros y resultados. |
