// Capa 2 · ENFORCEMENT de cumplimiento sectorial · Audit-Ready by Design.
//
// Mientras los `_dppValidators.ts` validan la ESTRUCTURA (shape) de las capas
// DPP base (CRA · EUDR · IMDG) con Zod, este módulo aplica las REGLAS DE
// NEGOCIO LEGAL específicas de cada sector: dado un producto bien formado,
// ¿cumple las obligaciones legales que le aplican para poder publicarse?
//
// FILOSOFÍA (canon José 2026-05-29):
//   "Las leyes las tenemos que tener aplicadas a falta de supervisión · la
//    auditoría es lo último · si falta cumplimiento no pasaríamos."
//
// Este módulo NO sella el cumplimiento legal (eso es del experto · CLAUDE.md §1).
// Lo que hace es FORZARLO en el sistema: una ficha que incumple una regla
// `blocker` NO debe poder publicarse (status → publicado). Es el gate único que
// debe invocar:
//   - el endpoint server-side de creación/edición de ficha (cuando exista),
//   - la Edge Function `dpp-validator` antes de marcar un DPP como válido,
//   - los tests de cumplimiento por sector.
//
// Cada regla cita la norma concreta. `blocker` = impide publicación.
// `warning` = obligación que el publicante debe atender pero no bloquea el
// listing (p.ej. obligaciones que varían por CCAA · subject_to_expert).
//
// Las reglas REUTILIZAN los predicados `requiere*` ya definidos en cada schema
// sectorial (fuente única de "¿cuándo aplica esta ley?").

import {
  type TecnologiaProduct,
  isComponenteElectronico,
  isEquipoElectronico,
  isServicioTecnologico,
  requiereConformidadRoHS,
  requiereRegistroWEEE,
  requiereCargadorComunUSBC,
  esAltoRiesgoOProhibidoIA,
  servicioEnAlcanceCRA,
  contieneMineralesConflicto3TG,
} from './tecnologia'
import {
  type TurismoProduct,
  isAlojamientoTuristico,
  isExperienciaTuristica,
  isServicioIntermediacionViaje,
  enAlcanceSTRReg2024_1028,
  requiereRegistroTuristicoAutonomico,
  requiereProteccionInsolvenciaPackageTravel,
  requiereInfoAlergenos,
  requiereGuiaOficialHabilitado,
  esPlataformaDAC7,
} from './turismo'
import {
  type TextilProduct,
  isTextilMaterial,
  isTextilConfeccionado,
  requiereEtiquetado1007_2011,
  requiereNotifiedBodyPPE,
  requiereAdhesionSCRAP_RD_1055_2022,
  contieneCueroBovinoEUDR,
} from './textil'
import {
  type MetalurgicoProduct,
  isMaterialMetalurgico,
  isEquipoPresion,
  requiereNotifiedBodyPED,
  requiereMarcadoCEEN1090,
  enAlcanceCBAM,
} from './metalurgico'
import {
  type SaludProduct,
  isProductoSanitario,
  isServicioProfesionalSanitario,
} from './salud'
import {
  type AutomocionProduct,
  isVehiculo,
} from './automocion'
import {
  type AgroalimentarioProduct,
  isProductoAgroalimentario,
} from './agroalimentario'
import {
  type InmobiliarioProduct,
  isInmueble,
} from './inmobiliario'
import {
  type EnergiaProduct,
  isInstalacionEnergetica,
  isServicioEnergetico,
} from './energia'
import {
  type LegalProduct,
  isServicioJuridico,
  isServicioNotarial,
} from './legal'
import {
  type TransporteProduct,
  isServicioTransitario,
  isServicioNaviero,
  requiereLicenciaComunitaria1072,
} from './transporte'
import {
  type EducacionProduct,
  isServicioFormativo,
  isAcreditacionTitulo,
  emiteTituloOficial,
  requiereAcreditacionANECA,
  habilitaProfesionRegulada,
  dirigidoAMenores,
  enAlcanceEAA,
  esFormacionDistanciaB2C,
} from './educacion'
import {
  type MedioambienteProduct,
  isServicioAmbiental,
  isGestionResiduo,
  isMaterialRecuperado,
  requiereAutorizacionGestorResiduos,
  esResiduoPeligroso,
  transportaResiduoPeligroso,
  esTrasladoTransfronterizoResiduo,
  declaraFinDeResiduo,
  requiereAutorizacionAgua,
  requiereAutorizacionAmbientalIntegrada,
  enAlcanceEIA as medioambienteEnAlcanceEIA,
  requiereGarantiaResponsabilidadAmbiental,
} from './medioambiente'
import {
  type CulturaProduct,
  isProduccionCultural,
  isBienCultural,
  isServicioDeportivo,
  requiereDerechosDocumentados,
  requiereGestionColectiva,
  esVentaEntradasDistancia,
  enAlcanceEAA as culturaEnAlcanceEAA,
  requiereLicenciaExportacionBienCultural,
  requiereLicenciaImportacionBienCultural,
  esBienPatrimonioRestringido,
  requiereCumplimientoAntidopaje,
  esInstalacionDeportiva,
} from './cultura'
import {
  type InstitucionalProduct,
  isLicitacionPublica,
  isOfertaProveedorPublico,
  isServicioAsistenciaTecnica,
  esTecnologiaPublicaWeb,
} from './institucional'
import {
  type ServiciosAuxiliaresProduct,
  isServicioAuxiliar,
  isServicioSeguridadPrivada,
  isServicioTrabajoTemporal,
  esControlPlagas,
  requierePRL,
} from './serviciosAuxiliares'
import {
  type FinancieroProduct,
  isServicioBancario,
  isServicioInversion,
  isServicioCripto,
  isServicioSeguro,
  requiereTravelRule,
} from './financiero'
import {
  type FiscalInvoicingData,
  validateFiscalCompliance,
} from './_fiscal'
import {
  type JurisdiccionScope,
  reglaAplica,
  jurisdiccionesAplicables,
  jurisdiccionesAplicablesOperacion,
} from './_jurisdiccion'

// ============================================================================
// TIPOS DE RESULTADO
// ============================================================================

/** Severidad de un incumplimiento.
 *  - blocker: impide publicar la ficha (obligación legal dura para listar).
 *  - warning: obligación legal aplicable que el publicante debe atender, pero
 *    que no bloquea el listing (p.ej. varía por jurisdicción · subject_to_expert). */
export type ComplianceSeverity = 'blocker' | 'warning'

/** Un incumplimiento detectado. */
export type ComplianceViolation = {
  /** Código máquina estable (para tests · i18n · telemetría). */
  rule: string
  /** Referencia legal humana (norma + artículo). */
  law: string
  /** Explicación accionable para el publicante. */
  message: string
  /** Campo que origina el incumplimiento (si aplica). */
  field?: string
  /** Severidad. */
  severity: ComplianceSeverity
  /** Ordenamiento del que emana la regla (ADR 0020). 'UE'/'EEE'/ISO país/'global'.
   *  Si se omite se trata como 'global' (aplica siempre · conservador). */
  jurisdiccion?: JurisdiccionScope
  /** URL oficial de la norma citada (EUR-Lex para Derecho UE · BOE para Derecho ES ·
   *  fuente del convenio para Derecho internacional). VERIFICADA contra la fuente
   *  (canon José: "0 atajos · siempre fuentes oficiales"). Permite trazabilidad y
   *  auditoría: el publicante/auditor puede ir a la norma exacta. */
  fuente_url?: string
}

/** Resultado de la evaluación de cumplimiento de una ficha. */
export type ComplianceResult = {
  /** true si NO hay ningún `blocker` (puede publicarse · warnings aparte). */
  ok: boolean
  /** Lista completa de incumplimientos (blockers + warnings). */
  violations: ComplianceViolation[]
}

/** Construye el resultado final a partir de la lista de violaciones. */
function buildResult(violations: ComplianceViolation[]): ComplianceResult {
  return {
    ok: !violations.some((v) => v.severity === 'blocker'),
    violations,
  }
}

/** Filtra un resultado de cumplimiento dejando solo las violaciones cuya
 *  jurisdicción APLICA a la operación (ADR 0020). Una operación se identifica por
 *  el país del actor + el país del mercado de destino. Las reglas 'global' (o sin
 *  jurisdicción declarada) siempre se conservan.
 *
 *  Ejemplo: un actor US vendiendo a mercado US NO arrastra las reglas 'UE'
 *  (marcado CE, EAA, etc.); un actor ES o una venta hacia la UE sí. */
export function filtrarPorJurisdiccion(
  result: ComplianceResult,
  paisActor?: string,
  paisMercado?: string,
): ComplianceResult {
  const aplicables = jurisdiccionesAplicables(paisActor, paisMercado)
  const violations = result.violations.filter((v) => reglaAplica(v.jurisdiccion, aplicables))
  return buildResult(violations)
}

/** Filtra un ComplianceResult por la jurisdicción de la OPERACIÓN (país del actor +
 *  mercados de destino), con semántica **SAFE-BY-DEFAULT** pensada para un gate legal:
 *  NUNCA suprime una violación salvo que haya EVIDENCIA POSITIVA de que la operación
 *  queda fuera del ordenamiento del que emana la regla.
 *
 *  La resolución de qué jurisdicciones aplican (y cuándo NO hay evidencia suficiente para
 *  filtrar) vive en `jurisdiccionesAplicablesOperacion` (_jurisdiccion.ts, testeable en
 *  aislamiento). Si devuelve `null` → no se suprime nada (se evita el FALSO NEGATIVO
 *  legal: suprimir un blocker que sí aplicaba, peor que sobre-bloquear). DIPr fino =
 *  subject_to_expert (ADR 0020 §2.5). */
export function filtrarPorJurisdiccionOperacion(
  result: ComplianceResult,
  paisActor: string | null | undefined,
  mercados: readonly string[] | null | undefined,
): ComplianceResult {
  const aplicables = jurisdiccionesAplicablesOperacion(paisActor, mercados)
  if (aplicables === null) return result
  const violations = result.violations.filter((v) => reglaAplica(v.jurisdiccion, aplicables))
  return buildResult(violations)
}

// ============================================================================
// SECTOR TECNOLOGÍA · enforcement
// ============================================================================

