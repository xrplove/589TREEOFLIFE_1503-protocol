// Schema sectorial TEXTIL · Fase 7 bloque sectorial 9 · Audit-Ready by Design.
//
// Sector ISIC C13 (Manufacture of textiles) + C14 (Wearing apparel) +
// C15 (Leather and related products). En CNAE-2025 español cubre 13.10-13.96
// hilatura/tejido/acabado + 14.11-14.39 confección + 15.11-15.20
// cuero y calzado.
//
// El textil es uno de los sectores priorizados por la EU Strategy for
// Sustainable and Circular Textiles (COM(2022) 141) y por ESPR (Reg. UE
// 2024/1781) — DPP textil obligatorio escalonado desde 2027 según
// Reglamento Delegado en preparación. Marco regulatorio denso superpuesto:
//
//   1. ESPR (Reg. UE 2024/1781) — DPP + ecodiseño + información durabilidad
//      + reparabilidad + reciclabilidad + presencia SVHC + huella ambiental
//      + minimum recycled content escalonado.
//   2. Reg. UE 1007/2011 — etiquetado denominación + composición porcentual
//      por fibra (tolerancia ±3% · ±2% para lana). Lista cerrada 49 fibras
//      Anexo I. Símbolos cuidado ISO 3758 voluntarios.
//   3. EU Sustainable Textiles Strategy — extended producer responsibility +
//      recolección separada obligatoria 1-ene-2025 (Dir. 2008/98/CE rev. 2023) +
//      microplastic shedding control + greenwashing prohibido vía Green Claims
//      Directive (en tramitación 2026).
//   4. RD 1055/2022 (España) — EPR textil obligatorio · participación SCRAP
//      acreditado o sistema propio individual (autorización MITECO).
//   5. REACH (Reg. (CE) 1907/2006) Art. 33 + Anexo XVII — restricciones
//      sustancias químicas: PFAS (restricción universal en preparación) ·
//      formaldehído · ftalatos · azocolorantes (24 aminas aromáticas) ·
//      pentaclorofenol · NPEO · DMFu · cromo VI cuero · níquel desprendible.
//   6. CLP (Reg. (CE) 1272/2008) — clasificación + etiquetado + envasado
//      sustancias químicas (tintes · auxiliares · acabados).
//   7. PPE Reg. UE 2016/425 — equipos de protección individual (EPI textiles ·
//      categorías I/II/III · marcado CE + Notified Body cat II/III).
//   8. Reg. (UE) 305/2011 CPR — textiles construcción (geotextiles · membranas ·
//      fachadas ventiladas) si destino EN 13249-EN 13257.
//   9. EUDR (Reg. UE 2023/1115) — cuero (ganado bovino) en alcance Anexo I.
//      Algodón NO está en alcance EUDR pero sí en alcance Better Cotton.
//  10. Dir. 2010/75/UE IED — tintura + acabado + curtido en alcance
//      Anexo I §6.2 (BAT-AEL Conclusiones 2022 textil).
//  11. CBAM Reg. UE 2023/956 — NO aplica directamente al textil (fuera Anexo I)
//      pero sí a inputs derivados aluminio si componentes.
//
// Marcos voluntarios destacados (mercado · no obligatorios):
//   - OEKO-TEX Standard 100 — restricción sustancias nocivas producto acabado.
//   - GOTS Global Organic Textile Standard — algodón ecológico cadena completa.
//   - Bluesign — química limpia + recursos + emisiones aire/agua.
//   - GRS Global Recycled Standard — contenido reciclado ≥20% certificado
//     cadena custodia.
//   - RCS Recycled Claim Standard — contenido reciclado ≥5%.
//   - OCS Organic Content Standard — contenido orgánico no-alimentario.
//   - Cradle to Cradle CertifiedTM — circularidad multi-criterio.
//   - Better Cotton (BCI) — algodón mejor producido (no certificado producto).
//   - Fair Trade Textile Standard · Fair Wear Foundation — derechos laborales.
//   - ZDHC MRSL (Manufacturing Restricted Substances List) — químicos
//     prohibidos en fabricación (más estricto que REACH).
//   - PEFC + FSC — fibras celulósicas regeneradas (viscosa · lyocell · modal)
//     bosques sostenibles.
//
// 4 sub-categorías canonizadas (alineadas con metalúrgico opción cuádruple):
//
//   1. TextilMaterialProduct (DPPProduct) — material textil upstream (fibra
//      cruda · top peinado · hilo · tejido crudo o teñido · cuero).
//      Caso de uso: hilatura publica hilo algodón orgánico Ne 30/1 GOTS
//      certificado · DPP completo · cadena custodia G10 hasta planta.
//
//   2. TextilProductoConfeccionadoProduct (DPPProduct) — producto acabado
//      para venta final (prenda · ropa hogar · textil técnico · cuero
//      manufacturado · EPI textil).
//      Caso de uso: marca sostenible publica camiseta unisex algodón
//      orgánico GOTS + colorantes Bluesign + envío en bolsa kraft sin
//      plástico · cumple Reg. 1007/2011 etiquetado + ESPR DPP minimum
//      recycled content.
//
//   3. NecesidadTextilProduct (DPPProduct) — pieza o producto a fabricar a
//      medida que un comprador (marca · retailer · industria) publica.
//      Caso de uso: marca de moda publica necesidad de 10.000 unidades de
//      sudadera con técnica de estampado digital · fibras orgánicas o
//      recicladas · ZDHC MRSL · OEKO-TEX Standard 100 · entrega DAP
//      Barcelona en 90 días.
//
//   4. ServicioTextilProduct (UniversalProduct) — servicios profesionales
//      (tintura · estampación · acabado · confección a medida · bordado ·
//      lavandería industrial · ensayos laboratorio · consultoría compliance
//      ESPR + REACH textil).
//
// schema_status: 'subject_to_expert' (canon ADR 0011) hasta validación por:
//   - Confederación ModaEspaña (patronal moda) + AITEX (Instituto Tecnológico
//     Textil Alcoy) + CITEVE (Portugal asociado): revisión denominaciones +
//     procesos + roles + capacidades tecnológicas reales del cluster ibérico.
//   - Texfor (Asociación industrial Textil de Proceso Algodonero) + ASEPLA
//     (acabados): valida procesos tintura + estampación + acabado.
//   - Acotex (Asociación Confederativa del Textil): valida flujo retail +
//     etiquetado + EPR.
//   - SCRAP textil acreditado (REICITEX · pendiente autorización MITECO):
//     valida obligaciones RD 1055/2022.
//   - Laboratorio acreditado OEKO-TEX (e.g. AITEX · CITEVE · CTILC): valida
//     ensayos solidez color · solidez lavado · pH · contenido formaldehído.
//   - Auditoría jurídica especialista compliance textil (ESPR + REACH +
//     Reg. 1007/2011 + RD 1055/2022): valida cobertura legal completa.
//
// Cobertura ADR 0008 matriz cumplimiento:
//   - S4 DPP + sostenibilidad (ESPR · REACH SVHC · CLP · EU Taxonomy)
//   - S8 EPR textil RD 1055/2022 + Dir. 2008/98/CE residuos
//   - S12 PPE Reg. UE 2016/425 si EPI textil
//   - S16 Etiquetado Reg. UE 1007/2011 denominación fibras
//
// Ver `docs/adr/0011-taxonomy-status-extension.md` para estado
// subject_to_expert.

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { DPPProduct } from './_dpp'
import type { LocalizedLabel } from '@/app/data/actorGroups'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR · familias fibra · estructuras · procesos
// ============================================================================

