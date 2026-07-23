// DPP · acuñación del portador de datos (data carrier) · rodaja 2 (ADR 0023)
// ---------------------------------------------------------------------------
// Dado un pasaporte (`dpp_registry`) y el GTIN de su producto enlazado
// (`products.gtin`, que tras la mig 028 vive en products), devuelve el URI que
// se imprime como QR sobre el producto:
//
//   - Si HAY GTIN → GS1 Digital Link (patrón recomendado por ESPR · prEN 18220),
//     construido con la librería pura y testeada `gs1DigitalLink.ts`, en su orden
//     canónico de cualificadores. La presencia de `serial` lo lleva a nivel de
//     ítem (obligatorio p.ej. baterías).
//   - Si NO hay GTIN (caso típico de PYME sin prefijo GS1) → URI INTERINO
//     resoluble por el resolver propio de 1503: `{resolver}/dpp/{dppUid}`, donde
//     `dppUid` es el `dpp_registry.id`. Es interino hasta que el acto de ejecución
//     del Registro UE (esperado jun-2026) defina su esquema de identificador.
//
// Decisión de resolver (ADR 0023): self-hosted bajo dominio propio `1503.com`
// (control de marca + acceso por rol/autoridad vía la vista de filtrado
// positivo). Las empresas cliente operan bajo subdominio `{empresa}.1503.com`
// (p.ej. `artikalia.1503.com`), así que el resolver de un DPP de tenant puede
// inyectarse con su subdominio. En el wiring (rodaja 3) se pasará el origen
// efectivo (NEXT_PUBLIC_SITE_URL / subdominio del tenant); el default cubre el
// DPP de la propia plataforma.
//
// Librería PURA y sin dependencias (testeable con node:test).

import { buildGs1DigitalLink } from './gs1DigitalLink'

/** Resolver self-hosted por defecto · dominio propio de la plataforma. */
export const DEFAULT_DPP_RESOLVER = 'https://1503.com'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type DppDataCarrierInput = {
  /** Identificador único del pasaporte = `dpp_registry.id` (uuid). Obligatorio. */
  dppUid: string
  /** GTIN del producto enlazado (`products.gtin`). Si existe, manda GS1 Digital Link. */
  gtin?: string | null
  /** Nº de serie (GS1 AI 21). Presente → portador a nivel de ítem. */
  serial?: string | null
  /** Lote (GS1 AI 10), opcional. */
  lot?: string | null
  /** Resolver self-hosted. Por defecto DEFAULT_DPP_RESOLVER. */
  resolver?: string
}

/**
 * Acuña el `data_carrier_uri` del pasaporte. Lanza si faltan datos para producir
 * un identificador resoluble (ni GTIN válido ni dppUid uuid).
 */
export function mintDppDataCarrier(input: DppDataCarrierInput): string {
  const resolver = (input.resolver ?? DEFAULT_DPP_RESOLVER).replace(/\/+$/, '')

  if (input.gtin) {
    // GS1 Digital Link (valida el GTIN y su dígito de control internamente).
    return buildGs1DigitalLink({
      gtin: input.gtin,
      serial: input.serial ?? undefined,
      lot: input.lot ?? undefined,
      resolver,
    })
  }

  // Sin GTIN → URI interino resoluble por el resolver propio.
  if (!UUID_RE.test(input.dppUid)) {
    throw new Error(`mintDppDataCarrier: sin GTIN, se requiere dppUid uuid válido (recibido "${input.dppUid}")`)
  }
  return `${resolver}/dpp/${input.dppUid}`
}

export type ResolvedDppRef =
  | { kind: 'gs1'; uri: string }
  | { kind: 'interim'; dppUid: string; uri: string }

/**
 * Inverso ligero: clasifica un `data_carrier_uri` ya acuñado. Útil para el
 * resolver (rodaja 3): distingue un Digital Link (lleva `/01/`) de un URI
 * interino (`/dpp/{uuid}`), y extrae el `dppUid` en este último.
 */
export function classifyDataCarrier(uri: string): ResolvedDppRef {
  let url: URL
  try {
    url = new URL(uri)
  } catch {
    throw new Error(`classifyDataCarrier: URI no válido: "${uri}"`)
  }
  const segments = url.pathname.split('/').filter(Boolean)
  if (segments.includes('01')) {
    return { kind: 'gs1', uri }
  }
  const dppIdx = segments.indexOf('dpp')
  const candidate = dppIdx >= 0 ? segments[dppIdx + 1] : undefined
  if (candidate && UUID_RE.test(candidate)) {
    return { kind: 'interim', dppUid: candidate, uri }
  }
  throw new Error(`classifyDataCarrier: no es ni Digital Link (/01/) ni interino (/dpp/{uuid}): "${uri}"`)
}
