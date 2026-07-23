// Schema sectorial METALÚRGICO · Fase 7 bloque sectorial 8 · Audit-Ready by Design.
//
// Sector ISIC C24 (Manufacture of basic metals) + parte C25 (Manufacture of
// fabricated metal products). En CNAE-2025 español cubre 24.10-24.54 +
// 25.11-25.99 según subdivisión.
//
// Bestia regulatoria: el sector metalúrgico es uno de los más densos en
// normativa UE porque los equipos a presión + estructuras + aleaciones
// importadas se cruzan con cuatro marcos paralelos:
//
//   1. CBAM (Reg. UE 2023/956) — hierro/acero/aluminio en alcance Anexo I ·
//      fase definitiva desde 1-ene-2026 · cálculo emisiones directas
//      embebidas metodología Anexo IV.
//   2. PED (Dir. 2014/68/UE transpuesta RD 709/2015 en ES) — equipos a presión
//      categorizados I-IV según presión × volumen × fluido, módulos
//      conformidad A-H1.
//   3. EN 1090-1/-2 — ejecución estructuras acero/aluminio + marcado CE
//      productos construcción (clases EXC1-EXC4).
//   4. REACH/RoHS — sustancias químicas en aleaciones (cromo hexavalente,
//      plomo, cadmio).
//
// Más sub-marcos sectoriales superpuestos:
//   - ISO 3834-2/-3/-4 — calidad fabricación soldadura (full / standard / elementary).
//   - EN 13445 — recipientes a presión no sometidos a fuego.
//   - EN 12952 / EN 12953 — calderas (acuotubulares / pirotubulares).
//   - EN 13480 — tuberías a presión metálicas industriales.
//   - ATEX (Dir. 2014/34/UE) — equipos para atmósferas explosivas.
//   - Reglamento Maquinaria UE 2023/1230 (deroga Dir. 2006/42/CE desde
//     20-ene-2027) si tiene partes móviles motorizadas.
//   - IATF 16949 — calidad fabricación piezas auto (cliente OEM requiere).
//   - ESPR (Reg. UE 2024/1781) — DPP obligatorio acero/aluminio escalonado
//     ~2027-2030 según reglamentos delegados.
//   - EN 10204 — certificados inspección material (2.1 · 2.2 · 3.1 · 3.2).
//   - EN 9712 — cualificación inspectores END/NDT niveles 1-2-3.
//
// 4 sub-categorías canonizadas (José 2026-05-29 opción cuádruple):
//
//   1. MaterialMetalurgicoProduct (DPPProduct) — producto físico estándar
//      (acero corrugado · perfil estructural · chapa · tubo · aluminio ·
//      cobre · etc.).
//
//   2. EquipoPresionProduct (DPPProduct) — equipo a presión PED (caldera ·
//      recipiente · intercambiador · reactor · tubería) o equipo bajo
//      Reglamento Maquinaria. Sub-categoría separada porque PED tiene
//      módulos conformidad propios + categorización fluido + Notified Body
//      número que ensucia si va mezclado con material commodity.
//
//   3. NecesidadMetalurgicaProduct (DPPProduct) — pieza o material a fabricar
//      a medida que un comprador publica para que oferten talleres
//      (mecanizado · forja · fundición · construcción soldada).
//
//   4. ServicioMetalurgicoProduct (UniversalProduct) — servicios profesionales
//      (soldadura · mecanizado · tratamiento térmico · END/NDT ·
//      galvanizado · ingeniería estructural EN 1090 · etc.). Como es
//      servicio no tiene DPP físico.
//
// schema_status: 'subject_to_expert' (canon ADR 0011) hasta validación por:
//   - Confemetal (Confederación Española del Metal · CONFEDEM patronal)
//   - 1 organismo notificado PED (AENOR · Bureau Veritas · TÜV Rheinland)
//   - 1 fabricante recipientes a presión categoría III-IV
//   - 1 taller mecanizado IATF 16949
//   - 1 inspector END nivel 3 EN 9712
//   - Auditoría jurídica especialista compliance PED + CBAM
//
// Cobertura ADR 0008 matriz cumplimiento (sistema S4 + S7 + S11 + S15):
//   - S4 DPP + sostenibilidad (ESPR · CBAM · EU Taxonomy · REACH · RoHS)
//   - S7 PED equipos a presión
//   - S11 Reglamento Maquinaria 2023/1230
//   - S15 EN 1090 marcado CE estructuras
//
// Ver `docs/adr/0011-taxonomy-status-extension.md` para estado subject_to_expert.

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { DPPProduct } from './_dpp'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR · designaciones · procesos · normativas
// ============================================================================

/** Familia de metal base.
 *
 *  Cobertura ISIC C24 (metales básicos) + C25 (productos metálicos
 *  fabricados). Aleaciones específicas se documentan en `aleacion_designacion`.
 */
export type FamiliaMetalica =
  | 'acero_al_carbono'      // estructural · construcción · automoción base
  | 'acero_inoxidable'      // AISI 304 · 316 · 316L · 321 · 410 · 430
  | 'acero_aleado'          // baja aleación HSLA · alta aleación herramientas
  | 'acero_herramientas'    // O1 · D2 · H13 · M2 · etc.
  | 'fundicion_gris'        // EN-GJL · motores · bancadas
  | 'fundicion_nodular'     // EN-GJS · tuberías presión · accesorios
  | 'fundicion_maleable'    // EN-GJM · accesorios fontanería
  | 'aluminio'              // serie 1xxx-8xxx (puro · Cu · Mn · Si · Mg · Zn)
  | 'cobre'                 // Cu-DHP · Cu-ETP · Cu-OF
  | 'laton'                 // CuZn — aleación Cu+Zn (fontanería · grifería)
  | 'bronce'                // CuSn · CuAl · CuBe (rodamientos · marina)
  | 'niquel_aleaciones'     // Inconel · Monel · Hastelloy (alta T · corrosivos)
  | 'titanio'               // Grado 1-5+ (aeroespacial · médico · químico)
  | 'magnesio'              // AZ31 · AZ91 (ligero · automoción)
  | 'zinc'                  // ZAMAK · galvanizado
  | 'plomo'                 // baterías · radiología · contrapesos
  | 'estano'                // soldadura blanda · estañado
  | 'otros'                 // refractarios · raros · earth metals

/** Designación normativa del metal según norma aplicable.
 *
 *  No exhaustivo · campo libre estructurado para registrar la designación
 *  oficial completa. Validación experta sectorial bloqueada hasta input
 *  CONFEDEM + ENAC.
 */
export type SistemaDesignacionMetal =
  | 'EN_10025'              // aceros estructurales no aleados (S235/S275/S355/S420/S460)
  | 'EN_10088'              // aceros inoxidables (X5CrNi18-10 · X2CrNiMo17-12-2)
  | 'EN_10210'              // perfiles huecos acero estructural (S275J0H · S355J2H)
  | 'EN_10219'              // perfiles huecos acero conformados en frío
  | 'EN_10028'              // chapas aceros para recipientes a presión (P235GH · P265GH)
  | 'EN_10216'              // tubos acero sin soldadura presión
  | 'EN_10217'              // tubos acero soldados presión
  | 'EN_573'                // aluminio composición química (EN AW-1050A · EN AW-6063 · EN AW-7075)
  | 'EN_485'                // aluminio laminado en chapa
  | 'EN_754'                // aluminio barra/perfil extrudido
  | 'EN_1652'               // cobre y aleaciones laminados
  | 'AISI'                  // American Iron and Steel Institute (304 · 316L · 4140)
  | 'SAE'                   // Society of Automotive Engineers (1018 · 1045 · 8620)
  | 'ASTM'                  // ASTM International (A36 · A516 · A106)
  | 'UNS'                   // Unified Numbering System (S30400 · A92024 · C26000)
  | 'DIN'                   // Deutsches Institut für Normung (legacy · St37 · X5CrNi18-10)
  | 'JIS'                   // Japanese Industrial Standards (SS400 · SUS304)
  | 'GB'                    // Guobiao chino (Q235 · 304)
  | 'BS'                    // British Standards (legacy · BS 4360)
  | 'WNr'                   // Werkstoffnummer alemán (1.0570 · 1.4301 · 1.4404)
  | 'otra'

