/**
 * Simple in-memory rate limiter for production use
 * For production, consider Redis-based rate limiting
 */

const RATE_LIMIT_WINDOW = 1000 // 1 second window
export const RATE_LIMIT_REQUESTS = 5 // max requests per second per site-key
const BURST_CAPACITY = 10 // allow burst of up to 10 requests

class RateLimiter {
  constructor() {
    this.requests = new Map() // siteKey -> array of timestamps
    this.burstCounter = new Map() // siteKey -> count
  }

  /**
   * Check if request should be allowed
   * @param siteKey - The site identifier
   * @returns Object with {allowed, reason} 
   */
  check(siteKey) {
    const now = Date.now()
    
    // Initialize tracking for this site if needed
    if (!this.requests.has(siteKey)) {
      this.requests.set(siteKey, [])
      this.burstCounter.set(siteKey, 0)
    }

    const timestamps = this.requests.get(siteKey)
    const burstCount = this.burstCounter.get(siteKey)

    // Clean old requests outside the window
    const cutoff = now - RATE_LIMIT_WINDOW
    const validTimestamps = timestamps.filter(ts => ts > cutoff)
    
    // Reset burst counter for new window
    if (validTimestamps.length === 0) {
      this.burstCounter.set(siteKey, 0)
    }

    // Check burst limit
    if (burstCount >= BURST_CAPACITY) {
      return {
        allowed: false,
        reason: 'RATE_LIMIT_BURST',
        resetAt: cutoff + RATE_LIMIT_WINDOW
      }
    }

    // Check rate limit
    const recentRequests = validTimestamps.length
    if (recentRequests >= RATE_LIMIT_REQUESTS) {
      return {
        allowed: false,
        reason: 'RATE_LIMIT_EXCEEDED',
        resetAt: cutoff + RATE_LIMIT_WINDOW
      }
    }

    // Allow request and record it
    timestamps.push(now)
    this.requests.set(siteKey, timestamps)
    this.burstCounter.set(siteKey, burstCount + 1)

    return {
      allowed: true,
      requestsRemaining: Math.max(0, RATE_LIMIT_REQUESTS - recentRequests - 1),
      resetAt: cutoff + RATE_LIMIT_WINDOW
    }
  }

  /**
   * Reset rate limit for a specific site (useful on disconnect)
   */
  reset(siteKey) {
    this.requests.delete(siteKey)
    this.burstCounter.delete(siteKey)
  }

  /**
   * Get current rate limit status for debugging
   */
  getStatus(siteKey) {
    const timestamps = this.requests.get(siteKey) || []
    return {
      requestCount: timestamps.length,
      burstCount: this.burstCounter.get(siteKey) || 0
    }
  }
}

export default new RateLimiter()
