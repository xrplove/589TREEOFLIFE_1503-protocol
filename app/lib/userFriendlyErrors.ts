// Traductor de errores técnicos a mensajes user-friendly multilingüe.
//
// Fase 1.8 · UX bloqueo claro + IA Claude guía documentos faltantes.
//
// PROBLEMA RESUELTO
// -----------------
// Los Zod refines + CHECK constraints SQL devuelven mensajes técnicos:
//   "EUDR Art. 9.1.d: si in_eudr_scope=true, dds_reference y origin_geolocation
//    son obligatorios"
//
// Esto es CORRECTO técnicamente pero INSERVIBLE para usuario no-técnico.
//
// SOLUCIÓN
// --------
// Capa de traducción que mapea cada técnica → mensaje user-friendly
// multilingüe + acción concreta + link a documentación pública.
//
// FILOSOFÍA Audit-Ready by Design
// -------------------------------
// Mantenemos los mensajes técnicos en backend (auditables) Y los traducimos
// en frontend para usuario · sin perder rigor normativo.

import type { LocalizedLabel, Lang } from '@/app/data/actorGroups'

// ════════════════════════════════════════════════════════════════════════════
// TIPOS
// ════════════════════════════════════════════════════════════════════════════

export interface UserFriendlyError {
  /** Código técnico canónico (para logs + audit trail). */
  technical_code: string

  /** Mensaje user-friendly multilingüe. */
  message: LocalizedLabel

  /** Sugerencia de acción concreta. */
  action_suggestion: LocalizedLabel

  /** URL a documentación pública con guía. */
  help_url?: string

  /** Severity para UI styling. */
  severity: 'info' | 'warning' | 'error' | 'critical'

  /** Categoría para agrupar errores. */
  category: 'missing_document' | 'expired_document' | 'invalid_data' | 'unauthorized' | 'system'
}

// ════════════════════════════════════════════════════════════════════════════
// CATÁLOGO DE ERRORES CANÓNICOS
// ════════════════════════════════════════════════════════════════════════════

