/**
 * Mapping ISO Alpha-2 → ISO numeric (3-digit).
 *
 * Natural Earth 50m/110m TopoJSON usan numeric IDs (ej "724" = España).
 * Nosotros operamos con Alpha-2 (ej "ES"). Este map hace el puente.
 *
 * Se va completando continente por continente conforme se valida la UX
 * del mapa proyectado en /continent/[id].
 *
 * Nota: algunos micropaíses (Mónaco, San Marino, Liechtenstein,
 * Andorra, Ciudad del Vaticano, Malta) no están en Natural Earth 110m
 * porque su área es demasiado pequeña para esa resolución. Para esos
 * países el polígono no estará disponible y se renderizará un punto
 * en su capital (lat/lon de CAPITALS).
 */
export const ISO_ALPHA2_TO_NUMERIC: Record<string, string> = {
  // ─── Europa (43) ────────────────────────────────────────────────
  ES: '724', // España
  FR: '250', // Francia
  DE: '276', // Alemania
  IT: '380', // Italia
  PT: '620', // Portugal
  NL: '528', // Países Bajos
  BE: '056', // Bélgica
  LU: '442', // Luxemburgo
  IE: '372', // Irlanda
  AT: '040', // Austria
  PL: '616', // Polonia
  CZ: '203', // República Checa
  SK: '703', // Eslovaquia
  HU: '348', // Hungría
  RO: '642', // Rumanía
  BG: '100', // Bulgaria
  GR: '300', // Grecia
  HR: '191', // Croacia
  SI: '705', // Eslovenia
  CY: '196', // Chipre — puede no estar en 110m
  MT: '470', // Malta — puede no estar en 110m
  EE: '233', // Estonia
  LV: '428', // Letonia
  LT: '440', // Lituania
  FI: '246', // Finlandia
  SE: '752', // Suecia
  DK: '208', // Dinamarca
  GB: '826', // Reino Unido
  CH: '756', // Suiza
  NO: '578', // Noruega
  IS: '352', // Islandia
  AD: '020', // Andorra — muy probablemente NO en 110m
  MC: '492', // Mónaco — muy probablemente NO en 110m
  LI: '438', // Liechtenstein — muy probablemente NO en 110m
  SM: '674', // San Marino — muy probablemente NO en 110m
  AL: '008', // Albania
  BA: '070', // Bosnia y Herzegovina
  XK: '412', // Kosovo — ID no oficial, depende del dataset
  ME: '499', // Montenegro
  MK: '807', // Macedonia del Norte
  RS: '688', // Serbia
  UA: '804', // Ucrania
  MD: '498', // Moldavia

  // ─── Asia (36) ──────────────────────────────────────────────────
  CN: '156', // China
  JP: '392', // Japón
  KR: '410', // Corea del Sur
  KP: '408', // Corea del Norte
  IN: '356', // India
  PK: '586', // Pakistán
  BD: '050', // Bangladés
  ID: '360', // Indonesia
  TH: '764', // Tailandia
  VN: '704', // Vietnam
  MY: '458', // Malasia
  PH: '608', // Filipinas
  SG: '702', // Singapur — puede no estar en 50m (ciudad-estado)
  TW: '158', // Taiwán
  HK: '344', // Hong Kong — puede no estar (territorio especial)
  MO: '446', // Macao — puede no estar (territorio especial)
  LK: '144', // Sri Lanka
  MM: '104', // Myanmar
  KH: '116', // Camboya
  LA: '418', // Laos
  MN: '496', // Mongolia
  NP: '524', // Nepal
  BT: '064', // Bután
  MV: '462', // Maldivas — pequeño, posible orphan
  BN: '096', // Brunéi
  TL: '626', // Timor Oriental
  KZ: '398', // Kazajistán
  UZ: '860', // Uzbekistán
  TM: '795', // Turkmenistán
  TJ: '762', // Tayikistán
  KG: '417', // Kirguistán
  AF: '004', // Afganistán
  AM: '051', // Armenia
  AZ: '031', // Azerbaiyán
  GE: '268', // Georgia
  RU: '643', // Rusia — solo parte asiática tras filtro MAX_DEG_FROM_CENTER

  // ─── África (53) ────────────────────────────────────────────────
  EG: '818', // Egipto
  MA: '504', // Marruecos
  DZ: '012', // Argelia
  TN: '788', // Túnez
  LY: '434', // Libia
  SD: '729', // Sudán
  SS: '728', // Sudán del Sur
  ET: '231', // Etiopía
  ER: '232', // Eritrea
  DJ: '262', // Yibuti
  SO: '706', // Somalia
  KE: '404', // Kenia
  UG: '800', // Uganda
  TZ: '834', // Tanzania
  RW: '646', // Ruanda
  BI: '108', // Burundi
  NG: '566', // Nigeria
  GH: '288', // Ghana
  CI: '384', // Costa de Marfil
  SN: '686', // Senegal
  ML: '466', // Malí
  BF: '854', // Burkina Faso
  NE: '562', // Níger
  TD: '148', // Chad
  CM: '120', // Camerún
  CF: '140', // República Centroafricana
  GA: '266', // Gabón
  CG: '178', // República del Congo
  CD: '180', // República Democrática del Congo
  AO: '024', // Angola
  ZA: '710', // Sudáfrica
  NA: '516', // Namibia
  BW: '072', // Botsuana
  ZW: '716', // Zimbabue
  ZM: '894', // Zambia
  MZ: '508', // Mozambique
  MW: '454', // Malaui
  MG: '450', // Madagascar
  MU: '480', // Mauricio — pequeño, posible orphan
  SC: '690', // Seychelles — pequeño, posible orphan
  CV: '132', // Cabo Verde — pequeño, posible orphan
  GW: '624', // Guinea-Bisáu
  GN: '324', // Guinea
  SL: '694', // Sierra Leona
  LR: '430', // Liberia
  TG: '768', // Togo
  BJ: '204', // Benín
  GQ: '226', // Guinea Ecuatorial
  ST: '678', // Santo Tomé y Príncipe — pequeño, posible orphan
  KM: '174', // Comoras — pequeño, posible orphan
  LS: '426', // Lesoto
  SZ: '748', // Esuatini
  GM: '270', // Gambia
  MR: '478', // Mauritania

  // ─── Norteamérica (3) ───────────────────────────────────────────
  US: '840', // Estados Unidos
  CA: '124', // Canadá
  MX: '484', // México

  // ─── Sudamérica (12) ────────────────────────────────────────────
  BR: '076', // Brasil
  AR: '032', // Argentina
  CL: '152', // Chile
  CO: '170', // Colombia
  PE: '604', // Perú
  VE: '862', // Venezuela
  EC: '218', // Ecuador
  BO: '068', // Bolivia
  PY: '600', // Paraguay
  UY: '858', // Uruguay
  GY: '328', // Guyana
  SR: '740', // Surinam

  // ─── Oriente Medio (15) ─────────────────────────────────────────
  TR: '792', // Turquía
  SA: '682', // Arabia Saudí
  AE: '784', // Emiratos Árabes Unidos
  IL: '376', // Israel
  QA: '634', // Catar
  KW: '414', // Kuwait
  BH: '048', // Baréin — pequeño, posible orphan
  OM: '512', // Omán
  JO: '400', // Jordania
  LB: '422', // Líbano
  SY: '760', // Siria
  IQ: '368', // Irak
  IR: '364', // Irán
  YE: '887', // Yemen
  PS: '275', // Palestina — ID puede no estar en NE50m, fallback hexagonal

  // ─── Oceanía (14) ───────────────────────────────────────────────
  AU: '036', // Australia
  NZ: '554', // Nueva Zelanda
  FJ: '242', // Fiyi
  PG: '598', // Papúa Nueva Guinea
  SB: '090', // Islas Salomón
  VU: '548', // Vanuatu
  WS: '882', // Samoa — pequeño, posible orphan
  TO: '776', // Tonga — pequeño, posible orphan
  KI: '296', // Kiribati — pequeño, posible orphan
  FM: '583', // Micronesia — pequeño, posible orphan
  MH: '584', // Islas Marshall — pequeño, posible orphan
  PW: '585', // Palaos — pequeño, posible orphan
  NR: '520', // Nauru — pequeño, posible orphan
  TV: '798', // Tuvalu — pequeño, posible orphan
}

/** Reverse lookup: numeric → Alpha-2 */
export const NUMERIC_TO_ALPHA2: Record<string, string> = Object.fromEntries(
  Object.entries(ISO_ALPHA2_TO_NUMERIC).map(([k, v]) => [v, k]),
)
