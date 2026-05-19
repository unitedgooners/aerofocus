/**
 * server.js
 *
 * Combined FlightFocus backend:
 *   - OpenSky CORS proxy        → /api/*
 *   - Stripe checkout + webhook → /stripe/*
 *   - Background flight poller  → runs every 5 minutes internally
 *
 * Local dev:   node server.js
 * Production:  deploy to Render, set env vars
 */

const http   = require('http')
const https  = require('https')
const crypto = require('crypto')

// ── Config ────────────────────────────────────────────────────────────────────
const PORT                  = process.env.PORT || 3001
const OPENSKY_USERNAME      = process.env.OPENSKY_USERNAME || ''
const OPENSKY_PASSWORD      = process.env.OPENSKY_PASSWORD || ''
const SUPABASE_URL          = process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY     = process.env.SUPABASE_ANON_KEY || ''
const STRIPE_SECRET_KEY     = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const STRIPE_PRICE_ID       = process.env.STRIPE_PRICE_ID || ''
const CLIENT_URL            = process.env.CLIENT_URL || 'http://localhost:3000'
const POLL_INTERVAL_MS      = 5 * 60 * 1000
const POOL_SIZE             = 30

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseBody(req) {
  return new Promise(resolve => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => resolve(body))
  })
}

function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature')
}

function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

// ── OpenSky proxy ─────────────────────────────────────────────────────────────
function proxyOpenSky(req, res) {
  const auth    = Buffer.from(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`).toString('base64')
  const options = {
    hostname: 'opensky-network.org',
    path:     req.url.replace('/api', '/api'),
    method:   req.method,
    headers:  { Authorization: `Basic ${auth}`, Accept: 'application/json' },
  }

  const proxy = https.request(options, proxyRes => {
    const headers = { ...proxyRes.headers }
    delete headers['access-control-allow-origin']
    headers['Access-Control-Allow-Origin'] = '*'
    res.writeHead(proxyRes.statusCode, headers)
    proxyRes.pipe(res)
  })

  proxy.on('error', err => {
    console.error('Proxy error:', err.message)
    res.writeHead(502)
    res.end('Proxy error')
  })

  req.pipe(proxy)
}

// ── Supabase helper ───────────────────────────────────────────────────────────
function supabaseRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    if (!SUPABASE_URL) { resolve(null); return }
    const url    = new URL(SUPABASE_URL)
    const data   = body ? JSON.stringify(body) : null
    const options = {
      hostname: url.hostname,
      path:     `/rest/v1/${path}`,
      method,
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        method === 'POST' ? 'resolution=merge-duplicates' : '',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }
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

// ── Stripe helper ─────────────────────────────────────────────────────────────
function stripeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data    = body ? new URLSearchParams(body).toString() : null
    const options = {
      hostname: 'api.stripe.com',
      path:     `/v1/${path}`,
      method,
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type':  'application/x-www-form-urlencoded',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }
    const req = https.request(options, res => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }) }
        catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

// ── Stripe handlers ───────────────────────────────────────────────────────────
async function handleCreateCheckout(req, res, body) {
  try {
    const { userId, email } = JSON.parse(body)
    const customerRes = await stripeRequest('POST', 'customers', {
      email,
      metadata: { supabase_user_id: userId },
    })
    const customerId  = customerRes.data.id
    const sessionRes  = await stripeRequest('POST', 'checkout/sessions', {
      'customer':                               customerId,
      'payment_method_types[]':                 'card',
      'mode':                                   'subscription',
      'line_items[0][price]':                   STRIPE_PRICE_ID,
      'line_items[0][quantity]':                '1',
      'success_url':                            `${CLIENT_URL}?upgrade=success`,
      'cancel_url':                             `${CLIENT_URL}?upgrade=cancelled`,
      'metadata[supabase_user_id]':             userId,
      'subscription_data[metadata][supabase_user_id]': userId,
    })
    jsonResponse(res, 200, { url: sessionRes.data.url })
  } catch (err) {
    console.error('Checkout error:', err)
    jsonResponse(res, 500, { error: 'Failed to create checkout session' })
  }
}

async function handleWebhook(req, res, body) {
  const sig = req.headers['stripe-signature']
  try {
    const parts     = sig.split(',').reduce((a, e) => { const [k,v] = e.split('='); a[k]=v; return a }, {})
    const payload   = `${parts.t}.${body}`
    const expected  = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(payload).digest('hex')
    if (expected !== parts.v1) throw new Error('Invalid signature')
  } catch {
    jsonResponse(res, 400, { error: 'Invalid webhook signature' })
    return
  }

  const event = JSON.parse(body)
  console.log(`Stripe webhook: ${event.type}`)

  if (['customer.subscription.created', 'customer.subscription.updated'].includes(event.type)) {
    const sub    = event.data.object
    const userId = sub.metadata?.supabase_user_id
    const active = ['active', 'trialing'].includes(sub.status)
    if (userId) {
      await supabaseRequest('PATCH', `profiles?id=eq.${userId}`, {
        tier:                   active ? 'premium' : 'free',
        stripe_customer_id:     sub.customer,
        stripe_subscription_id: sub.id,
      })
      console.log(`  User ${userId} → ${active ? 'premium' : 'free'}`)
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub    = event.data.object
    const userId = sub.metadata?.supabase_user_id
    if (userId) {
      await supabaseRequest('PATCH', `profiles?id=eq.${userId}`, { tier: 'free' })
      console.log(`  User ${userId} downgraded → free`)
    }
  }

  res.writeHead(200); res.end()
}

// ── Background poller ─────────────────────────────────────────────────────────
const AIRLINE_PREFIXES = {
  UAL:'United Airlines',DAL:'Delta Air Lines',AAL:'American Airlines',
  SWA:'Southwest Airlines',JBU:'JetBlue Airways',ASA:'Alaska Airlines',
  FFT:'Frontier Airlines',SKW:'SkyWest Airlines',RPA:'Republic Airways',
  EDV:'Endeavor Air',ENY:'Envoy Air',GJS:'GoJet Airlines',QXE:'Horizon Air',
  JIA:'PSA Airlines',SCX:'Sun Country',PDT:'Piedmont Airlines',
  ACA:'Air Canada',WJA:'WestJet',JZA:'Jazz Aviation',
  AMX:'Aeromexico',VOI:'Volaris',UPS:'UPS Airlines',FDX:'FedEx',
  NKS:'Spirit Airlines',HAL:'Hawaiian Airlines',
}
const COMMERCIAL = new Set(Object.keys(AIRLINE_PREFIXES))

function isCommercial(cs) {
  return COMMERCIAL.has((cs || '').trim().slice(0,3).toUpperCase())
}

function estimateRemaining(altM, vel) {
  if (!altM || !vel) return 60
  const ft = altM * 3.281
  if (ft > 30000) return Math.floor(Math.random() * 90) + 60
  if (ft > 15000) return Math.floor(Math.random() * 45) + 20
  if (ft > 5000)  return Math.floor(Math.random() * 20) + 5
  return 5
}

function fetchOpenSkyRaw() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${OPENSKY_USERNAME}:${OPENSKY_PASSWORD}`).toString('base64')
    https.get({
      hostname: 'opensky-network.org',
      path:     '/api/states/all?lamin=24&lamax=50&lomin=-125&lomax=-66',
      headers:  { Authorization: `Basic ${auth}` },
    }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch(e) { reject(e) } })
    }).on('error', reject)
  })
}

