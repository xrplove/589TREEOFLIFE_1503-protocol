// Genera docs/architecture/0003-security-assessment.pdf a partir del
// contenido de la auditoría de seguridad. Documento corporativo limpio,
// imprimible, con acento de marca 1503 (#00A3FF).
//
// Uso: node scripts/build-security-pdf.mjs

import PDFDocument from 'pdfkit'
import { createWriteStream } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'docs', 'architecture', '0003-security-assessment.pdf')

const CYAN = '#00A3FF'
const DARK = '#16202C'
const GRAY = '#5A6878'
const LIGHT = '#EAF4FB'
const RED = '#C0392B'
const AMBER = '#B7791F'
const GREEN = '#1E7F4F'

const doc = new PDFDocument({ size: 'A4', margin: 56, bufferPages: true })
doc.pipe(createWriteStream(OUT))

const PAGE_W = doc.page.width
const ML = 56
const MR = doc.page.width - 56
const CONTENT_W = MR - ML

function h1(text) {
  doc.moveDown(0.5)
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(16).text(text, ML)
  doc.moveTo(ML, doc.y + 2).lineTo(ML + 48, doc.y + 2).lineWidth(2.5).strokeColor(CYAN).stroke()
  doc.moveDown(0.6)
}

function h2(text) {
  doc.moveDown(0.4)
  doc.fillColor(CYAN).font('Helvetica-Bold').fontSize(11.5).text(text, ML)
  doc.moveDown(0.3)
}

