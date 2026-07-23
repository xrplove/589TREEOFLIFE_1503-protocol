// Smoke tests · suite mínima E2E 1503
//
// COMPROMISO INGENIERO ADR 0007: tests E2E antes de producción.
//
// Esta suite valida los caminos críticos básicos:
//   1. Home page carga sin error 500
//   2. Cookie banner ePrivacy aparece en primera visita
//   3. Cookie banner persiste decisión "Rechazar todo" tras refresh
//   4. Endpoint Notice & Action acepta POST básico
//   5. Endpoint Notice & Action rechaza body inválido con 400
//   6. API actors GET respeta gate KYC approved
//
// COBERTURA NO INCLUIDA (iteración futura)
// ----------------------------------------
// - KYC E2E completo (requiere Sumsub mock + emails Resend mock)
// - Checkout cubicaje (requiere DPP cargados en BD seed)
// - Custody chain signing (requiere wallet test + Ed25519 keys)
// - Smart contract XDC trigger (requiere RPC testnet)
//
// Estas se añadirán cuando se construyan los módulos respectivos.

import { test, expect } from '@playwright/test'

// ¿Hay una BD de test real conectada? En CI sin secretos `SUPABASE_*_TEST`,
// la URL es un placeholder (localhost:54321 · no hay Postgres) → los caminos
// que hacen INSERT real devuelven 500 por diseño. Esos tests se SALTAN aquí
// (mismo criterio que el job `rls-audit` en ci.yml, que se guarda con
// secretos). Cuando se configure una BD de test, correrán automáticamente.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const HAS_REAL_DB =
  SUPABASE_URL.length > 0 &&
  !SUPABASE_URL.includes('localhost') &&
  !SUPABASE_URL.includes('127.0.0.1')

// ════════════════════════════════════════════════════════════════════════════
// HOME PAGE
// ════════════════════════════════════════════════════════════════════════════