async function poll() {
  if (!SUPABASE_URL || !OPENSKY_USERNAME) return
  console.log(`[${new Date().toLocaleTimeString()}] Polling OpenSky...`)
  try {
    const json    = await fetchOpenSkyRaw()
    const states  = json.states || []
    const flights = states
      .filter(s => !s[8] && s[5] && s[6] && s[1]?.trim() && isCommercial(s[1]))
      .map(s => {
        const [icao24, cs,,,, lng, lat, altM,, vel] = s
        return {
          id:                cs.trim(),
          icao24,
          airline:           AIRLINE_PREFIXES[cs.trim().slice(0,3).toUpperCase()] || null,
          remaining_minutes: estimateRemaining(altM, vel),
          lat, lng,
          altitude:          altM ? Math.round(altM * 3.281) : 0,
          status:            'airborne',
          last_updated:      new Date().toISOString(),
        }
      })
      .filter(f => f.remaining_minutes <= 120)
      .slice(0, POOL_SIZE)

    if (flights.length === 0) { console.log('  No flights found'); return }

    await supabaseRequest('POST', 'active_flights?on_conflict=icao24', flights)
    console.log(`  Upserted ${flights.length} flights`)

    const ids = flights.map(f => `"${f.id}"`).join(',')
    await supabaseRequest('PATCH', `active_flights?status=eq.airborne&id=not.in.(${ids})`, { status: 'landed' })
  } catch (err) {
    console.error('  Poll failed:', err.message)
  }
}

// ── HTTP server ───────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORS(res)

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

  const body = await parseBody(req)

  // OpenSky proxy
  if (req.url.startsWith('/api/')) {
    proxyOpenSky(req, res)
    return
  }

  // Stripe checkout
  if (req.method === 'POST' && req.url === '/stripe/checkout') {
    await handleCreateCheckout(req, res, body)
    return
  }

  // Stripe webhook
  if (req.method === 'POST' && req.url === '/stripe/webhook') {
    await handleWebhook(req, res, body)
    return
  }

  // Health check
  if (req.url === '/health') {
    jsonResponse(res, 200, { status: 'ok', time: new Date().toISOString() })
    return
  }

  res.writeHead(404); res.end()
})

server.listen(PORT, () => {
  console.log(`✈  FlightFocus server running on port ${PORT}`)
  console.log(`   Proxy    → /api/*`)
  console.log(`   Stripe   → /stripe/checkout, /stripe/webhook`)
  console.log(`   Health   → /health`)
  console.log(`   Polling every ${POLL_INTERVAL_MS / 60000} minutes`)
})

// Start poller
poll()
setInterval(poll, POLL_INTERVAL_MS)