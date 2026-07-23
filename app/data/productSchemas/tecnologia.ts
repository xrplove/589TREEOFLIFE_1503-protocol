// Schema sectorial TECNOLOGÍA · Fase 7 bloque sectorial 10 · Audit-Ready by Design.
//
// Sector ISIC C26 (Computer, electronic and optical products) + C27 (Electrical
// equipment, parcial) + J62 (Computer programming) + J63 (Information service
// activities). En CNAE-2025 español cubre 26.11-26.80 fabricación electrónica +
// 27.11-27.90 equipo eléctrico + 62.01-62.09 programación/consultoría TI +
// 63.11-63.99 servicios de información.
//
// La electrónica (EEE · Equipos Eléctricos y Electrónicos) es uno de los
// sectores con marco regulatorio MÁS denso y de evolución MÁS rápida de la UE:
// converge cumplimiento de producto físico (RoHS · WEEE · RED · ecodiseño +
// etiqueta energética · LVD · EMC · baterías) con cumplimiento digital
// (Cyber Resilience Act · AI Act · Data Act · NIS2 · RGPD). Decisión José
// 2026-05-29: 1503 debe cumplir TODA la legislación aplicable, incluida
// la escalonada a 2027+ y la que está pendiente de aprobación (Audit-Ready by
// Design · campos extensibles marcados subject_to_expert).
//
// MARCO REGULATORIO — PRODUCTO FÍSICO (todas las citas verificadas contra
// EUR-Lex / Comisión Europea · ver §fuentes al pie):
//
//   1. RoHS · Dir. 2011/65/UE — restricción de 10 sustancias peligrosas en EEE
//      (Pb · Hg · Cd · Cr VI · PBB · PBDE + 4 ftalatos DEHP/BBP/DBP/DIBP desde
//      22-jul-2019). Marcado CE + Declaración UE de conformidad.
//   2. WEEE/RAEE · Dir. 2012/19/UE — gestión residuos AEE · 6 categorías Anexo III
//      (open scope desde 15-ago-2018) · símbolo contenedor tachado · registro
//      productor + EPR vía SCRAP acreditado. España: RD 27/2025 (deroga RD
//      110/2015) — subject_to_expert (verificar número RD vigente con experto).
//   3. RED · Dir. 2014/53/UE — equipos radioeléctricos (salud · EMC · espectro).
//   4. RED Cargador Común · Dir. (UE) 2022/2380 (modifica RED) — USB-C
//      obligatorio: móviles/tablets/cámaras/auriculares/etc. desde 28-dic-2024 ·
//      PORTÁTILES desde 28-abr-2026 · USB Power Delivery si >5V/3A/15W ·
//      unbundling del cargador permitido.
//   5. Ecodiseño móviles/tablets · Reg. (UE) 2023/1670 — aplica 20-jun-2025 ·
//      resistencia caídas + polvo/agua (IP) + batería ≥800 ciclos al 80% +
//      disponibilidad piezas + actualizaciones SO. (Art. 6 desde 20-sep-2023.)
//   6. Etiqueta energética móviles/tablets · Reg. (UE) 2023/1669 — aplica
//      20-jun-2025 · clase eficiencia energética A-G + clase REPARABILIDAD A-E +
//      fiabilidad caídas + autonomía batería + IP rating.
//   7. Marco etiquetado energético · Reg. (UE) 2017/1369 — base reescalado A-G +
//      registro EPREL obligatorio antes de comercializar.
//   8. LVD Baja Tensión · Dir. 2014/35/UE — material eléctrico 50-1000V AC /
//      75-1500V DC. EMC Compatibilidad Electromagnética · Dir. 2014/30/UE.
//   9. Baterías · Reg. (UE) 2023/1542 — DPP batería obligatorio 18-feb-2027 ·
//      etiquetado + huella carbono + contenido reciclado + baterías portátiles
//      extraíbles por usuario (18-feb-2027) + diligencia debida cadena suministro.
//  10. Conflict Minerals · Reg. (UE) 2017/821 — diligencia debida importadores
//      estaño/tantalio/wolframio/oro (3TG) zonas conflicto · en vigor 1-ene-2021.
//  11. REACH · Reg. (CE) 1907/2006 (Art. 33 SVHC + Anexo XVII) + CLP · Reg. (CE)
//      1272/2008 — sustancias en componentes (soldaduras · plásticos · retardantes
//      llama). Notificación SCIP a ECHA si SVHC >0,1%.
//  12. GPSR Seguridad General Producto · Reg. (UE) 2023/988 — aplica 13-dic-2024 ·
//      sustituye Dir. 2001/95/CE · trazabilidad + retiradas + venta online.
//  13. Máquinas · Reg. (UE) 2023/1230 — aplica 20-ene-2027 (sustituye Dir.
//      2006/42/CE) · incluye ciberseguridad + maquinaria con IA/autónoma · aplica
//      a equipo industrial/automatización en alcance.
//  14. ESPR · Reg. (UE) 2024/1781 — ecodiseño + DPP. Working Plan 2025-2030
//      (adoptado 16-abr-2025): electrónica/ICT/baterías escalonadas DPP 2028-2029 ·
//      actos delegados producto-específicos 2026-2030. (Campos DPP ya en _dpp.ts.)
//
// MARCO REGULATORIO — DIGITAL / SOFTWARE / SERVICIOS:
//
//  15. CRA Cyber Resilience Act · Reg. (UE) 2024/2847 — productos con elementos
//      digitales (hardware + software) · marcado CE ciberseguridad + SBOM +
//      vulnerability disclosure + soporte seguridad. Notif. vulns 11-sep-2026 ·
//      plena aplicación 11-dic-2027. (Campos CRA ya canonizados en _dpp.ts Capa C.)
//  16. AI Act · Reg. (UE) 2024/1689 — en vigor 1-ago-2024. Escalonado: prácticas
//      prohibidas + alfabetización IA 2-feb-2025 · GPAI 2-ago-2025 · alto riesgo
//      Anexo III 2-ago-2026 · alto riesgo embebido en productos Anexo I
//      2-ago-2027 · ciertos ámbitos alto riesgo 2-dic-2027.
//  17. Data Act · Reg. (UE) 2023/2854 — datos productos conectados · aplica
//      12-sep-2025 · productos conectados diseñados para compartir datos tras
//      12-sep-2026 · interop cloud 12-sep-2026 · portabilidad 12-sep-2027.
//  18. NIS2 · Dir. (UE) 2022/2555 — ciberseguridad entidades esenciales/importantes
//      (18 sectores) · transposición 17-oct-2024. España: subject_to_expert
//      (transposición tardía · verificar ley vigente con experto).
//  19. Derecho a Reparar · Dir. (UE) 2024/1799 — reparación bienes · transposición
//      31-jul-2026 · obligación reparar fuera de garantía si reparable por ley UE.
//  20. RGPD · Reg. (UE) 2016/679 — software/SaaS que trata datos personales ·
//      PII off-chain (canon hard rule) · derecho al olvido Art. 17.
//
// NOTA DE HONESTIDAD (canon valores honestos · 2026-05-28):
//   La Green Claims Directive (propuesta COM(2023) 166) fue objeto de intención
//   de RETIRADA por la Comisión el 20-jun-2025 (trílogos cancelados · estado
//   formal incierto). NO se cita como vigente. El anti-greenwashing aplicable
//   es la Dir. (UE) 2024/825 ECGT (Empowering Consumers for the Green Transition)
//   que aplica 27-sep-2026. Los claims ambientales del producto se modelan contra
//   ECGT, no contra Green Claims.
//
// Marcos voluntarios / estándares de mercado destacados:
//   - EPEAT (Global Electronics Council) — registro electrónica sostenible.
//   - TCO Certified — sostenibilidad IT (8 generaciones).
//   - ENERGY STAR — eficiencia energética (acuerdo UE-US, en revisión).
//   - ISO/IEC 27001 — gestión seguridad de la información (servicios).
//   - ISO/IEC 42001 — sistema gestión IA (alineado AI Act).
//   - SOC 2 Type II — controles SaaS (Trust Services Criteria).
//   - Common Criteria ISO/IEC 15408 (EUCC esquema EU Cybersecurity Act).
//   - SBOM CycloneDX / SPDX — inventario componentes software (CRA Art. 13).
//   - Responsible Minerals Initiative (RMI) — auditoría smelters 3TG.
//
// 4 sub-categorías canonizadas (alineadas con metalúrgico/textil opción cuádruple):
//
//   1. ComponenteElectronicoProduct (DPPProduct) — componente/material upstream
//      electrónico (semiconductor · PCB · pasivo · display · sensor · celda
//      batería · módulo comunicación). Caso: fabricante de PCBA publica placa
//      base con DPP RoHS + REACH SCIP + trazabilidad lote + conflict minerals.
//
//   2. EquipoElectronicoProduct (DPPProduct) — equipo EEE acabado para venta
//      (smartphone · portátil · equipo de red · IoT · electrónica de consumo ·
//      equipo industrial). Caso: fabricante publica smartphone con DPP completo
//      RoHS + WEEE + RED USB-C + etiqueta energética A-G + reparabilidad A-E +
//      CRA (elementos digitales) + batería 800 ciclos extraíble.
//
//   3. NecesidadTecnologicaProduct (DPPProduct) — hardware/equipo a fabricar o
//      suministrar a medida que un comprador publica. Caso: integrador publica
//      necesidad de 5.000 gateways IoT industriales · RoHS + CRA class I +
//      RED + soporte seguridad ≥8 años · entrega DAP Madrid 120 días.
//
//   4. ServicioTecnologicoProduct (UniversalProduct) — servicios digitales y
//      profesionales TI (desarrollo software · SaaS · hosting · integración ·
//      ciberseguridad · IA/datos · mantenimiento · reparación · refurbishing ·
//      reciclaje RAEE · consultoría compliance CRA/AI Act/NIS2/RGPD). Aquí se
//      modela el software/SaaS/IA (no es EEE físico · sin DPP físico) con su
//      propio bloque de cumplimiento digital.
//
// schema_status: 'subject_to_expert' (canon ADR 0011) hasta validación por:
//   - AMETIC (patronal tecnología digital + electrónica España): denominaciones +
//     procesos + roles + capacidades reales del cluster.
//   - COIT / AEIT (Ingeniería de Telecomunicación) + Organismo Notificado RED/EMC/
//     LVD (Applus+ · DEKRA · TÜV): valida conformidad radio + eléctrica.
//   - SCRAP RAEE acreditado (Ecolec · Ecotic · Ecoasimelec · Ecolum · Ecored):
//     valida obligaciones WEEE Dir. 2012/19/UE + RD nacional vigente.
//   - Laboratorio acreditado ENAC/ILAC: valida ensayos RoHS (XRF + GC-MS) +
//     REACH SVHC + IP rating + ciclos batería.
//   - INCIBE + auditor CRA acreditado: valida ciberseguridad producto (SBOM +
//     vuln disclosure + soporte) Reg. (UE) 2024/2847.
//   - AESIA (Agencia Española de Supervisión de la IA) + auditor AI Act: valida
//     clasificación riesgo IA Reg. (UE) 2024/1689.
//   - AEPD: valida tratamiento PII en software/SaaS (RGPD).
//   - Auditoría jurídica especialista tech compliance (RoHS + WEEE + RED + CRA +
//     AI Act + NIS2 + Data Act + RGPD): valida cobertura legal completa.
//
// Cobertura ADR 0008 matriz cumplimiento:
//   - S4 DPP + sostenibilidad (ESPR · ecodiseño · etiqueta energética · EPREL)
//   - S5 CRA ciberseguridad producto (Reg. UE 2024/2847)
//   - S6 RoHS sustancias peligrosas EEE (Dir. 2011/65/UE)
//   - S8 WEEE/RAEE EPR (Dir. 2012/19/UE) + baterías (Reg. UE 2023/1542)
//   - S11 AI Act clasificación riesgo (Reg. UE 2024/1689)
//   - S14 Data Act + NIS2 + RGPD (servicios digitales)
//
// Ver `docs/adr/0011-taxonomy-status-extension.md` para estado subject_to_expert.
//
// §fuentes (verificadas 2026-05-29):
//   - eur-lex.europa.eu/eli/dir/2024/1799/oj (Derecho a Reparar)
//   - eur-lex.europa.eu/eli/reg/2023/988/oj (GPSR)
//   - eur-lex.europa.eu/legal-content/.../CELEX:32022L2380 (Cargador común)
//   - energy-efficient-products.ec.europa.eu (Reg. 2023/1669 + 2023/1670)
//   - digital-strategy.ec.europa.eu/.../regulatory-framework-ai (AI Act timeline)
//   - digital-strategy.ec.europa.eu/.../data-act (Data Act)
//   - digital-strategy.ec.europa.eu/.../nis2-directive (NIS2)
//   - osha.europa.eu/.../regulation-20231230eu-machinery (Reg. Máquinas)
//   - green-forum.ec.europa.eu (ESPR Working Plan 2025-2030)