/** Familia de fibra textil según Anexo I Reg. UE 1007/2011 (49 denominaciones
 *  cerradas) + agrupación funcional. */
export type FamiliaFibraTextil =
  // -------------------- NATURALES VEGETALES --------------------
  | 'algodon'                         // cotton · Gossypium (Anexo I §5)
  | 'lino'                            // flax · Linum usitatissimum (§7)
  | 'canamo'                          // hemp · Cannabis sativa (§8)
  | 'yute'                            // jute (§9)
  | 'sisal'                           // sisal (§17)
  | 'ramio'                           // ramie (§14)
  | 'kapok'                           // kapok (§16)
  | 'coir_fibra_coco'                 // coir · fibra de coco (§19)
  | 'abaca'                           // abacá (§22)
  | 'esparto'                         // alfa (§20)
  // -------------------- NATURALES ANIMALES --------------------
  | 'lana_oveja'                      // wool (§1)
  | 'lana_merino'                     // merino wool · variante específica
  | 'cashmere'                        // cashmere · cabra Kashmir
  | 'mohair'                          // mohair · cabra angora
  | 'alpaca'                          // alpaca
  | 'llama'                           // llama
  | 'vicuna'                          // vicuña
  | 'guanaco'                         // guanaco
  | 'camello'                         // camel (§2 wool/animal hair)
  | 'angora_conejo'                   // angora rabbit
  | 'seda_morera'                     // mulberry silk · Bombyx mori (§4)
  | 'seda_salvaje'                    // tussah / wild silk
  // -------------------- REGENERADAS CELULÓSICAS --------------------
  | 'viscosa'                         // viscose (§25)
  | 'modal'                           // modal (§30)
  | 'lyocell_tencel'                  // lyocell (§35) · proceso NMMO closed-loop
  | 'cupro'                           // cupro · cuprammonium rayon (§26)
  | 'acetato'                         // acetate (§31)
  | 'triacetato'                      // triacetate (§33)
  // -------------------- REGENERADAS PROTEICAS / BIO --------------------
  | 'caseina_lanital'                 // caseín · proteína láctea regenerada
  | 'pla_acido_polilactico'           // PLA · bio-based de maíz/caña
  | 'micelio_mylo'                    // micelio cultivado (cuero alternativo)
  | 'pinatex_pina'                    // Piñatex · hoja piña
  // -------------------- SINTÉTICAS --------------------
  | 'poliester_pet'                   // polyester · PET (§36)
  | 'poliester_pet_reciclado'         // rPET · contenido reciclado certificable
  | 'poliamida_66'                    // nylon 6.6 (§28)
  | 'poliamida_6'                     // nylon 6
  | 'acrilico'                        // acrylic (§37)
  | 'modacrilico'                     // modacrylic (§38)
  | 'polipropileno'                   // polypropylene (§42)
  | 'polietileno'                     // polyethylene (§43)
  | 'elastano_spandex'                // elastane · spandex (§45)
  | 'aramida_kevlar'                  // aramid · Kevlar (§24) · alta resistencia
  | 'aramida_nomex'                   // aramid · Nomex · ignífuga
  | 'polietileno_uhmw'                // ultra-high molecular weight PE · Dyneema
  | 'pbi'                             // polibencimidazol · extrema temperatura
  // -------------------- METÁLICAS / MINERALES --------------------
  | 'metalico'                        // metallic fiber (§29)
  | 'vidrio'                          // glass fiber (§46)
  | 'ceramica'                        // ceramic fiber
  | 'carbon'                          // carbon fiber (§47)
  // -------------------- ANIMALES NO FIBRAS / CUERO --------------------
  | 'cuero_bovino'                    // bovine leather · alcance EUDR
  | 'cuero_ovino'                     // ovine/sheep leather
  | 'cuero_caprino'                   // goat leather
  | 'cuero_porcino'                   // pig leather
  | 'piel_curtida_otros'              // exóticos · CITES si alcance
  // -------------------- OTROS --------------------
  | 'mezcla_no_descrita'              // requiere desglose en `composicion_fibras`
  | 'otro'

/** Formato físico / etapa de la cadena textil. */
export type FormatoTextil =
  | 'fibra_bruta'                     // raw fiber (post-desmote · sin cardar)
  | 'fibra_lavada_peinada'            // washed wool top · combed cotton lap
  | 'roving_mecha'                    // roving (pre-hilatura)
  | 'hilo_filamento_continuo'         // continuous filament yarn (POY · FDY · DTY)
  | 'hilo_hilatura_corta'             // short staple yarn (open-end · ring)
  | 'hilo_hilatura_larga'             // long staple yarn (worsted · woollen)
  | 'hilo_retorcido_cableado'         // plied / cabled yarn
  | 'hilo_fantasia'                   // fancy yarn (slub · bouclé · chenille)
  | 'tejido_calada_crudo'             // greige woven fabric
  | 'tejido_calada_acabado'           // finished woven fabric
  | 'tejido_punto_trama'              // weft knit fabric
  | 'tejido_punto_urdimbre'           // warp knit fabric
  | 'tejido_no_tejido_nonwoven'       // nonwoven (spunbond · meltblown · needle-punched)
  | 'tela_no_calada_jacquard'         // jacquard
  | 'fieltro'                         // felt
  | 'denim'                           // denim (twill índigo)
  | 'encaje'                          // lace
  | 'tul_red'                         // tulle / net
  | 'cinta_galon'                     // ribbon / braid
  | 'cuero_bruto_pickle'              // raw skins / pickle
  | 'cuero_wet_blue'                  // wet blue (chrome-tanned wet)
  | 'cuero_acabado_full_grain'        // full grain leather
  | 'cuero_acabado_top_grain'         // top grain
  | 'cuero_split'                     // split leather
  | 'cuero_gamuza_suede'              // suede
  | 'membrana_funcional'              // functional membrane (e.g. Gore-Tex equivalent)
  | 'geotextil'                       // geotextile (EN 13249-13257)
  | 'pieza_confeccionada'             // confeccionado (sub-categoría 2)
  | 'otro'

/** Estructura del tejido por calada según ligamento. */
export type LigamentoCalada =
  | 'tafetan_plain'                   // 1/1 plain weave
  | 'sarga_2_1'                       // twill 2/1
  | 'sarga_3_1'                       // twill 3/1
  | 'sarga_zig_zag'                   // herringbone
  | 'saten_4_1'                       // satin 4/1
  | 'saten_5_1'                       // satin 5/1 sateen
  | 'jacquard'                        // jacquard complex weave
  | 'damasco'                         // damask
  | 'panama'                          // basket weave / panama
  | 'doble_capa'                      // double cloth
  | 'rizo_terry'                      // terry · toalla
  | 'felpa'                           // velvet pile
  | 'no_calada'                       // not woven (punto, no tejido)

