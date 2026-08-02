// Simple in-memory rate limiter (fixed window per key).
// Good enough for a single-instance deployment — resets on restart and
// doesn't share state across multiple server instances. If this app ever
// scales horizontally, swap this for a shared store (e.g. Redis).

const globalForRateLimit = globalThis
const buckets = globalForRateLimit.__rateLimitBuckets ?? new Map()
globalForRateLimit.__rateLimitBuckets = buckets

// Periodically sweep expired buckets so memory doesn't grow forever.
if (!globalForRateLimit.__rateLimitCleanupStarted) {
  globalForRateLimit.__rateLimitCleanupStarted = true
  setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart > bucket.windowMs) buckets.delete(key)
    }
  }, 10 * 60 * 1000).unref?.()
}

// Returns { allowed, remaining } for the given key. Call once per attempt.
export function rateLimit(key, { maxAttempts, windowMs }) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now - bucket.windowStart > windowMs) {
    buckets.set(key, { windowStart: now, windowMs, count: 1 })
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  if (bucket.count >= maxAttempts) {
    return { allowed: false, remaining: 0 }
  }

  bucket.count++
  return { allowed: true, remaining: maxAttempts - bucket.count }
}

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}