/** Aplica las reglas legales del sector tecnología a una ficha bien formada. */
export function validateTecnologiaCompliance(p: TecnologiaProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // RoHS · Dir. 2011/65/UE · EEE no puede declararse no-conforme y publicarse.
  if (requiereConformidadRoHS(p)) {
    if (isComponenteElectronico(p) && p.rohs_compliant === false) {
      v.push({
        rule: 'ROHS_NON_COMPLIANT',
        law: 'Dir. 2011/65/UE (RoHS) Art. 4',
        message: 'El componente EEE declara rohs_compliant=false; no puede comercializarse en la UE sin conformidad RoHS (restricción de 10 sustancias).',
        field: 'rohs_compliant',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011L0065',
      })
    }
    if (isEquipoElectronico(p) && p.rohs_compliant === false) {
      v.push({
        rule: 'ROHS_NON_COMPLIANT',
        law: 'Dir. 2011/65/UE (RoHS) Art. 4',
        message: 'El equipo EEE declara rohs_compliant=false; no puede comercializarse en la UE sin conformidad RoHS.',
        field: 'rohs_compliant',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011L0065',
      })
    }
  }

  // WEEE · Dir. 2012/19/UE Art. 14 · símbolo del contenedor tachado obligatorio.
  if (requiereRegistroWEEE(p) && isEquipoElectronico(p) && !p.simbolo_contenedor_tachado_weee) {
    v.push({
      rule: 'WEEE_MARKING_MISSING',
      law: 'Dir. 2012/19/UE (WEEE/RAEE) Art. 14',
      message: 'El equipo EEE debe llevar el símbolo del contenedor de basura tachado (recogida selectiva RAEE).',
      field: 'simbolo_contenedor_tachado_weee',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32012L0019',
    })
  }

  // Cargador común · Dir. (UE) 2022/2380 · conector propietario prohibido en alcance.
  if (requiereCargadorComunUSBC(p) && isEquipoElectronico(p) && p.interfaz_carga === 'propietario_legacy') {
    v.push({
      rule: 'COMMON_CHARGER_PROPRIETARY',
      law: 'Dir. (UE) 2022/2380 (modifica RED 2014/53/UE)',
      message: 'El equipo está en alcance del cargador común y declara interfaz propietaria; debe usar USB-C (portátiles desde 28-abr-2026, resto desde 28-dic-2024).',
      field: 'interfaz_carga',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32022L2380',
    })
  }

  // AI Act · Reg. (UE) 2024/1689 Art. 5 · prácticas de IA prohibidas.
  if (esAltoRiesgoOProhibidoIA(p)) {
    const clasif =
      isEquipoElectronico(p) ? p.clasificacion_riesgo_ia
      : isServicioTecnologico(p) ? p.clasificacion_riesgo_ia
      : undefined
    if (clasif === 'riesgo_inaceptable_prohibido') {
      v.push({
        rule: 'AI_PROHIBITED_PRACTICE',
        law: 'Reg. (UE) 2024/1689 (AI Act) Art. 5',
        message: 'El producto/servicio incorpora un sistema de IA de riesgo inaceptable (prohibido desde 2-feb-2025); no puede comercializarse.',
        field: 'clasificacion_riesgo_ia',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32024R1689',
      })
    } else {
      v.push({
        rule: 'AI_HIGH_RISK_REQUIRES_CONFORMITY',
        law: 'Reg. (UE) 2024/1689 (AI Act) Anexo III / Art. 6',
        message: 'El sistema de IA es de alto riesgo; requiere evaluación de conformidad + marcado CE + registro antes de comercializarse (escalonado 2026-2027).',
        field: 'clasificacion_riesgo_ia',
        severity: 'warning',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32024R1689',
      })
    }
  }

  // CRA · Reg. (UE) 2024/2847 Art. 13 · software/servicio con elementos digitales
  // requiere SBOM. (Para hardware con has_digital_elements el enforcement vive en
  // _dppValidators.ts sobre la capa DPPERPLink.)
  if (servicioEnAlcanceCRA(p) && isServicioTecnologico(p) && !p.sbom_url) {
    v.push({
      rule: 'CRA_SBOM_MISSING',
      law: 'Reg. (UE) 2024/2847 (CRA) Art. 13',
      message: 'El producto con elementos digitales está en alcance CRA y no aporta SBOM (Software Bill of Materials).',
      field: 'sbom_url',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32024R2847',
    })
  }

  // Conflict minerals · Reg. (UE) 2017/821 · diligencia debida 3TG.
  if (contieneMineralesConflicto3TG(p) && isComponenteElectronico(p) && p.diligencia_debida_3tg_completada !== true) {
    v.push({
      rule: 'CONFLICT_MINERALS_DUE_DILIGENCE_PENDING',
      law: 'Reg. (UE) 2017/821 (Conflict Minerals)',
      message: 'El componente contiene minerales 3TG (estaño/tantalio/wolframio/oro); debe completarse la diligencia debida de la cadena de suministro.',
      field: 'diligencia_debida_3tg_completada',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32017R0821',
    })
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR TURISMO · enforcement
// ============================================================================

/** Aplica las reglas legales del sector turismo a una ficha bien formada. */
export function validateTurismoCompliance(p: TurismoProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // Alquiler corta duración · Reg. (UE) 2024/1028 + RD 1312/2024 · NRA obligatorio.
  if (enAlcanceSTRReg2024_1028(p) && isAlojamientoTuristico(p) && !p.numero_registro_arrendamiento_nra) {
    v.push({
      rule: 'STR_NRA_MISSING',
      law: 'Reg. (UE) 2024/1028 + RD 1312/2024 (NRA)',
      message: 'El alojamiento de corta duración requiere Número de Registro de Arrendamiento (NRA) verificable por las plataformas (aplica 20-may-2026; en España desde 1-jul-2025).',
      field: 'numero_registro_arrendamiento_nra',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32024R1028',
    })
  }

  // Registro turístico autonómico · obligatorio para publicitar alojamiento.
  if (requiereRegistroTuristicoAutonomico(p) && isAlojamientoTuristico(p) && !p.numero_registro_turistico_autonomico) {
    v.push({
      rule: 'TOURISM_REGISTRY_MISSING',
      law: 'Legislación turística autonómica (Art. 148.1.18ª CE)',
      message: 'El alojamiento debe tener número de registro de establecimiento turístico autonómico para publicitarse (varía por CCAA · subject_to_expert).',
      field: 'numero_registro_turistico_autonomico',
      severity: 'blocker',
      jurisdiccion: 'ES',
      fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1978-31229',
    })
  }

  // Viajes combinados · Dir. (UE) 2015/2302 · protección frente a insolvencia.
  // El predicado garantiza intermediación + comercializa_viajes_combinados=true;
  // el type guard hace el narrowing seguro al sub-tipo.
  if (
    requiereProteccionInsolvenciaPackageTravel(p) &&
    isServicioIntermediacionViaje(p) &&
    p.tiene_proteccion_insolvencia !== true
  ) {
    v.push({
      rule: 'PACKAGE_TRAVEL_INSOLVENCY_MISSING',
      law: 'Dir. (UE) 2015/2302 (Viajes Combinados) Art. 17',
      message: 'Quien comercializa viajes combinados debe disponer de garantía frente a insolvencia (aval/seguro/fondo) que cubra reembolsos y repatriación.',
      field: 'tiene_proteccion_insolvencia',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32015L2302',
    })
  }

  // Información alimentaria · Reg. (UE) 1169/2011 · declaración de alérgenos.
  if (requiereInfoAlergenos(p)) {
    const declara =
      (isAlojamientoTuristico(p) || isExperienciaTuristica(p))
        ? p.cumplimiento_fyb?.declara_alergenos_1169_2011
        : undefined
    if (declara !== true) {
      v.push({
        rule: 'FOOD_ALLERGENS_MISSING',
        law: 'Reg. (UE) 1169/2011 Anexo II',
        message: 'El servicio incluye restauración (F&B) y debe declarar la información de los 14 alérgenos.',
        field: 'cumplimiento_fyb.declara_alergenos_1169_2011',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011R1169',
      })
    }
  }

  // Guía oficial · habilitación autonómica (varía por CCAA · subject_to_expert).
  if (requiereGuiaOficialHabilitado(p) && isExperienciaTuristica(p) && !p.habilitacion_guia_id) {
    v.push({
      rule: 'TOURIST_GUIDE_LICENSE_MISSING',
      law: 'Habilitación de guía turístico (normativa autonómica · Dir. 2006/123/CE)',
      message: 'La actividad declara requerir guía oficial habilitado pero no aporta número de habilitación (varía por CCAA · subject_to_expert).',
      field: 'habilitacion_guia_id',
      severity: 'warning',
      jurisdiccion: 'ES',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32006L0123',
    })
  }

  // Seguro RC en actividades · recomendación dura para experiencias.
  if (isExperienciaTuristica(p) && p.tiene_seguro_rc !== true) {
    v.push({
      rule: 'ACTIVITY_LIABILITY_INSURANCE_MISSING',
      law: 'Normativa turismo activo autonómica (responsabilidad civil)',
      message: 'La experiencia/actividad no declara seguro de responsabilidad civil; la mayoría de CCAA lo exigen para turismo activo (subject_to_expert).',
      field: 'tiene_seguro_rc',
      severity: 'warning',
      jurisdiccion: 'ES',
    })
  }

  // DAC7 · Dir. (UE) 2021/514 · obligación de reporte de la plataforma.
  if (esPlataformaDAC7(p)) {
    v.push({
      rule: 'DAC7_REPORTING_OBLIGATION',
      law: 'Dir. (UE) 2021/514 (DAC7)',
      message: 'El servicio es operador de plataforma digital y está sujeto a la obligación de reporte DAC7 de los ingresos de los prestadores.',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32021L0514',
    })
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR TEXTIL · enforcement
// ============================================================================

/** Aplica las reglas legales del sector textil a una ficha bien formada. */
export function validateTextilCompliance(p: TextilProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // Etiquetado · Reg. (UE) 1007/2011 Art. 14 · denominación + composición fibras.
  if (
    requiereEtiquetado1007_2011(p) &&
    (isTextilMaterial(p) || isTextilConfeccionado(p)) &&
    p.etiqueta_1007_2011_validada !== true
  ) {
    v.push({
      rule: 'TEXTILE_LABELING_MISSING',
      law: 'Reg. (UE) 1007/2011 Art. 14',
      message: 'El textil debe llevar etiqueta con denominación y composición porcentual de fibras validada antes de comercializarse en la UE.',
      field: 'etiqueta_1007_2011_validada',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011R1007',
    })
  }

  // PPE · Reg. (UE) 2016/425 · EPI textil cat. II/III requiere Organismo Notificado.
  if (requiereNotifiedBodyPPE(p) && isTextilConfeccionado(p) && !p.ppe_notified_body_id) {
    v.push({
      rule: 'PPE_NOTIFIED_BODY_MISSING',
      law: 'Reg. (UE) 2016/425 (EPI)',
      message: 'El EPI textil de categoría II/III requiere intervención de Organismo Notificado para el marcado CE.',
      field: 'ppe_notified_body_id',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0425',
    })
  }

  // EPR textil · RD 1055/2022 · adhesión a SCRAP o sistema individual.
  // Warning (no blocker): el campo no captura el sistema individual, evitar
  // bloquear a productores con sistema propio (honestidad · no falso positivo).
  if (requiereAdhesionSCRAP_RD_1055_2022(p) && isTextilConfeccionado(p) && p.scrap_textil_adherido !== true) {
    v.push({
      rule: 'TEXTILE_EPR_SCRAP_PENDING',
      law: 'RD 1055/2022 (EPR textil) + Dir. 2008/98/CE',
      message: 'El productor de textil confeccionado debe estar adherido a un SCRAP textil acreditado o acreditar sistema individual EPR.',
      field: 'scrap_textil_adherido',
      severity: 'warning',
      jurisdiccion: 'ES',
      fuente_url: 'https://www.boe.es/eli/es/rd/2022/12/27/1055',
    })
  }

  // EUDR · Reg. (UE) 2023/1115 · cuero bovino debe marcarse en alcance.
  if (
    contieneCueroBovinoEUDR(p) &&
    (isTextilMaterial(p) || isTextilConfeccionado(p)) &&
    p.in_eudr_scope !== true
  ) {
    v.push({
      rule: 'EUDR_LEATHER_NOT_FLAGGED',
      law: 'Reg. (UE) 2023/1115 (EUDR) Anexo I',
      message: 'El producto contiene cuero bovino; debe marcarse in_eudr_scope=true y completar DDS + geolocalización (enforcement de completitud en la capa DPP).',
      field: 'in_eudr_scope',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R1115',
    })
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR METALÚRGICO · enforcement
// ============================================================================

/** Aplica las reglas legales del sector metalúrgico a una ficha bien formada. */
export function validateMetalurgicoCompliance(p: MetalurgicoProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // PED · Dir. 2014/68/UE · equipo a presión cat. II+ requiere Organismo Notificado.
  if (requiereNotifiedBodyPED(p) && isEquipoPresion(p) && !p.notified_body_id) {
    v.push({
      rule: 'PED_NOTIFIED_BODY_MISSING',
      law: 'Dir. 2014/68/UE (PED) Anexo III',
      message: 'El equipo a presión de categoría II o superior requiere intervención de Organismo Notificado (módulo de evaluación de conformidad).',
      field: 'notified_body_id',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014L0068',
    })
  }

  // CPR + EN 1090 · Reg. (UE) 305/2011 · producto estructural requiere marcado CE.
  if (requiereMarcadoCEEN1090(p) && isMaterialMetalurgico(p) && !p.fpc_en_1090_notified_body) {
    v.push({
      rule: 'EN1090_CE_MARKING_MISSING',
      law: 'Reg. (UE) 305/2011 (CPR) + EN 1090-1',
      message: 'El producto destinado a uso estructural (EN 1090) requiere marcado CE + Declaración de Prestaciones + FPC certificado por Organismo Notificado.',
      field: 'fpc_en_1090_notified_body',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011R0305',
    })
  }

  // REACH · Reg. (CE) 1907/2006 Art. 33 · SVHC declarado debe enumerarse.
  if (
    isMaterialMetalurgico(p) &&
    p.contiene_svhc_reach === true &&
    (!p.svhc_substances || p.svhc_substances.length === 0)
  ) {
    v.push({
      rule: 'REACH_SVHC_NOT_ENUMERATED',
      law: 'Reg. (CE) 1907/2006 (REACH) Art. 33',
      message: 'El material declara contener SVHC ≥ 0,1% en peso pero no enumera las sustancias (CAS + concentración).',
      field: 'svhc_substances',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32006R1907',
    })
  }

  // CBAM · Reg. (UE) 2023/956 · huella de carbono embebida en alcance.
  if (enAlcanceCBAM(p) && isMaterialMetalurgico(p) && !p.carbon_footprint_cbam) {
    v.push({
      rule: 'CBAM_FOOTPRINT_MISSING',
      law: 'Reg. (UE) 2023/956 (CBAM) Anexo IV',
      message: 'El material en alcance CBAM (hierro/acero/aluminio/derivados) debe declarar la huella de carbono embebida; fase definitiva con compra de certificados desde 1-ene-2026.',
      field: 'carbon_footprint_cbam',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R0956',
    })
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR SALUD · enforcement
// ============================================================================

/** Aplica las reglas legales del sector salud a una ficha bien formada. */
export function validateSaludCompliance(p: SaludProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  if (isProductoSanitario(p)) {
    // Dispositivo médico (presencia de identificacion_dispositivo) → MDR.
    if (p.identificacion_dispositivo) {
      if (!p.conformidad_ce || p.conformidad_ce.tiene_marcado_ce !== true) {
        v.push({
          rule: 'MDR_CE_MARKING_MISSING',
          law: 'Reg. (UE) 2017/745 (MDR) Art. 20',
          message: 'El producto sanitario (dispositivo médico) debe tener marcado CE conforme MDR antes de comercializarse.',
          field: 'conformidad_ce.tiene_marcado_ce',
          severity: 'blocker',
          jurisdiccion: 'UE',
          fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32017R0745',
        })
      }
      if (!p.identificacion_dispositivo.basic_udi_di) {
        v.push({
          rule: 'MDR_UDI_MISSING',
          law: 'Reg. (UE) 2017/745 (MDR) Art. 27',
          message: 'El dispositivo médico debe tener Basic UDI-DI asignado (identificación única).',
          field: 'identificacion_dispositivo.basic_udi_di',
          severity: 'blocker',
          jurisdiccion: 'UE',
          fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32017R0745',
        })
      }
    }
    // Medicamento (identificacion_medicamento o tipo_medicamento) → autorización.
    if ((p.identificacion_medicamento || p.tipo_medicamento) && (!p.autorizacion_medicamento || !p.autorizacion_medicamento.numero_autorizacion)) {
      v.push({
        rule: 'MEDICINE_MARKETING_AUTH_MISSING',
        law: 'Dir. 2001/83/CE + Reg. (CE) 726/2004',
        message: 'El medicamento requiere autorización de comercialización (AEMPS/EMA) antes de venderse.',
        field: 'autorizacion_medicamento.numero_autorizacion',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32001L0083',
      })
    }
  }

  if (isServicioProfesionalSanitario(p)) {
    // Colegiación obligatoria + ejerciente activo (Ley 44/2003 LOPS).
    if (p.colegiacion.es_ejerciente !== true || !p.colegiacion.numero_colegiado) {
      v.push({
        rule: 'HEALTH_PRO_NOT_LICENSED',
        law: 'Ley 44/2003 (LOPS) · colegiación obligatoria',
        message: 'El profesional sanitario debe estar colegiado y ejerciente activo para ofrecer el servicio.',
        field: 'colegiacion',
        severity: 'blocker',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/eli/es/l/2003/11/21/44',
      })
    }
    // Seguro de responsabilidad civil profesional (Ley 44/2003 Art. 46).
    if (!p.colegiacion.seguro_rcp_pdf_url) {
      v.push({
        rule: 'HEALTH_PRO_INSURANCE_MISSING',
        law: 'Ley 44/2003 Art. 46 (seguro RCP)',
        message: 'El profesional sanitario debe acreditar seguro de responsabilidad civil profesional.',
        field: 'colegiacion.seguro_rcp_pdf_url',
        severity: 'warning',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/eli/es/l/2003/11/21/44',
      })
    }
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR AUTOMOCIÓN · enforcement
// ============================================================================

/** Aplica las reglas legales del sector automoción a una ficha bien formada. */
export function validateAutomocionCompliance(p: AutomocionProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  if (isVehiculo(p)) {
    const id = p.identificacion
    // Homologación de tipo · Reg. (UE) 2018/858 (salvo histórico pre-homologación).
    if (
      id.tipo_homologacion !== 'historico_pre_homologacion' &&
      !id.numero_homologacion &&
      id.tiene_coc_europeo !== true
    ) {
      v.push({
        rule: 'VEHICLE_TYPE_APPROVAL_MISSING',
        law: 'Reg. (UE) 2018/858 (homologación de tipo)',
        message: 'El vehículo debe disponer de homologación de tipo (número de homologación o COC europeo) para su comercialización/matriculación.',
        field: 'identificacion.numero_homologacion',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32018R0858',
      })
    }
    // COC europeo para homologación de tipo UE completa.
    if (id.tipo_homologacion === 'eu_whole_vehicle_type_approval' && id.tiene_coc_europeo !== true) {
      v.push({
        rule: 'VEHICLE_COC_MISSING',
        law: 'Reg. (UE) 2018/858 (Certificate of Conformity)',
        message: 'El vehículo con homologación de tipo UE completa debe disponer de Certificado de Conformidad (COC) europeo.',
        field: 'identificacion.tiene_coc_europeo',
        severity: 'warning',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32018R0858',
      })
    }
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR AGROALIMENTARIO · enforcement
// ============================================================================

/** Aplica las reglas legales del sector agroalimentario a una ficha bien formada. */
export function validateAgroalimentarioCompliance(p: AgroalimentarioProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  if (isProductoAgroalimentario(p)) {
    // Información alimentaria · Reg. (UE) 1169/2011 · alérgenos obligatorios
    // para todo alimento. Sin info_consumidor no hay declaración de alérgenos.
    if (!p.info_consumidor) {
      v.push({
        rule: 'FOOD_CONSUMER_INFO_MISSING',
        law: 'Reg. (UE) 1169/2011 (FIC) Art. 9 + 21',
        message: 'El producto alimentario debe aportar información al consumidor (denominación, ingredientes y alérgenos obligatorios).',
        field: 'info_consumidor',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011R1169',
      })
    }
    // RGSEAA · Reg. (CE) 852/2004 + RD 191/2011 · registro sanitario del operador.
    if (!p.trazabilidad.numero_rgseaa) {
      v.push({
        rule: 'FOOD_RGSEAA_MISSING',
        law: 'Reg. (CE) 852/2004 + RD 191/2011 (RGSEAA)',
        message: 'El producto debe proceder de un establecimiento inscrito en el RGSEAA (excepción: producción primaria con registro específico).',
        field: 'trazabilidad.numero_rgseaa',
        severity: 'warning',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/eli/es/rd/2011/02/18/191',
      })
    }
    // Calidad diferenciada · Reg. (UE) 1151/2012 · DOP/IGP/ETG deben estar
    // registradas (eAmbrosia) para usar la mención protegida.
    if (p.calidad_diferenciada && !p.calidad_diferenciada.numero_registro_ue) {
      v.push({
        rule: 'FOOD_PDO_PGI_NOT_REGISTERED',
        law: 'Reg. (UE) 1151/2012 (DOP/IGP/ETG)',
        message: 'La mención de calidad diferenciada (DOP/IGP/ETG) debe corresponder a una denominación registrada en la UE (eAmbrosia).',
        field: 'calidad_diferenciada.numero_registro_ue',
        severity: 'warning',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32012R1151',
      })
    }
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR INMOBILIARIO · enforcement
// ============================================================================

/** Aplica las reglas legales del sector inmobiliario a una ficha bien formada. */
export function validateInmobiliarioCompliance(p: InmobiliarioProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  if (isInmueble(p)) {
    // Certificado de Eficiencia Energética (IEE/CEE) · RD 390/2021 · obligatorio
    // para venta/alquiler (excepción: obra nueva con certificado provisional).
    if (!p.iee) {
      v.push({
        rule: 'PROPERTY_ENERGY_CERT_MISSING',
        law: 'RD 390/2021 (CEE) + Dir. (UE) 2010/31 EPBD',
        message: 'El inmueble debe disponer de Certificado de Eficiencia Energética (IEE/CEE) para venta o alquiler.',
        field: 'iee',
        severity: 'warning',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/eli/es/rd/2021/06/01/390',
      })
    }
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR ENERGÍA · enforcement
// ============================================================================

/** Aplica las reglas legales del sector energía a una ficha bien formada. */
export function validateEnergiaCompliance(p: EnergiaProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // Equipo de instalación energética sin marcado CE → blocker (LVD/EMC/máquinas).
  if (isInstalacionEnergetica(p) && p.tiene_marcado_ce !== true) {
    v.push({
      rule: 'ENERGY_EQUIPMENT_CE_MISSING',
      law: 'Dir. 2014/35/UE (LVD) + 2014/30/UE (EMC) + Reg. (UE) 2023/1230',
      message: 'El equipo de la instalación energética debe disponer de marcado CE (baja tensión / EMC / máquinas según aplique).',
      field: 'tiene_marcado_ce',
      severity: 'blocker',
      jurisdiccion: 'UE',
      // fuente_url = LVD (base del marcado CE eléctrico); EMC 2014/30/UE y Reg. máquinas
      // 2023/1230 aplican en paralelo según el equipo (ver `law`).
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014L0035',
    })
  }

  // Instalador eléctrico con habilitación REBT pero sin RC ≥ 300k → warning
  // (RD 842/2002 REBT exige seguro de responsabilidad civil mínimo).
  if (isServicioEnergetico(p) && p.habilitacion_rebt_es && p.habilitacion_rebt_es.seguro_rcp_min_300k !== true) {
    v.push({
      rule: 'ELECTRICAL_INSTALLER_INSURANCE_MISSING',
      law: 'RD 842/2002 (REBT) ITC-BT-03',
      message: 'El instalador eléctrico habilitado REBT debe acreditar seguro de responsabilidad civil mínimo (300.000 €).',
      field: 'habilitacion_rebt_es.seguro_rcp_min_300k',
      severity: 'warning',
      jurisdiccion: 'ES',
      fuente_url: 'https://www.boe.es/eli/es/rd/2002/08/02/842',
    })
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR LEGAL · enforcement
// ============================================================================

/** Aplica las reglas legales del sector legal a una ficha bien formada. */
export function validateLegalCompliance(p: LegalProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // Actuación procesal · solo abogado colegiado ejerciente (LEC + Estatuto
  // General de la Abogacía RD 135/2021).
  if (isServicioJuridico(p) && p.ofrece_actuacion_procesal === true && p.colegiacion.es_ejerciente !== true) {
    v.push({
      rule: 'LEGAL_PROCEDURAL_NOT_PRACTICING',
      law: 'LEC + RD 135/2021 (Estatuto General Abogacía)',
      message: 'La actuación procesal (representación ante tribunales) requiere abogado colegiado ejerciente del foro de competencia.',
      field: 'colegiacion.es_ejerciente',
      severity: 'blocker',
      jurisdiccion: 'ES',
      fuente_url: 'https://www.boe.es/eli/es/rd/2021/03/02/135',
    })
  }

  // Notario · control AML/KYC obligatorio (Ley 10/2010 · sujeto obligado).
  if (isServicioNotarial(p) && p.declaracion_control_aml_kyc !== true) {
    v.push({
      rule: 'NOTARY_AML_KYC_MISSING',
      law: 'Ley 10/2010 (PBC/FT) · notario sujeto obligado',
      message: 'El servicio notarial debe declarar el control AML/KYC del otorgante (notario como sujeto obligado).',
      field: 'declaracion_control_aml_kyc',
      severity: 'warning',
      jurisdiccion: 'ES',
      fuente_url: 'https://www.boe.es/eli/es/l/2010/04/28/10',
    })
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR TRANSPORTE · enforcement
// ============================================================================

/** Aplica las reglas legales del sector transporte a una ficha bien formada. */
export function validateTransporteCompliance(p: TransporteProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  if (isServicioTransitario(p)) {
    // Habilitación de operador de transporte · LOTT + Reg. (CE) 1071/2009.
    if (!p.habilitacion_operador || !p.habilitacion_operador.numero_autorizacion) {
      v.push({
        rule: 'TRANSPORT_OPERATOR_LICENSE_MISSING',
        law: 'LOTT (Ley 16/1987) + Reg. (CE) 1071/2009',
        message: 'El transitario/operador de transporte debe disponer de autorización de operador (acceso a la profesión).',
        field: 'habilitacion_operador.numero_autorizacion',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32009R1071',
      })
    } else if (p.habilitacion_operador.tiene_competencia_profesional !== true) {
      v.push({
        rule: 'TRANSPORT_PROFESSIONAL_COMPETENCE_MISSING',
        law: 'Reg. (CE) 1071/2009 (gestor de transporte)',
        message: 'El operador debe acreditar competencia profesional (gestor de transporte).',
        field: 'habilitacion_operador.tiene_competencia_profesional',
        severity: 'warning',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32009R1071',
      })
    }

    // Licencia comunitaria · Art. 4 Reg. (CE) 1072/2009 + Reg. (UE) 2020/1055.
    if (requiereLicenciaComunitaria1072(p) && !p.licencia_comunitaria_1072_2009) {
      v.push({
        rule: 'COMMUNITY_LICENCE_MISSING',
        law: 'Reg. (CE) 1072/2009 Art. 4 + Reg. (UE) 2020/1055',
        message: 'El transporte internacional por carretera con vehículos >2,5t requiere licencia comunitaria (obligatoria desde 21-may-2022).',
        field: 'licencia_comunitaria_1072_2009',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32009R1072',
      })
    }

    // Seguro de responsabilidad del transitario / porteador (CMR).
    if (!p.seguro_responsabilidad || p.seguro_responsabilidad.tiene_rc_profesional !== true) {
      v.push({
        rule: 'TRANSPORT_LIABILITY_INSURANCE_MISSING',
        law: 'Convenio CMR (1956) + RC profesional',
        message: 'El transitario debe acreditar seguro de responsabilidad civil profesional (y de porteador CMR si transporte internacional por carretera).',
        field: 'seguro_responsabilidad',
        severity: 'warning',
        // Convenio internacional (CMR, Ginebra 1956) · NO es Derecho UE ni ES: vincula a
        // sus Estados parte (EE.UU. no lo es). Aplicabilidad fina = subject_to_expert (DIPr).
        // Sin fuente_url: la página oficial UNECE no es verificable vía fetch (no se inventa URL).
        jurisdiccion: 'global',
      })
    }
  }

  if (isServicioNaviero(p) && p.tiene_seguro_pi !== true) {
    // Seguro P&I (Protection & Indemnity) del operador naviero.
    v.push({
      rule: 'MARITIME_PI_INSURANCE_MISSING',
      law: 'Convenios marítimos (Hague-Visby) + P&I Club',
      message: 'El operador naviero debe acreditar seguro de Protección e Indemnización (P&I).',
      field: 'tiene_seguro_pi',
      severity: 'warning',
      // Convenios marítimos internacionales (Hague-Visby) + práctica P&I · NO son Derecho
      // UE ni ES. Aplicabilidad fina = subject_to_expert (DIPr). Sin fuente_url verificable.
      jurisdiccion: 'global',
    })
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR EDUCACIÓN · enforcement
// ============================================================================

/** Aplica las reglas legales del sector educación a una ficha bien formada. */
export function validateEducacionCompliance(p: EducacionProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // Título universitario oficial · debe estar verificado/acreditado por ANECA
  // y inscrito en RUCT (no se puede publicitar un título oficial sin acreditación).
  if (requiereAcreditacionANECA(p)) {
    const acred = isServicioFormativo(p) || isAcreditacionTitulo(p) ? p.acreditacion_universitaria : undefined
    const estadoOk = acred?.estado_aneca === 'verificado' || acred?.estado_aneca === 'acreditado'
    if (!estadoOk || !acred?.codigo_ruct_titulo) {
      v.push({
        rule: 'EDU_OFFICIAL_DEGREE_NOT_ACCREDITED',
        law: 'RD 822/2021 (organización de las enseñanzas universitarias y aseguramiento de su calidad) + ANECA + RUCT · BOE-A-2021-15781',
        message: 'Un título universitario oficial debe estar verificado/acreditado por ANECA (o agencia autonómica) e inscrito en el RUCT para publicitarse como oficial.',
        field: 'acreditacion_universitaria.codigo_ruct_titulo',
        severity: 'blocker',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/eli/es/rd/2021/09/28/822',
      })
    }
  }

  // Título oficial / certificado de profesionalidad · centro debe estar autorizado.
  if (emiteTituloOficial(p)) {
    const centro = isServicioFormativo(p) ? p.centro
      : isAcreditacionTitulo(p) ? p.centro
      : undefined
    if (!centro || centro.centro_reglado_autorizado !== true) {
      v.push({
        rule: 'EDU_CENTER_NOT_AUTHORIZED',
        law: 'LO 8/1985 (LODE) Art. 23 (autorización de centros privados) + LOMLOE (LO 3/2020) · RD 659/2023 (FP) · BOE-A-1985-12978',
        message: 'La emisión de títulos oficiales / certificados de profesionalidad requiere centro docente autorizado por la administración educativa competente (autorización administrativa LODE Art. 23 · código de centro).',
        field: 'centro.centro_reglado_autorizado',
        severity: 'blocker',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/eli/es/lo/1985/07/03/8',
      })
    }
  }

  // Profesión regulada · reconocimiento de cualificación (Dir. 2005/36/CE).
  if (habilitaProfesionRegulada(p)) {
    const rec = isServicioFormativo(p) || isAcreditacionTitulo(p) ? p.reconocimiento_cualificacion : undefined
    if (!rec?.autoridad_competente) {
      v.push({
        rule: 'EDU_REGULATED_PROFESSION_RECOGNITION_MISSING',
        law: 'Dir. 2005/36/CE + Dir. 2013/55/UE (reconocimiento de cualificaciones)',
        message: 'Un programa que habilita para una profesión regulada debe indicar la autoridad competente de reconocimiento de la cualificación en el país de destino.',
        field: 'reconocimiento_cualificacion.autoridad_competente',
        severity: 'warning',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32005L0036',
      })
    }
  }

  // Datos de menores · RGPD Art. 8 + LOPDGDD Art. 7 · consentimiento parental.
  if (dirigidoAMenores(p) && isServicioFormativo(p)) {
    if (!p.proteccion_datos_menores || p.proteccion_datos_menores.consentimiento_parental !== true) {
      v.push({
        rule: 'EDU_MINORS_DATA_PROTECTION_MISSING',
        law: 'RGPD Art. 8 + LOPDGDD (LO 3/2018) Art. 7',
        message: 'La formación dirigida a menores debe declarar las medidas de protección de datos (consentimiento parental por debajo de la edad legal · 14 años en España).',
        field: 'proteccion_datos_menores.consentimiento_parental',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679',
      })
    }
  }

  // Accesibilidad · European Accessibility Act (Dir. 2019/882) desde 28-jun-2025.
  if (enAlcanceEAA(p) && isServicioFormativo(p) && p.declaracion_accesibilidad_eaa !== true) {
    v.push({
      rule: 'EDU_DIGITAL_ACCESSIBILITY_MISSING',
      law: 'Dir. (UE) 2019/882 (European Accessibility Act) + EN 301 549',
      message: 'La plataforma/servicio digital de formación debe aportar declaración de accesibilidad (EAA aplicable desde 28-jun-2025).',
      field: 'declaracion_accesibilidad_eaa',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32019L0882',
    })
  }

  // Contratación a distancia B2C · derecho de desistimiento 14 días (Dir. 2011/83/UE).
  if (esFormacionDistanciaB2C(p) && isServicioFormativo(p) && p.informa_derecho_desistimiento !== true) {
    v.push({
      rule: 'EDU_WITHDRAWAL_RIGHT_NOT_INFORMED',
      law: 'Dir. 2011/83/UE + RDL 1/2007 (TRLGDCU) Art. 102',
      message: 'La venta de formación a distancia a consumidores debe informar del derecho de desistimiento (14 días · salvo inicio del servicio con consentimiento expreso y pérdida del derecho).',
      field: 'informa_derecho_desistimiento',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011L0083',
    })
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR MEDIOAMBIENTE · enforcement
// ============================================================================

/** Aplica las reglas legales del sector medioambiente a una ficha bien formada. */
export function validateMedioambienteCompliance(p: MedioambienteProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // Gestión de residuos · operador debe estar autorizado e inscrito en el
  // Registro de Producción y Gestión de Residuos (Ley 7/2022 Art. 33 · Dir. 2008/98 Art. 23).
  if (requiereAutorizacionGestorResiduos(p) && isGestionResiduo(p)) {
    const a = p.autorizacion_gestor
    if (!a || a.inscrito_registro_produccion_gestion !== true) {
      v.push({
        rule: 'ENV_WASTE_OPERATOR_NOT_AUTHORIZED',
        law: 'Ley 7/2022 (residuos y suelos contaminados) Art. 33 + Dir. 2008/98/CE Art. 23',
        message: 'La gestión de residuos (recogida, transporte, tratamiento, valorización, eliminación) requiere operador autorizado e inscrito en el Registro de Producción y Gestión de Residuos.',
        field: 'autorizacion_gestor.inscrito_registro_produccion_gestion',
        severity: 'blocker',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809',
      })
    }
    // Si gestiona residuo peligroso, la autorización debe cubrir peligrosos.
    if (esResiduoPeligroso(p) && a && a.autorizado_peligrosos !== true) {
      v.push({
        rule: 'ENV_HAZARDOUS_WASTE_OPERATOR_NOT_AUTHORIZED',
        law: 'Ley 7/2022 Art. 33 + Dir. 2008/98/CE Art. 23 (residuos peligrosos)',
        message: 'La gestión de residuos peligrosos exige autorización específica para residuos peligrosos; la autorización declarada no la cubre.',
        field: 'autorizacion_gestor.autorizado_peligrosos',
        severity: 'blocker',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-5809',
      })
    }
  }

  // Identificación del residuo · código LER obligatorio (Decisión 2014/955/UE ·
  // Lista Europea de Residuos · Dir. 2008/98/CE).
  if (isGestionResiduo(p)) {
    if (!p.codigo_ler || p.codigo_ler.trim() === '') {
      v.push({
        rule: 'ENV_WASTE_LER_CODE_MISSING',
        law: 'Decisión 2014/955/UE (Lista Europea de Residuos · códigos LER) + Dir. 2008/98/CE',
        message: 'Toda operación de gestión de un residuo debe declarar su código LER (Lista Europea de Residuos).',
        field: 'codigo_ler',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014D0955',
      })
    }
  }

  // Residuo peligroso · propiedades de peligrosidad (HP) + documento de
  // identificación (Dir. 2008/98/CE Art. 17-20 · Anexo III).
  if (esResiduoPeligroso(p) && isGestionResiduo(p)) {
    const hp = p.peligrosidad
    if (!hp || !Array.isArray(hp.codigos_hp) || hp.codigos_hp.length === 0 || hp.tiene_documento_identificacion !== true) {
      v.push({
        rule: 'ENV_HAZARDOUS_WASTE_PROPERTIES_MISSING',
        law: 'Dir. 2008/98/CE Art. 17-20 + Anexo III (residuos peligrosos) + Ley 7/2022',
        message: 'Un residuo peligroso debe declarar sus propiedades de peligrosidad (códigos HP) y disponer de documento de identificación.',
        field: 'peligrosidad.codigos_hp',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32008L0098',
      })
    }
  }

  // Transporte de residuo peligroso · ADR (mercancías peligrosas por carretera).
  // Convenio internacional (UNECE) · subject_to_expert · el transitario certificado responde.
  if (transportaResiduoPeligroso(p) && isGestionResiduo(p)) {
    if (p.peligrosidad?.transporte_adr_conforme !== true) {
      v.push({
        rule: 'ENV_HAZARDOUS_WASTE_TRANSPORT_ADR_MISSING',
        law: 'ADR (transporte internacional de mercancías peligrosas por carretera · UNECE) + RD 97/2014 (ES)',
        message: 'El transporte de residuos peligrosos debe cumplir el ADR (transportista habilitado, etiquetado, carta de porte/documento). El transitario certificado responde de la conformidad.',
        field: 'peligrosidad.transporte_adr_conforme',
        severity: 'warning',
        jurisdiccion: 'global',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2014-2110',
      })
    }
  }

  // Traslado transfronterizo de residuos · notificación y consentimiento previos
  // (Reglamento (CE) 1013/2006).
  if (esTrasladoTransfronterizoResiduo(p) && isGestionResiduo(p) && !p.numero_notificacion_traslado) {
    v.push({
      rule: 'ENV_WASTE_SHIPMENT_NOTIFICATION_MISSING',
      law: 'Reglamento (CE) 1013/2006 (traslados de residuos) Art. 4',
      message: 'Un traslado transfronterizo de residuos sujeto a notificación requiere el procedimiento de notificación y consentimiento previos por escrito (nº de notificación).',
      field: 'numero_notificacion_traslado',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32006R1013',
    })
  }

  // Material recuperado vendido como producto · fin de condición de residuo
  // (Art. 6 Dir. 2008/98/CE). Si no acredita criterios, sigue siendo residuo.
  if (declaraFinDeResiduo(p) && isMaterialRecuperado(p)) {
    if (p.cumple_criterios_fin_residuo !== true || p.tiene_certificado_origen !== true) {
      v.push({
        rule: 'ENV_END_OF_WASTE_CRITERIA_MISSING',
        law: 'Dir. 2008/98/CE Art. 6 (fin de la condición de residuo) + Ley 7/2022 Art. 5',
        message: 'Para comercializar una materia prima secundaria como PRODUCTO (no residuo) debe acreditar el cumplimiento de los criterios de fin de condición de residuo y un certificado de origen.',
        field: 'cumple_criterios_fin_residuo',
        severity: 'warning',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32008L0098',
      })
    }
  }

  // Servicio de agua/vertido · concesión o autorización (RDL 1/2001 · Dir. 2000/60/CE).
  if (requiereAutorizacionAgua(p) && isServicioAmbiental(p)) {
    const ok = p.autorizacion_agua && p.autorizacion_agua.vigente === true
    if (!ok) {
      v.push({
        rule: 'ENV_WATER_AUTHORIZATION_MISSING',
        law: 'RDL 1/2001 (Texto Refundido de la Ley de Aguas · concesión/autorización de vertido) + Dir. 2000/60/CE',
        message: 'La operación del ciclo del agua (potabilización, depuración, saneamiento, remediación de aguas) requiere concesión/autorización administrativa vigente del organismo de cuenca.',
        field: 'autorizacion_agua',
        severity: 'warning',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2001-14276',
      })
    }
  }

  // Instalación industrial en alcance IED · autorización ambiental integrada
  // (Dir. 2010/75/UE).
  if (requiereAutorizacionAmbientalIntegrada(p) && isServicioAmbiental(p)) {
    const ok = p.autorizacion_ambiental_integrada && p.autorizacion_ambiental_integrada.vigente === true
    if (!ok) {
      v.push({
        rule: 'ENV_INTEGRATED_PERMIT_MISSING',
        law: 'Dir. 2010/75/UE (emisiones industriales · IED) · autorización ambiental integrada',
        message: 'Una instalación en el alcance de la Directiva de Emisiones Industriales requiere autorización ambiental integrada vigente.',
        field: 'autorizacion_ambiental_integrada',
        severity: 'warning',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32010L0075',
      })
    }
  }

  // Proyecto en alcance de evaluación de impacto ambiental (Dir. 2011/92/UE).
  if (medioambienteEnAlcanceEIA(p) && isServicioAmbiental(p) && p.tiene_estudio_impacto_ambiental !== true) {
    v.push({
      rule: 'ENV_EIA_MISSING',
      law: 'Dir. 2011/92/UE (evaluación de impacto ambiental · EIA)',
      message: 'Un proyecto sujeto a evaluación de impacto ambiental debe disponer del estudio/declaración de impacto ambiental antes de su autorización.',
      field: 'tiene_estudio_impacto_ambiental',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011L0092',
    })
  }

  // Responsabilidad medioambiental · garantía financiera (Dir. 2004/35/CE · Ley 26/2007).
  if (requiereGarantiaResponsabilidadAmbiental(p) && isServicioAmbiental(p) && p.tiene_garantia_financiera_ambiental !== true) {
    v.push({
      rule: 'ENV_LIABILITY_GUARANTEE_MISSING',
      law: 'Dir. 2004/35/CE (responsabilidad medioambiental) + Ley 26/2007 (ES) · garantía financiera',
      message: 'Las actividades del Anexo III de la Directiva de responsabilidad medioambiental deben acreditar garantía financiera para responder de eventuales daños.',
      field: 'tiene_garantia_financiera_ambiental',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32004L0035',
    })
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR CULTURA · enforcement
// ============================================================================

/** Aplica las reglas legales del sector cultura/ocio/deporte a una ficha bien formada. */
export function validateCulturaCompliance(p: CulturaProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // Propiedad intelectual · la producción que incorpora obra protegida debe tener
  // la cesión/licencia de derechos documentada (TRLPI + DSM · principio global · Berna).
  if (requiereDerechosDocumentados(p) && isProduccionCultural(p)) {
    if (!p.propiedad_intelectual || p.propiedad_intelectual.cesion_derechos_documentada !== true) {
      v.push({
        rule: 'CUL_IP_RIGHTS_NOT_DOCUMENTED',
        law: 'RDL 1/1996 (TRLPI) + Dir. (UE) 2019/790 (DSM) + Convenio de Berna',
        message: 'Una producción que incorpora obra protegida debe acreditar la titularidad o la cesión/licencia de derechos de propiedad intelectual documentada antes de comercializarse.',
        field: 'propiedad_intelectual.cesion_derechos_documentada',
        severity: 'blocker',
        jurisdiccion: 'global',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1996-8930',
      })
    }
  }

  // Gestión colectiva · explotación online/broadcast/multiterritorial de música
  // requiere licencia de la entidad de gestión colectiva (Dir. 2014/26/UE).
  if (requiereGestionColectiva(p) && isProduccionCultural(p) && !p.propiedad_intelectual?.entidad_gestion_colectiva) {
    v.push({
      rule: 'CUL_COLLECTIVE_MGMT_LICENSE_MISSING',
      law: 'Dir. 2014/26/UE (gestión colectiva de derechos · licencias multiterritoriales)',
      message: 'La explotación online/broadcast o multiterritorial de obras musicales requiere licencia de la entidad de gestión colectiva correspondiente.',
      field: 'propiedad_intelectual.entidad_gestion_colectiva',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014L0026',
    })
  }

  // Bien cultural · exportación fuera del territorio aduanero UE requiere licencia
  // de exportación (Reglamento (CE) 116/2009).
  if (requiereLicenciaExportacionBienCultural(p) && isBienCultural(p) && p.regimen.tiene_licencia_exportacion !== true) {
    v.push({
      rule: 'CUL_EXPORT_LICENSE_MISSING',
      law: 'Reglamento (CE) 116/2009 (exportación de bienes culturales) Art. 2',
      message: 'La exportación de un bien cultural fuera del territorio aduanero de la UE requiere licencia de exportación previa.',
      field: 'regimen.tiene_licencia_exportacion',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32009R0116',
    })
  }

  // Bien cultural · importación desde tercer país (Reglamento (UE) 2019/880 ·
  // licencia/declaración según categoría · lucha contra tráfico ilícito).
  if (requiereLicenciaImportacionBienCultural(p) && isBienCultural(p) && p.regimen.tiene_licencia_importacion !== true) {
    v.push({
      rule: 'CUL_IMPORT_LICENSE_MISSING',
      law: 'Reglamento (UE) 2019/880 (introducción e importación de bienes culturales)',
      message: 'La introducción/importación en la UE de un bien cultural desde un tercer país puede requerir licencia o declaración de importación (según categoría · Parte B del Anexo); acredítela. La clasificación exacta es subject_to_expert.',
      field: 'regimen.tiene_licencia_importacion',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32019R0880',
    })
  }

  // Patrimonio · bien de dominio público (inalienable) o BIC (inexportable salvo
  // autorización) · Ley 16/1985.
  if (esBienPatrimonioRestringido(p) && isBienCultural(p)) {
    if (p.regimen.es_dominio_publico === true) {
      v.push({
        rule: 'CUL_PUBLIC_DOMAIN_INALIENABLE',
        law: 'Ley 16/1985 (Patrimonio Histórico Español) · bienes de dominio público inalienables e imprescriptibles',
        message: 'Un bien del Patrimonio Histórico de titularidad pública es inalienable e inembargable; no puede comercializarse.',
        field: 'regimen.es_dominio_publico',
        severity: 'blocker',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1985-12534',
      })
    } else if (p.regimen.es_bic_o_inventariado === true && p.regimen.exporta_fuera_ue === true) {
      v.push({
        rule: 'CUL_BIC_EXPORT_RESTRICTED',
        law: 'Ley 16/1985 (Patrimonio Histórico Español) Art. 5 (inexportabilidad de BIC / bienes inventariados salvo autorización)',
        message: 'La exportación de un Bien de Interés Cultural o bien inventariado del Patrimonio Histórico Español está restringida y requiere autorización expresa de la Administración.',
        field: 'regimen.es_bic_o_inventariado',
        severity: 'blocker',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1985-12534',
      })
    }
  }

  // Consumidor · venta de entradas a distancia para evento en fecha determinada ·
  // NO hay derecho de desistimiento (Art. 16.l Dir. 2011/83/UE) pero debe informarse.
  if (esVentaEntradasDistancia(p) && isProduccionCultural(p) && p.informa_no_desistimiento_ocio !== true) {
    v.push({
      rule: 'CUL_LEISURE_WITHDRAWAL_INFO_MISSING',
      law: 'Dir. 2011/83/UE (derechos de los consumidores) Art. 16.l + RDL 1/2007 (TRLGDCU)',
      message: 'En la venta a distancia de entradas para servicios de ocio en fecha determinada no aplica el derecho de desistimiento; el consumidor debe ser informado expresamente de ello.',
      field: 'informa_no_desistimiento_ocio',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011L0083',
    })
  }

  // Accesibilidad · plataforma/venta digital (European Accessibility Act · Dir. 2019/882).
  if (culturaEnAlcanceEAA(p) && isProduccionCultural(p) && p.declaracion_accesibilidad_eaa !== true) {
    v.push({
      rule: 'CUL_DIGITAL_ACCESSIBILITY_MISSING',
      law: 'Dir. (UE) 2019/882 (European Accessibility Act) + EN 301 549',
      message: 'La plataforma/venta digital de entradas o contenidos debe aportar declaración de accesibilidad (EAA aplicable desde 28-jun-2025).',
      field: 'declaracion_accesibilidad_eaa',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32019L0882',
    })
  }

  // Deporte · competición oficial sujeta a normativa antidopaje (LO 11/2021 · CMA).
  if (requiereCumplimientoAntidopaje(p) && isServicioDeportivo(p) && p.conformidad.cumple_normativa_antidopaje !== true) {
    v.push({
      rule: 'CUL_ANTIDOPING_NOT_DECLARED',
      law: 'LO 11/2021 (lucha contra el dopaje en el deporte) + Código Mundial Antidopaje',
      message: 'Un servicio/evento de competición deportiva oficial debe declarar el cumplimiento de la normativa antidopaje (LO 11/2021 · Código Mundial Antidopaje).',
      field: 'conformidad.cumple_normativa_antidopaje',
      severity: 'warning',
      jurisdiccion: 'ES',
      fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2021-21650',
    })
  }

  // Deporte · instalación deportiva con licencia de actividad (Ley 39/2022).
  if (esInstalacionDeportiva(p) && isServicioDeportivo(p) && p.conformidad.instalacion_tiene_licencia !== true) {
    v.push({
      rule: 'CUL_SPORT_FACILITY_LICENSE_MISSING',
      law: 'Ley 39/2022 (del Deporte) + normativa autonómica de instalaciones',
      message: 'La gestión/explotación de una instalación deportiva debe contar con la licencia de actividad / autorización correspondiente.',
      field: 'conformidad.instalacion_tiene_licencia',
      severity: 'warning',
      jurisdiccion: 'ES',
      fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2022-24430',
    })
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR INSTITUCIONAL · enforcement
// ============================================================================

/** Aplica las reglas legales del sector administración pública a una ficha. */
export function validateInstitucionalCompliance(p: InstitucionalProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // Licitación · datos mínimos del procedimiento (LCSP · Dir. 2014/24/UE):
  // código CPV + valor estimado son imprescindibles para publicar un contrato.
  if (isLicitacionPublica(p)) {
    if (!p.codigo_cpv || p.valor_estimado == null) {
      v.push({
        rule: 'INST_TENDER_DATA_MISSING',
        law: 'Ley 9/2017 (LCSP) + Dir. 2014/24/UE · objeto, CPV y valor estimado del contrato',
        message: 'Una licitación pública debe declarar al menos el código CPV y el valor estimado del contrato (además del procedimiento) para poder publicarse.',
        field: 'codigo_cpv',
        severity: 'blocker',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2017-12902',
      })
    }
  }

  // Aptitud para contratar · el licitador debe declarar NO estar incurso en
  // prohibición de contratar (LCSP Art. 71).
  if (isOfertaProveedorPublico(p) || isServicioAsistenciaTecnica(p)) {
    if (p.aptitud.declara_no_prohibicion_contratar !== true) {
      v.push({
        rule: 'INST_PROHIBITION_TO_CONTRACT_NOT_DECLARED',
        law: 'Ley 9/2017 (LCSP) Art. 71 (prohibiciones de contratar)',
        message: 'Para concurrir a la contratación pública el licitador debe declarar expresamente que no está incurso en prohibición de contratar (Art. 71 LCSP).',
        field: 'aptitud.declara_no_prohibicion_contratar',
        severity: 'blocker',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2017-12902',
      })
    }
    // Factura electrónica a la Administración (Ley 25/2013 + Dir. 2014/55/UE).
    if (p.capacidades_eadmin.soporta_factura_electronica !== true) {
      v.push({
        rule: 'INST_EINVOICE_NOT_SUPPORTED',
        law: 'Ley 25/2013 (factura electrónica · FACe) + Dir. 2014/55/UE',
        message: 'La facturación a las administraciones públicas debe ser electrónica (FACe · formato Facturae/EN 16931); el proveedor debe soportarla.',
        field: 'capacidades_eadmin.soporta_factura_electronica',
        severity: 'warning',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2013-13722',
      })
    }
    // Firma/identificación electrónica cualificada en la relación electrónica (eIDAS).
    if (p.capacidades_eadmin.usa_firma_electronica_eidas !== true) {
      v.push({
        rule: 'INST_EIDAS_SIGNATURE_MISSING',
        law: 'Reglamento (UE) 910/2014 (eIDAS) · identificación y firma electrónica',
        message: 'La presentación de ofertas y la relación electrónica con la Administración requieren identificación/firma electrónica conforme a eIDAS.',
        field: 'capacidades_eadmin.usa_firma_electronica_eidas',
        severity: 'warning',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014R0910',
      })
    }
  }

  // Solvencia del licitador (LCSP Art. 74 y ss.) · solo oferta de proveedor.
  if (isOfertaProveedorPublico(p)) {
    if (p.solvencia.solvencia_economica !== true || p.solvencia.solvencia_tecnica !== true) {
      v.push({
        rule: 'INST_SOLVENCY_NOT_DECLARED',
        law: 'Ley 9/2017 (LCSP) Art. 74 y ss. (solvencia económica y técnica)',
        message: 'El proveedor que concurre a contratación pública debe acreditar solvencia económica/financiera y técnica/profesional (o clasificación cuando se exija).',
        field: 'solvencia',
        severity: 'warning',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2017-12902',
      })
    }
    // Accesibilidad web del sector público (Dir. 2016/2102) · oferta tecnológica.
    if (esTecnologiaPublicaWeb(p) && p.declara_accesibilidad_web !== true) {
      v.push({
        rule: 'INST_WEB_ACCESSIBILITY_MISSING',
        law: 'Dir. (UE) 2016/2102 (accesibilidad de sitios web y apps del sector público) + EN 301 549',
        message: 'La tecnología/web destinada al sector público debe cumplir los requisitos de accesibilidad (Dir. 2016/2102 · EN 301 549).',
        field: 'declara_accesibilidad_web',
        severity: 'warning',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016L2102',
      })
    }
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR SERVICIOS AUXILIARES · enforcement
// ============================================================================

/** Aplica las reglas legales del sector servicios auxiliares a una ficha. */
export function validateServiciosAuxiliaresCompliance(p: ServiciosAuxiliaresProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // Seguridad privada · empresa autorizada e inscrita + personal habilitado (Ley 5/2014).
  if (isServicioSeguridadPrivada(p)) {
    if (p.autorizacion.empresa_autorizada !== true || p.autorizacion.personal_habilitado !== true) {
      v.push({
        rule: 'AUX_PRIVATE_SECURITY_AUTH_MISSING',
        law: 'Ley 5/2014 (Seguridad Privada) · empresa de seguridad autorizada + personal habilitado',
        message: 'La prestación de servicios de seguridad privada requiere empresa de seguridad autorizada e inscrita en el registro y personal de seguridad habilitado (TIP).',
        field: 'autorizacion.empresa_autorizada',
        severity: 'blocker',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2014-3649',
      })
    }
  }

  // Trabajo temporal · ETT con autorización administrativa e inscripción (Ley 14/1994).
  if (isServicioTrabajoTemporal(p)) {
    if (p.autorizacion.tiene_autorizacion_administrativa !== true || p.autorizacion.inscrita_registro_ett !== true) {
      v.push({
        rule: 'AUX_ETT_AUTHORIZATION_MISSING',
        law: 'Ley 14/1994 (empresas de trabajo temporal) + Dir. 2008/104/CE',
        message: 'La actividad de empresa de trabajo temporal (puesta a disposición de personal) requiere autorización administrativa e inscripción en el Registro de ETT.',
        field: 'autorizacion.tiene_autorizacion_administrativa',
        severity: 'blocker',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1994-12554',
      })
    }
  }

  // Control de plagas · inscripción ROESB + uso de biocidas autorizados (Reg. (UE) 528/2012).
  if (esControlPlagas(p) && isServicioAuxiliar(p)) {
    const b = p.biocidas
    if (!b || b.inscrito_roesb !== true || b.usa_biocidas_autorizados !== true) {
      v.push({
        rule: 'AUX_BIOCIDES_AUTHORIZATION_MISSING',
        law: 'Reglamento (UE) 528/2012 (biocidas · todo biocida requiere autorización) + ROESB (ES)',
        message: 'El control de plagas / sanidad ambiental requiere inscripción en el ROESB y el empleo exclusivo de biocidas autorizados (Reg. (UE) 528/2012).',
        field: 'biocidas.usa_biocidas_autorizados',
        severity: 'blocker',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32012R0528',
      })
    }
  }

  // Prevención de riesgos laborales · servicios que despliegan personal (Ley 31/1995).
  if (requierePRL(p) && (isServicioAuxiliar(p) || isServicioSeguridadPrivada(p))) {
    if (!p.prl || p.prl.tiene_plan_prl !== true) {
      v.push({
        rule: 'AUX_PRL_PLAN_MISSING',
        law: 'Ley 31/1995 (Prevención de Riesgos Laborales)',
        message: 'Un servicio que despliega personal debe disponer de plan de prevención de riesgos laborales y organización preventiva.',
        field: 'prl.tiene_plan_prl',
        severity: 'warning',
        jurisdiccion: 'ES',
        fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1995-24292',
      })
    }
  }

  // Desplazamiento transnacional de trabajadores · declaración (Dir. 96/71 + 2018/957).
  if ((isServicioAuxiliar(p) || isServicioTrabajoTemporal(p))
    && p.desplazamiento?.implica_desplazamiento_transfronterizo === true
    && p.desplazamiento?.declaracion_desplazamiento !== true) {
    v.push({
      rule: 'AUX_POSTED_WORKERS_NOT_DECLARED',
      law: 'Dir. 96/71/CE + Dir. (UE) 2018/957 (desplazamiento de trabajadores en prestación de servicios)',
      message: 'La prestación de servicios con desplazamiento de trabajadores a otro país requiere la declaración de desplazamiento ante la autoridad del país de destino y la garantía de las condiciones del país de acogida.',
      field: 'desplazamiento.declaracion_desplazamiento',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32018L0957',
    })
  }

  return buildResult(v)
}

// ============================================================================
// SECTOR FINANCIERO · enforcement (subject_to_expert · solo levanta banderas)
// ============================================================================

/** Aplica las reglas legales del sector financiero a una ficha. TODO el sector es
 *  subject_to_expert: estas reglas levantan banderas; NO autorizan a operar (el
 *  dictamen del abogado fintech + supervisores es bloqueante · CLAUDE.md §1). */
export function validateFinancieroCompliance(p: FinancieroProduct): ComplianceResult {
  const v: ComplianceViolation[] = []

  // PBC/FT · KYC · todas las fichas financieras son sujeto obligado (Ley 10/2010).
  // Acceso null-safe: sin bloque `aml` declarado → falta el programa → blocker.
  if (p.aml?.tiene_programa_pbcft_kyc !== true) {
    v.push({
      rule: 'FIN_AML_KYC_PROGRAM_MISSING',
      law: 'Ley 10/2010 (prevención del blanqueo de capitales y financiación del terrorismo) + estándares FATF',
      message: 'Todo servicio financiero es sujeto obligado: debe acreditar programa de PBC/FT y diligencia debida (KYC) antes de operar.',
      field: 'aml.tiene_programa_pbcft_kyc',
      severity: 'blocker',
      jurisdiccion: 'global',
      fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2010-6737',
    })
  }

  // Servicios de inversión · empresa autorizada (Ley 6/2023 · MiFID II).
  if (isServicioInversion(p) && p.licencia?.entidad_autorizada !== true) {
    v.push({
      rule: 'FIN_INVESTMENT_FIRM_NOT_AUTHORIZED',
      law: 'Ley 6/2023 (Mercados de Valores y Servicios de Inversión) + Dir. 2014/65/UE (MiFID II)',
      message: 'La prestación de servicios de inversión está reservada a empresas de servicios de inversión autorizadas y supervisadas (CNMV / ESMA).',
      field: 'licencia.entidad_autorizada',
      severity: 'blocker',
      jurisdiccion: 'ES',
      fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2023-7053',
    })
  }

  // Distribución de seguros · distribuidor registrado (IDD · Ley 20/2015).
  if (isServicioSeguro(p) && p.licencia?.entidad_autorizada !== true) {
    v.push({
      rule: 'FIN_INSURANCE_DISTRIBUTOR_NOT_REGISTERED',
      law: 'Ley 20/2015 (ordenación, supervisión y solvencia de aseguradoras) + Dir. (UE) 2016/97 (IDD)',
      message: 'La distribución de seguros requiere distribuidor (entidad/mediador) registrado y supervisado (DGSFP / EIOPA).',
      field: 'licencia.entidad_autorizada',
      severity: 'blocker',
      jurisdiccion: 'ES',
      fuente_url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-7897',
    })
  }

  // Criptoactivos · proveedor de servicios autorizado (MiCA · CASP).
  if (isServicioCripto(p) && p.cripto?.es_casp_autorizado !== true) {
    v.push({
      rule: 'FIN_CASP_NOT_AUTHORIZED',
      law: 'Reglamento (UE) 2023/1114 (MiCA) · autorización de proveedor de servicios de criptoactivos (CASP)',
      message: 'La prestación de servicios sobre criptoactivos requiere autorización como CASP (MiCA) ante la autoridad competente.',
      field: 'cripto.es_casp_autorizado',
      severity: 'blocker',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R1114',
    })
  }

  // Criptoactivos · Travel Rule en transferencias (Reg. (UE) 2023/1113).
  if (requiereTravelRule(p) && isServicioCripto(p) && p.cripto?.cumple_travel_rule !== true) {
    v.push({
      rule: 'FIN_CRYPTO_TRAVEL_RULE_MISSING',
      law: 'Reglamento (UE) 2023/1113 (información en transferencias de fondos y criptoactivos · Travel Rule)',
      message: 'Las transferencias de criptoactivos deben acompañar la información de ordenante y beneficiario exigida por la Travel Rule.',
      field: 'cripto.cumple_travel_rule',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32023R1113',
    })
  }

  // Banca / servicios de pago · posible reserva de actividad (PSD2 / entidad de
  // crédito) · subject_to_expert (depende del servicio concreto).
  if (isServicioBancario(p) && p.licencia?.entidad_autorizada !== true) {
    v.push({
      rule: 'FIN_BANKING_AUTH_SUBJECT_TO_EXPERT',
      law: 'Dir. (UE) 2015/2366 (PSD2) + régimen de entidades de crédito · subject_to_expert',
      message: 'Determinados servicios bancarios/de pago están reservados a entidades autorizadas (entidad de crédito / entidad de pago · PSD2). Confírmese el régimen aplicable con el abogado fintech.',
      field: 'licencia.entidad_autorizada',
      severity: 'warning',
      jurisdiccion: 'UE',
      fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32015L2366',
    })
  }

  // Resiliencia operativa digital (DORA) · entidades financieras.
  if (isServicioBancario(p) || isServicioInversion(p) || isServicioCripto(p)) {
    if (!p.dora || p.dora.tiene_marco_resiliencia_tic !== true) {
      v.push({
        rule: 'FIN_DORA_RESILIENCE_MISSING',
        law: 'Reglamento (UE) 2022/2554 (DORA · resiliencia operativa digital)',
        message: 'Las entidades financieras deben disponer de un marco de gestión del riesgo TIC y resiliencia operativa digital (DORA).',
        field: 'dora.tiene_marco_resiliencia_tic',
        severity: 'warning',
        jurisdiccion: 'UE',
        fuente_url: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32022R2554',
      })
    }
  }

  return buildResult(v)
}

// ============================================================================
// DISPATCHER · punto de entrada único por sector
// ============================================================================

/** Sectores que ya tienen enforcement de cumplimiento de Capa 2 implementado. */
export const SECTORS_WITH_COMPLIANCE: readonly string[] = [
  'tecnologia',
  'turismo',
  'textil',
  'metalurgico',
  'salud',
  'automocion',
  'agroalimentario',
  'inmobiliario',
  'energia',
  'legal',
  'transporte',
  'educacion',
  'medioambiente',
  'cultura',
  'institucional',
  'servicios-auxiliares',
  'financiero',
] as const

/** Punto de entrada único. Dado el `sector_id` y un producto bien formado
 *  (validado previamente con Zod), aplica las reglas legales del sector.
 *
 *  Para sectores aún sin enforcement implementado devuelve `ok: true` con un
 *  warning explícito (NO silencioso · canon "no atajos") para que el caller
 *  sepa que el gate sectorial todavía no cubre ese sector.
 *
 *  El `product` se recibe como `unknown` porque este gate es la segunda pasada
 *  tras la validación de shape; el narrowing por sector es responsabilidad de
 *  cada validador sectorial.
 *
 *  Además del cumplimiento SECTORIAL, ejecuta el cumplimiento FISCAL transversal
 *  (`validateFiscalCompliance`) si la ficha trae bloque `fiscal` · IVA +
 *  facturación + comercio intracom/global aplican a todos los sectores. */
// ============================================================================
// PASADA TRANSVERSAL · PACKAGING / CUBICAJE (peso y medidas obligatorios)
// ============================================================================

/** Campos de bulto del DPP Capa B tal y como llegan en el body plano del POST
 *  (columnas de `products` · migración 028). */
const PACKAGING_FIELDS = [
  'package_length_mm',
  'package_width_mm',
  'package_height_mm',
  'package_weight_kg',
] as const

function esNumeroPositivo(v: unknown): boolean {
  return typeof v === 'number' && Number.isFinite(v) && v > 0
}

/** Peso y medidas del bulto OBLIGATORIOS para mercancía física (carga de
 *  contenedor) — decisión José 12-jun: "peso y medidas obligatorio en nuestro
 *  DPP para carga de contenedor".
 *
 *  Discriminador de "mercancía física que viaja": tiene `hs_code` (solo los
 *  bienes tienen partida arancelaria; los servicios no) O declara cualquier
 *  campo de bulto / `package_type`. Un servicio puro (sin HS ni bulto) no se
 *  bloquea. Una ficha física con bulto PARCIAL se bloquea (fail-closed: el
 *  cubicaje 3D no puede operar con datos a medias).
 *
 *  Anclas reales:
 *  - Peso: SOLAS cap. VI reg. 2 (VGM · masa bruta verificada, obligatoria
 *    antes de embarcar un contenedor desde 01-07-2016 · OMI).
 *  - Medidas: requisito operativo del cubicaje 3D (ISO 6346 specs interiores ·
 *    canon 1503 "ficha incompleta no opera").
 */
export function validatePackagingCompliance(product: unknown): ComplianceResult {
  const p = (product ?? {}) as Record<string, unknown>
  const tieneHs = typeof p.hs_code === 'string' && p.hs_code.trim() !== ''
  const declaraBulto =
    PACKAGING_FIELDS.some((f) => p[f] != null) || p.package_type != null
  // Servicio puro: ni partida arancelaria ni bulto declarado → no aplica.
  if (!tieneHs && !declaraBulto) return buildResult([])

  const violations: ComplianceViolation[] = []
  const etiqueta: Record<(typeof PACKAGING_FIELDS)[number], string> = {
    package_length_mm: 'largo del bulto (mm)',
    package_width_mm: 'ancho del bulto (mm)',
    package_height_mm: 'alto del bulto (mm)',
    package_weight_kg: 'peso bruto del bulto (kg)',
  }
  for (const f of PACKAGING_FIELDS) {
    if (!esNumeroPositivo(p[f])) {
      const esPeso = f === 'package_weight_kg'
      violations.push({
        rule: esPeso ? 'PACKAGING_WEIGHT_REQUIRED' : 'PACKAGING_DIMS_REQUIRED',
        law: esPeso
          ? 'SOLAS cap. VI reg. 2 (VGM · masa bruta verificada, OMI) · canon 1503'
          : 'Cubicaje 3D (ISO 6346 dimensiones interiores) · canon 1503 "ficha incompleta no opera"',
        message: `Mercancía física: falta ${etiqueta[f]} (> 0). Sin peso y medidas completos la ficha no puede cargarse en contenedor ni asignarse a grupaje.`,
        field: f,
        severity: 'blocker',
        jurisdiccion: 'global',
        ...(esPeso
          ? { fuente_url: 'https://www.imo.org/en/OurWork/Safety/Pages/Verification-of-the-gross-mass.aspx' }
          : {}),
      })
    }
  }
  return buildResult(violations)
}

export function validateSectorCompliance(sectorId: string, product: unknown): ComplianceResult {
  const sectorResult = validateSectorOnly(sectorId, product)
  const packagingResult = failClosed('packaging', () => validatePackagingCompliance(product))
  const fiscal = (product as { fiscal?: FiscalInvoicingData } | null | undefined)?.fiscal
  const fiscalResult = fiscal
    ? failClosed('fiscal', () => validateFiscalCompliance(fiscal))
    : buildResult([])
  const violations = [
    ...sectorResult.violations,
    ...packagingResult.violations,
    ...fiscalResult.violations,
  ]
  return { ok: !violations.some((v) => v.severity === 'blocker'), violations }
}

/** Ejecuta un validador y, si lanza (ficha mal formada · acceso a campo
 *  anidado inexistente · bug), NO propaga la excepción: devuelve un `blocker`
 *  fail-closed. El gate (/api/products) nunca debe responder 500 por una
 *  excepción del validador; ante incertidumbre, NO se publica (canon
 *  "ficha incompleta no opera" + defensa en profundidad). */
function failClosed(label: string, fn: () => ComplianceResult): ComplianceResult {
  try {
    return fn()
  } catch (e) {
    return {
      ok: false,
      violations: [
        {
          rule: 'COMPLIANCE_VALIDATOR_ERROR',
          law: 'Audit-Ready by Design (ADR 0011)',
          message: `El validador de cumplimiento ('${label}') no pudo evaluar la ficha (${e instanceof Error ? e.message : 'error'}). Se bloquea por seguridad hasta completar/corregir los datos.`,
          severity: 'blocker',
        },
      ],
    }
  }
}

/** Cumplimiento estrictamente SECTORIAL (sin la pasada fiscal transversal).
 *  Envuelto en fail-closed: un validador que lance bloquea, no rompe el gate. */
function validateSectorOnly(sectorId: string, product: unknown): ComplianceResult {
  return failClosed(sectorId, () => validateSectorOnlyUnsafe(sectorId, product))
}

function validateSectorOnlyUnsafe(sectorId: string, product: unknown): ComplianceResult {
  switch (sectorId) {
    case 'tecnologia':
      return validateTecnologiaCompliance(product as TecnologiaProduct)
    case 'turismo':
      return validateTurismoCompliance(product as TurismoProduct)
    case 'textil':
      return validateTextilCompliance(product as TextilProduct)
    case 'metalurgico':
      return validateMetalurgicoCompliance(product as MetalurgicoProduct)
    case 'salud':
      return validateSaludCompliance(product as SaludProduct)
    case 'automocion':
      return validateAutomocionCompliance(product as AutomocionProduct)
    case 'agroalimentario':
      return validateAgroalimentarioCompliance(product as AgroalimentarioProduct)
    case 'inmobiliario':
      return validateInmobiliarioCompliance(product as InmobiliarioProduct)
    case 'energia':
      return validateEnergiaCompliance(product as EnergiaProduct)
    case 'legal':
      return validateLegalCompliance(product as LegalProduct)
    case 'transporte':
      return validateTransporteCompliance(product as TransporteProduct)
    case 'educacion':
      return validateEducacionCompliance(product as EducacionProduct)
    case 'medioambiente':
      return validateMedioambienteCompliance(product as MedioambienteProduct)
    case 'cultura':
      return validateCulturaCompliance(product as CulturaProduct)
    case 'institucional':
      return validateInstitucionalCompliance(product as InstitucionalProduct)
    case 'servicios-auxiliares':
      return validateServiciosAuxiliaresCompliance(product as ServiciosAuxiliaresProduct)
    case 'financiero':
      return validateFinancieroCompliance(product as FinancieroProduct)
    default:
      return {
        ok: true,
        violations: [
          {
            rule: 'SECTOR_COMPLIANCE_NOT_IMPLEMENTED',
            law: 'Audit-Ready by Design (ADR 0011)',
            message: `El enforcement de cumplimiento de Capa 2 aún no está implementado para el sector '${sectorId}'. Pendiente de extender (ver SECTORS_WITH_COMPLIANCE).`,
            severity: 'warning',
          },
        ],
      }
  }
}
