// Test del mapeador del conector (FichaCanonica → cuerpo de alta de producto 1503).
// Runner nativo node:test. Ejecuta con: npm run test:unit

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CONTRATO_VERSION_SOPORTADA,
  contratoSoportado,
  fichaCanonicaToProductBody,
  type FichaCanonica,
} from './contract.ts'

const FICHA: FichaCanonica = {
  contrato_version: 'conector@1.0',
  sku: 'ART-SILLA-001',
  titulo: 'Silla de roble macizo',
  precio: { valor: 320, moneda: 'EUR', iva_incluido: true },
  imagenes: ['https://cdn.example/a.jpg', 'https://cdn.example/b.jpg'],
  certificados: ['FSC', 'CE'],
  bulto: { largo_mm: 600, ancho_mm: 550, alto_mm: 900, peso_kg: 7.5, apilable: false, tipo: 'box' },
  pais_origen: 'ES',
  pais_fabricacion: 'ES',
  fecha_produccion: '2026-05-01',
  hs_code: '940161',
  materiales: [{ nombre: 'roble', porcentaje: 90 }, { nombre: 'acero' }],
  hash_canonico: 'abc',
}

test('contratoSoportado reconoce la versión y rechaza otras', () => {
  assert.equal(CONTRATO_VERSION_SOPORTADA, 'conector@1.0')
  assert.ok(contratoSoportado('conector@1.0'))
  assert.ok(!contratoSoportado('conector@2.0'))
  assert.ok(!contratoSoportado(undefined))
})

test('mapea ficha → cuerpo con title LocalizedLabel y price 1503', () => {
  const body = fichaCanonicaToProductBody(FICHA, { sectorId: 'inmobiliario', subCategoria: 'producto_interiorismo' })
  assert.deepEqual(body.title, { es: 'Silla de roble macizo', en: 'Silla de roble macizo' })
  assert.equal(body.sector_id, 'inmobiliario')
  assert.equal(body.sub_categoria, 'producto_interiorismo')
  assert.equal(body.sku, 'ART-SILLA-001')
  assert.deepEqual(body.price, { value: 320, currency: 'EUR', vat_included: true })
})

test('la primera imagen es la primaria', () => {
  const body = fichaCanonicaToProductBody(FICHA, { sectorId: 'inmobiliario', subCategoria: 'x' })
  assert.deepEqual(body.images, [
    { url: 'https://cdn.example/a.jpg', is_primary: true },
    { url: 'https://cdn.example/b.jpg', is_primary: false },
  ])
})

test('mapea bulto → campos de cubicaje (mm) que necesita el motor de carga', () => {
  const body = fichaCanonicaToProductBody(FICHA, { sectorId: 'inmobiliario', subCategoria: 'x' })
  assert.equal(body.package_length_mm, 600)
  assert.equal(body.package_width_mm, 550)
  assert.equal(body.package_height_mm, 900)
  assert.equal(body.package_weight_kg, 7.5)
  assert.equal(body.package_type, 'box')
  assert.equal(body.stackable, false)
})

test('pais_fabricacion activa el DPP físico (manufacturing_country) + materiales estructurados', () => {
  const body = fichaCanonicaToProductBody(FICHA, { sectorId: 'inmobiliario', subCategoria: 'x' })
  assert.equal(body.manufacturing_country, 'ES')
  assert.equal(body.country_of_origin, 'ES')
  assert.equal(body.production_date, '2026-05-01')
  assert.equal(body.hs_code, '940161')
  assert.deepEqual(body.materials, [{ name: 'roble', percentage: 90 }, { name: 'acero' }])
})

test('no inventa lo que el conector no trae (sin bulto/hs → no aparecen)', () => {
  const minima: FichaCanonica = {
    contrato_version: 'conector@1.0',
    sku: 'X',
    titulo: 'T',
    precio: { valor: 1, moneda: 'EUR', iva_incluido: true },
    imagenes: [],
    certificados: [],
  }
  const body = fichaCanonicaToProductBody(minima, { sectorId: 'inmobiliario', subCategoria: 'x' })
  assert.equal('package_length_mm' in body, false)
  assert.equal('hs_code' in body, false)
  assert.equal('manufacturing_country' in body, false)
  assert.equal('images' in body, false)
  assert.equal('materials' in body, false)
})

test('país no-ISO se descarta (no se cuela basura en country_of_origin)', () => {
  const f: FichaCanonica = { ...FICHA, pais_origen: 'Valencia', pais_fabricacion: 'España' }
  const body = fichaCanonicaToProductBody(f, { sectorId: 'inmobiliario', subCategoria: 'x' })
  assert.equal('country_of_origin' in body, false)
  assert.equal('manufacturing_country' in body, false)
})
