import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
  PageOrientation,
} from 'docx'
import { saveAs } from 'file-saver'
import nutritionLogo from '../assets/nutritionlogo.jpg'

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

// ---------------------------------------------------------------------------
// Table helpers
// ---------------------------------------------------------------------------

const makeCell = (text, { bold = false, size = 20, widthPct } = {}) => {
  return new TableCell({
    width: widthPct
      ? { size: widthPct, type: WidthType.PERCENTAGE }
      : { size: 20, type: WidthType.PERCENTAGE },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    verticalAlign: 'center',
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: String(text ?? ''), bold, size })],
      }),
    ],
  })
}

const makeTable = (
  headers,
  body,
  { boldLastRow = true, cellFontSize = 20 } = {}
) => {
  const colWidth = Math.floor(100 / headers.length)

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) =>
      makeCell(h, { bold: true, size: cellFontSize, widthPct: colWidth })
    ),
  })

  const bodyRows = body.map((row, i) => {
    const bold = boldLastRow && i === body.length - 1
    return new TableRow({
      children: row.map((cell) =>
        makeCell(cell, { bold, size: cellFontSize, widthPct: colWidth })
      ),
    })
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  })
}

const makeSignatureBlock = (sig) => {
  const labelRun = new TextRun({ text: `${sig.label}`, bold: true, size: 20 })
  const nameRun = new TextRun({
    text: `  ${sig.name || '________________'}`,
    size: 20,
  })
  return [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [labelRun, nameRun],
      spacing: { after: 40 },
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      indent: { left: 700 },
      children: [new TextRun({ text: sig.position || '', size: 20 })],
      spacing: { after: 200 },
    }),
  ]
}

const makeSignaturesTable = (signatures) => {
  const left = signatures.left || []
  const right = signatures.right || []

  const cellChildren = (sigs) => {
    const paras = []
    sigs.forEach((s) => paras.push(...makeSignatureBlock(s)))
    return paras.length ? paras : [new Paragraph({ children: [] })]
  }

  const noBorder = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
  }

  const leftCell = new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: noBorder,
    children: cellChildren(left),
  })

  const rightCell = new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: noBorder,
    children: cellChildren(right),
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [leftCell, rightCell] })],
  })
}

// ---------------------------------------------------------------------------
// Logo loading — resilient. If it fails (flaky mobile connection, etc.)
// the export still proceeds without the logo instead of crashing outright.
// ---------------------------------------------------------------------------

let cachedLogoData = null

const getLogoData = async () => {
  if (cachedLogoData) return cachedLogoData
  try {
    const res = await fetch(nutritionLogo)
    if (!res.ok) throw new Error(`Logo fetch failed: ${res.status}`)
    const buf = await res.arrayBuffer()
    cachedLogoData = new Uint8Array(buf)
    return cachedLogoData
  } catch (err) {
    console.warn('Nutrition logo could not be loaded for the DOCX export:', err)
    return null
  }
}

// ---------------------------------------------------------------------------
// Cross-platform save.
//
// Desktop browsers handle Blob downloads fine via file-saver. Most mobile
// browsers (iOS Safari/Chrome, Android in-app webviews) do NOT reliably
// download blobs — they'll often just try to open/render the raw bytes,
// which is why the "same" exported file looks broken/different on phone.
// The fix is to hand the file to the OS share sheet via the Web Share API
// when available, which lets the user save it properly (Files / Drive /
// WhatsApp / etc). We fall back to saveAs everywhere else.
// ---------------------------------------------------------------------------

const isMobileDevice = () =>
  typeof navigator !== 'undefined' &&
  /iphone|ipad|ipod|android/i.test(navigator.userAgent)

const saveDocxBlob = async (blob, rawFileName) => {
  const fileName = rawFileName.endsWith('.docx')
    ? rawFileName
    : `${rawFileName}.docx`

  if (isMobileDevice() && typeof navigator.canShare === 'function') {
    try {
      const file = new File([blob], fileName, { type: DOCX_MIME })
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: fileName })
        return
      }
    } catch (err) {
      // User cancelled the share sheet — don't fall through to a
      // second save prompt, just stop quietly.
      if (err && err.name === 'AbortError') return
      console.warn('Web Share export failed, falling back to saveAs:', err)
    }
  }

  saveAs(blob, fileName)
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

export const exportReportToDocx = async ({
  govLines = [],
  titleLines = [],
  infoLines = [],
  infoCenter = false,
  headers = [],
  body = [],
  boldLastRow = true,
  cellFontSize = 20,
  signatures = { left: [], right: [] },
  fileName,
  orientation, // 'portrait' | 'landscape' | undefined (auto)
}) => {
  const logoData = await getLogoData()

  const children = []

  if (logoData) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'jpg',
            data: logoData,
            transformation: { width: 90, height: 90 },
          }),
        ],
        spacing: { after: 120 },
      })
    )
  }

  govLines.forEach((line) => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [new TextRun({ text: line, bold: true, size: 22 })],
      })
    )
  })

  titleLines.forEach((line, i) => {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: i === titleLines.length - 1 ? 120 : 20 },
        children: [new TextRun({ text: line, bold: true, size: 28 })],
      })
    )
  })

  infoLines.forEach((line) => {
    children.push(
      new Paragraph({
        alignment: infoCenter ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { after: 40 },
        children: [new TextRun({ text: line, size: 22 })],
      })
    )
  })

  if (headers.length > 0) {
    children.push(new Paragraph({ spacing: { after: 120 }, children: [] }))
    children.push(makeTable(headers, body, { boldLastRow, cellFontSize }))
  }

  if (
    (signatures.left && signatures.left.length > 0) ||
    (signatures.right && signatures.right.length > 0)
  ) {
    children.push(new Paragraph({ spacing: { after: 250 }, children: [] }))
    children.push(makeSignaturesTable(signatures))
  }

  // Auto-landscape for wide tables so columns don't get squeezed —
  // unless the caller explicitly asked for a specific orientation.
  const resolvedOrientation =
    orientation || (headers.length > 8 ? 'landscape' : 'portrait')

  const pageSize =
    resolvedOrientation === 'landscape'
      ? { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE }
      : { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
            size: pageSize,
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  await saveDocxBlob(blob, fileName)
}