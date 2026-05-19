import React, { useState, useEffect } from 'react'
import { useThemeStore } from '../store/themeStore'
import { useAuthStore } from '../store/authStore'
import { fetchSessionHistory } from '../api/sessionApi'
import { space, radius, font } from '../styles/theme'
import PassportMap, { CITY_COORDS } from '../components/PassportMap'

interface SessionRow {
  id: string
  flight_id: string
  mode: string
  subject?: string
  started_at: string
  focused_minutes: number
  distance_covered_km: number
  pomodoros_completed: number
  status: string
  pomo_cfg?: any
}

// Map flight destination city → country code
// Since OpenSky free tier doesn't give us destinations,
// we use the flight_id prefix to guess airline and use mock destinations for now
const AIRLINE_HUBS: Record<string, { city: string; country: string }> = {
  UAL: { city: 'Newark',      country: 'US' },
  DAL: { city: 'Atlanta',     country: 'US' },
  AAL: { city: 'Dallas',      country: 'US' },
  SWA: { city: 'Dallas',      country: 'US' },
  JBU: { city: 'New York',    country: 'US' },
  ASA: { city: 'Seattle',     country: 'US' },
  ACA: { city: 'Toronto',     country: 'CA' },
  WJA: { city: 'Toronto',     country: 'CA' },
  AMX: { city: 'Mexico City', country: 'MX' },
  VOI: { city: 'Mexico City', country: 'MX' },
}

function getDestination(flightId: string): { city: string; country: string } {
  const prefix = flightId.slice(0, 3).toUpperCase()
  return AIRLINE_HUBS[prefix] ?? { city: 'Unknown', country: 'US' }
}

