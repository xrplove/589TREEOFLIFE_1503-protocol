// Schema DPPProduct v1.1 · extensión universal para Digital Product Passport
// completo + cubicaje 3D + integración ERP bidireccional + lifecycle DPP-centric
// + cadena custodia criptográfica + origen y trazabilidad + 10 grupos normativos.
//
// Reg. UE 2024/1781 ESPR · Reg. UE 2023/1542 Baterías · RGPD Art. 5 y 17 ·
// + (v1.1) CBAM (Reg. 2023/956) · EUDR (Reg. 2023/1115) · PPWR (Reg. 2025/40) ·
//   CRA (Reg. 2024/2847) · UCC (Reg. 952/2013) · ViDA (Dir. 2025/516 + Reg.
//   517/518) · EU Taxonomy (Reg. 2020/852) · IMDG Code (SOLAS) · Incoterms 2020
//   ICC · convenios marítimos (Hague-Visby + Hamburgo + Rotterdam).
//
// CHANGELOG v1.0 → v1.1 (aprobado José 2026-05-28 · a1.1.1=SÍ · a1.1.2=SÍ · a1.1.3=B)
// ----------------------------------------------------------------------------------
// 10 grupos campos normativos backwards-compatible (todos opcionales):
//   #1  Capa A · EU Taxonomy alignment (6 objetivos × DNSH × MSS)
//   #2  Capa A · IMDG class granular + un_number + packing_group
//   #3  Capa A · CBAM carbon footprint Anexo IV
//   #4  Capa B · PPWR (packaging_layer + recycled_content_pct envase + reusability
//                       cycles + EPR by country + packaging_materials)
//   #5  Capa C · CRA (has_digital_elements + ce_marking + SBOM URL + vuln disclosure
//                       + security_support_until + cra_class)
//   #6  Capa C · UCC (hs_code canonizado aquí + country_of_origin + EORI seller/importer)
//   #7  Capa C · ViDA (vat_number seller/buyer + intracommunity + reverse_charge
//                       + einvoice_reference)
//   #8  Capa E · Incoterms 2020 (incoterm + delivery_location UN/LOCODE)
//   #9  Capa E · convenios marítimos (bl_reference + carrier_id + maritime_convention)
//   #10 Capa F · EUDR (in_eudr_scope + dds_reference + origin_geolocation +
//                       eudr_compliance_attested)
//
// Reorganizaciones canónicas v1.1:
//   - hs_code se canoniza en Capa C · `DPPERPLink.hs_code` (antes Capa A · DEPRECATED).
//   - Mercancías peligrosas: un_number + packing_group se canonizan en Capa A
//     (junto a imdg_class granular). Capa B `un_dangerous_class` + `dangerous_goods_codes`
//     quedan DEPRECATED · se eliminan en v2.0.
//
// MODELO ARQUITECTÓNICO
// ---------------------
// 1503 v1 maneja dos tipos de fichas que extienden UniversalProduct:
//
//   1. Fichas de SERVICIO (legal · inmobiliario servicios · transporte
//      servicios) → extienden SOLO UniversalProduct. No tienen DPP físico
//      porque no hay producto físico.
//
//   2. Fichas de PRODUCTO físico (agroalimentario · automoción · energía ·
//      salud productos · inmobiliario inmueble · transporte mercancía) →
//      extienden DPPProduct = UniversalProduct + 6 capas DPP A-F.
//
// Nota sobre opción B (decisión José a1.1.3): la separación TypeScript
// `UniversalProduct` ↔ `DPPProduct` ya existe vía composición de tipos. La
// materialización SQL (mig 028 commit 3/7) crea tabla `products` separada +
// FK con `dpp_registry` (refactor mig 019 incluido).
//
// CAPAS DPP (definidas en este archivo)
// -------------------------------------
//   A · DPPSustainability   · ESPR + EU Taxonomy + IMDG + CBAM (v1.1)
//   B · DPPPackaging        · cubicaje 3D Bin Packing + PPWR (v1.1)
//   C · DPPERPLink          · sync ERP + UCC + CRA + ViDA (v1.1)
//   D · DPPLifecycle        · state machine DPP-centric (trigger escrow XDC)
//   E · DPPCustody          · cadena custodia Ed25519 + Incoterms + convenios marítimos (v1.1)
//   F · DPPOrigin           · país fabricación + planta + lote + EUDR (v1.1)
//
// SCHEMA COMPOSITION
// ------------------
//   DPPProduct = UniversalProduct & DPPSustainability & DPPPackaging
//              & DPPERPLink & DPPLifecycle & DPPCustody & DPPOrigin
//
// CUMPLIMIENTO RGPD (canon hard rule)
// -----------------------------------
// - PII (nombres, emails, IBANs, addresses) NUNCA en blockchain.
// - Solo hashes SHA-256 sobre payload canónico se anclan en XDC.
// - Derecho al olvido (Art. 17): cascade FK borra DPP completo desde auth.users.
// - El hash on-chain queda huérfano sin posibilidad de re-identificación.
//
// COMPATIBILIDAD ADRS
// -------------------
// - ADR 0001 (XRPL+XDC): hash canónico se ancla en XDC en Fase 8+.
// - ADR 0004 (identidad Actor-ID + SSI): base de actor_user_id en custody chain.
// - ADR 0006 v1.2 (catálogo hubs): el catálogo es referencia indicativa, no
//   fuente de verdad. La validación de eventos usa GPS del transitario al
//   firmar custody handover, no geofence rígido contra catálogo.
// - ADR 0007 (roadmap unificado): este archivo materializa las 6 capas
//   propuestas en la spec docs/spec/dpp-product-schema-v1.md.
// - ADR 0008 (matriz cumplimiento): este archivo materializa el sistema S4
//   (DPP + sostenibilidad) que cubre simultáneamente 10 normas.
//
// AVIACIÓN · MATIZ CANÓNICO (precisado 2026-05-29)
// -------------------------------------------------
// Lo CANCELADO es la responsabilidad técnica de 1503 sobre cómo se
// carga un avión, NO el comercio aéreo en sí. Distinción operativa:
//
//   ❌ NO HACEMOS: cubicaje 3D para aviones · W&B · IATA-DGR · tablas momentos
//      aeronaves · selector aviación en UI cubicaje. 1503 no asume
//      responsabilidad civil de aviación (precedente National Airlines 102
//      · 2013 · 7 muertos por carga mal estibada).
//
//   ✅ SÍ HACEMOS: DPP de productos que viajan por aire · AWB (Air Waybill)
//      en custody chain como documento legal (igual que BL marítimo o CMR
//      terrestre) · comercio aéreo como modo de transporte elegible (el
//      cliente y transitario lo eligen libre · nosotros solo registramos).
//
// Concreción en este archivo:
//   - `CustodyDocumentType` INCLUYE 'AWB' (documento legal en custody chain).
//   - `DangerousTransportCode` NO incluye 'IATA-DGR' (clasificación aérea de
//     peligrosas es responsabilidad del transitario certificado).
//   - Cubicaje 3D Capa B aplica SOLO a marítimo + terrestre + ferroviario +
//     fluvial. El algoritmo bin packing no opera sobre aeronaves.
//
// Ver ADR 0007 §2.7 para detalles.

