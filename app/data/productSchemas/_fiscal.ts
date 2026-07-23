// Infraestructura fiscal transversal · facturación + IVA + comercio global.
// Audit-Ready by Design · 0 atajos · máximo esfuerzo.
//
// El IVA y la facturación son TRANSVERSALES a los 17 sectores (igual que el
// sector FINANCIERO). Este módulo modela y FUERZA el cumplimiento fiscal de
// cualquier ficha (bien físico o servicio) en el comercio nacional, intra-UE y
// global. Se engancha como bloque opcional `fiscal?: FiscalInvoicingData` en
// `UniversalProduct`, de modo que TODA ficha — producto o servicio — puede
// declarar y validar su situación fiscal.
//
// MARCO REGULATORIO (verificado contra EUR-Lex / AEAT / Comisión · ver §fuentes):
//
//   1. Sistema común del IVA · Dir. 2006/112/CE — base. Lugar de realización:
//      servicios B2B en sede del destinatario (Art. 44) · inversión del sujeto
//      pasivo (Art. 196 servicios · Art. 199 bienes/sectores) · entregas
//      intracom exentas (Art. 138) · exportaciones exentas (Art. 146).
//   2. "Quick Fixes 2020" (Dir. (UE) 2018/1910) — para la EXENCIÓN de la
//      entrega intracom (Art. 138) es condición MATERIAL que el adquirente
//      comunique un NIF-IVA válido de OTRO Estado miembro y que la operación
//      conste en el estado recapitulativo (modelo 349).
//   3. ViDA · "VAT in the Digital Age": Dir. (UE) 2025/516 + Reg. (UE) 2025/517
//      + Reg. Ejec. (UE) 2025/518 (todas de 11-mar-2025 · OJ 25-mar-2025 · en
//      vigor 14-abr-2025 · despliegue hasta ene-2035). Hitos:
//        · 1-ene-2030: la e-factura deja de requerir aceptación del receptor.
//        · 1-jul-2030: e-factura ESTRUCTURADA obligatoria + reporte digital
//          transacción a transacción para B2B/B2G intra-UE.
//        · 1-ene-2035: los EM con reporte doméstico deben alinearse al estándar UE.
//   4. España · factura electrónica B2B obligatoria: Ley 18/2022 (Crea y Crece)
//      art. 12 + RD 238/2026 (BOE 31-mar-2026 · en vigor 1-oct-2026 · 12 meses
//      para >8M€ facturación · 2 años resto empresas y autónomos).
//   5. España · Verifactu / RRSIF: RD 1007/2023 (Reglamento Requisitos Sistemas
//      Informáticos de Facturación · hash encadenado + registro de eventos +
//      trazabilidad). RDL 15/2025 aplaza exigibilidad: 1-ene-2027 (Impuesto
//      Sociedades) · 1-jul-2027 (resto). Software adaptado desde 29-jul-2025.
//   6. España · modelo 349 (declaración recapitulativa de operaciones
//      intracomunitarias · claves A/E/T/S/I/M/H).
//   7. Ventanilla única B2C · OSS/IOSS (modelo 369 ES desde 1-jul-2021). IOSS:
//      importaciones de bajo valor ≤ 150 €.
//   8. Norma europea de factura electrónica · EN 16931 (semántica) · formatos
//      Facturae (ES) · Peppol BIS · UBL 2.1 · UN/CEFACT CII · TicketBAI (P. Vasco).
//   9. VIES · sistema de intercambio de información sobre el IVA (Reg. (UE)
//      904/2010). Validación en tiempo real del NIF-IVA contra el servicio
//      oficial de la Comisión (sin autenticación).
//
// NOTA HONESTIDAD (canon valores): la determinación fiscal definitiva de una
// operación corresponde a un asesor fiscal / la AEAT. Este módulo aplica las
// reglas de coherencia conocidas y marca lo que requiere validación experta;
// NO sustituye el dictamen fiscal (CLAUDE.md §1 · subject_to_expert).
//
// §fuentes (verificadas 2026-05-29):
//   - taxation-customs.ec.europa.eu/.../vat-digital-age-vida_en (ViDA 2025/516-518)
//   - BOE RD 238/2026 + Ley 18/2022 (factura B2B ES)
//   - BOE RD 1007/2023 + RDL 15/2025 (Verifactu)
//   - sede.agenciatributaria.gob.es (modelo 349 + modelo 369 OSS/IOSS)
//   - ec.europa.eu/taxation_customs/vies/rest-api (VIES REST)

