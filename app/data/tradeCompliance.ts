// Motor de cumplimiento de COMERCIO (corredor origen × destino × sector × HS) · ADR 0022.
//
// Eje COMPLEMENTARIO al de documentación del actor (`sectorDocumentRequirements.ts`,
// que resuelve "quién eres": KYC/KYB/sectorial). Este módulo resuelve "qué envías y a
// dónde": las reglas de comercio de un corredor, modeladas de forma COMPOSICIONAL
// (NUNCA una tabla enumerada por las ~532k combinaciones país×país×sector). Un corredor
// se resuelve combinando 4 capas de reglas verificadas:
//
//   Corredor(origen, destino, sector, HS) =
//       SALIDA(origen)                 ← Capa 1 (exportación: EORI, AES, doble uso…)
//     + ENTRADA(destino, HS/sector)    ← Capa 2 (importación: licencias, sanitario…)
//     + ACUERDO(origen, destino)       ← Capa 3 (FTA / unión aduanera / SPG · origen)
//     + SECTORIAL(producto)            ← Capa 4 (se apoya en Capa 2 producto del ADR 0020)
//
// CANON (José · reforzado 2026-06-02): "0 atajos, son leyes, no podemos fallar, siempre
// fuentes oficiales verificadas una a una". Cada regla lleva `source_url` oficial trazable
// (verificada por web, NUNCA de memoria del modelo) + `legal_basis` + `status`. Lo no
// verificado se marca, jamás se inventa. La aplicabilidad fina y la suficiencia son
// `subject_to_expert` (las confirma el abogado fintech · bloqueante pre-deploy).
//
// ESTADO DE CONSTRUCCIÓN
// ----------------------
//   - Capa 0 KYB por país · COMPLETA (177/177) en `legalEntities.ts`.
//   - Capa 1 SALIDA · EN CURSO · primer lote = marco de exportación de la UE (este archivo).
//   - Capas 2-4 · pendientes (tras Capa 1).

import type { LocalizedLabel, TaxonomyStatus } from './actorGroups'
import { UE_27, EEE } from './productSchemas/_jurisdiccion.ts'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

/** Capa del motor composicional a la que pertenece la regla. */
export type TradeRuleLayer = 'exit' | 'entry' | 'agreement' | 'sectoral'

/** Bloque comercial reutilizable (evita enumerar los 27 países en cada regla UE). */
export type TradeBloc = 'EU' | 'EEE'

/** Ámbito de aplicabilidad de una regla de comercio. Cada dimensión declarada es una
 *  condición que DEBE cumplirse; una dimensión ausente (undefined) = comodín (no filtra). */
export type TradeRuleScope = {
  /** Países de ORIGEN aplicables · ISO 3166-1 alpha-2. */
  originCountries?: string[]
  /** Bloques de ORIGEN aplicables (p. ej. 'EU' = los 27 estados miembros). */
  originBlocs?: TradeBloc[]
  /** Países de DESTINO aplicables · ISO 3166-1 alpha-2. */
  destinationCountries?: string[]
  /** Bloques de DESTINO aplicables. */
  destinationBlocs?: TradeBloc[]
  /** Prefijos de código HS (Sistema Armonizado) a los que aplica · entrada/sectorial. */
  hsPrefixes?: string[]
  /** sectorIds aplicables (taxonomía 1503) · null = todos. */
  sectors?: string[]
}

/** Regla de cumplimiento de comercio (una pieza componible del corredor). */
export type TradeRule = {
  /** ID estable kebab-case. */
  id: string
  /** Capa del motor. */
  layer: TradeRuleLayer
  /** Ámbito (origen/destino/HS/sector). */
  scope: TradeRuleScope
  /** Etiqueta multilingüe (lo que ve el usuario). */
  label: LocalizedLabel
  /** Descripción · por qué/qué exige esta regla. */
  description: LocalizedLabel
  /** Autoridad competente (multilingüe · 8 idiomas conforme ADR 0022). */
  authority: LocalizedLabel
  /** URL oficial trazable de la fuente (verificada por web · canon). */
  source_url: string
  /** Base legal (norma + artículo cuando aplique). */
  legal_basis: string
  /** true = solo aplica si el PRODUCTO cae en su ámbito (doble uso, CITES, residuos…);
   *  false = aplica a TODA exportación desde ese origen (EORI, declaración, sanciones). */
  conditional: boolean
  /** Nota corta de cuándo se dispara la regla condicional (subject_to_expert). */
  condition_note?: LocalizedLabel
  /** Estado de validación experta. */
  status: TaxonomyStatus
  /** ISO date (AAAA-MM-DD) de verificación de la `source_url` oficial. */
  source_verified_at?: string
}

// ════════════════════════════════════════════════════════════════════════════
// CAPA 1 · SALIDA (EXPORTACIÓN) · LOTE UE
// ────────────────────────────────────────────────────────────────────────────
// Marco común de exportación de la Unión Aduanera de la UE: aplica a cualquier
// exportador establecido en los 27 estados miembros (`originBlocs: ['EU']`). Cada
// `source_url` verificada por web contra fuente oficial el 2026-06-02 (canon).
// Fuente paraguas: EU Access2Markets + DG TAXUD + EUR-Lex.
// ════════════════════════════════════════════════════════════════════════════