import type {
  UniversalProduct,
  ActorKYCRef,
} from './_universal'

// ============================================================================
// CAPA A · DPPSustainability · ESPR + EU Taxonomy + IMDG + CBAM (v1.1)
// ============================================================================

/** Clase peligrosa según REACH/CLP (Reglamento UE 1907/2006 + 1272/2008).
 *
 * - A: Sustancias extremadamente preocupantes (SVHC · candidate list)
 * - B: Sustancias peligrosas clasificadas pero permitidas con restricciones
 * - C: Sustancias con observaciones (notificación obligatoria)
 * - null: No peligroso (no requiere clasificación REACH/CLP)
 */
export type HazardousClass = 'A' | 'B' | 'C' | null

/** Componente de material en la composición del producto.
 *
 *  El campo `supplier_hash` permite proteger la relación comercial con
 *  proveedores upstream sin exponer su identidad en vistas públicas. Si el
 *  proveedor es confidencial, se serializa como `sha256:abc...` (hash del
 *  identificador real). El owner del DPP mantiene el mapping interno
 *  hash→proveedor real fuera del DPP.
 */
export type MaterialComponent = {
  /** Nombre del material (e.g. "PET reciclado", "Algodón orgánico GOTS",
   *  "Acero inoxidable AISI 304"). */
  name: string
  /** Porcentaje del producto total que representa este material (0-100). */
  percentage: number
  /** Hash SHA-256 del proveedor upstream si confidencial (formato
   *  `sha256:abc123...`). NULL si el proveedor se puede revelar. */
  supplier_hash?: string
  /** ¿Material de origen reciclado? Relevante para % recycled_content_pct. */
  recycled_origin?: boolean
  /** Clase peligrosa según REACH/CLP.
   *  Nota canónica: HazardousClass='A' cubre SVHC ESPR Art. 57 REACH · no
   *  se duplica con campo `svhc_substance`. */
  hazardous_class?: HazardousClass
}

/** v1.1 · objetivo individual EU Taxonomy (Reg. UE 2020/852).
 *
 *  Cada uno de los 6 objetivos ambientales se evalúa con 4 dimensiones:
 *  - eligible: la actividad está en el ámbito del acto delegado
 *  - aligned: cumple criterios técnicos de contribución sustancial
 *  - dnsh_passed: no daña significativamente otros objetivos (Do No
 *    Significant Harm)
 *  - mss_passed: cumple garantías mínimas sociales (Minimum Social
 *    Safeguards · OECD MNE · ILO core conventions)
 */
export type TaxonomyObjective = {
  eligible: boolean
  aligned: boolean
  dnsh_passed: boolean
  mss_passed: boolean
  /** Criterio técnico aplicado (referencia acto delegado · e.g.
   *  "RD UE 2021/2139 Anexo I §4.5"). */
  technical_criteria_ref?: string
}

/** v1.1 · clase IMDG granular (Código IMDG · SOLAS · IMO ed. 41-22).
 *
 *  Para CLASE 1 EXPLOSIVOS, IMDG define 6 divisiones (1.1, 1.2, 1.3, 1.4,
 *  1.5, 1.6). El campo `imdg_class` registra solo la clase principal '1';
 *  la división específica se documenta en `proper_shipping_name` o se
 *  persiste como `imdg_division_1` libre en `sustainability_data` hasta
 *  v1.2 donde se canoniza si surge volumen.
 */
export type IMDGClass =
  | '1'    // explosivos (sin distinción división aquí)
  | '2.1'  // gas inflamable
  | '2.2'  // gas no inflamable no tóxico
  | '2.3'  // gas tóxico
  | '3'    // líquidos inflamables
  | '4.1'  // sólidos inflamables · auto-reactivos · desensibilizados sólidos
  | '4.2'  // sustancias combustión espontánea
  | '4.3'  // sustancias en contacto con agua emiten gases inflamables
  | '5.1'  // sustancias comburentes
  | '5.2'  // peróxidos orgánicos
  | '6.1'  // sustancias tóxicas
  | '6.2'  // sustancias infecciosas
  | '7'    // material radiactivo
  | '8'    // sustancias corrosivas
  | '9'    // sustancias y objetos peligrosos diversos

/** Grupo de embalaje UN (severidad del peligro). */
export type UNPackingGroup = 'I' | 'II' | 'III'

/** v1.1 · datos CBAM (Reg. UE 2023/956 · Carbon Border Adjustment Mechanism).
 *
 *  Obligatorio para importadores UE de productos en alcance CBAM (Anexo I):
 *  cemento · electricidad · fertilizantes · hierro/acero · aluminio · hidrógeno
 *  + derivados Anexo II.
 *
 *  Fase definitiva 1-ene-2026 · compra obligatoria certificados CBAM.
 *
 *  Distinción importante con `carbon_footprint_kg_co2eq` (Capa A general):
 *  CBAM usa metodología propia Anexo IV (NO PEF). Para hierro/acero/aluminio/
 *  hidrógeno solo emisiones directas; para cemento + fertilizantes directas
 *  + indirectas.
 */
export type CBAMFootprint = {
  /** Emisiones directas embebidas (t CO2eq / t producto). */
  direct_emissions_t_co2eq: number
  /** Emisiones indirectas embebidas (solo cemento + fertilizantes).
   *  Para hierro/acero/aluminio/hidrógeno = null (no aplica). */
  indirect_emissions_t_co2eq?: number | null
  /** Metodología aplicada (Anexo IV CBAM). */
  methodology: 'cbam_annex_iv'
  /** Verificador acreditado (NOMBRE + ID acreditación nacional). */
  verifier_name?: string
  verifier_accreditation_id?: string
  /** Año de cálculo (las emisiones se actualizan anualmente). */
  calculation_year: number
  /** Certificados CBAM comprados (uds) y precio medio €/t aplicado. */
  certificates_purchased?: number
  avg_certificate_price_eur_t?: number
}

/** v1.1 · alineamiento EU Taxonomy por objetivo ambiental.
 *
 *  Los 6 objetivos del Reg. UE 2020/852 Art. 9:
 *  1. Mitigación cambio climático
 *  2. Adaptación al cambio climático
 *  3. Uso sostenible y protección recursos hídricos y marinos
 *  4. Transición a economía circular
 *  5. Prevención y control contaminación
 *  6. Protección y restauración biodiversidad y ecosistemas
 */