export const USER_FRIENDLY_ERRORS: Record<string, UserFriendlyError> = {
  // ──────────────────────────────────────────────────────────────────────
  // DPP · validación schema
  // ──────────────────────────────────────────────────────────────────────
  'EUDR_COMPLETENESS_MISSING': {
    technical_code: 'EUDR Art. 9.1.d · in_eudr_scope=true requires dds_reference + origin_geolocation',
    message: {
      es: 'Tu producto está en alcance EUDR (anti-deforestación) pero faltan datos obligatorios.',
      en: 'Your product is in EUDR scope (anti-deforestation) but mandatory data is missing.',
      fr: 'Votre produit est dans le champ EUDR mais des données obligatoires manquent.',
      de: 'Ihr Produkt fällt unter EUDR · pflichtdaten fehlen.',
      it: 'Il tuo prodotto rientra nell\'EUDR · mancano dati obbligatori.',
      pt: 'O seu produto está no âmbito EUDR · dados obrigatórios em falta.',
      zh: '您的产品在EUDR范围内 · 缺少必填数据。',
      ja: '製品はEUDR範囲内 · 必須データが不足。',
    },
    action_suggestion: {
      es: 'Necesitas: 1) Registrar tu DDS en TRACES NT EUDR. 2) Añadir coordenadas GPS exactas de la parcela de origen (Point para parcelas <4ha o Polygon para mayores).',
      en: 'You need: 1) Register your DDS in TRACES NT EUDR. 2) Add exact GPS coordinates of origin plot (Point for plots <4ha or Polygon for larger).',
      fr: 'Vous devez: 1) Enregistrer votre DDS dans TRACES NT EUDR. 2) Ajouter coordonnées GPS exactes (Point <4ha ou Polygon).',
      de: 'Sie benötigen: 1) DDS in TRACES NT EUDR registrieren. 2) Exakte GPS-Koordinaten (Point <4ha oder Polygon).',
      it: 'Devi: 1) Registrare DDS in TRACES NT EUDR. 2) Aggiungere coordinate GPS esatte (Point <4ha o Polygon).',
      pt: 'Precisa: 1) Registar DDS em TRACES NT EUDR. 2) Adicionar coordenadas GPS exatas (Point <4ha ou Polygon).',
      zh: '您需要：1) 在TRACES NT EUDR中注册DDS。2) 添加原产地块的精确GPS坐标。',
      ja: '必要：1) TRACES NT EUDRでDDSを登録。2) 起源区画の正確なGPS座標を追加。',
    },
    help_url: 'https://webgate.ec.europa.eu/tracesnt',
    severity: 'error',
    category: 'missing_document',
  },

  'CRA_COMPLETENESS_MISSING': {
    technical_code: 'CRA Art. 13 · has_digital_elements=true requires SBOM + vuln disclosure + CE marking + support_until',
    message: {
      es: 'Tu producto tiene elementos digitales · faltan datos de ciberseguridad obligatorios CRA.',
      en: 'Your product has digital elements · mandatory CRA cybersecurity data is missing.',
      fr: 'Votre produit a des éléments numériques · données cybersécurité CRA manquantes.',
      de: 'Ihr Produkt hat digitale Elemente · CRA-Cybersicherheitsdaten fehlen.',
      it: 'Il tuo prodotto ha elementi digitali · dati cybersecurity CRA mancanti.',
      pt: 'O seu produto tem elementos digitais · dados cibersegurança CRA em falta.',
      zh: '您的产品包含数字元素 · 缺少CRA网络安全必填数据。',
      ja: '製品にデジタル要素 · CRAサイバーセキュリティ必須データ不足。',
    },
    action_suggestion: {
      es: 'Necesitas 4 elementos: 1) SBOM público (CycloneDX/SPDX). 2) Canal vulnerability disclosure. 3) Marcado CE CRA. 4) Fecha hasta la cual garantizas actualizaciones de seguridad (mín. 5 años).',
      en: 'You need 4 items: 1) Public SBOM (CycloneDX/SPDX). 2) Vulnerability disclosure channel. 3) CRA CE marking. 4) Security support end date (min. 5 years).',
      fr: 'Vous devez: 1) SBOM public. 2) Canal divulgation vulnérabilités. 3) Marquage CE CRA. 4) Date fin support sécurité (min. 5 ans).',
      de: 'Sie benötigen: 1) Öffentliches SBOM. 2) Schwachstellen-Offenlegungskanal. 3) CRA-CE-Kennzeichnung. 4) Sicherheits-Support-Enddatum (min. 5 Jahre).',
      it: 'Necessari: 1) SBOM pubblico. 2) Canale divulgazione vulnerabilità. 3) Marcatura CE CRA. 4) Data fine supporto sicurezza (min. 5 anni).',
      pt: 'Necessários: 1) SBOM público. 2) Canal divulgação vulnerabilidades. 3) Marcação CE CRA. 4) Data fim suporte segurança (mín. 5 anos).',
      zh: '需要4项：1) 公开SBOM。2) 漏洞披露渠道。3) CRA CE标志。4) 安全支持截止日期（最少5年）。',
      ja: '必要4項目：1) 公開SBOM。2) 脆弱性開示チャネル。3) CRA CEマーキング。4) セキュリティサポート終了日（最低5年）。',
    },
    help_url: '/docs/security/sbom',
    severity: 'error',
    category: 'missing_document',
  },

  'IMDG_COMPLETENESS_MISSING': {
    technical_code: 'IMDG SOLAS · imdg_class set requires un_number + pg_packing_group',
    message: {
      es: 'Tu producto está clasificado como mercancía peligrosa IMDG · faltan datos obligatorios.',
      en: 'Your product is classified as IMDG dangerous goods · mandatory data missing.',
      fr: 'Votre produit est classé marchandise dangereuse IMDG · données manquantes.',
      de: 'Ihr Produkt ist als IMDG-Gefahrgut klassifiziert · Daten fehlen.',
      it: 'Il tuo prodotto è classificato merce pericolosa IMDG · dati mancanti.',
      pt: 'O seu produto é classificado como mercadoria perigosa IMDG · dados em falta.',
      zh: '您的产品分类为IMDG危险品 · 缺少必填数据。',
      ja: '製品はIMDG危険物 · 必須データ不足。',
    },
    action_suggestion: {
      es: 'Necesitas: 1) Número UN (formato UN0000-UN3999). 2) Grupo de embalaje (I, II o III según peligro).',
      en: 'You need: 1) UN number (format UN0000-UN3999). 2) Packing group (I, II or III by danger).',
      fr: 'Vous devez: 1) Numéro UN. 2) Groupe d\'emballage.',
      de: 'Sie benötigen: 1) UN-Nummer. 2) Verpackungsgruppe.',
      it: 'Necessari: 1) Numero UN. 2) Gruppo imballaggio.',
      pt: 'Necessários: 1) Número UN. 2) Grupo de embalagem.',
      zh: '需要：1) UN编号。2) 包装组。',
      ja: '必要：1) UN番号。2) 包装グループ。',
    },
    help_url: 'https://www.imo.org/en/OurWork/Safety/Pages/DangerousGoods-default.aspx',
    severity: 'error',
    category: 'missing_document',
  },

  // ──────────────────────────────────────────────────────────────────────
  // KYC/KYB
  // ──────────────────────────────────────────────────────────────────────
  'KYC_DOCUMENT_MISSING': {
    technical_code: 'AMLR Art. 14 · Ley 10/2010 Art. 4 · KYC documentary verification required',
    message: {
      es: 'Para operar en 1503 debes completar la verificación KYC obligatoria.',
      en: 'To operate on 1503 you must complete mandatory KYC verification.',
      fr: 'Pour opérer sur 1503 vous devez compléter la vérification KYC obligatoire.',
      de: 'Um 1503 zu nutzen · KYC-Verifizierung obligatorisch.',
      it: 'Per operare su 1503 completa verifica KYC obbligatoria.',
      pt: 'Para operar no 1503 complete verificação KYC obrigatória.',
      zh: '在1503运营需完成强制KYC验证。',
      ja: '1503での運営にはKYC検証が必須。',
    },
    action_suggestion: {
      es: 'Sube tu DNI/Pasaporte vigente + selfie en vivo. La verificación tarda 24-72h.',
      en: 'Upload valid ID/Passport + live selfie. Verification takes 24-72h.',
      fr: 'Téléchargez pièce d\'identité valide + selfie. Vérification 24-72h.',
      de: 'Laden Sie gültigen Ausweis + Selfie hoch. Verifizierung 24-72h.',
      it: 'Carica documento identità valido + selfie. Verifica 24-72h.',
      pt: 'Carregue documento identidade válido + selfie. Verificação 24-72h.',
      zh: '上传有效身份证/护照 + 实时自拍。验证24-72小时。',
      ja: '有効な身分証明書/パスポート + ライブ自撮りをアップロード。検証24-72時間。',
    },
    help_url: '/legal/kyc-process',
    severity: 'critical',
    category: 'missing_document',
  },

  'KYB_MERCANTILE_MISSING': {
    technical_code: 'AMLR Art. 14 · KYB · Mercantile Registry document required for companies',
    message: {
      es: 'Tu empresa necesita el documento del Registro Mercantil para operar.',
      en: 'Your company needs the Mercantile Registry document to operate.',
      fr: 'Votre entreprise nécessite le document du registre du commerce.',
      de: 'Ihr Unternehmen benötigt das Handelsregisterdokument.',
      it: 'La tua azienda necessita del documento del Registro Commerciale.',
      pt: 'A sua empresa necessita do documento do Registo Comercial.',
      zh: '您的公司需要商业登记文件。',
      ja: 'お客様の会社は商業登記証明書が必要。',
    },
    action_suggestion: {
      es: 'Solicita en el Registro Mercantil de tu provincia (España: BORME · Francia: INPI · Alemania: Handelsregister · UK: Companies House · USA: SEC). Vigencia recomendada <12 meses.',
      en: 'Request from your Mercantile Registry (Spain: BORME · France: INPI · Germany: Handelsregister · UK: Companies House · USA: SEC). Recommended freshness <12 months.',
      fr: 'Demandez au registre du commerce.',
      de: 'Beim Handelsregister anfordern.',
      it: 'Richiedi al Registro Commerciale.',
      pt: 'Solicite ao Registo Comercial.',
      zh: '向商业登记处申请。',
      ja: '商業登記所に申請してください。',
    },
    help_url: 'https://www.registradores.org',
    severity: 'critical',
    category: 'missing_document',
  },

  // ──────────────────────────────────────────────────────────────────────
  // DOCUMENTOS VENCIDOS
  // ──────────────────────────────────────────────────────────────────────
  'DOCUMENT_EXPIRED': {
    technical_code: 'actor_documents.status=expired · expires_at < now()',
    message: {
      es: 'Uno de tus documentos legales ha caducado y bloquea operaciones.',
      en: 'One of your legal documents has expired and blocks operations.',
      fr: 'Un de vos documents légaux a expiré et bloque les opérations.',
      de: 'Eines Ihrer Rechtsdokumente ist abgelaufen und blockiert Operationen.',
      it: 'Uno dei tuoi documenti legali è scaduto e blocca operazioni.',
      pt: 'Um dos seus documentos legais expirou e bloqueia operações.',
      zh: '您的一份法律文件已过期并阻止操作。',
      ja: '法的文書の1つが期限切れで操作をブロック中。',
    },
    action_suggestion: {
      es: 'Renueva el documento con la autoridad emisora correspondiente y súbelo de nuevo.',
      en: 'Renew the document with the issuing authority and re-upload it.',
      fr: 'Renouvelez le document avec l\'autorité émettrice et téléchargez-le à nouveau.',
      de: 'Erneuern Sie das Dokument bei der ausstellenden Behörde und laden Sie es erneut hoch.',
      it: 'Rinnova il documento con l\'autorità emittente e ricaricalo.',
      pt: 'Renove o documento com a autoridade emissora e carregue novamente.',
      zh: '与颁发机构续签文件并重新上传。',
      ja: '発行機関で文書を更新し再アップロード。',
    },
    severity: 'critical',
    category: 'expired_document',
  },

  'DOCUMENT_EXPIRING_SOON': {
    technical_code: 'actor_documents.status=expiring_soon · expires_at <= now() + 30d',
    message: {
      es: 'Un documento legal vencerá pronto. Renuévalo para evitar bloqueo de operaciones.',
      en: 'A legal document is expiring soon. Renew to avoid operation blocking.',
      fr: 'Un document légal expire bientôt. Renouvelez pour éviter le blocage.',
      de: 'Ein Rechtsdokument läuft bald ab. Erneuern Sie es.',
      it: 'Un documento legale scade presto. Rinnova.',
      pt: 'Um documento legal expira em breve. Renove.',
      zh: '法律文件即将到期。请续签。',
      ja: '法的文書が間もなく期限切れ。更新してください。',
    },
    action_suggestion: {
      es: 'Tienes 30 días o menos para renovar. Anticípate y solicita el nuevo certificado con tu autoridad emisora.',
      en: 'You have 30 days or less. Anticipate and request the new certificate.',
      fr: 'Vous avez 30 jours ou moins. Anticipez la demande.',
      de: 'Sie haben 30 Tage oder weniger. Beantragen Sie das neue Zertifikat.',
      it: 'Hai 30 giorni o meno. Anticipa la richiesta.',
      pt: 'Tem 30 dias ou menos. Antecipe o pedido.',
      zh: '您还有30天或更短时间。请提前申请。',
      ja: '30日以内です。事前に申請してください。',
    },
    severity: 'warning',
    category: 'expired_document',
  },

  // ──────────────────────────────────────────────────────────────────────
  // SANCIONES + GEOFENCE
  // ──────────────────────────────────────────────────────────────────────
  'SANCTIONED_COUNTRY': {
    technical_code: 'geofence · country in blocked_sanctions list (mig 011/012)',
    message: {
      es: 'No podemos operar con tu país por restricciones de sanciones internacionales.',
      en: 'We cannot operate with your country due to international sanctions.',
      fr: 'Nous ne pouvons pas opérer avec votre pays en raison de sanctions internationales.',
      de: 'Wir können aufgrund internationaler Sanktionen nicht mit Ihrem Land operieren.',
      it: 'Non possiamo operare con il tuo paese per sanzioni internazionali.',
      pt: 'Não podemos operar com o seu país devido a sanções internacionais.',
      zh: '由于国际制裁限制 · 我们无法与您所在的国家合作。',
      ja: '国際制裁により貴国とは取引できません。',
    },
    action_suggestion: {
      es: 'Contacta soporte si crees que es un error: support@1503.global',
      en: 'Contact support if you believe this is an error.',
      fr: 'Contactez le support en cas d\'erreur.',
      de: 'Kontaktieren Sie den Support bei Fehler.',
      it: 'Contatta supporto se è un errore.',
      pt: 'Contacte suporte se for um erro.',
      zh: '如果您认为是错误请联系支持。',
      ja: 'エラーと思われる場合はサポートまで。',
    },
    severity: 'critical',
    category: 'unauthorized',
  },

  // ──────────────────────────────────────────────────────────────────────
  // ESCROW + MULTI-FIRMA
  // ──────────────────────────────────────────────────────────────────────
  'CONTAINER_LOAD_MISSING_SIGNATURES': {
    technical_code: 'container_load_3_of_3 · missing signatures (buyer/seller/oracle)',
    message: {
      es: 'Faltan firmas para confirmar la carga del contenedor. Sin las 3 firmas el escrow no se libera.',
      en: 'Container load confirmation signatures are missing. Without 3-of-3 escrow does not release.',
      fr: 'Signatures de confirmation de chargement manquantes.',
      de: 'Container-Beladungsbestätigungssignaturen fehlen.',
      it: 'Mancano firme conferma carico container.',
      pt: 'Faltam assinaturas confirmação carga contentor.',
      zh: '缺少集装箱装载确认签名。',
      ja: 'コンテナ積載確認署名が不足。',
    },
    action_suggestion: {
      es: 'Las 3 partes deben firmar: comprador · vendedor · transitario/oráculo. Cada uno con su clave privada Ed25519 desde su escritorio.',
      en: 'All 3 parties must sign: buyer · seller · freight forwarder/oracle. Each with their Ed25519 private key from their dashboard.',
      fr: 'Les 3 parties doivent signer: acheteur · vendeur · transitaire/oracle.',
      de: 'Alle 3 Parteien müssen signieren: Käufer · Verkäufer · Spediteur/Oracle.',
      it: 'Le 3 parti devono firmare: compratore · venditore · spedizioniere/oracle.',
      pt: 'As 3 partes devem assinar: comprador · vendedor · transitário/oráculo.',
      zh: '所有3方必须签名：买方 · 卖方 · 货代/预言机。',
      ja: '3者全員が署名必須：買主 · 売主 · 貨物代理店/オラクル。',
    },
    severity: 'warning',
    category: 'missing_document',
  },
}

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/** Obtiene mensaje user-friendly por código + idioma. */
export function translateError(
  errorCode: string,
  lang: Lang = 'es',
): { message: string; action: string; help_url?: string; severity: string } | null {
  const error = USER_FRIENDLY_ERRORS[errorCode]
  if (!error) return null

  return {
    message: error.message[lang] || error.message.en || error.message.es,
    action: error.action_suggestion[lang] || error.action_suggestion.en || error.action_suggestion.es,
    help_url: error.help_url,
    severity: error.severity,
  }
}

