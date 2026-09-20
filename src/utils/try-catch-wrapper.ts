import type { NextFunction, Request, RequestHandler, Response } from 'express'

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown

// Wraps an async controller so any thrown error reaches the global error handler
const tryCatchWrapper = (fn: AsyncHandler): RequestHandler => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}

export default tryCatchWrapper
