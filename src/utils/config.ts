// src/utils/config.ts
export const USE_MOCK_DATA = true
export const FREE_MAX_DURATION_MINUTES = 120
export const POLL_INTERVAL_MS = 30_000 // 30s in dev so you can see movement
export const POMODORO_LONG_BREAK_AFTER = 4
export const SEAT_CLASS_CONFIG = {
  economy:  { workMinutes: 25, shortBreakMinutes: 5,  longBreakMinutes: 15 },
  business: { workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 },
  first:    { workMinutes: 90, shortBreakMinutes: 15, longBreakMinutes: 30 },
}

// Backend server URL — localhost in dev, Render in production
export const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001'