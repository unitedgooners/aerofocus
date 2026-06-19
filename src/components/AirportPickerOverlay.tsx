import React, { useState } from 'react'
import { useFlightPool } from '../hooks/useFlightPool'
import { searchAirports, type Airport } from '../data/airports'
import { findFlightsNearAirport } from '../api/opensky'
import { space, radius, font, fontFamily } from '../styles/theme'
import type { Flight } from '../types'

interface Props {
  theme: any
  onClose: () => void
  onPicked: (flight: Flight) => void
  onUpgrade: () => void
}

// Self-contained full-screen overlay — same pattern as RandomFlightButton,
// just bigger since it needs search + results rather than a quick toggle.
// Rendered conditionally from inside HomeScreen, not a top-level App.tsx tab,
// since it needs to hand a picked Flight straight back into HomeScreen's
// existing selection state (mode/subject/etc. are already chosen by then).
export default function AirportPickerOverlay({ theme, onClose, onPicked, onUpgrade }: Props) {
  const { flights, isPremium } = useFlightPool()
  const [query, setQuery] = useState('')
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null)

  if (!isPremium) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: theme.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: space.xl, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: space.md }}>🛫</div>
        <div style={{
          fontFamily: fontFamily.display, fontSize: 22, fontWeight: 600,
          color: theme.text, marginBottom: space.sm,
        }}>
          Airport picker is Premium
        </div>
        <div style={{ fontSize: font.sm, color: theme.textSecondary, marginBottom: space.xl, maxWidth: 280 }}>
          Browse live flights near any airport on Earth with a Premium subscription.
        </div>
        <button onClick={onUpgrade} style={{
          padding: '14px 28px', borderRadius: radius.lg, border: 'none',
          background: `linear-gradient(135deg, ${theme.gradientFrom}, ${theme.gradientTo})`,
          color: '#fff', fontSize: font.md, fontWeight: 700, cursor: 'pointer',
          marginBottom: space.md,
        }}>
          Upgrade to Premium
        </button>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: theme.textTertiary,
          fontSize: font.sm, cursor: 'pointer',
        }}>
          ← Back
        </button>
      </div>
    )
  }

  const results = query.trim() ? searchAirports(query) : []
  const nearbyFlights = selectedAirport
    ? findFlightsNearAirport(flights, selectedAirport.lat, selectedAirport.lng)
    : []

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: theme.bg, overflowY: 'auto' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${space.xl}px ${space.lg}px 100px` }}>

        <button
          onClick={selectedAirport ? () => setSelectedAirport(null) : onClose}
          style={{
            background: 'none', border: 'none', color: theme.textTertiary,
            fontSize: font.sm, cursor: 'pointer', padding: 0, marginBottom: space.lg,
          }}
        >
          ← {selectedAirport ? 'Search again' : 'Close'}
        </button>

        <div style={{
          fontFamily: fontFamily.display, fontSize: 26, fontWeight: 600,
          color: theme.text, letterSpacing: -0.3, marginBottom: space.xs,
        }}>
          {selectedAirport ? selectedAirport.code : 'Pick an airport'}
        </div>

        <div style={{ fontSize: font.xs, color: theme.textSecondary, marginBottom: space.lg }}>
          {selectedAirport
            ? `${selectedAirport.name} · ${selectedAirport.city}, ${selectedAirport.country}`
            : 'Search by airport code or city'}
        </div>

        {!selectedAirport && (
          <div>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. JFK or Tokyo"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: radius.lg,
                border: `0.5px solid ${theme.borderMed}`, background: theme.bgInput,
                color: theme.text, fontSize: font.md, outline: 'none', marginBottom: space.lg,
              }}
            />

            {results.length === 0 && query.trim() !== '' && (
              <div style={{ textAlign: 'center', padding: space.xl, color: theme.textTertiary, fontSize: font.sm }}>
                No airports found for "{query}"
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
              {results.map(a => (
                <button
                  key={a.code}
                  onClick={() => setSelectedAirport(a)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    width: '100%', textAlign: 'left',
                    padding: `${space.md}px ${space.lg}px`, borderRadius: radius.lg,
                    border: `0.5px solid ${theme.border}`, background: theme.bgCard,
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontSize: font.sm, fontWeight: 700, color: theme.text }}>
                      {a.city}, {a.country}
                    </div>
                    <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>
                      {a.name}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: fontFamily.display, fontSize: 18, fontWeight: 600,
                    color: theme.textAccent, letterSpacing: -0.3,
                  }}>
                    {a.code}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedAirport && (
          <div>
            <div style={{ fontSize: font.xs, fontWeight: 600, color: theme.textTertiary, letterSpacing: 1, marginBottom: space.sm }}>
              LIVE FLIGHTS NEARBY
            </div>

            {nearbyFlights.length === 0 && (
              <div style={{ textAlign: 'center', padding: space.xl, color: theme.textTertiary, fontSize: font.sm }}>
                No live flights found near {selectedAirport.code} right now.
              </div>
            )}

            {nearbyFlights.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: space.sm }}>
                {nearbyFlights.map(f => (
                  <button
                    key={f.id}
                    onClick={() => onPicked(f)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      width: '100%', textAlign: 'left',
                      padding: `${space.md}px ${space.lg}px`, borderRadius: radius.lg,
                      border: `0.5px solid ${theme.border}`, background: theme.bgCard,
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: font.sm, fontWeight: 700, color: theme.text }}>
                        {f.id}
                      </div>
                      <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>
                        {f.airline}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: font.sm, fontWeight: 600, color: theme.textAccent }}>
                        {f.remainingMinutes}m left
                      </div>
                      <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>
                        {f.altitude.toLocaleString()} ft
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}