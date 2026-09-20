import type { Request } from 'express'
import { Client as Memcached } from 'memjs'
import { env } from '../config/keys.js'
import logger from '../config/logger.js'

/**
 * Cache service.
 *
 * Uses Memcachier (memjs) when MEMCACHIER_SERVERS is set, otherwise a small
 * in-memory store with TTL. Both share the same API and neither ever throws:
 * a cache failure just means the request is served from the database.
 *
 * Invalidation is done with namespace versions. Every key contains the current
 * version of its namespace ("properties", ...), so bumping the version after a
 * write instantly orphans every cached entry of that namespace. Works the same
 * for memcached (which can't delete by pattern) and the in-memory store.
 */

const CACHE_PREFIX = 'nf:v1'
const DEFAULT_TTL = 60
const MAX_MEMORY_ENTRIES = 500

// ---------- backends ----------

interface CacheBackend {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttl: number): Promise<void>
  delete(key: string): Promise<void>
  flush(): Promise<void>
}

const memoryBackend = (): CacheBackend => {
  const store = new Map<string, { value: string; expiresAt: number }>()
  return {
    async get(key) {
      const hit = store.get(key)
      if (!hit) return null
      if (hit.expiresAt < Date.now()) {
        store.delete(key)
        return null
      }
      return hit.value
    },
    async set(key, value, ttl) {
      if (store.size >= MAX_MEMORY_ENTRIES) {
        // Drop the oldest entry (Map keeps insertion order)
        const oldest = store.keys().next().value
        if (oldest !== undefined) store.delete(oldest)
      }
      store.set(key, { value, expiresAt: Date.now() + ttl * 1000 })
    },
    async delete(key) {
      store.delete(key)
    },
    async flush() {
      store.clear()
    },
  }
}

const memcachedBackend = (): CacheBackend => {
  const options: Record<string, unknown> = { timeout: 1, retries: 1, failover: false }
  if (env.MEMCACHIER_USERNAME && env.MEMCACHIER_PASSWORD) {
    options.username = env.MEMCACHIER_USERNAME
    options.password = env.MEMCACHIER_PASSWORD
  }
  const client = Memcached.create(env.MEMCACHIER_SERVERS, options)
  return {
    async get(key) {
      const result = await client.get(key)
      return result.value ? result.value.toString() : null
    },
    async set(key, value, ttl) {
      await client.set(key, value, { expires: ttl })
    },
    async delete(key) {
      await client.delete(key)
    },
    async flush() {
      await client.flush()
    },
  }
}

let backend: CacheBackend | null = null

const getBackend = (): CacheBackend => {
  if (!backend) {
    if (env.MEMCACHIER_SERVERS) {
      backend = memcachedBackend()
      logger.info('Cache: using Memcachier')
    } else {
      backend = memoryBackend()
      logger.info('Cache: using in-memory store (set MEMCACHIER_SERVERS to use Memcachier)')
    }
  }
  return backend
}

// ---------- namespace versions ----------

const versionKey = (namespace: string) => `${CACHE_PREFIX}:ver:${namespace}`

const getVersion = async (namespace: string): Promise<string> => {
  try {
    return (await getBackend().get(versionKey(namespace))) ?? '0'
  } catch {
    return '0'
  }
}

/** Invalidate everything cached under a namespace (call after create/update/delete). */
export const invalidateCache = async (...namespaces: string[]): Promise<void> => {
  await Promise.all(
    namespaces.map(async namespace => {
      try {
        await getBackend().set(versionKey(namespace), String(Date.now()), 60 * 60 * 24 * 30)
        logger.debug({ namespace }, 'Cache namespace invalidated')
      } catch (error) {
        logger.warn({ err: error, namespace }, 'Cache invalidate error')
      }
    })
  )
}

// ---------- keys and basic operations ----------

/** Consistent key for a request: namespace + version + path + sorted query string. */
export const generateCacheKey = async (req: Request, namespace: string): Promise<string> => {
  const version = await getVersion(namespace)
  const base = `${CACHE_PREFIX}:${namespace}:${version}:${req.path}`
  const entries = Object.entries(req.query)
  if (entries.length === 0) return base
  const sorted = new URLSearchParams(
    entries.sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, String(v)])
  ).toString()
  return `${base}?${sorted}`
}

/** Returns null on miss or error (never throws). */
export const getCache = async (key: string): Promise<string | null> => {
  try {
    const value = await getBackend().get(key)
    logger.debug({ cacheKey: key }, value ? 'Cache HIT' : 'Cache MISS')
    return value
  } catch (error) {
    logger.warn({ err: error, cacheKey: key }, 'Cache GET error, continuing without cache')
    return null
  }
}

export const setCache = async (key: string, value: string, ttl: number = DEFAULT_TTL): Promise<boolean> => {
  try {
    await getBackend().set(key, value, ttl)
    return true
  } catch (error) {
    logger.warn({ err: error, cacheKey: key }, 'Cache SET error')
    return false
  }
}

export const deleteCache = async (key: string): Promise<boolean> => {
  try {
    await getBackend().delete(key)
    return true
  } catch (error) {
    logger.warn({ err: error, cacheKey: key }, 'Cache DELETE error')
    return false
  }
}

export const flushCache = async (): Promise<boolean> => {
  try {
    await getBackend().flush()
    logger.info('Cache flushed')
    return true
  } catch (error) {
    logger.warn({ err: error }, 'Cache FLUSH error')
    return false
  }
}