import { z } from 'zod'
import type { ISOCountryCode } from './_universal'
import type { ComplianceResult, ComplianceViolation } from './_compliance'

// ============================================================================
// TIPOS · clasificación fiscal de la operación
// ============================================================================

/** Tipo de operación a efectos de IVA / lugar de realización. */
export type OperacionFiscalTipo =
  | 'nacional'                       // ambas partes en el mismo Estado miembro
  | 'intracom_bienes'                // entrega/adquisición intracom de bienes
  | 'intracom_servicios'             // prestación/adquisición intracom de servicios (Art. 44)
  | 'exportacion_bienes'             // a país tercero (exenta Art. 146)
  | 'importacion_bienes'             // desde país tercero
  | 'b2c_distancia_oss'              // venta a distancia B2C intra-UE (OSS)
  | 'b2c_importacion_ioss'           // importación B2C ≤150 € (IOSS)
  | 'operacion_triangular'           // operación triangular (3 Estados miembros)
  | 'no_sujeta'                      // fuera del ámbito del IVA

/** Régimen de IVA aplicado a la operación. */
export type RegimenIVA =
  | 'iva_repercutido_general'        // IVA normal del Estado miembro
  | 'inversion_sujeto_pasivo'        // reverse charge (Art. 196 servicios / 199 sectores)
  | 'exenta_intracom'                // entrega intracom exenta (Art. 138)
  | 'exenta_exportacion'             // exportación exenta (Art. 146)
  | 'oss'                            // One Stop Shop (B2C intra-UE)
  | 'ioss'                           // Import One Stop Shop (B2C importación ≤150€)
  | 'no_sujeta'

/** Clave de operación del modelo 349 (declaración recapitulativa ES). */
export type Modelo349Clave =
  | 'A'  // adquisiciones intracomunitarias de bienes
  | 'E'  // entregas intracomunitarias de bienes
  | 'T'  // entregas posteriores en operación triangular
  | 'S'  // prestaciones intracomunitarias de servicios
  | 'I'  // adquisiciones intracomunitarias de servicios
  | 'M'  // entregas intracom exentas posteriores a importación
  | 'H'  // entregas intracom exentas posteriores a importación (representante fiscal)

/** Estándar de factura electrónica estructurada. */
export type EInvoiceEstandar =
  | 'en_16931'              // norma europea (semántica · base ViDA)
  | 'facturae'              // formato España (XML XAdES)
  | 'peppol_bis'            // Peppol BIS Billing 3.0
  | 'ubl_2_1'               // UBL 2.1
  | 'cii'                   // UN/CEFACT Cross Industry Invoice
  | 'verifactu'             // sistema Verifactu ES (RD 1007/2023)
  | 'ticketbai'             // País Vasco (TBAI)

// ============================================================================
// VIES · validación de NIF-IVA en tiempo real (servicio oficial Comisión)
// ============================================================================

/** Resultado de la validación VIES de un NIF-IVA. */
export type VIESValidationResult = {
  /** NIF-IVA consultado (país ISO + número · sin espacios). */
  vat_number: string
  /** ¿Válido y activo en VIES en el momento de la consulta? */
  valid: boolean
  /** Nombre del operador devuelto por VIES (si el EM lo expone). */
  trader_name?: string
  /** Dirección devuelta por VIES (si el EM la expone). */
  trader_address?: string
  /** Fecha-hora de la consulta (ISO 8601). */
  checked_at: string
  /** Identificador de consulta VIES · prueba de verificación (Art. 138 quick fix). */
  consultation_number?: string
  /** Error si la consulta no pudo completarse. */
  error?:
    | 'INVALID_FORMAT'         // formato de NIF-IVA inválido (no se llamó a VIES)
    | 'INVALID_INPUT'          // VIES rechazó la entrada
    | 'MS_UNAVAILABLE'         // el Estado miembro no respondió
    | 'SERVICE_UNAVAILABLE'    // VIES caído
    | 'TIMEOUT'                // timeout de la consulta
    | 'NETWORK_ERROR'          // error de red local
}

/** Endpoint REST oficial del servicio VIES de la Comisión Europea.
 *  Sin autenticación · datos en tiempo real desde las AATT de los 27 EM. */
export const VIES_REST_BASE = 'https://ec.europa.eu/taxation_customs/vies/rest-api'

