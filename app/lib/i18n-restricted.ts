/**
 * i18n para las páginas /restricted/* (geofence: coming-soon, blocked,
 * sanctioned).
 *
 * Soporte: 8 idiomas (ES/EN/FR/DE/IT/PT/ZH/JA), alineado con el resto
 * del shell (i18n.ts) y con la taxonomía de sectores (actorGroups.ts).
 * El idioma se decide por el país DECLARADO (parámetro `c=` en la URL del
 * rewrite del middleware), no por el browser — más predecible.
 *
 * Cuando se abra un nuevo mercado y los textos legales necesiten variación
 * fina (ej. árabe RTL, hindi), se añade aquí + en COUNTRY_LOCALE.
 */

export type Locale = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja'

/**
 * País → idioma del cartel. Países no mapeados caen a 'en' (universal).
 * Mapeo conservador: solo se ancla un país a un idioma cuando es claro
 * (ej. CH suiza es trilingüe → cae a en por defecto).
 */
const COUNTRY_LOCALE: Record<string, Locale> = {
  // Español — España + Latinoamérica hispanohablante
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', CL: 'es',
  VE: 'es', BO: 'es', EC: 'es', PY: 'es', UY: 'es',
  CU: 'es', NI: 'es', GT: 'es', SV: 'es', HN: 'es', PA: 'es',
  CR: 'es', DO: 'es', PR: 'es',

  // Inglés — mercados B2B donde el inglés es operativo
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en',
  SG: 'en', HK: 'en', PH: 'en', MT: 'en', ZA: 'en', IN: 'en',

  // Francés
  FR: 'fr', BE: 'fr', LU: 'fr', MC: 'fr',
  CI: 'fr', SN: 'fr', ML: 'fr', BF: 'fr', NE: 'fr',
  BJ: 'fr', TG: 'fr', GA: 'fr', CM: 'fr',

  // Alemán
  DE: 'de', AT: 'de', LI: 'de',

  // Italiano
  IT: 'it', SM: 'it', VA: 'it',

  // Portugués
  PT: 'pt', BR: 'pt', AO: 'pt', MZ: 'pt',
  CV: 'pt', GW: 'pt', ST: 'pt', TL: 'pt',

  // Chino
  CN: 'zh', TW: 'zh', MO: 'zh',

  // Japonés
  JP: 'ja',
}

export function localeForCountry(code: string | null | undefined): Locale {
  if (!code) return 'en'
  return COUNTRY_LOCALE[code.toUpperCase()] ?? 'en'
}

// ─────────────────────────────────────────────────────────────────────
// Textos — Sanctioned (OFAC/UE/UN)
// ─────────────────────────────────────────────────────────────────────

type SanctionedText = {
  eyebrow: string
  title: string
  body1: string
  body2: string
  mailHint: string
  legal: string
  back: string
}

