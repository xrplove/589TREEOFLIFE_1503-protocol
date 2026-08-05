// Lightweight i18n for the country register page (/register/[code]).
// 8 supported languages cover the bulk of B2B traffic; the rest fall back to EN.

export type Lang = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja'

/** ISO Alpha-2 country code (UPPERCASE) → preferred display language. */
const COUNTRY_TO_LANG: Record<string, Lang> = {
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CL: 'es', CO: 'es', PE: 'es', VE: 'es',
  EC: 'es', BO: 'es', PY: 'es', UY: 'es', CR: 'es', GT: 'es', HN: 'es',
  NI: 'es', PA: 'es', CU: 'es', DO: 'es', SV: 'es',
  GQ: 'es', // Guinea Ecuatorial: español oficial (~70%, único país de África con español). Antes caía a 'en'.
  AD: 'es', // Andorra: catalán oficial (no entre los 8); español muy presente. Decisión de José §1.2. Antes 'en'.
  // English (anglophone + international fallback for many)
  US: 'en', CA: 'en', AU: 'en', NZ: 'en', GB: 'en', IE: 'en', IN: 'en',
  SG: 'en', MY: 'en', PH: 'en', ZA: 'en', NG: 'en', KE: 'en', GH: 'en',
  UG: 'en', TZ: 'en', ZM: 'en', ZW: 'en', BW: 'en', NA: 'en', LR: 'en',
  SL: 'en', GM: 'en', MW: 'en', RW: 'en', SS: 'en', LS: 'en', SZ: 'en',
  // French
  FR: 'fr', BE: 'fr', MC: 'fr', LU: 'fr',
  CI: 'fr', SN: 'fr', ML: 'fr', BF: 'fr', NE: 'fr', TD: 'fr',
  MG: 'fr', CM: 'fr', GA: 'fr', CG: 'fr', CD: 'fr', BI: 'fr',
  DJ: 'fr', GN: 'fr', BJ: 'fr', TG: 'fr', KM: 'fr',
  CF: 'fr', // Rep. Centroafricana: francés oficial (con sango, que no está entre los 8). Antes caía a 'en'.
  // §1.2 (decisión de José): lengua de negocios / cooficial → 'fr'. Antes caían a 'en'.
  MA: 'fr', TN: 'fr', DZ: 'fr', // Magreb (árabe oficial; francés = lengua de negocios)
  LB: 'fr', // Líbano (Código de Comercio de base francesa; francés muy presente)
  MU: 'fr', SC: 'fr', // Mauricio, Seychelles (francés/criollo muy presentes; inglés cooficial)
  MR: 'fr', // Mauritania (árabe oficial; francés = lengua de negocios)
  VU: 'fr', // Vanuatu (francés CO-oficial constitucional)
  // German
  DE: 'de', AT: 'de', CH: 'de', LI: 'de', // CH a 'de': alemán 62.6% (mayoría) vs francés 22.9%. Antes 'fr'.
  // Italian
  IT: 'it', SM: 'it',
  // Portuguese
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt', CV: 'pt', GW: 'pt', ST: 'pt', TL: 'pt',
  // Chinese
  CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh',
  // Japanese
  JP: 'ja',
}

/** Get the language to display for a given country code. Falls back to EN. */
export function langForCountry(code: string): Lang {
  return COUNTRY_TO_LANG[code.toUpperCase()] || 'en'
}

export type RegisterStrings = {
  back: string // "Volver a {continent}"
  eyebrow: string // "1503 · CAPA 3 · REGISTRO DE EMPRESA"
  login: string // "Iniciar sesión →"
  registerEyebrow: string // "REGISTRA TU EMPRESA EN"
  promise: string // long paragraph about being linked but operating worldwide
  legalEyebrow: string // "TIPOLOGÍAS LEGALES"
  legalTitle: string // "Cómo se llama tu empresa aquí"
  legalBody: string // "Estas son las formas jurídicas reconocidas..."
  legalRegistry: string // "Registro:"
  legalTaxId: string // "Identificación fiscal:"
  docsEyebrow: string // "DOCUMENTOS REQUERIDOS"
  docsTitle: string // "Qué tendrás que subir"
  docsBody: string // "1503 sube tus certificados..."
  docsDraftBadge: string // "BORRADOR · pendiente revisión legal"
  docsDraftBody: string // "Lista preliminar..."
  ctaEyebrow: string // "SIGUIENTE PASO"
  ctaTitle: string // "Crea tu cuenta de empresa en {country}"
  ctaBody: string // "Continúa al alta. Tres minutos..."
  ctaPrimary: string // "Crear cuenta de empresa →"
  ctaSecondary: string // "Ya tengo cuenta · Iniciar sesión"
  trustFooter: string // "Tus documentos viajan cifrados..."
  /** Documents required for individual entities (autónomos, sole traders…). */
  individualDocs: string[]
  /** Documents required for incorporated companies (S.L., LLC, AG…). */
  companyDocs: string[]
  /** Hint shown in the documents card when no legal form is picked yet. */
  selectEntityFirst: string
  // ── Sector + role picker (new card between legal entity and docs) ──
  sectorEyebrow: string // "SECTOR Y ROL"
  sectorTitle: string // "Tu sector y especialidad"
  sectorBody: string // "Elige el sector donde operas..."
  sectorPickFirst: string // hint when no entity selected
  subsectorLabel: string // "Subsector" — header del paso intermedio
  subsectorPickFirst: string // hint en la lista de roles cuando no hay subsector
  rolePickFirst: string // hint when no sector selected
  roleLabel: string // "Rol específico"
  roleOptional: string // "(opcional para empresas)"
  roleDraftNote: string // "Clasificación provisional · pendiente de validación sectorial"
  // ── Data card (operator / company details) ──
  dataEyebrow: string // "DATOS DE REGISTRO"
  dataTitleIndividual: string // "Datos del operador"
  dataTitleCompany: string // "Datos de la empresa"
  dataBody: string // explanatory text
  dataPickFirst: string // hint when no entity selected
  dataFirstName: string // "Nombre"
  dataLastName: string // "Apellidos"
  dataTaxIdIndividual: string // "DNI / Pasaporte" (company uses country taxIdLabel)
  dataCompanyName: string // "Razón social"
  dataLegalRep: string // "Representante legal"
  dataEmail: string // "Email"
  dataEmailHint: string // "Te avisaremos aquí cuando otro actor te escriba"
  dataPhone: string // "Teléfono"
  dataAddress: string // "Dirección"
  dataFiscalAddress: string // "Dirección fiscal"
  dataPostalCode: string // "Código postal"
  dataCity: string // "Ciudad"
  dataYearsInSector: string // "Años en el sector"
  dataOptional: string // "(opcional)"
  dataEmailInvalid: string // "Email no válido"
}

const ES: RegisterStrings = {
  back: 'Volver a {continent}',
  eyebrow: '1503 · CAPA 3 · REGISTRO DE EMPRESA',
  login: 'Iniciar sesión →',
  registerEyebrow: 'REGISTRA TU EMPRESA EN',
  promise:
    'Tu empresa quedará vinculada a {country} pero podrá operar con cualquier país del mundo. Pagos y cumplimiento de exportación sin fronteras, en una sola herramienta.',
  legalEyebrow: 'TIPOLOGÍAS LEGALES',
  legalTitle: 'Cómo se llama tu empresa aquí',
  legalBody: 'Estas son las formas jurídicas reconocidas en {country}. Selecciona la tuya en el siguiente paso.',
  legalRegistry: 'Registro:',
  legalTaxId: 'Identificación fiscal:',
  docsEyebrow: 'DOCUMENTOS REQUERIDOS',
  docsTitle: 'Qué tendrás que subir',
  docsBody:
    '1503 sube tus certificados a almacenamiento cifrado. Forman tu KYC verificado: cualquier contraparte ve que estás verificado, sin ver tus documentos privados.',
  docsDraftBadge: 'BORRADOR · pendiente revisión legal',
  docsDraftBody:
    'Lista preliminar para esta forma jurídica. Un asesor jurídico la validará antes de exigirla. Si tu entidad necesita docs distintos, escríbenos y los ajustamos.',
  ctaEyebrow: 'SIGUIENTE PASO',
  ctaTitle: 'Crea tu cuenta de empresa en {country}',
  ctaBody:
    'Continúa al alta. Tres minutos de registro, KYC verificable, acceso completo. Plataforma gratis · 0,5 % por transacción · sin permanencia.',
  ctaPrimary: 'Crear cuenta de empresa →',
  ctaSecondary: 'Ya tengo cuenta · Iniciar sesión',
  trustFooter: 'Tus documentos viajan cifrados · KYC verificado · Cumplimiento de exportación',
  individualDocs: [
    'Documento de identidad (DNI / pasaporte)',
    'Alta de actividad / declaración censal',
    'Certificado de titularidad de cuenta bancaria',
    'Cumplimiento AML / KYC / GDPR equivalente',
  ],
  companyDocs: [
    'Certificado de constitución / acta fundacional',
    'Documento identificativo del representante legal (DNI / pasaporte)',
    'Certificado de titularidad de cuenta bancaria',
    'Certificación de calidad (ISO 9001 u otra) — opcional pero recomendada',
    'Cumplimiento normativa internacional (AML / KYC / GDPR equivalente)',
  ],
  selectEntityFirst: 'Selecciona tu forma jurídica para ver los documentos que necesitamos.',
  sectorEyebrow: 'SECTOR Y ROL',
  sectorTitle: 'Tu sector y especialidad',
  sectorBody: 'Elige el sector donde operas en 1503. Otros actores verán este sector en tu ficha pública.',
  sectorPickFirst: 'Selecciona primero tu forma jurídica.',
  subsectorLabel: 'Subsector',
  subsectorPickFirst: 'Selecciona primero un subsector.',
  rolePickFirst: 'Selecciona primero un sector.',
  roleLabel: 'Rol específico',
  roleOptional: '(opcional para empresas)',
  roleDraftNote: 'Clasificación provisional · pendiente de validación sectorial',
  dataEyebrow: 'DATOS DE REGISTRO',
  dataTitleIndividual: 'Datos del operador',
  dataTitleCompany: 'Datos de la empresa',
  dataBody: 'Necesitamos estos datos para crear tu cuenta y poder avisarte por email cuando otro actor te escriba o haya movimiento en tus operaciones.',
  dataPickFirst: 'Selecciona primero tu forma jurídica.',
  dataFirstName: 'Nombre',
  dataLastName: 'Apellidos',
  dataTaxIdIndividual: 'DNI / Pasaporte',
  dataCompanyName: 'Razón social',
  dataLegalRep: 'Representante legal',
  dataEmail: 'Email',
  dataEmailHint: 'Te avisaremos aquí cuando otro actor te escriba o haya movimiento.',
  dataPhone: 'Teléfono',
  dataAddress: 'Dirección',
  dataFiscalAddress: 'Dirección fiscal',
  dataPostalCode: 'Código postal',
  dataCity: 'Ciudad',
  dataYearsInSector: 'Años en el sector',
  dataOptional: '(opcional)',
  dataEmailInvalid: 'Email no válido',
}

const EN: RegisterStrings = {
  back: 'Back to {continent}',
  eyebrow: '1503 · LAYER 3 · COMPANY REGISTRATION',
  login: 'Sign in →',
  registerEyebrow: 'REGISTER YOUR COMPANY IN',
  promise:
    'Your company will be linked to {country} but free to trade with any country in the world. Borderless payments and export compliance, in a single tool.',
  legalEyebrow: 'LEGAL ENTITY TYPES',
  legalTitle: 'How your company is called here',
  legalBody: 'These are the legal entity types recognised in {country}. Pick yours in the next step.',
  legalRegistry: 'Registry:',
  legalTaxId: 'Tax ID:',
  docsEyebrow: 'REQUIRED DOCUMENTS',
  docsTitle: 'What you will need to upload',
  docsBody:
    '1503 uploads your certificates to encrypted storage. They form your verified KYC: any counterparty sees you are verified without seeing your private documents.',
  docsDraftBadge: 'DRAFT · pending legal review',
  docsDraftBody:
    'Preliminary list for this legal form. Counsel will validate it before we require it. If your entity needs different docs, write to us and we will adjust them.',
  ctaEyebrow: 'NEXT STEP',
  ctaTitle: 'Create your company account in {country}',
  ctaBody:
    'Continue to sign up. Three minutes to register, verifiable KYC, full access. Platform free · 0.5 % per transaction · no commitment.',
  ctaPrimary: 'Create company account →',
  ctaSecondary: 'I already have an account · Sign in',
  trustFooter: 'Your documents travel encrypted · Verified KYC · Export compliance',
  individualDocs: [
    'ID document (passport / national ID)',
    'Activity registration / tax registration certificate',
    'Bank account ownership certificate',
    'AML / KYC / GDPR equivalent compliance',
  ],
  companyDocs: [
    'Certificate of incorporation / founding deed',
    'Legal representative ID document (passport / national ID)',
    'Bank account ownership certificate',
    'Quality certification (ISO 9001 or other) — optional but recommended',
    'International compliance (AML / KYC / GDPR equivalent)',
  ],
  selectEntityFirst: 'Pick your legal form to see the documents we need.',
  sectorEyebrow: 'SECTOR & ROLE',
  sectorTitle: 'Your sector and specialty',
  sectorBody: 'Choose the sector you operate in on 1503. Other actors will see this sector on your public profile.',
  sectorPickFirst: 'Pick your legal form first.',
  subsectorLabel: 'Subsector',
  subsectorPickFirst: 'Pick a subsector first.',
  rolePickFirst: 'Pick a sector first.',
  roleLabel: 'Specific role',
  roleOptional: '(optional for companies)',
  roleDraftNote: 'Provisional classification · pending sector validation',
  dataEyebrow: 'REGISTRATION DETAILS',
  dataTitleIndividual: 'Operator details',
  dataTitleCompany: 'Company details',
  dataBody: 'We need these details to create your account and notify you by email when another actor reaches out or there is movement in your operations.',
  dataPickFirst: 'Pick your legal form first.',
  dataFirstName: 'First name',
  dataLastName: 'Last name',
  dataTaxIdIndividual: 'ID / passport',
  dataCompanyName: 'Legal name',
  dataLegalRep: 'Legal representative',
  dataEmail: 'Email',
  dataEmailHint: 'We will notify you here when another actor reaches out or there is activity.',
  dataPhone: 'Phone',
  dataAddress: 'Address',
  dataFiscalAddress: 'Registered address',
  dataPostalCode: 'Postal code',
  dataCity: 'City',
  dataYearsInSector: 'Years in the sector',
  dataOptional: '(optional)',
  dataEmailInvalid: 'Invalid email',
}

const FR: RegisterStrings = {
  back: 'Retour à {continent}',
  eyebrow: '1503 · COUCHE 3 · INSCRIPTION ENTREPRISE',
  login: 'Se connecter →',
  registerEyebrow: 'INSCRIVEZ VOTRE ENTREPRISE EN',
  promise:
    'Votre entreprise sera rattachée à {country} mais pourra commercer avec tous les pays du monde. Paiements et conformité à l’export sans frontières, dans un seul outil.',
  legalEyebrow: 'FORMES JURIDIQUES',
  legalTitle: 'Comment votre entreprise s’appelle ici',
  legalBody: 'Voici les formes juridiques reconnues en {country}. Choisissez la vôtre à l’étape suivante.',
  legalRegistry: 'Registre :',
  legalTaxId: 'Identifiant fiscal :',
  docsEyebrow: 'DOCUMENTS REQUIS',
  docsTitle: 'Ce que vous devrez télécharger',
  docsBody:
    '1503 stocke vos certificats de manière chiffrée. Ils constituent votre KYC vérifié : toute contrepartie voit que vous êtes vérifié sans accéder à vos documents privés.',
  docsDraftBadge: 'BROUILLON · revue juridique en attente',
  docsDraftBody:
    'Liste préliminaire pour cette forme juridique. Un conseiller juridique la validera avant que nous l’exigions. Si votre entité a besoin d’autres documents, écrivez-nous et nous les ajusterons.',
  ctaEyebrow: 'ÉTAPE SUIVANTE',
  ctaTitle: 'Créez votre compte entreprise en {country}',
  ctaBody:
    'Passez à l’inscription. Trois minutes pour s’enregistrer, KYC vérifiable, accès complet. Plateforme gratuite · 0,5 % par transaction · sans engagement.',
  ctaPrimary: 'Créer un compte entreprise →',
  ctaSecondary: 'J’ai déjà un compte · Se connecter',
  trustFooter: 'Documents chiffrés · KYC vérifié · Conformité à l’export',
  individualDocs: [
    'Pièce d’identité (passeport / CNI)',
    'Déclaration de début d’activité / immatriculation',
    'Attestation bancaire (RIB / IBAN officiel)',
    'Conformité LCB-FT / KYC / RGPD équivalent',
  ],
  companyDocs: [
    'Acte constitutif / extrait Kbis ou équivalent',
    'Pièce d’identité du représentant légal (passeport / CNI)',
    'Attestation bancaire (RIB / IBAN officiel)',
    'Certification qualité (ISO 9001 ou autre) — optionnel mais recommandé',
    'Conformité internationale (LCB-FT / KYC / RGPD équivalent)',
  ],
  selectEntityFirst: 'Sélectionnez votre forme juridique pour voir les documents requis.',
  sectorEyebrow: 'SECTEUR & RÔLE',
  sectorTitle: 'Votre secteur et spécialité',
  sectorBody: 'Choisissez le secteur d’activité sur 1503. D’autres acteurs verront ce secteur sur votre fiche publique.',
  sectorPickFirst: 'Sélectionnez d’abord votre forme juridique.',
  subsectorLabel: 'Sous-secteur',
  subsectorPickFirst: 'Sélectionnez d’abord un sous-secteur.',
  rolePickFirst: 'Sélectionnez d’abord un secteur.',
  roleLabel: 'Rôle précis',
  roleOptional: '(facultatif pour les entreprises)',
  roleDraftNote: 'Classification provisoire · en attente de validation sectorielle',
  dataEyebrow: 'DONNÉES D’INSCRIPTION',
  dataTitleIndividual: 'Données de l’opérateur',
  dataTitleCompany: 'Données de l’entreprise',
  dataBody: 'Nous avons besoin de ces informations pour créer votre compte et vous avertir par email lorsqu’un autre acteur vous contacte ou qu’il y a du mouvement dans vos opérations.',
  dataPickFirst: 'Sélectionnez d’abord votre forme juridique.',
  dataFirstName: 'Prénom',
  dataLastName: 'Nom',
  dataTaxIdIndividual: 'CNI / passeport',
  dataCompanyName: 'Raison sociale',
  dataLegalRep: 'Représentant légal',
  dataEmail: 'Email',
  dataEmailHint: 'Nous vous préviendrons ici lorsqu’un autre acteur vous contacte ou qu’il y a de l’activité.',
  dataPhone: 'Téléphone',
  dataAddress: 'Adresse',
  dataFiscalAddress: 'Adresse fiscale',
  dataPostalCode: 'Code postal',
  dataCity: 'Ville',
  dataYearsInSector: 'Années dans le secteur',
  dataOptional: '(facultatif)',
  dataEmailInvalid: 'Email non valide',
}

