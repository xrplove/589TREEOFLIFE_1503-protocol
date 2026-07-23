// Taxonomía de actores por sector: cada sector tiene grupos (subsectores) y
// cada grupo tiene roles (oficios/ramas). El actor la ve en el Buscador del
// escritorio y la usa el picker de registro.
//
// FILOSOFÍA CANÓNICA · Audit-Ready by Design (canonizada 2026-05-29 ·
// memoria project_1503_audit_ready_by_design):
//
// La taxonomía 1503 es exhaustiva · anclada a estándares globales
// (ISIC ONU como ancla cross-border) + verificación nacional (CNAE-2025
// España · NACE UE · NAICS Norteamérica). Cada decisión de grupo/rol está
// fundamentada en CNAE-2025 (RD 10/2025 BOE) cuando aplica España, e ISIC
// rev. 4 cuando es global.
//
// ESTADOS POSIBLES (granular por grupo · status enum extendido v1.1):
//
//   - 'draft'              · borrador inicial · taxonomía recién planteada
//                            · UI muestra aviso "clasificación provisional"
//   - 'subject_to_expert'  · DISEÑO COMPLETO · anclaje normativo trazable
//                            · PENDIENTE validación experta sectorial
//                            (colegio profesional · auditor sectorial)
//                            UI muestra aviso "validación experta pendiente"
//   - 'validated'          · validado por experto externo identificado
//                            · referencia al dictamen en docs · UI sin aviso
//   - 'deprecated'         · sustituido · NO usar en código nuevo
//
// CAMBIO 2026-05-29 (v1.1):
//   · global pasa de 'draft' → 'subject_to_expert' (cumple filosofía
//     Audit-Ready by Design · trabajo terminado · pendiente sello externo)
//   · grupos individuales con status explícito mantienen su estado
//   · INMOBILIARIO sigue 'validated' por grupo (canónico desde 26-may)
//
// PROTOCOLO VALIDACIÓN EXPERTA (ADR 0011):
//   · Cada sector requiere consulta a colegio/asociación profesional UE+ES
//   · Coste estimado: 200-500€ por sector · diferido pre-deploy (R0)
//   · Cuando llegue dictamen: status pasa a 'validated' con referencia
//   · Mientras tanto: el sistema funciona · UI advierte "provisional"
//
// Sin `count`: no se inventan números de actores. El conteo real saldrá de
// la base de datos cuando haya actores reales (mostrar cifras ficticias a
// usuarios reales es un riesgo de credibilidad — misma pauta que el badge
// BORRADOR de la documentación legal).

export type TaxonomyStatus =
  | 'draft'                  // borrador inicial
  | 'subject_to_expert'      // diseñado · pendiente validación experta
  | 'validated'              // experto externo lo ha sellado
  | 'deprecated'             // reemplazado · no usar

/** Estado global de la taxonomía. v1.1 bumpea de 'draft' a 'subject_to_expert'
 *  conforme a filosofía Audit-Ready by Design (canonizada 2026-05-29).
 *  Los sectores/grupos individuales pueden sobreescribir con status propio.
 *  Pasará a 'validated' cuando llegue consulta a expertos sectoriales
 *  (colegios profesionales UE+ES · pre-deploy con R0). */
export const ACTOR_TAXONOMY_STATUS: TaxonomyStatus = 'subject_to_expert'

// Anclaje multinacional: ISIC (clasificación de la ONU) es el ancla GLOBAL
// — el emparejamiento cross-border de actores se hace sobre ISIC, no sobre
// el código nacional. CNAE (España), NACE (UE), NAICS (Norteamérica) y los
// sistemas nacionales tienen tabla de correspondencia oficial con ISIC; son
// "vistas" del mismo árbol. El usuario nunca elige un código: elige un rol
// de esta taxonomía unificada, y la taxonomía carga el ISIC por debajo.
// Por eso un actor español y uno alemán que eligen el mismo rol conectan.
// CNAE se conserva para verificar al actor contra el registro oficial de
// SU país (KYC profesional). Conectar = ISIC · verificar papeles = nacional.

// i18n de labels: backbone para que el actor vea sectores/grupos/roles
// en su idioma. Los IDs (id, isic, cnae) siempre son universales — solo
// se localiza la etiqueta visible. Los 8 idiomas coinciden con el resto
// del shell (i18n.ts). Compatibilidad transicional: label puede ser
// `string` (sectores no migrados todavía) o `LocalizedLabel` (migrados).
// Cuando termine la migración entera, simplificamos a solo LocalizedLabel.

export type Lang = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja'

export type LocalizedLabel = {
  es: string
  en: string
  fr: string
  de: string
  it: string
  pt: string
  zh: string
  ja: string
}

export type LabelOrLocalized = string | LocalizedLabel

/** Extrae el label en el idioma pedido con cascade de fallback.
 *  Si el label es un string plano (sector aún no migrado), lo devuelve
 *  tal cual. Si es LocalizedLabel, intenta lang → en → es como último
 *  recurso para nunca devolver vacío. */
export function getLabel(label: LabelOrLocalized, lang: Lang = 'es'): string {
  if (typeof label === 'string') return label
  return label[lang] || label.en || label.es || ''
}

export type ActorRole = {
  id: string
  label: LabelOrLocalized
  /** Código ISIC (ONU) — ancla GLOBAL de interoperabilidad cross-border. */
  isic?: string
  /** Código CNAE-2025 (España) — vista nacional para verificación oficial. */
  cnae?: string
}

export type ActorGroup = {
  id: string
  label: LabelOrLocalized
  short: string // 2-letter code
  /** Validación granular. Si se omite, hereda ACTOR_TAXONOMY_STATUS. */
  status?: TaxonomyStatus
  /** Código ISIC (ONU) de la división — ancla global del grupo. */
  isic?: string
  /** Código CNAE-2025 (España) de anclaje del grupo (división/grupo). */
  cnae?: string
  roles: ActorRole[]
}

/** Estado efectivo de un grupo: el suyo propio, o el global si no lo declara. */
export function groupStatus(g: ActorGroup): TaxonomyStatus {
  return g.status ?? ACTOR_TAXONOMY_STATUS
}

/** ¿Algún grupo del sector sigue en borrador inicial? Decide si la UI
 *  muestra el aviso más fuerte "clasificación provisional · pendiente
 *  rediseño". */
export function sectorHasDraft(groups: ActorGroup[]): boolean {
  return groups.some((g) => groupStatus(g) === 'draft')
}

/** ¿Algún grupo del sector está pendiente validación experta?
 *  Decide si la UI muestra el aviso "validación experta pendiente"
 *  (más suave que draft · el diseño está completo pero falta sello externo).
 *  v1.1 · audit-ready by design. */
export function sectorHasSubjectToExpert(groups: ActorGroup[]): boolean {
  return groups.some((g) => groupStatus(g) === 'subject_to_expert')
}

/** ¿Todos los grupos del sector están validados por experto externo?
 *  v1.1 · audit-ready by design. */
export function sectorIsFullyValidated(groups: ActorGroup[]): boolean {
  return groups.length > 0 && groups.every((g) => groupStatus(g) === 'validated')
}

/** Conteo agregado por status para dashboards/UI de gestión. v1.1. */
export function countGroupsByStatus(groups: ActorGroup[]): Record<TaxonomyStatus, number> {
  const counts: Record<TaxonomyStatus, number> = {
    draft: 0,
    subject_to_expert: 0,
    validated: 0,
    deprecated: 0,
  }
  for (const g of groups) {
    counts[groupStatus(g)]++
  }
  return counts
}

