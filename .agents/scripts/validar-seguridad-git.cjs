#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
/**
 * Hook PreToolUse: Seguridad de Terminal (Git, Inmutabilidad de Migraciones y Paso 9).
 * Intercepta run_command para:
 *  1. Bloquear terminales que intenten escribir, mover o eliminar migraciones aplicadas (sed, rm, mv, >, >>, tee).
 *  2. Exigir confirmación previa (ask) en comandos Git que modifiquen el historial o el remoto (push, commit, rebase, reset, clean, gh pr).
 */
const { esMigracionProtegida, DESCRIPCION_MIGRACIONES_PROTEGIDAS } = require('./config-migraciones.cjs');

function main() {
  let inputBuffer = '';
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (chunk) => {
    inputBuffer += chunk;
  });

  process.stdin.on('end', () => {
    try {
      if (!inputBuffer.trim()) {
        process.stdout.write(JSON.stringify({ decision: 'allow' }));
        return;
      }

      const payload = JSON.parse(inputBuffer);
      const toolCall = payload.toolCall;

      if (!toolCall || toolCall.name !== 'run_command') {
        process.stdout.write(JSON.stringify({ decision: 'allow' }));
        return;
      }

      const commandLine = (toolCall.args && toolCall.args.CommandLine) || '';
      const cmdTrimmed = commandLine.trim();

      // 1. Evitar elusión de inmutabilidad de migraciones desde el terminal (sed, rm, mv, >, >>, tee, etc.)
      const tocaMigracion = /(?:migrations[/\\]0*(\d+)_[^/\s'"]+\.sql)/i;
      const matchMigracion = cmdTrimmed.match(tocaMigracion);
      if (matchMigracion) {
        const rutaDetectada = matchMigracion[0];
        if (esMigracionProtegida(rutaDetectada)) {
          const esOperacionModificacion = /\b(rm|del|remove-item|sed|mv|move|ren|rename|tee)\b|[><]/i.test(cmdTrimmed);
          if (esOperacionModificacion) {
            process.stdout.write(
              JSON.stringify({
                decision: 'deny',
                reason:
                  `BLOQUEO DE SEGURIDAD EN TERMINAL: El comando intenta modificar o eliminar "${rutaDetectada}", ` +
                  `la cual pertenece a las migraciones aplicadas (${DESCRIPCION_MIGRACIONES_PROTEGIDAS}) y es estrictamente INMUTABLE.`,
              })
            );
            return;
          }
        }
      }

      // 2. Cobertura completa de comandos Git sensibles y GitHub CLI (incluye flags como -C, -c, reset --hard, clean, force, gh pr)
      const esComandoGitSensible =
        /\bgit\b[^|;&]*\b(push|commit|pull|rebase|reset|clean)\b/i.test(cmdTrimmed) ||
        /\bgh\s+pr\b/i.test(cmdTrimmed);

      if (esComandoGitSensible) {
        process.stdout.write(
          JSON.stringify({
            decision: 'ask',
            reason:
              `Control de Proyecto (Paso 9 & CI/CD): El comando "${cmdTrimmed}" modifica o destruye estado del repositorio local o remoto. ` +
              `Verifique que la batería de CI/CD (lint, typecheck, test:ci con >=80% y build) esté en verde y que cuenta con la autorización expresa del usuario antes de proceder.`,
          })
        );
        return;
      }

      process.stdout.write(JSON.stringify({ decision: 'allow' }));
    } catch (_err) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }));
    }
  });
}

main();