const DE: RegisterStrings = {
  back: 'Zurück zu {continent}',
  eyebrow: '1503 · EBENE 3 · UNTERNEHMENSREGISTRIERUNG',
  login: 'Anmelden →',
  registerEyebrow: 'REGISTRIEREN SIE IHR UNTERNEHMEN IN',
  promise:
    'Ihr Unternehmen wird mit {country} verknüpft, kann aber weltweit mit jedem Land Handel treiben. Grenzenlose Zahlungen und Exportkonformität in einem einzigen Werkzeug.',
  legalEyebrow: 'RECHTSFORMEN',
  legalTitle: 'So heißt Ihr Unternehmen hier',
  legalBody: 'Dies sind die in {country} anerkannten Rechtsformen. Wählen Sie Ihre im nächsten Schritt.',
  legalRegistry: 'Register:',
  legalTaxId: 'Steuer-ID:',
  docsEyebrow: 'ERFORDERLICHE DOKUMENTE',
  docsTitle: 'Was Sie hochladen müssen',
  docsBody:
    '1503 speichert Ihre Zertifikate verschlüsselt. Sie bilden Ihr verifiziertes KYC: jede Gegenpartei sieht, dass Sie geprüft sind, ohne Ihre privaten Dokumente einzusehen.',
  docsDraftBadge: 'ENTWURF · ausstehende juristische Prüfung',
  docsDraftBody:
    'Vorläufige Liste für diese Rechtsform. Ein Rechtsberater wird sie validieren, bevor wir sie verlangen. Wenn Ihr Rechtsträger andere Dokumente benötigt, schreiben Sie uns und wir passen sie an.',
  ctaEyebrow: 'NÄCHSTER SCHRITT',
  ctaTitle: 'Eröffnen Sie Ihr Unternehmenskonto in {country}',
  ctaBody:
    'Weiter zur Anmeldung. Drei Minuten Registrierung, verifizierbare KYC, voller Zugriff. Plattform kostenlos · 0,5 % pro Transaktion · keine Bindung.',
  ctaPrimary: 'Unternehmenskonto erstellen →',
  ctaSecondary: 'Ich habe bereits ein Konto · Anmelden',
  trustFooter: 'Verschlüsselte Dokumente · Verifiziertes KYC · Exportkonformität',
  individualDocs: [
    'Ausweisdokument (Pass / Personalausweis)',
    'Gewerbeanmeldung / steuerliche Anmeldung',
    'Nachweis über Bankkonto-Inhaberschaft',
    'AML / KYC / DSGVO-äquivalente Compliance',
  ],
  companyDocs: [
    'Gründungsurkunde / Gesellschaftsvertrag',
    'Ausweisdokument des gesetzlichen Vertreters (Pass / Personalausweis)',
    'Nachweis über Bankkonto-Inhaberschaft',
    'Qualitätszertifizierung (ISO 9001 o. ä.) — optional, empfohlen',
    'Internationale Compliance (AML / KYC / DSGVO-äquivalent)',
  ],
  selectEntityFirst: 'Wählen Sie zuerst Ihre Rechtsform, um die benötigten Dokumente zu sehen.',
  sectorEyebrow: 'SEKTOR & ROLLE',
  sectorTitle: 'Ihr Sektor und Spezialgebiet',
  sectorBody: 'Wählen Sie den Sektor, in dem Sie auf 1503 tätig sind. Andere Akteure sehen diesen Sektor in Ihrem öffentlichen Profil.',
  sectorPickFirst: 'Wählen Sie zuerst Ihre Rechtsform.',
  subsectorLabel: 'Untersektor',
  subsectorPickFirst: 'Wählen Sie zuerst einen Untersektor.',
  rolePickFirst: 'Wählen Sie zuerst einen Sektor.',
  roleLabel: 'Spezifische Rolle',
  roleOptional: '(optional für Unternehmen)',
  roleDraftNote: 'Vorläufige Einstufung · ausstehende Branchenvalidierung',
  dataEyebrow: 'REGISTRIERUNGSDATEN',
  dataTitleIndividual: 'Daten des Betreibers',
  dataTitleCompany: 'Unternehmensdaten',
  dataBody: 'Diese Angaben benötigen wir, um Ihr Konto zu erstellen und Sie per E-Mail zu benachrichtigen, wenn ein anderer Akteur Sie kontaktiert oder sich in Ihren Vorgängen etwas tut.',
  dataPickFirst: 'Wählen Sie zuerst Ihre Rechtsform.',
  dataFirstName: 'Vorname',
  dataLastName: 'Nachname',
  dataTaxIdIndividual: 'Personalausweis / Reisepass',
  dataCompanyName: 'Firmenname',
  dataLegalRep: 'Gesetzlicher Vertreter',
  dataEmail: 'E-Mail',
  dataEmailHint: 'Wir benachrichtigen Sie hier, wenn ein Akteur Sie kontaktiert oder Aktivität auftritt.',
  dataPhone: 'Telefon',
  dataAddress: 'Adresse',
  dataFiscalAddress: 'Geschäftsadresse',
  dataPostalCode: 'Postleitzahl',
  dataCity: 'Stadt',
  dataYearsInSector: 'Jahre im Sektor',
  dataOptional: '(optional)',
  dataEmailInvalid: 'Ungültige E-Mail',
}

const IT: RegisterStrings = {
  back: 'Torna a {continent}',
  eyebrow: '1503 · LIVELLO 3 · REGISTRAZIONE AZIENDA',
  login: 'Accedi →',
  registerEyebrow: 'REGISTRA LA TUA AZIENDA IN',
  promise:
    'La tua azienda sarà collegata a {country} ma potrà operare con qualsiasi paese del mondo. Pagamenti e conformità all’export senza confini, in un unico strumento.',
  legalEyebrow: 'FORME GIURIDICHE',
  legalTitle: 'Come si chiama la tua azienda qui',
  legalBody: 'Queste sono le forme giuridiche riconosciute in {country}. Scegli la tua nel passaggio successivo.',
  legalRegistry: 'Registro:',
  legalTaxId: 'Identificativo fiscale:',
  docsEyebrow: 'DOCUMENTI RICHIESTI',
  docsTitle: 'Cosa dovrai caricare',
  docsBody:
    '1503 conserva i tuoi certificati in archiviazione cifrata. Costituiscono il tuo KYC verificato: ogni controparte vede che sei verificato senza vedere i tuoi documenti privati.',
  docsDraftBadge: 'BOZZA · revisione legale in attesa',
  docsDraftBody:
    'Elenco preliminare per questa forma giuridica. Un consulente legale lo convaliderà prima che lo richiediamo. Se la tua entità necessita di documenti diversi, scrivici e li adatteremo.',
  ctaEyebrow: 'PROSSIMO PASSO',
  ctaTitle: 'Crea il tuo account aziendale in {country}',
  ctaBody:
    'Continua con la registrazione. Tre minuti, KYC verificabile, accesso completo. Piattaforma gratuita · 0,5 % per transazione · senza vincoli.',
  ctaPrimary: 'Crea account aziendale →',
  ctaSecondary: 'Ho già un account · Accedi',
  trustFooter: 'Documenti cifrati · KYC verificato · Conformità all’export',
  individualDocs: [
    'Documento d’identità (passaporto / carta)',
    'Apertura di partita IVA / iscrizione tributaria',
    'Attestazione di intestazione conto bancario',
    'Compliance AML / KYC / GDPR equivalente',
  ],
  companyDocs: [
    'Atto costitutivo / visura camerale',
    'Documento d’identità del rappresentante legale (passaporto / carta)',
    'Attestazione di intestazione conto bancario',
    'Certificazione di qualità (ISO 9001 o altra) — facoltativa ma consigliata',
    'Compliance internazionale (AML / KYC / GDPR equivalente)',
  ],
  selectEntityFirst: 'Seleziona prima la tua forma giuridica per vedere i documenti necessari.',
  sectorEyebrow: 'SETTORE E RUOLO',
  sectorTitle: 'Il tuo settore e specializzazione',
  sectorBody: 'Scegli il settore in cui operi su 1503. Gli altri attori vedranno questo settore sulla tua scheda pubblica.',
  sectorPickFirst: 'Seleziona prima la tua forma giuridica.',
  subsectorLabel: 'Sottosettore',
  subsectorPickFirst: 'Seleziona prima un sottosettore.',
  rolePickFirst: 'Seleziona prima un settore.',
  roleLabel: 'Ruolo specifico',
  roleOptional: '(facoltativo per le imprese)',
  roleDraftNote: 'Classificazione provvisoria · in attesa di validazione settoriale',
  dataEyebrow: 'DATI DI REGISTRAZIONE',
  dataTitleIndividual: 'Dati dell’operatore',
  dataTitleCompany: 'Dati dell’azienda',
  dataBody: 'Abbiamo bisogno di questi dati per creare il tuo account e avvisarti via email quando un altro attore ti contatta o c’è movimento nelle tue operazioni.',
  dataPickFirst: 'Seleziona prima la tua forma giuridica.',
  dataFirstName: 'Nome',
  dataLastName: 'Cognome',
  dataTaxIdIndividual: 'Carta d’identità / passaporto',
  dataCompanyName: 'Ragione sociale',
  dataLegalRep: 'Rappresentante legale',
  dataEmail: 'Email',
  dataEmailHint: 'Ti avviseremo qui quando un altro attore ti contatta o c’è attività.',
  dataPhone: 'Telefono',
  dataAddress: 'Indirizzo',
  dataFiscalAddress: 'Indirizzo fiscale',
  dataPostalCode: 'Codice postale',
  dataCity: 'Città',
  dataYearsInSector: 'Anni nel settore',
  dataOptional: '(facoltativo)',
  dataEmailInvalid: 'Email non valida',
}

const PT: RegisterStrings = {
  back: 'Voltar a {continent}',
  eyebrow: '1503 · CAMADA 3 · REGISTO DE EMPRESA',
  login: 'Entrar →',
  registerEyebrow: 'REGISTE A SUA EMPRESA EM',
  promise:
    'A sua empresa ficará vinculada a {country} mas poderá operar com qualquer país do mundo. Pagamentos e conformidade na exportação sem fronteiras, numa só ferramenta.',
  legalEyebrow: 'FORMAS JURÍDICAS',
  legalTitle: 'Como a sua empresa se chama aqui',
  legalBody: 'Estas são as formas jurídicas reconhecidas em {country}. Escolha a sua no próximo passo.',
  legalRegistry: 'Registo:',
  legalTaxId: 'Identificação fiscal:',
  docsEyebrow: 'DOCUMENTOS NECESSÁRIOS',
  docsTitle: 'O que terá de carregar',
  docsBody:
    '1503 guarda os seus certificados em armazenamento cifrado. Formam o seu KYC verificado: qualquer contraparte vê que está verificado sem aceder aos seus documentos privados.',
  docsDraftBadge: 'RASCUNHO · revisão legal pendente',
  docsDraftBody:
    'Lista preliminar para esta forma jurídica. Um consultor jurídico irá validá-la antes de a exigirmos. Se a sua entidade precisa de documentos diferentes, escreva-nos e ajustamo-los.',
  ctaEyebrow: 'PRÓXIMO PASSO',
  ctaTitle: 'Crie a sua conta de empresa em {country}',
  ctaBody:
    'Continue para o registo. Três minutos, KYC verificável, acesso completo. Plataforma gratuita · 0,5 % por transação · sem permanência.',
  ctaPrimary: 'Criar conta de empresa →',
  ctaSecondary: 'Já tenho conta · Entrar',
  trustFooter: 'Documentos cifrados · KYC verificado · Conformidade na exportação',
  individualDocs: [
    'Documento de identidade (passaporte / BI)',
    'Início de actividade / inscrição fiscal',
    'Comprovativo de titularidade da conta bancária',
    'Conformidade AML / KYC / RGPD equivalente',
  ],
  companyDocs: [
    'Certidão de constituição / pacto social',
    'Documento de identificação do representante legal (passaporte / BI)',
    'Comprovativo de titularidade da conta bancária',
    'Certificação de qualidade (ISO 9001 ou outra) — opcional mas recomendada',
    'Conformidade internacional (AML / KYC / RGPD equivalente)',
  ],
  selectEntityFirst: 'Seleciona primeiro a tua forma jurídica para ver os documentos necessários.',
  sectorEyebrow: 'SETOR E PAPEL',
  sectorTitle: 'O teu setor e especialidade',
  sectorBody: 'Escolhe o setor em que operas na 1503. Outros atores verão este setor na tua ficha pública.',
  sectorPickFirst: 'Seleciona primeiro a tua forma jurídica.',
  subsectorLabel: 'Subsetor',
  subsectorPickFirst: 'Seleciona primeiro um subsetor.',
  rolePickFirst: 'Seleciona primeiro um setor.',
  roleLabel: 'Papel específico',
  roleOptional: '(opcional para empresas)',
  roleDraftNote: 'Classificação provisória · pendente de validação setorial',
  dataEyebrow: 'DADOS DE REGISTO',
  dataTitleIndividual: 'Dados do operador',
  dataTitleCompany: 'Dados da empresa',
  dataBody: 'Precisamos destes dados para criar a tua conta e avisar-te por email quando outro ator te contactar ou houver movimento nas tuas operações.',
  dataPickFirst: 'Seleciona primeiro a tua forma jurídica.',
  dataFirstName: 'Nome',
  dataLastName: 'Apelidos',
  dataTaxIdIndividual: 'BI / passaporte',
  dataCompanyName: 'Denominação social',
  dataLegalRep: 'Representante legal',
  dataEmail: 'Email',
  dataEmailHint: 'Avisamos-te aqui quando outro ator te contactar ou houver atividade.',
  dataPhone: 'Telefone',
  dataAddress: 'Morada',
  dataFiscalAddress: 'Morada fiscal',
  dataPostalCode: 'Código postal',
  dataCity: 'Cidade',
  dataYearsInSector: 'Anos no setor',
  dataOptional: '(opcional)',
  dataEmailInvalid: 'Email inválido',
}

const ZH: RegisterStrings = {
  back: '返回 {continent}',
  eyebrow: '1503 · 第三层 · 企业注册',
  login: '登录 →',
  registerEyebrow: '在以下国家/地区注册您的企业',
  promise:
    '您的企业将与 {country} 关联,但可与全球任何国家进行交易。跨境支付与出口合规,集于一体。',
  legalEyebrow: '法律实体类型',
  legalTitle: '您的企业在此地的名称',
  legalBody: '以下是在 {country} 认可的法律实体类型。请在下一步中选择您的类型。',
  legalRegistry: '注册:',
  legalTaxId: '税号:',
  docsEyebrow: '所需文件',
  docsTitle: '您需要上传的内容',
  docsBody:
    '1503 将您的证书加密存储。这些将构成您已验证的 KYC:任何交易对手方都能看到您已验证,而无需查看您的私人文件。',
  docsDraftBadge: '草案 · 待法律审核',
  docsDraftBody:
    '此法律形式的初步清单。法律顾问将在我们正式要求之前进行验证。如果您的实体需要不同的文件,请联系我们,我们会进行调整。',
  ctaEyebrow: '下一步',
  ctaTitle: '在 {country} 创建您的企业账户',
  ctaBody:
    '继续注册。三分钟完成,可验证的 KYC,完整访问权限。平台免费 · 每笔交易 0.5% · 无承诺。',
  ctaPrimary: '创建企业账户 →',
  ctaSecondary: '我已有账户 · 登录',
  trustFooter: '加密传输 · 已验证 KYC · 出口合规',
  individualDocs: [
    '身份证明(护照 / 身份证)',
    '营业登记 / 税务登记证',
    '银行账户所有权证明',
    'AML / KYC / GDPR 同等合规',
  ],
  companyDocs: [
    '公司注册证书 / 成立文件',
    '法定代表人身份证明(护照 / 身份证)',
    '银行账户所有权证明',
    '质量认证(ISO 9001 或其他)— 可选但建议',
    '国际合规(AML / KYC / GDPR 同等)',
  ],
  selectEntityFirst: '请先选择您的法律形式,以查看所需文件。',
  sectorEyebrow: '行业与角色',
  sectorTitle: '您的行业与专长',
  sectorBody: '选择您在 1503 上经营的行业。其他参与者将在您的公开资料中看到该行业。',
  sectorPickFirst: '请先选择您的法律形式。',
  subsectorLabel: '子行业',
  subsectorPickFirst: '请先选择子行业。',
  rolePickFirst: '请先选择行业。',
  roleLabel: '具体角色',
  roleOptional: '(企业可选)',
  roleDraftNote: '临时分类 · 待行业验证',
  dataEyebrow: '注册资料',
  dataTitleIndividual: '运营者资料',
  dataTitleCompany: '企业资料',
  dataBody: '我们需要这些资料来创建您的账户,并在其他参与者联系您或您的业务有更新时通过邮件通知您。',
  dataPickFirst: '请先选择您的法律形式。',
  dataFirstName: '名字',
  dataLastName: '姓氏',
  dataTaxIdIndividual: '身份证 / 护照',
  dataCompanyName: '公司全称',
  dataLegalRep: '法定代表人',
  dataEmail: '电子邮件',
  dataEmailHint: '其他参与者联系您或有业务动态时,我们会在此处通知您。',
  dataPhone: '电话',
  dataAddress: '地址',
  dataFiscalAddress: '注册地址',
  dataPostalCode: '邮政编码',
  dataCity: '城市',
  dataYearsInSector: '行业年限',
  dataOptional: '(可选)',
  dataEmailInvalid: '邮箱无效',
}

const JA: RegisterStrings = {
  back: '{continent} に戻る',
  eyebrow: '1503 · レイヤー 3 · 企業登録',
  login: 'ログイン →',
  registerEyebrow: '次の国で会社を登録してください',
  promise:
    '貴社は {country} に紐づけられますが、世界中のどの国とも取引できます。国境を越えた決済と輸出コンプライアンスを、ひとつのツールで。',
  legalEyebrow: '法人形態',
  legalTitle: 'この国での会社の呼び方',
  legalBody: '{country} で認められている法人形態は以下のとおりです。次のステップで選択してください。',
  legalRegistry: '登記簿:',
  legalTaxId: '税務 ID:',
  docsEyebrow: '必要な書類',
  docsTitle: 'アップロードが必要な書類',
  docsBody:
    '1503 は貴社の証明書を暗号化ストレージに保存します。これが認証済み KYC を構成します。取引相手は私的書類を見ることなく、認証済みであることを確認できます。',
  docsDraftBadge: 'ドラフト · 法務レビュー待ち',
  docsDraftBody:
    'この法人形態における暫定リストです。正式に要求する前に法務顧問が検証します。貴社の法人形態に異なる書類が必要な場合は、ご連絡いただければ調整いたします。',
  ctaEyebrow: '次のステップ',
  ctaTitle: '{country} で企業アカウントを作成',
  ctaBody:
    '登録に進んでください。3 分で完了、検証可能な KYC、フルアクセス。プラットフォーム無料 · 取引ごと 0.5% · 拘束なし。',
  ctaPrimary: '企業アカウントを作成 →',
  ctaSecondary: 'すでにアカウントをお持ちの方 · ログイン',
  trustFooter: '暗号化送信 · 認証済み KYC · 輸出コンプライアンス',
  individualDocs: [
    '身分証明書(パスポート / 国民 ID)',
    '事業開始届 / 税務登録証',
    '銀行口座の所有確認書',
    'AML / KYC / GDPR 相当のコンプライアンス',
  ],
  companyDocs: [
    '設立証明書 / 定款',
    '法的代表者の身分証明書(パスポート / 国民 ID)',
    '銀行口座の所有確認書',
    '品質認証(ISO 9001 等)— 任意・推奨',
    '国際コンプライアンス(AML / KYC / GDPR 相当)',
  ],
  selectEntityFirst: '法人形態をまず選択すると、必要書類が表示されます。',
  sectorEyebrow: '業種と役割',
  sectorTitle: '業種と専門領域',
  sectorBody: '1503 で活動する業種を選んでください。他のアクターが公開プロフィールでこの業種を確認できます。',
  sectorPickFirst: '先に法人形態を選択してください。',
  subsectorLabel: 'サブセクター',
  subsectorPickFirst: '先にサブセクターを選択してください。',
  rolePickFirst: '先に業種を選択してください。',
  roleLabel: '具体的な役割',
  roleOptional: '(企業は任意)',
  roleDraftNote: '暫定分類 · 業界による検証待ち',
  dataEyebrow: '登録情報',
  dataTitleIndividual: '運営者情報',
  dataTitleCompany: '企業情報',
  dataBody: 'アカウント作成、および他のアクターからの連絡や取引動向の発生時にメールでご通知するため、以下の情報をお預かりします。',
  dataPickFirst: '先に法人形態を選択してください。',
  dataFirstName: '名',
  dataLastName: '姓',
  dataTaxIdIndividual: '身分証 / パスポート',
  dataCompanyName: '法人名',
  dataLegalRep: '法的代表者',
  dataEmail: 'メール',
  dataEmailHint: '他のアクターからの連絡や活動発生時、こちらにお知らせします。',
  dataPhone: '電話',
  dataAddress: '住所',
  dataFiscalAddress: '登記住所',
  dataPostalCode: '郵便番号',
  dataCity: '市区町村',
  dataYearsInSector: '業界経験年数',
  dataOptional: '(任意)',
  dataEmailInvalid: '無効なメールです',
}