export const sanctionedTexts: Record<Locale, SanctionedText> = {
  es: {
    eyebrow: '1503 · ACCESO RESTRINGIDO',
    title: 'No podemos operar con tu jurisdicción.',
    body1: 'Tu país de origen está incluido en las listas internacionales de sanciones (OFAC, Unión Europea o Naciones Unidas). 1503 cumple estrictamente con la regulación AML 5ª y 6ª directivas, MiCA y los regímenes sancionadores aplicables, por lo que no podemos prestarte servicio.',
    body2: 'Si crees que se trata de un error o estás operando legalmente desde una jurisdicción permitida, contáctanos desde el correo oficial de tu empresa.',
    mailHint: 'compliance@1503.global',
    legal: 'Esta decisión se basa en las listas consolidadas de sanciones a fecha de la solicitud. La detección de país se hace a partir de la dirección IP del request entrante.',
    back: '← Volver al inicio',
  },
  en: {
    eyebrow: '1503 · ACCESS RESTRICTED',
    title: 'We cannot operate with your jurisdiction.',
    body1: 'Your country of origin is on international sanctions lists (OFAC, European Union or United Nations). 1503 strictly complies with the 5th and 6th AML directives, MiCA, and applicable sanctions regimes, and therefore cannot provide you with service.',
    body2: 'If you believe this is an error or you are operating lawfully from an allowed jurisdiction, please contact us from your company’s official email address.',
    mailHint: 'compliance@1503.global',
    legal: 'This decision is based on the consolidated sanctions lists at the time of the request. Country detection is based on the IP address of the incoming request.',
    back: '← Back to home',
  },
  fr: {
    eyebrow: '1503 · ACCÈS RESTREINT',
    title: 'Nous ne pouvons pas opérer avec votre juridiction.',
    body1: 'Votre pays d’origine figure sur les listes internationales de sanctions (OFAC, Union européenne ou Nations Unies). 1503 se conforme strictement aux 5e et 6e directives AML, au règlement MiCA et aux régimes de sanctions applicables, et ne peut donc pas vous fournir de service.',
    body2: 'Si vous pensez qu’il s’agit d’une erreur ou que vous opérez légalement depuis une juridiction autorisée, contactez-nous depuis l’adresse e-mail officielle de votre entreprise.',
    mailHint: 'compliance@1503.global',
    legal: 'Cette décision se fonde sur les listes consolidées de sanctions à la date de la demande. La détection du pays est basée sur l’adresse IP de la requête entrante.',
    back: '← Retour à l’accueil',
  },
  de: {
    eyebrow: '1503 · ZUGRIFF BESCHRÄNKT',
    title: 'Wir können mit Ihrer Jurisdiktion nicht operieren.',
    body1: 'Ihr Herkunftsland steht auf internationalen Sanktionslisten (OFAC, Europäische Union oder Vereinte Nationen). 1503 hält sich strikt an die 5. und 6. AML-Richtlinie, MiCA und die geltenden Sanktionsregime und kann Ihnen daher keinen Dienst anbieten.',
    body2: 'Wenn Sie glauben, dass dies ein Fehler ist oder Sie rechtmäßig aus einer zugelassenen Jurisdiktion operieren, kontaktieren Sie uns bitte von der offiziellen E-Mail-Adresse Ihres Unternehmens aus.',
    mailHint: 'compliance@1503.global',
    legal: 'Diese Entscheidung basiert auf den konsolidierten Sanktionslisten zum Zeitpunkt der Anfrage. Die Länderkennung erfolgt anhand der IP-Adresse des eingehenden Requests.',
    back: '← Zurück zur Startseite',
  },
  it: {
    eyebrow: '1503 · ACCESSO LIMITATO',
    title: 'Non possiamo operare con la tua giurisdizione.',
    body1: 'Il tuo paese di origine è incluso nelle liste internazionali di sanzioni (OFAC, Unione Europea o Nazioni Unite). 1503 rispetta rigorosamente le direttive AML 5 e 6, MiCA e i regimi sanzionatori applicabili, pertanto non possiamo fornirti il servizio.',
    body2: 'Se ritieni che si tratti di un errore o stai operando legalmente da una giurisdizione consentita, contattaci dall’indirizzo e-mail ufficiale della tua azienda.',
    mailHint: 'compliance@1503.global',
    legal: 'Questa decisione si basa sulle liste consolidate di sanzioni alla data della richiesta. Il rilevamento del paese avviene tramite l’indirizzo IP della richiesta in arrivo.',
    back: '← Torna alla home',
  },
  pt: {
    eyebrow: '1503 · ACESSO RESTRITO',
    title: 'Não podemos operar com a tua jurisdição.',
    body1: 'O teu país de origem está incluído nas listas internacionais de sanções (OFAC, União Europeia ou Nações Unidas). A 1503 cumpre rigorosamente as 5.ª e 6.ª diretivas AML, o regulamento MiCA e os regimes sancionatórios aplicáveis, pelo que não podemos prestar-te serviço.',
    body2: 'Se acreditas que se trata de um erro ou estás a operar legalmente a partir de uma jurisdição permitida, contacta-nos a partir do e-mail oficial da tua empresa.',
    mailHint: 'compliance@1503.global',
    legal: 'Esta decisão baseia-se nas listas consolidadas de sanções à data do pedido. A deteção do país é feita a partir do endereço IP do pedido recebido.',
    back: '← Voltar ao início',
  },
  zh: {
    eyebrow: '1503 · 访问受限',
    title: '我们无法在您的司法管辖区运营。',
    body1: '您的原籍国位于国际制裁名单上(OFAC、欧盟或联合国)。1503 严格遵守 AML 第 5 号和第 6 号指令、MiCA 法规以及适用的制裁制度,因此无法为您提供服务。',
    body2: '如果您认为这是一个错误,或您是从允许的司法管辖区合法运营,请使用您公司的官方邮箱地址联系我们。',
    mailHint: 'compliance@1503.global',
    legal: '该决定基于请求当时的综合制裁名单。国家/地区的识别是基于传入请求的 IP 地址。',
    back: '← 返回首页',
  },
  ja: {
    eyebrow: '1503 · アクセス制限',
    title: 'お客様の管轄区域では営業を行うことができません。',
    body1: 'お客様の出身国は国際制裁リスト(OFAC、欧州連合、または国連)に掲載されています。1503 は AML 第5次および第6次指令、MiCA 規則、ならびに適用される制裁制度を厳格に遵守しているため、サービスを提供することができません。',
    body2: 'これが誤りであるとお考えの場合、または許可された管轄区域から合法的に運営している場合は、貴社の公式メールアドレスからご連絡ください。',
    mailHint: 'compliance@1503.global',
    legal: 'この決定は、リクエスト時の統合制裁リストに基づきます。国の検出は、受信リクエストの IP アドレスに基づいて行われます。',
    back: '← ホームへ戻る',
  },
}