/** Forma o formato del producto metálico (laminado en caliente / frío ·
 *  extrudido · forjado · fundido · trefilado · etc.). */
export type FormatoProductoMetalico =
  | 'chapa'                 // hoja plana laminada (chapa fina · gruesa)
  | 'bobina'                // chapa enrollada (coil)
  | 'fleje'                 // chapa estrecha (slit · narrow strip)
  | 'pletina'               // barra rectangular plana laminada
  | 'perfil_estructural'    // IPN · IPE · HEA · HEB · HEM · UPN
  | 'perfil_hueco'          // tubo cuadrado/rectangular/circular estructural
  | 'tubo_sin_soldadura'    // seamless (alta presión · alta T)
  | 'tubo_soldado'          // ERW · SAW · HFI
  | 'barra_redonda'         // round bar
  | 'barra_cuadrada'        // square bar
  | 'barra_hexagonal'       // hex bar (mecanizado)
  | 'alambre'               // wire
  | 'cable'                 // multiple wire stranded
  | 'malla'                 // wire mesh · rejilla
  | 'tornilleria'           // tornillos · tuercas · arandelas
  | 'pieza_forjada'         // forging
  | 'pieza_fundida'         // casting (arena · coquilla · cera perdida · inyección)
  | 'pieza_estampada'       // stamping
  | 'pieza_mecanizada'      // machined part (custom)
  | 'lingote'               // ingot
  | 'palanquilla'           // billet
  | 'planchón'              // slab
  | 'tocho'                 // bloom
  | 'granalla'              // shot (decapado · pintura)
  | 'polvo_metalico'        // metal powder (impresión 3D · pulvimetalurgia)
  | 'soldadura_consumible'  // electrodo · alambre soldadura · varilla TIG
  | 'otro'

/** Proceso primario de fabricación / transformación. */
export type ProcesoTransformacionMetalica =
  | 'colada_continua'           // continuous casting
  | 'colada_lingote'            // ingot casting
  | 'fundicion_arena'           // sand casting
  | 'fundicion_coquilla'        // permanent mold casting
  | 'fundicion_inyectada'       // die casting
  | 'fundicion_cera_perdida'    // investment casting (lost wax)
  | 'forja_libre'               // open-die forging
  | 'forja_matriceria'          // closed-die forging (drop forging)
  | 'laminacion_caliente'       // hot rolling
  | 'laminacion_frio'           // cold rolling
  | 'extrusion'                 // extrusion (Al · Cu)
  | 'trefilado'                 // wire drawing
  | 'estampacion'               // stamping · cold forming
  | 'embuticion_profunda'       // deep drawing
  | 'mecanizado_arranque_viruta'// turning · milling · drilling
  | 'electroerosion'            // EDM (wire · sinker)
  | 'fabricacion_aditiva_metal' // metal AM · DMLS · SLM · EBM · WAAM
  | 'pulvimetalurgia'           // PM sintering
  | 'galvanizado_caliente'      // hot-dip galvanizing
  | 'galvanizado_electrolitico' // electroplating
  | 'anodizado'                 // anodizing (Al)
  | 'pintura_polvo'             // powder coating
  | 'pasivado'                  // passivation (acero inoxidable)
  | 'decapado'                  // pickling
  | 'pulido_mecanico'           // mechanical polishing
  | 'pulido_electrolitico'      // electropolishing
  | 'recocido'                  // annealing
  | 'normalizado'               // normalizing
  | 'temple'                    // quenching
  | 'revenido'                  // tempering
  | 'cementacion'               // carburizing
  | 'nitruracion'               // nitriding

/** Acabado superficial del producto entregado. */
export type AcabadoSuperficial =
  | 'bruto_laminacion'      // mill finish (rolled)
  | 'bruto_extrusion'       // mill finish (extruded)
  | 'bruto_fundicion'       // as-cast
  | 'bruto_forja'           // as-forged
  | 'mecanizado_basto'      // rough machined
  | 'mecanizado_fino'       // finish machined
  | 'rectificado'           // ground
  | 'pulido_satinado'       // satin finish
  | 'pulido_espejo'         // mirror finish
  | 'granallado'            // shot-blasted
  | 'decapado_pasivado'     // pickled & passivated
  | 'galvanizado_caliente'  // hot-dip galvanized
  | 'galvanizado_electro'   // electrogalvanized
  | 'anodizado_natural'     // natural anodized (Al)
  | 'anodizado_color'       // color anodized (Al)
  | 'pintura_polvo'         // powder coated
  | 'pintura_liquida'       // liquid paint
  | 'cromado'               // chromed
  | 'niquelado'             // nickel plated
  | 'estanado'              // tinned
  | 'esmaltado'             // enameled (porcelain)
  | 'otro'

/** Tratamiento térmico aplicado o requerido. */
export type TratamientoTermicoMetal =
  | 'sin_tratamiento'
  | 'recocido_recristalizacion'
  | 'recocido_globulizado'
  | 'normalizado'
  | 'temple_revenido'
  | 'temple_bonificado'         // hardened & tempered
  | 'temple_superficial_induccion'
  | 'temple_superficial_llama'
  | 'cementacion_temple'
  | 'nitruracion_gaseosa'
  | 'nitruracion_plasma'
  | 'carbonitruracion'
  | 'envejecimiento_artificial' // aging (Al series 2xxx · 6xxx · 7xxx)
  | 'solubilizacion'            // solution treatment (Al · acero inox)
  | 'estabilizado'              // stabilization (inox 321)
  | 'distension'                // stress relief
  | 'descarburacion'            // decarburizing

/** Certificado de inspección EN 10204 · trazabilidad colada. */
export type CertificadoInspeccionEN10204 =
  | 'tipo_2_1'              // declaración de conformidad sin resultados ensayo
  | 'tipo_2_2'              // certificado de ensayo no específico
  | 'tipo_3_1'              // certificado inspección específico (departamento independiente fabricante)
  | 'tipo_3_2'              // certificado inspección específico (organismo independiente externo · más exigente)

/** Estado del material en alcance CBAM. */
export type AlcanceCBAMMaterial =
  | 'no_aplica'             // ej. cobre · titanio · níquel (fuera Anexo I)
  | 'hierro_acero'          // alcance Anexo I CBAM
  | 'aluminio'              // alcance Anexo I CBAM
  | 'derivado_anexo_ii'     // productos derivados (tornillería de hierro · perfiles aluminio · etc.)

// ============================================================================
// MARCO ESTRUCTURAS METÁLICAS · EN 1090
// ============================================================================

/** Clase de ejecución según EN 1090-2 (acero) / EN 1090-3 (aluminio).
 *
 *  Determina nivel de control fabricación, cualificación soldadores,
 *  trazabilidad. Asignada por proyectista según consecuencia fallo +
 *  uso (estático/dinámico) + categoría servicio.
 */