// INMOBILIARIO — PLANTILLA CANÓNICA validada contra CNAE-2025
// (RD 10/2025, BOE). Backbone: Sección F Construcción (div. 41/42/43),
// División 68 Actividades inmobiliarias, servicios técnicos (CNAE 71.1) y
// servicios a edificios (CNAE 81). Cada grupo cita su código de anclaje.
// status:'validated' → la UI no muestra el aviso "provisional" para este
// sector. El resto de sectores siguen 'draft' hasta su propio sourcing.
const INMOBILIARIO: ActorGroup[] = [
  {
    id: 'proyectos',
    label: { es: 'Proyectos y servicios técnicos', en: 'Projects and technical services', fr: 'Projets et services techniques', de: 'Projekte und technische Dienstleistungen', it: 'Progetti e servizi tecnici', pt: 'Projetos e serviços técnicos', zh: '项目与技术服务', ja: 'プロジェクトおよび技術サービス' },
    short: 'PR',
    status: 'validated',
    isic: '71',
    cnae: '71.1',
    roles: [
      { id: 'arquitectos', label: { es: 'Arquitectos', en: 'Architects', fr: 'Architectes', de: 'Architekten', it: 'Architetti', pt: 'Arquitetos', zh: '建筑师', ja: '建築家' }, isic: '7110', cnae: '71.11' },
      { id: 'aparejadores', label: { es: 'Aparejadores / Arquitectos técnicos', en: 'Building surveyors / Technical architects', fr: 'Géomètres / Architectes techniques', de: 'Bauleiter / Bautechniker', it: 'Geometri / Architetti tecnici', pt: 'Mestres de obras / Arquitetos técnicos', zh: '建筑测量师 / 建筑技师', ja: '建築測量士・建築技術者' }, isic: '7110', cnae: '71.11' },
      { id: 'ingenieros-edificacion', label: { es: 'Ingenieros de edificación', en: 'Building engineers', fr: 'Ingénieurs du bâtiment', de: 'Bauingenieure', it: 'Ingegneri edili', pt: 'Engenheiros de edificação', zh: '建筑工程师', ja: '建築技術者' }, isic: '7110', cnae: '71.12' },
      { id: 'topografos', label: { es: 'Topógrafos', en: 'Surveyors', fr: 'Géomètres-topographes', de: 'Vermessungsingenieure', it: 'Topografi', pt: 'Topógrafos', zh: '测量师', ja: '測量士' }, isic: '7110', cnae: '71.12' },
      { id: 'interioristas', label: { es: 'Interioristas', en: 'Interior designers', fr: 'Architectes d\'intérieur', de: 'Innenarchitekten', it: 'Architetti d\'interni', pt: 'Designers de interiores', zh: '室内设计师', ja: 'インテリアデザイナー' }, isic: '7410', cnae: '74.10' },
      { id: 'diseno-exterior', label: { es: 'Diseñadores de exterior', en: 'Exterior designers', fr: 'Concepteurs d\'extérieur', de: 'Außendesigner', it: 'Progettisti d\'esterni', pt: 'Designers de exterior', zh: '室外设计师', ja: 'エクステリアデザイナー' }, isic: '7410', cnae: '74.10' },
      { id: 'paisajistas', label: { es: 'Paisajistas', en: 'Landscape architects', fr: 'Paysagistes', de: 'Landschaftsarchitekten', it: 'Paesaggisti', pt: 'Paisagistas', zh: '景观设计师', ja: 'ランドスケープデザイナー' }, isic: '7110', cnae: '71.11' },
      { id: 'project-managers', label: { es: 'Project managers de obra', en: 'Construction project managers', fr: 'Chefs de projet construction', de: 'Bauprojektmanager', it: 'Project manager di cantiere', pt: 'Gerentes de projeto de obra', zh: '工程项目经理', ja: '建設プロジェクトマネージャー' }, isic: '7110', cnae: '71.12' },
      { id: 'eficiencia-energetica', label: { es: 'Certificadores de eficiencia energética', en: 'Energy efficiency certifiers', fr: 'Certificateurs d\'efficacité énergétique', de: 'Energieeffizienz-Zertifizierer', it: 'Certificatori di efficienza energetica', pt: 'Certificadores de eficiência energética', zh: '能源效率认证师', ja: 'エネルギー効率認証者' }, isic: '7120', cnae: '71.20' },
    ],
  },
  {
    id: 'edificacion',
    label: { es: 'Construcción de edificios', en: 'Building construction', fr: 'Construction de bâtiments', de: 'Hochbau', it: 'Costruzione di edifici', pt: 'Construção de edifícios', zh: '建筑物建造', ja: '建築建設' },
    short: 'ED',
    status: 'validated',
    isic: '41',
    cnae: '41',
    roles: [
      { id: 'constructoras', label: { es: 'Constructoras (edificación)', en: 'Building contractors', fr: 'Entreprises de construction', de: 'Bauunternehmen', it: 'Imprese di costruzione', pt: 'Construtoras (edificação)', zh: '建筑承包商', ja: '建設業者' }, isic: '4100', cnae: '41.0' },
      { id: 'reformistas', label: { es: 'Reformistas / rehabilitación', en: 'Renovation contractors', fr: 'Rénovateurs', de: 'Sanierungsunternehmen', it: 'Imprese di ristrutturazione', pt: 'Empresas de reforma', zh: '翻新承包商', ja: '改装業者' }, isic: '4100', cnae: '41.0' },
      { id: 'edif-residencial', label: { es: 'Edificación residencial', en: 'Residential construction', fr: 'Construction résidentielle', de: 'Wohnbau', it: 'Edilizia residenziale', pt: 'Edificação residencial', zh: '住宅建造', ja: '住宅建設' }, isic: '4100', cnae: '41.01' },
      { id: 'edif-no-residencial', label: { es: 'Edificación no residencial', en: 'Non-residential construction', fr: 'Construction non résidentielle', de: 'Nichtwohnbau', it: 'Edilizia non residenziale', pt: 'Edificação não residencial', zh: '非住宅建造', ja: '非住宅建設' }, isic: '4100', cnae: '41.02' },
    ],
  },
  {
    id: 'obra-civil',
    label: { es: 'Ingeniería civil', en: 'Civil engineering', fr: 'Génie civil', de: 'Tiefbau', it: 'Ingegneria civile', pt: 'Engenharia civil', zh: '土木工程', ja: '土木工学' },
    short: 'OC',
    status: 'validated',
    isic: '42',
    cnae: '42',
    roles: [
      { id: 'obra-civil-viario', label: { es: 'Carreteras, vías férreas, puentes y túneles', en: 'Roads, railways, bridges and tunnels', fr: 'Routes, voies ferrées, ponts et tunnels', de: 'Straßen, Bahnstrecken, Brücken und Tunnel', it: 'Strade, ferrovie, ponti e gallerie', pt: 'Estradas, ferrovias, pontes e túneis', zh: '道路、铁路、桥梁与隧道', ja: '道路・鉄道・橋梁・トンネル' }, isic: '4210', cnae: '42.1' },
      { id: 'redes-canalizaciones', label: { es: 'Redes (fluidos, eléctricas, telecom)', en: 'Networks (fluids, electrical, telecom)', fr: 'Réseaux (fluides, électriques, télécoms)', de: 'Netze (Versorgung, Strom, Telekom)', it: 'Reti (fluidi, elettriche, telecom)', pt: 'Redes (fluidos, elétricas, telecom)', zh: '管网(流体、电力、电信)', ja: 'ネットワーク(流体・電気・通信)' }, isic: '4220', cnae: '42.2' },
      { id: 'obra-hidraulica', label: { es: 'Obra hidráulica y otra ingeniería civil', en: 'Hydraulic works and other civil engineering', fr: 'Ouvrages hydrauliques et autre génie civil', de: 'Wasserbau und sonstiger Tiefbau', it: 'Opere idrauliche e altra ingegneria civile', pt: 'Obras hidráulicas e outra engenharia civil', zh: '水利工程与其他土木工程', ja: '水利工事およびその他の土木工事' }, isic: '4290', cnae: '42.9' },
    ],
  },
  {
    id: 'instalaciones-acabados',
    label: { es: 'Construcción especializada', en: 'Specialised construction', fr: 'Construction spécialisée', de: 'Spezialbau', it: 'Costruzione specializzata', pt: 'Construção especializada', zh: '专业建筑', ja: '専門建設' },
    short: 'IA',
    status: 'validated',
    isic: '43',
    cnae: '43',
    roles: [
      { id: 'demoliciones', label: { es: 'Demolición y preparación de terrenos', en: 'Demolition and site preparation', fr: 'Démolition et préparation des sites', de: 'Abbruch und Baugrundvorbereitung', it: 'Demolizione e preparazione del sito', pt: 'Demolição e preparação de terrenos', zh: '拆除与场地准备', ja: '解体および用地造成' }, isic: '4311', cnae: '43.1' },
      { id: 'electricistas', label: { es: 'Electricistas', en: 'Electricians', fr: 'Électriciens', de: 'Elektriker', it: 'Elettricisti', pt: 'Eletricistas', zh: '电工', ja: '電気工事業者' }, isic: '4321', cnae: '43.21' },
      { id: 'fontaneros', label: { es: 'Fontaneros', en: 'Plumbers', fr: 'Plombiers', de: 'Installateure', it: 'Idraulici', pt: 'Encanadores', zh: '水管工', ja: '配管工' }, isic: '4322', cnae: '43.22' },
      { id: 'climatizacion', label: { es: 'Climatización / HVAC', en: 'HVAC / climate control', fr: 'Climatisation / CVC', de: 'Klimatechnik / HVAC', it: 'Climatizzazione / HVAC', pt: 'Climatização / HVAC', zh: '空调/暖通', ja: '空調・HVAC' }, isic: '4322', cnae: '43.22' },
      { id: 'escayolistas', label: { es: 'Escayolistas / pladur (revocamiento)', en: 'Plasterers / drywall', fr: 'Plâtriers / cloisons sèches', de: 'Verputzer / Trockenbau', it: 'Intonacatori / cartongesso', pt: 'Estucadores / pladur', zh: '石膏工/干墙', ja: '左官・乾式壁' }, isic: '4330', cnae: '43.31' },
      { id: 'carpinteros', label: { es: 'Carpinteros', en: 'Carpenters', fr: 'Charpentiers', de: 'Tischler', it: 'Carpentieri', pt: 'Carpinteiros', zh: '木工', ja: '大工' }, isic: '4330', cnae: '43.32' },
      { id: 'soladores-alicatadores', label: { es: 'Soladores y alicatadores', en: 'Floor and wall tilers', fr: 'Carreleurs', de: 'Fliesenleger', it: 'Piastrellisti', pt: 'Ladrilhadores', zh: '铺地与贴砖工', ja: '床・壁タイル工' }, isic: '4330', cnae: '43.33' },
      { id: 'pintores', label: { es: 'Pintores', en: 'Painters', fr: 'Peintres', de: 'Maler', it: 'Imbianchini', pt: 'Pintores', zh: '油漆工', ja: '塗装工' }, isic: '4330', cnae: '43.34' },
      { id: 'cristaleros', label: { es: 'Cristaleros / acristalamiento', en: 'Glaziers', fr: 'Vitriers', de: 'Glaser', it: 'Vetrai', pt: 'Vidraceiros', zh: '玻璃工', ja: 'ガラス工' }, isic: '4330', cnae: '43.34' },
      { id: 'impermeabilizadores', label: { es: 'Cubiertas e impermeabilización', en: 'Roofing and waterproofing', fr: 'Toiture et étanchéité', de: 'Dachdecker und Abdichtung', it: 'Coperture e impermeabilizzazione', pt: 'Coberturas e impermeabilização', zh: '屋顶与防水', ja: '屋根および防水' }, isic: '4390', cnae: '43.91' },
      { id: 'albaniles', label: { es: 'Albañilería y mampostería', en: 'Masonry', fr: 'Maçonnerie', de: 'Maurerei', it: 'Muratura', pt: 'Alvenaria', zh: '砌筑工', ja: '石工・煉瓦工' }, isic: '4390', cnae: '43.99' },
      { id: 'cerrajeros', label: { es: 'Cerrajería / metalistería', en: 'Locksmithing / metalwork', fr: 'Serrurerie / métallerie', de: 'Schlosserei / Metallarbeiten', it: 'Fabbreria / lavorazione metalli', pt: 'Serralharia / metalurgia', zh: '锁匠/金属加工', ja: '錠前・金属加工' }, isic: '4390', cnae: '43.99' },
    ],
  },
  {
    id: 'materiales',
    label: { es: 'Materiales y suministro', en: 'Materials and supply', fr: 'Matériaux et fournitures', de: 'Materialien und Lieferung', it: 'Materiali e forniture', pt: 'Materiais e fornecimento', zh: '材料与供应', ja: '材料および供給' },
    short: 'MT',
    status: 'validated',
    isic: '46',
    cnae: '46.7',
    roles: [
      { id: 'cemento', label: { es: 'Cemento', en: 'Cement', fr: 'Ciment', de: 'Zement', it: 'Cemento', pt: 'Cimento', zh: '水泥', ja: 'セメント' }, isic: '2394', cnae: '23.51' },
      { id: 'hormigon', label: { es: 'Hormigón', en: 'Concrete', fr: 'Béton', de: 'Beton', it: 'Calcestruzzo', pt: 'Concreto', zh: '混凝土', ja: 'コンクリート' }, isic: '2395', cnae: '23.63' },
      { id: 'ceramica', label: { es: 'Cerámica y porcelánico', en: 'Ceramic and porcelain', fr: 'Céramique et porcelaine', de: 'Keramik und Porzellan', it: 'Ceramica e gres porcellanato', pt: 'Cerâmica e porcelânico', zh: '陶瓷与瓷砖', ja: '陶磁器・ポーセリン' }, isic: '2392', cnae: '23.3' },
      { id: 'acero', label: { es: 'Acero estructural', en: 'Structural steel', fr: 'Acier de construction', de: 'Baustahl', it: 'Acciaio strutturale', pt: 'Aço estrutural', zh: '结构钢', ja: '構造用鋼材' }, isic: '2410', cnae: '24.10' },
      { id: 'madera-derivados', label: { es: 'Madera y derivados', en: 'Wood and derivatives', fr: 'Bois et dérivés', de: 'Holz und Holzwerkstoffe', it: 'Legno e derivati', pt: 'Madeira e derivados', zh: '木材及衍生品', ja: '木材および派生品' }, isic: '1622', cnae: '16.2' },
      { id: 'piedra-natural', label: { es: 'Piedra natural y mármol', en: 'Natural stone and marble', fr: 'Pierre naturelle et marbre', de: 'Naturstein und Marmor', it: 'Pietra naturale e marmo', pt: 'Pedra natural e mármore', zh: '天然石材与大理石', ja: '天然石・大理石' }, isic: '2396', cnae: '23.70' },
      { id: 'cocinas', label: { es: 'Cocinas', en: 'Kitchens', fr: 'Cuisines', de: 'Küchen', it: 'Cucine', pt: 'Cozinhas', zh: '厨房', ja: 'キッチン' }, isic: '4663', cnae: '46.7' },
      { id: 'puertas-ventanas', label: { es: 'Puertas y ventanas', en: 'Doors and windows', fr: 'Portes et fenêtres', de: 'Türen und Fenster', it: 'Porte e finestre', pt: 'Portas e janelas', zh: '门窗', ja: 'ドアおよび窓' }, isic: '4663', cnae: '46.7' },
      { id: 'sanitarios-griferia', label: { es: 'Sanitarios y grifería', en: 'Sanitaryware and taps', fr: 'Sanitaires et robinetterie', de: 'Sanitäranlagen und Armaturen', it: 'Sanitari e rubinetteria', pt: 'Louças sanitárias e torneiras', zh: '卫浴与龙头', ja: '衛生陶器・水栓金具' }, isic: '4663', cnae: '46.7' },
      { id: 'aislamientos', label: { es: 'Aislamientos', en: 'Insulation', fr: 'Isolation', de: 'Dämmstoffe', it: 'Isolanti', pt: 'Isolamentos', zh: '保温隔热材料', ja: '断熱材' }, isic: '4663', cnae: '46.7' },
      { id: 'pintura', label: { es: 'Pintura y revestimientos (producto)', en: 'Paint and coatings (product)', fr: 'Peinture et revêtements (produit)', de: 'Farben und Beschichtungen (Produkt)', it: 'Vernici e rivestimenti (prodotto)', pt: 'Tintas e revestimentos (produto)', zh: '涂料与饰面(产品)', ja: '塗料・コーティング材' }, isic: '4663', cnae: '46.7' },
      { id: 'iluminacion-mat', label: { es: 'Iluminación', en: 'Lighting', fr: 'Éclairage', de: 'Beleuchtung', it: 'Illuminazione', pt: 'Iluminação', zh: '照明', ja: '照明器具' }, isic: '4663', cnae: '46.7' },
    ],
  },
  {
    id: 'inmobiliarias',
    label: { es: 'Actividades inmobiliarias', en: 'Real estate activities', fr: 'Activités immobilières', de: 'Immobilienaktivitäten', it: 'Attività immobiliari', pt: 'Atividades imobiliárias', zh: '房地产活动', ja: '不動産業' },
    short: 'IM',
    status: 'validated',
    isic: '68',
    cnae: '68',
    roles: [
      { id: 'promotores', label: { es: 'Promotores inmobiliarios', en: 'Real estate developers', fr: 'Promoteurs immobiliers', de: 'Immobilienentwickler', it: 'Promotori immobiliari', pt: 'Incorporadores imobiliários', zh: '房地产开发商', ja: '不動産デベロッパー' }, isic: '6810', cnae: '68.12' },
      { id: 'inversores', label: { es: 'Compraventa por cuenta propia / inversores', en: 'Own-account property buying & selling / investors', fr: 'Achat-vente pour compte propre / investisseurs', de: 'Eigenhandel mit Immobilien / Investoren', it: 'Compravendita per conto proprio / investitori', pt: 'Compra e venda por conta própria / investidores', zh: '自营房产买卖/投资者', ja: '自社売買・投資家' }, isic: '6810', cnae: '68.11' },
      { id: 'inmobiliarias', label: { es: 'Inmobiliarias / agentes (API)', en: 'Real estate agencies', fr: 'Agences immobilières', de: 'Immobilienmakler', it: 'Agenzie immobiliari', pt: 'Imobiliárias / agentes', zh: '房地产中介', ja: '不動産仲介業者' }, isic: '6820', cnae: '68.31' },
      { id: 'tasadores', label: { es: 'Tasadores', en: 'Property appraisers', fr: 'Experts évaluateurs', de: 'Immobiliengutachter', it: 'Periti immobiliari', pt: 'Avaliadores imobiliários', zh: '估价师', ja: '不動産鑑定士' }, isic: '6820', cnae: '68.31' },
      { id: 'administradores-fincas', label: { es: 'Administradores de fincas', en: 'Property administrators', fr: 'Administrateurs de biens', de: 'Hausverwalter', it: 'Amministratori di condominio', pt: 'Administradores de condomínio', zh: '物业管理人', ja: '不動産管理者' }, isic: '6820', cnae: '68.32' },
      { id: 'gestores-alquiler', label: { es: 'Gestión de alquiler / PMS', en: 'Rental management / PMS', fr: 'Gestion locative / PMS', de: 'Mietverwaltung / PMS', it: 'Gestione affitti / PMS', pt: 'Gestão de aluguel / PMS', zh: '租赁管理/PMS', ja: '賃貸管理・PMS' }, isic: '6810', cnae: '68.20' },
      { id: 'gestores-patrimonio', label: { es: 'Gestores de patrimonio', en: 'Wealth managers', fr: 'Gestionnaires de patrimoine', de: 'Vermögensverwalter', it: 'Gestori patrimoniali', pt: 'Gestores de patrimônio', zh: '财富管理人', ja: '資産運用業者' }, isic: '6820', cnae: '68.32' },
      { id: 'home-staging', label: { es: 'Home staging', en: 'Home staging', fr: 'Home staging', de: 'Home Staging', it: 'Home staging', pt: 'Home staging', zh: '样板房布置', ja: 'ホームステージング' }, isic: '6820', cnae: '68.31' },
    ],
  },
  {
    id: 'servicios-edificios',
    label: { es: 'Servicios a edificios', en: 'Building services', fr: 'Services aux bâtiments', de: 'Gebäudedienstleistungen', it: 'Servizi agli edifici', pt: 'Serviços a edifícios', zh: '建筑服务', ja: '建物サービス' },
    short: 'SE',
    status: 'validated',
    isic: '81',
    cnae: '81',
    roles: [
      { id: 'mantenimiento-integral', label: { es: 'Mantenimiento integral de edificios', en: 'Integrated building maintenance', fr: 'Maintenance intégrée de bâtiments', de: 'Gebäudemanagement und Instandhaltung', it: 'Manutenzione integrata di edifici', pt: 'Manutenção integral de edifícios', zh: '综合建筑维护', ja: '建物総合保守' }, isic: '8110', cnae: '81.10' },
      { id: 'limpieza-edificios', label: { es: 'Limpieza de edificios', en: 'Building cleaning', fr: 'Nettoyage de bâtiments', de: 'Gebäudereinigung', it: 'Pulizia di edifici', pt: 'Limpeza de edifícios', zh: '建筑清洁', ja: '建物清掃' }, isic: '8121', cnae: '81.2' },
      { id: 'jardineria-obra', label: { es: 'Jardinería y zonas verdes', en: 'Landscaping and green areas', fr: 'Espaces verts et jardinage', de: 'Garten- und Landschaftspflege', it: 'Giardinaggio e aree verdi', pt: 'Jardinagem e áreas verdes', zh: '园艺与绿地', ja: '造園・緑地管理' }, isic: '8130', cnae: '81.30' },
      { id: 'seguridad-edificios', label: { es: 'Seguridad y control de accesos', en: 'Security and access control', fr: 'Sécurité et contrôle d\'accès', de: 'Sicherheits- und Zugangskontrolle', it: 'Sicurezza e controllo accessi', pt: 'Segurança e controle de acessos', zh: '安保与门禁', ja: 'セキュリティ・入退室管理' }, isic: '8010', cnae: '80.10' },
    ],
  },
]