const STRINGS: Record<Lang, RegisterStrings> = {
  es: ES,
  en: EN,
  fr: FR,
  de: DE,
  it: IT,
  pt: PT,
  zh: ZH,
  ja: JA,
}

export function getRegisterStrings(lang: Lang): RegisterStrings {
  return STRINGS[lang] || EN
}

/** Replace `{country}` and `{continent}` placeholders in a translation string. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? `{${k}}`)
}

/* ────────────────────────────── WORKSPACE I18N ──────────────────────────────
   Strings used inside the post-login workspace shell (`/sector/[id]`).
   Phase 1 covers shell strings (sidebar, header, view section headers).
   Mock data inside views (order states, dates) is left in source language for
   now and will be addressed in a later phase. */

export type WorkspaceStrings = {
  // Sidebar
  workspaceLabel: string
  dgmLabel: string
  dgmBody: string

  // Tab labels
  tabBuscador: string
  tabInicio: string
  tabCatalogo: string
  tabActores: string
  tabPedidos: string
  tabMiCatalogo: string
  tabArchivos: string
  tabMensajes: string
  tabExportacion: string

  // Header chips
  marketLabel: string
  marketGlobal: string
  marketSwitchTitle: string
  marketSearchPlaceholder: string
  marketSearchExamples: string
  marketHomeSub: string
  searchInSector: string  // "Search in {sector}…"
  searchExamples: string

  // Operating banner
  operatingIn: string  // "Operating in {country}"
  marketSectorLabel: string  // "Sector" (label inside the banner sector switcher)
  jumpToSectorIn: string  // "Jump to another sector in {country}"
  marketCaption: string  // "Catalog, actors and local pricing"
  backToHomeMarket: string  // "← back to your home market"

  // Profile (operator + company)
  profileEditTitle: string
  profileNamePlaceholder: string
  profilePlaceholderText: string
  avatarUploadTitle: string
  avatarChangeTitle: string
  companyLogoTitle: string

  // Buscador view
  buscadorEyebrow: string  // "Search · {sector}"
  buscadorTitle: string
  buscadorBody: string
  buscadorInputPlaceholder: string
  buscadorButton: string
  buscadorActorsLabel: string
  taxonomyDraftNote: string

  // Actores
  actoresEyebrow: string
  actoresTitleAll: string
  actoresTitleFiltered: string
  actoresBodyAll: string
  actoresBodyFiltered: string
  actoresClearFilter: string
  actoresLoadMore: string
  actoresLoadingMore: string
  actoresEmpty: string
  actoresError: string

  // Ficha pública /actor/[id]
  fichaBackLink: string
  fichaKindCompany: string
  fichaKindIndividual: string
  fichaSelfBadge: string
  fichaOtherBadge: string
  fichaKycBadge: string
  fichaIdentityTitle: string
  fichaIdentitySector: string
  fichaIdentityRole: string
  fichaIdentityCountry: string
  fichaIdentityCity: string
  fichaIdentityYears: string
  fichaIdentityAlta: string
  fichaIdentityActorId: string
  fichaIdentityDid: string
  fichaIdentityDidPending: string
  fichaIdentityEmployer: string
  fichaAutoDeclaredBadge: string
  perfilEmployerTitle: string
  perfilEmployerHint: string
  perfilEmployerPlaceholder: string
  perfilEmployerSaveBtn: string
  perfilEmployerSaving: string
  perfilEmployerClear: string
  fichaTrajectoryTitle: string
  fichaTrajectoryScore: string
  fichaTrajectorySubtitle: string
  fichaTrajectoryHidden: string
  fichaTrajectoryOps: string
  fichaTrajectoryOnTimeDeliveries: string
  fichaTrajectoryOnTimePayments: string
  fichaTrajectoryCredentials: string
  fichaTrajectoryUniqueParties: string
  fichaTrajectoryDisputes: string
  fichaPublicBadge: string
  fichaSelfNotice: string
  fichaConfigError: string
  fichaConfigErrorDetail: string
  fichaKycRequiredTitle: string
  fichaKycRequiredDetail: string
  fichaKycRequiredAction: string
  fichaDbErrorTitle: string
  fichaDbErrorDetailDefault: string

  // Panel /escritorio/perfil
  perfilBackLink: string
  perfilEyebrow: string
  perfilTitle: string
  perfilVisibilitySectionTitle: string
  perfilVisibilityIntro: string
  perfilAvatarTitle: string
  perfilAvatarHint: string
  perfilAvatarUploadBtn: string
  perfilAvatarReplaceBtn: string
  perfilAvatarDeleteBtn: string
  perfilAvatarUploading: string
  perfilSeeMyFiche: string
  perfilLegalNote: string
  perfilErrorTitle: string

  // VisibilityToggle (panel)
  visibilityDirectoryQuestionShort: string
  visibilityDirectoryDetailShort: string
  visibilityTrajectoryQuestionShort: string
  visibilityTrajectoryDetailShort: string
  visibilityChoiceYes: string
  visibilityChoiceNo: string
  visibilityErrorPrefix: string

  // ChatStartButton
  chatBtnStartWith: string
  chatBtnStarting: string
  chatBtnConnecting: string
  chatBtnErrorPrefix: string

  // Catálogo
  catalogoEyebrow: string
  catalogoTitle: string
  catalogoBody: string
  catalogoPlaceholder: string

  // Mi catálogo
  miCatalogoEyebrow: string
  miCatalogoTitle: string
  miCatalogoBody: string
  miCatalogoButton: string

  // Archivos
  archivosEyebrow: string
  archivosTitle: string
  archivosBody: string
  archivosEmpty: string
  archivosEmptyHint: string
  archivosDownload: string
  archivosRemoveConfirm: string  // contains "{filename}"
  archivosFooter: string

  // Mensajes
  mensajesEyebrow: string
  mensajesTitle: string
  mensajesBody: string

  // Pedidos
  pedidosEyebrow: string
  pedidosTitle: string
  pedidosBody: string

  // Wallet
  walletEyebrow: string
  walletTitle: string
  walletBody: string

  // PlaceholderGrid
  placeholderText: string  // "View {title} · coming soon with real data"
  placeholderHint: string

  // ChatPanel (Fase 4)
  chatActionChat: string
  chatActionCall: string
  chatActionVideo: string
  chatActionMeet: string
  chatActionSchedule: string
  chatVideoVision: string
  chatPhaseHint: string  // suffix: "{label} — {chatPhaseHint}"
  chatStatusOnline: string
  chatStatusConnecting: string
  chatStatusOffline: string
  chatStatusUnauth: string
  chatStatusError: string
  chatStatusIdle: string
  chatIntro: string
  chatOpenButton: string
  chatSignInPrompt: string
  chatRecipientPlaceholder: string
  chatOpenConversation: string
  chatNoConversations: string
  chatPresenceLive: string
  chatPresenceOffline: string
  chatPickConversation: string
  chatConversationFallback: string
  chatNoMessages: string
  chatMsgSending: string
  chatMsgRead: string
  chatMsgSent: string
  chatComposerPlaceholder: string
  chatSendButton: string

  // AgendaView (Fase 5.2)
  tabAgenda: string
  agendaEyebrow: string
  agendaTitle: string
  agendaBody: string
  agendaToday: string
  agendaNewMeeting: string
  agendaEventTitle: string
  agendaEventTitlePlaceholder: string
  agendaStart: string
  agendaEnd: string
  agendaNote: string
  agendaNotePlaceholder: string
  agendaSave: string
  agendaCancel: string
  agendaDelete: string
  agendaEdit: string
  agendaPickDay: string
  agendaNoEventsDay: string
  agendaUpcoming: string
  agendaNoUpcoming: string
  agendaFooter: string

  // Desktop personalizado (B3.3) — fondo logo + 3 Polaroids siempre visibles
  desktopFrameEmptyTitle: string  // tooltip al hover en marco vacío
  desktopFrameReplaceTitle: string  // tooltip al hover en marco lleno (click sustituye)
  desktopDeleteTitle: string  // tooltip botón × pequeño
  desktopErrorUpload: string
  desktopErrorDelete: string
}

const WS_ES: WorkspaceStrings = {
  workspaceLabel: 'Workspace',
  dgmLabel: 'DGM · CROSS-SECTOR',
  dgmBody: 'Mensajes y perfil viajan contigo entre sectores. Los catálogos quedan dentro de cada uno.',

  tabBuscador: 'Buscador',
  tabInicio: 'Inicio',
  tabCatalogo: 'Catálogo',
  tabActores: 'Actores',
  tabPedidos: 'Pedidos',
  tabMiCatalogo: 'Mi catálogo',
  tabArchivos: 'Archivos',
  tabMensajes: 'Correo interno',
  tabExportacion: 'Exportación',

  marketLabel: 'Mercado · ¿con quién hoy?',
  marketGlobal: 'Mercado global',
  marketSwitchTitle: 'Cambia el mercado para operar con otro país',
  marketSearchPlaceholder: 'Buscar país…',
  marketSearchExamples: 'ej. Francia, Japón, Brasil',
  marketHomeSub: 'Tu país de registro',
  searchInSector: 'Buscar en {sector}…',
  searchExamples: 'ej. "cemento", "arquitecto", "puerta"',

  operatingIn: 'Operando en {country}',
  marketSectorLabel: 'Sector',
  jumpToSectorIn: 'Saltar a otro sector en {country}',
  marketCaption: 'Catálogo, actores y precios locales',
  backToHomeMarket: '← volver a tu sede',

  profileEditTitle: 'Editar nombre o empresa',
  profileNamePlaceholder: 'Tu nombre o empresa',
  profilePlaceholderText: 'Tu nombre / empresa',
  avatarUploadTitle: 'Subir logo o foto de perfil',
  avatarChangeTitle: 'Cambiar logo / foto',
  companyLogoTitle: 'Logo de la empresa (subido en el registro)',

  buscadorEyebrow: 'Buscador · {sector}',
  buscadorTitle: '¿Qué necesitas hoy?',
  buscadorBody: 'Busca un producto concreto, un fabricante o un profesional. O navega los grupos de actores del sector y haz click para ver la lista.',
  buscadorInputPlaceholder: 'Por ejemplo:  cemento  ·  arquitecto Madrid  ·  puerta blindada  ·  ISO 9001…',
  buscadorButton: 'Buscar',
  buscadorActorsLabel: 'Actores del sector · Click un rol para ver la lista',
  taxonomyDraftNote: 'Clasificación provisional · pendiente de validación sectorial',

  actoresEyebrow: 'Actores',
  actoresTitleAll: 'Empresas y profesionales',
  actoresTitleFiltered: 'Resultados filtrados',
  actoresBodyAll: 'Navega los actores del sector. Filtra por rol, certificación o país.',
  actoresBodyFiltered: 'Mostrando actores del rol "{role}".',
  actoresClearFilter: 'Limpiar filtro',
  actoresLoadMore: 'Cargar más',
  actoresLoadingMore: 'Cargando…',
  actoresEmpty: 'Aún no hay actores verificados en este sector. Cuando los haya, aparecerán aquí.',
  actoresError: 'No se pudo cargar el listado',

  fichaBackLink: '← Escritorio',
  fichaKindCompany: 'EMPRESA',
  fichaKindIndividual: 'PERSONA',
  fichaSelfBadge: 'TU FICHA',
  fichaOtherBadge: 'ACTOR VERIFICADO',
  fichaKycBadge: 'KYC VERIFICADO',
  fichaIdentityTitle: 'IDENTIDAD',
  fichaIdentitySector: 'SECTOR',
  fichaIdentityRole: 'ROL',
  fichaIdentityCountry: 'PAÍS',
  fichaIdentityCity: 'CIUDAD',
  fichaIdentityYears: 'AÑOS EN SECTOR',
  fichaIdentityAlta: 'ALTA',
  fichaIdentityActorId: 'ACTOR-ID',
  fichaIdentityDid: 'DID DESCENTRALIZADO',
  fichaIdentityDidPending: 'pendiente · Fase 6+',
  fichaIdentityEmployer: 'EMPRESA EMPLEADORA',
  fichaAutoDeclaredBadge: 'AUTO-DECLARADO',
  perfilEmployerTitle: 'Empresa empleadora',
  perfilEmployerHint: 'Solo si trabajas para una empresa concreta. AUTO-DECLARADO (verificación cross-actor llegará en Fase 6+).',
  perfilEmployerPlaceholder: 'Ej: Inmobiliaria Soler S.L.',
  perfilEmployerSaveBtn: 'Guardar',
  perfilEmployerSaving: 'Guardando…',
  perfilEmployerClear: 'Borrar',
  fichaTrajectoryTitle: 'TRAYECTORIA · CAPA 1',
  fichaTrajectoryScore: 'PUNTUACIÓN',
  fichaTrajectorySubtitle: 'Las métricas se llenan con operaciones reales del marketplace',
  fichaTrajectoryHidden: 'Tu trayectoria está oculta a otros Actores. Solo tú la ves aquí. Puedes cambiarlo en Mi Perfil.',
  fichaTrajectoryOps: 'OPERACIONES CERRADAS',
  fichaTrajectoryOnTimeDeliveries: 'ENTREGAS A TIEMPO',
  fichaTrajectoryOnTimePayments: 'PAGOS A TIEMPO',
  fichaTrajectoryCredentials: 'CREDENCIALES VERIFICADAS',
  fichaTrajectoryUniqueParties: 'CONTRAPARTES ÚNICAS',
  fichaTrajectoryDisputes: 'INCIDENCIAS ABIERTAS',
  fichaPublicBadge: 'PÚBLICO POR CONSENTIMIENTO',
  fichaSelfNotice: 'ESTA ES TU FICHA PÚBLICA · ASÍ TE VEN OTROS ACTORES VERIFICADOS',
  fichaConfigError: 'Configuración incompleta',
  fichaConfigErrorDetail: 'Faltan credenciales del servidor. Avisa al administrador.',
  fichaKycRequiredTitle: 'Verificación pendiente',
  fichaKycRequiredDetail: 'Necesitas completar tu KYC para ver fichas de otros Actores.',
  fichaKycRequiredAction: 'Ir a mi escritorio',
  fichaDbErrorTitle: 'Error temporal',
  fichaDbErrorDetailDefault: 'No se pudo cargar la ficha en este momento.',

  perfilBackLink: '← Escritorio',
  perfilEyebrow: '◆ MI PERFIL',
  perfilTitle: 'Preferencias y visibilidad',
  perfilVisibilitySectionTitle: 'Privacidad y visibilidad',
  perfilVisibilityIntro: 'Tú decides qué información sobre ti es pública. Puedes cambiar estas decisiones en cualquier momento — el cambio es efectivo inmediato (RGPD Art. 7, consentimiento revocable).',
  perfilAvatarTitle: 'Tu foto pública',
  perfilAvatarHint: 'Avatar o logo visible en tu ficha pública. JPG/PNG/WebP hasta 5 MB. Se recorta cuadrado automáticamente.',
  perfilAvatarUploadBtn: 'Subir foto',
  perfilAvatarReplaceBtn: 'Cambiar foto',
  perfilAvatarDeleteBtn: 'Quitar foto',
  perfilAvatarUploading: 'Subiendo…',
  perfilSeeMyFiche: 'Ver mi ficha pública →',
  perfilLegalNote: 'BASE LEGAL · RGPD ART. 6(b) NECESIDAD CONTRACTUAL + ART. 7 CONSENTIMIENTO REVOCABLE · ART. 25 PRIVACY BY DESIGN. ESTE OPT-OUT PUEDE ACTIVARSE EN CUALQUIER MOMENTO. EL TRATAMIENTO PASADO ANTES DE OCULTAR LA FICHA NO SE INVALIDA RETROACTIVAMENTE.',
  perfilErrorTitle: 'Error temporal',

  visibilityDirectoryQuestionShort: '¿Apareces en el directorio público de Actores?',
  visibilityDirectoryDetailShort: 'Otros Actores KYC-verificados podrán ver tu nombre, sector, rol, país y ciudad, y podrán iniciar conversación contigo.',
  visibilityTrajectoryQuestionShort: '¿Muestras tu trayectoria de operaciones?',
  visibilityTrajectoryDetailShort: 'En tu ficha aparecen métricas computadas de operaciones reales (operaciones cerradas, entregas a tiempo, pagos puntuales). Si dices NO, esa sección se oculta a otros.',
  visibilityChoiceYes: 'Sí consiento',
  visibilityChoiceNo: 'No consiento',
  visibilityErrorPrefix: 'ERROR',

  chatBtnStartWith: 'INICIAR CHAT CON {name}',
  chatBtnStarting: 'INICIANDO…',
  chatBtnConnecting: 'CONECTANDO…',
  chatBtnErrorPrefix: 'ERROR',

  catalogoEyebrow: 'Catálogo',
  catalogoTitle: 'Productos del sector',
  catalogoBody: 'Navega productos por categoría. La búsqueda fina con datos reales (foto, precio, stock, valoración) llega cuando conectemos los ERPs de los proveedores.',
  catalogoPlaceholder: 'Productos',

  miCatalogoEyebrow: 'Mi catálogo',
  miCatalogoTitle: 'Tu inventario publicado',
  miCatalogoBody: 'Conecta tu ERP (SAP, Odoo, Holded, Sage o webhook genérico) y tu catálogo se sincroniza automáticamente. Sin web que mantener, sin fotos que subir.',
  miCatalogoButton: 'Conectar ERP',

  archivosEyebrow: 'Archivos',
  archivosTitle: 'Tus documentos legales',
  archivosBody: 'Aquí tienes a mano todo lo que subiste durante el registro: certificado mercantil, ID del representante, certificados bancarios y de calidad. Descárgalos en cualquier momento.',
  archivosEmpty: 'Aún no has subido ningún documento.',
  archivosEmptyHint: 'Vuelve a la página de registro de tu país y sube los certificados marcados.',
  archivosDownload: 'Descargar',
  archivosRemoveConfirm: '¿Eliminar "{filename}"? Solo afecta a esta vista local.',
  archivosFooter: 'Almacenamiento local · Migrará a Supabase Storage cifrado en cuanto se conecte',

  mensajesEyebrow: 'Correo interno',
  mensajesTitle: 'Correo electrónico interno',
  mensajesBody: 'Mensajería interna asíncrona entre actores (distinta del chat en tiempo real). Llegará con datos reales en una iteración futura.',

  pedidosEyebrow: 'Pedidos · Trazabilidad en tiempo real',
  pedidosTitle: 'Tus operaciones, en tiempo real',
  pedidosBody: 'Cada estado se actualiza automáticamente desde el ERP del proveedor. Webhook in, status update out. El pago se libera contra entrega confirmada.',

  walletEyebrow: 'Pagos · liberación contra entrega',
  walletTitle: 'Tu liquidez B2B',
  walletBody: 'Saldo, historial y liberación de pagos contra entrega confirmada.',

  placeholderText: 'Vista {title} · próximamente con datos reales',
  placeholderHint: 'Esperando conexión Supabase + ERPs',

  chatActionChat: 'Chat',
  chatActionCall: 'Llamada',
  chatActionVideo: 'Videollamada',
  chatActionMeet: 'Reunión',
  chatActionSchedule: 'Agendar',
  chatVideoVision: 'Videollamada con traducción en tiempo real entre actores',
  chatPhaseHint: 'disponible en Fase 5',
  chatStatusOnline: 'conectado',
  chatStatusConnecting: 'conectando…',
  chatStatusOffline: 'sin conexión',
  chatStatusUnauth: 'inicia sesión',
  chatStatusError: 'error',
  chatStatusIdle: 'inactivo',
  chatIntro: 'Mensajería 1-a-1 entre actores verificados.',
  chatOpenButton: 'Abrir chat',
  chatSignInPrompt: 'Inicia sesión como actor verificado para usar Mensajes.',
  chatRecipientPlaceholder: 'ID del actor (UUID)',
  chatOpenConversation: 'Abrir',
  chatNoConversations: 'Sin conversaciones',
  chatPresenceLive: 'en vivo',
  chatPresenceOffline: 'desconectado',
  chatPickConversation: 'Elige o abre una conversación',
  chatConversationFallback: 'conversación',
  chatNoMessages: 'Sin mensajes todavía',
  chatMsgSending: 'enviando…',
  chatMsgRead: 'leído',
  chatMsgSent: 'enviado',
  chatComposerPlaceholder: 'Escribe un mensaje…',
  chatSendButton: 'Enviar',

  tabAgenda: 'Agenda',
  agendaEyebrow: 'Agenda',
  agendaTitle: 'Tu agenda de reuniones',
  agendaBody: 'Programa y consulta tus reuniones con otros actores. Por ahora la agenda es local a este dispositivo; la sincronización y las invitaciones a otros actores llegan con el directorio (Fase 6).',
  agendaToday: 'Hoy',
  agendaNewMeeting: 'Nueva reunión',
  agendaEventTitle: 'Título',
  agendaEventTitlePlaceholder: 'ej. Llamada con proveedor',
  agendaStart: 'Inicio',
  agendaEnd: 'Fin',
  agendaNote: 'Nota',
  agendaNotePlaceholder: 'Detalles (opcional)',
  agendaSave: 'Guardar',
  agendaCancel: 'Cancelar',
  agendaDelete: 'Eliminar',
  agendaEdit: 'Editar',
  agendaPickDay: 'Elige un día del calendario',
  agendaNoEventsDay: 'Sin reuniones este día',
  agendaUpcoming: 'Próximas reuniones',
  agendaNoUpcoming: 'No tienes reuniones próximas',
  agendaFooter: 'Almacenamiento local · Migrará a Supabase y permitirá invitar a otros actores cuando se conecte el directorio',

  desktopFrameEmptyTitle: 'Click para añadir una foto personal',
  desktopFrameReplaceTitle: 'Click para cambiar la foto',
  desktopDeleteTitle: 'Borrar foto',
  desktopErrorUpload: 'No se pudo subir la foto',
  desktopErrorDelete: 'No se pudo borrar la foto',
}

