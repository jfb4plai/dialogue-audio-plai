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
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Progress bar */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="w-8 text-right">{fmt(currentTime)}</span>
        <input
          type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
          onChange={e => seek(Number(e.target.value))}
          className="flex-1 accent-blue-600"
        />
        <span className="w-8">{fmt(duration)}</span>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-4 flex-wrap">

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 text-lg flex-shrink-0"
          aria-label={playing ? 'Pause' : 'Lecture'}
        >
          {playing ? '⏸' : '▶'}
        </button>

        {/* Speed */}
        <div className="flex items-center gap-2 flex-1 min-w-40">
          <span className="text-xs text-gray-500 w-16 flex-shrink-0">Vitesse {speed.toFixed(1)}×</span>
          <input
            type="range" min={0.5} max={2} step={0.1} value={speed}
            onChange={e => changeSpeed(Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 flex-1 min-w-36">
          <span className="text-xs text-gray-500 w-14 flex-shrink-0">
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'} {Math.round(volume * 100)}%
          </span>
          <input
            type="range" min={0} max={1} step={0.05} value={volume}
            onChange={e => changeVolume(Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
        </div>

        {/* Speed presets */}
        <div className="flex gap-1">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                speed === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
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

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Audio généré — {result.duration_seconds}s
      </h2>

      <AudioPlayer src={audioSrc} />

      <p className="text-xs text-amber-600 mt-3 mb-3">
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

      {/* Segments */}
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

      {/* Buttons */}
      <div className="flex flex-wrap gap-2">
        <a
          href={result.audio_url} download="dialogue.mp3"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Télécharger MP3
        </a>
        <button onClick={downloadQR}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">
          Télécharger QR PNG
        </button>
        <button onClick={copyLink}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200">
          Copier le lien
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        Audio généré avec Piper TTS — licence MIT — open source
      </p>
    </div>
  )
}
