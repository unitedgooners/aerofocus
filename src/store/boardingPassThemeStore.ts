import { create } from 'zustand'
import { supabase } from '../api/supabase'
import { fetchUserThemes, type OwnedTheme } from '../api/fleetApi'

interface BoardingPassThemeState {
  ownedThemes:   OwnedTheme[]
  activeThemeId: string
  isLoading:     boolean
  load:          (userId: string) => Promise<void>
  setActiveTheme: (userId: string, themeId: string) => Promise<void>
}

export const useBoardingPassThemeStore = create<BoardingPassThemeState>((set, get) => ({
  ownedThemes:   [],
  activeThemeId: 'default',
  isLoading:     false,

  load: async (userId: string) => {
    set({ isLoading: true })
    const owned = await fetchUserThemes(userId)

    // Active theme is stored on the profile
    const { data } = await supabase
      .from('profiles')
      .select('active_theme_id')
      .eq('id', userId)
      .maybeSingle()

    set({
      ownedThemes:   owned,
      activeThemeId: data?.active_theme_id ?? 'default',
      isLoading:     false,
    })
  },

  setActiveTheme: async (userId: string, themeId: string) => {
    const owned = get().ownedThemes.some(t => t.id === themeId) || themeId === 'default'
    if (!owned) return

    set({ activeThemeId: themeId })
    await supabase
      .from('profiles')
      .update({ active_theme_id: themeId })
      .eq('id', userId)
  },
}))