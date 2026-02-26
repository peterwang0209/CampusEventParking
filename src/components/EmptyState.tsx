import type { ViewMode } from '../types/parking'

const MESSAGES: Record<ViewMode, { title: string; body: string }> = {
  now:      { title: 'No active event parking',     body: 'There are no event parking sessions in progress right now.' },
  today:    { title: 'No event parking today',      body: 'No event parking sessions are scheduled for today.' },
  upcoming: { title: 'Nothing in the next 7 days',  body: 'No event parking sessions are scheduled in the next 7 days.' },
}

export default function EmptyState({ view }: { view: ViewMode }) {
  const { title, body } = MESSAGES[view]
  return (
    <div className="mt-16 flex flex-col items-center text-center px-8">
      <span className="text-6xl mb-4" role="img" aria-label="Parking">🅿️</span>
      <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>
      <p className="text-gray-400 text-sm mt-1">{body}</p>
    </div>
  )
}