export type ClaseEjecucionEN1090 =
  | 'EXC1'                  // bajo · estructuras secundarias agrícolas/auxiliares
  | 'EXC2'                  // medio · estructuras edificación estándar
  | 'EXC3'                  // alto · puentes · grúas · estructuras 5+ plantas
  | 'EXC4'                  // muy alto · estructuras críticas seguridad (centrales · militares · ferroviaria pesada)

/** Estado del control de producción en fábrica FPC (Factory Production Control)
 *  según EN 1090-1 Anexo A. */
export type EstadoFPCEN1090 =
  | 'no_iniciado'           // no hay sistema FPC documentado
  | 'documentado_no_certificado'
  | 'certificado_organismo_notificado' // FPC certificado por NB · habilita marcado CE

// ============================================================================
// MARCO EQUIPOS A PRESIÓN · PED Dir. 2014/68/UE
// ============================================================================

/** Categoría PED según Art. 4.1 + diagramas Anexo II.
 *
 *  Función de presión máxima admisible (PS), volumen (V) o diámetro nominal
 *  (DN), tipo de fluido (grupo 1 peligroso / grupo 2 otros) y estado físico
 *  (gas / líquido).
 *
 *  Determina rigor evaluación conformidad e intervención Notified Body.
 */
export type CategoriaPED =
  | 'art_4_3'               // buena práctica ingeniería (sin marcado CE PED)
  | 'cat_I'                 // categoría I (módulo A · autoevaluación fabricante)
  | 'cat_II'                // categoría II (módulo A2 / D1 / E1 · vigilancia Notified Body)
  | 'cat_III'               // categoría III (módulo B · D · E · F · H)
  | 'cat_IV'                // categoría IV (módulo B + D / F · G / H1)

/** Módulo de evaluación de conformidad PED.
 *
 *  Combina con la categoría para definir el rigor del proceso de certificación.
 *  Cat I solo admite A. Cat II admite A2/D1/E1. Cat III admite B + D/E/F o H.
 *  Cat IV exige B+D/F o G o H1.
 */
export type ModuloEvaluacionPED =
  | 'A'                     // control interno producción
  | 'A2'                    // control interno + chequeos finales aleatorios NB
  | 'B_design'              // examen UE diseño (CE-type examination diseño)
  | 'B_type'                // examen UE de tipo (CE-type examination producción)
  | 'C2'                    // conformidad con tipo + chequeos finales aleatorios NB
  | 'D'                     // garantía calidad producción
  | 'D1'                    // garantía calidad producción sin B previo
  | 'E'                     // garantía calidad producto
  | 'E1'                    // garantía calidad inspección producto sin B
  | 'F'                     // verificación producto
  | 'G'                     // verificación unidad (one-off)
  | 'H'                     // garantía calidad total
  | 'H1'                    // garantía calidad total + examen diseño

/** Grupo de fluido según Art. 13 PED.
 *
 *  - grupo_1: fluidos peligrosos (CLP Reg. 1272/2008 · clase explosivo,
 *    inflamable, tóxico, comburente, gas inflamable, líquido inflamable
 *    cat. 1 o 2).
 *  - grupo_2: todos los demás fluidos (incluido vapor de agua, aire
 *    comprimido neutro, agua caliente).
 */
export type GrupoFluidoPED = 'grupo_1' | 'grupo_2'

/** Estado físico del fluido contenido en el equipo a presión. */
export type EstadoFluidoPED =
  | 'gas'                   // gas a temperatura servicio · presión > vapor saturado
  | 'liquido'               // líquido a temperatura servicio · presión ≤ vapor saturado
  | 'vapor'                 // gas a temperatura ≤ punto saturación a esa presión

/** Tipo de equipo a presión según Anexo I PED + normas armonizadas. */
export type TipoEquipoPresion =
  | 'recipiente_simple_aire' // EN 286 (compresores aire pequeños)
  | 'recipiente_a_presion'   // EN 13445 (chemical · pharma · oil&gas vessels)
  | 'caldera_acuotubular'    // EN 12952 (water-tube boiler · alta P · alta T)
  | 'caldera_pirotubular'    // EN 12953 (fire-tube boiler · vapor industrial)
  | 'intercambiador_calor'   // shell-and-tube · placa · espiral
  | 'reactor_quimico'        // batch · CSTR · PFR
  | 'tuberia_presion'        // EN 13480 (industrial piping)
  | 'accesorio_seguridad'    // PRV · disco ruptura · venteo emergencia
  | 'accesorio_a_presion'    // bridas · válvulas · juntas · racores presión
  | 'columna_destilacion'    // distillation column
  | 'horno_proceso'          // process furnace (presurizado)
  | 'autoclave'              // sterilization · vulcanization · curing
  | 'cilindro_gas_industrial'// botella gas comprimido
  | 'tanque_almacenamiento'  // tanque presurizado (no atmosférico)
  | 'otro'

/** Atmósfera explosiva según ATEX Dir. 2014/34/UE. */
export type CategoriaATEX =
  | 'no_aplica'             // equipo no destinado a uso en ATEX
  | 'I_M1'                  // minería subterránea · muy alta seguridad
  | 'I_M2'                  // minería subterránea · alta seguridad
  | 'II_1G'                 // superficie · gases · zona 0 (atmósfera continua)
  | 'II_1D'                 // superficie · polvos · zona 20
  | 'II_2G'                 // superficie · gases · zona 1 (atmósfera ocasional)
  | 'II_2D'                 // superficie · polvos · zona 21
  | 'II_3G'                 // superficie · gases · zona 2 (atmósfera infrecuente)
  | 'II_3D'                 // superficie · polvos · zona 22

// ============================================================================
// MARCO SOLDADURA · cualificaciones procesos y soldadores
// ============================================================================

/** Proceso de soldadura según ISO 4063 numeración. */
export type ProcesoSoldadura =
  | '111_SMAW'              // shielded metal arc welding (electrodo revestido · MMA)
  | '114_FCAW_self'         // flux-cored self-shielded
  | '121_SAW'               // submerged arc welding
  | '131_MIG'               // gas metal arc welding · gas inerte
  | '135_MAG'               // gas metal arc welding · gas activo
  | '136_FCAW_gas'          // flux-cored gas-shielded
  | '141_TIG'               // gas tungsten arc welding (GTAW)
  | '15_plasma'             // plasma arc welding
  | '21_RW'                 // resistance spot welding
  | '52_laser'              // laser beam welding
  | '15_micro_plasma'       // micro plasma arc
  | 'brazing'               // soldadura fuerte (>450°C aleación filler · sin fusión base)
  | 'soldering'             // soldadura blanda (<450°C)

/** Certificación calidad fabricación soldadura ISO 3834. */
export type NivelISO3834 =
  | 'no_aplica'
  | '3834_2_completo'       // comprehensive (recipientes a presión · estructuras críticas)
  | '3834_3_estandar'       // standard (estructuras EN 1090 medio nivel)
  | '3834_4_elemental'      // elementary (estructuras menores)

/** Cualificación del soldador según ISO 9606 (acero · aluminio · cobre). */
export type NormaCualificacionSoldador =
  | 'ISO_9606_1'            // aceros (todas las familias)
  | 'ISO_9606_2'            // aluminio y aleaciones
  | 'ISO_9606_3'            // cobre y aleaciones
  | 'ISO_9606_4'            // níquel y aleaciones
  | 'ISO_9606_5'            // titanio · circonio · molibdeno
  | 'ISO_14732'             // operadores soldadura mecanizada/automatizada

