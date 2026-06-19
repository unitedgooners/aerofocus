/**
 * server.js
 *
 * Combined FlightFocus backend:
 *   - OpenSky CORS proxy        → /api/*
 *   - Stripe checkout + webhook → /stripe/*
 *   - Background flight poller  → runs every 5 minutes internally
 *
 * NOTE: OpenSky retired basic-auth (username/password) on March 18, 2026.
 * Authentication is now OAuth2 client-credentials: we exchange
 * OPENSKY_CLIENT_ID / OPENSKY_CLIENT_SECRET for a bearer token, cache it,
 * and refresh automatically before its ~30 minute expiry.
 *
 * Local dev:   node server.js
 * Production:  deploy to Railway, set env vars
 */

const http   = require('http')
const https  = require('https')
const crypto = require('crypto')

// ── Config ────────────────────────────────────────────────────────────────────
const PORT                  = process.env.PORT || 3001
const OPENSKY_CLIENT_ID     = process.env.OPENSKY_CLIENT_ID || ''
const OPENSKY_CLIENT_SECRET = process.env.OPENSKY_CLIENT_SECRET || ''
const SUPABASE_URL          = process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY     = process.env.SUPABASE_ANON_KEY || ''
// Service role key — bypasses Row Level Security. Only ever used for the
// Stripe webhook's profile update, which is gated behind signature
// verification before this is ever touched. Never expose this key to the
// frontend (Vercel, browser bundles, etc.) — Railway env vars only.
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const STRIPE_SECRET_KEY     = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const STRIPE_PRICE_ID       = process.env.STRIPE_PRICE_ID || ''
const CLIENT_URL            = process.env.CLIENT_URL || 'http://localhost:3000'
const POLL_INTERVAL_MS      = 5 * 60 * 1000
const POOL_SIZE             = 30

const OPENSKY_TOKEN_URL = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token'

// ── OpenSky OAuth2 token manager ────────────────────────────────────────────────
// Tokens expire after ~30 min. We cache the token and its expiry, and only
// fetch a new one when the cached one is missing or about to expire.
let cachedToken     = null
let tokenExpiresAt  = 0
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000 // refresh 60s before actual expiry

function fetchOpenSkyToken() {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     OPENSKY_CLIENT_ID,
      client_secret: OPENSKY_CLIENT_SECRET,
    }).toString()

    const url = new URL(OPENSKY_TOKEN_URL)
    const options = {
      hostname: url.hostname,
      path:     url.pathname,
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }

    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (!json.access_token) {
            reject(new Error(`OpenSky token error: ${data}`))
            return
          }
          resolve(json)
        } catch (e) {
          reject(e)
        }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function getOpenSkyToken() {
  const now = Date.now()
  if (cachedToken && now < tokenExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken
  }

  if (!OPENSKY_CLIENT_ID || !OPENSKY_CLIENT_SECRET) {
    throw new Error('OpenSky client_id/client_secret not configured')
  }

  const json = await fetchOpenSkyToken()
  cachedToken    = json.access_token
  // expires_in is in seconds; OpenSky tokens are typically ~1800s (30 min)
  tokenExpiresAt = now + (json.expires_in ? json.expires_in * 1000 : 30 * 60 * 1000)
  console.log(`  OpenSky token refreshed, expires in ${Math.round((tokenExpiresAt - now) / 1000)}s`)
  return cachedToken
}

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
async function proxyOpenSky(req, res) {
  try {
    const token = await getOpenSkyToken()

    const options = {
      hostname: 'opensky-network.org',
      path:     req.url, // already starts with /api/...
      method:   req.method,
      headers:  { Authorization: `Bearer ${token}`, Accept: 'application/json' },
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
  } catch (err) {
    console.error('Proxy auth error:', err.message)
    res.writeHead(502)
    res.end('Proxy auth error')
  }
}

// ── Supabase helper ───────────────────────────────────────────────────────────
// useServiceRole: true bypasses RLS — only pass true for trusted, verified
// server-side writes (e.g. the Stripe webhook after signature verification).
// Everything else (poller upserts) uses the regular anon key by default.
function supabaseRequest(method, path, body, useServiceRole = false) {
  return new Promise((resolve, reject) => {
    if (!SUPABASE_URL) { resolve(null); return }
    const key    = useServiceRole && SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY
    const url    = new URL(SUPABASE_URL)
    const data   = body ? JSON.stringify(body) : null
    const options = {
      hostname: url.hostname,
      path:     `/rest/v1/${path}`,
      method,
      headers: {
        'apikey':        key,
        'Authorization': `Bearer ${key}`,
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
      'metadata[supabase_user_id]': userId,
    })

    if (!customerRes.data.id) {
      console.error('Stripe customer creation failed:', JSON.stringify(customerRes.data))
      jsonResponse(res, 500, { error: 'Failed to create customer', detail: customerRes.data })
      return
    }

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

    if (!sessionRes.data.url) {
      console.error('Stripe checkout session creation failed:', JSON.stringify(sessionRes.data))
      jsonResponse(res, 500, { error: 'Failed to create checkout session', detail: sessionRes.data })
      return
    }

    jsonResponse(res, 200, { url: sessionRes.data.url })
  } catch (err) {
    console.error('Checkout error:', err)
    jsonResponse(res, 500, { error: 'Failed to create checkout session', detail: err.message })
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
      const result = await supabaseRequest('PATCH', `profiles?id=eq.${userId}`, {
        tier:                   active ? 'premium' : 'free',
        stripe_customer_id:     sub.customer,
        stripe_subscription_id: sub.id,
      }, true)
      if (result && result.status >= 200 && result.status < 300) {
        console.log(`  User ${userId} → ${active ? 'premium' : 'free'}`)
      } else {
        console.error(`  Failed to update user ${userId}: status ${result?.status}, body: ${result?.body}`)
      }
    } else {
      console.error('  Webhook had no supabase_user_id in subscription metadata:', JSON.stringify(sub.metadata))
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub    = event.data.object
    const userId = sub.metadata?.supabase_user_id
    if (userId) {
      const result = await supabaseRequest('PATCH', `profiles?id=eq.${userId}`, { tier: 'free' }, true)
      if (result && result.status >= 200 && result.status < 300) {
        console.log(`  User ${userId} downgraded → free`)
      } else {
        console.error(`  Failed to downgrade user ${userId}: status ${result?.status}, body: ${result?.body}`)
      }
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
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getOpenSkyToken()
      https.get({
        hostname: 'opensky-network.org',
        path:     '/api/states/all?lamin=24&lamax=50&lomin=-125&lomax=-66',
        headers:  { Authorization: `Bearer ${token}` },
      }, res => {
        let data = ''
        res.on('data', c => data += c)
        res.on('end', () => { try { resolve(JSON.parse(data)) } catch(e) { reject(e) } })
      }).on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
}

async function poll() {
  if (!SUPABASE_URL || !OPENSKY_CLIENT_ID) return
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
    await proxyOpenSky(req, res)
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
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('  ⚠ SUPABASE_SERVICE_ROLE_KEY not set — Stripe webhook profile updates will silently fail under RLS')
  }
})

// Start poller
poll()
setInterval(poll, POLL_INTERVAL_MS)