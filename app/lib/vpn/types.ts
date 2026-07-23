/**
 * VPN-1 — detección de anonimización (Tor / proxy / VPN / datacenter).
 *
 * Capa 1.5 de la defensa en profundidad del geofence (ADR 0001). El país
 * solo no basta: un sancionado puede salir por una IP de la UE vía VPN.
 *
 * Ports-and-adapters: el middleware depende de la INTERFAZ
 * `VpnSignalProvider`, no de una implementación concreta. Hoy hay un
 * `LiteProvider` (gratis, sin cuenta externa). Cuando se contrate MaxMind
 * GeoIP2 Anonymous IP se añade un `MaxMindProvider` con la misma interfaz
 * y se cambia solo el factory — el middleware no se toca.
 */

export interface VpnSignals {
  /** Nodo de salida Tor confirmado (lista pública de Tor Project). */
  tor: boolean
  /** Indicios de proxy (cabeceras Via/Forwarded, cadena XFF multi-hop). */
  proxy: boolean
  /** Indicios de VPN/anonimizador. En LiteProvider es heurístico débil;
   *  cobertura real requiere el MaxMindProvider (ASN datacenter). */
  vpn: boolean
  /** IP de datacenter/hosting. LiteProvider NO lo resuelve de forma
   *  fiable (necesita base ASN); queda en false hasta MaxMindProvider. */
  datacenter: boolean
  /** Motivos legibles para auditoría (no se muestran al usuario). */
  reasons: string[]
}

export interface VpnDetectInput {
  ip: string
  headers: Headers
}

export interface VpnSignalProvider {
  /** Nombre del adapter, para logging/auditoría. */
  readonly name: string
  detect(input: VpnDetectInput): Promise<VpnSignals>
}

export const NO_SIGNALS: VpnSignals = {
  tor: false,
  proxy: false,
  vpn: false,
  datacenter: false,
  reasons: [],
}
