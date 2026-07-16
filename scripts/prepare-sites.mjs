import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dist = join(root, 'dist')

mkdirSync(join(dist, 'server'), { recursive: true })
mkdirSync(join(dist, '.openai'), { recursive: true })
copyFileSync(join(root, '.openai', 'hosting.json'), join(dist, '.openai', 'hosting.json'))

writeFileSync(
  join(dist, 'server', 'index.js'),
  `const immutableAssetPattern = /\\/assets\\/[^/]+\\.[a-z0-9]+$/i

async function withHeaders(response, request) {
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('Referrer-Policy', 'no-referrer')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()',
  )
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  )
  if (immutableAssetPattern.test(new URL(response.url || 'https://local.invalid').pathname)) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  const isHtml = headers.get('Content-Type')?.includes('text/html')
  const body = isHtml
    ? (await response.text()).replaceAll(
        'content="/og.png"',
        \`content="\${new URL('/og.png', request.url).href}"\`,
      )
    : response.body
  return new Response(body, { status: response.status, statusText: response.statusText, headers })
}

async function serveAsset(request, env) {
  if (!env?.ASSETS?.fetch) {
    return new Response('Static asset binding is unavailable.', { status: 500 })
  }
  return env.ASSETS.fetch(request)
}

export default {
  async fetch(request, env) {
    const response = await serveAsset(request, env)
    if (response.status !== 404) return withHeaders(response, request)

    const fallbackUrl = new URL(request.url)
    fallbackUrl.pathname = '/index.html'
    fallbackUrl.search = ''
    const fallbackRequest = new Request(fallbackUrl, request)
    return withHeaders(await serveAsset(fallbackRequest, env), request)
  },
}
`,
)
