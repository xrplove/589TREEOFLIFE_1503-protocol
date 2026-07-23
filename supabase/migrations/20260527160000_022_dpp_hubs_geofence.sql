-- Migration: 022_dpp_hubs_geofence
-- Created: 2026-05-27
-- Purpose: DPP Modulo 2 - sub-pieza para validacion geofence hub-level.
--
-- CONTENIDO
-- ---------
--   1. Tabla dpp_hubs (catalogo de hubs logisticos con coordenadas + radio geofence)
--   2. Funcion haversine_distance_m (calculo de distancia geografica en metros)
--   3. Funcion is_point_in_hub_geofence (valida si GPS esta dentro del radio del hub)
--   4. Pre-carga hubs principales (cluster Valencia + 15 puertos/aeropuertos relevantes)
--
-- USO
-- ---
-- La Edge Function dpp-validator (Modulo 2 pieza 3) llamara a
-- is_point_in_hub_geofence(un_locode, lat, lng) antes de insertar un evento
-- en dpp_tracking_events. Si el GPS del dispositivo NO esta dentro del radio
-- declarado del hub UN/LOCODE, el evento se rechaza.
--
-- POR QUE HAVERSINE Y NO POSTGIS
-- ------------------------------
-- PostGIS daria mas precision pero requiere habilitar extension (no esta
-- en migraciones previas) + un tipo geography(POINT,4326). Para MVP +
-- precision suficiente (~0.5% error en distancias < 1000 km) Haversine
-- nativo con lat/lng numeric es suficiente. Si en Fase 8+ necesitamos
-- queries espaciales mas complejas (ST_DWithin sobre miles de hubs)
-- migramos a PostGIS.
--
-- BASE LEGAL
-- ----------
--   - Reg. UE 2017/625 (controles oficiales en puntos de entrada UE)
--   - Reg. UE 2024/1781 ESPR Art. 9 (trazabilidad geolocalizada)
--   - Convenio CMR 1956 + Reglas Hamburgo 1978 (hubs declarados en B/L y CMR)
--
-- COMO APLICAR
-- ------------
--   1. https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/sql/new
--   2. Borrar editor (Ctrl+A, Delete)
--   3. Pegar contenido entero
--   4. Run (Ctrl + Enter)
--   5. Esperar "Success. No rows returned."
--   6. Verificar pre-carga: select count(*) from public.dpp_hubs; (debe devolver 15+)

-- ============================================================
-- 1. ENUM tipo de hub logistico
-- ============================================================
do $body$
begin
  if not exists (select 1 from pg_type where typname = 'dpp_hub_type') then
    create type public.dpp_hub_type as enum (
      'puerto_maritimo',
      'aeropuerto_carga',
      'terminal_ferroviaria',
      'terminal_carretera',
      'almacen_aduanero',
      'planta_fabricante',
      'centro_distribucion',
      'cliente_directo',
      'punto_inspeccion_fronterizo_pif'
    );
  end if;
end $body$;

