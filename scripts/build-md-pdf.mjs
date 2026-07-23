// Generador compacto Markdown → PDF para documentos 1503.
// Uso: node scripts/build-md-pdf.mjs <ruta-relativa-md> [titulo-portada]
//
// Diseño optimizado para densidad de información: márgenes ajustados, fontSize
// agresivos pero legibles, tablas comprimidas, code blocks compactos.
//
// Soporta: H1/H2/H3/H4, párrafos, negrita, cursiva, código inline, code blocks,
// listas ord/unord, tablas básicas, blockquotes, hr.

import PDFDocument from 'pdfkit'
import { createWriteStream, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { marked } from 'marked'

const __dirname = dirname(fileURLToPath(import.meta.url))

const inputArg = process.argv[2]
if (!inputArg) {
  console.error('Uso: node scripts/build-md-pdf.mjs <ruta-relativa-md> [titulo-portada]')
  process.exit(1)
}

const customTitle = process.argv[3]
const ROOT = join(__dirname, '..')
const INPUT = join(ROOT, inputArg)
const OUT = INPUT.replace(/\.md$/i, '.pdf')

const md = readFileSync(INPUT, 'utf-8')

// Colores marca
const CYAN = '#00A3FF'
const DARK = '#16202C'
const GRAY = '#5A6878'
const CODE_BG = '#F4F6F8'
const TABLE_HEADER_BG = '#E8F2FB'
const TABLE_BORDER = '#D5DBE0'

// Documento — márgenes ajustados para densidad
const MARGIN = 40
const doc = new PDFDocument({ size: 'A4', margins: { top: MARGIN, bottom: 45, left: MARGIN, right: MARGIN }, bufferPages: true, autoFirstPage: false })
doc.pipe(createWriteStream(OUT))

doc.addPage()

const PAGE_W = doc.page.width
const PAGE_H = doc.page.height
const ML = MARGIN
const MR = PAGE_W - MARGIN
const CONTENT_W = MR - ML
const BOTTOM_LIMIT = PAGE_H - 55

function checkPageBreak(needed = 30) {
  if (doc.y + needed > BOTTOM_LIMIT) {
    doc.addPage()
    doc.y = MARGIN
  }
}

// PORTADA compacta (top de primera página, no página entera)
function drawCover(title) {
  // Banda superior cyan
  doc.fillColor(DARK).rect(0, 0, PAGE_W, 70).fill()
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text('1503', ML, 22)
  doc.fillColor(CYAN).font('Helvetica').fontSize(8).text('INFRAESTRUCTURA B2B · XRPL · LIQUIDACIÓN T+0', ML, 50, { characterSpacing: 1.5 })

  // Título doc
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(16)
  doc.text(title, ML, 90, { width: CONTENT_W, align: 'left', lineGap: 3 })

  // Linea acento
  const yLine = doc.y + 8
  doc.moveTo(ML, yLine).lineTo(ML + 50, yLine).lineWidth(2.5).strokeColor(CYAN).stroke()

  // Metadata compacta
  doc.fillColor(GRAY).font('Helvetica').fontSize(8)
  doc.text('Fecha: 2026-05-26 · Autor: Claude Opus 4.7 (1M context)', ML, yLine + 14, { width: CONTENT_W })
  doc.text('Vehículo: Innovaciones Soler Madrid, S.L. · Status: v1 borrador', ML, yLine + 26, { width: CONTENT_W })
  doc.text('Documento interno · NO sustituye dictamen abogado fintech ni auditoría profesional', ML, yLine + 38, { width: CONTENT_W })

  doc.y = yLine + 55
}

function drawFooter() {
  const range = doc.bufferedPageRange()
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(range.start + i)
    doc.fillColor(GRAY).font('Helvetica').fontSize(7)
    const footerY = PAGE_H - 35
    doc.text('1503 · Documento interno · 2026-05-26', ML, footerY, { width: CONTENT_W, align: 'left' })
    doc.text(`${i + 1} / ${range.count}`, ML, footerY, { width: CONTENT_W, align: 'right' })
  }
}

// Limpieza de markdown inline para tablas/celdas (eliminar **__\`*[](url))
function cleanInline(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
}

