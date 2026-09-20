import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/keys.js'
import { sendError } from '../utils/response-handler.js'

// Verifies the JWT ("Authorization: Bearer <token>") and attaches req.user
export const protect = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization
  const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : undefined

  if (!token) {
    sendError(res, 401, 'Not authorized - no token provided')
    return
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string }
    req.user = { id: decoded.id, role: decoded.role }
    next()
  } catch {
    sendError(res, 401, 'Not authorized - invalid or expired token')
  }
}

// Restricts a route to admins (use after `protect`)
export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || req.user.role !== 'admin') {
    sendError(res, 403, 'Access denied - admin only')
    return
  }
  next()
}
