// RFC 8785 · JSON Canonicalization Scheme (JCS)
//
// Implementación canónica de JCS para 1503. Garantiza que dos
// serializaciones del mismo objeto JSON producen el MISMO string · bit-perfect.
//
// USO PRIMARIO
// ------------
// - Hashing canónico de DPP antes de anclar en blockchain (Capa 5 ADR 0007)
// - Payload de firmas Ed25519 (G10 cadena custodia ADR 0007 §2.2)
// - Verificación firmas multi-firma 3-de-3 carga contenedor (Fase 1.7)
//
// REGLAS RFC 8785
// ---------------
// 1. Object members SORTED por code-point Unicode de las keys (ascending)
// 2. Numbers serializados según ECMA-262 7.1.12.1 (IEEE 754 · sin '+' prefix)
// 3. Strings UTF-8 con escaping mínimo (solo " · \ · controls 0x00-0x1F)
// 4. NO whitespace entre tokens
// 5. NO trailing comma
// 6. Boolean: 'true' | 'false' (lowercase)
// 7. null: 'null' (lowercase)
//
// NOTA TÉCNICA
// ------------
// JSON.stringify() de Node/V8 NO garantiza key ordering · POR ESO necesitamos
// esta implementación. Sort recursivo + serialización manual.
//
// REFERENCIAS
// -----------
// - RFC 8785: https://datatracker.ietf.org/doc/html/rfc8785
// - I-D Erik Rissanen: cyberphone/json-canonicalization (referencia)

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

/** Valores JSON válidos según RFC 8259. */
export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonArray
  | JsonObject

export type JsonArray = JsonValue[]
export type JsonObject = { [key: string]: JsonValue }

// ════════════════════════════════════════════════════════════════════════════
// CANONICALIZACIÓN
// ════════════════════════════════════════════════════════════════════════════

/**
 * Canonicaliza un valor JSON según RFC 8785.
 * Devuelve string serializado canónicamente · idempotente.
 *
 * @throws {Error} si el valor contiene tipos no JSON (undefined · function · symbol · BigInt sin conversión)
 */
export function canonicalize(value: JsonValue): string {
  return serialize(value)
}

function serialize(value: JsonValue): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return serializeNumber(value)
  if (typeof value === 'string') return serializeString(value)
  if (Array.isArray(value)) return serializeArray(value)
  if (typeof value === 'object') return serializeObject(value as JsonObject)
  throw new Error(`Tipo no serializable: ${typeof value}`)
}

/**
 * Serializa número según ECMA-262 7.1.12.1 (sin '+' prefix · sin trailing zeros).
 * NaN e Infinity NO son válidos en JSON → throw.
 */
function serializeNumber(n: number): string {
  if (!Number.isFinite(n)) {
    throw new Error(`Número no JSON: ${n} (NaN/Infinity no permitidos en RFC 8785)`)
  }
  // -0 se serializa como 0 (RFC 8785 §3.2.2.3)
  if (Object.is(n, -0)) return '0'
  // ECMA-262 default serialization es ya bastante canónica.
  // Para floats con representación múltiple · JavaScript ya produce mínima.
  return String(n)
}

/**
 * Serializa string con escaping mínimo RFC 8785:
 * - U+0000 - U+001F → \uXXXX o \b/\f/\n/\r/\t
 * - U+0022 (") → \"
 * - U+005C (\) → \\
 * - Resto → caracteres directos UTF-8
 */
function serializeString(s: string): string {
  let result = '"'
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i)
    if (ch === 0x22) result += '\\"'         // "
    else if (ch === 0x5c) result += '\\\\'   // \
    else if (ch === 0x08) result += '\\b'    // backspace
    else if (ch === 0x0c) result += '\\f'    // form feed
    else if (ch === 0x0a) result += '\\n'    // line feed
    else if (ch === 0x0d) result += '\\r'    // carriage return
    else if (ch === 0x09) result += '\\t'    // tab
    else if (ch < 0x20) {
      // Controls restantes (0x00-0x07, 0x0b, 0x0e-0x1f)
      result += '\\u' + ch.toString(16).padStart(4, '0')
    } else {
      // Resto · pasa tal cual (incluye Unicode supra-BMP)
      result += s[i]
    }
  }
  result += '"'
  return result
}

function serializeArray(arr: JsonArray): string {
  return '[' + arr.map(serialize).join(',') + ']'
}

function serializeObject(obj: JsonObject): string {
  const keys = Object.keys(obj)
    // Filter undefined values (RFC 8785 omits undefined since JSON doesn't have it)
    .filter((k) => obj[k] !== undefined)
    // Sort por code-point Unicode (lexicographic UTF-16)
    .sort((a, b) => {
      if (a < b) return -1
      if (a > b) return 1
      return 0
    })

  const parts: string[] = []
  for (const k of keys) {
    parts.push(serializeString(k) + ':' + serialize(obj[k]))
  }
  return '{' + parts.join(',') + '}'
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS para uso en código DPP/Custody chain
// ════════════════════════════════════════════════════════════════════════════

/**
 * Convierte un string canónico a Uint8Array UTF-8 (para hashing).
 */
export function canonicalToBytes(value: JsonValue): Uint8Array {
  return new TextEncoder().encode(canonicalize(value))
}

/**
 * Verifica que dos objetos JSON producen el mismo canonical hash.
 * Útil para comparaciones idempotentes en custody chain.
 */
export function canonicalEquals(a: JsonValue, b: JsonValue): boolean {
  return canonicalize(a) === canonicalize(b)
}