// Renderizado párrafo con inline styles (más simple y compacto que el anterior)
function renderParagraph(text, opts = {}) {
  const size = opts.size || 8.5
  const lineGap = opts.lineGap || 1
  doc.fillColor(DARK).font('Helvetica').fontSize(size)
  // Tokenizar: **bold** *italic* `code`
  const parts = []
  let remaining = text
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\([^)]+\))/
  while (remaining.length > 0) {
    const m = remaining.match(regex)
    if (!m) {
      parts.push({ text: remaining, style: 'normal' })
      break
    }
    const idx = m.index
    if (idx > 0) parts.push({ text: remaining.slice(0, idx), style: 'normal' })
    const tok = m[0]
    if (tok.startsWith('**')) parts.push({ text: tok.slice(2, -2), style: 'bold' })
    else if (tok.startsWith('*')) parts.push({ text: tok.slice(1, -1), style: 'italic' })
    else if (tok.startsWith('`')) parts.push({ text: tok.slice(1, -1), style: 'code' })
    else if (tok.startsWith('[')) parts.push({ text: m[2], style: 'link' })
    remaining = remaining.slice(idx + tok.length)
  }
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    const font = p.style === 'bold' ? 'Helvetica-Bold' : p.style === 'italic' ? 'Helvetica-Oblique' : p.style === 'code' ? 'Courier' : 'Helvetica'
    const fillColor = p.style === 'code' ? '#A03030' : p.style === 'link' ? CYAN : DARK
    doc.font(font).fillColor(fillColor).fontSize(size)
    doc.text(p.text, { continued: i < parts.length - 1, lineGap, width: CONTENT_W })
  }
  doc.moveDown(0.2)
}

const tokens = marked.lexer(md)
const firstH1 = tokens.find((t) => t.type === 'heading' && t.depth === 1)
drawCover(customTitle || firstH1?.text || 'Documento 1503')

function renderTokens(tks) {
  for (const tk of tks) {
    switch (tk.type) {
      case 'heading': {
        checkPageBreak(50)
        if (tk.depth === 1) {
          doc.moveDown(0.3)
          doc.fillColor(DARK).font('Helvetica-Bold').fontSize(14)
          doc.text(tk.text, ML, doc.y, { width: CONTENT_W, lineGap: 2 })
          doc.moveTo(ML, doc.y + 1).lineTo(ML + 40, doc.y + 1).lineWidth(2).strokeColor(CYAN).stroke()
          doc.moveDown(0.3)
        } else if (tk.depth === 2) {
          doc.moveDown(0.25)
          doc.fillColor(CYAN).font('Helvetica-Bold').fontSize(11.5)
          doc.text(tk.text, ML, doc.y, { width: CONTENT_W, lineGap: 1 })
          doc.moveDown(0.2)
        } else if (tk.depth === 3) {
          doc.moveDown(0.2)
          doc.fillColor(DARK).font('Helvetica-Bold').fontSize(10)
          doc.text(tk.text, ML, doc.y, { width: CONTENT_W, lineGap: 1 })
          doc.moveDown(0.15)
        } else {
          doc.moveDown(0.15)
          doc.fillColor(GRAY).font('Helvetica-Bold').fontSize(9)
          doc.text(tk.text, ML, doc.y, { width: CONTENT_W })
          doc.moveDown(0.1)
        }
        break
      }
      case 'paragraph': {
        checkPageBreak(25)
        renderParagraph(tk.text)
        break
      }
      case 'list': {
        checkPageBreak(25)
        const ordered = tk.ordered
        let idx = 1
        for (const item of tk.items) {
          checkPageBreak(15)
          const bullet = ordered ? `${idx}.` : '•'
          const itemY = doc.y
          // Bullet a la izquierda
          doc.fillColor(CYAN).font('Helvetica-Bold').fontSize(8.5)
          doc.text(bullet, ML, itemY, { width: 14, lineBreak: false })
          // Texto del item con indent
          const textContent = item.tokens.map((t) => (t.type === 'text' ? t.text : t.raw || '')).join(' ')
          doc.x = ML + 16
          renderParagraph(textContent, { size: 8.5, lineGap: 1 })
          doc.x = ML
          idx++
        }
        doc.moveDown(0.15)
        break
      }
      case 'code': {
        const lines = tk.text.split('\n')
        const lineHeight = 9
        const padding = 4
        let i = 0
        while (i < lines.length) {
          checkPageBreak(40)
          const availableH = BOTTOM_LIMIT - doc.y - 5
          const linesPerPage = Math.max(1, Math.floor((availableH - 2 * padding) / lineHeight))
          const chunk = lines.slice(i, i + linesPerPage)
          const blockH = chunk.length * lineHeight + 2 * padding
          const startY = doc.y
          doc.rect(ML, startY, CONTENT_W, blockH).fillColor(CODE_BG).fill()
          doc.fillColor(DARK).font('Courier').fontSize(7)
          let y = startY + padding
          for (const ln of chunk) {
            doc.text(ln.slice(0, 140), ML + 4, y, { width: CONTENT_W - 8, lineBreak: false })
            y += lineHeight
          }
          doc.y = startY + blockH + 3
          i += linesPerPage
        }
        doc.moveDown(0.15)
        break
      }
      case 'blockquote': {
        checkPageBreak(25)
        const startY = doc.y
        doc.fillColor(GRAY).font('Helvetica-Oblique').fontSize(8.5)
        const inner = tk.tokens.map((t) => cleanInline(t.text || t.raw || '')).join(' ')
        doc.text(inner, ML + 8, startY, { width: CONTENT_W - 8, lineGap: 1 })
        const endY = doc.y
        doc.rect(ML, startY, 2, endY - startY).fillColor(CYAN).fill()
        doc.moveDown(0.2)
        break
      }
      case 'hr': {
        checkPageBreak(10)
        doc.moveTo(ML, doc.y + 2).lineTo(MR, doc.y + 2).lineWidth(0.4).strokeColor(TABLE_BORDER).stroke()
        doc.moveDown(0.3)
        break
      }
      case 'table': {
        renderTable(tk)
        break
      }
      case 'space': {
        doc.moveDown(0.1)
        break
      }
      default:
        break
    }
  }
}

