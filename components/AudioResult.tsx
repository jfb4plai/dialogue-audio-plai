'use client'
import { useEffect, useRef, useState } from 'react'
import { GenerateResult } from '@/types/dialogue'

interface Props { result: GenerateResult }

function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onTime = () => setCurrentTime(a.currentTime)
    const onMeta = () => setDuration(a.duration)
    const onEnd = () => setPlaying(false)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('ended', onEnd)
    }
  }, [])

  const togglePlay = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  const seek = (v: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = v
    setCurrentTime(v)
  }

  const changeSpeed = (v: number) => {
    const a = audioRef.current
    if (!a) return
    a.playbackRate = v
    setSpeed(v)
  }

  const changeVolume = (v: number) => {
    const a = audioRef.current
    if (!a) return
    a.volume = v
    setVolume(v)
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-jfb-subtil border border-jfb-bordure p-4 space-y-3" style={{ borderRadius: '2px' }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Progress bar */}
      <div className="flex items-center gap-2 text-xs text-jfb-gris">
        <span className="w-8 text-right">{fmt(currentTime)}</span>
        <input
          type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
          onChange={e => seek(Number(e.target.value))}
          className="flex-1 accent-jfb-rose"
        />
        <span className="w-8">{fmt(duration)}</span>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-4 flex-wrap">

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 bg-jfb-noir text-white flex items-center justify-center hover:bg-jfb-noir-doux text-lg flex-shrink-0"
          style={{ borderRadius: '2px' }}
          aria-label={playing ? 'Pause' : 'Lecture'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        {/* Speed */}
        <div className="flex items-center gap-2 flex-1 min-w-40">
          <span className="text-xs text-jfb-gris w-16 flex-shrink-0">Vitesse {speed.toFixed(1)}×</span>
          <input
            type="range" min={0.5} max={2} step={0.1} value={speed}
            onChange={e => changeSpeed(Number(e.target.value))}
            className="flex-1 accent-jfb-rose"
          />
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 flex-1 min-w-36">
          <span className="text-xs text-jfb-gris w-14 flex-shrink-0">
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'} {Math.round(volume * 100)}%
          </span>
          <input
            type="range" min={0} max={1} step={0.05} value={volume}
            onChange={e => changeVolume(Number(e.target.value))}
            className="flex-1 accent-jfb-rose"
          />
        </div>

        {/* Speed presets */}
        <div className="flex gap-1">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`px-2 py-0.5 text-xs font-medium ${
                speed === s ? 'bg-jfb-noir text-white' : 'bg-jfb-subtil text-jfb-gris hover:bg-jfb-beige border border-jfb-bordure'
              }`}
            style={{ borderRadius: '2px' }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AudioResult({ result }: Props) {
  const downloadQR = () => {
    if (!result.qr_base64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${result.qr_base64}`
    link.download = 'dialogue-qr.png'
    link.click()
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(result.audio_url)
    alert('Lien copié !')
  }

  const audioSrc = result.audio_data
    ? `data:audio/mpeg;base64,${result.audio_data}`
    : result.audio_url

  // Après F5, audio_data est absent — Internet Archive met ~10 min à activer l'URL
  const TEN_MINUTES = 10 * 60 * 1000
  const isRecentWithoutData = !result.audio_data && result.generated_at
    && (Date.now() - new Date(result.generated_at).getTime()) < TEN_MINUTES

  return (
    <div className="bg-white border border-jfb-bordure p-6 mt-6" style={{ borderRadius: '2px', borderLeft: '3px solid #FF3399' }}>
      <h2 className="text-lg font-semibold text-jfb-noir mb-4">
        Audio généré — {result.duration_seconds != null ? (() => {
          const s = Math.round(result.duration_seconds as number)
          return s >= 60 ? `${Math.floor(s/60)} min ${s%60} s` : `${s} s`
        })() : '—'}
      </h2>

      <AudioPlayer src={audioSrc} />

      {isRecentWithoutData && (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2" style={{ borderRadius: '2px' }}>
          La page a été rechargée peu après la génération. L&apos;audio et le QR code deviennent actifs ~10 minutes après la génération (délai Internet Archive). Revenez dans quelques minutes et rechargez.
        </div>
      )}

      <p className="text-xs text-amber-600 mt-3 mb-3">
        ⏳ Le lien QR code devient actif ~10 minutes après la génération (délai Internet Archive).
      </p>

      {/* QR code */}
      <div className="flex flex-col items-center mb-4">
        {result.qr_base64 ? (
          <img
            src={`data:image/png;base64,${result.qr_base64}`}
            alt="QR code audio"
            className="w-48 h-48 border border-jfb-bordure" style={{ borderRadius: '2px' }}
          />
        ) : (
          <div className="w-48 h-48 border border-jfb-bordure flex items-center justify-center bg-jfb-subtil" style={{ borderRadius: '2px' }}>
            <span className="text-xs text-jfb-gris text-center px-4">
              {result.audio_url
                ? 'QR code en cours de génération…'
                : 'QR code indisponible — l\'upload Internet Archive a échoué. L\'audio est accessible localement via le lecteur ci-dessus.'}
            </span>
          </div>
        )}
        <p className="text-xs text-jfb-gris mt-2 text-center">
          Vos élèves scannent ce code avec l&apos;appareil photo de leur téléphone pour écouter l&apos;audio directement — sans application, sans compte.
        </p>
      </div>

      {/* Segments */}
      <div className="mb-4 text-sm text-jfb-gris">
        <p className="font-medium mb-1 text-jfb-noir">Répliques :</p>
        <ul className="space-y-0.5">
          {result.segments.map(s => {
            // Edge TTS: 'nl-BE-DenaNeural' → 'DenaNeural' ; Gemini: 'Aoede' → 'Aoede'
            const voiceLabel = s.voice.includes('-')
              ? s.voice.split('-').slice(2).join('-').replace('Neural', '') || s.voice
              : s.voice
            return (
              <li key={s.index}>
                <span className="font-semibold">{s.speaker}</span> ({voiceLabel}) — {s.duration}s
              </li>
            )
          })}
        </ul>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        {result.audio_url ? (
          <a
            href={`/api/download?url=${encodeURIComponent(result.audio_url)}`}
            download="dialogue.mp3"
            className="px-4 py-2 bg-jfb-noir text-white text-sm font-medium hover:bg-jfb-noir-doux" style={{ borderRadius: '2px' }}
          >
            Télécharger MP3
          </a>
        ) : (
          <span
            title="Lien indisponible — Internet Archive n'a pas pu recevoir le fichier. Régénérez le dialogue pour obtenir un lien de partage."
            className="px-4 py-2 bg-jfb-subtil text-jfb-gris border border-jfb-bordure text-sm font-medium cursor-not-allowed opacity-50" style={{ borderRadius: '2px' }}
          >
            Télécharger MP3
          </span>
        )}
        <button onClick={downloadQR}
          disabled={!result.qr_base64}
          className="px-4 py-2 bg-jfb-subtil text-jfb-gris border border-jfb-bordure text-sm font-medium hover:bg-jfb-beige disabled:opacity-50 disabled:cursor-not-allowed" style={{ borderRadius: '2px' }}>
          Télécharger QR PNG
        </button>
        <button onClick={copyLink}
          disabled={!result.audio_url}
          title={!result.audio_url ? 'Lien indisponible' : undefined}
          className="px-4 py-2 bg-jfb-subtil text-jfb-gris border border-jfb-bordure text-sm font-medium hover:bg-jfb-beige disabled:opacity-50 disabled:cursor-not-allowed" style={{ borderRadius: '2px' }}>
          Copier le lien
        </button>
      </div>

    </div>
  )
}
