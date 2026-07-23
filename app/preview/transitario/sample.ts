// Datos de MUESTRA para la vista de previsualización del escritorio transitario.
// NO es BD: son ejemplos en memoria para enseñar la UI. La ruta real
// (/transitario) usa exactamente la misma UI pero con datos de Supabase.
import type { CustodyActor, CustodyShipment, ShipmentDetail, ShipmentDocs } from '../../transitario/custody'

const ME = 'link-me-0001'

// Atajo para no repetir los campos de carga en cada bulto.
type CargoFields = Pick<
  CustodyShipment,
  | 'packageType' | 'packageLengthMm' | 'packageWidthMm' | 'packageHeightMm'
  | 'packageWeightKg' | 'stackable' | 'reeferTempMinC' | 'reeferTempMaxC' | 'imdgClass'
>
function cargo(
  packageType: string | null,
  l: number | null, w: number | null, h: number | null, kg: number | null,
  opts: { stackable?: boolean | null; reefer?: [number, number] | null } = {},
): CargoFields {
  return {
    packageType,
    packageLengthMm: l, packageWidthMm: w, packageHeightMm: h, packageWeightKg: kg,
    stackable: opts.stackable ?? null,
    reeferTempMinC: opts.reefer?.[0] ?? null,
    reeferTempMaxC: opts.reefer?.[1] ?? null,
    imdgClass: null,
  }
}

