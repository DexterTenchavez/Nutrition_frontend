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

const makeCell = (text, { bold = false, size = 20 } = {}) => {
  return new TableCell({
    width: { size: 20, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
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

const makeTable = (headers, body, { boldLastRow = true, cellFontSize = 20 } = {}) => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => makeCell(h, { bold: true, size: cellFontSize })),
  })

  const bodyRows = body.map((row, i) => {
    const bold = boldLastRow && i === body.length - 1
    return new TableRow({
      children: row.map((cell) => makeCell(cell, { bold, size: cellFontSize })),
    })
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  })
}

const makeSignatureBlock = (sig) => {
  const labelRun = new TextRun({ text: `${sig.label}`, bold: true, size: 20 })
  const nameRun = new TextRun({ text: `  ${sig.name || '________________'}`, size: 20 })
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
    sigs.forEach((s) => {
      paras.push(...makeSignatureBlock(s))
    })
    return paras
  }

  const leftCell = new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    children: cellChildren(left),
  })

  const rightCell = new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    children: cellChildren(right),
  })

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [leftCell, rightCell] })],
  })
}

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
  orientation = 'portrait',
}) => {
  const logoRes = await fetch(nutritionLogo)
  const logoData = new Uint8Array(await logoRes.arrayBuffer())

  const children = []

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

  if ((signatures.left && signatures.left.length > 0) || (signatures.right && signatures.right.length > 0)) {
    children.push(new Paragraph({ spacing: { after: 250 }, children: [] }))
    children.push(makeSignaturesTable(signatures))
  }

  const pageSize =
    orientation === 'landscape'
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
  saveAs(blob, fileName.endsWith('.docx') ? fileName : `${fileName}.docx`)
}
