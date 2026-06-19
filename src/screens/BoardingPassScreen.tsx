import React, { useState, useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { useBoardingPassThemeStore } from '../store/boardingPassThemeStore'
import { useActiveAircraftStore } from '../store/activeAircraftStore'
import { useUpgradeStore } from '../store/upgradeStore'
import { space, radius, font, fontFamily } from '../styles/theme'
import { getPassColors } from '../styles/passThemes'
import type { Flight, StudyMode } from '../types'
import type { PomoCfg } from '../hooks/usePomodoro'

interface Props {
  flight: Flight
  mode: StudyMode
  subject?: string
  pomoCfg?: PomoCfg
  wantsChain?: boolean
  onBoard: () => void
  onBack: () => void
}

const MODE_LABELS: Record<StudyMode, string> = {
  traditional: 'Traditional',
  pomodoro:    'Pomodoro 🍅',
  flowtime:    'Flowtime 🌊',
}

export default function BoardingPassScreen({
  flight, mode, subject, pomoCfg, wantsChain, onBoard, onBack
}: Props) {
  const { theme }       = useThemeStore()
  const { user }        = useAuthStore()
  const { activeThemeId, load: loadTheme } = useBoardingPassThemeStore()
  const { fleet, activeAircraftId, load: loadAircraft } = useActiveAircraftStore()
  const { hasPendingUpgrade, consumePendingUpgrade } = useUpgradeStore()
  const [tearing, setTearing] = useState(false)
  const [torn, setTorn]       = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadTheme(user.id)
      loadAircraft(user.id)
    }
  }, [user?.id])

  const activeAircraft = fleet.find(a => a.id === activeAircraftId)

  // Pending random upgrade overrides the user's chosen theme with the exclusive design
  const pass = getPassColors(hasPendingUpgrade ? 'upgraded' : activeThemeId)

  // Format time nicely
  const now     = new Date()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  const fmtHrs = (m: number) => m >= 60
    ? `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}m` : ''}`.trim()
    : `${m}m`

  const modeDetail = mode === 'pomodoro' && pomoCfg
    ? `${pomoCfg.workMinutes}m work · ${pomoCfg.shortBreakMinutes}m break`
    : MODE_LABELS[mode]

  const handleTear = () => {
    setTearing(true)
    if (hasPendingUpgrade && user?.id) {
      consumePendingUpgrade(user.id)
    }
    setTimeout(() => {
      setTorn(true)
      setTimeout(onBoard, 600)
    }, 400)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: pass.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${space.xl}px ${space.lg}px`,
      transition: 'background 0.6s ease',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: space.xl }}>
        {hasPendingUpgrade && (
          <div style={{
            display: 'inline-block', background: 'linear-gradient(135deg, #9D4EDD, #6E2FB0)', color: '#fff',
            fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
            padding: '5px 14px', borderRadius: radius.pill, marginBottom: space.sm,
            boxShadow: '0 6px 16px -4px rgba(157,78,221,0.5)',
          }}>
            ✨ UPGRADED TO FIRST CLASS
          </div>
        )}
        <div style={{ fontSize: 10, color: pass.text, opacity: 0.4, letterSpacing: 2, marginBottom: space.xs, fontWeight: 600 }}>
          YOUR BOARDING PASS
        </div>
        <div style={{
          fontFamily: fontFamily.display, fontSize: 24, fontWeight: 600,
          color: pass.text, letterSpacing: -0.4,
        }}>
          Ready for takeoff
        </div>
      </div>

      {/* Boarding pass */}
      <div style={{
        width: '100%',
        maxWidth: 380,
        marginBottom: space.xl,
        filter: torn ? 'blur(2px)' : 'none',
        transition: 'filter 0.4s, opacity 0.4s',
        opacity: torn ? 0 : 1,
        boxShadow: '0 24px 48px -16px rgba(0,0,0,0.25)',
        borderRadius: radius.xl,
      }}>

        {/* Top half */}
        <div style={{
          background: pass.paper,
          borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
          padding: `${space.xl}px`,
          transform: tearing ? 'translateY(-8px) rotate(-1deg)' : 'none',
          transition: 'transform 0.4s ease',
        }}>
          {/* Airline row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: pass.accent, letterSpacing: 1.5 }}>
              ✈ FLIGHTFOCUS
            </div>
            <div style={{ fontSize: font.xs, color: pass.paperText, opacity: 0.45, fontWeight: 600, letterSpacing: 0.5 }}>
              {flight.id}
            </div>
          </div>

          {/* Route */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: space.xl }}>
            <div>
              <div style={{
                fontFamily: fontFamily.display, fontSize: 50, fontWeight: 600,
                color: pass.paperText, letterSpacing: -2, lineHeight: 1,
              }}>
                {flight.origin === '—' ? '???' : flight.origin}
              </div>
              <div style={{ fontSize: font.xs, color: pass.paperText, opacity: 0.5, marginTop: 5, fontWeight: 500 }}>
                {flight.originCity === 'En route' ? 'Departing' : flight.originCity}
              </div>
            </div>
            <div style={{ fontSize: 26, color: pass.paperText, opacity: 0.25, marginBottom: 10 }}>✈</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: fontFamily.display, fontSize: 50, fontWeight: 600,
                color: pass.paperText, letterSpacing: -2, lineHeight: 1,
              }}>
                {flight.destination === '—' ? '???' : flight.destination}
              </div>
              <div style={{ fontSize: font.xs, color: pass.paperText, opacity: 0.5, marginTop: 5, fontWeight: 500 }}>
                {flight.destinationCity === 'En route' ? 'Arriving' : flight.destinationCity}
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: space.md }}>
            {[
              { label: 'DATE',     value: dateStr },
              { label: 'TIME',     value: timeStr },
              { label: 'DURATION', value: fmtHrs(flight.remainingMinutes) },
            ].map(d => (
              <div key={d.label}>
                <div style={{ fontSize: 9, color: pass.paperText, opacity: 0.4, letterSpacing: 1.2, marginBottom: 4, fontWeight: 600 }}>{d.label}</div>
                <div style={{ fontSize: font.sm, fontWeight: 700, color: pass.paperText, letterSpacing: -0.2 }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tear line */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: pass.paper,
          filter: 'brightness(0.96)',
          padding: `0 ${space.md}px`,
          height: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Dashed line */}
          <div style={{
            flex: 1,
            borderTop: `2px dashed ${pass.paperText}40`,
          }} />
          {/* Left notch */}
          <div style={{
            position: 'absolute', left: -12,
            width: 24, height: 24, borderRadius: '50%',
            background: pass.bg,
          }} />
          {/* Right notch */}
          <div style={{
            position: 'absolute', right: -12,
            width: 24, height: 24, borderRadius: '50%',
            background: pass.bg,
          }} />
        </div>

        {/* Bottom stub */}
        <div style={{
          background: `linear-gradient(135deg, ${pass.accent}, ${pass.accent})`,
          borderRadius: `0 0 ${radius.xl}px ${radius.xl}px`,
          padding: `${space.lg}px ${space.xl}px`,
          transform: tearing ? 'translateY(8px) rotate(1deg)' : 'none',
          transition: 'transform 0.4s ease',
        }}>
          {/* Aircraft display */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: `0.5px solid ${pass.text}33`, paddingBottom: space.sm, marginBottom: space.md,
          }}>
            <div>
              <div style={{ fontSize: 9, color: pass.text, opacity: 0.5, letterSpacing: 1.2, marginBottom: 4, fontWeight: 600 }}>AIRCRAFT</div>
              <div style={{ fontSize: font.sm, fontWeight: 700, color: pass.text, letterSpacing: -0.2 }}>
                {activeAircraft?.name ?? 'Cessna 172 Skyhawk'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md, marginBottom: space.md }}>
            {[
              { label: 'MODE',    value: MODE_LABELS[mode] },
              { label: 'ALT',     value: `${flight.altitude.toLocaleString()} ft` },
            ].map(d => (
              <div key={d.label}>
                <div style={{ fontSize: 9, color: pass.text, opacity: 0.5, letterSpacing: 1.2, marginBottom: 4, fontWeight: 600 }}>{d.label}</div>
                <div style={{ fontSize: font.sm, fontWeight: 700, color: pass.text, letterSpacing: -0.2 }}>{d.value}</div>
              </div>
            ))}
          </div>
          {subject && (
            <div style={{ borderTop: `0.5px solid ${pass.text}33`, paddingTop: space.sm }}>
              <div style={{ fontSize: 9, color: pass.text, opacity: 0.5, letterSpacing: 1.2, marginBottom: 4, fontWeight: 600 }}>STUDYING</div>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: pass.text }}>{subject}</div>
            </div>
          )}
          {mode === 'pomodoro' && pomoCfg && (
            <div style={{ borderTop: `0.5px solid ${pass.text}33`, paddingTop: space.sm, marginTop: space.sm }}>
              <div style={{ fontSize: 9, color: pass.text, opacity: 0.5, letterSpacing: 1.2, marginBottom: 4, fontWeight: 600 }}>INTERVALS</div>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: pass.text }}>{modeDetail}</div>
            </div>
          )}
          {wantsChain && (
            <div style={{ borderTop: `0.5px solid ${pass.text}33`, paddingTop: space.sm, marginTop: space.sm }}>
              <div style={{ fontSize: 9, color: pass.text, opacity: 0.5, letterSpacing: 1.2, marginBottom: 4, fontWeight: 600 }}>CONNECTING FLIGHT</div>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: pass.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✈ Assigned at landing</span>
              </div>
              <div style={{ fontSize: 10, color: pass.text, opacity: 0.4, marginTop: 3 }}>
                Best live flight selected when this one lands
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tear button */}
      {!tearing && (
        <button onClick={handleTear} style={{
          width: '100%', maxWidth: 380,
          padding: 18, borderRadius: radius.lg, border: 'none',
          background: pass.paper, color: pass.accent,
          fontSize: font.md, fontWeight: 700,
          cursor: 'pointer', letterSpacing: 0.3,
          marginBottom: space.md,
          boxShadow: '0 8px 20px -6px rgba(0,0,0,0.3)',
        }}>
          ✂ Tear &amp; Board
        </button>
      )}

      {tearing && (
        <div style={{ fontFamily: fontFamily.display, fontSize: font.md, color: pass.text, opacity: 0.6, marginBottom: space.md }}>
          Boarding...
        </div>
      )}

      {!tearing && (
        <button onClick={onBack} style={{
          background: 'none', border: 'none',
          color: pass.text, opacity: 0.35, fontSize: font.sm,
          cursor: 'pointer', fontWeight: 500,
        }}>
          ← Choose a different flight
        </button>
      )}
    </div>
  )
}