const AUTOMOCION: ActorGroup[] = [
  {
    id: 'fabricacion',
    label: 'Fabricación',
    short: 'FB',
    status: 'validated',
    isic: '29',
    cnae: '29',
    roles: [
      { id: 'oem', label: 'Fabricantes OEM', isic: '2910', cnae: '29.10' },
      { id: 'componentes', label: 'Componentes (tier 1/2)', isic: '2930', cnae: '29.32' },
      { id: 'electronica-auto', label: 'Electrónica embebida', isic: '2610', cnae: '26.20' },
      { id: 'baterias', label: 'Baterías y EV', isic: '2720', cnae: '27.20' },
      { id: 'carroceria-fab', label: 'Carrocería y bastidores', isic: '2920', cnae: '29.20' },
      { id: 'motores-fab', label: 'Motores y propulsión', isic: '2910', cnae: '29.10' },
      { id: 'inyeccion-plastico', label: 'Inyección de plástico / moldes', isic: '2220', cnae: '22.29' },
    ],
  },
  {
    id: 'distribucion',
    label: 'Distribución',
    short: 'DS',
    status: 'validated',
    isic: '45',
    cnae: '45.3',
    roles: [
      { id: 'recambios', label: 'Recambios oficiales', isic: '4530', cnae: '45.31' },
      { id: 'aftermarket', label: 'Aftermarket', isic: '4530', cnae: '45.32' },
      { id: 'neumaticos', label: 'Neumáticos', isic: '4530', cnae: '45.32' },
      { id: 'lubricantes', label: 'Lubricantes y químicos', isic: '4661', cnae: '46.71' },
      { id: 'herramienta-taller', label: 'Herramienta y equipamiento de taller', isic: '4659', cnae: '46.69' },
      { id: 'accesorios-auto', label: 'Accesorios y tuning', isic: '4530', cnae: '45.32' },
    ],
  },
  {
    id: 'servicios-auto',
    label: 'Servicios',
    short: 'SV',
    status: 'validated',
    isic: '45',
    cnae: '45.20',
    roles: [
      { id: 'talleres', label: 'Talleres mecánicos', isic: '4520', cnae: '45.20' },
      { id: 'chapa-pintura', label: 'Chapa y pintura', isic: '4520', cnae: '45.20' },
      { id: 'electricidad-auto', label: 'Electricidad del automóvil', isic: '4520', cnae: '45.20' },
      { id: 'itv', label: 'ITV / inspección', isic: '7120', cnae: '71.20' },
      { id: 'neumaticos-serv', label: 'Servicios de neumáticos', isic: '4520', cnae: '45.20' },
      { id: 'lunas', label: 'Lunas y cristalería', isic: '4520', cnae: '45.20' },
      { id: 'grua-asistencia', label: 'Grúa y asistencia en carretera', isic: '5221', cnae: '52.21' },
      { id: 'preparacion-competicion', label: 'Preparación y competición', isic: '4520', cnae: '45.20' },
    ],
  },
  {
    id: 'flota',
    label: 'Flota & Movilidad',
    short: 'FL',
    status: 'validated',
    isic: '77',
    cnae: '77.1',
    roles: [
      { id: 'concesionarios', label: 'Concesionarios', isic: '4510', cnae: '45.11' },
      { id: 'flotas', label: 'Gestión de flotas', isic: '7710', cnae: '77.11' },
      { id: 'renting', label: 'Renting / leasing', isic: '7710', cnae: '77.11' },
      { id: 'cargadores-ev', label: 'Infraestructura EV', isic: '3510', cnae: '35.11' },
      { id: 'vehiculo-ocasion', label: 'Vehículo de ocasión', isic: '4510', cnae: '45.11' },
      { id: 'carsharing', label: 'Carsharing / movilidad compartida', isic: '7710', cnae: '77.11' },
      { id: 'desguaces', label: 'Desguaces y reciclaje (CAT)', isic: '3830', cnae: '38.31' },
    ],
  },
]

