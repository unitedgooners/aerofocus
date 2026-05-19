/**
 * store/themeStore.ts
 *
 * Controls the app-wide theme.
 *
 * Rules:
 *   - Default: LIGHT (at the gate, cabin lights on)
 *   - Session starts (takeoff): → DARK (in flight, lights off)
 *   - Pomodoro break starts: → LIGHT (cabin lights on — meal service)
 *   - Pomodoro work resumes: → DARK (lights off again)
 *   - Session ends (landed): → LIGHT (cabin lights on)
 *
 * Any component reads: const { theme } = useThemeStore()
 * Session/Pomodoro hooks call: setFlying() / setBreak() / setLanded()
 */

import { create } from 'zustand'
import { LIGHT, DARK, Theme } from '../styles/theme'

type ThemeMode = 'light' | 'flying' | 'break' | 'landed'

interface ThemeState {
  mode: ThemeMode
  theme: Theme
  setFlying: () => void
  setBreak: () => void
  setResumed: () => void
  setLanded: () => void
  setLight: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  theme: LIGHT,

  setFlying:  () => set({ mode: 'flying',  theme: DARK }),
  setBreak:   () => set({ mode: 'break',   theme: LIGHT }),
  setResumed: () => set({ mode: 'flying',  theme: DARK }),
  setLanded:  () => set({ mode: 'landed',  theme: LIGHT }),
  setLight:   () => set({ mode: 'light',   theme: LIGHT }),
}))