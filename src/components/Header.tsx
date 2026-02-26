import { formatTime } from '../utils/timeUtils'

interface HeaderProps {
  lastUpdated: Date | null
  onRefresh: () => void
}

export default function Header({ lastUpdated, onRefresh }: HeaderProps) {
  return (
    <header className="bg-maroon text-white shadow-md">
      <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">
            UMN Event Parking
          </h1>
          <p className="text-xs mt-1 text-white/60">
            {lastUpdated
              ? `Updated ${formatTime(lastUpdated)}`
              : 'Loading…'}
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-full hover:bg-white/15 active:bg-white/25 transition-colors"
          aria-label="Refresh calendar data"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