const SALUD: ActorGroup[] = [
  {
    id: 'centros',
    label: 'Centros',
    short: 'CT',
    status: 'validated',
    isic: '86',
    cnae: '86',
    roles: [
      { id: 'hospitales', label: 'Hospitales', isic: '8610', cnae: '86.10' },
      { id: 'clinicas', label: 'Clínicas', isic: '8610', cnae: '86.10' },
      { id: 'farmacias', label: 'Farmacias', isic: '4772', cnae: '47.73' },
      { id: 'geriatricos', label: 'Centros geriátricos', isic: '8730', cnae: '87.30' },
      { id: 'centros-salud', label: 'Centros de salud / atención primaria', isic: '8620', cnae: '86.21' },
      { id: 'clinicas-dentales', label: 'Clínicas dentales', isic: '8620', cnae: '86.23' },
      { id: 'fisioterapia-centro', label: 'Centros de fisioterapia', isic: '8690', cnae: '86.90' },
      { id: 'oftalmologia', label: 'Centros oftalmológicos', isic: '8620', cnae: '86.22' },
    ],
  },
  {
    id: 'profesional-salud',
    label: 'Profesional sanitario',
    short: 'PS',
    status: 'validated',
    isic: '86',
    cnae: '86.2',
    roles: [
      { id: 'medicos', label: 'Médicos especialistas', isic: '8620', cnae: '86.21' },
      { id: 'enfermeria', label: 'Enfermería', isic: '8690', cnae: '86.90' },
      { id: 'farmaceuticos', label: 'Farmacéuticos', isic: '8690', cnae: '86.90' },
      { id: 'tecnicos-salud', label: 'Técnicos sanitarios', isic: '8690', cnae: '86.90' },
      { id: 'fisioterapeutas', label: 'Fisioterapeutas', isic: '8690', cnae: '86.90' },
      { id: 'psicologos', label: 'Psicólogos clínicos', isic: '8690', cnae: '86.90' },
      { id: 'dentistas', label: 'Odontólogos', isic: '8620', cnae: '86.23' },
      { id: 'nutricionistas-salud', label: 'Dietistas-nutricionistas', isic: '8690', cnae: '86.90' },
      { id: 'podologos', label: 'Podólogos', isic: '8690', cnae: '86.90' },
      { id: 'logopedas', label: 'Logopedas', isic: '8690', cnae: '86.90' },
    ],
  },
  {
    id: 'suministro',
    label: 'Suministro',
    short: 'SM',
    status: 'validated',
    isic: '46',
    cnae: '46.4',
    roles: [
      { id: 'farmaceuticas', label: 'Farmacéuticas', isic: '2100', cnae: '21.10' },
      { id: 'distribuidores-gdp', label: 'Distribuidores GDP', isic: '4649', cnae: '46.46' },
      { id: 'equipamiento-medico', label: 'Equipamiento médico', isic: '3250', cnae: '32.50' },
      { id: 'epi', label: 'EPI sanitario', isic: '3290', cnae: '32.99' },
      { id: 'fungible-sanitario', label: 'Fungible y consumible clínico', isic: '3250', cnae: '32.50' },
      { id: 'ortopedia', label: 'Ortopedia y prótesis', isic: '3250', cnae: '32.50' },
      { id: 'mobiliario-clinico', label: 'Mobiliario clínico', isic: '3100', cnae: '31.09' },
    ],
  },
  {
    id: 'diagnostico',
    label: 'Diagnóstico',
    short: 'DG',
    status: 'validated',
    isic: '86',
    cnae: '86.90',
    roles: [
      { id: 'laboratorios', label: 'Laboratorios', isic: '8690', cnae: '86.90' },
      { id: 'imagen-medica', label: 'Imagen médica', isic: '8620', cnae: '86.22' },
      { id: 'telemedicina', label: 'Telemedicina', isic: '8620', cnae: '86.21' },
      { id: 'anatomia-patologica', label: 'Anatomía patológica', isic: '8690', cnae: '86.90' },
      { id: 'genetica', label: 'Genética y biología molecular', isic: '8690', cnae: '86.90' },
    ],
  },
  {
    id: 'servicios-sociales',
    label: 'Servicios sociales y dependencia',
    short: 'SS',
    status: 'validated',
    isic: '88',
    cnae: '88',
    roles: [
      { id: 'atencion-domiciliaria', label: 'Atención domiciliaria (SAD)', isic: '8810', cnae: '88.10' },
      { id: 'residencias-dependencia', label: 'Residencias de dependencia', isic: '8730', cnae: '87.30' },
      { id: 'centros-dia', label: 'Centros de día', isic: '8810', cnae: '88.10' },
      { id: 'discapacidad', label: 'Atención a la discapacidad', isic: '8810', cnae: '88.10' },
      { id: 'teleasistencia', label: 'Teleasistencia', isic: '8890', cnae: '88.99' },
      { id: 'insercion-social', label: 'Inserción y servicios sociales', isic: '8890', cnae: '88.99' },
    ],
  },
]

// Agroalimentario anclado a CNAE-2025: Sección A (agricultura, ganadería,
// silvicultura y pesca — div. 01/02/03) + industria de la alimentación y
// bebidas (Sección C, div. 10/11) + distribución y HORECA. Sector-clúster
// de cadena de valor: del campo a la mesa.
const AGROALIMENTARIO: ActorGroup[] = [
  {
    id: 'insumos-agricolas',
    label: 'Insumos y suministro agrícola',
    short: 'IS',
    status: 'validated',
    isic: '20',
    cnae: '20.2',
    roles: [
      { id: 'semillas-viveros', label: 'Semillas y viveros', isic: '0140', cnae: '01.64' },
      { id: 'fertilizantes', label: 'Fertilizantes y abonos', isic: '2012', cnae: '20.15' },
      { id: 'fitosanitarios', label: 'Fitosanitarios y protección de cultivos', isic: '2021', cnae: '20.20' },
      { id: 'maquinaria-agricola', label: 'Maquinaria agrícola', isic: '2821', cnae: '28.30' },
      { id: 'piensos', label: 'Piensos y nutrición animal', isic: '1080', cnae: '10.91' },
      { id: 'riego-invernaderos', label: 'Sistemas de riego e invernaderos', isic: '2821', cnae: '28.30' },
    ],
  },
  {
    id: 'produccion-primaria',
    label: 'Producción primaria',
    short: 'PP',
    status: 'validated',
    isic: '01',
    cnae: 'A',
    roles: [
      { id: 'agricultura', label: 'Agricultura y cultivos', isic: '0111', cnae: '01.1' },
      { id: 'ganaderia', label: 'Ganadería', isic: '0141', cnae: '01.4' },
      { id: 'pesca-acuicultura', label: 'Pesca y acuicultura', isic: '0311', cnae: '03' },
      { id: 'silvicultura', label: 'Silvicultura y explotación forestal', isic: '0210', cnae: '02' },
      { id: 'cooperativas', label: 'Cooperativas agrarias', isic: '0163', cnae: '01.6' },
      { id: 'organicos', label: 'Producción ecológica', isic: '0111', cnae: '01.1' },
    ],
  },
  {
    id: 'industria-alimentaria',
    label: 'Industria alimentaria',
    short: 'IA',
    status: 'validated',
    isic: '10',
    cnae: '10',
    roles: [
      { id: 'fabricantes-alim', label: 'Fabricantes alimentarios', isic: '1079', cnae: '10' },
      { id: 'bodegas', label: 'Bodegas y almazaras', isic: '1102', cnae: '11' },
      { id: 'panaderia-industrial', label: 'Panadería y pastelería industrial', isic: '1071', cnae: '10.7' },
      { id: 'conservas-transformados', label: 'Conservas y transformados', isic: '1030', cnae: '10.3' },
      { id: 'ingredientes-alim', label: 'Ingredientes y aditivos', isic: '1079', cnae: '10.8' },
    ],
  },
  {
    id: 'distribucion-alim',
    label: 'Distribución',
    short: 'DS',
    status: 'validated',
    isic: '46',
    cnae: '46.3',
    roles: [
      { id: 'mayoristas', label: 'Mayoristas', isic: '4630', cnae: '46.3' },
      { id: 'importadores', label: 'Importadores', isic: '4630', cnae: '46.3' },
      { id: 'distribuidores-frio', label: 'Distribución cadena de frío', isic: '4630', cnae: '46.3' },
      { id: 'logistica-alim', label: 'Logística alimentaria', isic: '5210', cnae: '52.10' },
      { id: 'mercas', label: 'Mercas y lonjas', isic: '4630', cnae: '46.3' },
      { id: 'cash-carry', label: 'Cash & carry', isic: '4630', cnae: '46.3' },
    ],
  },
  {
    id: 'horeca',
    label: 'HORECA & Retail',
    short: 'HR',
    status: 'validated',
    isic: '56',
    cnae: '56',
    roles: [
      { id: 'restaurantes', label: 'Restaurantes', isic: '5610', cnae: '56.10' },
      { id: 'hoteles-alim', label: 'Hoteles', isic: '5510', cnae: '55.10' },
      { id: 'catering', label: 'Catering', isic: '5621', cnae: '56.21' },
      { id: 'retail-alim', label: 'Retail / Supermercados', isic: '4711', cnae: '47.11' },
      { id: 'colectividades', label: 'Colectividades y comedores', isic: '5629', cnae: '56.29' },
      { id: 'bares-cafeterias-alim', label: 'Bares y cafeterías', isic: '5630', cnae: '56.30' },
      { id: 'dark-kitchens', label: 'Dark kitchens / delivery', isic: '5610', cnae: '56.10' },
    ],
  },
  {
    id: 'profesional-alim',
    label: 'Profesional',
    short: 'PR',
    status: 'validated',
    isic: '74',
    cnae: '74',
    roles: [
      { id: 'chefs', label: 'Chefs', isic: '5610', cnae: '56.10' },
      { id: 'haccp', label: 'Auditores HACCP', isic: '7120', cnae: '71.20' },
      { id: 'nutricionistas', label: 'Nutricionistas', isic: '8690', cnae: '86.90' },
      { id: 'packaging', label: 'Packaging y envasado', isic: '1701', cnae: '17.21' },
      { id: 'tecnologos-alim', label: 'Tecnólogos de alimentos', isic: '7210', cnae: '72.19' },
      { id: 'sumilleres', label: 'Sumilleres', isic: '5630', cnae: '56.30' },
    ],
  },
]