export type TaxonomyAlignment = {
  climate_change_mitigation?: TaxonomyObjective
  climate_change_adaptation?: TaxonomyObjective
  water_marine_resources?: TaxonomyObjective
  circular_economy?: TaxonomyObjective
  pollution_prevention?: TaxonomyObjective
  biodiversity_ecosystems?: TaxonomyObjective
}

/** Capa A · Datos de sostenibilidad ESPR + EU Taxonomy + IMDG + CBAM.
 *
 *  Reg. UE 2024/1781 (Ecodesign for Sustainable Products Regulation) ·
 *  obligatorio escalonado 2026-2030 por categoría según reglamentos delegados:
 *  - Textil: escalonado 2027
 *  - Baterías: Reg. UE 2023/1542 · 18-feb-2027 (DPP específico baterías
 *    diferido a v1.2 cuando entren fabricantes batería · ver §13.5.2 spec)
 *  - Electrónica: ~2028
 *  - Otras categorías: pendientes
 *
 *  La obligatoriedad de cada campo depende del sector (ver matriz en
 *  docs/spec/dpp-product-schema-v1.md §4.3).
 *
 *  v1.1: ampliada con EU Taxonomy + IMDG granular + CBAM Anexo IV.
 */
export type DPPSustainability = {
  /** Composición canónica de materiales (lista de componentes con %). */
  materials: MaterialComponent[]

  /** Huella de carbono general (kg CO2 equivalente por unidad de producto).
   *  Metodología recomendada: PEF (Product Environmental Footprint ·
   *  Recomendación UE 2021/2279).
   *  NO sustituye `carbon_footprint_cbam` si el producto está en alcance CBAM. */
  carbon_footprint_kg_co2eq?: number

  /** v1.1 · huella de carbono según metodología CBAM Anexo IV (Reg. UE 2023/956).
   *  Obligatorio para importadores UE de productos en alcance CBAM (cemento,
   *  electricidad, fertilizantes, hierro/acero, aluminio, hidrógeno, derivados
   *  Anexo II). Fase definitiva desde 1-ene-2026. */
  carbon_footprint_cbam?: CBAMFootprint

  /** Huella hídrica (litros de agua por unidad de producto). */
  water_footprint_l?: number

  /** % de material reciclado en el PRODUCTO principal (0-100).
   *  Relevante para cumplimiento ESPR y certificaciones eco-label.
   *  Distinto de Capa B `package_recycled_content_pct` (envase PPWR). */
  recycled_content_pct?: number

  /** % de reciclabilidad estimada al fin de vida útil (0-100).
   *  Relevante para cumplimiento ESPR y certificaciones eco-label. */
  recyclability_pct?: number

  /** Datos ESG estructurados libres (energía renovable, biodiversidad,
   *  social compliance, certificaciones extra, etc.).
   *  Schema libre `jsonb` para flexibilidad evolutiva sectorial. */
  sustainability_data?: Record<string, unknown>

  /** v1.1 · alineamiento EU Taxonomy (Reg. UE 2020/852) por objetivo.
   *  Diferenciador comercial · presión indirecta vía VCs sujetos SFDR. */
  taxonomy_alignment?: TaxonomyAlignment

  /** v1.1 · número UN de mercancía peligrosa (formato `UN0000`-`UN3999`).
   *  Ejemplos: UN1170 etanol · UN3480 baterías Li-ion · UN1090 acetona.
   *  Obligatorio si el producto está clasificado UN dangerous goods.
   *  Bloquea listing en `dpp_validator` si producto peligroso sin UN number. */
  un_number?: string

  /** v1.1 · clase IMDG granular (Código IMDG SOLAS · IMO ed. 41-22) +
   *  ADR/RID/ADN terrestres. */
  imdg_class?: IMDGClass

  /** v1.1 · grupo de embalaje UN (severidad del peligro). */
  pg_packing_group?: UNPackingGroup

  /**
   * @deprecated v1.1 · `hs_code` se canoniza en Capa C · `DPPERPLink.hs_code`
   * (encaje aduanero UCC Art. 17). Se elimina en v2.0.
   * Por ahora se acepta lectura pero NO se escribe.
   *
   * Código HS arancelario (Sistema Armonizado · 6-10 dígitos).
   * Obligatorio aduanas cross-border.
   */
  hs_code?: string
}

// ============================================================================
// CAPA B · DPPPackaging · cubicaje 3D Bin Packing + PPWR (v1.1)
// ============================================================================

/** Tipo de embalaje físico del bulto. */
export type PackageType =
  | 'box'      // caja cartón estándar
  | 'pallet'   // palet completo (europalet 1200×800 o americano 1200×1000)
  | 'ibc'      // IBC · contenedor intermedio granel (1000L típico)
  | 'sack'     // saco textil o yute (alimentación bulk)
  | 'drum'     // bidón metálico o plástico (líquidos químicos)
  | 'crate'    // caja madera (productos delicados o pesados)
  | 'roll'     // rollo (textil · alfombras · vinilo)
  | 'other'

/** Orientación obligatoria del bulto durante transporte. */
export type RequiredOrientation = 'this_way_up' | 'any' | 'horizontal_only'

/** v1.1 · capa de embalaje según PPWR Art. 3 (Reg. UE 2025/40).
 *
 *  - primary: envase de venta (toca el producto)
 *  - secondary: agrupación de venta (caja con varias unidades)
 *  - tertiary: transporte (palet, contenedor)
 */
export type PackagingLayer = 'primary' | 'secondary' | 'tertiary'

/** Códigos PPWR de material del envase (Art. 9 Reg. UE 2025/40). */
export type PackagingMaterialCode =
  | 'PET'
  | 'HDPE'
  | 'PVC'
  | 'LDPE'
  | 'PP'
  | 'PS'
  | 'glass'
  | 'aluminum'
  | 'steel'
  | 'paper_cardboard'
  | 'wood'
  | 'composite'
  | 'other'

/** v1.1 · material del envase según PPWR. */
export type PackagingMaterial = {
  /** Código material PPWR. */
  code: PackagingMaterialCode
  /** Porcentaje del envase total (0-100). */
  percentage: number
  /** ¿Material reciclable según infraestructura UE? */
  recyclable: boolean
}

/** @deprecated v1.1 · clase de mercancía peligrosa según UN.
 *  Canonizado en Capa A · `DPPSustainability.imdg_class` (más granular IMDG
 *  con 2.1/2.2/2.3/4.1/4.2/4.3/5.1/5.2/6.1/6.2). Se elimina en v2.0.
 */
export type UNDangerousClass =
  | '1'  // explosivos
  | '2'  // gases
  | '3'  // líquidos inflamables
  | '4'  // sólidos inflamables · combustión espontánea
  | '5'  // sustancias comburentes · peróxidos orgánicos
  | '6'  // sustancias tóxicas · infecciosas
  | '7'  // material radiactivo
  | '8'  // sustancias corrosivas
  | '9'  // otros peligros