function renderTable(tk) {
  const cols = tk.header.length
  const colW = CONTENT_W / cols
  const headerH = 16
  const fontSize = cols <= 3 ? 7.5 : cols <= 5 ? 7 : 6.5
  const lineHeight = fontSize + 1.5

  // Calcular altura header (single line)
  const headerStartY = doc.y
  checkPageBreak(headerH + 20)

  // Re-leer headerStartY tras posible page break
  const headerY = doc.y
  doc.rect(ML, headerY, CONTENT_W, headerH).fillColor(TABLE_HEADER_BG).fill()
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(fontSize)
  for (let c = 0; c < cols; c++) {
    const headerText = cleanInline(tk.header[c]?.text || '')
    doc.text(headerText, ML + c * colW + 3, headerY + 4, { width: colW - 6, height: headerH - 4, ellipsis: true, lineBreak: false })
  }
  doc.y = headerY + headerH

  // Filas
  for (const row of tk.rows) {
    // Calcular altura dinámica fila (max 4 líneas)
    const cellTexts = []
    let maxLines = 1
    for (let c = 0; c < cols; c++) {
      const txt = cleanInline(row[c]?.text || '')
      cellTexts.push(txt)
      // Estimación líneas: chars / chars-per-line del column
      const charsPerLine = Math.max(15, Math.floor((colW - 6) / (fontSize * 0.55)))
      const lines = Math.min(4, Math.ceil(txt.length / charsPerLine))
      if (lines > maxLines) maxLines = lines
    }
    const rowH = Math.max(12, maxLines * lineHeight + 4)
    checkPageBreak(rowH + 4)
    const rowStartY = doc.y
    for (let c = 0; c < cols; c++) {
      doc.rect(ML + c * colW, rowStartY, colW, rowH).lineWidth(0.25).strokeColor(TABLE_BORDER).stroke()
      doc.fillColor(DARK).font('Helvetica').fontSize(fontSize)
      doc.text(cellTexts[c], ML + c * colW + 3, rowStartY + 3, { width: colW - 6, height: rowH - 5, ellipsis: true, lineGap: 0.5 })
    }
    doc.y = rowStartY + rowH
  }
  doc.moveDown(0.2)
}

renderTokens(tokens)

drawFooter()
doc.end()

console.log(`✓ PDF generado: ${OUT}`)
