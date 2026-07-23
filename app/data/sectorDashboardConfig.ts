// ════════════════════════════════════════════════════════════════════════════
// CONFIG DE DASHBOARD POR SECTOR / ROL · fuente única de verdad
// ════════════════════════════════════════════════════════════════════════════
//
// Problema que resuelve (José, 15-jun-2026): "cada sector tiene necesidades
// distintas; hay que replicar, añadir o quitar dependiendo el sector — y que
// sea sostenible". Hoy el dashboard (WorkspaceShell) tiene una lista de pestañas
// FIJA para todos (getTabs()). Eso no escala: forkar el shell por sector deja N
// copias que mantener.
//
// Solución: NO se copia el dashboard. Se mantiene UNA sola shell y se le dice,
// por config, qué módulos ve cada actor. Replicar un sector = añadir una entrada
// aquí (no un nuevo dashboard).
//
// LÓGICA DE DERIVACIÓN (no inventada — sale del análisis del propio proyecto:
// actorGroups.ts + tradeCompliance.ts + productSchemas + docs de estrategia):
// el conjunto de módulos de un sector se deriva de 5 atributos operativos:
//   1. ¿Mueve mercancía física?  → catálogo, cubicaje/contenedor, DPP
//   2. ¿Cruza frontera (HS code)? → exportación (motor de cumplimiento por corredor)
//   3. ¿Exige validación/certificados antes de publicar? → gestor documental sectorial
//   4. ¿Requiere verificación profesional (colegiación)? → verificador
//   5. ¿Parámetros operativos propios? (frío, custodia, NRA…) → módulo a medida
//
// Resolución de config: ROL (más específico) → SECTOR → _default.

// ── Catálogo de módulos posibles (pestañas) ─────────────────────────────────
// 'core'    = ya existen en WorkspaceShell (reutilizables tal cual).
// 'sector'  = específicos; los marcados `build:true` aún hay que construirlos.
export type ModuleId =
  // núcleo existente
  | 'inicio'
  | 'catalogo'
  | 'actores'
  | 'pedidos'
  | 'mi-catalogo'
  | 'archivos'
  | 'mensajes'
  | 'agenda'
  | 'exportacion'
  // sectoriales nuevos
  | 'custodia' //        trazabilidad firmada de la cadena de custodia (transitario, residuos)
  | 'documentacion' //   gestión documental (BL/CMR/AWB/DUA, contratos, facturas) — transitario, legal, B2G
  | 'dpp' //             Pasaporte Digital de Producto (físicos: mueble, auto, salud, agro, textil, tec, metal)
  | 'cadena-frio' //     temp/humedad + alertas (agroalimentario, salud)
  | 'trazabilidad' //    genealogía de lote / serialización (agro one-up/down, salud FMD, residuos LER)
  | 'compliance' //      gestor de validaciones/certificados sectoriales (el más reutilizado)
  | 'colegiacion' //     verificación profesional contra registro oficial (salud, legal, energía…)
  | 'reservas' //        disponibilidad y reserva de plazas/fechas (turismo)
  | 'licitaciones' //    licitación pública B2G: CPV, valor, solvencia, plazos (institucional)
  | 'firma' //           firma electrónica/notarial cualificada eIDAS QES (legal, B2G, cultura, financiero)
  | 'acreditacion' //    acreditación de títulos + credenciales verificables (educación)
  // legales (de la investigación 17-jun · escritorio del abogado)
  | 'expedientes' //     asuntos/casos (matter management): ciclo de vida, partes, documento↔expediente
  | 'plazos' //          plazos procesales (162.2/135 LEC) + bandeja LexNet
  | 'conflicto' //       comprobación de conflicto de interés ANTES de aceptar el encargo
  | 'penal' //           guardia/turno de oficio 24h + asistencia al detenido + designación
  | 'facturacion' //     minutas (hora/iguala/éxito) + cuenta de terceros + VeriFactu

