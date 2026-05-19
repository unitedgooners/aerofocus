/**
 * poller.js
 *
 * Keeps the active_flights table in Supabase fresh.
 * Run alongside proxy.js and npm start:
 *   node poller.js
 *
 * What it does:
 *   1. Every 5 minutes: fetches live flights from OpenSky via the proxy
 *   2. Upserts them into active_flights in Supabase
 *   3. Marks landed flights as 'landed' so they drop out of the free pool
 *   4. Maintains a rolling pool of ~30 short-to-medium haul flights
 */

const https = require('https')
const http  = require('http')

// ── Config ────────────────────────────────────────────────────────────────────
const OPENSKY_USERNAME  = 'goonersunited'
const OPENSKY_PASSWORD  = '37121499Sam'
const SUPABASE_URL      = process.env.REACT_APP_SUPABASE_URL      || ''
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || ''
const POLL_INTERVAL_MS  = 5 * 60 * 1000   // 5 minutes
const POOL_SIZE         = 30
const MAX_DURATION_MINS = 120              // free tier cap

// Airline lookup
const AIRLINE_PREFIXES = {
  UAL:'United Airlines', DAL:'Delta Air Lines', AAL:'American Airlines',
  SWA:'Southwest Airlines', JBU:'JetBlue Airways', ASA:'Alaska Airlines',
  FFT:'Frontier Airlines', SKW:'SkyWest Airlines', RPA:'Republic Airways',
  EDV:'Endeavor Air', ENY:'Envoy Air', GJS:'GoJet Airlines',
  QXE:'Horizon Air', JIA:'PSA Airlines', SCX:'Sun Country',
  PDT:'Piedmont Airlines', ACA:'Air Canada', WJA:'WestJet',
  JZA:'Jazz Aviation', AMX:'Aeromexico', VOI:'Volaris',
  LXJ:'Flexjet', EJA:'NetJets', UPS:'UPS Airlines', FDX:'FedEx',
  NKS:'Spirit Airlines', HAL:'Hawaiian Airlines',
}

const COMMERCIAL_PREFIXES = new Set(Object.keys(AIRLINE_PREFIXES))

function getAirline(callsign) {
  const prefix = (callsign || '').trim().slice(0, 3).toUpperCase()
  return AIRLINE_PREFIXES[prefix] || null
}

function isCommercial(callsign) {
  const prefix = (callsign || '').trim().slice(0, 3).toUpperCase()
  return COMMERCIAL_PREFIXES.has(prefix)
}

function estimateRemaining(altM, velocityMps) {
  if (!altM || !velocityMps) return 60
  const altFt = altM * 3.281
  if (altFt > 30000) return Math.floor(Math.random() * 90) + 60
  if (altFt > 15000) return Math.floor(Math.random() * 45) + 20
  if (altFt > 5000)  return Math.floor(Math.random() * 20) + 5
  return 5
}

// ── Fetch from OpenSky ────────────────────────────────────────────────────────
function fetchFlights() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`).toString('base64')
    const options = {
      hostname: 'opensky-network.org',
      path: '/api/states/all?lamin=24&lamax=50&lomin=-125&lomax=-66',
      headers: { Authorization: `Basic ${auth}` },
    }
    https.get(options, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    }).on('error', reject)
  })
}

// ── Supabase upsert ───────────────────────────────────────────────────────────
function supabaseRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    if (!SUPABASE_URL) { reject(new Error('No SUPABASE_URL')); return }

    const url  = new URL(SUPABASE_URL)
    const data = body ? JSON.stringify(body) : null

    const options = {
      hostname: url.hostname,
      path:     `/rest/v1/${path}`,
      method,
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        method === 'POST' ? 'resolution=merge-duplicates' : '',
      },
    }
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data)

    const req = https.request(options, res => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => resolve({ status: res.statusCode, body }))
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

// ── Main poll ─────────────────────────────────────────────────────────────────
async function poll() {
  console.log(`[${new Date().toLocaleTimeString()}] Polling OpenSky...`)

  try {
    const json   = await fetchFlights()
    const states = json.states || []

    // Filter to commercial, airborne, with position
    const flights = states
      .filter(s => !s[8] && s[5] && s[6] && s[1]?.trim() && isCommercial(s[1]))
      .map(s => {
        const [icao24, callsign, , , , lng, lat, altM, , velocityMps] = s
        const remaining = estimateRemaining(altM, velocityMps)
        const airline   = getAirline(callsign)
        return {
          id:                callsign.trim(),
          icao24,
          airline,
          origin:            null,
          origin_city:       null,
          destination:       null,
          destination_city:  null,
          remaining_minutes: remaining,
          lat,
          lng,
          altitude:          altM ? Math.round(altM * 3.281) : 0,
          status:            'airborne',
          last_updated:      new Date().toISOString(),
        }
      })
      .filter(f => f.remaining_minutes <= MAX_DURATION_MINS)
      .slice(0, POOL_SIZE)

    if (flights.length === 0) {
      console.log('  No qualifying flights found')
      return
    }

    // Upsert into Supabase
    const result = await supabaseRequest('POST', 'active_flights?on_conflict=icao24', flights)
    console.log(`  Upserted ${flights.length} flights → ${result.status}`)

    // Mark old flights as landed (not in current batch)
    const currentIds = flights.map(f => `"${f.id}"`).join(',')
    await supabaseRequest(
      'PATCH',
      `active_flights?status=eq.airborne&id=not.in.(${currentIds})`,
      { status: 'landed' }
    )
    console.log('  Cleaned up landed flights')

  } catch (err) {
    console.error('  Poll failed:', err.message)
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars')
  console.error('   Run with: REACT_APP_SUPABASE_URL=... REACT_APP_SUPABASE_ANON_KEY=... node poller.js')
  process.exit(1)
}

console.log('✈  FlightFocus background poller starting...')
console.log(`   Polling every ${POLL_INTERVAL_MS / 60000} minutes`)
console.log(`   Pool size: ${POOL_SIZE} flights, max ${MAX_DURATION_MINS} min duration`)

poll() // Run immediately on start
setInterval(poll, POLL_INTERVAL_MS)