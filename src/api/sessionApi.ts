/**
 * src/api/sessionApi.ts
 * Saves and retrieves sessions from Supabase
 */

import { supabase } from './supabase'
import type { Session, StudyMode, SeatClass } from '../types'
import type { PomoCfg } from '../hooks/usePomodoro'

// ── Create ────────────────────────────────────────────────────────────────────

export async function createSession(params: {
  userId: string
  flightId: string
  mode: StudyMode
  seatClass: SeatClass
  subject?: string
  pomoCfg?: PomoCfg & { blockCount?: number }
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id:    params.userId,
      flight_id:  params.flightId,
      mode:       params.mode,
      seat_class: params.seatClass,
      subject:    params.subject ?? null,
      pomo_cfg:   params.pomoCfg ?? null,
      status:     'active',
    })
    .select('id')
    .single()

  if (error) { console.error('createSession error:', error); return null }
  return data.id
}

// ── Update progress ───────────────────────────────────────────────────────────

export async function updateSessionProgress(
  sessionId: string,
  params: {
    focusedMinutes: number
    distanceCoveredKm: number
    pomodorosCompleted: number
  }
): Promise<void> {
  await supabase
    .from('sessions')
    .update({
      focused_minutes:     params.focusedMinutes,
      distance_covered_km: params.distanceCoveredKm,
      pomodoros_completed: params.pomodorosCompleted,
    })
    .eq('id', sessionId)
}

// ── End session ───────────────────────────────────────────────────────────────

export async function endSession(
  sessionId: string,
  status: 'landed' | 'aborted',
  params: {
    focusedMinutes: number
    distanceCoveredKm: number
    pomodorosCompleted: number
  }
): Promise<void> {
  await supabase
    .from('sessions')
    .update({
      status,
      ended_at:            new Date().toISOString(),
      focused_minutes:     params.focusedMinutes,
      distance_covered_km: params.distanceCoveredKm,
      pomodoros_completed: params.pomodorosCompleted,
    })
    .eq('id', sessionId)
}

// ── Fetch history ─────────────────────────────────────────────────────────────

export async function fetchSessionHistory(
  userId: string,
  limit = 20
): Promise<any[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(limit)

  if (error) { console.error('fetchSessionHistory error:', error); return [] }
  return data ?? []
}