export const SAMPLE_SHIPMENTS: CustodyShipment[] = [
  // ── Corredor a Bogotá (COBOG): consolidación que llena un contenedor → FCL + 3D ──
  {
    linkId: 'link-1', dppId: '11111111-1111-4111-8111-111111111111',
    custodyStartedAt: '2026-06-09T08:30:00Z', custodyEndedAt: null, gpsLat: 39.4699, gpsLng: -0.3763,
    evidence: { document_type: 'BL', document_url: '#' },
    productName: 'Sofá modular 3 plazas · tela', sku: 'SOF-MOD-3T', hsCode: '940161', originCountry: 'ES',
    lifecycleState: 'in_transit', incoterm: 'CIF', deliveryLocation: 'COBOG', blReference: 'MAEU-2026-44817', carrierId: 'Maersk',
    ...cargo('crate', 2400, 1000, 950, 85, { stackable: true }),
  },
  {
    linkId: 'link-2', dppId: '22222222-2222-4222-8222-222222222222',
    custodyStartedAt: '2026-06-12T10:00:00Z', custodyEndedAt: null, gpsLat: 38.345, gpsLng: -0.481,
    evidence: { document_type: 'BL' },
    productName: 'Mesa de comedor roble macizo', sku: 'MES-ROB-220', hsCode: '940360', originCountry: 'ES',
    lifecycleState: 'loaded', incoterm: 'CIF', deliveryLocation: 'COBOG', blReference: 'MAEU-2026-44818', carrierId: 'Maersk',
    ...cargo('crate', 2200, 1050, 820, 70, { stackable: true }),
  },
  {
    linkId: 'link-4', dppId: '44444444-4444-4444-8444-444444444444',
    custodyStartedAt: '2026-06-12T10:05:00Z', custodyEndedAt: null, gpsLat: 38.345, gpsLng: -0.481,
    evidence: null,
    productName: 'Armario 2 puertas embalado', sku: 'ARM-2P-NOG', hsCode: '940350', originCountry: 'ES',
    lifecycleState: 'loaded', incoterm: 'CIF', deliveryLocation: 'COBOG', blReference: 'MAEU-2026-44819', carrierId: 'Maersk',
    ...cargo('crate', 1200, 680, 2250, 98, { stackable: false }), // de pie · no volcar
  },
  {
    linkId: 'link-5', dppId: '55555555-5555-4555-8555-555555555555',
    custodyStartedAt: '2026-06-12T10:10:00Z', custodyEndedAt: null, gpsLat: 38.345, gpsLng: -0.481,
    evidence: null,
    productName: 'Palet · estanterías flatpack', sku: 'PAL-EST-FP', hsCode: '940360', originCountry: 'ES',
    lifecycleState: 'loaded', incoterm: 'CIF', deliveryLocation: 'COBOG', blReference: 'MAEU-2026-44820', carrierId: 'Maersk',
    ...cargo('pallet', 1200, 800, 2050, 245, { stackable: true }),
  },
  {
    linkId: 'link-6', dppId: '66666666-6666-4666-8666-666666666666',
    custodyStartedAt: '2026-06-12T10:15:00Z', custodyEndedAt: null, gpsLat: 38.345, gpsLng: -0.481,
    evidence: null,
    productName: 'Palet · cabeceros y somieres', sku: 'PAL-CAB-FP', hsCode: '940350', originCountry: 'ES',
    lifecycleState: 'loaded', incoterm: 'CIF', deliveryLocation: 'COBOG', blReference: 'MAEU-2026-44821', carrierId: 'Maersk',
    ...cargo('pallet', 1200, 800, 1980, 215, { stackable: true }),
  },
  {
    linkId: 'link-7', dppId: '77777777-7777-4777-8777-777777777777',
    custodyStartedAt: '2026-06-12T10:20:00Z', custodyEndedAt: null, gpsLat: 38.345, gpsLng: -0.481,
    evidence: null,
    productName: 'Palet · mesas auxiliares', sku: 'PAL-AUX-FP', hsCode: '940360', originCountry: 'ES',
    lifecycleState: 'loaded', incoterm: 'CIF', deliveryLocation: 'COBOG', blReference: 'MAEU-2026-44822', carrierId: 'Maersk',
    ...cargo('pallet', 1200, 800, 1850, 195, { stackable: true }),
  },
  {
    linkId: 'link-8', dppId: '88888888-8888-4888-8888-888888888888',
    custodyStartedAt: '2026-06-12T10:25:00Z', custodyEndedAt: null, gpsLat: 38.345, gpsLng: -0.481,
    evidence: null,
    productName: 'Cómoda + 2 mesillas (juego)', sku: 'COM-MES-NOG', hsCode: '940350', originCountry: 'ES',
    lifecycleState: 'loaded', incoterm: 'CIF', deliveryLocation: 'COBOG', blReference: 'MAEU-2026-44823', carrierId: 'Maersk',
    ...cargo('crate', 1350, 620, 1150, 88, { stackable: true }),
  },
  {
    linkId: 'link-9', dppId: '99999999-9999-4999-8999-999999999999',
    custodyStartedAt: '2026-06-12T10:30:00Z', custodyEndedAt: null, gpsLat: 38.345, gpsLng: -0.481,
    evidence: null,
    productName: 'Palet · menaje de cocina', sku: 'PAL-MEN-COC', hsCode: '732393', originCountry: 'ES',
    lifecycleState: 'loaded', incoterm: 'CIF', deliveryLocation: 'COBOG', blReference: 'MAEU-2026-44824', carrierId: 'Maersk',
    ...cargo('pallet', 1200, 800, 1750, 265, { stackable: true }),
  },
  // Sin medir → cae en el panel honesto «falta medir», fuera del cubicaje.
  {
    linkId: 'link-10', dppId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    custodyStartedAt: '2026-06-13T09:00:00Z', custodyEndedAt: null, gpsLat: 38.345, gpsLng: -0.481,
    evidence: null,
    productName: 'Lámpara de diseño (pieza exclusiva)', sku: 'LAM-DIS-01', hsCode: '940520', originCountry: 'ES',
    lifecycleState: 'created', incoterm: 'CIF', deliveryLocation: 'COBOG', blReference: null, carrierId: 'Maersk',
    ...cargo(null, null, null, null, null),
  },

  // ── Corredor a Veracruz (MXVER): poco volumen, mucho kilo → grupaje (LCL) ──
  {
    linkId: 'link-11', dppId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    custodyStartedAt: '2026-06-14T11:00:00Z', custodyEndedAt: null, gpsLat: 38.345, gpsLng: -0.481,
    evidence: { document_type: 'CMR' },
    productName: 'Mesa de centro · tablero mármol', sku: 'MES-CEN-MAR', hsCode: '940360', originCountry: 'ES',
    lifecycleState: 'created', incoterm: 'FOB', deliveryLocation: 'MXVER', blReference: 'HLCU-2026-10233', carrierId: 'Hapag-Lloyd',
    ...cargo('crate', 1100, 700, 450, 240, { stackable: true }),
  },

  // ── Histórico (entregado): no entra en planificación de carga ──
  {
    linkId: 'link-3', dppId: '33333333-3333-4333-8333-333333333333',
    custodyStartedAt: '2026-05-02T09:00:00Z', custodyEndedAt: '2026-05-28T16:00:00Z', gpsLat: null, gpsLng: null,
    evidence: null,
    productName: 'Conjunto dormitorio · 5 piezas', sku: 'DOR-5P-NOG', hsCode: '940350', originCountry: 'ES',
    lifecycleState: 'delivered', incoterm: 'DAP', deliveryLocation: 'FRMRS', blReference: 'CMACGM-2026-7781', carrierId: 'CMA CGM',
    ...cargo('crate', 2400, 1100, 900, 86.5, { stackable: true }),
  },
]