const WS_EN: WorkspaceStrings = {
  workspaceLabel: 'Workspace',
  dgmLabel: 'DGM · CROSS-SECTOR',
  dgmBody: 'Messages and profile travel with you across sectors. Catalogs stay inside each one.',

  tabBuscador: 'Search',
  tabInicio: 'Home',
  tabCatalogo: 'Catalog',
  tabActores: 'Actors',
  tabPedidos: 'Orders',
  tabMiCatalogo: 'My catalog',
  tabArchivos: 'Files',
  tabMensajes: 'Internal mail',
  tabExportacion: 'Export',

  marketLabel: 'Market · who with today?',
  marketGlobal: 'Global market',
  marketSwitchTitle: 'Switch market to operate with another country',
  marketSearchPlaceholder: 'Search country…',
  marketSearchExamples: 'e.g. France, Japan, Brazil',
  marketHomeSub: 'Your home country',
  searchInSector: 'Search in {sector}…',
  searchExamples: 'e.g. "cement", "architect", "door"',

  operatingIn: 'Operating in {country}',
  marketSectorLabel: 'Sector',
  jumpToSectorIn: 'Jump to another sector in {country}',
  marketCaption: 'Catalog, actors and local pricing',
  backToHomeMarket: '← back to your home market',

  profileEditTitle: 'Edit your name or company',
  profileNamePlaceholder: 'Your name or company',
  profilePlaceholderText: 'Your name / company',
  avatarUploadTitle: 'Upload profile logo or photo',
  avatarChangeTitle: 'Change logo / photo',
  companyLogoTitle: 'Company logo (uploaded during registration)',

  buscadorEyebrow: 'Search · {sector}',
  buscadorTitle: 'What do you need today?',
  buscadorBody: 'Search for a specific product, a manufacturer or a professional. Or browse the sector actor groups and click to see the list.',
  buscadorInputPlaceholder: 'For example:  cement  ·  architect Madrid  ·  armoured door  ·  ISO 9001…',
  buscadorButton: 'Search',
  buscadorActorsLabel: 'Sector actors · Click a role to see the list',
  taxonomyDraftNote: 'Provisional classification · pending sector validation',

  actoresEyebrow: 'Actors',
  actoresTitleAll: 'Companies and professionals',
  actoresTitleFiltered: 'Filtered results',
  actoresBodyAll: 'Browse the actors in this sector. Filter by role, certification or country.',
  actoresBodyFiltered: 'Showing actors with role "{role}".',
  actoresClearFilter: 'Clear filter',
  actoresLoadMore: 'Load more',
  actoresLoadingMore: 'Loading…',
  actoresEmpty: 'No verified actors in this sector yet. They will appear here once they join.',
  actoresError: 'Could not load the list',

  fichaBackLink: '← Workspace',
  fichaKindCompany: 'COMPANY',
  fichaKindIndividual: 'PERSON',
  fichaSelfBadge: 'YOUR PROFILE',
  fichaOtherBadge: 'VERIFIED ACTOR',
  fichaKycBadge: 'KYC VERIFIED',
  fichaIdentityTitle: 'IDENTITY',
  fichaIdentitySector: 'SECTOR',
  fichaIdentityRole: 'ROLE',
  fichaIdentityCountry: 'COUNTRY',
  fichaIdentityCity: 'CITY',
  fichaIdentityYears: 'YEARS IN SECTOR',
  fichaIdentityAlta: 'JOINED',
  fichaIdentityActorId: 'ACTOR-ID',
  fichaIdentityDid: 'DECENTRALIZED DID',
  fichaIdentityDidPending: 'pending · Phase 6+',
  fichaIdentityEmployer: 'EMPLOYER',
  fichaAutoDeclaredBadge: 'SELF-DECLARED',
  perfilEmployerTitle: 'Employer company',
  perfilEmployerHint: 'Only if you work for a specific company. SELF-DECLARED (cross-actor verification arrives in Phase 6+).',
  perfilEmployerPlaceholder: 'E.g. Inmobiliaria Soler S.L.',
  perfilEmployerSaveBtn: 'Save',
  perfilEmployerSaving: 'Saving…',
  perfilEmployerClear: 'Clear',
  fichaTrajectoryTitle: 'TRACK RECORD · LAYER 1',
  fichaTrajectoryScore: 'SCORE',
  fichaTrajectorySubtitle: 'Metrics fill in with real marketplace operations',
  fichaTrajectoryHidden: 'Your track record is hidden from other Actors. Only you see it here. You can change this in My Profile.',
  fichaTrajectoryOps: 'CLOSED OPERATIONS',
  fichaTrajectoryOnTimeDeliveries: 'ON-TIME DELIVERIES',
  fichaTrajectoryOnTimePayments: 'ON-TIME PAYMENTS',
  fichaTrajectoryCredentials: 'VERIFIED CREDENTIALS',
  fichaTrajectoryUniqueParties: 'UNIQUE COUNTERPARTIES',
  fichaTrajectoryDisputes: 'OPEN DISPUTES',
  fichaPublicBadge: 'PUBLIC BY CONSENT',
  fichaSelfNotice: 'THIS IS YOUR PUBLIC PROFILE · THIS IS HOW OTHER VERIFIED ACTORS SEE YOU',
  fichaConfigError: 'Incomplete configuration',
  fichaConfigErrorDetail: 'Server credentials missing. Please notify the administrator.',
  fichaKycRequiredTitle: 'Verification pending',
  fichaKycRequiredDetail: 'You need to complete your KYC to view other Actors profiles.',
  fichaKycRequiredAction: 'Go to my workspace',
  fichaDbErrorTitle: 'Temporary error',
  fichaDbErrorDetailDefault: 'Could not load the profile right now.',

  perfilBackLink: '← Workspace',
  perfilEyebrow: '◆ MY PROFILE',
  perfilTitle: 'Preferences and visibility',
  perfilVisibilitySectionTitle: 'Privacy and visibility',
  perfilVisibilityIntro: 'You decide what information about you is public. You can change these decisions at any time — the change takes effect immediately (GDPR Art. 7, revocable consent).',
  perfilAvatarTitle: 'Your public photo',
  perfilAvatarHint: 'Avatar or logo visible on your public profile. JPG/PNG/WebP up to 5 MB. Square-cropped automatically.',
  perfilAvatarUploadBtn: 'Upload photo',
  perfilAvatarReplaceBtn: 'Change photo',
  perfilAvatarDeleteBtn: 'Remove photo',
  perfilAvatarUploading: 'Uploading…',
  perfilSeeMyFiche: 'View my public profile →',
  perfilLegalNote: 'LEGAL BASIS · GDPR ART. 6(b) CONTRACTUAL NECESSITY + ART. 7 REVOCABLE CONSENT · ART. 25 PRIVACY BY DESIGN. THIS OPT-OUT CAN BE ACTIVATED AT ANY TIME. PROCESSING DONE BEFORE HIDING THE PROFILE IS NOT INVALIDATED RETROACTIVELY.',
  perfilErrorTitle: 'Temporary error',

  visibilityDirectoryQuestionShort: 'Do you appear in the public Actors directory?',
  visibilityDirectoryDetailShort: 'Other KYC-verified Actors will be able to see your name, sector, role, country and city, and start a conversation with you.',
  visibilityTrajectoryQuestionShort: 'Do you show your operations track record?',
  visibilityTrajectoryDetailShort: 'Your public profile shows metrics computed from real operations (closed operations, on-time deliveries, on-time payments). If you choose NO, that section is hidden from others.',
  visibilityChoiceYes: 'Yes, I consent',
  visibilityChoiceNo: 'No, I do not',
  visibilityErrorPrefix: 'ERROR',

  chatBtnStartWith: 'START CHAT WITH {name}',
  chatBtnStarting: 'STARTING…',
  chatBtnConnecting: 'CONNECTING…',
  chatBtnErrorPrefix: 'ERROR',

  catalogoEyebrow: 'Catalog',
  catalogoTitle: 'Sector products',
  catalogoBody: 'Browse products by category. Fine-grained search with real data (photo, price, stock, rating) lands when we connect the suppliers’ ERPs.',
  catalogoPlaceholder: 'Products',

  miCatalogoEyebrow: 'My catalog',
  miCatalogoTitle: 'Your published inventory',
  miCatalogoBody: 'Connect your ERP (SAP, Odoo, Holded, Sage or a generic webhook) and your catalog syncs automatically. No website to maintain, no photos to upload.',
  miCatalogoButton: 'Connect ERP',

  archivosEyebrow: 'Files',
  archivosTitle: 'Your legal documents',
  archivosBody: 'All the files you uploaded during registration, at hand: incorporation certificate, representative ID, banking and quality certs. Download them anytime.',
  archivosEmpty: 'You have not uploaded any documents yet.',
  archivosEmptyHint: 'Go back to your country registration page and upload the marked certificates.',
  archivosDownload: 'Download',
  archivosRemoveConfirm: 'Remove "{filename}"? This only affects your local view.',
  archivosFooter: 'Local storage · Will migrate to encrypted Supabase Storage once connected',

  mensajesEyebrow: 'Internal mail',
  mensajesTitle: 'Internal email',
  mensajesBody: 'Asynchronous internal messaging between actors (distinct from real-time chat). Real data in a future iteration.',

  pedidosEyebrow: 'Orders · Real-time traceability',
  pedidosTitle: 'Your operations, in real time',
  pedidosBody: 'Each state updates automatically from the supplier’s ERP. Webhook in, status update out. Payment is released against confirmed delivery.',

  walletEyebrow: 'Pagos · liberación contra entrega',
  walletTitle: 'Your B2B liquidity',
  walletBody: 'Balance, history and payment release against confirmed delivery.',

  placeholderText: 'View {title} · coming soon with real data',
  placeholderHint: 'Waiting on Supabase + ERPs connection',

  chatActionChat: 'Chat',
  chatActionCall: 'Call',
  chatActionVideo: 'Video call',
  chatActionMeet: 'Meeting',
  chatActionSchedule: 'Schedule',
  chatVideoVision: 'Video call with real-time translation between actors',
  chatPhaseHint: 'available in Phase 5',
  chatStatusOnline: 'connected',
  chatStatusConnecting: 'connecting…',
  chatStatusOffline: 'offline',
  chatStatusUnauth: 'sign in',
  chatStatusError: 'error',
  chatStatusIdle: 'idle',
  chatIntro: 'One-to-one messaging between verified actors.',
  chatOpenButton: 'Open chat',
  chatSignInPrompt: 'Sign in as a verified actor to use Messages.',
  chatRecipientPlaceholder: 'Actor ID (UUID)',
  chatOpenConversation: 'Open',
  chatNoConversations: 'No conversations',
  chatPresenceLive: 'online',
  chatPresenceOffline: 'offline',
  chatPickConversation: 'Pick or start a conversation',
  chatConversationFallback: 'conversation',
  chatNoMessages: 'No messages yet',
  chatMsgSending: 'sending…',
  chatMsgRead: 'read',
  chatMsgSent: 'sent',
  chatComposerPlaceholder: 'Type a message…',
  chatSendButton: 'Send',

  tabAgenda: 'Calendar',
  agendaEyebrow: 'Calendar',
  agendaTitle: 'Your meeting calendar',
  agendaBody: 'Schedule and review your meetings with other actors. For now the calendar is local to this device; syncing and invitations to other actors arrive with the directory (Phase 6).',
  agendaToday: 'Today',
  agendaNewMeeting: 'New meeting',
  agendaEventTitle: 'Title',
  agendaEventTitlePlaceholder: 'e.g. Call with supplier',
  agendaStart: 'Start',
  agendaEnd: 'End',
  agendaNote: 'Note',
  agendaNotePlaceholder: 'Details (optional)',
  agendaSave: 'Save',
  agendaCancel: 'Cancel',
  agendaDelete: 'Delete',
  agendaEdit: 'Edit',
  agendaPickDay: 'Pick a day from the calendar',
  agendaNoEventsDay: 'No meetings this day',
  agendaUpcoming: 'Upcoming meetings',
  agendaNoUpcoming: 'You have no upcoming meetings',
  agendaFooter: 'Local storage · Will migrate to Supabase and allow inviting other actors once the directory is connected',

  desktopFrameEmptyTitle: 'Click to add a personal photo',
  desktopFrameReplaceTitle: 'Click to change the photo',
  desktopDeleteTitle: 'Delete photo',
  desktopErrorUpload: 'Could not upload the photo',
  desktopErrorDelete: 'Could not delete the photo',
}

