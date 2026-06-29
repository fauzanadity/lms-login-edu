import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// In-memory fallback rate limiter for when Upstash is not configured
class InMemoryRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>()

  async limit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ success: boolean; remaining: number }> {
    const now = Date.now()
    const record = this.store.get(key)

    if (!record || now > record.resetTime) {
      this.store.set(key, { count: 1, resetTime: now + windowMs })
      return { success: true, remaining: maxRequests - 1 }
    }

    if (record.count >= maxRequests) {
      return { success: false, remaining: 0 }
    }

    record.count++
    return { success: true, remaining: maxRequests - record.count }
  }
}

const fallback = new InMemoryRateLimiter()
let useUpstash = false
let redis: Redis | null = null

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv()
    useUpstash = true
  } else {
    console.warn(
      '[Rate Limit] Upstash Redis not configured. Using in-memory fallback.\n' +
      'WARNING: In-memory rate limiting is NOT reliable in serverless environments.\n' +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production.'
    )
  }
} catch {
  console.warn('[Rate Limit] Failed to initialize Upstash Redis, using fallback.')
}

function createUpstashLimiter(prefix: string, requests: number, window: string) {
  if (!redis) throw new Error('Redis not initialized')
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as `${number} ${'s' | 'm' | 'h' | 'd'}`),
    analytics: true,
    prefix: `ratelimit:${prefix}`,
  })
}

const upstashLimiters: Record<string, Ratelimit> = {}

function getUpstashLimiter(prefix: string, requests: number, window: string): Ratelimit {
  const key = `${prefix}:${requests}:${window}`
  if (!upstashLimiters[key]) {
    upstashLimiters[key] = createUpstashLimiter(prefix, requests, window)
  }
  return upstashLimiters[key]
}

export async function rateLimit(
  identifier: string,
  options: { prefix: string; maxRequests: number; window: string }
): Promise<{ success: boolean; remaining: number }> {
  const { prefix, maxRequests, window } = options

  if (useUpstash) {
    try {
      const limiter = getUpstashLimiter(prefix, maxRequests, window)
      const result = await limiter.limit(identifier)
      return { success: result.success, remaining: result.remaining }
    } catch (error) {
      console.error('[Rate Limit] Upstash error, falling back:', error)
    }
  }

  // Parse window string to ms (e.g. '60 s' -> 60000)
  const match = window.match(/(\d+)\s*(s|m|h)/)
  const windowMs = match
    ? parseInt(match[1]) * (match[2] === 'h' ? 3600000 : match[2] === 'm' ? 60000 : 1000)
    : 60000

  return fallback.limit(`${prefix}:${identifier}`, maxRequests, windowMs)
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  login: (ip: string) => rateLimit(ip, { prefix: 'login', maxRequests: 5, window: '60 s' }),
  register: (ip: string) => rateLimit(ip, { prefix: 'register', maxRequests: 3, window: '60 s' }),
  submit: (userId: string) => rateLimit(userId, { prefix: 'submit', maxRequests: 10, window: '60 s' }),
  autosave: (userId: string) => rateLimit(userId, { prefix: 'autosave', maxRequests: 20, window: '60 s' }),
  api: (ip: string) => rateLimit(ip, { prefix: 'api', maxRequests: 60, window: '60 s' }),
}