// Transporte y logística anclado a CNAE-2025 / NACE Rev.2 Sección H
// (Transporte y almacenamiento): 49 terrestre, 50 marítimo, 51 aéreo,
// 52 almacenamiento y act. anexas, 53 postal/courier. Roles cross-section
// anclados a su código oficial real: seguros → 66.22 (corredores de
// seguros, Secc. K), inspección/peritaje → 71.20 (ensayos y análisis
// técnicos, Secc. M). Transitarios/agentes de aduanas → 52.29 (otras
// actividades anexas al transporte, organización del transporte de
// mercancías). IDs y labels preservados.
// TRANSPORTE — anclaje ISIC Rev.4 (ONU, vigente) sumado a CNAE-2025.
// ISIC primario: cross-border matching global. CNAE secundario: verificación
// KYC en registro oficial español. Status 'validated' a nivel CNAE; el
// anclaje ISIC está propuesto contra ISIC Rev.4 publicado por UN Statistics
// y requiere verificación final contra la tabla oficial Eurostat
// CN2025↔ISIC4 antes de blindar la correspondencia completa.
// Sección H de ISIC: Transportation and storage. Divisiones 49 (terrestre),
// 50 (acuático), 51 (aéreo), 52 (almacenamiento y soporte), 53 (postal).
// Asumimos 1503 = B2B → mercancías por defecto cuando hay ambigüedad
// pasaje/mercancía (ej. ferroviario → 4912 freight, no 4911 passengers).
const TRANSPORTE: ActorGroup[] = [
  {
    id: 'maritimo',
    label: 'Marítimo',
    short: 'MR',
    status: 'validated',
    isic: '50',
    cnae: '50',
    roles: [
      { id: 'navieras', label: 'Navieras', isic: '5012', cnae: '50.2' },
      { id: 'transitarios-mar', label: 'Transitarios marítimos', isic: '5229', cnae: '52.29' },
      { id: 'puertos', label: 'Puertos / terminales', isic: '5222', cnae: '52.22' },
      { id: 'estiba', label: 'Estiba y desestiba', isic: '5224', cnae: '52.24' },
      { id: 'consignatarios', label: 'Consignatarios de buques', isic: '5222', cnae: '52.22' },
      { id: 'practicos-remolque', label: 'Prácticos y remolcadores', isic: '5222', cnae: '52.22' },
    ],
  },
  {
    id: 'terrestre',
    label: 'Terrestre',
    short: 'TR',
    status: 'validated',
    isic: '49',
    cnae: '49',
    roles: [
      { id: 'transportistas', label: 'Transportistas por carretera', isic: '4923', cnae: '49.41' },
      { id: 'logistica-terrestre', label: 'Operadores logísticos', isic: '5229', cnae: '52.29' },
      { id: 'almacenes', label: 'Almacenes', isic: '5210', cnae: '52.10' },
      { id: 'ultima-milla', label: 'Última milla', isic: '5320', cnae: '53.20' },
      { id: 'ferroviario', label: 'Transporte ferroviario', isic: '4912', cnae: '49.20' },
      { id: 'cisternas-adr', label: 'Cisternas y graneles', isic: '4923', cnae: '49.41' },
      { id: 'transporte-frigorifico', label: 'Transporte frigorífico', isic: '4923', cnae: '49.41' },
    ],
  },
  {
    id: 'aereo',
    label: 'Aéreo',
    short: 'AE',
    status: 'validated',
    isic: '51',
    cnae: '51',
    roles: [
      { id: 'carga-aerea', label: 'Carga aérea', isic: '5120', cnae: '51.21' },
      { id: 'transitarios-aire', label: 'Transitarios aéreos', isic: '5229', cnae: '52.29' },
      { id: 'courier', label: 'Courier express', isic: '5320', cnae: '53.20' },
      { id: 'handling-aereo', label: 'Handling aeroportuario', isic: '5223', cnae: '52.23' },
    ],
  },
  {
    id: 'aduanas',
    label: 'Aduanas & Compliance',
    short: 'AD',
    status: 'validated',
    isic: '52',
    cnae: '52.29',
    roles: [
      { id: 'agentes-aduanas', label: 'Agentes aduaneros', isic: '5229', cnae: '52.29' },
      { id: 'despachantes', label: 'Despachantes', isic: '5229', cnae: '52.29' },
      { id: 'mercancias-peligrosas', label: 'Mercancías peligrosas (ADR)', isic: '5229', cnae: '52.29' },
      { id: 'seguros-transporte', label: 'Seguros de transporte', isic: '6622', cnae: '66.22' },
      { id: 'inspeccion-mercancia', label: 'Inspección y peritaje de mercancía', isic: '7120', cnae: '71.20' },
    ],
  },
]

const METALURGICO: ActorGroup[] = [
  {
    id: 'materia-prima',
    label: 'Materia prima',
    short: 'MP',
    status: 'validated',
    isic: '24',
    cnae: '24',
    roles: [
      { id: 'acerias', label: 'Acerías', isic: '2410', cnae: '24.10' },
      { id: 'aluminio', label: 'Aluminio', isic: '2420', cnae: '24.42' },
      { id: 'inoxidable', label: 'Inoxidable', isic: '2410', cnae: '24.10' },
      { id: 'no-ferricos', label: 'No férricos (Cu, Zn, Pb)', isic: '2420', cnae: '24.44' },
      { id: 'chatarra-reciclaje', label: 'Chatarra y reciclaje metálico', isic: '3830', cnae: '38.32' },
      { id: 'ferroaleaciones', label: 'Ferroaleaciones', isic: '2410', cnae: '24.10' },
    ],
  },
  {
    id: 'transformacion',
    label: 'Transformación',
    short: 'TR',
    status: 'validated',
    isic: '25',
    cnae: '25',
    roles: [
      { id: 'mecanizado', label: 'Mecanizado CNC', isic: '2592', cnae: '25.62' },
      { id: 'soldadura', label: 'Soldadura certificada', isic: '2592', cnae: '25.62' },
      { id: 'calderería', label: 'Calderería', isic: '2513', cnae: '25.30' },
      { id: 'fundicion', label: 'Fundición', isic: '2431', cnae: '24.5' },
      { id: 'estampacion', label: 'Estampación', isic: '2591', cnae: '25.50' },
      { id: 'corte-laser', label: 'Corte láser / plasma / agua', isic: '2592', cnae: '25.62' },
      { id: 'plegado-conformado', label: 'Plegado y conformado', isic: '2591', cnae: '25.50' },
      { id: 'forja', label: 'Forja', isic: '2591', cnae: '25.50' },
    ],
  },
  {
    id: 'tratamientos',
    label: 'Tratamientos',
    short: 'TT',
    status: 'validated',
    isic: '25',
    cnae: '25.61',
    roles: [
      { id: 'termicos', label: 'Tratamientos térmicos', isic: '2592', cnae: '25.61' },
      { id: 'galvanizado', label: 'Galvanizado', isic: '2592', cnae: '25.61' },
      { id: 'pintura-industrial', label: 'Pintura industrial', isic: '2592', cnae: '25.61' },
      { id: 'mecanizado-fino', label: 'Acabados de precisión', isic: '2592', cnae: '25.62' },
      { id: 'anodizado', label: 'Anodizado', isic: '2592', cnae: '25.61' },
      { id: 'tratamiento-superficie', label: 'Tratamientos de superficie', isic: '2592', cnae: '25.61' },
    ],
  },
  {
    id: 'fabricacion-maquinaria',
    label: 'Maquinaria y bienes de equipo',
    short: 'MQ',
    status: 'validated',
    isic: '28',
    cnae: '28',
    roles: [
      { id: 'maquinaria-industrial', label: 'Maquinaria industrial', isic: '2829', cnae: '28.9' },
      { id: 'bienes-equipo', label: 'Bienes de equipo a medida', isic: '2829', cnae: '28.99' },
      { id: 'estructuras-metalicas', label: 'Estructuras metálicas', isic: '2511', cnae: '25.11' },
      { id: 'productos-metalicos', label: 'Productos metálicos', isic: '2599', cnae: '25.9' },
      { id: 'utillaje-moldes', label: 'Utillaje, moldes y matricería', isic: '2593', cnae: '25.73' },
    ],
  },
  {
    id: 'aplicacion',
    label: 'Aplicación industrial',
    short: 'AI',
    status: 'validated',
    isic: '25',
    cnae: '25.9',
    roles: [
      { id: 'naval', label: 'Naval', isic: '3011', cnae: '30.11' },
      { id: 'energia-met', label: 'Energía / off-shore', isic: '2511', cnae: '25.21' },
      { id: 'industrial', label: 'Industria pesada', isic: '2599', cnae: '25.9' },
      { id: 'arquitectura-met', label: 'Arquitectura metálica', isic: '2511', cnae: '25.12' },
      { id: 'aeronautico-met', label: 'Aeronáutico', isic: '3030', cnae: '30.30' },
      { id: 'automocion-met', label: 'Automoción', isic: '2930', cnae: '29.32' },
    ],
  },
]

const ENERGIA: ActorGroup[] = [
  {
    id: 'fabricacion-energia',
    label: 'Fabricación de equipo energético',
    short: 'FE',
    status: 'validated',
    isic: '27',
    cnae: '27',
    roles: [
      { id: 'fab-paneles-solares', label: 'Fabricantes de paneles solares', isic: '2710', cnae: '27.11' },
      { id: 'fab-aerogeneradores', label: 'Fabricantes de aerogeneradores', isic: '2811', cnae: '28.11' },
      { id: 'fab-inversores', label: 'Fabricantes de inversores y electrónica de potencia', isic: '2710', cnae: '27.11' },
      { id: 'fab-baterias', label: 'Fabricantes de baterías y acumuladores', isic: '2720', cnae: '27.20' },
      { id: 'fab-cableado', label: 'Fabricantes de cableado y componentes eléctricos', isic: '2732', cnae: '27.3' },
      { id: 'fab-electrolizadores', label: 'Fabricantes de electrolizadores e hidrógeno', isic: '2819', cnae: '28.29' },
    ],
  },
  {
    id: 'generacion',
    label: 'Generación',
    short: 'GE',
    status: 'validated',
    isic: '35',
    cnae: '35.11',
    roles: [
      { id: 'solar', label: 'Solar fotovoltaica', isic: '3510', cnae: '35.11' },
      { id: 'eolica', label: 'Eólica', isic: '3510', cnae: '35.11' },
      { id: 'hidrogeno', label: 'Hidrógeno verde', isic: '3510', cnae: '35.21' },
      { id: 'biomasa', label: 'Biomasa / cogeneración', isic: '3510', cnae: '35.11' },
      { id: 'hidraulica', label: 'Hidráulica / minihidráulica', isic: '3510', cnae: '35.11' },
      { id: 'solar-termica', label: 'Solar térmica', isic: '3510', cnae: '35.11' },
      { id: 'geotermia', label: 'Geotermia', isic: '3510', cnae: '35.11' },
    ],
  },
  {
    id: 'redes-distribucion',
    label: 'Redes y distribución',
    short: 'RD',
    status: 'validated',
    isic: '35',
    cnae: '35.1',
    roles: [
      { id: 'red-transporte', label: 'Red de transporte (alta tensión)', isic: '3510', cnae: '35.12' },
      { id: 'distribuidoras-electricas', label: 'Distribuidoras eléctricas', isic: '3510', cnae: '35.13' },
      { id: 'redes-gas', label: 'Redes y distribución de gas', isic: '3520', cnae: '35.22' },
      { id: 'operador-sistema', label: 'Operador del sistema y gestión de red', isic: '3510', cnae: '35.12' },
    ],
  },
  {
    id: 'almacenamiento',
    label: 'Almacenamiento',
    short: 'AL',
    status: 'validated',
    isic: '27',
    cnae: '27.20',
    roles: [
      { id: 'baterias-bess', label: 'Baterías / BESS', isic: '2720', cnae: '27.20' },
      { id: 'ups', label: 'UPS / SAI', isic: '2720', cnae: '27.20' },
      { id: 'gestion-energia', label: 'Gestión / SCADA', isic: '6201', cnae: '62.01' },
      { id: 'hidrogeno-almacen', label: 'Almacenamiento de hidrógeno', isic: '2819', cnae: '28.29' },
    ],
  },
  {
    id: 'instalacion-ene',
    label: 'Instalación',
    short: 'IN',
    status: 'validated',
    isic: '43',
    cnae: '43.22',
    roles: [
      { id: 'instaladores-rite', label: 'Instaladores RITE', isic: '4322', cnae: '43.22' },
      { id: 'electricos-ene', label: 'Eléctricos industriales', isic: '4321', cnae: '43.21' },
      { id: 'climatizacion-ene', label: 'Climatización / aerotermia', isic: '4322', cnae: '43.22' },
      { id: 'autoconsumo', label: 'Instaladores de autoconsumo', isic: '4321', cnae: '43.21' },
      { id: 'mantenimiento-ene', label: 'O&M / mantenimiento de plantas', isic: '3313', cnae: '33.14' },
    ],
  },
  {
    id: 'comercializacion',
    label: 'Comercialización',
    short: 'CM',
    status: 'validated',
    isic: '35',
    cnae: '35.14',
    roles: [
      { id: 'comercializadoras', label: 'Comercializadoras', isic: '3510', cnae: '35.14' },
      { id: 'esco', label: 'ESCO / servicios energéticos', isic: '3530', cnae: '35.30' },
      { id: 'auditores-ene', label: 'Auditores energéticos', isic: '7120', cnae: '71.20' },
      { id: 'agregadores', label: 'Agregadores de demanda', isic: '3510', cnae: '35.14' },
      { id: 'trading-energia', label: 'Trading de energía', isic: '3510', cnae: '35.14' },
    ],
  },
]