const WS_FR: WorkspaceStrings = {
  workspaceLabel: 'Bureau',
  dgmLabel: 'DGM · TRANSVERSAL',
  dgmBody: 'Les messages et le profil vous suivent entre secteurs. Les catalogues restent dans chacun.',

  tabBuscador: 'Recherche',
  tabInicio: 'Accueil',
  tabCatalogo: 'Catalogue',
  tabActores: 'Acteurs',
  tabPedidos: 'Commandes',
  tabMiCatalogo: 'Mon catalogue',
  tabArchivos: 'Fichiers',
  tabMensajes: 'Courrier interne',
  tabExportacion: 'Exportation',

  marketLabel: 'Marché · avec qui aujourd’hui ?',
  marketGlobal: 'Marché mondial',
  marketSwitchTitle: 'Changer de marché pour opérer avec un autre pays',
  marketSearchPlaceholder: 'Chercher un pays…',
  marketSearchExamples: 'ex. France, Japon, Brésil',
  marketHomeSub: 'Votre pays d’enregistrement',
  searchInSector: 'Rechercher dans {sector}…',
  searchExamples: 'ex. « ciment », « architecte », « porte »',

  operatingIn: 'Opération en cours dans {country}',
  marketSectorLabel: 'Secteur',
  jumpToSectorIn: 'Passer à un autre secteur en {country}',
  marketCaption: 'Catalogue, acteurs et prix locaux',
  backToHomeMarket: '← retour à votre marché',

  profileEditTitle: 'Modifier votre nom ou entreprise',
  profileNamePlaceholder: 'Votre nom ou entreprise',
  profilePlaceholderText: 'Votre nom / entreprise',
  avatarUploadTitle: 'Téléverser logo ou photo de profil',
  avatarChangeTitle: 'Changer logo / photo',
  companyLogoTitle: 'Logo de l’entreprise (téléversé à l’inscription)',

  buscadorEyebrow: 'Recherche · {sector}',
  buscadorTitle: 'De quoi avez-vous besoin aujourd’hui ?',
  buscadorBody: 'Cherchez un produit précis, un fabricant ou un professionnel. Ou parcourez les groupes d’acteurs du secteur et cliquez pour voir la liste.',
  buscadorInputPlaceholder: 'Par exemple :  ciment  ·  architecte Paris  ·  porte blindée  ·  ISO 9001…',
  buscadorButton: 'Rechercher',
  buscadorActorsLabel: 'Acteurs du secteur · Cliquez sur un rôle pour voir la liste',
  taxonomyDraftNote: 'Classification provisoire · en attente de validation sectorielle',

  actoresEyebrow: 'Acteurs',
  actoresTitleAll: 'Entreprises et professionnels',
  actoresTitleFiltered: 'Résultats filtrés',
  actoresBodyAll: 'Parcourez les acteurs du secteur. Filtrez par rôle, certification ou pays.',
  actoresBodyFiltered: 'Acteurs avec le rôle « {role} ».',
  actoresClearFilter: 'Effacer le filtre',
  actoresLoadMore: 'Charger plus',
  actoresLoadingMore: 'Chargement…',
  actoresEmpty: 'Aucun acteur vérifié dans ce secteur pour le moment. Ils apparaîtront ici dès leur inscription.',
  actoresError: 'Impossible de charger la liste',

  fichaBackLink: '← Bureau',
  fichaKindCompany: 'ENTREPRISE',
  fichaKindIndividual: 'PERSONNE',
  fichaSelfBadge: 'VOTRE FICHE',
  fichaOtherBadge: 'ACTEUR VÉRIFIÉ',
  fichaKycBadge: 'KYC VÉRIFIÉ',
  fichaIdentityTitle: 'IDENTITÉ',
  fichaIdentitySector: 'SECTEUR',
  fichaIdentityRole: 'RÔLE',
  fichaIdentityCountry: 'PAYS',
  fichaIdentityCity: 'VILLE',
  fichaIdentityYears: 'ANNÉES DANS LE SECTEUR',
  fichaIdentityAlta: 'INSCRIT LE',
  fichaIdentityActorId: 'ACTOR-ID',
  fichaIdentityDid: 'DID DÉCENTRALISÉ',
  fichaIdentityDidPending: 'en attente · Phase 6+',
  fichaIdentityEmployer: 'EMPLOYEUR',
  fichaAutoDeclaredBadge: 'AUTO-DÉCLARÉ',
  perfilEmployerTitle: 'Entreprise employeur',
  perfilEmployerHint: 'Uniquement si vous travaillez pour une entreprise spécifique. AUTO-DÉCLARÉ (la vérification cross-actor arrive en Phase 6+).',
  perfilEmployerPlaceholder: 'Ex : Inmobiliaria Soler S.L.',
  perfilEmployerSaveBtn: 'Enregistrer',
  perfilEmployerSaving: 'Enregistrement…',
  perfilEmployerClear: 'Effacer',
  fichaTrajectoryTitle: 'PARCOURS · COUCHE 1',
  fichaTrajectoryScore: 'SCORE',
  fichaTrajectorySubtitle: 'Les indicateurs se remplissent avec les opérations réelles du marketplace',
  fichaTrajectoryHidden: 'Votre parcours est masqué aux autres acteurs. Vous seul le voyez ici. Modifiable dans Mon Profil.',
  fichaTrajectoryOps: 'OPÉRATIONS CLÔTURÉES',
  fichaTrajectoryOnTimeDeliveries: 'LIVRAISONS À TEMPS',
  fichaTrajectoryOnTimePayments: 'PAIEMENTS À TEMPS',
  fichaTrajectoryCredentials: 'CERTIFICATIONS VÉRIFIÉES',
  fichaTrajectoryUniqueParties: 'CONTREPARTIES UNIQUES',
  fichaTrajectoryDisputes: 'LITIGES OUVERTS',
  fichaPublicBadge: 'PUBLIC PAR CONSENTEMENT',
  fichaSelfNotice: 'CECI EST VOTRE FICHE PUBLIQUE · C’EST AINSI QUE LES AUTRES ACTEURS VÉRIFIÉS VOUS VOIENT',
  fichaConfigError: 'Configuration incomplète',
  fichaConfigErrorDetail: 'Identifiants serveur manquants. Veuillez prévenir l’administrateur.',
  fichaKycRequiredTitle: 'Vérification en attente',
  fichaKycRequiredDetail: 'Vous devez compléter votre KYC pour voir les fiches des autres acteurs.',
  fichaKycRequiredAction: 'Aller à mon bureau',
  fichaDbErrorTitle: 'Erreur temporaire',
  fichaDbErrorDetailDefault: 'Impossible de charger la fiche pour le moment.',

  perfilBackLink: '← Bureau',
  perfilEyebrow: '◆ MON PROFIL',
  perfilTitle: 'Préférences et visibilité',
  perfilVisibilitySectionTitle: 'Confidentialité et visibilité',
  perfilVisibilityIntro: 'Vous décidez quelles informations vous concernant sont publiques. Vous pouvez modifier ces décisions à tout moment — l’effet est immédiat (RGPD Art. 7, consentement révocable).',
  perfilAvatarTitle: 'Votre photo publique',
  perfilAvatarHint: 'Avatar ou logo visible sur votre fiche publique. JPG/PNG/WebP jusqu’à 5 Mo. Recadrage carré automatique.',
  perfilAvatarUploadBtn: 'Téléverser la photo',
  perfilAvatarReplaceBtn: 'Changer la photo',
  perfilAvatarDeleteBtn: 'Retirer la photo',
  perfilAvatarUploading: 'Téléversement…',
  perfilSeeMyFiche: 'Voir ma fiche publique →',
  perfilLegalNote: 'BASE LÉGALE · RGPD ART. 6(b) NÉCESSITÉ CONTRACTUELLE + ART. 7 CONSENTEMENT RÉVOCABLE · ART. 25 PRIVACY BY DESIGN. CE RETRAIT PEUT ÊTRE ACTIVÉ À TOUT MOMENT. LE TRAITEMENT EFFECTUÉ AVANT LE MASQUAGE N’EST PAS INVALIDÉ RÉTROACTIVEMENT.',
  perfilErrorTitle: 'Erreur temporaire',

  visibilityDirectoryQuestionShort: 'Apparaissez-vous dans l’annuaire public des acteurs ?',
  visibilityDirectoryDetailShort: 'Les autres acteurs KYC-vérifiés pourront voir votre nom, secteur, rôle, pays et ville, et démarrer une conversation avec vous.',
  visibilityTrajectoryQuestionShort: 'Montrez-vous votre parcours d’opérations ?',
  visibilityTrajectoryDetailShort: 'Votre fiche publique affiche des indicateurs calculés à partir d’opérations réelles (opérations clôturées, livraisons à temps, paiements à temps). Si NON, cette section est masquée aux autres.',
  visibilityChoiceYes: 'Oui, je consens',
  visibilityChoiceNo: 'Non, je refuse',
  visibilityErrorPrefix: 'ERREUR',

  chatBtnStartWith: 'DÉMARRER UN CHAT AVEC {name}',
  chatBtnStarting: 'DÉMARRAGE…',
  chatBtnConnecting: 'CONNEXION…',
  chatBtnErrorPrefix: 'ERREUR',

  catalogoEyebrow: 'Catalogue',
  catalogoTitle: 'Produits du secteur',
  catalogoBody: 'Parcourez les produits par catégorie. La recherche fine avec données réelles (photo, prix, stock, note) arrive dès que les ERP fournisseurs sont connectés.',
  catalogoPlaceholder: 'Produits',

  miCatalogoEyebrow: 'Mon catalogue',
  miCatalogoTitle: 'Votre inventaire publié',
  miCatalogoBody: 'Connectez votre ERP (SAP, Odoo, Holded, Sage ou webhook générique) et votre catalogue se synchronise automatiquement. Aucun site à maintenir, aucune photo à téléverser.',
  miCatalogoButton: 'Connecter l’ERP',

  archivosEyebrow: 'Fichiers',
  archivosTitle: 'Vos documents légaux',
  archivosBody: 'Tout ce que vous avez téléversé à l’inscription, à portée de main : certificat de constitution, pièce d’identité du représentant, attestations bancaires et qualité. Téléchargeables à tout moment.',
  archivosEmpty: 'Aucun document téléversé pour le moment.',
  archivosEmptyHint: 'Retournez à la page d’inscription de votre pays et téléversez les certificats indiqués.',
  archivosDownload: 'Télécharger',
  archivosRemoveConfirm: 'Supprimer « {filename} » ? Cela n’affecte que cette vue locale.',
  archivosFooter: 'Stockage local · Migrera vers Supabase Storage chiffré dès connexion',

  mensajesEyebrow: 'Courrier interne',
  mensajesTitle: 'Courrier électronique interne',
  mensajesBody: 'Messagerie interne asynchrone entre acteurs (distincte du chat en temps réel). Données réelles lors d’une prochaine itération.',

  pedidosEyebrow: 'Commandes · Traçabilité en temps réel',
  pedidosTitle: 'Vos opérations, en temps réel',
  pedidosBody: 'Chaque statut se met à jour automatiquement depuis l’ERP du fournisseur. Webhook in, statut out. Le paiement est libéré à la livraison confirmée.',

  walletEyebrow: 'Pagos · liberación contra entrega',
  walletTitle: 'Votre liquidité B2B',
  walletBody: 'Solde, historique et libération des paiements à la livraison confirmée.',

  placeholderText: 'Vue {title} · bientôt avec des données réelles',
  placeholderHint: 'En attente de la connexion Supabase + ERP',

  chatActionChat: 'Chat',
  chatActionCall: 'Appel',
  chatActionVideo: 'Visioconférence',
  chatActionMeet: 'Réunion',
  chatActionSchedule: 'Planifier',
  chatVideoVision: 'Visioconférence avec traduction en temps réel entre acteurs',
  chatPhaseHint: 'disponible en Phase 5',
  chatStatusOnline: 'connecté',
  chatStatusConnecting: 'connexion…',
  chatStatusOffline: 'hors ligne',
  chatStatusUnauth: 'connectez-vous',
  chatStatusError: 'erreur',
  chatStatusIdle: 'inactif',
  chatIntro: 'Messagerie individuelle entre acteurs vérifiés.',
  chatOpenButton: 'Ouvrir le chat',
  chatSignInPrompt: 'Connectez-vous en tant qu’acteur vérifié pour utiliser la messagerie.',
  chatRecipientPlaceholder: 'ID de l’acteur (UUID)',
  chatOpenConversation: 'Ouvrir',
  chatNoConversations: 'Aucune conversation',
  chatPresenceLive: 'en ligne',
  chatPresenceOffline: 'hors ligne',
  chatPickConversation: 'Choisissez ou démarrez une conversation',
  chatConversationFallback: 'conversation',
  chatNoMessages: 'Aucun message pour l’instant',
  chatMsgSending: 'envoi…',
  chatMsgRead: 'lu',
  chatMsgSent: 'envoyé',
  chatComposerPlaceholder: 'Écrivez un message…',
  chatSendButton: 'Envoyer',

  tabAgenda: 'Agenda',
  agendaEyebrow: 'Agenda',
  agendaTitle: 'Votre agenda de réunions',
  agendaBody: 'Planifiez et consultez vos réunions avec d’autres acteurs. Pour l’instant l’agenda est local à cet appareil ; la synchronisation et les invitations à d’autres acteurs arrivent avec l’annuaire (Phase 6).',
  agendaToday: 'Aujourd’hui',
  agendaNewMeeting: 'Nouvelle réunion',
  agendaEventTitle: 'Titre',
  agendaEventTitlePlaceholder: 'ex. Appel avec un fournisseur',
  agendaStart: 'Début',
  agendaEnd: 'Fin',
  agendaNote: 'Note',
  agendaNotePlaceholder: 'Détails (facultatif)',
  agendaSave: 'Enregistrer',
  agendaCancel: 'Annuler',
  agendaDelete: 'Supprimer',
  agendaEdit: 'Modifier',
  agendaPickDay: 'Choisissez un jour dans le calendrier',
  agendaNoEventsDay: 'Aucune réunion ce jour',
  agendaUpcoming: 'Prochaines réunions',
  agendaNoUpcoming: 'Vous n’avez aucune réunion à venir',
  agendaFooter: 'Stockage local · Migrera vers Supabase et permettra d’inviter d’autres acteurs dès que l’annuaire sera connecté',

  desktopFrameEmptyTitle: 'Cliquez pour ajouter une photo personnelle',
  desktopFrameReplaceTitle: 'Cliquez pour changer la photo',
  desktopDeleteTitle: 'Supprimer la photo',
  desktopErrorUpload: 'Impossible de téléverser la photo',
  desktopErrorDelete: 'Impossible de supprimer la photo',
}

const WS_DE: WorkspaceStrings = {
  workspaceLabel: 'Arbeitsplatz',
  dgmLabel: 'DGM · SEKTORÜBERGREIFEND',
  dgmBody: 'Nachrichten und Profil reisen mit Ihnen durch alle Sektoren. Kataloge bleiben in jedem Sektor.',

  tabBuscador: 'Suche',
  tabInicio: 'Start',
  tabCatalogo: 'Katalog',
  tabActores: 'Akteure',
  tabPedidos: 'Bestellungen',
  tabMiCatalogo: 'Mein Katalog',
  tabArchivos: 'Dateien',
  tabMensajes: 'Interne Post',
  tabExportacion: 'Export',

  marketLabel: 'Markt · mit wem heute?',
  marketGlobal: 'Globaler Markt',
  marketSwitchTitle: 'Markt wechseln, um mit einem anderen Land zu operieren',
  marketSearchPlaceholder: 'Land suchen…',
  marketSearchExamples: 'z. B. Frankreich, Japan, Brasilien',
  marketHomeSub: 'Ihr Registrierungsland',
  searchInSector: 'Suche in {sector}…',
  searchExamples: 'z. B. „Zement“, „Architekt“, „Tür“',

  operatingIn: 'Betrieb in {country}',
  marketSectorLabel: 'Sektor',
  jumpToSectorIn: 'Zu einem anderen Sektor in {country} wechseln',
  marketCaption: 'Katalog, Akteure und lokale Preise',
  backToHomeMarket: '← zurück zu Ihrem Heimatmarkt',

  profileEditTitle: 'Name oder Firma bearbeiten',
  profileNamePlaceholder: 'Ihr Name oder Firma',
  profilePlaceholderText: 'Ihr Name / Firma',
  avatarUploadTitle: 'Profillogo oder Foto hochladen',
  avatarChangeTitle: 'Logo / Foto ändern',
  companyLogoTitle: 'Firmenlogo (bei der Registrierung hochgeladen)',

  buscadorEyebrow: 'Suche · {sector}',
  buscadorTitle: 'Was brauchen Sie heute?',
  buscadorBody: 'Suchen Sie ein konkretes Produkt, einen Hersteller oder eine Fachkraft. Oder durchsuchen Sie die Akteursgruppen des Sektors und klicken Sie für die Liste.',
  buscadorInputPlaceholder: 'Zum Beispiel:  Zement  ·  Architekt Berlin  ·  Sicherheitstür  ·  ISO 9001…',
  buscadorButton: 'Suchen',
  buscadorActorsLabel: 'Sektor-Akteure · Klicken Sie eine Rolle für die Liste',
  taxonomyDraftNote: 'Vorläufige Einstufung · ausstehende Branchenvalidierung',

  actoresEyebrow: 'Akteure',
  actoresTitleAll: 'Unternehmen und Fachkräfte',
  actoresTitleFiltered: 'Gefilterte Ergebnisse',
  actoresBodyAll: 'Durchsuchen Sie die Akteure des Sektors. Filtern Sie nach Rolle, Zertifizierung oder Land.',
  actoresBodyFiltered: 'Akteure mit der Rolle „{role}".',
  actoresClearFilter: 'Filter löschen',
  actoresLoadMore: 'Mehr laden',
  actoresLoadingMore: 'Lädt…',
  actoresEmpty: 'Noch keine verifizierten Akteure in diesem Sektor. Sie erscheinen hier, sobald sie beitreten.',
  actoresError: 'Liste konnte nicht geladen werden',

  fichaBackLink: '← Arbeitsbereich',
  fichaKindCompany: 'UNTERNEHMEN',
  fichaKindIndividual: 'PERSON',
  fichaSelfBadge: 'IHR PROFIL',
  fichaOtherBadge: 'VERIFIZIERTER AKTEUR',
  fichaKycBadge: 'KYC VERIFIZIERT',
  fichaIdentityTitle: 'IDENTITÄT',
  fichaIdentitySector: 'SEKTOR',
  fichaIdentityRole: 'ROLLE',
  fichaIdentityCountry: 'LAND',
  fichaIdentityCity: 'STADT',
  fichaIdentityYears: 'JAHRE IM SEKTOR',
  fichaIdentityAlta: 'BEIGETRETEN',
  fichaIdentityActorId: 'ACTOR-ID',
  fichaIdentityDid: 'DEZENTRALE DID',
  fichaIdentityDidPending: 'ausstehend · Phase 6+',
  fichaIdentityEmployer: 'ARBEITGEBER',
  fichaAutoDeclaredBadge: 'SELBST ANGEGEBEN',
  perfilEmployerTitle: 'Arbeitgeber',
  perfilEmployerHint: 'Nur wenn Sie für ein bestimmtes Unternehmen arbeiten. SELBST ANGEGEBEN (Cross-Actor-Verifizierung kommt in Phase 6+).',
  perfilEmployerPlaceholder: 'Z.B. Inmobiliaria Soler S.L.',
  perfilEmployerSaveBtn: 'Speichern',
  perfilEmployerSaving: 'Speichern…',
  perfilEmployerClear: 'Löschen',
  fichaTrajectoryTitle: 'WERDEGANG · EBENE 1',
  fichaTrajectoryScore: 'PUNKTZAHL',
  fichaTrajectorySubtitle: 'Kennzahlen werden mit echten Marktplatz-Operationen gefüllt',
  fichaTrajectoryHidden: 'Ihr Werdegang ist vor anderen Akteuren verborgen. Nur Sie sehen ihn hier. Änderbar in Mein Profil.',
  fichaTrajectoryOps: 'ABGESCHLOSSENE OPERATIONEN',
  fichaTrajectoryOnTimeDeliveries: 'PÜNKTLICHE LIEFERUNGEN',
  fichaTrajectoryOnTimePayments: 'PÜNKTLICHE ZAHLUNGEN',
  fichaTrajectoryCredentials: 'VERIFIZIERTE NACHWEISE',
  fichaTrajectoryUniqueParties: 'EINZIGARTIGE GEGENPARTEIEN',
  fichaTrajectoryDisputes: 'OFFENE STREITIGKEITEN',
  fichaPublicBadge: 'ÖFFENTLICH MIT EINWILLIGUNG',
  fichaSelfNotice: 'DIES IST IHR ÖFFENTLICHES PROFIL · SO SEHEN ANDERE VERIFIZIERTE AKTEURE SIE',
  fichaConfigError: 'Konfiguration unvollständig',
  fichaConfigErrorDetail: 'Server-Anmeldedaten fehlen. Bitte benachrichtigen Sie den Administrator.',
  fichaKycRequiredTitle: 'Verifizierung ausstehend',
  fichaKycRequiredDetail: 'Sie müssen Ihre KYC abschließen, um Profile anderer Akteure einzusehen.',
  fichaKycRequiredAction: 'Zu meinem Arbeitsbereich',
  fichaDbErrorTitle: 'Vorübergehender Fehler',
  fichaDbErrorDetailDefault: 'Das Profil konnte derzeit nicht geladen werden.',

  perfilBackLink: '← Arbeitsbereich',
  perfilEyebrow: '◆ MEIN PROFIL',
  perfilTitle: 'Einstellungen und Sichtbarkeit',
  perfilVisibilitySectionTitle: 'Privatsphäre und Sichtbarkeit',
  perfilVisibilityIntro: 'Sie entscheiden, welche Informationen über Sie öffentlich sind. Sie können diese Entscheidungen jederzeit ändern — die Änderung wird sofort wirksam (DSGVO Art. 7, widerrufbare Einwilligung).',
  perfilAvatarTitle: 'Ihr öffentliches Foto',
  perfilAvatarHint: 'Avatar oder Logo, das in Ihrem öffentlichen Profil sichtbar ist. JPG/PNG/WebP bis 5 MB. Quadratisch automatisch zugeschnitten.',
  perfilAvatarUploadBtn: 'Foto hochladen',
  perfilAvatarReplaceBtn: 'Foto ändern',
  perfilAvatarDeleteBtn: 'Foto entfernen',
  perfilAvatarUploading: 'Hochladen…',
  perfilSeeMyFiche: 'Mein öffentliches Profil ansehen →',
  perfilLegalNote: 'RECHTSGRUNDLAGE · DSGVO ART. 6(b) VERTRAGSERFÜLLUNG + ART. 7 WIDERRUFBARE EINWILLIGUNG · ART. 25 PRIVACY BY DESIGN. DIESES OPT-OUT KANN JEDERZEIT AKTIVIERT WERDEN. FRÜHERE VERARBEITUNG WIRD NICHT RÜCKWIRKEND UNGÜLTIG.',
  perfilErrorTitle: 'Vorübergehender Fehler',

  visibilityDirectoryQuestionShort: 'Erscheinen Sie im öffentlichen Akteursverzeichnis?',
  visibilityDirectoryDetailShort: 'Andere KYC-verifizierte Akteure können Ihren Namen, Sektor, Rolle, Land und Stadt sehen und eine Unterhaltung mit Ihnen beginnen.',
  visibilityTrajectoryQuestionShort: 'Zeigen Sie Ihren Werdegang der Operationen?',
  visibilityTrajectoryDetailShort: 'Ihr öffentliches Profil zeigt Kennzahlen aus echten Operationen (abgeschlossene Operationen, pünktliche Lieferungen, pünktliche Zahlungen). Bei NEIN wird dieser Abschnitt vor anderen verborgen.',
  visibilityChoiceYes: 'Ja, ich stimme zu',
  visibilityChoiceNo: 'Nein, ich lehne ab',
  visibilityErrorPrefix: 'FEHLER',

  chatBtnStartWith: 'CHAT MIT {name} STARTEN',
  chatBtnStarting: 'STARTET…',
  chatBtnConnecting: 'VERBINDET…',
  chatBtnErrorPrefix: 'FEHLER',

  catalogoEyebrow: 'Katalog',
  catalogoTitle: 'Produkte des Sektors',
  catalogoBody: 'Produkte nach Kategorie durchsuchen. Feinsuche mit echten Daten (Foto, Preis, Bestand, Bewertung) kommt mit der ERP-Anbindung der Lieferanten.',
  catalogoPlaceholder: 'Produkte',

  miCatalogoEyebrow: 'Mein Katalog',
  miCatalogoTitle: 'Ihr veröffentlichter Bestand',
  miCatalogoBody: 'Verbinden Sie Ihr ERP (SAP, Odoo, Holded, Sage oder generisches Webhook) und Ihr Katalog synchronisiert sich automatisch. Keine Website pflegen, keine Fotos hochladen.',
  miCatalogoButton: 'ERP verbinden',

  archivosEyebrow: 'Dateien',
  archivosTitle: 'Ihre Rechtsdokumente',
  archivosBody: 'Alles, was Sie bei der Registrierung hochgeladen haben, griffbereit: Gründungsurkunde, Ausweis des Vertreters, Bank- und Qualitätszertifikate. Jederzeit herunterladbar.',
  archivosEmpty: 'Sie haben noch keine Dokumente hochgeladen.',
  archivosEmptyHint: 'Gehen Sie zurück zur Registrierungsseite Ihres Landes und laden Sie die markierten Zertifikate hoch.',
  archivosDownload: 'Herunterladen',
  archivosRemoveConfirm: '„{filename}“ entfernen? Betrifft nur diese lokale Ansicht.',
  archivosFooter: 'Lokaler Speicher · Migration zu verschlüsseltem Supabase Storage nach Anbindung',

  mensajesEyebrow: 'Interne Post',
  mensajesTitle: 'Interne E-Mail',
  mensajesBody: 'Asynchrone interne Nachrichten zwischen Akteuren (getrennt vom Echtzeit-Chat). Echte Daten in einer künftigen Iteration.',

  pedidosEyebrow: 'Bestellungen · Rückverfolgbarkeit in Echtzeit',
  pedidosTitle: 'Ihre Vorgänge in Echtzeit',
  pedidosBody: 'Jeder Status aktualisiert sich automatisch aus dem ERP des Lieferanten. Webhook rein, Status raus. Die Zahlung wird bei bestätigter Lieferung freigegeben.',

  walletEyebrow: 'Pagos · liberación contra entrega',
  walletTitle: 'Ihre B2B-Liquidität',
  walletBody: 'Saldo, Historie und Zahlungsfreigabe bei bestätigter Lieferung.',

  placeholderText: 'Ansicht {title} · bald mit echten Daten',
  placeholderHint: 'Warten auf Supabase + ERP-Anbindung',

  chatActionChat: 'Chat',
  chatActionCall: 'Anruf',
  chatActionVideo: 'Videoanruf',
  chatActionMeet: 'Besprechung',
  chatActionSchedule: 'Planen',
  chatVideoVision: 'Videoanruf mit Echtzeitübersetzung zwischen Akteuren',
  chatPhaseHint: 'verfügbar in Phase 5',
  chatStatusOnline: 'verbunden',
  chatStatusConnecting: 'verbinde…',
  chatStatusOffline: 'offline',
  chatStatusUnauth: 'anmelden',
  chatStatusError: 'Fehler',
  chatStatusIdle: 'inaktiv',
  chatIntro: 'Eins-zu-eins-Nachrichten zwischen verifizierten Akteuren.',
  chatOpenButton: 'Chat öffnen',
  chatSignInPrompt: 'Melden Sie sich als verifizierter Akteur an, um Nachrichten zu nutzen.',
  chatRecipientPlaceholder: 'Akteur-ID (UUID)',
  chatOpenConversation: 'Öffnen',
  chatNoConversations: 'Keine Unterhaltungen',
  chatPresenceLive: 'online',
  chatPresenceOffline: 'offline',
  chatPickConversation: 'Unterhaltung wählen oder starten',
  chatConversationFallback: 'Unterhaltung',
  chatNoMessages: 'Noch keine Nachrichten',
  chatMsgSending: 'senden…',
  chatMsgRead: 'gelesen',
  chatMsgSent: 'gesendet',
  chatComposerPlaceholder: 'Nachricht schreiben…',
  chatSendButton: 'Senden',

  tabAgenda: 'Kalender',
  agendaEyebrow: 'Kalender',
  agendaTitle: 'Ihr Besprechungskalender',
  agendaBody: 'Planen und prüfen Sie Ihre Besprechungen mit anderen Akteuren. Vorerst ist der Kalender lokal auf diesem Gerät; Synchronisierung und Einladungen an andere Akteure kommen mit dem Verzeichnis (Phase 6).',
  agendaToday: 'Heute',
  agendaNewMeeting: 'Neue Besprechung',
  agendaEventTitle: 'Titel',
  agendaEventTitlePlaceholder: 'z. B. Anruf mit Lieferant',
  agendaStart: 'Beginn',
  agendaEnd: 'Ende',
  agendaNote: 'Notiz',
  agendaNotePlaceholder: 'Details (optional)',
  agendaSave: 'Speichern',
  agendaCancel: 'Abbrechen',
  agendaDelete: 'Löschen',
  agendaEdit: 'Bearbeiten',
  agendaPickDay: 'Wählen Sie einen Tag im Kalender',
  agendaNoEventsDay: 'Keine Besprechungen an diesem Tag',
  agendaUpcoming: 'Anstehende Besprechungen',
  agendaNoUpcoming: 'Sie haben keine anstehenden Besprechungen',
  agendaFooter: 'Lokaler Speicher · Migriert zu Supabase und ermöglicht das Einladen anderer Akteure, sobald das Verzeichnis verbunden ist',

  desktopFrameEmptyTitle: 'Klicken, um ein persönliches Foto hinzuzufügen',
  desktopFrameReplaceTitle: 'Klicken, um das Foto zu ändern',
  desktopDeleteTitle: 'Foto löschen',
  desktopErrorUpload: 'Foto konnte nicht hochgeladen werden',
  desktopErrorDelete: 'Foto konnte nicht gelöscht werden',
}