// ─────────────────────────────────────────────────────────────────────
// Textos — Blocked (Tor / anonimización)
// ─────────────────────────────────────────────────────────────────────

type BlockedText = {
  eyebrow: string
  title: string
  body1: string
  body2: string
  mailHint: string
  legal: string
  back: string
}

export const blockedTexts: Record<Locale, BlockedText> = {
  es: {
    eyebrow: '1503 · ACCESO NO DISPONIBLE',
    title: 'No podemos verificar tu conexión.',
    body1: 'Tu acceso llega a través de una red de anonimización (red Tor). 1503 es una plataforma financiera regulada: necesitamos poder verificar de forma fiable la jurisdicción de origen para cumplir con la normativa AML y MiCA, y eso no es posible a través de Tor.',
    body2: 'Si operas legalmente desde una jurisdicción permitida, vuelve a acceder con una conexión directa (sin Tor) o contáctanos desde el correo oficial de tu empresa.',
    mailHint: 'compliance@1503.global',
    legal: 'Esta decisión se basa en la detección de la IP de origen como nodo de salida de la red Tor en el momento de la solicitud. No es un bloqueo por país.',
    back: '← Volver al inicio',
  },
  en: {
    eyebrow: '1503 · ACCESS UNAVAILABLE',
    title: 'We cannot verify your connection.',
    body1: 'Your access is coming through an anonymisation network (the Tor network). 1503 is a regulated financial platform: we must reliably verify the originating jurisdiction to comply with AML and MiCA rules, and that is not possible over Tor.',
    body2: 'If you operate lawfully from an allowed jurisdiction, please reconnect using a direct connection (without Tor) or contact us from your company’s official email address.',
    mailHint: 'compliance@1503.global',
    legal: 'This decision is based on detecting the originating IP as a Tor exit node at the time of the request. It is not a country-based block.',
    back: '← Back to home',
  },
  fr: {
    eyebrow: '1503 · ACCÈS INDISPONIBLE',
    title: 'Nous ne pouvons pas vérifier votre connexion.',
    body1: 'Votre accès passe par un réseau d’anonymisation (le réseau Tor). 1503 est une plateforme financière régulée : nous devons vérifier de manière fiable la juridiction d’origine pour nous conformer aux règles AML et MiCA, ce qui n’est pas possible via Tor.',
    body2: 'Si vous opérez légalement depuis une juridiction autorisée, reconnectez-vous via une connexion directe (sans Tor) ou contactez-nous depuis l’adresse e-mail officielle de votre entreprise.',
    mailHint: 'compliance@1503.global',
    legal: 'Cette décision est basée sur la détection de l’IP d’origine comme nœud de sortie du réseau Tor au moment de la requête. Il ne s’agit pas d’un blocage par pays.',
    back: '← Retour à l’accueil',
  },
  de: {
    eyebrow: '1503 · ZUGRIFF NICHT VERFÜGBAR',
    title: 'Wir können Ihre Verbindung nicht überprüfen.',
    body1: 'Ihr Zugriff erfolgt über ein Anonymisierungsnetzwerk (das Tor-Netzwerk). 1503 ist eine regulierte Finanzplattform: Wir müssen die Herkunftsjurisdiktion zuverlässig verifizieren, um die AML- und MiCA-Vorschriften einzuhalten, was über Tor nicht möglich ist.',
    body2: 'Wenn Sie rechtmäßig aus einer zugelassenen Jurisdiktion operieren, verbinden Sie sich bitte direkt (ohne Tor) oder kontaktieren Sie uns über die offizielle E-Mail-Adresse Ihres Unternehmens.',
    mailHint: 'compliance@1503.global',
    legal: 'Diese Entscheidung basiert auf der Erkennung der Herkunfts-IP als Tor-Exit-Node zum Zeitpunkt der Anfrage. Es handelt sich nicht um eine länderbasierte Sperre.',
    back: '← Zurück zur Startseite',
  },
  it: {
    eyebrow: '1503 · ACCESSO NON DISPONIBILE',
    title: 'Non possiamo verificare la tua connessione.',
    body1: 'Il tuo accesso passa attraverso una rete di anonimizzazione (la rete Tor). 1503 è una piattaforma finanziaria regolamentata: dobbiamo verificare in modo affidabile la giurisdizione di origine per rispettare le normative AML e MiCA, cosa non possibile tramite Tor.',
    body2: 'Se operi legalmente da una giurisdizione consentita, riconnettiti con una connessione diretta (senza Tor) o contattaci dall’indirizzo e-mail ufficiale della tua azienda.',
    mailHint: 'compliance@1503.global',
    legal: 'Questa decisione si basa sul rilevamento dell’IP di origine come nodo di uscita della rete Tor al momento della richiesta. Non è un blocco per paese.',
    back: '← Torna alla home',
  },
  pt: {
    eyebrow: '1503 · ACESSO INDISPONÍVEL',
    title: 'Não podemos verificar a tua ligação.',
    body1: 'O teu acesso chega através de uma rede de anonimização (a rede Tor). A 1503 é uma plataforma financeira regulada: precisamos verificar de forma fiável a jurisdição de origem para cumprir as regras AML e MiCA, e isso não é possível através do Tor.',
    body2: 'Se operas legalmente a partir de uma jurisdição permitida, volta a aceder com uma ligação direta (sem Tor) ou contacta-nos a partir do e-mail oficial da tua empresa.',
    mailHint: 'compliance@1503.global',
    legal: 'Esta decisão baseia-se na deteção do IP de origem como nó de saída da rede Tor no momento do pedido. Não é um bloqueio por país.',
    back: '← Voltar ao início',
  },
  zh: {
    eyebrow: '1503 · 暂不可访问',
    title: '我们无法验证您的连接。',
    body1: '您的访问来自匿名化网络(Tor 网络)。1503 是受监管的金融平台:为遵守 AML 和 MiCA 法规,我们必须可靠地核实来源司法管辖区,而通过 Tor 无法做到这一点。',
    body2: '如果您是从允许的司法管辖区合法运营,请使用直接连接(不通过 Tor)重新访问,或使用您公司的官方邮箱地址联系我们。',
    mailHint: 'compliance@1503.global',
    legal: '该决定基于请求时将来源 IP 识别为 Tor 出口节点。这不是基于国家/地区的封锁。',
    back: '← 返回首页',
  },
  ja: {
    eyebrow: '1503 · アクセス不可',
    title: '接続を確認できません。',
    body1: 'お客様のアクセスは匿名化ネットワーク(Tor ネットワーク)を経由しています。1503 は規制対象の金融プラットフォームです。AML および MiCA 規則を遵守するため、発信元の管轄区域を確実に検証する必要があり、Tor 経由ではそれが不可能です。',
    body2: '許可された管轄区域から合法的に運営している場合は、Tor を使わずに直接接続で再アクセスするか、貴社の公式メールアドレスからご連絡ください。',
    mailHint: 'compliance@1503.global',
    legal: 'この決定は、リクエスト時に発信元 IP が Tor 出口ノードとして検出されたことに基づきます。国別ブロックではありません。',
    back: '← ホームへ戻る',
  },
}

