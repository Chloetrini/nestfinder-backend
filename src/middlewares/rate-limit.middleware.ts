import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import type { Request } from 'express'

const FIFTEEN_MINUTES = 15 * 60 * 1000

const keyGenerator = (req: Request): string => `ip:${ipKeyGenerator(req.ip ?? 'unknown')}`

const base = (max: number, windowMs: number, message: string) => ({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: { success: false, message },
})

// Applied to every request
export const globalLimiter = rateLimit(base(300, FIFTEEN_MINUTES, 'Too many requests, please try again later.'))

// Login, register, forgot/reset password: slows down brute force
export const authLimiter = rateLimit(base(20, FIFTEEN_MINUTES, 'Too many attempts. Please try again later.'))

// Public enquiry form: stops spam to the admin inbox
export const enquiryLimiter = rateLimit(base(10, FIFTEEN_MINUTES, 'Too many enquiries. Please try again later.'))
