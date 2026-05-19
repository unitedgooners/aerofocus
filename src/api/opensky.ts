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
 * Filter flights for free tier (under 2 hours remaining, max 30)
 */
export function filterFreeTierPool(flights: Flight[]): Flight[] {
  return flights
    .filter(f => f.remainingMinutes <= 120)
    .slice(0, 30)
}

/**
 * Pick a random flight from the pool
 */
export function pickRandomFlight(flights: Flight[]): Flight | null {
  if (flights.length === 0) return null
  return flights[Math.floor(Math.random() * flights.length)]
}