import type { EventStatus } from '../types/parking'
import { formatDuration } from '../utils/timeUtils'

interface StatusBadgeProps {
  status: EventStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (status.kind === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Active · ends in {formatDuration(status.endsInMs)}
      </span>
    )
  }

  if (status.kind === 'upcoming') {
    const mins = Math.floor(status.startsInMs / 60_000)
    if (mins < 60) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Starts in {mins}m
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Starts in {formatDuration(status.startsInMs)}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      Ended
    </span>
  )
}
