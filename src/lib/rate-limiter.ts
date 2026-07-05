import { RateLimiterMemory } from 'rate-limiter-flexible'

// Global in-memory limiters
export const loginLimiter = new RateLimiterMemory({
  points: 5, // 5 attempts
  duration: 15 * 60, // per 15 minutes
})

export const uploadLimiter = new RateLimiterMemory({
  points: 10, // 10 uploads
  duration: 60 * 60, // per hour
})

export const chatLimiter = new RateLimiterMemory({
  points: 20, // 20 messages
  duration: 60, // per minute
})