/** Códigos de transporte de mercancía peligrosa.
 *
 *  Aviación (IATA-DGR) NO incluida porque 1503 excluye la
 *  clasificación aérea de peligrosas (responsabilidad del transitario
 *  certificado). Comercio aéreo documental sí registrable vía AWB en
 *  custody chain. Ver ADR 0007 §2.7 para matiz completo.
 */
export type DangerousTransportCode = 'ADR' | 'IMDG'

/** @deprecated v1.1 · detalle de mercancía peligrosa.
 *  un_number + packing_group canonizados en Capa A. Se elimina en v2.0.
 */
export type DangerousGoodsCodes = {
  /** Número UN (formato `UN1234`). */
  un_number?: string
  /** Grupo de embalaje. */
  packing_group?: UNPackingGroup
  /** Nombre técnico oficial del envío (Proper Shipping Name). */
  proper_shipping_name?: string
  /** Códigos de transporte aplicables (terrestre ADR · marítimo IMDG). */
  transport_codes?: DangerousTransportCode[]
}

/** Capa B · Embalaje físico para cubicaje 3D Bin Packing + PPWR.
 *
 *  Mandatory para que el producto pueda entrar en el algoritmo de optimización
 *  de carga de contenedores (Capa 2 ADR 0007). Sin estos campos, el cubicaje
 *  no puede operar sobre el DPP.
 *
 *  Algoritmo subyacente: 3D Bin Packing con heurísticos (First-Fit Decreasing,
 *  Genetic Algorithms). NP-hard · optimalidad típica 85-95%.
 *
 *  Library Node.js prevista: `binpackingjs` o equivalente (decisión final en
 *  commit Edge Function · Fase 2.7).
 *
 *  v1.1: ampliada con PPWR (Reg. UE 2025/40 · aplicación 12-ago-2026).
 *
 *  Nota canónica: el algoritmo cubicaje 3D aplica SOLO a marítimo + terrestre
 *  + ferroviario + fluvial. NO se aplica a aviación (cubicaje aéreo + W&B
 *  excluidos · ADR 0007 §2.7).
 */
export type DPPPackaging = {
  /** Largo del bulto (mm). Validación: > 0. */
  package_length_mm: number
  /** Ancho del bulto (mm). Validación: > 0. */
  package_width_mm: number
  /** Alto del bulto (mm). Validación: > 0. */
  package_height_mm: number
  /** Peso del bulto incluido embalaje (kg). Validación: > 0. */
  package_weight_kg: number

  /** Tipo de embalaje. Afecta selección de algoritmo y restricciones. */
  package_type: PackageType

  /** v1.1 · capa de embalaje según PPWR Art. 3. */
  packaging_layer?: PackagingLayer

  /** ¿El bulto es apilable? Afecta optimización 3D Bin Packing. */
  stackable: boolean

  /** Carga máxima soportada encima si `stackable=true` (kg). */
  max_stack_load_kg?: number

  /** Orientación obligatoria durante transporte (e.g. "This way up"). */
  required_orientation?: RequiredOrientation

  /** Temperatura mínima permitida en transporte refrigerado (°C). */
  reefer_temp_min_c?: number
  /** Temperatura máxima permitida en transporte refrigerado (°C). */
  reefer_temp_max_c?: number

  /**
   * @deprecated v1.1 · canonizado en Capa A `imdg_class` (más granular).
   * Se mantiene en v1.1 para backwards compat; se elimina en v2.0.
   */
  un_dangerous_class?: UNDangerousClass | null

  /**
   * @deprecated v1.1 · canonizado en Capa A (un_number + pg_packing_group).
   * Se elimina en v2.0.
   */
  dangerous_goods_codes?: DangerousGoodsCodes

  /** URL Supabase Storage de la foto principal del bulto (para tooltip
   *  en escritorio transitario al cargar contenedor). Complementa
   *  `UniversalProduct.images[0]` que es la foto comercial. */
  photo_url?: string

  // ─────────────────────────────────────────────────────────────────────────
  // v1.1 · Bloque PPWR (Reg. UE 2025/40 · aplicación 12-ago-2026)
  // ─────────────────────────────────────────────────────────────────────────

  /** v1.1 · % material reciclado en el ENVASE (PPWR Art. 7).
   *  Obligatorio escalonado por categoría de envase desde 2030 (PET contacto
   *  alimentario 30% · otros plásticos 10-65% según tipo).
   *  Distinto de Capa A `recycled_content_pct` (producto principal). */
  package_recycled_content_pct?: number

  /** v1.1 · ¿envase reutilizable? PPWR Art. 26.
   *  Obligatorio para sectores HORECA + transporte. */
  reusable?: boolean

  /** v1.1 · número de ciclos certificados de reutilización (si reusable=true). */
  reusability_cycles?: number

  /** v1.1 · ID de registro EPR (Extended Producer Responsibility) por país.
   *  Obligatorio Art. 44 PPWR. El productor debe estar registrado en cada
   *  Estado miembro donde introduce el envase.
   *  Clave: ISO 3166-1 alpha-2 país. Valor: ID registro autoridad nacional.
   *  Ejemplo: { "ES": "ECOEMBES-123456", "FR": "CITEO-789012" } */
  epr_registration_by_country?: Record<string, string>

  /** v1.1 · materiales del envase (códigos PPWR Art. 9).
   *  Aplicable marcado obligatorio reciclaje. */
  packaging_materials?: PackagingMaterial[]
}

// ============================================================================
// CAPA C · DPPERPLink · sync ERP + UCC + CRA + ViDA (v1.1)
// ============================================================================

/** Proveedor del ERP del fabricante. */
export type ERPProvider =
  | 'holded'              // partner principal · 80k+ SMBs UE · sede Madrid
  | 'odoo'                // segundo target · open source · global
  | 'sage_business_cloud' // ES histórico · API REST moderna
  | 'sage_50'             // ES legacy · custom fields limitados
  | 'sap_s4hana'          // enterprise · Fase 6.5 con integrador
  | 'custom'              // adapter genérico CSV/JSON upload

/** Estado del último sync ERP. */
export type ERPSyncStatus = 'success' | 'partial' | 'failed' | 'pending'

/** Política de resolución de conflictos cuando ERP y UI tienen mismo campo
 *  modificado simultáneamente. */
export type ConflictResolution = 'last_write_wins' | 'manual_override' | 'erp_wins'

/** Detalle del último sync ERP (campos sincronizados, errores, conflictos). */
export type ERPSyncDetails = {
  /** Lista de campos que se sincronizaron correctamente. */
  fields_synced?: string[]
  /** Lista de campos que fallaron en el sync. */
  fields_failed?: string[]
  /** Mensaje de error si `erp_last_sync_status='failed'`. */
  error_message?: string
  /** Política de resolución aplicada en el último conflicto. */
  conflict_resolution?: ConflictResolution
}

