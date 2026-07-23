// Playwright config · suite E2E mínima 1503
//
// COMPROMISO INGENIERO ADR 0007: tests E2E antes de producción.
// Esta suite es la PRIMERA versión · cubre smoke tests del flujo crítico.
// Iteraciones posteriores ampliarán cobertura (KYC E2E · checkout · etc.).
//
// EJECUTAR LOCAL
// --------------
//   npx playwright install --with-deps  (primera vez · instala browsers)
//   npx playwright test                 (ejecuta todos los tests)
//   npx playwright test --ui            (UI debugger)
//   npx playwright test --headed        (visual)
//
// EJECUTAR CI
// -----------
//   GitHub Actions · .github/workflows/e2e.yml (creado en esta misma fase)
//
// PATRÓN CANÓNICO Next.js modificado
// ----------------------------------
// Playwright arranca dev server vía webServer config.
// Aprovecha la detección automática de puerto + healthcheck.

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // v1 solo Chromium · ampliar a Firefox + WebKit en iteración futura.
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