// Carpetas documentales de muestra (módulo Documentación). Derivadas de los
// envíos de arriba: una con B/L + evidencias, una solo cargada, una sin papeles.
export const SAMPLE_DOCS: ShipmentDocs[] = [
  {
    dppId: '11111111-1111-4111-8111-111111111111',
    productName: 'Sofá modular 3 plazas · tela',
    originCountry: 'ES',
    deliveryLocation: 'COBOG',
    incoterm: 'CIF',
    lifecycleState: 'in_transit',
    blReference: 'MAEU-2026-44817',
    maritimeConvention: 'rotterdam',
    docs: [
      { documentType: 'Albarán de entrega', documentUrl: '#', documentHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00', byRole: 'manufacturer', at: '2026-06-05T07:00:00Z' },
      { documentType: 'Bill of Lading', documentUrl: '#', documentHash: '00ffeeddccbbaa998877665544332211009f8e7d6c5b4a39281706f5e4d3c2b1', byRole: 'freight_forwarder', at: '2026-06-09T08:30:00Z' },
    ],
  },
  {
    dppId: '22222222-2222-4222-8222-222222222222',
    productName: 'Mesa de comedor roble macizo',
    originCountry: 'ES',
    deliveryLocation: 'COBOG',
    incoterm: 'CIF',
    lifecycleState: 'loaded',
    blReference: 'MAEU-2026-44818',
    maritimeConvention: 'rotterdam',
    docs: [
      { documentType: 'Bill of Lading', documentUrl: null, documentHash: null, byRole: 'freight_forwarder', at: '2026-06-12T10:00:00Z' },
    ],
  },
  {
    dppId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    productName: 'Mesa de centro · tablero mármol',
    originCountry: 'ES',
    deliveryLocation: 'MXVER',
    incoterm: 'FOB',
    lifecycleState: 'created',
    blReference: 'HLCU-2026-10233',
    maritimeConvention: null,
    docs: [
      { documentType: 'Carta de porte CMR', documentUrl: null, documentHash: null, byRole: 'freight_forwarder', at: '2026-06-14T11:00:00Z' },
    ],
  },
]

// Contrapartes de muestra (módulo Actores). Derivadas de los envíos de arriba:
// el fabricante que cedió la custodia, un transportista marítimo y un consignatario.
export const SAMPLE_ACTORS: CustodyActor[] = [
  {
    actorUserId: 'actor-fab-0001', roles: ['manufacturer'], shipmentCount: 3,
    shipments: [
      { dppId: '11111111-1111-4111-8111-111111111111', productName: 'Sofá modular 3 plazas · tela', role: 'manufacturer' },
      { dppId: '22222222-2222-4222-8222-222222222222', productName: 'Mesa de comedor roble macizo', role: 'manufacturer' },
      { dppId: '44444444-4444-4444-8444-444444444444', productName: 'Armario 2 puertas embalado', role: 'manufacturer' },
    ],
  },
  {
    actorUserId: 'actor-car-0007', roles: ['carrier'], shipmentCount: 2,
    shipments: [
      { dppId: '11111111-1111-4111-8111-111111111111', productName: 'Sofá modular 3 plazas · tela', role: 'carrier' },
      { dppId: '55555555-5555-4555-8555-555555555555', productName: 'Palet · estanterías flatpack', role: 'carrier' },
    ],
  },
  {
    actorUserId: 'actor-con-0021', roles: ['consignee'], shipmentCount: 1,
    shipments: [
      { dppId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', productName: 'Mesa de centro · tablero mármol', role: 'consignee' },
    ],
  },
]

export function sampleDetail(dppId: string): ShipmentDetail | null {
  const base = SAMPLE_SHIPMENTS.find((s) => s.dppId === dppId)
  if (!base) return null
  // Las medidas del bulto ya viven en `base` (CustodyShipment); no se duplican.
  return {
    ...base,
    linkId: ME,
    maritimeConvention: base.deliveryLocation === 'COBOG' ? 'rotterdam' : null,
    photoUrl: null,
    chain: [
      {
        id: 'chain-1', dppId, actorUserId: 'u-fab', custodyRole: 'manufacturer',
        custodyStartedAt: '2026-06-05T07:00:00Z', custodyEndedAt: base.custodyStartedAt,
        gpsLat: 38.345, gpsLng: -0.481, evidence: { document_type: 'delivery_note' },
      },
      {
        id: ME, dppId, actorUserId: 'u-me', custodyRole: 'freight_forwarder',
        custodyStartedAt: base.custodyStartedAt, custodyEndedAt: base.custodyEndedAt,
        gpsLat: base.gpsLat, gpsLng: base.gpsLng, evidence: base.evidence,
      },
    ],
    transitions: [
      { dppId, fromState: null, toState: 'created', transitionedAt: '2026-06-05T07:00:00Z', reason: 'Alta del envío' },
      { dppId, fromState: 'created', toState: 'loaded', transitionedAt: '2026-06-08T18:00:00Z', reason: 'Carga confirmada' },
      { dppId, fromState: 'loaded', toState: 'in_transit', transitionedAt: '2026-06-09T08:30:00Z', reason: 'Zarpa de Valencia' },
    ],
  }
}