/** Detecta el código user-friendly a partir de un mensaje Zod técnico.
 *  Fallback robusto cuando el backend devuelve mensaje crudo. */
export function detectErrorCode(zodMessage: string): string | null {
  if (zodMessage.includes('EUDR Art. 9.1.d') || zodMessage.includes('EUDR completeness')) {
    return 'EUDR_COMPLETENESS_MISSING'
  }
  if (zodMessage.includes('CRA Art. 13') || zodMessage.includes('CRA completeness')) {
    return 'CRA_COMPLETENESS_MISSING'
  }
  if (zodMessage.includes('IMDG completeness') || zodMessage.includes('Código IMDG SOLAS')) {
    return 'IMDG_COMPLETENESS_MISSING'
  }
  if (zodMessage.includes('kyc') || zodMessage.includes('KYC')) {
    return 'KYC_DOCUMENT_MISSING'
  }
  if (zodMessage.includes('Mercantile') || zodMessage.includes('BORME')) {
    return 'KYB_MERCANTILE_MISSING'
  }
  if (zodMessage.includes('expired')) {
    return 'DOCUMENT_EXPIRED'
  }
  if (zodMessage.includes('expiring_soon') || zodMessage.includes('expires soon')) {
    return 'DOCUMENT_EXPIRING_SOON'
  }
  if (zodMessage.includes('blocked_sanctions') || zodMessage.includes('sanctioned')) {
    return 'SANCTIONED_COUNTRY'
  }
  if (zodMessage.includes('container_load') || zodMessage.includes('multifirma')) {
    return 'CONTAINER_LOAD_MISSING_SIGNATURES'
  }
  return null
}

