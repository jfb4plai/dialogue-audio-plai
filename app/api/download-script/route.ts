import { NextRequest, NextResponse } from 'next/server'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { script, title } = body as { script: string; title?: string }

  if (!script || typeof script !== 'string') {
    return NextResponse.json({ error: 'Script manquant.' }, { status: 400 })
  }

  const lines = script.split('\n').filter(l => l.trim())

  const docTitle = title ?? 'Script audio PLAI'

  const paragraphs = [
    new Paragraph({
      text: docTitle,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    }),
    ...lines.map(line => {
      // Format : "A: texte" — mettre le préfixe en gras
      const match = line.match(/^([A-D]):\s*(.*)$/)
      if (match) {
        return new Paragraph({
          children: [
            new TextRun({ text: `${match[1]}: `, bold: true }),
            new TextRun({ text: match[2] }),
          ],
          spacing: { after: 120 },
        })
      }
      return new Paragraph({ text: line, spacing: { after: 120 } })
    }),
  ]

  const doc = new Document({ sections: [{ children: paragraphs }] })
  const buffer = await Packer.toBuffer(doc)
  const uint8 = new Uint8Array(buffer)

  const filename = docTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.docx'

  return new NextResponse(uint8, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
