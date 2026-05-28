import { NextRequest } from 'next/server'

// In-memory fallback — reset on cold start, not reliable across Vercel instances.
// Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for distributed rate limiting.
const inMemoryMap = new Map<string, { count: number; resetAt: number }>()

type Config = {
  anonMax?: number  // max requests/window for anonymous (IP-based)
  authMax?: number  // max requests/window for authenticated (userId-based)
  windowMs?: number
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number }

export async function checkRateLimit(
  req: NextRequest,
  userId: string | null,
  config: Config = {}
): Promise<RateLimitResult> {
  const { anonMax = 10, authMax = 20, windowMs = 60 * 60 * 1000 } = config
  const max = userId ? authMax : anonMax
  const key = userId
    ? `user:${userId}`
    : `ip:${req.headers.get('x-forwarded-for') ?? 'unknown'}`

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (redisUrl && redisToken) {
    return checkUpstash(key, max, windowMs, redisUrl, redisToken)
  }

  return checkInMemory(key, max, windowMs)
}

async function checkUpstash(
  key: string,
  max: number,
  windowMs: number,
  url: string,
  token: string
): Promise<RateLimitResult> {
  try {
    const windowSec = Math.ceil(windowMs / 1000)
    const redisKey = `rl:${key}`
    const res = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['EXPIRE', redisKey, windowSec, 'NX'],
      ]),
    })
    if (!res.ok) throw new Error(`Upstash HTTP ${res.status}`)
    const data = await res.json()
    // Upstash pipeline returns [{result: N}, ...] — handle both formats
    const count: number = data[0]?.result ?? data[0]?.[1] ?? 0
    if (count > max) return { ok: false, retryAfterMs: windowMs }
    return { ok: true }
  } catch {
    return { ok: true } // fail open if Redis is unreachable
  }
}

function checkInMemory(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = inMemoryMap.get(key)
  if (entry && now < entry.resetAt) {
    if (entry.count >= max) return { ok: false, retryAfterMs: entry.resetAt - now }
    entry.count++
  } else {
    inMemoryMap.set(key, { count: 1, resetAt: now + windowMs })
  }
  return { ok: true }
}
