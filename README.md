# UMN Event Parking

Mobile-first static site that surfaces **University of Minnesota event parking** from the official Google Calendar.
Live data is fetched client-side from the public ICS feed — no backend, no API key.

**Stack:** React 19 · Vite 6 · TypeScript · Tailwind CSS v4
**Deploy target:** GitHub Pages

---

## Project structure

```
src/
├── types/parking.ts          — shared TypeScript interfaces
├── utils/
│   ├── icsParser.ts          — RFC 5545 ICS parser (no deps)
│   ├── eventParser.ts        — extract price & ramp name from event text
│   └── timeUtils.ts          — timezone helpers, status, filtering
├── hooks/useParkingEvents.ts — fetches ICS, retries via CORS proxies
└── components/
    ├── Header.tsx
    ├── ViewToggle.tsx         — Now / Today / Next 7 Days tabs
    ├── ParkingCard.tsx        — one card per event
    ├── StatusBadge.tsx        — 进行中 / X 分钟后开始 / X 小时后结束
    └── EmptyState.tsx
worker/
└── index.js                  — optional Cloudflare Worker CORS proxy
.github/workflows/deploy.yml  — GitHub Actions → GitHub Pages
```

---

## Local development

```bash
npm install
npm run dev
```

---

## CORS and data fetching

Google Calendar **blocks cross-origin browser requests** to its ICS endpoint.
`useParkingEvents.ts` tries three strategies in order:

| Priority | Strategy | Notes |
|----------|----------|-------|
| 1 | `VITE_PROXY_URL` (your Cloudflare Worker) | Fastest, cached at edge |
| 2 | Direct fetch | Works in dev via Vite, usually blocked in prod |
| 3 | `corsproxy.io` | Free, rate-limited |
| 4 | `allorigins.win` | Free fallback |

### Option A – Cloudflare Worker (recommended for production)

```bash
npm install -g wrangler
wrangler login
wrangler deploy worker/index.js \
  --name umn-parking-ics \
  --compatibility-date 2024-01-01
```

Point the app at your worker:

```bash
# .env.local  (git-ignored)
VITE_PROXY_URL=https://umn-parking-ics.<subdomain>.workers.dev
```

The worker caches the ICS for 5 minutes at the Cloudflare edge.

### Option B – free public proxies (no setup)

Leave `VITE_PROXY_URL` unset. The hook falls through to corsproxy.io / allorigins automatically.

---

## GitHub Pages deployment

### One-time repo setup

1. Push this repo to GitHub.
2. **Settings → Pages → Source**: choose **GitHub Actions**.
3. Add the following repository **Secrets**:
   - `CLOUDFLARE_API_TOKEN` (Worker deploy token)
   - `CLOUDFLARE_ACCOUNT_ID`
4. Add the following repository **Variable**:
   - `VITE_PROXY_URL=https://umn-parking-ics.<your-subdomain>.workers.dev`

### Deploy

Push to `main` — the workflow will:
1. Deploy `worker/index.js` to Cloudflare Workers
2. Build the Vite app using `VITE_PROXY_URL`
3. Deploy `dist/` to GitHub Pages

```
https://<username>.github.io/CampusEventParking/
```

### Manual build

```bash
npm run build    # output → dist/
npm run preview  # serve dist/ locally
```

---

## Event field parsing

Description text format (typical UMN parking events):

```
Event Rate: $10
Locations: University Ave. Ramp
Event: Gopher Football
```

`eventParser.ts` extracts:
- **`eventRate`** — regex: `/event\s+rate\s*:\s*(\$[\d.,]+)/i`
- **`rampName`** — from `Locations:` in description, else from the location field
- **`eventName`** — from `Event:` in description

---

## Timezone

All times use **America/Chicago** via `Intl.DateTimeFormat`.
The ICS parser converts TZID-qualified local datetimes to UTC using an Intl offset-reversal technique — no third-party timezone library needed.