import type {
  UniversalProduct,
  ISOCountryCode,
} from './_universal'
import type { DPPProduct } from './_dpp'

// ============================================================================
// PRIMITIVAS COMUNES AL SECTOR · categorías EEE · sustancias · interfaces
// ============================================================================

/** Categoría WEEE/RAEE según Anexo III Dir. 2012/19/UE (6 categorías · open
 *  scope desde 15-ago-2018). Determina obligaciones de registro + objetivos
 *  recogida + financiación EPR. */
export type CategoriaWEEE =
  | 'intercambio_temperatura'          // 1 · frigoríficos · A/A · bombas calor
  | 'pantallas_monitores'              // 2 · pantallas + monitores + TV >100 cm²
  | 'lamparas'                         // 3 · lámparas (LED · fluorescentes · etc.)
  | 'equipos_grandes'                  // 4 · dimensión exterior >50 cm
  | 'equipos_pequenos'                 // 5 · dimensión exterior ≤50 cm
  | 'equipos_pequenos_it_telecom'      // 6 · IT + telecom ≤50 cm

/** Sustancia restringida RoHS · Dir. 2011/65/UE (Anexo II · 10 sustancias).
 *  Límite máximo en peso por material homogéneo: 0,1% salvo Cd (0,01%). */
export type SustanciaRestringidaRoHS =
  | 'plomo_pb'                         // 0,1% · soldaduras · vidrios
  | 'mercurio_hg'                      // 0,1% · lámparas
  | 'cadmio_cd'                        // 0,01% · pigmentos · pilas
  | 'cromo_hexavalente_cr6'            // 0,1% · anticorrosión
  | 'pbb_bifenilos_polibromados'       // 0,1% · retardante llama
  | 'pbde_eteres_difenilicos_polibrom' // 0,1% · retardante llama
  | 'dehp_ftalato'                     // 0,1% · plastificante (desde 22-jul-2019)
  | 'bbp_ftalato'                      // 0,1% · plastificante
  | 'dbp_ftalato'                      // 0,1% · plastificante
  | 'dibp_ftalato'                     // 0,1% · plastificante