/** v1.1 · clasificación CRA (Reg. UE 2024/2847 · Cyber Resilience Act).
 *
 *  - default: producto NO crítico
 *  - class_I: productos con elementos digitales en Anexo III (firewalls,
 *    sistemas operativos, motores de búsqueda críticos, etc.)
 *  - class_II: productos críticos Anexo IV (autenticación multi-factor,
 *    HSMs, smart meters, etc.)
 */
export type CRAClass = 'default' | 'class_I' | 'class_II'

/** Capa C · Vínculo bidireccional ERP del fabricante ↔ DPP en 1503.
 *
 *  Permite que cuando el ERP actualiza el producto, 1503 sepa qué DPP
 *  existente actualizar via upsert por
 *  `(owner_user_id, erp_provider, erp_external_id)`.
 *
 *  Política de sync (declarativa):
 *  - Trigger: webhook ERP (preferido) o pull periódico cada 15 min (fallback).
 *  - Resolución conflictos: `last_write_wins` por timestamp salvo
 *    `manual_override` del Actor.
 *  - Campos sincronizables desde ERP: sku, ean13, gtin, title (parcial),
 *    description (parcial), price, stock, package_*, photo_url.
 *  - Campos NUNCA sincronizados desde ERP (privacidad/legal): custody_chain,
 *    signatures, lifecycle_state, materials ESPR (requieren validación
 *    manual fabricante).
 *  - PII off-chain: el ERP del fabricante puede tener PII de empleados/clientes
 *    que NUNCA viaja a 1503 (solo datos del producto).
 *
 *  v1.1: ampliada con UCC (aduanas) · CRA (ciberseguridad productos digitales) ·
 *        ViDA (IVA digital).
 */
export type DPPERPLink = {
  /** Proveedor del ERP origen. NULL si la ficha NO viene de ERP
   *  (no debería ocurrir en fabricantes serios target 1503). */
  erp_provider?: ERPProvider

  /** ID interno del producto en el ERP del fabricante (su SKU del ERP).
   *  Permite sincronización bidireccional via upsert por la composición
   *  `(owner_user_id, erp_provider, erp_external_id)`. */
  erp_external_id?: string

  /** Último sync exitoso desde el ERP (ISO 8601 timestamp). */
  erp_last_synced_at?: string

  /** Estado del último sync. */
  erp_last_sync_status?: ERPSyncStatus

  /** Detalle del último sync (campos, errores, conflictos). */
  erp_sync_details?: ERPSyncDetails

  // ─────────────────────────────────────────────────────────────────────────
  // v1.1 · Bloque UCC (Reg. UE 952/2013 · Código Aduanero de la Unión)
  // ─────────────────────────────────────────────────────────────────────────

  /** v1.1 · código HS arancelario (Sistema Armonizado · 6-10 dígitos).
   *  CANONIZADO aquí en v1.1 (antes en Capa A · ahora DEPRECATED).
   *  Obligatorio aduanas cross-border. Validación regex: `^[0-9]{6,10}$`. */
  hs_code?: string

  /** v1.1 · país de origen aduanero (ISO 3166-1 alpha-2). UCC Art. 60.
   *  Distinto de `manufacturing_country` (Capa F): si hay transformación
   *  sustancial en otro país, el origen aduanero cambia aunque la planta
   *  física no. */
  country_of_origin?: string

  /** v1.1 · EORI del vendedor/exportador (Economic Operator Registration
   *  and Identification). Obligatorio operadores UCC. Ejemplo: `ESB12345678`. */
  eori_seller?: string

  /** v1.1 · EORI del importador (si difiere del vendedor). */
  eori_importer?: string

  // ─────────────────────────────────────────────────────────────────────────
  // v1.1 · Bloque CRA (Reg. UE 2024/2847 · Cyber Resilience Act)
  // ─────────────────────────────────────────────────────────────────────────

  /** v1.1 · ¿producto contiene elementos digitales (hardware + software embebido)?
   *  Si true, los campos CRA siguientes son obligatorios pre-listing.
   *  Aplicación efectiva 11-dic-2027 (notif vulns 11-sep-2026). */
  has_digital_elements?: boolean

  /** v1.1 · ¿marcado CE de ciberseguridad CRA aplicado al producto? */
  ce_marking_cra?: boolean

  /** v1.1 · URL pública al Software Bill of Materials (SBOM) en formato
   *  CycloneDX o SPDX. Obligatorio CRA Art. 13 para productos con elementos
   *  digitales. */
  sbom_url?: string

  /** v1.1 · URL del canal de vulnerability disclosure responsable del
   *  fabricante. Obligatorio CRA Art. 13. */
  vulnerability_disclosure_url?: string

  /** v1.1 · fecha hasta la cual el fabricante garantiza actualizaciones de
   *  seguridad gratuitas (típicamente vida útil esperada · ≥5 años CRA).
   *  Formato: ISO 8601 date. */
  security_support_until?: string

  /** v1.1 · clasificación CRA (productos críticos · Anexo III + IV). */
  cra_class?: CRAClass

  // ─────────────────────────────────────────────────────────────────────────
  // v1.1 · Bloque ViDA (Dir. UE 2025/516 + Reg. 517/518 · IVA digital)
  // ─────────────────────────────────────────────────────────────────────────

  /** v1.1 · VAT number UE del Actor publicador del producto (formato ISO 3166
   *  + número nacional). Espejado desde `actors.vat_number` para evitar JOIN
   *  en consulta DPP. Validado server-side contra VIES.
   *  Ejemplo: `ESB12345678`. */
  vat_number_seller?: string

  /** v1.1 · VAT number UE del comprador.
   *  NULL en el DPP del catálogo público; se completa en el DPP del envío
   *  específico al firmar custody handover (scope transaccional · ver §0.1
   *  spec v1.1 y §13.5.2 hallazgo 8). En v1.2 migra a tabla `dpp_orders`. */
  vat_number_buyer?: string

  /** v1.1 · ¿suministro intracomunitario? Determina facturación + reverse charge.
   *  NULL en catálogo público · se determina al confirmar comprador. */
  intracommunity_supply?: boolean

  /** v1.1 · ¿aplica reverse charge? (vendedor no identificado IVA UE ·
   *  operación intra-UE B2B · servicios específicos Art. 196 Dir. IVA).
   *  NULL en catálogo · se determina al confirmar operación. */
  reverse_charge_applies?: boolean

  /** v1.1 · referencia de factura electrónica EN 16931 si emitida vía
   *  1503. E-invoicing UE B2B obligatorio desde 1-jul-2030. */
  einvoice_reference?: string
}

// ============================================================================
// CAPA D · DPPLifecycle · state machine DPP-centric
// ============================================================================

/** Estado del DPP en su ciclo de vida (state machine canónica).
 *
 *  El smart contract escrow XDC se suscribe a transiciones a `delivered` para
 *  liberar fondos automáticamente.
 *
 *  La política de transición se materializa server-side (Edge Function
 *  `dpp_state_transition`) y on-chain (smart contract DPP Capa 5).
 */