// ============================================================================
// MARCO ENSAYOS NO DESTRUCTIVOS (END/NDT)
// ============================================================================

/** Método END/NDT según ISO 9712. */
export type MetodoEND =
  | 'VT'                    // visual testing
  | 'PT'                    // penetrant testing (líquidos penetrantes)
  | 'MT'                    // magnetic particle testing
  | 'UT'                    // ultrasonic testing
  | 'RT'                    // radiographic testing
  | 'ET'                    // eddy current testing
  | 'LT'                    // leak testing
  | 'AE'                    // acoustic emission
  | 'TT'                    // thermography
  | 'PAUT'                  // phased array UT
  | 'TOFD'                  // time-of-flight diffraction (avanzado UT)

/** Nivel del inspector END según ISO 9712. */
export type NivelInspectorEND = 'N1' | 'N2' | 'N3'

// ============================================================================
// REFERENCIA DOCUMENTAL TÉCNICA (planos · WPS/PQR · etc.)
// ============================================================================

/** Referencia a documentación técnica subida a Supabase Storage. */
export type DocumentoTecnicoRef = {
  /** Identificador interno del documento (UUID o slug). */
  document_id: string
  /** URL firmada de descarga (Supabase Storage). */
  document_url: string
  /** Hash SHA-256 del fichero (integridad + anclaje XDC opcional). */
  document_hash_sha256?: string
  /** Tipo de documento técnico. */
  document_type:
    | 'plano_2d'              // 2D drawing (PDF · DWG · DXF)
    | 'modelo_3d'             // 3D CAD (STEP · IGES · STL · X_T)
    | 'wps_pqr'               // welding procedure specification + qualification record
    | 'wpqr'                  // welder performance qualification record
    | 'reporte_end'           // NDT report
    | 'certificado_material'  // EN 10204 cert
    | 'certificado_cbam'      // CBAM declaration + verifier report
    | 'reporte_presion_prueba'// pressure test report
    | 'declaracion_conformidad_ue' // EU declaration of conformity
    | 'manual_instrucciones'  // user manual (PED Anexo I · Maquinaria)
    | 'analisis_riesgos'      // risk assessment (Maquinaria · PED)
    | 'memoria_calculo'       // calculation memo
    | 'esquema_fabricacion'   // fabrication drawing
    | 'instruccion_tecnica'   // technical instruction
    | 'otro'
}

// ============================================================================
// SUB-CATEGORÍA 1 · MATERIAL METALÚRGICO (DPPProduct)
// ============================================================================

/** Ficha de material metalúrgico estándar (semi-producto o producto acabado
 *  de catálogo).
 *
 *  Caso de uso: una acería publica corrugado EN 10025 S235JR Ø12 en bobinas
 *  de 2 t · CBAM declarado · trazabilidad por colada · certificado EN 10204
 *  tipo 3.1 emitido por departamento independiente.
 *
 *  Extiende DPPProduct porque es producto físico con DPP completo (ESPR
 *  acero/aluminio aplicará escalonado 2027-2030 según reglamento delegado).
 */
export type MaterialMetalurgicoProduct = DPPProduct & {
  sub_categoria: 'material_metalurgico'

  // -------------------- IDENTIFICACIÓN METAL --------------------
  /** Familia base del metal. */
  familia_metalica: FamiliaMetalica

  /** Sistema de designación normativo principal. */
  sistema_designacion: SistemaDesignacionMetal

  /** Código de designación según el sistema declarado.
   *  Ejemplos: 'S355J2+N' (EN 10025) · '316L' (AISI) · '1.4404' (WNr) ·
   *  'EN AW-6063-T6' (EN 573 + EN 755). */
  designacion_codigo: string

  /** Aleaciones alternativas equivalentes (cross-reference internacional).
   *  Ejemplo: para AISI 304 → ['1.4301' (WNr), 'X5CrNi18-10' (EN 10088),
   *  'SUS304' (JIS)]. */
  designaciones_equivalentes?: string[]

  /** Forma física del producto. */
  formato: FormatoProductoMetalico

  // -------------------- FABRICACIÓN --------------------
  /** Proceso principal de obtención del formato declarado. */
  proceso_principal: ProcesoTransformacionMetalica

  /** Procesos secundarios aplicados al material (tratamientos térmicos ·
   *  acabados · revestimientos). */
  procesos_secundarios?: ProcesoTransformacionMetalica[]

  /** Tratamiento térmico final del producto entregado. */
  tratamiento_termico: TratamientoTermicoMetal

  /** Acabado superficial del producto entregado. */
  acabado_superficial: AcabadoSuperficial

  // -------------------- DIMENSIONES / TOLERANCIAS --------------------
  /** Dimensión principal del producto (mm).
   *  Significado contextual según `formato`:
   *  - chapa/bobina/fleje: espesor
   *  - barra redonda/perfil hueco: diámetro exterior
   *  - barra cuadrada/hexagonal: lado / entre caras
   *  - perfil estructural: canto (e.g. 200 para HEB200)
   *  - alambre: diámetro nominal
   */
  dimension_principal_mm: number

  /** Dimensiones complementarias relevantes (mm). */
  dimension_secundaria_mm?: number
  dimension_terciaria_mm?: number

  /** Norma de tolerancias dimensionales aplicable. */
  norma_tolerancias?:
    | 'EN_10029'              // chapas acero laminadas en caliente
    | 'EN_10051'              // chapas y flejes laminados en caliente bobina
    | 'EN_10058'              // pletinas y barras acero forjado
    | 'EN_10059'              // barras cuadradas acero laminado
    | 'EN_10060'              // barras redondas acero laminado
    | 'EN_10061'              // barras hexagonales acero
    | 'EN_10079'              // definiciones productos acero
    | 'EN_10162'              // perfiles acero conformados en frío
    | 'EN_10210_2'            // perfiles huecos acero estructural en caliente
    | 'EN_10219_2'            // perfiles huecos acero conformados en frío
    | 'EN_485_3'              // aluminio chapa laminada
    | 'EN_755_3'              // aluminio extrudido (barra cuadrada/rectangular)
    | 'EN_755_8'              // aluminio extrudido (barra redonda)
    | 'EN_755_9'              // aluminio extrudido (perfil estándar)
    | 'ISO_2768_m'            // tolerancias generales medio
    | 'ISO_2768_f'            // tolerancias generales fino
    | 'ISO_286_H7'            // tolerancia ajuste H7 mecanizado
    | 'otra'

  /** Clase de tolerancia (cuando la norma define clases · ej. EN 10029
   *  clases A/B/C/D para chapas acero). */
  clase_tolerancia?: string

  // -------------------- COMPOSICIÓN / PROPIEDADES MECÁNICAS --------------------
  /** Composición química nominal (% peso) por elemento. Subset relevante;
   *  composición completa se publica en certificado EN 10204 vinculado.
   *  Ejemplo acero S355J2+N: { C: 0.20, Mn: 1.60, Si: 0.55, P: 0.025, S: 0.025 } */
  composicion_quimica_nominal?: Record<string, number>

  /** Límite elástico mínimo Re (MPa). */
  limite_elastico_min_mpa?: number
  /** Resistencia a tracción mínima Rm (MPa). */
  resistencia_traccion_min_mpa?: number
  /** Alargamiento mínimo A% sobre L0=5d0 (%). */
  alargamiento_min_pct?: number
  /** Resiliencia mínima KV J a -20°C (típica aceros estructurales J2 / J0 / JR). */
  resiliencia_min_j_a_temperatura_c?: { resilencia_j: number; temperatura_c: number }
  /** Dureza típica del producto entregado (Brinell HB · Rockwell HRC · Vickers HV). */
  dureza_nominal?: { escala: 'HB' | 'HRC' | 'HRB' | 'HV' | 'HK'; valor: number }

  // -------------------- TRAZABILIDAD COLADA --------------------
  /** Número de colada (heat number) del fabricante origen. Obligatorio para
   *  certificados EN 10204 3.1 y 3.2. Trazable a registro fundición/acería. */
  heat_number?: string

  /** Certificado de inspección EN 10204 emitido con el producto. */
  certificado_inspeccion_en_10204?: CertificadoInspeccionEN10204

  /** ID del organismo independiente emisor (si EN 10204 tipo 3.2 · ej.
   *  'BV-IT' Bureau Veritas Italia · 'TUV-DE' TÜV Rheinland Alemania).
   *  Para tipo 3.1 no aplica (fabricante emite). */
  emisor_certificado_3_2?: string

  // -------------------- CBAM (Carbon Border Adjustment Mechanism) --------------------
  /** Alcance CBAM del material según Anexo I Reg. UE 2023/956. */
  alcance_cbam: AlcanceCBAMMaterial

  /** Si el material está en alcance CBAM, los datos CBAM se rellenan en
   *  `DPPSustainability.carbon_footprint_cbam` (heredado de DPPProduct).
   *  Este flag únicamente bandera obligatoriedad declaración trimestral
   *  importador UE + entrega certificados CBAM desde 1-ene-2026. */
  cbam_declaracion_trimestral_obligatoria?: boolean

  // -------------------- MARCADO CE / EN 1090 --------------------
  /** ¿Producto destinado a uso como producto construcción según EN 1090?
   *  Si true: requiere marcado CE + Declaración Prestaciones + FPC certificado. */
  uso_como_producto_construccion_en_1090?: boolean

  /** Clase de ejecución EN 1090 mínima admisible para este material
   *  (asignada por proyectista). */
  clase_ejecucion_en_1090_admisible?: ClaseEjecucionEN1090[]

  /** Número Notified Body que certificó el FPC EN 1090-1 del fabricante
   *  (4 dígitos · ej. '0099' AENOR · '0036' TÜV Rheinland). */
  fpc_en_1090_notified_body?: string

  // -------------------- REACH / RoHS --------------------
  /** ¿El material contiene alguna sustancia SVHC ≥ 0,1% peso?
   *  REACH Art. 33 + 7. Si true, `svhc_substances` enumera CAS + concentración. */
  contiene_svhc_reach?: boolean

  /** Lista de sustancias SVHC con su número CAS y concentración (% peso). */
  svhc_substances?: Array<{
    cas_number: string
    nombre: string
    concentracion_pct: number
  }>

  /** ¿Marca destinada a aplicación electrónica / electrodoméstica donde
   *  RoHS Dir. 2011/65/UE aplica? */
  alcance_rohs?: boolean

  // -------------------- DOCUMENTOS TÉCNICOS --------------------
  /** Documentación adjunta (certificados · planos · reportes). */
  documentos_tecnicos?: DocumentoTecnicoRef[]
}

