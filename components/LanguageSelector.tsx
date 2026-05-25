'use client'
import { VoicesConfig } from '@/types/dialogue'

interface Props {
  voices: VoicesConfig
  selected: string
  onChange: (locale: string) => void
}

export default function LanguageSelector({ voices, selected, onChange }: Props) {
  return (
    <div className="mb-4">
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-jfb-bordure px-3 py-2 bg-white text-sm text-jfb-noir focus:outline-none focus:ring-2 focus:ring-jfb-rose"
        style={{ borderRadius: '2px' }}
      >
        {Object.entries(voices).map(([locale, cfg]) => (
          <option key={locale} value={locale}>{cfg.name}</option>
        ))}
      </select>
    </div>
  )
}
