/**
 * stripe-server.js
 *
 * Local Stripe backend. Run alongside proxy.js and npm start:
 *   node stripe-server.js
 *
 * Handles:
 *   POST /create-checkout-session  — creates a Stripe checkout session
 *   POST /webhook                  — handles Stripe events (subscription updates)
 *   GET  /subscription-status      — checks current subscription status
 *
 * In production: deploy this to Railway, Render, or similar.
 */

const http    = require('http')
const https   = require('https')
const crypto  = require('crypto')

// ── Config ────────────────────────────────────────────────────────────────────
// Add these to your .env and load them here, or paste directly for local dev
const STRIPE_SECRET_KEY      = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET  = process.env.STRIPE_WEBHOOK_SECRET || ''
const STRIPE_PRICE_ID        = process.env.STRIPE_PRICE_ID || ''
const SUPABASE_URL           = process.env.REACT_APP_SUPABASE_URL || ''
const SUPABASE_ANON_KEY      = process.env.REACT_APP_SUPABASE_ANON_KEY || ''
const PORT                   = 3002
const CLIENT_URL             = 'http://localhost:3000'

// ── Stripe API helper ─────────────────────────────────────────────────────────
function stripeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data    = body ? new URLSearchParams(body).toString() : null
    const options = {
      hostname: 'api.stripe.com',
      path:     `/v1/${path}`,
      method,
      headers: {
        'Authorization':  `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type':   'application/x-www-form-urlencoded',
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

// ── Supabase helper ───────────────────────────────────────────────────────────
function supabaseUpdate(table, match, update) {
  return new Promise((resolve, reject) => {
    if (!SUPABASE_URL) { resolve(null); return }
    const url    = new URL(SUPABASE_URL)
    const params = Object.entries(match).map(([k, v]) => `${k}=eq.${v}`).join('&')
    const data   = JSON.stringify(update)
    const options = {
      hostname: url.hostname,
      path:     `/rest/v1/${table}?${params}`,
      method:   'PATCH',
      headers: {
        'apikey':          SUPABASE_ANON_KEY,
        'Authorization':   `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':    'application/json',
        'Content-Length':  Buffer.byteLength(data),
      },
    }
    const req = https.request(options, res => {
      res.on('data', () => {})
      res.on('end', () => resolve(res.statusCode))
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

// ── Parse request body ────────────────────────────────────────────────────────
function parseBody(req) {
  return new Promise(resolve => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => resolve(body))
  })
}

// ── CORS headers ──────────────────────────────────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', CLIENT_URL)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, stripe-signature')
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORS(res)

  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return }

  const body = await parseBody(req)

  // ── POST /create-checkout-session ─────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/create-checkout-session') {
    try {
      const { userId, email } = JSON.parse(body)

      // Create or retrieve Stripe customer
      const customerRes = await stripeRequest('POST', 'customers', {
        email,
        metadata: { supabase_user_id: userId },
      })
      const customerId = customerRes.data.id

      // Create checkout session
      const sessionRes = await stripeRequest('POST', 'checkout/sessions', {
        'customer':                        customerId,
        'payment_method_types[]':          'card',
        'mode':                            'subscription',
        'line_items[0][price]':            STRIPE_PRICE_ID,
        'line_items[0][quantity]':         '1',
        'success_url':                     `${CLIENT_URL}?upgrade=success`,
        'cancel_url':                      `${CLIENT_URL}?upgrade=cancelled`,
        'metadata[supabase_user_id]':      userId,
        'subscription_data[metadata][supabase_user_id]': userId,
      })

      json(res, 200, { url: sessionRes.data.url })
    } catch (err) {
      console.error('Checkout error:', err)
      json(res, 500, { error: 'Failed to create checkout session' })
    }
    return
  }

  // ── POST /webhook ─────────────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/webhook') {
    const sig = req.headers['stripe-signature']

    // Verify webhook signature
    try {
      const elements  = sig.split(',').reduce((acc, el) => {
        const [k, v] = el.split('=')
        acc[k] = v
        return acc
      }, {})
      const timestamp = elements.t
      const payload   = `${timestamp}.${body}`
      const expected  = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET)
        .update(payload).digest('hex')
      if (expected !== elements.v1) throw new Error('Invalid signature')
    } catch (err) {
      json(res, 400, { error: 'Webhook signature verification failed' })
      return
    }

    const event = JSON.parse(body)
    console.log(`Webhook: ${event.type}`)

    // Handle subscription events
    if (event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated') {
      const sub    = event.data.object
      const userId = sub.metadata?.supabase_user_id
      const active = sub.status === 'active' || sub.status === 'trialing'
      if (userId) {
        await supabaseUpdate('profiles', { id: userId }, {
          tier:                active ? 'premium' : 'free',
          stripe_customer_id:  sub.customer,
          stripe_subscription_id: sub.id,
        })
        console.log(`  Updated user ${userId} → ${active ? 'premium' : 'free'}`)
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub    = event.data.object
      const userId = sub.metadata?.supabase_user_id
      if (userId) {
        await supabaseUpdate('profiles', { id: userId }, { tier: 'free' })
        console.log(`  Downgraded user ${userId} → free`)
      }
    }

    res.writeHead(200)
    res.end()
    return
  }

  // ── GET /subscription-status ──────────────────────────────────────────────
  if (req.method === 'GET' && req.url.startsWith('/subscription-status')) {
    const customerId = new URL(req.url, 'http://localhost').searchParams.get('customerId')
    if (!customerId) { json(res, 400, { error: 'Missing customerId' }); return }

    try {
      const result = await stripeRequest('GET', `subscriptions?customer=${customerId}&limit=1`, null)
      const sub    = result.data.data?.[0]
      json(res, 200, {
        active: sub?.status === 'active' || sub?.status === 'trialing',
        status: sub?.status ?? 'none',
      })
    } catch (err) {
      json(res, 500, { error: 'Failed to check subscription' })
    }
    return
  }

  res.writeHead(404)
  res.end()
})

server.listen(PORT, () => {
  console.log(`💳 Stripe server running on http://localhost:${PORT}`)
  console.log(`   Checkout  → POST /create-checkout-session`)
  console.log(`   Webhook   → POST /webhook`)
  console.log(`   Status    → GET  /subscription-status`)
})