/** Estructura del tejido por punto. */
export type LigamentoPunto =
  | 'jersey_punto_liso'               // single jersey
  | 'interlock'                       // interlock
  | 'pique'                           // piqué
  | 'rib_canale'                      // rib 1×1, 2×2, etc.
  | 'cardigan'                        // half/full cardigan
  | 'jacquard_punto'                  // jacquard knit
  | 'tricot_chain_warp'               // chain warp knit
  | 'rachel'                          // raschel warp knit
  | 'milanesa'                        // milanese
  | 'no_aplica_calada_o_no_tejido'

/** Proceso de hilatura aplicado. */
export type ProcesoHilatura =
  | 'ring_anillos'                    // ring spinning
  | 'open_end_rotor'                  // OE rotor / Schlafhorst
  | 'aire_air_jet'                    // air jet (Murata)
  | 'compact_compacta'                // compact spinning
  | 'siro_spun'                       // siro spun
  | 'mvs_jet'                         // vortex spinning MVS
  | 'rotor_friccion'                  // friction spinning DREF
  | 'continuous_filament_pet'         // PET continuous filament POY/DTY
  | 'fundido_meltspun_nylon'          // melt spun (nylon · PP)
  | 'solucion_wet_dry_jet'            // solution spinning (acrylic · viscose)
  | 'electrohilado'                   // electrospinning (nanofibras técnicas)

/** Proceso de tintura aplicado y etapa de la cadena. */
export type EtapaTintura =
  | 'sin_tintura_crudo'               // ecru / natural
  | 'tintura_en_masa_fibra'           // fiber dyeing (dope-dyed if sintética)
  | 'tintura_en_hilo'                 // yarn dyeing
  | 'tintura_en_pieza'                // piece dyeing
  | 'tintura_en_prenda'               // garment dyeing
  | 'tintura_continua'                // continuous range (pad-dye)
  | 'tintura_jet_overflow'            // jet / overflow / airflow dyeing

/** Clase química del colorante usado. */
export type ClaseColorante =
  | 'reactivo'                        // reactive (algodón / celulósicas)
  | 'directo'                         // direct (celulósicas baratas)
  | 'tina_vat'                        // vat (denim · alta solidez)
  | 'sulfur_azufre'                   // sulfur (negros · marinos)
  | 'azoico_naphthol'                 // naphthol azo (PROHIBIDOS 24 aminas REACH)
  | 'dispersos'                       // disperse (PET · poliéster)
  | 'acidos'                          // acid (proteicas: lana / seda / nylon)
  | 'basicos_cationicos'              // basic / cationic (acrílico)
  | 'cuba_indigo'                     // indigo vat (denim)
  | 'pigmento_no_soluble'             // pigment dyeing
  | 'natural_origen_vegetal'          // natural plant dyes (índigo natural, granza, gualda)

/** Técnica de estampación. */
export type TecnicaEstampacion =
  | 'sin_estampacion'
  | 'rotativa_rotary_screen'          // rotary screen print
  | 'plana_flat_screen'               // flat screen
  | 'digital_inkjet'                  // digital inkjet (DTF · DTG · DGT)
  | 'transferencia_sublimacion'       // sublimation transfer (sintéticas blancas)
  | 'serigrafia_manual'               // manual screen print (carrusel)
  | 'devore_burnout'                  // devore burn-out
  | 'foil_metalizado'                 // metallic foil
  | 'block_print'                     // block printing tradicional
  | 'pigmento_no_lavable'             // pigment overprint (acabado superficial)

/** Acabado funcional aplicado al tejido o prenda. */
export type AcabadoFuncionalTextil =
  | 'mercerizado'                     // mercerization (algodón · brillo + tinte)
  | 'sanforizado_preencogido'         // sanforized · pre-shrunk
  | 'easy_care_arrugas'               // easy care · anti-arrugas (formaldehído risk)
  | 'hidrofugado_water_repellent'     // DWR · water repellent (PFAS risk)
  | 'oleofugo_oil_repellent'          // oil repellent (PFAS risk)
  | 'ignifugo_fr'                     // flame retardant (Br risk)
  | 'antibacteriano_silver'           // antibacterial (Ag risk)
  | 'antibacteriano_natural'          // natural antimicrobial (sin biocidas synth)
  | 'anti_uv'                         // UPF rating
  | 'anti_pilling'                    // anti-pilling treatment
  | 'softener_suavizante'             // softener
  | 'compactado_compaction'           // compaction
  | 'calandrado_calendering'          // calendering (brillo)
  | 'gofrado_embossing'               // embossing pattern
  | 'lavado_industrial_stone'         // stone wash (denim)
  | 'lavado_enzimatico_biopolishing'  // enzyme washing / biopolishing
  | 'oz_one_wash'                     // ozone wash (denim · sustituye permanganato)
  | 'laser_burning_denim'             // laser engraving (denim)
  | 'preencogido_termico'             // thermal pre-shrinking
  | 'antiestatico'                    // antistatic
  | 'sin_acabado_funcional'

/** Composición individual de fibra dentro del producto (% peso obligatorio
 *  Reg. UE 1007/2011 Art. 11 + Art. 14). */
export type ComposicionFibra = {
  /** Familia de fibra. */
  fibra: FamiliaFibraTextil
  /** Denominación oficial Anexo I Reg. UE 1007/2011 (en idioma del país
   *  destino · ejemplo: 'algodón' / 'cotton' / 'coton'). */
  denominacion_oficial?: LocalizedLabel
  /** Porcentaje en peso (0-100 · suma total = 100% ± tolerancia). */
  porcentaje_peso: number
  /** ¿Material reciclado? Relevante GRS / RCS / ESPR minimum recycled content. */
  reciclado: boolean
  /** ¿Material orgánico certificado? Relevante GOTS / OCS. */
  organico_certificado: boolean
  /** ¿Material en alcance EUDR? Solo cuero bovino (Anexo I). */
  en_alcance_eudr?: boolean
}

/** Restricción REACH Anexo XVII relevante para textil. */
export type RestriccionReachTextil =
  | 'azocolorantes_24_aminas'         // §43 · Pohibición tras escisión reductiva
  | 'cromo_vi_cuero'                  // §47 · Cr(VI) ≤ 3 mg/kg en cuero contacto piel
  | 'formaldehido'                    // límites variables por país
  | 'ftalatos_dehp_dbp_bbp_dibp'      // §51 · 4 ftalatos limitados PVC textile
  | 'pentaclorofenol_pcp'             // §22
  | 'npeo_nonilfenol_ethox'           // §46 · NPEO ≤ 0,01% en tejidos
  | 'dmfu_dimetilformamida_lecho'     // §61
  | 'pfas_pfoa_pfca'                  // §68 · PFOA + PFCAs limitado (restricción universal PFAS en preparación)
  | 'pfhxs_perfluorohexano'           // restricción específica
  | 'pfca_pfba_pfpea'
  | 'cadmio_pigmentos'                // §23 · Cd ≤ 0,01% en plásticos textiles
  | 'plomo'                           // §63 · Pb en metales accesorios
  | 'niquel_desprendible_metales'     // §27 · accesorios metálicos contacto piel
  | 'sccp_parafinas_cloradas_corto'   // §42 · SCCP en textiles tratados

/** Símbolo de cuidado ISO 3758 declarado (5 obligatorios para etiqueta
 *  completa: lavado · blanqueo · secado · planchado · profesional). */