/** Familia de componente electrónico upstream (sub-categoría 1). */
export type FamiliaComponenteElectronico =
  // -------------------- SEMICONDUCTORES --------------------
  | 'semiconductor_logica'             // CPU · GPU · MCU · FPGA · ASIC · SoC
  | 'semiconductor_memoria'            // DRAM · NAND · NOR · SRAM
  | 'semiconductor_potencia'           // MOSFET · IGBT · diodo · SiC · GaN
  | 'semiconductor_analogico_mixto'    // op-amp · ADC · DAC · PMIC
  | 'semiconductor_rf'                 // PA · LNA · transceiver RF
  // -------------------- PASIVOS Y ELECTROMECÁNICOS --------------------
  | 'componente_pasivo'                // resistencia · condensador · inductor
  | 'componente_electromecanico'       // relé · interruptor · conector · zócalo
  | 'cuarzo_oscilador'                 // resonador · cristal · TCXO
  // -------------------- PLACAS --------------------
  | 'pcb_desnuda'                      // bare board (laminado FR-4 · flex · HDI)
  | 'pcb_ensamblada_pcba'             // PCBA (placa con componentes montados)
  // -------------------- ÓPTICA / DISPLAY / SENSOR --------------------
  | 'display_panel'                    // LCD · OLED · microLED · e-ink
  | 'componente_optoelectronico'       // LED · fotodiodo · láser · opto-acoplador
  | 'sensor'                           // imagen · MEMS · temperatura · presión
  | 'modulo_camara'                    // módulo cámara CMOS
  // -------------------- COMUNICACIÓN / ENERGÍA --------------------
  | 'modulo_comunicacion'              // WiFi · BT · celular · GNSS · UWB
  | 'antena'                           // antena PCB · chip · externa
  | 'celda_bateria'                    // Li-ion · LiPo · LiFePO4 · NiMH (Reg. 2023/1542)
  | 'fuente_alimentacion'              // PSU · convertidor DC-DC · cargador
  | 'cableado_arnes'                   // cableado · arnés · flex cable
  | 'otro'

/** Tipo de equipo electrónico acabado (sub-categoría 2). */
export type TipoEquipoElectronico =
  // -------------------- INFORMÁTICA / TELECOM PERSONAL --------------------
  | 'smartphone'                       // ecodiseño + etiqueta Reg. 2023/1670/1669
  | 'telefono_movil_basico'            // feature phone
  | 'tablet'                           // slate tablet (en alcance Reg. 2023/1670)
  | 'portatil_laptop'                  // RED cargador común desde 28-abr-2026
  | 'ordenador_sobremesa'
  | 'servidor'                         // ecodiseño servidores Reg. (UE) 2019/424
  | 'estacion_trabajo'
  | 'monitor_pantalla'                 // ecodiseño Reg. (UE) 2019/2021
  | 'periferico'                       // teclado · ratón · impresora · escáner
  | 'almacenamiento_externo'           // NAS · disco externo · SSD externo
  // -------------------- RED / TELECOM --------------------
  | 'equipo_red'                       // router · switch · AP · firewall hw
  | 'equipo_telecomunicaciones'        // estaciones base · transmisores
  // -------------------- CONSUMO --------------------
  | 'wearable'                         // smartwatch · pulsera · gafas
  | 'auriculares_altavoz'              // headphones · earbuds · speaker
  | 'camara_digital'
  | 'consola_videojuegos'
  | 'television_audio_consumo'         // TV · barra sonido · receptor AV
  | 'electrodomestico_conectado'       // smart appliance
  | 'iluminacion_led'                  // luminaria LED conectada
  // -------------------- IoT / INDUSTRIAL --------------------
  | 'dispositivo_iot_smart_home'       // sensor · termostato · cerradura smart
  | 'gateway_iot_industrial'           // gateway · PLC conectado · edge device
  | 'equipo_industrial_automatizacion' // en alcance Reg. Máquinas si aplica
  | 'herramienta_electrica'
  | 'otro'

/** Clase de eficiencia energética reescalada A-G (Reg. (UE) 2017/1369 +
 *  reglamentos delegados por producto · etiqueta + registro EPREL). */
