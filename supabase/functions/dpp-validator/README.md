# Edge Function · dpp-validator

DPP Módulo 2 pieza 3 · validador de eventos logísticos del Pasaporte Digital de Productos (Reg. UE 2024/1781 ESPR).

## Flujo de validación

1. POST + Authorization Bearer JWT
2. Body JSON con shape esperada
3. JWT válido · extrae `verifier_user_id` + `app_metadata.roles`
4. `verifier_role` declarado debe estar en `app_metadata.roles` del JWT
5. DPP existe en `dpp_registry`
6. Verificador es owner|manufacturer O tiene delegación activa en `dpp_delegations`
7. Si hay delegación: scope (event_type · un_locode · verifier_role) cumple los `allowed_*` arrays
8. GPS dentro del radio geofence del hub UN/LOCODE (función Postgres `is_point_in_hub_geofence`)
9. MaxMind GeoIP cross-check IP→país (opcional · si env vars MAXMIND_* configuradas)
10. Calcular `event_hash_sha256` canónico determinista (RFC 8785 JCS)
11. INSERT en `dpp_tracking_events` con `service_role`
12. Devolver `event_id` + `event_hash_sha256`

## Endpoint

```
POST https://<project-ref>.supabase.co/functions/v1/dpp-validator
```

## Headers

```
Authorization: Bearer <user-jwt>
Content-Type: application/json
```

## Body schema

```json
{
  "dpp_id": "uuid",
  "event_type": "entrada_puerto_destino",
  "event_at": "2026-05-27T15:30:00Z",
  "verifier_role": "autoridad_portuaria_valencia",
  "location_country": "ES",
  "location_un_locode": "ESVLC",
  "location_lat": 39.4448,
  "location_lng": -0.3236,
  "location_accuracy_m": 12.5,
  "event_payload": { "muelle": "Príncipe Felipe" }
}
```

| Campo | Tipo | Requerido | Detalle |
|---|---|---|---|
| `dpp_id` | uuid | sí | FK a `dpp_registry.id` |
| `event_type` | enum | sí | Catálogo cerrado · 22 valores |
| `event_at` | ISO 8601 | no | Default: ahora |
| `verifier_role` | text | sí | Debe estar en JWT `app_metadata.roles` |
| `location_country` | ISO 3166-1 alpha-2 | sí | |
| `location_un_locode` | UN/LOCODE | sí | Debe existir en `dpp_hubs` |
| `location_lat` | number | sí | -90 a 90 |
| `location_lng` | number | sí | -180 a 180 |
| `location_accuracy_m` | number | no | Precisión GPS en metros |
| `event_payload` | object | no | Datos específicos del evento |

## Response

### 200 OK
```json
{
  "ok": true,
  "event_id": "uuid",
  "event_hash_sha256": "64-char hex",
  "anchored_pending": true,
  "maxmind_warning": null
}
```

### 4xx (validación)
```json
{
  "ok": false,
  "error": "human-readable description",
  "code": "machine-readable code"
}
```

Códigos de error posibles:
- `method_not_allowed` (405)
- `unauthorized` (401) · JWT inválido o ausente
- `invalid_json` · `invalid_request` (400)
- `missing_role` (403) · `verifier_role` no en JWT
- `dpp_not_found_or_unauthorized` (404) · 404 opaco
- `missing_delegation` · `delegation_expired` · `*_out_of_scope` (403)
- `geofence_error` (500) · `gps_out_of_geofence` (403)
- `dpp_lookup_failed` · `delegation_lookup_failed` · `insert_failed` (500)
- `server_misconfig` (500) · env vars Supabase ausentes

## Env vars

### Auto-inyectadas por Supabase Edge Runtime
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Opcionales (Pieza 4 · MaxMind GeoLite2 web service)
- `MAXMIND_ACCOUNT_ID` · registro free en https://www.maxmind.com/en/geolite2/signup
- `MAXMIND_LICENSE_KEY` · generada en cuenta MaxMind

Sin estas dos env vars, el cross-check IP→país se salta (solo se persiste `device_ip` para forense posterior). La función sigue funcionando completamente.

## Deploy

### Opción A · Supabase Dashboard (sin CLI · recomendado para MVP)

1. Abrir `https://supabase.com/dashboard/project/sqsjmmybzokcwurgruaw/functions`
2. Click `Deploy a new function`
3. Name: `dpp-validator`
4. Verify JWT: **NO** (esta función valida JWT internamente con granularidad sobre claims)
5. Pegar el contenido completo de `index.ts`
6. Deploy

### Opción B · Supabase CLI (para futuro CI/CD)

```bash
supabase functions deploy dpp-validator --no-verify-jwt
```

## Smoke test

Tras deploy, con un usuario que tenga `transportista` en `actor_roles` y una delegación activa en `dpp_delegations`:

```bash
curl -X POST 'https://sqsjmmybzokcwurgruaw.supabase.co/functions/v1/dpp-validator' \
  -H "Authorization: Bearer ${USER_JWT}" \
  -H "Content-Type: application/json" \
  -d '{
    "dpp_id": "00000000-0000-0000-0000-000000000000",
    "event_type": "entrada_puerto_destino",
    "verifier_role": "transportista",
    "location_country": "ES",
    "location_un_locode": "ESVLC",
    "location_lat": 39.4448,
    "location_lng": -0.3236
  }'
```

## Dependencias

- `https://deno.land/std@0.224.0/http/server.ts` · servidor HTTP Deno estándar
- `https://esm.sh/@supabase/supabase-js@2.45.0` · cliente Supabase

Sin paquetes propietarios · sin node_modules. Cold start típico < 200 ms.

## Roadmap

- **Módulo 3**: ancla `event_hash_sha256` en XDC Network · escribe `onchain_tx_hash` + `onchain_anchored_at`
- **Módulo 4**: UI Workspace consume `get_dpp_timeline()` + generador QR · genera PUI GS1 Digital Link
