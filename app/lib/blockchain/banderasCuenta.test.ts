// ════════════════════════════════════════════════════════════════════════════
// LAS BANDERAS DE CUENTA · el test que habría evitado publicar una falsedad
// ────────────────────────────────────────────────────────────────────────────
// 🔴 EL FALLO (6-ago-2026): dos constantes escritas a mano estaban INTERCAMBIADAS.
// `LSF_ALLOW_TRUSTLINE_LOCKING = 0x80000000` es en realidad Clawback; Locking es
// 0x40000000. El guion de verificación leyó el bit de Clawback, lo anunció como
// Locking, y con esa salida se «corrigió» una frase VERDADERA del system prompt de
// Vero para convertirla en falsa de cara a los usuarios.
//
// Estos tests fijan las dos mitades:
//  1. los valores, contra la tabla del protocolo (no contra mi memoria);
//  2. el VEREDICTO sobre las banderas REALES del emisor oficial de RLUSD, que es
//     la afirmación concreta que se publicó al revés.
// ════════════════════════════════════════════════════════════════════════════
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  LSF_ALLOW_TRUSTLINE_LOCKING,
  LSF_ALLOW_TRUSTLINE_CLAWBACK,
  LSF_DEFAULT_RIPPLE,
  aptitudEscrowToken,
} from './banderasCuenta.ts'

/**
 * Banderas MEDIDAS del emisor oficial de RLUSD el 6-ago-2026, idénticas en testnet
 * (`rQhWct2f…`) y en mainnet (`rMxCKbED…`). Se fijan aquí como dato histórico: si
 * Ripple cambiara las banderas de su emisor, este número dejaría de describirlas —
 * pero el veredicto que se comprueba abajo seguiría siendo el correcto PARA ESTE
 * valor, que es lo que se leyó mal.
 */
const FLAGS_EMISOR_RLUSD_OFICIAL = 0x819a0000

test('los valores salen de la tabla del protocolo, y NO son los que se tecleó', () => {
  assert.equal(LSF_ALLOW_TRUSTLINE_LOCKING, 0x40000000)
  assert.equal(LSF_ALLOW_TRUSTLINE_CLAWBACK, 0x80000000)
  assert.equal(LSF_DEFAULT_RIPPLE, 0x00800000)
  // El corazón del fallo: se habían escrito al revés.
  assert.notEqual(LSF_ALLOW_TRUSTLINE_LOCKING, 0x80000000, 'ese valor es CLAWBACK, no LOCKING')
})

test('REGRESIÓN: el emisor OFICIAL de RLUSD NO admite escrow de token', () => {
  // Esta es, literalmente, la frase que se publicó al revés — en `explainer.ts`,
  // que es el system prompt de Vero, o sea que se la contaba a los usuarios.
  const v = aptitudEscrowToken(FLAGS_EMISOR_RLUSD_OFICIAL)
  assert.equal(v.tieneClawback, true, 'el emisor oficial SÍ tiene Clawback')
  assert.equal(v.permiteLocking, false, 'el emisor oficial NO tiene AllowTrustLineLocking')
  assert.equal(v.admiteTokenEscrow, false)
  assert.match(v.motivo ?? '', /AllowTrustLineLocking/)
})

test('un emisor apto (como el de pruebas del arnés) sí admite escrow de token', () => {
  // Es el caso que SÍ funciona, y por eso el recorrido de punta a punta con emisor
  // propio es válido: `asfAllowTrustLineLocking` = 17, comprobado on-ledger.
  const v = aptitudEscrowToken(LSF_ALLOW_TRUSTLINE_LOCKING | LSF_DEFAULT_RIPPLE)
  assert.equal(v.admiteTokenEscrow, true)
  assert.equal(v.motivo, null)
  assert.equal(v.defaultRipple, true)
})

test('cada motivo de rechazo se nombra por separado: no vale un «no» genérico', () => {
  // Si el veredicto no dice CUÁL de las dos condiciones falla, quien lo lea volverá
  // a decodificar bits a mano — que es exactamente como nació este fallo.
  assert.match(aptitudEscrowToken(0).motivo ?? '', /AllowTrustLineLocking/)
  assert.match(
    aptitudEscrowToken(LSF_ALLOW_TRUSTLINE_LOCKING | LSF_ALLOW_TRUSTLINE_CLAWBACK).motivo ?? '',
    /Clawback/,
  )
  const ambas = aptitudEscrowToken(LSF_ALLOW_TRUSTLINE_CLAWBACK).motivo ?? ''
  assert.match(ambas, /AllowTrustLineLocking/)
  assert.match(ambas, /Clawback/)
})

test('las banderas se leen sin signo (el bit 31 no puede volverse negativo)', () => {
  // 0x80000000 en JS con operadores bit a bit da -2147483648 si se descuida el >>>0,
  // y entonces la comprobación de Clawback se evalúa mal justo en el bit que importa.
  assert.ok(LSF_ALLOW_TRUSTLINE_CLAWBACK > 0)
  assert.equal(aptitudEscrowToken(0x819a0000).flags, 0x819a0000)
  assert.equal(aptitudEscrowToken(-2147483648).tieneClawback, true)
})