const EU_EXIT_RULES: TradeRule[] = [
  {
    id: 'eu-exit-eori',
    layer: 'exit',
    scope: { originBlocs: ['EU'] },
    label: {
      es: 'Número EORI (operador económico)',
      en: 'EORI number (economic operator)',
      fr: 'Numéro EORI (opérateur économique)',
      de: 'EORI-Nummer (Wirtschaftsbeteiligter)',
      it: 'Numero EORI (operatore economico)',
      pt: 'Número EORI (operador económico)',
      zh: 'EORI 号码（经济运营商）',
      ja: 'EORI番号（経済運営者）',
    },
    description: {
      es: 'Registro EORI obligatorio para cualquier operador que realice trámites aduaneros en la UE (exportación, importación, tránsito). Lo asigna la aduana del estado miembro de establecimiento. No caduca.',
      en: 'EORI registration mandatory for any operator carrying out customs formalities in the EU (export, import, transit). Assigned by the customs authority of the Member State of establishment. Does not expire.',
      fr: 'Enregistrement EORI obligatoire pour tout opérateur effectuant des formalités douanières dans l\'UE. Attribué par la douane de l\'État membre d\'établissement.',
      de: 'EORI-Registrierung verpflichtend für jeden Wirtschaftsbeteiligten mit Zollformalitäten in der EU. Vergeben von der Zollbehörde des Niederlassungsmitgliedstaats.',
      it: 'Registrazione EORI obbligatoria per qualsiasi operatore che svolga formalità doganali nell\'UE. Assegnata dalla dogana dello Stato membro di stabilimento.',
      pt: 'Registo EORI obrigatório para qualquer operador que realize formalidades aduaneiras na UE. Atribuído pela alfândega do Estado-Membro de estabelecimento.',
      zh: '在欧盟办理任何海关手续（出口、进口、过境）的运营商必须注册EORI。由设立地成员国海关分配，不过期。',
      ja: 'EUで通関手続き（輸出・輸入・通過）を行うすべての事業者にEORI登録が必須。設立加盟国の税関が付与し、失効しない。',
    },
    authority: {
      es: 'Aduana nacional del estado miembro (marco DG TAXUD)',
      en: 'National customs authority of the Member State (DG TAXUD framework)',
      fr: 'Douane nationale de l\'État membre (cadre DG TAXUD)',
      de: 'Nationale Zollbehörde des Mitgliedstaats (DG-TAXUD-Rahmen)',
      it: 'Dogana nazionale dello Stato membro (quadro DG TAXUD)',
      pt: 'Alfândega nacional do Estado-Membro (quadro DG TAXUD)',
      zh: '成员国国家海关（DG TAXUD框架）',
      ja: '加盟国の国家税関（DG TAXUD枠組み）',
    },
    source_url: 'https://taxation-customs.ec.europa.eu/customs/customs-procedures-import-and-export/customs-operations/economic-operators-registration-and-identification-number-eori_en',
    legal_basis: 'UCC Reg. (UE) 952/2013 Art. 9 + Reg. de Ejecución (UE) 2015/2447 Art. 6 ss.',
    conditional: false,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
  {
    id: 'eu-exit-export-declaration',
    layer: 'exit',
    scope: { originBlocs: ['EU'] },
    label: {
      es: 'Declaración de exportación (AES)',
      en: 'Export declaration (AES)',
      fr: 'Déclaration d\'exportation (AES)',
      de: 'Ausfuhranmeldung (AES)',
      it: 'Dichiarazione di esportazione (AES)',
      pt: 'Declaração de exportação (AES)',
      zh: '出口申报（AES）',
      ja: '輸出申告（AES）',
    },
    description: {
      es: 'Toda exportación fuera del territorio aduanero de la UE exige declaración de exportación presentada electrónicamente por el Sistema Automatizado de Exportación (AES), conforme a las formalidades de salida del Código Aduanero de la Unión.',
      en: 'Any export outside the EU customs territory requires an export declaration lodged electronically via the Automated Export System (AES), under the Union Customs Code export/exit formalities.',
      fr: 'Toute exportation hors du territoire douanier de l\'UE exige une déclaration d\'exportation déposée par voie électronique via l\'AES (formalités de sortie du CDU).',
      de: 'Jede Ausfuhr aus dem EU-Zollgebiet erfordert eine elektronisch über das AES abgegebene Ausfuhranmeldung (Ausgangsformalitäten des UZK).',
      it: 'Qualsiasi esportazione fuori dal territorio doganale UE richiede una dichiarazione di esportazione presentata elettronicamente tramite AES (formalità di uscita del CDU).',
      pt: 'Qualquer exportação fora do território aduaneiro da UE exige declaração de exportação apresentada eletronicamente via AES (formalidades de saída do CAU).',
      zh: '任何出口至欧盟关境以外均需通过自动出口系统（AES）以电子方式提交出口申报（UCC离境手续）。',
      ja: 'EU関税領域外への輸出はすべて、自動輸出システム（AES）で電子的に提出する輸出申告が必要（UCCの出域手続き）。',
    },
    authority: {
      es: 'Aduana nacional · Sistema Automatizado de Exportación (AES · DG TAXUD)',
      en: 'National customs · Automated Export System (AES · DG TAXUD)',
      fr: 'Douane nationale · Système automatisé d\'exportation (AES · DG TAXUD)',
      de: 'Nationale Zollbehörde · Automatisiertes Ausfuhrsystem (AES · DG TAXUD)',
      it: 'Dogana nazionale · Sistema automatizzato di esportazione (AES · DG TAXUD)',
      pt: 'Alfândega nacional · Sistema Automatizado de Exportação (AES · DG TAXUD)',
      zh: '国家海关 · 自动出口系统（AES · DG TAXUD）',
      ja: '国家税関 · 自動輸出システム（AES · DG TAXUD）',
    },
    source_url: 'https://taxation-customs.ec.europa.eu/online-services/online-services-and-databases-customs/automated-export-system-aes_en',
    legal_basis: 'UCC Reg. (UE) 952/2013 Art. 263 ss. (formalidades de salida) + Reg. de Ejecución (UE) 2015/2447',
    conditional: false,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
  {
    id: 'eu-exit-sanctions-screening',
    layer: 'exit',
    scope: { originBlocs: ['EU'] },
    label: {
      es: 'Cribado de sanciones (medidas restrictivas UE)',
      en: 'Sanctions screening (EU restrictive measures)',
      fr: 'Filtrage des sanctions (mesures restrictives UE)',
      de: 'Sanktionsprüfung (restriktive Maßnahmen der EU)',
      it: 'Screening sanzioni (misure restrittive UE)',
      pt: 'Triagem de sanções (medidas restritivas UE)',
      zh: '制裁筛查（欧盟限制性措施）',
      ja: '制裁スクリーニング（EU制限措置）',
    },
    description: {
      es: 'Antes de exportar debe cribarse la contraparte y el destino contra la lista consolidada de sanciones de la UE (personas, entidades, embargos sectoriales). Aplica a toda operación; el incumplimiento es delito.',
      en: 'Before exporting, the counterparty and destination must be screened against the EU consolidated sanctions list (persons, entities, sectoral embargoes). Applies to every operation; breach is a criminal offence.',
      fr: 'Avant toute exportation, la contrepartie et la destination doivent être filtrées contre la liste consolidée des sanctions de l\'UE (personnes, entités, embargos sectoriels).',
      de: 'Vor jeder Ausfuhr sind Geschäftspartner und Bestimmungsland gegen die konsolidierte EU-Sanktionsliste zu prüfen (Personen, Einrichtungen, sektorale Embargos).',
      it: 'Prima di esportare, controparte e destinazione devono essere verificate rispetto all\'elenco consolidato delle sanzioni UE (persone, entità, embarghi settoriali).',
      pt: 'Antes de exportar, a contraparte e o destino devem ser triados face à lista consolidada de sanções da UE (pessoas, entidades, embargos setoriais).',
      zh: '出口前须对交易对手和目的地进行欧盟综合制裁清单筛查（个人、实体、行业禁运）。适用于每笔交易，违者构成犯罪。',
      ja: '輸出前に、取引相手と仕向地をEU統合制裁リスト（個人・団体・分野別禁輸）と照合する必要がある。すべての取引に適用され、違反は犯罪。',
    },
    authority: {
      es: 'Comisión Europea (DG FISMA) · Consejo de la UE · EU Sanctions Map',
      en: 'European Commission (DG FISMA) · Council of the EU · EU Sanctions Map',
      fr: 'Commission européenne (DG FISMA) · Conseil de l\'UE · EU Sanctions Map',
      de: 'Europäische Kommission (DG FISMA) · Rat der EU · EU Sanctions Map',
      it: 'Commissione europea (DG FISMA) · Consiglio dell\'UE · EU Sanctions Map',
      pt: 'Comissão Europeia (DG FISMA) · Conselho da UE · EU Sanctions Map',
      zh: '欧盟委员会（DG FISMA）· 欧盟理事会 · 欧盟制裁地图',
      ja: '欧州委員会（DG FISMA）· EU理事会 · EU制裁マップ',
    },
    source_url: 'https://www.sanctionsmap.eu/',
    legal_basis: 'Medidas restrictivas de la UE (Art. 215 TFUE) · Reglamentos del Consejo por régimen · lista consolidada DG FISMA',
    conditional: false,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
  {
    id: 'eu-exit-dual-use',
    layer: 'exit',
    scope: { originBlocs: ['EU'] },
    label: {
      es: 'Autorización de doble uso',
      en: 'Dual-use export authorisation',
      fr: 'Autorisation de double usage',
      de: 'Dual-Use-Ausfuhrgenehmigung',
      it: 'Autorizzazione dual-use',
      pt: 'Autorização de dupla utilização',
      zh: '两用物项出口许可',
      ja: 'デュアルユース輸出許可',
    },
    description: {
      es: 'La exportación de productos de doble uso listados en el Anexo I del Reg. (UE) 2021/821 requiere autorización de la autoridad competente nacional. Aplica SOLO si el producto está en la lista de control (Anexo I) o cae en la cláusula catch-all.',
      en: 'Export of dual-use items listed in Annex I of Reg. (EU) 2021/821 requires authorisation from the national competent authority. Applies ONLY if the item is on the control list (Annex I) or caught by the catch-all clause.',
      fr: 'L\'exportation de biens à double usage de l\'Annexe I du Règ. (UE) 2021/821 requiert une autorisation de l\'autorité nationale compétente. S\'applique UNIQUEMENT si le bien est listé.',
      de: 'Die Ausfuhr von Dual-Use-Gütern des Anhangs I der Verord. (EU) 2021/821 erfordert eine Genehmigung der nationalen Behörde. Gilt NUR für gelistete Güter.',
      it: 'L\'esportazione di beni dual-use elencati nell\'Allegato I del Reg. (UE) 2021/821 richiede autorizzazione dell\'autorità nazionale. Si applica SOLO se il bene è in lista.',
      pt: 'A exportação de bens de dupla utilização do Anexo I do Reg. (UE) 2021/821 exige autorização da autoridade nacional. Aplica-se APENAS se o bem estiver listado.',
      zh: '出口列于《(EU) 2021/821》附件I的两用物项需经国家主管机关许可。仅当物项在管制清单（附件I）或受兜底条款约束时适用。',
      ja: '規則(EU)2021/821附属書Iに掲載されたデュアルユース品目の輸出には国家所管当局の許可が必要。品目が規制リスト掲載またはキャッチオール条項対象の場合のみ適用。',
    },
    condition_note: {
      es: 'Solo si el producto está en el Anexo I (lista de control) o aplica la cláusula catch-all (uso final militar/proliferación).',
      en: 'Only if the item is in Annex I (control list) or the catch-all clause applies (military/proliferation end-use).',
      fr: 'Uniquement si le bien figure à l\'Annexe I ou si la clause catch-all s\'applique.',
      de: 'Nur wenn das Gut in Anhang I steht oder die Catch-all-Klausel greift.',
      it: 'Solo se il bene è nell\'Allegato I o si applica la clausola catch-all.',
      pt: 'Apenas se o bem estiver no Anexo I ou se aplicar a cláusula catch-all.',
      zh: '仅当物项列于附件I或适用兜底条款（军事/扩散用途）时。',
      ja: '品目が附属書I掲載、またはキャッチオール条項（軍事/拡散用途）適用の場合のみ。',
    },
    authority: {
      es: 'Autoridad nacional de control de exportaciones (en ES: SOIVRE/Secretaría de Comercio)',
      en: 'National export control authority',
      fr: 'Autorité nationale de contrôle des exportations',
      de: 'Nationale Ausfuhrkontrollbehörde',
      it: 'Autorità nazionale di controllo delle esportazioni',
      pt: 'Autoridade nacional de controlo das exportações',
      zh: '国家出口管制主管机关',
      ja: '国家輸出管理当局',
    },
    source_url: 'https://policy.trade.ec.europa.eu/help-exporters-and-importers/exporting-dual-use-items_en',
    legal_basis: 'Reg. (UE) 2021/821 (régimen de control de exportaciones de productos de doble uso · Anexo I)',
    conditional: true,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
  {
    id: 'eu-exit-cites',
    layer: 'exit',
    scope: { originBlocs: ['EU'] },
    label: {
      es: 'Permiso de exportación CITES',
      en: 'CITES export permit',
      fr: 'Permis d\'exportation CITES',
      de: 'CITES-Ausfuhrgenehmigung',
      it: 'Permesso di esportazione CITES',
      pt: 'Licença de exportação CITES',
      zh: 'CITES出口许可',
      ja: 'CITES輸出許可',
    },
    description: {
      es: 'La exportación de especímenes de especies protegidas (Anexos A, B y C del Reg. (CE) 338/97) requiere permiso de exportación o certificado de reexportación emitido por la autoridad CITES del estado miembro. Aplica SOLO a fauna/flora protegida y sus productos.',
      en: 'Export of protected-species specimens (Annexes A, B, C of Reg. (EC) 338/97) requires an export permit or re-export certificate issued by the Member State CITES authority. Applies ONLY to protected wildlife and derived products.',
      fr: 'L\'exportation de spécimens d\'espèces protégées (Annexes A, B, C du Règ. (CE) 338/97) requiert un permis CITES de l\'État membre. S\'applique UNIQUEMENT à la faune/flore protégée.',
      de: 'Die Ausfuhr von Exemplaren geschützter Arten (Anhänge A, B, C der Verord. (EG) 338/97) erfordert eine CITES-Genehmigung des Mitgliedstaats. Gilt NUR für geschützte Arten.',
      it: 'L\'esportazione di esemplari di specie protette (Allegati A, B, C del Reg. (CE) 338/97) richiede un permesso CITES dello Stato membro. Si applica SOLO a fauna/flora protetta.',
      pt: 'A exportação de espécimes de espécies protegidas (Anexos A, B, C do Reg. (CE) 338/97) exige licença CITES do Estado-Membro. Aplica-se APENAS a fauna/flora protegida.',
      zh: '出口受保护物种标本（《(EC) 338/97》附件A、B、C）需成员国CITES主管机关签发出口许可或再出口证明。仅适用于受保护动植物及其制品。',
      ja: '保護種の標本（規則(EC)338/97附属書A・B・C）の輸出には加盟国CITES当局の輸出許可または再輸出証明が必要。保護対象の動植物とその製品のみ適用。',
    },
    condition_note: {
      es: 'Solo si el producto contiene especímenes de especies CITES (Anexos A/B/C del Reg. 338/97).',
      en: 'Only if the product contains specimens of CITES species (Annexes A/B/C of Reg. 338/97).',
      fr: 'Uniquement si le produit contient des spécimens d\'espèces CITES.',
      de: 'Nur wenn das Produkt Exemplare von CITES-Arten enthält.',
      it: 'Solo se il prodotto contiene esemplari di specie CITES.',
      pt: 'Apenas se o produto contiver espécimes de espécies CITES.',
      zh: '仅当产品含CITES物种标本时（附件A/B/C）。',
      ja: '製品がCITES種の標本を含む場合のみ（附属書A/B/C）。',
    },
    authority: {
      es: 'Autoridad administrativa CITES del estado miembro',
      en: 'Member State CITES management authority',
      fr: 'Organe de gestion CITES de l\'État membre',
      de: 'CITES-Vollzugsbehörde des Mitgliedstaats',
      it: 'Autorità di gestione CITES dello Stato membro',
      pt: 'Autoridade administrativa CITES do Estado-Membro',
      zh: '成员国CITES管理机构',
      ja: '加盟国のCITES管理当局',
    },
    source_url: 'https://ec.europa.eu/environment/cites/legislation_en.htm',
    legal_basis: 'Reg. (CE) 338/97 (protección de especies) + Reg. (CE) 865/2006 (ejecución)',
    conditional: true,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
  {
    id: 'eu-exit-cultural-goods',
    layer: 'exit',
    scope: { originBlocs: ['EU'] },
    label: {
      es: 'Licencia de exportación de bienes culturales',
      en: 'Cultural goods export licence',
      fr: 'Licence d\'exportation de biens culturels',
      de: 'Ausfuhrgenehmigung für Kulturgüter',
      it: 'Licenza di esportazione di beni culturali',
      pt: 'Licença de exportação de bens culturais',
      zh: '文化物品出口许可',
      ja: '文化財輸出許可',
    },
    description: {
      es: 'La exportación de bienes culturales fuera del territorio aduanero de la UE exige una licencia de exportación emitida por la autoridad competente del estado miembro, válida en toda la UE. Aplica SOLO a bienes en las categorías del Anexo I del Reg. (CE) 116/2009.',
      en: 'Export of cultural goods outside the EU customs territory requires an export licence issued by the Member State competent authority, valid throughout the EU. Applies ONLY to goods in the Annex I categories of Reg. (EC) 116/2009.',
      fr: 'L\'exportation de biens culturels hors du territoire douanier de l\'UE exige une licence de l\'État membre, valable dans toute l\'UE. S\'applique UNIQUEMENT aux catégories de l\'Annexe I.',
      de: 'Die Ausfuhr von Kulturgütern aus dem EU-Zollgebiet erfordert eine Genehmigung des Mitgliedstaats, EU-weit gültig. Gilt NUR für Güter der Anhang-I-Kategorien.',
      it: 'L\'esportazione di beni culturali fuori dal territorio doganale UE richiede una licenza dello Stato membro, valida in tutta l\'UE. Si applica SOLO ai beni delle categorie dell\'Allegato I.',
      pt: 'A exportação de bens culturais fora do território aduaneiro da UE exige uma licença do Estado-Membro, válida em toda a UE. Aplica-se APENAS aos bens das categorias do Anexo I.',
      zh: '将文化物品出口至欧盟关境以外需成员国主管机关签发出口许可，在全欧盟有效。仅适用于《(EC) 116/2009》附件I类别的物品。',
      ja: 'EU関税領域外への文化財輸出には加盟国所管当局の輸出許可（EU全域で有効）が必要。規則(EC)116/2009附属書Iのカテゴリの物品のみ適用。',
    },
    condition_note: {
      es: 'Solo si el bien entra en las categorías de bienes culturales del Anexo I del Reg. 116/2009 (antigüedad/valor).',
      en: 'Only if the good falls within the cultural-goods categories of Annex I of Reg. 116/2009 (age/value).',
      fr: 'Uniquement si le bien relève des catégories de l\'Annexe I du Règ. 116/2009.',
      de: 'Nur wenn das Gut unter die Kategorien des Anhangs I der Verord. 116/2009 fällt.',
      it: 'Solo se il bene rientra nelle categorie dell\'Allegato I del Reg. 116/2009.',
      pt: 'Apenas se o bem se enquadrar nas categorias do Anexo I do Reg. 116/2009.',
      zh: '仅当物品属于《116/2009》附件I文化物品类别（年代/价值）时。',
      ja: '物品が規則116/2009附属書Iの文化財カテゴリ（年代/価値）に該当する場合のみ。',
    },
    authority: {
      es: 'Autoridad competente de bienes culturales del estado miembro',
      en: 'Member State cultural-goods competent authority',
      fr: 'Autorité compétente en biens culturels de l\'État membre',
      de: 'Zuständige Kulturgüterbehörde des Mitgliedstaats',
      it: 'Autorità competente per i beni culturali dello Stato membro',
      pt: 'Autoridade competente de bens culturais do Estado-Membro',
      zh: '成员国文化物品主管机关',
      ja: '加盟国の文化財所管当局',
    },
    source_url: 'https://eur-lex.europa.eu/eli/reg/2009/116/oj/eng',
    legal_basis: 'Reg. (CE) 116/2009 (exportación de bienes culturales · versión codificada)',
    conditional: true,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
  {
    id: 'eu-exit-waste-shipment',
    layer: 'exit',
    scope: { originBlocs: ['EU'] },
    label: {
      es: 'Traslado de residuos (notificación/prohibición)',
      en: 'Waste shipment (notification/ban)',
      fr: 'Transfert de déchets (notification/interdiction)',
      de: 'Abfallverbringung (Notifizierung/Verbot)',
      it: 'Spedizione di rifiuti (notifica/divieto)',
      pt: 'Transferência de resíduos (notificação/proibição)',
      zh: '废物运输（通知/禁运）',
      ja: '廃棄物の輸送（通知/禁止）',
    },
    description: {
      es: 'La exportación de residuos exige procedimiento de notificación y consentimiento previo por escrito (PIC); ciertos residuos peligrosos y otros están PROHIBIDOS de exportar salvo excepciones, y la exportación a países no OCDE requiere demostrar gestión ambientalmente racional. Aplica SOLO si el producto es residuo. (Reglas de exportación aplicables desde 21-may-2027.)',
      en: 'Waste export requires a prior written notification and consent (PIC) procedure; certain hazardous and other wastes are BANNED from export save exceptions, and export to non-OECD countries must demonstrate environmentally sound management. Applies ONLY if the product is waste. (Export rules apply from 21 May 2027.)',
      fr: 'L\'exportation de déchets exige une procédure de notification et consentement écrit préalable (PIC); certains déchets sont INTERDITS à l\'export. S\'applique UNIQUEMENT si le produit est un déchet.',
      de: 'Die Abfallausfuhr erfordert ein Verfahren der vorherigen schriftlichen Notifizierung und Zustimmung (PIC); bestimmte Abfälle sind von der Ausfuhr VERBOTEN. Gilt NUR, wenn das Produkt Abfall ist.',
      it: 'L\'esportazione di rifiuti richiede una procedura di notifica e consenso scritto preventivo (PIC); alcuni rifiuti sono VIETATI all\'esportazione. Si applica SOLO se il prodotto è un rifiuto.',
      pt: 'A exportação de resíduos exige procedimento de notificação e consentimento escrito prévio (PIC); certos resíduos estão PROIBIDOS de exportação. Aplica-se APENAS se o produto for resíduo.',
      zh: '废物出口须经事先书面通知与同意（PIC）程序；某些危险废物等禁止出口（除例外），出口至非经合组织国家须证明环境无害化管理。仅当产品为废物时适用。（出口规则自2027年5月21日起适用。）',
      ja: '廃棄物の輸出は事前書面通知・同意（PIC）手続きが必要。一定の有害廃棄物等は輸出禁止（例外を除く）、非OECD国への輸出は環境上適正な管理の証明が必要。製品が廃棄物の場合のみ適用。（輸出規則は2027年5月21日適用開始。）',
    },
    condition_note: {
      es: 'Solo si el producto es residuo en el ámbito del Reg. 2024/1157. Reglas de exportación aplicables desde 21-may-2027.',
      en: 'Only if the product is waste within Reg. 2024/1157 scope. Export rules apply from 21 May 2027.',
      fr: 'Uniquement si le produit est un déchet au sens du Règ. 2024/1157. Règles d\'export dès le 21 mai 2027.',
      de: 'Nur wenn das Produkt Abfall im Sinne der Verord. 2024/1157 ist. Ausfuhrregeln ab 21. Mai 2027.',
      it: 'Solo se il prodotto è rifiuto ai sensi del Reg. 2024/1157. Regole di esportazione dal 21 maggio 2027.',
      pt: 'Apenas se o produto for resíduo no âmbito do Reg. 2024/1157. Regras de exportação a partir de 21 de maio de 2027.',
      zh: '仅当产品属《2024/1157》范围的废物时。出口规则自2027年5月21日起适用。',
      ja: '製品が規則2024/1157の対象廃棄物の場合のみ。輸出規則は2027年5月21日適用開始。',
    },
    authority: {
      es: 'Autoridad competente de residuos del estado miembro · Comisión Europea (sistema central)',
      en: 'Member State waste competent authority · European Commission (central system)',
      fr: 'Autorité compétente déchets de l\'État membre · Commission européenne',
      de: 'Zuständige Abfallbehörde des Mitgliedstaats · Europäische Kommission',
      it: 'Autorità competente rifiuti dello Stato membro · Commissione europea',
      pt: 'Autoridade competente de resíduos do Estado-Membro · Comissão Europeia',
      zh: '成员国废物主管机关 · 欧盟委员会（中央系统）',
      ja: '加盟国の廃棄物所管当局 · 欧州委員会（中央システム）',
    },
    source_url: 'https://eur-lex.europa.eu/eli/reg/2024/1157/oj/eng',
    legal_basis: 'Reg. (UE) 2024/1157 (traslados de residuos · deroga Reg. (CE) 1013/2006 · export aplicable 21-05-2027)',
    conditional: true,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// CAPA 2 · ENTRADA (IMPORTACIÓN) · LOTE COLOMBIA
// ────────────────────────────────────────────────────────────────────────────
// Marco de importación de Colombia (destino). Combinado con el lote UE de salida
// resuelve el corredor ES→Colombia (ejemplo canónico del ADR 0022). Cada
// `source_url` verificada por web contra fuente oficial el 2026-06-02 (canon).
// Autoridades: DIAN (aduana) · VUCE/MinCIT (ventanilla única) · INVIMA (sanitario)
// · ICA (fito/zoosanitario + embalaje de madera). Aplicabilidad fina por producto =
// subject_to_expert. Las reglas se marcan por destino (`destinationCountries:['CO']`);
// el flag `conditional` separa lo SIEMPRE exigible de lo que depende del producto.
// ════════════════════════════════════════════════════════════════════════════

const CO_ENTRY_RULES: TradeRule[] = [
  {
    id: 'co-entry-importer-registration',
    layer: 'entry',
    scope: { destinationCountries: ['CO'] },
    label: {
      es: 'Registro de importador (RUT · DIAN)',
      en: 'Importer registration (RUT · DIAN)',
      fr: 'Enregistrement importateur (RUT · DIAN)',
      de: 'Importeur-Registrierung (RUT · DIAN)',
      it: 'Registrazione importatore (RUT · DIAN)',
      pt: 'Registo de importador (RUT · DIAN)',
      zh: '进口商登记（RUT · DIAN）',
      ja: '輸入者登録（RUT · DIAN）',
    },
    description: {
      es: 'Para importar a Colombia, el importador (persona natural o jurídica) debe estar inscrito en el Registro Único Tributario (RUT) de la DIAN. Lo gestiona el importador en destino; el exportador debe coordinar con un importador registrado.',
      en: 'To import into Colombia, the importer (natural or legal person) must be registered in DIAN\'s Registro Único Tributario (RUT). Handled by the importer at destination; the exporter must coordinate with a registered importer.',
      fr: 'Pour importer en Colombie, l\'importateur doit être inscrit au RUT de la DIAN. Géré par l\'importateur à destination.',
      de: 'Für die Einfuhr nach Kolumbien muss der Importeur im RUT der DIAN registriert sein. Wird vom Importeur im Bestimmungsland erledigt.',
      it: 'Per importare in Colombia, l\'importatore deve essere iscritto al RUT della DIAN. Gestito dall\'importatore a destinazione.',
      pt: 'Para importar na Colômbia, o importador deve estar inscrito no RUT da DIAN. Tratado pelo importador no destino.',
      zh: '进口至哥伦比亚，进口商（自然人或法人）须在DIAN的唯一税务登记（RUT）注册。由目的地进口商办理。',
      ja: 'コロンビアへの輸入には、輸入者がDIANの単一納税登録（RUT）に登録されている必要がある。仕向地の輸入者が手続きする。',
    },
    authority: {
      es: 'DIAN · Dirección de Impuestos y Aduanas Nacionales',
      en: 'DIAN · National Tax and Customs Directorate',
      fr: 'DIAN · Direction des impôts et douanes',
      de: 'DIAN · Nationale Steuer- und Zollbehörde',
      it: 'DIAN · Direzione delle imposte e dogane',
      pt: 'DIAN · Direção de Impostos e Alfândegas',
      zh: 'DIAN · 国家税务海关总局',
      ja: 'DIAN · 国家税関総局',
    },
    source_url: 'https://www.dian.gov.co',
    legal_basis: 'Estatuto Aduanero (Decreto 1165 de 2019, Art. 33) · Registro Único Tributario (RUT · DIAN)',
    conditional: false,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
  {
    id: 'co-entry-import-declaration',
    layer: 'entry',
    scope: { destinationCountries: ['CO'] },
    label: {
      es: 'Declaración de importación (DIAN)',
      en: 'Import declaration (DIAN)',
      fr: 'Déclaration d\'importation (DIAN)',
      de: 'Einfuhranmeldung (DIAN)',
      it: 'Dichiarazione di importazione (DIAN)',
      pt: 'Declaração de importação (DIAN)',
      zh: '进口申报（DIAN）',
      ja: '輸入申告（DIAN）',
    },
    description: {
      es: 'Toda mercancía que ingrese a Colombia exige declaración de importación ante la DIAN, con clasificación arancelaria, valoración aduanera y liquidación de tributos. Procedimiento del Estatuto Aduanero.',
      en: 'All goods entering Colombia require an import declaration to DIAN, with tariff classification, customs valuation and duty assessment. Per the Customs Statute.',
      fr: 'Toute marchandise entrant en Colombie exige une déclaration d\'importation auprès de la DIAN (classement tarifaire, valeur en douane, liquidation des droits).',
      de: 'Alle nach Kolumbien eingeführten Waren erfordern eine Einfuhranmeldung bei der DIAN (Tarifeinreihung, Zollwert, Abgabenberechnung).',
      it: 'Tutte le merci che entrano in Colombia richiedono una dichiarazione di importazione alla DIAN (classificazione tariffaria, valore in dogana, liquidazione dei tributi).',
      pt: 'Todas as mercadorias que entram na Colômbia exigem declaração de importação à DIAN (classificação pautal, valor aduaneiro, liquidação de tributos).',
      zh: '所有进入哥伦比亚的货物均须向DIAN办理进口申报（税则归类、海关估价、税款计征）。',
      ja: 'コロンビアに入るすべての貨物はDIANへの輸入申告が必要（関税分類・関税評価・税額算定）。',
    },
    authority: {
      es: 'DIAN · Dirección de Impuestos y Aduanas Nacionales',
      en: 'DIAN · National Tax and Customs Directorate',
      fr: 'DIAN · Direction des impôts et douanes',
      de: 'DIAN · Nationale Steuer- und Zollbehörde',
      it: 'DIAN · Direzione delle imposte e dogane',
      pt: 'DIAN · Direção de Impostos e Alfândegas',
      zh: 'DIAN · 国家税务海关总局',
      ja: 'DIAN · 国家税関総局',
    },
    source_url: 'https://www.dian.gov.co',
    legal_basis: 'Estatuto Aduanero (Decreto 1165 de 2019, Arts. 140-297) + Resolución DIAN 46 de 2019',
    conditional: false,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
  {
    id: 'co-entry-vuce-import-license',
    layer: 'entry',
    scope: { destinationCountries: ['CO'] },
    label: {
      es: 'Registro/licencia de importación (VUCE)',
      en: 'Import registration/licence (VUCE)',
      fr: 'Enregistrement/licence d\'importation (VUCE)',
      de: 'Einfuhrregistrierung/-lizenz (VUCE)',
      it: 'Registrazione/licenza di importazione (VUCE)',
      pt: 'Registo/licença de importação (VUCE)',
      zh: '进口登记/许可（VUCE）',
      ja: '輸入登録/許可（VUCE）',
    },
    description: {
      es: 'Las mercancías sujetas a requisitos, permisos o vistos buenos previos se tramitan por la Ventanilla Única de Comercio Exterior (VUCE) del MinCIT, que canaliza los visados de las entidades (INVIMA, ICA, etc.). Aplica SOLO si la subpartida del producto exige permiso previo.',
      en: 'Goods subject to prior requirements, permits or approvals are processed through the Single Window for Foreign Trade (VUCE) of MinCIT, which channels the approvals of agencies (INVIMA, ICA, etc.). Applies ONLY if the product\'s tariff subheading requires a prior permit.',
      fr: 'Les marchandises soumises à des permis ou visas préalables passent par la VUCE du MinCIT. S\'applique UNIQUEMENT si la sous-position du produit exige un permis préalable.',
      de: 'Waren mit vorherigen Genehmigungspflichten werden über die VUCE des MinCIT abgewickelt. Gilt NUR, wenn die Zollunterposition eine Vorabgenehmigung erfordert.',
      it: 'Le merci soggette a permessi o visti preventivi passano dalla VUCE del MinCIT. Si applica SOLO se la sottovoce del prodotto richiede un permesso preventivo.',
      pt: 'As mercadorias sujeitas a permissões ou vistos prévios passam pela VUCE do MinCIT. Aplica-se APENAS se a subposição do produto exigir permissão prévia.',
      zh: '受事先要求、许可或批准约束的货物通过MinCIT的对外贸易单一窗口（VUCE）办理（汇集INVIMA、ICA等机构的批准）。仅当产品税目需事先许可时适用。',
      ja: '事前要件・許可・承認の対象貨物はMinCITのVUCE（貿易単一窓口）で処理（INVIMA・ICA等の承認を集約）。製品の関税細分が事前許可を要する場合のみ適用。',
    },
    condition_note: {
      es: 'Solo si la subpartida arancelaria del producto está sujeta a permiso/visto bueno previo de alguna entidad.',
      en: 'Only if the product\'s tariff subheading is subject to a prior permit/approval from an agency.',
      fr: 'Uniquement si la sous-position tarifaire est soumise à un permis préalable.',
      de: 'Nur wenn die Zollunterposition einer Vorabgenehmigung unterliegt.',
      it: 'Solo se la sottovoce tariffaria è soggetta a permesso preventivo.',
      pt: 'Apenas se a subposição pautal estiver sujeita a permissão prévia.',
      zh: '仅当产品税则细分需某机构事先许可时。',
      ja: '製品の関税細分が機関の事前許可対象の場合のみ。',
    },
    authority: {
      es: 'Ministerio de Comercio, Industria y Turismo (MinCIT · VUCE)',
      en: 'Ministry of Commerce, Industry and Tourism (MinCIT · VUCE)',
      fr: 'Ministère du Commerce, de l\'Industrie et du Tourisme (MinCIT · VUCE)',
      de: 'Ministerium für Handel, Industrie und Tourismus (MinCIT · VUCE)',
      it: 'Ministero del Commercio, Industria e Turismo (MinCIT · VUCE)',
      pt: 'Ministério do Comércio, Indústria e Turismo (MinCIT · VUCE)',
      zh: '商业、工业和旅游部（MinCIT · VUCE）',
      ja: '商工観光省（MinCIT · VUCE）',
    },
    source_url: 'https://www.vuce.gov.co/',
    legal_basis: 'Régimen de registros y licencias de importación (MinCIT · VUCE) · Estatuto Aduanero (Decreto 1165 de 2019)',
    conditional: true,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
  {
    id: 'co-entry-invima-sanitary',
    layer: 'entry',
    scope: { destinationCountries: ['CO'] },
    label: {
      es: 'Registro/notificación sanitaria (INVIMA)',
      en: 'Sanitary registration/notification (INVIMA)',
      fr: 'Enregistrement/notification sanitaire (INVIMA)',
      de: 'Sanitäre Registrierung/Notifizierung (INVIMA)',
      it: 'Registrazione/notifica sanitaria (INVIMA)',
      pt: 'Registo/notificação sanitária (INVIMA)',
      zh: '卫生注册/通报（INVIMA）',
      ja: '衛生登録/届出（INVIMA）',
    },
    description: {
      es: 'Los productos de competencia sanitaria requieren registro o notificación sanitaria del INVIMA previo a la importación. Aplica SOLO a alimentos y bebidas, medicamentos y productos biológicos, cosméticos/aseo/plaguicidas/higiene, y dispositivos médicos.',
      en: 'Health-regulated products require INVIMA sanitary registration or notification prior to import. Applies ONLY to food and beverages, medicines and biologicals, cosmetics/cleaning/pesticides/hygiene, and medical devices.',
      fr: 'Les produits de compétence sanitaire requièrent un enregistrement/notification de l\'INVIMA avant l\'importation. S\'applique UNIQUEMENT à l\'alimentaire, médicaments, cosmétiques et dispositifs médicaux.',
      de: 'Gesundheitsrelevante Produkte erfordern eine INVIMA-Registrierung/-Notifizierung vor der Einfuhr. Gilt NUR für Lebensmittel, Arzneimittel, Kosmetika und Medizinprodukte.',
      it: 'I prodotti di competenza sanitaria richiedono registrazione/notifica INVIMA prima dell\'importazione. Si applica SOLO ad alimenti, medicinali, cosmetici e dispositivi medici.',
      pt: 'Os produtos de competência sanitária exigem registo/notificação INVIMA antes da importação. Aplica-se APENAS a alimentos, medicamentos, cosméticos e dispositivos médicos.',
      zh: '受卫生监管的产品在进口前需INVIMA卫生注册或通报。仅适用于食品饮料、药品和生物制品、化妆品/清洁/农药/卫生用品和医疗器械。',
      ja: '衛生規制対象品は輸入前にINVIMAの衛生登録または届出が必要。食品飲料・医薬品/生物製剤・化粧品/洗浄/農薬/衛生・医療機器のみ適用。',
    },
    condition_note: {
      es: 'Solo si el producto es alimento/bebida, medicamento/biológico, cosmético/aseo/plaguicida/higiene o dispositivo médico.',
      en: 'Only if the product is food/beverage, medicine/biological, cosmetic/cleaning/pesticide/hygiene or medical device.',
      fr: 'Uniquement pour alimentaire, médicament, cosmétique ou dispositif médical.',
      de: 'Nur bei Lebensmitteln, Arzneimitteln, Kosmetika oder Medizinprodukten.',
      it: 'Solo per alimenti, medicinali, cosmetici o dispositivi medici.',
      pt: 'Apenas para alimentos, medicamentos, cosméticos ou dispositivos médicos.',
      zh: '仅当产品为食品/饮料、药品/生物制剂、化妆品/卫生品或医疗器械时。',
      ja: '製品が食品/飲料・医薬品/生物製剤・化粧品/衛生・医療機器の場合のみ。',
    },
    authority: {
      es: 'INVIMA · Instituto Nacional de Vigilancia de Medicamentos y Alimentos',
      en: 'INVIMA · National Food and Drug Surveillance Institute',
      fr: 'INVIMA · Institut national de surveillance des médicaments et aliments',
      de: 'INVIMA · Nationales Institut für Arzneimittel- und Lebensmittelüberwachung',
      it: 'INVIMA · Istituto nazionale di vigilanza su farmaci e alimenti',
      pt: 'INVIMA · Instituto Nacional de Vigilância de Medicamentos e Alimentos',
      zh: 'INVIMA · 国家药品食品监督管理局',
      ja: 'INVIMA · 国家医薬品食品監督庁',
    },
    source_url: 'https://www.invima.gov.co',
    legal_basis: 'Régimen sanitario de importación (INVIMA · normativa sanitaria sectorial específica · subject_to_expert)',
    conditional: true,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
  {
    id: 'co-entry-ica-phytosanitary',
    layer: 'entry',
    scope: { destinationCountries: ['CO'] },
    label: {
      es: 'Requisitos fitosanitarios de importación (ICA)',
      en: 'Phytosanitary import requirements (ICA)',
      fr: 'Exigences phytosanitaires d\'importation (ICA)',
      de: 'Pflanzengesundheitliche Einfuhranforderungen (ICA)',
      it: 'Requisiti fitosanitari di importazione (ICA)',
      pt: 'Requisitos fitossanitários de importação (ICA)',
      zh: '进口植物检疫要求（ICA）',
      ja: '輸入植物検疫要件（ICA）',
    },
    description: {
      es: 'Los productos de origen vegetal/animal (categorías de riesgo) requieren el Documento de Requisitos Fitosanitarios de Importación (DRFI) del ICA, tramitado por SISPAP antes del embarque, y certificado fitosanitario del país de origen. Relevante para madera y productos vegetales.',
      en: 'Plant/animal-origin products (risk categories) require ICA\'s Phytosanitary Import Requirements Document (DRFI), processed via SISPAP before shipment, plus a phytosanitary certificate from the country of origin. Relevant for wood and plant products.',
      fr: 'Les produits d\'origine végétale/animale requièrent le DRFI de l\'ICA (via SISPAP) avant l\'embarquement, plus un certificat phytosanitaire d\'origine. Pertinent pour le bois.',
      de: 'Produkte pflanzlichen/tierischen Ursprungs erfordern das DRFI des ICA (über SISPAP) vor dem Versand sowie ein pflanzengesundheitliches Zeugnis des Ursprungslands. Relevant für Holz.',
      it: 'I prodotti di origine vegetale/animale richiedono il DRFI dell\'ICA (via SISPAP) prima dell\'imbarco, più certificato fitosanitario di origine. Rilevante per il legno.',
      pt: 'Os produtos de origem vegetal/animal exigem o DRFI do ICA (via SISPAP) antes do embarque, mais certificado fitossanitário de origem. Relevante para madeira.',
      zh: '植物/动物源产品（风险类别）需ICA的进口植物检疫要求文件（DRFI，经SISPAP在装运前办理）及原产国植物检疫证书。与木材相关。',
      ja: '植物/動物由来製品（リスク区分）はICAの輸入植物検疫要件文書（DRFI・SISPAP経由・船積み前）と原産国の植物検疫証明が必要。木材に関連。',
    },
    condition_note: {
      es: 'Solo si el producto es de origen vegetal/animal en categoría de riesgo (incluye madera y derivados vegetales).',
      en: 'Only if the product is of plant/animal origin in a risk category (includes wood and plant derivatives).',
      fr: 'Uniquement pour produits d\'origine végétale/animale à risque (bois inclus).',
      de: 'Nur bei Produkten pflanzlichen/tierischen Ursprungs in Risikokategorie (einschließlich Holz).',
      it: 'Solo per prodotti di origine vegetale/animale a rischio (legno incluso).',
      pt: 'Apenas para produtos de origem vegetal/animal de risco (madeira incluída).',
      zh: '仅当产品为风险类别的植物/动物源（含木材及植物衍生品）时。',
      ja: '製品がリスク区分の植物/動物由来（木材・植物派生品を含む）の場合のみ。',
    },
    authority: {
      es: 'ICA · Instituto Colombiano Agropecuario',
      en: 'ICA · Colombian Agricultural Institute',
      fr: 'ICA · Institut colombien de l\'agriculture',
      de: 'ICA · Kolumbianisches Agrarinstitut',
      it: 'ICA · Istituto Colombiano Agropecuario',
      pt: 'ICA · Instituto Colombiano Agropecuário',
      zh: 'ICA · 哥伦比亚农业研究所',
      ja: 'ICA · コロンビア農牧研究所',
    },
    source_url: 'https://www.ica.gov.co',
    legal_basis: 'Régimen fitosanitario de importación ICA (DRFI · SISPAP) · categorías de riesgo de la Comunidad Andina',
    conditional: true,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
  {
    id: 'co-entry-ica-wood-packaging',
    layer: 'entry',
    scope: { destinationCountries: ['CO'] },
    label: {
      es: 'Embalaje de madera NIMF-15 (ICA · Res. 1079/2004)',
      en: 'Wood packaging ISPM-15 (ICA · Res. 1079/2004)',
      fr: 'Emballage en bois NIMP-15 (ICA · Rés. 1079/2004)',
      de: 'Holzverpackung ISPM-15 (ICA · Res. 1079/2004)',
      it: 'Imballaggio in legno ISPM-15 (ICA · Ris. 1079/2004)',
      pt: 'Embalagem de madeira NIMF-15 (ICA · Res. 1079/2004)',
      zh: '木质包装NIMF-15（ICA · 第1079/2004号决议）',
      ja: '木材こん包NIMF-15（ICA · 決議1079/2004）',
    },
    description: {
      es: 'Todo embalaje de madera (palés, cajas, jaulas, estibas) usado en el envío debe estar tratado y marcado conforme a la NIMF-15, según la Resolución ICA 1079 de 2004. Afecta a CUALQUIER exportación que use embalaje de madera, incluido el mueble.',
      en: 'All wood packaging (pallets, crates, cases, dunnage) used in the shipment must be treated and marked per ISPM-15, under ICA Resolution 1079 of 2004. Affects ANY export using wood packaging, including furniture.',
      fr: 'Tout emballage en bois (palettes, caisses) utilisé doit être traité et marqué selon la NIMP-15 (Résolution ICA 1079 de 2004). Concerne TOUTE exportation utilisant un emballage en bois, mobilier inclus.',
      de: 'Jede im Versand verwendete Holzverpackung (Paletten, Kisten) muss nach ISPM-15 behandelt und markiert sein (ICA-Resolution 1079 von 2004). Betrifft JEDE Ausfuhr mit Holzverpackung, auch Möbel.',
      it: 'Qualsiasi imballaggio in legno (pallet, casse) usato nella spedizione deve essere trattato e marcato secondo l\'ISPM-15 (Risoluzione ICA 1079 del 2004). Riguarda QUALSIASI esportazione con imballaggio in legno, mobili inclusi.',
      pt: 'Qualquer embalagem de madeira (paletes, caixas) usada no envio deve ser tratada e marcada conforme a NIMF-15 (Resolução ICA 1079 de 2004). Afeta QUALQUER exportação com embalagem de madeira, móveis incluídos.',
      zh: '运输中使用的所有木质包装（托盘、板条箱、垫木）须按NIMF-15处理并加施标识（ICA第1079/2004号决议）。影响任何使用木质包装的出口，含家具。',
      ja: '出荷に使用する木材こん包（パレット・木箱・敷材）はすべてNIMF-15に従い処理・表示が必要（ICA決議1079/2004）。木材こん包を使う輸出すべてに影響、家具を含む。',
    },
    condition_note: {
      es: 'Aplica si el envío usa embalaje de madera (palés, cajas, estibas) — habitual en mueble y carga paletizada.',
      en: 'Applies if the shipment uses wood packaging (pallets, crates, dunnage) — common for furniture and palletised cargo.',
      fr: 'S\'applique si l\'envoi utilise un emballage en bois (palettes, caisses).',
      de: 'Gilt, wenn die Sendung Holzverpackung verwendet (Paletten, Kisten).',
      it: 'Si applica se la spedizione usa imballaggio in legno (pallet, casse).',
      pt: 'Aplica-se se o envio usar embalagem de madeira (paletes, caixas).',
      zh: '若货件使用木质包装（托盘、板条箱）则适用。',
      ja: '出荷が木材こん包（パレット・木箱）を使う場合に適用。',
    },
    authority: {
      es: 'ICA · Instituto Colombiano Agropecuario',
      en: 'ICA · Colombian Agricultural Institute',
      fr: 'ICA · Institut colombien de l\'agriculture',
      de: 'ICA · Kolumbianisches Agrarinstitut',
      it: 'ICA · Istituto Colombiano Agropecuario',
      pt: 'ICA · Instituto Colombiano Agropecuário',
      zh: 'ICA · 哥伦比亚农业研究所',
      ja: 'ICA · コロンビア農牧研究所',
    },
    source_url: 'https://www.ica.gov.co',
    legal_basis: 'Resolución ICA 1079 de 2004 (embalajes de madera · NIMF-15 / ISPM-15)',
    conditional: true,
    status: 'subject_to_expert',
    source_verified_at: '2026-06-02',
  },
]

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO GLOBAL (se irá ampliando lote a lote · capa a capa)
// ════════════════════════════════════════════════════════════════════════════

/** Todas las reglas de comercio verificadas.
 *  - Capa 1 SALIDA · lote UE (exportación desde los 27).
 *  - Capa 2 ENTRADA · lote Colombia (importación a CO). */
export const TRADE_RULES: TradeRule[] = [
  ...EU_EXIT_RULES,
  ...CO_ENTRY_RULES,
]

// ════════════════════════════════════════════════════════════════════════════
// RESOLUTOR COMPOSICIONAL
// ════════════════════════════════════════════════════════════════════════════

const up = (c?: string): string => (c ?? '').trim().toUpperCase()

/** ¿Pertenece el país al bloque comercial? */
export function inBloc(country: string, bloc: TradeBloc): boolean {
  const c = up(country)
  if (bloc === 'EU') return UE_27.includes(c)
  if (bloc === 'EEE') return EEE.includes(c)
  return false
}

/** Resultado de evaluar una dimensión del scope:
 *  - 'unconstrained': la dimensión no está declarada (comodín · no filtra).
 *  - true / false: declarada y casa / no casa con el valor de la consulta. */
type DimMatch = 'unconstrained' | boolean

/** Casa el lado geográfico (origen o destino) de una regla. */
function geoSideMatches(
  countries: string[] | undefined,
  blocs: TradeBloc[] | undefined,
  value: string | undefined,
): DimMatch {
  if (!countries && !blocs) return 'unconstrained'
  const v = up(value)
  if (v === '') return false // dimensión exigida pero sin valor en la consulta → no casa
  if (countries && countries.map(up).includes(v)) return true
  if (blocs && blocs.some((b) => inBloc(v, b))) return true
  return false
}

/** Consulta de corredor. Cualquier campo puede faltar (resolución parcial). */
export type CorridorQuery = {
  /** País de ORIGEN (establecimiento del exportador · ISO alpha-2). */
  origin?: string
  /** País de DESTINO (mercado · ISO alpha-2). */
  destination?: string
  /** sectorId (taxonomía 1503). */
  sector?: string
  /** Código HS del producto (cualquier longitud · se casa por prefijo). */
  hsCode?: string
}

/** ¿Aplica una regla al corredor consultado? Una regla aplica solo si TODAS sus
 *  dimensiones declaradas casan; las dimensiones no declaradas son comodín. */
export function ruleMatchesCorridor(rule: TradeRule, q: CorridorQuery): boolean {
  const { scope } = rule

  const dims: DimMatch[] = [
    geoSideMatches(scope.originCountries, scope.originBlocs, q.origin),
    geoSideMatches(scope.destinationCountries, scope.destinationBlocs, q.destination),
    // Sector
    scope.sectors
      ? q.sector
        ? scope.sectors.includes(q.sector)
        : false
      : 'unconstrained',
    // HS por prefijo
    scope.hsPrefixes
      ? q.hsCode
        ? scope.hsPrefixes.some((p) => up(q.hsCode).startsWith(up(p)))
        : false
      : 'unconstrained',
  ]

  // Aplica si ninguna dimensión declarada falla.
  return dims.every((d) => d === 'unconstrained' || d === true)
}

/** Resuelve las reglas de comercio aplicables a un corredor, COMPONIENDO las 4 capas.
 *  Devuelve el listado completo (cualquier capa); usa `groupByLayer` para separarlas. */
export function getCorridorRequirements(q: CorridorQuery): TradeRule[] {
  return TRADE_RULES.filter((rule) => ruleMatchesCorridor(rule, q))
}

/** Agrupa reglas por capa del motor (exit/entry/agreement/sectoral). */
export function groupByLayer(rules: TradeRule[]): Record<TradeRuleLayer, TradeRule[]> {
  const out: Record<TradeRuleLayer, TradeRule[]> = {
    exit: [],
    entry: [],
    agreement: [],
    sectoral: [],
  }
  for (const r of rules) out[r.layer].push(r)
  return out
}

/** Separa reglas SIEMPRE aplicables (conditional=false) de las CONDICIONALES
 *  (dependen de que el producto caiga en su ámbito: doble uso, CITES, residuos…). */
export function splitConditional(rules: TradeRule[]): {
  always: TradeRule[]
  conditional: TradeRule[]
} {
  return {
    always: rules.filter((r) => !r.conditional),
    conditional: rules.filter((r) => r.conditional),
  }
}
