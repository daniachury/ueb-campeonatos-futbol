#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
/**
 * Hook PreToolUse: Verificación de Diseño v3 Neón Minimal y Buenas Prácticas React.
 * Intercepta write_to_file, replace_file_content y multi_replace_file_content en archivos .tsx y .css.
 * Bloquea activamente (decision: 'deny') infracciones claras del sistema de diseño:
 *  1. Uso de --color-acento como color de texto (falso positivo de background-color corregido).
 *  2. Estilos inline con colores hexadecimales fijos en lugar de tokens CSS Modules.
 * (Nota: la detección de setState en useEffect se delega a ESLint en CI/CD).
 */

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
      const normalized = targetFile.replace(/\\/g, '/');

      // Solo analizar código frontend en src/client/
      if (normalized.includes('/src/client/') && (normalized.endsWith('.tsx') || normalized.endsWith('.css'))) {
        let nuevoContenido = '';
        if (toolCall.args.CodeContent) {
          nuevoContenido = toolCall.args.CodeContent;
        } else if (toolCall.args.ReplacementContent) {
          nuevoContenido = toolCall.args.ReplacementContent;
        } else if (toolCall.args.ReplacementChunks && Array.isArray(toolCall.args.ReplacementChunks)) {
          nuevoContenido = toolCall.args.ReplacementChunks.map((c) => c.ReplacementContent || '').join('\n');
        }

        // 1. Detección precisa de --color-acento como texto (evitando falsos positivos en background-color)
        const regexAcentoComoTexto = /(?<![-\w])color\s*:\s*['"`]?var\(--color-acento\)['"`]?/i;
        if (regexAcentoComoTexto.test(nuevoContenido)) {
          process.stdout.write(
            JSON.stringify({
              decision: 'deny',
              reason:
                'REGLA DE DISEÑO v3 NEÓN: El token --color-acento (#b7f000) no cumple contraste WCAG sobre fondos claros y está prohibido como color de texto. Utilice --color-acento-texto (#3f5200).',
            })
          );
          return;
        }

        // 2. Colores hexadecimales fijos en style={{...}} dentro de componentes .tsx
        if (normalized.endsWith('.tsx')) {
          const regexInlineHex = /style=\{\{[^}]*(?:color|background|borderColor)\s*:\s*['"`]#[0-9a-fA-F]{3,8}['"`]/;
          if (regexInlineHex.test(nuevoContenido)) {
            process.stdout.write(
              JSON.stringify({
                decision: 'deny',
                reason:
                  'REGLA DE DISEÑO v3 NEÓN: Prohibido declarar colores hexadecimales en bruto en style={{...}}. Utilice CSS Modules y tokens globales de tema.css (var(--...)).',
              })
            );
            return;
          }
        }
      }

      process.stdout.write(JSON.stringify({ decision: 'allow' }));
    } catch (_err) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }));
    }
  });
}

main();