// ============================================================================
// SUB-CATEGORÍA 2 · EQUIPO A PRESIÓN / MAQUINARIA (DPPProduct)
// ============================================================================

/** Ficha de equipo a presión PED o maquinaria con marcado CE.
 *
 *  Caso de uso: fabricante de calderas pirotubulares EN 12953 publica una
 *  caldera vapor 8 t/h · 12 bar · cat. III · módulo H1 · NB 0036 · ATEX
 *  no aplica · servicio agua sobrecalentada.
 *
 *  Extiende DPPProduct porque es producto físico con DPP completo + cadena
 *  custodia + sello PED en custody chain.
 */
export type EquipoPresionProduct = DPPProduct & {
  sub_categoria: 'equipo_presion'

  /** Tipo de equipo a presión. */
  tipo_equipo: TipoEquipoPresion

  // -------------------- CATEGORIZACIÓN PED --------------------
  /** Categoría PED resultante del análisis Art. 4 + Anexo II.
   *  'art_4_3' = buena práctica ingeniería · sin marcado CE PED. */
  categoria_ped: CategoriaPED

  /** Módulo evaluación conformidad aplicado · obligatorio si cat I-IV. */
  modulo_evaluacion_ped?: ModuloEvaluacionPED

  /** Notified Body interventor (4 dígitos identificador NANDO). Obligatorio
   *  para módulos B · C2 · D · D1 · E · E1 · F · G · H · H1. */
  notified_body_id?: string

  /** Número certificado UE de tipo / examen diseño (módulos B). */
  certificado_examen_ue_id?: string

  // -------------------- PARÁMETROS SERVICIO --------------------
  /** Presión máxima admisible PS (bar relativos). */
  presion_maxima_admisible_bar: number

  /** Presión mínima admisible PS_min (bar relativos · vacío o sobrepresión negativa).
   *  Default 0 si no aplica vacío. */
  presion_minima_admisible_bar?: number

  /** Volumen interior V (litros). NULL si es tubería (usar DN). */
  volumen_litros?: number

  /** Diámetro nominal DN (mm). Solo para tuberías. */
  diametro_nominal_dn?: number

  /** Temperatura mínima admisible TS_min (°C). */
  temperatura_minima_admisible_c: number

  /** Temperatura máxima admisible TS_max (°C). */
  temperatura_maxima_admisible_c: number

  /** Fluido contenido / servicio del equipo. */
  fluido_servicio: {
    /** Nombre técnico del fluido (e.g. 'agua sobrecalentada', 'vapor saturado',
     *  'aire comprimido', 'amoniaco', 'nitrógeno líquido'). */
    nombre: string
    /** Grupo PED Art. 13. */
    grupo_ped: GrupoFluidoPED
    /** Estado físico del fluido en condiciones servicio. */
    estado: EstadoFluidoPED
    /** Número CAS del fluido si peligroso (opcional). */
    cas_number?: string
    /** Frases H aplicables CLP (e.g. ['H220', 'H280']) si peligroso. */
    h_codes?: string[]
  }

  // -------------------- ATEX --------------------
  /** Categoría ATEX del equipo (Dir. 2014/34/UE). */
  categoria_atex: CategoriaATEX

  /** Marcado ATEX completo si aplica (e.g. 'II 2G Ex db IIB T4 Gb').
   *  Codifica grupo · categoría · zona · tipo protección · clase gas ·
   *  clase temperatura · nivel protección equipo. */
  marcado_atex_completo?: string

  /** Notified Body ATEX (puede diferir del PED). */
  notified_body_atex_id?: string

  // -------------------- MAQUINARIA --------------------
  /** ¿El equipo cae también bajo Reg. UE 2023/1230 Maquinaria
   *  (deroga Dir. 2006/42/CE desde 20-ene-2027)?
   *  Aplica si tiene partes móviles motorizadas para operación deseada. */
  alcance_reglamento_maquinaria?: boolean

  /** Si aplica Reg. Maquinaria · categoría según Anexo I (alto riesgo / IA
   *  embebida / etc.). NULL si no aplica. */
  categoria_maquinaria?:
    | 'estandar'                    // máquina estándar sin IA seguridad
    | 'anexo_i_alto_riesgo'         // anexo I alto riesgo Reg. 2023/1230
    | 'componente_seguridad'        // safety component
    | 'maquinaria_ai'               // sistema IA con función seguridad

  // -------------------- NORMA ARMONIZADA APLICADA --------------------
  /** Norma armonizada principal aplicada para presunción conformidad. */
  norma_armonizada_principal?:
    | 'EN_13445'             // recipientes a presión no sometidos a fuego
    | 'EN_13480'             // tuberías a presión metálicas
    | 'EN_12952'             // calderas acuotubulares
    | 'EN_12953'             // calderas pirotubulares
    | 'EN_286'               // recipientes simples a presión aire
    | 'EN_ISO_4126'          // dispositivos seguridad
    | 'EN_ISO_3834'          // calidad fabricación soldadura
    | 'EN_ISO_9001'          // gestión calidad
    | 'EN_ISO_14001'         // gestión ambiental
    | 'otra'

  /** Otras normas armonizadas aplicadas (ej. EN ISO 16852 dispositivos
   *  cortafuegos · EN 14470 armarios seguridad · etc.). */
  normas_armonizadas_complementarias?: string[]

  // -------------------- PRUEBA HIDROSTÁTICA / FINAL --------------------
  /** Presión prueba hidrostática (bar). Típica 1,43 × PS según EN 13445-5
   *  o 1,5 × PS según ASME VIII. */
  presion_prueba_hidrostatica_bar?: number

  /** Fecha de la prueba final hidrostática o equivalente (ISO date). */
  fecha_prueba_final?: string

  /** Resultado prueba final. */
  resultado_prueba_final?: 'satisfactorio' | 'con_observaciones' | 'no_satisfactorio_repetir'

  // -------------------- SOLDADURA --------------------
  /** Nivel ISO 3834 fabricación soldadura aplicado por el fabricante. */
  nivel_iso_3834?: NivelISO3834

  /** Procesos soldadura usados en la fabricación. */
  procesos_soldadura_usados?: ProcesoSoldadura[]

  /** Norma cualificación procesos soldadura aplicada (típicamente ISO 15614). */
  norma_cualificacion_proceso_soldadura?: 'ISO_15614_1' | 'ISO_15614_2' | 'ISO_15614_8' | 'ASME_IX' | 'otra'

  /** Norma cualificación soldadores aplicada. */
  norma_cualificacion_soldador?: NormaCualificacionSoldador

  // -------------------- ENSAYOS NO DESTRUCTIVOS --------------------
  /** Métodos END aplicados al equipo durante fabricación. */
  metodos_end_aplicados?: MetodoEND[]

  /** Nivel mínimo del inspector END requerido (ISO 9712). */
  nivel_minimo_inspector_end?: NivelInspectorEND

  // -------------------- DOCUMENTACIÓN OBLIGATORIA --------------------
  /** Documentación técnica adjunta. Obligatoria para PED Anexo I:
   *  manual instrucciones · declaración conformidad UE · análisis riesgos ·
   *  memoria cálculo · plano fabricación · reportes END · reporte prueba. */
  documentos_tecnicos: DocumentoTecnicoRef[]

  // -------------------- VIDA ÚTIL Y SEGUIMIENTO --------------------
  /** Vida útil de diseño (años). Determina periodicidad inspecciones
   *  reglamentarias (ITC EP-1 en España). */
  vida_util_diseno_anios?: number

  /** Periodicidad inspección periódica reglamentaria (meses). */
  periodicidad_inspeccion_periodica_meses?: number
}

