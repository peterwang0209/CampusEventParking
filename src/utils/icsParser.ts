/**
 * Minimal RFC 5545 ICS parser.
 * Handles: line unfolding, UTC datetimes, TZID local datetimes, all-day dates,
 * text unescaping. Ignores RRULE (recurring events) for simplicity.
 */

import type { ParkingEvent } from '../types/parking'
import { parseEventDetails } from './eventParser'
import { localToUTC } from './timeUtils'

// ---------------------------------------------------------------------------
// Line pre-processing
// ---------------------------------------------------------------------------

/** RFC 5545 §3.1 – unfold continuation lines (CRLF + SPACE/TAB) */
function unfold(raw: string): string {
  return raw.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '')
}

/** Unescape ICS text values */
function unescape(val: string): string {
  return val
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

// ---------------------------------------------------------------------------
// Property line parsing
// ---------------------------------------------------------------------------

interface PropLine {
  key: string
  params: Record<string, string>
  value: string
}

function parsePropLine(line: string): PropLine {
  const colonIdx = line.indexOf(':')
  if (colonIdx === -1) return { key: line.toUpperCase(), params: {}, value: '' }

  const keyPart = line.slice(0, colonIdx)
  const value = line.slice(colonIdx + 1)

  const segments = keyPart.split(';')
  const key = segments[0].toUpperCase()
  const params: Record<string, string> = {}
  for (let i = 1; i < segments.length; i++) {
    const eq = segments[i].indexOf('=')
    if (eq !== -1) {
      params[segments[i].slice(0, eq).toUpperCase()] = segments[i].slice(eq + 1)
    }
  }
  return { key, params, value }
}

// ---------------------------------------------------------------------------
// Date / datetime parsing
// ---------------------------------------------------------------------------

function parseICSDate(value: string, params: Record<string, string>): Date {
  const v = value.trim()

  // UTC datetime: YYYYMMDDTHHMMSSZ
  if (v.endsWith('Z') && v.length >= 15) {
    return new Date(
      Date.UTC(
        +v.slice(0, 4),
        +v.slice(4, 6) - 1,
        +v.slice(6, 8),
        +v.slice(9, 11),
        +v.slice(11, 13),
        +v.slice(13, 15),
      ),
    )
  }

  // All-day date: YYYYMMDD → treat as midnight Chicago
  if (v.length === 8 && !v.includes('T')) {
    return localToUTC(+v.slice(0, 4), +v.slice(4, 6) - 1, +v.slice(6, 8), 0, 0, 0, 'America/Chicago')
  }

  // Local datetime with optional TZID: YYYYMMDDTHHMMSS
  if (v.length >= 15 && v[8] === 'T') {
    const tzid = params['TZID'] ?? 'America/Chicago'
    return localToUTC(
      +v.slice(0, 4),
      +v.slice(4, 6) - 1,
      +v.slice(6, 8),
      +v.slice(9, 11),
      +v.slice(11, 13),
      +v.slice(13, 15),
      tzid,
    )
  }

  // Fallback (e.g. VALUE=DATE edge cases)
  return new Date(v)
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

interface MutableEvent {
  uid?: string
  summary?: string
  description?: string
  location?: string
  start?: Date
  end?: Date
}

export function parseICS(raw: string): ParkingEvent[] {
  const lines = unfold(raw).split('\n')
  const events: ParkingEvent[] = []
  let current: MutableEvent | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed === 'BEGIN:VEVENT') {
      current = {}
      continue
    }

    if (trimmed === 'END:VEVENT') {
      if (current?.start && current?.end) {
        const startMs = current.start.getTime()
        const endMs = current.end.getTime()
        if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
          current = null
          continue
        }
        const summary = unescape(current.summary ?? '')
        const description = unescape(current.description ?? '')
        const location = unescape(current.location ?? '')
        const parsed = parseEventDetails(description, location, summary)
        events.push({
          uid: current.uid ?? crypto.randomUUID(),
          summary,
          description,
          location,
          start: current.start,
          end: current.end,
          ...parsed,
        })
      }
      current = null
      continue
    }

    if (!current) continue

    const { key, params, value } = parsePropLine(trimmed)
    switch (key) {
      case 'UID':         current.uid = value; break
      case 'SUMMARY':     current.summary = value; break
      case 'DESCRIPTION': current.description = value; break
      case 'LOCATION':    current.location = value; break
      case 'DTSTART':     current.start = parseICSDate(value, params); break
      case 'DTEND':       current.end   = parseICSDate(value, params); break
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime())
}
