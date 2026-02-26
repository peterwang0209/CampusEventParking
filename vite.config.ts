import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const CALENDAR_ICS_PATH =
  '/calendar/ical/umn.edu_oeebhpq2s5t1tmljl19s2q8994%40group.calendar.google.com/public/basic.ics'

export default defineConfig({
  base: '/CampusEventParking/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // In dev, /api/ics is proxied to Google Calendar server-side → no CORS
      '/api/ics': {
        target: 'https://calendar.google.com',
        changeOrigin: true,
        rewrite: () => CALENDAR_ICS_PATH,
      },
    },
  },
})