const TECNOLOGIA: ActorGroup[] = [
  {
    id: 'software',
    label: 'Software',
    short: 'SW',
    status: 'validated',
    isic: '62',
    cnae: '62',
    roles: [
      { id: 'erp', label: 'ERP / CRM / BI', isic: '6201', cnae: '62.01' },
      { id: 'isv', label: 'ISVs / SaaS', isic: '5820', cnae: '58.29' },
      { id: 'desarrollo-medida', label: 'Desarrollo a medida', isic: '6201', cnae: '62.01' },
      { id: 'ia-datos', label: 'IA & Data', isic: '6201', cnae: '62.01' },
      { id: 'movil-apps', label: 'Desarrollo móvil', isic: '6201', cnae: '62.01' },
      { id: 'blockchain-web3', label: 'Blockchain / Web3', isic: '6201', cnae: '62.01' },
    ],
  },
  {
    id: 'infraestructura',
    label: 'Infraestructura',
    short: 'IF',
    status: 'validated',
    isic: '63',
    cnae: '63.11',
    roles: [
      { id: 'cloud', label: 'Cloud / hosting', isic: '6311', cnae: '63.11' },
      { id: 'hardware-tec', label: 'Hardware empresarial', isic: '4651', cnae: '46.51' },
      { id: 'redes', label: 'Redes y comunicaciones', isic: '6110', cnae: '61.10' },
      { id: 'iot', label: 'IoT industrial', isic: '2630', cnae: '26.30' },
      { id: 'datacenter', label: 'Datacenter / colocation', isic: '6311', cnae: '63.11' },
    ],
  },
  {
    id: 'ciberseguridad',
    label: 'Ciberseguridad',
    short: 'CS',
    status: 'validated',
    isic: '62',
    cnae: '62.02',
    roles: [
      { id: 'soc', label: 'SOC / MSSP', isic: '6202', cnae: '62.02' },
      { id: 'pentest', label: 'Pentesting / red team', isic: '6202', cnae: '62.02' },
      { id: 'compliance-tec', label: 'Compliance & GRC', isic: '6202', cnae: '62.02' },
      { id: 'forense', label: 'Forense e incident response', isic: '6202', cnae: '62.02' },
      { id: 'identidad', label: 'Gestión de identidad (IAM)', isic: '6202', cnae: '62.02' },
    ],
  },
  {
    id: 'profesional-tec',
    label: 'Profesional',
    short: 'PR',
    status: 'validated',
    isic: '62',
    cnae: '62.02',
    roles: [
      { id: 'consultores-tec', label: 'Consultores IT', isic: '6202', cnae: '62.02' },
      { id: 'devs', label: 'Desarrolladores', isic: '6201', cnae: '62.01' },
      { id: 'arquitectos-cloud', label: 'Arquitectos cloud', isic: '6202', cnae: '62.02' },
      { id: 'integradores-tec', label: 'Integradores', isic: '6209', cnae: '62.09' },
      { id: 'datos-analytics', label: 'Data engineers / analistas', isic: '6201', cnae: '62.01' },
      { id: 'ux-ui', label: 'Diseño UX/UI', isic: '7410', cnae: '74.10' },
    ],
  },
  {
    id: 'telecomunicaciones',
    label: 'Telecomunicaciones',
    short: 'TL',
    status: 'validated',
    isic: '61',
    cnae: '61',
    roles: [
      { id: 'operadores-telecom', label: 'Operadores de telecomunicaciones', isic: '6110', cnae: '61.10' },
      { id: 'isp', label: 'Proveedores de internet (ISP)', isic: '6110', cnae: '61.10' },
      { id: 'telefonia-movil', label: 'Telefonía móvil', isic: '6120', cnae: '61.20' },
      { id: 'satelite', label: 'Comunicaciones por satélite', isic: '6130', cnae: '61.30' },
      { id: 'infraestructura-telecom', label: 'Infraestructura y torres de telecom', isic: '6110', cnae: '61.10' },
    ],
  },
]

const TURISMO: ActorGroup[] = [
  {
    id: 'alojamiento',
    label: 'Alojamiento',
    short: 'AL',
    status: 'validated',
    isic: '55',
    cnae: '55',
    roles: [
      { id: 'hoteles-tur', label: 'Hoteles', isic: '5510', cnae: '55.10' },
      { id: 'apartamentos-tur', label: 'Apartamentos turísticos', isic: '5520', cnae: '55.20' },
      { id: 'rurales', label: 'Rurales / boutique', isic: '5520', cnae: '55.20' },
      { id: 'campings', label: 'Campings', isic: '5520', cnae: '55.30' },
      { id: 'hostels', label: 'Hostels y albergues', isic: '5520', cnae: '55.20' },
      { id: 'resorts', label: 'Resorts y balnearios', isic: '5510', cnae: '55.10' },
    ],
  },
  {
    id: 'restauracion-tur',
    label: 'Restauración',
    short: 'RS',
    status: 'validated',
    isic: '56',
    cnae: '56',
    roles: [
      { id: 'restaurantes-tur', label: 'Restaurantes', isic: '5610', cnae: '56.10' },
      { id: 'catering-tur', label: 'Catering eventos', isic: '5621', cnae: '56.21' },
      { id: 'bares-cafeterias', label: 'Bares y cafeterías', isic: '5630', cnae: '56.30' },
      { id: 'chiringuitos', label: 'Chiringuitos y temporada', isic: '5630', cnae: '56.30' },
    ],
  },
  {
    id: 'distribucion-tur',
    label: 'Distribución',
    short: 'DS',
    status: 'validated',
    isic: '79',
    cnae: '79',
    roles: [
      { id: 'agencias-mayoristas', label: 'Agencias mayoristas', isic: '7912', cnae: '79.12' },
      { id: 'dmc', label: 'DMC receptivos', isic: '7990', cnae: '79.90' },
      { id: 'tour-operadores', label: 'Tour operadores', isic: '7912', cnae: '79.12' },
      { id: 'plataformas-tur', label: 'Plataformas online', isic: '7990', cnae: '79.90' },
      { id: 'agencias-minoristas', label: 'Agencias minoristas', isic: '7911', cnae: '79.11' },
    ],
  },
  {
    id: 'experiencias',
    label: 'Experiencias & eventos',
    short: 'EX',
    status: 'validated',
    isic: '82',
    cnae: '82.30',
    roles: [
      { id: 'mice', label: 'MICE / corporativo', isic: '8230', cnae: '82.30' },
      { id: 'guias', label: 'Guías oficiales', isic: '7990', cnae: '79.90' },
      { id: 'transporte-tur', label: 'Transporte pasajeros', isic: '4922', cnae: '49.39' },
      { id: 'ocio', label: 'Ocio y entradas', isic: '7990', cnae: '79.90' },
      { id: 'turismo-activo', label: 'Turismo activo / aventura', isic: '9319', cnae: '93.19' },
      { id: 'wedding-planners', label: 'Organización de bodas y eventos', isic: '8230', cnae: '82.30' },
    ],
  },
]

const LEGAL: ActorGroup[] = [
  {
    id: 'demanda-legal',
    label: 'Demanda de servicios',
    short: 'DM',
    status: 'validated',
    isic: '69',
    cnae: '69',
    roles: [
      { id: 'empresas-litigio', label: 'Empresas con litigios', isic: '6910', cnae: '69.10' },
      { id: 'startups-legal', label: 'Startups y rondas', isic: '6910', cnae: '69.10' },
      { id: 'particulares-legal', label: 'Particulares', isic: '6910', cnae: '69.10' },
      { id: 'fondos-legal', label: 'Fondos y M&A', isic: '6499', cnae: '64.99' },
      { id: 'admin-publica', label: 'Administración pública', isic: '8411', cnae: '84.11' },
      { id: 'aseguradoras-legal', label: 'Aseguradoras', isic: '6512', cnae: '65.12' },
    ],
  },
  {
    id: 'profesional-legal',
    label: 'Profesionales jurídicos',
    short: 'PR',
    status: 'validated',
    isic: '69',
    cnae: '69.1',
    roles: [
      { id: 'abogados', label: 'Abogados colegiados', isic: '6910', cnae: '69.10' },
      { id: 'procuradores', label: 'Procuradores', isic: '6910', cnae: '69.10' },
      { id: 'notarios', label: 'Notarios', isic: '6910', cnae: '69.10' },
      { id: 'registradores', label: 'Registradores', isic: '6910', cnae: '69.10' },
      { id: 'peritos-jud', label: 'Peritos judiciales', isic: '6910', cnae: '69.10' },
      { id: 'mediadores', label: 'Mediadores', isic: '6910', cnae: '69.10' },
      { id: 'graduados-sociales', label: 'Graduados sociales', isic: '6910', cnae: '69.10' },
      { id: 'administradores-concursales', label: 'Administradores concursales', isic: '6910', cnae: '69.10' },
    ],
  },
  {
    id: 'bufetes-legaltech',
    label: 'Bufetes y legaltech',
    short: 'BF',
    status: 'validated',
    isic: '69',
    cnae: '69.1',
    roles: [
      { id: 'bufetes', label: 'Bufetes y despachos', isic: '6910', cnae: '69.10' },
      { id: 'compliance', label: 'Consultoras compliance', isic: '7020', cnae: '70.22' },
      { id: 'patentes', label: 'Agencias de patentes', isic: '6910', cnae: '69.10' },
      { id: 'legaltech', label: 'Software legaltech', isic: '6201', cnae: '62.01' },
      { id: 'firma-elec', label: 'Firma electrónica', isic: '6311', cnae: '63.11' },
      { id: 'gestorias', label: 'Gestorías administrativas', isic: '6920', cnae: '69.20' },
    ],
  },
  {
    id: 'especialidades-legal',
    label: 'Áreas de práctica',
    short: 'ES',
    status: 'validated',
    isic: '69',
    cnae: '69.10',
    roles: [
      { id: 'mercantil', label: 'Mercantil y societario', isic: '6910', cnae: '69.10' },
      { id: 'fiscal', label: 'Fiscal y tributario', isic: '6910', cnae: '69.10' },
      { id: 'laboral', label: 'Laboral', isic: '6910', cnae: '69.10' },
      { id: 'penal', label: 'Penal', isic: '6910', cnae: '69.10' },
      { id: 'pi', label: 'Propiedad intelectual', isic: '6910', cnae: '69.10' },
      { id: 'urbanismo-legal', label: 'Inmobiliario y urbanismo', isic: '6910', cnae: '69.10' },
      { id: 'civil-familia', label: 'Civil y familia', isic: '6910', cnae: '69.10' },
      { id: 'administrativo', label: 'Administrativo', isic: '6910', cnae: '69.10' },
      { id: 'datos-privacidad', label: 'Protección de datos', isic: '6910', cnae: '69.10' },
    ],
  },
]

