import { defineConfig, devices } from '@playwright/test';
import { ENTORNO } from './e2e/configuracion/entorno';

/** `npm run test:e2e:video` graba el recorrido completo en cámara lenta para verlo con calma. */
const pausaEntreAcciones = Number(process.env.E2E_CAMARA_LENTA ?? 0);

/**
 * Pruebas e2e con Playwright contra la app compilada desde la rama actual.
 * `npm run test:e2e` levanta el Worker con una base D1 nueva y recorre la app en Chromium.
 */
export default defineConfig({
  testDir: './e2e/pruebas',
  outputDir: pausaEntreAcciones ? './reports/e2e/video' : './reports/e2e/resultados',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: './reports/e2e/html', open: 'never' }],
    ['json', { outputFile: './reports/e2e/resultados.json' }],
  ],
  use: {
    baseURL: ENTORNO.urlBase,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: { mode: 'on', size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
    launchOptions: { slowMo: pausaEntreAcciones },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run e2e:servidor',
    url: `${ENTORNO.urlBase}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
