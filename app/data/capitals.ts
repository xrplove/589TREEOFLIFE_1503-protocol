/**
 * Coordenadas (lat, lon) de capitales por código ISO Alpha-2.
 *
 * Se usan para geoposicionar las banderas de cada país sobre el globo
 * en la capa 2 (/continent/[id]). Si un código no aparece aquí, su
 * país no se geoposiciona y solo se ve en la vista accesible
 * (grid hexagonal) de CountriesGraph.
 *
 * Se va completando continente por continente conforme se valida la UX.
 */
export const CAPITALS: Record<string, { lat: number; lon: number }> = {
  // ─── Europa (43) ────────────────────────────────────────────────
  ES: { lat: 40.42, lon: -3.7 }, // Madrid
  FR: { lat: 48.85, lon: 2.35 }, // París
  DE: { lat: 52.52, lon: 13.4 }, // Berlín
  IT: { lat: 41.9, lon: 12.5 }, // Roma
  PT: { lat: 38.72, lon: -9.14 }, // Lisboa
  NL: { lat: 52.37, lon: 4.9 }, // Ámsterdam
  BE: { lat: 50.85, lon: 4.35 }, // Bruselas
  LU: { lat: 49.61, lon: 6.13 }, // Luxemburgo
  IE: { lat: 53.35, lon: -6.26 }, // Dublín
  AT: { lat: 48.21, lon: 16.37 }, // Viena
  PL: { lat: 52.23, lon: 21.01 }, // Varsovia
  CZ: { lat: 50.08, lon: 14.43 }, // Praga
  SK: { lat: 48.15, lon: 17.11 }, // Bratislava
  HU: { lat: 47.5, lon: 19.04 }, // Budapest
  RO: { lat: 44.43, lon: 26.1 }, // Bucarest
  BG: { lat: 42.7, lon: 23.32 }, // Sofía
  GR: { lat: 37.98, lon: 23.73 }, // Atenas
  HR: { lat: 45.81, lon: 15.98 }, // Zagreb
  SI: { lat: 46.06, lon: 14.51 }, // Liubliana
  CY: { lat: 35.17, lon: 33.36 }, // Nicosia
  MT: { lat: 35.9, lon: 14.51 }, // La Valeta
  EE: { lat: 59.44, lon: 24.75 }, // Tallin
  LV: { lat: 56.95, lon: 24.11 }, // Riga
  LT: { lat: 54.69, lon: 25.28 }, // Vilna
  FI: { lat: 60.17, lon: 24.94 }, // Helsinki
  SE: { lat: 59.33, lon: 18.07 }, // Estocolmo
  DK: { lat: 55.68, lon: 12.57 }, // Copenhague
  GB: { lat: 51.51, lon: -0.13 }, // Londres
  CH: { lat: 46.95, lon: 7.45 }, // Berna
  NO: { lat: 59.91, lon: 10.75 }, // Oslo
  IS: { lat: 64.13, lon: -21.94 }, // Reikiavik
  AD: { lat: 42.51, lon: 1.52 }, // Andorra la Vella
  MC: { lat: 43.73, lon: 7.42 }, // Mónaco
  LI: { lat: 47.14, lon: 9.52 }, // Vaduz
  SM: { lat: 43.94, lon: 12.45 }, // San Marino
  AL: { lat: 41.33, lon: 19.82 }, // Tirana
  BA: { lat: 43.86, lon: 18.41 }, // Sarajevo
  XK: { lat: 42.66, lon: 21.16 }, // Pristina
  ME: { lat: 42.44, lon: 19.26 }, // Podgorica
  MK: { lat: 41.99, lon: 21.43 }, // Skopie
  RS: { lat: 44.79, lon: 20.45 }, // Belgrado
  UA: { lat: 50.45, lon: 30.52 }, // Kiev
  MD: { lat: 47.01, lon: 28.86 }, // Chisináu

  // ─── Asia (36) ──────────────────────────────────────────────────
  CN: { lat: 39.9, lon: 116.4 }, // Pekín
  JP: { lat: 35.68, lon: 139.69 }, // Tokio
  KR: { lat: 37.57, lon: 126.98 }, // Seúl
  KP: { lat: 39.04, lon: 125.76 }, // Pyongyang
  IN: { lat: 28.6, lon: 77.21 }, // Nueva Delhi
  PK: { lat: 33.69, lon: 73.06 }, // Islamabad
  BD: { lat: 23.81, lon: 90.41 }, // Daca
  ID: { lat: -6.21, lon: 106.85 }, // Yakarta
  TH: { lat: 13.76, lon: 100.5 }, // Bangkok
  VN: { lat: 21.03, lon: 105.85 }, // Hanói
  MY: { lat: 3.14, lon: 101.69 }, // Kuala Lumpur
  PH: { lat: 14.6, lon: 120.98 }, // Manila
  SG: { lat: 1.35, lon: 103.82 }, // Singapur
  TW: { lat: 25.03, lon: 121.57 }, // Taipéi
  HK: { lat: 22.32, lon: 114.17 }, // Hong Kong
  MO: { lat: 22.2, lon: 113.55 }, // Macao
  LK: { lat: 6.92, lon: 79.86 }, // Sri Jayawardenapura/Colombo
  MM: { lat: 19.76, lon: 96.08 }, // Naipyidó
  KH: { lat: 11.56, lon: 104.92 }, // Phnom Penh
  LA: { lat: 17.97, lon: 102.6 }, // Vientián
  MN: { lat: 47.92, lon: 106.92 }, // Ulán Bator
  NP: { lat: 27.72, lon: 85.32 }, // Katmandú
  BT: { lat: 27.47, lon: 89.64 }, // Timbu
  MV: { lat: 4.18, lon: 73.51 }, // Malé
  BN: { lat: 4.94, lon: 114.95 }, // Bandar Seri Begawan
  TL: { lat: -8.56, lon: 125.56 }, // Dili
  KZ: { lat: 51.17, lon: 71.45 }, // Astaná
  UZ: { lat: 41.31, lon: 69.28 }, // Taskent
  TM: { lat: 37.95, lon: 58.38 }, // Asjabad
  TJ: { lat: 38.56, lon: 68.79 }, // Dusambé
  KG: { lat: 42.87, lon: 74.61 }, // Biskek
  AF: { lat: 34.55, lon: 69.21 }, // Kabul
  AM: { lat: 40.18, lon: 44.51 }, // Ereván
  AZ: { lat: 40.41, lon: 49.87 }, // Bakú
  GE: { lat: 41.72, lon: 44.79 }, // Tiflis
  RU: { lat: 55.75, lon: 37.62 }, // Moscú (referencia; el polígono asiático se centra en Siberia)

  // ─── África (53) ────────────────────────────────────────────────
  EG: { lat: 30.05, lon: 31.25 }, // El Cairo
  MA: { lat: 34.02, lon: -6.84 }, // Rabat
  DZ: { lat: 36.75, lon: 3.06 }, // Argel
  TN: { lat: 36.81, lon: 10.18 }, // Túnez
  LY: { lat: 32.89, lon: 13.19 }, // Trípoli
  SD: { lat: 15.5, lon: 32.56 }, // Jartum
  SS: { lat: 4.86, lon: 31.57 }, // Yuba
  ET: { lat: 9.03, lon: 38.74 }, // Adís Abeba
  ER: { lat: 15.33, lon: 38.93 }, // Asmara
  DJ: { lat: 11.59, lon: 43.15 }, // Yibuti
  SO: { lat: 2.05, lon: 45.32 }, // Mogadiscio
  KE: { lat: -1.29, lon: 36.82 }, // Nairobi
  UG: { lat: 0.35, lon: 32.58 }, // Kampala
  TZ: { lat: -6.16, lon: 35.75 }, // Dodoma
  RW: { lat: -1.95, lon: 30.06 }, // Kigali
  BI: { lat: -3.43, lon: 29.93 }, // Gitega (capital desde 2019)
  NG: { lat: 9.08, lon: 7.49 }, // Abuya
  GH: { lat: 5.6, lon: -0.19 }, // Acra
  CI: { lat: 6.83, lon: -5.27 }, // Yamusukro
  SN: { lat: 14.69, lon: -17.45 }, // Dakar
  ML: { lat: 12.65, lon: -8.0 }, // Bamako
  BF: { lat: 12.37, lon: -1.52 }, // Uagadugú
  NE: { lat: 13.51, lon: 2.11 }, // Niamey
  TD: { lat: 12.13, lon: 15.05 }, // Yamena
  CM: { lat: 3.87, lon: 11.52 }, // Yaundé
  CF: { lat: 4.39, lon: 18.55 }, // Bangui
  GA: { lat: 0.42, lon: 9.45 }, // Libreville
  CG: { lat: -4.27, lon: 15.27 }, // Brazzaville
  CD: { lat: -4.32, lon: 15.31 }, // Kinshasa
  AO: { lat: -8.84, lon: 13.23 }, // Luanda
  ZA: { lat: -25.75, lon: 28.19 }, // Pretoria (ejecutiva)
  NA: { lat: -22.56, lon: 17.08 }, // Windhoek
  BW: { lat: -24.66, lon: 25.91 }, // Gaborone
  ZW: { lat: -17.83, lon: 31.05 }, // Harare
  ZM: { lat: -15.41, lon: 28.29 }, // Lusaka
  MZ: { lat: -25.97, lon: 32.58 }, // Maputo
  MW: { lat: -13.96, lon: 33.78 }, // Lilongüe
  MG: { lat: -18.88, lon: 47.5 }, // Antananarivo
  MU: { lat: -20.16, lon: 57.5 }, // Port Louis
  SC: { lat: -4.62, lon: 55.45 }, // Victoria
  CV: { lat: 14.93, lon: -23.51 }, // Praia
  GW: { lat: 11.86, lon: -15.59 }, // Bisáu
  GN: { lat: 9.51, lon: -13.71 }, // Conakry
  SL: { lat: 8.46, lon: -13.23 }, // Freetown
  LR: { lat: 6.31, lon: -10.8 }, // Monrovia
  TG: { lat: 6.13, lon: 1.22 }, // Lomé
  BJ: { lat: 6.5, lon: 2.62 }, // Porto-Novo
  GQ: { lat: 3.75, lon: 8.78 }, // Malabo
  ST: { lat: 0.34, lon: 6.73 }, // Santo Tomé
  KM: { lat: -11.69, lon: 43.26 }, // Moroni
  LS: { lat: -29.31, lon: 27.48 }, // Maseru
  SZ: { lat: -26.32, lon: 31.13 }, // Mbabane
  GM: { lat: 13.45, lon: -16.58 }, // Banjul
  MR: { lat: 18.08, lon: -15.97 }, // Nuakchot

  // ─── Norteamérica (3) ───────────────────────────────────────────
  US: { lat: 38.91, lon: -77.04 }, // Washington D.C.
  CA: { lat: 45.42, lon: -75.7 }, // Ottawa
  MX: { lat: 19.43, lon: -99.13 }, // Ciudad de México

  // ─── Sudamérica (12) ────────────────────────────────────────────
  BR: { lat: -15.79, lon: -47.88 }, // Brasilia
  AR: { lat: -34.61, lon: -58.38 }, // Buenos Aires
  CL: { lat: -33.45, lon: -70.67 }, // Santiago
  CO: { lat: 4.71, lon: -74.07 }, // Bogotá
  PE: { lat: -12.05, lon: -77.04 }, // Lima
  VE: { lat: 10.49, lon: -66.88 }, // Caracas
  EC: { lat: -0.18, lon: -78.47 }, // Quito
  BO: { lat: -16.49, lon: -68.15 }, // La Paz (sede del gobierno)
  PY: { lat: -25.26, lon: -57.58 }, // Asunción
  UY: { lat: -34.9, lon: -56.16 }, // Montevideo
  GY: { lat: 6.8, lon: -58.16 }, // Georgetown
  SR: { lat: 5.85, lon: -55.2 }, // Paramaribo

  // ─── Oriente Medio (15) ─────────────────────────────────────────
  TR: { lat: 39.93, lon: 32.86 }, // Ankara
  SA: { lat: 24.71, lon: 46.68 }, // Riad
  AE: { lat: 24.45, lon: 54.4 }, // Abu Dabi
  IL: { lat: 31.78, lon: 35.21 }, // Jerusalén
  QA: { lat: 25.29, lon: 51.53 }, // Doha
  KW: { lat: 29.38, lon: 47.99 }, // Kuwait
  BH: { lat: 26.23, lon: 50.59 }, // Manama
  OM: { lat: 23.59, lon: 58.41 }, // Mascate
  JO: { lat: 31.95, lon: 35.93 }, // Amán
  LB: { lat: 33.89, lon: 35.5 }, // Beirut
  SY: { lat: 33.51, lon: 36.29 }, // Damasco
  IQ: { lat: 33.32, lon: 44.43 }, // Bagdad
  IR: { lat: 35.69, lon: 51.39 }, // Teherán
  YE: { lat: 15.37, lon: 44.21 }, // Saná
  PS: { lat: 31.9, lon: 35.2 }, // Ramallah

  // ─── Oceanía (14) ───────────────────────────────────────────────
  AU: { lat: -35.28, lon: 149.13 }, // Canberra
  NZ: { lat: -41.29, lon: 174.78 }, // Wellington
  FJ: { lat: -18.14, lon: 178.44 }, // Suva
  PG: { lat: -9.44, lon: 147.18 }, // Port Moresby
  SB: { lat: -9.43, lon: 159.96 }, // Honiara
  VU: { lat: -17.73, lon: 168.31 }, // Port Vila
  WS: { lat: -13.83, lon: -171.77 }, // Apia
  TO: { lat: -21.13, lon: -175.2 }, // Nukualofa
  KI: { lat: 1.45, lon: 173.04 }, // Tarawa Sur
  FM: { lat: 6.92, lon: 158.16 }, // Palikir
  MH: { lat: 7.11, lon: 171.18 }, // Majuro
  PW: { lat: 7.5, lon: 134.62 }, // Ngerulmud
  NR: { lat: -0.55, lon: 166.92 }, // Yaren
  TV: { lat: -8.52, lon: 179.2 }, // Funafuti
}
