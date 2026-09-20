import type { NextFunction, Request, Response } from 'express'
import { generateCacheKey, getCache, setCache } from '../services/cache.service.js'

/**
 * Caches successful GET responses for `durationSeconds` under `namespace`.
 * Adds an `x-cache: HIT | MISS` header and a short browser/CDN Cache-Control.
 *
 *   router.get('/', cacheMiddleware('properties', 60), getProperties)
 *
 * Only use it on responses that are identical for every visitor (never on
 * anything that depends on who is logged in). Pair writes with
 * `invalidateCache('properties')`.
 */
export const cacheMiddleware = (namespace: string, durationSeconds: number = 60) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method !== 'GET') {
      next()
      return
    }

    const key = await generateCacheKey(req, namespace)

    const cached = await getCache(key)
    if (cached !== null) {
      res.setHeader('x-cache', 'HIT')
      res.setHeader('Cache-Control', `public, max-age=${Math.min(durationSeconds, 30)}`)
      res.status(200).json(JSON.parse(cached))
      return
    }

    const originalJson = res.json.bind(res)
    res.json = function (body: unknown): Response {
      if (res.statusCode === 200) {
        void setCache(key, JSON.stringify(body), durationSeconds)
        res.setHeader('Cache-Control', `public, max-age=${Math.min(durationSeconds, 30)}`)
      }
      res.setHeader('x-cache', 'MISS')
      return originalJson(body)
    }

    next()
  }
}
