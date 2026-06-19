/**
 * src/api/opensky.ts
 *
 * Fetches real live flight data from OpenSky Network.
 * Credentials are embedded in the URL to work from the browser.
 *
 * OpenSky state vector indices:
 * 0:icao24, 1:callsign, 2:country, 3:time_position, 4:last_contact,
 * 5:longitude, 6:latitude, 7:baro_altitude(m), 8:on_ground,
 * 9:velocity(m/s), 10:heading, 11:vertical_rate, 12:sensors,
 * 13:geo_altitude(m), 14:squawk, 15:spi, 16:position_source
 */

import type { Flight } from '../types'

// ── Credentials ────────────────────────────────────────────────────────────────
const USERNAME = process.env.REACT_APP_OPENSKY_USERNAME ?? ''
const PASSWORD = process.env.REACT_APP_OPENSKY_PASSWORD ?? ''

import { SERVER_URL } from '../utils/config'

// Proxy runs on SERVER_URL (combined server)
const authBase = (): string => `${SERVER_URL}/api`

// ── Airline name lookup from callsign prefix ───────────────────────────────────
const AIRLINE_PREFIXES: Record<string, string> = {
  UAL: 'United Airlines',
  DAL: 'Delta Air Lines',
  AAL: 'American Airlines',
  SWA: 'Southwest Airlines',
  JBU: 'JetBlue Airways',
  ASA: 'Alaska Airlines',
  FFT: 'Frontier Airlines',
  SKW: 'SkyWest Airlines',
  RPA: 'Republic Airways',
  EDV: 'Endeavor Air',
  ENY: 'Envoy Air',
  GJS: 'GoJet Airlines',
  QXE: 'Horizon Air',
  JIA: 'PSA Airlines',
  SCX: 'Sun Country',
  PDT: 'Piedmont Airlines',
  ACA: 'Air Canada',
  WJA: 'WestJet',
  JZA: 'Jazz Aviation',
  AMX: 'Aeromexico',
  VOI: 'Volaris',
  LXJ: 'Flexjet',
  EJA: 'NetJets',
  ABX: 'ABX Air',
  UPS: 'UPS Airlines',
  FDX: 'FedEx',
  NKS: 'Spirit Airlines',
  HAL: 'Hawaiian Airlines',
  SXD: 'Sun Express',
}

function getAirline(callsign: string): string {
  const prefix = callsign.trim().slice(0, 3).toUpperCase()
  return AIRLINE_PREFIXES[prefix] ?? 'General Aviation'
}

// ── Estimate remaining minutes based on altitude ───────────────────────────────
function estimateRemainingMinutes(
  altitudeM: number | null,
  velocityMps: number | null
): number {
  if (!altitudeM || !velocityMps) return 60
  const altFt = altitudeM * 3.281
  if (altFt > 30000) return Math.floor(Math.random() * 150) + 60  // 60-210 min
  if (altFt > 15000) return Math.floor(Math.random() * 60) + 30   // 30-90 min
  if (altFt > 5000)  return Math.floor(Math.random() * 30) + 10   // 10-40 min
  return Math.floor(Math.random() * 15) + 5
}