export type ConjuntoSimbolosCuidado = {
  /** Temperatura máxima de lavado (°C). 0 = no lavar agua. */
  lavado_temp_max_c: 0 | 30 | 40 | 60 | 70 | 95
  /** Modo lavado: normal · suave · muy suave · prohibido. */
  lavado_modo: 'normal' | 'suave' | 'muy_suave' | 'prohibido' | 'mano'
  /** ¿Se permite blanqueo? */
  blanqueo: 'cualquier_blanqueo' | 'solo_oxigeno_sin_cloro' | 'prohibido'
  /** Secadora · temperatura. */
  secadora: 'normal_alta' | 'normal_media' | 'normal_baja' | 'prohibida'
  /** Planchado · temperatura. */
  planchado: 'alta_200c' | 'media_150c' | 'baja_110c' | 'prohibido' | 'sin_vapor'
  /** Limpieza profesional. */
  limpieza_profesional:
    | 'percloroetileno_F'             // F symbol
    | 'hidrocarburos_P'                // P symbol
    | 'wet_clean_W'                   // W symbol (acuosa profesional)
    | 'prohibido'
}

/** Norma armonizada de durabilidad / solidez aplicada. */
export type NormaSolidez =
  | 'ISO_105_C06'                     // solidez color al lavado
  | 'ISO_105_X12'                     // solidez color al frote
  | 'ISO_105_E04'                     // solidez color al sudor
  | 'ISO_105_B02'                     // solidez color a la luz xenón
  | 'ISO_6330'                        // procedimientos lavado domiciliario
  | 'ISO_3759'                        // preparación · marcado · medida cambios dimensionales
  | 'ISO_5077'                        // determinación cambios dimensionales
  | 'ISO_12947'                       // resistencia abrasión Martindale
  | 'ISO_13934'                       // resistencia tracción
  | 'ISO_13937'                       // resistencia desgarro Elmendorf
  | 'EN_ISO_13688'                    // ropa protección requisitos generales (EPI)
  | 'EN_343'                          // EPI protección lluvia (UPF / WP / MVTR)
  | 'EN_ISO_11612'                    // EPI protección calor + llama
  | 'EN_469'                          // EPI bomberos
  | 'EN_1149'                         // EPI propiedades electrostáticas

/** Categoría de producto textil construcción CPR Reg. UE 305/2011. */
export type CategoriaCPR_Textil =
  | 'no_aplica'                       // textil convencional fuera CPR
  | 'geotextil_separacion'            // EN 13249 carreteras
  | 'geotextil_drenaje'               // EN 13252 drenajes
  | 'geotextil_filtracion'            // EN 13251 protección
  | 'geomembrana_impermeable'         // EN 13361 vertederos
  | 'membrana_techo'                  // EN 13859 (cubiertas)
  | 'fachada_ventilada'               // textiles fachada

/** Categoría PPE (Reg. UE 2016/425) si EPI textil. */
export type CategoriaPPE =
  | 'no_aplica'                       // textil convencional fuera PPE
  | 'cat_I'                           // riesgos mínimos (mecánico superficial · UV bajo · ergonómico)
  | 'cat_II'                          // riesgos medios (alta visibilidad · pluviosidad · invierno)
  | 'cat_III'                         // riesgos altos / mortales (química · biológica · eléctrica · ahogamiento · IR)

// ============================================================================
// REFERENCIA A LOTES DE TINTURA · trazabilidad batch
// ============================================================================

export type LoteTinturaTextil = {
  /** Número de lote tintura (trazabilidad cromática). */
  lote_id: string
  /** Color medido en sistema CIE L*a*b* D65/10°. */
  cielab_d65_10?: { L: number; a: number; b: number }
  /** Delta E* máximo aceptable contra muestra patrón. */
  delta_e_max?: number
  /** Etapa en que se aplicó la tintura. */
  etapa: EtapaTintura
  /** Clase química del colorante principal. */
  clase_colorante: ClaseColorante
  /** ¿Cumple ZDHC MRSL (Manufacturing Restricted Substances List)? */
  cumple_zdhc_mrsl?: boolean
  /** ¿Cumple OEKO-TEX Standard 100 producto acabado? */
  cumple_oeko_tex_std_100?: boolean
  /** Categoría OEKO-TEX (I bebés · II contacto piel · III sin contacto · IV decoración). */
  categoria_oeko_tex?: 'I' | 'II' | 'III' | 'IV'
}

// ============================================================================
// SUB-CATEGORÍA 1 · MATERIAL TEXTIL UPSTREAM (DPPProduct)
// ============================================================================

/** Ficha de material textil upstream (fibra · hilo · tejido · cuero).
 *
 *  Caso de uso: hilatura algodonera publica hilo Ne 30/1 100% algodón
 *  orgánico certificado GOTS + OEKO-TEX Standard 100 cat II · proceso
 *  ring spinning compact · lote tintura ID42-2026 reactivo Bluesign.
 *  DPP completo con composición + ESPR + ZDHC MRSL + cadena custodia G10
 *  hasta planta hilatura.
 *
 *  Extiende DPPProduct porque ESPR Reg. UE 2024/1781 escalonado 2027+
 *  exigirá DPP para todos los textiles puestos en mercado UE.
 */
