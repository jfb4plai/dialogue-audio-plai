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
      <label className="block text-sm font-medium text-gray-700 mb-1">Langue</label>
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {Object.entries(voices).map(([locale, cfg]) => (
          <option key={locale} value={locale}>{cfg.name}</option>
        ))}
      </select>
    </div>
  )
}
