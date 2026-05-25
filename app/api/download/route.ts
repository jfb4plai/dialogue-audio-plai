import { NextRequest, NextResponse } from 'next/server'

// Proxy de téléchargement MP3 — contourne la restriction cross-origin des navigateurs
// sur l'attribut download pour les URLs Internet Archive
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'URL manquante' }, { status: 400 })
  }

  // Whitelist : uniquement les URLs Internet Archive
  const isAllowed =
    url.startsWith('https://archive.org/') ||
    url.includes('.archive.org/')
  if (!isAllowed) {
    return NextResponse.json({ error: 'URL non autorisée' }, { status: 403 })
  }

  try {
    const upstream = await fetch(url, { signal: AbortSignal.timeout(30_000) })
    if (!upstream.ok) {
      return NextResponse.json({ error: `Fichier indisponible (${upstream.status})` }, { status: 502 })
    }
    const buffer = await upstream.arrayBuffer()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="dialogue.mp3"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
