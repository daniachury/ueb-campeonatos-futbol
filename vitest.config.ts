import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Las pruebas del backend corren en Node (entorno por defecto).
// Las del frontend declaran `// @vitest-environment jsdom` en la primera línea del archivo.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/client/test/setup.ts'],
    // Cada prueba arranca con fetch y los mocks originales.
    unstubGlobals: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/test/**',
        'src/client/main.tsx',
        'src/server/index.ts',
      ],
      // json-summary y json los usa el comentario de cobertura del PR y el aviso del webhook.
      reporter: ['text', 'json-summary', 'json', 'html'],
      reportOnFailure: true,
      // Definition of Done: la cobertura de líneas no baja del 80 %.
      thresholds: {
        lines: 80,
      },
    },
  },
});