// ============================================================================
// SUB-CATEGORÍA 3 · NECESIDAD METALÚRGICA (DPPProduct)
// ============================================================================

/** Pieza o material a fabricar a medida que un comprador publica para que
 *  oferten talleres / fabricantes.
 *
 *  Caso de uso: una constructora publica necesidad de 480 m² de chapa acero
 *  S355J2+N de 8 mm con perforación CNC y galvanizado caliente. Solicita
 *  certificado EN 10204 3.1 + cumplimiento CBAM si importado · entrega DAP
 *  Valencia.
 *
 *  Extiende DPPProduct porque la pieza producida tendrá DPP propio en el
 *  momento de fabricación · el comprador puede pre-rellenar campos
 *  obligatorios desde la necesidad.
 */
export type NecesidadMetalurgicaProduct = DPPProduct & {
  sub_categoria: 'necesidad_metalurgica'

  // -------------------- DESCRIPCIÓN PIEZA --------------------
  /** Familia metal requerida. */
  familia_metalica_requerida: FamiliaMetalica

  /** Designación normativa preferida o aceptada. */
  designacion_preferida?: string

  /** Designaciones alternativas que el comprador acepta. */
  designaciones_alternativas?: string[]

  /** Formato físico requerido. */
  formato_requerido: FormatoProductoMetalico

  /** Proceso fabricación admitido (varios si el comprador es flexible).
   *  Vacío = sin restricción. */
  procesos_fabricacion_admitidos?: ProcesoTransformacionMetalica[]

  /** Tratamiento térmico mínimo exigido. */
  tratamiento_termico_minimo?: TratamientoTermicoMetal

  /** Acabado superficial requerido. */
  acabado_superficial_requerido: AcabadoSuperficial

  // -------------------- CANTIDADES Y PLAZOS --------------------
  /** Cantidad solicitada (uds o kg o m según producto). */
  cantidad_solicitada: number

  /** Unidad de la cantidad solicitada. */
  unidad_cantidad: 'uds' | 'kg' | 't' | 'm' | 'm2' | 'm3' | 'litros'

  /** Plazo entrega objetivo (días naturales desde adjudicación). */
  plazo_entrega_objetivo_dias?: number

  /** Plazo entrega máximo aceptable (días). */
  plazo_entrega_maximo_dias?: number

  // -------------------- TOLERANCIAS Y CALIDAD --------------------
  /** Tolerancias dimensionales generales aplicables.
   *  ISO 2768-m (medio) es el default industrial; H7 ajustes mecanizados;
   *  más fino para piezas críticas. */
  norma_tolerancias_dimensionales:
    | 'ISO_2768_m'
    | 'ISO_2768_f'
    | 'ISO_2768_v'
    | 'ISO_286_H7'
    | 'ISO_286_H6'
    | 'EN_22768'
    | 'GD_T_ISO_1101'
    | 'a_definir_en_plano'

  /** Tolerancias geométricas GD&T si aplica (ISO 1101). */
  tolerancias_geometricas_gd_t?: boolean

  /** Rugosidad superficial máxima Ra (µm) según ISO 1302. */
  rugosidad_maxima_ra_um?: number

  /** Certificado inspección EN 10204 requerido. */
  certificado_inspeccion_requerido?: CertificadoInspeccionEN10204

  /** ¿Requiere ensayos no destructivos? */
  end_requeridos?: MetodoEND[]

  /** Nivel inspector END mínimo requerido (ISO 9712). */
  nivel_inspector_end_minimo?: NivelInspectorEND

  // -------------------- CBAM / EUDR / REACH (compliance del comprador) --------------------
  /** ¿El comprador exige cumplimiento CBAM (declaración + certificados)?
   *  Aplica si importador UE de hierro/acero/aluminio Anexo I. */
  exige_cumplimiento_cbam?: boolean

  /** ¿Pieza destinada a uso construcción EN 1090 + marcado CE? */
  destino_construccion_en_1090?: boolean

  /** Clase ejecución mínima EN 1090 requerida si construcción. */
  clase_ejecucion_en_1090_requerida?: ClaseEjecucionEN1090

  /** ¿Pieza destinada a uso automoción + IATF 16949 fabricante? */
  destino_automocion_iatf?: boolean

  /** Nivel PPAP requerido si IATF (1-5 según AIAG PPAP 4ª ed.). */
  nivel_ppap_requerido?: 1 | 2 | 3 | 4 | 5

  /** ¿Pieza destinada a equipo a presión PED? Si true determina cualif.
   *  soldadura + END + trazabilidad + certificado 3.1/3.2 mínimo. */
  destino_equipo_presion_ped?: boolean

  // -------------------- DOCUMENTOS TÉCNICOS DEL COMPRADOR --------------------
  /** Documentación técnica que el comprador adjunta (planos · modelo 3D ·
   *  memoria cálculo · pliego prescripciones). */
  documentos_tecnicos_comprador: DocumentoTecnicoRef[]

  // -------------------- TÉRMINOS COMERCIALES --------------------
  /** Incoterm propuesto por el comprador (puede negociarse). */
  incoterm_propuesto?:
    | 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF'
    | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP'

  /** Modalidad pago propuesta (Capa A UniversalProduct). */
  modalidad_pago_propuesta: '02_b2b_nacional' | '03_servicios' | '04_importacion'

  /** Países de origen aceptables para la pieza (filtrar oferentes).
   *  Vacío = sin restricción geográfica. */
  paises_origen_aceptables?: ISOCountryCode[]

  /** Países de origen NO aceptables (sanciones · acuerdos cliente · ESG).
   *  Vacío = sin restricción. */
  paises_origen_excluidos?: ISOCountryCode[]

  // -------------------- VOLUMEN ANUAL ESTIMADO --------------------
  /** ¿Es necesidad puntual o contrato suministro recurrente? */
  tipo_demanda: 'puntual' | 'recurrente_anual'

  /** Si recurrente_anual: volumen anual estimado (misma unidad que
   *  `unidad_cantidad`). */
  volumen_anual_estimado?: number
}

