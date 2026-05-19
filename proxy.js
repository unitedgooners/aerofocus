const http = require('http')
const https = require('https')

const USERNAME = process.env.OPENSKY_USERNAME || ''
const PASSWORD = process.env.OPENSKY_PASSWORD || ''

const server = http.createServer((req, res) => {
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    })
    res.end()
    return
  }

  const options = {
    hostname: 'opensky-network.org',
    path: req.url,
    method: req.method,
    headers: {
      Authorization: 'Basic ' + Buffer.from(USERNAME + ':' + PASSWORD).toString('base64'),
      Accept: 'application/json',
    },
  }

  const proxy = https.request(options, (proxyRes) => {
    // Strip OpenSky's CORS headers and replace with our permissive ones
    const headers = { ...proxyRes.headers }
    delete headers['access-control-allow-origin']
    delete headers['access-control-allow-headers']
    delete headers['access-control-allow-methods']
    headers['Access-Control-Allow-Origin'] = '*'

    res.writeHead(proxyRes.statusCode, headers)
    proxyRes.pipe(res)
  })

  proxy.on('error', (err) => {
    console.error('Proxy error:', err)
    res.writeHead(500, { 'Access-Control-Allow-Origin': '*' })
    res.end('Proxy error: ' + err.message)
  })

  req.pipe(proxy)
})

server.listen(3001, () => {
  console.log('✈ OpenSky proxy running on http://localhost:3001')
  console.log('  Forwarding to opensky-network.org with auth')
})