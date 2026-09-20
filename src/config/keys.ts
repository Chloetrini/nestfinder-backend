import { config } from 'dotenv'

// Load .env everywhere except production platforms that inject env vars themselves
if (process.env.NODE_ENV !== 'production') {
  config()
}

interface EnvSpec {
  key: string
  required?: boolean
}

const ENV_VARS: EnvSpec[] = [
  { key: 'MONGODB_URI', required: true },
  { key: 'JWT_SECRET', required: true },
  { key: 'CLIENT_URL', required: false },
  { key: 'JWT_EXPIRE', required: false },
  { key: 'EMAIL_VERIFY_TOKEN_EXPIRE', required: false },
  { key: 'RESET_TOKEN_EXPIRE', required: false },
  { key: 'BREVO_API_KEY', required: false },
  { key: 'EMAIL_FROM', required: false },
  { key: 'ADMIN_EMAIL', required: false },
  { key: 'ADMIN_PASSWORD', required: false },
  { key: 'CLOUDINARY_CLOUD_NAME', required: false },
  { key: 'CLOUDINARY_API_KEY', required: false },
  { key: 'CLOUDINARY_API_SECRET', required: false },
  { key: 'MEMCACHIER_SERVERS', required: false },
  { key: 'MEMCACHIER_USERNAME', required: false },
  { key: 'MEMCACHIER_PASSWORD', required: false },
  { key: 'CORS_ORIGINS', required: false },
  { key: 'LOG_LEVEL', required: false },
  { key: 'PORT', required: false },
  { key: 'NODE_ENV', required: false },
]

interface Env {
  readonly [key: string]: string
}

const env: Env = process.env as Env

// Fail fast at boot instead of crashing later on the first request
const missingKeys = ENV_VARS.filter(k => k.required && !env[k.key])
if (missingKeys.length > 0) {
  throw new Error(`Missing required env key: ${missingKeys.map(k => k.key).join(',')}`)
}

export { env }
