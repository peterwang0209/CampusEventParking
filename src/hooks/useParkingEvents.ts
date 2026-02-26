import { useState, useEffect, useCallback, useRef } from 'react'
import type { ParkingEvent } from '../types/parking'
import { parseICS } from '../utils/icsParser'

// ---------------------------------------------------------------------------
// Calendar source
// ---------------------------------------------------------------------------

const CALENDAR_EMAIL = 'umn.edu_oeebhpq2s5t1tmljl19s2q8994@group.calendar.google.com'
const ICS_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_EMAIL)}/public/basic.ics`

/**
 * Proxy strategies tried in order.
 * Direct often fails due to Google's CORS headers; the public proxies are free
 * fallbacks. For production, replace with your own Cloudflare Worker URL.
 *
 * Override via  VITE_PROXY_URL  env variable, e.g.:
 *   VITE_PROXY_URL=https://my-worker.example.workers.dev
 */
const CUSTOM_PROXY = import.meta.env.VITE_PROXY_URL as string | undefined

function buildUrls(): Array<string> {
  const urls: string[] = []
  if (CUSTOM_PROXY) {
    // Custom Cloudflare Worker – returns ICS directly
    urls.push(CUSTOM_PROXY)
  }
  if (import.meta.env.DEV) {
    // Vite dev proxy handles CORS server-side — always works locally
    urls.push('/api/ics')
  }
  // Free public CORS proxies (production fallback)
  urls.push(`https://corsproxy.io/?url=${encodeURIComponent(ICS_URL)}`)
  urls.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(ICS_URL)}`)
  return urls
}

const REFRESH_MS = 5 * 60 * 1000 // 5 minutes
const FETCH_TIMEOUT_MS = 12_000

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timeoutId)
  }
}

async function fetchICS(): Promise<string> {
  const urls = buildUrls()
  let lastErr: unknown

  for (const url of urls) {
    try {
      const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Not a valid ICS response')
      return text
    } catch (err) {
      lastErr = err
      console.warn(`[parking] fetch failed via ${url}:`, err)
    }
  }

  throw lastErr ?? new Error('All fetch attempts failed')
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseParkingEventsResult {
  events: ParkingEvent[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  refresh: () => void
}

export function useParkingEvents(): UseParkingEventsResult {
  const [events, setEvents] = useState<ParkingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const latestRequestId = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++latestRequestId.current
    setError(null)
    try {
      const ics = await fetchICS()
      if (requestId !== latestRequestId.current) return
      setEvents(parseICS(ics))
      setLastUpdated(new Date())
    } catch (err) {
      if (requestId !== latestRequestId.current) return
      setError(err instanceof Error ? err.message : 'Failed to load parking data')
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, REFRESH_MS)
    return () => clearInterval(id)
  }, [refresh])

  return { events, loading, error, lastUpdated, refresh }
}