-- ============================================================
-- 2. Tabla dpp_hubs
-- ============================================================
create table if not exists public.dpp_hubs (
  id                      uuid primary key default gen_random_uuid(),
  un_locode               text not null unique check (un_locode ~ '^[A-Z]{2}[A-Z2-9]{3}$'),
  name                    text not null,
  country                 text not null check (country ~ '^[A-Z]{2}$'),
  region                  text,
  city                    text not null,
  hub_type                public.dpp_hub_type not null,
  coordinates_lat         numeric(9,6) not null check (coordinates_lat >= -90 and coordinates_lat <= 90),
  coordinates_lng         numeric(9,6) not null check (coordinates_lng >= -180 and coordinates_lng <= 180),
  geofence_radius_m       integer not null default 5000 check (geofence_radius_m > 0 and geofence_radius_m <= 50000),
  timezone                text,
  iso_code_extra          text,
  is_active               boolean not null default true,
  notes                   text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists dpp_hubs_country_idx on public.dpp_hubs (country);
create index if not exists dpp_hubs_hub_type_idx on public.dpp_hubs (hub_type);
create index if not exists dpp_hubs_active_idx on public.dpp_hubs (is_active) where is_active = true;

-- Trigger touch updated_at.
create or replace function public.touch_dpp_hubs_updated_at()
returns trigger
language plpgsql
as $body$
begin
  new.updated_at := now();
  return new;
end;
$body$;

drop trigger if exists dpp_hubs_touch_updated_at on public.dpp_hubs;
create trigger dpp_hubs_touch_updated_at
  before update on public.dpp_hubs
  for each row execute function public.touch_dpp_hubs_updated_at();

-- RLS: dpp_hubs es informacion publica de hubs logisticos. SELECT abierto
-- a autenticados. INSERT/UPDATE/DELETE solo via service_role.
alter table public.dpp_hubs enable row level security;

drop policy if exists "dpp_hubs_select_public" on public.dpp_hubs;
create policy "dpp_hubs_select_public" on public.dpp_hubs
  for select using (true);

-- ============================================================
-- 3. Funcion Haversine - distancia geografica en metros
-- ============================================================
-- Formula Haversine para calcular distancia great-circle entre dos puntos
-- en la superficie terrestre. Radio medio Tierra = 6.371.000 m.
-- Error tipico < 0.5% para distancias menores a 1000 km.
create or replace function public.haversine_distance_m(
  lat1 numeric,
  lng1 numeric,
  lat2 numeric,
  lng2 numeric
)
returns numeric
language sql
immutable
parallel safe
as $body$
  select 2 * 6371000 * asin(
    sqrt(
      power(sin(radians(lat2 - lat1) / 2), 2) +
      cos(radians(lat1)) * cos(radians(lat2)) *
      power(sin(radians(lng2 - lng1) / 2), 2)
    )
  );
$body$;

comment on function public.haversine_distance_m(numeric, numeric, numeric, numeric) is
  'DPP Modulo 2 - Distancia great-circle entre dos puntos GPS (WGS84) en metros usando formula Haversine.';

-- ============================================================
-- 4. Funcion is_point_in_hub_geofence
-- ============================================================
-- Devuelve true si el punto GPS dado esta dentro del radio geofence
-- declarado del hub UN/LOCODE. Si el hub no existe o no esta activo,
-- devuelve false (no hay validacion contra hub desconocido).
create or replace function public.is_point_in_hub_geofence(
  p_un_locode text,
  p_lat numeric,
  p_lng numeric
)
returns boolean
language sql
stable
parallel safe
as $body$
  select coalesce(
    (
      select public.haversine_distance_m(h.coordinates_lat, h.coordinates_lng, p_lat, p_lng) <= h.geofence_radius_m
      from public.dpp_hubs h
      where h.un_locode = p_un_locode
        and h.is_active = true
      limit 1
    ),
    false
  );
$body$;

comment on function public.is_point_in_hub_geofence(text, numeric, numeric) is
  'DPP Modulo 2 - Valida si un punto GPS esta dentro del radio geofence del hub UN/LOCODE.';

grant execute on function public.haversine_distance_m(numeric, numeric, numeric, numeric) to authenticated, service_role;
grant execute on function public.is_point_in_hub_geofence(text, numeric, numeric) to authenticated, service_role;

-- ============================================================
-- 5. Pre-carga de hubs principales (cluster Valencia + UE + global)
-- ============================================================
-- Coordenadas extraidas de fuentes publicas oficiales (sea-distances.org,
-- searates.com, World Port Source, UN/LOCODE database CEFACT).
-- Radio geofence por defecto 5 km (suficiente para incluir el recinto
-- portuario o aeroportuario completo).
insert into public.dpp_hubs (un_locode, name, country, city, hub_type, coordinates_lat, coordinates_lng, geofence_radius_m, timezone, notes) values
  -- ESPAÑA - PUERTOS PRINCIPALES
  ('ESVLC', 'Puerto de Valencia',           'ES', 'Valencia',     'puerto_maritimo', 39.444800, -0.323600, 6000, 'Europe/Madrid', 'APV - primera del cluster 1503'),
  ('ESBCN', 'Puerto de Barcelona',          'ES', 'Barcelona',    'puerto_maritimo', 41.342500,  2.165400, 6000, 'Europe/Madrid', 'APB'),
  ('ESALG', 'Puerto de Algeciras',          'ES', 'Algeciras',    'puerto_maritimo', 36.140100, -5.428900, 6000, 'Europe/Madrid', 'APBA - mayor TEU Espana'),
  ('ESBIO', 'Puerto de Bilbao',             'ES', 'Bilbao',       'puerto_maritimo', 43.357500, -3.046800, 5000, 'Europe/Madrid', 'APV Bilbao'),
  ('ESLPA', 'Puerto de Las Palmas',         'ES', 'Las Palmas',   'puerto_maritimo', 28.143600, -15.412400, 5000, 'Atlantic/Canary', 'Conexion Canarias-Africa-LATAM'),
  ('ESCAR', 'Puerto de Cartagena',          'ES', 'Cartagena',    'puerto_maritimo', 37.598300, -0.973100, 4000, 'Europe/Madrid', 'Granel + crudo'),
  ('ESVGO', 'Puerto de Vigo',               'ES', 'Vigo',         'puerto_maritimo', 42.235500, -8.726700, 4000, 'Europe/Madrid', 'Pesca + ro-ro'),

  -- ESPAÑA - AEROPUERTOS DE CARGA
  ('ESMAD', 'Aeropuerto Madrid-Barajas',    'ES', 'Madrid',       'aeropuerto_carga', 40.471900, -3.560400, 5000, 'Europe/Madrid', 'Mayor carga aerea ES'),

  -- UE - PUERTOS PRINCIPALES
  ('NLRTM', 'Puerto de Rotterdam',          'NL', 'Rotterdam',    'puerto_maritimo', 51.917700,  4.466100, 10000, 'Europe/Amsterdam', 'Mayor puerto Europa'),
  ('DEHAM', 'Puerto de Hamburgo',           'DE', 'Hamburg',      'puerto_maritimo', 53.541500,  9.971000, 8000, 'Europe/Berlin', 'Trade hub Centro Europa'),
  ('BEANR', 'Puerto de Amberes',            'BE', 'Antwerp',      'puerto_maritimo', 51.221300,  4.401800, 8000, 'Europe/Brussels', 'Antwerp-Bruges'),
  ('FRLEH', 'Puerto de Le Havre',           'FR', 'Le Havre',     'puerto_maritimo', 49.485000,  0.106500, 5000, 'Europe/Paris', 'Acceso Sena'),
  ('ITGOA', 'Puerto de Genova',             'IT', 'Genoa',        'puerto_maritimo', 44.405100,  8.927000, 5000, 'Europe/Rome', 'Mediterraneo IT'),

  -- ASIA - PUERTOS PRINCIPALES (origenes import)
  ('CNSHA', 'Puerto de Shanghai',           'CN', 'Shanghai',     'puerto_maritimo', 30.626400, 121.831800, 15000, 'Asia/Shanghai', 'Mayor puerto del mundo TEU'),
  ('CNNGB', 'Puerto de Ningbo-Zhoushan',    'CN', 'Ningbo',       'puerto_maritimo', 29.870000, 121.553800, 12000, 'Asia/Shanghai', 'Segundo mundial TEU'),
  ('SGSIN', 'Puerto de Singapur',           'SG', 'Singapore',    'puerto_maritimo',  1.265000, 103.829500, 12000, 'Asia/Singapore', 'Hub transbordo asiatico'),
  ('HKHKG', 'Puerto de Hong Kong',          'HK', 'Hong Kong',    'puerto_maritimo', 22.319700, 114.169400, 8000, 'Asia/Hong_Kong', 'Hub Greater Bay Area'),
  ('AEDXB', 'Puerto Jebel Ali',             'AE', 'Dubai',        'puerto_maritimo', 25.014000, 55.061500, 10000, 'Asia/Dubai', 'Hub Oriente Medio'),

  -- AMERICA - PUERTOS PRINCIPALES
  ('USNYC', 'Puerto Nueva York-Nueva Jersey','US', 'New York',     'puerto_maritimo', 40.667300, -74.171400, 10000, 'America/New_York', 'East Coast US'),
  ('USLAX', 'Puerto Los Angeles',           'US', 'Los Angeles',  'puerto_maritimo', 33.737900, -118.262200, 8000, 'America/Los_Angeles', 'West Coast US')
on conflict (un_locode) do nothing;

-- ============================================================
-- 6. Comentarios auto-documentacion
-- ============================================================
comment on table public.dpp_hubs is
  'DPP Modulo 2 - Catalogo de hubs logisticos (puertos, aeropuertos, terminales) con coordenadas + radio geofence para validacion del Edge Function dpp-validator.';

comment on type public.dpp_hub_type is
  'DPP Modulo 2 - Tipos de hub logistico en el catalogo dpp_hubs.';
