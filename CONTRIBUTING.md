# Guía para Contribuir en Campeonatos UEB

¡Bienvenido al proyecto **Campeonatos UEB**!

Para mantener la calidad, consistencia y estabilidad del proyecto, todos los desarrolladores seguimos un esquema unificado de trabajo.

Toda la documentación técnica completa, reglas de arquitectura, convenciones de Git + Jira y comandos de desarrollo se encuentran detallados en:

👉 **[Guía Completa de Desarrollo (DEVELOPMENT.md)](./DEVELOPMENT.md)**

---

## 🚀 Resumen Rápido para Empezar

1. **Configura tu entorno local:**
   - Requiere Node.js 22 (`.nvmrc`) y `npm`.
   - Copia `.dev.vars.example` a `.dev.vars`.
   - Ejecuta:
     ```bash
     npm install
     npm run db:migrate:local
     npm run db:seed:local
     npm run dev
     ```

2. **Flujo de Ramas y Jira:**
   - Toda tarea se toma del tablero [Jira KAN](https://unbosque-team-ing-soft-2026.atlassian.net/jira/software/projects/KAN/boards/1).
   - Crea tu rama siempre a partir de `main`:
     ```text
     feature/KAN-##-nombre-breve
     fix/KAN-##-nombre-breve
     ```

3. **Commits y Pull Requests:**
   - Formato Conventional Commits con la clave de Jira:
     ```text
     feat(equipos): KAN-27 valida el cupo maximo de 25 jugadores
     ```
   - Abre el PR con el título: `KAN-##: Titulo de la historia`.
   - Completa el checklist de la plantilla del PR (`.github/pull_request_template.md`).

4. **Calidad antes de hacer Push (Definition of Done):**

   ```bash
   npm run format:check
   npm run lint
   npm run typecheck
   npm run test:coverage
   ```
   - La cobertura de líneas debe mantenerse en $\ge$ **80%**.

5. **Base de Datos (Cloudflare D1):**
   - **Las migraciones son inmutables:** nunca edites una migración existente en `migrations/`.
   - Genera una nueva migración con:
     ```bash
     npx wrangler d1 migrations create DB nombre_de_la_migracion
     ```

Para dudas detalladas o solución de problemas, consulta el documento principal: **[DEVELOPMENT.md](./DEVELOPMENT.md)**.
