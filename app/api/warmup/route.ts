import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Réservé aux appels Vercel Cron — rejette tout appel externe
  const isCron = req.headers.get('x-vercel-cron') === '1'
  if (!isCron) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const hfUrl = process.env.HF_SPACE_URL
  if (!hfUrl) {
    return NextResponse.json({ error: 'HF_SPACE_URL non défini' }, { status: 500 })
  }

  try {
    const res = await fetch(`${hfUrl}/queue/status`, {
      method: 'GET',
      signal: AbortSignal.timeout(10_000),
    })
    return NextResponse.json({ ok: true, status: res.status })
  } catch (e) {
    // Échec silencieux — le Space était peut-être déjà actif ou temporairement indisponible
    const msg = e instanceof Error ? e.message : 'unknown'
    return NextResponse.json({ ok: false, error: msg }, { status: 200 })
  }
}
