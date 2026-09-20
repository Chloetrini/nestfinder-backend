import { randomUUID } from 'crypto'
import type { NextFunction, Request, Response } from 'express'
import pinoHttpModule from 'pino-http'
import { env } from '../config/keys.js'
import logger from '../config/logger.js'
import { sendError } from '../utils/response-handler.js'
import { AppError } from '../utils/app-error.js'

const pinoHttp = ((pinoHttpModule as unknown as { default?: unknown }).default || pinoHttpModule) as unknown as typeof pinoHttpModule.pinoHttp
const isDev = env.NODE_ENV === 'development'

// Request logging (never logs the Authorization header)
export const createExpressLogger = () =>
  pinoHttp({
    logger,
    genReqId: () => randomUUID(),
    serializers: {
      req: (req: { method: string; url: string; headers: Record<string, string> }) => ({
        method: req.method,
        url: req.url,
        headers: { 'user-agent': req.headers['user-agent'], host: req.headers.host },
      }),
      res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
    },
    autoLogging: isDev ? true : { ignore: (req: { url?: string }) => req.url === '/api/health' },
  })

export const setupGlobalErrorHandlers = (): void => {
  process.on('uncaughtException', error => {
    logger.fatal({ err: error }, 'Uncaught Exception')
    setTimeout(() => process.exit(1), 1000)
  })
  process.on('unhandledRejection', reason => {
    logger.error({ reason }, 'Unhandled Rejection')
  })
}

// Translates thrown errors (AppError, Mongoose, JWT, upload) into JSON responses
export const appErrorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  let statusCode = 500
  let message = 'Server error'

  if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  } else if (err.name === 'CastError') {
    statusCode = 404
    message = 'Resource not found'
  } else if ((err as { code?: number }).code === 11000) {
    statusCode = 400
    message = 'Duplicate field value entered'
  } else if (err.name === 'ValidationError') {
    statusCode = 400
    message = Object.values((err as unknown as { errors: Record<string, { message: string }> }).errors)
      .map(e => e.message)
      .join(', ')
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Not authorized - invalid or expired token'
  } else if (isDev) {
    message = err.message
  }

  if (statusCode >= 500) logger.error({ err }, 'Unhandled error')
  sendError(res, statusCode, message)
}

export const notFoundRoutes = (req: Request, res: Response): void => {
  sendError(res, 404, `Cannot find route - ${req.originalUrl} on this server.`)
}