// ─────────────────────────────────────────────────────────────────────
// Textos — Coming Soon (waitlist)
// ─────────────────────────────────────────────────────────────────────

type ComingSoonText = {
  eyebrow: string
  titlePrefix: string
  titleSuffix: string
  body1: string
  body2: string
  formLabel: string
  emailPlaceholder: string
  consentLabel: string
  submitIdle: string
  submitSending: string
  successBadge: string
  successBody: string
  errorGeneric: string
  back: string
}

export const comingSoonTexts: Record<Locale, ComingSoonText> = {
  es: {
    eyebrow: '1503 · PRÓXIMAMENTE',
    titlePrefix: 'Aún no operamos en ',
    titleSuffix: '.',
    body1: 'Estamos trabajando en obtener las licencias regulatorias necesarias para ofrecerte servicio en tu jurisdicción. Operamos hoy en la Unión Europea bajo el reglamento MiCA y ampliaremos a más mercados conforme obtengamos las autorizaciones locales.',
    body2: 'Apúntate a la lista de espera y te avisaremos en cuanto podamos operar contigo. Te respetamos: no compartimos tu email con nadie, sin spam.',
    formLabel: 'Email corporativo',
    emailPlaceholder: 'tu@empresa.com',
    consentLabel: 'Acepto recibir un único email cuando 1503 opere en mi país. Sin newsletter, sin spam. Puedo darme de baja en cualquier momento.',
    submitIdle: 'Apuntarme a la lista de espera',
    submitSending: 'Enviando…',
    successBadge: '● APUNTADO',
    successBody: 'Te avisaremos en cuanto operemos en tu país. Sin spam.',
    errorGeneric: 'No se pudo registrar el email',
    back: '← Volver al inicio',
  },
  en: {
    eyebrow: '1503 · COMING SOON',
    titlePrefix: 'We’re not operating in ',
    titleSuffix: ' yet.',
    body1: 'We are working on obtaining the regulatory licences required to serve your jurisdiction. We currently operate within the European Union under MiCA and will expand to additional markets as we secure local authorisations.',
    body2: 'Join the waitlist and we’ll let you know as soon as we can serve you. We respect your inbox: no sharing, no spam.',
    formLabel: 'Business email',
    emailPlaceholder: 'you@company.com',
    consentLabel: 'I agree to receive a single email when 1503 launches in my country. No newsletter, no spam. I can unsubscribe at any time.',
    submitIdle: 'Join the waitlist',
    submitSending: 'Sending…',
    successBadge: '● JOINED',
    successBody: 'We’ll let you know as soon as we operate in your country. No spam.',
    errorGeneric: 'Could not register your email',
    back: '← Back to home',
  },
  fr: {
    eyebrow: '1503 · BIENTÔT DISPONIBLE',
    titlePrefix: 'Nous n’opérons pas encore en ',
    titleSuffix: '.',
    body1: 'Nous travaillons à obtenir les licences réglementaires nécessaires pour vous servir dans votre juridiction. Nous opérons actuellement dans l’Union européenne sous le règlement MiCA et nous étendrons à d’autres marchés à mesure que nous obtenons les autorisations locales.',
    body2: 'Inscrivez-vous sur la liste d’attente et nous vous préviendrons dès que nous pourrons opérer chez vous. Nous respectons votre boîte de réception : pas de partage, pas de spam.',
    formLabel: 'E-mail professionnel',
    emailPlaceholder: 'vous@entreprise.com',
    consentLabel: 'J’accepte de recevoir un seul e-mail lorsque 1503 sera disponible dans mon pays. Pas de newsletter, pas de spam. Je peux me désinscrire à tout moment.',
    submitIdle: 'Rejoindre la liste d’attente',
    submitSending: 'Envoi…',
    successBadge: '● INSCRIT',
    successBody: 'Nous vous préviendrons dès que nous opérons dans votre pays. Pas de spam.',
    errorGeneric: 'Impossible d’enregistrer l’e-mail',
    back: '← Retour à l’accueil',
  },
  de: {
    eyebrow: '1503 · DEMNÄCHST',
    titlePrefix: 'Wir sind noch nicht in ',
    titleSuffix: ' tätig.',
    body1: 'Wir arbeiten daran, die für Ihre Jurisdiktion erforderlichen regulatorischen Lizenzen zu erhalten. Derzeit operieren wir innerhalb der Europäischen Union unter der MiCA-Verordnung und werden auf weitere Märkte expandieren, sobald wir die lokalen Genehmigungen erhalten.',
    body2: 'Tragen Sie sich auf die Warteliste ein und wir benachrichtigen Sie, sobald wir Sie bedienen können. Wir respektieren Ihr Postfach: kein Teilen, kein Spam.',
    formLabel: 'Geschäfts-E-Mail',
    emailPlaceholder: 'sie@unternehmen.com',
    consentLabel: 'Ich stimme zu, eine einzige E-Mail zu erhalten, wenn 1503 in meinem Land verfügbar ist. Kein Newsletter, kein Spam. Ich kann mich jederzeit abmelden.',
    submitIdle: 'In die Warteliste eintragen',
    submitSending: 'Wird gesendet…',
    successBadge: '● EINGETRAGEN',
    successBody: 'Wir benachrichtigen Sie, sobald wir in Ihrem Land tätig sind. Kein Spam.',
    errorGeneric: 'E-Mail konnte nicht registriert werden',
    back: '← Zurück zur Startseite',
  },
  it: {
    eyebrow: '1503 · PROSSIMAMENTE',
    titlePrefix: 'Non operiamo ancora in ',
    titleSuffix: '.',
    body1: 'Stiamo lavorando per ottenere le licenze regolamentari necessarie a servirti nella tua giurisdizione. Operiamo oggi nell’Unione Europea sotto il regolamento MiCA ed estenderemo ad altri mercati man mano che otteniamo le autorizzazioni locali.',
    body2: 'Iscriviti alla lista d’attesa e ti avviseremo non appena potremo servirti. Rispettiamo la tua casella di posta: nessuna condivisione, nessuno spam.',
    formLabel: 'Email aziendale',
    emailPlaceholder: 'tu@azienda.com',
    consentLabel: 'Accetto di ricevere una singola email quando 1503 sarà disponibile nel mio paese. Nessuna newsletter, nessuno spam. Posso annullare l’iscrizione in qualsiasi momento.',
    submitIdle: 'Iscrivimi alla lista d’attesa',
    submitSending: 'Invio…',
    successBadge: '● ISCRITTO',
    successBody: 'Ti avviseremo non appena opereremo nel tuo paese. Nessuno spam.',
    errorGeneric: 'Impossibile registrare l’email',
    back: '← Torna alla home',
  },
  pt: {
    eyebrow: '1503 · EM BREVE',
    titlePrefix: 'Ainda não operamos em ',
    titleSuffix: '.',
    body1: 'Estamos a trabalhar para obter as licenças regulatórias necessárias para te servir na tua jurisdição. Operamos atualmente na União Europeia sob o regulamento MiCA e expandiremos para mais mercados à medida que obtivermos as autorizações locais.',
    body2: 'Inscreve-te na lista de espera e avisamos-te assim que pudermos servir-te. Respeitamos a tua caixa de entrada: sem partilhas, sem spam.',
    formLabel: 'Email empresarial',
    emailPlaceholder: 'tu@empresa.com',
    consentLabel: 'Aceito receber um único email quando a 1503 estiver disponível no meu país. Sem newsletter, sem spam. Posso cancelar a inscrição em qualquer momento.',
    submitIdle: 'Inscrever-me na lista de espera',
    submitSending: 'A enviar…',
    successBadge: '● INSCRITO',
    successBody: 'Avisamos-te assim que operarmos no teu país. Sem spam.',
    errorGeneric: 'Não foi possível registar o email',
    back: '← Voltar ao início',
  },
  zh: {
    eyebrow: '1503 · 即将推出',
    titlePrefix: '我们尚未在 ',
    titleSuffix: ' 开展业务。',
    body1: '我们正在努力取得为您所在司法管辖区提供服务所需的监管许可。我们目前在欧盟根据 MiCA 法规运营,并将随着我们获得当地授权而扩展到更多市场。',
    body2: '加入候补名单,一旦我们能够为您服务,我们会立即通知您。我们尊重您的收件箱:不分享、不发送垃圾邮件。',
    formLabel: '企业邮箱',
    emailPlaceholder: 'you@company.com',
    consentLabel: '我同意在 1503 在我所在国家/地区推出时接收一封电子邮件。没有简报,没有垃圾邮件。我可以随时取消订阅。',
    submitIdle: '加入候补名单',
    submitSending: '发送中…',
    successBadge: '● 已加入',
    successBody: '一旦我们在您所在的国家/地区运营,我们会立即通知您。无垃圾邮件。',
    errorGeneric: '无法注册邮箱',
    back: '← 返回首页',
  },
  ja: {
    eyebrow: '1503 · 近日対応予定',
    titlePrefix: '現在 ',
    titleSuffix: ' では営業を行っていません。',
    body1: 'お客様の管轄区域でサービスを提供するために必要な規制ライセンスの取得に取り組んでいます。現在は MiCA 規則のもとで欧州連合内で営業しており、現地の認可を取得次第、対象市場を拡大していきます。',
    body2: '順番待ちリストにご登録いただければ、サービス開始次第ご連絡いたします。お客様の受信箱を尊重します:共有なし、スパムなし。',
    formLabel: '法人メールアドレス',
    emailPlaceholder: 'you@company.com',
    consentLabel: '1503 が私の国で開始される際に1通のメールを受け取ることに同意します。ニュースレターなし、スパムなし。いつでも配信停止可能。',
    submitIdle: '順番待ちリストに登録',
    submitSending: '送信中…',
    successBadge: '● 登録済み',
    successBody: 'お客様の国で営業を開始次第ご連絡いたします。スパムはありません。',
    errorGeneric: 'メールアドレスを登録できませんでした',
    back: '← ホームへ戻る',
  },
}

