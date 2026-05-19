import React, { useState, useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'
import { space, radius, font } from '../styles/theme'
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
  const { theme } = useThemeStore()
  const [tearing, setTearing] = useState(false)
  const [torn, setTorn]       = useState(false)

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
    setTimeout(() => {
      setTorn(true)
      setTimeout(onBoard, 600)
    }, 400)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a1628',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: `${space.xl}px ${space.lg}px`,
      transition: 'background 0.6s ease',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: space.xl }}>
        <div style={{ fontSize: font.xs, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: space.xs }}>
          YOUR BOARDING PASS
        </div>
        <div style={{ fontSize: font.lg, fontWeight: 600, color: '#fff' }}>
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
      }}>

        {/* Top half */}
        <div style={{
          background: '#fff',
          borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
          padding: `${space.xl}px`,
          transform: tearing ? 'translateY(-8px) rotate(-1deg)' : 'none',
          transition: 'transform 0.4s ease',
        }}>
          {/* Airline row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
            <div style={{ fontSize: font.xs, fontWeight: 700, color: '#185FA5', letterSpacing: 1 }}>
              ✈ FLIGHTFOCUS
            </div>
            <div style={{ fontSize: font.xs, color: '#999', fontWeight: 500 }}>
              {flight.id}
            </div>
          </div>

          {/* Route */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: space.xl }}>
            <div>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#1A2233', letterSpacing: -3, lineHeight: 1 }}>
                {flight.origin === '—' ? '???' : flight.origin}
              </div>
              <div style={{ fontSize: font.xs, color: '#999', marginTop: 4 }}>
                {flight.originCity === 'En route' ? 'Departing' : flight.originCity}
              </div>
            </div>
            <div style={{ fontSize: 28, color: '#ddd', marginBottom: 8 }}>✈</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#1A2233', letterSpacing: -3, lineHeight: 1 }}>
                {flight.destination === '—' ? '???' : flight.destination}
              </div>
              <div style={{ fontSize: font.xs, color: '#999', marginTop: 4 }}>
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
                <div style={{ fontSize: 9, color: '#999', letterSpacing: 1, marginBottom: 3 }}>{d.label}</div>
                <div style={{ fontSize: font.sm, fontWeight: 700, color: '#1A2233' }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tear line */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#f0f0f0',
          padding: `0 ${space.md}px`,
          height: 24,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Dashed line */}
          <div style={{
            flex: 1,
            borderTop: '2px dashed #ccc',
          }} />
          {/* Left notch */}
          <div style={{
            position: 'absolute', left: -12,
            width: 24, height: 24, borderRadius: '50%',
            background: '#0a1628',
          }} />
          {/* Right notch */}
          <div style={{
            position: 'absolute', right: -12,
            width: 24, height: 24, borderRadius: '50%',
            background: '#0a1628',
          }} />
        </div>

        {/* Bottom stub */}
        <div style={{
          background: '#185FA5',
          borderRadius: `0 0 ${radius.xl}px ${radius.xl}px`,
          padding: `${space.lg}px ${space.xl}px`,
          transform: tearing ? 'translateY(8px) rotate(1deg)' : 'none',
          transition: 'transform 0.4s ease',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.md, marginBottom: space.md }}>
            {[
              { label: 'MODE',    value: MODE_LABELS[mode] },
              { label: 'ALT',     value: `${flight.altitude.toLocaleString()} ft` },
            ].map(d => (
              <div key={d.label}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 3 }}>{d.label}</div>
                <div style={{ fontSize: font.sm, fontWeight: 700, color: '#fff' }}>{d.value}</div>
              </div>
            ))}
          </div>
          {subject && (
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', paddingTop: space.sm }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 3 }}>STUDYING</div>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: '#fff' }}>{subject}</div>
            </div>
          )}
          {mode === 'pomodoro' && pomoCfg && (
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', paddingTop: space.sm, marginTop: space.sm }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 3 }}>INTERVALS</div>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: '#fff' }}>{modeDetail}</div>
            </div>
          )}
          {wantsChain && (
            <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.2)', paddingTop: space.sm, marginTop: space.sm }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, marginBottom: 3 }}>CONNECTING FLIGHT</div>
              <div style={{ fontSize: font.sm, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>✈ Assigned at landing</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
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
          background: '#fff', color: '#185FA5',
          fontSize: font.md, fontWeight: 700,
          cursor: 'pointer', letterSpacing: 0.5,
          marginBottom: space.md,
        }}>
          ✂ Tear &amp; Board
        </button>
      )}

      {tearing && (
        <div style={{ fontSize: font.md, color: 'rgba(255,255,255,0.6)', marginBottom: space.md }}>
          Boarding...
        </div>
      )}

      {!tearing && (
        <button onClick={onBack} style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.3)', fontSize: font.sm,
          cursor: 'pointer',
        }}>
          ← Choose a different flight
        </button>
      )}
    </div>
  )
}