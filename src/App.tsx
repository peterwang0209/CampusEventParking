import { useMemo, useState, useEffect } from 'react'
import type { ViewMode } from './types/parking'
import { useParkingEvents } from './hooks/useParkingEvents'
import { filterEvents, getEventStatus } from './utils/timeUtils'
import Header from './components/Header'
import ViewToggle from './components/ViewToggle'
import ParkingCard from './components/ParkingCard'
import EmptyState from './components/EmptyState'

export default function App() {
  const [view, setView] = useState<ViewMode>('now')
  const [now, setNow] = useState(() => new Date())

  // Tick every 60 s so status labels ("ends in X m") stay accurate
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const { events: allEvents, loading, error, lastUpdated, refresh } = useParkingEvents()

  const events = useMemo(
    () => filterEvents(allEvents, view, now),
    [allEvents, view, now],
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lastUpdated={lastUpdated} onRefresh={refresh} />

      <main className="max-w-lg mx-auto px-4 pb-10">
        <ViewToggle view={view} onChange={setView} />

        {/* Loading spinner */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <div className="w-8 h-8 border-4 border-maroon border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading parking calendar…</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="font-semibold text-red-700 text-sm">Could not load calendar data</p>
            <p className="text-red-600 text-xs mt-1 break-all">{error}</p>
            <button
              onClick={refresh}
              className="mt-3 px-4 py-1.5 text-xs font-medium rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && events.length === 0 && (
          <EmptyState view={view} />
        )}

        {/* Event cards — one card per parking lot */}
        {!loading && events.length > 0 && (
          <div className="mt-4 space-y-3">
            {events.flatMap((event) =>
              event.rampNames.map((rampName) => (
                <ParkingCard
                  key={`${event.uid}::${rampName}`}
                  event={event}
                  rampName={rampName}
                  status={getEventStatus(event.start, event.end, now)}
                />
              )),
            )}
          </div>
        )}
      </main>
    </div>
  )
}