export type TextilMaterialProduct = DPPProduct & {
  sub_categoria: 'textil_material'

  // -------------------- IDENTIFICACIÓN MATERIAL --------------------
  /** Formato/etapa del material en la cadena textil. */
  formato_textil: FormatoTextil

  /** Composición fibras (suma 100% ± tolerancia Reg. 1007/2011 · ±3% general ·
   *  ±2% para lana). Obligatorio Art. 11 + Art. 14. */
  composicion_fibras: ComposicionFibra[]

  /** Familia fibra principal (>= 50% peso) para facetas de búsqueda. */
  familia_fibra_principal: FamiliaFibraTextil

  // -------------------- HILATURA (si formato = hilo) --------------------
  /** Proceso de hilatura aplicado (si formato hilo). */
  proceso_hilatura?: ProcesoHilatura

  /** Numeración del hilo (sistema universal · campo libre).
   *  Ejemplos: 'Ne 30/1' (cotton count) · 'Nm 50/2' (metric count) ·
   *  'Td 150/96/1' (denier × filaments × plies) · 'Tex 30'. */
  numeracion_hilo?: string

  /** Torsión del hilo (giros por metro). */
  torsion_giros_metro?: number

  /** Sentido de la torsión. */
  sentido_torsion?: 'Z' | 'S' | 'Z_x_S' | 'S_x_Z'

  // -------------------- TEJIDO (si formato = tejido) --------------------
  /** Estructura del tejido por calada (si tejido calada). */
  ligamento_calada?: LigamentoCalada

  /** Estructura del tejido por punto (si tejido punto). */
  ligamento_punto?: LigamentoPunto

  /** Densidad urdimbre × trama (hilos / 10 cm). */
  densidad_urdimbre_hilos_10cm?: number
  densidad_trama_hilos_10cm?: number

  /** Galga del punto (agujas/pulgada). */
  galga_punto_aguj_pulg?: number

  /** Gramaje (g/m²). */
  gramaje_g_m2?: number

  /** Anchura útil pieza (cm). */
  anchura_util_cm?: number

  /** Largo nominal de la pieza (m). */
  largo_pieza_m?: number

  // -------------------- TINTURA Y ACABADO --------------------
  /** Etapa de tintura aplicada al material. */
  etapa_tintura: EtapaTintura

  /** Lote(s) de tintura aplicado(s). */
  lotes_tintura?: LoteTinturaTextil[]

  /** Técnica estampación (si aplica). */
  tecnica_estampacion?: TecnicaEstampacion

  /** Acabados funcionales aplicados. */
  acabados_funcionales?: AcabadoFuncionalTextil[]

  // -------------------- CUERO (si formato familia cuero) --------------------
  /** Tipo de curtido aplicado (si cuero). */
  tipo_curtido?:
    | 'cromo_iii'                     // chrome-tanned (Cr III)
    | 'vegetal_tanino'                // vegetable-tanned (tanino quebracho/mimosa)
    | 'aldehido_glutaraldehido'       // aldehyde-tanned
    | 'sintetico_libre_cromo'         // chrome-free synthetic
    | 'mineral_aluminio'              // aluminum mineral
    | 'mixto'

  /** Espesor del cuero (mm). */
  espesor_cuero_mm?: number

  /** ¿Contenido Cr(VI) ≤ 3 mg/kg validado (REACH §47 obligatorio contacto piel)? */
  cumple_reach_cromo_vi_3mg_kg?: boolean

  // -------------------- REACH SVHC + ANEXO XVII --------------------
  /** Restricciones REACH evaluadas (clean check + LOQ resultados disponibles). */
  restricciones_reach_evaluadas: RestriccionReachTextil[]

  /** ¿Producto libre PFAS (PFOA + PFCAs + PFHxS + futura restricción universal)? */
  libre_pfas_declarado?: boolean

  // -------------------- ETIQUETADO REG. UE 1007/2011 --------------------
  /** ¿Texto etiqueta cumple Art. 14 obligación denominación + composición
   *  porcentual en idioma del Estado miembro destino? */
  etiqueta_1007_2011_validada?: boolean

  /** Idiomas en los que se entrega etiqueta cumplimentada. */
  idiomas_etiqueta?: ISOCountryCode[]

  // -------------------- ESPR ESPECÍFICO TEXTIL --------------------
  /** ¿% contenido reciclado certificado GRS (≥20%) o RCS (≥5%)? */
  porcentaje_contenido_reciclado_certificado?: number

  /** Cadena custodia GRS / RCS verificada (Transaction Certificate). */
  certificado_transaccion_grs_rcs_id?: string

  /** ¿Producto orgánico certificado GOTS / OCS? */
  certificado_gots_ocs_id?: string

  // -------------------- ENSAYOS DE SOLIDEZ --------------------
  /** Resultados ensayos de solidez relevantes con clase 1-5. */
  ensayos_solidez?: Array<{
    norma: NormaSolidez
    parametro: string                 // 'lavado_40c' · 'frote_seco' · 'sudor_alcalino' · etc.
    clasificacion: 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5
    laboratorio_acreditado_id?: string
  }>
}

// ============================================================================
// SUB-CATEGORÍA 2 · PRODUCTO TEXTIL CONFECCIONADO (DPPProduct)
// ============================================================================

/** Categoría de producto confeccionado. */
export type CategoriaProductoConfeccionado =
  // -------------------- VESTIR --------------------
  | 'camiseta_basico_punto'
  | 'camisa_blusa_calada'
  | 'jersey_punto'
  | 'sudadera_felpa'
  | 'chaqueta_americana'
  | 'abrigo_gabardina'
  | 'pantalon_chino_jeans'
  | 'falda_vestido'
  | 'ropa_interior'
  | 'medias_calcetines'
  | 'ropa_deportiva'
  | 'ropa_bano'
  | 'pijama_lenceria'
  | 'accesorios_textiles'             // bufanda · gorro · cinturón · pañuelos
  | 'calzado_textil'                  // zapatillas tela
  // -------------------- HOGAR --------------------
  | 'ropa_cama_sabana'                // bed linen
  | 'ropa_cama_funda_nordica'         // duvet cover
  | 'ropa_cama_almohada'              // pillows
  | 'colcha_edredon'                  // bedspread / duvet
  | 'toalla_bano_cocina'              // towels
  | 'mantel_servilleta'               // tablecloth / napkin
  | 'cortina_visillo'                 // curtain
  | 'alfombra_mokueta'                // carpet / rug
  | 'tapizado_decoracion'             // upholstery / decor
  // -------------------- TÉCNICO / INDUSTRIAL --------------------
  | 'textil_automocion'               // automotive textile (interior)
  | 'textil_aeronautico'              // aerospace textile
  | 'textil_medico_quirurgico'        // medical / surgical
  | 'textil_filtros'                  // filtration media
  | 'textil_geotextil_construccion'   // geotextile (CPR alcance)
  | 'textil_agro_invernadero'         // agricultural nonwovens
  | 'textil_embalaje_big_bag'         // packaging textiles
  | 'cuerda_cabos_cordeleria'         // ropes / cordage
  // -------------------- PPE EPI --------------------
  | 'epi_alta_visibilidad'            // EN ISO 20471
  | 'epi_proteccion_quimica'          // EN 14605 / EN ISO 13982
  | 'epi_proteccion_termica'          // EN ISO 11612
  | 'epi_proteccion_arc_electric'     // IEC 61482
  | 'epi_proteccion_corte_mecanico'   // EN 388
  | 'epi_proteccion_bomberos'         // EN 469
  | 'epi_chaleco_balistico'           // NIJ / DIN ballistic
  | 'epi_otro'
  // -------------------- CALZADO ENTERO --------------------
  | 'calzado_cuero_botin_zapato'      // leather footwear

/** Talla del producto confeccionado (sistemas distintos). */
export type SistemaTallaProducto =
  | 'eu_numerica_36_60'               // EU sizing
  | 'eu_letras_xs_xxxl'               // size letters
  | 'us_numerica'                     // US sizing
  | 'uk_numerica'                     // UK sizing
  | 'asiatica_jp_cn'                  // Asian sizing
  | 'edad_meses_anos'                 // baby / kids by age
  | 'numerica_calzado_eu'             // EU shoe sizing
  | 'numerica_calzado_uk'             // UK shoe sizing
  | 'unica_talla_unica'               // one size

/** Ficha de producto textil confeccionado para venta final.
 *
 *  Caso de uso: marca sostenible publica camiseta básica unisex 180 g/m²
 *  jersey punto liso 100% algodón orgánico GOTS · estampado digital
 *  inkjet OEKO-TEX cat II · etiquetado Reg. 1007/2011 en 8 idiomas ·
 *  EPR textil RD 1055/2022 SCRAP asignado · ESPR DPP con minimum
 *  recycled content declarado.
 *
 *  Extiende DPPProduct porque ESPR Reg. UE 2024/1781 escalonado 2027+
 *  exige DPP para producto puesto en mercado UE.
 */
