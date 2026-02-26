import type { ViewMode } from '../types/parking'

interface ViewToggleProps {
  view: ViewMode
  onChange: (v: ViewMode) => void
}

const TABS: { value: ViewMode; label: string }[] = [
  { value: 'now',      label: '🟢 Now' },
  { value: 'today',    label: 'Today' },
  { value: 'upcoming', label: 'Next 7 Days' },
]

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="mt-4 flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 gap-1">
      {TABS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${
            view === value
              ? 'bg-maroon text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