function para(text, opts = {}) {
  doc.fillColor(opts.color || DARK).font(opts.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(opts.size || 10).text(text, ML, doc.y, { width: CONTENT_W, align: opts.align || 'left', lineGap: 2 })
  doc.moveDown(0.4)
}

function checkPageBreak(needed = 80) {
  if (doc.y + needed > doc.page.height - 56) doc.addPage()
}

// Tabla simple: cols = [{header, width, align}], rows = [[...]]
function table(cols, rows, opts = {}) {
  const rowH = opts.rowH || 22
  const headerH = 24
  const totalW = cols.reduce((s, c) => s + c.width, 0)
  const scale = CONTENT_W / totalW
  const widths = cols.map((c) => c.width * scale)

  checkPageBreak(headerH + rowH * 2)

  // Header
  let x = ML
  let y = doc.y
  doc.rect(ML, y, CONTENT_W, headerH).fill(CYAN)
  cols.forEach((c, i) => {
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8.5)
      .text(c.header, x + 6, y + 7, { width: widths[i] - 12, align: c.align || 'left' })
    x += widths[i]
  })
  y += headerH

  // Rows
  rows.forEach((row, ri) => {
    // alto dinámico según contenido más largo
    let maxLines = 1
    cols.forEach((c, i) => {
      const txt = String(row[i] ?? '')
      const approxCharsPerLine = Math.max(8, Math.floor((widths[i] - 12) / 4.6))
      maxLines = Math.max(maxLines, Math.ceil(txt.length / approxCharsPerLine))
    })
    const thisH = Math.max(rowH, 10 + maxLines * 11)

    if (y + thisH > doc.page.height - 56) {
      doc.addPage()
      y = doc.y
    }

    if (ri % 2 === 0) {
      doc.rect(ML, y, CONTENT_W, thisH).fill(LIGHT)
    }
    x = ML
    cols.forEach((c, i) => {
      const cell = row[i] ?? {}
      const isObj = typeof cell === 'object' && cell !== null
      const txt = isObj ? cell.t : String(cell)
      const color = isObj ? cell.c : DARK
      doc.fillColor(color || DARK).font(isObj && cell.b ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
        .text(txt, x + 6, y + 6, { width: widths[i] - 12, align: c.align || 'left', lineGap: 1 })
      x += widths[i]
    })
    y += thisH
  })

  doc.rect(ML, doc.y === y ? y : y, 0, 0) // noop
  doc.y = y + 8
  // borde exterior
  doc.lineWidth(0.5).strokeColor('#C8D6E0')
    .rect(ML, y - rows.reduce(() => 0, 0), CONTENT_W, 0).stroke()
}

// ─── PORTADA ───────────────────────────────────────────────────────
doc.rect(0, 0, PAGE_W, doc.page.height).fill('#0B0D14')
doc.fillColor(CYAN).font('Helvetica-Bold').fontSize(10).text('◆ 1503', ML, 110, { characterSpacing: 3 })
doc.fillColor('#E8EDF5').font('Helvetica-Bold').fontSize(30).text('Security Assessment', ML, 150, { width: CONTENT_W })
doc.fillColor('#9FB6CC').font('Helvetica').fontSize(13).text('Auditoría técnica de seguridad — fase pre-MVP', ML, 195)

doc.roundedRect(ML, 250, 220, 110, 6).fill(CYAN)
doc.fillColor('#08090F').font('Helvetica-Bold').fontSize(13).text('NOTA GLOBAL', ML + 20, 272)
doc.fillColor('#08090F').font('Helvetica-Bold').fontSize(46).text('4.5 / 10', ML + 20, 292)

doc.fillColor('#7A8899').font('Helvetica').fontSize(9)
doc.text('Documento: ADR 0003 · Living document', ML, 440)
doc.text('Fecha: 2026-05-15', ML, 456)
doc.text('Autor: Claude Opus 4.7 (auditoría técnica) · revisado por José Soler', ML, 472)
doc.text('Repositorio: feat/landing-grafo-y-globo', ML, 488)

doc.fillColor('#4A5566').font('Helvetica-Oblique').fontSize(8.5)
  .text('Aviso: autoevaluación técnica. NO sustituye una auditoría de seguridad externa ni un pentest profesional, ambos necesarios antes de operar con dinero real.', ML, 540, { width: CONTENT_W, lineGap: 2 })

doc.addPage()

// ─── METODOLOGÍA ───────────────────────────────────────────────────
h1('1 · Metodología')
para('Evaluación por 9 áreas, cada una puntuada de 0 a 10 según los controles implementados frente a los necesarios para operar con dinero real bajo MiCA + AML 5ª/6ª directiva + GDPR. La nota global es la media ponderada por criticidad.')
para('Estado a 2026-05-15: el diseño y la arquitectura son sólidos; la implementación operativa de controles de seguridad está aproximadamente al 25-30%. El techo realista de una fintech bien construida es 8.5/10 — el 10 no existe en seguridad.', { color: GRAY })

// ─── DESGLOSE ──────────────────────────────────────────────────────
h1('2 · Desglose por área')
table(
  [
    { header: 'Área', width: 90 },
    { header: 'Nota', width: 28, align: 'center' },
    { header: 'Estado', width: 200 },
  ],
  [
    ['Arquitectura / diseño', { t: '7/10', b: true, c: GREEN }, 'ADR 0001 sólido, no-custodial, geofence en capas, separación legal documentada'],
    ['Autenticación', { t: '5/10', b: true, c: AMBER }, 'OTP server-side sin bug PKCE. Falta rate limiting, MFA real (WebAuthn), device trust'],
    ['Autorización', { t: '6/10', b: true, c: AMBER }, 'RLS Supabase + middleware guards + salvaguarda operador. Falta segregación de funciones completa'],
    ['KYC / AML', { t: '3/10', b: true, c: RED }, 'State machine OK. Verificación documental real NO (declarativa), sanctions/PEP NO, Travel Rule NO'],
    ['Geofencing', { t: '5/10', b: true, c: AMBER }, 'Sprint 1 (capa 1) robusto y fail-closed. Capas 2-6 pendientes'],
    ['Protección de datos', { t: '4/10', b: true, c: RED }, 'Consents + RLS + IP/UA. Sin cifrado extra de docs, sin DPO, ToS/Privacy en draft'],
    ['Infraestructura', { t: '4/10', b: true, c: RED }, 'Supabase + Vercel base. Sin WAF, secretos en .env.local, sin DR plan, sin SIEM'],
    ['Trazabilidad / auditoría', { t: '5/10', b: true, c: AMBER }, 'geofence_log append-only, kyc_review_log. Sin pentesting, sin auditoría externa'],
    ['Blockchain', { t: 'N/A', b: true, c: GRAY }, 'Solo stubs (blockchain-prep). Sin superficie de ataque real todavía'],
  ],
)

// ─── SUBE ──────────────────────────────────────────────────────────
h1('3 · Lo que sube la nota')
const subes = [
  'Modelo no-custodial por diseño: jamás se almacenan claves privadas, seeds ni mnemonics.',
  'KYC obligatorio con máquina de estados + kyc_review_log.',
  'Append-only audit log: geofence_log con reglas SQL que prohíben UPDATE/DELETE.',
  'Row-Level Security en todas las tablas Supabase.',
  'OTP server-side sin el bug PKCE cross-window.',
  'Geofence fail-closed: país desconocido o BD caída → bloqueado, nunca abierto.',
  'Bloqueo por país de registro Y por IP (regla más estricta de las dos).',
  'Decisiones documentadas en ADRs versionados, no conocimiento tácito.',
  'Salvaguarda de operador: dirigido al panel sin filtrar información.',
]
subes.forEach((s) => {
  checkPageBreak(28)
  doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(10).text('✓', ML, doc.y, { continued: true })
  doc.fillColor(DARK).font('Helvetica').fontSize(10).text('  ' + s, { width: CONTENT_W, lineGap: 2 })
  doc.moveDown(0.3)
})

// ─── BAJA ──────────────────────────────────────────────────────────
h1('4 · Lo que baja la nota (gaps para producción con dinero)')
table(
  [
    { header: 'Gap', width: 200 },
    { header: 'Severidad', width: 55, align: 'center' },
    { header: 'Sprint que lo cierra', width: 110 },
  ],
  [
    ['Verificación documental KYC real (hoy declarativa)', { t: 'Crítica', b: true, c: RED }, 'Sprint Sumsub KYC'],
    ['Sanctions / PEP screening', { t: 'Crítica', b: true, c: RED }, 'Sprint Sumsub KYC'],
    ['Rate limiting en endpoints OTP (fuerza bruta)', { t: 'Crítica', b: true, c: RED }, 'Sprint Bloque C'],
    ['Auditoría de seguridad externa', { t: 'Crítica', b: true, c: RED }, 'Pre-producción'],
    ['ToS / Privacy Policy en borrador (no legal)', { t: 'Alta', b: true, c: AMBER }, 'Abogado fintech'],
    ['Detección de VPN / proxy / Tor', { t: 'Alta', b: true, c: AMBER }, 'Sprint VPN-1'],
    ['Secretos en .env.local sin vault', { t: 'Alta', b: true, c: AMBER }, 'Pre-producción'],
    ['DPO designado (GDPR art. 37)', { t: 'Alta', b: true, c: AMBER }, 'Gestión'],
    ['DR / backup plan documentado', { t: 'Media', b: true, c: GRAY }, 'Pre-producción'],
    ['Pentesting', { t: 'Media', b: true, c: GRAY }, 'Pre-producción'],
    ['Resend sandbox (emails solo a base)', { t: 'Media', b: true, c: GRAY }, 'Registrar dominio'],
    ['WebAuthn / MFA real', { t: 'Media', b: true, c: GRAY }, 'Sprint auth hardening'],
  ],
)

// ─── ROADMAP ───────────────────────────────────────────────────────
h1('5 · Roadmap de progresión de la nota')
table(
  [
    { header: 'Hito', width: 230 },
    { header: 'Δ', width: 45, align: 'center' },
    { header: 'Nota', width: 50, align: 'center' },
  ],
  [
    ['Hoy (pre-MVP)', '—', { t: '4.5', b: true, c: RED }],
    ['Sprint VPN-1 (Tor + ASN + MaxMind)', '+0.5', { t: '5.0', c: AMBER }],
    ['Sprint Sumsub KYC (docs + sanctions + PEP)', '+1.5', { t: '6.5', c: AMBER }],
    ['Sprint Bloque C (rate limit OTP + audit log)', '+0.5', { t: '7.0', c: GREEN }],
    ['WebAuthn MFA + device trust', '+0.4', { t: '7.4', c: GREEN }],
    ['ToS/Privacy por abogado + DPO', '+0.3', { t: '7.7', c: GREEN }],
    ['Secrets vault + WAF + DR plan', '+0.3', { t: '8.0', c: GREEN }],
    ['Auditoría seguridad externa + pentest', '+0.5', { t: '8.5', b: true, c: GREEN }],
  ],
)
para('La auditoría de smart contracts (Fase 7-8) es necesaria antes de operar con dinero real, en paralelo a este roadmap.', { color: GRAY, size: 9 })

// ─── RECOMENDACIÓN ─────────────────────────────────────────────────
h1('6 · Recomendación')
para('No apto para dinero real en agosto 2026. Apto para MVP UE en modo piloto cerrado (Actores invitados, sin operaciones financieras reales).', { bold: true })
para('Para operar con dinero real se requiere como mínimo alcanzar la nota 7.0 (Sumsub KYC + rate limiting + audit log) más una auditoría de seguridad externa. Realista: finales de 2026 / Q1 2027, no agosto.')
h2('Prioridad de inversión inmediata')
const prio = [
  'Consulta con abogado fintech especializado (500-1.500 €) — valida marco legal e identifica proveedores de compliance.',
  'Sprint Sumsub KYC — cierra los 2 gaps críticos de KYC/AML de golpe.',
  'Sprint Bloque C — rate limiting OTP + audit log (anti fuerza bruta).',
  'Auditoría externa antes de cualquier operación con dinero real.',
]
prio.forEach((p, i) => {
  checkPageBreak(28)
  doc.fillColor(CYAN).font('Helvetica-Bold').fontSize(10).text(`${i + 1}.`, ML, doc.y, { continued: true })
  doc.fillColor(DARK).font('Helvetica').fontSize(10).text('  ' + p, { width: CONTENT_W, lineGap: 2 })
  doc.moveDown(0.3)
})

// ─── HISTORIAL ─────────────────────────────────────────────────────
h1('7 · Historial de revisiones')
table(
  [
    { header: 'Fecha', width: 60, align: 'center' },
    { header: 'Nota', width: 35, align: 'center' },
    { header: 'Cambio', width: 230 },
  ],
  [
    ['2026-05-15', { t: '4.5', b: true }, 'Evaluación inicial. Sprint 1 geofence + blockchain-prep + i18n cerrados'],
  ],
)
para('Actualizar esta tabla y el desglose por área al cierre de cada sprint de compliance para trackear la progresión hacia 8.5.', { color: GRAY, size: 9 })

// ─── PIE DE PÁGINA en todas las páginas ────────────────────────────
const range = doc.bufferedPageRange()
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i)
  if (i === range.start) continue // portada sin pie
  doc.fillColor('#A0AEC0').font('Helvetica').fontSize(7.5)
    .text('1503 · Security Assessment · Confidencial · 2026-05-15', ML, doc.page.height - 40, { width: CONTENT_W, align: 'left' })
  doc.text(`${i - range.start + 1} / ${range.count - 1}`, ML, doc.page.height - 40, { width: CONTENT_W, align: 'right' })
}

doc.end()
console.log('PDF generado en:', OUT)