export type ClaseEficienciaEnergetica = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

/** Clase de reparabilidad A-E (Reg. (UE) 2023/1669 móviles/tablets · índice
 *  basado en disponibilidad piezas + tiempo entrega + desmontabilidad +
 *  documentación + actualizaciones software). */
export type ClaseReparabilidad = 'A' | 'B' | 'C' | 'D' | 'E'

/** Interfaz de carga (RED cargador común · Dir. (UE) 2022/2380). */
export type InterfazCarga =
  | 'usb_c'                            // USB-C básico
  | 'usb_c_power_delivery'             // USB-C + USB PD (obligatorio si >5V/3A/15W)
  | 'inalambrica_qi'                   // carga inalámbrica Qi (complementaria)
  | 'propietario_legacy'              // conector propietario (prohibido en alcance)
  | 'no_recargable'                    // sin batería recargable
  | 'no_aplica'                        // fuera de alcance cargador común

/** Protocolo de radio del equipo (RED · Dir. 2014/53/UE · gestión espectro). */
export type ProtocoloRadio =
  | 'wifi'
  | 'bluetooth'
  | 'nfc'
  | 'celular_4g_5g'
  | 'gnss_gps'
  | 'zigbee'
  | 'lora_lpwan'
  | 'uwb'
  | 'rfid'
  | 'thread_matter'
  | 'otro'

/** Clasificación de riesgo IA según AI Act · Reg. (UE) 2024/1689.
 *
 *  Aplica al software/servicio (sub-cat 4) y a equipos con IA embebida
 *  (sub-cat 2). El alto riesgo embebido en productos (Anexo I) aplica
 *  2-ago-2027 · ciertos ámbitos alto riesgo 2-dic-2027. */
export type ClasificacionRiesgoIA =
  | 'no_es_sistema_ia'                 // el producto/servicio no incorpora IA
  | 'riesgo_inaceptable_prohibido'     // Art. 5 (prohibido desde 2-feb-2025)
  | 'alto_riesgo_anexo_iii'            // Anexo III (aplica 2-ago-2026)
  | 'alto_riesgo_producto_anexo_i'     // embebido en producto regulado (2-ago-2027)
  | 'riesgo_limitado_transparencia'    // Art. 50 (obligación transparencia)
  | 'riesgo_minimo'                    // sin obligaciones específicas
  | 'gpai_modelo_proposito_general'    // GPAI (obligaciones desde 2-ago-2025)
  | 'gpai_riesgo_sistemico'            // GPAI con riesgo sistémico (>10^25 FLOP)

/** Tipo de procedimiento de evaluación de conformidad aplicado (módulos
 *  Decisión 768/2008/CE · marcado CE). */
export type ProcedimientoEvaluacionConformidad =
  | 'autoevaluacion_modulo_a'          // control interno producción
  | 'examen_ue_tipo_modulo_b_c'        // examen UE de tipo + conformidad con tipo
  | 'organismo_notificado_modulo_h'    // aseguramiento calidad total
  | 'no_requiere_marcado_ce'

// ============================================================================
// SUB-CATEGORÍA 1 · COMPONENTE ELECTRÓNICO UPSTREAM (DPPProduct)
// ============================================================================

/** Resultado de ensayo RoHS sobre un material homogéneo. */
export type EnsayoRoHS = {
  /** Sustancia analizada. */
  sustancia: SustanciaRestringidaRoHS
  /** Concentración medida (ppm · mg/kg). */
  concentracion_ppm: number
  /** ¿Por debajo del límite Anexo II (0,1% / 0,01% Cd)? */
  cumple_limite: boolean
  /** Método de ensayo (XRF screening · GC-MS · ICP-OES confirmatorio). */
  metodo_ensayo?: 'xrf_screening' | 'gc_ms' | 'icp_oes' | 'uv_vis'
  /** Laboratorio acreditado ENAC/ILAC. */
  laboratorio_acreditado_id?: string
}

/** Sustancia SVHC declarada en notificación SCIP a ECHA (REACH Art. 33 +
 *  Dir. residuos · obligatorio si SVHC >0,1% peso del artículo). */
export type SustanciaSCIP = {
  /** Nombre de la sustancia (lista candidatos SVHC). */
  nombre_sustancia: string
  /** Número CAS. */
  numero_cas?: string
  /** Concentración (% peso) en el artículo. */
  concentracion_pct: number
  /** Referencia de notificación SCIP a ECHA. */
  referencia_scip?: string
}

/** Minerales de conflicto 3TG (Reg. (UE) 2017/821 · diligencia debida). */
export type MineralConflicto3TG = 'estano_tin' | 'tantalio' | 'wolframio_tungsteno' | 'oro'