export type DPPLifecycleState =
  /** ERP envió datos · fabricante NO ha completado campos ESPR todavía.
   *  El DPP existe en BD pero NO se puede usar para logística. */
  | 'created_pending_completion'

  /** Fabricante firmó completado ESPR + Ed25519 · DPP oficial · listo. */
  | 'created'

  /** Cargado en contenedor con precinto digital aplicado y firmado. */
  | 'loaded'

  /** En tránsito (marítimo · terrestre carretera · ferroviario · fluvial ·
   *  aéreo registrado vía AWB en custody chain).
   *  Nota canónica aviación: el modo aéreo SÍ se registra en custody chain
   *  como cualquier otro modo · 1503 no opera cubicaje aéreo ni W&B
   *  (responsabilidad del transitario certificado · ver ADR 0007 §2.7). */
  | 'in_transit'

  /** Llegado al hub destino (puerto · estación · aeropuerto · almacén destino). */
  | 'arrived'

  /** Entregado al consignatario final.
   *  TRIGGER AUTOMÁTICO smart contract escrow XDC → libera fondos. */
  | 'delivered'

  /** En uso por el consignatario (fase post-entrega ESPR). */
  | 'in_use'

  /** Fuera de servicio (fin de vida útil declarado por consignatario). */
  | 'decommissioned'

  /** Reciclado (fin de vida ESPR · token reciclaje opcional Fase 5). */
  | 'recycled'

  /** Reparado · vuelve a `in_use`. */
  | 'repaired'

  /** Revendido (mercado secundario de DPPs · transferencia firmada). */
  | 'resold'

/** Capa D · State machine del DPP-centric.
 *
 *  Materialización del modelo donde el DPP es entidad criptográfica viva con
 *  ciclo de vida propio · los humanos contribuyen evidencia firmada al ciclo
 *  de vida del DPP. El smart contract escrow no escucha a humanos · escucha
 *  al DPP (ADR 0007 §2.1).
 */
export type DPPLifecycle = {
  /** Estado actual del DPP. */
  lifecycle_state: DPPLifecycleState

  /** Fecha de última transición de estado (ISO 8601). */
  state_changed_at: string

  /** Actor que disparó la última transición. */
  state_changed_by: ActorKYCRef
}

// ============================================================================
// CAPA E · DPPCustody · cadena custodia Ed25519 + Incoterms + convenios marítimos (v1.1)
// ============================================================================

/** Rol del actor cuando tiene custodia del DPP. */
export type CustodyRole =
  | 'manufacturer'      // fabricante original (primer eslabón siempre)
  | 'owner'             // propietario (puede vender · transferir)
  | 'freight_forwarder' // transitario (gestiona logística)
  | 'carrier'           // transportista (naviera · transportista terrestre · ferroviaria · aéreo)
  | 'customs'           // autoridad aduanera
  | 'consignee'         // consignatario destino final (último eslabón típico)

/** Tipo de documento que acompaña una transferencia de custodia.
 *
 *  Matiz canónico aviación (ADR 0007 §2.7): 'AWB' se INCLUYE como documento
 *  legal en custody chain · igual que BL marítimo o CMR terrestre. 1503
 *  registra AWB cuando el transitario opta por transporte aéreo, pero NO
 *  calcula W&B ni cubicaje aéreo (responsabilidad del transitario certificado).
 */
export type CustodyDocumentType =
  | 'BL'                 // Bill of Lading marítimo
  | 'CMR'                // CMR (terrestre · Convenio CMR 1956)
  | 'AWB'                // Air Waybill (aéreo · documento legal · no implica W&B)
  | 'rail_consignment'   // Carta de porte ferroviaria (CIM/COTIF)
  | 'delivery_note'      // Albarán de entrega
  | 'inland_waterway_bl' // BL fluvial

/** Evidencia documental de una transferencia de custodia. */
export type CustodyTransferEvidence = {
  /** URL Supabase Storage de foto del traspaso (firma física · estado del
   *  contenedor · precinto antes/después). */
  photo_url?: string
  /** Tipo de documento legal de transferencia. */
  document_type?: CustodyDocumentType
  /** URL Supabase Storage del PDF firmado del documento. */
  document_url?: string
  /** Hash SHA-256 del documento (para anclaje XDC + verificación integridad). */
  document_hash_sha256?: string
}

/** Propósito de una firma criptográfica en el contexto DPP. */
export type SignaturePurpose =
  | 'creation'         // firma del fabricante al crear DPP (completado ESPR)
  | 'transfer'         // transferencia de propiedad (cambio owner)
  | 'event'            // firma de un evento logístico individual
  | 'custody_handover' // entrega de custodia entre actores consecutivos
  | 'multi_sig_quorum' // firma como parte de multi-sig 2-de-3 (envíos altos)

/** Eslabón individual de la cadena de custodia · firmado criptográficamente.
 *
 *  Decisión expresa José en chat 2026-05-28 (G10 del ADR 0007 §2.2):
 *  cada actor que toca la mercancía deja huella firmada en el DPP.
 *
 *  Garantía operativa: al consultar un DPP se obtiene la lista cronológica
 *  de actores que lo han tocado, cada uno con su Actor-ID firmado e inmutable
 *  encadenado por hash con el anterior.
 */
export type CustodyLink = {
  /** Actor que toma custodia (referencia ligera al KYC). */
  actor: ActorKYCRef

  /** Rol del actor cuando tiene custodia. */
  custody_role: CustodyRole

  /** Inicio de custodia (ISO 8601). */
  custody_started_at: string

  /** Fin de custodia (ISO 8601). NULL si vigente. */
  custody_ended_at?: string

  /** Clave pública Ed25519 del actor en el momento de la firma (hex 64 chars).
   *  Las claves del actor pueden rotarse · esta captura la activa en ese momento. */
  signer_public_key: string

  /** Firma Ed25519 sobre el payload canónico del eslabón (hex 128 chars). */
  signature: string

  /** Latitud GPS del momento de transferencia (WGS84 · -90 a 90). */
  gps_lat?: number
  /** Longitud GPS del momento de transferencia (WGS84 · -180 a 180). */
  gps_lng?: number

  /** Evidencia documental adicional (foto · BL · CMR · AWB · etc.). */
  transfer_evidence?: CustodyTransferEvidence

  /** Hash SHA-256 del eslabón anterior (encadenado para integridad de la
   *  cadena · primer eslabón tiene NULL). */
  previous_link_hash?: string
}

/** Firma criptográfica adicional sobre el DPP completo (no sobre un eslabón
 *  específico). Usada para multi-firma 2-de-3 en envíos altos. */
