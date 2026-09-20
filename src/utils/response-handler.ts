import type { Response } from 'express'
import logger from '../config/logger.js'

// Every JSON response goes through here so the shape stays consistent:
// { success: true, message?, ...data } or { success: false, message, details? }

export const sendSuccess = (res: Response, status: number, data: Record<string, unknown> & { message?: string }): void => {
  res.status(status).json({ success: true, ...data })
}

export const sendError = <T>(res: Response, status: number, message: string, details?: T): void => {
  if (status >= 500) logger.error({ message }, 'Error response')
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) })
}