export type ComponenteElectronicoProduct = DPPProduct & {
  sub_categoria: 'componente_electronico'

  // -------------------- IDENTIFICACIÓN COMPONENTE --------------------
  /** Familia del componente. */
  familia_componente: FamiliaComponenteElectronico

  /** Referencia/MPN del fabricante (Manufacturer Part Number). */
  mpn_part_number: string

  /** Número de paquete/encapsulado (e.g. 'QFN-48' · '0402' · 'BGA-256'). */
  encapsulado_package?: string

  /** ¿Componente RoHS-compliant (libre de plomo · etc.)? */
  rohs_compliant: boolean

  // -------------------- SEMICONDUCTOR (si aplica) --------------------
  /** Nodo de proceso (nm) si semiconductor. */
  nodo_proceso_nm?: number

  /** Temperatura de operación (rango °C · e.g. industrial -40/+85). */
  rango_temp_operacion_min_c?: number
  rango_temp_operacion_max_c?: number

  /** Grado de calidad (consumer · industrial · automotive AEC-Q · military). */
  grado_calidad?: 'consumer' | 'industrial' | 'automotive_aec_q' | 'medical' | 'military_aerospace'

  // -------------------- PCB (si aplica) --------------------
  /** Número de capas (si PCB). */
  pcb_numero_capas?: number

  /** Acabado superficial PCB (HASL · ENIG · OSP · plata química). */
  pcb_acabado_superficial?: 'hasl_sn' | 'enig' | 'osp' | 'plata_quimica' | 'estano_quimico'

  /** Clase IPC de la placa (IPC-6012 · clase 1/2/3). */
  pcb_clase_ipc?: '1' | '2' | '3'

  // -------------------- CELDA BATERÍA (si aplica · Reg. 2023/1542) --------------------
  /** Química de la celda (si celda batería). */
  quimica_bateria?: 'li_ion' | 'li_po' | 'li_fe_po4' | 'ni_mh' | 'ni_cd' | 'plomo_acido' | 'na_ion' | 'estado_solido'

  /** Capacidad nominal (mAh). */
  capacidad_mah?: number

  /** Ciclos de vida certificados al 80% capacidad. */
  ciclos_vida_80pct?: number

  /** ¿Declara huella de carbono de batería (Reg. 2023/1542 escalonado)? */
  huella_carbono_bateria_declarada?: boolean

  // -------------------- ROHS / REACH --------------------
  /** Ensayos RoHS disponibles por material homogéneo. */
  ensayos_rohs?: EnsayoRoHS[]

  /** Sustancias SVHC declaradas en notificación SCIP (REACH Art. 33). */
  sustancias_scip?: SustanciaSCIP[]

  /** ¿Producto libre de SVHC > 0,1% (no requiere SCIP)? */
  libre_svhc_declarado?: boolean

  // -------------------- CONFLICT MINERALS --------------------
  /** Minerales 3TG presentes (Reg. (UE) 2017/821). */
  minerales_conflicto_3tg?: MineralConflicto3TG[]

  /** ¿Diligencia debida 3TG completada (smelters RMI conformes)? */
  diligencia_debida_3tg_completada?: boolean

  /** Referencia del informe CMRT (Conflict Minerals Reporting Template). */
  cmrt_referencia?: string

  // -------------------- DATASHEET / DOCUMENTACIÓN --------------------
  /** URL del datasheet técnico. */
  datasheet_url?: string

  /** ¿Componente activo (no obsoleto · NRND/EOL)? */
  estado_ciclo_vida_componente?: 'active' | 'nrnd' | 'eol_last_time_buy' | 'obsolete'
}

// ============================================================================
// SUB-CATEGORÍA 2 · EQUIPO ELECTRÓNICO ACABADO (DPPProduct)
// ============================================================================

export type EquipoElectronicoProduct = DPPProduct & {
  sub_categoria: 'equipo_electronico'

  // -------------------- IDENTIFICACIÓN EQUIPO --------------------
  /** Tipo de equipo. */
  tipo_equipo: TipoEquipoElectronico

  /** Categoría WEEE/RAEE aplicable (Anexo III Dir. 2012/19/UE). */
  categoria_weee: CategoriaWEEE

  /** Modelo comercial / número de modelo del fabricante. */
  modelo_comercial: string

  // -------------------- MARCADO CE Y CONFORMIDAD --------------------
  /** ¿Marcado CE aplicado? (LVD + EMC + RED + RoHS según aplique). */
  marcado_ce: boolean

  /** Procedimiento de evaluación de conformidad aplicado. */
  procedimiento_evaluacion_conformidad?: ProcedimientoEvaluacionConformidad

  /** Organismo Notificado (NB number 4 dígitos) si interviene. */
  organismo_notificado_id?: string

  /** URL de la Declaración UE de Conformidad (DoC). */
  declaracion_conformidad_ue_url?: string

  /** Directivas/Reglamentos en alcance del marcado CE. */
  directivas_en_alcance?: Array<
    | 'rohs_2011_65'
    | 'red_2014_53'
    | 'lvd_2014_35'
    | 'emc_2014_30'
    | 'maquinas_2023_1230'
    | 'ecodiseno_2023_1670'
    | 'cra_2024_2847'
  >

  // -------------------- RoHS / WEEE --------------------
  /** ¿Equipo RoHS-compliant (Dir. 2011/65/UE)? */
  rohs_compliant: boolean

  /** ¿Lleva símbolo del contenedor tachado (WEEE Art. 14)? */
  simbolo_contenedor_tachado_weee: boolean

  /** ID de registro del productor en el registro RAEE nacional (por país). */
  registro_raee_productor_por_pais?: Record<string, string>

  /** SCRAP RAEE al que está adherido (o sistema individual). */
  scrap_raee_adherido?:
    | 'ecolec' | 'ecotic' | 'ecoasimelec' | 'ecolum' | 'ecored'
    | 'sistema_individual' | 'otro'

  // -------------------- RADIO (RED) --------------------
  /** Protocolos de radio que incorpora (si equipo radioeléctrico). */
  protocolos_radio?: ProtocoloRadio[]

  // -------------------- CARGADOR COMÚN (Dir. 2022/2380) --------------------
  /** Interfaz de carga del equipo. */
  interfaz_carga?: InterfazCarga

  /** ¿Soporta USB Power Delivery (obligatorio si carga >5V/3A/15W)? */
  soporta_usb_power_delivery?: boolean

  /** ¿Se vende con opción de unbundling del cargador (Dir. 2022/2380)? */
  opcion_venta_sin_cargador?: boolean

  // -------------------- ETIQUETA ENERGÉTICA / ECODISEÑO --------------------
  /** Clase de eficiencia energética (si en alcance etiqueta · Reg. 2017/1369). */
  clase_eficiencia_energetica?: ClaseEficienciaEnergetica

  /** Identificador de registro EPREL (obligatorio antes de comercializar
   *  productos con etiqueta energética). */
  eprel_registration_id?: string

  /** Clase de reparabilidad A-E (Reg. 2023/1669 móviles/tablets). */
  clase_reparabilidad?: ClaseReparabilidad

  /** Índice de reparabilidad (0-100 si se calcula). */
  indice_reparabilidad?: number

  /** Grado de protección IP (e.g. 'IP68'). */
  grado_proteccion_ip?: string

  // -------------------- BATERÍA (Reg. 2023/1542) --------------------
  /** ¿El equipo lleva batería? */
  tiene_bateria?: boolean

  /** ¿La batería es extraíble/sustituible por el usuario (Reg. 2023/1542 ·
   *  obligatorio portátiles 18-feb-2027)? */
  bateria_extraible_usuario?: boolean

  /** Ciclos de batería certificados al 80% capacidad (≥800 móviles/tablets). */
  bateria_ciclos_80pct?: number

  // -------------------- ESPR / DURABILIDAD / SOPORTE --------------------
  /** Años de disponibilidad de piezas de repuesto comprometidos. */
  anios_disponibilidad_repuestos?: number

  /** Años de actualizaciones de software/SO comprometidos. */
  anios_actualizaciones_software?: number

  /** ¿Documentación de reparación disponible para reparadores profesionales? */
  documentacion_reparacion_disponible?: boolean

  // -------------------- IA EMBEBIDA (AI Act · si aplica) --------------------
  /** Clasificación de riesgo IA si el equipo incorpora un sistema de IA. */
  clasificacion_riesgo_ia?: ClasificacionRiesgoIA

  // -------------------- NOTA CRA --------------------
  // Los campos de ciberseguridad CRA (has_digital_elements · ce_marking_cra ·
  // sbom_url · vulnerability_disclosure_url · security_support_until · cra_class)
  // están canonizados en DPPProduct (Capa C · DPPERPLink) y NO se redefinen aquí.
  // Para equipos con elementos digitales, esos campos del DPP son obligatorios.
}