export type DPPSignature = {
  /** Firmante. */
  signer: ActorKYCRef
  /** Clave pública Ed25519 del firmante (hex 64 chars). */
  signer_public_key: string
  /** Firma Ed25519 sobre payload canónico del DPP (hex 128 chars). */
  signature: string
  /** Fecha de la firma (ISO 8601). */
  signed_at: string
  /** Propósito de la firma. */
  signature_purpose: SignaturePurpose
}

/** v1.1 · Incoterm 2020 ICC (Reglas Internacionales para la Interpretación
 *  de los Términos Comerciales).
 *
 *  El smart contract escrow XDC (Capa 5 ADR 0007) parametriza el trigger
 *  según Incoterm:
 *    - DAP/DPU/DDP → trigger al entregar destino
 *    - FOB/CFR/CIF/CPT/CIP → trigger al embarcar origen
 *    - EXW/FCA/FAS → trigger al recogida origen
 */
export type Incoterm =
  | 'EXW'  // Ex Works
  | 'FCA'  // Free Carrier
  | 'CPT'  // Carriage Paid To
  | 'CIP'  // Carriage and Insurance Paid To
  | 'DAP'  // Delivered at Place
  | 'DPU'  // Delivered at Place Unloaded
  | 'DDP'  // Delivered Duty Paid
  | 'FAS'  // Free Alongside Ship
  | 'FOB'  // Free On Board
  | 'CFR'  // Cost and Freight
  | 'CIF'  // Cost, Insurance and Freight

/** v1.1 · convenio marítimo aplicable según puerto de carga + bandera buque.
 *
 *  Determina limitación responsabilidad porteador, plazos reclamación.
 *  España aplica Hague-Visby (Ley 14/2014 Navegación Marítima).
 */
export type MaritimeConvention =
  | 'hague_visby'    // 1924/1979 · ~70 estados (España, US, UK)
  | 'hamburg'        // 1978 · ~35 estados
  | 'rotterdam'      // 2009 · no en vigor (solo 5 ratificadores)
  | 'not_applicable' // operación no marítima (terrestre/ferroviaria/fluvial/aéreo)

/** Capa E · Cadena custodia digital criptográfica del DPP.
 *
 *  v1.1: ampliada con Incoterms 2020 + convenios marítimos.
 */
export type DPPCustody = {
  /** Clave pública Ed25519 del propio DPP (entidad criptográfica soberana).
   *  Permite transferencias verificables en venta del DPP (Capa 5 ADR 0007 ·
   *  G6 · soberanía web3). Hex 64 chars. */
  dpp_public_key?: string

  /** Cadena de custodia ordenada cronológicamente.
   *  Cada eslabón firmado por el actor con su clave Ed25519. */
  custody_chain: CustodyLink[]

  /** Firmas adicionales sobre el DPP completo (multi-firma 2-de-3 envíos
   *  altos · Capa 4 ADR 0007 · G4). */
  signatures: DPPSignature[]

  // ─────────────────────────────────────────────────────────────────────────
  // v1.1 · Bloque Incoterms 2020 (ICC)
  // ─────────────────────────────────────────────────────────────────────────

  /** v1.1 · Incoterm aplicable a la operación logística.
   *  Scope transaccional: NULL en el DPP del catálogo público; se completa
   *  en el DPP del envío específico al firmar pedido. */
  incoterm?: Incoterm

  /** v1.1 · lugar de entrega según Incoterm · código UN/LOCODE (5 caracteres ·
   *  2 letras ISO 3166 país + 3 chars [A-Z,2-9] excluyendo 0/1 según UN/CEFACT).
   *  Ejemplo: ESVLC = Valencia · NLRTM = Rotterdam · JPYOK = Yokohama.
   *  Regex: `^[A-Z]{2}[A-Z2-9]{3}$` alineado con `dpp_tracking_events.location_un_locode`
   *  (mig 019). */
  delivery_location?: string

  // ─────────────────────────────────────────────────────────────────────────
  // v1.1 · Bloque convenios marítimos (Hague-Visby / Hamburgo / Rotterdam)
  // ─────────────────────────────────────────────────────────────────────────

  /** v1.1 · referencia del Bill of Lading (B/L) electrónico o de papel.
   *  Documento clave de la operación marítima · cadena custodia G10 lo
   *  ancla criptográficamente. */
  bl_reference?: string

  /** v1.1 · ID del transportista marítimo (carrier · ej. SCAC code o IMO number).
   *  Permite cruzar con AIS para validación coherencia (Capa 4 ADR 0007). */
  carrier_id?: string

  /** v1.1 · convenio marítimo aplicable. */
  maritime_convention?: MaritimeConvention
}

// ============================================================================
// CAPA F · DPPOrigin · país fabricación · planta · lote · EUDR (v1.1)
// ============================================================================

/** v1.1 · geolocalización precisa de la parcela donde se produjo la materia
 *  prima. Obligatorio EUDR Art. 9.1.d.
 *
 *  - Para parcelas < 4 ha: punto (lat, lng)
 *  - Para parcelas ≥ 4 ha: polígono (lista vértices)
 *
 *  Fecha corte producción: 31-dic-2020. Parcelas deforestadas después de esa
 *  fecha quedan PROHIBIDAS por EUDR.
 *
 *  Formato GeoJSON (RFC 7946):
 *  - Point: coordinates = [lng, lat]
 *  - Polygon: coordinates = [[[lng, lat], [lng, lat], ..., [lng, lat]]]
 *    (primer y último vértice deben coincidir · anillo cerrado)
 */
export type EUDROriginGeolocation = {
  /** Tipo de geometría GeoJSON. */
  type: 'Point' | 'Polygon'
  /** Coordenadas en formato GeoJSON.
   *  - Point: [lng, lat]
   *  - Polygon: [[[lng, lat], [lng, lat], ...]] */
  coordinates: number[] | number[][][]
  /** Fecha producción en esta parcela (verifica > 2020-12-31 EUDR). */
  production_date_on_plot?: string
  /** Hectáreas de la parcela. */
  plot_size_ha?: number
}

/** Capa F · Origen y trazabilidad fabricante + EUDR.
 *
 *  Permite distinguir entre `owner_user_id` (quien publica la ficha · puede
 *  ser distribuidor o importador) y `manufacturer_actor` (quien realmente
 *  fabricó · puede ser el mismo o un tercero white-label).
 *
 *  v1.1: ampliada con EUDR (Reg. UE 2023/1115 · anti-deforestación · aplica
 *        30-dic-2026 grandes · 30-jun-2027 PYME).
 */
