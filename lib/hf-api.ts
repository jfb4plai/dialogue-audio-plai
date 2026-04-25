import { Speaker, GenerateResult } from '@/types/dialogue'

const HF_URL = process.env.NEXT_PUBLIC_HF_SPACE_URL || ''

export async function fetchVoices() {
  const res = await fetch(`${HF_URL}/voices`)
  if (!res.ok) throw new Error('Cannot fetch voices')
  return res.json()
}

// Via Vercel proxy — pour dialogues courts (< 60 répliques)
export async function callHFSpace({
  script, speakers, silence_ms, item_title, onProgress,
}: {
  script: string
  speakers: Speaker[]
  silence_ms: number
  item_title: string
  onProgress?: (msg: string) => void
}): Promise<GenerateResult> {
  onProgress?.('Connexion au serveur TTS...')
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, speakers, silence_ms, item_title }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur serveur' }))
    throw new Error(err.error || 'Erreur de génération')
  }
  return res.json()
}

// Direct vers HF Space — pour podcasts longs (contourne le timeout Vercel 60s)
export async function callHFSpaceDirect({
  script, speakers, silence_ms, item_title, onProgress,
}: {
  script: string
  speakers: Speaker[]
  silence_ms: number
  item_title: string
  onProgress?: (msg: string) => void
}): Promise<GenerateResult> {
  if (!HF_URL) throw new Error('URL HF Space non configurée')
  onProgress?.('Connexion au serveur TTS (mode podcast)...')

  const res = await fetch(`${HF_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ script, speakers, silence_ms, item_title }),
    // Pas de timeout côté browser — peut attendre 2-3 min si nécessaire
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erreur serveur TTS' }))
    throw new Error(err.error || 'Erreur de génération podcast')
  }
  return res.json()
}