export default function LogbookScreen() {
  const { theme }  = useThemeStore()
  const { user }   = useAuthStore()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    fetchSessionHistory(user.id, 50).then(data => {
      setSessions(data)
      setLoading(false)
    })
  }, [user])

  const fmtHrs = (m: number) => m >= 60 ? `${(m / 60).toFixed(1)}h` : `${m}m`

  // Derive visited countries and cities from session history
  const visitedCountries = [...new Set(
    sessions
      .filter(s => s.status === 'landed')
      .map(s => getDestination(s.flight_id).country)
  )]

  const visitedCities = sessions
    .filter(s => s.status === 'landed')
    .map(s => {
      const dest = getDestination(s.flight_id)
      return { name: dest.city, country: dest.country, lat: 0, lng: 0 }
    })
    .filter((c, i, arr) => arr.findIndex(x => x.name === c.name) === i)

  // Lifetime stats
  const totalMinutes  = sessions.reduce((a, s) => a + (s.focused_minutes ?? 0), 0)
  const totalFlights  = sessions.filter(s => s.status === 'landed').length
  const totalKm       = sessions.reduce((a, s) => a + (s.distance_covered_km ?? 0), 0)
  const totalPomos    = sessions.reduce((a, s) => a + (s.pomodoros_completed ?? 0), 0)

  const sectionLbl: React.CSSProperties = {
    fontSize: font.xs, fontWeight: 600, color: theme.textTertiary,
    letterSpacing: 1, marginBottom: space.sm, marginTop: space.lg, display: 'block',
  }

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, transition: 'background 0.6s ease' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: `${space.xl}px ${space.lg}px 100px` }}>

        {/* Header */}
        <div style={{ marginBottom: space.xl }}>
          <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.text, letterSpacing: -0.5 }}>Logbook</div>
          <div style={{ fontSize: font.sm, color: theme.textSecondary, marginTop: 2 }}>Your flight history</div>
        </div>

        {/* Lifetime stats */}
        <div style={{ background: theme.bgCard, borderRadius: radius.xl, border: `0.5px solid ${theme.border}`, padding: space.xl, marginBottom: space.lg }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.lg }}>
            {[
              { label: 'Total focus time', value: fmtHrs(totalMinutes), accent: true },
              { label: 'Flights completed', value: String(totalFlights) },
              { label: 'Distance flown',    value: `${Math.round(totalKm / 1000)}k km` },
              { label: 'Pomodoros',         value: String(totalPomos) },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: font.xs, color: theme.textTertiary, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: font.xl, fontWeight: 700, color: s.accent ? theme.textAccent : theme.text, letterSpacing: -0.5 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Passport map */}
        <div style={sectionLbl}>PASSPORT MAP</div>
        <div style={{ marginBottom: space.xs }}>
          <PassportMap
            visitedCountries={visitedCountries}
            visitedCities={visitedCities}
          />
        </div>
        <div style={{ fontSize: font.xs, color: theme.textTertiary, marginBottom: space.lg, textAlign: 'center' }}>
          {visitedCountries.length === 0
            ? 'Complete your first flight to start filling your passport'
            : `${visitedCountries.length} ${visitedCountries.length === 1 ? 'country' : 'countries'} · ${visitedCities.length} ${visitedCities.length === 1 ? 'city' : 'cities'} visited`
          }
        </div>

        {/* Session history */}
        <div style={sectionLbl}>FLIGHT HISTORY</div>

        {loading && (
          <div style={{ textAlign: 'center', padding: space.xl, color: theme.textTertiary, fontSize: font.sm }}>
            Loading your flights...
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.xl, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: space.sm }}>✈</div>
            <div style={{ fontSize: font.md, color: theme.textSecondary, marginBottom: space.xs }}>No flights yet</div>
            <div style={{ fontSize: font.xs, color: theme.textTertiary }}>Complete your first session to see it here</div>
          </div>
        )}

        {sessions.map(s => {
          const dest = getDestination(s.flight_id)
          return (
            <div key={s.id} style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.lg, marginBottom: space.sm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.sm }}>
                <div>
                  <div style={{ fontSize: font.md, fontWeight: 700, color: theme.text, letterSpacing: -0.5, marginBottom: 3 }}>
                    {s.flight_id}
                  </div>
                  <div style={{ fontSize: font.xs, color: theme.textTertiary }}>
                    {new Date(s.started_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div style={{
                  background: s.status === 'landed' ? theme.bgSuccess : theme.bgWarning,
                  color: s.status === 'landed' ? theme.textSuccess : theme.textWarning,
                  fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: radius.pill,
                }}>
                  {s.status}
                </div>
              </div>

              <div style={{ display: 'flex', gap: space.xl }}>
                {[
                  { val: fmtHrs(s.focused_minutes ?? 0),  lbl: 'focused' },
                  { val: `${s.distance_covered_km ?? 0} km`, lbl: 'covered' },
                  { val: s.mode,                           lbl: 'mode' },
                ].map(stat => (
                  <div key={stat.lbl}>
                    <div style={{ fontSize: font.sm, fontWeight: 600, color: theme.text }}>{stat.val}</div>
                    <div style={{ fontSize: 10, color: theme.textTertiary }}>{stat.lbl}</div>
                  </div>
                ))}
              </div>

              {s.subject && (
                <div style={{ marginTop: space.sm, background: theme.bgCardAlt, borderRadius: radius.sm, padding: '6px 10px', display: 'inline-block', fontSize: font.xs, color: theme.textSecondary }}>
                  📚 {s.subject}
                </div>
              )}
            </div>
          )
        })}

        {/* Streak */}
        <div style={sectionLbl}>CURRENT STREAK</div>
        <div style={{ background: theme.bgCard, borderRadius: radius.lg, border: `0.5px solid ${theme.border}`, padding: space.lg, display: 'flex', alignItems: 'center', gap: space.lg }}>
          <div style={{ fontSize: 36 }}>🔥</div>
          <div>
            <div style={{ fontSize: font.xl, fontWeight: 700, color: theme.textWarning, letterSpacing: -0.5 }}>
              {user?.streakDays ?? 0} days
            </div>
            <div style={{ fontSize: font.xs, color: theme.textTertiary, marginTop: 2 }}>
              {user?.streakDays === 0
                ? 'Complete a session today to start your streak'
                : 'Keep flying every day to maintain your streak'
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}