'use client'

interface Props {
  value: number
  onChange: (ms: number) => void
}

export default function SilenceSlider({ value, onChange }: Props) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Silence entre répliques : <span className="font-bold">{value} ms</span>
      </label>
      <input
        type="range"
        min={200}
        max={1000}
        step={50}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>200 ms</span>
        <span>1000 ms</span>
      </div>
    </div>
  )
}