export type TextilProductoConfeccionadoProduct = DPPProduct & {
  sub_categoria: 'textil_confeccionado'

  /** Categoría del producto confeccionado. */
  categoria_producto: CategoriaProductoConfeccionado

  /** Composición fibras del producto principal (sin accesorios · Art. 19
   *  Reg. 1007/2011). */
  composicion_fibras: ComposicionFibra[]

  /** Familia fibra principal (>= 50% peso). */
  familia_fibra_principal: FamiliaFibraTextil

  // -------------------- TALLAS --------------------
  /** Sistema de tallas declarado. */
  sistema_tallas: SistemaTallaProducto

  /** Tallas disponibles en stock (ej. ['S','M','L','XL']). */
  tallas_disponibles: string[]

  /** Stock por talla (clave talla · valor unidades). */
  stock_por_talla?: Record<string, number>

  // -------------------- ETIQUETADO REG. UE 1007/2011 --------------------
  /** ¿Texto etiqueta cumple denominación + composición porcentual por
   *  idioma del Estado miembro destino (Art. 14)? */
  etiqueta_1007_2011_validada: boolean

  /** Idiomas etiqueta. */
  idiomas_etiqueta: ISOCountryCode[]

  /** Símbolos de cuidado declarados (ISO 3758 voluntario · pero estándar
   *  industrial de facto). */
  simbolos_cuidado?: ConjuntoSimbolosCuidado

  // -------------------- ESPR DPP TEXTIL --------------------
  /** ¿% contenido reciclado certificado conforme cadena custodia? */
  porcentaje_contenido_reciclado_certificado?: number

  /** ¿% contenido orgánico certificado conforme cadena custodia? */
  porcentaje_contenido_organico_certificado?: number

  /** Certificados sostenibilidad voluntarios aplicables al producto. */
  certificados_sostenibilidad?: Array<
    | 'oeko_tex_std_100'
    | 'oeko_tex_made_in_green'
    | 'oeko_tex_step'
    | 'gots'
    | 'ocs'
    | 'grs'
    | 'rcs'
    | 'bluesign'
    | 'cradle_to_cradle'
    | 'fair_trade_certified'
    | 'fair_wear_foundation'
    | 'better_cotton'
    | 'pefc'
    | 'fsc'
    | 'leather_working_group'
  >

  /** Reparabilidad índice declarado (0-10 · base ESPR + ISO 10303). */
  indice_reparabilidad_0_10?: number

  /** Durabilidad declarada (ciclos lavado abrasión Martindale ISO 12947). */
  durabilidad_ciclos_martindale?: number

  /** ¿Diseñado para desensamble (botones · cremalleras · forros separables)? */
  disenado_para_desensamble?: boolean

  // -------------------- EPR TEXTIL · RD 1055/2022 --------------------
  /** ¿Productor adherido a SCRAP textil acreditado? */
  scrap_textil_adherido?: boolean

  /** ID del SCRAP textil (REICITEX · Re-Textil · u otro autorizado MITECO). */
  scrap_textil_id?: string

  /** ¿Productor opera sistema individual REICITEX autorizado MITECO? */
  sistema_individual_epr?: boolean

  // -------------------- REACH ANEXO XVII --------------------
  restricciones_reach_evaluadas: RestriccionReachTextil[]

  /** ¿Producto libre PFAS declarado y testado? */
  libre_pfas_declarado?: boolean

  /** Resultados ensayos restricciones REACH disponibles. */
  reportes_reach_disponibles?: Array<{
    restriccion: RestriccionReachTextil
    laboratorio_acreditado_id: string
    fecha_ensayo: string              // ISO date
    resultado: 'conforme' | 'no_conforme' | 'no_detectado_loq_inferior'
    loq_mg_kg?: number
  }>

  // -------------------- PPE / CPR (si aplica) --------------------
  /** Categoría PPE si EPI (Reg. UE 2016/425). */
  categoria_ppe?: CategoriaPPE

  /** Notified Body PPE si cat II/III (4-digit NANDO). */
  ppe_notified_body_id?: string

  /** Normas armonizadas PPE aplicadas (e.g. EN ISO 20471 · EN 469 · etc.). */
  normas_ppe_aplicadas?: string[]

  /** Categoría CPR Reg. UE 305/2011 si textil construcción. */
  categoria_cpr?: CategoriaCPR_Textil

  // -------------------- TRAZABILIDAD PRENDA → MATERIAL --------------------
  /** Referencias a `TextilMaterialProduct.id` de los materiales upstream
   *  usados (DPP encadenado entre productos). Construye el árbol de
   *  trazabilidad descendente. */
  materiales_upstream_ids?: string[]

  /** ¿Producto destinado a contacto piel? Determina categoría OEKO-TEX. */
  destino_contacto_piel?: boolean

  /** Categoría OEKO-TEX recomendada según destino. */
  categoria_oeko_tex_recomendada?: 'I' | 'II' | 'III' | 'IV'
}

// ============================================================================
// SUB-CATEGORÍA 3 · NECESIDAD TEXTIL (DPPProduct)
// ============================================================================

/** Necesidad de fabricación textil publicada por marca / retailer / industria.
 *
 *  Caso de uso: marca outdoor publica necesidad de 5.000 chaquetas técnicas
 *  con membrana funcional PFAS-free + costuras termoselladas + ZDHC MRSL +
 *  OEKO-TEX Std 100 cat II + colección cápsula primavera 2027 · 90 días
 *  entrega · entrega DAP Bilbao.
 *
 *  Extiende DPPProduct porque el producto resultante tendrá DPP propio en
 *  el momento de fabricación · el comprador pre-rellena campos obligatorios.
 */
