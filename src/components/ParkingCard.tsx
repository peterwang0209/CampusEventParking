import type { EventStatus, ParkingEvent } from '../types/parking'
import { formatDate, formatTime } from '../utils/timeUtils'
import StatusBadge from './StatusBadge'

interface ParkingCardProps {
  event: ParkingEvent
  rampName: string   // single lot name for this card
  status: EventStatus
}

export default function ParkingCard({ event, rampName, status }: ParkingCardProps) {
  const isActive = status.kind === 'active'

  return (
    <article
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${
        isActive ? 'border-green-300' : 'border-gray-200'
      }`}
    >
      {/* Accent stripe */}
      {isActive && <div className="h-1 bg-green-400" />}

      <div className="p-4">
        {/* Row 1: Ramp name (title) + price */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 text-base leading-snug">
              {rampName}
            </h2>
            {event.eventName && (
              <p className="text-sm text-gray-500 mt-0.5">
                {event.eventName}
              </p>
            )}
          </div>

          {event.eventRate && (
            <span className="shrink-0 px-3 py-1 rounded-full text-sm font-bold bg-gold/25 text-maroon-dark">
              {event.eventRate}
            </span>
          )}
        </div>

        {/* Row 2: Date + time range */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <svg
            className="w-4 h-4 shrink-0 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            {formatDate(event.start)} · {formatTime(event.start)} – {formatTime(event.end)}
          </span>
        </div>

        {/* Row 3: Status badge */}
        <StatusBadge status={status} />
      </div>
    </article>
  )
}
