import { create } from 'zustand'
import { supabase } from '../api/supabase'

interface UpgradeState {
  isTemporarilyPremium: boolean
  premiumUntil:         string | null
  hasPendingUpgrade:    boolean
  justUpgraded:         boolean   // true right after a successful roll — drives the celebration UI
  checkDailyRoll:       (userId: string) => Promise<void>
  consumePendingUpgrade: (userId: string) => Promise<void>
  dismissCelebration:   () => void
}

export const useUpgradeStore = create<UpgradeState>((set) => ({
  isTemporarilyPremium: false,
  premiumUntil:         null,
  hasPendingUpgrade:    false,
  justUpgraded:         false,

  // Call once on app load — rolls the daily dice for free users (server-side, idempotent per day)
  checkDailyRoll: async (userId: string) => {
    const { data: granted } = await supabase.rpc('roll_daily_upgrade', { p_user_id: userId })

    const { data: profile } = await supabase
      .from('profiles')
      .select('premium_until, has_pending_upgrade')
      .eq('id', userId)
      .maybeSingle()

    const premiumUntil = profile?.premium_until ?? null
    const isActive      = premiumUntil ? new Date(premiumUntil) > new Date() : false

    set({
      isTemporarilyPremium: isActive,
      premiumUntil,
      hasPendingUpgrade:    profile?.has_pending_upgrade ?? false,
      justUpgraded:         !!granted,
    })
  },

  // Called once the user has seen the "you've been upgraded" boarding pass
  consumePendingUpgrade: async (userId: string) => {
    set({ hasPendingUpgrade: false })
    await supabase
      .from('profiles')
      .update({ has_pending_upgrade: false })
      .eq('id', userId)
  },

  dismissCelebration: () => set({ justUpgraded: false }),
}))