const TEXTIL: ActorGroup[] = [
  {
    id: 'demanda-textil',
    label: 'Demanda de producto',
    short: 'DM',
    status: 'validated',
    isic: '14',
    cnae: '14',
    roles: [
      { id: 'marcas-moda', label: 'Marcas de moda', isic: '1410', cnae: '14.13' },
      { id: 'retail-textil', label: 'Retail y grandes superficies', isic: '4771', cnae: '47.71' },
      { id: 'hosteleria-textil', label: 'Hostelería y hoteles', isic: '1392', cnae: '13.92' },
      { id: 'sanitario-textil', label: 'Sanitario y EPI', isic: '1399', cnae: '13.92' },
      { id: 'industrial-textil', label: 'Industrial y técnico', isic: '1399', cnae: '13.96' },
      { id: 'uniformes-corporativo', label: 'Uniformes y vestuario corporativo', isic: '1410', cnae: '14.12' },
    ],
  },
  {
    id: 'profesional-textil',
    label: 'Profesionales textiles',
    short: 'PR',
    status: 'validated',
    isic: '14',
    cnae: '14',
    roles: [
      { id: 'patronistas', label: 'Patronistas', isic: '7410', cnae: '74.10' },
      { id: 'modistas', label: 'Modistas y costureras', isic: '1410', cnae: '14.13' },
      { id: 'disenadores-moda', label: 'Diseñadores de moda', isic: '7410', cnae: '74.10' },
      { id: 'tecnicos-textil', label: 'Técnicos textiles', isic: '1311', cnae: '13.10' },
      { id: 'estilistas', label: 'Estilistas y compradores', isic: '7410', cnae: '74.10' },
      { id: 'escaladores', label: 'Escaladores / industrialización', isic: '1391', cnae: '13.91' },
    ],
  },
  {
    id: 'fabricantes-textil',
    label: 'Fabricación',
    short: 'FB',
    status: 'validated',
    isic: '13',
    cnae: '13',
    roles: [
      { id: 'hilanderias', label: 'Hilanderías', isic: '1311', cnae: '13.10' },
      { id: 'tejedurias', label: 'Tejedurías plano y punto', isic: '1312', cnae: '13.20' },
      { id: 'confeccion', label: 'Talleres de confección', isic: '1410', cnae: '14.13' },
      { id: 'estampacion', label: 'Estampación y tintura', isic: '1313', cnae: '13.30' },
      { id: 'acabados-textil', label: 'Acabados', isic: '1313', cnae: '13.30' },
      { id: 'genero-punto', label: 'Género de punto', isic: '1391', cnae: '13.91' },
      { id: 'no-tejidos', label: 'No tejidos / técnicos', isic: '1399', cnae: '13.95' },
    ],
  },
  {
    id: 'cuero-calzado',
    label: 'Cuero y calzado',
    short: 'CC',
    status: 'validated',
    isic: '15',
    cnae: '15',
    roles: [
      { id: 'curtidos', label: 'Curtidos y preparación del cuero', isic: '1511', cnae: '15.11' },
      { id: 'calzado', label: 'Fabricación de calzado', isic: '1520', cnae: '15.20' },
      { id: 'marroquineria', label: 'Marroquinería y artículos de cuero', isic: '1512', cnae: '15.12' },
    ],
  },
  {
    id: 'auxiliar-textil',
    label: 'Auxiliar y servicios',
    short: 'AX',
    status: 'validated',
    isic: '13',
    cnae: '13.99',
    roles: [
      { id: 'avios', label: 'Avíos y mercería', isic: '4641', cnae: '46.41' },
      { id: 'etiquetado', label: 'Etiquetado y marcado', isic: '1399', cnae: '13.99' },
      { id: 'lavanderia-ind', label: 'Lavandería industrial', isic: '9601', cnae: '96.01' },
      { id: 'logistica-textil', label: 'Logística y almacenaje', isic: '5210', cnae: '52.10' },
      { id: 'certificacion', label: 'Certificación GOTS / OEKO-TEX', isic: '7120', cnae: '71.20' },
      { id: 'maquinaria-textil', label: 'Maquinaria textil', isic: '2826', cnae: '28.94' },
    ],
  },
]

// Cultura, ocio y deporte anclado a CNAE-2025 Sección R (actividades
// artísticas, recreativas y de entretenimiento — div. 90/91/93). La
// producción audiovisual cruza a Sección J (div. 59).
const CULTURA: ActorGroup[] = [
  {
    id: 'creacion-produccion',
    label: 'Creación y producción',
    short: 'CP',
    status: 'validated',
    isic: '90',
    cnae: '90',
    roles: [
      { id: 'productoras-audiovisual', label: 'Productoras audiovisuales', isic: '5911', cnae: '59.1' },
      { id: 'productoras-musicales', label: 'Productoras y sellos musicales', isic: '5920', cnae: '59.2' },
      { id: 'companias-escenicas', label: 'Compañías de artes escénicas', isic: '9000', cnae: '90.0' },
      { id: 'artistas-creadores', label: 'Artistas y creadores', isic: '9000', cnae: '90.0' },
      { id: 'estudios-diseno', label: 'Estudios de diseño y creativos', isic: '7410', cnae: '74.10' },
      { id: 'editoriales-cul', label: 'Editoriales', isic: '5811', cnae: '58.11' },
    ],
  },
  {
    id: 'patrimonio-exhibicion',
    label: 'Patrimonio y exhibición',
    short: 'PE',
    status: 'validated',
    isic: '91',
    cnae: '91',
    roles: [
      { id: 'museos-galerias', label: 'Museos y galerías', isic: '9102', cnae: '91.02' },
      { id: 'bibliotecas-archivos', label: 'Bibliotecas y archivos', isic: '9101', cnae: '91.01' },
      { id: 'gestion-patrimonio', label: 'Gestión de patrimonio', isic: '9103', cnae: '91.03' },
      { id: 'salas-exposicion', label: 'Salas de exposición', isic: '9102', cnae: '91.02' },
    ],
  },
  {
    id: 'ocio-entretenimiento',
    label: 'Ocio y entretenimiento',
    short: 'OE',
    status: 'validated',
    isic: '93',
    cnae: '93',
    roles: [
      { id: 'salas-espectaculos', label: 'Salas y recintos de espectáculos', isic: '9000', cnae: '90.04' },
      { id: 'organizacion-eventos-cul', label: 'Organización de eventos y festivales', isic: '8230', cnae: '82.30' },
      { id: 'parques-ocio', label: 'Parques de ocio y atracciones', isic: '9321', cnae: '93.21' },
      { id: 'tecnica-espectaculo', label: 'Servicios técnicos de espectáculo', isic: '9000', cnae: '90.02' },
    ],
  },
  {
    id: 'deporte',
    label: 'Deporte',
    short: 'DP',
    status: 'validated',
    isic: '93',
    cnae: '93.1',
    roles: [
      { id: 'clubes-deportivos', label: 'Clubes y entidades deportivas', isic: '9312', cnae: '93.12' },
      { id: 'instalaciones-deportivas', label: 'Gestión de instalaciones deportivas', isic: '9311', cnae: '93.11' },
      { id: 'tecnificacion', label: 'Tecnificación y formación deportiva', isic: '8551', cnae: '85.51' },
      { id: 'eventos-deportivos', label: 'Organización de eventos deportivos', isic: '9319', cnae: '93.19' },
    ],
  },
]

// Administración pública anclada a CNAE-2025 Sección O (Administración
// Pública y defensa; Seguridad Social obligatoria — div. 84). Los
// proveedores adjudicatarios pertenecen a sus propias secciones; aquí se
// agrupan por su relación con la contratación pública.
const INSTITUCIONAL: ActorGroup[] = [
  {
    id: 'entidades-publicas',
    label: 'Entidades públicas',
    short: 'EP',
    status: 'validated',
    isic: '84',
    cnae: '84.1',
    roles: [
      { id: 'admin-central', label: 'Administración central del Estado', isic: '8411', cnae: '84.11' },
      { id: 'admin-autonomica', label: 'Administración autonómica', isic: '8411', cnae: '84.11' },
      { id: 'admin-local', label: 'Administración local y ayuntamientos', isic: '8411', cnae: '84.11' },
      { id: 'organismos-agencias', label: 'Organismos y agencias públicas', isic: '8411', cnae: '84.11' },
      { id: 'empresas-publicas', label: 'Empresas y entes públicos', isic: '8411', cnae: '84.11' },
    ],
  },
  {
    id: 'seguridad-defensa',
    label: 'Seguridad y defensa',
    short: 'SD',
    status: 'validated',
    isic: '84',
    cnae: '84.2',
    roles: [
      { id: 'fuerzas-seguridad', label: 'Fuerzas y cuerpos de seguridad', isic: '8423', cnae: '84.24' },
      { id: 'defensa', label: 'Defensa', isic: '8422', cnae: '84.22' },
      { id: 'proteccion-civil', label: 'Protección civil y emergencias', isic: '8423', cnae: '84.25' },
    ],
  },
  {
    id: 'contratacion-publica',
    label: 'Contratación pública',
    short: 'CP',
    status: 'validated',
    isic: '84',
    cnae: '84.11',
    roles: [
      { id: 'empresas-adjudicatarias', label: 'Empresas adjudicatarias', isic: '8411', cnae: '84.11' },
      { id: 'consultoras-sector-publico', label: 'Consultoras de contratación pública', isic: '7020', cnae: '70.22' },
      { id: 'plataformas-licitacion', label: 'Plataformas de licitación electrónica', isic: '6311', cnae: '63.11' },
    ],
  },
]

// Educación y formación anclada a CNAE-2025 Sección P (Educación — div.
// 85). La edtech cruza a Sección J (programación y edición).
const EDUCACION: ActorGroup[] = [
  {
    id: 'centros-educativos',
    label: 'Centros educativos',
    short: 'CE',
    status: 'validated',
    isic: '85',
    cnae: '85',
    roles: [
      { id: 'infantil-primaria', label: 'Educación infantil y primaria', isic: '8510', cnae: '85.1' },
      { id: 'secundaria', label: 'Educación secundaria', isic: '8521', cnae: '85.3' },
      { id: 'centros-concertados', label: 'Centros concertados y privados', isic: '8510', cnae: '85.10' },
      { id: 'educacion-especial', label: 'Educación especial', isic: '8510', cnae: '85.10' },
    ],
  },
  {
    id: 'formacion-superior',
    label: 'Formación profesional y superior',
    short: 'FS',
    status: 'validated',
    isic: '85',
    cnae: '85.4',
    roles: [
      { id: 'formacion-profesional', label: 'Formación profesional', isic: '8522', cnae: '85.32' },
      { id: 'universidades', label: 'Universidades', isic: '8530', cnae: '85.42' },
      { id: 'escuelas-negocio', label: 'Escuelas de negocio', isic: '8530', cnae: '85.42' },
      { id: 'centros-idiomas', label: 'Centros de idiomas', isic: '8549', cnae: '85.59' },
    ],
  },
  {
    id: 'formacion-continua',
    label: 'Formación continua y edtech',
    short: 'FC',
    status: 'validated',
    isic: '85',
    cnae: '85.5',
    roles: [
      { id: 'academias', label: 'Academias y formación continua', isic: '8549', cnae: '85.59' },
      { id: 'formacion-empresa', label: 'Formación a empresas y bonificada', isic: '8549', cnae: '85.59' },
      { id: 'edtech', label: 'Plataformas edtech y e-learning', isic: '8549', cnae: '85.59' },
      { id: 'contenido-formativo', label: 'Editoriales y contenido formativo', isic: '5811', cnae: '58.11' },
    ],
  },
  {
    id: 'servicios-educativos',
    label: 'Servicios educativos',
    short: 'SV',
    status: 'validated',
    isic: '85',
    cnae: '85.6',
    roles: [
      { id: 'orientacion', label: 'Orientación y apoyo educativo', isic: '8550', cnae: '85.60' },
      { id: 'extraescolares', label: 'Actividades extraescolares', isic: '8549', cnae: '85.59' },
      { id: 'equipamiento-educativo', label: 'Equipamiento y material escolar', isic: '4649', cnae: '46.49' },
    ],
  },
]