// ============================================================================
// SUB-CATEGORÍA 3 · NECESIDAD TECNOLÓGICA (DPPProduct)
// ============================================================================

export type NecesidadTecnologicaProduct = DPPProduct & {
  sub_categoria: 'necesidad_tecnologica'

  // -------------------- DESCRIPCIÓN --------------------
  /** ¿Se solicita componente upstream o equipo acabado? */
  naturaleza_solicitud: 'componente_electronico' | 'equipo_electronico'

  /** Tipo de equipo solicitado (si equipo). */
  tipo_equipo_solicitado?: TipoEquipoElectronico

  /** Familia de componente solicitada (si componente). */
  familia_componente_solicitada?: FamiliaComponenteElectronico

  /** Especificaciones técnicas clave (texto estructurado libre por el comprador). */
  especificaciones_tecnicas: string

  /** Documentos técnicos del comprador (esquemáticos · pliego · BOM). */
  documentos_tecnicos?: Array<{
    document_id: string
    document_url: string
    document_hash_sha256?: string
    tipo:
      | 'esquematico_diseno'
      | 'pliego_prescripciones'
      | 'bill_of_materials_bom'
      | 'gerber_pcb'
      | 'mecanica_3d_step'
      | 'requisitos_firmware'
      | 'casos_uso_certificacion'
      | 'otro'
  }>

  // -------------------- CANTIDADES Y PLAZOS --------------------
  /** Cantidad solicitada (unidades). */
  cantidad_total: number

  /** ¿Demanda puntual o suministro recurrente? */
  tipo_demanda: 'puntual' | 'recurrente_trimestral' | 'recurrente_anual'

  /** Volumen anual estimado si recurrente (uds). */
  volumen_anual_estimado_uds?: number

  /** Plazo de entrega objetivo (días naturales desde adjudicación). */
  plazo_entrega_objetivo_dias?: number

  // -------------------- COMPLIANCE EXIGIDA --------------------
  /** ¿Exige RoHS-compliance certificado? */
  exige_rohs?: boolean

  /** ¿Exige libre de SVHC > 0,1% + notificación SCIP? */
  exige_libre_svhc?: boolean

  /** ¿Exige diligencia debida conflict minerals 3TG? */
  exige_diligencia_3tg?: boolean

  /** Grado de calidad mínimo exigido. */
  grado_calidad_minimo?: 'consumer' | 'industrial' | 'automotive_aec_q' | 'medical' | 'military_aerospace'

  /** ¿Exige conformidad CRA (productos con elementos digitales)? Clase mínima. */
  exige_cra_clase_minima?: 'default' | 'class_I' | 'class_II'

  /** Años mínimos de soporte de seguridad exigidos (CRA). */
  anios_soporte_seguridad_minimos?: number

  /** ¿Exige interfaz de carga USB-C (cargador común)? */
  exige_usb_c?: boolean

  /** Clase de reparabilidad mínima exigida. */
  clase_reparabilidad_minima?: ClaseReparabilidad

  /** ¿Exige clasificación de riesgo IA documentada (AI Act)? */
  exige_clasificacion_ia?: boolean

  /** Certificaciones voluntarias obligatorias. */
  certificaciones_obligatorias?: Array<
    | 'epeat' | 'tco_certified' | 'energy_star'
    | 'iso_27001' | 'iso_42001' | 'common_criteria_eucc'
  >

  // -------------------- TÉRMINOS COMERCIALES --------------------
  /** Incoterm propuesto. */
  incoterm_propuesto?:
    | 'EXW' | 'FCA' | 'FAS' | 'FOB' | 'CFR' | 'CIF'
    | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP'

  /** Modalidad de pago propuesta. */
  modalidad_pago_propuesta: '02_b2b_nacional' | '03_servicios' | '04_importacion'

  /** Países origen aceptables (vacío = sin restricción). */
  paises_origen_aceptables?: ISOCountryCode[]

  /** Países origen excluidos (sanciones · ESG · cliente). */
  paises_origen_excluidos?: ISOCountryCode[]
}

// ============================================================================
// SUB-CATEGORÍA 4 · SERVICIO TECNOLÓGICO (UniversalProduct)
// ============================================================================

/** Tipo de servicio tecnológico ofertable. Incluye software/SaaS/IA (que NO
 *  son EEE físico · sin DPP físico · se modelan aquí con su propio bloque de
 *  cumplimiento digital). */
export type TipoServicioTecnologico =
  // -------------------- DESARROLLO SOFTWARE --------------------
  | 'desarrollo_software_medida'              // custom software development
  | 'desarrollo_app_movil'                    // mobile app development
  | 'desarrollo_web_frontend'                 // web/frontend
  | 'producto_saas'                           // SaaS (oferta de suscripción)
  | 'plataforma_paas'                         // PaaS
  | 'infraestructura_iaas_hosting'            // IaaS · hosting · cloud
  // -------------------- DATOS / IA --------------------
  | 'desarrollo_ia_ml'                        // IA/ML model development
  | 'producto_ia_servicio'                    // AI-as-a-service (sujeto AI Act)
  | 'analitica_datos_bi'                      // data analytics · BI
  | 'ingenieria_datos_pipelines'              // data engineering
  // -------------------- INTEGRACIÓN / TI --------------------
  | 'integracion_sistemas_erp'                // ERP/CRM integration
  | 'integracion_api_middleware'              // API · middleware
  | 'migracion_cloud'                         // cloud migration
  | 'soporte_mantenimiento_ti'                // IT support · maintenance
  | 'devops_sre'                              // DevOps · SRE
  // -------------------- CIBERSEGURIDAD --------------------
  | 'ciberseguridad_pentesting'               // pentest · auditoría ofensiva
  | 'ciberseguridad_soc_mdr'                  // SOC · MDR · monitorización
  | 'ciberseguridad_grc'                      // GRC · gestión riesgos
  | 'consultoria_cra_sbom'                    // CRA compliance + SBOM advisory
  | 'consultoria_nis2'                        // NIS2 advisory
  // -------------------- COMPLIANCE DIGITAL --------------------
  | 'consultoria_ai_act'                      // AI Act compliance
  | 'consultoria_rgpd_dpo'                    // RGPD · DPO as a service
  | 'consultoria_data_act'                    // Data Act advisory
  // -------------------- HARDWARE LIFECYCLE --------------------
  | 'reparacion_electronica'                  // electronics repair
  | 'refurbishing_reacondicionado'            // refurbishing (mercado secundario)
  | 'reciclaje_raee_weee'                     // WEEE recycling (gestor autorizado)
  | 'borrado_seguro_datos'                    // secure data wiping (NIST 800-88)
  | 'fabricacion_pcba_contract'               // contract PCB assembly (EMS)
  | 'diseno_electronico_hardware'             // hardware/electronic design
  // -------------------- CONSULTORÍA ECODISEÑO --------------------
  | 'consultoria_ecodiseno_espr'              // ESPR + DPP electrónica advisory
  | 'consultoria_rohs_reach'                  // RoHS + REACH advisory
  | 'consultoria_marcado_ce_red_emc'          // CE marking · RED · EMC · LVD
  | 'otro'

