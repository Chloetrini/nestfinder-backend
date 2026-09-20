import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/keys.js'

// JWT used after login; the frontend keeps it in localStorage
export const generateJWT = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRE || '7d',
  } as jwt.SignOptions)
}

// Random token for email verification and password reset (raw goes in the email link)
export const generateRandomToken = (): string => crypto.randomBytes(32).toString('hex')

// Only the hash of the token is stored in the database
export const hashToken = (token: string): string => crypto.createHash('sha256').update(token).digest('hex')
