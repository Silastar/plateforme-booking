import 'server-only'
import PDFDocument from 'pdfkit'

import type { PlotItem } from '@/db/schema'

import { PLOT_COLS, PLOT_ROWS, type Check, type MonitorMix, type PatchRow } from './rider-core'

export type PdfData = {
  site: string
  bandName: string
  configName: string
  statsLine: string
  labels: {
    rider: string
    patch: string
    cols: [string, string, string, string, string]
    plot: string
    audience: string
    monitors: string
    hosp: string
    general: string
    bring: string
    match: string
    generated: string
  }
  rows: (PatchRow & { micLabel: string; standLabel: string })[]
  plot: PlotItem[]
  mixes: (MonitorMix & { kindLabel: string; note?: string; title: string })[]
  iemNote: string | null
  hosp: [string, string][]
  general: [string, string][]
  bring: string[]
  match: {
    title: string
    lines: { text: string; status: Check['status']; statusText: string }[]
  } | null
}

const RED = '#8f1414'
const INK = '#0c0b0a'
const SOFT = '#4a453d'
const LINE = '#b9af98'

// Fiche technique en PDF A4 (polices standard : pas de pictogrammes, que du texte).
export function riderPdf(d: PdfData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
    info: { Title: `${d.labels.rider} · ${d.bandName}` },
  })
  const chunks: Buffer[] = []
  doc.on('data', (c: Buffer) => chunks.push(c))
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))))

  const left = doc.page.margins.left
  const width = doc.page.width - left - doc.page.margins.right
  const bottom = () => doc.page.height - doc.page.margins.bottom - 20
  const ensure = (h: number) => {
    if (doc.y + h > bottom()) doc.addPage()
  }
  const heading = (text: string) => {
    ensure(40)
    doc.moveDown(0.8)
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor(INK)
      .text(text.toUpperCase(), left, doc.y, { characterSpacing: 0.5 })
    const y = doc.y + 2
    doc
      .moveTo(left, y)
      .lineTo(left + width, y)
      .lineWidth(1.5)
      .strokeColor(INK)
      .stroke()
    doc.y = y + 6
  }

  // En-tête
  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(RED)
    .text(d.labels.rider.toUpperCase(), { characterSpacing: 1 })
  doc.font('Helvetica-Bold').fontSize(24).fillColor(INK).text(d.bandName)
  doc.font('Helvetica').fontSize(11).fillColor(SOFT).text(`${d.configName} · ${d.statsLine}`)

  // Liste des entrées
  if (d.rows.length) {
    heading(d.labels.patch)
    const cols = [28, width * 0.32, width * 0.22, width * 0.2]
    cols.push(width - cols.reduce((a, b) => a + b, 0))
    const drawRow = (cells: string[], bold: boolean, color = INK) => {
      ensure(18)
      const y = doc.y
      let x = left
      cells.forEach((c, i) => {
        doc
          .font(bold || i === 1 ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(bold ? 8 : 10)
          .fillColor(i === 0 && !bold ? RED : color)
          .text(c, x + 2, y + 4, {
            width: cols[i] - 4,
            height: 12,
            ellipsis: true,
            lineBreak: false,
          })
        x += cols[i]
      })
      doc.y = y + 17
      doc
        .moveTo(left, doc.y)
        .lineTo(left + width, doc.y)
        .lineWidth(0.5)
        .strokeColor(LINE)
        .stroke()
    }
    drawRow(
      d.labels.cols.map((c) => c.toUpperCase()),
      true,
      SOFT,
    )
    d.rows.forEach((r, i) =>
      drawRow([String(i + 1), r.source, r.micLabel, r.standLabel, r.memberName], false),
    )
  }

  // Plan de scène
  if (d.plot.length) {
    heading(d.labels.plot)
    const h = width / 2
    ensure(h + 30)
    const top = doc.y + 4
    const cw = width / PLOT_COLS
    const ch = h / PLOT_ROWS
    doc.rect(left, top, width, h).lineWidth(1.5).strokeColor(INK).stroke()
    for (let i = 1; i < PLOT_COLS; i++)
      doc
        .moveTo(left + i * cw, top)
        .lineTo(left + i * cw, top + h)
        .lineWidth(0.3)
        .strokeColor('#ddd5c0')
        .stroke()
    for (let j = 1; j < PLOT_ROWS; j++)
      doc
        .moveTo(left, top + j * ch)
        .lineTo(left + width, top + j * ch)
        .lineWidth(0.3)
        .strokeColor('#ddd5c0')
        .stroke()
    const fill: Record<PlotItem['kind'], string> = {
      member: '#e8352d',
      riser: '#e9e2d0',
      object: '#f5b82e',
      wedge: '#ffffff',
      power: '#ffffff',
      note: '#ffffff',
    }
    for (const p of d.plot) {
      const x = left + p.x * cw + 2
      const y = top + p.y * ch + 2
      const w = p.w * cw - 4
      const hh = p.h * ch - 4
      doc.rect(x, y, w, hh).lineWidth(1).fillAndStroke(fill[p.kind], INK)
      doc
        .font('Helvetica-Bold')
        .fontSize(7)
        .fillColor(p.kind === 'member' ? '#ffffff' : INK)
        .text(p.label.toUpperCase(), x + 2, y + hh / 2 - 8, {
          width: w - 4,
          height: 18,
          align: 'center',
        })
    }
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(SOFT)
      .text(d.labels.audience.toUpperCase(), left, top + h + 6, {
        width,
        align: 'center',
        characterSpacing: 3,
      })
    doc.x = left
  }

  const list = (lines: string[]) => {
    for (const line of lines) {
      ensure(16)
      doc.font('Helvetica').fontSize(10).fillColor(INK).text(`•  ${line}`, left, doc.y, { width })
    }
  }
  const facts = (rows: [string, string][]) => {
    for (const [k, v] of rows) {
      ensure(16)
      const y = doc.y
      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(SOFT)
        .text(k.toUpperCase(), left, y + 1, { width: 150 })
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(INK)
        .text(v, left + 160, y, { width: width - 160 })
      doc.y = Math.max(doc.y, y + 14)
    }
  }

  if (d.mixes.length || d.iemNote) {
    heading(d.labels.monitors)
    list(d.mixes.map((m) => `${m.title} : ${m.kindLabel}${m.note ? ` · ${m.note}` : ''}`))
    if (d.iemNote) {
      doc.moveDown(0.3)
      doc.font('Helvetica').fontSize(10).fillColor(INK).text(d.iemNote, left, doc.y, { width })
    }
  }
  if (d.hosp.length) {
    heading(d.labels.hosp)
    facts(d.hosp)
  }
  heading(d.labels.general)
  facts(d.general)
  if (d.bring.length) {
    heading(d.labels.bring)
    list(d.bring)
  }
  if (d.match) {
    heading(`${d.labels.match} · ${d.match.title}`)
    const color = { ok: INK, sub: SOFT, missing: RED, unknown: SOFT }
    for (const l of d.match.lines) {
      ensure(16)
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(color[l.status])
        .text(`${l.text} · ${l.statusText}`, left, doc.y, { width })
    }
  }

  // Pied de page sur chaque page
  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    // Sous la marge du bas : sans ça, pdfkit ouvrirait une nouvelle page.
    doc.page.margins.bottom = 0
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(SOFT)
      .text(
        `${d.site} · ${d.labels.generated} · ${i + 1}/${range.count}`,
        left,
        doc.page.height - 30,
        {
          width,
          align: 'center',
          lineBreak: false,
        },
      )
  }
  doc.end()
  return done
}
