import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { sendError } from '../utils/response-handler.js'

/**
 * Validates req.body against a Zod schema. On success req.body is replaced by
 * the parsed value; on failure responds 400 with the first problem as `message`
 * (so the frontend can show it directly) plus the full list as `details`.
 */
export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const details = result.error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
      sendError(res, 400, details[0]?.message ?? 'Validation failed', details)
      return
    }

    req.body = result.data
    next()
  }
}
