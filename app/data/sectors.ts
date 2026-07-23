export type Stat = { num: string; label: string }
export type CatalogCategory = { name: string; count: string }
export type ZonaUsuario = { titulo: string; desc: string; tags: string[] }
export type CircularFlow = { de: string; a: string; desc: string }

export type Sector = {
  id: string
  label: string
  short: string // 3-letter code
  description: string
  /** Optional sub-divisions (e.g. transporte → mar, tierra, aire). */
  subSectors?: string[]
  /** Whether the vertical landing already exists (true for inmobiliario today). */
  builtOut?: boolean
  /** Hero subtitle / headline shown at the top of /sector/[id]. */
  heroTitle?: string
  /** Hero supporting paragraph. */
  heroBody?: string
  /** 3 hero KPIs (e.g. companies, products, settlement time). */
  stats?: Stat[]
  /** Catalog categories shown as a grid in the sector landing. */
  catalogCategories?: CatalogCategory[]
  /** 3 user zones (compradores / profesionales / proveedores) for THIS sector. */
  zonas?: ZonaUsuario[]
  /** Inter-role flows (economía circular) inside the sector. */
  circularFlows?: CircularFlow[]
}

export const SECTORS: Sector[] = [
  {
    id: 'inmobiliario',
    label: 'Inmobiliario',
    short: 'INM',
    description: 'Construcción, materiales, acabados, instalaciones, profesionales y servicios.',
    builtOut: true,
    heroTitle: 'El sector inmobiliario,\nconectado',
    heroBody:
      'Inversores, arquitectos, reformistas, inmobiliarias y proveedores en una sola plataforma. Catálogos, pagos seguros y trazabilidad total de cada pedido.',
    stats: [
      { num: '1.200+', label: 'Empresas' },
      { num: '8.400+', label: 'Productos' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Cocinas', count: '284 productos' },
      { name: 'Puertas de interior', count: '198 productos' },
      { name: 'Suelos y parquets', count: '312 productos' },
      { name: 'Mobiliario', count: '560 productos' },
      { name: 'Armarios', count: '176 productos' },
      { name: 'Puertas de entrada', count: '142 productos' },
      { name: 'Ventanas', count: '231 productos' },
      { name: 'Revestimientos', count: '408 productos' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Inversores, arquitectos, interioristas, inmobiliarias y reformistas. Busca materiales, contrata servicios y gestiona tus proyectos desde un panel unificado.',
        tags: ['Inversores', 'Arquitectos', 'Inmobiliarias', 'Reformistas'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Especialistas verificados: albañiles, electricistas, carpinteros y más. Publica tu perfil y recibe solicitudes de proyectos reales con pago garantizado.',
        tags: ['Albañiles', 'Electricistas', 'Carpinteros', 'Pintores'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Empresas con catálogo de producto. Publica tu inventario una sola vez, sincroniza desde tu ERP y conecta con miles de compradores B2B en tiempo real.',
        tags: ['Materiales', 'Acabados', 'Instalaciones', 'Maquinaria'],
      },
    ],
    circularFlows: [
      { de: 'Arquitecto', a: 'Proveedor de materiales', desc: 'Compra directa de materiales con precios B2B y ficha técnica completa.' },
      { de: 'Empresa de reformas', a: 'Arquitecto o interiorista', desc: 'Contrata diseño y dirección de obra para sus proyectos de clientes.' },
      { de: 'Inversor', a: 'Constructora o reformista', desc: 'Encuentra profesionales verificados para sus activos inmobiliarios.' },
      { de: 'Inmobiliaria', a: 'Todos los servicios', desc: 'Compra, reforma y entrega activos. Gestiona proveedores y obras desde un solo panel.' },
      { de: 'Interiorista', a: 'Proveedor de acabados', desc: 'Accede a catálogos de mobiliario, revestimientos y materiales de alta gama.' },
      { de: 'Constructor', a: 'Instaladores y oficios', desc: 'Subcontrata electricistas, fontaneros y carpinteros para cada obra.' },
    ],
  },
  {
    id: 'automocion',
    label: 'Automoción',
    short: 'AUT',
    description: 'Fabricantes, talleres, recambios, flotas, movilidad eléctrica.',
    heroTitle: 'La cadena del automóvil,\nconectada',
    heroBody:
      'Fabricantes OEM, talleres, distribuidores de recambios y gestores de flota en una sola plataforma. Pagos seguros y trazabilidad completa de cada pieza.',
    stats: [
      { num: '320+', label: 'Empresas' },
      { num: '12.500+', label: 'Referencias' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Recambios', count: '4.200 productos' },
      { name: 'Neumáticos', count: '180 productos' },
      { name: 'Lubricantes', count: '95 productos' },
      { name: 'Carrocería', count: '720 productos' },
      { name: 'Electrónica', count: '540 productos' },
      { name: 'Frenos', count: '380 productos' },
      { name: 'Suspensión', count: '290 productos' },
      { name: 'Iluminación', count: '210 productos' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Talleres, concesionarios y gestores de flota. Encuentra recambios homologados, contrata mantenimiento y abastece tu negocio sin intermediarios.',
        tags: ['Talleres', 'Concesionarios', 'Flotas', 'Renting'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Mecánicos, chapistas, electricistas y especialistas certificados (IATF 16949). Recibe trabajos verificados con pago garantizado.',
        tags: ['Mecánicos', 'Chapistas', 'Electricistas', 'Pintores'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Fabricantes OEM, distribuidores oficiales y proveedores de aftermarket. Publica tu catálogo homologado y conecta con la cadena entera.',
        tags: ['Fabricantes OEM', 'Aftermarket', 'Lubricantes', 'Componentes'],
      },
    ],
    circularFlows: [
      { de: 'Concesionario', a: 'Fabricante OEM', desc: 'Pedidos directos con descuentos por volumen y trazabilidad de garantía.' },
      { de: 'Taller', a: 'Distribuidor de recambios', desc: 'Acceso a referencias homologadas con entrega en 24h.' },
      { de: 'Flota', a: 'Taller red', desc: 'Mantenimiento programado en cualquier punto del país, factura unificada.' },
      { de: 'Fabricante', a: 'Proveedor de componentes', desc: 'Cadena de suministro auditada con certificaciones IATF.' },
      { de: 'Renting', a: 'Concesionario', desc: 'Reposición de vehículos con financiación integrada.' },
      { de: 'Aftermarket', a: 'Talleres', desc: 'Distribución optimizada para piezas no-OEM con garantía.' },
    ],
  },
  {
    id: 'salud',
    label: 'Salud',
    short: 'SAL',
    description: 'Farma, dispositivos médicos, servicios sanitarios, suministros hospitalarios.',
    heroTitle: 'La cadena sanitaria,\nverificada',
    heroBody:
      'Farmacéuticas, hospitales, clínicas, distribuidores y suministros médicos. Trazabilidad completa con certificación GMP/GDP y pagos seguros.',
    stats: [
      { num: '180+', label: 'Empresas' },
      { num: '6.300+', label: 'Productos' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Medicamentos', count: '1.800 productos' },
      { name: 'Equipamiento médico', count: '420 productos' },
      { name: 'Material quirúrgico', count: '630 productos' },
      { name: 'Diagnóstico', count: '290 productos' },
      { name: 'Mobiliario clínico', count: '180 productos' },
      { name: 'EPI sanitario', count: '340 productos' },
      { name: 'Laboratorio', count: '510 productos' },
      { name: 'Telemedicina', count: '95 productos' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Hospitales, clínicas, farmacias y centros sociosanitarios. Aprovisionamiento certificado con trazabilidad de lote.',
        tags: ['Hospitales', 'Clínicas', 'Farmacias', 'Geriátricos'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Sanitarios verificados con número de colegiación validado. Asesoría, formación y servicios profesionales.',
        tags: ['Médicos', 'Enfermería', 'Farmacéuticos', 'Técnicos'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Laboratorios, distribuidores GDP, fabricantes de equipamiento médico. Catálogo con marcado CE y autorizaciones AEMPS.',
        tags: ['Farma', 'Equipamiento', 'Lab', 'EPI'],
      },
    ],
    circularFlows: [
      { de: 'Hospital', a: 'Distribuidor farmacéutico', desc: 'Pedidos urgentes con trazabilidad GDP y temperatura controlada.' },
      { de: 'Clínica', a: 'Proveedor de equipamiento', desc: 'Renovación de equipamiento con certificación CE.' },
      { de: 'Farmacia', a: 'Laboratorio', desc: 'Pedidos directos con liquidación inmediata.' },
      { de: 'Geriátrico', a: 'Proveedor de EPI', desc: 'Suministro recurrente con mejor precio B2B.' },
      { de: 'Laboratorio', a: 'Hospital', desc: 'Resultados clínicos integrados al historial del paciente.' },
      { de: 'Centro de diagnóstico', a: 'Médico especialista', desc: 'Solicita pruebas y comparte informes encriptados.' },
    ],
  },
  {
    id: 'agroalimentario',
    label: 'Agroalimentario',
    short: 'AGR',
    description: 'Agricultura, ganadería, pesca, industria alimentaria, distribución y HORECA.',
    heroTitle: 'La cadena agroalimentaria,\ndel campo a la mesa',
    heroBody:
      'Agricultores, ganaderos, pesca, industria alimentaria, distribución, retail y HORECA conectados con certificación HACCP/IFS y trazabilidad completa de cada lote. Pagos seguros.',
    stats: [
      { num: '420+', label: 'Empresas' },
      { num: '15.700+', label: 'Referencias' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Carnes y pescados', count: '2.100 productos' },
      { name: 'Frutas y verduras', count: '890 productos' },
      { name: 'Lácteos', count: '650 productos' },
      { name: 'Bebidas', count: '1.400 productos' },
      { name: 'Conservas', count: '520 productos' },
      { name: 'Ingredientes', count: '780 productos' },
      { name: 'Packaging', count: '340 productos' },
      { name: 'Congelados', count: '410 productos' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Restaurantes, hoteles, retail, catering y centrales de compra. Aprovisionamiento con cadena de frío certificada.',
        tags: ['Restaurantes', 'Hoteles', 'Retail', 'Catering'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Chefs, técnicos en seguridad alimentaria, asesores HACCP. Servicios profesionales y formación verificada.',
        tags: ['Chefs', 'HACCP', 'Nutricionistas', 'Auditores'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Productores, mayoristas y distribuidores con HACCP, IFS o BRC. Catálogo con trazabilidad de lote y origen.',
        tags: ['Productores', 'Mayoristas', 'Importadores', 'Packaging'],
      },
    ],
    circularFlows: [
      { de: 'Restaurante', a: 'Mayorista', desc: 'Pedidos diarios con cadena de frío y entrega de madrugada.' },
      { de: 'Retail', a: 'Productor local', desc: 'Compra directa al productor, marcado de origen trazable.' },
      { de: 'Catering', a: 'Proveedor de packaging', desc: 'Envases sostenibles con certificación de origen.' },
      { de: 'Hotel', a: 'Distribuidor de bebidas', desc: 'Suministro recurrente con precios negociados.' },
      { de: 'Productor', a: 'Importador', desc: 'Exportación con compliance aduanero automatizado.' },
      { de: 'Mayorista', a: 'Auditor HACCP', desc: 'Auditoría continua del proceso para certificación.' },
    ],
  },
  {
    id: 'transporte',
    label: 'Transporte',
    short: 'TRA',
    description: 'Logística por mar, tierra y aire. Carga, expedición, almacenaje.',
    subSectors: ['marítimo', 'terrestre', 'aéreo'],
    heroTitle: 'La logística global,\nen una pantalla',
    heroBody:
      'Transitarios marítimos, transportistas por carretera, agentes de carga aérea y operadores logísticos integrales. Trazabilidad de envío completa y pagos seguros.',
    stats: [
      { num: '290+', label: 'Operadores' },
      { num: '95%', label: 'Cobertura global' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Carga marítima', count: 'FCL · LCL · Bulk' },
      { name: 'Transporte por carretera', count: 'Nacional · Internacional' },
      { name: 'Carga aérea', count: 'Express · General · Especial' },
      { name: 'Almacenaje', count: 'ADR · Frío · General' },
      { name: 'Aduanas', count: 'Importación · Exportación' },
      { name: 'Última milla', count: 'B2B · B2C · Retail' },
      { name: 'Mercancías peligrosas', count: 'ADR · IMDG · IATA' },
      { name: 'Tracking', count: 'GPS · IoT · Tiempo real' },
    ],
    zonas: [
      {
        titulo: 'Cargadores',
        desc: 'Empresas que necesitan mover mercancía a nivel local, nacional o internacional. Cotiza y contrata desde un único panel.',
        tags: ['Industria', 'Comercio', 'E-commerce', 'Importadores'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Conductores autónomos, agentes aduaneros, despachantes. Recibe rutas verificadas con liquidación inmediata.',
        tags: ['Conductores', 'Aduanas', 'Estiba', 'Tránsito'],
      },
      {
        titulo: 'Operadores',
        desc: 'Navieras, transitarios, transportistas y operadores logísticos. Publica capacidad en tiempo real.',
        tags: ['Navieras', 'Transitarios', 'Transportistas', 'Almacenes'],
      },
    ],
    circularFlows: [
      { de: 'Industria', a: 'Transitario', desc: 'Cotización multimodal en tiempo real con seguro de carga.' },
      { de: 'E-commerce', a: 'Transportista de última milla', desc: 'Reparto B2C con tracking compartido al cliente final.' },
      { de: 'Importador', a: 'Agente aduanero', desc: 'DUA, despacho y liberación con compliance automático.' },
      { de: 'Distribuidor', a: 'Operador logístico', desc: 'Almacenaje, picking y distribución integrados.' },
      { de: 'Naviera', a: 'Transitario', desc: 'Capacidad publicada en tiempo real, booking instantáneo.' },
      { de: 'Carga aérea', a: 'Cargador urgente', desc: 'Tarifas spot en hub a hub con tracking en tiempo real.' },
    ],
  },
  {
    id: 'metalurgico',
    label: 'Metalúrgico',
    short: 'MET',
    description: 'Acero, aluminio, soldadura, calderería, mecanizado, fundición.',
    heroTitle: 'El metal, conectado\na la industria',
    heroBody:
      'Acerías, fundiciones, talleres de mecanizado, calderería y proveedores de tratamientos. Certificaciones EN 1090, ISO 3834 y PED verificables.',
    stats: [
      { num: '210+', label: 'Empresas' },
      { num: '4.800+', label: 'Productos' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Acero estructural', count: 'Perfiles · Chapas · Tubos' },
      { name: 'Aluminio', count: 'Perfiles · Chapas · Lingotes' },
      { name: 'Inoxidable', count: '304 · 316 · 430' },
      { name: 'Soldadura', count: 'TIG · MIG · Electrodo' },
      { name: 'Mecanizado', count: 'CNC · Convencional · 3D' },
      { name: 'Fundición', count: 'Hierro · Acero · No férricos' },
      { name: 'Tratamientos', count: 'Térmicos · Superficiales' },
      { name: 'Calderería', count: 'Presión · Estructural · Naval' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Constructoras, fabricantes industriales, naval, energía. Compra acero certificado con trazabilidad de colada.',
        tags: ['Construcción', 'Naval', 'Energía', 'Industrial'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Soldadores certificados (3834), montadores, técnicos en mecanizado. Servicios verificados con pago garantizado.',
        tags: ['Soldadores', 'Montadores', 'CNC', 'Calderería'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Acerías, fundiciones, talleres certificados. Publica capacidad y stock con certificados de calidad asociados.',
        tags: ['Acerías', 'Fundiciones', 'Talleres', 'Tratamientos'],
      },
    ],
    circularFlows: [
      { de: 'Constructor', a: 'Acería', desc: 'Acero estructural con certificado EN 1090 y trazabilidad de colada.' },
      { de: 'Fabricante industrial', a: 'Taller mecanizado', desc: 'Pieza a medida con tolerancias garantizadas.' },
      { de: 'Naval', a: 'Calderería certificada', desc: 'Conjuntos soldados con homologación 3834.' },
      { de: 'Energía', a: 'Proveedor PED', desc: 'Equipos a presión con marcado CE y trazabilidad completa.' },
      { de: 'Diseñador industrial', a: 'Mecanizado CNC', desc: 'De CAD a pieza física en 48-72h.' },
      { de: 'Recambio industrial', a: 'Fundición', desc: 'Piezas obsoletas refabricadas a partir de planos digitalizados.' },
    ],
  },
  {
    id: 'energia',
    label: 'Energía',
    short: 'ENE',
    description: 'Renovables, eléctrico, gas, eficiencia energética, almacenamiento.',
    heroTitle: 'La energía, distribuida\ny verificada',
    heroBody:
      'Renovables, eficiencia, almacenamiento, instalación y mantenimiento. Certificación REE, RITE y trazabilidad de origen verde.',
    stats: [
      { num: '160+', label: 'Empresas' },
      { num: '3.400+', label: 'Productos' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Solar fotovoltaica', count: 'Paneles · Inversores · Estructuras' },
      { name: 'Eólica', count: 'Aerogeneradores · Pequeña eólica' },
      { name: 'Almacenamiento', count: 'Baterías · BESS · UPS' },
      { name: 'Eficiencia HVAC', count: 'Bombas calor · Aerotermia' },
      { name: 'Iluminación LED', count: 'Industrial · Comercial · Vial' },
      { name: 'Movilidad eléctrica', count: 'Cargadores · Gestión' },
      { name: 'Hidrógeno', count: 'Electrolizadores · Pila' },
      { name: 'Gas', count: 'Calderas · Tuberías · Reguladores' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Industria, comunidades de propietarios, ESCO, comercializadoras. Inversión en eficiencia con ROI medido y verificable.',
        tags: ['Industria', 'Comunidades', 'ESCO', 'Comercializadoras'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Instaladores RITE, ingenieros, mantenimiento. Servicios verificados con seguro de responsabilidad.',
        tags: ['Instaladores', 'Ingenieros', 'Mantenimiento', 'Auditores'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Fabricantes y distribuidores de equipos. Catálogo con eficiencia certificada y certificados de origen.',
        tags: ['Fabricantes', 'Distribuidores', 'Importadores', 'Servicios'],
      },
    ],
    circularFlows: [
      { de: 'Industria', a: 'ESCO', desc: 'Contratos de servicios energéticos con ahorros garantizados.' },
      { de: 'Comunidad', a: 'Instalador solar', desc: 'Autoconsumo compartido con generación medida.' },
      { de: 'Promotor', a: 'Fabricante de baterías', desc: 'Almacenamiento BESS para parques renovables.' },
      { de: 'Comercializadora', a: 'Productor renovable', desc: 'Compra directa de energía con certificado de origen.' },
      { de: 'Hospital', a: 'Mantenimiento HVAC', desc: 'Eficiencia energética con monitorización IoT.' },
      { de: 'Flota', a: 'Cargadores eléctricos', desc: 'Despliegue de infraestructura con gestión inteligente.' },
    ],
  },
  {
    id: 'tecnologia',
    label: 'Tecnología',
    short: 'TEC',
    description: 'Software, hardware, comunicaciones, IT industrial, IoT.',
    heroTitle: 'La tecnología B2B,\nintegrada',
    heroBody:
      'Software, hardware, IT industrial, comunicaciones e IoT. SLAs verificables y contratos de servicio con pagos seguros.',
    stats: [
      { num: '380+', label: 'Empresas' },
      { num: '5.200+', label: 'Productos / servicios' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Software empresarial', count: 'ERP · CRM · BI' },
      { name: 'Cloud y hosting', count: 'IaaS · PaaS · SaaS' },
      { name: 'Ciberseguridad', count: 'SOC · Pentest · DLP' },
      { name: 'Hardware', count: 'Servidores · Workstations · Red' },
      { name: 'IoT industrial', count: 'Sensores · Pasarelas · Edge' },
      { name: 'Comunicaciones', count: 'Fibra · Móvil · Satélite' },
      { name: 'Integración', count: 'API · iPaaS · Webhook' },
      { name: 'IA y datos', count: 'ML · Analytics · Data lake' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Pymes, grandes empresas, administración pública. Contrata software, hardware y servicios IT con SLA garantizado.',
        tags: ['Pymes', 'Empresas', 'Administración', 'Educación'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Consultores IT, desarrolladores, arquitectos cloud. Recibe proyectos verificados con pago en hitos.',
        tags: ['Consultores', 'Devs', 'Arquitectos', 'Auditores'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Fabricantes, partners, integradores, ISV. Catálogo con licenciamiento integrado y SLAs medidos.',
        tags: ['Fabricantes', 'ISV', 'Integradores', 'Partners'],
      },
    ],
    circularFlows: [
      { de: 'Pyme', a: 'ISV', desc: 'Software a medida con licenciamiento por uso.' },
      { de: 'Empresa', a: 'Cloud provider', desc: 'Infraestructura escalable con facturación por consumo.' },
      { de: 'Industria', a: 'Integrador IoT', desc: 'Conectividad de planta con dashboards en tiempo real.' },
      { de: 'Equipo IT', a: 'SOC externalizado', desc: 'Monitorización 24/7 con respuesta a incidentes.' },
      { de: 'Producto', a: 'Plataforma de datos', desc: 'Analítica avanzada conectada al ERP.' },
      { de: 'Distribuidor', a: 'Fabricante hardware', desc: 'Stock disponible en tiempo real con despacho directo.' },
    ],
  },
  {
    id: 'turismo',
    label: 'Turismo',
    short: 'TUR',
    description: 'Hostelería, restauración, viajes, ocio, eventos.',
    heroTitle: 'La industria turística,\nen un panel',
    heroBody:
      'Hoteles, restaurantes, agencias, transporte de pasajeros, ocio y eventos. Reservas con pago seguro y trazabilidad de cada operación.',
    stats: [
      { num: '540+', label: 'Empresas' },
      { num: '11.200+', label: 'Productos / servicios' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Equipamiento hotelero', count: '870 productos' },
      { name: 'Lavandería industrial', count: '210 productos' },
      { name: 'Cocinas profesionales', count: '460 productos' },
      { name: 'Mobiliario contract', count: '380 productos' },
      { name: 'Servicios DMC', count: 'B2B · Eventos · MICE' },
      { name: 'Transporte pasajeros', count: 'Charter · Transfer · VTC' },
      { name: 'Tecnología hotelera', count: 'PMS · Channel · CRM' },
      { name: 'Ocio y entradas', count: 'B2B · Group · Combo' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Hoteles, restaurantes, agencias, organizadores de eventos. Aprovisionamiento, servicios y tecnología con un solo proveedor logístico.',
        tags: ['Hoteles', 'Restaurantes', 'Agencias', 'Eventos'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Chefs, sumilleres, recepcionistas, organizadores. Recibe encargos verificados con pago instantáneo.',
        tags: ['Chefs', 'Sumilleres', 'Eventos', 'Guías'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Mayoristas, fabricantes, DMC, tour operadores. Publica catálogo con disponibilidad en tiempo real.',
        tags: ['Mayoristas', 'DMC', 'Fabricantes', 'Plataformas'],
      },
    ],
    circularFlows: [
      { de: 'Hotel', a: 'Lavandería industrial', desc: 'Servicio diario con seguimiento de inventario textil.' },
      { de: 'Restaurante', a: 'Mayorista alimentación', desc: 'Pedidos diarios con cadena de frío auditada.' },
      { de: 'Agencia', a: 'DMC local', desc: 'Servicios de receptivo con confirmación instantánea.' },
      { de: 'Evento corporativo', a: 'Catering profesional', desc: 'Servicio integral con liquidación post-evento.' },
      { de: 'Hotel', a: 'PMS / Channel manager', desc: 'Gestión de canales con sincronización de tarifas.' },
      { de: 'Operador turístico', a: 'Transporte pasajeros', desc: 'Charter y transfer con tracking en tiempo real.' },
    ],
  },
  {
    id: 'legal',
    label: 'Legal',
    short: 'LEG',
    description: 'Despachos, notarías, registros, propiedad intelectual, compliance, fiscal-laboral.',
    heroTitle: 'Servicios jurídicos,\nverificados',
    heroBody:
      'Despachos, notarías, registradores, peritos y plataformas legaltech en una sola pantalla. Contratos firmados, expedientes trazables y minutas con pago seguro.',
    stats: [
      { num: '470+', label: 'Profesionales' },
      { num: '6.800+', label: 'Procedimientos' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Mercantil y societario', count: '480 servicios' },
      { name: 'Fiscal y tributario', count: '320 servicios' },
      { name: 'Laboral', count: '290 servicios' },
      { name: 'Penal y litigios', count: '210 servicios' },
      { name: 'Propiedad intelectual', count: '180 servicios' },
      { name: 'Inmobiliario y urbanismo', count: '240 servicios' },
      { name: 'Notaría', count: '95 servicios' },
      { name: 'Compliance y RGPD', count: '160 servicios' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Empresas, autónomos, startups, fondos y particulares con litigios. Contrata abogado o notario verificado con presupuesto cerrado y trazabilidad de expediente.',
        tags: ['Empresas', 'Startups', 'Fondos', 'Particulares'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Abogados colegiados, procuradores, notarios, registradores, peritos judiciales y mediadores. Recibe casos verificados con minuta trazable.',
        tags: ['Abogados', 'Procuradores', 'Notarios', 'Peritos'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Bufetes, consultoras compliance, agencias de patentes, plataformas legaltech y software de gestión jurídica. Servicios y herramientas integradas.',
        tags: ['Bufetes', 'Compliance', 'Patentes', 'Legaltech'],
      },
    ],
    circularFlows: [
      { de: 'Startup', a: 'Abogado mercantil', desc: 'Constitución, pactos de socios y rondas con plantillas verificadas.' },
      { de: 'Empresa', a: 'Despacho fiscal', desc: 'Asesoría continua y modelos AEAT presentados con firma electrónica.' },
      { de: 'Comprador inmobiliario', a: 'Notario', desc: 'Otorgamiento de escritura con pago seguro y registro trazable.' },
      { de: 'Inversor', a: 'Bufete compliance', desc: 'Due diligence legal y reportes RGPD/AML automatizados.' },
      { de: 'Inventor', a: 'Agente de patentes', desc: 'Solicitud OEPM/EPO con seguimiento en tiempo real.' },
      { de: 'Litigante', a: 'Procurador', desc: 'Representación procesal con expediente compartido trazable.' },
    ],
  },
  {
    id: 'textil',
    label: 'Textil',
    short: 'TXT',
    description: 'Hilados, tejidos, confección, estampación, acabados, hogar textil, técnico.',
    heroTitle: 'La cadena textil,\nintegrada',
    heroBody:
      'Hilanderías, tejedurías, confecciones, estampadores y proveedores de acabados. Trazabilidad de fibra a prenda con certificación GOTS / OEKO-TEX y pagos seguros.',
    stats: [
      { num: '350+', label: 'Empresas' },
      { num: '9.600+', label: 'Referencias' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Hilados', count: '780 productos' },
      { name: 'Tejidos plano', count: '1.240 productos' },
      { name: 'Tejidos punto', count: '890 productos' },
      { name: 'Confección', count: 'Maquila · Patrón · Muestra' },
      { name: 'Estampación y tintura', count: '320 servicios' },
      { name: 'Acabados', count: 'Hidrófugos · Antimanchas · Térmicos' },
      { name: 'Hogar textil', count: '460 productos' },
      { name: 'Textil técnico', count: 'EPI · Médico · Industrial' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Marcas de moda, retailers, talleres de confección, hospitales, hoteles y fabricantes industriales. Aprovisionamiento con trazabilidad de origen y certificación.',
        tags: ['Marcas', 'Retail', 'Hostelería', 'Industrial'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Patronistas, modistas, diseñadores y técnicos textiles. Recibe encargos verificados con pago en hitos y propiedad intelectual protegida.',
        tags: ['Patronistas', 'Modistas', 'Diseñadores', 'Técnicos'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Hilanderías, tejedurías, estampadores, confecciones y proveedores de acabados con GOTS, OEKO-TEX o BCI. Catálogo con composición y origen verificable.',
        tags: ['Hilanderías', 'Tejedurías', 'Confección', 'Acabados'],
      },
    ],
    circularFlows: [
      { de: 'Marca de moda', a: 'Confección', desc: 'Producción de colección con maquila trazada por unidad.' },
      { de: 'Retailer', a: 'Tejeduría', desc: 'Compra de tela por rollo con muestreo digital previo.' },
      { de: 'Diseñador', a: 'Patronista', desc: 'Patronaje digital y muestra física con timeline compartido.' },
      { de: 'Hospital', a: 'Textil técnico', desc: 'Suministro de batas, sábanas y EPI con certificación sanitaria.' },
      { de: 'Hotel', a: 'Hogar textil', desc: 'Lencería de cama y baño con reposición programada.' },
      { de: 'Hilandería', a: 'Estampador', desc: 'Coordinación de color y acabado en cadena trazable.' },
    ],
  },
  {
    id: 'cultura',
    label: 'Cultura, ocio y deporte',
    short: 'CUL',
    description: 'Producción cultural, patrimonio, espectáculos, ocio, instalaciones y deporte.',
    heroTitle: 'La economía cultural,\nel ocio y el deporte',
    heroBody:
      'Productoras, museos, salas, organizadores de eventos, clubes y gestores de instalaciones deportivas en una sola plataforma. Contratación con pago seguro y trazabilidad de cada operación.',
    stats: [
      { num: '260+', label: 'Empresas' },
      { num: '4.100+', label: 'Servicios / eventos' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Producción audiovisual', count: 'Cine · TV · Publicidad' },
      { name: 'Música y espectáculos', count: 'Conciertos · Giras · Salas' },
      { name: 'Eventos y festivales', count: 'Cultura · Corporativo · Ferias' },
      { name: 'Museos y patrimonio', count: 'Exposición · Conservación' },
      { name: 'Artes escénicas', count: 'Teatro · Danza · Circo' },
      { name: 'Equipamiento técnico', count: 'Sonido · Iluminación · Escenario' },
      { name: 'Instalaciones deportivas', count: 'Gestión · Mantenimiento' },
      { name: 'Servicios deportivos', count: 'Clubes · Tecnificación · Eventos' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Administraciones, marcas, fundaciones, clubes y promotores de eventos. Contrata producción cultural, espectáculos y servicios deportivos con presupuesto cerrado.',
        tags: ['Administraciones', 'Marcas', 'Fundaciones', 'Clubes'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Artistas, técnicos, gestores culturales, entrenadores y deportistas. Recibe encargos verificados con pago en hitos y propiedad intelectual protegida.',
        tags: ['Artistas', 'Técnicos', 'Gestores', 'Entrenadores'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Productoras, salas, distribuidoras, empresas de equipamiento y gestoras de instalaciones. Publica tu catálogo y disponibilidad en tiempo real.',
        tags: ['Productoras', 'Salas', 'Equipamiento', 'Instalaciones'],
      },
    ],
    circularFlows: [
      { de: 'Administración', a: 'Productora cultural', desc: 'Programación de eventos y campañas con liquidación post-evento.' },
      { de: 'Promotor', a: 'Sala de espectáculos', desc: 'Reserva de aforo y caché con contrato verificable.' },
      { de: 'Marca', a: 'Productora audiovisual', desc: 'Producción de contenido con derechos y entregables trazados.' },
      { de: 'Museo', a: 'Empresa de montaje', desc: 'Montaje de exposición con seguro de obra y timeline compartido.' },
      { de: 'Club deportivo', a: 'Gestor de instalaciones', desc: 'Mantenimiento y explotación de instalaciones con SLA medido.' },
      { de: 'Festival', a: 'Proveedor técnico', desc: 'Sonido, iluminación y escenario con disponibilidad en tiempo real.' },
    ],
  },
  {
    id: 'institucional',
    label: 'Administración pública',
    short: 'ADM',
    description: 'Administración central, autonómica y local, organismos públicos, seguridad y contratación pública.',
    heroTitle: 'El sector público,\nconectado a sus proveedores',
    heroBody:
      'Administraciones, organismos públicos, seguridad y empresas adjudicatarias en una sola plataforma. Contratación pública trazable, expedientes inmutables y pago seguro.',
    stats: [
      { num: '1.400+', label: 'Entidades' },
      { num: '9.000+', label: 'Procedimientos' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Suministros', count: 'Material · Equipamiento · Consumibles' },
      { name: 'Servicios', count: 'Limpieza · Mantenimiento · Consultoría' },
      { name: 'Obras públicas', count: 'Infraestructura · Edificación' },
      { name: 'Tecnología pública', count: 'Software · Hardware · Cloud' },
      { name: 'Contratación', count: 'Licitación · Concurso · Menor' },
      { name: 'Seguridad y emergencias', count: 'Equipos · Servicios' },
      { name: 'Servicios sociales', count: 'Dependencia · Inserción' },
      { name: 'Movilidad y flota', count: 'Vehículos · Renting · Mantenimiento' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Administración central, autonómica y local, organismos y agencias públicas. Publica necesidades y contrata con trazabilidad total del expediente.',
        tags: ['Estado', 'Autonomías', 'Ayuntamientos', 'Organismos'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Técnicos de contratación, consultores del sector público, peritos y asesores. Trabajos verificados con expediente compartido trazable.',
        tags: ['Contratación', 'Consultores', 'Peritos', 'Asesores'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Empresas adjudicatarias y candidatas a licitaciones públicas. Catálogo y solvencia acreditada para concursos y contratos menores.',
        tags: ['Adjudicatarias', 'Pymes', 'Consultoras', 'UTE'],
      },
    ],
    circularFlows: [
      { de: 'Ayuntamiento', a: 'Empresa de servicios', desc: 'Contrato de limpieza o mantenimiento con seguimiento de SLA.' },
      { de: 'Organismo público', a: 'Proveedor tecnológico', desc: 'Suministro de software y hardware con licenciamiento integrado.' },
      { de: 'Administración', a: 'Constructora', desc: 'Obra pública con hitos certificados y trazabilidad completa.' },
      { de: 'Pyme adjudicataria', a: 'Plataforma de licitación', desc: 'Presentación de ofertas con solvencia acreditada.' },
      { de: 'Servicios sociales', a: 'Entidad prestadora', desc: 'Gestión de programas sociales con justificación documental.' },
      { de: 'Consultora', a: 'Organismo público', desc: 'Asistencia técnica con entregables y facturación por hito.' },
    ],
  },
  {
    id: 'educacion',
    label: 'Educación y formación',
    short: 'EDU',
    description: 'Centros educativos, formación profesional y superior, formación continua y edtech.',
    heroTitle: 'La educación y la formación,\nen una plataforma',
    heroBody:
      'Colegios, universidades, centros de FP, academias y plataformas edtech conectados con sus proveedores y profesionales. Contratación verificada y pago seguro.',
    stats: [
      { num: '680+', label: 'Centros' },
      { num: '7.500+', label: 'Programas' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Material didáctico', count: 'Libros · Manipulativos · Lab' },
      { name: 'Equipamiento de aula', count: 'Mobiliario · Pizarras · AV' },
      { name: 'Tecnología educativa', count: 'Plataformas LMS · Aulas digitales' },
      { name: 'Formación a empresas', count: 'Bonificada · In-company' },
      { name: 'Idiomas', count: 'Academias · Online · Inmersión' },
      { name: 'FP y certificaciones', count: 'Oficial · Privada · Dual' },
      { name: 'Servicios al centro', count: 'Comedor · Transporte · Extraescolar' },
      { name: 'Contenido e-learning', count: 'Cursos · SCORM · Microlearning' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Colegios, universidades, centros de FP, ayuntamientos y empresas con planes de formación. Contrata programas, material y servicios desde un solo panel.',
        tags: ['Colegios', 'Universidades', 'FP', 'Empresas'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Docentes, formadores, orientadores y diseñadores instruccionales. Recibe encargos verificados con titulación validada y pago en hitos.',
        tags: ['Docentes', 'Formadores', 'Orientadores', 'Tutores'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Editoriales, plataformas edtech, academias y proveedores de equipamiento. Publica tu catálogo y oferta formativa.',
        tags: ['Editoriales', 'Edtech', 'Academias', 'Equipamiento'],
      },
    ],
    circularFlows: [
      { de: 'Colegio', a: 'Editorial educativa', desc: 'Suministro de material didáctico con licencias digitales incluidas.' },
      { de: 'Empresa', a: 'Centro de formación', desc: 'Plan de formación bonificada con justificación ante FUNDAE.' },
      { de: 'Universidad', a: 'Plataforma LMS', desc: 'Aula virtual con integración y soporte por SLA.' },
      { de: 'Centro de FP', a: 'Empresa para prácticas', desc: 'FP dual con seguimiento del alumno trazable.' },
      { de: 'Academia', a: 'Proveedor de contenido', desc: 'Cursos y material e-learning con licenciamiento por uso.' },
      { de: 'Ayuntamiento', a: 'Empresa de extraescolares', desc: 'Actividades y servicios al centro con contrato trazable.' },
    ],
  },
  {
    id: 'medioambiente',
    label: 'Agua y medioambiente',
    short: 'AMB',
    description: 'Ciclo del agua, residuos y reciclaje, descontaminación y servicios ambientales.',
    heroTitle: 'El agua y el medioambiente,\ngestionados y trazables',
    heroBody:
      'Gestoras del ciclo del agua, plantas de residuos, recicladores y consultoras ambientales en una sola plataforma. Trazabilidad completa de cada residuo y pago seguro.',
    stats: [
      { num: '240+', label: 'Empresas' },
      { num: '3.600+', label: 'Servicios' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Tratamiento de agua', count: 'Potabilización · Depuración' },
      { name: 'Redes y saneamiento', count: 'Distribución · Alcantarillado' },
      { name: 'Gestión de residuos', count: 'Recogida · Transporte · Planta' },
      { name: 'Reciclaje y valorización', count: 'Papel · Plástico · Metal · RAEE' },
      { name: 'Residuos peligrosos', count: 'Industrial · Sanitario · ADR' },
      { name: 'Descontaminación', count: 'Suelos · Aguas · Remediación' },
      { name: 'Consultoría ambiental', count: 'Auditoría · EIA · Licencias' },
      { name: 'Economía circular', count: 'Subproductos · Simbiosis industrial' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Industria, administraciones, comunidades y empresas con obligaciones ambientales. Gestiona agua, residuos y compliance desde un único panel.',
        tags: ['Industria', 'Administraciones', 'Comunidades', 'Constructoras'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Ingenieros ambientales, auditores, técnicos de planta y consultores. Servicios verificados con seguro de responsabilidad.',
        tags: ['Ingenieros', 'Auditores', 'Técnicos', 'Consultores'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Gestoras autorizadas, plantas de tratamiento, recicladoras y empresas de servicios ambientales. Catálogo con autorizaciones acreditadas.',
        tags: ['Gestoras', 'Plantas', 'Recicladoras', 'Servicios'],
      },
    ],
    circularFlows: [
      { de: 'Industria', a: 'Gestor de residuos', desc: 'Retirada y tratamiento con trazabilidad completa del residuo.' },
      { de: 'Ayuntamiento', a: 'Gestora del agua', desc: 'Operación del ciclo integral del agua con telelectura.' },
      { de: 'Constructora', a: 'Empresa de descontaminación', desc: 'Remediación de suelos con certificado de fin de obra.' },
      { de: 'Recicladora', a: 'Industria', desc: 'Suministro de materia prima secundaria con certificado de origen.' },
      { de: 'Empresa', a: 'Consultora ambiental', desc: 'Auditoría, licencias y declaración ambiental automatizadas.' },
      { de: 'Hospital', a: 'Gestor de residuos sanitarios', desc: 'Retirada de residuos peligrosos con manifiesto digital.' },
    ],
  },
  {
    id: 'servicios-auxiliares',
    label: 'Servicios auxiliares',
    short: 'AUX',
    description: 'Limpieza, seguridad, mantenimiento, jardinería, trabajo temporal, alquiler y soporte de oficina.',
    heroTitle: 'Los servicios auxiliares,\nque sostienen cada empresa',
    heroBody:
      'Empresas de limpieza, seguridad, mantenimiento, jardinería, trabajo temporal y soporte administrativo en una sola plataforma. Contratos con SLA verificable y pago seguro.',
    stats: [
      { num: '520+', label: 'Empresas' },
      { num: '8.200+', label: 'Servicios' },
      { num: 'DPP', label: 'Cumplimiento' },
    ],
    catalogCategories: [
      { name: 'Limpieza profesional', count: 'Oficinas · Industrial · Especializada' },
      { name: 'Seguridad privada', count: 'Vigilancia · Sistemas · CRA' },
      { name: 'Mantenimiento integral', count: 'Edificios · Instalaciones · FM' },
      { name: 'Jardinería y zonas verdes', count: 'Diseño · Mantenimiento' },
      { name: 'Control de plagas', count: 'DDD · Sanidad ambiental' },
      { name: 'Trabajo temporal', count: 'ETT · Selección · Externalización' },
      { name: 'Alquiler de equipos', count: 'Maquinaria · Vehículos · Eventos' },
      { name: 'Soporte administrativo', count: 'Call center · Backoffice · BPO' },
    ],
    zonas: [
      {
        titulo: 'Compradores',
        desc: 'Empresas, comunidades, administraciones e industria que externalizan servicios. Contrata limpieza, seguridad o mantenimiento con SLA medido.',
        tags: ['Empresas', 'Comunidades', 'Administraciones', 'Industria'],
      },
      {
        titulo: 'Profesionales',
        desc: 'Personal de limpieza, vigilantes, técnicos de mantenimiento y jardineros. Recibe turnos verificados con pago garantizado.',
        tags: ['Limpieza', 'Vigilantes', 'Técnicos', 'Jardineros'],
      },
      {
        titulo: 'Proveedores',
        desc: 'Empresas de facility services, seguridad, ETT y alquiler de equipos. Publica capacidad y cobertura en tiempo real.',
        tags: ['Facility', 'Seguridad', 'ETT', 'Alquiler'],
      },
    ],
    circularFlows: [
      { de: 'Empresa', a: 'Compañía de limpieza', desc: 'Servicio recurrente con partes de trabajo y SLA medido.' },
      { de: 'Comunidad', a: 'Empresa de mantenimiento', desc: 'Mantenimiento integral del edificio con avisos trazados.' },
      { de: 'Industria', a: 'Empresa de seguridad', desc: 'Vigilancia y CRA con cobertura 24/7 verificada.' },
      { de: 'Promotor de eventos', a: 'Alquiler de equipos', desc: 'Maquinaria y mobiliario con disponibilidad en tiempo real.' },
      { de: 'Empresa', a: 'ETT', desc: 'Personal temporal con contratación y nómina integradas.' },
      { de: 'Oficina', a: 'Servicio de jardinería', desc: 'Mantenimiento de zonas verdes con calendario compartido.' },
    ],
  },
  {
    id: 'financiero',
    label: 'Financiero',
    short: 'FIN',
    description: 'Banca comercial, trade finance, inversión, seguros y servicios financieros. Sector transversal: todos los demás sectores conectan aquí para préstamos, líneas de crédito, créditos documentarios y liquidez.',
    heroTitle: 'El sector financiero,\nespina dorsal del marketplace',
    heroBody:
      'Banca comercial, trade finance, fondos de inversión, seguros y brokers. Todos los actores acceden a préstamos, líneas de crédito, créditos documentarios (LC) y financiación de proyectos, con mensajería financiera ISO 20022.',
    stats: [
      { num: 'K', label: 'Sección ISIC' },
      { num: '17º', label: 'Sector 1503' },
      { num: 'ISO 20022', label: 'Trade finance' },
    ],
    catalogCategories: [
      { name: 'Préstamos B2B', count: 'Términos · Líneas · Project finance' },
      { name: 'Crédito documentario', count: 'LC · UCP 600 digital · eUCP' },
      { name: 'Factoring & Confirming', count: 'Anticipo de facturas · Cobro a clientes' },
      { name: 'Seguros B2B', count: 'Crédito · Transporte · Caución · Responsabilidad' },
      { name: 'Inversión', count: 'Fondos · VC · Private equity · Crowdfunding' },
      { name: 'Tasación y auditoría', count: 'Activos · Estados financieros · Rating' },
      { name: 'Tesorería y divisas', count: 'Cuentas · Custodia · Cambio de divisa' },
      { name: 'Trade finance', count: 'Forfaiting · ECA · Bonos garantía' },
    ],
    zonas: [
      {
        titulo: 'Demandantes',
        desc: 'Empresas de cualquier sector solicitan préstamos, líneas, documentarios y seguros desde su escritorio. Acta de cada negociación firmada con Owner Key y registrada de forma trazable.',
        tags: ['PYMEs', 'Corporates', 'Importadores', 'Exportadores'],
      },
      {
        titulo: 'Bancos & Aseguradoras',
        desc: 'Bancos comerciales, neobancos, mutuas y aseguradoras publican sus productos. Reciben solicitudes filtradas por KYC y sector, con auditoría completa de la operación.',
        tags: ['Banca', 'Seguros', 'Mutuas', 'ECAs'],
      },
      {
        titulo: 'Inversión',
        desc: 'Fondos, VC, brokers y gestoras. Mensajería ISO 20022 compatible con SWIFT y trazabilidad completa de cada operación.',
        tags: ['Fondos', 'VC', 'Private equity', 'Gestoras'],
      },
    ],
    circularFlows: [
      { de: 'Importador (cualquier sector)', a: 'Banco emisor LC', desc: 'Crédito documentario digital (eUCP) con precinto digital del envío.' },
      { de: 'PYME', a: 'Banco comercial', desc: 'Línea de crédito solicitada desde el escritorio, acta firmada con Owner Key.' },
      { de: 'Exportador', a: 'Factor', desc: 'Anticipo de facturas con pago seguro contra cesión de crédito.' },
      { de: 'Startup tecnológica', a: 'VC / Private equity', desc: 'Ronda de inversión con due diligence completa en 1503.' },
      { de: 'Promotor inmobiliario', a: 'Fondo de inversión', desc: 'Project finance con garantías registradas y desembolso por hitos.' },
      { de: 'Exportador', a: 'ECA (Export Credit Agency)', desc: 'Seguro de crédito a exportación integrado al crédito documentario.' },
      { de: 'Empresa exportadora', a: 'Banco corresponsal', desc: 'Gestión de tesorería y divisas con custodia institucional y cumplimiento AML.' },
    ],
  },
]

export function getSector(id: string): Sector | undefined {
  return SECTORS.find((s) => s.id === id)
}

/** Pre-defined inter-sector trade flows used for animated payment particles
    on the sectors graph. Each entry = particle traveling source → DGM → target. */
export const SECTOR_FLOWS: ReadonlyArray<readonly [string, string]> = [
  ['metalurgico', 'inmobiliario'],
  ['metalurgico', 'automocion'],
  ['agroalimentario', 'transporte'],
  ['automocion', 'transporte'],
  ['energia', 'inmobiliario'],
  ['tecnologia', 'salud'],
  ['turismo', 'agroalimentario'],
  ['inmobiliario', 'energia'],
  ['transporte', 'agroalimentario'],
  ['automocion', 'metalurgico'],
  ['salud', 'tecnologia'],
  ['energia', 'automocion'],
  ['tecnologia', 'automocion'],
  ['inmobiliario', 'metalurgico'],
  ['legal', 'inmobiliario'],
  ['legal', 'tecnologia'],
  ['textil', 'turismo'],
  ['textil', 'salud'],
  ['textil', 'inmobiliario'],
  ['agroalimentario', 'medioambiente'],
  ['medioambiente', 'inmobiliario'],
  ['servicios-auxiliares', 'inmobiliario'],
  ['institucional', 'tecnologia'],
  ['educacion', 'tecnologia'],
  ['cultura', 'turismo'],
  // FINANCIERO es sector transversal: conecta a TODOS los demás como
  // proveedor de capital, seguros y trade finance. Solo se incluyen los
  // flujos más representativos para no saturar el grafo de partículas.
  ['financiero', 'inmobiliario'],
  ['financiero', 'transporte'],
  ['financiero', 'agroalimentario'],
  ['financiero', 'energia'],
  ['financiero', 'tecnologia'],
  ['financiero', 'automocion'],
  ['financiero', 'textil'],
  ['financiero', 'metalurgico'],
]