export type NecesidadTextilProduct = DPPProduct & {
  sub_categoria: 'necesidad_textil'

  // -------------------- DESCRIPCIÓN PRODUCTO --------------------
  /** Categoría producto solicitada. */
  categoria_producto: CategoriaProductoConfeccionado

  /** Composición fibras requerida (con tolerancias %). */
  composicion_requerida: Array<ComposicionFibra & {
    /** Tolerancia aceptada sobre el porcentaje declarado (% peso). */
    tolerancia_pct?: number
  }>

  /** Familias fibras alternativas aceptables si la principal no se consigue. */
  familias_alternativas?: FamiliaFibraTextil[]

  /** Estructura tejido preferida. */
  ligamento_preferido_calada?: LigamentoCalada
  ligamento_preferido_punto?: LigamentoPunto

  /** Gramaje objetivo (g/m²) ± tolerancia. */
  gramaje_objetivo_g_m2?: number
  gramaje_tolerancia_g_m2?: number

  // -------------------- ACABADO / ESTAMPACIÓN --------------------
  /** Etapa tintura requerida o flexible. */
  etapa_tintura_requerida?: EtapaTintura

  /** Clase colorante aceptable (excluye azoicos 24 aminas). */
  clase_colorante_admitidos?: ClaseColorante[]

  /** Técnica estampación admitida (vacío = sin estampación). */
  tecnicas_estampacion_admitidas?: TecnicaEstampacion[]

  /** Acabados funcionales requeridos. */
  acabados_funcionales_requeridos?: AcabadoFuncionalTextil[]

  // -------------------- TALLAS Y CANTIDADES --------------------
  /** Sistema de tallas requerido. */
  sistema_tallas_requerido: SistemaTallaProducto

  /** Cantidades por talla solicitadas. */
  cantidades_por_talla: Record<string, number>

  /** Cantidad total solicitada (suma cantidades por talla). */
  cantidad_total: number

  /** Plazo entrega objetivo (días naturales desde adjudicación). */
  plazo_entrega_objetivo_dias?: number

  /** Plazo máximo aceptable (días). */
  plazo_entrega_maximo_dias?: number

  /** ¿Es necesidad puntual o contrato suministro recurrente colección? */
  tipo_demanda: 'puntual' | 'recurrente_temporada' | 'recurrente_anual'

  /** Si recurrente: volumen anual estimado (uds). */
  volumen_anual_estimado_uds?: number

  // -------------------- COMPLIANCE EXIGIDA --------------------
  /** Restricciones REACH que el fabricante debe cumplir y certificar. */
  restricciones_reach_obligatorias: RestriccionReachTextil[]

  /** ¿Producto debe ser libre PFAS declarado + testado? */
  exige_libre_pfas?: boolean

  /** Certificados sostenibilidad obligatorios. */
  certificados_sostenibilidad_obligatorios?: Array<
    | 'oeko_tex_std_100'
    | 'gots'
    | 'ocs'
    | 'grs'
    | 'rcs'
    | 'bluesign'
    | 'cradle_to_cradle'
    | 'fair_trade_certified'
    | 'better_cotton'
    | 'pefc'
    | 'fsc'
    | 'leather_working_group'
  >

  /** % contenido reciclado mínimo exigido. */
  porcentaje_reciclado_minimo_exigido?: number

  /** ¿Producto debe cumplir ZDHC MRSL? */
  exige_zdhc_mrsl?: boolean

  /** Categoría PPE exigida si EPI textil. */
  categoria_ppe_exigida?: CategoriaPPE

  /** Idiomas etiqueta producto final. */
  idiomas_etiqueta_requeridos: ISOCountryCode[]

  // -------------------- DOCUMENTOS TÉCNICOS --------------------
  /** Tech-pack del comprador (planos · escalado tallas · pliego prescripciones). */
  documentos_tech_pack: Array<{
    document_id: string
    document_url: string
    document_hash_sha256?: string
    tipo:
      | 'plano_2d_modelo'
      | 'pliego_prescripciones'
      | 'tabla_medidas_escalado'
      | 'fichas_tela_acabados'
      | 'fichas_avios'                // botones · cremalleras · entretelas
      | 'ficha_etiqueta'
      | 'ficha_packaging'
      | 'pantone_color_estandar'
      | 'muestra_aprobada_proto'
      | 'otro'
  }>

  // -------------------- TÉRMINOS COMERCIALES --------------------
  /** Incoterm propuesto. */
  incoterm_propuesto?:
    | 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF'
    | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP'

  /** Modalidad pago propuesta. */
  modalidad_pago_propuesta: '02_b2b_nacional' | '03_servicios' | '04_importacion'

  /** Países origen aceptables (filtrar oferentes). Vacío = sin restricción. */
  paises_origen_aceptables?: ISOCountryCode[]

  /** Países origen excluidos (sanciones · acuerdos cliente · ESG). */
  paises_origen_excluidos?: ISOCountryCode[]
}

// ============================================================================
// SUB-CATEGORÍA 4 · SERVICIO TEXTIL (UniversalProduct)
// ============================================================================

/** Tipo de servicio textil ofertable por taller / planta / laboratorio. */
export type TipoServicioTextil =
  | 'hilatura_servicio'                       // contract spinning
  | 'tejeduria_calada_servicio'               // contract weaving
  | 'tejeduria_punto_servicio'                // contract knitting
  | 'tintura_pieza_servicio'                  // piece dyeing service
  | 'tintura_hilo_servicio'                   // yarn dyeing service
  | 'tintura_prenda_servicio'                 // garment dyeing service
  | 'estampacion_digital_servicio'            // digital print service
  | 'estampacion_serigrafia_servicio'         // screen print service
  | 'acabado_textil_servicio'                 // finishing service (mercerizing · etc.)
  | 'curtido_cuero_servicio'                  // leather tanning service
  | 'confeccion_a_medida_b2b'                 // contract manufacturing (CMT)
  | 'confeccion_full_package_b2b'             // full package (incluye telas)
  | 'patronaje_escalado_servicio'             // pattern making + grading
  | 'desarrollo_producto_diseno'              // R&D + design (full prototyping)
  | 'bordado_industrial'                      // industrial embroidery
  | 'lavanderia_industrial_denim'             // industrial laundry (denim washes)
  | 'lavanderia_industrial_acabados'          // industrial finishing wash
  | 'planchado_packing_servicio'              // ironing + packing for retail
  | 'ensayos_laboratorio_oeko_tex'            // laboratory OEKO-TEX testing
  | 'ensayos_laboratorio_solidez'             // colorfastness lab
  | 'ensayos_laboratorio_resistencia'         // strength + abrasion lab
  | 'ensayos_laboratorio_reach'               // REACH SVHC + Annex XVII screening
  | 'ensayos_laboratorio_zdhc'                // ZDHC MRSL test
  | 'consultoria_compliance_espr'             // ESPR + DPP advisory
  | 'consultoria_compliance_reach_textil'     // REACH textil
  | 'consultoria_etiquetado_1007_2011'        // Reg. 1007/2011 labeling
  | 'consultoria_huella_ambiental_pef'        // PEF Product Environmental Footprint
  | 'consultoria_epr_textil_rd_1055'          // EPR RD 1055/2022 advisory
  | 'auditoria_iso_14001_textil'              // ISO 14001 sectorial
  | 'auditoria_bluesign'                      // Bluesign assessment
  | 'reciclaje_textil_mecanico'               // mechanical recycling (shoddy)
  | 'reciclaje_textil_quimico'                // chemical recycling (depolymerization)
  | 'reciclaje_textil_recolectado'            // textile waste collection (post-consumer)
  | 'reparacion_textil_garments'              // garment repair service
  | 'reventa_renting_servicio'                // resale / rental platform service
  | 'consultoria_circular_business_model'     // circular business model design
  | 'otro'

/** Modelo de cobro del servicio textil. */
export type ModeloCobroServicioTextil =
  | 'por_unidad_confeccionada'                // per finished garment
  | 'por_metro_lineal_tela'                   // per meter of fabric
  | 'por_metro_cuadrado_tela'                 // per square meter
  | 'por_kilo_hilo'                           // per kg of yarn
  | 'por_kilo_tintura'                        // per kg dyed
  | 'por_minuto_maquina_smv'                  // per standard minute value (CMT)
  | 'por_hora_operario'                       // per hour operator
  | 'por_ensayo_laboratorio'                  // per test
  | 'por_proyecto'                            // project lump sum
  | 'tarifa_contractual_temporada'            // seasonal contract
  | 'a_negociar'

/** Ficha de servicio textil profesional.
 *
 *  Caso de uso: taller textil técnico publica capacidad confección
 *  Cut-Make-Trim (CMT) en chaquetas técnicas hasta 8.000 unidades/mes ·
 *  procesos termo-sellado y bonding · certificados Bluesign + STeP OEKO-TEX +
 *  Fair Wear Foundation · trazabilidad lote firmado Ed25519 al DPP del
 *  producto resultante.
 *
 *  Extiende solo UniversalProduct porque es servicio · no producto físico ·
 *  el DPP corresponde al producto resultante (que el cliente aporta como
 *  necesidad o que se genera al cerrar pedido).
 */