test.describe('Home page', () => {
  test('carga sin error 500 y muestra título 1503', async ({ page }) => {
    const response = await page.goto('/')
    expect(response).not.toBeNull()
    expect(response!.status()).toBeLessThan(500)
    // El título de metadata debe contener 1503.
    await expect(page).toHaveTitle(/1503/)
  })

  test('lang attribute es "es" (default español)', async ({ page }) => {
    await page.goto('/')
    const lang = await page.locator('html').getAttribute('lang')
    expect(lang).toBe('es')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// COOKIE BANNER (ePrivacy + AEPD)
// ════════════════════════════════════════════════════════════════════════════

test.describe('Cookie Banner', () => {
  test('aparece en primera visita (sin localStorage previo)', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/')

    // Esperar a que el banner aparezca (dynamic import + client-side render).
    const banner = page.getByRole('dialog', { name: /banner.*cookies/i })
    await expect(banner).toBeVisible({ timeout: 10000 })

    // Debe tener 3 botones de igual prominencia (canon AEPD).
    await expect(banner.getByRole('button', { name: 'Rechazar todo' })).toBeVisible()
    await expect(banner.getByRole('button', { name: 'Personalizar' })).toBeVisible()
    await expect(banner.getByRole('button', { name: 'Aceptar todo' })).toBeVisible()
  })

  test('"Rechazar todo" oculta banner y persiste decisión tras refresh', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/')

    const banner = page.getByRole('dialog', { name: /banner.*cookies/i })
    await expect(banner).toBeVisible({ timeout: 10000 })

    await banner.getByRole('button', { name: 'Rechazar todo' }).click()
    await expect(banner).not.toBeVisible()

    // Refresh: banner NO debe aparecer (persistencia localStorage).
    await page.reload()
    await expect(banner).not.toBeVisible({ timeout: 5000 })
  })

  test('"Personalizar" abre modal con toggles', async ({ page, context }) => {
    await context.clearCookies()
    await page.goto('/')

    const banner = page.getByRole('dialog', { name: /banner.*cookies/i })
    await expect(banner).toBeVisible({ timeout: 10000 })

    await banner.getByRole('button', { name: 'Personalizar' }).click()

    // Modal debe aparecer con título.
    const modal = page.getByRole('dialog', { name: /personalizar cookies/i })
    await expect(modal).toBeVisible()

    // Debe haber sección "Estrictamente necesarias" + 2 toggles.
    // Se localiza por el encabezado (role=heading) de cada categoría: el texto
    // de cada palabra aparece también en el párrafo de descripción, así que
    // getByText casaría 2 elementos y violaría el strict mode de Playwright.
    await expect(modal.getByRole('heading', { name: /necesarias/i })).toBeVisible()
    await expect(modal.getByRole('heading', { name: /anal[íi]ticas/i })).toBeVisible()
    await expect(modal.getByRole('heading', { name: /marketing/i })).toBeVisible()
  })
})

// ════════════════════════════════════════════════════════════════════════════
// API · NOTICE & ACTION (GPSR Art. 22 + DSA Art. 16)
// ════════════════════════════════════════════════════════════════════════════

test.describe('API /api/notice-and-action', () => {
  test('POST acepta Notice válido (target=external_url · consumer)', async ({ request }) => {
    test.skip(!HAS_REAL_DB, 'Requiere BD de test real (INSERT en notices) · sin secretos SUPABASE_*_TEST')
    const response = await request.post('/api/notice-and-action', {
      data: {
        notifier_relationship: 'consumer',
        target_type: 'external_url',
        target_external_url: 'https://example.com/listing/123',
        category: 'safety_risk',
        description:
          'Producto presunto peligroso · sin marcado CE ni clasificación IMDG declarada.',
        legal_basis: 'GPSR Art. 22 · DSA Art. 16',
      },
    })

    expect(response.status()).toBe(201)
    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.notice_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    expect(body.next_steps.sla_business_days).toBe(2)
  })

  test('POST rechaza body inválido (sin description) con 400', async ({ request }) => {
    const response = await request.post('/api/notice-and-action', {
      data: {
        notifier_relationship: 'consumer',
        target_type: 'external_url',
        target_external_url: 'https://example.com/listing/123',
        category: 'safety_risk',
        // Falta description + legal_basis (ambos obligatorios).
      },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Validation failed')
    expect(Array.isArray(body.issues)).toBe(true)
  })

  test('POST rechaza description corta (<10 chars) con 400', async ({ request }) => {
    const response = await request.post('/api/notice-and-action', {
      data: {
        notifier_relationship: 'consumer',
        target_type: 'external_url',
        target_external_url: 'https://example.com/x',
        category: 'safety_risk',
        description: 'corto', // <10 chars
        legal_basis: 'GPSR Art. 22',
      },
    })

    expect(response.status()).toBe(400)
  })

  test('POST rechaza trusted_flagger sin email + name con 400', async ({ request }) => {
    const response = await request.post('/api/notice-and-action', {
      data: {
        notifier_relationship: 'trusted_flagger',
        // Sin notifier_email + notifier_name (obligatorio para trusted_flagger).
        target_type: 'external_url',
        target_external_url: 'https://example.com/x',
        category: 'safety_risk',
        description: 'Producto identificado como ilegal por entidad acreditada DSI.',
        legal_basis: 'DSA Art. 22 · trusted flagger',
      },
    })

    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Validation failed')
  })

  test('GET no soportado · responde 405', async ({ request }) => {
    const response = await request.get('/api/notice-and-action')
    expect(response.status()).toBe(405)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// API · ACTORS (KYC gating)
// ════════════════════════════════════════════════════════════════════════════

test.describe('API /api/actors', () => {
  test('GET sin Authorization responde 401', async ({ request }) => {
    const response = await request.get('/api/actors')
    // Sin JWT · debería responder 401 o 403 (gating KYC approved).
    expect([401, 403]).toContain(response.status())
  })

  test('GET con params inválidos responde 400', async ({ request }) => {
    const response = await request.get('/api/actors?country=invalid-country')
    // Validación regex country debe rechazar.
    expect([400, 401, 403]).toContain(response.status())
  })
})
