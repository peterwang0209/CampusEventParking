export interface ParkingEvent {
  uid: string
  summary: string
  description: string
  location: string
  start: Date
  end: Date
  // Fields parsed from description / location
  rampNames: string[]      // one entry per distinct lot; use to split into cards
  eventRate: string | null
  eventName: string | null
}

export type ViewMode = 'now' | 'today' | 'upcoming'

export type EventStatus =
  | { kind: 'active'; endsInMs: number }
  | { kind: 'upcoming'; startsInMs: number }
  | { kind: 'ended' }
