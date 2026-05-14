// ─── Internal state ───────────────────────────────────────────────────────────

let _variant: 'control' | 'variant' = 'control'
let _sessionId = ''
let _experimentId = ''
let _apiKey = ''
let _baseUrl = ''
let _resolveReady!: () => void
let _ready: Promise<void> = new Promise(r => { _resolveReady = r })

export function _reset(): void {
  _variant = 'control'
  _sessionId = ''
  _experimentId = ''
  _apiKey = ''
  _baseUrl = ''
  _ready = new Promise(r => { _resolveReady = r })
}

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function setCookie(name: string, value: string, days: number): void {
  document.cookie = `${name}=${value}; max-age=${days * 86400}; SameSite=Lax; path=/`
}

function getCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${name}=`))
  return match ? match.slice(name.length + 1) : null
}

// ─── Thompson Sampling (inline, shape >= 1 only — Beta prior guarantees this) ─

function sampleStdNormal(): number {
  const u1 = Math.random() || Number.EPSILON
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * Math.random())
}

function sampleGamma(shape: number): number {
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  while (true) {
    let x: number, v: number
    do { x = sampleStdNormal(); v = 1 + c * x } while (v <= 0)
    v = v * v * v
    const u = Math.random()
    if (u < 1 - 0.0331 * x * x * x * x) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}

function sampleBeta(alpha: number, beta: number): number {
  const g1 = sampleGamma(alpha)
  const g2 = sampleGamma(beta)
  return g1 / (g1 + g2)
}

// ─── Config response shape ────────────────────────────────────────────────────

interface ArmParams { alpha: number; beta: number }
interface ConfigResponse {
  status: string
  control: ArmParams
  variant: ArmParams
}

// ─── Impression event (fire-and-forget) ───────────────────────────────────────

function fireImpression(): void {
  void fetch(`${_baseUrl}/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      experimentId: _experimentId,
      variant: _variant,
      event: 'impression',
      timestamp: Date.now(),
      sessionId: _sessionId,
    }),
  }).catch(() => undefined)
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function init(config: {
  apiKey: string
  experimentId: string
  baseUrl: string
  timeout?: number
}): Promise<void> {
  try {
    _apiKey = config.apiKey
    _experimentId = config.experimentId
    _baseUrl = config.baseUrl
    const timeout = config.timeout ?? 2000

    const variantCookie = getCookie(`__ab_${_experimentId}`)
    const sidCookie = getCookie(`__ab_${_experimentId}_sid`)

    if (variantCookie === 'control' || variantCookie === 'variant') {
      _variant = variantCookie
      _sessionId = sidCookie ?? ''
      _resolveReady()
      return
    }

    const res = await fetch(`${_baseUrl}/v1/experiments/${_experimentId}/config`, {
      headers: { Authorization: `Bearer ${_apiKey}` },
      signal: AbortSignal.timeout(timeout),
    })

    const data: ConfigResponse = await res.json() as ConfigResponse

    if (data.status !== 'live') {
      _resolveReady()
      return
    }

    const controlSample = sampleBeta(data.control.alpha, data.control.beta)
    const variantSample = sampleBeta(data.variant.alpha, data.variant.beta)
    _variant = variantSample > controlSample ? 'variant' : 'control'
    _sessionId = crypto.randomUUID()

    setCookie(`__ab_${_experimentId}`, _variant, 30)
    setCookie(`__ab_${_experimentId}_sid`, _sessionId, 30)

    fireImpression()
  } catch {
    // network error, timeout, parse failure — fall back to control
  }
  _resolveReady()
}

export function ready(): Promise<void> {
  return _ready
}

export function getVariant(): 'control' | 'variant' {
  return _variant
}

export function track(event: 'conversion'): void {
  if (!_sessionId) return
  void fetch(`${_baseUrl}/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      experimentId: _experimentId,
      variant: _variant,
      event,
      timestamp: Date.now(),
      sessionId: _sessionId,
    }),
  }).catch(() => undefined)
}