const WS_IT: WorkspaceStrings = {
  workspaceLabel: 'Scrivania',
  dgmLabel: 'DGM · CROSS-SETTORE',
  dgmBody: 'Messaggi e profilo viaggiano con te tra settori. I cataloghi restano in ognuno di essi.',

  tabBuscador: 'Cerca',
  tabInicio: 'Home',
  tabCatalogo: 'Catalogo',
  tabActores: 'Attori',
  tabPedidos: 'Ordini',
  tabMiCatalogo: 'Il mio catalogo',
  tabArchivos: 'File',
  tabMensajes: 'Posta interna',
  tabExportacion: 'Esportazione',

  marketLabel: 'Mercato · con chi oggi?',
  marketGlobal: 'Mercato globale',
  marketSwitchTitle: 'Cambia mercato per operare con un altro paese',
  marketSearchPlaceholder: 'Cerca paese…',
  marketSearchExamples: 'es. Francia, Giappone, Brasile',
  marketHomeSub: 'Il tuo paese di registrazione',
  searchInSector: 'Cerca in {sector}…',
  searchExamples: 'es. "cemento", "architetto", "porta"',

  operatingIn: 'Operativo in {country}',
  marketSectorLabel: 'Settore',
  jumpToSectorIn: 'Passa a un altro settore in {country}',
  marketCaption: 'Catalogo, attori e prezzi locali',
  backToHomeMarket: '← torna al tuo mercato',

  profileEditTitle: 'Modifica il tuo nome o azienda',
  profileNamePlaceholder: 'Il tuo nome o azienda',
  profilePlaceholderText: 'Il tuo nome / azienda',
  avatarUploadTitle: 'Carica logo o foto profilo',
  avatarChangeTitle: 'Cambia logo / foto',
  companyLogoTitle: 'Logo aziendale (caricato in registrazione)',

  buscadorEyebrow: 'Cerca · {sector}',
  buscadorTitle: 'Di cosa hai bisogno oggi?',
  buscadorBody: 'Cerca un prodotto specifico, un produttore o un professionista. Oppure naviga i gruppi di attori del settore e clicca per vedere l’elenco.',
  buscadorInputPlaceholder: 'Per esempio:  cemento  ·  architetto Milano  ·  porta blindata  ·  ISO 9001…',
  buscadorButton: 'Cerca',
  buscadorActorsLabel: 'Attori del settore · Clicca un ruolo per vedere l’elenco',
  taxonomyDraftNote: 'Classificazione provvisoria · in attesa di validazione settoriale',

  actoresEyebrow: 'Attori',
  actoresTitleAll: 'Aziende e professionisti',
  actoresTitleFiltered: 'Risultati filtrati',
  actoresBodyAll: 'Esplora gli attori del settore. Filtra per ruolo, certificazione o paese.',
  actoresBodyFiltered: 'Attori con il ruolo "{role}".',
  actoresClearFilter: 'Rimuovi filtro',
  actoresLoadMore: 'Carica altri',
  actoresLoadingMore: 'Caricamento…',
  actoresEmpty: 'Ancora nessun attore verificato in questo settore. Appariranno qui quando si uniranno.',
  actoresError: 'Impossibile caricare l\'elenco',

  fichaBackLink: '← Workspace',
  fichaKindCompany: 'AZIENDA',
  fichaKindIndividual: 'PERSONA',
  fichaSelfBadge: 'IL TUO PROFILO',
  fichaOtherBadge: 'ATTORE VERIFICATO',
  fichaKycBadge: 'KYC VERIFICATO',
  fichaIdentityTitle: 'IDENTITÀ',
  fichaIdentitySector: 'SETTORE',
  fichaIdentityRole: 'RUOLO',
  fichaIdentityCountry: 'PAESE',
  fichaIdentityCity: 'CITTÀ',
  fichaIdentityYears: 'ANNI NEL SETTORE',
  fichaIdentityAlta: 'ISCRITTO IL',
  fichaIdentityActorId: 'ACTOR-ID',
  fichaIdentityDid: 'DID DECENTRALIZZATO',
  fichaIdentityDidPending: 'in attesa · Fase 6+',
  fichaIdentityEmployer: 'DATORE DI LAVORO',
  fichaAutoDeclaredBadge: 'AUTO-DICHIARATO',
  perfilEmployerTitle: 'Azienda datore di lavoro',
  perfilEmployerHint: 'Solo se lavori per un\'azienda specifica. AUTO-DICHIARATO (la verifica cross-actor arriva nella Fase 6+).',
  perfilEmployerPlaceholder: 'Es: Inmobiliaria Soler S.L.',
  perfilEmployerSaveBtn: 'Salva',
  perfilEmployerSaving: 'Salvataggio…',
  perfilEmployerClear: 'Cancella',
  fichaTrajectoryTitle: 'PERCORSO · LIVELLO 1',
  fichaTrajectoryScore: 'PUNTEGGIO',
  fichaTrajectorySubtitle: 'Le metriche si riempiono con operazioni reali del marketplace',
  fichaTrajectoryHidden: 'Il tuo percorso è nascosto agli altri attori. Solo tu lo vedi qui. Modificabile in Il Mio Profilo.',
  fichaTrajectoryOps: 'OPERAZIONI CHIUSE',
  fichaTrajectoryOnTimeDeliveries: 'CONSEGNE PUNTUALI',
  fichaTrajectoryOnTimePayments: 'PAGAMENTI PUNTUALI',
  fichaTrajectoryCredentials: 'CREDENZIALI VERIFICATE',
  fichaTrajectoryUniqueParties: 'CONTROPARTI UNICHE',
  fichaTrajectoryDisputes: 'CONTROVERSIE APERTE',
  fichaPublicBadge: 'PUBBLICO PER CONSENSO',
  fichaSelfNotice: 'QUESTO È IL TUO PROFILO PUBBLICO · COSÌ TI VEDONO GLI ALTRI ATTORI VERIFICATI',
  fichaConfigError: 'Configurazione incompleta',
  fichaConfigErrorDetail: 'Mancano le credenziali del server. Avvisa l\'amministratore.',
  fichaKycRequiredTitle: 'Verifica in attesa',
  fichaKycRequiredDetail: 'Devi completare il tuo KYC per vedere i profili di altri attori.',
  fichaKycRequiredAction: 'Vai al mio workspace',
  fichaDbErrorTitle: 'Errore temporaneo',
  fichaDbErrorDetailDefault: 'Impossibile caricare il profilo al momento.',

  perfilBackLink: '← Workspace',
  perfilEyebrow: '◆ IL MIO PROFILO',
  perfilTitle: 'Preferenze e visibilità',
  perfilVisibilitySectionTitle: 'Privacy e visibilità',
  perfilVisibilityIntro: 'Decidi tu quali informazioni su di te sono pubbliche. Puoi modificare queste decisioni in qualsiasi momento — il cambiamento è effettivo immediatamente (GDPR Art. 7, consenso revocabile).',
  perfilAvatarTitle: 'La tua foto pubblica',
  perfilAvatarHint: 'Avatar o logo visibile nel tuo profilo pubblico. JPG/PNG/WebP fino a 5 MB. Ritaglio quadrato automatico.',
  perfilAvatarUploadBtn: 'Carica foto',
  perfilAvatarReplaceBtn: 'Cambia foto',
  perfilAvatarDeleteBtn: 'Rimuovi foto',
  perfilAvatarUploading: 'Caricamento…',
  perfilSeeMyFiche: 'Vedi il mio profilo pubblico →',
  perfilLegalNote: 'BASE LEGALE · GDPR ART. 6(b) NECESSITÀ CONTRATTUALE + ART. 7 CONSENSO REVOCABILE · ART. 25 PRIVACY BY DESIGN. QUESTO OPT-OUT PUÒ ESSERE ATTIVATO IN QUALSIASI MOMENTO. IL TRATTAMENTO PRECEDENTE NON VIENE INVALIDATO RETROATTIVAMENTE.',
  perfilErrorTitle: 'Errore temporaneo',

  visibilityDirectoryQuestionShort: 'Vuoi apparire nella directory pubblica degli Attori?',
  visibilityDirectoryDetailShort: 'Altri attori KYC-verificati potranno vedere il tuo nome, settore, ruolo, paese e città, e iniziare una conversazione con te.',
  visibilityTrajectoryQuestionShort: 'Vuoi mostrare il tuo percorso di operazioni?',
  visibilityTrajectoryDetailShort: 'Il tuo profilo pubblico mostra metriche calcolate da operazioni reali (operazioni chiuse, consegne puntuali, pagamenti puntuali). Se dici NO, quella sezione è nascosta agli altri.',
  visibilityChoiceYes: 'Sì, acconsento',
  visibilityChoiceNo: 'No, non acconsento',
  visibilityErrorPrefix: 'ERRORE',

  chatBtnStartWith: 'AVVIA CHAT CON {name}',
  chatBtnStarting: 'AVVIO…',
  chatBtnConnecting: 'CONNESSIONE…',
  chatBtnErrorPrefix: 'ERRORE',

  catalogoEyebrow: 'Catalogo',
  catalogoTitle: 'Prodotti del settore',
  catalogoBody: 'Naviga i prodotti per categoria. La ricerca fine con dati reali (foto, prezzo, stock, valutazione) arriva al collegamento degli ERP dei fornitori.',
  catalogoPlaceholder: 'Prodotti',

  miCatalogoEyebrow: 'Il mio catalogo',
  miCatalogoTitle: 'Il tuo inventario pubblicato',
  miCatalogoBody: 'Collega il tuo ERP (SAP, Odoo, Holded, Sage o webhook generico) e il catalogo si sincronizza automaticamente. Niente sito da mantenere, niente foto da caricare.',
  miCatalogoButton: 'Collega ERP',

  archivosEyebrow: 'File',
  archivosTitle: 'I tuoi documenti legali',
  archivosBody: 'Tutto ciò che hai caricato in registrazione, a portata di mano: certificato di costituzione, ID rappresentante, certificati bancari e di qualità. Scaricali in qualsiasi momento.',
  archivosEmpty: 'Non hai ancora caricato alcun documento.',
  archivosEmptyHint: 'Torna alla pagina di registrazione del tuo paese e carica i certificati indicati.',
  archivosDownload: 'Scarica',
  archivosRemoveConfirm: 'Rimuovere "{filename}"? Riguarda solo questa vista locale.',
  archivosFooter: 'Archiviazione locale · Migrerà a Supabase Storage cifrato al collegamento',

  mensajesEyebrow: 'Posta interna',
  mensajesTitle: 'Email interna',
  mensajesBody: 'Messaggistica interna asincrona tra attori (distinta dalla chat in tempo reale). Dati reali in un’iterazione futura.',

  pedidosEyebrow: 'Ordini · Tracciabilità in tempo reale',
  pedidosTitle: 'Le tue operazioni, in tempo reale',
  pedidosBody: 'Ogni stato si aggiorna automaticamente dall’ERP del fornitore. Webhook in, status out. Il pagamento viene rilasciato alla consegna confermata.',

  walletEyebrow: 'Pagos · liberación contra entrega',
  walletTitle: 'La tua liquidità B2B',
  walletBody: 'Saldo, storico e rilascio dei pagamenti alla consegna confermata.',

  placeholderText: 'Vista {title} · prossimamente con dati reali',
  placeholderHint: 'In attesa della connessione Supabase + ERP',

  chatActionChat: 'Chat',
  chatActionCall: 'Chiamata',
  chatActionVideo: 'Videochiamata',
  chatActionMeet: 'Riunione',
  chatActionSchedule: 'Pianifica',
  chatVideoVision: 'Videochiamata con traduzione in tempo reale tra attori',
  chatPhaseHint: 'disponibile nella Fase 5',
  chatStatusOnline: 'connesso',
  chatStatusConnecting: 'connessione…',
  chatStatusOffline: 'offline',
  chatStatusUnauth: 'accedi',
  chatStatusError: 'errore',
  chatStatusIdle: 'inattivo',
  chatIntro: 'Messaggistica uno-a-uno tra attori verificati.',
  chatOpenButton: 'Apri chat',
  chatSignInPrompt: 'Accedi come attore verificato per usare i Messaggi.',
  chatRecipientPlaceholder: 'ID attore (UUID)',
  chatOpenConversation: 'Apri',
  chatNoConversations: 'Nessuna conversazione',
  chatPresenceLive: 'online',
  chatPresenceOffline: 'offline',
  chatPickConversation: 'Scegli o avvia una conversazione',
  chatConversationFallback: 'conversazione',
  chatNoMessages: 'Ancora nessun messaggio',
  chatMsgSending: 'invio…',
  chatMsgRead: 'letto',
  chatMsgSent: 'inviato',
  chatComposerPlaceholder: 'Scrivi un messaggio…',
  chatSendButton: 'Invia',

  tabAgenda: 'Agenda',
  agendaEyebrow: 'Agenda',
  agendaTitle: 'La tua agenda di riunioni',
  agendaBody: 'Pianifica e consulta le tue riunioni con altri attori. Per ora l’agenda è locale a questo dispositivo; la sincronizzazione e gli inviti ad altri attori arrivano con la directory (Fase 6).',
  agendaToday: 'Oggi',
  agendaNewMeeting: 'Nuova riunione',
  agendaEventTitle: 'Titolo',
  agendaEventTitlePlaceholder: 'es. Chiamata con fornitore',
  agendaStart: 'Inizio',
  agendaEnd: 'Fine',
  agendaNote: 'Nota',
  agendaNotePlaceholder: 'Dettagli (facoltativo)',
  agendaSave: 'Salva',
  agendaCancel: 'Annulla',
  agendaDelete: 'Elimina',
  agendaEdit: 'Modifica',
  agendaPickDay: 'Scegli un giorno dal calendario',
  agendaNoEventsDay: 'Nessuna riunione in questo giorno',
  agendaUpcoming: 'Prossime riunioni',
  agendaNoUpcoming: 'Non hai riunioni in programma',
  agendaFooter: 'Archiviazione locale · Migrerà a Supabase e consentirà di invitare altri attori al collegamento della directory',

  desktopFrameEmptyTitle: 'Clicca per aggiungere una foto personale',
  desktopFrameReplaceTitle: 'Clicca per cambiare la foto',
  desktopDeleteTitle: 'Elimina foto',
  desktopErrorUpload: 'Impossibile caricare la foto',
  desktopErrorDelete: 'Impossibile eliminare la foto',
}