export type ServicioTextilProduct = UniversalProduct & {
  sub_categoria: 'servicio_textil'

  /** Tipo principal de servicio ofertado. */
  tipo_servicio: TipoServicioTextil

  /** Tipos secundarios ofertados (planta multi-proceso). */
  tipos_servicio_complementarios?: TipoServicioTextil[]

  // -------------------- CAPACIDADES TÉCNICAS --------------------
  /** Familias fibra procesables. */
  familias_fibra_procesables: FamiliaFibraTextil[]

  /** Procesos hilatura disponibles (si hilatura). */
  procesos_hilatura_disponibles?: ProcesoHilatura[]

  /** Estructuras tejido posibles. */
  ligamentos_calada_posibles?: LigamentoCalada[]
  ligamentos_punto_posibles?: LigamentoPunto[]

  /** Etapas tintura ofertadas. */
  etapas_tintura_ofertadas?: EtapaTintura[]

  /** Clases colorante usadas (compromiso ZDHC excluye azoicos 24 aminas). */
  clases_colorante_usadas?: ClaseColorante[]

  /** Técnicas estampación disponibles. */
  tecnicas_estampacion_disponibles?: TecnicaEstampacion[]

  /** Acabados funcionales aplicables. */
  acabados_funcionales_disponibles?: AcabadoFuncionalTextil[]

  // -------------------- LÍMITES FÍSICOS PLANTA --------------------
  /** Anchura útil máxima (cm) en máquina (tejido / acabado). */
  anchura_util_maxima_cm?: number

  /** Gramaje mínimo procesable (g/m²). */
  gramaje_minimo_g_m2?: number

  /** Gramaje máximo procesable (g/m²). */
  gramaje_maximo_g_m2?: number

  /** Capacidad máxima mensual (uds o kg o m según `modelo_cobro`). */
  capacidad_maxima_mensual?: number

  /** MOQ cantidad mínima económica. */
  moq_cantidad_minima?: number

  /** Plazo entrega típico para MOQ (días). */
  plazo_entrega_tipico_dias?: number

  // -------------------- ACREDITACIONES Y CERTIFICACIONES --------------------
  /** ¿Planta certificada OEKO-TEX STeP (Sustainable Textile Production)? */
  oeko_tex_step_certificada?: boolean

  /** ¿Planta certificada Bluesign system partner? */
  bluesign_system_partner?: boolean

  /** ¿Planta certificada Fair Wear Foundation member? */
  fair_wear_foundation_member?: boolean

  /** ¿Planta certificada GOTS Scope Certificate? */
  gots_scope_certificate_id?: string

  /** ¿Planta certificada GRS Transaction Certificate Producer? */
  grs_scope_certificate_id?: string

  /** ¿Planta certificada Leather Working Group (LWG · curtidores)? */
  lwg_gold_silver_bronze?: 'gold' | 'silver' | 'bronze' | 'no_certificada'

  /** ¿Planta cumple ZDHC ZDHC Roadmap to Zero · qué nivel? */
  zdhc_compliance_level?:
    | 'no_participa'
    | 'foundational_baseline'
    | 'progressive_aspirational'
    | 'aspirational_leader'

  /** ¿Laboratorio acreditado ENAC / ILAC para ensayos textiles? */
  laboratorio_acreditado_enac_ilac?: boolean

  /** Número acreditación ENAC del laboratorio. */
  acreditacion_enac_id?: string

  // -------------------- COMERCIAL --------------------
  /** Modelo de cobro principal. */
  modelo_cobro: ModeloCobroServicioTextil

  // -------------------- TRAZABILIDAD --------------------
  /** ¿Servicio emite huella firmada Ed25519 en cadena custodia del DPP
   *  producto resultante? */
  emite_eslabon_custody_chain?: boolean

  /** ¿Servicio emite Transaction Certificate GRS / RCS para trazabilidad
   *  contenido reciclado upstream? */
  emite_transaction_certificate_grs?: boolean

  /** ¿Servicio emite Transaction Certificate GOTS para trazabilidad
   *  contenido orgánico upstream? */
  emite_transaction_certificate_gots?: boolean
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector TEXTIL
// ============================================================================

export type TextilProduct =
  | TextilMaterialProduct
  | TextilProductoConfeccionadoProduct
  | NecesidadTextilProduct
  | ServicioTextilProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial textil. */
export const TEXTIL_SCHEMA_VERSION = 'textil@1.0+dpp@1.1' as const

/** Estado de validación del schema sectorial.
 *
 *  Estado 'subject_to_expert' canonizado en ADR 0011 (Audit-Ready by Design).
 *  Antes de pasar a 'validated' se requiere:
 *
 *  - Confederación ModaEspaña + AITEX (Instituto Tecnológico Textil Alcoy) +
 *    CITEVE (Portugal asociado): revisión denominaciones · procesos · roles ·
 *    capacidades tecnológicas reales del cluster ibérico.
 *  - Texfor (proceso algodonero) + ASEPLA (acabados): valida procesos
 *    tintura + estampación + acabado.
 *  - Acotex (Confederación Confederativa Textil): valida flujo retail +
 *    etiquetado + EPR.
 *  - SCRAP textil acreditado (REICITEX · pendiente autorización MITECO):
 *    valida obligaciones RD 1055/2022.
 *  - Laboratorio acreditado OEKO-TEX (AITEX · CITEVE · CTILC): valida
 *    ensayos solidez · pH · contenido formaldehído · REACH SVHC textil.
 *  - Auditoría jurídica especialista compliance textil (ESPR + REACH +
 *    Reg. 1007/2011 + RD 1055/2022): valida cobertura legal completa.
 *
 *  Ver `docs/adr/0011-taxonomy-status-extension.md`.
 */
export const TEXTIL_SCHEMA_STATUS = 'subject_to_expert' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isTextilMaterial(p: TextilProduct): p is TextilMaterialProduct {
  return p.sub_categoria === 'textil_material'
}

export function isTextilConfeccionado(p: TextilProduct): p is TextilProductoConfeccionadoProduct {
  return p.sub_categoria === 'textil_confeccionado'
}

export function isNecesidadTextil(p: TextilProduct): p is NecesidadTextilProduct {
  return p.sub_categoria === 'necesidad_textil'
}

export function isServicioTextil(p: TextilProduct): p is ServicioTextilProduct {
  return p.sub_categoria === 'servicio_textil'
}

/** ¿El producto debe etiquetarse según Reg. UE 1007/2011 (todos los textiles
 *  puestos en mercado UE con composición fibras > 80% del peso)? */
export function requiereEtiquetado1007_2011(p: TextilProduct): boolean {
  return isTextilMaterial(p) || isTextilConfeccionado(p)
}

/** ¿El producto contiene cuero bovino y por tanto está en alcance EUDR
 *  (Reg. UE 2023/1115 Anexo I)? */
export function contieneCueroBovinoEUDR(p: TextilProduct): boolean {
  if (isTextilMaterial(p) || isTextilConfeccionado(p)) {
    return p.composicion_fibras.some(
      (f) => f.fibra === 'cuero_bovino' && f.porcentaje_peso > 0,
    )
  }
  return false
}

/** ¿El producto es EPI textil que requiere marcado CE + Notified Body
 *  (cat II/III)? */
export function requiereNotifiedBodyPPE(p: TextilProduct): boolean {
  if (!isTextilConfeccionado(p)) return false
  return p.categoria_ppe === 'cat_II' || p.categoria_ppe === 'cat_III'
}

/** ¿El productor del producto confeccionado debe estar adherido a SCRAP
 *  textil acreditado o tener sistema individual EPR (RD 1055/2022)? */
export function requiereAdhesionSCRAP_RD_1055_2022(p: TextilProduct): boolean {
  return isTextilConfeccionado(p)
}
