const http = require('http')
const https = require('https')

const TARGET = 'aibody.vercel.app'
const PORT = 9876
const MAX_RETRIES = 3

function proxyRequest(req, res, attempt = 0) {
  const options = {
    hostname: TARGET,
    port: 443,
    path: req.url,
    method: req.method,
    headers: { ...req.headers },
    timeout: 60000,
    rejectUnauthorized: false,
  }
  delete options.headers.host

  const proxy = https.request(options, (targetRes) => {
    res.writeHead(targetRes.statusCode, targetRes.headers)
    targetRes.pipe(res)
  })

  proxy.on('timeout', () => {
    proxy.destroy()
    if (attempt < MAX_RETRIES) {
      console.log(`[retry ${attempt + 1}] ${req.method} ${req.url}`)
      proxyRequest(req, res, attempt + 1)
    } else {
      res.writeHead(504)
      res.end('Gateway Timeout')
    }
  })

  proxy.on('error', (err) => {
    if (attempt < MAX_RETRIES) {
      console.log(`[retry ${attempt + 1}] ${req.method} ${req.url} (${err.message})`)
      setTimeout(() => proxyRequest(req, res, attempt + 1), 500)
    } else {
      res.writeHead(502)
      res.end('Bad Gateway')
    }
  })

  if (req.method === 'POST' || req.method === 'PUT') {
    req.pipe(proxy)
  } else {
    proxy.end()
  }
}

const server = http.createServer((req, res) => {
  console.log(`[proxy] ${req.method} ${req.url}`)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }
  proxyRequest(req, res)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy running at http://localhost:${PORT} -> https://${TARGET}`)
  console.log(`Also available at http://127.0.0.1:${PORT}`)
})
