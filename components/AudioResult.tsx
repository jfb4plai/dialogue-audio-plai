'use client'
import { GenerateResult } from '@/types/dialogue'

interface Props {
  result: GenerateResult
}

export default function AudioResult({ result }: Props) {
  const downloadQR = () => {
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${result.qr_base64}`
    link.download = 'dialogue-qr.png'
    link.click()
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(result.audio_url)
    alert('Lien copié !')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Audio généré — {result.duration_seconds}s
      </h2>

      {/* Audio player — base64 pour lecture immédiate, URL IA pour le lien permanent */}
      <audio
        controls
        className="w-full mb-4"
        src={result.audio_data ? `data:audio/mpeg;base64,${result.audio_data}` : result.audio_url}
      />
      <p className="text-xs text-amber-600 mb-3">
        ⏳ Le lien QR code devient actif ~10 minutes après la génération (délai Internet Archive).
      </p>

      {/* QR code */}
      <div className="flex flex-col items-center mb-4">
        <img
          src={`data:image/png;base64,${result.qr_base64}`}
          alt="QR code audio"
          className="w-48 h-48 border border-gray-200 rounded-lg"
        />
        <p className="text-xs text-gray-400 mt-1">Scannez pour écouter l&apos;audio</p>
      </div>

      {/* Segment list */}
      <div className="mb-4 text-sm text-gray-600">
        <p className="font-medium mb-1">Répliques :</p>
        <ul className="space-y-0.5">
          {result.segments.map(s => (
            <li key={s.index}>
              <span className="font-semibold">{s.speaker}</span> ({s.voice.split('-')[1]}) — {s.duration}s
            </li>
          ))}
        </ul>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <a
          href={result.audio_url}
          download="dialogue.mp3"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Télécharger MP3
        </a>
        <button
          onClick={downloadQR}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          Télécharger QR PNG
        </button>
        <button
          onClick={copyLink}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          Copier le lien
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Audio généré avec Piper TTS — licence MIT — open source
      </p>
    </div>
  )
}