export interface ModuleDef {
  id: ModuleId
  label: string
  kind: 'core' | 'sector'
  /** true = todavía no existe como componente; hay que construirlo. */
  build?: boolean
  /** Una frase de para qué sirve (documenta la decisión). */
  why: string
}

export const MODULES: Record<ModuleId, ModuleDef> = {
  inicio: { id: 'inicio', label: 'Inicio', kind: 'core', why: 'Resumen del escritorio.' },
  catalogo: { id: 'catalogo', label: 'Catálogo', kind: 'core', why: 'Productos/servicios a la venta.' },
  actores: { id: 'actores', label: 'Actores', kind: 'core', why: 'Red de contactos verificados.' },
  pedidos: { id: 'pedidos', label: 'Pedidos', kind: 'core', why: 'Pedido vivo + cubicaje + contenedor 3D.' },
  'mi-catalogo': { id: 'mi-catalogo', label: 'Mi catálogo', kind: 'core', why: 'Stock/almacén propio.' },
  archivos: { id: 'archivos', label: 'Archivos', kind: 'core', why: 'Documentos generales.' },
  mensajes: { id: 'mensajes', label: 'Mensajes', kind: 'core', why: 'Correo interno + comunicaciones.' },
  agenda: { id: 'agenda', label: 'Agenda', kind: 'core', why: 'Citas y planificación.' },
  exportacion: { id: 'exportacion', label: 'Exportación', kind: 'core', why: 'Motor de cumplimiento por corredor (origen→destino).' },

  custodia: { id: 'custodia', label: 'Custodia', kind: 'sector', build: true, why: 'Trazabilidad firmada (Ed25519) de la cadena de custodia G10. Núcleo del transitario.' },
  documentacion: { id: 'documentacion', label: 'Documentación', kind: 'sector', build: true, why: 'Gestión documental: BL/CMR/AWB/DUA (transitario), contratos (legal), facturas (B2G).' },
  dpp: { id: 'dpp', label: 'Pasaporte Digital', kind: 'sector', build: true, why: 'Pasaporte Digital de Producto (GS1 Digital Link + ciclo de vida). Motor real (mig 042) para físicos.' },
  'cadena-frio': { id: 'cadena-frio', label: 'Cadena de frío', kind: 'sector', build: true, why: 'Temp/humedad + alertas. OJO: BD tiene setpoints, no serie de sensores → estado honesto hasta que haya datos.' },
  trazabilidad: { id: 'trazabilidad', label: 'Trazabilidad', kind: 'sector', build: true, why: 'Genealogía de lote / serialización: agro one-up/down, salud FMD 2D, residuos LER.' },
  compliance: { id: 'compliance', label: 'Cumplimiento', kind: 'sector', build: true, why: 'Gestor de validaciones/certificados sectoriales antes de publicar. Parametrizado por _compliance.ts.' },
  colegiacion: { id: 'colegiacion', label: 'Colegiación', kind: 'sector', build: true, why: 'Verificación profesional contra registro oficial (CGAE, colegios sanitarios, ingeniería…).' },
  reservas: { id: 'reservas', label: 'Reservas', kind: 'sector', build: true, why: 'Disponibilidad y reserva de plazas/fechas. Núcleo del turismo (alojamiento/experiencias).' },
  licitaciones: { id: 'licitaciones', label: 'Licitaciones', kind: 'sector', build: true, why: 'Licitación pública B2G: CPV, valor estimado, solvencia, plazos. Núcleo del institucional.' },
  firma: { id: 'firma', label: 'Firma', kind: 'sector', build: true, why: 'Firma electrónica/notarial cualificada (eIDAS QES / ACA). Legal, B2G, cultura (PI), financiero.' },
  acreditacion: { id: 'acreditacion', label: 'Acreditación', kind: 'sector', build: true, why: 'Acreditación de títulos (ANECA/RUCT) + credenciales verificables. Núcleo de educación.' },

  expedientes: { id: 'expedientes', label: 'Expedientes', kind: 'sector', build: true, why: 'Asuntos/casos: ciclo de vida, partes, estados, documento↔expediente. El centro del despacho.' },
  plazos: { id: 'plazos', label: 'Plazos · LexNet', kind: 'sector', build: true, why: 'Motor de plazos procesales (3 días hábiles art. 162.2 LEC · día de gracia 15:00 art. 135 LEC) + bandeja LexNet.' },
  conflicto: { id: 'conflicto', label: 'Conflicto', kind: 'sector', build: true, why: 'Comprobación de conflicto de interés ANTES de aceptar el encargo (Código Deontológico).' },
  penal: { id: 'penal', label: 'Guardia penal', kind: 'sector', build: true, why: 'Turno de oficio/guardia 24h + asistencia al detenido + designación que vincula al mismo letrado.' },
  facturacion: { id: 'facturacion', label: 'Minutas', kind: 'sector', build: true, why: 'Minutas (hora/iguala/éxito) + cuenta de terceros (provisiones) + VeriFactu/factura electrónica.' },
}