const WS_PT: WorkspaceStrings = {
  workspaceLabel: 'Espaço de trabalho',
  dgmLabel: 'DGM · INTERSECTORIAL',
  dgmBody: 'Mensagens e perfil viajam contigo entre setores. Os catálogos ficam dentro de cada um.',

  tabBuscador: 'Pesquisar',
  tabInicio: 'Início',
  tabCatalogo: 'Catálogo',
  tabActores: 'Atores',
  tabPedidos: 'Pedidos',
  tabMiCatalogo: 'O meu catálogo',
  tabArchivos: 'Ficheiros',
  tabMensajes: 'Correio interno',
  tabExportacion: 'Exportação',

  marketLabel: 'Mercado · com quem hoje?',
  marketGlobal: 'Mercado global',
  marketSwitchTitle: 'Muda de mercado para operar com outro país',
  marketSearchPlaceholder: 'Procurar país…',
  marketSearchExamples: 'ex. França, Japão, Brasil',
  marketHomeSub: 'O teu país de registo',
  searchInSector: 'Pesquisar em {sector}…',
  searchExamples: 'ex. "cimento", "arquiteto", "porta"',

  operatingIn: 'A operar em {country}',
  marketSectorLabel: 'Setor',
  jumpToSectorIn: 'Ir para outro setor em {country}',
  marketCaption: 'Catálogo, atores e preços locais',
  backToHomeMarket: '← voltar ao teu mercado',

  profileEditTitle: 'Editar nome ou empresa',
  profileNamePlaceholder: 'O teu nome ou empresa',
  profilePlaceholderText: 'O teu nome / empresa',
  avatarUploadTitle: 'Carregar logo ou foto de perfil',
  avatarChangeTitle: 'Mudar logo / foto',
  companyLogoTitle: 'Logo da empresa (carregado no registo)',

  buscadorEyebrow: 'Pesquisar · {sector}',
  buscadorTitle: 'De que precisas hoje?',
  buscadorBody: 'Procura um produto concreto, um fabricante ou um profissional. Ou navega os grupos de atores do setor e clica para ver a lista.',
  buscadorInputPlaceholder: 'Por exemplo:  cimento  ·  arquiteto Lisboa  ·  porta blindada  ·  ISO 9001…',
  buscadorButton: 'Pesquisar',
  buscadorActorsLabel: 'Atores do setor · Clica num papel para ver a lista',
  taxonomyDraftNote: 'Classificação provisória · pendente de validação setorial',

  actoresEyebrow: 'Atores',
  actoresTitleAll: 'Empresas e profissionais',
  actoresTitleFiltered: 'Resultados filtrados',
  actoresBodyAll: 'Navegue pelos atores do setor. Filtre por papel, certificação ou país.',
  actoresBodyFiltered: 'Atores com o papel "{role}".',
  actoresClearFilter: 'Limpar filtro',
  actoresLoadMore: 'Carregar mais',
  actoresLoadingMore: 'Carregando…',
  actoresEmpty: 'Ainda não há atores verificados neste setor. Aparecerão aqui quando se inscreverem.',
  actoresError: 'Não foi possível carregar a lista',

  fichaBackLink: '← Workspace',
  fichaKindCompany: 'EMPRESA',
  fichaKindIndividual: 'PESSOA',
  fichaSelfBadge: 'O SEU PERFIL',
  fichaOtherBadge: 'ATOR VERIFICADO',
  fichaKycBadge: 'KYC VERIFICADO',
  fichaIdentityTitle: 'IDENTIDADE',
  fichaIdentitySector: 'SETOR',
  fichaIdentityRole: 'PAPEL',
  fichaIdentityCountry: 'PAÍS',
  fichaIdentityCity: 'CIDADE',
  fichaIdentityYears: 'ANOS NO SETOR',
  fichaIdentityAlta: 'INSCRITO EM',
  fichaIdentityActorId: 'ACTOR-ID',
  fichaIdentityDid: 'DID DESCENTRALIZADO',
  fichaIdentityDidPending: 'pendente · Fase 6+',
  fichaIdentityEmployer: 'EMPREGADOR',
  fichaAutoDeclaredBadge: 'AUTO-DECLARADO',
  perfilEmployerTitle: 'Empresa empregadora',
  perfilEmployerHint: 'Apenas se trabalha para uma empresa específica. AUTO-DECLARADO (verificação cross-actor chega na Fase 6+).',
  perfilEmployerPlaceholder: 'Ex: Inmobiliaria Soler S.L.',
  perfilEmployerSaveBtn: 'Guardar',
  perfilEmployerSaving: 'A guardar…',
  perfilEmployerClear: 'Limpar',
  fichaTrajectoryTitle: 'TRAJETÓRIA · CAMADA 1',
  fichaTrajectoryScore: 'PONTUAÇÃO',
  fichaTrajectorySubtitle: 'As métricas preenchem-se com operações reais do marketplace',
  fichaTrajectoryHidden: 'A sua trajetória está oculta para outros atores. Só você a vê aqui. Pode alterar em Meu Perfil.',
  fichaTrajectoryOps: 'OPERAÇÕES FECHADAS',
  fichaTrajectoryOnTimeDeliveries: 'ENTREGAS PONTUAIS',
  fichaTrajectoryOnTimePayments: 'PAGAMENTOS PONTUAIS',
  fichaTrajectoryCredentials: 'CREDENCIAIS VERIFICADAS',
  fichaTrajectoryUniqueParties: 'CONTRAPARTES ÚNICAS',
  fichaTrajectoryDisputes: 'DISPUTAS ABERTAS',
  fichaPublicBadge: 'PÚBLICO POR CONSENTIMENTO',
  fichaSelfNotice: 'ESTE É O SEU PERFIL PÚBLICO · É ASSIM QUE OUTROS ATORES VERIFICADOS O VEEM',
  fichaConfigError: 'Configuração incompleta',
  fichaConfigErrorDetail: 'Faltam credenciais do servidor. Avise o administrador.',
  fichaKycRequiredTitle: 'Verificação pendente',
  fichaKycRequiredDetail: 'Precisa de completar o seu KYC para ver perfis de outros atores.',
  fichaKycRequiredAction: 'Ir para o meu workspace',
  fichaDbErrorTitle: 'Erro temporário',
  fichaDbErrorDetailDefault: 'Não foi possível carregar o perfil neste momento.',

  perfilBackLink: '← Workspace',
  perfilEyebrow: '◆ MEU PERFIL',
  perfilTitle: 'Preferências e visibilidade',
  perfilVisibilitySectionTitle: 'Privacidade e visibilidade',
  perfilVisibilityIntro: 'Você decide que informações sobre você são públicas. Pode alterar estas decisões a qualquer momento — a mudança é efetiva imediatamente (RGPD Art. 7, consentimento revogável).',
  perfilAvatarTitle: 'A sua foto pública',
  perfilAvatarHint: 'Avatar ou logótipo visível no seu perfil público. JPG/PNG/WebP até 5 MB. Recorte quadrado automático.',
  perfilAvatarUploadBtn: 'Carregar foto',
  perfilAvatarReplaceBtn: 'Alterar foto',
  perfilAvatarDeleteBtn: 'Remover foto',
  perfilAvatarUploading: 'A carregar…',
  perfilSeeMyFiche: 'Ver o meu perfil público →',
  perfilLegalNote: 'BASE LEGAL · RGPD ART. 6(b) NECESSIDADE CONTRATUAL + ART. 7 CONSENTIMENTO REVOGÁVEL · ART. 25 PRIVACY BY DESIGN. ESTE OPT-OUT PODE SER ATIVADO A QUALQUER MOMENTO. O TRATAMENTO ANTERIOR NÃO É INVALIDADO RETROATIVAMENTE.',
  perfilErrorTitle: 'Erro temporário',

  visibilityDirectoryQuestionShort: 'Aparece na directoria pública de Atores?',
  visibilityDirectoryDetailShort: 'Outros atores KYC-verificados poderão ver o seu nome, setor, papel, país e cidade, e iniciar uma conversa consigo.',
  visibilityTrajectoryQuestionShort: 'Mostra a sua trajetória de operações?',
  visibilityTrajectoryDetailShort: 'O seu perfil público mostra métricas calculadas a partir de operações reais (operações fechadas, entregas pontuais, pagamentos pontuais). Se disser NÃO, essa secção é ocultada aos outros.',
  visibilityChoiceYes: 'Sim, consinto',
  visibilityChoiceNo: 'Não consinto',
  visibilityErrorPrefix: 'ERRO',

  chatBtnStartWith: 'INICIAR CHAT COM {name}',
  chatBtnStarting: 'A INICIAR…',
  chatBtnConnecting: 'A CONECTAR…',
  chatBtnErrorPrefix: 'ERRO',

  catalogoEyebrow: 'Catálogo',
  catalogoTitle: 'Produtos do setor',
  catalogoBody: 'Navega produtos por categoria. A pesquisa fina com dados reais (foto, preço, stock, avaliação) chega quando ligarmos os ERPs dos fornecedores.',
  catalogoPlaceholder: 'Produtos',

  miCatalogoEyebrow: 'O meu catálogo',
  miCatalogoTitle: 'O teu inventário publicado',
  miCatalogoBody: 'Liga o teu ERP (SAP, Odoo, Holded, Sage ou webhook genérico) e o catálogo sincroniza-se automaticamente. Sem site para manter, sem fotos para carregar.',
  miCatalogoButton: 'Ligar ERP',

  archivosEyebrow: 'Ficheiros',
  archivosTitle: 'Os teus documentos legais',
  archivosBody: 'Tudo o que carregaste no registo, à mão: certidão de constituição, ID do representante, certificados bancários e de qualidade. Descarrega quando quiseres.',
  archivosEmpty: 'Ainda não carregaste qualquer documento.',
  archivosEmptyHint: 'Volta à página de registo do teu país e carrega os certificados indicados.',
  archivosDownload: 'Descarregar',
  archivosRemoveConfirm: 'Remover "{filename}"? Apenas afeta esta vista local.',
  archivosFooter: 'Armazenamento local · Migrará para Supabase Storage cifrado quando ligado',

  mensajesEyebrow: 'Correio interno',
  mensajesTitle: 'E-mail interno',
  mensajesBody: 'Mensagens internas assíncronas entre atores (distinta do chat em tempo real). Dados reais numa iteração futura.',

  pedidosEyebrow: 'Pedidos · Rastreabilidade em tempo real',
  pedidosTitle: 'As tuas operações, em tempo real',
  pedidosBody: 'Cada estado atualiza-se automaticamente a partir do ERP do fornecedor. Webhook in, status out. O pagamento é libertado contra entrega confirmada.',

  walletEyebrow: 'Pagos · liberación contra entrega',
  walletTitle: 'A tua liquidez B2B',
  walletBody: 'Saldo, histórico e libertação de pagamentos contra entrega confirmada.',

  placeholderText: 'Vista {title} · em breve com dados reais',
  placeholderHint: 'À espera da ligação Supabase + ERPs',

  chatActionChat: 'Chat',
  chatActionCall: 'Chamada',
  chatActionVideo: 'Videochamada',
  chatActionMeet: 'Reunião',
  chatActionSchedule: 'Agendar',
  chatVideoVision: 'Videochamada com tradução em tempo real entre atores',
  chatPhaseHint: 'disponível na Fase 5',
  chatStatusOnline: 'conectado',
  chatStatusConnecting: 'a ligar…',
  chatStatusOffline: 'sem ligação',
  chatStatusUnauth: 'iniciar sessão',
  chatStatusError: 'erro',
  chatStatusIdle: 'inativo',
  chatIntro: 'Mensagens individuais entre atores verificados.',
  chatOpenButton: 'Abrir chat',
  chatSignInPrompt: 'Inicia sessão como ator verificado para usar as Mensagens.',
  chatRecipientPlaceholder: 'ID do ator (UUID)',
  chatOpenConversation: 'Abrir',
  chatNoConversations: 'Sem conversas',
  chatPresenceLive: 'online',
  chatPresenceOffline: 'offline',
  chatPickConversation: 'Escolhe ou inicia uma conversa',
  chatConversationFallback: 'conversa',
  chatNoMessages: 'Ainda sem mensagens',
  chatMsgSending: 'a enviar…',
  chatMsgRead: 'lido',
  chatMsgSent: 'enviado',
  chatComposerPlaceholder: 'Escreve uma mensagem…',
  chatSendButton: 'Enviar',

  tabAgenda: 'Agenda',
  agendaEyebrow: 'Agenda',
  agendaTitle: 'A tua agenda de reuniões',
  agendaBody: 'Agenda e consulta as tuas reuniões com outros atores. Por agora a agenda é local a este dispositivo; a sincronização e os convites a outros atores chegam com o diretório (Fase 6).',
  agendaToday: 'Hoje',
  agendaNewMeeting: 'Nova reunião',
  agendaEventTitle: 'Título',
  agendaEventTitlePlaceholder: 'ex. Chamada com fornecedor',
  agendaStart: 'Início',
  agendaEnd: 'Fim',
  agendaNote: 'Nota',
  agendaNotePlaceholder: 'Detalhes (opcional)',
  agendaSave: 'Guardar',
  agendaCancel: 'Cancelar',
  agendaDelete: 'Eliminar',
  agendaEdit: 'Editar',
  agendaPickDay: 'Escolhe um dia do calendário',
  agendaNoEventsDay: 'Sem reuniões neste dia',
  agendaUpcoming: 'Próximas reuniões',
  agendaNoUpcoming: 'Não tens reuniões próximas',
  agendaFooter: 'Armazenamento local · Migrará para Supabase e permitirá convidar outros atores quando o diretório for ligado',

  desktopFrameEmptyTitle: 'Clique para adicionar uma foto pessoal',
  desktopFrameReplaceTitle: 'Clique para mudar a foto',
  desktopDeleteTitle: 'Apagar foto',
  desktopErrorUpload: 'Não foi possível enviar a foto',
  desktopErrorDelete: 'Não foi possível apagar a foto',
}

