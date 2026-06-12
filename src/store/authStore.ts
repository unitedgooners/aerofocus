import { create } from 'zustand'
import { supabase } from '../api/supabase'
import type { UserProfile } from '../types'

interface AuthState {
  user: UserProfile | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, username: string, referralCode?: string) => Promise<void>
  logout: () => Promise<void>
  loadSession: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshProfile: () => Promise<void>
  clearError: () => void
}

async function fetchOrCreateProfile(userId: string, email: string, username?: string): Promise<UserProfile | null> {
  // Try to fetch existing profile
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (data) {
    return {
      id:                data.id,
      username:          data.username,
      tier:              data.tier ?? 'free',
      homeAirport:       data.home_airport,
      streakDays:        data.streak_days ?? 0,
      totalFocusMinutes: data.total_focus_minutes ?? 0,
      totalFlights:      data.total_flights ?? 0,
      totalDistanceKm:   data.total_distance_km ?? 0,
      cashBalance:       Number(data.cash_balance ?? 0),
      referralCode:      data.referral_code ?? '',
      signupNumber:      data.signup_number ?? null,
      createdAt:         data.created_at,
    }
  }

  // Profile doesn't exist — create it now
  const fallbackUsername = username ?? email.split('@')[0]
  const { data: created, error } = await supabase
    .from('profiles')
    .insert({ id: userId, username: fallbackUsername })
    .select('*')
    .single()

  if (error || !created) return null

  return {
    id:                created.id,
    username:          created.username,
    tier:              created.tier ?? 'free',
    homeAirport:       created.home_airport,
    streakDays:        created.streak_days ?? 0,
    totalFocusMinutes: created.total_focus_minutes ?? 0,
    totalFlights:      created.total_flights ?? 0,
    totalDistanceKm:   created.total_distance_km ?? 0,
    cashBalance:       Number(created.cash_balance ?? 0),
    referralCode:      created.referral_code ?? '',
    signupNumber:      created.signup_number ?? null,
    createdAt:         created.created_at,
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user:      null,
  isLoading: false,
  error:     null,

  loadSession: async () => {
    set({ isLoading: true })
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const profile = await fetchOrCreateProfile(
        session.user.id,
        session.user.email ?? '',
        session.user.user_metadata?.username
      )
      set({ user: profile, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null })
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message, isLoading: false })
      return
    }
    if (data.user) {
      const profile = await fetchOrCreateProfile(
        data.user.id,
        data.user.email ?? '',
        data.user.user_metadata?.username
      )
      set({ user: profile, isLoading: false })
    }
  },

  signup: async (email, password, username, referralCode) => {
    set({ isLoading: true, error: null })

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existing) {
      set({ error: 'Username already taken', isLoading: false })
      return
    }

    // Look up the referrer (if a valid code was provided)
    let referrerId: string | null = null
    if (referralCode && referralCode.trim()) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', referralCode.trim().toUpperCase())
        .maybeSingle()
      if (referrer) referrerId = referrer.id
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

    if (error) {
      set({ error: error.message, isLoading: false })
      return
    }

    if (data.user) {
      // Let the DB trigger create the base profile first
      await supabase.from('profiles').upsert(
        { id: data.user.id, username },
        { onConflict: 'id' }
      ).then(() => {})

      // Record the referral — triggers the Wright Model B award for the referrer
      // if they're within the first 500 successful referrals
      if (referrerId) {
        await supabase
          .from('profiles')
          .update({ referred_by: referrerId })
          .eq('id', data.user.id)
      }

      set({ isLoading: false })
    }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null, error: null })
  },

  resetPassword: async (email) => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  },

  refreshProfile: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return
    const profile = await fetchOrCreateProfile(session.user.id, session.user.email ?? '', session.user.user_metadata?.username)
    if (profile) set({ user: profile })
  },

  clearError: () => set({ error: null }),
}))