// ── Conjunto núcleo por defecto (= lo que hoy ve todo el mundo) ──────────────
// Mantenerlo idéntico al getTabs() actual evita regresión en inmobiliario y los
// sectores que aún no tienen override.
const DEFAULT_MODULES: ModuleId[] = [
  'inicio', 'catalogo', 'actores', 'pedidos', 'mi-catalogo', 'archivos', 'mensajes', 'agenda', 'exportacion',
]

// ── Config por SECTOR ────────────────────────────────────────────────────────
// Derivado del análisis serio de las 6 capas del motor (ver
// docs/escritorios/2026-06-16-mapa-modulos-medios-por-sector.md). Cada lista =
// los módulos que resuelven los atascos reales de ese gremio, anclados a señales
// del código (schema + _compliance + actorGroups), no a opinión.
// NOTA: hoy solo `transporte` tiene escritorio real (/transitario) que consume
// esto; el resto aterriza en la WorkspaceShell general. Estas entradas son el
// plano para construir cada sector — additivas, sin efecto en runtime aún.
const BY_SECTOR: Record<string, ModuleId[]> = {
  // ── FÍSICOS (DPP): catálogo + pedidos(cubicaje) + dpp + exportación + compliance ──

  // TRANSPORTE · el transitario NO vende catálogo propio: gestiona la logística y
  // los papeles de envíos de otros. Núcleo: pedidos(cubicaje+contenedor) +
  // exportación + CUSTODIA + DOCUMENTACIÓN. Quita catálogo y mi-catálogo (venta).
  transporte: ['inicio', 'pedidos', 'exportacion', 'custodia', 'documentacion', 'actores', 'mensajes', 'agenda'],

  // INMOBILIARIO (mueble + inmueble) · cabeza de playa. Mueble físico (DPP/cubicaje
  // export) + documentación del inmueble (IEE/cédula/licencias) + colegiados (arquitectos/tasadores).
  inmobiliario: ['inicio', 'catalogo', 'pedidos', 'dpp', 'exportacion', 'compliance', 'colegiacion', 'documentacion', 'mi-catalogo', 'actores', 'mensajes', 'agenda', 'archivos'],

  // AUTOMOCION · vehículo físico. Homologación/COC (compliance) + DPP + historial (documentación).
  automocion: ['inicio', 'catalogo', 'pedidos', 'dpp', 'exportacion', 'compliance', 'documentacion', 'mi-catalogo', 'actores', 'mensajes', 'agenda'],

  // SALUD · medicamento/dispositivo + servicio profesional. CE/UDI/autorización (compliance),
  // frío + serialización FMD (trazabilidad), colegiación sanitaria.
  salud: ['inicio', 'catalogo', 'pedidos', 'dpp', 'cadena-frio', 'trazabilidad', 'compliance', 'colegiacion', 'exportacion', 'documentacion', 'actores', 'mensajes', 'agenda'],

  // AGROALIMENTARIO · alimento físico. FIC/alérgenos + RGSEAA + DOP/IGP (compliance),
  // frío (cadena-frio), lote one-up/down (trazabilidad).
  agroalimentario: ['inicio', 'catalogo', 'pedidos', 'exportacion', 'cadena-frio', 'trazabilidad', 'compliance', 'mi-catalogo', 'actores', 'mensajes', 'agenda'],

  // TEXTIL · físico. Etiquetado composición + REACH/EUDR + DPP textil ESPR (compliance/dpp).
  textil: ['inicio', 'catalogo', 'pedidos', 'dpp', 'exportacion', 'compliance', 'documentacion', 'mi-catalogo', 'actores', 'mensajes', 'agenda'],

  // TECNOLOGIA · EEE físico + servicios. RoHS/WEEE/REACH + CRA(SBOM)/AI Act (compliance) + DPP.
  tecnologia: ['inicio', 'catalogo', 'pedidos', 'dpp', 'exportacion', 'compliance', 'documentacion', 'actores', 'mensajes', 'agenda'],

  // METALURGICO · físico. Cert. material EN 10204 + colada + CBAM + EN 1090/PED (compliance/dpp).
  metalurgico: ['inicio', 'catalogo', 'pedidos', 'dpp', 'exportacion', 'compliance', 'documentacion', 'actores', 'mensajes', 'agenda'],

  // ENERGIA · equipo físico + servicios. CE/IEC (compliance) + instalador REBT (colegiación) + PPA (documentación).
  energia: ['inicio', 'catalogo', 'pedidos', 'exportacion', 'compliance', 'colegiacion', 'documentacion', 'actores', 'mensajes', 'agenda'],

  // ── SERVICIOS / B2G: sin cubicaje; peso en compliance/colegiación/firma/reservas/licitaciones ──

  // LEGAL · servicio. Reconstruido con la investigación 17-jun (escritorio del abogado):
  // expedientes (centro) + plazos/LexNet + conflicto de interés + firma ACA/QES +
  // colegiación/RCP + GUARDIA PENAL (turno de oficio/asistencia al detenido) + minutas.
  legal: ['inicio', 'expedientes', 'plazos', 'agenda', 'conflicto', 'penal', 'colegiacion', 'firma', 'facturacion', 'documentacion', 'catalogo', 'actores', 'mensajes', 'archivos'],

  // TURISMO · servicio. Reservas/disponibilidad + registro NRA/insolvencia/EAA (compliance) + guías (colegiación).
  turismo: ['inicio', 'catalogo', 'reservas', 'agenda', 'compliance', 'colegiacion', 'actores', 'mensajes', 'archivos'],

  // EDUCACION · servicio. Acreditación títulos (ANECA/RUCT) + centro/menores (compliance) + docente (colegiación).
  educacion: ['inicio', 'catalogo', 'acreditacion', 'agenda', 'compliance', 'colegiacion', 'actores', 'mensajes', 'archivos'],

  // MEDIOAMBIENTE · servicios + materia recuperada. Residuo LER (custodia/trazabilidad) + traslados (exportación).
  medioambiente: ['inicio', 'catalogo', 'custodia', 'trazabilidad', 'exportacion', 'compliance', 'documentacion', 'pedidos', 'actores', 'mensajes', 'agenda'],

  // CULTURA · producción + bien cultural. PI/gestión colectiva (firma/documentación) + licencia export (exportación).
  cultura: ['inicio', 'catalogo', 'exportacion', 'compliance', 'firma', 'documentacion', 'agenda', 'actores', 'mensajes', 'archivos'],

  // INSTITUCIONAL · B2G. Licitación (CPV/valor/plazos) + no-prohibición/solvencia (compliance) + FACe/eIDAS (firma).
  institucional: ['inicio', 'licitaciones', 'compliance', 'documentacion', 'firma', 'actores', 'agenda', 'mensajes', 'archivos'],

  // SERVICIOS-AUXILIARES · servicios B2B. Autorización seguridad/ETT/ROESB + PRL (compliance) + habilitación (colegiación).
  'servicios-auxiliares': ['inicio', 'catalogo', 'compliance', 'colegiacion', 'documentacion', 'agenda', 'actores', 'mensajes', 'archivos'],

  // FINANCIERO · ⚠️ subject_to_expert. AML/KYC + licencias (MiFID/IDD/CASP) + DORA (compliance) + firma.
  // NO go-live sin abogado fintech (ver doc §6). El escritorio solo levanta banderas, no autoriza operar.
  financiero: ['inicio', 'catalogo', 'compliance', 'documentacion', 'firma', 'actores', 'mensajes', 'agenda', 'archivos'],
}