const WS_ZH: WorkspaceStrings = {
  workspaceLabel: '工作台',
  dgmLabel: 'DGM · 跨行业枢纽',
  dgmBody: '消息和资料随您穿行各行业。目录则保留在各自的行业内。',

  tabBuscador: '搜索',
  tabInicio: '首页',
  tabCatalogo: '目录',
  tabActores: '参与者',
  tabPedidos: '订单',
  tabMiCatalogo: '我的目录',
  tabArchivos: '文件',
  tabMensajes: '内部邮件',
  tabExportacion: '出口',

  marketLabel: '市场 · 今天与谁?',
  marketGlobal: '全球市场',
  marketSwitchTitle: '切换市场以与其他国家进行业务',
  marketSearchPlaceholder: '搜索国家…',
  marketSearchExamples: '如:法国、日本、巴西',
  marketHomeSub: '您的注册国家',
  searchInSector: '在 {sector} 中搜索…',
  searchExamples: '如:"水泥"、"建筑师"、"门"',

  operatingIn: '正在 {country} 运营',
  marketSectorLabel: '行业',
  jumpToSectorIn: '在 {country} 切换到其他行业',
  marketCaption: '目录、参与者和本地价格',
  backToHomeMarket: '← 返回您的本地市场',

  profileEditTitle: '编辑姓名或公司',
  profileNamePlaceholder: '您的姓名或公司',
  profilePlaceholderText: '您的姓名 / 公司',
  avatarUploadTitle: '上传公司标识或个人头像',
  avatarChangeTitle: '更换标识 / 头像',
  companyLogoTitle: '公司标识(注册时上传)',

  buscadorEyebrow: '搜索 · {sector}',
  buscadorTitle: '今天您需要什么?',
  buscadorBody: '搜索具体产品、制造商或专业人士。或浏览本行业的参与者分组,点击查看名单。',
  buscadorInputPlaceholder: '例如:水泥  ·  上海建筑师  ·  防盗门  ·  ISO 9001…',
  buscadorButton: '搜索',
  buscadorActorsLabel: '行业参与者 · 点击角色查看名单',
  taxonomyDraftNote: '临时分类 · 待行业验证',

  actoresEyebrow: '参与者',
  actoresTitleAll: '企业与专业人士',
  actoresTitleFiltered: '筛选结果',
  actoresBodyAll: '浏览该行业的参与者。按角色、认证或国家筛选。',
  actoresBodyFiltered: '显示角色为"{role}"的参与者。',
  actoresClearFilter: '清除筛选',
  actoresLoadMore: '加载更多',
  actoresLoadingMore: '加载中…',
  actoresEmpty: '该行业暂无已验证的参与者。一旦加入,他们将显示在此处。',
  actoresError: '无法加载列表',

  fichaBackLink: '← 工作台',
  fichaKindCompany: '企业',
  fichaKindIndividual: '个人',
  fichaSelfBadge: '您的资料',
  fichaOtherBadge: '已验证参与者',
  fichaKycBadge: 'KYC 已验证',
  fichaIdentityTitle: '身份',
  fichaIdentitySector: '行业',
  fichaIdentityRole: '角色',
  fichaIdentityCountry: '国家',
  fichaIdentityCity: '城市',
  fichaIdentityYears: '行业年资',
  fichaIdentityAlta: '加入时间',
  fichaIdentityActorId: 'ACTOR-ID',
  fichaIdentityDid: '去中心化 DID',
  fichaIdentityDidPending: '待定 · 第 6 阶段+',
  fichaIdentityEmployer: '雇主',
  fichaAutoDeclaredBadge: '自行声明',
  perfilEmployerTitle: '雇主公司',
  perfilEmployerHint: '仅当您为特定公司工作时。自行声明(跨参与者验证将在第 6 阶段+ 推出)。',
  perfilEmployerPlaceholder: '例如:Inmobiliaria Soler S.L.',
  perfilEmployerSaveBtn: '保存',
  perfilEmployerSaving: '正在保存…',
  perfilEmployerClear: '清除',
  fichaTrajectoryTitle: '履历 · 第一层',
  fichaTrajectoryScore: '评分',
  fichaTrajectorySubtitle: '指标将通过市场上的真实操作填充',
  fichaTrajectoryHidden: '您的履历对其他参与者隐藏。只有您在此处看到。可在「我的资料」中修改。',
  fichaTrajectoryOps: '已完成的操作',
  fichaTrajectoryOnTimeDeliveries: '按时交付',
  fichaTrajectoryOnTimePayments: '按时付款',
  fichaTrajectoryCredentials: '已验证证书',
  fichaTrajectoryUniqueParties: '独特交易对手',
  fichaTrajectoryDisputes: '未结争议',
  fichaPublicBadge: '经同意公开',
  fichaSelfNotice: '这是您的公开资料 · 其他已验证参与者将这样看到您',
  fichaConfigError: '配置不完整',
  fichaConfigErrorDetail: '缺少服务器凭据。请通知管理员。',
  fichaKycRequiredTitle: '验证待处理',
  fichaKycRequiredDetail: '您需要完成 KYC 才能查看其他参与者的资料。',
  fichaKycRequiredAction: '前往我的工作台',
  fichaDbErrorTitle: '临时错误',
  fichaDbErrorDetailDefault: '目前无法加载资料。',

  perfilBackLink: '← 工作台',
  perfilEyebrow: '◆ 我的资料',
  perfilTitle: '偏好和可见性',
  perfilVisibilitySectionTitle: '隐私与可见性',
  perfilVisibilityIntro: '您决定哪些关于您的信息是公开的。您可以随时更改这些决定 — 变更立即生效(GDPR 第 7 条,可撤回的同意)。',
  perfilAvatarTitle: '您的公开照片',
  perfilAvatarHint: '显示在您公开资料中的头像或徽标。JPG/PNG/WebP,最大 5 MB。自动方形裁剪。',
  perfilAvatarUploadBtn: '上传照片',
  perfilAvatarReplaceBtn: '更换照片',
  perfilAvatarDeleteBtn: '删除照片',
  perfilAvatarUploading: '正在上传…',
  perfilSeeMyFiche: '查看我的公开资料 →',
  perfilLegalNote: '法律依据 · GDPR 第 6(b) 条合同必要性 + 第 7 条可撤回同意 · 第 25 条隐私设计。此退出选项可随时启用。隐藏资料前的处理不会被追溯无效。',
  perfilErrorTitle: '临时错误',

  visibilityDirectoryQuestionShort: '您是否出现在公开的参与者目录中?',
  visibilityDirectoryDetailShort: '其他 KYC 验证的参与者将能看到您的姓名、行业、角色、国家和城市,并可以与您发起对话。',
  visibilityTrajectoryQuestionShort: '您是否显示您的操作履历?',
  visibilityTrajectoryDetailShort: '您的公开资料显示根据真实操作计算的指标(已完成操作、按时交付、按时付款)。如果选择「否」,该部分将对其他人隐藏。',
  visibilityChoiceYes: '是,我同意',
  visibilityChoiceNo: '否,我不同意',
  visibilityErrorPrefix: '错误',

  chatBtnStartWith: '与 {name} 开始聊天',
  chatBtnStarting: '正在开始…',
  chatBtnConnecting: '正在连接…',
  chatBtnErrorPrefix: '错误',

  catalogoEyebrow: '目录',
  catalogoTitle: '行业产品',
  catalogoBody: '按类别浏览产品。带有真实数据(照片、价格、库存、评级)的精细搜索将在我们对接供应商 ERP 后上线。',
  catalogoPlaceholder: '产品',

  miCatalogoEyebrow: '我的目录',
  miCatalogoTitle: '您发布的库存',
  miCatalogoBody: '连接您的 ERP(SAP、Odoo、Holded、Sage 或通用 webhook),目录自动同步。无需维护网站,无需上传图片。',
  miCatalogoButton: '连接 ERP',

  archivosEyebrow: '文件',
  archivosTitle: '您的法律文件',
  archivosBody: '注册时上传的全部材料随时可取:公司设立证明、代表身份证件、银行与质量证书。可随时下载。',
  archivosEmpty: '您尚未上传任何文件。',
  archivosEmptyHint: '请返回您所在国家的注册页面,上传所标注的证书。',
  archivosDownload: '下载',
  archivosRemoveConfirm: '删除"{filename}"?仅影响本地视图。',
  archivosFooter: '本地存储 · 接入后将迁移至加密 Supabase Storage',

  mensajesEyebrow: '内部邮件',
  mensajesTitle: '内部电子邮件',
  mensajesBody: '参与者之间的异步内部消息（区别于实时聊天）。真实数据将在后续迭代接入。',

  pedidosEyebrow: '订单 · 实时可追溯',
  pedidosTitle: '您的业务,实时同步',
  pedidosBody: '每个状态都从供应商 ERP 自动更新。Webhook 入,状态出。付款在确认交付后释放。',

  walletEyebrow: 'Pagos · liberación contra entrega',
  walletTitle: '您的 B2B 流动性',
  walletBody: '余额、历史与确认交付后的付款释放。',

  placeholderText: '{title} 视图 · 真实数据即将上线',
  placeholderHint: '等待 Supabase 与 ERP 接入',

  chatActionChat: '聊天',
  chatActionCall: '通话',
  chatActionVideo: '视频通话',
  chatActionMeet: '会议',
  chatActionSchedule: '预约',
  chatVideoVision: '参与者之间的实时翻译视频通话',
  chatPhaseHint: '将在第 5 阶段推出',
  chatStatusOnline: '已连接',
  chatStatusConnecting: '连接中…',
  chatStatusOffline: '离线',
  chatStatusUnauth: '请登录',
  chatStatusError: '错误',
  chatStatusIdle: '空闲',
  chatIntro: '已验证参与者之间的一对一消息。',
  chatOpenButton: '打开聊天',
  chatSignInPrompt: '请以已验证参与者身份登录以使用消息功能。',
  chatRecipientPlaceholder: '参与者 ID (UUID)',
  chatOpenConversation: '打开',
  chatNoConversations: '暂无会话',
  chatPresenceLive: '在线',
  chatPresenceOffline: '离线',
  chatPickConversation: '选择或开始一个会话',
  chatConversationFallback: '会话',
  chatNoMessages: '暂无消息',
  chatMsgSending: '发送中…',
  chatMsgRead: '已读',
  chatMsgSent: '已发送',
  chatComposerPlaceholder: '输入消息…',
  chatSendButton: '发送',

  tabAgenda: '日程',
  agendaEyebrow: '日程',
  agendaTitle: '你的会议日程',
  agendaBody: '安排并查看你与其他参与者的会议。目前日程仅保存在本设备;同步与邀请其他参与者将随目录(第 6 阶段)推出。',
  agendaToday: '今天',
  agendaNewMeeting: '新会议',
  agendaEventTitle: '标题',
  agendaEventTitlePlaceholder: '例如:与供应商通话',
  agendaStart: '开始',
  agendaEnd: '结束',
  agendaNote: '备注',
  agendaNotePlaceholder: '详情(可选)',
  agendaSave: '保存',
  agendaCancel: '取消',
  agendaDelete: '删除',
  agendaEdit: '编辑',
  agendaPickDay: '从日历中选择一天',
  agendaNoEventsDay: '当天没有会议',
  agendaUpcoming: '即将到来的会议',
  agendaNoUpcoming: '你没有即将到来的会议',
  agendaFooter: '本地存储 · 接入目录后将迁移至 Supabase 并支持邀请其他参与者',

  desktopFrameEmptyTitle: '点击添加个人照片',
  desktopFrameReplaceTitle: '点击更换照片',
  desktopDeleteTitle: '删除照片',
  desktopErrorUpload: '无法上传照片',
  desktopErrorDelete: '无法删除照片',
}

const WS_JA: WorkspaceStrings = {
  workspaceLabel: 'ワークスペース',
  dgmLabel: 'DGM · 業種横断ハブ',
  dgmBody: 'メッセージとプロフィールは業種をまたいで持ち運べます。カタログは各業種内に残ります。',

  tabBuscador: '検索',
  tabInicio: 'ホーム',
  tabCatalogo: 'カタログ',
  tabActores: 'アクター',
  tabPedidos: '発注',
  tabMiCatalogo: 'マイカタログ',
  tabArchivos: 'ファイル',
  tabMensajes: '内部メール',
  tabExportacion: '輸出',

  marketLabel: 'マーケット · 今日は誰と?',
  marketGlobal: 'グローバル市場',
  marketSwitchTitle: '別の国とやり取りするには市場を切り替えます',
  marketSearchPlaceholder: '国を検索…',
  marketSearchExamples: '例: フランス、日本、ブラジル',
  marketHomeSub: '登録国',
  searchInSector: '{sector} で検索…',
  searchExamples: '例: 「セメント」「建築士」「ドア」',

  operatingIn: '{country} で稼働中',
  marketSectorLabel: 'セクター',
  jumpToSectorIn: '{country} の別セクターへ切替',
  marketCaption: 'カタログ・アクター・現地価格',
  backToHomeMarket: '← 自国市場へ戻る',

  profileEditTitle: '名前または会社名を編集',
  profileNamePlaceholder: 'お名前または会社名',
  profilePlaceholderText: 'お名前 / 会社名',
  avatarUploadTitle: 'ロゴまたはプロフィール写真をアップロード',
  avatarChangeTitle: 'ロゴ / 写真を変更',
  companyLogoTitle: '会社ロゴ(登録時にアップロード)',

  buscadorEyebrow: '検索 · {sector}',
  buscadorTitle: '今日は何が必要ですか?',
  buscadorBody: '具体的な製品、メーカー、または専門家を検索します。あるいは業種のアクター群をたどり、クリックで一覧を表示します。',
  buscadorInputPlaceholder: '例: セメント · 東京の建築士 · 防犯ドア · ISO 9001…',
  buscadorButton: '検索',
  buscadorActorsLabel: '業種のアクター · 役割をクリックして一覧表示',
  taxonomyDraftNote: '暫定分類 · 業界による検証待ち',

  actoresEyebrow: 'アクター',
  actoresTitleAll: '企業とプロフェッショナル',
  actoresTitleFiltered: '絞り込み結果',
  actoresBodyAll: 'この分野のアクターを参照します。役割、認証、または国でフィルタリングします。',
  actoresBodyFiltered: '役割「{role}」のアクターを表示しています。',
  actoresClearFilter: 'フィルターをクリア',
  actoresLoadMore: 'もっと読み込む',
  actoresLoadingMore: '読み込み中…',
  actoresEmpty: 'この分野にはまだ認証済みのアクターがいません。参加すると、ここに表示されます。',
  actoresError: 'リストを読み込めませんでした',

  fichaBackLink: '← ワークスペース',
  fichaKindCompany: '企業',
  fichaKindIndividual: '個人',
  fichaSelfBadge: 'あなたのプロフィール',
  fichaOtherBadge: '認証済みアクター',
  fichaKycBadge: 'KYC 認証済み',
  fichaIdentityTitle: 'アイデンティティ',
  fichaIdentitySector: '分野',
  fichaIdentityRole: '役割',
  fichaIdentityCountry: '国',
  fichaIdentityCity: '都市',
  fichaIdentityYears: '分野経験年数',
  fichaIdentityAlta: '登録日',
  fichaIdentityActorId: 'ACTOR-ID',
  fichaIdentityDid: '分散型 DID',
  fichaIdentityDidPending: '保留中 · フェーズ 6+',
  fichaIdentityEmployer: '雇用主',
  fichaAutoDeclaredBadge: '自己申告',
  perfilEmployerTitle: '雇用主企業',
  perfilEmployerHint: '特定の企業に勤務している場合のみ。自己申告(クロスアクター検証はフェーズ 6+ で導入)。',
  perfilEmployerPlaceholder: '例:Inmobiliaria Soler S.L.',
  perfilEmployerSaveBtn: '保存',
  perfilEmployerSaving: '保存中…',
  perfilEmployerClear: 'クリア',
  fichaTrajectoryTitle: '履歴 · レイヤー 1',
  fichaTrajectoryScore: 'スコア',
  fichaTrajectorySubtitle: 'マーケットプレイスの実取引で指標が埋まります',
  fichaTrajectoryHidden: 'あなたの履歴は他のアクターに非表示です。ここではあなただけが見ることができます。マイプロフィールで変更できます。',
  fichaTrajectoryOps: '完了した取引',
  fichaTrajectoryOnTimeDeliveries: '期限内の納品',
  fichaTrajectoryOnTimePayments: '期限内の支払い',
  fichaTrajectoryCredentials: '認証済み資格',
  fichaTrajectoryUniqueParties: 'ユニークな取引相手',
  fichaTrajectoryDisputes: '未解決の紛争',
  fichaPublicBadge: '同意により公開',
  fichaSelfNotice: 'これがあなたの公開プロフィールです · 他の認証済みアクターからはこのように見えます',
  fichaConfigError: '設定が不完全です',
  fichaConfigErrorDetail: 'サーバーの認証情報が不足しています。管理者に通知してください。',
  fichaKycRequiredTitle: '認証保留中',
  fichaKycRequiredDetail: '他のアクターのプロフィールを見るには KYC を完了する必要があります。',
  fichaKycRequiredAction: 'ワークスペースへ',
  fichaDbErrorTitle: '一時的なエラー',
  fichaDbErrorDetailDefault: '現在プロフィールを読み込めません。',

  perfilBackLink: '← ワークスペース',
  perfilEyebrow: '◆ マイプロフィール',
  perfilTitle: '設定と公開設定',
  perfilVisibilitySectionTitle: 'プライバシーと公開設定',
  perfilVisibilityIntro: 'あなたに関するどの情報を公開するかはあなたが決めます。これらの決定はいつでも変更できます — 変更は即時反映されます(GDPR 第 7 条、撤回可能な同意)。',
  perfilAvatarTitle: 'あなたの公開写真',
  perfilAvatarHint: '公開プロフィールに表示されるアバターまたはロゴ。JPG/PNG/WebP、最大 5 MB。自動的に正方形にトリミングされます。',
  perfilAvatarUploadBtn: '写真をアップロード',
  perfilAvatarReplaceBtn: '写真を変更',
  perfilAvatarDeleteBtn: '写真を削除',
  perfilAvatarUploading: 'アップロード中…',
  perfilSeeMyFiche: '公開プロフィールを見る →',
  perfilLegalNote: '法的根拠 · GDPR 第 6(b) 条契約上の必要性 + 第 7 条撤回可能な同意 · 第 25 条プライバシー・バイ・デザイン。このオプトアウトはいつでも有効化できます。プロフィール非表示前の処理は遡及的に無効になりません。',
  perfilErrorTitle: '一時的なエラー',

  visibilityDirectoryQuestionShort: '公開アクターディレクトリに表示しますか?',
  visibilityDirectoryDetailShort: '他の KYC 認証済みアクターは、あなたの名前、分野、役割、国、都市を見ることができ、あなたとの会話を開始できます。',
  visibilityTrajectoryQuestionShort: '取引履歴を表示しますか?',
  visibilityTrajectoryDetailShort: '公開プロフィールには実取引から計算された指標(完了取引、期限内納品、期限内支払い)が表示されます。「いいえ」を選択すると、このセクションは他の人から非表示になります。',
  visibilityChoiceYes: 'はい、同意します',
  visibilityChoiceNo: 'いいえ、同意しません',
  visibilityErrorPrefix: 'エラー',

  chatBtnStartWith: '{name} とチャットを開始',
  chatBtnStarting: '開始中…',
  chatBtnConnecting: '接続中…',
  chatBtnErrorPrefix: 'エラー',

  catalogoEyebrow: 'カタログ',
  catalogoTitle: '業種の製品',
  catalogoBody: 'カテゴリ別に製品を閲覧します。実データ(写真、価格、在庫、評価)による詳細検索は、サプライヤーの ERP 接続時に提供開始です。',
  catalogoPlaceholder: '製品',

  miCatalogoEyebrow: 'マイカタログ',
  miCatalogoTitle: '公開中の在庫',
  miCatalogoBody: 'ERP(SAP、Odoo、Holded、Sage、または汎用 webhook)を接続すると、カタログは自動的に同期されます。サイトを維持する必要も、写真をアップロードする必要もありません。',
  miCatalogoButton: 'ERP を接続',

  archivosEyebrow: 'ファイル',
  archivosTitle: '法務書類',
  archivosBody: '登録時にアップロードしたものすべてに即アクセス: 設立証明書、代表者の身分証、銀行および品質の証明書。いつでもダウンロードできます。',
  archivosEmpty: 'まだ書類はアップロードされていません。',
  archivosEmptyHint: 'お住まいの国の登録ページに戻り、指定の証明書をアップロードしてください。',
  archivosDownload: 'ダウンロード',
  archivosRemoveConfirm: '「{filename}」を削除しますか? このローカルビューのみに影響します。',
  archivosFooter: 'ローカルストレージ · 接続後に暗号化 Supabase Storage へ移行',

  mensajesEyebrow: '内部メール',
  mensajesTitle: '内部メール',
  mensajesBody: 'アクター間の非同期内部メッセージ（リアルタイムchatとは別）。実データは今後のイテレーションで。',

  pedidosEyebrow: '発注 · リアルタイム追跡',
  pedidosTitle: 'リアルタイムの取引状況',
  pedidosBody: '各ステータスはサプライヤーの ERP から自動更新されます。Webhook in、status out。支払いは納品確認後に解放されます。',

  walletEyebrow: 'Pagos · liberación contra entrega',
  walletTitle: 'B2B 流動性',
  walletBody: '残高・履歴・納品確認後の支払い解放。',

  placeholderText: '{title} ビュー · 実データ近日公開',
  placeholderHint: 'Supabase + ERP 接続待ち',

  chatActionChat: 'チャット',
  chatActionCall: '通話',
  chatActionVideo: 'ビデオ通話',
  chatActionMeet: '会議',
  chatActionSchedule: '予約',
  chatVideoVision: '当事者間のリアルタイム翻訳付きビデオ通話',
  chatPhaseHint: 'フェーズ 5 で利用可能',
  chatStatusOnline: '接続済み',
  chatStatusConnecting: '接続中…',
  chatStatusOffline: 'オフライン',
  chatStatusUnauth: 'ログイン',
  chatStatusError: 'エラー',
  chatStatusIdle: '待機中',
  chatIntro: '認証済み当事者間の 1 対 1 メッセージ。',
  chatOpenButton: 'チャットを開く',
  chatSignInPrompt: 'メッセージを使用するには認証済み当事者としてログインしてください。',
  chatRecipientPlaceholder: '当事者 ID（UUID）',
  chatOpenConversation: '開く',
  chatNoConversations: '会話なし',
  chatPresenceLive: 'オンライン',
  chatPresenceOffline: 'オフライン',
  chatPickConversation: '会話を選択するか開始してください',
  chatConversationFallback: '会話',
  chatNoMessages: 'メッセージはまだありません',
  chatMsgSending: '送信中…',
  chatMsgRead: '既読',
  chatMsgSent: '送信済み',
  chatComposerPlaceholder: 'メッセージを入力…',
  chatSendButton: '送信',

  tabAgenda: 'カレンダー',
  agendaEyebrow: 'カレンダー',
  agendaTitle: '会議カレンダー',
  agendaBody: '他の当事者との会議を予定・確認できます。現在カレンダーはこの端末内のみです。同期と他の当事者への招待は名簿（フェーズ 6）で提供予定です。',
  agendaToday: '今日',
  agendaNewMeeting: '新規会議',
  agendaEventTitle: 'タイトル',
  agendaEventTitlePlaceholder: '例: サプライヤーとの通話',
  agendaStart: '開始',
  agendaEnd: '終了',
  agendaNote: 'メモ',
  agendaNotePlaceholder: '詳細（任意）',
  agendaSave: '保存',
  agendaCancel: 'キャンセル',
  agendaDelete: '削除',
  agendaEdit: '編集',
  agendaPickDay: 'カレンダーから日付を選択してください',
  agendaNoEventsDay: 'この日の会議はありません',
  agendaUpcoming: '今後の会議',
  agendaNoUpcoming: '今後の会議はありません',
  agendaFooter: 'ローカルストレージ · 名簿接続後に Supabase へ移行し、他の当事者を招待できるようになります',

  desktopFrameEmptyTitle: 'クリックして個人写真を追加',
  desktopFrameReplaceTitle: 'クリックして写真を変更',
  desktopDeleteTitle: '写真を削除',
  desktopErrorUpload: '写真をアップロードできません',
  desktopErrorDelete: '写真を削除できません',
}

const WORKSPACE_STRINGS: Record<Lang, WorkspaceStrings> = {
  es: WS_ES,
  en: WS_EN,
  fr: WS_FR,
  de: WS_DE,
  it: WS_IT,
  pt: WS_PT,
  zh: WS_ZH,
  ja: WS_JA,
}

export function getWorkspaceStrings(lang: Lang): WorkspaceStrings {
  return WORKSPACE_STRINGS[lang] || WS_EN
}
