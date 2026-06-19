import React, { useState } from 'react'
import { useFlightPool } from '../hooks/useFlightPool'
import { pickRandomFlight, pickRandomFlightForDuration } from '../api/opensky'
import { space, radius, font, fontFamily } from '../styles/theme'
import type { Flight } from '../types'

interface Props {
  theme: any
  onPicked: (flight: Flight) => void
  onUpgrade: () => void
}

// Self-contained — owns its own modal state and duration input. Drops into
// HomeScreen as a single button; doesn't touch the existing flight-search
// flow or useFlightPool's free-tier logic at all.
export default function RandomFlightButton({ theme, onPicked, onUpgrade }: Props) {
  const { flights, isPremium } = useFlightPool()
  const [open, setOpen]         = useState(false)
  const [useCustom, setUseCustom] = useState(false)
  const [customMinutes, setCustomMinutes] = useState(45)

  const handleClick = () => {
    if (!isPremium) {
      onUpgrade()
      return
    }
    setOpen(true)
  }

  const handlePick = () => {
    const flight = useCustom
      ? pickRandomFlightForDuration(flights, customMinutes)
      : pickRandomFlight(flights)

    if (flight) {
      onPicked(flight)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: space.sm,
          padding: 14, borderRadius: radius.lg,
          border: `0.5px solid ${theme.border}`,
          background: theme.bgCard, color: theme.text,
          fontSize: font.sm, fontWeight: 600, cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 16 }}>🎲</span>
        Random flight
        {!isPremium && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: theme.textWarning,
            background: theme.bgWarning, padding: '2px 8px', borderRadius: radius.pill, letterSpacing: 0.5,
          }}>
            PREMIUM
          </span>
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(8,10,16,0.6)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 480,
              background: theme.bg,
              borderRadius: `${radius.xl}px ${radius.xl}px 0 0`,
              padding: `${space.xl}px ${space.lg}px`,
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.border, margin: '0 auto', marginBottom: space.lg }} />

            <div style={{
              fontFamily: fontFamily.display, fontSize: 22, fontWeight: 600,
              color: theme.text, letterSpacing: -0.4, textAlign: 'center', marginBottom: space.lg,
            }}>
              Pick a random flight
            </div>

            {/* Mode toggle */}
            <div style={{
              display: 'flex', background: theme.bgCardAlt,
              borderRadius: radius.md, padding: 4, marginBottom: space.lg,
              border: `0.5px solid ${theme.border}`,
            }}>
              <button onClick={() => setUseCustom(false)} style={{
                flex: 1, padding: '10px', borderRadius: radius.sm, border: 'none',
                background: !useCustom ? theme.bgCard : 'transparent',
                color: !useCustom ? theme.text : theme.textTertiary,
                fontSize: font.sm, fontWeight: !useCustom ? 600 : 400, cursor: 'pointer',
              }}>
                Anywhere, any length
              </button>
              <button onClick={() => setUseCustom(true)} style={{
                flex: 1, padding: '10px', borderRadius: radius.sm, border: 'none',
                background: useCustom ? theme.bgCard : 'transparent',
                color: useCustom ? theme.text : theme.textTertiary,
                fontSize: font.sm, fontWeight: useCustom ? 600 : 400, cursor: 'pointer',
              }}>
                Pick my study time
              </button>
            </div>

            {!useCustom ? (
              <div style={{ fontSize: font.xs, color: theme.textSecondary, textAlign: 'center', marginBottom: space.lg, lineHeight: 1.5 }}>
                You'll fly until this flight lands — could be 20 minutes, could be 6 hours.
              </div>
            ) : (
              <div style={{ marginBottom: space.lg }}>
                <div style={{ fontSize: font.xs, color: theme.textSecondary, textAlign: 'center', marginBottom: space.md }}>
                  How long do you want to study?
                </div>
                <div style={{ display: 'flex', gap: space.sm, justifyContent: 'center' }}>
                  {[15, 25, 45, 60, 90].map(m => (
                    <button
                      key={m}
                      onClick={() => setCustomMinutes(m)}
                      style={{
                        padding: '10px 14px', borderRadius: radius.md,
                        border: customMinutes === m ? `2px solid ${theme.bgPrimary}` : `0.5px solid ${theme.border}`,
                        background: customMinutes === m ? `${theme.bgPrimary}15` : theme.bgCard,
                        color: customMinutes === m ? theme.bgPrimary : theme.textSecondary,
                        fontSize: font.sm, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handlePick} style={{
              width: '100%', padding: 16, borderRadius: radius.lg, border: 'none',
              background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
              color: '#fff', fontSize: font.md, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 8px 20px -4px ${theme.gradientFrom}55`,
            }}>
              🎲 Assign my flight
            </button>
          </div>
        </div>
      )}
    </>
  )
}