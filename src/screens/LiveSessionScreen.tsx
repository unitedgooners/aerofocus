import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSessionStore } from '../store/sessionStore'
import { useThemeStore } from '../store/themeStore'
import { usePomodoro } from '../hooks/usePomodoro'
import { simulateFlightUpdate } from '../mock/data'
import { POLL_INTERVAL_MS } from '../utils/config'
import { space, radius, font } from '../styles/theme'
import type { Flight } from '../types'

interface Props { onEnd: (session: any) => void }

// ── Gentle chime sound using Web Audio API ────────────────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15)
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.15 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.8)
      osc.start(ctx.currentTime + i * 0.15)
      osc.stop(ctx.currentTime + i * 0.15 + 0.8)
    })
  } catch (e) {
    // Audio not supported — fail silently
  }
}

export default function LiveSessionScreen({ onEnd }: Props) {
  const { activeSession, endSession, updateProgress } = useSessionStore()
  const { theme, setFlying, setBreak, setResumed, setLanded } = useThemeStore()

  const [flight, setFlight]     = useState<Flight | null>(activeSession?.flight ?? null)
  const [elapsed, setElapsed]   = useState(0)
  const [distance, setDistance] = useState(0)
  const [pomos, setPomos]       = useState(0)

  // Flowtime — track when user manually starts/stops
  const [flowtimeRunning, setFlowtimeRunning] = useState(false)
  const [flowtimeElapsed, setFlowtimeElapsed] = useState(0)

  const startRef     = useRef(Date.now())
  const elapsedRef   = useRef(0)
  const distanceRef  = useRef(0)
  const pomosRef     = useRef(0)

  // Go dark on mount, reset on unmount
  useEffect(() => {
    setFlying()
    return () => { setLanded() }
  }, [])

  // ── Pomodoro ──────────────────────────────────────────────────────────────
  const handleBlockComplete = useCallback((block: number) => {
    setPomos(block)
    pomosRef.current = block
    playChime()
  }, [])

  const pomo = usePomodoro({
    seatClass:           activeSession?.seatClass ?? 'economy',
    totalSessionMinutes: flight?.remainingMinutes ?? 60,
    customConfig:        (activeSession as any)?.pomoCfg,
    onBlockComplete:     handleBlockComplete,
  })

  // Auto-start on mount
  useEffect(() => {
    if (activeSession?.mode === 'pomodoro') {
      pomo.start()
    } else if (activeSession?.mode === 'flowtime') {
      setFlowtimeRunning(true)
    }
  }, [])

  // Switch theme on pomodoro phase change
  const prevPhase = useRef(pomo.state.phase)
  useEffect(() => {
    if (activeSession?.mode !== 'pomodoro') return
    if (pomo.state.phase !== prevPhase.current) {
      if (pomo.state.phase !== 'work') {
        playChime()
        setBreak()
      } else {
        setResumed()
      }
      prevPhase.current = pomo.state.phase
    }
  }, [pomo.state.phase])

  // ── Elapsed time ticker ────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      const mins = Math.floor((Date.now() - startRef.current) / 60000)
      setElapsed(mins)
      elapsedRef.current = mins
    }, 10000)
    return () => clearInterval(t)
  }, [])

  // ── Flowtime ticker ────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeSession?.mode !== 'flowtime') return
    let interval: ReturnType<typeof setInterval> | null = null
    if (flowtimeRunning) {
      interval = setInterval(() => setFlowtimeElapsed(p => p + 1), 60000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [flowtimeRunning, activeSession?.mode])

  // ── Progress sync to Supabase every 2 minutes ─────────────────────────────
  useEffect(() => {
    const sync = setInterval(() => {
      updateProgress({
        focusedMinutes:     elapsedRef.current,
        distanceCoveredKm:  distanceRef.current,
        pomodorosCompleted: pomosRef.current,
      })
    }, 2 * 60 * 1000)
    return () => clearInterval(sync)
  }, [])

  // ── Flight position poll ───────────────────────────────────────────────────
  useEffect(() => {
    if (!flight) return
    const p = setInterval(() => {
      setFlight(prev => prev ? simulateFlightUpdate(prev) : prev)
      const newDist = distanceRef.current + 70
      distanceRef.current = newDist
      setDistance(newDist)
    }, POLL_INTERVAL_MS)
    return () => clearInterval(p)
  }, [!!flight])

  // ── End session ────────────────────────────────────────────────────────────
  const handleEnd = async (aborted = false) => {
    const wantsChain = (activeSession as any)?.wantsChain

    // If landed naturally and user wants a connecting flight, find best live one now
    if (!aborted && wantsChain) {
      setLanded()
      await endSession('landed', {
        focusedMinutes:     elapsedRef.current,
        distanceCoveredKm:  distanceRef.current,
        pomodorosCompleted: pomosRef.current,
      })

      // Pull from Supabase cached pool — free tier gets pool, premium gets all
      const { supabase } = await import('../api/supabase')
      const userTier = (activeSession as any)?.tier ?? 'free'

      let query = supabase
        .from('active_flights')
        .select('*')
        .eq('status', 'airborne')
        .neq('id', flight?.id ?? '')
        .order('remaining_minutes', { ascending: true })

      // Free tier: only flights under 2 hours from cached pool of 30
      if (userTier !== 'premium') {
        query = query.lte('remaining_minutes', 120).limit(30)
      }

      const { data: poolFlights } = await query

      if (poolFlights && poolFlights.length > 0) {
        // Pick the flight with remaining time closest to the leftover study time
        const studyTimeLeft = elapsedRef.current > 0
          ? Math.max(15, 60 - elapsedRef.current) // rough estimate of what's left
          : 45

        const nextFlight = [...poolFlights].sort(
          (a, b) => Math.abs(a.remaining_minutes - studyTimeLeft) - Math.abs(b.remaining_minutes - studyTimeLeft)
        )[0]

        // Map Supabase row to Flight type
        const mappedFlight = {
          id:               nextFlight.id,
          icao24:           nextFlight.icao24,
          airline:          nextFlight.airline ?? 'Unknown',
          origin:           nextFlight.origin ?? '—',
          originCity:       nextFlight.origin_city ?? 'En route',
          destination:      nextFlight.destination ?? '—',
          destinationCity:  nextFlight.destination_city ?? 'En route',
          departureTime:    nextFlight.departure_time ?? new Date().toISOString(),
          estimatedArrival: nextFlight.estimated_arrival ?? new Date().toISOString(),
          remainingMinutes: nextFlight.remaining_minutes ?? 60,
          lat:              nextFlight.lat,
          lng:              nextFlight.lng,
          altitude:         nextFlight.altitude ?? 35000,
          status:           'airborne' as const,
          lastUpdated:      nextFlight.last_updated ?? new Date().toISOString(),
        }
        // Brief pause then start the chain session
        setTimeout(async () => {
          setFlying()
          setFlight(mappedFlight)
          startRef.current    = Date.now()
          setElapsed(0)
          elapsedRef.current  = 0
          distanceRef.current = 0

          const { startSession } = useSessionStore.getState()
          await startSession({
            flight:     mappedFlight,
            mode:       activeSession.mode,
            seatClass:  activeSession.seatClass ?? 'economy',
            subject:    activeSession.subject,
            userId:     activeSession.userId,
            pomoCfg:    (activeSession as any).pomoCfg,
            wantsChain: false,
          })
        }, 1200)
        return
      }
      // No flight found — end normally
      setTimeout(() => onEnd(null), 400)
      return
    }

    if (!aborted || window.confirm('Land early and save your session?')) {
      setLanded()
      const ended = await endSession(
        aborted ? 'aborted' : 'landed',
        {
          focusedMinutes:     elapsedRef.current,
          distanceCoveredKm:  distanceRef.current,
          pomodorosCompleted: pomosRef.current,
        }
      )
      setTimeout(() => onEnd(ended), 400)
    }
  }

  if (!flight || !activeSession) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: theme.text }}>No active session.</div>
    </div>
  )

  const fmt        = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
  const pct        = Math.min(100, (elapsed / (flight.remainingMinutes + elapsed)) * 100)
  const isBreak    = activeSession.mode === 'pomodoro' && pomo.state.phase !== 'work'
  const phaseLabel = { work: 'Focus time', shortBreak: 'Short break ☕', longBreak: 'Long break 🛏' }[pomo.state.phase] ?? 'Focus time'
  const cfg        = (activeSession as any)?.pomoCfg
  const isTaxiing  = flight.status === 'landed' && flight.remainingMinutes <= 0

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, transition: 'background 0.8s ease' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${space.xl}px ${space.lg}px 100px` }}>

        {/* Break banner */}
        {isBreak && (
          <div style={{ background: theme.bgSuccess, border: `0.5px solid ${theme.textSuccess}30`, borderRadius: radius.lg, padding: `${space.md}px ${space.lg}px`, marginBottom: space.lg, textAlign: 'center' }}>
            <div style={{ fontSize: font.lg, color: theme.textSuccess, marginBottom: 2 }}>{phaseLabel}</div>
            <div style={{ fontSize: font.xs, color: theme.textSecondary }}>Cabin lights are on · take a real break</div>
          </div>
        )}

        {/* Flight header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg }}>
          <div>
            <div style={{ fontSize: font.lg, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>{flight.id}</div>
            <div style={{ fontSize: font.xs, color: theme.textSecondary, marginTop: 2 }}>{flight.airline}</div>
          </div>
          <div style={{
            background: isTaxiing ? theme.bgWarning : flight.status === 'airborne' ? theme.bgSuccess : theme.bgWarning,
            color: isTaxiing ? theme.textWarning : flight.status === 'airborne' ? theme.textSuccess : theme.textWarning,
            fontSize: font.xs, fontWeight: 600, padding: '5px 12px', borderRadius: radius.pill,
          }}>
            {isTaxiing ? '🛬 taxiing to gate' : flight.status === 'airborne' ? '● live' : '✓ landed'}
          </div>
        </div>

        {/* Altitude + progress card */}
        <div style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.lg, marginBottom: space.md, transition: 'background 0.8s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: space.md }}>
            {isTaxiing ? (
              <>
                <div style={{ fontSize: font.lg, fontWeight: 600, color: theme.textWarning, marginBottom: 4 }}>
                  🛬 Taxiing to gate
                </div>
                <div style={{ fontSize: font.xs, color: theme.textTertiary }}>
                  Keep going — you've still got time on the clock
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: font.xxl, fontWeight: 700, color: theme.textAccent, letterSpacing: -1 }}>
                  {flight.altitude.toLocaleString()} ft
                </div>
                <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 4 }}>
                  {flight.lat.toFixed(2)}°N · {Math.abs(flight.lng).toFixed(2)}°{flight.lng < 0 ? 'W' : 'E'} · cruising
                </div>
              </>
            )}
          </div>
          <div style={{ height: 4, background: theme.border, borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: 4, background: theme.accentAlt, borderRadius: 2, width: `${pct}%`, transition: 'width 1s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: font.xs, color: theme.textTertiary }}>{Math.round(pct)}% flown</span>
            <span style={{ fontSize: font.xs, color: theme.textTertiary }}>
              {isTaxiing ? 'at the gate' : `${flight.remainingMinutes}m remaining`}
            </span>
          </div>
        </div>

        {/* ── POMODORO UI ───────────────────────────────────────────────────── */}
        {activeSession.mode === 'pomodoro' && (
          <>
            <div style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.lg, marginBottom: space.md, transition: 'background 0.8s ease' }}>
              <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap', marginBottom: space.sm }}>
                {Array.from({ length: pomo.state.totalBlocks }).map((_, i) => (
                  <div key={i} style={{
                    width: 28, height: 8, borderRadius: 4,
                    background: i < pomo.state.completedBlocks
                      ? theme.accentAlt
                      : i === pomo.state.completedBlocks && !isBreak
                      ? theme.text
                      : theme.border,
                    transition: 'background 0.4s',
                  }} />
                ))}
              </div>
              <div style={{ fontSize: font.xs, color: theme.textTertiary, textAlign: 'center' }}>
                Block {pomo.state.completedBlocks + 1} of {pomo.state.totalBlocks} · {phaseLabel}
                {cfg && <span> · {cfg.workMinutes}m/{cfg.shortBreakMinutes}m</span>}
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: `${space.lg}px 0` }}>
              <div style={{ fontSize: font.hero, fontWeight: 200, color: theme.text, letterSpacing: -4, lineHeight: 1, transition: 'color 0.8s' }}>
                {fmt(pomo.state.secondsRemaining)}
              </div>
              <div style={{ fontSize: font.sm, color: theme.textTertiary, marginTop: space.sm }}>
                until {phaseLabel.toLowerCase()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: space.sm, marginBottom: space.sm }}>
              <button onClick={pomo.isRunning ? pomo.pause : pomo.start} style={{
                flex: 1, padding: 15, borderRadius: radius.md, border: 'none',
                background: theme.bgPrimary, color: '#fff', fontSize: font.md, fontWeight: 600, cursor: 'pointer',
              }}>
                {pomo.isRunning ? '⏸  Pause' : '▶  Resume'}
              </button>
              <button onClick={pomo.skip} style={{
                padding: '15px 20px', borderRadius: radius.md,
                border: `0.5px solid ${theme.borderMed}`,
                background: theme.bgCard, color: theme.textSecondary, fontSize: font.md, cursor: 'pointer',
              }}>
                Skip →
              </button>
            </div>
          </>
        )}

        {/* ── FLOWTIME UI ───────────────────────────────────────────────────── */}
        {activeSession.mode === 'flowtime' && (
          <>
            <div style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.lg, marginBottom: space.md, textAlign: 'center', transition: 'background 0.8s ease' }}>
              <div style={{ fontSize: font.xs, color: theme.textTertiary, letterSpacing: 1, marginBottom: space.sm }}>
                {flowtimeRunning ? 'IN FLOW ●' : 'ON BREAK ◌'}
              </div>
              <div style={{ fontSize: font.hero, fontWeight: 200, color: theme.text, letterSpacing: -4, lineHeight: 1 }}>
                {String(Math.floor(flowtimeElapsed / 60)).padStart(2,'0')}:{String(flowtimeElapsed % 60).padStart(2,'0')}
              </div>
              <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: space.sm }}>
                {flowtimeRunning ? 'focus time · stop when you need a break' : 'take your break · start again when ready'}
              </div>
            </div>

            <button onClick={() => { setFlowtimeRunning(r => !r); if (!flowtimeRunning) playChime() }} style={{
              width: '100%', padding: 15, borderRadius: radius.md, border: 'none', marginBottom: space.sm,
              background: flowtimeRunning ? theme.bgWarning : theme.bgPrimary,
              color: flowtimeRunning ? theme.textWarning : '#fff',
              fontSize: font.md, fontWeight: 600, cursor: 'pointer',
            }}>
              {flowtimeRunning ? '⏸  Take a break' : '▶  Back to flow'}
            </button>
          </>
        )}

        {/* ── TRADITIONAL UI ────────────────────────────────────────────────── */}
        {activeSession.mode === 'traditional' && (
          <div style={{ textAlign: 'center', margin: `${space.lg}px 0` }}>
            <div style={{ fontSize: font.hero, fontWeight: 200, color: theme.text, letterSpacing: -4, lineHeight: 1 }}>
              {String(Math.floor(elapsed / 60)).padStart(2,'0')}:{String(elapsed % 60).padStart(2,'0')}
            </div>
            <div style={{ fontSize: font.sm, color: theme.textTertiary, marginTop: space.sm }}>
              time focused
            </div>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: space.sm, marginBottom: space.lg }}>
          {[
            { val: `${elapsed}m`,    lbl: 'focused' },
            { val: String(distance), lbl: 'km covered' },
            { val: String(pomos),    lbl: 'pomodoros' },
          ].map(st => (
            <div key={st.lbl} style={{ background: theme.bgCard, borderRadius: radius.md, padding: space.md, textAlign: 'center', border: `0.5px solid ${theme.border}`, transition: 'background 0.8s ease' }}>
              <div style={{ fontSize: font.lg, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>{st.val}</div>
              <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>{st.lbl}</div>
            </div>
          ))}
        </div>

        <button onClick={() => handleEnd(true)} style={{
          width: '100%', padding: 15, borderRadius: radius.md,
          border: `0.5px solid ${theme.borderMed}`,
          background: 'transparent', color: theme.textTertiary, fontSize: font.sm, cursor: 'pointer',
        }}>
          Land early &amp; save session
        </button>

      </div>
    </div>
  )
}