/** Traduce mensaje Zod crudo a user-friendly (combina detección + traducción). */
export function translateZodError(
  zodMessage: string,
  lang: Lang = 'es',
): { message: string; action: string; help_url?: string; severity: string } {
  const code = detectErrorCode(zodMessage)
  if (code) {
    const translated = translateError(code, lang)
    if (translated) return translated
  }

  // Fallback genérico
  return {
    message: zodMessage,
    action: lang === 'es' ? 'Contacta soporte si necesitas ayuda.' : 'Contact support if you need help.',
    severity: 'warning',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// HOOKS IA (interfaz declarada · proveedor intercambiable)
// ════════════════════════════════════════════════════════════════════════════

/** Interfaz declarada para futuro IA Nivel A (self-host).
 *  La IA guiará al actor con explicaciones contextuales por sector + país.
 *
 *  Implementación pendiente Fase 5 (memoria 26-may v5):
 *    - Cero acceso a datos del Actor · solo contenido público + docs subidas
 *      al RAG por el propio Actor
 *    - Respuestas en idioma del Actor con citas a normativa específica
 */
export interface IAGuidanceContext {
  actor_sector_id?: string
  actor_subsector_id?: string
  actor_role_id?: string
  actor_country_code?: string
  missing_documents: string[] // ids de SectorDocumentRequirement
  current_action: 'listing' | 'purchase' | 'transport' | 'escrow_release'
  preferred_lang: Lang
}

export interface IAGuidanceResponse {
  /** Resumen 1-2 frases del estado actual. */
  summary: string

  /** Pasos accionables priorizados. */
  steps: {
    step_number: number
    title: string
    description: string
    estimated_time_minutes: number
    related_document_id?: string
    related_authority_url?: string
  }[]

  /** Citas normativas relevantes para el contexto. */
  legal_citations: {
    norm: string         // e.g. "Reg. UE 2024/1781 ESPR Art. 9"
    relevance: string    // qué aporta a la guía
  }[]

  /** Confianza de la respuesta IA (0-1). */
  confidence: number
}

/** Función placeholder para invocar la IA (futuro self-host).
 *  Por ahora devuelve respuesta estática basada en catálogo · cuando IA
 *  esté activa · se sustituye por llamada al endpoint Llama.
 *
 *  ENDPOINT FUTURO: POST /api/ia/guidance (Fase 5)
 *    Body: IAGuidanceContext
 *    Response: IAGuidanceResponse
 */
export async function getIAGuidance(
  context: IAGuidanceContext,
): Promise<IAGuidanceResponse> {
  // Por ahora · respuesta estática · sin llamada IA real.
  // Cuando se active IA Nivel A · cambiar por fetch al endpoint Llama self-host.
  return {
    summary:
      context.preferred_lang === 'es'
        ? 'Te faltan algunos documentos para completar tu operación. Te guio paso a paso.'
        : 'Some documents are missing to complete your operation. Step-by-step guide follows.',
    steps: context.missing_documents.map((docId, idx) => ({
      step_number: idx + 1,
      title:
        context.preferred_lang === 'es'
          ? `Obtener documento: ${docId}`
          : `Get document: ${docId}`,
      description:
        context.preferred_lang === 'es'
          ? `Sigue los pasos de la autoridad emisora correspondiente. Consulta el catálogo de documentación 1503 para ver requisitos exactos.`
          : `Follow steps from the issuing authority. Check 1503 documentation catalog for exact requirements.`,
      estimated_time_minutes: 30,
      related_document_id: docId,
    })),
    legal_citations: [
      {
        norm: 'AMLR Reg. UE 2024/1624 Art. 14',
        relevance:
          context.preferred_lang === 'es'
            ? 'Verificación documental KYC/KYB obligatoria.'
            : 'Mandatory KYC/KYB documentary verification.',
      },
    ],
    confidence: 0.7, // baseline · subirá cuando IA real esté activa
  }
}
