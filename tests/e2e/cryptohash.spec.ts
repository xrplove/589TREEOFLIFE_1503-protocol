// Tests · Capa 1 G10 cryptohash helpers (Ed25519 + JCS + SHA-256)
//
// Verifica la integración Ed25519 + RFC 8785 JCS + SHA-256.
//
// NOTA DE EJECUCIÓN
// -----------------
// Son tests de lógica pura (no usan navegador). Los módulos se importan de
// forma ESTÁTICA arriba para que el loader de Playwright los transpile (TS →
// JS) dentro del grafo de módulos. NO usar `await import(...)` dinámico de un
// `.ts`: en runtime lo resuelve Node nativo (no Playwright) y revienta con
// «SyntaxError: Unexpected token 'export'».

import { test, expect } from '@playwright/test'

import { canonicalize } from '../../app/lib/jcsCanonical'
import {
  canonicalHash,
  verifyCanonicalHash,
  signCanonical,
  verifyCanonicalSignature,
  chainLinkHash,
  verifyChainIntegrity,
} from '../../app/lib/dppHash'
import {
  generateKeyPair,
  signString,
  verifyString,
  isValidEd25519Key,
} from '../../app/lib/ed25519Crypto'

test.describe('Capa 1 G10 · jcsCanonical (RFC 8785)', () => {
  test('canonicaliza objetos con keys en distinto orden produce mismo string', async () => {
    const obj1 = { b: 2, a: 1, c: 3 }
    const obj2 = { c: 3, a: 1, b: 2 }

    expect(canonicalize(obj1)).toBe(canonicalize(obj2))
    expect(canonicalize(obj1)).toBe('{"a":1,"b":2,"c":3}')
  })

  test('canonicaliza arrays sin reordenar', async () => {
    expect(canonicalize([3, 1, 2])).toBe('[3,1,2]')
  })

  test('canonicaliza nested objects', async () => {
    const obj = { z: { y: 1, x: 2 }, a: [3, 2, 1] }
    expect(canonicalize(obj)).toBe('{"a":[3,2,1],"z":{"x":2,"y":1}}')
  })

  test('escape correcto de characters especiales', async () => {
    expect(canonicalize({ text: 'hello\nworld' })).toBe('{"text":"hello\\nworld"}')
    expect(canonicalize({ text: 'quote"here' })).toBe('{"text":"quote\\"here"}')
  })

  test('null + boolean + numbers', async () => {
    expect(canonicalize(null)).toBe('null')
    expect(canonicalize(true)).toBe('true')
    expect(canonicalize(false)).toBe('false')
    expect(canonicalize(42)).toBe('42')
    expect(canonicalize(3.14)).toBe('3.14')
  })

  test('-0 se serializa como 0 (RFC 8785 §3.2.2.3)', async () => {
    expect(canonicalize(-0)).toBe('0')
  })

  test('NaN e Infinity lanzan error', async () => {
    expect(() => canonicalize(NaN as never)).toThrow()
    expect(() => canonicalize(Infinity as never)).toThrow()
  })
})

test.describe('Capa 1 G10 · dppHash (canonical SHA-256)', () => {
  test('hash determinista · mismo input → mismo output', async () => {
    const obj = { sku: 'TEST-001', price: 100 }

    const result1 = canonicalHash(obj)
    const result2 = canonicalHash(obj)

    expect(result1.hash).toBe(result2.hash)
    expect(result1.hash).toMatch(/^[a-f0-9]{64}$/)
    expect(result1.algorithm).toBe('sha256')
    expect(result1.version).toBe('dpp-hash@1')
  })

  test('hash cambia si payload cambia', async () => {
    const hash1 = canonicalHash({ sku: 'A', price: 100 }).hash
    const hash2 = canonicalHash({ sku: 'A', price: 101 }).hash

    expect(hash1).not.toBe(hash2)
  })

  test('hash igual si keys en distinto orden', async () => {
    const hash1 = canonicalHash({ b: 2, a: 1 }).hash
    const hash2 = canonicalHash({ a: 1, b: 2 }).hash

    expect(hash1).toBe(hash2)
  })

  test('verifyCanonicalHash detecta tampering', async () => {
    const obj = { sku: 'TEST-001', price: 100 }
    const { hash } = canonicalHash(obj)

    expect(verifyCanonicalHash(obj, hash)).toBe(true)
    expect(verifyCanonicalHash({ ...obj, price: 999 }, hash)).toBe(false)
  })
})

