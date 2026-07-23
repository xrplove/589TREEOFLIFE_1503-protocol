// Pre-configured demo actors for the /demo page. Clicking one fills
// localStorage as if the user had completed registration manually, then
// redirects to the corresponding workspace. Marked with `1503:demoMode`
// flag so the workspace can show a "modo demo" banner.
//
// All emails / phones / tax IDs are deliberately fake (example-demo.* domains)
// so they can never collide with real registrations.

export type DemoActor = {
  /** Unique slug for the actor */
  id: string
  /** Short display name for the demo card */
  shortName: string
  /** One-line description for the demo card */
  description: string
  /** Why this actor matters as a demo case */
  highlight: string

  // Registration data
  homeCountry: string // ISO Alpha-2 uppercase
  sectorId: string
  entityCode: string
  kind: 'individual' | 'company'
  roleId: string

  // Form data (mirrors what RegistrationData.tsx stores)
  data: {
    firstName?: string
    lastName?: string
    taxId?: string
    companyName?: string
    legalRep?: string
    email: string
    phone: string
    address: string
    postalCode: string
    city: string
    yearsInSector?: string
  }

  /** Operator name shown in the workspace header (editable in-place) */
  displayName: string

  /** Inline SVG for the company logo. Converted to data URL on load. */
  logoSvg: string

  /** Inline SVG for the operator avatar (mostly individual kind). */
  avatarSvg?: string

  /** Fake document metadata. Stored as if the docs were uploaded but no
      actual blob is persisted — clicking a doc shows the "uploaded" tag
      without opening anything. Acceptable for demo navigation. */
  docs: { idx: number; label: string; filename: string; size: number }[]
}

// ──────────── Logo SVG helpers ────────────────────────────────────────

