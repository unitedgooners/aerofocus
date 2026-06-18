// src/utils/config.ts
export const USE_MOCK_DATA = false
export const FREE_MAX_DURATION_MINUTES = 120
export const POLL_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes — matches the real flight data refresh cadence
export const POMODORO_LONG_BREAK_AFTER = 4
export const SEAT_CLASS_CONFIG = {
  economy:  { workMinutes: 25, shortBreakMinutes: 5,  longBreakMinutes: 15 },
  business: { workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 },
  first:    { workMinutes: 90, shortBreakMinutes: 15, longBreakMinutes: 30 },
}

// Backend server URL — localhost in dev, Railway in production.
// Set REACT_APP_SERVER_URL in your environment (e.g. Vercel project settings)
// to your Railway URL, e.g. https://aerofocus-production.up.railway.app
export const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'