export type DPPOrigin = {
  /** País de fabricación (ISO 3166-1 alpha-2 · regex `^[A-Z]{2}$`).
   *  Distinto de `country_of_origin` (Capa C · UCC Art. 60 origen aduanero). */
  manufacturing_country: string

  /** ID opaco de la planta/instalación. NO publicar dirección física exacta
   *  en vistas públicas autoridades (PII de la planta + operarios). */
  manufacturing_facility_id?: string

  /** Fecha de producción (ISO 8601 date · YYYY-MM-DD). */
  production_date: string

  /** Lote del fabricante (trazabilidad interna · obligatorio para retiradas
   *  de mercado / recalls). */
  manufacturer_batch_number?: string

  /** Fabricante real (puede ser distinto del `owner` publicador · e.g.
   *  white-label · distribuidor importador). NULL si el owner es directamente
   *  el fabricante. */
  manufacturer_actor?: ActorKYCRef

  // ─────────────────────────────────────────────────────────────────────────
  // v1.1 · Bloque EUDR (Reg. UE 2023/1115 · anti-deforestación)
  // ─────────────────────────────────────────────────────────────────────────

  /** v1.1 · ¿producto en alcance EUDR?
   *
   *  Aplica a 7 commodities + sus derivados Anexo I:
   *  ganado bovino · cacao · café · aceite de palma · caucho · soja · madera.
   *  Derivados típicos: chocolate · muebles · papel impreso · cuero · cosmética
   *  con palma · neumáticos · productos cárnicos.
   *
   *  Si true, `dds_reference` + `origin_geolocation` son obligatorios.
   *  Aplicación: 30-dic-2026 grandes · 30-jun-2027 micro y pequeñas. */
  in_eudr_scope?: boolean

  /** v1.1 · referencia de la Declaración de Diligencia Debida (DDS) registrada
   *  en el sistema central UE (TRACES NT EUDR). Obligatorio antes de
   *  introducir/exportar producto en alcance. */
  dds_reference?: string

  /** v1.1 · geolocalización precisa de la parcela de origen.
   *  Obligatorio EUDR Art. 9.1.d. */
  origin_geolocation?: EUDROriginGeolocation

  /** v1.1 · ¿la cadena de producción cumple las 3 condiciones EUDR?
   *  1. libre de deforestación post 2020-12-31
   *  2. legal según país de origen
   *  3. DDS completada y registrada */
  eudr_compliance_attested?: boolean
}

// ============================================================================
// SCHEMA UNIFICADO · DPPProduct (composición de UniversalProduct + 6 capas v1.1)
// ============================================================================

/** Schema unificado para fichas de producto físico con Digital Product
 *  Passport completo · v1.1.
 *
 *  Composición: extiende `UniversalProduct` (base comercial existente · NO
 *  se toca) con las 6 capas DPP A-F ampliadas en v1.1.
 *
 *  Casos de uso:
 *  - Cumplimiento Reg. UE 2024/1781 ESPR escalonado 2026-2030
 *  - Cubicaje 3D contenedores (Capa 2 ADR 0007 · NO aéreo)
 *  - Trigger automático smart contract escrow XDC al `delivered`
 *  - Cadena custodia criptográfica auditable (G10 José)
 *  - Sincronización bidireccional ERP fabricante
 *  - Trazabilidad fabricación → uso → fin de vida
 *  - v1.1 · 10 grupos campos normativos (CBAM + EUDR + PPWR + CRA + UCC +
 *    ViDA + EU Taxonomy + IMDG + Incoterms + convenios marítimos)
 *
 *  Fichas de servicio (legal · inmobiliario servicios · transporte servicios)
 *  NO usan este schema · extienden solo `UniversalProduct` porque no hay
 *  producto físico al que asociar DPP.
 */
export type DPPProduct =
  UniversalProduct
  & DPPSustainability
  & DPPPackaging
  & DPPERPLink
  & DPPLifecycle
  & DPPCustody
  & DPPOrigin

// ============================================================================
// CONSTANTES Y HELPERS
// ============================================================================

/** Versión del schema DPP. Bumpear cuando se añadan campos breaking.
 *
 *  Política de versionado:
 *  - Bump minor (1.0 → 1.1) cuando se añaden campos opcionales backwards-compat.
 *  - Bump major (1.0 → 2.0) cuando se cambian tipos o se eliminan campos.
 *  - El bump se refleja en `UniversalProduct.schema_version` con prefijo
 *    sectorial (e.g. `agroalimentario@1.2+dpp@1.1`).
 *
 *  v1.0 → v1.1: añadidos 10 grupos campos normativos sin breaking changes
 *  (todos opcionales). Aprobado José 2026-05-28 (a1.1.1=SÍ · a1.1.2=SÍ ·
 *  a1.1.3=B refactor mig 019 + tabla products separada).
 */
export const DPP_SCHEMA_VERSION = '1.1' as const

/** Type guard para verificar si un objeto tiene la estructura mínima de
 *  `DPPProduct` (capas obligatorias).
 *
 *  Validación profunda con esquemas Zod en `_validators.ts` (commit 2/7).
 */
export function isDPPProduct(value: unknown): value is DPPProduct {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    'lifecycle_state' in obj &&
    'custody_chain' in obj &&
    'manufacturing_country' in obj &&
    'package_length_mm' in obj
  )
}

/** Type guard para verificar si un `lifecycle_state` es un estado terminal
 *  (no transitable a otros estados sin acción humana específica). */
export function isTerminalState(state: DPPLifecycleState): boolean {
  return state === 'decommissioned' || state === 'recycled'
}

/** Type guard para verificar si un `lifecycle_state` permite tránsito
 *  logístico (loaded → in_transit → arrived). */
export function isLogisticState(state: DPPLifecycleState): boolean {
  return (
    state === 'loaded' ||
    state === 'in_transit' ||
    state === 'arrived'
  )
}

/** Type guard para verificar si un `lifecycle_state` es post-entrega
 *  (ESPR fase de vida útil del producto en manos del consignatario). */
export function isPostDeliveryState(state: DPPLifecycleState): boolean {
  return (
    state === 'in_use' ||
    state === 'decommissioned' ||
    state === 'recycled' ||
    state === 'repaired' ||
    state === 'resold'
  )
}

/** Type guard v1.1 · ¿el producto está en alcance EUDR?
 *  Si true, `dds_reference` + `origin_geolocation` deben estar rellenos
 *  antes de listing (CHECK constraint mig 028). */
export function isInEUDRScope(origin: Partial<DPPOrigin>): boolean {
  return origin.in_eudr_scope === true
}

/** Type guard v1.1 · ¿el producto declara elementos digitales CRA?
 *  Si true, los campos CRA (ce_marking_cra + sbom_url + vulnerability_disclosure_url
 *  + security_support_until) deben estar rellenos antes de listing. */
export function hasDigitalElementsCRA(erpLink: Partial<DPPERPLink>): boolean {
  return erpLink.has_digital_elements === true
}

/** Type guard v1.1 · ¿el producto es mercancía peligrosa IMDG?
 *  Si true, un_number + imdg_class + pg_packing_group deben estar rellenos. */
export function isIMDGDangerous(sustainability: Partial<DPPSustainability>): boolean {
  return sustainability.imdg_class !== undefined && sustainability.imdg_class !== null
}