// ── Config por ROL (más específico que el sector) ────────────────────────────
const BY_ROLE: Record<string, ModuleId[]> = {
  // Los tres tipos de transitario comparten el set de TRANSPORTE.
  'transitarios-mar': BY_SECTOR.transporte!,
  'transitarios-aire': BY_SECTOR.transporte!,
  'logistica-terrestre': BY_SECTOR.transporte!,
}

/**
 * Devuelve los módulos (pestañas) que ve un actor, en orden.
 * Resolución: rol > sector > default. Nunca vacío.
 */
export function modulesFor(input: { sectorId?: string | null; roleId?: string | null }): ModuleId[] {
  if (input.roleId && BY_ROLE[input.roleId]) return BY_ROLE[input.roleId]!
  if (input.sectorId && BY_SECTOR[input.sectorId]) return BY_SECTOR[input.sectorId]!
  return DEFAULT_MODULES
}

/** ¿Tiene este sector/rol un dashboard a medida (override) o usa el por defecto? */
export function hasCustomDashboard(input: { sectorId?: string | null; roleId?: string | null }): boolean {
  return Boolean((input.roleId && BY_ROLE[input.roleId]) || (input.sectorId && BY_SECTOR[input.sectorId]))
}

// ── Enrutado de escritorio por sector/rol ────────────────────────────────────
// Por defecto, el WorkspaceShell general vive en /sector/<id>. Algunos sectores
// ya tienen su propio escritorio REAL (datos de BD, no maqueta) en su ruta.
// Anclar un sector a su escritorio = añadir una línea aquí (no tocar el router).
// OJO: un sector con override de módulos (BY_SECTOR) pero SIN escritorio propio
// construido sigue usando /sector/<id> — solo se desvía lo que existe de verdad.
const DESK_ROUTE_BY_SECTOR: Record<string, string> = {
  transporte: '/transitario',
  legal: '/despacho',
}
const DESK_ROUTE_BY_ROLE: Record<string, string> = {
  'transitarios-mar': '/transitario',
  'transitarios-aire': '/transitario',
  'logistica-terrestre': '/transitario',
  // VENDEDOR de mueble/inmobiliario → su escritorio REAL (catálogo desde BD).
  // Por ROL (no por sector) a propósito: el comprador comparte sector pero tiene
  // su propia vista (sus pedidos), no la del vendedor.
  inmobiliario_fabricante: '/inmobiliario',
  // COMPRADOR → su escritorio REAL (sus pedidos: documentación, precinto, pago).
  inmobiliario_comprador: '/comprador',
}

/**
 * Ruta de aterrizaje del escritorio para un actor.
 * Resolución: rol > sector (escritorio propio) > /sector/<sectorId> > onboarding.
 */
export function landingPathFor(input: { sectorId?: string | null; roleId?: string | null }): string {
  if (input.roleId && DESK_ROUTE_BY_ROLE[input.roleId]) return DESK_ROUTE_BY_ROLE[input.roleId]!
  if (input.sectorId && DESK_ROUTE_BY_SECTOR[input.sectorId]) return DESK_ROUTE_BY_SECTOR[input.sectorId]!
  if (input.sectorId) return `/sector/${input.sectorId}`
  return '/registro/sector'
}