/** Modelo de cobro del servicio tecnológico. */
export type ModeloCobroServicioTecnologico =
  | 'suscripcion_mensual'                     // SaaS monthly
  | 'suscripcion_anual'                       // SaaS annual
  | 'licencia_perpetua'                       // perpetual license
  | 'por_usuario_asiento'                     // per seat
  | 'por_uso_consumo'                         // usage-based (cloud · API calls)
  | 'por_proyecto'                            // project lump sum
  | 'por_hora_consultor'                      // hourly rate
  | 'freemium'                                // freemium tiers
  | 'por_unidad_reparada_reciclada'           // per unit (repair · recycle)
  | 'a_negociar'

export type ServicioTecnologicoProduct = UniversalProduct & {
  sub_categoria: 'servicio_tecnologico'

  /** Tipo principal de servicio ofertado. */
  tipo_servicio: TipoServicioTecnologico

  /** Tipos secundarios ofertados. */
  tipos_servicio_complementarios?: TipoServicioTecnologico[]

  /** Modelo de cobro principal. */
  modelo_cobro: ModeloCobroServicioTecnologico

  // -------------------- CAPACIDADES TÉCNICAS --------------------
  /** Stack tecnológico / lenguajes / plataformas (tags libres). */
  stack_tecnologico?: string[]

  /** Sectores verticales con experiencia. */
  sectores_verticales?: string[]

  // -------------------- CUMPLIMIENTO DIGITAL (software/SaaS/IA) --------------------
  /** ¿El servicio/software trata datos personales (RGPD)? */
  trata_datos_personales?: boolean

  /** Rol RGPD del proveedor respecto a esos datos. */
  rol_rgpd?: 'responsable' | 'encargado_tratamiento' | 'subencargado' | 'no_aplica'

  /** Ubicación de los datos (residencia · UE/EEE preferente). */
  region_residencia_datos?: ISOCountryCode[]

  /** ¿Realiza transferencias internacionales de datos (Cap. V RGPD)? */
  transferencias_internacionales_datos?: boolean

  /** Mecanismo de transferencia internacional (si aplica). */
  mecanismo_transferencia?: 'adecuacion' | 'clausulas_tipo_scc' | 'bcr' | 'no_aplica'

  /** Clasificación de riesgo IA del servicio (AI Act · si incorpora IA). */
  clasificacion_riesgo_ia?: ClasificacionRiesgoIA

  /** ¿El servicio/software es un "producto con elementos digitales" en alcance
   *  CRA (Reg. 2024/2847)? El software comercial standalone está en alcance. */
  en_alcance_cra?: boolean

  /** URL del SBOM (CycloneDX/SPDX) si en alcance CRA. */
  sbom_url?: string

  /** URL del canal de divulgación de vulnerabilidades (CRA Art. 13). */
  vulnerability_disclosure_url?: string

  /** ¿El proveedor es entidad esencial/importante NIS2 (Dir. 2022/2555)? */
  entidad_nis2?: 'esencial' | 'importante' | 'no_aplica'

  /** ¿El servicio facilita el acceso/portabilidad de datos del usuario
   *  (Data Act · Reg. 2023/2854 · productos conectados + servicios cloud)? */
  cumple_portabilidad_data_act?: boolean

  // -------------------- ACREDITACIONES / CERTIFICACIONES --------------------
  /** Certificaciones de seguridad/calidad del servicio. */
  certificaciones?: Array<
    | 'iso_27001'           // gestión seguridad información
    | 'iso_42001'           // sistema gestión IA
    | 'soc_2_type_ii'       // Trust Services Criteria
    | 'iso_9001'            // calidad
    | 'common_criteria_eucc'// Common Criteria · esquema EUCC
    | 'esquema_nacional_seguridad_ens' // ENS (sector público España)
    | 'pci_dss'             // pagos
  >

  /** ID de certificación ISO 27001 (si aplica). */
  iso_27001_certificate_id?: string

  // -------------------- LIFECYCLE HARDWARE (reparación · reciclaje) --------------------
  /** Nº de autorización como gestor de residuos RAEE (si reciclaje WEEE). */
  autorizacion_gestor_raee_id?: string

  /** ¿Emite certificado de destrucción/borrado seguro de datos? */
  emite_certificado_borrado_datos?: boolean

  /** ¿Emite eslabón firmado Ed25519 en la cadena de custodia del DPP del
   *  equipo (reparación · refurbishing · reciclaje)? */
  emite_eslabon_custody_chain?: boolean

  // -------------------- COMERCIAL --------------------
  /** SLA de disponibilidad comprometido (% · e.g. 99.9). */
  sla_disponibilidad_pct?: number

  /** ¿Ofrece periodo de prueba/PoC? */
  ofrece_prueba_poc?: boolean
}

// ============================================================================
// UNION TYPE · cualquier ficha del sector TECNOLOGÍA
// ============================================================================

export type TecnologiaProduct =
  | ComponenteElectronicoProduct
  | EquipoElectronicoProduct
  | NecesidadTecnologicaProduct
  | ServicioTecnologicoProduct

// ============================================================================
// SCHEMA METADATA
// ============================================================================