/** Regex de formato VIES: 2 letras ISO país + 2-14 caracteres alfanuméricos. */
const VIES_FORMAT = /^[A-Z]{2}[0-9A-Z+*.]{2,14}$/

/** Valida un NIF-IVA contra el servicio VIES oficial de la Comisión Europea.
 *
 *  Hace una llamada de red real (server-side · NUNCA desde el cliente para no
 *  exponer NIF de terceros ni saturar el servicio). `fetchImpl` es inyectable
 *  para tests. Devuelve siempre un `VIESValidationResult` (nunca lanza): los
 *  fallos de red/servicio se reportan en `error` para que el caller decida.
 *
 *  @param countryCode ISO 3166-1 alpha-2 del Estado miembro (e.g. 'ES', 'DE').
 *  @param vatNumber   Número (sin el prefijo de país · e.g. 'B12345678').
 */
export async function validateVatNumberVIES(
  countryCode: string,
  vatNumber: string,
  fetchImpl: typeof fetch = fetch,
): Promise<VIESValidationResult> {
  const cc = (countryCode || '').toUpperCase().trim()
  const num = (vatNumber || '').toUpperCase().replace(/\s+/g, '')
  const full = `${cc}${num}`
  const nowIso = new Date().toISOString()

  if (!VIES_FORMAT.test(full)) {
    return { vat_number: full, valid: false, checked_at: nowIso, error: 'INVALID_FORMAT' }
  }

  try {
    const res = await fetchImpl(`${VIES_REST_BASE}/ms/${cc}/vat/${num}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) {
      const err = res.status === 503 || res.status === 502 ? 'SERVICE_UNAVAILABLE' : 'MS_UNAVAILABLE'
      return { vat_number: full, valid: false, checked_at: nowIso, error: err }
    }
    const data = (await res.json()) as {
      valid?: boolean
      isValid?: boolean
      name?: string
      traderName?: string
      address?: string
      traderAddress?: string
      requestIdentifier?: string
      userError?: string
    }
    // VIES no devuelve resultado fiable del EM → MS_UNAVAILABLE.
    if (data.userError && data.userError !== 'VALID' && data.userError !== 'INVALID') {
      return { vat_number: full, valid: false, checked_at: nowIso, error: 'MS_UNAVAILABLE' }
    }
    const valid = data.valid === true || data.isValid === true
    return {
      vat_number: full,
      valid,
      trader_name: data.name ?? data.traderName,
      trader_address: data.address ?? data.traderAddress,
      checked_at: nowIso,
      consultation_number: data.requestIdentifier,
    }
  } catch {
    return { vat_number: full, valid: false, checked_at: nowIso, error: 'NETWORK_ERROR' }
  }
}

// ============================================================================
// BLOQUE FISCAL · se engancha como `fiscal?` en UniversalProduct
// ============================================================================

/** Identificación OSS/IOSS para ventas a distancia B2C. */
export type OssIossData = {
  /** Régimen de ventanilla única. */
  regimen: 'oss_union' | 'oss_no_union' | 'ioss'
  /** Número de identificación OSS/IOSS. */
  numero_identificacion: string
  /** Estado miembro de identificación (ISO 3166-1 alpha-2). */
  em_identificacion: ISOCountryCode
}

/** Datos de factura electrónica (ViDA + España). */
export type EInvoiceData = {
  /** Estándar de la factura electrónica. */
  estandar?: EInvoiceEstandar
  /** Referencia / nº de la factura electrónica emitida. */
  referencia?: string
  /** ¿Requiere factura ESTRUCTURADA? (ViDA · B2B/B2G intra-UE desde 1-jul-2030). */
  requiere_estructurada?: boolean
  /** ¿Emitida vía sistema verificable Verifactu (RD 1007/2023)? */
  es_verifactu?: boolean
  /** Hash encadenado del registro de facturación (RRSIF · Verifactu). */
  hash_encadenado?: string
}

/** Bloque fiscal transversal de una ficha (producto o servicio). */
export type FiscalInvoicingData = {
  // -------------------- IDENTIFICACIÓN FISCAL DE LAS PARTES --------------------
  /** NIF-IVA del vendedor/prestador (formato VIES · país + número). */
  vat_number_seller?: string
  /** NIF-IVA del comprador/destinatario. */
  vat_number_buyer?: string
  /** Resultado VIES del vendedor (cacheado de una validación previa). */
  vies_seller?: VIESValidationResult
  /** Resultado VIES del comprador (material para la exención Art. 138). */
  vies_buyer?: VIESValidationResult

  // -------------------- CLASIFICACIÓN DE LA OPERACIÓN --------------------
  /** Tipo de operación a efectos de IVA. */
  operacion_tipo: OperacionFiscalTipo
  /** Régimen de IVA aplicado. */
  regimen_iva?: RegimenIVA
  /** Lugar de realización / Estado miembro donde se devenga el IVA.
   *  Servicios B2B: sede del destinatario (Art. 44). Bienes: destino físico. */
  lugar_realizacion?: ISOCountryCode
  /** ¿Aplica inversión del sujeto pasivo (reverse charge)? */
  reverse_charge_applies?: boolean
  /** Base legal de la inversión (e.g. 'Art. 196 Dir. 2006/112/CE'). */
  reverse_charge_base_legal?: string

  // -------------------- DECLARACIÓN RECAPITULATIVA (modelo 349 ES) --------------------
  /** Clave de operación del modelo 349. */
  modelo_349_clave?: Modelo349Clave

  // -------------------- VENTANILLA ÚNICA B2C (OSS/IOSS) --------------------
  oss_ioss?: OssIossData

  // -------------------- FACTURA ELECTRÓNICA --------------------
  einvoice?: EInvoiceData
  /** ¿Sujeta a factura electrónica B2B obligatoria ES (Ley 18/2022 + RD 238/2026)? */
  factura_b2b_obligatoria_es?: boolean
}

// ============================================================================
// HELPERS · determinación fiscal
// ============================================================================

/** ¿La operación es intracomunitaria (bienes o servicios · incl. triangular)? */
export function esOperacionIntracomunitaria(f: FiscalInvoicingData): boolean {
  return (
    f.operacion_tipo === 'intracom_bienes' ||
    f.operacion_tipo === 'intracom_servicios' ||
    f.operacion_tipo === 'operacion_triangular'
  )
}

/** ¿La operación debe declararse en el modelo 349 (operaciones intracom ES)? */
export function requiereModelo349(f: FiscalInvoicingData): boolean {
  return esOperacionIntracomunitaria(f)
}

/** Deriva la clave del modelo 349 esperada para una entrega/prestación del
 *  vendedor (perspectiva del declarante que publica la ficha · vendedor).
 *  Devuelve null si no aplica. */
export function claveModelo349Esperada(f: FiscalInvoicingData): Modelo349Clave | null {
  switch (f.operacion_tipo) {
    case 'intracom_bienes':
      return 'E' // entrega intracom de bienes
    case 'intracom_servicios':
      return 'S' // prestación intracom de servicios
    case 'operacion_triangular':
      return 'T' // entrega posterior en operación triangular
    default:
      return null
  }
}

/** Fecha (ISO date) desde la que ViDA obliga a factura estructurada en B2B/B2G
 *  intra-UE: 1-jul-2030 (Dir. (UE) 2025/516). */
export const VIDA_EINVOICE_ESTRUCTURADA_DESDE = '2030-07-01'

/** ¿La operación requiere factura electrónica estructurada según ViDA en una
 *  fecha dada? (B2B/B2G intra-UE desde 1-jul-2030). */
export function requiereEInvoiceEstructuradaViDA(
  f: FiscalInvoicingData,
  fechaOperacionIso: string,
): boolean {
  if (!esOperacionIntracomunitaria(f)) return false
  return fechaOperacionIso >= VIDA_EINVOICE_ESTRUCTURADA_DESDE
}

// ============================================================================
// ENFORCEMENT FISCAL · validateFiscalCompliance
// ============================================================================

/** Aplica las reglas de coherencia fiscal a una operación. Reutiliza los tipos
 *  de cumplimiento de `_compliance.ts`. NO sustituye el dictamen del asesor
 *  fiscal (subject_to_expert). */
export function validateFiscalCompliance(f: FiscalInvoicingData): ComplianceResult {
  const v: ComplianceViolation[] = []

  // Entrega intracom exenta (Art. 138): condición MATERIAL → ambos NIF-IVA +
  // NIF del comprador de OTRO EM válido en VIES (Quick Fixes 2020 · Dir. 2018/1910).
  if (esOperacionIntracomunitaria(f)) {
    if (!f.vat_number_seller || !f.vat_number_buyer) {
      v.push({
        rule: 'INTRACOM_VAT_NUMBERS_MISSING',
        law: 'Dir. 2006/112/CE Art. 138 + Dir. (UE) 2018/1910 (Quick Fixes)',
        message: 'La operación intracomunitaria exenta exige el NIF-IVA del vendedor y del comprador (NIF del comprador de otro Estado miembro es condición material de la exención).',
        field: !f.vat_number_buyer ? 'vat_number_buyer' : 'vat_number_seller',
        severity: 'blocker',
      })
    }
    // NIF-IVA del comprador debe estar validado en VIES (condición material exención).
    if (f.vat_number_buyer && f.vies_buyer?.valid !== true) {
      v.push({
        rule: 'INTRACOM_VIES_NOT_VALIDATED',
        law: 'Dir. (UE) 2018/1910 (Quick Fixes) + Reg. (UE) 904/2010 (VIES)',
        message: 'El NIF-IVA del comprador debe verificarse y constar válido en VIES para aplicar la exención de la entrega intracomunitaria.',
        field: 'vies_buyer',
        severity: 'warning',
      })
    }
    // Declaración recapitulativa (modelo 349) · clave coherente con la operación.
    const claveEsperada = claveModelo349Esperada(f)
    if (!f.modelo_349_clave) {
      v.push({
        rule: 'MODELO_349_MISSING',
        law: 'modelo 349 (declaración recapitulativa) + Art. 138 Dir. 2006/112',
        message: 'La operación intracomunitaria debe declararse en el estado recapitulativo (modelo 349) — condición material de la exención.',
        field: 'modelo_349_clave',
        severity: 'warning',
      })
    } else if (claveEsperada && f.modelo_349_clave !== claveEsperada && f.modelo_349_clave !== 'M' && f.modelo_349_clave !== 'H') {
      v.push({
        rule: 'MODELO_349_CLAVE_INCONSISTENT',
        law: 'modelo 349 (claves A/E/T/S/I)',
        message: `La clave del modelo 349 ('${f.modelo_349_clave}') no es coherente con el tipo de operación (esperada '${claveEsperada}').`,
        field: 'modelo_349_clave',
        severity: 'warning',
      })
    }
  }

  // Coherencia reverse charge: no aplica en operación puramente nacional B2C.
  if (f.reverse_charge_applies === true && f.operacion_tipo === 'nacional' && !f.reverse_charge_base_legal) {
    v.push({
      rule: 'REVERSE_CHARGE_BASE_LEGAL_MISSING',
      law: 'Dir. 2006/112/CE Art. 199 (ISP sectorial)',
      message: 'La inversión del sujeto pasivo en operación nacional debe citar su base legal (supuesto del Art. 199 · p.ej. construcción, residuos, electrónica).',
      field: 'reverse_charge_base_legal',
      severity: 'warning',
    })
  }

  // ViDA: factura estructurada obligatoria B2B/B2G intra-UE desde 1-jul-2030.
  if (esOperacionIntracomunitaria(f) && f.einvoice?.requiere_estructurada === true) {
    const est = f.einvoice.estandar
    const esEstructurada = est === 'en_16931' || est === 'facturae' || est === 'peppol_bis' || est === 'ubl_2_1' || est === 'cii'
    if (!f.einvoice.referencia || !esEstructurada) {
      v.push({
        rule: 'VIDA_STRUCTURED_EINVOICE_MISSING',
        law: 'Dir. (UE) 2025/516 (ViDA) · e-factura estructurada B2B intra-UE 1-jul-2030',
        message: 'La operación intra-UE requiere factura electrónica estructurada (EN 16931 / Facturae / Peppol) con referencia emitida (ViDA desde 1-jul-2030).',
        field: 'einvoice.referencia',
        severity: 'warning',
      })
    }
  }

  // España: factura electrónica B2B obligatoria (Ley 18/2022 + RD 238/2026).
  if (f.factura_b2b_obligatoria_es === true && (!f.einvoice || !f.einvoice.referencia)) {
    v.push({
      rule: 'ES_B2B_EINVOICE_MISSING',
      law: 'Ley 18/2022 (Crea y Crece) Art. 12 + RD 238/2026',
      message: 'La operación B2B en España sujeta a factura electrónica obligatoria debe emitir factura electrónica con referencia (escalonado desde 2026/2027).',
      field: 'einvoice.referencia',
      severity: 'warning',
    })
  }

  // OSS/IOSS coherente con el tipo de operación B2C.
  if (f.oss_ioss) {
    if (f.oss_ioss.regimen === 'ioss' && f.operacion_tipo !== 'b2c_importacion_ioss') {
      v.push({
        rule: 'IOSS_OPERATION_MISMATCH',
        law: 'IOSS (Import One Stop Shop · importación B2C ≤150€)',
        message: 'Se declara régimen IOSS pero el tipo de operación no es importación B2C de bajo valor (≤150 €).',
        field: 'oss_ioss.regimen',
        severity: 'warning',
      })
    }
    if ((f.oss_ioss.regimen === 'oss_union' || f.oss_ioss.regimen === 'oss_no_union') && f.operacion_tipo !== 'b2c_distancia_oss') {
      v.push({
        rule: 'OSS_OPERATION_MISMATCH',
        law: 'OSS (One Stop Shop · ventas a distancia B2C intra-UE)',
        message: 'Se declara régimen OSS pero el tipo de operación no es venta a distancia B2C intra-UE.',
        field: 'oss_ioss.regimen',
        severity: 'warning',
      })
    }
  }

  return {
    ok: !v.some((x) => x.severity === 'blocker'),
    violations: v,
  }
}

// ============================================================================
// VALIDACIÓN DE SHAPE · Zod (primera pasada · antes de validateFiscalCompliance)
// ============================================================================

const VIESValidationResultSchema = z.object({
  vat_number: z.string(),
  valid: z.boolean(),
  trader_name: z.string().optional(),
  trader_address: z.string().optional(),
  checked_at: z.string(),
  consultation_number: z.string().optional(),
  error: z
    .enum(['INVALID_FORMAT', 'INVALID_INPUT', 'MS_UNAVAILABLE', 'SERVICE_UNAVAILABLE', 'TIMEOUT', 'NETWORK_ERROR'])
    .optional(),
})

/** Schema Zod de `FiscalInvoicingData` · valida la FORMA del bloque fiscal antes
 *  de aplicar las reglas de cumplimiento (`validateFiscalCompliance`). */
export const FiscalInvoicingDataSchema = z.object({
  vat_number_seller: z.string().optional(),
  vat_number_buyer: z.string().optional(),
  vies_seller: VIESValidationResultSchema.optional(),
  vies_buyer: VIESValidationResultSchema.optional(),
  operacion_tipo: z.enum([
    'nacional',
    'intracom_bienes',
    'intracom_servicios',
    'exportacion_bienes',
    'importacion_bienes',
    'b2c_distancia_oss',
    'b2c_importacion_ioss',
    'operacion_triangular',
    'no_sujeta',
  ]),
  regimen_iva: z
    .enum([
      'iva_repercutido_general',
      'inversion_sujeto_pasivo',
      'exenta_intracom',
      'exenta_exportacion',
      'oss',
      'ioss',
      'no_sujeta',
    ])
    .optional(),
  lugar_realizacion: z.string().optional(),
  reverse_charge_applies: z.boolean().optional(),
  reverse_charge_base_legal: z.string().optional(),
  modelo_349_clave: z.enum(['A', 'E', 'T', 'S', 'I', 'M', 'H']).optional(),
  oss_ioss: z
    .object({
      regimen: z.enum(['oss_union', 'oss_no_union', 'ioss']),
      numero_identificacion: z.string(),
      em_identificacion: z.string(),
    })
    .optional(),
  einvoice: z
    .object({
      estandar: z
        .enum(['en_16931', 'facturae', 'peppol_bis', 'ubl_2_1', 'cii', 'verifactu', 'ticketbai'])
        .optional(),
      referencia: z.string().optional(),
      requiere_estructurada: z.boolean().optional(),
      es_verifactu: z.boolean().optional(),
      hash_encadenado: z.string().optional(),
    })
    .optional(),
  factura_b2b_obligatoria_es: z.boolean().optional(),
})

/** Resultado de la validación de forma del bloque fiscal. */
export type FiscalShapeResult =
  | { ok: true; data: FiscalInvoicingData }
  | { ok: false; errors: string[] }

/** Valida la FORMA de un bloque fiscal recibido (e.g. desde API/ERP) antes de
 *  aplicar `validateFiscalCompliance`. */
export function validateFiscalShape(data: unknown): FiscalShapeResult {
  const r = FiscalInvoicingDataSchema.safeParse(data)
  if (r.success) return { ok: true, data: r.data as FiscalInvoicingData }
  return { ok: false, errors: r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`) }
}