// Agua y medioambiente anclado a CNAE-2025 Sección E (suministro de agua,
// saneamiento, gestión de residuos y descontaminación — div. 36/37/38/39).
// La consultoría e ingeniería ambiental cruzan a Sección M.
const MEDIOAMBIENTE: ActorGroup[] = [
  {
    id: 'ciclo-agua',
    label: 'Ciclo del agua',
    short: 'CA',
    status: 'validated',
    isic: '36',
    cnae: '36',
    roles: [
      { id: 'captacion-potabilizacion', label: 'Captación y potabilización', isic: '3600', cnae: '36.00' },
      { id: 'distribucion-agua', label: 'Distribución de agua', isic: '3600', cnae: '36.00' },
      { id: 'depuracion', label: 'Depuración de aguas residuales', isic: '3700', cnae: '37.00' },
      { id: 'redes-saneamiento', label: 'Redes de saneamiento', isic: '3700', cnae: '37.00' },
    ],
  },
  {
    id: 'residuos-reciclaje',
    label: 'Residuos y reciclaje',
    short: 'RR',
    status: 'validated',
    isic: '38',
    cnae: '38',
    roles: [
      { id: 'recogida-residuos', label: 'Recogida de residuos', isic: '3811', cnae: '38.1' },
      { id: 'tratamiento-residuos', label: 'Plantas de tratamiento', isic: '3821', cnae: '38.2' },
      { id: 'residuos-peligrosos', label: 'Gestión de residuos peligrosos', isic: '3822', cnae: '38.22' },
      { id: 'reciclaje-valorizacion', label: 'Reciclaje y valorización', isic: '3830', cnae: '38.3' },
    ],
  },
  {
    id: 'servicios-ambientales',
    label: 'Servicios ambientales',
    short: 'SA',
    status: 'validated',
    isic: '39',
    cnae: '39',
    roles: [
      { id: 'descontaminacion', label: 'Descontaminación y remediación', isic: '3900', cnae: '39.00' },
      { id: 'consultoria-ambiental', label: 'Consultoría ambiental', isic: '7490', cnae: '74.90' },
      { id: 'ingenieria-ambiental', label: 'Ingeniería y auditoría ambiental', isic: '7110', cnae: '71.12' },
      { id: 'economia-circular', label: 'Economía circular y simbiosis industrial', isic: '3830', cnae: '38.32' },
    ],
  },
]

// Servicios auxiliares anclado a CNAE-2025 Sección N (actividades
// administrativas y servicios auxiliares — div. 77/78/80/81/82). Las
// agencias de viajes (div. 79) viven en el sector Turismo.
const SERVICIOS_AUXILIARES: ActorGroup[] = [
  {
    id: 'servicios-edificios',
    label: 'Servicios a edificios',
    short: 'SE',
    status: 'validated',
    isic: '81',
    cnae: '81',
    roles: [
      { id: 'limpieza', label: 'Limpieza profesional', isic: '8121', cnae: '81.2' },
      { id: 'mantenimiento-fm', label: 'Mantenimiento integral / facility', isic: '8110', cnae: '81.10' },
      { id: 'jardineria', label: 'Jardinería y zonas verdes', isic: '8130', cnae: '81.30' },
      { id: 'control-plagas', label: 'Control de plagas', isic: '8129', cnae: '81.29' },
    ],
  },
  {
    id: 'seguridad-aux',
    label: 'Seguridad',
    short: 'SG',
    status: 'validated',
    isic: '80',
    cnae: '80',
    roles: [
      { id: 'vigilancia', label: 'Vigilancia y seguridad privada', isic: '8010', cnae: '80.10' },
      { id: 'sistemas-seguridad', label: 'Sistemas de seguridad y CRA', isic: '8020', cnae: '80.20' },
      { id: 'investigacion-priv', label: 'Investigación privada', isic: '8030', cnae: '80.30' },
    ],
  },
  {
    id: 'empleo-personal',
    label: 'Empleo y personal',
    short: 'EM',
    status: 'validated',
    isic: '78',
    cnae: '78',
    roles: [
      { id: 'ett', label: 'Empresas de trabajo temporal', isic: '7820', cnae: '78.20' },
      { id: 'seleccion-personal', label: 'Selección de personal', isic: '7810', cnae: '78.10' },
      { id: 'externalizacion', label: 'Externalización de servicios', isic: '7830', cnae: '78.30' },
    ],
  },
  {
    id: 'alquiler-soporte',
    label: 'Alquiler y soporte',
    short: 'AS',
    status: 'validated',
    isic: '77',
    cnae: '77',
    roles: [
      { id: 'alquiler-maquinaria', label: 'Alquiler de maquinaria y equipos', isic: '7730', cnae: '77.3' },
      { id: 'alquiler-vehiculos', label: 'Alquiler de vehículos', isic: '7710', cnae: '77.1' },
      { id: 'servicios-oficina', label: 'Servicios administrativos de oficina', isic: '8211', cnae: '82.1' },
      { id: 'call-centers', label: 'Call centers y atención al cliente', isic: '8220', cnae: '82.20' },
    ],
  },
]

// FINANCIERO — sector 17, añadido 2026-05-23 tarde como SECTOR TRANSVERSAL.
// Cubre la Sección K completa de ISIC Rev.4 (Financial and insurance
// activities): banca comercial + trade finance + inversión + seguros +
// servicios auxiliares + banca cripto-friendly.
// Es la espina dorsal financiera del marketplace — todos los sectores
// conectan con FINANCIERO (préstamos, líneas, documentarios, seguros,
// inversión). Ver memoria project_1503_sector_financiero para el
// roadmap de 5 fases con XRPL (liquidación RLUSD) + XDC (smart contracts trade finance,
// ISO 20022 nativo).
// Status 'draft' a nivel sector: el anclaje ISIC Rev.4 está propuesto y
// requiere verificación final contra Eurostat CN2025↔ISIC4 antes de pasar
// a 'validated'. CNAE-2025 ES = vista nacional (Sección K).
const FINANCIERO: ActorGroup[] = [
  {
    id: 'banca-comercial',
    label: 'Banca comercial',
    short: 'BC',
    isic: '6419',
    cnae: '64.19',
    roles: [
      { id: 'banca-comercial-nacional', label: 'Banca comercial nacional', isic: '6419', cnae: '64.19' },
      { id: 'banca-comercial-internacional', label: 'Banca comercial internacional', isic: '6419', cnae: '64.19' },
      { id: 'banca-privada', label: 'Banca privada / wealth management', isic: '6419', cnae: '64.19' },
      { id: 'cooperativas-credito', label: 'Cooperativas de crédito', isic: '6419', cnae: '64.19' },
      { id: 'banca-digital', label: 'Banca digital / neobancos', isic: '6419', cnae: '64.19' },
    ],
  },
  {
    id: 'trade-finance',
    label: 'Trade finance',
    short: 'TF',
    isic: '6419',
    cnae: '64.19',
    roles: [
      { id: 'credito-documentario', label: 'Crédito documentario (LC)', isic: '6419', cnae: '64.19' },
      { id: 'factoring-confirming', label: 'Factoring / Confirming', isic: '6499', cnae: '64.99' },
      { id: 'forfaiting', label: 'Forfaiting', isic: '6499', cnae: '64.99' },
      { id: 'eca-seguro-exportacion', label: 'ECA (Export Credit Agency)', isic: '6512', cnae: '65.12' },
      { id: 'trade-finance-brokers', label: 'Trade finance brokers', isic: '6619', cnae: '66.19' },
    ],
  },
  {
    id: 'inversion-mercados',
    label: 'Inversión y mercados',
    short: 'IM',
    isic: '643',
    cnae: '64.30',
    roles: [
      { id: 'fondos-inversion', label: 'Fondos de inversión', isic: '6430', cnae: '64.30' },
      { id: 'private-equity-vc', label: 'Private equity / Venture capital', isic: '6430', cnae: '64.30' },
      { id: 'holdings', label: 'Holdings', isic: '6420', cnae: '64.20' },
      { id: 'brokers-valores', label: 'Brokers de valores', isic: '6612', cnae: '66.12' },
      { id: 'crowdfunding-p2p', label: 'Crowdfunding / P2P lending', isic: '6499', cnae: '64.99' },
    ],
  },
  {
    id: 'seguros',
    label: 'Seguros',
    short: 'SG',
    isic: '65',
    cnae: '65',
    roles: [
      { id: 'seguros-generales', label: 'Seguros generales', isic: '6512', cnae: '65.12' },
      { id: 'seguros-vida', label: 'Seguros de vida', isic: '6511', cnae: '65.11' },
      { id: 'reaseguros', label: 'Reaseguros', isic: '6520', cnae: '65.20' },
      { id: 'mutuas', label: 'Mutuas', isic: '6512', cnae: '65.12' },
    ],
  },
  {
    id: 'auxiliares-financieros',
    label: 'Servicios auxiliares financieros',
    short: 'AF',
    isic: '66',
    cnae: '66',
    roles: [
      { id: 'agentes-brokers-seguros', label: 'Agentes / brokers de seguros', isic: '6622', cnae: '66.22' },
      { id: 'asesoria-financiera', label: 'Asesoría financiera independiente', isic: '6619', cnae: '66.19' },
      { id: 'auditoria-financiera', label: 'Auditoría financiera', isic: '6920', cnae: '69.20' },
      { id: 'tasadores-financieros', label: 'Tasadores y peritos financieros', isic: '6820', cnae: '68.32' },
      { id: 'gestion-activos', label: 'Gestión de activos', isic: '6630', cnae: '66.30' },
      { id: 'rating-crediticio', label: 'Calificación crediticia (rating)', isic: '6619', cnae: '66.19' },
    ],
  },
  {
    id: 'banca-cripto-vasps',
    label: 'Banca cripto-friendly y VASPs',
    short: 'CR',
    isic: '6419',
    cnae: '64.19',
    roles: [
      { id: 'bancos-cripto-friendly', label: 'Bancos cripto-friendly internacionales', isic: '6419', cnae: '64.19' },
      { id: 'vasps', label: 'VASPs (Virtual Asset Service Providers)', isic: '6499', cnae: '64.99' },
      { id: 'exchanges-institucionales', label: 'Exchanges institucionales', isic: '6499', cnae: '64.99' },
      { id: 'custodios-cripto', label: 'Custodios cripto', isic: '6499', cnae: '64.99' },
      { id: 'liquidity-providers-xrpl-xdc', label: 'Proveedores de liquidez', isic: '6499', cnae: '64.99' },
    ],
  },
]

export const ACTOR_GROUPS_BY_SECTOR: Record<string, ActorGroup[]> = {
  inmobiliario: INMOBILIARIO,
  automocion: AUTOMOCION,
  salud: SALUD,
  agroalimentario: AGROALIMENTARIO,
  transporte: TRANSPORTE,
  metalurgico: METALURGICO,
  energia: ENERGIA,
  tecnologia: TECNOLOGIA,
  turismo: TURISMO,
  legal: LEGAL,
  textil: TEXTIL,
  cultura: CULTURA,
  institucional: INSTITUCIONAL,
  educacion: EDUCACION,
  medioambiente: MEDIOAMBIENTE,
  'servicios-auxiliares': SERVICIOS_AUXILIARES,
  financiero: FINANCIERO,
}

export function getActorGroups(sectorId: string): ActorGroup[] {
  return ACTOR_GROUPS_BY_SECTOR[sectorId] || []
}