// ── Normalise a raw OpenSky state vector into our Flight type ──────────────────
function normaliseState(state: any[]): Flight | null {
  const [
    icao24, callsign, , , ,
    lng, lat, altM, onGround, velocityMps,
  ] = state

  if (onGround) return null
  if (!lat || !lng) return null
  if (!callsign?.trim()) return null

  const altFt    = altM ? Math.round(altM * 3.281) : 0
  const remaining = estimateRemainingMinutes(altM, velocityMps)

  return {
    id:               callsign.trim(),
    icao24:           icao24,
    airline:          getAirline(callsign),
    origin:           '—',
    originCity:       'En route',
    destination:      '—',
    destinationCity:  'En route',
    departureTime:    new Date(Date.now() - remaining * 60000).toISOString(),
    estimatedArrival: new Date(Date.now() + remaining * 60000).toISOString(),
    remainingMinutes: remaining,
    lat,
    lng,
    altitude:         altFt,
    status:           'airborne',
    lastUpdated:      new Date().toISOString(),
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetch airborne flights over the continental US.
 * Bounding box: lat 24-50, lng -125 to -66
 */
export async function fetchUSFlights(): Promise<Flight[]> {
  try {
    const url = `${authBase()}/states/all?lamin=24&lamax=50&lomin=-125&lomax=-66`
    const res = await fetch(url)

    if (!res.ok) throw new Error(`OpenSky ${res.status}: ${res.statusText}`)

    const json = await res.json()
    const states: any[][] = json.states ?? []

    return states
      .map(normaliseState)
      .filter((f): f is Flight => f !== null)
      .filter(f => f.altitude > 5000)
  } catch (err) {
    console.error('OpenSky fetch failed:', err)
    return []
  }
}

/**
 * Fetch updated position for a single flight by ICAO24.
 * Used during active sessions to update the map.
 */
export async function fetchFlightPosition(icao24: string): Promise<Partial<Flight> | null> {
  try {
    const url = `${authBase()}/states/all?icao24=${icao24.toLowerCase()}`
    const res = await fetch(url)

    if (!res.ok) return null

    const json  = await res.json()
    const state = json.states?.[0]
    if (!state) return null

    const [, , , , , lng, lat, altM, onGround] = state

    return {
      lat:         lat ?? 0,
      lng:         lng ?? 0,
      altitude:    altM ? Math.round(altM * 3.281) : 0,
      status:      onGround ? 'landed' : 'airborne',
      lastUpdated: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

/**
 * Free-tier duration slots (in minutes). Rather than one big pool, free users
 * see exactly 7 flights — one per duration band, refreshed every 5 minutes
 * (driven by useFlightPool's REFRESH_INTERVAL_MS) — so there's always a
 * reasonable match no matter how long their planned study session is.
 */
export const FREE_TIER_DURATION_SLOTS = [15, 30, 45, 60, 75, 90, 120]

/**
 * Filter flights for free tier: exactly one flight per duration slot,
 * picking whichever live flight's remainingMinutes is closest to each
 * target. If a flight would be picked for more than one slot, the closer
 * slot keeps it and the next-closest distinct flight fills the other slot,
 * so free users always see up to 7 distinct options rather than duplicates.
 */
export function filterFreeTierPool(flights: Flight[]): Flight[] {
  if (flights.length === 0) return []

  const used = new Set<string>()
  const pool: Flight[] = []

  for (const target of FREE_TIER_DURATION_SLOTS) {
    const candidates = [...flights]
      .filter(f => !used.has(f.id))
      .sort((a, b) => Math.abs(a.remainingMinutes - target) - Math.abs(b.remainingMinutes - target))

    const best = candidates[0]
    if (best) {
      used.add(best.id)
      pool.push(best)
    }
  }

  return pool
}

/**
 * Find the best replacement flight for a free-tier connecting flight, given
 * the study time the user has left. Mirrors filterFreeTierPool's "closest
 * match" logic but for a single target rather than all 7 slots, and adds a
 * boarding/taxi buffer: if the user has 10 minutes or less of study time
 * left, no connection is offered at all — not worth boarding a new flight
 * for such a short remainder.
 */
export function findConnectingFlight(
  flights: Flight[],
  studyMinutesLeft: number,
  excludeFlightId?: string
): Flight | null {
  const BOARDING_BUFFER_MIN = 10

  if (studyMinutesLeft <= BOARDING_BUFFER_MIN) return null

  // Target a flight slightly longer than the remaining study time to account
  // for the taxi/boarding buffer, so the user doesn't land again right away.
  const target = studyMinutesLeft + BOARDING_BUFFER_MIN

  const candidates = flights.filter(f => f.id !== excludeFlightId)
  if (candidates.length === 0) return null

  return [...candidates].sort(
    (a, b) => Math.abs(a.remainingMinutes - target) - Math.abs(b.remainingMinutes - target)
  )[0]
}

/**
 * Find live flights near a given airport's coordinates. OpenSky has no
 * scheduled-departure data, so this is a proximity search over the existing
 * live pool rather than a true "departures board" — flights currently
 * airborne near the airport, sorted by distance. Premium-only feature, paired
 * with the airport picker UI.
 */
export function findFlightsNearAirport(flights: Flight[], lat: number, lng: number, maxResults = 15): Flight[] {
  function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  return [...flights]
    .map(f => ({ flight: f, distanceKm: haversineKm(lat, lng, f.lat, f.lng) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, maxResults)
    .map(r => r.flight)
}

/**
 * Pick a random flight from the pool
 */
export function pickRandomFlight(flights: Flight[]): Flight | null {
  if (flights.length === 0) return null
  return flights[Math.floor(Math.random() * flights.length)]
}

/**
 * Pick a random flight whose remaining time is reasonably close to a target
 * study duration — used by the "Random flight" button's fixed-duration mode
 * (premium). Unlike pickRandomFlight, this isn't uniformly random across the
 * whole pool; it first narrows to flights within a tolerance window around
 * the target, then picks randomly among those, so the result still feels
 * "random" while actually fitting the study session length the user asked for.
 */
export function pickRandomFlightForDuration(flights: Flight[], targetMinutes: number): Flight | null {
  if (flights.length === 0) return null

  const TOLERANCE_MIN = 15
  let candidates = flights.filter(f => Math.abs(f.remainingMinutes - targetMinutes) <= TOLERANCE_MIN)

  // Widen the tolerance once if nothing matched closely, rather than failing outright
  if (candidates.length === 0) {
    candidates = flights.filter(f => Math.abs(f.remainingMinutes - targetMinutes) <= TOLERANCE_MIN * 3)
  }

  // Still nothing close enough — fall back to closest single match rather than no result
  if (candidates.length === 0) {
    return findConnectingFlight(flights, targetMinutes)
  }

  return candidates[Math.floor(Math.random() * candidates.length)]
}