// ============================================================================
// SUB-CATEGORÍA 4 · SERVICIO METALÚRGICO (UniversalProduct)
// ============================================================================

/** Tipo de servicio metalúrgico ofertable por taller / empresa especializada. */
export type TipoServicioMetalurgico =
  | 'soldadura'                         // soldadura general (TIG · MIG/MAG · etc.)
  | 'soldadura_estructural_en_1090'     // soldadura certificada estructuras EN 1090
  | 'soldadura_presion_iso_3834'        // soldadura equipos a presión PED + ISO 3834
  | 'mecanizado_convencional'           // torno · fresa convencional
  | 'mecanizado_cnc'                    // CNC 3 ejes
  | 'mecanizado_cnc_5_ejes'             // CNC 5 ejes (piezas complejas aero / médico)
  | 'electroerosion_hilo'               // wire EDM
  | 'electroerosion_penetracion'        // sinker EDM
  | 'corte_oxicorte'                    // oxy-fuel cutting
  | 'corte_plasma'                      // plasma cutting
  | 'corte_laser'                       // laser cutting
  | 'corte_chorro_agua'                 // waterjet
  | 'plegado_chapa'                     // press brake bending
  | 'cilindrado_chapa'                  // rolling
  | 'estampacion_serie'                 // stamping production
  | 'forja_libre'                       // open-die forging
  | 'forja_matriceria'                  // closed-die forging
  | 'fundicion_arena'                   // sand casting
  | 'fundicion_inyectada'               // die casting (Al · Zn)
  | 'fundicion_cera_perdida'            // investment casting
  | 'fabricacion_aditiva_metal'         // metal AM (DMLS · SLM · WAAM)
  | 'tratamiento_termico'               // recocido · temple · revenido · nitruración
  | 'tratamiento_superficial_galvanizado'
  | 'tratamiento_superficial_anodizado'
  | 'tratamiento_superficial_pintura_polvo'
  | 'tratamiento_superficial_cromado'
  | 'decapado_pasivado'                 // pickling & passivation acero inoxidable
  | 'pulido_industrial'
  | 'ensayos_no_destructivos'           // END/NDT (UT · RT · MT · PT · etc.)
  | 'inspeccion_dimensional'            // CMM · láser · tridimensional
  | 'metalografia_laboratorio'          // micro / macrografía · análisis fallo
  | 'analisis_quimico_laboratorio'      // OES · XRF · GD-OES
  | 'ingenieria_estructural_en_1090'    // proyecto + memoria cálculo EN 1990-EN 1999
  | 'ingenieria_recipientes_ped'        // proyecto + cálculo EN 13445 / ASME VIII
  | 'consultoria_compliance_ped'        // organismo asesor evaluación PED
  | 'consultoria_compliance_cbam'       // asesoría declaración CBAM importador UE
  | 'auditoria_iso_3834'                // auditoría calidad soldadura
  | 'inspeccion_reglamentaria_ep'       // inspecciones periódicas equipos presión (OCA España)
  | 'reparacion_recargue_soldadura'     // weld repair · cladding
  | 'desmantelamiento_chatarra'         // demolition + scrap recovery
  | 'reciclaje_metales'                 // metal recycling (chatarra circular)
  | 'otro'

/** Modelo de cobro del servicio metalúrgico. */
export type ModeloCobroServicioMetalurgico =
  | 'por_hora'                          // tarifa hora/operario
  | 'por_pieza'                         // tarifa unitaria pieza
  | 'por_kilo'                          // tarifa por kg material procesado
  | 'por_metro_lineal'                  // tarifa por metro (corte · soldadura)
  | 'por_metro_cuadrado'                // tarifa m² (tratamiento superficial)
  | 'por_proyecto'                      // tarifa cerrada proyecto
  | 'tarifa_contractual'                // contrato suministro plurianual
  | 'a_negociar'

/** Ficha de servicio metalúrgico ofrecido por un taller / empresa.
 *
 *  Caso de uso: taller de mecanizado CNC 5 ejes publica capacidad para
 *  piezas Ti grado 5 hasta Ø 400 mm con tolerancia ISO 286 H6 · ofrece
 *  certificado dimensional CMM Zeiss + reporte FAI · IATF 16949 + AS 9100.
 *
 *  Extiende solo UniversalProduct porque es servicio · no producto físico ·
 *  el DPP corresponde a la pieza fabricada (que el cliente aporta como
 *  necesidad o que se genera al cerrar pedido).
 */
