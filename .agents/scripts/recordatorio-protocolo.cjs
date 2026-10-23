#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
/**
 * Hook PreInvocation: Recordatorio conciso de reglas críticas UEB.
 */

function main() {
  let _inputBuffer = '';
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', (chunk) => {
    _inputBuffer += chunk;
  });

  process.stdin.on('end', () => {
    try {
      const recordatorio =
        '[UEB PROTOCOLO: REGLAS CRÍTICAS]\n' +
        '• Indicar al usuario cada paso que se va a realizar.\n' +
        '• Aprobación previa por fase (Backend, Frontend, CI/CD, Entrega) antes de crear o editar código.\n' +
        '• Batería CI/CD obligatoria en verde (lint, typecheck, test:ci >=80%, build) antes de solicitar Paso 9.\n' +
        '• Migraciones aplicadas inmutables (0001-0012). Prohibido commit/push/Jira sin confirmación expresa.';

      const output = {
        injectSteps: [
          {
            ephemeralMessage: recordatorio,
          },
        ],
      };

      process.stdout.write(JSON.stringify(output));
    } catch (_err) {
      process.stdout.write(JSON.stringify({}));
    }
  });
}

main();
