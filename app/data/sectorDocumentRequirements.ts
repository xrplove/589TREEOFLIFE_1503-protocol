// Catálogo de documentación legal por sector · canónico v0.1 · 2026-05-29
//
// Fundamenta el sistema de documentación legal sectorial (Fase 1.6 ·
// ADR 0012). Cada Actor que se registra en 1503 debe aportar la
// documentación aplicable a su sector + subsector + rol + país.
//
// FILOSOFÍA · Audit-Ready by Design
// ---------------------------------
// Este catálogo se diseña EXHAUSTIVAMENTE asumiendo cumplimiento normativo.
// Cada requirement tiene status:
//   - 'subject_to_expert' (default · diseño completo · pendiente abogado fintech)
//   - 'validated' (tras dictamen C1)
//   - 'draft' (recién planteado · pendiente sourcing)
//   - 'deprecated' (sustituido)
//
// CATÁLOGO INICIAL v0.1
// ---------------------
// 15 requirements canónicos cubriendo:
//   - 4 universales (KYC personal · KYB mercantil · fiscal · seguros)
//   - 11 sectoriales clave (transporte AEO · ATEIA · agroalimentario CAAE ·
//     etc.)
//
// AMPLIACIONES PREVISTAS (cuando llegue dictamen experto sectorial)
// ----------------------------------------------------------------
// Cada sector tendrá típicamente 5-15 requirements adicionales según
// su normativa específica. Total estimado tras validación experta:
// 80-150 requirements catalogados.

import type { LocalizedLabel } from './actorGroups'
import type { TaxonomyStatus } from './actorGroups'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

/** Tipos canónicos de documento legal. */
export type DocumentType =
  | 'fiscal_id'                    // CIF/NIF/EORI/VAT UE
  | 'mercantile_registry'          // BORME · INPI · Handelsregister · Companies House · SEC · etc.
  | 'professional_license'         // licencia profesional sectorial
  | 'sectoral_certification'       // certificación específica del sector
  | 'sanitary_authorization'       // autorización sanitaria (AEMPS · EMA · FDA)
  | 'environmental_permit'         // permiso ambiental (EU EUDR · etc.)
  | 'fire_safety_certificate'      // certificado bomberos · seguridad
  | 'insurance_policy'             // póliza seguro responsabilidad civil
  | 'tax_certificate'              // certificado al corriente pagos AEAT
  | 'data_protection_registration' // registro AEPD si trata PII
  | 'union_chamber_membership'     // colegio profesional · cámara comercio
  | 'transport_license'            // licencia de transporte CETM/ATEIA
  | 'customs_authorization'        // AEO · EORI · operador económico autorizado
  | 'kyc_documentary'              // verificación documental Sumsub/Veriff
  | 'espr_compliance'              // cumplimiento ESPR (DPP)
  | 'eudr_compliance'              // cumplimiento EUDR (anti-deforestación)
  | 'cra_compliance'               // cumplimiento CRA (productos digitales)
  | 'sbom_published'               // SBOM publicado (CRA Art. 13)
  | 'energy_certification'         // IEE · eficiencia energética
  | 'other'

/** Alcance de aplicabilidad del requirement.
 *  Si un campo es NULL · aplica a TODOS los valores posibles. */
export type DocumentApplicabilityScope = {
  /** sectorIds aplicables · null = todos los sectores */
  sectors?: string[]
  /** subSectorIds (grupos en actorGroups) aplicables · null = todos del sector */
  subsectors?: string[]
  /** roleIds aplicables · null = todos los roles del subsector */
  roles?: string[]
  /** ISO 3166-1 alpha-2 países aplicables · null = todos los países */
  countries?: string[]
  /** Si true · aplica SOLO a personas jurídicas (empresa) · false = solo autónomos · null = ambos */
  legal_entity_kind?: 'individual' | 'company' | null
}

/** Operaciones que se BLOQUEAN si el documento falta o está vencido. */
export type BlockedOperation =
  | 'listing'        // no puede publicar productos
  | 'purchase'       // no puede comprar
  | 'transport'      // no puede firmar custody chain
  | 'escrow_release' // no se libera escrow
  | 'all'            // ninguna operación posible · bloqueo total

/** Requirement de documentación legal aplicable a un actor según su perfil. */
export type SectorDocumentRequirement = {
  /** ID estable kebab-case. */
  id: string

  /** Tipo canónico de documento. */
  document_type: DocumentType

  /** Etiqueta multilingüe del requirement (lo que ve el usuario). */
  label: LocalizedLabel

  /** Descripción para el usuario · por qué necesita este documento. */
  description: LocalizedLabel

  /** Alcance de aplicabilidad (sector · subsector · rol · país · entidad). */
  scope: DocumentApplicabilityScope

  /** Autoridad emisora del documento (ej. "AEAT" · "AEMPS" · "BORME"). */
  issuer_authority: LocalizedLabel

  /** URL oficial donde verificar/solicitar el documento. */
  issuer_authority_url?: string

  /** Plazo de renovación en meses · null = no caduca (e.g. número GTIN). */
  renewal_period_months: number | null

  /** ¿Obligatorio para operar? */
  mandatory: boolean

  /** Qué operaciones se bloquean si falta o está vencido. */
  blocks_operation_if_missing: BlockedOperation[]

  /** Base legal (ej. "AMLR Art. 14" · "ESPR Art. 9" · "Ley 10/2010 Art. 4"). */
  legal_basis: string

  /** Estado de validación experta. */
  status: TaxonomyStatus
}

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO CANÓNICO v0.1
// ════════════════════════════════════════════════════════════════════════════