export type ServicioMetalurgicoProduct = UniversalProduct & {
  sub_categoria: 'servicio_metalurgico'

  /** Tipo principal de servicio ofertado. */
  tipo_servicio: TipoServicioMetalurgico

  /** Tipos secundarios ofertados (taller multi-proceso). */
  tipos_servicio_complementarios?: TipoServicioMetalurgico[]

  // -------------------- CAPACIDADES TÉCNICAS --------------------
  /** Familias de metal procesables. */
  familias_metal_procesables: FamiliaMetalica[]

  /** Procesos soldadura disponibles si servicio incluye soldadura. */
  procesos_soldadura_disponibles?: ProcesoSoldadura[]

  /** Nivel ISO 3834 certificado del taller (si soldadura). */
  nivel_iso_3834_certificado?: NivelISO3834

  /** Normas cualificación procesos soldadura aplicadas. */
  normas_cualificacion_proceso_soldadura?: Array<'ISO_15614_1' | 'ISO_15614_2' | 'ISO_15614_8' | 'ASME_IX' | 'otra'>

  /** Normas cualificación soldadores aplicadas. */
  normas_cualificacion_soldador?: NormaCualificacionSoldador[]

  /** Métodos END/NDT ofrecidos (si servicio incluye inspección). */
  metodos_end_ofrecidos?: MetodoEND[]

  /** Nivel máximo de inspectores END en plantilla (ISO 9712). */
  nivel_maximo_inspector_end?: NivelInspectorEND

  // -------------------- LÍMITES FÍSICOS DEL TALLER --------------------
  /** Dimensión máxima procesable (mm) sobre cualquier eje.
   *  Ejemplo: 6000 = pieza máx 6 m. */
  dimension_maxima_procesable_mm?: number

  /** Peso máximo procesable por pieza (kg).
   *  Ejemplo: 25000 = puente grúa 25 t. */
  peso_maximo_procesable_kg?: number

  /** Espesor mínimo procesable (mm · relevante corte / soldadura fina). */
  espesor_minimo_procesable_mm?: number

  /** Espesor máximo procesable (mm). */
  espesor_maximo_procesable_mm?: number

  /** Tolerancia dimensional mínima alcanzable (mm). */
  tolerancia_minima_alcanzable_mm?: number

  /** Rugosidad mínima alcanzable Ra (µm). */
  rugosidad_minima_alcanzable_ra_um?: number

  // -------------------- ACREDITACIONES Y CERTIFICACIONES --------------------
  /** Notified Body acreditado para PED si servicio consultoría PED. */
  notified_body_ped_id?: string

  /** ¿Taller está certificado FPC EN 1090-1 para emitir CE en estructuras? */
  fpc_en_1090_certificado?: boolean

  /** Clases ejecución EN 1090 cubiertas por la certificación FPC del taller. */
  clases_ejecucion_en_1090_cubiertas?: ClaseEjecucionEN1090[]

  /** ¿Taller certificado IATF 16949 (automoción)? */
  iatf_16949_certificado?: boolean

  /** ¿Taller certificado AS 9100D (aeroespacial)? */
  as_9100_certificado?: boolean

  /** ¿Taller certificado ISO 13485 (dispositivos médicos)? */
  iso_13485_certificado?: boolean

  /** ¿Servicio acreditado ENAC como organismo control autorizado (OCA)
   *  para inspecciones reglamentarias equipos presión? */
  oca_acreditado?: boolean

  /** Número acreditación ENAC OCA si aplica. */
  acreditacion_enac_oca_id?: string

  // -------------------- COMERCIAL --------------------
  /** Modelo de cobro principal. */
  modelo_cobro: ModeloCobroServicioMetalurgico

  /** Cantidad mínima económica (MOQ · si por_pieza o por_kilo). */
  moq_cantidad_minima?: number

  /** Plazo entrega típico para volumen MOQ (días). */
  plazo_entrega_tipico_dias?: number

  /** Capacidad máxima mensual aproximada (volumen · unidades coherentes
   *  con `modelo_cobro`). */
  capacidad_maxima_mensual?: number

  // -------------------- TRAZABILIDAD --------------------
  /** ¿Servicio emite huella firmada Ed25519 en cadena custodia del DPP
   *  pieza procesada? Garantiza eslabón G10 trazable post-operación. */
  emite_eslabon_custody_chain?: boolean

  /** ¿Servicio entrega certificado EN 10204 propio del proceso aplicado
   *  (3.1 emitido por departamento independiente del taller)? */
  emite_certificado_en_10204_propio?: boolean

  /** Tipo de certificado EN 10204 que el taller puede emitir por sí mismo. */
  tipo_certificado_en_10204_propio?: CertificadoInspeccionEN10204
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector METALÚRGICO
// ============================================================================

export type MetalurgicoProduct =
  | MaterialMetalurgicoProduct
  | EquipoPresionProduct
  | NecesidadMetalurgicaProduct
  | ServicioMetalurgicoProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial metalúrgico. */
export const METALURGICO_SCHEMA_VERSION = 'metalurgico@1.0+dpp@1.1' as const

/** Estado de validación del schema sectorial.
 *
 *  Estado 'subject_to_expert' canonizado en ADR 0011 (Audit-Ready by Design).
 *  Antes de pasar a 'validated' se requiere:
 *
 *  - Confemetal (Confederación Española del Metal · CONFEDEM patronal):
 *    revisión de denominaciones · familias · procesos cubiertos · roles.
 *  - 1 organismo notificado PED (AENOR · Bureau Veritas · TÜV Rheinland):
 *    valida categorización PED + módulos conformidad + ATEX +
 *    Reglamento Maquinaria 2023/1230.
 *  - 1 fabricante recipientes a presión categoría III-IV (e.g. Tecam ·
 *    Babcock Wanson · IMA): valida flujo `EquipoPresionProduct` + campos
 *    técnicos + documentación obligatoria PED Anexo I.
 *  - 1 taller mecanizado IATF 16949 (e.g. Mecanizados Sociesa · Cifra):
 *    valida `NecesidadMetalurgicaProduct` + flujo PPAP + `ServicioMetalurgicoProduct`.
 *  - 1 inspector END nivel 3 EN 9712 (e.g. AEND · IZTECH): valida
 *    métodos END · normas END · niveles aplicables.
 *  - Auditoría jurídica especialista compliance PED + CBAM (e.g. Garrigues
 *    industrial + KPMG aduanas): valida cobertura legal CBAM trimestral +
 *    EN 10204 + REACH/RoHS + Reg. Maquinaria.
 *
 *  Ver `docs/adr/0011-taxonomy-status-extension.md`.
 */
export const METALURGICO_SCHEMA_STATUS = 'subject_to_expert' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isMaterialMetalurgico(p: MetalurgicoProduct): p is MaterialMetalurgicoProduct {
  return p.sub_categoria === 'material_metalurgico'
}

export function isEquipoPresion(p: MetalurgicoProduct): p is EquipoPresionProduct {
  return p.sub_categoria === 'equipo_presion'
}

export function isNecesidadMetalurgica(p: MetalurgicoProduct): p is NecesidadMetalurgicaProduct {
  return p.sub_categoria === 'necesidad_metalurgica'
}

export function isServicioMetalurgico(p: MetalurgicoProduct): p is ServicioMetalurgicoProduct {
  return p.sub_categoria === 'servicio_metalurgico'
}

/** ¿El producto requiere intervención de Notified Body PED? */
export function requiereNotifiedBodyPED(p: MetalurgicoProduct): boolean {
  if (!isEquipoPresion(p)) return false
  if (p.categoria_ped === 'art_4_3' || p.categoria_ped === 'cat_I') return false
  return true
}

/** ¿El producto debe llevar marcado CE EN 1090 + Declaración Prestaciones? */
export function requiereMarcadoCEEN1090(p: MetalurgicoProduct): boolean {
  if (isMaterialMetalurgico(p)) {
    return p.uso_como_producto_construccion_en_1090 === true
  }
  return false
}

/** ¿El producto cae en alcance CBAM (Anexo I Reg. UE 2023/956)? */
export function enAlcanceCBAM(p: MetalurgicoProduct): boolean {
  if (isMaterialMetalurgico(p)) {
    return p.alcance_cbam === 'hierro_acero' ||
           p.alcance_cbam === 'aluminio' ||
           p.alcance_cbam === 'derivado_anexo_ii'
  }
  return false
}
