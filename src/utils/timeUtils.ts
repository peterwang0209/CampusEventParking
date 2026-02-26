import type { EventStatus, ParkingEvent, ViewMode } from '../types/parking'

export const CHICAGO_TZ = 'America/Chicago'

// ---------------------------------------------------------------------------
// Timezone conversion
// ---------------------------------------------------------------------------

/**
 * Convert a "wall clock" local time in an IANA timezone to a UTC-epoch Date.
 *
 * Algorithm (Intl offset-reversal):
 *   1. Pretend the target local time IS UTC → guessUTC
 *   2. Ask Intl what wall-clock the target TZ shows for guessUTC
 *   3. The difference is the UTC offset → subtract it from guessUTC
 */
export function localToUTC(
  year: number,
  month: number, // 0-indexed
  day: number,
  hour: number,
  minute: number,
  second: number,
  tzid: string,
): Date {
  const guessUTC = Date.UTC(year, month, day, hour, minute, second)

  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tzid,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  })

  const parts = fmt.formatToParts(new Date(guessUTC))
  const get = (type: string) =>
    +(parts.find((p) => p.type === type)?.value ?? '0')

  // Intl occasionally returns 24 for midnight when hour12:false
  const tzHour = get('hour') % 24
  const tzWallAsUTC = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    tzHour,
    get('minute'),
    get('second'),
  )

  // offset = guessUTC – tzWall (both expressed as UTC ms)
  return new Date(guessUTC + (guessUTC - tzWallAsUTC))
}

/** Midnight (00:00:00) of the given date in America/Chicago, as a UTC Date. */
function getChicagoDateParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TZ,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)
  const get = (t: string) =>
    +(parts.find((p) => p.type === t)?.value ?? '0')
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
  }
}

/** Midnight (00:00:00) of the given date in America/Chicago, as a UTC Date. */
export function getChicagoMidnight(date: Date = new Date(), dayOffset = 0): Date {
  const { year, month, day } = getChicagoDateParts(date)
  return localToUTC(year, month - 1, day + dayOffset, 0, 0, 0, CHICAGO_TZ)
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** "12:00 PM" in Chicago time */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/** "Mon, Sep 1" in Chicago time */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export function getEventStatus(
  start: Date,
  end: Date,
  now: Date = new Date(),
): EventStatus {
  const nowMs = now.getTime()
  if (nowMs >= start.getTime() && nowMs <= end.getTime()) {
    return { kind: 'active', endsInMs: end.getTime() - nowMs }
  }
  if (nowMs < start.getTime()) {
    return { kind: 'upcoming', startsInMs: start.getTime() - nowMs }
  }
  return { kind: 'ended' }
}

/** Human-readable duration, e.g. "2h 15m" or "45m" */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000)
  if (totalMinutes < 1) return '<1m'
  if (totalMinutes < 60) return `${totalMinutes}m`
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// ---------------------------------------------------------------------------
// Filtering
// ---------------------------------------------------------------------------

export function filterEvents(
  events: ParkingEvent[],
  view: ViewMode,
  now: Date = new Date(),
): ParkingEvent[] {
  switch (view) {
    case 'now':
      return events.filter(
        (e) => e.start.getTime() <= now.getTime() && e.end.getTime() >= now.getTime(),
      )

    case 'today': {
      const todayStart = getChicagoMidnight(now)
      const todayEnd = getChicagoMidnight(now, 1)
      return events.filter(
        (e) => e.start.getTime() < todayEnd.getTime() && e.end.getTime() > todayStart.getTime(),
      )
    }

    case 'upcoming': {
      const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      return events.filter(
        (e) => e.start.getTime() > now.getTime() && e.start.getTime() <= sevenDays.getTime(),
      )
    }
  }
}
