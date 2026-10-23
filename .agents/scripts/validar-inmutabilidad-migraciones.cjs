#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
/**
 * Hook PreToolUse: Inmutabilidad de Migraciones D1.
 * Intercepta write_to_file, replace_file_content y multi_replace_file_content.
 * Bloquea cualquier intento de modificar migraciones ya aplicadas.
 * Falla cerrado (fail-close) ante cualquier error de lectura o parseo.
 */
const path = require('path');
const { esMigracionProtegida, DESCRIPCION_MIGRACIONES_PROTEGIDAS, ULTIMA_MIGRACION_APLICADA } = require('./config-migraciones.cjs');

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

      if (!toolCall || !toolCall.args) {
        process.stdout.write(JSON.stringify({ decision: 'allow' }));
        return;
      }

      const targetFile = toolCall.args.TargetFile || '';

      if (esMigracionProtegida(targetFile)) {
        const nombreArchivo = path.basename(targetFile);
        const siguiente = String(ULTIMA_MIGRACION_APLICADA + 1).padStart(4, '0');
        process.stdout.write(
          JSON.stringify({
            decision: 'deny',
            reason:
              `RESTRICCIÓN CRÍTICA DE MIGRACIONES: El archivo "${nombreArchivo}" pertenece al conjunto de migraciones aplicadas ` +
              `(${DESCRIPCION_MIGRACIONES_PROTEGIDAS}) en Cloudflare D1 y es estrictamente INMUTABLE. ` +
              `Cualquier cambio debe implementarse en una nueva migración incremental (ej. migrations/${siguiente}_descripcion.sql).`,
          })
        );
        return;
      }

      process.stdout.write(JSON.stringify({ decision: 'allow' }));
    } catch (_err) {
      // Falla cerrada: si ocurre un error de parseo o ejecución, denegar para proteger las migraciones
      process.stdout.write(
        JSON.stringify({
          decision: 'deny',
          reason: 'Error interno en validador de inmutabilidad de migraciones (fallo cerrado de seguridad).',
        })
      );
    }
  });
}

main();