test.describe('Capa 1 G10 · Ed25519 sign/verify', () => {
  test('genera par de claves y firma/verifica un mensaje', async () => {
    const { privateKey, publicKey } = await generateKeyPair()

    expect(isValidEd25519Key(privateKey)).toBe(true)
    expect(isValidEd25519Key(publicKey)).toBe(true)

    const message = 'Hello 1503 · G10 custody chain'
    const { signature } = await signString(message, privateKey)

    expect(signature).toMatch(/^[a-f0-9]{128}$/)

    const valid = await verifyString(signature, message, publicKey)
    expect(valid).toBe(true)
  })

  test('verifica detecta tampering en mensaje', async () => {
    const { privateKey, publicKey } = await generateKeyPair()
    const { signature } = await signString('original', privateKey)

    const validOriginal = await verifyString(signature, 'original', publicKey)
    const tampered = await verifyString(signature, 'tampered', publicKey)

    expect(validOriginal).toBe(true)
    expect(tampered).toBe(false)
  })

  test('verifica detecta clave pública incorrecta', async () => {
    const keyA = await generateKeyPair()
    const keyB = await generateKeyPair()
    const { signature } = await signString('message', keyA.privateKey)

    const correctKey = await verifyString(signature, 'message', keyA.publicKey)
    const wrongKey = await verifyString(signature, 'message', keyB.publicKey)

    expect(correctKey).toBe(true)
    expect(wrongKey).toBe(false)
  })

  test('signCanonical + verifyCanonicalSignature workflow completo', async () => {
    const { privateKey, publicKey } = await generateKeyPair()

    const dppLink = {
      actor_user_id: '11111111-1111-1111-1111-111111111111',
      custody_role: 'manufacturer',
      custody_started_at: '2026-05-29T10:00:00Z',
      gps_lat: 39.4448,
      gps_lng: -0.3236,
      previous_link_hash: null,
    }

    const signed = await signCanonical(dppLink, privateKey)

    expect(signed.canonical_hash).toMatch(/^[a-f0-9]{64}$/)
    expect(signed.signature.signature).toMatch(/^[a-f0-9]{128}$/)
    expect(signed.signature.publicKey).toBe(publicKey)

    const verified = await verifyCanonicalSignature(
      dppLink,
      signed.signature.signature,
      signed.signature.publicKey,
    )
    expect(verified).toBe(true)

    // Tamper el GPS · firma debe fallar verificación
    const tamperedLink = { ...dppLink, gps_lat: 40.0 }
    const tamperVerify = await verifyCanonicalSignature(
      tamperedLink,
      signed.signature.signature,
      signed.signature.publicKey,
    )
    expect(tamperVerify).toBe(false)
  })
})

test.describe('Capa 1 G10 · custody chain integrity', () => {
  test('verifica integridad de cadena válida (3 eslabones encadenados)', async () => {
    const link1 = {
      actor_user_id: '11111111-1111-1111-1111-111111111111',
      custody_role: 'manufacturer',
      custody_started_at: '2026-05-29T10:00:00Z',
      signer_public_key: 'a'.repeat(64),
      previous_link_hash: null,
    }

    const link2 = {
      actor_user_id: '22222222-2222-2222-2222-222222222222',
      custody_role: 'freight_forwarder',
      custody_started_at: '2026-05-30T10:00:00Z',
      signer_public_key: 'b'.repeat(64),
      previous_link_hash: chainLinkHash(link1),
    }

    const link3 = {
      actor_user_id: '33333333-3333-3333-3333-333333333333',
      custody_role: 'consignee',
      custody_started_at: '2026-05-31T10:00:00Z',
      signer_public_key: 'c'.repeat(64),
      previous_link_hash: chainLinkHash(link2),
    }

    const { valid, brokenAt } = verifyChainIntegrity([link1, link2, link3])

    expect(valid).toBe(true)
    expect(brokenAt).toBe(-1)
  })

  test('detecta cadena rota (tampering en eslabón intermedio)', async () => {
    const link1 = {
      actor_user_id: '11111111-1111-1111-1111-111111111111',
      custody_role: 'manufacturer',
      custody_started_at: '2026-05-29T10:00:00Z',
      signer_public_key: 'a'.repeat(64),
      previous_link_hash: null,
    }

    const link2_original = {
      actor_user_id: '22222222-2222-2222-2222-222222222222',
      custody_role: 'freight_forwarder',
      custody_started_at: '2026-05-30T10:00:00Z',
      signer_public_key: 'b'.repeat(64),
      previous_link_hash: chainLinkHash(link1),
    }

    const link3 = {
      actor_user_id: '33333333-3333-3333-3333-333333333333',
      custody_role: 'consignee',
      custody_started_at: '2026-05-31T10:00:00Z',
      signer_public_key: 'c'.repeat(64),
      previous_link_hash: chainLinkHash(link2_original),
    }

    // Tamper eslabón 2 · cambiar actor_user_id
    const link2_tampered = {
      ...link2_original,
      actor_user_id: '99999999-9999-9999-9999-999999999999',
    }

    const { valid, brokenAt } = verifyChainIntegrity([link1, link2_tampered, link3])

    expect(valid).toBe(false)
    // El eslabón 3 ya no encaja con el hash del tampered link2
    expect(brokenAt).toBe(2)
  })
})