/** Versión del schema sectorial tecnología. */
export const TECNOLOGIA_SCHEMA_VERSION = 'tecnologia@1.0+dpp@1.1' as const

/** Estado de validación del schema sectorial.
 *
 *  Estado 'subject_to_expert' canonizado en ADR 0011 (Audit-Ready by Design).
 *  Antes de pasar a 'validated' se requiere:
 *
 *  - AMETIC (patronal tecnología digital + electrónica España): revisión
 *    denominaciones · procesos · roles · capacidades reales del cluster.
 *  - COIT/AEIT + Organismo Notificado RED/EMC/LVD (Applus+ · DEKRA · TÜV):
 *    valida conformidad radioeléctrica + eléctrica + EMC.
 *  - SCRAP RAEE acreditado (Ecolec · Ecotic · Ecoasimelec · Ecolum · Ecored):
 *    valida obligaciones WEEE Dir. 2012/19/UE + RD nacional vigente.
 *  - Laboratorio acreditado ENAC/ILAC: valida ensayos RoHS (XRF + GC-MS) +
 *    REACH SVHC + IP rating + ciclos de batería.
 *  - INCIBE + auditor CRA acreditado: valida ciberseguridad de producto
 *    (SBOM + vulnerability disclosure + soporte) Reg. (UE) 2024/2847.
 *  - AESIA (Agencia Española de Supervisión de la IA) + auditor AI Act:
 *    valida clasificación de riesgo IA Reg. (UE) 2024/1689.
 *  - AEPD: valida tratamiento de PII en software/SaaS (RGPD).
 *  - Auditoría jurídica especialista tech compliance (RoHS + WEEE + RED + CRA +
 *    AI Act + NIS2 + Data Act + RGPD): valida cobertura legal completa,
 *    incluida la legislación escalonada 2027+ y la pendiente de aprobación.
 *
 *  Ver `docs/adr/0011-taxonomy-status-extension.md`.
 */
export const TECNOLOGIA_SCHEMA_STATUS = 'subject_to_expert' as const

// ============================================================================
// TYPE GUARDS · runtime discrimination
// ============================================================================

export function isComponenteElectronico(p: TecnologiaProduct): p is ComponenteElectronicoProduct {
  return p.sub_categoria === 'componente_electronico'
}

export function isEquipoElectronico(p: TecnologiaProduct): p is EquipoElectronicoProduct {
  return p.sub_categoria === 'equipo_electronico'
}

export function isNecesidadTecnologica(p: TecnologiaProduct): p is NecesidadTecnologicaProduct {
  return p.sub_categoria === 'necesidad_tecnologica'
}

export function isServicioTecnologico(p: TecnologiaProduct): p is ServicioTecnologicoProduct {
  return p.sub_categoria === 'servicio_tecnologico'
}

// ============================================================================
// HELPERS DE CUMPLIMIENTO
// ============================================================================

/** ¿El producto es EEE en alcance RoHS (Dir. 2011/65/UE · marcado CE +
 *  restricción 10 sustancias)? Aplica a componentes y equipos electrónicos. */
export function requiereConformidadRoHS(p: TecnologiaProduct): boolean {
  return isComponenteElectronico(p) || isEquipoElectronico(p)
}

/** ¿El equipo es EEE en alcance WEEE/RAEE (Dir. 2012/19/UE · registro productor
 *  + símbolo contenedor tachado + EPR)? Aplica a equipos acabados. */
export function requiereRegistroWEEE(p: TecnologiaProduct): boolean {
  return isEquipoElectronico(p)
}

/** ¿El equipo está en alcance del cargador común USB-C (Dir. (UE) 2022/2380)?
 *
 *  Categorías en alcance desde 28-dic-2024: móviles · tablets · cámaras ·
 *  auriculares · altavoces portátiles · consolas portátiles · e-readers ·
 *  teclados/ratones · navegadores · earbuds. PORTÁTILES desde 28-abr-2026. */
export function requiereCargadorComunUSBC(p: TecnologiaProduct): boolean {
  if (!isEquipoElectronico(p)) return false
  const enAlcance: TipoEquipoElectronico[] = [
    'smartphone',
    'telefono_movil_basico',
    'tablet',
    'portatil_laptop',          // desde 28-abr-2026
    'camara_digital',
    'auriculares_altavoz',
    'consola_videojuegos',
    'periferico',               // teclados · ratones (si recarga por cable)
    'wearable',
  ]
  return enAlcance.includes(p.tipo_equipo)
}

/** ¿El equipo está en alcance de ecodiseño + etiqueta energética de móviles/
 *  tablets (Reg. (UE) 2023/1670 + 2023/1669 · clase A-G + reparabilidad A-E)? */
export function requiereEtiquetaEnergeticaMoviles(p: TecnologiaProduct): boolean {
  if (!isEquipoElectronico(p)) return false
  return p.tipo_equipo === 'smartphone' || p.tipo_equipo === 'tablet' || p.tipo_equipo === 'telefono_movil_basico'
}

/** ¿El producto/servicio incorpora un sistema de IA de alto riesgo o prohibido
 *  según AI Act (Reg. (UE) 2024/1689)? */
export function esAltoRiesgoOProhibidoIA(p: TecnologiaProduct): boolean {
  let clasif: ClasificacionRiesgoIA | undefined
  if (isEquipoElectronico(p)) clasif = p.clasificacion_riesgo_ia
  else if (isServicioTecnologico(p)) clasif = p.clasificacion_riesgo_ia
  if (!clasif) return false
  return (
    clasif === 'riesgo_inaceptable_prohibido' ||
    clasif === 'alto_riesgo_anexo_iii' ||
    clasif === 'alto_riesgo_producto_anexo_i' ||
    clasif === 'gpai_riesgo_sistemico'
  )
}

/** ¿El servicio/software está en alcance CRA como producto con elementos
 *  digitales (Reg. (UE) 2024/2847 · SBOM + vuln disclosure obligatorios)? */
export function servicioEnAlcanceCRA(p: TecnologiaProduct): boolean {
  return isServicioTecnologico(p) && p.en_alcance_cra === true
}

/** ¿El producto/equipo contiene minerales de conflicto 3TG y por tanto está en
 *  alcance de la diligencia debida (Reg. (UE) 2017/821)? */
export function contieneMineralesConflicto3TG(p: TecnologiaProduct): boolean {
  if (!isComponenteElectronico(p)) return false
  return (p.minerales_conflicto_3tg?.length ?? 0) > 0
}