// ─────────────────────────────────────────────────────────────────────
// Nombre del país en el idioma del cartel
// ─────────────────────────────────────────────────────────────────────

/**
 * Nombre del país en el idioma del cartel. Si no está en el map, usamos
 * el código ISO (ej. "US", "AE") para no traducir incorrectamente.
 * Cobertura: principales países B2B + sancionados + waitlist típicos.
 */
export const countryNames: Record<Locale, Record<string, string>> = {
  es: {
    US: 'Estados Unidos', GB: 'Reino Unido', CH: 'Suiza',
    SG: 'Singapur', HK: 'Hong Kong', JP: 'Japón', CN: 'China',
    AU: 'Australia', CA: 'Canadá', AE: 'Emiratos Árabes Unidos',
    MX: 'México', AR: 'Argentina', BR: 'Brasil', CL: 'Chile',
    CO: 'Colombia', PE: 'Perú', VE: 'Venezuela', IN: 'India',
    KR: 'Corea del Sur', RU: 'Rusia', TR: 'Turquía', SA: 'Arabia Saudí',
    KP: 'Corea del Norte', IR: 'Irán', SY: 'Siria', CU: 'Cuba',
  },
  en: {
    US: 'the United States', GB: 'the United Kingdom', CH: 'Switzerland',
    SG: 'Singapore', HK: 'Hong Kong', JP: 'Japan', CN: 'China',
    AU: 'Australia', CA: 'Canada', AE: 'the United Arab Emirates',
    MX: 'Mexico', AR: 'Argentina', BR: 'Brazil', CL: 'Chile',
    CO: 'Colombia', PE: 'Peru', VE: 'Venezuela', IN: 'India',
    KR: 'South Korea', RU: 'Russia', TR: 'Turkey', SA: 'Saudi Arabia',
    KP: 'North Korea', IR: 'Iran', SY: 'Syria', CU: 'Cuba',
  },
  fr: {
    US: 'les États-Unis', GB: 'le Royaume-Uni', CH: 'la Suisse',
    SG: 'Singapour', HK: 'Hong Kong', JP: 'le Japon', CN: 'la Chine',
    AU: 'l’Australie', CA: 'le Canada', AE: 'les Émirats arabes unis',
    MX: 'le Mexique', AR: 'l’Argentine', BR: 'le Brésil', CL: 'le Chili',
    CO: 'la Colombie', PE: 'le Pérou', VE: 'le Venezuela', IN: 'l’Inde',
    KR: 'la Corée du Sud', RU: 'la Russie', TR: 'la Turquie', SA: 'l’Arabie saoudite',
    KP: 'la Corée du Nord', IR: 'l’Iran', SY: 'la Syrie', CU: 'Cuba',
  },
  de: {
    US: 'den Vereinigten Staaten', GB: 'dem Vereinigten Königreich', CH: 'der Schweiz',
    SG: 'Singapur', HK: 'Hongkong', JP: 'Japan', CN: 'China',
    AU: 'Australien', CA: 'Kanada', AE: 'den Vereinigten Arabischen Emiraten',
    MX: 'Mexiko', AR: 'Argentinien', BR: 'Brasilien', CL: 'Chile',
    CO: 'Kolumbien', PE: 'Peru', VE: 'Venezuela', IN: 'Indien',
    KR: 'Südkorea', RU: 'Russland', TR: 'der Türkei', SA: 'Saudi-Arabien',
    KP: 'Nordkorea', IR: 'dem Iran', SY: 'Syrien', CU: 'Kuba',
  },
  it: {
    US: 'Stati Uniti', GB: 'Regno Unito', CH: 'Svizzera',
    SG: 'Singapore', HK: 'Hong Kong', JP: 'Giappone', CN: 'Cina',
    AU: 'Australia', CA: 'Canada', AE: 'Emirati Arabi Uniti',
    MX: 'Messico', AR: 'Argentina', BR: 'Brasile', CL: 'Cile',
    CO: 'Colombia', PE: 'Perù', VE: 'Venezuela', IN: 'India',
    KR: 'Corea del Sud', RU: 'Russia', TR: 'Turchia', SA: 'Arabia Saudita',
    KP: 'Corea del Nord', IR: 'Iran', SY: 'Siria', CU: 'Cuba',
  },
  pt: {
    US: 'os Estados Unidos', GB: 'o Reino Unido', CH: 'a Suíça',
    SG: 'Singapura', HK: 'Hong Kong', JP: 'o Japão', CN: 'a China',
    AU: 'a Austrália', CA: 'o Canadá', AE: 'os Emirados Árabes Unidos',
    MX: 'o México', AR: 'a Argentina', BR: 'o Brasil', CL: 'o Chile',
    CO: 'a Colômbia', PE: 'o Peru', VE: 'a Venezuela', IN: 'a Índia',
    KR: 'a Coreia do Sul', RU: 'a Rússia', TR: 'a Turquia', SA: 'a Arábia Saudita',
    KP: 'a Coreia do Norte', IR: 'o Irão', SY: 'a Síria', CU: 'Cuba',
  },
  zh: {
    US: '美国', GB: '英国', CH: '瑞士',
    SG: '新加坡', HK: '香港', JP: '日本', CN: '中国',
    AU: '澳大利亚', CA: '加拿大', AE: '阿拉伯联合酋长国',
    MX: '墨西哥', AR: '阿根廷', BR: '巴西', CL: '智利',
    CO: '哥伦比亚', PE: '秘鲁', VE: '委内瑞拉', IN: '印度',
    KR: '韩国', RU: '俄罗斯', TR: '土耳其', SA: '沙特阿拉伯',
    KP: '朝鲜', IR: '伊朗', SY: '叙利亚', CU: '古巴',
  },
  ja: {
    US: 'アメリカ合衆国', GB: 'イギリス', CH: 'スイス',
    SG: 'シンガポール', HK: '香港', JP: '日本', CN: '中国',
    AU: 'オーストラリア', CA: 'カナダ', AE: 'アラブ首長国連邦',
    MX: 'メキシコ', AR: 'アルゼンチン', BR: 'ブラジル', CL: 'チリ',
    CO: 'コロンビア', PE: 'ペルー', VE: 'ベネズエラ', IN: 'インド',
    KR: '韓国', RU: 'ロシア', TR: 'トルコ', SA: 'サウジアラビア',
    KP: '北朝鮮', IR: 'イラン', SY: 'シリア', CU: 'キューバ',
  },
}

export function countryName(code: string | null | undefined, locale: Locale): string {
  if (!code) {
    // Default genérico cuando no hay código de país
    const fallbacks: Record<Locale, string> = {
      es: 'tu país', en: 'your country', fr: 'votre pays', de: 'Ihrem Land',
      it: 'il tuo paese', pt: 'o teu país', zh: '您的国家', ja: 'お客様の国',
    }
    return fallbacks[locale]
  }
  const upper = code.toUpperCase()
  return countryNames[locale][upper] ?? upper
}
