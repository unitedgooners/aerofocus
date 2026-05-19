import { create } from 'zustand'
import type { Session, Flight, StudyMode, SeatClass } from '../types'
import type { PomoCfg } from '../hooks/usePomodoro'
import { createSession, endSession as apiEndSession, updateSessionProgress } from '../api/sessionApi'

interface SessionState {
  activeSession: (Session & { pomoCfg?: PomoCfg; supabaseId?: string }) | null
  isStarting: boolean
  startSession: (p: {
    flight: Flight
    mode: StudyMode
    seatClass: SeatClass
    subject?: string
    userId: string
    pomoCfg?: PomoCfg & { blockCount?: number }
    wantsChain?: boolean
  }) => Promise<void>
  endSession: (
    status: 'landed' | 'aborted',
    stats: { focusedMinutes: number; distanceCoveredKm: number; pomodorosCompleted: number }
  ) => Promise<Session | null>
  updateProgress: (stats: { focusedMinutes: number; distanceCoveredKm: number; pomodorosCompleted: number }) => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: null,
  isStarting:    false,

  startSession: async (params) => {
    set({ isStarting: true })

    const supabaseId = await createSession({
      userId:    params.userId,
      flightId:  params.flight.id,
      mode:      params.mode,
      seatClass: params.seatClass,
      subject:   params.subject,
      pomoCfg:   params.pomoCfg,
    })

    const session = {
      id:                 supabaseId ?? `local-${Date.now()}`,
      supabaseId:         supabaseId ?? undefined,
      userId:             params.userId,
      flightId:           params.flight.id,
      flight:             params.flight,
      mode:               params.mode,
      seatClass:          params.seatClass,
      subject:            params.subject,
      startedAt:          new Date().toISOString(),
      focusedMinutes:     0,
      distanceCoveredKm:  0,
      pomodorosCompleted: 0,
      status:             'active' as const,
      pomoCfg:            params.pomoCfg,
      wantsChain:         params.wantsChain ?? false,
    }

    set({ activeSession: session, isStarting: false })
  },

  updateProgress: (stats) => {
    const { activeSession } = get()
    if (!activeSession) return

    // Update local state
    set({
      activeSession: {
        ...activeSession,
        focusedMinutes:     stats.focusedMinutes,
        distanceCoveredKm:  stats.distanceCoveredKm,
        pomodorosCompleted: stats.pomodorosCompleted,
      }
    })

    // Sync to Supabase (fire and forget)
    if (activeSession.supabaseId) {
      updateSessionProgress(activeSession.supabaseId, stats)
    }
  },

  endSession: async (status, stats) => {
    const { activeSession } = get()
    if (!activeSession) return null

    // Save final state to Supabase
    if (activeSession.supabaseId) {
      await apiEndSession(activeSession.supabaseId, status, stats)
    }

    const ended: Session = {
      ...activeSession,
      ...stats,
      status,
      endedAt: new Date().toISOString(),
    }

    set({ activeSession: null })
    return ended
  },
}))