/**
 * Cloudflare Worker – CORS proxy for the UMN event parking ICS feed.
 *
 * Deploy:
 *   1. Install Wrangler:  npm install -g wrangler
 *   2. Login:             wrangler login
 *   3. Deploy:            wrangler deploy worker/index.js --name umn-parking-ics --compatibility-date 2024-01-01
 *
 * After deploy, set the worker URL in your Vite env:
 *   VITE_PROXY_URL=https://umn-parking-ics.<your-subdomain>.workers.dev
 *
 * The worker fetches the ICS once per request and caches it for 5 minutes
 * at the Cloudflare edge (Cache API), so Google is not hammered.
 */

const ICS_URL =
  'https://calendar.google.com/calendar/ical/' +
  'umn.edu_oeebhpq2s5t1tmljl19s2q8994%40group.calendar.google.com' +
  '/public/basic.ics'

const CACHE_TTL = 300 // seconds

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

export default {
  async fetch(request, _env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS })
    }

    // Check Cloudflare Cache API
    const cache = caches.default
    const cacheKey = new Request(ICS_URL, { method: 'GET' })
    const cached = await cache.match(cacheKey)
    if (cached) {
      const body = await cached.text()
      return new Response(body, {
        headers: { ...CORS_HEADERS, 'Content-Type': 'text/calendar; charset=utf-8', 'X-Cache': 'HIT' },
      })
    }

    // Fetch from Google
    const upstream = await fetch(ICS_URL)
    if (!upstream.ok) {
      return new Response('Failed to fetch calendar', {
        status: 502,
        headers: CORS_HEADERS,
      })
    }

    const body = await upstream.text()

    // Store in cache
    const cacheResponse = new Response(body, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_TTL}`,
      },
    })
    ctx.waitUntil(cache.put(cacheKey, cacheResponse))

    return new Response(body, {
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Cache-Control': `public, max-age=${CACHE_TTL}`,
        'X-Cache': 'MISS',
      },
    })
  },
}