export const SECTOR_DOCUMENT_REQUIREMENTS: SectorDocumentRequirement[] = [
  // ──────────────────────────────────────────────────────────────────────
  // UNIVERSALES · aplican a todos los sectores (4 requirements)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'universal-kyc-personal',
    document_type: 'kyc_documentary',
    label: {
      es: 'Documento identidad personal (DNI/Pasaporte)',
      en: 'Personal ID (National ID/Passport)',
      fr: 'Pièce d\'identité personnelle',
      de: 'Persönlicher Ausweis',
      it: 'Documento identità personale',
      pt: 'Documento de identidade pessoal',
      zh: '个人身份证件',
      ja: '個人身分証明書',
    },
    description: {
      es: 'Documento oficial de identidad del representante legal · verificación KYC obligatoria conforme AMLR + Ley 10/2010 PBC/FT.',
      en: 'Official ID document of legal representative · KYC verification mandatory under AMLR + Ley 10/2010.',
      fr: 'Document officiel d\'identité du représentant légal · vérification KYC obligatoire (AMLR + Ley 10/2010).',
      de: 'Offizielles Ausweisdokument des gesetzlichen Vertreters · KYC-Verifizierung verpflichtend (AMLR + Ley 10/2010).',
      it: 'Documento ufficiale di identità del rappresentante legale · verifica KYC obbligatoria (AMLR + Ley 10/2010).',
      pt: 'Documento oficial de identidade do representante legal · verificação KYC obrigatória (AMLR + Ley 10/2010).',
      zh: '法定代表人官方身份证件 · KYC验证强制（AMLR + Ley 10/2010）。',
      ja: '法定代表者の公的身分証明書 · KYC検証必須（AMLR + Ley 10/2010）。',
    },
    scope: {}, // universal · todos
    issuer_authority: {
      es: 'Autoridad emisora del país',
      en: 'Country-issuing authority',
      fr: 'Autorité émettrice du pays',
      de: 'Ausstellende Behörde des Landes',
      it: 'Autorità emittente del paese',
      pt: 'Autoridade emissora do país',
      zh: '国家颁发机构',
      ja: '国の発行機関',
    },
    renewal_period_months: null, // caduca según documento original (DNI 10 años · Pasaporte 10 años)
    mandatory: true,
    blocks_operation_if_missing: ['all'],
    legal_basis: 'AMLR Art. 14 + Ley 10/2010 Art. 4',
    status: 'subject_to_expert',
  },
  {
    id: 'universal-mercantile-registry-es',
    document_type: 'mercantile_registry',
    label: {
      es: 'Inscripción Registro Mercantil (BORME)',
      en: 'Mercantile Registry inscription (BORME)',
      fr: 'Inscription au registre du commerce (BORME)',
      de: 'Handelsregistereintrag (BORME)',
      it: 'Iscrizione registro commerciale (BORME)',
      pt: 'Inscrição registo comercial (BORME)',
      zh: '商业登记（BORME）',
      ja: '商業登記（BORME）',
    },
    description: {
      es: 'Documento del Registro Mercantil que acredita la existencia legal y vigencia de la empresa española.',
      en: 'Document from BORME (Spanish Mercantile Registry) certifying legal existence and current status.',
      fr: 'Document du BORME (registre du commerce espagnol) attestant l\'existence juridique.',
      de: 'BORME-Dokument (Spanisches Handelsregister) zur Bestätigung der rechtlichen Existenz.',
      it: 'Documento BORME (Registro Commerciale Spagnolo) che attesta l\'esistenza legale.',
      pt: 'Documento BORME (Registo Comercial Espanhol) certificando existência legal.',
      zh: 'BORME（西班牙商业登记）证明法人存在的文件',
      ja: 'BORME（スペイン商業登記）法人存在証明書',
    },
    scope: { countries: ['ES'], legal_entity_kind: 'company' },
    issuer_authority: {
      es: 'Colegio de Registradores Mercantiles',
      en: 'Spanish Mercantile Registry',
      fr: 'Registre du commerce espagnol',
      de: 'Spanisches Handelsregister',
      it: 'Registro Commerciale Spagnolo',
      pt: 'Registo Comercial Espanhol',
      zh: '西班牙商业登记处',
      ja: 'スペイン商業登記',
    },
    issuer_authority_url: 'https://www.registradores.org',
    renewal_period_months: 12, // anual al alta · luego al cambio
    mandatory: true,
    blocks_operation_if_missing: ['all'],
    legal_basis: 'AMLR Art. 14 + Código Comercio ES + Ley 10/2010 Art. 4.2',
    status: 'subject_to_expert',
  },
  {
    id: 'universal-tax-certificate-es',
    document_type: 'tax_certificate',
    label: {
      es: 'Certificado al corriente AEAT',
      en: 'AEAT current-status tax certificate',
      fr: 'Certificat fiscal AEAT à jour',
      de: 'AEAT-Aktualitätsbescheinigung',
      it: 'Certificato AEAT in regola',
      pt: 'Certificado AEAT em dia',
      zh: 'AEAT税务结清证明',
      ja: 'AEAT税務状況証明',
    },
    description: {
      es: 'Certificado que acredita estar al corriente en obligaciones tributarias con la AEAT (España).',
      en: 'Certificate proving tax obligations are up-to-date with AEAT (Spain).',
      fr: 'Certificat attestant des obligations fiscales à jour avec l\'AEAT.',
      de: 'AEAT-Bescheinigung über aktuelle Steuerverpflichtungen.',
      it: 'Certificato che attesta gli obblighi fiscali in regola con AEAT.',
      pt: 'Certificado de obrigações fiscais em dia com a AEAT.',
      zh: 'AEAT税务义务结清证明（西班牙）',
      ja: 'AEAT税務義務最新証明（スペイン）',
    },
    scope: { countries: ['ES'] },
    issuer_authority: {
      es: 'Agencia Tributaria (AEAT)',
      en: 'Spanish Tax Agency (AEAT)',
      fr: 'Agence fiscale espagnole (AEAT)',
      de: 'Spanische Steuerbehörde (AEAT)',
      it: 'Agenzia delle Entrate spagnola (AEAT)',
      pt: 'Agência Tributária espanhola (AEAT)',
      zh: '西班牙税务局（AEAT）',
      ja: 'スペイン税務庁（AEAT）',
    },
    issuer_authority_url: 'https://sede.agenciatributaria.gob.es',
    renewal_period_months: 6, // semestral
    mandatory: true,
    blocks_operation_if_missing: ['listing', 'purchase'],
    legal_basis: 'Ley 58/2003 Tributaria + AEAT requisitos contratación administrativa',
    status: 'subject_to_expert',
  },
  {
    id: 'universal-rc-insurance',
    document_type: 'insurance_policy',
    label: {
      es: 'Póliza seguro responsabilidad civil',
      en: 'Civil liability insurance policy',
      fr: 'Police d\'assurance responsabilité civile',
      de: 'Haftpflichtversicherungspolice',
      it: 'Polizza di responsabilità civile',
      pt: 'Apólice de seguro de responsabilidade civil',
      zh: '民事责任保险单',
      ja: '民事責任保険証券',
    },
    description: {
      es: 'Póliza de seguro de responsabilidad civil general · obligatoria para empresas que facturen > 100k€ anuales o trabajen con consumidores finales.',
      en: 'General civil liability insurance · mandatory for companies > €100k turnover or working with consumers.',
      fr: 'Assurance responsabilité civile générale · obligatoire si chiffre d\'affaires > 100k€.',
      de: 'Allgemeine Haftpflichtversicherung · pflicht bei Umsatz > 100k€.',
      it: 'Assicurazione responsabilità civile generale · obbligatoria oltre 100k€ fatturato.',
      pt: 'Seguro responsabilidade civil geral · obrigatório acima de 100k€ faturação.',
      zh: '一般民事责任保险 · 营业额超过10万欧元强制',
      ja: '一般民事責任保険 · 売上10万ユーロ超で必須',
    },
    scope: { legal_entity_kind: 'company' },
    issuer_authority: {
      es: 'Compañía aseguradora autorizada',
      en: 'Authorized insurance company',
      fr: 'Compagnie d\'assurance autorisée',
      de: 'Autorisierte Versicherungsgesellschaft',
      it: 'Compagnia assicurativa autorizzata',
      pt: 'Companhia de seguros autorizada',
      zh: '授权保险公司',
      ja: '認可保険会社',
    },
    renewal_period_months: 12,
    mandatory: false, // recomendado · no bloquea operación si <100k€
    blocks_operation_if_missing: [],
    legal_basis: 'Recomendación 1503 · obligatorio ciertos contratos B2B',
    status: 'subject_to_expert',
  },

  // ──────────────────────────────────────────────────────────────────────
  // TRANSPORTE · sector específico (2 requirements clave)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'transporte-aeo-customs',
    document_type: 'customs_authorization',
    label: {
      es: 'Autorización AEO (Operador Económico Autorizado)',
      en: 'AEO (Authorized Economic Operator) authorization',
      fr: 'Autorisation OEA (Opérateur Économique Agréé)',
      de: 'AEO-Zulassung (Zugelassener Wirtschaftsbeteiligter)',
      it: 'Autorizzazione AEO (Operatore Economico Autorizzato)',
      pt: 'Autorização OEA (Operador Económico Autorizado)',
      zh: 'AEO（经认证的经济运营商）授权',
      ja: 'AEO（認定経済運営者）認証',
    },
    description: {
      es: 'Autorización AEO conforme UCC (Reg. UE 952/2013) · permite ventajas aduaneras y simplificación procedimientos cross-border.',
      en: 'AEO authorization under UCC (Reg. EU 952/2013) · grants customs advantages and cross-border simplification.',
      fr: 'Autorisation OEA conforme CDU · avantages douaniers + simplification cross-border.',
      de: 'AEO-Zulassung gemäß UZK · Zollvorteile + Cross-Border-Vereinfachung.',
      it: 'Autorizzazione AEO conforme CDU · vantaggi doganali + semplificazione cross-border.',
      pt: 'Autorização OEA conforme CAU · vantagens aduaneiras + simplificação cross-border.',
      zh: 'UCC（欧盟法规952/2013）下的AEO授权 · 海关优惠 + 跨境简化',
      ja: 'UCC（EU規則952/2013）に基づくAEO認証 · 通関優遇 + 越境簡素化',
    },
    scope: { sectors: ['transporte'] },
    issuer_authority: {
      es: 'Departamento Aduanas e Impuestos Especiales AEAT',
      en: 'Customs Department AEAT',
      fr: 'Département des douanes AEAT',
      de: 'Zollabteilung AEAT',
      it: 'Dipartimento dogane AEAT',
      pt: 'Departamento aduaneiro AEAT',
      zh: 'AEAT海关部门',
      ja: 'AEAT税関部門',
    },
    issuer_authority_url: 'https://sede.agenciatributaria.gob.es/Sede/aduanas/operador-economico-autorizado.html',
    renewal_period_months: 36, // re-evaluación cada 3 años
    mandatory: false, // recomendable · no obligatorio
    blocks_operation_if_missing: [],
    legal_basis: 'UCC Reg. UE 952/2013 Art. 38',
    status: 'subject_to_expert',
  },
  {
    id: 'transporte-ateia-membership',
    document_type: 'union_chamber_membership',
    label: {
      es: 'Pertenencia ATEIA (transitarios España)',
      en: 'ATEIA membership (Spanish freight forwarders)',
      fr: 'Adhésion ATEIA (commissionnaires de transport Espagne)',
      de: 'ATEIA-Mitgliedschaft (Spanische Spediteure)',
      it: 'Appartenenza ATEIA (spedizionieri Spagna)',
      pt: 'Pertença ATEIA (transitários Espanha)',
      zh: 'ATEIA会员（西班牙货运代理）',
      ja: 'ATEIA加盟（スペイン貨物代理店）',
    },
    description: {
      es: 'Pertenencia a ATEIA (Asociación Transitarios España) · garantía profesional para operaciones cross-border + grupaje LCL.',
      en: 'ATEIA membership · professional warranty for cross-border operations + LCL groupage.',
      fr: 'Adhésion ATEIA · garantie professionnelle cross-border + groupage LCL.',
      de: 'ATEIA-Mitgliedschaft · Berufsgarantie für Cross-Border + LCL-Sammlung.',
      it: 'Appartenenza ATEIA · garanzia professionale cross-border + groupage LCL.',
      pt: 'Pertença ATEIA · garantia profissional cross-border + grupagem LCL.',
      zh: 'ATEIA会员 · 跨境业务和LCL拼箱专业担保',
      ja: 'ATEIA加盟 · 越境業務とLCL混載の専門保証',
    },
    scope: {
      sectors: ['transporte'],
      subsectors: ['transitarios'], // o el que aplique
      countries: ['ES'],
    },
    issuer_authority: {
      es: 'ATEIA · Asociación Transitarios España',
      en: 'ATEIA · Spanish Freight Forwarders Association',
      fr: 'ATEIA · Association espagnole des commissionnaires',
      de: 'ATEIA · Spanischer Speditionsverband',
      it: 'ATEIA · Associazione spedizionieri Spagna',
      pt: 'ATEIA · Associação Transitários Espanha',
      zh: 'ATEIA · 西班牙货运代理协会',
      ja: 'ATEIA · スペイン貨物代理店協会',
    },
    issuer_authority_url: 'https://feteia.org',
    renewal_period_months: 12,
    mandatory: false, // requisito comercial · no normativo estricto
    blocks_operation_if_missing: [],
    legal_basis: 'Estatutos ATEIA · garantía profesional',
    status: 'subject_to_expert',
  },

  // ──────────────────────────────────────────────────────────────────────
  // AGROALIMENTARIO · sector específico (2 requirements clave)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'agroalimentario-sanitary-registry',
    document_type: 'sanitary_authorization',
    label: {
      es: 'Registro Sanitario de Alimentos (RGSEAA)',
      en: 'Food Sanitary Registry (RGSEAA)',
      fr: 'Registre sanitaire des aliments (RGSEAA)',
      de: 'Lebensmittel-Sanitätsregister (RGSEAA)',
      it: 'Registro Sanitario Alimentare (RGSEAA)',
      pt: 'Registo Sanitário Alimentar (RGSEAA)',
      zh: '食品卫生登记（RGSEAA）',
      ja: '食品衛生登録（RGSEAA）',
    },
    description: {
      es: 'Registro General Sanitario de Empresas Alimentarias y Alimentos (RGSEAA) · obligatorio AESAN para operadores alimentarios.',
      en: 'General Sanitary Registry of Food Companies (RGSEAA) · mandatory AESAN for food operators.',
      fr: 'Registre sanitaire général des entreprises alimentaires (RGSEAA) · obligatoire AESAN.',
      de: 'Allgemeines Sanitätsregister für Lebensmittelunternehmen (RGSEAA) · AESAN-pflichtig.',
      it: 'Registro Sanitario Generale Imprese Alimentari (RGSEAA) · obbligatorio AESAN.',
      pt: 'Registo Sanitário Geral de Empresas Alimentares (RGSEAA) · obrigatório AESAN.',
      zh: '食品企业一般卫生登记（RGSEAA）· AESAN强制要求',
      ja: '食品企業一般衛生登録（RGSEAA）· AESAN必須',
    },
    scope: { sectors: ['agroalimentario'], countries: ['ES'] },
    issuer_authority: {
      es: 'AESAN · Agencia Española Seguridad Alimentaria',
      en: 'AESAN · Spanish Food Safety Agency',
      fr: 'AESAN · Agence espagnole sécurité alimentaire',
      de: 'AESAN · Spanische Lebensmittelsicherheitsbehörde',
      it: 'AESAN · Agenzia Spagnola Sicurezza Alimentare',
      pt: 'AESAN · Agência Espanhola Segurança Alimentar',
      zh: 'AESAN · 西班牙食品安全局',
      ja: 'AESAN · スペイン食品安全庁',
    },
    issuer_authority_url: 'https://www.aesan.gob.es/AECOSAN/web/seguridad_alimentaria/subseccion/RGSEAA.htm',
    renewal_period_months: null, // permanente con actualización por cambios
    mandatory: true,
    blocks_operation_if_missing: ['listing'],
    legal_basis: 'RD 191/2011 + Reg. UE 178/2002 + Reg. UE 852/2004',
    status: 'subject_to_expert',
  },

  // ──────────────────────────────────────────────────────────────────────
  // SALUD · sector específico (1 requirement clave)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'salud-aemps-license',
    document_type: 'sanitary_authorization',
    label: {
      es: 'Licencia AEMPS productos sanitarios',
      en: 'AEMPS license medical devices',
      fr: 'Licence AEMPS dispositifs médicaux',
      de: 'AEMPS-Lizenz Medizinprodukte',
      it: 'Licenza AEMPS dispositivi medici',
      pt: 'Licença AEMPS dispositivos médicos',
      zh: 'AEMPS医疗器械许可证',
      ja: 'AEMPS医療機器ライセンス',
    },
    description: {
      es: 'Licencia AEMPS conforme MDR Reg. UE 2017/745 + IVDR Reg. UE 2017/746 · obligatoria para distribuidores/importadores productos sanitarios.',
      en: 'AEMPS license under MDR/IVDR · mandatory for distributors/importers of medical devices.',
      fr: 'Licence AEMPS conforme MDR/IVDR · obligatoire distributeurs/importateurs dispositifs médicaux.',
      de: 'AEMPS-Lizenz gemäß MDR/IVDR · pflicht für Verteiler/Importeure Medizinprodukte.',
      it: 'Licenza AEMPS conforme MDR/IVDR · obbligatoria distributori/importatori dispositivi medici.',
      pt: 'Licença AEMPS conforme MDR/IVDR · obrigatória distribuidores/importadores dispositivos médicos.',
      zh: 'AEMPS许可证（MDR/IVDR）· 医疗器械分销商/进口商强制',
      ja: 'AEMPSライセンス（MDR/IVDR）· 医療機器流通業者/輸入業者必須',
    },
    scope: { sectors: ['salud'] },
    issuer_authority: {
      es: 'AEMPS · Agencia Española Medicamentos y Productos Sanitarios',
      en: 'AEMPS · Spanish Agency of Medicines and Medical Devices',
      fr: 'AEMPS · Agence espagnole des médicaments',
      de: 'AEMPS · Spanische Arzneimittelbehörde',
      it: 'AEMPS · Agenzia Spagnola Farmaci',
      pt: 'AEMPS · Agência Espanhola Medicamentos',
      zh: 'AEMPS · 西班牙药品和医疗器械局',
      ja: 'AEMPS · スペイン医薬品医療機器庁',
    },
    issuer_authority_url: 'https://www.aemps.gob.es',
    renewal_period_months: 60, // 5 años MDR
    mandatory: true,
    blocks_operation_if_missing: ['listing'],
    legal_basis: 'MDR Reg. UE 2017/745 + IVDR Reg. UE 2017/746',
    status: 'subject_to_expert',
  },

  // ──────────────────────────────────────────────────────────────────────
  // PRODUCTOS FÍSICOS · ESPR + EUDR + CRA (3 requirements transversales)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'physical-espr-dpp-compliance',
    document_type: 'espr_compliance',
    label: {
      es: 'Conformidad ESPR · DPP completado',
      en: 'ESPR compliance · DPP completed',
      fr: 'Conformité ESPR · PDP complété',
      de: 'ESPR-Konformität · DPP abgeschlossen',
      it: 'Conformità ESPR · DPP completato',
      pt: 'Conformidade ESPR · PDP completo',
      zh: 'ESPR合规 · DPP完成',
      ja: 'ESPR適合 · DPP完了',
    },
    description: {
      es: 'Cumplimiento Reg. UE 2024/1781 ESPR · Digital Product Passport completado con 6 capas A-F + 10 grupos normativos v1.1.',
      en: 'ESPR compliance · Digital Product Passport completed with 6 layers + 10 normative groups.',
      fr: 'Conformité ESPR · Passeport Produit Numérique complété avec 6 couches + 10 groupes normatifs.',
      de: 'ESPR-Konformität · Digitaler Produktpass mit 6 Schichten + 10 normativen Gruppen.',
      it: 'Conformità ESPR · Passaporto Digitale di Prodotto completato con 6 livelli + 10 gruppi normativi.',
      pt: 'Conformidade ESPR · Passaporte Digital de Produto com 6 camadas + 10 grupos normativos.',
      zh: 'ESPR合规 · 6层+10个规范组的数字产品护照',
      ja: 'ESPR適合 · 6層+10規範グループのデジタル製品パスポート',
    },
    scope: {
      sectors: [
        'agroalimentario',
        'automocion',
        'energia',
        'salud',
        'metalurgico',
        'textil',
        'transporte',
        'tecnologia',
      ],
    },
    issuer_authority: {
      es: '1503 · validación interna + Audit Council certificadoras',
      en: '1503 · internal validation + Audit Council',
      fr: '1503 · validation interne + Audit Council',
      de: '1503 · interne Validierung + Audit Council',
      it: '1503 · validazione interna + Audit Council',
      pt: '1503 · validação interna + Audit Council',
      zh: '1503 · 内部验证 + 审计委员会',
      ja: '1503 · 内部検証 + 監査委員会',
    },
    renewal_period_months: 24, // bi-anual
    mandatory: true,
    blocks_operation_if_missing: ['listing'],
    legal_basis: 'Reg. UE 2024/1781 ESPR Art. 9 · DPP obligatorio escalonado 2026-2030',
    status: 'subject_to_expert',
  },
  {
    id: 'physical-eudr-dds',
    document_type: 'eudr_compliance',
    label: {
      es: 'Declaración Diligencia Debida EUDR',
      en: 'EUDR Due Diligence Statement',
      fr: 'Déclaration Diligence Raisonnable EUDR',
      de: 'EUDR-Sorgfaltspflichterklärung',
      it: 'Dichiarazione Due Diligence EUDR',
      pt: 'Declaração Due Diligence EUDR',
      zh: 'EUDR尽职调查声明',
      ja: 'EUDRデューデリジェンス宣言',
    },
    description: {
      es: 'DDS registrada en TRACES NT EUDR para commodities Anexo I (café · cacao · palma · soja · madera · caucho · ganado bovino).',
      en: 'DDS registered in TRACES NT EUDR for Annex I commodities.',
      fr: 'DDS enregistrée TRACES NT EUDR pour commodities Annexe I.',
      de: 'DDS in TRACES NT EUDR registriert für Anhang-I-Rohstoffe.',
      it: 'DDS registrata TRACES NT EUDR per commodities Allegato I.',
      pt: 'DDS registada TRACES NT EUDR para commodities Anexo I.',
      zh: 'TRACES NT EUDR中附件I商品的DDS登记',
      ja: 'TRACES NT EUDRで附属書I商品のDDS登録',
    },
    scope: {
      sectors: ['agroalimentario'],
      // Aplica solo si producto en alcance EUDR (in_eudr_scope=true en DPP)
    },
    issuer_authority: {
      es: 'Comisión Europea · TRACES NT',
      en: 'European Commission · TRACES NT',
      fr: 'Commission européenne · TRACES NT',
      de: 'Europäische Kommission · TRACES NT',
      it: 'Commissione Europea · TRACES NT',
      pt: 'Comissão Europeia · TRACES NT',
      zh: '欧盟委员会 · TRACES NT',
      ja: '欧州委員会 · TRACES NT',
    },
    issuer_authority_url: 'https://webgate.ec.europa.eu/tracesnt',
    renewal_period_months: 12, // anual con cada lote
    mandatory: true,
    blocks_operation_if_missing: ['listing'],
    legal_basis: 'Reg. UE 2023/1115 EUDR Art. 9.1.d',
    status: 'subject_to_expert',
  },
  {
    id: 'physical-cra-sbom',
    document_type: 'sbom_published',
    label: {
      es: 'SBOM publicado (CRA)',
      en: 'SBOM published (CRA)',
      fr: 'SBOM publié (CRA)',
      de: 'SBOM veröffentlicht (CRA)',
      it: 'SBOM pubblicato (CRA)',
      pt: 'SBOM publicado (CRA)',
      zh: '已发布SBOM（CRA）',
      ja: 'SBOM公開済（CRA）',
    },
    description: {
      es: 'Software Bill of Materials (CycloneDX o SPDX) público + canal vulnerability disclosure conforme CRA Art. 13.',
      en: 'Software Bill of Materials (CycloneDX/SPDX) published + vulnerability disclosure channel per CRA Art. 13.',
      fr: 'SBOM (CycloneDX/SPDX) publié + canal divulgation vulnérabilités CRA Art. 13.',
      de: 'SBOM (CycloneDX/SPDX) veröffentlicht + Sicherheitslückenoffenlegungskanal CRA Art. 13.',
      it: 'SBOM (CycloneDX/SPDX) pubblicato + canale divulgazione vulnerabilità CRA Art. 13.',
      pt: 'SBOM (CycloneDX/SPDX) publicado + canal divulgação vulnerabilidades CRA Art. 13.',
      zh: '已发布SBOM（CycloneDX/SPDX）+ CRA第13条漏洞披露渠道',
      ja: 'SBOM（CycloneDX/SPDX）公開 + CRA第13条脆弱性開示チャネル',
    },
    scope: {
      sectors: ['tecnologia'],
      // Aplica si has_digital_elements=true en DPP
    },
    issuer_authority: {
      es: 'Fabricante · auto-emitido',
      en: 'Manufacturer · self-issued',
      fr: 'Fabricant · auto-émis',
      de: 'Hersteller · selbst ausgestellt',
      it: 'Produttore · auto-emesso',
      pt: 'Fabricante · auto-emitido',
      zh: '制造商 · 自行发行',
      ja: '製造者 · 自己発行',
    },
    renewal_period_months: 12, // mantener actualizado
    mandatory: true,
    blocks_operation_if_missing: ['listing'],
    legal_basis: 'CRA Reg. UE 2024/2847 Art. 13',
    status: 'subject_to_expert',
  },

  // ──────────────────────────────────────────────────────────────────────
  // LEGAL · sector específico (1 requirement)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'legal-colegio-abogados',
    document_type: 'union_chamber_membership',
    label: {
      es: 'Colegiación Colegio Abogados',
      en: 'Bar Association membership',
      fr: 'Inscription au Barreau',
      de: 'Anwaltskammermitgliedschaft',
      it: 'Iscrizione Ordine Avvocati',
      pt: 'Inscrição Ordem dos Advogados',
      zh: '律师协会会员',
      ja: '弁護士会登録',
    },
    description: {
      es: 'Colegiación vigente en Colegio Profesional de Abogados · obligatoria para ejercer abogacía en España.',
      en: 'Active Bar Association membership · mandatory to practice law in Spain.',
      fr: 'Inscription au Barreau · obligatoire pour exercer le droit en Espagne.',
      de: 'Aktive Anwaltskammermitgliedschaft · pflicht für Rechtsanwaltspraxis in Spanien.',
      it: 'Iscrizione attiva all\'Ordine Avvocati · obbligatoria per esercitare in Spagna.',
      pt: 'Inscrição ativa na Ordem dos Advogados · obrigatória para advogar em Espanha.',
      zh: '有效的律师协会会员 · 在西班牙执业律师强制',
      ja: '弁護士会登録有効 · スペイン法律実務必須',
    },
    scope: {
      sectors: ['legal'],
      subsectors: ['abogados'],
      countries: ['ES'],
    },
    issuer_authority: {
      es: 'Consejo General de la Abogacía Española',
      en: 'Spanish General Council of Lawyers',
      fr: 'Conseil général des Barreaux espagnols',
      de: 'Spanischer Anwaltskammerverband',
      it: 'Consiglio Generale Avvocati Spagnoli',
      pt: 'Conselho Geral da Advocacia Espanhola',
      zh: '西班牙律师总理事会',
      ja: 'スペイン弁護士総会',
    },
    issuer_authority_url: 'https://www.abogacia.es',
    renewal_period_months: 12,
    mandatory: true,
    blocks_operation_if_missing: ['all'],
    legal_basis: 'Ley 34/2006 Acceso Profesiones Abogacía + Estatuto General Abogacía',
    status: 'subject_to_expert',
  },

  // ──────────────────────────────────────────────────────────────────────
  // INMOBILIARIO · sector específico (1 requirement)
  // ──────────────────────────────────────────────────────────────────────
  {
    id: 'inmobiliario-iee-energy',
    document_type: 'energy_certification',
    label: {
      es: 'Certificado Eficiencia Energética (CEE/IEE)',
      en: 'Energy Performance Certificate',
      fr: 'Diagnostic de Performance Énergétique',
      de: 'Energieausweis',
      it: 'Attestato Prestazione Energetica',
      pt: 'Certificado Desempenho Energético',
      zh: '能源性能证书',
      ja: 'エネルギー性能証明書',
    },
    description: {
      es: 'Certificado Eficiencia Energética (CEE) · obligatorio para inmuebles en venta o alquiler conforme RD 390/2021 + EPBD.',
      en: 'Energy Performance Certificate · mandatory for property sale/rental under RD 390/2021 + EPBD.',
      fr: 'DPE · obligatoire vente/location immobilière (EPBD).',
      de: 'Energieausweis · pflicht bei Immobilienverkauf/Vermietung (EPBD).',
      it: 'APE · obbligatorio vendita/locazione immobiliare (EPBD).',
      pt: 'CEE · obrigatório venda/arrendamento imobiliário (EPBD).',
      zh: '能源性能证书 · 房产销售/租赁强制（EPBD）',
      ja: 'エネルギー性能証明書 · 不動産売買/賃貸必須（EPBD）',
    },
    scope: {
      sectors: ['inmobiliario'],
      subsectors: ['edificacion'],
    },
    issuer_authority: {
      es: 'Técnico certificador acreditado · registro CCAA',
      en: 'Accredited certifier · regional registry',
      fr: 'Certificateur agréé · registre régional',
      de: 'Akkreditierter Zertifizierer · regionales Register',
      it: 'Certificatore accreditato · registro regionale',
      pt: 'Certificador acreditado · registo regional',
      zh: '认证认可技术人员 · 区域登记',
      ja: '認定技術者 · 地域登録',
    },
    renewal_period_months: 120, // 10 años validez
    mandatory: true,
    blocks_operation_if_missing: ['listing'],
    legal_basis: 'RD 390/2021 + Dir. UE 2010/31 EPBD (revisada 2024/1275)',
    status: 'subject_to_expert',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/** Filtra requirements aplicables a un actor según su perfil. */
export function getApplicableRequirements(
  actor: {
    sector_id?: string
    subsector_id?: string
    role_id?: string
    country_code?: string
    legal_entity_kind?: 'individual' | 'company'
  },
): SectorDocumentRequirement[] {
  return SECTOR_DOCUMENT_REQUIREMENTS.filter((req) => {
    const { scope } = req

    // Sector
    if (scope.sectors && actor.sector_id && !scope.sectors.includes(actor.sector_id)) {
      return false
    }

    // Subsector
    if (scope.subsectors && actor.subsector_id && !scope.subsectors.includes(actor.subsector_id)) {
      return false
    }

    // Role
    if (scope.roles && actor.role_id && !scope.roles.includes(actor.role_id)) {
      return false
    }

    // Country
    if (scope.countries && actor.country_code && !scope.countries.includes(actor.country_code)) {
      return false
    }

    // Legal entity kind
    if (
      scope.legal_entity_kind &&
      actor.legal_entity_kind &&
      scope.legal_entity_kind !== actor.legal_entity_kind
    ) {
      return false
    }

    return true
  })
}

/** Filtra requirements mandatory que bloquean una operación específica. */
export function getBlockingRequirements(
  actor: {
    sector_id?: string
    subsector_id?: string
    role_id?: string
    country_code?: string
    legal_entity_kind?: 'individual' | 'company'
  },
  operation: 'listing' | 'purchase' | 'transport' | 'escrow_release',
): SectorDocumentRequirement[] {
  return getApplicableRequirements(actor).filter(
    (req) =>
      req.mandatory &&
      (req.blocks_operation_if_missing.includes(operation) ||
        req.blocks_operation_if_missing.includes('all')),
  )
}

/** Calcula días hasta expiración (devuelve número negativo si vencido). */
export function daysUntilExpiration(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  const expDate = new Date(expiresAt)
  const now = new Date()
  return Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/** Helper canonical · ¿documento próximo a vencer (≤30 días)? */
export function isExpiringSoon(expiresAt: string | null): boolean {
  const days = daysUntilExpiration(expiresAt)
  return days !== null && days >= 0 && days <= 30
}

/** Helper canonical · ¿documento vencido? */
export function isExpired(expiresAt: string | null): boolean {
  const days = daysUntilExpiration(expiresAt)
  return days !== null && days < 0
}