function svgLogo({
  bg,
  fg,
  initials,
  shape = 'hex',
}: {
  bg: string
  fg: string
  initials: string
  shape?: 'hex' | 'circle' | 'square'
}): string {
  const size = 200
  const r = size / 2
  let bgShape = ''
  if (shape === 'hex') {
    const pts: string[] = []
    for (let i = 0; i < 6; i++) {
      const a = ((i * 60 - 30) * Math.PI) / 180
      pts.push(`${r + (r - 10) * Math.cos(a)},${r + (r - 10) * Math.sin(a)}`)
    }
    bgShape = `<polygon points="${pts.join(' ')}" fill="${bg}" stroke="${fg}" stroke-width="3"/>`
  } else if (shape === 'circle') {
    bgShape = `<circle cx="${r}" cy="${r}" r="${r - 10}" fill="${bg}" stroke="${fg}" stroke-width="3"/>`
  } else {
    bgShape = `<rect x="10" y="10" width="${size - 20}" height="${size - 20}" rx="14" fill="${bg}" stroke="${fg}" stroke-width="3"/>`
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    ${bgShape}
    <text x="${r}" y="${r}" text-anchor="middle" dominant-baseline="central"
      font-family="system-ui,sans-serif" font-weight="700" font-size="${initials.length > 2 ? 56 : 80}"
      fill="${fg}">${initials}</text>
  </svg>`
}

function svgAvatar({ initials, color }: { initials: string; color: string }): string {
  const size = 200
  const r = size / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <circle cx="${r}" cy="${r}" r="${r - 8}" fill="${color}"/>
    <text x="${r}" y="${r}" text-anchor="middle" dominant-baseline="central"
      font-family="system-ui,sans-serif" font-weight="700" font-size="84" fill="#0E1118">${initials}</text>
  </svg>`
}

/** Convert raw SVG string to data URL ready for use in <img src> or
    persisted in localStorage. */
export function svgToDataUrl(svg: string): string {
  // Use base64 to avoid issues with quotes / hashes / non-ASCII chars.
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svg)))}`
  }
  // Fallback for SSR (we only use this client-side anyway).
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// ──────────── Actors ─────────────────────────────────────────────────

export const DEMO_ACTORS: DemoActor[] = [
  // 1. Individual abogada autónoma — caso individual + servicios profesionales
  {
    id: 'maria-gonzalez',
    shortName: 'María González',
    description: 'Abogada autónoma especializada en mercantil y societario',
    highlight: 'Caso individual (Autónomo) en sector Legal — servicios profesionales con carpeta digital del pedido como entrega futura',
    homeCountry: 'ES',
    sectorId: 'legal',
    entityCode: 'AUTO',
    kind: 'individual',
    roleId: 'abogados',
    data: {
      firstName: 'María',
      lastName: 'González Martín',
      taxId: '12345678Z',
      email: 'maria.gonzalez@example-demo.com',
      phone: '+34 612 345 678',
      address: 'Calle Velázquez 45, 4º B',
      postalCode: '28001',
      city: 'Madrid',
      yearsInSector: '12',
    },
    displayName: 'María González',
    logoSvg: svgLogo({ bg: '#0E1118', fg: '#F0B429', initials: 'MG', shape: 'circle' }),
    avatarSvg: svgAvatar({ initials: 'MG', color: '#F0B429' }),
    docs: [
      { idx: 0, label: 'Documento de identidad (DNI / pasaporte)', filename: 'dni-mgonzalez.pdf', size: 285_000 },
      { idx: 1, label: 'Alta de actividad / declaración censal', filename: 'modelo-036.pdf', size: 142_000 },
      { idx: 2, label: 'Certificado de titularidad de cuenta bancaria', filename: 'titularidad-bbva.pdf', size: 98_000 },
      { idx: 3, label: 'Cumplimiento AML / KYC / GDPR equivalente', filename: 'aml-kyc-2026.pdf', size: 312_000 },
    ],
  },

  // 2. Inmobiliaria empresarial S.L. — caso clásico empresa sin badge BORRADOR
  {
    id: 'inversiones-mediterraneo',
    shortName: 'Inversiones Mediterráneo',
    description: 'Inmobiliaria de costa especializada en residencial y oficina',
    highlight: 'Empresa S.L. en sector Inmobiliario — sin badge BORRADOR, set estándar de docs',
    homeCountry: 'ES',
    sectorId: 'inmobiliario',
    entityCode: 'SL',
    kind: 'company',
    roleId: 'inmobiliarias',
    data: {
      companyName: 'Inversiones Mediterráneo S.L.',
      taxId: 'B12345678',
      legalRep: 'Carlos Ramírez Ortiz',
      email: 'contacto@inversiones-mediterraneo-demo.com',
      phone: '+34 965 123 456',
      address: 'Avenida del Mar 22, planta 3',
      postalCode: '03001',
      city: 'Alicante',
    },
    displayName: 'Carlos Ramírez',
    logoSvg: svgLogo({ bg: '#00A3FF', fg: '#0E1118', initials: 'IM', shape: 'hex' }),
    docs: [
      { idx: 0, label: 'Certificado de constitución / acta fundacional', filename: 'escritura-constitucion.pdf', size: 1_240_000 },
      { idx: 1, label: 'Documento identificativo del representante legal (DNI / pasaporte)', filename: 'dni-cramirez.pdf', size: 280_000 },
      { idx: 2, label: 'Certificado de titularidad de cuenta bancaria', filename: 'titularidad-santander.pdf', size: 96_000 },
      { idx: 3, label: 'Certificación de calidad (ISO 9001 u otra) — opcional pero recomendada', filename: 'iso-9001-2025.pdf', size: 540_000 },
      { idx: 4, label: 'Cumplimiento normativa internacional (AML / KYC / GDPR equivalente)', filename: 'compliance-2026.pdf', size: 680_000 },
      { idx: 5, label: 'Certificado del Registro Mercantil', filename: 'reg-mercantil-alicante.pdf', size: 220_000 },
      { idx: 6, label: 'Alta en el IAE / modelo 036', filename: 'modelo-036.pdf', size: 140_000 },
    ],
  },

  // 3. Cooperativa Agroalimentaria del Levante — caso COOP-ES con badge BORRADOR
  {
    id: 'coop-levante',
    shortName: 'Coop. Agroalimentaria del Levante',
    description: 'Cooperativa de productores hortofrutícolas valencianos',
    highlight: 'COOP-ES — triggerea el badge naranja BORRADOR. Set propio: Registro de Cooperativas, Consejo Rector, estatutos en asamblea',
    homeCountry: 'ES',
    sectorId: 'agroalimentario',
    entityCode: 'COOP',
    kind: 'company',
    roleId: 'cooperativas',
    data: {
      companyName: 'Cooperativa Agroalimentaria del Levante S. Coop.',
      taxId: 'F87654321',
      legalRep: 'Ana Martínez Soler (presidenta del Consejo Rector)',
      email: 'info@coop-levante-demo.com',
      phone: '+34 963 234 567',
      address: 'Polígono Industrial Mediterráneo, Nave 17',
      postalCode: '46980',
      city: 'Valencia',
    },
    displayName: 'Ana Martínez',
    logoSvg: svgLogo({ bg: '#5DD9A4', fg: '#0E1118', initials: 'CL', shape: 'hex' }),
    docs: [
      { idx: 0, label: 'Certificación del Registro de Sociedades Cooperativas', filename: 'registro-coop-valencia.pdf', size: 380_000 },
      { idx: 1, label: 'Estatutos sociales aprobados en asamblea', filename: 'estatutos-asamblea-2024.pdf', size: 920_000 },
      { idx: 2, label: 'Acta de constitución del Consejo Rector', filename: 'acta-consejo-rector.pdf', size: 240_000 },
      { idx: 3, label: 'DNI / Pasaporte del presidente del Consejo Rector', filename: 'dni-amartinez.pdf', size: 270_000 },
      { idx: 4, label: 'Certificado de titularidad de cuenta bancaria', filename: 'titularidad-caixapopular.pdf', size: 92_000 },
      { idx: 5, label: 'Cumplimiento AML / KYC / GDPR equivalente', filename: 'aml-coop-2026.pdf', size: 410_000 },
    ],
  },

  // 4. Acerías del Norte S.A. — caso SA-ES grande con badge BORRADOR (memoria auditada)
  {
    id: 'acerias-norte',
    shortName: 'Acerías del Norte S.A.',
    description: 'Acería integral con producción de palanquilla y laminado',
    highlight: 'SA-ES grande — triggerea badge BORRADOR con "Memoria auditada anual" añadida al set estándar',
    homeCountry: 'ES',
    sectorId: 'metalurgico',
    entityCode: 'SA',
    kind: 'company',
    roleId: 'acerias',
    data: {
      companyName: 'Acerías del Norte S.A.',
      taxId: 'A11223344',
      legalRep: 'Javier Etxebarria Aguirre',
      email: 'comercial@acerias-norte-demo.com',
      phone: '+34 944 567 890',
      address: 'Polígono Industrial Asua, Calle Hierro 12',
      postalCode: '48150',
      city: 'Bilbao',
    },
    displayName: 'Javier Etxebarria',
    logoSvg: svgLogo({ bg: '#1E2530', fg: '#FF6B6B', initials: 'AN', shape: 'square' }),
    docs: [
      { idx: 0, label: 'Certificado de constitución / acta fundacional', filename: 'escritura-constitucion-1989.pdf', size: 1_840_000 },
      { idx: 1, label: 'Documento identificativo del representante legal (DNI / pasaporte)', filename: 'dni-jetxebarria.pdf', size: 290_000 },
      { idx: 2, label: 'Certificado de titularidad de cuenta bancaria', filename: 'titularidad-bbk.pdf', size: 100_000 },
      { idx: 3, label: 'Certificación de calidad (ISO 9001 u otra) — opcional pero recomendada', filename: 'iso-9001-iso-14001.pdf', size: 720_000 },
      { idx: 4, label: 'Cumplimiento normativa internacional (AML / KYC / GDPR equivalente)', filename: 'compliance-internacional.pdf', size: 540_000 },
      { idx: 5, label: 'Memoria auditada anual (ejercicio cerrado más reciente)', filename: 'memoria-auditada-2025.pdf', size: 2_400_000 },
      { idx: 6, label: 'Certificado del Registro Mercantil', filename: 'reg-mercantil-bizkaia.pdf', size: 230_000 },
      { idx: 7, label: 'Alta en el IAE / modelo 036', filename: 'modelo-036.pdf', size: 138_000 },
    ],
  },

  // 5. Tokyo Textiles 株式会社 — cross-border + idioma JP automático
  {
    id: 'tokyo-textiles',
    shortName: 'Tokyo Textiles 株式会社',
    description: '高級織物の老舗メーカー · Manufacturer of premium textiles since 1958',
    highlight: 'Cross-border desde Japón — workspace en japonés, KK (Kabushiki Kaisha), set estándar empresa sin badge',
    homeCountry: 'JP',
    sectorId: 'textil',
    entityCode: 'KK',
    kind: 'company',
    roleId: 'tejedurias',
    data: {
      companyName: 'Tokyo Textiles 株式会社',
      taxId: '0123456789012',
      legalRep: '田中 博 (Hiroshi Tanaka)',
      email: 'export@tokyo-textiles-demo.com',
      phone: '+81 3 1234 5678',
      address: '2-7-3 Nihonbashi, Chuo-ku',
      postalCode: '103-0027',
      city: 'Tokyo',
    },
    displayName: 'Hiroshi Tanaka',
    logoSvg: svgLogo({ bg: '#FF6B6B', fg: '#FFFFFF', initials: '東', shape: 'circle' }),
    docs: [
      { idx: 0, label: '設立証明書 / 定款', filename: 'teikan-tokyo-textiles.pdf', size: 980_000 },
      { idx: 1, label: '法的代表者の身分証明書(パスポート / 国民 ID)', filename: 'passport-tanaka.pdf', size: 240_000 },
      { idx: 2, label: '銀行口座の所有確認書', filename: 'mufg-account-verification.pdf', size: 86_000 },
      { idx: 3, label: '品質認証(ISO 9001 等)— 任意・推奨', filename: 'iso-9001-jp.pdf', size: 510_000 },
      { idx: 4, label: '国際コンプライアンス(AML / KYC / GDPR 相当)', filename: 'compliance-jp.pdf', size: 420_000 },
      { idx: 5, label: 'Certificado de registro (登記事項証明書)', filename: 'toki-jiko-shoumeisho.pdf', size: 190_000 },
      { idx: 6, label: 'Estatutos (定款)', filename: 'teikan-2024.pdf', size: 360_000 },
    ],
  },

  // 6. Cabinet Juridique Lefebvre SARL — cross-border + idioma FR + servicios
  {
    id: 'cabinet-lefebvre',
    shortName: 'Cabinet Juridique Lefebvre',
    description: 'Cabinet d’avocats parisien — droit des affaires et fiscalité',
    highlight: 'Cross-border desde Francia — workspace en francés, SARL en sector Legal',
    homeCountry: 'FR',
    sectorId: 'legal',
    entityCode: 'SARL',
    kind: 'company',
    roleId: 'bufetes',
    data: {
      companyName: 'Cabinet Juridique Lefebvre SARL',
      taxId: '12345678901234',
      legalRep: 'Sophie Lefebvre',
      email: 'contact@cabinet-lefebvre-demo.fr',
      phone: '+33 1 42 12 34 56',
      address: '12 Rue de Rivoli',
      postalCode: '75004',
      city: 'Paris',
    },
    displayName: 'Sophie Lefebvre',
    logoSvg: svgLogo({ bg: '#F0B429', fg: '#0E1118', initials: 'CL', shape: 'square' }),
    docs: [
      { idx: 0, label: 'Acte constitutif / extrait Kbis ou équivalent', filename: 'kbis-cabinet-lefebvre.pdf', size: 320_000 },
      { idx: 1, label: 'Pièce d’identité du représentant légal (passeport / CNI)', filename: 'passeport-lefebvre.pdf', size: 240_000 },
      { idx: 2, label: 'Attestation bancaire (RIB / IBAN officiel)', filename: 'rib-bnp-paribas.pdf', size: 88_000 },
      { idx: 3, label: 'Certification qualité (ISO 9001 ou autre) — optionnel mais recommandé', filename: 'iso-9001-fr.pdf', size: 480_000 },
      { idx: 4, label: 'Conformité internationale (LCB-FT / KYC / RGPD équivalent)', filename: 'rgpd-conformite.pdf', size: 410_000 },
      { idx: 5, label: 'Extrait Kbis (menos de 3 meses)', filename: 'kbis-recent.pdf', size: 180_000 },
      { idx: 6, label: 'Statuts de la société', filename: 'statuts-sarl-2024.pdf', size: 540_000 },
    ],
  },

  // 7. Pacific Realty LLC — cross-border + idioma EN + caso CCPA
  {
    id: 'pacific-realty',
    shortName: 'Pacific Realty LLC',
    description: 'Bay Area boutique brokerage — luxury and commercial real estate',
    highlight: 'Cross-border desde EEUU (California) — workspace en inglés, LLC en sector Inmobiliario',
    homeCountry: 'US',
    sectorId: 'inmobiliario',
    entityCode: 'LLC',
    kind: 'company',
    roleId: 'inmobiliarias',
    data: {
      companyName: 'Pacific Realty LLC',
      taxId: '12-3456789',
      legalRep: 'Jennifer Chen',
      email: 'broker@pacific-realty-demo.com',
      phone: '+1 415 555 0123',
      address: '500 Market Street, Suite 1200',
      postalCode: '94105',
      city: 'San Francisco',
    },
    displayName: 'Jennifer Chen',
    logoSvg: svgLogo({ bg: '#9D7AFF', fg: '#FFFFFF', initials: 'PR', shape: 'hex' }),
    docs: [
      { idx: 0, label: 'Certificate of incorporation / founding deed', filename: 'articles-of-organization-ca.pdf', size: 420_000 },
      { idx: 1, label: 'Legal representative ID document (passport / national ID)', filename: 'passport-jchen.pdf', size: 280_000 },
      { idx: 2, label: 'Bank account ownership certificate', filename: 'wells-fargo-verification.pdf', size: 92_000 },
      { idx: 3, label: 'Quality certification (ISO 9001 or other) — optional but recommended', filename: 'naf-certification.pdf', size: 380_000 },
      { idx: 4, label: 'International compliance (AML / KYC / GDPR equivalent)', filename: 'us-aml-ccpa.pdf', size: 510_000 },
      { idx: 5, label: 'EIN Letter (IRS)', filename: 'ein-letter-irs.pdf', size: 140_000 },
      { idx: 6, label: 'Articles of Incorporation / Organization', filename: 'articles-secstate-ca.pdf', size: 290_000 },
      { idx: 7, label: 'State Business License', filename: 'sf-business-license.pdf', size: 170_000 },
    ],
  },
]

export function getDemoActor(id: string): DemoActor | undefined {
  return DEMO_ACTORS.find((a) => a.id === id)
}
